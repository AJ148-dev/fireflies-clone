from app.services.notes import keep_known_owners, parse_notes


def test_parse_notes_strips_a_json_fence_and_drops_blank_items():
    raw = """```json
    {"summary":" They agreed. ","topics":[{"title":" Scope ","start_seconds":4},{"title":"  "}],"action_items":[{"text":"Send dates","owner":" Maya Chen "},{"text":""}]}
    ```"""
    notes = parse_notes(raw)
    assert notes["summary"] == "They agreed."
    assert notes["topics"] == [{"title": "Scope", "start_seconds": 4.0}]
    assert notes["action_items"] == [{"text": "Send dates", "owner": "Maya Chen"}]


def test_parse_notes_rejects_a_blank_summary():
    assert parse_notes('{"summary":"  ","topics":[],"action_items":[]}') is None


def test_keep_known_owners_drops_names_that_never_speak():
    items = [
        {"text": "Send the draft", "owner": "karan mehta"},
        {"text": "Book the room", "owner": "Legal team"},
        {"text": "Review the cap", "owner": None},
    ]
    kept = keep_known_owners(items, {"Karan Mehta", "Riya Patel"})
    assert [item["owner"] for item in kept] == ["Karan Mehta", None, None]
