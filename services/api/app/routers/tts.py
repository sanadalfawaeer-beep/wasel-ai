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
    "en-US-AvaNeural",
    "en-US-AndrewNeural",
    "en-US-EmmaNeural",
    "en-US-BrianNeural",
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

    def make_generator():
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

        return generate()

    generator = None
    first = b""
    last_error: Exception | None = None

    for attempt in range(2):
        generator = make_generator()
        try:
            first = await asyncio.wait_for(anext(generator), timeout=20)
            break
        except TimeoutError as exc:
            last_error = exc
            await generator.aclose()
        except StopAsyncIteration as exc:
            last_error = exc
            await generator.aclose()
        except Exception as exc:
            last_error = exc
            await generator.aclose()

        if attempt == 0:
            await asyncio.sleep(0.2)

    if not generator or not first:
        if isinstance(last_error, TimeoutError):
            raise HTTPException(
                status_code=504,
                detail="Speech synthesis timed out.",
            ) from last_error
        raise HTTPException(
            status_code=502,
            detail="Speech synthesis is unavailable.",
        ) from last_error

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
