from typing import Literal

from pydantic import BaseModel, Field

Lang = Literal["en", "ar"]
CueKind = Literal[
    "DEPART",
    "TURN_LEFT",
    "TURN_RIGHT",
    "TURN_SLIGHT_LEFT",
    "TURN_SLIGHT_RIGHT",
    "TURN_SHARP_LEFT",
    "TURN_SHARP_RIGHT",
    "UTURN_LEFT",
    "UTURN_RIGHT",
    "CONTINUE",
    "ROUNDABOUT_LEFT",
    "ROUNDABOUT_RIGHT",
    "RAMP_LEFT",
    "RAMP_RIGHT",
    "FORK_LEFT",
    "FORK_RIGHT",
    "MERGE",
    "ARRIVE",
    "WARN",
    "LANDMARK",
]
HapticPattern = Literal["left", "right", "arrive", "warn", "tick"]
Urgency = Literal["normal", "imminent", "critical"]


class LatLng(BaseModel):
    lat: float
    lng: float


class Cue(BaseModel):
    id: str
    kind: CueKind
    say: str
    detail: str = ""
    short: str
    at: LatLng
    trigger_m: int = Field(default=30, ge=0, le=500)
    haptic: HapticPattern = "tick"
    urgency: Urgency = "normal"


class Destination(BaseModel):
    name: str
    address: str = ""
    lat: float
    lng: float


class RoutePlan(BaseModel):
    route_id: str
    destination: Destination
    polyline: str = ""
    points: list[LatLng]
    distance_m: int = Field(ge=0)
    duration_s: int = Field(ge=0)
    cues: list[Cue] = Field(min_length=1)
    provider: str
    language: Lang


class PlanRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    lat: float = 32.0134
    lng: float = 35.8734
    lang: Lang = "en"
    constraints: list[str] = Field(default_factory=list)


class PlanResponse(BaseModel):
    reply: str
    route: RoutePlan
    debug: dict | None = None
