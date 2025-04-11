import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all customers for a user
export const getAll = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return customers;
  },
});

// Get a specific customer by ID
export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    return customer;
  },
});

// Get a customer by userId
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return customer;
  },
});

// Add a new customer
export const add = mutation({
  args: {
    name: v.string(),
    age: v.number(),
    occupation: v.string(),
    incomeRange: v.string(),
    city: v.string(),
    state: v.string(),
    riskAppetite: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const customerId = await ctx.db.insert("customers", {
      name: args.name,
      age: args.age,
      occupation: args.occupation,
      incomeRange: args.incomeRange,
      city: args.city,
      state: args.state,
      riskAppetite: args.riskAppetite,
      userId: args.userId,
      createdAt: Date.now(),
    });
    return customerId;
  },
});

// Update an existing customer
export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    occupation: v.optional(v.string()),
    incomeRange: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    riskAppetite: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fieldsToUpdate } = args;

    // Verify the customer exists before updating
    const existingCustomer = await ctx.db.get(id);
    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

// Delete a customer
export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const addPastPolicy = mutation({
  args: {
    customerId: v.id("customers"),
    policy: v.object({
      name: v.string(),
      storageId: v.id("_storage"),
      provider: v.string(),
      type: v.union(v.literal("health"), v.literal("auto"), v.literal("home")),
      sumInsured: v.string(),
      premium: v.string(),
      expiryDate: v.string(),
      features: v.array(v.string()),
      purchaseDate: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    const pastPolicies = customer.pastPolicies || [];

    const updatedPolicies = [...pastPolicies, args.policy];

    await ctx.db.patch(args.customerId, {
      pastPolicies: updatedPolicies,
    });

    return {
      customerId: args.customerId,
      addedPolicy: args.policy,
      totalPolicies: updatedPolicies.length,
      policyIndex: updatedPolicies.length - 1,
    };
  },
});

export const updatePastPolicy = mutation({
  args: {
    customerId: v.id("customers"),
    policyIndex: v.number(),
    updatedFields: v.object({
      name: v.optional(v.string()),
      storageId: v.optional(v.id("_storage")),
      provider: v.optional(v.string()),
      type: v.optional(
        v.union(v.literal("health"), v.literal("auto"), v.literal("home"))
      ),
      sumInsured: v.optional(v.string()),
      premium: v.optional(v.string()),
      expiryDate: v.optional(v.string()),
      features: v.optional(v.array(v.string())),
      purchaseDate: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);

    if (!customer || !customer.pastPolicies) {
      throw new Error("Customer or past policies not found");
    }

    if (
      args.policyIndex < 0 ||
      args.policyIndex >= customer.pastPolicies.length
    ) {
      throw new Error("Invalid policy index");
    }

    const updatedPolicies = [...customer.pastPolicies];
    updatedPolicies[args.policyIndex] = {
      ...updatedPolicies[args.policyIndex],
      ...args.updatedFields,
    };

    await ctx.db.patch(args.customerId, {
      pastPolicies: updatedPolicies,
    });

    return args.customerId;
  },
});

// Remove a past policy
export const removePastPolicy = mutation({
  args: {
    customerId: v.id("customers"),
    policyIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);

    if (!customer || !customer.pastPolicies) {
      throw new Error("Customer or past policies not found");
    }

    if (
      args.policyIndex < 0 ||
      args.policyIndex >= customer.pastPolicies.length
    ) {
      throw new Error("Invalid policy index");
    }

    // Filter out the policy to remove
    const updatedPolicies = customer.pastPolicies.filter(
      (_, index) => index !== args.policyIndex
    );

    await ctx.db.patch(args.customerId, {
      pastPolicies: updatedPolicies,
    });

    return args.customerId;
  },
});

// Add multiple past policies at once
export const addMultiplePastPolicies = mutation({
  args: {
    customerId: v.id("customers"),
    policies: v.array(
      v.object({
        name: v.string(),
        storageId: v.id("_storage"),
        provider: v.string(),
        type: v.union(
          v.literal("health"),
          v.literal("auto"),
          v.literal("home")
        ),
        sumInsured: v.string(),
        premium: v.string(),
        expiryDate: v.string(),
        features: v.array(v.string()),
        purchaseDate: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get the customer to check if pastPolicies already exists
    const customer = await ctx.db.get(args.customerId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Initialize pastPolicies as empty array if it doesn't exist
    const existingPolicies = customer.pastPolicies || [];

    // Combine existing policies with new ones
    const updatedPolicies = [...existingPolicies, ...args.policies];

    // Update the customer record with all policies at once
    await ctx.db.patch(args.customerId, {
      pastPolicies: updatedPolicies,
    });

    return {
      customerId: args.customerId,
      totalPolicies: updatedPolicies.length,
      addedPolicies: args.policies.length,
    };
  },
});

// Add recommended policies to a customer
export const updateRecommendedPolicies = mutation({
  args: {
    customerId: v.id("customers"),
    recommendedPolicies: v.array(
      v.object({
        policyId: v.id("policies"),
        confidenceScore: v.number(),
        summary: v.string(),
        reasons: v.array(v.string()),
        benefitsForCustomer: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Update the customer record with recommended policies
    await ctx.db.patch(args.customerId, {
      recommendedPolicies: args.recommendedPolicies,
    });

    return {
      customerId: args.customerId,
      recommendedPoliciesCount: args.recommendedPolicies.length,
    };
  },
});
