"""A realistic University of Jordan demo route.

Mock mode exists so the product can be built, demoed, and tested without a
Google Cloud account. It is not a substitute for real routing: the coordinates
are illustrative, and the demo should be run in simulation mode.
"""

from .geo import encode_polyline
from .models import Cue, Destination, Lang, LatLng, RoutePlan

DEMO_POINTS: list[LatLng] = [
    LatLng(lat=32.01340, lng=35.87340),
    LatLng(lat=32.01390, lng=35.87340),
    LatLng(lat=32.01430, lng=35.87350),
    LatLng(lat=32.01450, lng=35.87390),
    LatLng(lat=32.01420, lng=35.87430),
    LatLng(lat=32.01380, lng=35.87430),
    LatLng(lat=32.01370, lng=35.87390),
    LatLng(lat=32.01350, lng=35.87380),
]

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
    point = DEMO_POINTS[-1]
    return Destination(
        name=_NAMES[key][lang],
        address=_ADDRESS[lang],
        lat=point.lat,
        lng=point.lng,
    )


def _cues(lang: Lang, destination: Destination) -> list[Cue]:
    if lang == "ar":
        data = [
            (
                "DEPART",
                "ابدأ المشي شمالًا نحو الممر الرئيسي.",
                "ابدأ المشي شمالًا نحو الممر الرئيسي.",
                "ابدأ",
                DEMO_POINTS[0],
                0,
                "tick",
            ),
            (
                "TURN_RIGHT",
                "بعد ٣٠ مترًا، انعطف يمينًا نحو ساحة المكتبة.",
                "انعطف يمينًا نحو ساحة المكتبة.",
                "يمينًا",
                DEMO_POINTS[2],
                30,
                "right",
            ),
            (
                "TURN_LEFT",
                "بعد ٣٠ مترًا، انعطف يسارًا عند مدخل المكتبة.",
                "انعطف يسارًا عند مدخل المكتبة.",
                "يسارًا",
                DEMO_POINTS[4],
                30,
                "left",
            ),
            (
                "CONTINUE",
                "أكمل مستقيمًا بعد النافورة لمسافة ٤٠ مترًا.",
                "أكمل مستقيمًا بعد النافورة لمسافة ٤٠ مترًا.",
                "أكمل",
                DEMO_POINTS[6],
                20,
                "tick",
            ),
            (
                "ARRIVE",
                f"لقد وصلت إلى {destination.name}.",
                f"لقد وصلت إلى {destination.name}.",
                "الوصول",
                DEMO_POINTS[-1],
                12,
                "arrive",
            ),
        ]
    else:
        data = [
            (
                "DEPART",
                "Start walking north toward the main walkway.",
                "Start walking north toward the main walkway.",
                "Start",
                DEMO_POINTS[0],
                0,
                "tick",
            ),
            (
                "TURN_RIGHT",
                "In 30 meters, turn right toward the library plaza.",
                "Turn right toward the library plaza.",
                "Turn right",
                DEMO_POINTS[2],
                30,
                "right",
            ),
            (
                "TURN_LEFT",
                "In 30 meters, turn left at the library entrance.",
                "Turn left at the library entrance.",
                "Turn left",
                DEMO_POINTS[4],
                30,
                "left",
            ),
            (
                "CONTINUE",
                "Continue straight past the fountain for 40 meters.",
                "Continue straight past the fountain for 40 meters.",
                "Continue",
                DEMO_POINTS[6],
                20,
                "tick",
            ),
            (
                "ARRIVE",
                f"You have arrived at {destination.name}.",
                f"You have arrived at {destination.name}.",
                "Arrive",
                DEMO_POINTS[-1],
                12,
                "arrive",
            ),
        ]

    cues: list[Cue] = []
    for index, (kind, say, detail, short, at, trigger_m, haptic) in enumerate(data):
        cues.append(
            Cue(
                id=f"cue_{index + 1}",
                kind=kind,  # type: ignore[arg-type]
                say=say,
                detail=detail,
                short=short,
                at=at,
                trigger_m=trigger_m,
                haptic=haptic,  # type: ignore[arg-type]
                urgency="normal",
            )
        )
    return cues


def build_mock_route(destination: Destination, lang: Lang) -> RoutePlan:
    destination = destination.model_copy(
        update={"lat": DEMO_POINTS[-1].lat, "lng": DEMO_POINTS[-1].lng}
    )
    return RoutePlan(
        route_id=f"demo-uj-{lang}",
        destination=destination,
        polyline=encode_polyline(DEMO_POINTS),
        points=DEMO_POINTS,
        distance_m=300,
        duration_s=260,
        cues=_cues(lang, destination),
        provider="mock",
        language=lang,
    )


def demo_route(lang: Lang = "en") -> RoutePlan:
    return build_mock_route(mock_destination("library", lang), lang)
