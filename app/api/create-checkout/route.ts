import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@lib/prisma";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const { userId } = await req.json(); // Get userId from the request body

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    let customerId;
    if (user?.stripeCustomerId) {
      // If the user already has a Stripe customer, use that ID
      customerId = user.stripeCustomerId;
    } else {
      // Create a new Stripe customer if none exists
      const customer = await stripe.customers.create({});
      customerId = customer.id;

      // Save the new Stripe customer ID in the database
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: customerId,
          // isActive: true,
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_TEST_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    );
  }
}
