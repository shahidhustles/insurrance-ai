import {
  ocrPolicyDocument,
  openai,
  sendEmailToInsurer,
} from "@/actions/recommendationTools";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { currentUser } from "@clerk/nextjs/server";
import { streamText, tool } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { z } from "zod";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const { messages } = await req.json();

  const policyId = req.headers.get("X-PolicyId") as Id<"policies">;
  const policy = await convex.query(api.policies.getById, {
    id: policyId!,
  });

  const user = await currentUser();
  if (!user) {
    return;
  }
  // Get customer information
  const customer = await convex.query(api.customers.getByUserId, {
    userId: user?.id,
  });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are an insurance policy assistant focused on helping users understand their policy details and benefits.

When users ask questions about their policy, ALWAYS use the getInfoAboutPolicy tool to retrieve accurate information rather than making assumptions about coverage details.

Follow these guidelines:
- For any policy-specific question, use the getInfoAboutPolicy tool to get accurate information
- If information is not available, clearly state that and offer to contact the insurer
- When the user requests to contact their insurer, use the contactInsurer tool to send their question or concern via email
- Be helpful, clear, and accurate with insurance policy information
- Do not make up policy details that you haven't verified through the tools

Remember, insurance information is important to users, so accuracy is critical.`,
    messages,
    maxSteps : 12,
    tools: {
      getInfoAboutPolicy: tool({
        description:
          "You can ask for any info about the policy. this is like a smart context provider like RAG.",
        parameters: z.object({
          prompt: z.string().describe("Ask about context here."),
        }),
        execute: async ({ prompt }) => {
          return await ocrPolicyDocument(policy.storageId, prompt);
        },
      }),

      contactInsurer: tool({
        description:
          "Use this tool when the user wants to contact their insurer directly about a question that requires human assistance.",
        parameters: z.object({
          subject: z.string().describe("Brief subject line for the email"),
          message: z
            .string()
            .describe(
              "The detailed question or issue that needs to be addressed by the insurer"
            ),
          customerPhone: z
            .string()
            .optional()
            .describe(
              "Customer's phone number if they want to be contacted by phone"
            ),
        }),
        execute: async ({ subject, message, customerPhone }) => {
          if (!customer) {
            return {
              success: false,
              message:
                "Customer information could not be found. Please try again later.",
            };
          }

          return await sendEmailToInsurer({
            policyId: policyId!,
            customerName: customer.name,
            customerEmail: user.emailAddresses[0].emailAddress,
            customerPhone,
            subject,
            message,
          });
        },
      }),
    },
  });

  const messageResponse = result.toDataStreamResponse();
  return new NextResponse(messageResponse.body, {
    headers: {
      ...Object.fromEntries(messageResponse.headers.entries()),
      "X-PolicyId": policyId!,
    },
    status: messageResponse.status,
    statusText: messageResponse.statusText,
  });
}
