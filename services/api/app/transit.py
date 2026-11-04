"""Amman bus planning.

Two providers share the same response:

* ``GoogleTransitClient`` — Routes API ``travelMode=TRANSIT`` using Google's
  Amman GTFS data. It returns real line/stop/timing information but no seat
  occupancy.
* ``MockTransitClient`` — demo itineraries with simulated occupancy, clearly
  marked as demo data.

Exact empty-seat counts are not available from Google or GTFS. The demo
provider simulates them; a production occupancy provider needs operator APC or
crowdsourced reports.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Protocol

import httpx

from .config import Settings, get_settings
from .maps import GoogleMapsClient, MapsClient, MapsError, _google_error
from .models import (
    Destination,
    Lang,
    LatLng,
    TransitItinerary,
    TransitLeg,
    TransitPlanResponse,
    TransitRequest,
)
from .transit_ammanbus import AmmanBusClient

logger = logging.getLogger(__name__)

_TRANSIT_DESTINATIONS: dict[str, dict] = {
    "city mall": {
        "en": "City Mall",
        "ar": "سيتي مول",
        "lat": 31.9760,
        "lng": 35.8490,
    },
    "downtown": {
        "en": "Downtown Amman",
        "ar": "وسط البلد",
        "lat": 31.9510,
        "lng": 35.9230,
    },
    "abdoun": {
        "en": "Abdoun",
        "ar": "عبدون",
        "lat": 31.9500,
        "lng": 35.8800,
    },
    "sweileh": {
        "en": "Sweileh",
        "ar": "صويلح",
        "lat": 32.0197,
        "lng": 35.8347,
    },
    "sports city": {
        "en": "Sports City",
        "ar": "المدينة الرياضية",
        "lat": 31.9936,
        "lng": 35.8579,
    },
}


def _transit_destination(query: str, lang: Lang) -> Destination:
    value = (query or "").lower()
    for key, item in _TRANSIT_DESTINATIONS.items():
        if key in value or item["ar"] in value:
            return Destination(
                name=item[lang],
                address="Amman, Jordan" if lang == "en" else "عمّان، الأردن",
                lat=float(item["lat"]),
                lng=float(item["lng"]),
            )
    name = (query or "").strip().title() or ("City Mall" if lang == "en" else "سيتي مول")
    return Destination(name=name, address="Amman, Jordan", lat=31.9539, lng=35.9106)


def _minutes(seconds: int) -> int:
    return max(0, round(seconds / 60))


def _summary_from_legs(legs: list[TransitLeg], lang: Lang) -> str:
    parts: list[str] = []
    for leg in legs:
        if leg.mode == "WALK":
            minutes = _minutes(leg.duration_s)
            label = "مشي" if lang == "ar" else "Walk"
            unit = "د" if lang == "ar" else "min"
            parts.append(f"{label} {minutes} {unit}")
        else:
            line = leg.line_short or leg.line or ""
            minutes = _minutes(leg.duration_s)
            if lang == "ar":
                parts.append(f"باص {line} · {minutes} د · {leg.num_stops} محطات")
            else:
                parts.append(f"Bus {line} · {minutes} min · {leg.num_stops} stops")
    return " · ".join(parts)


def _walk_leg(minutes: int, distance_m: int) -> TransitLeg:
    return TransitLeg(mode="WALK", duration_s=minutes * 60, distance_m=distance_m)


def _bus_leg(
    now: datetime,
    offset_min: int,
    duration_min: int,
    line: str,
    line_short: str,
    line_color: str,
    headsign: str,
    board_stop: str,
    alight_stop: str,
    num_stops: int,
    occupancy: str,
    seats_left: int | None,
) -> TransitLeg:
    departure = now + timedelta(minutes=offset_min)
    arrival = departure + timedelta(minutes=duration_min)
    return TransitLeg(
        mode="BUS",
        line=line,
        line_short=line_short,
        line_color=line_color,
        headsign=headsign,
        board_stop=board_stop,
        alight_stop=alight_stop,
        departure_at=departure,
        arrival_at=arrival,
        duration_s=duration_min * 60,
        distance_m=duration_min * 250,
        num_stops=num_stops,
        occupancy=occupancy,  # type: ignore[arg-type]
        seats_left=seats_left,
        occupancy_source="simulated",
        occupancy_updated_at=now,
    )


class MockTransitClient:
    def plan(
        self,
        text: str,
        origin: LatLng,
        lang: Lang,
        destination: Destination | None = None,
    ) -> TransitPlanResponse:
        now = datetime.now(UTC)
        destination = _transit_destination(text, lang)
        name = destination.name
        note = (
            "بيانات تجريبية: أوقات الباص وعدد المقاعد محاكاة."
            if lang == "ar"
            else "Demo data: bus times and seat counts are simulated."
        )

        first = TransitItinerary(
            id="demo-1",
            duration_s=19 * 60,
            walk_s=7 * 60,
            transfers=0,
            legs=[
                _walk_leg(4, 300),
                _bus_leg(
                    now,
                    4,
                    12,
                    "Amman Bus 100",
                    "100",
                    "#0F766E",
                    name,
                    "7th Circle Station" if lang == "en" else "موقف الدوار السابع",
                    name,
                    5,
                    "seats",
                    8,
                ),
                _walk_leg(3, 220),
            ],
            next_departures_min=[4, 14, 24],
            demo=True,
            provider="mock",
            summary="",
        )
        first.summary = _summary_from_legs(first.legs, lang)

        second = TransitItinerary(
            id="demo-2",
            duration_s=42 * 60,
            walk_s=14 * 60,
            transfers=1,
            legs=[
                _walk_leg(7, 520),
                _bus_leg(
                    now,
                    6,
                    18,
                    "Amman BRT 1",
                    "BRT 1",
                    "#B45309",
                    "Sports City" if lang == "en" else "المدينة الرياضية",
                    "Sweileh Terminal" if lang == "en" else "مجمع صويلح",
                    "Sports City" if lang == "en" else "المدينة الرياضية",
                    7,
                    "standing",
                    None,
                ),
                _walk_leg(2, 150),
                _bus_leg(
                    now,
                    26,
                    10,
                    "Amman Bus 101",
                    "101",
                    "#1D4ED8",
                    name,
                    "Sports City" if lang == "en" else "المدينة الرياضية",
                    name,
                    4,
                    "standing",
                    None,
                ),
                _walk_leg(5, 360),
            ],
            next_departures_min=[6, 16, 26],
            demo=True,
            provider="mock",
            summary="",
        )
        second.summary = _summary_from_legs(second.legs, lang)

        return TransitPlanResponse(
            destination=destination,
            itineraries=[first, second],
            provider="mock",
            demo=True,
            note=note,
            generated_at=now,
        )


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _parse_duration(value: object) -> int:
    if value is None:
        return 0
    text = str(value).strip()
    if text.endswith("s"):
        try:
            return int(float(text[:-1]))
        except ValueError:
            return 0
    try:
        return int(float(text))
    except ValueError:
        return 0


class GoogleTransitClient:
    ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"

    def __init__(
        self,
        api_key: str,
        timeout_s: float = 12.0,
        transport: httpx.BaseTransport | None = None,
        places: MapsClient | None = None,
    ) -> None:
        self.api_key = api_key
        self.timeout_s = timeout_s
        self._transport = transport
        self._places = places or GoogleMapsClient(api_key, timeout_s, transport)

    def plan(
        self,
        text: str,
        origin: LatLng,
        lang: Lang,
        destination: Destination | None = None,
    ) -> TransitPlanResponse:
        destination = destination or self._places.find_place(text, origin, lang)
        now = datetime.now(UTC)
        body = {
            "origin": {"location": {"latLng": {"latitude": origin.lat, "longitude": origin.lng}}},
            "destination": {
                "location": {
                    "latLng": {"latitude": destination.lat, "longitude": destination.lng}
                }
            },
            "travelMode": "TRANSIT",
            "computeAlternativeRoutes": True,
            "languageCode": lang,
            "units": "METRIC",
        }
        field_mask = ",".join(
            [
                "routes.duration",
                "routes.distanceMeters",
                "routes.legs.steps.travelMode",
                "routes.legs.steps.staticDuration",
                "routes.legs.steps.distanceMeters",
                "routes.legs.steps.transitDetails",
                "routes.legs.steps.polyline",
                "routes.legs.steps.navigationInstruction",
            ]
        )
        try:
            with httpx.Client(timeout=self.timeout_s, transport=self._transport) as client:
                response = client.post(
                    self.ROUTES_URL,
                    headers={
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": self.api_key,
                        "X-Goog-FieldMask": field_mask,
                    },
                    json=body,
                )
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as exc:
            raise _google_error("Routes", exc) from exc
        except httpx.HTTPError as exc:
            logger.warning("Transit network error: %s", exc)
            raise MapsError("I can't reach Google transit right now.") from exc

        itineraries: list[TransitItinerary] = []
        for route_index, route in enumerate(payload.get("routes") or []):
            legs: list[TransitLeg] = []
            walk_s = 0
            transit_count = 0
            for route_leg in route.get("legs") or []:
                for step in route_leg.get("steps") or []:
                    mode = str(step.get("travelMode") or "")
                    if mode == "WALK":
                        distance = int(step.get("distanceMeters") or 0)
                        duration = _parse_duration(step.get("staticDuration")) or round(
                            distance / 1.4
                        )
                        legs.append(
                            TransitLeg(
                                mode="WALK",
                                duration_s=duration,
                                distance_m=distance,
                            )
                        )
                        walk_s += duration
                        continue

                    details = step.get("transitDetails") or {}
                    if mode != "TRANSIT" or not details:
                        continue
                    line = details.get("transitLine") or {}
                    stops = details.get("stopDetails") or {}
                    vehicle = (line.get("vehicle") or {}).get("type") or "BUS"
                    vehicle_type = (
                        "RAIL"
                        if vehicle in {"RAIL", "TRAIN", "SUBWAY", "LIGHT_RAIL"}
                        else "BUS"
                    )
                    departure = _parse_datetime(stops.get("departureTime"))
                    arrival = _parse_datetime(stops.get("arrivalTime"))
                    duration = 0
                    if departure and arrival:
                        duration = max(0, int((arrival - departure).total_seconds()))
                    duration = duration or _parse_duration(step.get("staticDuration"))
                    legs.append(
                        TransitLeg(
                            mode=vehicle_type,  # type: ignore[arg-type]
                            line=line.get("name"),
                            line_short=line.get("nameShort") or line.get("name"),
                            line_color=line.get("color"),
                            headsign=details.get("headsign"),
                            board_stop=(stops.get("departureStop") or {}).get("name"),
                            alight_stop=(stops.get("arrivalStop") or {}).get("name"),
                            departure_at=departure,
                            arrival_at=arrival,
                            duration_s=duration,
                            distance_m=int(step.get("distanceMeters") or 0),
                            num_stops=int(details.get("stopCount") or 0),
                            occupancy="unknown",
                            occupancy_source="unknown",
                        )
                    )
                    transit_count += 1

            if transit_count == 0:
                continue
            total = _parse_duration(route.get("duration")) or sum(leg.duration_s for leg in legs)
            first_bus = next((leg for leg in legs if leg.mode != "WALK"), None)
            next_departures: list[int] = []
            if first_bus and first_bus.departure_at:
                minutes = max(
                    0,
                    round((first_bus.departure_at - now).total_seconds() / 60),
                )
                next_departures = [minutes, minutes + 10, minutes + 20]
            itineraries.append(
                TransitItinerary(
                    id=f"google-{route_index + 1}",
                    duration_s=total,
                    walk_s=walk_s,
                    transfers=max(0, transit_count - 1),
                    legs=legs,
                    next_departures_min=next_departures,
                    demo=False,
                    provider="google",
                    realtime=False,
                    summary=_summary_from_legs(legs, lang),
                )
            )

        if not itineraries:
            raise MapsError("I couldn't find a bus route to that destination.")

        return TransitPlanResponse(
            destination=destination,
            itineraries=itineraries[:4],
            provider="google",
            demo=False,
            note=(
                "أوقات الباص من Google. بيانات المقاعد غير متوفرة."
                if lang == "ar"
                else "Transit times from Google. Seat occupancy is unavailable."
            ),
            generated_at=now,
        )


class TransitPlanner(Protocol):
    def plan(
        self,
        text: str,
        origin: LatLng,
        lang: Lang,
        destination: Destination | None = None,
    ) -> TransitPlanResponse: ...


def get_transit_client(settings: Settings) -> TransitPlanner:
    provider = settings.resolved_transit_provider
    if provider == "google":
        if not settings.google_maps_api_key:
            raise MapsError("Google Maps is not configured.")
        return GoogleTransitClient(
            settings.google_maps_api_key,
            settings.request_timeout_s,
        )
    if provider == "ammanbus":
        return AmmanBusClient()
    return MockTransitClient()


def _request_destination(request: TransitRequest) -> Destination | None:
    if request.dest_lat is None or request.dest_lng is None:
        return None
    return Destination(
        name=request.dest_name or request.text,
        address="Amman, Jordan",
        lat=request.dest_lat,
        lng=request.dest_lng,
    )


def plan_transit(request: TransitRequest) -> TransitPlanResponse:
    settings = get_settings()
    client = get_transit_client(settings)
    return client.plan(
        request.text,
        LatLng(lat=request.lat, lng=request.lng),
        request.lang,
        _request_destination(request),
    )
