'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Users, Search, Edit2, Check, X, ChevronLeft,
  Shield, UserCheck, UserX, BarChart2, Trophy,
  Heart, Shuffle, TrendingUp, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState({ subscription_status: '', charity_percentage: 0 });

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return false; }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (p?.role !== 'admin') { router.push('/dashboard'); return false; }
    return true;
  }, [supabase, router]);

  const loadUsers = useCallback(async () => {
    const ok = await checkAdmin();
    if (!ok) return;
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data || []) as Profile[]);
    setLoading(false);
  }, [checkAdmin, supabase]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleUpdateUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({
      subscription_status: editData.subscription_status,
      charity_percentage: editData.charity_percentage,
    }).eq('id', userId);
    if (error) { toast.error('Update failed'); return; }
    toast.success('User updated');
    setEditingUser(null);
    loadUsers();
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin', icon: BarChart2, label: 'Overview' },
    { href: '/admin/users', icon: Users, label: 'Users', active: true },
    { href: '/admin/draws', icon: Shuffle, label: 'Draws' },
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
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin" className="text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">User Management</h1>
              <p className="text-slate-400 mt-1">{users.length} total users · {users.filter(u => u.subscription_status === 'active').length} active</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Search by name or email..."
            />
          </div>

          {loading ? (
            <div className="text-center py-16"><div className="spinner mx-auto" style={{ width: 40, height: 40 }} /></div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden border border-white/5">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-slate-400 text-sm font-medium">User</th>
                    <th className="text-left p-4 text-slate-400 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-slate-400 text-sm font-medium">Plan</th>
                    <th className="text-left p-4 text-slate-400 text-sm font-medium">Charity %</th>
                    <th className="text-left p-4 text-slate-400 text-sm font-medium">Joined</th>
                    <th className="text-left p-4 text-slate-400 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-semibold text-sm">
                            {user.full_name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{user.full_name || '—'}</div>
                            <div className="text-slate-500 text-xs">{user.email}</div>
                          </div>
                          {user.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs">admin</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {editingUser === user.id ? (
                          <select
                            value={editData.subscription_status}
                            onChange={e => setEditData({ ...editData, subscription_status: e.target.value })}
                            className="input-field py-1 text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="lapsed">Lapsed</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' :
                            user.subscription_status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {user.subscription_status === 'active' ? <UserCheck size={10} /> : <UserX size={10} />}
                            {user.subscription_status}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 text-sm capitalize">{user.subscription_plan || '—'}</span>
                      </td>
                      <td className="p-4">
                        {editingUser === user.id ? (
                          <input
                            type="number" min={10} max={100}
                            value={editData.charity_percentage}
                            onChange={e => setEditData({ ...editData, charity_percentage: parseInt(e.target.value) })}
                            className="input-field py-1 text-sm w-20"
                          />
                        ) : (
                          <span className="text-green-400 font-medium text-sm">{user.charity_percentage}%</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-sm">{format(new Date(user.created_at), 'dd MMM yy')}</span>
                      </td>
                      <td className="p-4">
                        {editingUser === user.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateUser(user.id)} className="text-green-400 hover:text-green-300 p-1.5 rounded-lg hover:bg-green-500/10 transition-all"><Check size={14} /></button>
                            <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/10 transition-all"><X size={14} /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUser(user.id);
                              setEditData({ subscription_status: user.subscription_status, charity_percentage: user.charity_percentage });
                            }}
                            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/10 transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400">No users found</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
