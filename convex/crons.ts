import { cronJobs } from "convex/server";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Define result types to avoid implicit any
type PolicyNotificationResult = {
  policyName: string;
  success: boolean;
  emailResult?: string;
  error?: string;
};

type CustomerNotificationResult = {
  customerId: string;
  success: boolean;
  message?: string;
  error?: string;
  policyNotifications?: PolicyNotificationResult[];
};

type CheckExpiringPoliciesResult = {
  timestamp: string;
  successfulCustomerNotifications: number;
  totalPolicyNotifications: number;
  results: CustomerNotificationResult[];
};

/**
 * Daily check for past policies expiring in < 1 day
 * Runs at 09:00 UTC every day
 */
export const checkExpiringPastPolicies = mutation({
  handler: async (ctx): Promise<CheckExpiringPoliciesResult> => {
    console.log("Running scheduled check for expiring past policies...");

    // Current date in ISO format
    const currentDate = new Date();
    const dateTomorrowEnd = new Date();
    dateTomorrowEnd.setDate(currentDate.getDate() + 1);
    dateTomorrowEnd.setHours(23, 59, 59, 999);

    // Convert to YYYY-MM-DD format for comparison
    const todayStr = currentDate.toISOString().split("T")[0];
    const tomorrowStr = dateTomorrowEnd.toISOString().split("T")[0];

    console.log(
      `Checking for past policies expiring between ${todayStr} and ${tomorrowStr}`
    );

    // Find all customers with past policies
    const customers = await ctx.db
      .query("customers")
      .filter((q) => q.neq(q.field("pastPolicies"), undefined))
      .collect();

    console.log(`Found ${customers.length} customers with past policies`);

    // For each customer, check their past policies for expiring ones
    const notificationResults: CustomerNotificationResult[] = await Promise.all(
      customers.map(async (customer) => {
        try {
          // Skip if no past policies or no userId
          if (!customer.pastPolicies || !customer.userId) {
            return {
              customerId: customer._id,
              success: false,
              error: !customer.pastPolicies ? "No past policies" : "No userId",
            };
          }

          // Filter for policies expiring tomorrow
          const expiringPolicies = customer.pastPolicies.filter((policy) => {
            if (!policy.expiryDate) return false;

            const expiryDate = policy.expiryDate.split("T")[0]; // Get YYYY-MM-DD part
            return expiryDate === tomorrowStr;
          });

          if (expiringPolicies.length === 0) {
            return {
              customerId: customer._id,
              success: true,
              message: "No expiring policies found",
            };
          }

          console.log(
            `Found ${expiringPolicies.length} expiring past policies for customer ${customer._id}`
          );

          // Get user email from Clerk
          const userIdentity = await ctx.auth.getUserIdentity();
          let userEmail = null;

          if (userIdentity) {
            userEmail = userIdentity.email;
          }

          // If still no email, we can't send a notification
          if (!userEmail) {
            return {
              customerId: customer._id,
              success: false,
              error: "Could not determine user email",
            };
          }

          // Process each expiring policy and send notifications
          const policyNotifications = await Promise.all(
            expiringPolicies.map(async (policy) => {
              // Calculate days until expiration (should be 1)
              const expiryDate = new Date(policy.expiryDate);
              const daysRemaining = Math.ceil(
                (expiryDate.getTime() - currentDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              // Send email notification
              try {
                const emailResult = await ctx.scheduler.runAfter(
                  0,
                  api.email.sendPolicyExpirationEmail,
                  {
                    userEmail,
                    userName: customer.name,
                    policyName: policy.name,
                    policyId: policy.storageId, // We'll use the storage ID as a reference
                    expiryDate: policy.expiryDate,
                    daysRemaining,
                    provider: policy.provider,
                    type: policy.type,
                    premium: policy.premium,
                    sumInsured: policy.sumInsured,
                  }
                );

                return {
                  policyName: policy.name,
                  success: true,
                  emailResult,
                };
              } catch (error) {
                console.error(
                  `Failed to send notification for policy ${policy.name}:`,
                  error
                );
                return {
                  policyName: policy.name,
                  success: false,
                  error: error instanceof Error ? error.message : String(error),
                };
              }
            })
          );

          return {
            customerId: customer._id,
            success: true,
            policyNotifications,
          };
        } catch (error) {
          console.error(`Error processing customer ${customer._id}:`, error);
          return {
            customerId: customer._id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    // Count successful notifications
    const successfulCustomerNotifications = notificationResults.filter(
      (result) => result.success
    ).length;
    const totalPolicyNotifications = notificationResults.reduce(
      (count, result) => {
        if (result.success && result.policyNotifications) {
          return (
            count +
            result.policyNotifications.filter(
              (notification) => notification.success
            ).length
          );
        }
        return count;
      },
      0
    );

    console.log(
      `Sent ${totalPolicyNotifications} policy expiration notifications to ${successfulCustomerNotifications} customers`
    );

    return {
      timestamp: new Date().toISOString(),
      successfulCustomerNotifications,
      totalPolicyNotifications,
      results: notificationResults,
    };
  },
});

// Schedule the job to run daily at 9:00 AM UTC
crons.daily(
  "check-expiring-past-policies",
  { hourUTC: 9, minuteUTC: 0 },
  api.crons.checkExpiringPastPolicies
);

export default crons;
