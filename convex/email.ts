"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { sendEmail } from "../lib/email/gmail-service";

/**
 * Sends an email notification to a user about their expiring past policy
 */
export const sendPolicyExpirationEmail = action({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
    policyName: v.string(),
    policyId: v.id("_storage"), // This is the storageId for past policies
    expiryDate: v.string(),
    daysRemaining: v.number(),
    provider: v.optional(v.string()),
    type: v.optional(v.string()),
    premium: v.optional(v.string()),
    sumInsured: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      userEmail,
      userName,
      policyName,
      expiryDate,
      provider,
      type,
      premium,
      sumInsured,
    } = args;

    const formattedDate = new Date(expiryDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Use more urgent language since it's expiring tomorrow
    const subject = `URGENT: Your ${policyName} policy expires TOMORROW`;

    const text = `
Hello ${userName || "Valued Customer"},

This is an urgent reminder that your ${type || ""} insurance policy with ${provider || "your provider"} will expire TOMORROW.

Policy Details:
- Policy Name: ${policyName}
- Policy Type: ${type || "Insurance Policy"}
- Provider: ${provider || "Your Insurance Provider"}
- Premium: ${premium || "Not specified"}
- Sum Insured: ${sumInsured || "Not specified"}
- Expiration Date: ${formattedDate} (TOMORROW)

IMMEDIATE ACTION REQUIRED: Please contact your insurance provider immediately to ensure continuous coverage.

This policy was uploaded by you to our system, and we're sending this reminder as a courtesy. 
Please note that this is not an automatically renewable policy through our platform.

Thank you for using Insurance AI to manage your insurance needs.

Regards,
Insurance AI Team
`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">URGENT: Policy Expires Tomorrow</h2>
  <p>Hello ${userName || "Valued Customer"},</p>
  <p>This is an <strong>urgent reminder</strong> that your ${type || ""} insurance policy with ${provider || "your provider"} will expire <strong>TOMORROW</strong>.</p>
  
  <div style="margin: 20px 0; padding: 15px; border: 1px solid #dc2626; border-radius: 5px; background-color: #fee2e2;">
    <h3 style="margin-top: 0; color: #dc2626;">Policy Details:</h3>
    <p><strong>Policy Name:</strong> ${policyName}</p>
    <p><strong>Policy Type:</strong> ${type || "Insurance Policy"}</p>
    <p><strong>Provider:</strong> ${provider || "Your Insurance Provider"}</p>
    <p><strong>Premium:</strong> ${premium || "Not specified"}</p>
    <p><strong>Sum Insured:</strong> ${sumInsured || "Not specified"}</p>
    <p><strong>Expiration Date:</strong> <span style="color: #dc2626; font-weight: bold;">${formattedDate} (TOMORROW)</span></p>
  </div>
  
  <div style="background-color: #dc2626; color: white; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin: 0;">IMMEDIATE ACTION REQUIRED</h3>
    <p style="margin: 5px 0 0 0;">Please contact your insurance provider immediately to ensure continuous coverage.</p>
  </div>
  
  <p>This policy was uploaded by you to our system, and we're sending this reminder as a courtesy.</p>
  <p>Please note that this is not an automatically renewable policy through our platform.</p>
  
  <p style="margin-top: 30px;">Thank you for using Insurance AI to manage your insurance needs.</p>
  
  <p style="margin-top: 20px;">Regards,<br>Insurance AI Team</p>
</div>
`;

    try {
      const result = await sendEmail({
        to: userEmail,
        subject,
        text,
        html,
      });

      console.log(
        `Policy expiration email sent to ${userEmail} for policy ${policyName}`
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Failed to send policy expiration email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
