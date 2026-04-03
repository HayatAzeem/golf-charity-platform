'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  TrendingUp, BarChart2, Users, Shuffle, Trophy,
  Heart, LogOut, Shield, ChevronLeft, DollarSign,
  UserCheck, Activity
} from 'lucide-react';

interface ReportData {
  totalUsers: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalDraws: number;
  totalWinners: number;
  totalPrizePaid: number;
  totalCharityContributed: number;
  charityBreakdown: Array<{ name: string; count: number; total_raised: number }>;
  recentDraws: Array<{ title: string; draw_date: string; total_pool: number; status: string }>;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return false; }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (p?.role !== 'admin') { router.push('/dashboard'); return false; }
    return true;
  }, [supabase, router]);

  const loadReports = useCallback(async () => {
    const ok = await checkAdmin();
    if (!ok) return;

    const [
      usersRes, activeRes, drawsRes, winnersRes,
      paidRes, charitiesRes, recentDrawsRes
    ] = await Promise.all([
      supabase.from('profiles').select('id, subscription_plan', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('subscription_status', 'active'),
      supabase.from('draws').select('id', { count: 'exact' }),
      supabase.from('winners').select('id', { count: 'exact' }),
      supabase.from('winners').select('prize_amount').eq('status', 'paid'),
      supabase.from('charities').select('name, total_raised').order('total_raised', { ascending: false }),
      supabase.from('draws').select('title, draw_date, total_pool, status').order('draw_date', { ascending: false }).limit(6),
    ]);

    const monthlyCount = (usersRes.data || []).filter(u => u.subscription_plan === 'monthly').length;
    const yearlyCount = (usersRes.data || []).filter(u => u.subscription_plan === 'yearly').length;
    const totalPaid = (paidRes.data || []).reduce((acc, w) => acc + w.prize_amount, 0);

    setData({
      totalUsers: usersRes.count || 0,
      activeSubscribers: activeRes.count || 0,
      monthlyRevenue: monthlyCount * 19.99,
      yearlyRevenue: yearlyCount * (199.90 / 12),
      totalDraws: drawsRes.count || 0,
      totalWinners: winnersRes.count || 0,
      totalPrizePaid: totalPaid,
      totalCharityContributed: (activeRes.count || 0) * 2,
      charityBreakdown: (charitiesRes.data || []).map(c => ({ name: c.name, count: 0, total_raised: c.total_raised })),
      recentDraws: recentDrawsRes.data || [],
    });
    setLoading(false);
  }, [checkAdmin, supabase]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin', icon: BarChart2, label: 'Overview' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/draws', icon: Shuffle, label: 'Draws' },
    { href: '/admin/winners', icon: Trophy, label: 'Winners' },
    { href: '/admin/charities', icon: Heart, label: 'Charities' },
    { href: '/admin/reports', icon: TrendingUp, label: 'Reports', active: true },
  ];

  return (
    <div className="min-h-screen animated-bg">
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
                active ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
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

      <main className="pl-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin" className="text-slate-500 hover:text-slate-300"><ChevronLeft size={20} /></Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Reports & Analytics</h1>
              <p className="text-slate-400 mt-1">Platform performance overview</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16"><div className="spinner mx-auto" style={{ width: 40, height: 40 }} /></div>
          ) : data && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Users, label: 'Total Users', value: data.totalUsers, color: 'blue' },
                  { icon: UserCheck, label: 'Active Subscribers', value: data.activeSubscribers, color: 'green' },
                  { icon: DollarSign, label: 'Est. Monthly Revenue', value: `£${(data.monthlyRevenue + data.yearlyRevenue).toFixed(0)}`, color: 'amber' },
                  { icon: Heart, label: 'Charity This Month', value: `£${data.totalCharityContributed.toFixed(0)}`, color: 'red' },
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <div key={i} className="glass rounded-xl p-5">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-${color}-500/10 mb-3`}>
                      <Icon className={`text-${color}-400`} size={18} />
                    </div>
                    <div className="font-bold text-white text-2xl">{value}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Draw Statistics */}
                <div className="glass rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-5">
                    <Activity className="text-amber-400" size={18} />
                    <h2 className="font-semibold text-white">Draw Statistics</h2>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Total Draws Run', value: data.totalDraws },
                      { label: 'Total Winners', value: data.totalWinners },
                      { label: 'Total Prizes Paid', value: `£${data.totalPrizePaid.toFixed(2)}` },
                    ].map(({ label, value }, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <span className="text-slate-400 text-sm">{label}</span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recent Draws */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Recent Draws</h3>
                    <div className="space-y-2">
                      {data.recentDraws.map((draw, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300 truncate max-w-40">{draw.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 font-medium">£{draw.total_pool.toFixed(0)}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              draw.status === 'completed' || draw.status === 'published'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}>{draw.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Charity Contributions */}
                <div className="glass rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-5">
                    <Heart className="text-red-400" size={18} />
                    <h2 className="font-semibold text-white">Charity Contributions</h2>
                  </div>
                  <div className="space-y-3">
                    {data.charityBreakdown.map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-300 text-sm truncate max-w-48">{c.name}</span>
                            <span className="text-green-400 font-medium text-sm">£{c.total_raised.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400"
                              style={{
                                width: `${Math.min(100, (c.total_raised / Math.max(...data.charityBreakdown.map(x => x.total_raised), 1)) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {data.charityBreakdown.length === 0 && (
                      <p className="text-slate-500 text-sm text-center py-4">No charity data yet</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
