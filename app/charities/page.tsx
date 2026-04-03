'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Heart, Search, ExternalLink, Calendar, MapPin, ArrowRight } from 'lucide-react';
import type { Charity, CharityEvent } from '@/types';

type CharityWithEvents = Charity & { upcoming_events: CharityEvent[] };

export default function CharitiesPage() {
  const supabase = createClient();
  const [charities, setCharities] = useState<CharityWithEvents[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('charities')
        .select(`*, upcoming_events:charity_events(*)`)
        .eq('is_active', true)
        .order('is_featured', { ascending: false });
      setCharities((data || []) as CharityWithEvents[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const featured = filtered.filter(c => c.is_featured);
  const others = filtered.filter(c => !c.is_featured);

  return (
    <div className="min-h-screen animated-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-display text-xl font-bold text-white">GolfGives</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium px-4 py-2">Sign In</Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-5">Join Now <ArrowRight size={14} /></Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-red-500/30 text-red-400 text-sm mb-6">
              <Heart size={14} />
              <span>Your game. Their future.</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Supported Charities
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Every GolfGives subscription funds one of these life-changing organisations. You choose who benefits.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-12">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Search charities..."
            />
          </div>

          {loading && (
            <div className="text-center py-16">
              <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
              <p className="text-slate-400">Loading charities...</p>
            </div>
          )}

          {/* Featured */}
          {featured.length > 0 && (
            <div className="mb-12">
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-6">Featured</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featured.map(charity => (
                  <CharityCard key={charity.id} charity={charity} featured />
                ))}
              </div>
            </div>
          )}

          {/* All */}
          {others.length > 0 && (
            <div>
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-6">All Charities</h2>
              <div className="grid md:grid-cols-3 gap-5">
                {others.map(charity => (
                  <CharityCard key={charity.id} charity={charity} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16">
              <Heart className="text-slate-600 mx-auto mb-4" size={48} />
              <p className="text-slate-400">No charities found matching &ldquo;{search}&rdquo;</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-20 text-center">
            <div className="glass rounded-3xl p-10 border border-green-500/20 bg-green-950/10 max-w-2xl mx-auto">
              <Heart className="text-red-400 mx-auto mb-4" size={32} />
              <h2 className="font-display text-2xl font-bold text-white mb-3">
                Ready to make an impact?
              </h2>
              <p className="text-slate-400 mb-6">
                Subscribe and choose your charity today. Your golf scores do more than track your game.
              </p>
              <Link href="/signup" className="btn-primary">
                Start Giving <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CharityCard({ charity, featured = false }: { charity: CharityWithEvents; featured?: boolean }) {
  return (
    <div className={`glass rounded-2xl overflow-hidden border card-hover ${
      featured ? 'border-green-500/20' : 'border-white/5'
    }`}>
      <div className={`h-2 ${featured ? 'bg-gradient-to-r from-green-500 to-green-700' : 'bg-gradient-to-r from-slate-700 to-slate-600'}`} />
      <div className="p-6">
        {featured && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold mb-4 border border-green-500/20">
            ⭐ Featured
          </div>
        )}
        <h3 className="font-display text-xl font-bold text-white mb-2">{charity.name}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">{charity.description}</p>

        {charity.total_raised > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Heart size={14} className="text-red-400" />
            <span className="text-slate-400 text-sm">
              <span className="text-white font-semibold">£{charity.total_raised.toLocaleString()}</span> raised
            </span>
          </div>
        )}

        {charity.upcoming_events && charity.upcoming_events.length > 0 && (
          <div className="border-t border-white/5 pt-4 mt-4">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">Upcoming Events</p>
            {charity.upcoming_events.slice(0, 2).map(event => (
              <div key={event.id} className="flex items-start gap-2 mb-2">
                <Calendar size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white text-sm font-medium">{event.title}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {event.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {charity.website && (
          <a
            href={charity.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm mt-4 transition-colors"
          >
            Visit Website <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
