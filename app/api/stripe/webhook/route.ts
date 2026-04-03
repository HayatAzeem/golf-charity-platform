import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const plan = subscription.items.data[0].price.id === process.env.STRIPE_YEARLY_PRICE_ID
          ? 'yearly' : 'monthly';

        const endDate = new Date(subscription.current_period_end * 1000).toISOString();

        await supabase.from('profiles').update({
          subscription_status: 'active',
          subscription_plan: plan,
          subscription_end_date: endDate,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        }).eq('id', userId);

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (profile) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const endDate = new Date(subscription.current_period_end * 1000).toISOString();

          await supabase.from('profiles').update({
            subscription_status: 'active',
            subscription_end_date: endDate,
          }).eq('id', profile.id);
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj = event.data.object as Stripe.Subscription | Stripe.Invoice;
        const subId = 'id' in obj && obj.object === 'subscription'
          ? obj.id
          : (obj as Stripe.Invoice).subscription as string;

        if (subId) {
          const { data: profile } = await supabase
            .from('profiles').select('id').eq('stripe_subscription_id', subId).single();

          if (profile) {
            await supabase.from('profiles').update({
              subscription_status: event.type === 'customer.subscription.deleted' ? 'cancelled' : 'lapsed',
            }).eq('id', profile.id);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('stripe_subscription_id', subscription.id).single();

        if (profile) {
          const status = subscription.status === 'active' ? 'active' :
            subscription.status === 'canceled' ? 'cancelled' : 'lapsed';
          const endDate = new Date(subscription.current_period_end * 1000).toISOString();

          await supabase.from('profiles').update({
            subscription_status: status,
            subscription_end_date: endDate,
          }).eq('id', profile.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
