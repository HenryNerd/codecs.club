import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getSettings, requireAdmin } from "./lib/access";
import { recordAdminChange } from "./lib/changes";
import { appError } from "./lib/errors";
import { parseClockTime, turnInCloseFor, zonedTimeToUtc } from "./lib/time";
import { assignmentTypeValidator, groupValidator } from "./schema";

const MAX_DAYS = 100;

/** A curriculum's days with content, assignments and one year's schedule. */
export const overview = query({
  args: {
    group: groupValidator,
    curriculumId: v.optional(v.string()),
    year: v.optional(v.string()),
  },
  returns: v.object({
    year: v.string(),
    currentYear: v.string(),
    timeZone: v.string(),
    turnInDays: v.number(),
    closeTime: v.string(),
    curricula: v.array(v.object({ _id: v.id("curricula"), name: v.string() })),
    curriculum: v.union(v.null(), v.object({ _id: v.id("curricula"), name: v.string() })),
    days: v.array(
      v.object({
        _id: v.id("days"),
        order: v.number(),
        topic: v.string(),
        slidesUrl: v.union(v.string(), v.null()),
        coverUrl: v.union(v.string(), v.null()),
        schedule: v.union(
          v.null(),
          v.object({
            _id: v.id("lessonSchedules"),
            lessonAt: v.number(),
            turnInClosesAt: v.number(),
          }),
        ),
        assignments: v.array(
          v.object({
            _id: v.id("assignments"),
            title: v.string(),
            type: assignmentTypeValidator,
            status: v.union(v.literal("draft"), v.literal("published")),
          }),
        ),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const settings = await getSettings(ctx);
    const year = args.year ?? settings.currentYear;
    const curricula = await ctx.db
      .query("curricula")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .take(50);
    const requestedId = args.curriculumId
      ? ctx.db.normalizeId("curricula", args.curriculumId)
      : null;
    const curriculum =
      curricula.find((c) => c._id === requestedId) ??
      // Default to the curriculum most recently created for the group.
      curricula[curricula.length - 1] ??
      null;

    const days = [];
    if (curriculum !== null) {
      const dayDocs = await ctx.db
        .query("days")
        .withIndex("by_curriculumId_and_order", (q) => q.eq("curriculumId", curriculum._id))
        .take(MAX_DAYS);
      for (const day of dayDocs) {
        const schedule = await ctx.db
          .query("lessonSchedules")
          .withIndex("by_dayId_and_year", (q) => q.eq("dayId", day._id).eq("year", year))
          .unique();
        const assignments = await ctx.db
          .query("assignments")
          .withIndex("by_dayId_and_order", (q) => q.eq("dayId", day._id))
          .take(50);
        days.push({
          _id: day._id,
          order: day.order,
          topic: day.topic,
          slidesUrl: day.slidesUrl ?? null,
          coverUrl: day.coverImageId ? await ctx.storage.getUrl(day.coverImageId) : null,
          schedule: schedule
            ? {
                _id: schedule._id,
                lessonAt: schedule.lessonAt,
                turnInClosesAt: schedule.turnInClosesAt,
              }
            : null,
          assignments: assignments.map((a) => ({
            _id: a._id,
            title: a.title,
            type: a.type,
            status: a.status,
          })),
        });
      }
    }

    return {
      year,
      currentYear: settings.currentYear,
      timeZone: settings.timeZone,
      turnInDays: settings.turnInDays,
      closeTime: settings.closeTime,
      curricula: curricula.map((c) => ({ _id: c._id, name: c.name })),
      curriculum: curriculum ? { _id: curriculum._id, name: curriculum.name } : null,
      days,
    };
  },
});

/**
 * Sets a day's lesson date for one year. The turn-in close is derived from
 * settings, so moving a lesson moves its turn-in window (decision D06).
 */
export const setSchedule = mutation({
  args: {
    dayId: v.id("days"),
    year: v.string(),
    /** Local date in the school time zone, "YYYY-MM-DD". */
    date: v.string(),
    /** Local start time, "HH:MM". */
    time: v.string(),
  },
  returns: v.object({ lessonAt: v.number(), turnInClosesAt: v.number() }),
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    const settings = await getSettings(ctx);
    const day = await ctx.db.get("days", args.dayId);
    if (day === null) throw appError("NOT_FOUND", "Day not found.");
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(args.date);
    if (!dateMatch) throw appError("INVALID", "Pick a lesson date.");
    let clock;
    try {
      clock = parseClockTime(args.time);
    } catch {
      throw appError("INVALID", "Pick a lesson time.");
    }
    const lessonAt = zonedTimeToUtc(
      {
        year: Number(dateMatch[1]),
        month: Number(dateMatch[2]),
        day: Number(dateMatch[3]),
        hour: clock.hour,
        minute: clock.minute,
      },
      settings.timeZone,
    );
    const turnInClosesAt = turnInCloseFor(lessonAt, settings);
    const existing = await ctx.db
      .query("lessonSchedules")
      .withIndex("by_dayId_and_year", (q) => q.eq("dayId", day._id).eq("year", args.year))
      .unique();
    if (existing) {
      await ctx.db.patch("lessonSchedules", existing._id, { lessonAt, turnInClosesAt });
    } else {
      await ctx.db.insert("lessonSchedules", {
        dayId: day._id,
        year: args.year,
        lessonAt,
        turnInClosesAt,
      });
    }
    await recordAdminChange(ctx, {
      actorId: userId,
      table: "lessonSchedules",
      recordId: day._id,
      summary: `Scheduled Day ${day.order}: ${day.topic} for ${args.year}`,
      before: existing
        ? { lessonAt: existing.lessonAt, turnInClosesAt: existing.turnInClosesAt }
        : undefined,
      after: { lessonAt, turnInClosesAt },
    });
    return { lessonAt, turnInClosesAt };
  },
});

/** Edits a day's shared content (all years): topic and slides link. */
export const updateDayContent = mutation({
  args: { dayId: v.id("days"), topic: v.string(), slidesUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    const day = await ctx.db.get("days", args.dayId);
    if (day === null) throw appError("NOT_FOUND", "Day not found.");
    const topic = args.topic.trim();
    if (topic.length === 0) throw appError("INVALID", "Give the day a topic.");
    const slidesUrl = args.slidesUrl.trim();
    if (slidesUrl.length > 0) {
      let url: URL;
      try {
        url = new URL(slidesUrl);
      } catch {
        throw appError("INVALID", "Paste a full link that starts with https://.");
      }
      if (url.protocol !== "https:") throw appError("INVALID", "Slides links must use https://.");
    }
    const before = { topic: day.topic, slidesUrl: day.slidesUrl ?? null };
    const after = { topic, slidesUrl: slidesUrl || null };
    if (JSON.stringify(before) === JSON.stringify(after)) return null;
    await ctx.db.patch("days", day._id, { topic, slidesUrl: slidesUrl || undefined });
    await recordAdminChange(ctx, {
      actorId: userId,
      table: "days",
      recordId: day._id,
      summary: `Edited Day ${day.order} content`,
      before,
      after,
    });
    return null;
  },
});
