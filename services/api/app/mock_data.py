"""Four realistic University of Jordan demo destinations.

Mock mode exists so the product can be built, demoed, and tested without a
Google Cloud account. The coordinates are illustrative; the demo should run in
simulation mode.
"""

from dataclasses import dataclass

from .cues import HAPTIC, SHORT
from .geo import encode_polyline, path_length_m
from .models import Cue, CueKind, Destination, Lang, LatLng, RoutePlan

_NAMES: dict[str, dict[Lang, str]] = {
    "library": {
        "en": "University of Jordan Library",
        "ar": "مكتبة الجامعة الأردنية",
    },
    "gate": {
        "en": "University of Jordan Main Gate",
        "ar": "البوابة الرئيسية للجامعة الأردنية",
    },
    "student": {
        "en": "University of Jordan Student Center",
        "ar": "مركز الطلبة في الجامعة الأردنية",
    },
    "pharmacy": {
        "en": "University Pharmacy",
        "ar": "صيدلية الجامعة",
    },
}

_ADDRESS: dict[Lang, str] = {
    "en": "University of Jordan, Amman, Jordan",
    "ar": "الجامعة الأردنية، عمّان، الأردن",
}


@dataclass(frozen=True)
class MockRouteDef:
    points: list[LatLng]
    cue_indices: list[int]
    en: tuple[str, str, str, str]
    ar: tuple[str, str, str, str]


ROUTE_DEFS: dict[str, MockRouteDef] = {
    "library": MockRouteDef(
        points=[
            LatLng(lat=32.01340, lng=35.87340),
            LatLng(lat=32.01390, lng=35.87340),
            LatLng(lat=32.01430, lng=35.87350),
            LatLng(lat=32.01450, lng=35.87390),
            LatLng(lat=32.01420, lng=35.87430),
            LatLng(lat=32.01380, lng=35.87430),
            LatLng(lat=32.01370, lng=35.87390),
            LatLng(lat=32.01350, lng=35.87380),
        ],
        cue_indices=[0, 2, 4, 6, 7],
        en=(
            "Start walking north toward the main walkway.",
            "Turn right toward the library plaza.",
            "Turn left at the library entrance.",
            "Continue straight past the fountain for 40 meters.",
        ),
        ar=(
            "ابدأ المشي شمالًا نحو الممر الرئيسي.",
            "انعطف يمينًا نحو ساحة المكتبة.",
            "انعطف يسارًا عند مدخل المكتبة.",
            "أكمل مستقيمًا بعد النافورة لمسافة ٤٠ مترًا.",
        ),
    ),
    "gate": MockRouteDef(
        points=[
            LatLng(lat=32.01370, lng=35.87390),
            LatLng(lat=32.01340, lng=35.87370),
            LatLng(lat=32.01300, lng=35.87340),
            LatLng(lat=32.01280, lng=35.87310),
            LatLng(lat=32.01270, lng=35.87280),
        ],
        cue_indices=[0, 1, 2, 3, 4],
        en=(
            "Start walking west toward the main gate.",
            "Turn right at the campus road.",
            "Turn left toward the gate entrance.",
            "Continue straight to the main gate.",
        ),
        ar=(
            "ابدأ المشي غربًا نحو البوابة الرئيسية.",
            "انعطف يمينًا عند الطريق الداخلي.",
            "انعطف يسارًا نحو مدخل البوابة.",
            "أكمل مستقيمًا حتى البوابة الرئيسية.",
        ),
    ),
    "student": MockRouteDef(
        points=[
            LatLng(lat=32.01340, lng=35.87340),
            LatLng(lat=32.01360, lng=35.87400),
            LatLng(lat=32.01390, lng=35.87450),
            LatLng(lat=32.01430, lng=35.87490),
            LatLng(lat=32.01470, lng=35.87520),
        ],
        cue_indices=[0, 1, 2, 3, 4],
        en=(
            "Start walking east toward the student center.",
            "Turn right past the courtyard.",
            "Turn left at the student center entrance.",
            "Continue straight to the main doors.",
        ),
        ar=(
            "ابدأ المشي شرقًا نحو مركز الطلبة.",
            "انعطف يمينًا بعد الساحة.",
            "انعطف يسارًا عند مدخل مركز الطلبة.",
            "أكمل مستقيمًا حتى الأبواب الرئيسية.",
        ),
    ),
    "pharmacy": MockRouteDef(
        points=[
            LatLng(lat=32.01340, lng=35.87340),
            LatLng(lat=32.01300, lng=35.87380),
            LatLng(lat=32.01280, lng=35.87430),
            LatLng(lat=32.01260, lng=35.87470),
            LatLng(lat=32.01260, lng=35.87500),
        ],
        cue_indices=[0, 1, 2, 3, 4],
        en=(
            "Start walking south toward the health services building.",
            "Turn right at the clinic path.",
            "Turn left toward the pharmacy entrance.",
            "Continue straight to the pharmacy.",
        ),
        ar=(
            "ابدأ المشي جنوبًا نحو مبنى الخدمات الصحية.",
            "انعطف يمينًا عند ممر العيادة.",
            "انعطف يسارًا نحو مدخل الصيدلية.",
            "أكمل مستقيمًا حتى الصيدلية.",
        ),
    ),
}


