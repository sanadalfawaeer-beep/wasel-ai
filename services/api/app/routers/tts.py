import asyncio

import edge_tts
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

router = APIRouter(tags=["tts"])

VOICES = {
    "ar-JO-SanaNeural",
    "ar-JO-TaimNeural",
    "ar-EG-SalmaNeural",
    "ar-SA-HamedNeural",
}


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

    async def render() -> bytes:
        communicate = edge_tts.Communicate(text, voice, rate=rate_value)
        audio = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.extend(chunk["data"])
        return bytes(audio)

    try:
        audio = await asyncio.wait_for(render(), timeout=20)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Speech synthesis timed out.") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Speech synthesis is unavailable.") from exc

    if not audio:
        raise HTTPException(status_code=502, detail="Speech synthesis returned no audio.")
    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )
