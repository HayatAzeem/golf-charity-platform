'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, ArrowRight, User, Mail, Lock, Heart, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Charity } from '@/types';

type Step = 'account' | 'charity' | 'plan';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'monthly';
  const supabase = createClient();

  const [step, setStep] = useState<Step>('account');
  const [loading, setLoading] = useState(false);
  const [charities, setCharities] = useState<Charity[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    charityId: '',
    charityPercentage: 10,
    plan: initialPlan as 'monthly' | 'yearly',
  });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    supabase.from('charities').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setCharities(data as Charity[]);
    });
  }, []);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setStep('charity');
  };

  const handleCharitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.charityId) {
      toast.error('Please select a charity to support');
      return;
    }
    setStep('plan');
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      // Update profile with charity and plan preference
      await supabase.from('profiles').update({
        selected_charity_id: formData.charityId,
        charity_percentage: formData.charityPercentage,
      }).eq('id', authData.user.id);

      // Redirect to subscription checkout
      router.push(`/subscription/checkout?plan=${formData.plan}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      toast.error(msg);
      setLoading(false);
    }
  };

  const steps = [
    { key: 'account', label: 'Account' },
    { key: 'charity', label: 'Charity' },
    { key: 'plan', label: 'Plan' },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === step);

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
          <h1 className="font-display text-3xl font-bold text-white mb-2">Join GolfGives</h1>
          <p className="text-slate-400">Play golf. Win prizes. Fund change.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentStepIndex
                  ? 'bg-green-500 text-white'
                  : i === currentStepIndex
                  ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                  : 'bg-white/5 border border-white/10 text-slate-500'
              }`}>
                {i < currentStepIndex ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-sm ${i === currentStepIndex ? 'text-white' : 'text-slate-500'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${i < currentStepIndex ? 'bg-green-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">
          {/* Step 1: Account Details */}
          {step === 'account' && (
            <form onSubmit={handleAccountSubmit} className="space-y-5">
              <h2 className="font-semibold text-white text-lg mb-4">Create your account</h2>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-field pl-10"
                    placeholder="John Smith"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="input-field pl-10 pr-12"
                    placeholder="Min. 8 characters"
                    required minLength={8}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-3">
                Continue <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Step 2: Charity Selection */}
          {step === 'charity' && (
            <form onSubmit={handleCharitySubmit} className="space-y-5">
              <h2 className="font-semibold text-white text-lg mb-1">Choose your charity</h2>
              <p className="text-slate-400 text-sm mb-4">A minimum of 10% of your subscription goes directly to your chosen charity.</p>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {charities.map(charity => (
                  <label key={charity.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.charityId === charity.id
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="charity"
                      value={charity.id}
                      checked={formData.charityId === charity.id}
                      onChange={e => setFormData({ ...formData, charityId: e.target.value })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      formData.charityId === charity.id ? 'border-green-500 bg-green-500' : 'border-white/30'
                    }`}>
                      {formData.charityId === charity.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{charity.name}</div>
                      <div className="text-slate-400 text-xs mt-1 line-clamp-2">{charity.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Charity percentage: <span className="text-green-400 font-bold">{formData.charityPercentage}%</span>
                </label>
                <input
                  type="range"
                  min={10} max={100} step={5}
                  value={formData.charityPercentage}
                  onChange={e => setFormData({ ...formData, charityPercentage: parseInt(e.target.value) })}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10% (min)</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('account')} className="btn-outline flex-1 justify-center py-3">Back</button>
                <button type="submit" className="btn-primary flex-1 justify-center py-3">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Plan Selection */}
          {step === 'plan' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-white text-lg mb-1">Choose your plan</h2>
              <div className="space-y-4">
                {[
                  { id: 'monthly' as const, name: 'Monthly', price: '£19.99/mo', desc: 'Flexible monthly billing', features: ['Monthly draw entry', 'Min 10% to charity', 'Full dashboard access'] },
                  { id: 'yearly' as const, name: 'Annual', price: '£199.90/yr', badge: 'Save £39.98', desc: '2 months free', features: ['Everything monthly', '2 months free', 'Priority support'] },
                ].map(plan => (
                  <label key={plan.id} className={`flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all ${
                    formData.plan === plan.id ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-white/20'
                  }`}>
                    <input type="radio" name="plan" value={plan.id} checked={formData.plan === plan.id} onChange={() => setFormData({ ...formData, plan: plan.id })} className="sr-only" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      formData.plan === plan.id ? 'border-green-500 bg-green-500' : 'border-white/30'
                    }`}>
                      {formData.plan === plan.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{plan.name}</span>
                        {plan.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">{plan.badge}</span>
                        )}
                        <span className="ml-auto text-green-400 font-bold">{plan.price}</span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{plan.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Summary */}
              <div className="glass rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Heart size={14} className="text-red-400" />
                  <span className="text-slate-300 text-sm font-medium">Your charity impact</span>
                </div>
                <p className="text-slate-400 text-sm">
                  <span className="text-green-400 font-semibold">{formData.charityPercentage}%</span> of your subscription goes directly to{' '}
                  <span className="text-white">{charities.find(c => c.id === formData.charityId)?.name || 'your charity'}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('charity')} className="btn-outline flex-1 justify-center py-3">Back</button>
                <button onClick={handleFinalSubmit} className="btn-primary flex-1 justify-center py-3" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2"><div className="spinner w-4 h-4" /> Processing...</span>
                  ) : (
                    <span className="flex items-center gap-2">Continue to Payment <ArrowRight size={16} /></span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-green-400 hover:text-green-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
