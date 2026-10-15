import { isSameDay } from "./format";

/** Shapes returned by student.home / student.day. */
export type AssignmentProgress = {
  _id: string;
  title: string;
  type: "guided" | "open";
  summary: string;
  started: boolean;
  savedAt: number | null;
  turnedIn: boolean;
  latestOutcome: "complete" | "partial" | "none" | null;
};

export type TrackDay = {
  _id: string;
  order: number;
  topic: string;
  lessonAt: number | null;
  turnInClosesAt: number | null;
  assignments: AssignmentProgress[];
};

export type DayState =
  | { kind: "unscheduled" }
  | { kind: "upcoming" }
  | { kind: "today" }
  | { kind: "done"; turnedIn: number; total: number }
  | { kind: "open"; turnedIn: number; total: number; closesTonight: boolean; closed: boolean };

export function dayState(day: TrackDay, now: number, timeZone: string): DayState {
  if (day.lessonAt === null) return { kind: "unscheduled" };
  if (isSameDay(day.lessonAt, now, timeZone)) return { kind: "today" };
  if (day.lessonAt > now) return { kind: "upcoming" };
  const total = day.assignments.length;
  const turnedIn = day.assignments.filter((a) => a.turnedIn).length;
  if (total > 0 && turnedIn === total) return { kind: "done", turnedIn, total };
  const closes = day.turnInClosesAt;
  return {
    kind: "open",
    turnedIn,
    total,
    closesTonight: closes !== null && closes > now && isSameDay(closes, now, timeZone),
    closed: closes !== null && closes <= now,
  };
}

/** Today's day, else the most recent past day, else the first day. */
export function focusDay(days: TrackDay[], now: number, timeZone: string): TrackDay | null {
  const today = days.find((d) => d.lessonAt !== null && isSameDay(d.lessonAt, now, timeZone));
  if (today) return today;
  const past = days
    .filter((d) => d.lessonAt !== null && d.lessonAt <= now)
    .sort((a, b) => b.lessonAt! - a.lessonAt!);
  return past[0] ?? days[0] ?? null;
}

/** Assignment-level status text and tone. */
export function assignmentStatus(a: AssignmentProgress): {
  label: string;
  tone: "progress" | "turnedIn" | "notStarted";
} {
  if (a.turnedIn) return { label: "Turned in", tone: "turnedIn" };
  if (a.started) return { label: "In progress", tone: "progress" };
  return { label: "Not started", tone: "notStarted" };
}
