import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers.plan import router as plan_router
from .routers.transit import router as transit_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

settings = get_settings()

app = FastAPI(
    title="Wasel AI",
    version="0.1.0",
    description=(
        "Accessible wayfinding planner. The agent plans once; the phone fires "
        "deterministic cues locally."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plan_router, prefix="/api")
app.include_router(transit_router, prefix="/api")


@app.get("/")
async def root() -> dict:
    return {
        "name": "Wasel AI",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/health",
        "plan": "/api/plan",
        "transit": "/api/transit/plan",
        "demo": "/api/demo",
        "mode": settings.resolved_mode,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
