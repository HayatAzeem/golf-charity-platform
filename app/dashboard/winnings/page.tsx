'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Trophy, Upload, Clock, Check, X, Heart,
  TrendingUp, Target, Settings, LogOut, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface WinnerWithDraw {
  id: string;
  draw_id: string;
  match_type: string;
  matched_numbers: number[];
  prize_amount: number;
  status: string;
  proof_url?: string;
  created_at: string;
  draws: { title: string; draw_date: string; winning_numbers: number[] } | null;
}

export default function WinningsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [winners, setWinners] = useState<WinnerWithDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');

  const loadWinnings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data } = await supabase
      .from('winners')
      .select(`*, draws:draw_id(title, draw_date, winning_numbers)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setWinners((data || []) as WinnerWithDraw[]);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadWinnings(); }, [loadWinnings]);

  const handleSubmitProof = async (winnerId: string) => {
    if (!proofUrl.trim()) { toast.error('Please enter a proof URL'); return; }
    const { error } = await supabase.from('winners').update({ proof_url: proofUrl }).eq('id', winnerId);
    if (error) { toast.error('Submission failed'); return; }
    toast.success('Proof submitted! Our team will review shortly.');
    setUploadingId(null);
    setProofUrl('');
    loadWinnings();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const totalWon = winners.filter(w => w.status === 'paid').reduce((a, w) => a + w.prize_amount, 0);
  const pendingAmount = winners.filter(w => ['pending', 'verified'].includes(w.status)).reduce((a, w) => a + w.prize_amount, 0);

  const navItems = [
    { href: '/dashboard', icon: TrendingUp, label: 'Overview' },
    { href: '/dashboard/scores', icon: Target, label: 'My Scores' },
    { href: '/dashboard/draws', icon: Trophy, label: 'Prize Draws' },
    { href: '/dashboard/winnings', icon: Trophy, label: 'Winnings', active: true },
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
            <h1 className="font-display text-2xl font-bold text-white">My Winnings</h1>
            <p className="text-slate-400 mt-1">Track your prizes and submit verification</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass rounded-xl p-5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 mb-3">
                <DollarSign className="text-green-400" size={18} />
              </div>
              <div className="font-bold text-white text-2xl">£{totalWon.toFixed(2)}</div>
              <div className="text-slate-400 text-sm">Total received</div>
            </div>
            <div className="glass rounded-xl p-5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 mb-3">
                <Clock className="text-amber-400" size={18} />
              </div>
              <div className="font-bold text-white text-2xl">£{pendingAmount.toFixed(2)}</div>
              <div className="text-slate-400 text-sm">Pending payment</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16"><div className="spinner mx-auto" style={{ width: 40, height: 40 }} /></div>
          ) : winners.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="text-slate-600 mx-auto mb-4" size={48} />
              <h3 className="text-white font-semibold mb-2">No winnings yet</h3>
              <p className="text-slate-400 text-sm">Keep logging your scores — a match could come any month!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {winners.map(winner => (
                <div key={winner.id} className="glass rounded-2xl p-6 border border-white/5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-400 font-bold text-lg">{winner.match_type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          winner.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                          winner.status === 'verified' ? 'bg-blue-500/20 text-blue-400' :
                          winner.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>{winner.status}</span>
                      </div>
                      <div className="text-slate-400 text-sm">{winner.draws?.title}</div>
                      {winner.draws?.draw_date && (
                        <div className="text-slate-500 text-xs mt-0.5">
                          {format(new Date(winner.draws.draw_date), 'dd MMMM yyyy')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-xl">£{winner.prize_amount.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Matched numbers */}
                  <div className="mb-4">
                    <p className="text-slate-500 text-xs mb-2">Your matched numbers</p>
                    <div className="flex gap-2">
                      {winner.draws?.winning_numbers?.map((n, i) => {
                        const matched = winner.matched_numbers?.includes(n);
                        return (
                          <div key={i} className={`number-ball w-10 h-10 text-sm ${
                            matched
                              ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white'
                              : 'bg-white/5 text-slate-500'
                          }`}>{n}</div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status-specific UI */}
                  {winner.status === 'pending' && !winner.proof_url && (
                    <div className="border-t border-white/5 pt-4">
                      {uploadingId === winner.id ? (
                        <div className="space-y-3">
                          <p className="text-slate-300 text-sm font-medium">Submit your score verification</p>
                          <p className="text-slate-400 text-xs">Please provide a link to a screenshot of your scores from your golf platform (e.g. Google Drive, Dropbox, etc.)</p>
                          <input
                            value={proofUrl}
                            onChange={e => setProofUrl(e.target.value)}
                            className="input-field text-sm"
                            placeholder="https://drive.google.com/..."
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleSubmitProof(winner.id)} className="btn-primary text-sm py-2"><Check size={14} /> Submit Proof</button>
                            <button onClick={() => setUploadingId(null)} className="btn-outline text-sm py-2"><X size={14} /> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUploadingId(winner.id)}
                          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                        >
                          <Upload size={14} /> Submit score verification to claim prize
                        </button>
                      )}
                    </div>
                  )}

                  {winner.status === 'pending' && winner.proof_url && (
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock size={14} className="text-amber-400" />
                        Proof submitted — awaiting admin review
                      </div>
                    </div>
                  )}

                  {winner.status === 'verified' && (
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 text-blue-400 text-sm">
                        <Check size={14} />
                        Verified — payment processing
                      </div>
                    </div>
                  )}

                  {winner.status === 'paid' && (
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Check size={14} />
                        Payment complete 🎉
                      </div>
                    </div>
                  )}

                  {winner.status === 'rejected' && (
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <X size={14} />
                        Submission rejected. Contact support if you believe this is an error.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
