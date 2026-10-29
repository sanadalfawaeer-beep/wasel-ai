from math import asin, cos, radians, sin, sqrt

from .models import LatLng

EARTH_RADIUS_M = 6_371_000.0


def haversine_m(a: LatLng, b: LatLng) -> float:
    """Great-circle distance in metres."""
    lat1, lat2 = radians(a.lat), radians(b.lat)
    dlat = lat2 - lat1
    dlng = radians(b.lng - a.lng)
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_M * asin(sqrt(h))


def path_length_m(points: list[LatLng]) -> float:
    return sum(haversine_m(points[i], points[i + 1]) for i in range(len(points) - 1))


def decode_polyline(encoded: str) -> list[LatLng]:
    """Decode a Google encoded polyline into LatLng points."""
    if not encoded:
        return []

    points: list[LatLng] = []
    index = 0
    lat = 0
    lng = 0
    length = len(encoded)

    while index < length:
        result = 0
        shift = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break
        delta_lat = ~(result >> 1) if result & 1 else result >> 1
        lat += delta_lat

        result = 0
        shift = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break
        delta_lng = ~(result >> 1) if result & 1 else result >> 1
        lng += delta_lng

        points.append(LatLng(lat=lat / 1e5, lng=lng / 1e5))

    return points


def encode_polyline(points: list[LatLng]) -> str:
    """Encode points in the Google polyline format (used by the mock route)."""
    output: list[str] = []
    last_lat = 0
    last_lng = 0

    def encode_value(value: int) -> None:
        value = ~(value << 1) if value < 0 else value << 1
        while value >= 0x20:
            output.append(chr((0x20 | (value & 0x1F)) + 63))
            value >>= 5
        output.append(chr(value + 63))

    for point in points:
        lat = round(point.lat * 1e5)
        lng = round(point.lng * 1e5)
        encode_value(lat - last_lat)
        encode_value(lng - last_lng)
        last_lat, last_lng = lat, lng

    return "".join(output)
