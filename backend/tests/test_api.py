import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("SEED", "0")
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


def _meeting(client, **overrides):
    body = {
        "title": "Pasted sync",
        "started_at": "2026-10-02T15:00:00Z",
        "participant_names": ["Ava Shah"],
        "transcript_format": "txt",
        "transcript_text": "[00:01] Ava Shah: Hello there\n",
        "summary": "A short hello.",
        "topics": [{"title": "Hello", "start_seconds": 1}],
        "action_items": [{"text": "Follow up"}],
    }
    body.update(overrides)
    response = client.post("/api/meetings", json=body)
    assert response.status_code == 201, response.text
    return response.json()


def test_paste_create_survives_reload(client):
    created = _meeting(client)
    again = client.get(f"/api/meetings/{created['id']}")
    assert again.status_code == 200
    body = again.json()
    assert body["segments"][0]["text"] == "Hello there"
    assert body["summary"]["body"] == "A short hello."
    assert body["topics"][0]["title"] == "Hello"
    assert body["topics"][0]["start_seconds"] == 1
    assert body["action_items"][0]["is_done"] is False
    assert body["participants"][0]["name"] == "Ava Shah"


def test_blank_create_survives_reload(client):
    response = client.post(
        "/api/meetings",
        json={
            "title": "Blank meeting",
            "started_at": "2026-10-03T09:30:00Z",
            "participant_names": ["Ava Shah"],
        },
    )
    assert response.status_code == 201
    created = response.json()
    again = client.get(f"/api/meetings/{created['id']}").json()
    assert again["title"] == "Blank meeting"
    assert again["segments"] == []
    assert again["summary"] is None
    assert again["topics"] == []
    assert again["action_items"] == []


@pytest.mark.parametrize(
    ("filename", "content", "expected_speaker"),
    [
        ("notes.txt", b"[00:01] Ava Shah: Plain text cue\n", "Ava Shah"),
        (
            "notes.vtt",
            b"WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nAva Shah: WebVTT cue\n",
            "Ava Shah",
        ),
        (
            "notes.json",
            b'[{"speaker":"Ava Shah","start":1,"text":"JSON cue"}]',
            "Ava Shah",
        ),
    ],
)
def test_upload_formats_survive_reload(client, filename, content, expected_speaker):
    response = client.post(
        "/api/meetings/import",
        data={
            "title": f"Imported {filename}",
            "started_at": "2026-10-03T09:30:00Z",
            "participant_names": "Ava Shah, Noah Kim",
        },
        files={"file": (filename, content, "text/plain")},
    )
    assert response.status_code == 201, response.text
    created = response.json()
    again = client.get(f"/api/meetings/{created['id']}").json()
    assert again["segments"][0]["speaker_name"] == expected_speaker
    assert [person["name"] for person in again["participants"]] == ["Ava Shah", "Noah Kim"]


def test_bad_upload_is_400(client):
    response = client.post(
        "/api/meetings/import",
        data={"title": "Bad", "started_at": "2026-10-02T15:00:00Z"},
        files={"file": ("notes.txt", b"not a transcript", "text/plain")},
    )
    assert response.status_code == 400
    assert "expected" in response.json()["detail"]
    unsupported = client.post(
        "/api/meetings/import",
        data={"title": "Bad", "started_at": "2026-10-02T15:00:00Z"},
        files={"file": ("notes.csv", b"speaker,start,text", "text/csv")},
    )
    assert unsupported.status_code == 400


def test_library_filters_participant_and_date(client):
    _meeting(client)
    _meeting(
        client,
        title="Older internal",
        started_at="2026-01-02T12:00:00Z",
        participant_names=["Noah Kim"],
        transcript_text="[00:01] Noah Kim: Internal only\n",
    )
    found = client.get("/api/meetings", params={"q": "Ava", "from": "2026-10-02", "to": "2026-10-02"})
    assert found.status_code == 200
    assert [item["title"] for item in found.json()] == ["Pasted sync"]
    missed = client.get("/api/meetings", params={"from": "2026-01-01", "to": "2026-01-01"})
    assert missed.json() == []
    oldest = client.get("/api/meetings", params={"sort": "oldest"})
    assert [item["title"] for item in oldest.json()] == ["Older internal", "Pasted sync"]


def test_patch_and_delete(client):
    created = _meeting(client)
    patched = client.patch(
        f"/api/meetings/{created['id']}",
        json={"title": "Renamed", "participant_names": ["Noah Kim"]},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Renamed"
    assert patched.json()["participants"][0]["name"] == "Noah Kim"
    assert patched.json()["segments"] == created["segments"]
    assert patched.json()["summary"] == created["summary"]
    assert patched.json()["topics"] == created["topics"]
    assert patched.json()["action_items"] == created["action_items"]
    assert client.delete(f"/api/meetings/{created['id']}").status_code == 204
    assert client.get(f"/api/meetings/{created['id']}").status_code == 404


def test_meeting_title_is_trimmed_and_cannot_be_blank(client):
    created = _meeting(client, title="  Trimmed title  ")
    assert created["title"] == "Trimmed title"

    assert client.post(
        "/api/meetings",
        json={"title": "   ", "started_at": "2026-10-02T15:00:00Z"},
    ).status_code == 422
    assert client.patch(f"/api/meetings/{created['id']}", json={"title": "   "}).status_code == 422
    assert client.get(f"/api/meetings/{created['id']}").json()["title"] == "Trimmed title"


def test_action_item_toggle(client):
    created = _meeting(client)
    item_id = created["action_items"][0]["id"]
    updated = client.patch(f"/api/action-items/{item_id}", json={"is_done": True, "text": "Follow up tomorrow"})
    assert updated.status_code == 200
    assert updated.json()["is_done"] is True
    assert updated.json()["text"] == "Follow up tomorrow"
    added = client.post(f"/api/meetings/{created['id']}/action-items", json={"text": "Second task"})
    assert added.status_code == 201
    detail = client.get(f"/api/meetings/{created['id']}").json()
    assert [item["text"] for item in detail["action_items"]] == ["Follow up tomorrow", "Second task"]

    assert client.post(f"/api/meetings/{created['id']}/action-items", json={"text": "   "}).status_code == 422
    assert client.patch(f"/api/action-items/{item_id}", json={"text": "   "}).status_code == 422

    assert client.delete(f"/api/action-items/{item_id}").status_code == 204
    detail = client.get(f"/api/meetings/{created['id']}").json()
    assert [item["text"] for item in detail["action_items"]] == ["Second task"]


def test_action_item_missing_ids_and_meeting_cascade(client):
    assert client.post("/api/meetings/999/action-items", json={"text": "Missing"}).status_code == 404
    assert client.patch("/api/action-items/999", json={"is_done": True}).status_code == 404
    assert client.delete("/api/action-items/999").status_code == 404

    created = _meeting(client)
    item_id = created["action_items"][0]["id"]
    assert client.delete(f"/api/meetings/{created['id']}").status_code == 204
    assert client.patch(f"/api/action-items/{item_id}", json={"is_done": True}).status_code == 404
