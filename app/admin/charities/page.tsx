'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Heart, Plus, Edit2, Trash2, Check, X, ChevronLeft,
  BarChart2, Users, Shuffle, Trophy, TrendingUp, LogOut,
  Shield, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Charity } from '@/types';

export default function AdminCharitiesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', long_description: '', website: '', is_featured: false, is_active: true,
  });

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return false; }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (p?.role !== 'admin') { router.push('/dashboard'); return false; }
    return true;
  }, [supabase, router]);

  const loadCharities = useCallback(async () => {
    const ok = await checkAdmin();
    if (!ok) return;
    const { data } = await supabase.from('charities').select('*').order('created_at', { ascending: false });
    setCharities((data || []) as Charity[]);
    setLoading(false);
  }, [checkAdmin, supabase]);

  useEffect(() => { loadCharities(); }, [loadCharities]);

  const resetForm = () => {
    setForm({ name: '', description: '', long_description: '', website: '', is_featured: false, is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.description) { toast.error('Name and description are required'); return; }
    if (editingId) {
      const { error } = await supabase.from('charities').update(form).eq('id', editingId);
      if (error) { toast.error('Update failed'); return; }
      toast.success('Charity updated!');
    } else {
      const { error } = await supabase.from('charities').insert(form);
      if (error) { toast.error('Create failed'); return; }
      toast.success('Charity added!');
    }
    resetForm();
    loadCharities();
  };

  const handleEdit = (charity: Charity) => {
    setForm({
      name: charity.name,
      description: charity.description,
      long_description: charity.long_description || '',
      website: charity.website || '',
      is_featured: charity.is_featured,
      is_active: charity.is_active,
    });
    setEditingId(charity.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this charity? This cannot be undone.')) return;
    await supabase.from('charities').delete().eq('id', id);
    toast.success('Charity deleted');
    loadCharities();
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('charities').update({ is_featured: !current }).eq('id', id);
    toast.success(!current ? 'Featured!' : 'Unfeatured');
    loadCharities();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin', icon: BarChart2, label: 'Overview' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/draws', icon: Shuffle, label: 'Draws' },
    { href: '/admin/winners', icon: Trophy, label: 'Winners' },
    { href: '/admin/charities', icon: Heart, label: 'Charities', active: true },
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-500 hover:text-slate-300"><ChevronLeft size={20} /></Link>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Charity Management</h1>
                <p className="text-slate-400 mt-1">{charities.length} charities · {charities.filter(c => c.is_featured).length} featured</p>
              </div>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
              <Plus size={16} /> Add Charity
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="glass rounded-2xl p-6 border border-green-500/20 mb-8">
              <h2 className="font-semibold text-white mb-5">{editingId ? 'Edit Charity' : 'New Charity'}</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Charity name" />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Website</label>
                  <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="input-field" placeholder="https://..." />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-slate-400 text-sm mb-2">Short Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder="Brief description shown in listings" />
              </div>
              <div className="mb-4">
                <label className="block text-slate-400 text-sm mb-2">Long Description</label>
                <textarea value={form.long_description} onChange={e => setForm({ ...form, long_description: e.target.value })} className="input-field" rows={4} placeholder="Full description for charity profile page" />
              </div>
              <div className="flex gap-6 mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="accent-amber-500" />
                  <span className="text-slate-300 text-sm">Featured (spotlight on homepage)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-green-500" />
                  <span className="text-slate-300 text-sm">Active (visible to users)</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmit} className="btn-primary text-sm"><Check size={14} /> {editingId ? 'Update' : 'Create'}</button>
                <button onClick={resetForm} className="btn-outline text-sm"><X size={14} /> Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16"><div className="spinner mx-auto" style={{ width: 40, height: 40 }} /></div>
          ) : (
            <div className="space-y-4">
              {charities.map(charity => (
                <div key={charity.id} className="glass rounded-2xl p-5 border border-white/5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="text-red-400" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{charity.name}</h3>
                      {charity.is_featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">⭐ Featured</span>
                      )}
                      {!charity.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-xs">Inactive</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">{charity.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-green-400 text-xs font-medium">£{charity.total_raised.toLocaleString()} raised</span>
                      {charity.website && (
                        <a href={charity.website} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">{charity.website}</a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleFeatured(charity.id, charity.is_featured)}
                      title={charity.is_featured ? 'Remove from featured' : 'Set as featured'}
                      className={`p-2 rounded-lg transition-all ${charity.is_featured ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'}`}
                    >
                      <Star size={14} />
                    </button>
                    <button onClick={() => handleEdit(charity)} className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(charity.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {charities.length === 0 && (
                <div className="text-center py-16">
                  <Heart className="text-slate-600 mx-auto mb-4" size={48} />
                  <p className="text-slate-400">No charities yet. Add your first one!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
