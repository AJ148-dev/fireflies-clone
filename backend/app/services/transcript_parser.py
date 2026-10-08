import json
import re

_TXT_LINE = re.compile(
    r"^\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s+([^:]{1,60}):\s*(.+)$"
)
_VTT_TIME = re.compile(
    r"^((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s+-->\s+((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})"
)
_SPEAKER = re.compile(r"^([A-Za-z][A-Za-z .'\-]{0,40}):\s*(.*)$")


def parse_transcript(text: str, fmt: str) -> list[dict]:
    kind = (fmt or "").lower().lstrip(".")
    if kind == "json":
        segments = _parse_json(text)
    elif kind == "vtt":
        segments = _parse_vtt(text)
    elif kind == "txt":
        segments = _parse_txt(text)
    else:
        raise ValueError("expected transcript format txt, vtt, or json")
    if not segments:
        raise ValueError("expected at least one transcript line")
    for index, segment in enumerate(segments):
        segment["position"] = index
    return segments


def _parse_json(text: str) -> list[dict]:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("expected a JSON array of cues") from exc
    if not isinstance(payload, list):
        raise ValueError("expected a JSON array of cues")
    segments = []
    for item in payload:
        if not isinstance(item, dict):
            raise ValueError("expected each JSON cue to be an object")
        raw_start = item.get("start", item.get("start_seconds"))
        if raw_start is None:
            raise ValueError("expected each cue to include start or start_seconds")
        start = float(raw_start)
        if start < 0:
            raise ValueError("expected start times to be zero or greater")
        cue_text = item.get("text")
        if not isinstance(cue_text, str) or not cue_text.strip():
            raise ValueError("expected each cue to include text")
        raw_end = item.get("end", item.get("end_seconds"))
        end = float(raw_end) if raw_end is not None else None
        speaker = item.get("speaker") or item.get("speaker_name") or "Speaker"
        segments.append(
            {
                "speaker_name": str(speaker).strip() or "Speaker",
                "start_seconds": start,
                "end_seconds": end,
                "text": cue_text.strip(),
            }
        )
    return segments


def _parse_txt(text: str) -> list[dict]:
    segments = []
    for line_number, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            continue
        match = _TXT_LINE.match(line)
        if not match:
            raise ValueError(
                "expected lines like [mm:ss] Name: text "
                f"(line {line_number} did not match)"
            )
        first, second, third, speaker, cue = match.groups()
        if third is None:
            start = int(first) * 60 + int(second)
        else:
            start = int(first) * 3600 + int(second) * 60 + int(third)
        segments.append(
            {
                "speaker_name": speaker.strip(),
                "start_seconds": float(start),
                "end_seconds": None,
                "text": cue.strip(),
            }
        )
    return segments


def _parse_vtt(text: str) -> list[dict]:
    normalized = text.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n").strip()
    segments = []
    for block in re.split(r"\n\s*\n", normalized):
        lines = [line.strip() for line in block.split("\n") if line.strip()]
        if not lines or lines[0].upper().startswith("WEBVTT") or lines[0].upper().startswith("NOTE"):
            continue
        time_index = next((i for i, line in enumerate(lines) if _VTT_TIME.match(line)), None)
        if time_index is None:
            continue
        timing = _VTT_TIME.match(lines[time_index])
        payload = lines[time_index + 1 :]
        if not payload:
            raise ValueError("expected each VTT cue to include text")
        speaker, cue_text = _split_speaker(payload)
        if not cue_text:
            raise ValueError("expected each VTT cue to include text")
        segments.append(
            {
                "speaker_name": speaker,
                "start_seconds": _vtt_seconds(timing.group(1)),
                "end_seconds": _vtt_seconds(timing.group(2)),
                "text": cue_text,
            }
        )
    return segments


def _split_speaker(lines: list[str]) -> tuple[str, str]:
    match = _SPEAKER.match(lines[0])
    if match and match.group(1).strip():
        parts = [match.group(2), *lines[1:]]
        speaker = match.group(1).strip()
    else:
        parts = lines
        speaker = "Speaker"
    text = " ".join(part.strip() for part in parts if part.strip())
    return speaker, text


def _vtt_seconds(value: str) -> float:
    clock, fraction = value.replace(",", ".").split(".")
    pieces = [int(part) for part in clock.split(":")]
    if len(pieces) == 3:
        hours, minutes, seconds = pieces
    else:
        hours = 0
        minutes, seconds = pieces
    width = len(fraction)
    return hours * 3600 + minutes * 60 + seconds + int(fraction) / (10 ** width)
