import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all policies
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("policies").collect();
  },
});

// Get a policy by ID
export const getById = query({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.id);
    if (!policy) {
      throw new Error("Policy not found");
    }
    return policy;
  },
});

// Get policies by insurer ID
export const getByInsurer = query({
  args: { insurerId: v.id("insurers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("policies")
      .withIndex("by_insurer", (q) => q.eq("insurer", args.insurerId))
      .collect();
  },
});

// Add a new policy
export const add = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
    insurer: (v.id("insurers")),
    type: v.optional(
      v.union(v.literal("health"), v.literal("auto"), v.literal("home"))
    ),
    premium: v.optional(v.string()),
    years: v.optional(v.string()),
    sumInsured: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const policyId = await ctx.db.insert("policies", {
      name: args.name,
      storageId: args.storageId,
      insurer: args.insurer,
      type: args.type || "health", // Store the type in the policies table
      premium: args.premium || "0",
      years: args.years || "1",
      sumInsured: args.sumInsured || "0",
      features: args.features || [],
      provider: args.provider,
    });

    // If insurer is specified, also update the insurer's policy list
    if (args.insurer) {
      const insurer = await ctx.db.get(args.insurer);
      if (insurer) {
        const existingPolicies = insurer.policies || [];

        // Extract policy details to add to insurer's policies array
        const policyDetails = {
          storageId: args.storageId,
          name: args.name,
          type: args.type || "health",
          premium: args.premium || "0",
          years: args.years || "1",
          sumInsured: args.sumInsured || "0",
          features: args.features || [],
        };

        await ctx.db.patch(args.insurer, {
          policies: [...existingPolicies, policyDetails],
        });
      }
    }

    return policyId;
  },
});

// Update an existing policy
export const update = mutation({
  args: {
    id: v.id("policies"),
    name: v.optional(v.string()),
    insurer: v.optional(v.id("insurers")),
    type: v.optional(
      v.union(v.literal("health"), v.literal("auto"), v.literal("home"))
    ),
    premium: v.optional(v.string()),
    years: v.optional(v.string()),
    sumInsured: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    provider: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fieldsToUpdate } = args;

    // Verify the policy exists before updating
    const existingPolicy = await ctx.db.get(id);
    if (!existingPolicy) {
      throw new Error("Policy not found");
    }

    // If we're updating the insurer, we may need to update the old and new insurer records
    if (args.insurer && existingPolicy.insurer !== args.insurer) {
      // If there was a previous insurer, we should remove this policy from their list
      if (existingPolicy.insurer) {
        const oldInsurer = await ctx.db.get(existingPolicy.insurer);
        if (oldInsurer && oldInsurer.policies) {
          const updatedPolicies = oldInsurer.policies.filter(
            (p) => p.storageId !== existingPolicy.storageId
          );
          await ctx.db.patch(existingPolicy.insurer, {
            policies: updatedPolicies,
          });
        }
      }

      // Add policy to new insurer's list
      const newInsurer = await ctx.db.get(args.insurer);
      if (newInsurer) {
        const existingPolicies = newInsurer.policies || [];
        const policyExists = existingPolicies.some(
          (p) => p.storageId === existingPolicy.storageId
        );

        if (!policyExists) {
          const policyDetails = {
            storageId: existingPolicy.storageId,
            name: args.name || existingPolicy.name,
            type: args.type || existingPolicy.type || "health",
            premium: args.premium || existingPolicy.premium || "0",
            years: args.years || existingPolicy.years || "1",
            sumInsured: args.sumInsured || existingPolicy.sumInsured || "0",
            features: args.features || existingPolicy.features || [],
          };

          await ctx.db.patch(args.insurer, {
            policies: [...existingPolicies, policyDetails],
          });
        }
      }
    }

    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

// Delete a policy
export const remove = mutation({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    // Get the policy details before deleting
    const policy = await ctx.db.get(args.id);
    if (!policy) {
      throw new Error("Policy not found");
    }

    // If the policy is associated with an insurer, remove it from their list
    if (policy.insurer) {
      const insurer = await ctx.db.get(policy.insurer);
      if (insurer && insurer.policies) {
        const updatedPolicies = insurer.policies.filter(
          (p) => p.storageId !== policy.storageId
        );

        await ctx.db.patch(policy.insurer, {
          policies: updatedPolicies,
        });
      }
    }

    // Delete the policy
    await ctx.db.delete(args.id);
    return args.id;
  },
});
