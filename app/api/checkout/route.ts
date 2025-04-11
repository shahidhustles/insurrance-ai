import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
// In production, this should be securely stored in environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { policyId, policyName, price, userId } = body;

    // Validate the request data
    if (!policyId || !policyName || !price || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: policyName,
              description: `Policy ID: ${policyId}`,
            },
            unit_amount: Math.round(price * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        policyId,
        userId,
      },
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000"}/dashboard/customer/${userId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000"}/policy/${policyId}?canceled=true`,
    });

    // Return the session URL for redirection
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
