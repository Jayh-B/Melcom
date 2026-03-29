import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X, Shield, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const CONSENT_KEY = 'melcom_cookie_consent_v1';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: true, marketing: false, functional: true });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (!saved) setTimeout(() => setVisible(true), 1500);
    } catch {}
  }, []);

  const save = (overrides?: Partial<typeof prefs>) => {
    const final = { ...prefs, ...overrides };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...final, timestamp: new Date().toISOString() }));
    } catch {}
    setVisible(false);
  };

  const togglePref = (key: keyof typeof prefs) => {
    if (key === 'functional') return;
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-[9998] p-3 sm:p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl">
            <div className="p-5 sm:p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <Cookie size={20} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Cookie Preferences
                      <span className="ml-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold align-middle">
                        Ghana DPA 2012 (Act 843)
                      </span>
                    </h3>
                    <button onClick={() => save({ analytics: false, marketing: false })} aria-label="Dismiss" className="text-gray-400 hover:text-gray-600 shrink-0">
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    We use cookies to improve your experience. We respect your rights under the Ghana Data Protection Act, 2012.{' '}
                    <Link to="/privacy" className="text-red-600 hover:underline font-medium" onClick={() => setVisible(false)}>
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                      {([
                        { key: 'functional', label: 'Functional', desc: 'Required for cart, login, and checkout. Cannot be disabled.', locked: true },
                        { key: 'analytics',  label: 'Analytics',  desc: 'Help us improve our platform by understanding how you use it.', locked: false },
                        { key: 'marketing',  label: 'Marketing',  desc: 'Personalised offers and promotions based on your shopping behaviour.', locked: false },
                      ] as const).map(({ key, label, desc, locked }) => (
                        <div key={key} className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                          </div>
                          <button
                            onClick={() => togglePref(key)}
                            disabled={locked}
                            className={cn(
                              'relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600',
                              (locked || prefs[key]) ? 'bg-red-600' : 'bg-gray-200',
                              locked && 'opacity-50 cursor-not-allowed'
                            )}
                            aria-pressed={prefs[key]}
                            aria-label={`Toggle ${label} cookies`}
                          >
                            <span className={cn(
                              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                              (locked || prefs[key]) ? 'left-5' : 'left-0.5'
                            )} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button onClick={() => save({ analytics: true, marketing: true })} className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
                  Accept All
                </button>
                {expanded ? (
                  <button onClick={() => save()} className="bg-gray-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                    Save My Choices
                  </button>
                ) : (
                  <button onClick={() => setExpanded(true)} className="border border-gray-200 text-gray-700 px-5 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
                    Manage <ChevronDown size={14} />
                  </button>
                )}
                <button onClick={() => save({ analytics: false, marketing: false })} className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors">
                  Reject non-essential
                </button>
                <div className="ml-auto flex items-center gap-1 text-xs text-gray-400 hidden sm:flex">
                  <Shield size={11} />
                  <span>Ghana DPA 2012 compliant</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
