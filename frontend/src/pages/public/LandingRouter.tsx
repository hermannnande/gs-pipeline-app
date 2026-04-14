import { Component, useEffect, useState } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import DynamicLanding from './DynamicLanding';
import DynamicLandingV2 from './DynamicLandingV2';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(err: Error) { return { error: err.message + '\n' + err.stack }; }
  componentDidCatch(err: Error, info: ErrorInfo) { console.error('LandingRouter crash:', err, info); }
  render() {
    if (this.state.error) return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-8">
        <div className="max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-2 text-lg font-bold text-red-600">Erreur de chargement</h2>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs text-neutral-600">{this.state.error}</pre>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-neutral-900 px-6 py-2 text-sm font-bold text-white">Recharger</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

export default function LandingRouter() {
  const { slug } = useParams<{ slug: string }>();
  const [version, setVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API_URL}/templates/public/${slug}`)
      .then(r => {
        try {
          const cfg = JSON.parse(r.data.template.config);
          setVersion(cfg.templateVersion === 2 ? 2 : 1);
        } catch { setVersion(1); }
      })
      .catch(() => setVersion(1));
  }, [slug]);

  if (version === null) return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-teal-600"/>
    </div>
  );

  return (
    <ErrorBoundary>
      {version === 2 ? <DynamicLandingV2 /> : <DynamicLanding />}
    </ErrorBoundary>
  );
}
