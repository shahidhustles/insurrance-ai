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
          expiryDate: v.string(), //iso string
          features: v.array(v.string()),
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
  }).index("by_userId", ["userId"]),
});
