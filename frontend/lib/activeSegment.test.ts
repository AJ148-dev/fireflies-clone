import assert from "node:assert/strict";
import test from "node:test";

import { activeSegmentIndex } from "./activeSegment.ts";

const segments = [{ start_seconds: 4 }, { start_seconds: 12 }, { start_seconds: 28 }];

test("playhead before the first line is not on a segment", () => {
  assert.equal(activeSegmentIndex(segments, 0), -1);
});

test("playhead selects the latest line that has already started", () => {
  assert.equal(activeSegmentIndex(segments, 12), 1);
  assert.equal(activeSegmentIndex(segments, 20), 1);
  assert.equal(activeSegmentIndex(segments, 90), 2);
});
