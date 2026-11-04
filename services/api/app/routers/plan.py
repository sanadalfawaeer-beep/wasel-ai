import asyncio
import logging

from fastapi import APIRouter, HTTPException, Query

from ..config import get_settings
from ..maps import MapsError
from ..models import Lang, PlanRequest, PlanResponse
from ..planner import demo_response, plan_request

logger = logging.getLogger(__name__)
router = APIRouter(tags=["guide"])


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "mode": settings.resolved_mode,
        "model": settings.deepseek_model if settings.llm_enabled else None,
        "llm": settings.llm_enabled,
        "google_key": bool(settings.google_maps_api_key),
        "transit": settings.resolved_transit_provider,
        "tts": settings.resolved_tts_provider,
        "azure_tts": bool(
            settings.azure_speech_key and settings.azure_speech_region
        ),
    }


@router.post("/plan", response_model=PlanResponse)
async def plan(request: PlanRequest) -> PlanResponse:
    settings = get_settings()
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(plan_request, request),
            timeout=settings.request_timeout_s + 4,
        )
    except TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail="The guide is taking too long. Try again, or type a simpler destination.",
        ) from exc
    except MapsError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unhandled planning error")
        raise HTTPException(
            status_code=500,
            detail="The guide hit an unexpected problem. Try the demo route or try again.",
        ) from exc


@router.get("/demo", response_model=PlanResponse)
async def demo(lang: Lang = Query(default="en")) -> PlanResponse:
    return demo_response(lang)
