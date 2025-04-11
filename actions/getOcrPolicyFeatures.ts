"use server";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { createMistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { z } from "zod";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export async function getOcrPolicyFeatures(storageId: Id<"_storage">) {
  try {
    const url = await convex.mutation(api.users.generateUrlForImage, {
      storageId,
    });

    if (!url) {
      return { error: "Could not generate URL for the document" };
    }

    // More flexible schema that can handle different response structures
    const schema = z.object({
      features: z
        .array(z.string())
        .describe("List of policy features and benefits")
        .or(
          z.array(
            z.object({
              feature: z.string(),
            })
          )
        )
        .transform((items) => {
          // Handle both array of strings or array of objects with feature property
          return items.map((item) =>
            typeof item === "string" ? item : item.feature
          );
        }),
    });

    try {
      const { object } = await generateObject({
        model: mistral("mistral-small-latest"),
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI assistant specialized in extracting key features from insurance policy documents. Analyze the provided policy document and identify the main benefits, coverages, and special conditions. Return ONLY an array of features with NO additional text.",
          },
          {
            role: "user",
            content: [
              {
                type: "file",
                data: new URL(url),
                mimeType: "application/pdf",
              },
            ],
          },
          {
            role: "user",
            content:
              "Extract ONLY 10 key features and benefits of this insurance policy document. Focus on identifying the specific coverages, benefits, conditions, and special inclusions. Your output MUST be a valid JSON object with a 'features' property containing an array of strings. Each string should be a clear, concise feature statement.",
          },
        ],
        schema,
      });

      return { features: object.features };
    } catch (error) {
      console.error("First extraction attempt failed:", error);

      // Retry with a simplified approach
      const { object } = await generateObject({
        model: mistral("mistral-small-latest"),
        messages: [
          {
            role: "system",
            content:
              'Extract insurance policy features as a simple array of strings. Format must be {"features": ["feature 1", "feature 2", ...]}.',
          },
          {
            role: "user",
            content: [
              {
                type: "file",
                data: new URL(url),
                mimeType: "application/pdf",
              },
            ],
          },
          {
            role: "user",
            content:
              "List the main insurance coverages and benefits as simple bullet points.",
          },
        ],
        schema,
      });

      return { features: object.features };
    }
  } catch (error) {
    console.error("Error extracting policy features:", error);
    return {
      error: "Failed to extract policy features",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
