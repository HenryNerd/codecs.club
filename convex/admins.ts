import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation } from "./_generated/server";
import { normalizeUsername } from "./auth";
import { appError } from "./lib/errors";

/**
 * Provisions an admin account. Run from the CLI (never exposed to clients):
 *   npx convex run admins:createAdmin '{"username":"rivera","displayName":"Ms. Rivera","password":"…"}'
 * The password is hashed by Convex Auth; it is never stored or logged in plain text.
 */
export const createAdmin = internalAction({
  args: { username: v.string(), displayName: v.string(), password: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args): Promise<Id<"users">> => {
    const username = normalizeUsername(args.username);
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      throw appError("INVALID", "Usernames are 3–32 letters, digits, dots, dashes or underscores.");
    }
    if (args.password.length < 10) {
      throw appError("INVALID", "Use a password of at least 10 characters.");
    }
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: username, secret: args.password },
      profile: { name: args.displayName, role: "admin" },
    });
    await ctx.runMutation(internal.admins.insertAdmin, {
      userId: user._id,
      username,
      displayName: args.displayName,
    });
    return user._id;
  },
});

export const insertAdmin = internalMutation({
  args: { userId: v.id("users"), username: v.string(), displayName: v.string() },
  returns: v.id("admins"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing !== null) throw appError("CONFLICT", `Admin "${args.username}" already exists.`);
    return await ctx.db.insert("admins", args);
  },
});
