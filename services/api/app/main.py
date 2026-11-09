import logging
import mimetypes
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .routers.plan import router as plan_router
from .routers.transit import router as transit_router
from .routers.tts import router as tts_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

settings = get_settings()

mimetypes.add_type("application/manifest+json", ".webmanifest")

_web_dist_env = os.environ.get("WEB_DIST")
WEB_DIST = (
    Path(_web_dist_env)
    if _web_dist_env
    else Path(__file__).resolve().parents[3] / "apps" / "web" / "dist"
)
WEB_DIST = WEB_DIST.resolve()
WEB_INDEX = WEB_DIST / "index.html"

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
app.include_router(tts_router, prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    if WEB_INDEX.is_file():
        return FileResponse(WEB_INDEX, headers={"Cache-Control": "no-cache"})
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


if WEB_DIST.is_dir():
    if (WEB_DIST / "assets").is_dir():
        app.mount(
            "/assets",
            StaticFiles(directory=WEB_DIST / "assets"),
            name="web-assets",
        )

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_web(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found.")
        candidate = (WEB_DIST / full_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(WEB_DIST):
            return FileResponse(candidate)
        return FileResponse(WEB_INDEX, headers={"Cache-Control": "no-cache"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
