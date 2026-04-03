'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Trophy, Calendar, Heart, TrendingUp, Target, Settings, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import type { Draw, Winner } from '@/types';

export default function DrawsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [myWinnings, setMyWinnings] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [drawsRes, winnersRes] = await Promise.all([
      supabase.from('draws').select('*').in('status', ['published', 'completed']).order('draw_date', { ascending: false }),
      supabase.from('winners').select('*').eq('user_id', user.id),
    ]);

    setDraws((drawsRes.data || []) as Draw[]);
    setMyWinnings((winnersRes.data || []) as Winner[]);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { load(); }, [load]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', icon: TrendingUp, label: 'Overview' },
    { href: '/dashboard/scores', icon: Target, label: 'My Scores' },
    { href: '/dashboard/draws', icon: Trophy, label: 'Prize Draws', active: true },
    { href: '/dashboard/winnings', icon: Trophy, label: 'Winnings' },
    { href: '/dashboard/charity', icon: Heart, label: 'My Charity' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
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
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-white">Prize Draws</h1>
            <p className="text-slate-400 mt-1">All published monthly draws and results</p>
          </div>

          {loading ? (
            <div className="text-center py-16"><div className="spinner mx-auto" style={{ width: 40, height: 40 }} /></div>
          ) : draws.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="text-slate-600 mx-auto mb-4" size={48} />
              <p className="text-white font-semibold mb-2">No draws published yet</p>
              <p className="text-slate-400 text-sm">Check back soon — monthly draws are published at the end of each month.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {draws.map(draw => {
                const myWin = myWinnings.find(w => w.draw_id === draw.id);
                return (
                  <div key={draw.id} className={`glass rounded-2xl p-6 border ${myWin ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{draw.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                          <Calendar size={13} />
                          {format(new Date(draw.draw_date), 'dd MMMM yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {myWin && (
                          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold border border-amber-500/30">
                            🏆 You won!
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          draw.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>{draw.status}</span>
                      </div>
                    </div>

                    {/* Winning numbers */}
                    {draw.winning_numbers && (
                      <div className="mb-4">
                        <p className="text-slate-500 text-xs mb-2">Winning Numbers</p>
                        <div className="flex gap-2">
                          {draw.winning_numbers.map((n, i) => {
                            const isMyMatch = myWin?.matched_numbers?.includes(n);
                            return (
                              <div key={i} className={`number-ball w-10 h-10 text-sm ${
                                isMyMatch
                                  ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white glow-gold'
                                  : 'bg-white/10 text-white'
                              }`}>{n}</div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Prize pools */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                      <div className="text-center">
                        <div className="text-amber-400 font-bold">£{draw.prize_pool_5.toFixed(0)}</div>
                        <div className="text-slate-500 text-xs">Jackpot</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-300 font-bold">£{draw.prize_pool_4.toFixed(0)}</div>
                        <div className="text-slate-500 text-xs">4-Match</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-bold">£{draw.prize_pool_3.toFixed(0)}</div>
                        <div className="text-slate-500 text-xs">3-Match</div>
                      </div>
                    </div>

                    {myWin && (
                      <div className="mt-4 pt-4 border-t border-amber-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 text-sm font-medium">Your prize: £{myWin.prize_amount.toFixed(2)}</span>
                          <Link href="/dashboard/winnings" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
                            Manage →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
