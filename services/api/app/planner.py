"""The Strands planning layer.

The agent resolves intent and calls two tools. It never runs in the real-time
cue loop; the phone fires cues locally from the returned RoutePlan.
"""

from __future__ import annotations

import logging
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field

from strands import Agent, tool
from strands.models.openai import OpenAIModel

from .config import Settings, get_settings
from .maps import MapsClient, MapsError, get_maps_client
from .mock_data import demo_route
from .models import Destination, Lang, LatLng, PlanRequest, PlanResponse, RoutePlan

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Wasel, a calm walking guide for blind, low-vision, and Deaf users.

Rules:
1. Call find_place exactly once with the destination the user asked for.
2. Then call get_route with the resolved place name.
3. Never invent coordinates, addresses, or turn instructions.
4. Reply in the user's language with one short sentence, at most 20 words.
5. If the request is vague, use "University of Jordan Library".
"""


@dataclass
class PlanSession:
    client: MapsClient
    settings: Settings
    origin: LatLng
    lang: Lang
    constraints: list[str] = field(default_factory=list)
    destination: Destination | None = None
    route: RoutePlan | None = None
    reply: str = ""
    tool_log: list[dict] = field(default_factory=list)
    provider: str = "fallback"


def _reply_for(destination: Destination, route: RoutePlan, lang: Lang) -> str:
    minutes = max(1, round(route.duration_s / 60))
    if lang == "ar":
        return f"سأسير معك إلى {destination.name}. المسافة حوالي {minutes} دقائق."
    return f"Heading to {destination.name}. It is about {minutes} minutes away."


def _fallback_query(text: str) -> str:
    patterns = [
        (
            r"^\s*(please\s+)?("
            r"take me to|navigate to|walk me to|go to|walk to|where is|find|i need|"
            r"i want to go to"
            r")\s+"
        ),
        r"^\s*(خذني إلى|خذني الى|اذهب إلى|اذهب الى|أريد الذهاب إلى|أريد الذهاب الى|وين|أين)\s+",
    ]
    query = text.strip()
    for pattern in patterns:
        query = re.sub(pattern, "", query, flags=re.IGNORECASE).strip()
    query = query.strip(" .!؟?")
    return query or "University of Jordan Library"


def _run_agent(agent: Agent, text: str, timeout_s: float) -> object:
    """Run the agent with a hard wall-clock budget.

    The worker thread is not joined on timeout: a slow model call must never
    block the request or delay the deterministic fallback. Its session is a
    separate object, so whatever it writes after the timeout is ignored.
    """
    executor = ThreadPoolExecutor(max_workers=1)
    try:
        future = executor.submit(agent, text)
        return future.result(timeout=timeout_s)
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def _build_agent(session: PlanSession) -> Agent:
    model = OpenAIModel(
        client_args={
            "api_key": session.settings.deepseek_api_key,
            "base_url": "https://api.deepseek.com",
        },
        model_id=session.settings.deepseek_model,
        params={
            "temperature": 0.1,
            "max_tokens": 350,
            # DeepSeek thinking mode adds latency and is unnecessary for a
            # two-tool destination lookup.
            "extra_body": {"thinking": {"type": "disabled"}},
        },
    )

    @tool
    def find_place(query: str) -> dict:
        """Find a destination near the user.

        Args:
            query: The place name from the user, e.g. "the library".

        Returns:
            The resolved place name, address, and coordinates.
        """
        destination = session.client.find_place(query, session.origin, session.lang)
        session.destination = destination
        result = {
            "name": destination.name,
            "address": destination.address,
            "lat": destination.lat,
            "lng": destination.lng,
        }
        session.tool_log.append({"tool": "find_place", "args": {"query": query}, "result": result})
        return result

    @tool
    def get_route(destination_name: str = "") -> dict:
        """Compute a walking route to the resolved destination.

        Args:
            destination_name: The resolved place name returned by find_place.

        Returns:
            Distance, duration, and the number of guidance cues.
        """
        if session.destination is None:
            query = destination_name or "University of Jordan Library"
            session.destination = session.client.find_place(query, session.origin, session.lang)

        route = session.client.compute_route(session.origin, session.destination, session.lang)
        session.route = route
        result = {
            "distance_m": route.distance_m,
            "duration_s": route.duration_s,
            "cues": len(route.cues),
        }
        session.tool_log.append(
            {
                "tool": "get_route",
                "args": {"destination_name": destination_name},
                "result": result,
            }
        )
        return result

    return Agent(
        model=model,
        tools=[find_place, get_route],
        system_prompt=SYSTEM_PROMPT,
        callback_handler=None,
    )


def plan(
    text: str,
    origin: LatLng,
    lang: Lang,
    constraints: list[str] | None = None,
) -> PlanResponse:
    settings = get_settings()
    client = get_maps_client(settings)
    session = PlanSession(
        client=client,
        settings=settings,
        origin=origin,
        lang=lang,
        constraints=constraints or [],
    )

    if settings.llm_enabled:
        # The agent works on its own session. If it times out, its late writes
        # cannot race with the fallback below.
        agent_session = PlanSession(
            client=client,
            settings=settings,
            origin=origin,
            lang=lang,
            constraints=constraints or [],
        )
        try:
            agent = _build_agent(agent_session)
            result = _run_agent(agent, text, settings.agent_timeout_s)
            session.destination = agent_session.destination
            session.route = agent_session.route
            session.reply = str(result).strip()
            session.tool_log.extend(agent_session.tool_log)
            session.provider = "deepseek"
        except Exception:
            logger.exception("Strands planner failed; using deterministic fallback")
            session.reply = ""
            session.provider = "fallback"

    if session.destination is None:
        query = _fallback_query(text)
        session.destination = client.find_place(query, origin, lang)
        session.tool_log.append(
            {
                "tool": "fallback_find_place",
                "args": {"query": query},
                "result": session.destination.name,
            }
        )

    if session.route is None:
        session.route = client.compute_route(origin, session.destination, lang)
        session.tool_log.append(
            {
                "tool": "fallback_get_route",
                "args": {"destination": session.destination.name},
                "result": {"cues": len(session.route.cues)},
            }
        )

    if not session.reply or len(session.reply) > 300:
        session.reply = _reply_for(session.destination, session.route, lang)

    debug = {
        "mode": settings.resolved_mode,
        "model": settings.deepseek_model if settings.llm_enabled else None,
        "planner": session.provider,
        "constraints": session.constraints,
        "tool_log": session.tool_log,
    }
    return PlanResponse(reply=session.reply, route=session.route, debug=debug)


def plan_request(request: PlanRequest) -> PlanResponse:
    return plan(
        text=request.text,
        origin=LatLng(lat=request.lat, lng=request.lng),
        lang=request.lang,
        constraints=request.constraints,
    )


def demo_response(lang: Lang = "en") -> PlanResponse:
    route = demo_route(lang)
    reply = _reply_for(route.destination, route, lang)
    return PlanResponse(
        reply=reply,
        route=route,
        debug={"mode": "mock", "model": None, "planner": "demo", "tool_log": []},
    )


__all__ = ["plan", "plan_request", "demo_response", "MapsError"]
