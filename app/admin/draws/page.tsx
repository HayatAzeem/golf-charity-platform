'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Shuffle, Plus, Play, Send, ChevronLeft, BarChart2,
  Users, Trophy, Heart, TrendingUp, LogOut, Shield,
  Calendar, RefreshCw, Check, X, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Draw } from '@/types';
import { generateRandomDraw, generateAlgorithmicDraw, checkMatch, calculatePrizePools } from '@/lib/draw-engine';
import { format } from 'date-fns';

interface SimulationResult {
  winningNumbers: number[];
  method: string;
  fiveMatches: number;
  fourMatches: number;
  threeMatches: number;
  totalEntries: number;
}

export default function AdminDrawsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDraw, setShowNewDraw] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [newDraw, setNewDraw] = useState({
    title: '',
    draw_date: '',
    logic_type: 'random' as 'random' | 'algorithmic',
  });

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return false; }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (p?.role !== 'admin') { router.push('/dashboard'); return false; }
    return true;
  }, [supabase, router]);

  const loadDraws = useCallback(async () => {
    const ok = await checkAdmin();
    if (!ok) return;
    const { data } = await supabase.from('draws').select('*').order('draw_date', { ascending: false });
    setDraws((data || []) as Draw[]);
    setLoading(false);
  }, [checkAdmin, supabase]);

  useEffect(() => { loadDraws(); }, [loadDraws]);

  const handleCreateDraw = async () => {
    if (!newDraw.title || !newDraw.draw_date) { toast.error('Fill in all fields'); return; }

    // Count active subscribers for prize pool calculation
    const { count: activeCount } = await supabase
      .from('profiles').select('id', { count: 'exact' }).eq('subscription_status', 'active');

    const totalPool = (activeCount || 0) * 14; // £14 per subscriber
    const pools = calculatePrizePools(totalPool);

    // Check for rollover from previous unclaimed jackpot
    const { data: prevDraws } = await supabase
      .from('draws').select('*')
      .eq('status', 'completed')
      .order('draw_date', { ascending: false }).limit(1);
    const prevDraw = prevDraws?.[0];

    let jackpotCarryover = 0;
    if (prevDraw) {
      const { count: jackpotWinners } = await supabase
        .from('winners').select('id', { count: 'exact' })
        .eq('draw_id', prevDraw.id).eq('match_type', '5-match');
      if (!jackpotWinners || jackpotWinners === 0) {
        jackpotCarryover = prevDraw.prize_pool_5;
      }
    }

    const { error } = await supabase.from('draws').insert({
      ...newDraw,
      prize_pool_5: pools.pool5 + jackpotCarryover,
      prize_pool_4: pools.pool4,
      prize_pool_3: pools.pool3,
      jackpot_carried_over: jackpotCarryover,
      total_pool: totalPool,
    });

    if (error) { toast.error('Failed to create draw'); return; }
    toast.success('Draw created!');
    setShowNewDraw(false);
    setNewDraw({ title: '', draw_date: '', logic_type: 'random' });
    loadDraws();
  };

  const handleSimulate = async (draw: Draw) => {
    setSimulating(true);
    try {
      // Get all active entries for this draw (or use current active subscribers)
      const { data: profiles } = await supabase
        .from('profiles').select('id').eq('subscription_status', 'active');

      // Get all their scores
      const allScores: number[] = [];
      const entries: { userId: string; scores: number[] }[] = [];

      if (profiles) {
        for (const p of profiles) {
          const { data: scores } = await supabase
            .from('golf_scores').select('score').eq('user_id', p.id)
            .order('played_at', { ascending: false }).limit(5);
          const userScores = (scores || []).map(s => s.score);
          allScores.push(...userScores);
          if (userScores.length > 0) entries.push({ userId: p.id, scores: userScores });
        }
      }

      const drawResult = draw.logic_type === 'algorithmic'
        ? generateAlgorithmicDraw(allScores)
        : generateRandomDraw();

      let fiveMatches = 0, fourMatches = 0, threeMatches = 0;
      entries.forEach(entry => {
        const { type } = checkMatch(entry.scores, drawResult.winningNumbers);
        if (type === '5-match') fiveMatches++;
        else if (type === '4-match') fourMatches++;
        else if (type === '3-match') threeMatches++;
      });

      setSimulationResult({
        winningNumbers: drawResult.winningNumbers,
        method: drawResult.method,
        fiveMatches,
        fourMatches,
        threeMatches,
        totalEntries: entries.length,
      });
      toast.success('Simulation complete!');
    } catch (err) {
      toast.error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handlePublish = async (draw: Draw) => {
    if (!simulationResult && draw.status !== 'simulating') {
      toast.error('Run a simulation first before publishing');
      return;
    }

    setPublishing(draw.id);
    try {
      // Get active subscribers
      const { data: profiles } = await supabase
        .from('profiles').select('id').eq('subscription_status', 'active');

      const winningNumbers = simulationResult?.winningNumbers || draw.winning_numbers!;

      // Generate winners
      const winnersToInsert = [];
      const matchCounts = { '5-match': 0, '4-match': 0, '3-match': 0 };

      if (profiles) {
        for (const p of profiles) {
          const { data: scores } = await supabase
            .from('golf_scores').select('score').eq('user_id', p.id)
            .order('played_at', { ascending: false }).limit(5);
          const userScores = (scores || []).map(s => s.score);
          if (userScores.length === 0) continue;

          const { type, matched } = checkMatch(userScores, winningNumbers);
          if (type) {
            matchCounts[type]++;
            winnersToInsert.push({ draw_id: draw.id, user_id: p.id, match_type: type, matched_numbers: matched, prize_amount: 0, status: 'pending' });
          }
        }
      }

      // Calculate individual prizes
      const finalWinners = winnersToInsert.map(w => ({
        ...w,
        prize_amount: w.match_type === '5-match'
          ? matchCounts['5-match'] > 0 ? draw.prize_pool_5 / matchCounts['5-match'] : 0
          : w.match_type === '4-match'
          ? matchCounts['4-match'] > 0 ? draw.prize_pool_4 / matchCounts['4-match'] : 0
          : matchCounts['3-match'] > 0 ? draw.prize_pool_3 / matchCounts['3-match'] : 0,
      }));

      if (finalWinners.length > 0) {
        await supabase.from('winners').insert(finalWinners);
      }

      // Handle jackpot rollover
      const hasJackpotWinner = matchCounts['5-match'] > 0;

      await supabase.from('draws').update({
        status: hasJackpotWinner ? 'completed' : 'published',
        winning_numbers: winningNumbers,
        published_at: new Date().toISOString(),
      }).eq('id', draw.id);

      toast.success(`Draw published! ${finalWinners.length} winner(s) found.${!hasJackpotWinner ? ' Jackpot rolls over.' : ''}`);
      setSimulationResult(null);
      loadDraws();
    } catch (err) {
      toast.error('Publish failed');
    } finally {
      setPublishing(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin', icon: BarChart2, label: 'Overview' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/draws', icon: Shuffle, label: 'Draws', active: true },
    { href: '/admin/winners', icon: Trophy, label: 'Winners' },
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-500 hover:text-slate-300"><ChevronLeft size={20} /></Link>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Draw Management</h1>
                <p className="text-slate-400 mt-1">Configure, simulate and publish monthly prize draws</p>
              </div>
            </div>
            <button onClick={() => setShowNewDraw(true)} className="btn-primary text-sm">
              <Plus size={16} /> New Draw
            </button>
          </div>

          {/* New Draw Form */}
          {showNewDraw && (
            <div className="glass rounded-2xl p-6 border border-green-500/20 mb-8">
              <h2 className="font-semibold text-white mb-5">Create New Draw</h2>
              <div className="grid md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Title</label>
                  <input
                    value={newDraw.title}
                    onChange={e => setNewDraw({ ...newDraw, title: e.target.value })}
                    className="input-field"
                    placeholder="e.g. July 2025 Monthly Draw"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Draw Date</label>
                  <input
                    type="date"
                    value={newDraw.draw_date}
                    onChange={e => setNewDraw({ ...newDraw, draw_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Draw Logic</label>
                  <select
                    value={newDraw.logic_type}
                    onChange={e => setNewDraw({ ...newDraw, logic_type: e.target.value as 'random' | 'algorithmic' })}
                    className="input-field"
                  >
                    <option value="random">Random</option>
                    <option value="algorithmic">Algorithmic (score-weighted)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleCreateDraw} className="btn-primary text-sm"><Check size={14} /> Create Draw</button>
                <button onClick={() => setShowNewDraw(false)} className="btn-outline text-sm"><X size={14} /> Cancel</button>
              </div>
            </div>
          )}

          {/* Simulation Result */}
          {simulationResult && (
            <div className="glass rounded-2xl p-6 border border-amber-500/30 bg-amber-500/5 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Simulation Result</h3>
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <Eye size={14} /> Preview Mode (not published)
                </div>
              </div>
              <div className="flex gap-3 mb-4">
                {simulationResult.winningNumbers.map((n, i) => (
                  <div key={i} className="number-ball bg-gradient-to-br from-amber-500 to-amber-700 text-white">{n}</div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-xl">{simulationResult.fiveMatches}</div>
                  <div className="text-slate-400 text-xs">5-Match Winners</div>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-xl">{simulationResult.fourMatches}</div>
                  <div className="text-slate-400 text-xs">4-Match Winners</div>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-xl">{simulationResult.threeMatches}</div>
                  <div className="text-slate-400 text-xs">3-Match Winners</div>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-3">Out of {simulationResult.totalEntries} participating entries · Method: {simulationResult.method}</p>
            </div>
          )}

          {/* Draws List */}
          {loading ? (
            <div className="text-center py-16"><div className="spinner mx-auto" style={{ width: 40, height: 40 }} /></div>
          ) : (
            <div className="space-y-4">
              {draws.map(draw => (
                <div key={draw.id} className="glass rounded-2xl p-6 border border-white/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-semibold">{draw.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          draw.status === 'published' || draw.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          draw.status === 'simulating' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {draw.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-xs">
                          {draw.logic_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar size={13} />
                        {format(new Date(draw.draw_date), 'dd MMMM yyyy')}
                      </div>
                    </div>

                    {draw.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSimulate(draw)}
                          disabled={simulating}
                          className="btn-outline text-sm py-2 px-4"
                        >
                          {simulating ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                          Simulate
                        </button>
                        {simulationResult && (
                          <button
                            onClick={() => handlePublish(draw)}
                            disabled={publishing === draw.id}
                            className="btn-primary text-sm py-2 px-4"
                          >
                            {publishing === draw.id ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                            Publish
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/5">
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Total Pool</div>
                      <div className="text-white font-semibold">£{draw.total_pool.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Jackpot (5-match)</div>
                      <div className="text-amber-400 font-semibold">£{draw.prize_pool_5.toFixed(2)}</div>
                      {draw.jackpot_carried_over > 0 && (
                        <div className="text-amber-600 text-xs">+£{draw.jackpot_carried_over.toFixed(2)} rollover</div>
                      )}
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">4-Match Pool</div>
                      <div className="text-white font-semibold">£{draw.prize_pool_4.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">3-Match Pool</div>
                      <div className="text-white font-semibold">£{draw.prize_pool_3.toFixed(2)}</div>
                    </div>
                  </div>

                  {draw.winning_numbers && draw.winning_numbers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="text-slate-400 text-xs mb-2">Winning Numbers</div>
                      <div className="flex gap-2">
                        {draw.winning_numbers.map((n, i) => (
                          <div key={i} className="number-ball w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 text-white text-sm">{n}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {draws.length === 0 && (
                <div className="text-center py-16">
                  <Shuffle className="text-slate-600 mx-auto mb-4" size={48} />
                  <p className="text-slate-400">No draws yet. Create your first one!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
