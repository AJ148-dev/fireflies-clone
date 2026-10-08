export type Participant = { id: number; name: string };

export type MeetingCard = {
  id: number;
  title: string;
  started_at: string;
  duration_seconds: number;
  participants: Participant[];
  snippet?: string;
};

export type SegmentComment = { id: number; body: string };

export type Segment = {
  id: number;
  speaker_name: string;
  start_seconds: number;
  end_seconds: number | null;
  text: string;
  position: number;
  comments?: SegmentComment[];
  highlighted?: boolean;
};

export type ActionItem = {
  id: number;
  text: string;
  owner?: string | null;
  is_done: boolean;
  position: number;
};

export type MeetingDetail = MeetingCard & {
  notes_status?: "provided" | "generated" | "failed" | "skipped";
  audio_path: string;
  youtube_video_id: string | null;
  summary: { body: string } | null;
  topics: { id: number; title: string; start_seconds: number | null; position: number }[];
  action_items: ActionItem[];
  segments: Segment[];
};

export type User = { id: number; name: string; email: string };
