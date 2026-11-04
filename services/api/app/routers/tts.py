import asyncio
import logging
from collections.abc import AsyncIterator
from xml.sax.saxutils import escape

import edge_tts
import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, StreamingResponse

from ..config import get_settings

logger = logging.getLogger(__name__)

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
_AZURE_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3"


def _rate_value(rate: float) -> str:
    percent = int(round((rate - 1) * 100))
    return "0%" if percent == 0 else f"{percent:+d}%"


def _voice_language(voice: str) -> str:
    parts = voice.split("-")
    return "-".join(parts[:2]) if len(parts) >= 2 else "en-US"


def _build_ssml(text: str, voice: str, rate_value: str) -> str:
    language = _voice_language(voice)
    return (
        f"<speak version='1.0' xml:lang='{language}'>"
        f"<voice xml:lang='{language}' name='{voice}'>"
        f"<prosody rate='{rate_value}'>{escape(text)}</prosody>"
        "</voice></speak>"
    )


def _cache_key(provider: str, voice: str, rate_value: str, text: str) -> str:
    return f"{provider}|{voice}|{rate_value}|{text}"


def _cache_audio(key: str, audio: bytes) -> None:
    if len(_CACHE) >= _CACHE_LIMIT:
        _CACHE.pop(next(iter(_CACHE)))
    _CACHE[key] = audio


def _cached_response(audio: bytes) -> Response:
    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Cache-Control": "private, max-age=3600"},
    )


async def _azure_speech(text: str, voice: str, rate_value: str) -> bytes:
    settings = get_settings()
    if not settings.azure_speech_key or not settings.azure_speech_region:
        raise RuntimeError("Azure Speech is not configured.")

    url = (
        f"https://{settings.azure_speech_region}.tts.speech.microsoft.com"
        "/cognitiveservices/v1"
    )
    headers = {
        "Ocp-Apim-Subscription-Key": settings.azure_speech_key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": _AZURE_OUTPUT_FORMAT,
        "User-Agent": "WaselAI/0.1",
    }
    payload = _build_ssml(text, voice, rate_value).encode("utf-8")
    last_error: Exception | None = None

    for attempt in range(2):
        try:
            async with httpx.AsyncClient(
                timeout=max(10.0, settings.request_timeout_s)
            ) as client:
                response = await client.post(
                    url,
                    headers=headers,
                    content=payload,
                )
            if response.status_code == 200 and response.content:
                return response.content
            last_error = RuntimeError(
                f"Azure Speech returned HTTP {response.status_code}."
            )
        except httpx.HTTPError as exc:
            last_error = exc

        if attempt == 0:
            await asyncio.sleep(0.2)

    raise RuntimeError("Azure Speech is unavailable.") from last_error


def _edge_generator(
    text: str,
    voice: str,
    rate_value: str,
    cache_key: str,
) -> AsyncIterator[bytes]:
    audio = bytearray()

    async def generate() -> AsyncIterator[bytes]:
        communicate = edge_tts.Communicate(text, voice, rate=rate_value)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                data = chunk["data"]
                audio.extend(data)
                yield data

        if audio:
            _cache_audio(cache_key, bytes(audio))

    return generate()


async def _stream_edge(
    text: str,
    voice: str,
    rate_value: str,
    cache_key: str,
) -> StreamingResponse:
    generator = None
    first = b""
    last_error: Exception | None = None

    for attempt in range(2):
        generator = _edge_generator(text, voice, rate_value, cache_key)
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

    async def stream_body() -> AsyncIterator[bytes]:
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


@router.get("/tts")
async def synthesize(
    text: str = Query(..., min_length=1, max_length=600),
    voice: str = Query("ar-JO-SanaNeural"),
    rate: float = Query(1.0, ge=0.5, le=1.5),
) -> Response:
    if voice not in VOICES:
        raise HTTPException(status_code=400, detail="Unsupported voice.")

    settings = get_settings()
    provider = settings.resolved_tts_provider
    rate_value = _rate_value(rate)
    cache_key = _cache_key(provider, voice, rate_value, text)

    cached = _CACHE.get(cache_key)
    if cached is not None:
        return _cached_response(cached)

    if provider == "azure":
        try:
            audio = await _azure_speech(text, voice, rate_value)
        except Exception:
            if settings.tts_provider == "azure":
                logger.exception("Azure Speech failed")
                raise HTTPException(
                    status_code=502,
                    detail="Speech synthesis is unavailable.",
                ) from None
            logger.warning(
                "Azure Speech failed; falling back to Edge TTS.",
                exc_info=True,
            )
            provider = "edge"
            cache_key = _cache_key(provider, voice, rate_value, text)
        else:
            _cache_audio(cache_key, audio)
            return _cached_response(audio)

    return await _stream_edge(text, voice, rate_value, cache_key)
