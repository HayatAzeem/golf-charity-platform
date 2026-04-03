'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Settings, User, CreditCard, Heart, Bell, LogOut,
  TrendingUp, Trophy, Target, Calendar, AlertTriangle,
  Check, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile, Charity } from '@/types';
import { format } from 'date-fns';

export default function DashboardSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [form, setForm] = useState({ full_name: '', charity_percentage: 10, selected_charity_id: '' });

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [profileRes, charitiesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('charities').select('*').eq('is_active', true),
    ]);

    const prof = profileRes.data as Profile;
    setProfile(prof);
    setCharities((charitiesRes.data || []) as Charity[]);
    setForm({
      full_name: prof?.full_name || '',
      charity_percentage: prof?.charity_percentage || 10,
      selected_charity_id: prof?.selected_charity_id || '',
    });
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id);
    if (error) { toast.error('Failed to save settings'); } else { toast.success('Settings saved!'); }
    setSaving(false);
    loadData();
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel? Your subscription will remain active until the end of the billing period.')) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' });
      const data = await res.json();
      if (data.success) { toast.success('Subscription cancelled. Active until end of period.'); loadData(); }
      else { toast.error(data.error || 'Cancellation failed'); }
    } catch {
      toast.error('Cancellation failed');
    } finally { setCancelling(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const isActive = profile?.subscription_status === 'active';

  const navItems = [
    { href: '/dashboard', icon: TrendingUp, label: 'Overview' },
    { href: '/dashboard/scores', icon: Target, label: 'My Scores' },
    { href: '/dashboard/draws', icon: Trophy, label: 'Prize Draws' },
    { href: '/dashboard/winnings', icon: Trophy, label: 'Winnings' },
    { href: '/dashboard/charity', icon: Heart, label: 'My Charity' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings', active: true },
  ];

  return (
    <div className="min-h-screen animated-bg">
      <div className="fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 flex flex-col z-40 hidden lg:flex">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-display text-xl font-bold text-white">GolfGives</span>
          </Link>
          <div className="space-y-1">
            {navItems.map(({ href, icon: Icon, label, active }) => (
              <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
                <Icon size={18} />{label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-auto p-6">
          <button onClick={handleSignOut} className="flex items-center gap-2 text-slate-500 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <main className="lg:pl-64 p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-white">Account Settings</h1>
            <p className="text-slate-400 mt-1">Manage your profile, subscription, and preferences</p>
          </div>

          {/* Profile */}
          <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <User size={18} className="text-green-400" />
              <h2 className="font-semibold text-white">Profile Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Full Name</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Email Address</label>
                <input value={profile?.email || ''} className="input-field opacity-50 cursor-not-allowed" disabled />
                <p className="text-slate-600 text-xs mt-1">Email cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Charity */}
          <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Heart size={18} className="text-red-400" />
              <h2 className="font-semibold text-white">Charity Preferences</h2>
            </div>
            <div className="mb-4">
              <label className="block text-slate-400 text-sm mb-2">Supported Charity</label>
              <select
                value={form.selected_charity_id}
                onChange={e => setForm({ ...form, selected_charity_id: e.target.value })}
                className="input-field"
              >
                <option value="">Select a charity...</option>
                {charities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">
                Charity Contribution: <span className="text-green-400 font-bold">{form.charity_percentage}%</span>
              </label>
              <input
                type="range" min={10} max={100} step={5}
                value={form.charity_percentage}
                onChange={e => setForm({ ...form, charity_percentage: parseInt(e.target.value) })}
                className="w-full accent-green-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10% (minimum)</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center py-3 mb-8">
            {saving ? <span className="flex items-center gap-2"><div className="spinner w-4 h-4" /> Saving...</span>
              : <span className="flex items-center gap-2"><Check size={16} /> Save Changes</span>}
          </button>

          {/* Subscription */}
          <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={18} className="text-amber-400" />
              <h2 className="font-semibold text-white">Subscription</h2>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={`font-medium ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {profile?.subscription_status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Plan</span>
                <span className="text-white capitalize">{profile?.subscription_plan || 'None'}</span>
              </div>
              {profile?.subscription_end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    <Calendar size={12} className="inline mr-1" />
                    {profile.subscription_status === 'cancelled' ? 'Active Until' : 'Renews'}
                  </span>
                  <span className="text-white">{format(new Date(profile.subscription_end_date), 'dd MMM yyyy')}</span>
                </div>
              )}
            </div>

            {!isActive && (
              <Link href="/subscription/checkout" className="btn-primary w-full justify-center py-3 block text-center">
                Reactivate Membership <ChevronRight size={16} />
              </Link>
            )}

            {isActive && profile?.subscription_status !== 'cancelled' && (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors mt-2"
              >
                <AlertTriangle size={14} />
                {cancelling ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            )}
          </div>

          {/* Notifications placeholder */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-blue-400" />
              <h2 className="font-semibold text-white">Notifications</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Draw results', desc: 'Get notified when monthly draw results are published' },
                { label: 'Win notifications', desc: "Be alerted immediately when you've won" },
                { label: 'Subscription reminders', desc: 'Renewal and payment notifications' },
              ].map(({ label, desc }, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-white text-sm font-medium">{label}</div>
                    <div className="text-slate-500 text-xs">{desc}</div>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-green-500/20 border border-green-500/30 relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-green-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
