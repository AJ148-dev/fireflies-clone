from app.services.notes import parse_notes


def test_parse_notes_strips_a_json_fence_and_drops_blank_items():
    raw = """```json
    {"summary":" They agreed. ","topics":[{"title":" Scope ","start_seconds":4},{"title":"  "}],"action_items":[{"text":"Send dates"},{"text":""}]}
    ```"""
    notes = parse_notes(raw)
    assert notes["summary"] == "They agreed."
    assert notes["topics"] == [{"title": "Scope", "start_seconds": 4.0}]
    assert notes["action_items"] == [{"text": "Send dates"}]


def test_parse_notes_rejects_a_blank_summary():
    assert parse_notes('{"summary":"  ","topics":[],"action_items":[]}') is None
