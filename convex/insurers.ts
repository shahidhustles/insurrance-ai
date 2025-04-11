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

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const insurer = await ctx.db
      .query("insurers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

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
    const newInsurerId = await ctx.db.insert("insurers", {
      ...args,
      createdAt: Date.now(),
    });

    return newInsurerId;
  },
});

// Add a new policy to an insurer's portfolio
export const addPolicy = mutation({
  args: {
    insurerId: v.id("insurers"),
    policy: v.object({
      name: v.string(),
      storageId: v.id("_storage"),
      type: v.union(v.literal("health"), v.literal("auto"), v.literal("home")),
      premium: v.string(),
      years: v.string(),
      sumInsured: v.string(),
      features: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { insurerId, policy } = args;

    // Get the current insurer
    const insurer = await ctx.db.get(insurerId);
    if (!insurer) {
      throw new Error("Insurer not found");
    }

    // Add policy to insurer's policies array
    const existingPolicies = insurer.policies || [];
    await ctx.db.patch(insurerId, {
      policies: [...existingPolicies, policy],
    });

    // Also add an entry to the policies table with all details
    const policyId = await ctx.db.insert("policies", {
      name: policy.name,
      storageId: policy.storageId,
      insurer: insurerId,
      type: policy.type,
      premium: policy.premium,
      years: policy.years,
      sumInsured: policy.sumInsured,
      features: policy.features,
      provider: insurer.companyName, // Use the insurer's company name as provider
    });

    return policyId;
  },
});

// Add multiple policies at once to an insurer
export const addPolicies = mutation({
  args: {
    insurerId: v.id("insurers"),
    policies: v.array(
      v.object({
        storageId: v.id("_storage"),
        name: v.string(),
        type: v.union(
          v.literal("health"),
          v.literal("auto"),
          v.literal("home")
        ),
        premium: v.string(),
        years: v.string(),
        sumInsured: v.string(),
        features: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insurer = await ctx.db.get(args.insurerId);

    if (!insurer) {
      throw new Error("Insurer not found");
    }

    const existingPolicies = insurer.policies || [];

    const updatedPolicies = [...existingPolicies, ...args.policies];

    await ctx.db.patch(args.insurerId, {
      policies: updatedPolicies,
    });

    return {
      insurerId: args.insurerId,
      totalPolicies: updatedPolicies.length,
      addedPolicies: args.policies.length,
    };
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
