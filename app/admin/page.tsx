'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Users, Trophy, Heart, DollarSign, BarChart2,
  Settings, LogOut, TrendingUp, AlertCircle,
  UserCheck, Shuffle, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePool: number;
  totalCharityContributions: number;
  pendingWinners: number;
  scheduledDraws: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') { router.push('/dashboard'); return; }

    const [usersRes, activeRes, winnersRes, drawsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('subscription_status', 'active'),
      supabase.from('winners').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('draws').select('id', { count: 'exact' }).eq('status', 'scheduled'),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      activeSubscribers: activeRes.count || 0,
      totalPrizePool: (activeRes.count || 0) * 14,
      totalCharityContributions: (activeRes.count || 0) * 2,
      pendingWinners: winnersRes.count || 0,
      scheduledDraws: drawsRes.count || 0,
    });
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadStats(); }, [loadStats]);

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

  const navItems = [
    { href: '/admin', icon: BarChart2, label: 'Overview', active: true },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/draws', icon: Shuffle, label: 'Draws' },
    { href: '/admin/winners', icon: Trophy, label: 'Winners' },
    { href: '/admin/charities', icon: Heart, label: 'Charities' },
    { href: '/admin/reports', icon: TrendingUp, label: 'Reports' },
  ];

  return (
    <div className="min-h-screen animated-bg">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 flex flex-col z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <Shield className="text-white" size={14} />
            </div>
            <span className="font-display text-xl font-bold text-white">Admin</span>
          </div>
          <p className="text-slate-500 text-xs mb-8">GolfGives Control Panel</p>

          <div className="space-y-1">
            {navItems.map(({ href, icon: Icon, label, active }) => (
              <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto p-6">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-3">
            <Settings size={16} /> Back to Site
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-slate-500 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="pl-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-white">Dashboard Overview</h1>
            <p className="text-slate-400 mt-1">Platform health at a glance</p>
          </div>

          {/* Alerts */}
          {(stats?.pendingWinners || 0) > 0 && (
            <div className="glass rounded-xl p-4 border border-amber-500/30 bg-amber-500/5 mb-6 flex items-center gap-3">
              <AlertCircle className="text-amber-400 flex-shrink-0" size={18} />
              <div className="flex-1">
                <span className="text-white font-medium">{stats?.pendingWinners} winner{(stats?.pendingWinners || 0) > 1 ? 's' : ''} awaiting verification</span>
              </div>
              <Link href="/admin/winners" className="text-amber-400 hover:text-amber-300 text-sm font-medium">Review →</Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[
              { icon: Users, label: 'Total Users', value: stats?.totalUsers || 0, color: 'blue', sub: `${stats?.activeSubscribers} active` },
              { icon: UserCheck, label: 'Active Subscribers', value: stats?.activeSubscribers || 0, color: 'green', sub: 'paying members' },
              { icon: DollarSign, label: 'Prize Pool This Month', value: `£${((stats?.totalPrizePool || 0)).toLocaleString()}`, color: 'amber', sub: 'estimated' },
              { icon: Heart, label: 'Charity Contributions', value: `£${((stats?.totalCharityContributions || 0)).toLocaleString()}`, color: 'red', sub: 'this month est.' },
              { icon: Trophy, label: 'Pending Verifications', value: stats?.pendingWinners || 0, color: 'amber', sub: 'need review' },
              { icon: Shuffle, label: 'Scheduled Draws', value: stats?.scheduledDraws || 0, color: 'purple', sub: 'upcoming' },
            ].map(({ icon: Icon, label, value, color, sub }, i) => (
              <div key={i} className="glass rounded-xl p-5 card-hover">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-${color}-500/10 mb-3`}>
                  <Icon className={`text-${color}-400`} size={18} />
                </div>
                <div className="font-bold text-white text-2xl">{value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{label}</div>
                <div className="text-slate-600 text-xs">{sub}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                href: '/admin/draws',
                icon: Shuffle,
                title: 'Manage Draws',
                desc: 'Configure, simulate, and publish monthly prize draws',
                color: 'amber',
              },
              {
                href: '/admin/winners',
                icon: Trophy,
                title: 'Verify Winners',
                desc: 'Review proof submissions and approve payouts',
                color: 'green',
              },
              {
                href: '/admin/charities',
                icon: Heart,
                title: 'Manage Charities',
                desc: 'Add, edit, and feature charity listings',
                color: 'red',
              },
            ].map(({ href, icon: Icon, title, desc, color }, i) => (
              <Link
                key={i}
                href={href}
                className={`glass rounded-xl p-5 card-hover border border-${color}-500/10 hover:border-${color}-500/30 transition-colors block`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-${color}-500/10 mb-4`}>
                  <Icon className={`text-${color}-400`} size={22} />
                </div>
                <h3 className="text-white font-semibold mb-1">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
