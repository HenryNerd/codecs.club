/**
 * Time-zone helpers shared by Convex functions and the client. Lesson dates and
 * turn-in closes are stored as UTC milliseconds; the configured school time
 * zone decides which calendar day and wall-clock time they fall on.
 */
export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function zonedParts(timestamp: number, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(new Date(timestamp));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function offsetAt(timestamp: number, timeZone: string): number {
  const p = zonedParts(timestamp, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(timestamp / 60000) * 60000;
}

/** Converts a wall-clock time in `timeZone` to UTC milliseconds. */
export function zonedTimeToUtc(
  wall: ZonedParts,
  timeZone: string,
): number {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  const first = guess - offsetAt(guess, timeZone);
  // Re-check once in case the guess crossed a daylight-saving change.
  return guess - offsetAt(first, timeZone);
}

/** Parses "HH:MM" into hours and minutes. */
export function parseClockTime(value: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid time "${value}", expected HH:MM.`);
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * Turn-in closes `turnInDays` calendar days after the lesson's local date, at
 * the configured local close time.
 */
export function turnInCloseFor(
  lessonAt: number,
  settings: { turnInDays: number; closeTime: string; timeZone: string },
): number {
  const lesson = zonedParts(lessonAt, settings.timeZone);
  const closeDate = new Date(
    Date.UTC(lesson.year, lesson.month - 1, lesson.day + settings.turnInDays),
  );
  const { hour, minute } = parseClockTime(settings.closeTime);
  return zonedTimeToUtc(
    {
      year: closeDate.getUTCFullYear(),
      month: closeDate.getUTCMonth() + 1,
      day: closeDate.getUTCDate(),
      hour,
      minute,
    },
    settings.timeZone,
  );
}
