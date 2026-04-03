import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles').select('stripe_subscription_id').eq('id', user.id).single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await supabase.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', user.id);

    return NextResponse.json({ success: true, message: 'Subscription will cancel at end of period' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
