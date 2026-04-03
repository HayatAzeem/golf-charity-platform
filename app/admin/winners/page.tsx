'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Trophy, Check, X, DollarSign, ChevronLeft,
  BarChart2, Users, Shuffle, Heart, TrendingUp,
  LogOut, Shield, ExternalLink, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface WinnerWithDetails {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: string;
  matched_numbers: number[];
  prize_amount: number;
  status: string;
  proof_url?: string;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  draws: { title: string; draw_date: string } | null;
}

export default function AdminWinnersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [winners, setWinners] = useState<WinnerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return false; }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (p?.role !== 'admin') { router.push('/dashboard'); return false; }
    return true;
  }, [supabase, router]);

  const loadWinners = useCallback(async () => {
    const ok = await checkAdmin();
    if (!ok) return;
    const { data } = await supabase
      .from('winners')
      .select(`*, profiles:user_id(full_name, email), draws:draw_id(title, draw_date)`)
      .order('created_at', { ascending: false });
    setWinners((data || []) as WinnerWithDetails[]);
    setLoading(false);
  }, [checkAdmin, supabase]);

  useEffect(() => { loadWinners(); }, [loadWinners]);

  const handleUpdateStatus = async (winnerId: string, newStatus: string) => {
    const { error } = await supabase.from('winners').update({ status: newStatus }).eq('id', winnerId);
    if (error) { toast.error('Update failed'); return; }
    const msgs: Record<string, string> = {
      verified: 'Winner verified ✓',
      rejected: 'Submission rejected',
      paid: 'Marked as paid ✓',
    };
    toast.success(msgs[newStatus] || 'Status updated');
    loadWinners();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const filtered = statusFilter === 'all' ? winners : winners.filter(w => w.status === statusFilter);
  const pendingCount = winners.filter(w => w.status === 'pending').length;
  const totalPaid = winners.filter(w => w.status === 'paid').reduce((a, w) => a + w.prize_amount, 0);

  const navItems = [
    { href: '/admin', icon: BarChart2, label: 'Overview' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/draws', icon: Shuffle, label: 'Draws' },
    { href: '/admin/winners', icon: Trophy, label: 'Winners', active: true },
    { href: '/admin/charities', icon: Heart, label: 'Charities' },
    { href: '/admin/reports', icon: TrendingUp, label: 'Reports' },
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
              <h1 className="font-display text-2xl font-bold text-white">Winner Verification</h1>
              <p className="text-slate-400 mt-1">Review proof submissions and manage payouts</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4">
              <div className="text-amber-400 font-bold text-2xl">{pendingCount}</div>
              <div className="text-slate-400 text-sm">Pending Review</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-green-400 font-bold text-2xl">{winners.filter(w => w.status === 'verified').length}</div>
              <div className="text-slate-400 text-sm">Verified (awaiting payment)</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-white font-bold text-2xl">£{totalPaid.toFixed(2)}</div>
              <div className="text-slate-400 text-sm">Total Paid Out</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6">
            <Filter size={14} className="text-slate-500 mt-2" />
            {['all', 'pending', 'verified', 'paid', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  statusFilter === s ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'glass text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16"><div className="spinner mx-auto" style={{ width: 40, height: 40 }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="text-slate-600 mx-auto mb-4" size={48} />
              <p className="text-slate-400">No winners found with status: {statusFilter}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(winner => (
                <div key={winner.id} className="glass rounded-2xl p-6 border border-white/5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-semibold text-sm">
                          {winner.profiles?.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{winner.profiles?.full_name || 'Unknown'}</div>
                          <div className="text-slate-500 text-xs">{winner.profiles?.email}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${
                          winner.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                          winner.status === 'verified' ? 'bg-blue-500/20 text-blue-400' :
                          winner.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {winner.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-3">
                        <div>
                          <div className="text-slate-500 text-xs">Draw</div>
                          <div className="text-white text-sm">{winner.draws?.title || '—'}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs">Match Type</div>
                          <div className="text-amber-400 font-semibold text-sm">{winner.match_type}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs">Prize Amount</div>
                          <div className="text-green-400 font-bold text-sm">£{winner.prize_amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs">Matched Numbers</div>
                          <div className="flex gap-1">
                            {winner.matched_numbers?.map((n, i) => (
                              <span key={i} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">{n}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {winner.proof_url && (
                        <div className="mt-3">
                          <a
                            href={winner.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                          >
                            <ExternalLink size={12} /> View Proof Submission
                          </a>
                        </div>
                      )}
                      {!winner.proof_url && winner.status === 'pending' && (
                        <p className="text-slate-500 text-xs mt-3">⏳ Awaiting proof upload from winner</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 ml-6">
                      {winner.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(winner.id, 'verified')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-all"
                          >
                            <Check size={14} /> Verify
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(winner.id, 'rejected')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all"
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}
                      {winner.status === 'verified' && (
                        <button
                          onClick={() => handleUpdateStatus(winner.id, 'paid')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-sm font-medium transition-all"
                        >
                          <DollarSign size={14} /> Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
