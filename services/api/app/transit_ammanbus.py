"""Direct-trip planner over the official Amman Bus/BRT timetable snapshot."""

from __future__ import annotations

import gzip
import json
from datetime import UTC, datetime, time, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

from .config import get_settings
from .geo import haversine_m
from .maps import MapsError
from .models import (
    Destination,
    Lang,
    LatLng,
    TransitItinerary,
    TransitLeg,
    TransitPlanResponse,
)

AMMAN_TZ = timezone(timedelta(hours=3), "Asia/Amman")
WALK_SPEED_MPS = 1.25
MAX_WALK_M = 1500
MAX_WAIT_S = 2 * 60 * 60
TRANSFER_BUFFER_S = 60
BRT_CODES = {"98", "99", "100", "102", "103", "104", "106"}


def _data_path() -> Path:
    configured = get_settings().ammanbus_data_path
    if configured:
        return Path(configured)
    return Path(__file__).resolve().parents[1] / "data" / "ammanbus.json.gz"


@lru_cache(maxsize=1)
def load_snapshot() -> dict[str, Any]:
    path = _data_path()
    if not path.is_file():
        raise MapsError("Amman Bus timetable data is not installed.")
    with gzip.open(path, "rt", encoding="utf-8") as handle:
        return json.load(handle)


def _active_times(schedules: list[dict[str, Any]], now: datetime) -> list[str]:
    weekday = now.weekday()
    active = [
        schedule
        for schedule in schedules
        if len(schedule.get("description", "")) == 7
        and schedule["description"][weekday].isupper()
    ]
    if not active:
        active = schedules
    return sorted({value for schedule in active for value in schedule.get("times", [])})


def _departure(
    day: datetime,
    clock: str,
    offset_s: int,
) -> datetime | None:
    try:
        hour, minute, second = (int(part) for part in clock.split(":"))
    except (TypeError, ValueError):
        return None
    day_offset = hour // 24
    base = datetime.combine(
        day.date() + timedelta(days=day_offset),
        time(hour % 24, minute, second),
        tzinfo=AMMAN_TZ,
    )
    return base + timedelta(seconds=offset_s)


def _next_departures(
    times: list[str],
    offset_s: int,
    now: datetime,
    after_s: int,
    max_wait_s: int = MAX_WAIT_S,
) -> list[datetime]:
    earliest = now + timedelta(seconds=after_s)
    latest = now + timedelta(seconds=max_wait_s)
    found: list[datetime] = []
    for day_offset in range(2):
        day = now + timedelta(days=day_offset)
        for clock in times:
            departure = _departure(day, clock, offset_s)
            if departure is not None and earliest <= departure <= latest:
                found.append(departure)
        if len(found) >= 3:
            break
    return sorted(found)[:3]


def _nearest_stop(
    point: LatLng,
    stops: list[dict[str, Any]],
) -> tuple[int, float]:
    best_index = 0
    best_distance = float("inf")
    for index, stop in enumerate(stops):
        distance = haversine_m(
            point,
            LatLng(lat=float(stop["lat"]), lng=float(stop["lng"])),
        )
        if distance < best_distance:
            best_index = index
            best_distance = distance
    return best_index, best_distance


def _color(value: str) -> str:
    text = (value or "").strip()
    if not text:
        return "#B0002A"
    return text if text.startswith("#") else f"#{text}"


def _line_label(code: str, name: str) -> str:
    return f"BRT {code}" if code in BRT_CODES or "BRT" in name.upper() else f"Bus {code}"


def _summary(walk_s: int, ride_s: int, stops: int, lang: Lang) -> str:
    walk_min = max(0, round(walk_s / 60))
    ride_min = max(0, round(ride_s / 60))
    if lang == "ar":
        return f"مشي {walk_min} د · باص {ride_min} د · {stops} محطات"
    return f"Walk {walk_min} min · Bus {ride_min} min · {stops} stops"


