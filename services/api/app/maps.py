"""Routing providers.

Phase 0 supports two implementations behind one interface:

* ``GoogleMapsClient`` — Places API (New) + Routes API.
* ``MockMapsClient`` — a deterministic UJ demo route, no billing required.

The planner does not care which one it gets.
"""

from __future__ import annotations

import logging
from typing import Protocol
from uuid import uuid4

import httpx

from .config import Settings
from .cues import build_cues
from .geo import decode_polyline
from .mock_data import build_mock_route, mock_destination
from .models import Destination, Lang, LatLng, RoutePlan

logger = logging.getLogger(__name__)


class MapsError(RuntimeError):
    """A routing failure with a message safe to show to the user."""


class MapsClient(Protocol):
    def find_place(self, query: str, origin: LatLng, lang: Lang) -> Destination: ...

    def compute_route(self, origin: LatLng, destination: Destination, lang: Lang) -> RoutePlan: ...


class MockMapsClient:
    def find_place(self, query: str, origin: LatLng, lang: Lang) -> Destination:
        return mock_destination(query, lang)

    def compute_route(self, origin: LatLng, destination: Destination, lang: Lang) -> RoutePlan:
        return build_mock_route(destination, lang)


class GoogleMapsClient:
    PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
    ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"

    def __init__(self, api_key: str, timeout_s: float = 12.0) -> None:
        self.api_key = api_key
        self.timeout_s = timeout_s

    def _headers(self, field_mask: str) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": field_mask,
        }

    def find_place(self, query: str, origin: LatLng, lang: Lang) -> Destination:
        body = {
            "textQuery": query,
            "languageCode": lang,
            "maxResultCount": 3,
            "locationBias": {
                "circle": {
                    "center": {"latitude": origin.lat, "longitude": origin.lng},
                    "radius": 5000.0,
                }
            },
        }
        field_mask = "places.displayName,places.formattedAddress,places.location"
        try:
            with httpx.Client(timeout=self.timeout_s) as client:
                response = client.post(
                    self.PLACES_URL, headers=self._headers(field_mask), json=body
                )
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Places API error: %s %s",
                exc.response.status_code,
                exc.response.text[:300],
            )
            raise MapsError("I couldn't search for that place right now.") from exc
        except httpx.HTTPError as exc:
            logger.warning("Places network error: %s", exc)
            raise MapsError("I can't reach the map service right now.") from exc

        places = payload.get("places") or []
        if not places:
            raise MapsError("I couldn't find that place nearby. Try a more specific name.")

        place = places[0]
        location = place.get("location") or {}
        return Destination(
            name=(place.get("displayName") or {}).get("text") or query,
            address=place.get("formattedAddress") or "",
            lat=float(location.get("latitude", origin.lat)),
            lng=float(location.get("longitude", origin.lng)),
        )

    def compute_route(self, origin: LatLng, destination: Destination, lang: Lang) -> RoutePlan:
        body = {
            "origin": {"location": {"latLng": {"latitude": origin.lat, "longitude": origin.lng}}},
            "destination": {
                "location": {
                    "latLng": {"latitude": destination.lat, "longitude": destination.lng}
                }
            },
            "travelMode": "WALK",
            "routingPreference": "TRAFFIC_UNAWARE",
            "computeAlternativeRoutes": False,
            "languageCode": lang,
            "units": "METRIC",
        }
        field_mask = ",".join(
            [
                "routes.polyline.encodedPolyline",
                "routes.distanceMeters",
                "routes.duration",
                "routes.legs.steps.navigationInstruction",
                "routes.legs.steps.distanceMeters",
                "routes.legs.steps.startLocation",
                "routes.legs.steps.endLocation",
            ]
        )
        try:
            with httpx.Client(timeout=self.timeout_s) as client:
                response = client.post(
                    self.ROUTES_URL, headers=self._headers(field_mask), json=body
                )
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Routes API error: %s %s",
                exc.response.status_code,
                exc.response.text[:300],
            )
            raise MapsError("I couldn't build a walking route right now.") from exc
        except httpx.HTTPError as exc:
            logger.warning("Routes network error: %s", exc)
            raise MapsError("I can't reach the map service right now.") from exc

        routes = payload.get("routes") or []
        if not routes:
            raise MapsError("I couldn't find a walking route to that place.")

        route = routes[0]
        encoded = (route.get("polyline") or {}).get("encodedPolyline") or ""
        points = decode_polyline(encoded)
        if not points:
            points = [origin, LatLng(lat=destination.lat, lng=destination.lng)]

        steps: list[dict] = []
        for leg in route.get("legs") or []:
            steps.extend(leg.get("steps") or [])

        cues = build_cues(steps, destination, lang)
        duration_raw = str(route.get("duration") or "0s").rstrip("s")

        return RoutePlan(
            route_id=f"google-{uuid4().hex[:10]}",
            destination=destination,
            polyline=encoded,
            points=points,
            distance_m=int(route.get("distanceMeters") or 0),
            duration_s=int(float(duration_raw or 0)),
            cues=cues,
            provider="google",
            language=lang,
        )


def get_maps_client(settings: Settings) -> MapsClient:
    if settings.resolved_mode == "mock":
        return MockMapsClient()
    if not settings.google_maps_api_key:
        raise MapsError("Google Maps is not configured.")
    return GoogleMapsClient(settings.google_maps_api_key, settings.request_timeout_s)
