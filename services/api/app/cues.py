"""Turn provider steps into the single cue contract the app renders.

The LLM never writes a turn instruction. This module owns localization and
the mapping from provider maneuvers to stable cue kinds.
"""

from typing import Any

from .models import Cue, CueKind, Destination, HapticPattern, Lang, LatLng

MANEUVER_TO_KIND: dict[str, CueKind] = {
    "DEPART": "DEPART",
    "TURN_LEFT": "TURN_LEFT",
    "TURN_RIGHT": "TURN_RIGHT",
    "TURN_SLIGHT_LEFT": "TURN_SLIGHT_LEFT",
    "TURN_SLIGHT_RIGHT": "TURN_SLIGHT_RIGHT",
    "TURN_SHARP_LEFT": "TURN_SHARP_LEFT",
    "TURN_SHARP_RIGHT": "TURN_SHARP_RIGHT",
    "UTURN_LEFT": "UTURN_LEFT",
    "UTURN_RIGHT": "UTURN_RIGHT",
    "CONTINUE": "CONTINUE",
    "STRAIGHT": "CONTINUE",
    "NAME_CHANGE": "CONTINUE",
    "ROUNDABOUT_LEFT": "ROUNDABOUT_LEFT",
    "ROUNDABOUT_RIGHT": "ROUNDABOUT_RIGHT",
    "RAMP_LEFT": "RAMP_LEFT",
    "RAMP_RIGHT": "RAMP_RIGHT",
    "FORK_LEFT": "FORK_LEFT",
    "FORK_RIGHT": "FORK_RIGHT",
    "MERGE": "MERGE",
    "ARRIVE": "ARRIVE",
}

SHORT: dict[str, dict[Lang, str]] = {
    "DEPART": {"en": "Start", "ar": "ابدأ"},
    "TURN_LEFT": {"en": "Turn left", "ar": "يسارًا"},
    "TURN_RIGHT": {"en": "Turn right", "ar": "يمينًا"},
    "TURN_SLIGHT_LEFT": {"en": "Bear left", "ar": "يسارًا قليلًا"},
    "TURN_SLIGHT_RIGHT": {"en": "Bear right", "ar": "يمينًا قليلًا"},
    "TURN_SHARP_LEFT": {"en": "Sharp left", "ar": "يسارًا حادًا"},
    "TURN_SHARP_RIGHT": {"en": "Sharp right", "ar": "يمينًا حادًا"},
    "UTURN_LEFT": {"en": "U-turn", "ar": "استدر"},
    "UTURN_RIGHT": {"en": "U-turn", "ar": "استدر"},
    "CONTINUE": {"en": "Continue", "ar": "أكمل"},
    "ROUNDABOUT_LEFT": {"en": "Roundabout", "ar": "دوار"},
    "ROUNDABOUT_RIGHT": {"en": "Roundabout", "ar": "دوار"},
    "RAMP_LEFT": {"en": "Take the ramp", "ar": "خذ المنحدر"},
    "RAMP_RIGHT": {"en": "Take the ramp", "ar": "خذ المنحدر"},
    "FORK_LEFT": {"en": "Keep left", "ar": "ابقَ يسارًا"},
    "FORK_RIGHT": {"en": "Keep right", "ar": "ابقَ يمينًا"},
    "MERGE": {"en": "Merge", "ar": "اندمج"},
    "ARRIVE": {"en": "Arrive", "ar": "الوصول"},
    "WARN": {"en": "Careful", "ar": "انتبه"},
    "LANDMARK": {"en": "Landmark", "ar": "علامة"},
}

