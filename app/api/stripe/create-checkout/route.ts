import { NextRequest, NextResponse } from 'next/server';
import { stripe, createOrGetCustomer, SUBSCRIPTION_PRICES } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, email } = await request.json();

    if (!plan || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const priceId = plan === 'yearly' ? SUBSCRIPTION_PRICES.yearly : SUBSCRIPTION_PRICES.monthly;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured. Set STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID in your environment variables.' }, { status: 500 });
    }

    // Get or create Stripe customer
    const supabase = createClient();
    const { data: profile } = await supabase.from('profiles').select('full_name, stripe_customer_id').eq('id', userId).single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await createOrGetCustomer(email, profile?.full_name || email);
      customerId = customer.id;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscription/checkout?plan=${plan}`,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session creation failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
