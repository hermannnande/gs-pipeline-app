import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');

interface ThankYouData {
  title: string;
  subtitle: string;
  heroImg: string;
  theme: string;
  slug: string;
}

const THEME_STYLES: Record<string, {
  headerBg: string; accentBg: string; accentBorder: string; accentText: string;
  btnBg: string; btnHover: string; pillBg: string; pillText: string;
  glowShadow: string; checkBg: string; iconGlow: string;
}> = {
  amber: {
    headerBg: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900',
    accentBg: 'bg-amber-50', accentBorder: 'border-amber-100', accentText: 'text-amber-800',
    btnBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400', btnHover: 'hover:shadow-[0_8px_30px_rgba(251,191,36,.5)]',
    pillBg: 'bg-amber-100', pillText: 'text-amber-700',
    glowShadow: 'shadow-[0_0_30px_rgba(251,191,36,.5)]', checkBg: 'bg-emerald-500',
    iconGlow: 'shadow-[0_0_25px_rgba(16,185,129,.5)]',
  },
  blue: {
    headerBg: 'bg-gradient-to-br from-sky-900 via-indigo-900 to-slate-900',
    accentBg: 'bg-sky-50', accentBorder: 'border-sky-100', accentText: 'text-sky-800',
    btnBg: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500', btnHover: 'hover:shadow-[0_8px_30px_rgba(6,182,212,.5)]',
    pillBg: 'bg-sky-100', pillText: 'text-sky-700',
    glowShadow: 'shadow-[0_0_30px_rgba(6,182,212,.4)]', checkBg: 'bg-emerald-500',
    iconGlow: 'shadow-[0_0_25px_rgba(16,185,129,.5)]',
  },
  emerald: {
    headerBg: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900',
    accentBg: 'bg-emerald-50', accentBorder: 'border-emerald-100', accentText: 'text-emerald-800',
    btnBg: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500', btnHover: 'hover:shadow-[0_8px_30px_rgba(16,185,129,.5)]',
    pillBg: 'bg-emerald-100', pillText: 'text-emerald-700',
    glowShadow: 'shadow-[0_0_30px_rgba(16,185,129,.4)]', checkBg: 'bg-emerald-500',
    iconGlow: 'shadow-[0_0_25px_rgba(16,185,129,.5)]',
  },
};

export default function DynamicThankYou() {
  const { slug } = useParams<{ slug: string }>();
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';

  const [data, setData] = useState<ThankYouData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API_URL}/templates/public/${slug}`)
      .then(r => {
        const t = r.data.template;
        const cfg = JSON.parse(t.config);
        setData({
          title: cfg.title || t.nom,
          subtitle: cfg.subtitle || '',
          heroImg: cfg.images?.hero || '',
          theme: cfg.colors?.theme || 'amber',
          slug: t.slug,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-emerald-500"/>
      </div>
    );
  }

  const theme = data?.theme || 'amber';
  const T = THEME_STYLES[theme] || THEME_STYLES.amber;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes checkPop{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes confetti{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(-60px) rotate(180deg)}}
        .fade-up{animation:fadeUp .5s ease both}
        .check-pop{animation:checkPop .5s cubic-bezier(.22,1,.36,1) .2s both}
        .confetti-1{animation:confetti 1.2s ease-out .4s both}
        .confetti-2{animation:confetti 1s ease-out .5s both}
        .confetti-3{animation:confetti 1.4s ease-out .3s both}
      `}</style>

      <div className="fade-up w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-neutral-200/60 bg-white shadow-2xl shadow-neutral-200/40">

          {/* Header */}
          <div className={`relative ${T.headerBg} px-6 py-10 text-center text-white`}>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="confetti-1 absolute left-[20%] top-4 text-lg">🎉</span>
              <span className="confetti-2 absolute right-[25%] top-6 text-base">✨</span>
              <span className="confetti-3 absolute left-[60%] top-3 text-lg">🎊</span>
            </div>

            {data?.heroImg && (
              <img src={data.heroImg} alt="" className="mx-auto mb-5 h-16 w-16 rounded-2xl border-2 border-white/20 object-cover shadow-lg"/>
            )}

            <div className={`check-pop mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${T.checkBg} ${T.iconGlow}`}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold">Commande envoyee !</h1>
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-white/70">
              Votre commande {data?.title ? `de ${data.title}` : ''} est bien enregistree.
            </p>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5 sm:p-6">

            {/* Reference */}
            {ref && (
              <div className="rounded-2xl bg-neutral-50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Reference de commande</p>
                <p className="mt-1 break-all font-mono text-base font-black text-neutral-900">{ref.slice(0, 12).toUpperCase()}</p>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-emerald-900">Nous vous appelons tres vite</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-700/80">Pour confirmer votre commande et organiser la livraison.</p>
                </div>
              </div>

              <div className={`flex items-start gap-3.5 rounded-2xl border ${T.accentBorder} ${T.accentBg} p-4`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${T.pillBg} ${T.pillText} shadow-sm`}>
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div>
                  <p className={`text-[13px] font-bold ${T.accentText}`}>Paiement a la livraison</p>
                  <p className={`mt-0.5 text-[11px] leading-relaxed ${T.accentText} opacity-70`}>Payez uniquement a la reception de votre colis.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 shadow-sm">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-violet-900">Livraison rapide 24h</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-violet-700/80">Abidjan et environs. Nous livrons vite et bien.</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-1">
              <Link to={`/landing/${slug}?company=${company}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3.5 text-[13px] font-bold text-neutral-700 transition-all hover:border-neutral-300 hover:shadow-md active:scale-[.98]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Retour au produit
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-[10px] text-neutral-400">
          Merci pour votre confiance. Support client disponible 7j/7.
        </p>
      </div>
    </div>
  );
}
