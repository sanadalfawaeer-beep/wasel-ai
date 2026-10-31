from datetime import datetime
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


class TransitLeg(BaseModel):
    mode: Literal["WALK", "BUS", "RAIL"]
    line: str | None = None
    line_short: str | None = None
    line_color: str | None = None
    headsign: str | None = None
    board_stop: str | None = None
    alight_stop: str | None = None
    departure_at: datetime | None = None
    arrival_at: datetime | None = None
    duration_s: int = Field(ge=0)
    distance_m: int = Field(default=0, ge=0)
    num_stops: int = Field(default=0, ge=0)
    occupancy: Literal["seats", "standing", "full", "unknown"] = "unknown"
    seats_left: int | None = Field(default=None, ge=0)
    occupancy_source: Literal["simulated", "reported", "operator", "unknown"] = "unknown"
    occupancy_updated_at: datetime | None = None


class TransitItinerary(BaseModel):
    id: str
    duration_s: int = Field(ge=0)
    walk_s: int = Field(ge=0)
    transfers: int = Field(ge=0)
    legs: list[TransitLeg]
    next_departures_min: list[int] = Field(default_factory=list)
    demo: bool = False
    provider: str
    realtime: bool = False
    summary: str


class TransitPlanResponse(BaseModel):
    destination: Destination
    itineraries: list[TransitItinerary]
    provider: str
    demo: bool
    note: str
    generated_at: datetime


class TransitRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    lat: float = 32.0134
    lng: float = 35.8734
    lang: Lang = "en"


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
