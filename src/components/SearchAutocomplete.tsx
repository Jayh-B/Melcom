import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const RECENT_KEY = 'melcom_recent_searches_v1';

interface Props {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  className?: string;
}

export function SearchAutocomplete({ products, searchQuery, setSearchQuery, className }: Props) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); return; }
    const q = searchQuery.toLowerCase();
    setSuggestions(
      products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [searchQuery, products]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    saveSearch(searchQuery);
    setOpen(false);
    navigate('/catalog');
  };

  const selectProduct = (p: Product) => {
    saveSearch(p.name);
    setOpen(false);
    navigate(`/product/${p.id}`);
  };

  const selectRecent = (q: string) => {
    setSearchQuery(q);
    setOpen(false);
    navigate('/catalog');
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  };

  const showDropdown = open && (suggestions.length > 0 || (!searchQuery.trim() && recentSearches.length > 0));

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-gray-100/80 rounded-2xl px-5 py-2.5 gap-3 border border-transparent focus-within:border-red-600/20 focus-within:bg-white transition-all shadow-sm focus-within:shadow-md"
      >
        <Search size={18} className="text-gray-400 shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          className="bg-transparent border-none focus:ring-0 text-sm w-44 sm:w-48 font-medium outline-none"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 w-[min(360px,90vw)]"
            role="listbox"
            aria-label="Search suggestions"
          >
            {!searchQuery.trim() && recentSearches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent</p>
                  <button onClick={clearRecent} className="text-[10px] text-red-600 font-bold hover:text-red-700">Clear</button>
                </div>
                {recentSearches.map((s, i) => (
                  <button key={i} onClick={() => selectRecent(s)} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-gray-50 text-left transition-colors group">
                    <Clock size={13} className="text-gray-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 flex-1">{s}</span>
                    <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className={cn('p-3', !searchQuery.trim() && recentSearches.length > 0 && 'border-t border-gray-100')}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1.5 flex items-center gap-1">
                  <TrendingUp size={10} /> Products
                </p>
                {suggestions.map(p => (
                  <button key={p.id} onClick={() => selectProduct(p)} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left" role="option">
                    <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600 shrink-0">GH₵ {p.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.trim() && suggestions.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm font-bold text-gray-500">No results for "{searchQuery}"</p>
                <p className="text-xs text-gray-400 mt-1">Try broader keywords</p>
              </div>
            )}

            {searchQuery.trim() && suggestions.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2">
                <button
                  onClick={() => { saveSearch(searchQuery); setOpen(false); navigate('/catalog'); }}
                  className="w-full text-center text-sm font-bold text-red-600 hover:text-red-700 py-1.5 transition-colors"
                >
                  See all results for "{searchQuery}" →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
