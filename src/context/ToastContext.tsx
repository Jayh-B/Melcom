import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ToastMessage } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

type Action = { type: 'ADD'; toast: ToastMessage } | { type: 'REMOVE'; id: string };

function reducer(state: ToastMessage[], action: Action): ToastMessage[] {
  switch (action.type) {
    case 'ADD': return [...state, action.toast];
    case 'REMOVE': return state.filter(t => t.id !== action.id);
    default: return state;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    dispatch({ type: 'ADD', toast: { id, message, type, duration } });
    if (duration > 0) setTimeout(() => dispatch({ type: 'REMOVE', id }), duration);
  }, []);

  const removeToast = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
