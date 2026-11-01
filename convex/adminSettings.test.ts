import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupConvex } from "./test.setup";
import { turnInCloseFor } from "./lib/time";
async function setup() {
  const t = setupConvex();
  const initial = { currentYear: "2026-27", turnInDays: 14, closeTime: "23:59", timeZone: "America/Chicago" };
  const data = await t.run(async ctx => {
    const userId = await ctx.db.insert("users", { role: "admin" });
    await ctx.db.insert("admins", { userId, username: "teacher", displayName: "Teacher" });
    await ctx.db.insert("settings", initial);
    const curriculumId = await ctx.db.insert("curricula", { group: "basic", name: "Python" });
    const dayId = await ctx.db.insert("days", { curriculumId, topic: "Variables", order: 1 });
    const unscheduledId = await ctx.db.insert("days", { curriculumId, topic: "Unscheduled", order: 2 });
    const lessonAt = Date.parse("2026-10-27T22:00:00Z");
    const deadline = turnInCloseFor(lessonAt, initial);
    const scheduleId = await ctx.db.insert("lessonSchedules", { dayId, year: "2026-27", lessonAt, turnInClosesAt: deadline });
    const oldId = await ctx.db.insert("lessonSchedules", { dayId, year: "2025-26", lessonAt: lessonAt - 365 * 86400000, turnInClosesAt: deadline - 365 * 86400000 });
    return { userId, scheduleId, oldId, unscheduledId };
  });
  return { t, admin: t.withIdentity({ subject: `${data.userId}|session` }), initial, ...data };
}

test("settings preview/save require admin, validate inputs, and never write during preview", async () => {
  const { t, admin, initial, userId } = await setup();
  await expect(t.query(api.adminSettings.preview, initial)).rejects.toThrow(/Sign in/);
  const otherId = await t.run(ctx => ctx.db.insert("users", { role: "student" }));
  const student = t.withIdentity({ subject: `${otherId}|session` });
  await expect(student.mutation(api.adminSettings.save, { ...initial, fingerprint: "spoof" })).rejects.toThrow(/Only admins/);
  for (const input of [{ ...initial, turnInDays: -1 }, { ...initial, turnInDays: 1.5 }, { ...initial, closeTime: "24:00" }, { ...initial, timeZone: "Invalid/Zone" }, { ...initial, currentYear: "2026-30" }]) await expect(admin.query(api.adminSettings.preview, input)).rejects.toThrow();
  const preview = await admin.query(api.adminSettings.preview, { ...initial, turnInDays: 7 });
  expect(preview.deadlines).toHaveLength(1);
  expect(await admin.query(api.adminSettings.get, {})).toEqual(initial);
  expect(await t.run(ctx => ctx.db.query("adminChanges").take(10))).toEqual([]);
  expect(userId).toBeTruthy();
});

test("saving recalculates only the selected year and records all changes atomically", async () => {
  const { t, admin, initial, oldId, scheduleId, unscheduledId } = await setup();
  const before = await t.run(ctx => ctx.db.get("lessonSchedules", oldId));
  const input = { ...initial, turnInDays: 7, closeTime: "17:30", timeZone: "America/Los_Angeles" };
  const preview = await admin.query(api.adminSettings.preview, input);
  await admin.mutation(api.adminSettings.save, { ...input, fingerprint: preview.fingerprint });
  const schedule = (await t.run(ctx => ctx.db.get("lessonSchedules", scheduleId)))!;
  expect(schedule.turnInClosesAt).toBe(turnInCloseFor(schedule.lessonAt, input));
  expect(await t.run(ctx => ctx.db.get("lessonSchedules", oldId))).toEqual(before);
  expect(await t.run(ctx => ctx.db.query("lessonSchedules").withIndex("by_dayId_and_year", q => q.eq("dayId", unscheduledId)).take(5))).toEqual([]);
  const history = await t.run(ctx => ctx.db.query("adminChanges").take(10));
  expect(history).toHaveLength(2);
  expect(history.map(h => h.table).sort()).toEqual(["lessonSchedules", "settings"]);
  await admin.mutation(api.adminSettings.save, { ...input, fingerprint: preview.fingerprint });
  expect(await t.run(ctx => ctx.db.query("adminChanges").take(10))).toHaveLength(2);
});

test("stale previews refuse intervening schedule changes, leaving settings untouched", async () => {
  const { t, admin, initial, scheduleId } = await setup();
  const input = { ...initial, turnInDays: 3 };
  const preview = await admin.query(api.adminSettings.preview, input);
  await t.run(ctx => ctx.db.patch("lessonSchedules", scheduleId, { lessonAt: Date.parse("2026-11-03T22:00:00Z") }));
  await expect(admin.mutation(api.adminSettings.save, { ...input, fingerprint: preview.fingerprint })).rejects.toThrow(/fresh preview/);
  expect(await admin.query(api.adminSettings.get, {})).toEqual(initial);
  expect(await t.run(ctx => ctx.db.query("adminChanges").take(10))).toEqual([]);
});

test("switching school year does not relabel prior schedules or invent new ones", async () => {
  const { t, admin, initial, scheduleId } = await setup();
  const before = await t.run(ctx => ctx.db.get("lessonSchedules", scheduleId));
  const input = { ...initial, currentYear: "2027-28" };
  const preview = await admin.query(api.adminSettings.preview, input);
  expect(preview.deadlines).toEqual([]);
  await admin.mutation(api.adminSettings.save, { ...input, fingerprint: preview.fingerprint });
  expect(await t.run(ctx => ctx.db.get("lessonSchedules", scheduleId))).toEqual(before);
  expect((await admin.query(api.adminSettings.get, {})).currentYear).toBe("2027-28");
});
