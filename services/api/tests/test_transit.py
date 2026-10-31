import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.models import Destination, LatLng
from app.transit import GoogleTransitClient

client = TestClient(app)

DESTINATION = Destination(
    name="City Mall",
    address="Amman, Jordan",
    lat=31.976,
    lng=35.849,
)


class FakePlaces:
    def find_place(self, query: str, origin: LatLng, lang: str) -> Destination:
        return DESTINATION


def transit_handler(request: httpx.Request) -> httpx.Response:
    assert request.headers["X-Goog-Api-Key"] == "test-key"
    assert "transitDetails" in request.headers["X-Goog-FieldMask"]
    return httpx.Response(
        200,
        json={
            "routes": [
                {
                    "duration": "1140s",
                    "distanceMeters": 3200,
                    "legs": [
                        {
                            "steps": [
                                {
                                    "travelMode": "WALK",
                                    "staticDuration": "240s",
                                    "distanceMeters": 300,
                                },
                                {
                                    "travelMode": "TRANSIT",
                                    "transitDetails": {
                                        "stopDetails": {
                                            "departureStop": {
                                                "name": "University of Jordan Main Gate"
                                            },
                                            "arrivalStop": {"name": "City Mall"},
                                            "departureTime": "2026-10-31T10:00:00Z",
                                            "arrivalTime": "2026-10-31T10:12:00Z",
                                        },
                                        "headsign": "City Mall",
                                        "stopCount": 5,
                                        "transitLine": {
                                            "name": "Amman Bus 100",
                                            "nameShort": "100",
                                            "color": "#0F766E",
                                            "vehicle": {"type": "BUS"},
                                        },
                                    },
                                },
                                {
                                    "travelMode": "WALK",
                                    "staticDuration": "180s",
                                    "distanceMeters": 220,
                                },
                            ]
                        }
                    ],
                }
            ]
        },
    )


def test_mock_transit_returns_demo_itineraries() -> None:
    response = client.post(
        "/api/transit/plan",
        json={"text": "City Mall", "lang": "en"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "mock"
    assert payload["demo"] is True
    assert len(payload["itineraries"]) == 2
    first = payload["itineraries"][0]
    assert first["demo"] is True
    assert first["legs"][1]["mode"] == "BUS"
    assert first["legs"][1]["line_short"] == "100"
    assert first["legs"][1]["occupancy"] == "seats"
    assert first["legs"][1]["occupancy_source"] == "simulated"
    assert first["legs"][1]["seats_left"] == 8
    assert first["transfers"] == 0
    assert payload["itineraries"][1]["transfers"] == 1


def test_mock_transit_arabic() -> None:
    response = client.post(
        "/api/transit/plan",
        json={"text": "سيتي مول", "lang": "ar"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["destination"]["name"] == "سيتي مول"
    assert "محاكاة" in payload["note"]
    assert payload["itineraries"][0]["legs"][1]["line_short"] == "100"


def test_google_transit_parses_bus_itinerary() -> None:
    transit = GoogleTransitClient(
        api_key="test-key",
        transport=httpx.MockTransport(transit_handler),
        places=FakePlaces(),  # type: ignore[arg-type]
    )

    result = transit.plan("City Mall", LatLng(lat=32.0134, lng=35.8734), "en")

    assert result.provider == "google"
    assert result.demo is False
    assert len(result.itineraries) == 1
    itinerary = result.itineraries[0]
    assert itinerary.duration_s == 1140
    assert itinerary.walk_s == 420
    assert itinerary.transfers == 0
    assert itinerary.summary.startswith("Walk 4 min")
    bus = itinerary.legs[1]
    assert bus.mode == "BUS"
    assert bus.line_short == "100"
    assert bus.board_stop == "University of Jordan Main Gate"
    assert bus.alight_stop == "City Mall"
    assert bus.num_stops == 5
    assert bus.occupancy == "unknown"
    assert bus.occupancy_source == "unknown"
    assert "seat" in result.note.lower()
