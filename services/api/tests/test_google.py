import httpx

from app.geo import encode_polyline
from app.maps import GoogleMapsClient
from app.models import Destination, LatLng

POINTS = [
    LatLng(lat=32.0134, lng=35.8734),
    LatLng(lat=32.0138, lng=35.8734),
    LatLng(lat=32.0141, lng=35.8737),
]

DESTINATION = Destination(
    name="University of Jordan Library",
    address="University of Jordan, Amman, Jordan",
    lat=32.0137,
    lng=35.8739,
)


def handler(request: httpx.Request) -> httpx.Response:
    assert request.headers["X-Goog-Api-Key"] == "test-key"
    assert "X-Goog-FieldMask" in request.headers

    if "places" in str(request.url):
        return httpx.Response(
            200,
            json={
                "places": [
                    {
                        "displayName": {"text": DESTINATION.name},
                        "formattedAddress": DESTINATION.address,
                        "location": {
                            "latitude": DESTINATION.lat,
                            "longitude": DESTINATION.lng,
                        },
                    }
                ]
            },
        )

    return httpx.Response(
        200,
        json={
            "routes": [
                {
                    "polyline": {"encodedPolyline": encode_polyline(POINTS)},
                    "distanceMeters": 123,
                    "duration": "180s",
                    "legs": [
                        {
                            "steps": [
                                {
                                    "navigationInstruction": {
                                        "maneuver": "DEPART",
                                        "instructions": "Head north on the walkway",
                                    },
                                    "startLocation": {
                                        "latLng": {
                                            "latitude": POINTS[0].lat,
                                            "longitude": POINTS[0].lng,
                                        }
                                    },
                                    "endLocation": {
                                        "latLng": {
                                            "latitude": POINTS[1].lat,
                                            "longitude": POINTS[1].lng,
                                        }
                                    },
                                },
                                {
                                    "navigationInstruction": {
                                        "maneuver": "TURN_RIGHT",
                                        "instructions": "Turn right toward the library",
                                    },
                                    "startLocation": {
                                        "latLng": {
                                            "latitude": POINTS[1].lat,
                                            "longitude": POINTS[1].lng,
                                        }
                                    },
                                    "endLocation": {
                                        "latLng": {
                                            "latitude": POINTS[2].lat,
                                            "longitude": POINTS[2].lng,
                                        }
                                    },
                                },
                            ]
                        }
                    ],
                }
            ]
        },
    )


def client() -> GoogleMapsClient:
    return GoogleMapsClient(
        api_key="test-key",
        transport=httpx.MockTransport(handler),
    )


def test_places_search_parses_destination() -> None:
    destination = client().find_place("library", POINTS[0], "en")

    assert destination.name == DESTINATION.name
    assert destination.address == DESTINATION.address
    assert destination.lat == DESTINATION.lat
    assert destination.lng == DESTINATION.lng


def test_routes_parse_steps_and_build_cues() -> None:
    route = client().compute_route(POINTS[0], DESTINATION, "en")

    assert route.provider == "google"
    assert route.distance_m == 123
    assert route.duration_s == 180
    assert len(route.points) == len(POINTS)
    assert route.cues[0].kind == "DEPART"
    assert route.cues[1].kind == "TURN_RIGHT"
    assert route.cues[1].haptic == "right"
    assert route.cues[-1].kind == "ARRIVE"
    assert route.cues[-1].at.lat == DESTINATION.lat
