import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

// Initialize the Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  console.log(signature);
  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error) {
    console.error(`Webhook signature verification failed: ${error}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error}` },
      { status: 400 }
    );
  }

  // Handle specific Stripe events
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    console.log("Payment Successful", event);
    const session = event.data.object as Stripe.Checkout.Session;
    // Extract customer and policy information from metadata
    const { policyId, userId } = session.metadata || {};

    if (!policyId || !userId) {
      console.error("Missing metadata in completed checkout session");
      return NextResponse.json(
        { error: "Missing metadata in completed checkout session" },
        { status: 400 }
      );
    }

    try {
      // Get the policy details
      const policy = await convex.query(api.policies.getById, {
        id: policyId as Id<"policies">,
      });

      if (!policy) {
        throw new Error(`Policy not found: ${policyId}`);
      }

      // Get the customer by userId
      const customers = await convex.query(api.customers.getByUserId, {
        userId,
      });

      if (!customers) {
        throw new Error(`Customer not found for user: ${userId}`);
      }

      // Prepare policy data for adding to the customer's pastPolicies
      const policyData = {
        name: policy.name,
        storageId: policy.storageId,
        provider: policy.provider || "",
        type: policy.type || "health", // Default to health if not specified
        sumInsured: policy.sumInsured || "0",
        premium: policy.premium || "0",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Default to 1 year if not specified
        features: policy.features || [],
        purchaseDate: new Date().toISOString().split("T")[0],
      };

      // Add the policy to the customer's pastPolicies
      await convex.mutation(api.customers.addPastPolicy, {
        customerId: customers._id,
        policy: policyData,
      });

      console.log(
        `Successfully added policy ${policyId} to customer ${customers._id}`
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`Error processing successful payment: ${error}`);
      return NextResponse.json(
        { error: `Error processing successful payment: ${error}` },
        { status: 500 }
      );
    }
  }

  // Return a response for other event types
  return NextResponse.json({ received: true });
}
