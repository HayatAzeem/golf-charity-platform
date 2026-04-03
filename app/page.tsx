'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, Heart, Trophy, TrendingUp, Star, ChevronDown, Users, Gift, Target } from 'lucide-react';

const CHARITIES = [
  "Children's Heart Foundation",
  "Veterans on the Fairway",
  "Junior Golf Scholarships",
  "Green Earth Initiative",
  "Golf For Good",
];

function AnimatedNumber({ end, prefix = '', suffix = '', duration = 2000 }: {
  end: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStarted(true);
    });
    const el = document.getElementById('stats-section');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const [activeCharity, setActiveCharity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCharity(p => (p + 1) % CHARITIES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen animated-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-display text-xl font-bold text-white">GolfGives</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/charities" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Charities</Link>
            <Link href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">How It Works</Link>
            <Link href="/#draws" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Prize Draws</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium px-4 py-2">Sign In</Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-5">
              Start Playing <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-green-900/20 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-green-900/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-green-950/30 blur-[120px]" />
          {/* Floating number balls */}
          {[7, 14, 21, 32, 38].map((num, i) => (
            <div
              key={i}
              className="absolute number-ball bg-white/5 border border-white/10 text-white/20 text-lg"
              style={{
                left: `${15 + i * 18}%`,
                top: `${20 + (i % 3) * 20}%`,
                animation: `float ${5 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.8}s`,
              }}
            >
              {num}
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Live charity counter */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/30 text-green-400 text-sm mb-8">
            <div className="w-2 h-2 rounded-full bg-green-400 relative pulse-badge" />
            <span>Currently funding:</span>
            <span className="font-semibold text-white transition-all duration-500">{CHARITIES[activeCharity]}</span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl font-black text-white mb-6 leading-none tracking-tight">
            Your game.{' '}
            <span className="gradient-text block">Their future.</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enter your golf scores monthly, compete in prize draws, and automatically 
            fund the causes that matter most to you. Golf with purpose.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Join & Start Giving <ArrowRight size={18} />
            </Link>
            <Link href="/#how-it-works" className="btn-outline text-base px-8 py-4">
              See How It Works
            </Link>
          </div>

          {/* Prize tiers preview */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { match: '5 Numbers', prize: 'JACKPOT', color: 'from-amber-500/20 to-amber-700/20', border: 'border-amber-500/30', text: 'text-amber-400' },
              { match: '4 Numbers', prize: '35% Pool', color: 'from-slate-500/20 to-slate-700/20', border: 'border-slate-500/30', text: 'text-slate-300' },
              { match: '3 Numbers', prize: '25% Pool', color: 'from-green-500/20 to-green-700/20', border: 'border-green-500/30', text: 'text-green-400' },
            ].map((tier, i) => (
              <div key={i} className={`rounded-xl bg-gradient-to-br ${tier.color} border ${tier.border} p-4`}>
                <div className={`font-bold text-sm ${tier.text}`}>{tier.prize}</div>
                <div className="text-slate-400 text-xs mt-1">{tier.match}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 animate-bounce">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Users, label: 'Active Members', value: 12847, suffix: '+' },
            { icon: Gift, label: 'Prize Pool This Month', value: 24, prefix: '£', suffix: 'k' },
            { icon: Heart, label: 'Raised for Charity', value: 186, prefix: '£', suffix: 'k' },
            { icon: Trophy, label: 'Winners Paid Out', value: 1247 },
          ].map(({ icon: Icon, label, value, prefix, suffix }, i) => (
            <div key={i} className="glass rounded-2xl p-6 text-center card-hover">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/10 mb-4">
                <Icon className="text-green-400" size={22} />
              </div>
              <div className="font-display text-3xl font-bold text-white mb-1">
                <AnimatedNumber end={value} prefix={prefix} suffix={suffix} />
              </div>
              <div className="text-slate-400 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <span className="text-green-400 font-mono text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
              Three steps to impact
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              No complexity. Just golf scores, prize draws, and real charitable impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Target,
                title: 'Subscribe & Choose',
                description: 'Pick your plan, select a charity to support, and set your giving percentage. It all starts here.',
                accent: 'green',
              },
              {
                step: '02',
                icon: TrendingUp,
                title: 'Log Your Scores',
                description: 'Enter your latest Stableford scores. Your 5 most recent rounds are always live in your dashboard.',
                accent: 'blue',
              },
              {
                step: '03',
                icon: Trophy,
                title: 'Win & Give',
                description: 'Monthly draws compare your scores against the winning numbers. Match 3, 4, or all 5 to win.',
                accent: 'amber',
              },
            ].map(({ step, icon: Icon, title, description, accent }, i) => (
              <div key={i} className="relative group">
                <div className={`glass rounded-2xl p-8 h-full card-hover border border-${accent}-500/10 group-hover:border-${accent}-500/30 transition-colors`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-${accent}-500/10`}>
                      <Icon className={`text-${accent}-400`} size={26} />
                    </div>
                    <span className="font-display font-black text-5xl text-white/5">{step}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-3">{title}</h3>
                  <p className="text-slate-400 leading-relaxed">{description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 z-10 text-slate-700">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Draw Mechanics */}
      <section id="draws" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-amber-400 font-mono text-sm uppercase tracking-widest">Monthly Prize Draws</span>
              <h2 className="font-display text-4xl font-bold text-white mt-3 mb-6">
                Your scores are your{' '}
                <span className="gold-text">lottery numbers</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Every month, we draw 5 winning numbers from the Stableford range (1–45). 
                If your recent scores match 3, 4, or all 5 numbers, you win a share of the prize pool.
              </p>
              <div className="space-y-4">
                {[
                  { match: '5 Numbers', pool: '40% of Pool + Rollover Jackpot', icon: '🏆', color: 'amber' },
                  { match: '4 Numbers', pool: '35% of Prize Pool', icon: '🥈', color: 'slate' },
                  { match: '3 Numbers', pool: '25% of Prize Pool', icon: '🥉', color: 'green' },
                ].map(({ match, pool, icon, color }, i) => (
                  <div key={i} className={`glass rounded-xl p-4 flex items-center gap-4 border border-${color}-500/20`}>
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="font-semibold text-white">{match}</div>
                      <div className="text-slate-400 text-sm">{pool}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live draw preview */}
            <div className="relative">
              <div className="glass rounded-3xl p-8 glow-green">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-400 text-sm font-medium">July 2025 Draw</span>
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
                    PUBLISHED
                  </span>
                </div>
                <div className="text-center mb-8">
                  <p className="text-slate-400 text-sm mb-4">Winning Numbers</p>
                  <div className="flex justify-center gap-3">
                    {[7, 14, 21, 32, 38].map((num, i) => (
                      <div
                        key={i}
                        className="number-ball bg-gradient-to-br from-amber-500 to-amber-700 text-white glow-gold"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 border-t border-white/10 pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Prize Pool</span>
                    <span className="text-white font-semibold">£24,850</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">5-Match Jackpot</span>
                    <span className="text-amber-400 font-bold">£9,940 🎉</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">4-Match Winners</span>
                    <span className="text-white font-semibold">3 winners × £2,899</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">3-Match Winners</span>
                    <span className="text-white font-semibold">18 winners × £345</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/10 to-transparent" />
        <div className="max-w-4xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <span className="text-green-400 font-mono text-sm uppercase tracking-widest">Membership</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 text-lg">Every penny split between prizes and charity.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Monthly',
                price: '£19.99',
                period: '/month',
                features: [
                  '5 scores always active',
                  'Monthly prize draw entry',
                  'Min 10% to your charity',
                  'Winner dashboard',
                  'Score history',
                ],
                cta: 'Start Monthly',
                href: '/signup?plan=monthly',
                highlight: false,
              },
              {
                name: 'Annual',
                price: '£199.90',
                period: '/year',
                badge: 'Save £39.98',
                features: [
                  'Everything in Monthly',
                  '2 months free',
                  'Priority draw entry',
                  'Exclusive charity events',
                  'Advanced analytics',
                ],
                cta: 'Start Annual',
                href: '/signup?plan=yearly',
                highlight: true,
              },
            ].map(({ name, price, period, badge, features, cta, href, highlight }, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 relative ${
                  highlight
                    ? 'bg-gradient-to-br from-green-900/40 to-green-800/20 border-2 border-green-500/40 glow-green'
                    : 'glass border border-white/10'
                }`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold">
                      {badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-300 mb-2">{name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="font-display text-4xl font-black text-white">{price}</span>
                    <span className="text-slate-400 mb-1">{period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Star size={10} className="text-green-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                    highlight
                      ? 'btn-primary justify-center w-full'
                      : 'btn-outline justify-center w-full'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-display text-xl font-bold text-white">GolfGives</span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              A portion of every subscription goes to charity. Play with purpose.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Privacy</Link>
              <Link href="/terms" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Terms</Link>
              <Link href="/contact" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
