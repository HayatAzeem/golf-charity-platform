'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Trophy, Heart, TrendingUp, Calendar, LogOut, Settings,
  Plus, Edit2, Check, X, AlertCircle, Clock, DollarSign,
  ChevronRight, Target, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile, GolfScore, Draw, Winner, Charity } from '@/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<GolfScore[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingScore, setAddingScore] = useState(false);
  const [newScore, setNewScore] = useState({ score: '', date: '' });
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [editScore, setEditScore] = useState({ score: '', date: '' });

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [profileRes, scoresRes, drawsRes, winnersRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('golf_scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5),
      supabase.from('draws').select('*').in('status', ['published', 'completed']).order('draw_date', { ascending: false }).limit(5),
      supabase.from('winners').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    const prof = profileRes.data as Profile;
    setProfile(prof);
    setScores((scoresRes.data || []) as GolfScore[]);
    setDraws((drawsRes.data || []) as Draw[]);
    setWinners((winnersRes.data || []) as Winner[]);

    if (prof?.selected_charity_id) {
      const { data: charityData } = await supabase.from('charities').select('*').eq('id', prof.selected_charity_id).single();
      setCharity(charityData as Charity);
    }
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddScore = async () => {
    if (!newScore.score || !newScore.date) { toast.error('Please fill in score and date'); return; }
    const scoreVal = parseInt(newScore.score);
    if (scoreVal < 1 || scoreVal > 45) { toast.error('Score must be between 1 and 45'); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if we have 5 scores and need to remove the oldest
    if (scores.length >= 5) {
      const oldest = scores[scores.length - 1];
      await supabase.from('golf_scores').delete().eq('id', oldest.id);
    }

    const { error } = await supabase.from('golf_scores').insert({
      user_id: user.id,
      score: scoreVal,
      played_at: newScore.date,
    });
    if (error) { toast.error('Failed to add score'); return; }
    toast.success('Score added!');
    setAddingScore(false);
    setNewScore({ score: '', date: '' });
    loadData();
  };

  const handleEditScore = async (id: string) => {
    const scoreVal = parseInt(editScore.score);
    if (scoreVal < 1 || scoreVal > 45) { toast.error('Score must be between 1 and 45'); return; }
    const { error } = await supabase.from('golf_scores').update({ score: scoreVal, played_at: editScore.date }).eq('id', id);
    if (error) { toast.error('Failed to update score'); return; }
    toast.success('Score updated!');
    setEditingScore(null);
    loadData();
  };

  const handleDeleteScore = async (id: string) => {
    await supabase.from('golf_scores').delete().eq('id', id);
    toast.success('Score removed');
    loadData();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const totalWon = winners.filter(w => w.status === 'paid').reduce((acc, w) => acc + w.prize_amount, 0);
  const pendingWon = winners.filter(w => w.status === 'pending' || w.status === 'verified').reduce((acc, w) => acc + w.prize_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isActive = profile?.subscription_status === 'active';

  return (
    <div className="min-h-screen animated-bg">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 flex flex-col z-40 hidden lg:flex">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-display text-xl font-bold text-white">GolfGives</span>
          </Link>

          <div className="space-y-1">
            {[
              { href: '/dashboard', icon: TrendingUp, label: 'Overview', active: true },
              { href: '/dashboard/scores', icon: Target, label: 'My Scores' },
              { href: '/dashboard/draws', icon: Trophy, label: 'Prize Draws' },
              { href: '/dashboard/winnings', icon: Award, label: 'Winnings' },
              { href: '/dashboard/charity', icon: Heart, label: 'My Charity' },
              { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
            ].map(({ href, icon: Icon, label, active }) => (
              <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto p-6">
          <div className="glass rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-semibold text-sm">
                {profile?.full_name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-white text-sm font-medium truncate max-w-28">{profile?.full_name || 'User'}</p>
                <p className="text-slate-500 text-xs truncate max-w-28">{profile?.email}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs ${isActive ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
              {isActive ? 'Active Member' : 'Inactive'}
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-slate-500 hover:text-red-400 text-sm transition-colors w-full px-2 py-2">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:pl-64 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                Good to see you, {profile?.full_name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p className="text-slate-400 mt-1">Here&apos;s your current standing</p>
            </div>
            {!isActive && (
              <Link href="/subscription/checkout" className="btn-primary text-sm">
                Activate Membership
              </Link>
            )}
          </div>

          {/* Subscription Banner */}
          {!isActive && (
            <div className="glass rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 mb-6 flex items-center gap-4">
              <AlertCircle className="text-amber-400 flex-shrink-0" size={20} />
              <div>
                <p className="text-white font-medium">Your subscription is not active</p>
                <p className="text-slate-400 text-sm">Subscribe to enter monthly draws and support your charity.</p>
              </div>
              <Link href="/subscription/checkout" className="ml-auto btn-gold text-sm py-2 px-4 whitespace-nowrap">
                Subscribe Now
              </Link>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                icon: Trophy,
                label: 'Total Won',
                value: `£${totalWon.toFixed(2)}`,
                sub: `£${pendingWon.toFixed(2)} pending`,
                color: 'amber',
              },
              {
                icon: Target,
                label: 'Scores Logged',
                value: scores.length,
                sub: 'of 5 maximum',
                color: 'green',
              },
              {
                icon: Calendar,
                label: 'Draws Entered',
                value: draws.length,
                sub: 'last 5 shown',
                color: 'blue',
              },
              {
                icon: Heart,
                label: 'Charity',
                value: charity?.name ? charity.name.split(' ').slice(0, 2).join(' ') : 'Not set',
                sub: `${profile?.charity_percentage || 10}% of sub`,
                color: 'red',
              },
            ].map(({ icon: Icon, label, value, sub, color }, i) => (
              <div key={i} className="glass rounded-xl p-4 card-hover">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-${color}-500/10 mb-3`}>
                  <Icon className={`text-${color}-400`} size={18} />
                </div>
                <div className="font-bold text-white text-xl">{value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{label}</div>
                <div className="text-slate-600 text-xs">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Scores Section */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-white">My Golf Scores</h2>
                <button
                  onClick={() => setAddingScore(true)}
                  className="flex items-center gap-1.5 text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                  disabled={!isActive}
                >
                  <Plus size={16} /> Add Score
                </button>
              </div>

              {addingScore && (
                <div className="glass rounded-xl p-4 mb-4 border border-green-500/20 score-enter">
                  <p className="text-sm text-slate-400 mb-3">New Score (Stableford, 1–45)</p>
                  <div className="flex gap-3 mb-3">
                    <input
                      type="number" min={1} max={45}
                      value={newScore.score}
                      onChange={e => setNewScore({ ...newScore, score: e.target.value })}
                      className="input-field text-center text-2xl font-bold py-3"
                      placeholder="36"
                    />
                    <input
                      type="date"
                      value={newScore.date}
                      onChange={e => setNewScore({ ...newScore, date: e.target.value })}
                      className="input-field flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddScore} className="btn-primary py-2 px-4 text-sm flex-1 justify-center"><Check size={14} /> Save</button>
                    <button onClick={() => setAddingScore(false)} className="btn-outline py-2 px-4 text-sm flex-1 justify-center"><X size={14} /> Cancel</button>
                  </div>
                </div>
              )}

              {scores.length === 0 && !addingScore && (
                <div className="text-center py-8">
                  <Target className="text-slate-600 mx-auto mb-3" size={40} />
                  <p className="text-slate-400 text-sm">No scores logged yet</p>
                  {isActive && (
                    <button onClick={() => setAddingScore(true)} className="text-green-400 text-sm hover:text-green-300 mt-2">
                      Add your first score
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {scores.map((score, idx) => (
                  <div key={score.id} className={`flex items-center gap-3 p-3 rounded-xl ${editingScore === score.id ? 'bg-white/5 border border-green-500/30' : 'hover:bg-white/5'} transition-all`}>
                    {editingScore === score.id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="number" min={1} max={45}
                          value={editScore.score}
                          onChange={e => setEditScore({ ...editScore, score: e.target.value })}
                          className="input-field w-20 text-center py-1"
                        />
                        <input
                          type="date"
                          value={editScore.date}
                          onChange={e => setEditScore({ ...editScore, date: e.target.value })}
                          className="input-field flex-1 py-1"
                        />
                        <button onClick={() => handleEditScore(score.id)} className="text-green-400 hover:text-green-300 p-1"><Check size={14} /></button>
                        <button onClick={() => setEditingScore(null)} className="text-slate-500 hover:text-slate-300 p-1"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="number-ball w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 text-white text-sm">
                          {score.score}
                        </div>
                        <div className="flex-1">
                          <span className="text-white font-semibold">{score.score} points</span>
                          {idx === 0 && <span className="ml-2 text-xs text-green-400 font-medium">Latest</span>}
                          <div className="text-slate-500 text-xs mt-0.5">{format(new Date(score.played_at), 'dd MMM yyyy')}</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingScore(score.id); setEditScore({ score: String(score.score), date: score.played_at }); }}
                            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/10 transition-all"
                          ><Edit2 size={13} /></button>
                          <button onClick={() => handleDeleteScore(score.id)} className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-all"><X size={13} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {scores.length >= 5 && (
                <p className="text-slate-500 text-xs mt-3 text-center">5 scores stored. Adding a new one removes the oldest.</p>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Recent Draws */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-lg font-bold text-white">Recent Draws</h2>
                  <Link href="/dashboard/draws" className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1">
                    View all <ChevronRight size={14} />
                  </Link>
                </div>
                {draws.length === 0 ? (
                  <div className="text-center py-6">
                    <Trophy className="text-slate-600 mx-auto mb-3" size={32} />
                    <p className="text-slate-400 text-sm">No draws yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draws.slice(0, 3).map(draw => {
                      const myWin = winners.find(w => w.draw_id === draw.id);
                      return (
                        <div key={draw.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Trophy className="text-amber-400" size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="text-white text-sm font-medium">{draw.title}</div>
                            <div className="text-slate-500 text-xs">{format(new Date(draw.draw_date), 'dd MMM yyyy')}</div>
                          </div>
                          {myWin ? (
                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                              {myWin.match_type}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-white/5 text-slate-500 text-xs">
                              {draw.winning_numbers?.join(', ')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Winnings */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h2 className="font-display text-lg font-bold text-white mb-5">Winnings</h2>
                {winners.length === 0 ? (
                  <div className="text-center py-6">
                    <DollarSign className="text-slate-600 mx-auto mb-3" size={32} />
                    <p className="text-slate-400 text-sm">No winnings yet — keep playing!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {winners.slice(0, 3).map(winner => (
                      <div key={winner.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">£{winner.prize_amount.toFixed(2)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              winner.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                              winner.status === 'verified' ? 'bg-blue-500/20 text-blue-400' :
                              winner.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {winner.status}
                            </span>
                          </div>
                          <div className="text-slate-500 text-xs mt-0.5">{winner.match_type}</div>
                        </div>
                        {winner.status === 'pending' && !winner.proof_url && (
                          <Link href={`/dashboard/winnings/${winner.id}`} className="text-amber-400 text-xs flex items-center gap-1 hover:text-amber-300">
                            <Clock size={12} /> Submit proof
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Charity card */}
              {charity && (
                <div className="glass rounded-2xl p-6 border border-red-500/10 bg-red-950/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="text-red-400" size={18} />
                    <span className="text-slate-300 font-medium text-sm">Your Charity</span>
                  </div>
                  <p className="text-white font-semibold mb-1">{charity.name}</p>
                  <p className="text-slate-400 text-sm line-clamp-2">{charity.description}</p>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Your contribution</span>
                    <span className="text-red-400 font-bold">{profile?.charity_percentage}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
