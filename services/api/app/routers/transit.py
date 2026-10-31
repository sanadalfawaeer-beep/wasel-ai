import asyncio
import logging

from fastapi import APIRouter, HTTPException

from ..config import get_settings
from ..maps import MapsError
from ..models import TransitPlanResponse, TransitRequest
from ..transit import plan_transit

logger = logging.getLogger(__name__)
router = APIRouter(tags=["transit"])


@router.post("/transit/plan", response_model=TransitPlanResponse)
async def plan(request: TransitRequest) -> TransitPlanResponse:
    settings = get_settings()
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(plan_transit, request),
            timeout=settings.request_timeout_s + 4,
        )
    except TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail="The bus planner is taking too long. Try again.",
        ) from exc
    except MapsError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unhandled transit planning error")
        raise HTTPException(
            status_code=500,
            detail="The bus planner hit an unexpected problem.",
        ) from exc
