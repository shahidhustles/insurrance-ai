import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  customers: defineTable({
    name: v.string(),
    age: v.number(),
    occupation: v.string(),
    incomeRange: v.string(),
    city: v.string(),
    state: v.string(),
    riskAppetite: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    pastPolicies: v.optional(
      v.array(
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
          purchaseDate: v.optional(v.string()),
          expiryDate: v.string(), //iso string
          features: v.array(v.string()),
        })
      )
    ),
    recommendedPolicies: v.optional(
      v.array(
        v.object({
          policyId: v.id("policies"),
          confidenceScore: v.number(),
          summary: v.string(),
          reasons: v.array(v.string()),
          benefitsForCustomer: v.array(v.string()),
        })
      )
    ),
  }).index("by_userId", ["userId"]),
  insurers: defineTable({
    companyName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    policies: v.optional(
      v.array(
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
      )
    ),
  }).index("by_userId", ["userId"]),

  policies: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    insurer: v.id("insurers"),
    type: v.optional(
      v.union(v.literal("health"), v.literal("auto"), v.literal("home"))
    ),
    premium: v.optional(v.string()),
    years: v.optional(v.string()),
    sumInsured: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    provider: v.optional(v.string()),
  }).index("by_insurer", ["insurer"]),
});
