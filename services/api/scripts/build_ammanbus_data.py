"""Build the local Amman Bus route/schedule snapshot.

The Vision City Bus web app exposes public route and timetable data through
its web endpoints. This script turns that data into one compressed snapshot so
the planner can serve requests without making hundreds of upstream calls.

Run from ``services/api``:

    .venv/Scripts/python.exe scripts/build_ammanbus_data.py

Refresh the snapshot when routes or timetables change. For a public pilot,
confirm data use and attribution with Amman Vision Transport / Kentkart.
"""

from __future__ import annotations

import gzip
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

BASE_URL = "https://mobile.ammanbus.jo/rl1"
REGION = "116"
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "ammanbus.json.gz"
WORKERS = 8
RETRIES = 3


def _get(client: httpx.Client, path: str, params: dict[str, str]) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(RETRIES):
        try:
            response = client.get(f"{BASE_URL}{path}", params=params, timeout=40)
            response.raise_for_status()
            return response.json()
        except Exception as exc:  # noqa: BLE001 - retry upstream failures
            last_error = exc
            if attempt + 1 < RETRIES:
                time.sleep(0.4 * (attempt + 1))
    raise RuntimeError(f"Could not fetch {path}") from last_error


def _route_list(client: httpx.Client, lang: str) -> list[dict[str, Any]]:
    data = _get(
        client,
        "/web/nearest/find",
        {
            "region": REGION,
            "lang": lang,
            "authType": "4",
            "accuracy": "0",
            "lat": "31.9539",
            "lng": "35.9106",
        },
    )
    return data.get("routeList", [])


def _path(
    client: httpx.Client,
    code: str,
    direction: str,
    lang: str,
) -> list[dict[str, Any]]:
    data = _get(
        client,
        "/web/pathInfo",
        {
            "region": REGION,
            "lang": lang,
            "authType": "4",
            "displayRouteCode": code,
            "direction": direction,
            "resultType": "111111",
        },
    )
    return data.get("pathList", [])


def _name(value: str | None) -> dict[str, str]:
    text = (value or "").strip()
    return {"en": text, "ar": text}


def _schedules(path: dict[str, Any]) -> list[dict[str, Any]]:
    schedules: list[dict[str, Any]] = []
    for schedule in path.get("scheduleList", []):
        times = sorted(
            {
                item["departureTime"]
                for item in schedule.get("timeList", [])
                if item.get("departureTime")
            }
        )
        if times:
            schedules.append(
                {
                    "description": schedule.get("description", ""),
                    "times": times,
                }
            )
    return schedules


def _stops(path_en: dict[str, Any], path_ar: dict[str, Any]) -> list[dict[str, Any]]:
    ar_by_seq = {
        str(stop.get("seq")): stop.get("stopName", "")
        for stop in path_ar.get("busStopList", [])
    }
    stops = []
    for stop in path_en.get("busStopList", []):
        seq = str(stop.get("seq", ""))
        stops.append(
            {
                "seq": int(seq or 0),
                "stop_id": str(stop.get("stopId", "")),
                "name": {
                    "en": (stop.get("stopName") or "").strip(),
                    "ar": ar_by_seq.get(seq, stop.get("stopName") or "").strip(),
                },
                "lat": float(stop.get("lat", 0)),
                "lng": float(stop.get("lng", 0)),
                "arrival_offset": int(float(stop.get("arrival_offset") or 0)),
                "departure_offset": int(float(stop.get("departure_offset") or 0)),
            }
        )
    return stops


def _fetch_route(
    code: str,
    meta_en: dict[str, Any],
    meta_ar: dict[str, Any],
) -> dict[str, Any] | None:
    with httpx.Client(headers={"User-Agent": "WaselAI/0.1"}) as client:
        directions = []
        for direction in ("0", "1"):
            paths_en = _path(client, code, direction, "en")
            paths_ar = _path(client, code, direction, "ar")
            if not paths_en:
                continue
            for index, path_en in enumerate(paths_en):
                path_ar = paths_ar[index] if index < len(paths_ar) else path_en
                stops = _stops(path_en, path_ar)
                if len(stops) < 2:
                    continue
                directions.append(
                    {
                        "direction": direction,
                        "headsign": {
                            "en": (path_en.get("headSign") or meta_en.get("name") or "").strip(),
                            "ar": (
                                path_ar.get("headSign")
                                or meta_ar.get("name")
                                or meta_en.get("name")
                                or ""
                            ).strip(),
                        },
                        "stops": stops,
                        "schedules": _schedules(path_en),
                    }
                )
    if not directions:
        return None
    return {
        "route_code": str(meta_en.get("routeCode", "")),
        "display_code": code,
        "name": {
            "en": (meta_en.get("name") or "").strip(),
            "ar": (meta_ar.get("name") or meta_en.get("name") or "").strip(),
        },
        "color": (meta_en.get("routeColor") or "").strip(),
        "agency": (meta_en.get("agencyName") or "").strip(),
        "directions": directions,
    }


def main() -> None:
    started = time.time()
    with httpx.Client(headers={"User-Agent": "WaselAI/0.1"}) as client:
        routes_en = _route_list(client, "en")
        routes_ar = _route_list(client, "ar")

    meta_ar = {str(item.get("displayRouteCode")): item for item in routes_ar}
    meta_en = {str(item.get("displayRouteCode")): item for item in routes_en}
    codes = sorted(meta_en, key=lambda value: (len(value), value))

    routes: list[dict[str, Any]] = []
    errors: list[tuple[str, str]] = []
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(_fetch_route, code, meta_en[code], meta_ar.get(code, meta_en[code])): code
            for code in codes
        }
        for future in as_completed(futures):
            code = futures[future]
            try:
                route = future.result()
                if route:
                    routes.append(route)
            except Exception as exc:  # noqa: BLE001 - keep the snapshot partial
                errors.append((code, str(exc)))

    routes.sort(key=lambda route: (len(route["display_code"]), route["display_code"]))
    snapshot = {
        "source": "https://online.ammanbus.jo/",
        "region": REGION,
        "generated_at": datetime.now(UTC).isoformat(),
        "route_count": len(routes),
        "errors": errors,
        "routes": routes,
    }
    raw = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    compressed = gzip.compress(raw, compresslevel=9, mtime=0)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(compressed)

    print(
        f"Wrote {OUTPUT} with {len(routes)} routes, "
        f"{len(raw) / 1024 / 1024:.1f} MB raw, "
        f"{len(compressed) / 1024 / 1024:.1f} MB gzip, "
        f"{time.time() - started:.0f}s, errors={len(errors)}"
    )


if __name__ == "__main__":
    main()
