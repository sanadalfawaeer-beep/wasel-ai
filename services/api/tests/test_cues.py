from app.cues import build_cues
from app.geo import decode_polyline, encode_polyline
from app.models import Destination, LatLng


def _step(maneuver: str, instructions: str, start, end) -> dict:
    return {
        "navigationInstruction": {"maneuver": maneuver, "instructions": instructions},
        "startLocation": {"latLng": {"latitude": start[0], "longitude": start[1]}},
        "endLocation": {"latLng": {"latitude": end[0], "longitude": end[1]}},
        "distanceMeters": 80,
    }


DESTINATION = Destination(
    name="University of Jordan Library",
    address="Amman",
    lat=32.0137,
    lng=35.8739,
)


def test_builds_depart_turn_and_arrival() -> None:
    steps = [
        _step("DEPART", "Head north on the main walkway", (32.0134, 35.8734), (32.0138, 35.8734)),
        _step(
            "TURN_RIGHT",
            "Turn right toward the library plaza",
            (32.0138, 35.8734),
            (32.0141, 35.8737),
        ),
        _step("ARRIVE", "Arrive at the library", (32.0141, 35.8737), (32.0137, 35.8739)),
    ]

    cues = build_cues(steps, DESTINATION, "en")

    assert [cue.kind for cue in cues] == ["DEPART", "TURN_RIGHT", "ARRIVE"]
    assert cues[0].trigger_m == 0
    assert cues[0].say.startswith("Start walking.")
    assert cues[1].haptic == "right"
    assert "turn right" in cues[1].say.lower()
    assert cues[2].haptic == "arrive"
    assert "arrived" in cues[2].say.lower()
    assert cues[2].at.lat == DESTINATION.lat


def test_adds_arrival_when_provider_omits_it() -> None:
    steps = [
        _step("DEPART", "Head north", (32.0134, 35.8734), (32.0138, 35.8734)),
        _step("TURN_LEFT", "Turn left at the entrance", (32.0138, 35.8734), (32.0141, 35.8737)),
    ]

    cues = build_cues(steps, DESTINATION, "en")

    assert cues[-1].kind == "ARRIVE"
    assert cues[-1].trigger_m == 12
    assert cues[-1].at.lat == DESTINATION.lat


def test_arabic_localization() -> None:
    steps = [
        _step("DEPART", "ابدأ شمالًا", (32.0134, 35.8734), (32.0138, 35.8734)),
        _step("TURN_RIGHT", "انعطف يمينًا", (32.0138, 35.8734), (32.0141, 35.8737)),
    ]

    cues = build_cues(steps, DESTINATION, "ar")

    assert cues[0].short == "ابدأ"
    assert cues[1].short == "يمينًا"
    assert "بعد" in cues[1].say
    assert cues[-1].say.startswith("لقد وصلت")


def test_polyline_round_trip() -> None:
    points = [
        LatLng(lat=32.0134, lng=35.8734),
        LatLng(lat=32.0145, lng=35.8739),
        LatLng(lat=32.0137, lng=35.8739),
    ]

    decoded = decode_polyline(encode_polyline(points))

    assert len(decoded) == len(points)
    for original, result in zip(points, decoded, strict=True):
        assert abs(original.lat - result.lat) < 0.00002
        assert abs(original.lng - result.lng) < 0.00002
