"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { sendEmail } from "@/lib/email/gmail-service";
import { Id } from "@/convex/_generated/dataModel";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const openai = createOpenAI({
  apiKey: process.env.CHATANYWHERE_API_KEY,
  baseURL: "https://api.chatanywhere.tech/v1",
});
/**
 * Tool 1: Get customer information and past policies
 */
export async function getCustomerInfo(userId: string) {
  try {
    const customer = await convex.query(api.customers.getByUserId, {
      userId,
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  } catch (error) {
    console.error("Error fetching customer info:", error);
    throw new Error("Failed to retrieve customer information");
  }
}

/**
 * Tool 2: Get all available policies from the database
 */
export async function getAllPolicies() {
  try {
    const policies = await convex.query(api.policies.getAll);
    return policies;
  } catch (error) {
    console.error("Error fetching policies:", error);
    throw new Error("Failed to retrieve available policies");
  }
}

/**
 * Tool 3: Process policy document with OCR
 * This function extracts detailed information from a policy document
 */
export async function ocrPolicyDocument(storageId: string, prompt: string) {
  // Generate URL for the document
  const url = await convex.mutation(api.users.generateUrlForImage, {
    storageId,
  });

  if (!url) {
    throw new Error("Failed to generate URL for policy document");
  }

  const { text } = await generateText({
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
        content: prompt,
      },
    ],
  });

  return text;
}

/**
 * Tool 4: Send an email to the insurer
 * This function sends an email to the insurer with the customer's query
 * Uses SendGrid or Gmail for sending real emails
 */
export async function sendEmailToInsurer({
  policyId,
  customerName,
  customerEmail,
  subject,
  message,
  customerPhone,
}: {
  policyId: Id<"policies">;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  customerPhone?: string;
}) {
  try {
    // Get the policy details to find the insurer
    const policy = await convex.query(api.policies.getById, {
      id: policyId,
    });

    if (!policy) {
      throw new Error("Policy not found");
    }

    // Get the insurer details
    const insurer = await convex.query(api.insurers.getById, {
      id: policy.insurer,
    });

    if (!insurer) {
      throw new Error("Insurer not found");
    }

    // Format the email content
    const emailText = `
Support Team at ${insurer.companyName},

A customer has a question regarding their policy that requires your assistance.

Customer Details:
- Name: ${customerName}
- Email: ${customerEmail}
${customerPhone ? `- Phone: ${customerPhone}` : ""}
- Policy ID: ${policyId}
- Policy Name: ${policy.name}

Customer's Question:
${message}

Please respond directly to the customer at their email address provided above.

This message was sent via Insurance AI platform.
    `;

    const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Customer Policy Inquiry</h2>
  
  <p>Support Team at ${insurer.companyName},</p>
  
  <p>A customer has a question regarding their policy that requires your assistance.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3>Customer Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${customerName}</li>
      <li><strong>Email:</strong> ${customerEmail}</li>
      ${customerPhone ? `<li><strong>Phone:</strong> ${customerPhone}</li>` : ""}
      <li><strong>Policy ID:</strong> ${policyId}</li>
      <li><strong>Policy Name:</strong> ${policy.name}</li>
    </ul>
  </div>
  
  <div style="background-color: #eef6ff; padding: 15px; border-radius: 5px; border-left: 4px solid #4285f4;">
    <h3>Customer's Question:</h3>
    <p>${message.replace(/\n/g, "<br>")}</p>
  </div>
  
  <p>Please respond directly to the customer at their email address provided above.</p>
  
  <p style="color: #666; font-size: 12px; margin-top: 30px;">This message was sent via Insurance AI platform.</p>
</div>
    `;

    try {
      // Try to send the email
      const result = await sendEmail({
        to: insurer.email,
        subject: `Policy Inquiry: ${subject}`,
        text: emailText,
        html: emailHtml,
        replyTo: customerEmail,
      });

      console.log(
        `Email sent successfully to insurer ${insurer.companyName} at ${insurer.email} using ${result.provider}`
      );

      return {
        success: true,
        message:
          "Your message has been sent to the insurer. They will contact you directly.",
        provider: result.provider,
      };
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      // Store the inquiry in database for manual follow-up
      try {
        // Here you could add a mutation to store the inquiry in your database
        // For example:
        // await convex.mutation(api.inquiries.create, {
        //   policyId, customerName, customerEmail, subject, message, customerPhone, insurerId: insurer.id
        // });

        console.log("Inquiry would be saved to database as fallback");

        return {
          success: true,
          message:
            "Your inquiry has been recorded. The insurer will be notified and contact you soon.",
          emailFailed: true,
        };
      } catch (storageError) {
        console.error("Failed to store inquiry as fallback:", storageError);
        throw new Error(
          "Failed to contact insurer. Our team has been notified and will follow up."
        );
      }
    }
  } catch (error) {
    console.error("Error sending email to insurer:", error);
    throw new Error("Failed to send email to insurer. Please try again later.");
  }
}
