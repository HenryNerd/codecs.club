import { classFor } from "./lib/classes";
import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { turnInCloseFor } from "./lib/time";
import { appError } from "./lib/errors";
import { recordAdminChange } from "./lib/changes";
import { getSettings, requireAdmin } from "./lib/access";

export const get = query({
  args: {},
  returns: v.object({
    currentYear: v.string(),
    turnInDays: v.number(),
    closeTime: v.string(),
    timeZone: v.string(),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const settings = await getSettings(ctx);
    return {
      currentYear: settings.currentYear,
      turnInDays: settings.turnInDays,
      closeTime: settings.closeTime,
      timeZone: settings.timeZone,
    };
  },
});


const settingsFields = { currentYear: v.string(), turnInDays: v.number(), closeTime: v.string(), timeZone: v.string() };
const deadlineValidator = v.object({ id: v.id("lessonSchedules"), year: v.string(), topic: v.string(), group: v.string(), lessonAt: v.number(), before: v.number(), after: v.number() });
const previewValidator = v.object({ fingerprint: v.string(), deadlines: v.array(deadlineValidator) });
type SettingsInput = { currentYear: string; turnInDays: number; closeTime: string; timeZone: string };
function validate(input: SettingsInput) {
  const match = /^(\d{4})-(\d{2})$/.exec(input.currentYear);
  if (!match || Number(match[2]) !== (Number(match[1]) + 1) % 100) throw appError("INVALID", "Use a consecutive school year such as 2026-27.");
  if (!Number.isInteger(input.turnInDays) || input.turnInDays < 0 || input.turnInDays > 365) throw appError("INVALID", "Choose a turn-in window from 0 to 365 days.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.closeTime)) throw appError("INVALID", "Use a valid close time (HH:MM).");
  try { new Intl.DateTimeFormat("en", { timeZone: input.timeZone }).format(0); } catch { throw appError("INVALID", "Choose a valid IANA time zone."); }
}
async function settingsPlan(ctx: QueryCtx, input: SettingsInput) {
  input = { currentYear: input.currentYear, turnInDays: input.turnInDays, closeTime: input.closeTime, timeZone: input.timeZone };
  validate(input);
  const current = await getSettings(ctx);
  const schedules = await ctx.db.query("lessonSchedules").withIndex("by_year_and_lessonAt", q => q.eq("year", input.currentYear)).take(501);
  if (schedules.length > 500) throw appError("INVALID", "This year has more than 500 schedules; contact the developer to update settings in batches.");
  const deadlines = [];
  for (const schedule of schedules) {
    const day = await ctx.db.get("days", schedule.dayId);
    const curriculum = day ? await ctx.db.get("curricula", day.curriculumId) : null;
    if (curriculum && (await classFor(ctx, curriculum.group))?.status === "archived") continue;
    const after = turnInCloseFor(schedule.lessonAt, input);
    if (after !== schedule.turnInClosesAt) deadlines.push({ id: schedule._id, year: schedule.year, topic: day?.topic ?? "Lesson", group: curriculum?.group ?? "Unknown", lessonAt: schedule.lessonAt, before: schedule.turnInClosesAt, after });
  }
  return { fingerprint: JSON.stringify({ current, schedules, input }), deadlines };
}
export const preview = query({ args: settingsFields, returns: previewValidator, handler: async (ctx, args) => { await requireAdmin(ctx); return settingsPlan(ctx, args); } });
export const save = mutation({
  args: { ...settingsFields, fingerprint: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const { userId: actorId } = await requireAdmin(ctx);
    const input = { currentYear: args.currentYear, turnInDays: args.turnInDays, closeTime: args.closeTime, timeZone: args.timeZone };
    const plan = await settingsPlan(ctx, input);
    const current = await getSettings(ctx);
    if (Object.entries(input).every(([key, value]) => current[key as keyof SettingsInput] === value) && !plan.deadlines.length) return null;
    if (plan.fingerprint !== args.fingerprint) throw appError("CONFLICT", "Settings or schedules changed. Review a fresh preview.");
    for (const deadline of plan.deadlines) {
      await ctx.db.patch("lessonSchedules", deadline.id, { turnInClosesAt: deadline.after });
      await recordAdminChange(ctx, { actorId, table: "lessonSchedules", recordId: deadline.id, summary: `Updated turn-in close for ${deadline.topic} (${deadline.year})`, before: { turnInClosesAt: deadline.before }, after: { turnInClosesAt: deadline.after } });
    }
    const before = { currentYear: current.currentYear, turnInDays: current.turnInDays, closeTime: current.closeTime, timeZone: current.timeZone };
    await ctx.db.patch("settings", current._id, input);
    await recordAdminChange(ctx, { actorId, table: "settings", recordId: current._id, summary: "Updated school year and turn-in timing", before, after: input });
    return null;
  },
});
