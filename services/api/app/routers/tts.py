import asyncio

import edge_tts
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, StreamingResponse

router = APIRouter(tags=["tts"])

VOICES = {
    "ar-JO-SanaNeural",
    "ar-JO-TaimNeural",
    "ar-EG-SalmaNeural",
    "ar-SA-HamedNeural",
}

_CACHE: dict[str, bytes] = {}
_CACHE_LIMIT = 80


@router.get("/tts")
async def synthesize(
    text: str = Query(..., min_length=1, max_length=600),
    voice: str = Query("ar-JO-SanaNeural"),
    rate: float = Query(1.0, ge=0.5, le=1.5),
) -> Response:
    if voice not in VOICES:
        raise HTTPException(status_code=400, detail="Unsupported voice.")

    rate_percent = int(round((rate - 1) * 100))
    rate_value = f"{rate_percent:+d}%"
    cache_key = f"{voice}|{rate_value}|{text}"

    cached = _CACHE.get(cache_key)
    if cached is not None:
        return Response(
            content=cached,
            media_type="audio/mpeg",
            headers={"Cache-Control": "private, max-age=3600"},
        )

    audio = bytearray()

    async def generate():
        communicate = edge_tts.Communicate(text, voice, rate=rate_value)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                data = chunk["data"]
                audio.extend(data)
                yield data

        if audio:
            if len(_CACHE) >= _CACHE_LIMIT:
                _CACHE.pop(next(iter(_CACHE)))
            _CACHE[cache_key] = bytes(audio)

    generator = generate()

    try:
        first = await asyncio.wait_for(anext(generator), timeout=20)
    except TimeoutError as exc:
        await generator.aclose()
        raise HTTPException(status_code=504, detail="Speech synthesis timed out.") from exc
    except StopAsyncIteration as exc:
        raise HTTPException(status_code=502, detail="Speech synthesis returned no audio.") from exc
    except Exception as exc:
        await generator.aclose()
        raise HTTPException(
            status_code=502,
            detail="Speech synthesis is unavailable.",
        ) from exc

    async def stream_body():
        try:
            yield first
            async for chunk in generator:
                yield chunk
        finally:
            await generator.aclose()

    return StreamingResponse(
        stream_body(),
        media_type="audio/mpeg",
        headers={"Cache-Control": "private, max-age=3600"},
    )
