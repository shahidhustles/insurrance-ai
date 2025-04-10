import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all insurers for a user
export const getAll = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const insurers = await ctx.db
      .query("insurers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return insurers;
  },
});

// Get a specific insurer by ID
export const getById = query({
  args: { id: v.id("insurers") },
  handler: async (ctx, args) => {
    const insurer = await ctx.db.get(args.id);
    return insurer;
  },
});

// Add a new insurer
export const add = mutation({
  args: {
    companyName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const insurerId = await ctx.db.insert("insurers", {
      companyName: args.companyName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      userId: args.userId,
      createdAt: Date.now(),
    });
    return insurerId;
  },
});

// Update an existing insurer
export const update = mutation({
  args: {
    id: v.id("insurers"),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fieldsToUpdate } = args;

    // Verify the insurer exists before updating
    const existingInsurer = await ctx.db.get(id);
    if (!existingInsurer) {
      throw new Error("Insurer not found");
    }

    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

// Delete an insurer
export const remove = mutation({
  args: { id: v.id("insurers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
