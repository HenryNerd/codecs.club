import { describe, expect, test } from "vitest";
import { turnInCloseFor, zonedTimeToUtc } from "../convex/lib/time";
import { validatePartialRule } from "./evaluation";

const settings = { turnInDays: 14, closeTime: "23:59", timeZone: "America/Los_Angeles" };

describe("turn-in close", () => {
  test("closes 14 days after the lesson at 11:59 pm Pacific", () => {
    const lesson = zonedTimeToUtc({ year: 2026, month: 10, day: 15, hour: 16, minute: 0 }, settings.timeZone);
    expect(new Date(lesson).toISOString()).toBe("2026-10-15T23:00:00.000Z");
    // Oct 29 23:59 PDT = Oct 30 06:59 UTC.
    expect(new Date(turnInCloseFor(lesson, settings)).toISOString()).toBe("2026-10-30T06:59:00.000Z");
  });

  test("handles the daylight-saving change inside the window", () => {
    const lesson = zonedTimeToUtc({ year: 2026, month: 10, day: 22, hour: 16, minute: 0 }, settings.timeZone);
    // Nov 5 23:59 PST (after Nov 1 change) = Nov 6 07:59 UTC.
    expect(new Date(turnInCloseFor(lesson, settings)).toISOString()).toBe("2026-11-06T07:59:00.000Z");
  });
});

describe("partial rule", () => {
  test("needs fewer than all parts and at least one", () => {
    expect(validatePartialRule(3, 2).ok).toBe(true);
    expect(validatePartialRule(3, 3).ok).toBe(false);
    expect(validatePartialRule(3, 0).ok).toBe(false);
    expect(validatePartialRule(0, 0).ok).toBe(false);
  });
});
