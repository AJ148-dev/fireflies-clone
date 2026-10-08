export type Participant = { id: number; name: string };

export type MeetingCard = {
  id: number;
  title: string;
  started_at: string;
  duration_seconds: number;
  participants: Participant[];
};

export type Segment = {
  id: number;
  speaker_name: string;
  start_seconds: number;
  end_seconds: number | null;
  text: string;
  position: number;
};

export type ActionItem = {
  id: number;
  text: string;
  is_done: boolean;
  position: number;
};

export type MeetingDetail = MeetingCard & {
  audio_path: string;
  summary: { body: string } | null;
  topics: { id: number; title: string; start_seconds: number | null; position: number }[];
  action_items: ActionItem[];
  segments: Segment[];
};

export type User = { id: number; name: string; email: string };
