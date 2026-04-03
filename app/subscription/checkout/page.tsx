'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Shield, Check, ArrowRight, CreditCard, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>(
    (searchParams.get('plan') as 'monthly' | 'yearly') || 'monthly'
  );
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUser({ id: data.user.id, email: data.user.email! });
    });
  }, []);

  const handleCheckout = async () => {
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout failed';
      toast.error(msg);
      setLoading(false);
    }
  };

  const plans = {
    monthly: { name: 'Monthly', price: '£19.99', period: '/month', prizePool: '£14.00', charity: '£2.00+', platform: '£3.99' },
    yearly: { name: 'Annual', price: '£199.90', period: '/year', prizePool: '£140.00', charity: '£20.00+', platform: '£39.90', badge: 'Save £39.98' },
  };
  const selected = plans[plan];

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-green-900/20 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-green-900/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-display text-xl font-bold text-white">GolfGives</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Complete your membership</h1>
          <p className="text-slate-400">You&apos;re one step away from playing with purpose</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">
          {/* Plan toggle */}
          <div className="flex gap-3 mb-6">
            {(['monthly', 'yearly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all relative ${
                  plan === p
                    ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400'
                    : 'glass border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {plans[p].name}
                {p === 'yearly' && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                    Save
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="glass rounded-xl p-5 mb-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-display text-3xl font-black text-white">{selected.price}</span>
                <span className="text-slate-400 text-sm">{selected.period}</span>
              </div>
              {plan === 'yearly' && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                  {selected.badge}
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Prize pool contribution</span>
                <span className="text-white font-medium">{selected.prizePool}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Charity contribution (min 10%)</span>
                <span className="text-green-400 font-medium">{selected.charity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform fee</span>
                <span className="text-slate-400">{selected.platform}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 mb-6">
            {[
              'Monthly prize draw entry',
              'Score tracking (5 rolling rounds)',
              'Charity contribution tracking',
              'Winner verification portal',
              'Cancel anytime',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-green-400" />
                </div>
                {f}
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary w-full justify-center py-4 text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2"><div className="spinner w-4 h-4" /> Redirecting to Stripe...</span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard size={18} /> Pay with Stripe <ArrowRight size={16} />
              </span>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-xs">
            <Lock size={12} />
            <span>Secure payment via Stripe · PCI compliant · Cancel anytime</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-slate-500 text-sm">
          <Shield size={14} className="text-green-500" />
          <span>Your payment is processed securely by Stripe</span>
        </div>
      </div>
    </div>
  );
}
