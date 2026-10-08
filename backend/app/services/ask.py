import os

import httpx

from app.models import Meeting

# Groq's free tier caps tokens per request, so longer transcripts go straight to Gemini
# instead of being answered from a cut-off transcript.
GROQ_TRANSCRIPT_LIMIT = 20000

PROMPT = """You answer questions about one meeting. Use only the transcript below.
Rules:
- If the transcript does not contain the answer, reply exactly: The transcript doesn't cover that.
- After each fact, cite the transcript time it comes from, like [02:15].
- Keep the answer short: a few sentences, or a short list with "- " bullets.
- Plain text only. No headings, tables, or bold.

Meeting: {title}
Participants: {participants}

Transcript:
{transcript}

Question: {question}"""


def has_model_key() -> bool:
    return bool(os.environ.get("GROQ_API_KEY", "").strip() or os.environ.get("GEMINI_API_KEY", "").strip())


def transcript_lines(meeting: Meeting) -> str:
    return "\n".join(f"[{_clock(segment.start_seconds)}] {segment.speaker_name}: {segment.text}" for segment in meeting.segments)


def answer_question(meeting: Meeting, question: str) -> tuple[str, str] | None:
    transcript = transcript_lines(meeting)
    prompt = PROMPT.format(
        title=meeting.title,
        participants=", ".join(link.participant.name for link in meeting.links) or "Unknown",
        transcript=transcript,
        question=question,
    )
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if groq_key and len(transcript) <= GROQ_TRANSCRIPT_LIMIT:
        answer = _ask_groq(groq_key, prompt)
        if answer:
            return answer, "groq"
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if gemini_key:
        answer = _ask_gemini(gemini_key, prompt)
        if answer:
            return answer, "gemini"
    return None


def _ask_groq(key: str, prompt: str) -> str | None:
    model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b").strip() or "openai/gpt-oss-20b"
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": model,
                "temperature": 0.2,
                "max_completion_tokens": 2048,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        response.raise_for_status()
        text = response.json()["choices"][0]["message"]["content"]
        return text.strip() if isinstance(text, str) and text.strip() else None
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        return None


def _ask_gemini(key: str, prompt: str) -> str | None:
    model = os.environ.get("GEMINI_MODEL", "gemini-flash-latest").strip() or "gemini-flash-latest"
    try:
        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            headers={"x-goog-api-key": key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2},
            },
            timeout=30,
        )
        response.raise_for_status()
        parts = response.json()["candidates"][0]["content"]["parts"]
        text = "".join(part.get("text", "") for part in parts if isinstance(part.get("text"), str))
        return text.strip() or None
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        return None


def _clock(seconds: float) -> str:
    total = max(0, int(seconds or 0))
    hours, rest = divmod(total, 3600)
    minutes, secs = divmod(rest, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}" if hours else f"{minutes:02d}:{secs:02d}"
