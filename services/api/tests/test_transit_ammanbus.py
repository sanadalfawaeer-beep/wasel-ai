from datetime import datetime

import pytest

from app.maps import MapsError
from app.models import Destination, LatLng
from app.transit_ammanbus import AMMAN_TZ, AmmanBusClient, load_snapshot


def test_snapshot_contains_the_amman_bus_network() -> None:
    snapshot = load_snapshot()
    assert snapshot["route_count"] > 100
    assert any(route["display_code"] == "99" for route in snapshot["routes"])


def test_ammanbus_plans_a_direct_scheduled_trip() -> None:
    client = AmmanBusClient()
    result = client.plan(
        "Sweileh",
        LatLng(lat=31.9539, lng=35.9106),
        "en",
        Destination(name="Sweileh", address="Amman", lat=32.0197, lng=35.8347),
        now=datetime(2026, 11, 4, 8, 0, tzinfo=AMMAN_TZ),
    )

    assert result.provider == "ammanbus"
    assert result.demo is False
    assert result.itineraries
    first = result.itineraries[0]
    assert first.demo is False
    assert first.realtime is False
    assert first.next_departures_min
    bus = next(leg for leg in first.legs if leg.mode == "BUS")
    assert bus.line.startswith(("BRT ", "Bus "))
    assert bus.board_stop
    assert bus.alight_stop
    assert bus.occupancy == "unknown"


def test_ammanbus_requires_a_resolvable_destination() -> None:
    client = AmmanBusClient()
    with pytest.raises(MapsError):
        client.plan(
            "A place with no known coordinates",
            LatLng(lat=31.9539, lng=35.9106),
            "en",
            None,
            now=datetime(2026, 11, 4, 8, 0, tzinfo=AMMAN_TZ),
        )
