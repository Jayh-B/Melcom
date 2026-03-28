import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import { AlertCircle } from 'lucide-react';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const state = (this as any).state;
    if (state.hasError) {
      let errorMsg = "Something went wrong.";
      let details = "";
      
      try {
        // Check if it's our custom Firestore error JSON
        const parsedError = JSON.parse(state.error.message);
        if (parsedError.error) {
          errorMsg = `Firestore Permission Error: ${parsedError.error}`;
          details = `Operation: ${parsedError.operationType} on path: ${parsedError.path}`;
        }
      } catch (e) {
        errorMsg = state.error?.message || errorMsg;
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Application Error</h1>
            <p className="text-zinc-400 mb-2">{errorMsg}</p>
            {details && <p className="text-xs text-zinc-500 mb-6 font-mono bg-black/50 p-2 rounded">{details}</p>}
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const Main = () => {
  const isAdminPath = window.location.pathname.startsWith('/admin');
  return (
    <ErrorBoundary>
      {isAdminPath ? <AdminApp /> : <App />}
    </ErrorBoundary>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
);