HAPTIC: dict[str, HapticPattern] = {
    "TURN_LEFT": "left",
    "TURN_SLIGHT_LEFT": "left",
    "TURN_SHARP_LEFT": "left",
    "UTURN_LEFT": "left",
    "ROUNDABOUT_LEFT": "left",
    "RAMP_LEFT": "left",
    "FORK_LEFT": "left",
    "TURN_RIGHT": "right",
    "TURN_SLIGHT_RIGHT": "right",
    "TURN_SHARP_RIGHT": "right",
    "UTURN_RIGHT": "right",
    "ROUNDABOUT_RIGHT": "right",
    "RAMP_RIGHT": "right",
    "FORK_RIGHT": "right",
    "ARRIVE": "arrive",
    "WARN": "warn",
}


def _latlng(value: Any) -> LatLng | None:
    if not isinstance(value, dict):
        return None
    lat = value.get("latLng", value)
    if not isinstance(lat, dict):
        return None
    latitude = lat.get("latitude")
    longitude = lat.get("longitude")
    if latitude is None or longitude is None:
        return None
    return LatLng(lat=float(latitude), lng=float(longitude))


def _kind_for(maneuver: str, index: int) -> CueKind:
    kind = MANEUVER_TO_KIND.get(maneuver, "CONTINUE")
    if index == 0 and kind != "ARRIVE":
        return "DEPART"
    return kind


def _clean_instruction(instruction: str, fallback: str) -> str:
    text = " ".join((instruction or "").split())
    if not text:
        return fallback
    return text.rstrip(". ")


def _say(kind: CueKind, instruction: str, trigger_m: int, destination: str, lang: Lang) -> str:
    short = SHORT[kind][lang]
    sentence = _clean_instruction(instruction, short)

    if kind == "DEPART":
        if lang == "ar":
            return f"ابدأ المشي. {sentence}."
        return f"Start walking. {sentence}."

    if kind == "ARRIVE":
        if lang == "ar":
            return f"لقد وصلت إلى {destination}."
        return f"You have arrived at {destination}."

    if lang == "ar":
        return f"بعد {trigger_m} مترًا، {sentence}."
    return f"In {trigger_m} meters, {sentence[0].lower() + sentence[1:]}."


def build_cues(steps: list[dict[str, Any]], destination: Destination, lang: Lang) -> list[Cue]:
    """Build cues from Google Routes API steps.

    Google describes the maneuver at the *start* of each step, so the cue is
    anchored to ``startLocation``. The final arrival is pinned to the
    destination even when the provider omits an explicit ARRIVE step.
    """
    cues: list[Cue] = []

    for index, step in enumerate(steps):
        navigation = step.get("navigationInstruction") or {}
        maneuver = str(navigation.get("maneuver") or "CONTINUE").upper()
        kind = _kind_for(maneuver, index)
        trigger_m = 0 if kind == "DEPART" else 12 if kind == "ARRIVE" else 30

        anchor = _latlng(step.get("endLocation") if kind == "ARRIVE" else step.get("startLocation"))
        if anchor is None:
            anchor = _latlng(step.get("endLocation"))
        if anchor is None:
            continue

        instruction = str(navigation.get("instructions") or "")
        cues.append(
            Cue(
                id=f"cue_{len(cues) + 1}",
                kind=kind,
                say=_say(kind, instruction, trigger_m, destination.name, lang),
                detail=_clean_instruction(instruction, SHORT[kind][lang]),
                short=SHORT[kind][lang],
                at=anchor,
                trigger_m=trigger_m,
                haptic=HAPTIC.get(kind, "tick"),
                urgency="normal",
            )
        )

    if not cues or cues[-1].kind != "ARRIVE":
        cues.append(
            Cue(
                id=f"cue_{len(cues) + 1}",
                kind="ARRIVE",
                say=(
                    f"لقد وصلت إلى {destination.name}."
                    if lang == "ar"
                    else f"You have arrived at {destination.name}."
                ),
                detail=(
                    f"لقد وصلت إلى {destination.name}."
                    if lang == "ar"
                    else f"You have arrived at {destination.name}."
                ),
                short=SHORT["ARRIVE"][lang],
                at=LatLng(lat=destination.lat, lng=destination.lng),
                trigger_m=12,
                haptic="arrive",
                urgency="normal",
            )
        )

    return cues
