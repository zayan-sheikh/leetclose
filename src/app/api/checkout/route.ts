import { NextResponse } from "next/server";

/**
 * Creates a Stripe Checkout Session when STRIPE_SECRET_KEY + STRIPE_PRICE_ID are set.
 * Otherwise returns NEXT_PUBLIC_STRIPE_PAYMENT_LINK if defined (Payment Link URL).
 */
export async function POST() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (secret && priceId) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secret);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?checkout=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?checkout=cancel`,
        allow_promotion_codes: true,
      });
      if (session.url) {
        return NextResponse.json({ url: session.url });
      }
    } catch (e) {
      console.error("Stripe checkout error:", e);
    }
  }

  if (paymentLink) {
    return NextResponse.json({ url: paymentLink });
  }

  return NextResponse.json(
    {
      error: "not_configured",
      message:
        "Set STRIPE_SECRET_KEY + STRIPE_PRICE_ID or NEXT_PUBLIC_STRIPE_PAYMENT_LINK in .env",
    },
    { status: 501 }
  );
}
