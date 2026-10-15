import { v } from "convex/values";
import { query } from "./_generated/server";
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
