import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Determines the role of a user based on their userId
 * @param userId - The Clerk user ID
 * @returns "customer" | "insurer" | null
 */
export const getUserRole = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Check if the user exists in the customers table
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (customer) {
      return "customer";
    }

    // Check if the user exists in the insurers table
    const insurer = await ctx.db
      .query("insurers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (insurer) {
      return "insurer";
    }

    // If user doesn't exist in either table
    return null;
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const generateUrlForImage = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