class AmmanBusClient:
    """Finds direct trips on the official Amman Bus/BRT network.

    The snapshot contains route geometry, ordered stops, and timetables. The
    planner only returns direct trips; a transfer search can be added without
    changing the response contract.
    """

    def plan(
        self,
        text: str,
        origin: LatLng,
        lang: Lang,
        destination: Destination | None = None,
        now: datetime | None = None,
    ) -> TransitPlanResponse:
        destination = destination or self._known_destination(text, lang)
        if destination is None:
            raise MapsError("I need destination coordinates to plan an Amman Bus trip.")

        snapshot = load_snapshot()
        now = now or datetime.now(AMMAN_TZ)
        origin_point = LatLng(lat=origin.lat, lng=origin.lng)
        destination_point = LatLng(lat=destination.lat, lng=destination.lng)
        candidates: list[tuple[int, TransitItinerary]] = []

        for route in snapshot.get("routes", []):
            best_for_route: tuple[int, TransitItinerary] | None = None
            for direction in route.get("directions", []):
                stops = direction.get("stops", [])
                if len(stops) < 2 or not direction.get("schedules"):
                    continue

                board_index, board_distance = _nearest_stop(origin_point, stops)
                alight_index, alight_distance = _nearest_stop(destination_point, stops)
                if board_index >= alight_index:
                    continue
                if board_distance > MAX_WALK_M or alight_distance > MAX_WALK_M:
                    continue

                board_stop = stops[board_index]
                alight_stop = stops[alight_index]
                walk_before_s = max(
                    60,
                    round(board_distance / WALK_SPEED_MPS),
                )
                walk_after_s = max(
                    60,
                    round(alight_distance / WALK_SPEED_MPS),
                )
                walk_s = walk_before_s + walk_after_s
                ride_s = int(alight_stop["arrival_offset"]) - int(
                    board_stop["arrival_offset"]
                )
                if ride_s <= 0:
                    continue

                times = _active_times(direction["schedules"], now)
                departures = _next_departures(
                    times,
                    int(board_stop["departure_offset"]),
                    now,
                    walk_before_s + TRANSFER_BUFFER_S,
                )
                if not departures:
                    continue

                departure = departures[0]
                arrival_at_stop = departure + timedelta(seconds=ride_s)
                arrival_at_destination = arrival_at_stop + timedelta(
                    seconds=walk_after_s
                )
                duration_s = int((arrival_at_destination - now).total_seconds())
                next_departures = [
                    max(0, round((value - now).total_seconds() / 60))
                    for value in departures
                ]
                code = str(route.get("display_code", ""))
                name = route.get("name", {}).get(lang) or route.get("name", {}).get(
                    "en", ""
                )
                headsign = direction.get("headsign", {}).get(lang) or direction.get(
                    "headsign", {}
                ).get("en", "")
                stop_count = max(1, alight_index - board_index)
                itinerary = TransitItinerary(
                    id=f"ammanbus-{code}-{direction.get('direction', '0')}",
                    duration_s=max(0, duration_s),
                    walk_s=walk_s,
                    transfers=0,
                    legs=[
                        TransitLeg(
                            mode="WALK",
                            duration_s=walk_before_s,
                            distance_m=round(board_distance),
                        ),
                        TransitLeg(
                            mode="BUS",
                            line=_line_label(code, name),
                            line_short=code,
                            line_color=_color(route.get("color", "")),
                            headsign=headsign,
                            board_stop=board_stop["name"].get(lang)
                            or board_stop["name"].get("en", ""),
                            alight_stop=alight_stop["name"].get(lang)
                            or alight_stop["name"].get("en", ""),
                            departure_at=departure,
                            arrival_at=arrival_at_stop,
                            duration_s=ride_s,
                            distance_m=0,
                            num_stops=stop_count,
                            occupancy="unknown",
                            occupancy_source="unknown",
                        ),
                        TransitLeg(
                            mode="WALK",
                            duration_s=walk_after_s,
                            distance_m=round(alight_distance),
                        ),
                    ],
                    next_departures_min=next_departures,
                    demo=False,
                    provider="ammanbus",
                    realtime=False,
                    summary=_summary(walk_s, ride_s, stop_count, lang),
                )
                candidate = (max(0, duration_s), itinerary)
                if best_for_route is None or candidate[0] < best_for_route[0]:
                    best_for_route = candidate
            if best_for_route is not None:
                candidates.append(best_for_route)

        candidates.sort(key=lambda item: item[0])
        itineraries = [item[1] for item in candidates[:4]]
        if itineraries:
            note = (
                "بيانات باص عمّان حسب الجدول. التأخير المباشر والمقاعد غير متاحة."
                if lang == "ar"
                else "Scheduled Amman Bus data. Live delays and seat availability are unavailable."
            )
        else:
            note = (
                "لا توجد رحلة مباشرة خلال الساعتين القادمتين. جرّب محطة قريبة أو وقتًا لاحقًا."
                if lang == "ar"
                else (
                    "No direct Amman Bus trip in the next two hours. "
                    "Try a nearby stop or a later time."
                )
            )
        return TransitPlanResponse(
            destination=destination,
            itineraries=itineraries,
            provider="ammanbus",
            demo=False,
            note=note,
            generated_at=datetime.now(UTC),
        )

    def _known_destination(
        self,
        text: str,
        lang: Lang,
    ) -> Destination | None:
        value = (text or "").lower()
        known = {
            "city mall": (31.9760, 35.8490, "City Mall", "سيتي مول"),
            "downtown": (31.9510, 35.9230, "Downtown Amman", "وسط البلد"),
            "abdoun": (31.9500, 35.8800, "Abdoun", "عبدون"),
            "sweileh": (32.0197, 35.8347, "Sweileh", "صويلح"),
            "sports city": (31.9936, 35.8579, "Sports City", "المدينة الرياضية"),
            "7th circle": (31.9560, 35.8690, "7th Circle", "الدوار السابع"),
        }
        for key, (lat, lng, en, ar) in known.items():
            if key in value or ar in value:
                return Destination(
                    name=ar if lang == "ar" else en,
                    address="Amman, Jordan" if lang == "en" else "عمّان، الأردن",
                    lat=lat,
                    lng=lng,
                )
        return None
