import json
import os
import re

import httpx

_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)

PROMPT = """You write meeting notes from a transcript. Return only JSON with this shape:
{"summary":"...","topics":[{"title":"...","start_seconds":0}],"action_items":[{"text":"..."}]}
Rules:
- Use only facts stated in the transcript.
- Do not invent owners, deadlines, or decisions.
- summary is one short paragraph.
- topics are 1 to 6 chapter titles. start_seconds is a number from the transcript, or null.
- action_items are concrete tasks the transcript states. If none, use an empty list.

Transcript:
"""


def load_env_file() -> None:
    path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            text = line.strip()
            if not text or text.startswith("#") or "=" not in text:
                continue
            key, value = text.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def apply_generated_notes(payload: dict) -> tuple[dict, str]:
    if (payload.get("summary") or "").strip():
        return payload, "provided"
    transcript = (payload.get("transcript_text") or "").strip()
    if not transcript or not _has_model_key():
        return payload, "skipped"
    notes = generate_notes(transcript)
    if notes is None:
        return payload, "failed"
    return {**payload, **notes}, "generated"


def _has_model_key() -> bool:
    return bool(os.environ.get("GROQ_API_KEY", "").strip() or os.environ.get("GEMINI_API_KEY", "").strip())


def generate_notes(transcript: str) -> dict | None:
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if groq_key:
        notes = _request_groq(groq_key, transcript)
        if notes is not None:
            return notes
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not gemini_key:
        return None
    model = os.environ.get("GEMINI_MODEL", "gemini-flash-latest").strip() or "gemini-flash-latest"
    models = [model]
    if "gemini-flash-latest" not in models:
        models.append("gemini-flash-latest")
    for name in models:
        notes = _request_notes(gemini_key, name, transcript)
        if notes is not None:
            return notes
    return None


def _request_groq(key: str, transcript: str) -> dict | None:
    model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b").strip() or "openai/gpt-oss-20b"
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": model,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [{"role": "user", "content": PROMPT + transcript[:12000]}],
            },
            timeout=25,
        )
        if response.status_code in {401, 404, 429, 503}:
            return None
        response.raise_for_status()
        text = response.json()["choices"][0]["message"]["content"]
        return parse_notes(text)
    except (httpx.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError, ValueError):
        return None


def _request_notes(key: str, model: str, transcript: str) -> dict | None:
    try:
        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            headers={"x-goog-api-key": key},
            json={
                "contents": [{"parts": [{"text": PROMPT + transcript[:20000]}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
            },
            timeout=25,
        )
        if response.status_code in {404, 429, 503}:
            return None
        response.raise_for_status()
        parts = response.json()["candidates"][0]["content"]["parts"]
        text = "".join(part.get("text", "") for part in parts if isinstance(part.get("text"), str))
        return parse_notes(text)
    except (httpx.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError, ValueError):
        return None


def parse_notes(raw: str) -> dict | None:
    cleaned = _FENCE.sub("", raw.strip())
    data = json.loads(cleaned)
    if not isinstance(data, dict):
        return None
    summary = data.get("summary")
    if not isinstance(summary, str) or not summary.strip():
        return None
    return {
        "summary": summary.strip(),
        "topics": _topics(data.get("topics")),
        "action_items": _actions(data.get("action_items")),
    }


def _topics(value) -> list[dict]:
    if not isinstance(value, list):
        return []
    topics = []
    for item in value:
        if not isinstance(item, dict):
            continue
        title = item.get("title")
        if not isinstance(title, str) or not title.strip():
            continue
        start = item.get("start_seconds")
        topics.append(
            {
                "title": title.strip()[:200],
                "start_seconds": float(start) if isinstance(start, (int, float)) else None,
            }
        )
        if len(topics) == 6:
            break
    return topics


def _actions(value) -> list[dict]:
    if not isinstance(value, list):
        return []
    actions = []
    for item in value:
        text = item.get("text") if isinstance(item, dict) else None
        if not isinstance(text, str) or not text.strip():
            continue
        actions.append({"text": text.strip()})
        if len(actions) == 12:
            break
    return actions
