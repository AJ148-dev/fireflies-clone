import pytest

from app.services.transcript_parser import parse_transcript


def test_parses_json_with_start_seconds():
    raw = """
    [
      {"speaker": "Ava Shah", "start": 12.5, "end": 18, "text": "We should ship Friday."},
      {"speaker": "Noah Kim", "start_seconds": 19, "text": "I can take the notes."}
    ]
    """
    segments = parse_transcript(raw, "json")
    assert segments == [
        {
            "speaker_name": "Ava Shah",
            "start_seconds": 12.5,
            "end_seconds": 18.0,
            "text": "We should ship Friday.",
            "position": 0,
        },
        {
            "speaker_name": "Noah Kim",
            "start_seconds": 19.0,
            "end_seconds": None,
            "text": "I can take the notes.",
            "position": 1,
        },
    ]


def test_parses_txt_mm_ss_and_hh_mm_ss():
    raw = """
    [00:12] Ava Shah: Opening the review.
    [01:02:03] Noah Kim: The date slips a week.
    """
    segments = parse_transcript(raw, "txt")
    assert [item["start_seconds"] for item in segments] == [12, 3723]
    assert segments[0]["speaker_name"] == "Ava Shah"
    assert segments[1]["text"] == "The date slips a week."
    assert segments[1]["position"] == 1


def test_parses_vtt_speaker_prefix_and_default_speaker():
    raw = """WEBVTT

00:00:01.000 --> 00:00:04.500
Ava Shah: The outline is on the right.

00:00:05.000 --> 00:00:08.000
No label on this cue.
"""
    segments = parse_transcript(raw, "vtt")
    assert segments[0]["speaker_name"] == "Ava Shah"
    assert segments[0]["start_seconds"] == 1
    assert segments[0]["end_seconds"] == 4.5
    assert segments[0]["text"] == "The outline is on the right."
    assert segments[1]["speaker_name"] == "Speaker"
    assert segments[1]["text"] == "No label on this cue."


def test_rejects_empty_txt():
    with pytest.raises(ValueError, match="expected"):
        parse_transcript("hello without a timestamp\n", "txt")


def test_rejects_json_that_is_not_a_list_of_cues():
    with pytest.raises(ValueError):
        parse_transcript('{"speaker": "Ava", "start": 1, "text": "Hi"}', "json")


def test_rejects_negative_start():
    with pytest.raises(ValueError):
        parse_transcript('[{"speaker": "Ava", "start": -1, "text": "Hi"}]', "json")
