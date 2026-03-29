import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import './index.css';

// ── Sentry Initialisation ─────────────────────────────────────────────────────
// Sentry is loaded via CDN in index.html.
// Set VITE_SENTRY_DSN in .env.local to activate error reporting.
const Sentry = (window as any).Sentry;
if (Sentry && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `melcom@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });
}

// ── Error Boundary ─────────────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; isAdmin?: boolean },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught error:', error, info);
    if (Sentry) Sentry.captureException(error, { extra: info });
  }

  private parseFirestoreError() {
    try {
      const parsed = JSON.parse(this.state.error?.message || '{}');
      if (parsed.error) return { msg: `${parsed.error}`, detail: `Operation: ${parsed.operationType} · Path: ${parsed.path}` };
    } catch {}
    return { msg: this.state.error?.message || 'An unexpected error occurred.', detail: '' };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const { msg, detail } = this.parseFirestoreError();
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 480, width: '100%', background: '#141414', border: '1px solid #252525', borderRadius: 20, padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#2a0a0a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>⚠️</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ color: '#888', fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>{msg}</p>
          {detail && <p style={{ color: '#555', fontSize: 12, fontFamily: 'monospace', background: '#000', padding: '10px 14px', borderRadius: 10, margin: '0 0 24px', textAlign: 'left' }}>{detail}</p>}
          <button
            onClick={() => window.location.reload()}
            style={{ width: '100%', background: '#E12222', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            Reload Application
          </button>
          <p style={{ color: '#444', fontSize: 11, marginTop: 16 }}>If this keeps happening, contact support@melcom.com.gh</p>
        </div>
      </div>
    );
  }
}

// ── Route determination ────────────────────────────────────────────────────────
const isAdmin = window.location.pathname.startsWith('/admin');

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary isAdmin={isAdmin}>
      <ToastProvider>
        {isAdmin ? <AdminApp /> : <App />}
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
