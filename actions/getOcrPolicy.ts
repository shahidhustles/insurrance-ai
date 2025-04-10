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
export async function getOcrPolicy(storageId: Id<"_storage">) {
  const url = await convex.mutation(api.users.generateUrlForImage, {
    storageId,
  });

  if (!url) {
    return;
  }

  const { object } = await generateObject({
    model: mistral("mistral-small-latest"),
    messages: [
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
          "Extract the following key information from this insurance policy document:\n1. Provider: The insurance company name\n2. Type: What kind of insurance policy this is (health, auto, home, life, etc.)\n3. Sum Insured: The maximum coverage amount (e.g., '5L', '10L', '1 Crore')\n4. Premium: The payment amount with frequency (e.g., '₹8,500/year', '₹750/month')\n5. Expiry Date: When the policy expires (format as YYYY-MM-DD if possible)\n6. Features: List the main benefits or features of the policy\n\nEnsure the output follows the exact format required by the schema. If you cannot find a specific piece of information, provide your best estimate or use 'Not specified' as the value.",
      },
      {
        role: "system",
        content:
          "You are an expert AI assistant specialized in extracting key information from insurance policy documents. Your task is to analyze the provided insurance document and extract specific details in a structured format. Be precise, accurate, and only extract information that is explicitly stated in the document.",
      },
    ],
    schema: z.object({
      provider: z.string().describe("Insurance provider name"),
      type: z
        .enum(["health", "auto", "home"])
        .describe("Type of insurance policy"),
      sumInsured: z.string().describe("Sum insured amount"),
      premium: z.string().describe("Premium amount with frequency"),
      expiryDate: z.string().describe("Policy expiry date"),
      features: z.array(z.string()).describe("List of policy features"),
    }),
  });

  return object;
}
