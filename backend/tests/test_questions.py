import httpx
import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("SEED", "0")
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("GROQ_API_KEY", "")
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


def _meeting(client, transcript="[00:01] Ava Shah: We ship on Friday.\n"):
    response = client.post(
        "/api/meetings",
        json={
            "title": "Launch sync",
            "started_at": "2026-10-02T15:00:00Z",
            "participant_names": ["Ava Shah"],
            "transcript_format": "txt",
            "transcript_text": transcript,
            "summary": "Ship date.",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def _reply(url: str, text: str) -> httpx.Response:
    request = httpx.Request("POST", url)
    if "groq" in url:
        return httpx.Response(200, request=request, json={"choices": [{"message": {"content": text}}]})
    return httpx.Response(200, request=request, json={"candidates": [{"content": {"parts": [{"text": text}]}}]})


def test_groq_answers_and_history_is_saved(client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "groq-key")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-key")
    prompts = []

    def fake_post(url, **kwargs):
        prompts.append(kwargs["json"]["messages"][0]["content"])
        return _reply(url, "They ship on Friday [00:01].")

    monkeypatch.setattr("app.services.ask.httpx.post", fake_post)
    meeting_id = _meeting(client)
    asked = client.post(f"/api/meetings/{meeting_id}/questions", json={"question": "  When do we ship?  "})
    assert asked.status_code == 201, asked.text
    assert asked.json()["question"] == "When do we ship?"
    assert asked.json()["provider"] == "groq"
    assert "[00:01] Ava Shah: We ship on Friday." in prompts[0]
    assert "Question: When do we ship?" in prompts[0]

    history = client.get(f"/api/meetings/{meeting_id}/questions").json()
    assert [item["answer"] for item in history] == ["They ship on Friday [00:01]."]


def test_gemini_answers_when_groq_fails(client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "groq-key")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-key")

    def fake_post(url, **kwargs):
        if "groq" in url:
            return httpx.Response(429, request=httpx.Request("POST", url))
        return _reply(url, "Friday [00:01].")

    monkeypatch.setattr("app.services.ask.httpx.post", fake_post)
    meeting_id = _meeting(client)
    asked = client.post(f"/api/meetings/{meeting_id}/questions", json={"question": "When?"})
    assert asked.status_code == 201
    assert asked.json()["provider"] == "gemini"


def test_long_transcript_skips_groq(client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "groq-key")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-key")
    urls = []

    def fake_post(url, **kwargs):
        urls.append(url)
        return _reply(url, "Friday [00:01].")

    monkeypatch.setattr("app.services.ask.httpx.post", fake_post)
    long_line = "word " * 5000
    meeting_id = _meeting(client, transcript=f"[00:01] Ava Shah: {long_line}\n")
    asked = client.post(f"/api/meetings/{meeting_id}/questions", json={"question": "When?"})
    assert asked.status_code == 201
    assert all("groq" not in url for url in urls)


def test_failed_answer_is_not_saved(client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "groq-key")
    monkeypatch.setattr(
        "app.services.ask.httpx.post",
        lambda url, **kwargs: httpx.Response(503, request=httpx.Request("POST", url)),
    )
    meeting_id = _meeting(client)
    asked = client.post(f"/api/meetings/{meeting_id}/questions", json={"question": "When?"})
    assert asked.status_code == 502
    assert client.get(f"/api/meetings/{meeting_id}/questions").json() == []


def test_missing_key_blank_question_and_missing_meeting(client):
    meeting_id = _meeting(client)
    assert client.post(f"/api/meetings/{meeting_id}/questions", json={"question": "When?"}).status_code == 503
    assert client.post(f"/api/meetings/{meeting_id}/questions", json={"question": "   "}).status_code == 422
    assert client.post("/api/meetings/9999/questions", json={"question": "When?"}).status_code == 404
    assert client.get("/api/meetings/9999/questions").status_code == 404


def test_questions_are_deleted_with_the_meeting(client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "groq-key")
    monkeypatch.setattr("app.services.ask.httpx.post", lambda url, **kwargs: _reply(url, "Friday [00:01]."))
    meeting_id = _meeting(client)
    client.post(f"/api/meetings/{meeting_id}/questions", json={"question": "When?"})
    assert client.delete(f"/api/meetings/{meeting_id}").status_code == 204
    assert client.get(f"/api/meetings/{meeting_id}/questions").status_code == 404