def _key_for(query: str) -> str:
    value = (query or "").lower()
    if "gate" in value or "بوابة" in value:
        return "gate"
    if "student" in value or "طلبة" in value:
        return "student"
    if "pharmacy" in value or "صيدلية" in value:
        return "pharmacy"
    return "library"


def mock_destination(query: str, lang: Lang) -> Destination:
    key = _key_for(query)
    point = ROUTE_DEFS[key].points[-1]
    return Destination(
        name=_NAMES[key][lang],
        address=_ADDRESS[lang],
        lat=point.lat,
        lng=point.lng,
    )


def _spoken(kind: CueKind, text: str, trigger_m: int, lang: Lang) -> str:
    if kind in ("DEPART", "ARRIVE"):
        return text
    if lang == "ar":
        return f"بعد {trigger_m} مترًا، {text}"
    return f"In {trigger_m} meters, {text[0].lower() + text[1:]}"


def _cues(
    key: str,
    lang: Lang,
    destination: Destination,
    points: list[LatLng],
    cue_indices: list[int],
) -> list[Cue]:
    definition = ROUTE_DEFS[key]
    texts = definition.ar if lang == "ar" else definition.en
    arrival = (
        f"لقد وصلت إلى {destination.name}."
        if lang == "ar"
        else f"You have arrived at {destination.name}."
    )

    specs: list[tuple[CueKind, str, int]] = [
        ("DEPART", texts[0], 0),
        ("TURN_RIGHT", texts[1], 30),
        ("TURN_LEFT", texts[2], 30),
        ("CONTINUE", texts[3], 20),
        ("ARRIVE", arrival, 12),
    ]

    cues: list[Cue] = []
    for index, (kind, detail, trigger_m) in enumerate(specs):
        at = points[min(cue_indices[index], len(points) - 1)]
        cues.append(
            Cue(
                id=f"cue_{index + 1}",
                kind=kind,
                say=_spoken(kind, detail, trigger_m, lang),
                detail=detail,
                short=SHORT[kind][lang],
                at=at,
                trigger_m=trigger_m,
                haptic=HAPTIC.get(kind, "tick"),
                urgency="normal",
            )
        )
    return cues


def build_mock_route(destination: Destination, lang: Lang) -> RoutePlan:
    key = _key_for(destination.name)
    definition = ROUTE_DEFS[key]
    points = definition.points
    destination = destination.model_copy(
        update={"lat": points[-1].lat, "lng": points[-1].lng}
    )
    distance_m = round(path_length_m(points))
    duration_s = max(60, round(distance_m / 1.2))

    return RoutePlan(
        route_id=f"demo-uj-{key}-{lang}",
        destination=destination,
        polyline=encode_polyline(points),
        points=points,
        distance_m=distance_m,
        duration_s=duration_s,
        cues=_cues(key, lang, destination, points, definition.cue_indices),
        provider="mock",
        language=lang,
    )


def demo_route(lang: Lang = "en") -> RoutePlan:
    return build_mock_route(mock_destination("library", lang), lang)
