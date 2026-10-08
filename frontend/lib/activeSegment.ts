export function activeSegmentIndex(
  segments: { start_seconds: number }[],
  timeSeconds: number,
): number {
  let active = -1;
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index].start_seconds <= timeSeconds + 1e-6) active = index;
  }
  return active;
}
