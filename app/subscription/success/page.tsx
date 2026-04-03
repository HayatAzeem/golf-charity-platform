'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Trophy, Heart, Target } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const t = setTimeout(() => router.push('/dashboard'), 8000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-green-900/30 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-green-900/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 mb-6 glow-green">
          <CheckCircle className="text-green-400" size={36} />
        </div>

        <h1 className="font-display text-4xl font-black text-white mb-3">
          Welcome to the game!
        </h1>
        <p className="text-slate-400 text-lg mb-10">
          Your membership is active. You&apos;re now part of something bigger than a scorecard.
        </p>

        <div className="glass rounded-2xl p-6 border border-green-500/20 mb-8">
          <h2 className="text-white font-semibold mb-4">What happens next</h2>
          <div className="space-y-4">
            {[
              { icon: Target, label: 'Log your first score', desc: 'Enter your Stableford points in your dashboard', color: 'green' },
              { icon: Heart, label: 'Charity receives your contribution', desc: 'Your chosen charity gets funded this month', color: 'red' },
              { icon: Trophy, label: 'Monthly draw entry', desc: "You'll be automatically entered into the next draw", color: 'amber' },
            ].map(({ icon: Icon, label, desc, color }, i) => (
              <div key={i} className="flex items-start gap-3 text-left">
                <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`text-${color}-400`} size={18} />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{label}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/dashboard" className="btn-primary w-full justify-center py-4 text-base">
          Go to Dashboard <ArrowRight size={18} />
        </Link>
        <p className="text-slate-500 text-xs mt-4">Redirecting automatically in 8 seconds...</p>
      </div>
    </div>
  );
}
