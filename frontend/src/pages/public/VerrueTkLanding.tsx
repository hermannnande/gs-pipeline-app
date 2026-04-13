'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');
const TARGET_CODE = 'VERRUE_TK';
const PRICES: Record<number, number> = { 1: 9900, 2: 14900, 3: 24900 };
const QTY_OPTS = [
  { v: 1, label: '1 boite', sub: '9 900 FCFA', save: '' },
  { v: 2, label: '2 boites', sub: '14 900 FCFA', tag: 'Populaire', save: 'Economisez 4 900 F' },
  { v: 3, label: '3 boites', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
];

interface Product { id: number; code: string; nom: string; prixUnitaire: number; imageUrl: string | null }

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
const pad = (n: number) => String(n).padStart(2, '0');

const I = {
  hero: '/verrue-tk/hero.png', g1: '/verrue-tk/gallery-1.png',
  g2: '/verrue-tk/gallery-2.png', g3: '/verrue-tk/gallery-3.png',
  r1: '/verrue-tk/result-1.png', r2: '/verrue-tk/result-2.png',
  usage: '/verrue-tk/usage.png',
};
const VID = ['/verrue-tk/video-1.mp4', '/verrue-tk/video-2.mp4', '/verrue-tk/video-3.mp4'];

const EXTRA_IMGS = [
  '/verrue-tk/extra-1.png', '/verrue-tk/extra-2.png', '/verrue-tk/extra-3.png',
  '/verrue-tk/extra-4.png', '/verrue-tk/extra-5.png', '/verrue-tk/extra-6.png',
];

const TOASTS = [
  { n: 'Awa K.', v: 'Abidjan', t: '2 min' },
  { n: 'Jean M.', v: 'Bouake', t: '5 min' },
  { n: 'Mariam D.', v: 'Yopougon', t: '8 min' },
  { n: 'Kouassi F.', v: 'Daloa', t: '12 min' },
  { n: 'Fatou S.', v: 'San Pedro', t: '15 min' },
  { n: 'Ibrahim T.', v: 'Korhogo', t: '18 min' },
  { n: 'Aminata C.', v: 'Man', t: '22 min' },
];

const REVIEWS = [
  { init: 'AK', bg: 'bg-amber-500', n: 'Awa K.', v: 'Abidjan', q: 'En 5 jours la verrue a seche completement. Ma peau est redevenue lisse. Incroyable.', s: 5 },
  { init: 'JM', bg: 'bg-sky-500', n: 'Jean-Marc B.', v: 'Bouake', q: 'Livraison le lendemain. Resultat visible des la premiere semaine. Je recommande.', s: 5 },
  { init: 'MD', bg: 'bg-emerald-500', n: 'Mariam D.', v: 'Yopougon', q: 'Commande pour ma mere. Verrues depuis 2 ans. Apres 10 jours, presque fini.', s: 5 },
  { init: 'KF', bg: 'bg-violet-500', n: 'Kouassi F.', v: 'Daloa', q: 'Premiere creme qui marche. Application facile, pas de douleur. Merci.', s: 5 },
  { init: 'FS', bg: 'bg-rose-500', n: 'Fatou S.', v: 'San Pedro', q: 'Service client au top. 2 semaines plus tard, plus rien sur ma peau.', s: 4 },
  { init: 'IT', bg: 'bg-teal-500', n: 'Ibrahim T.', v: 'Korhogo', q: 'J\'hesitais. Maintenant je regrette de ne pas avoir commande plus tot.', s: 5 },
];

const Check = () => (
  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);
const Star = () => (
  <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

function useOnScreen(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function LazyVideo({ src }: { src: string }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div ref={ref} className="aspect-[9/16] w-full rounded-2xl border border-neutral-100 bg-neutral-100 object-cover shadow-md overflow-hidden">
      {visible ? (
        <video src={src} autoPlay loop muted playsInline preload="metadata" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-amber-400"></div>
        </div>
      )}
    </div>
  );
}

function LazyImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div ref={ref}>
      {visible ? (
        <img src={src} alt={alt} className={className} loading="lazy"/>
      ) : (
        <div className={`bg-neutral-100 animate-pulse ${className}`} style={{ aspectRatio: 'auto' }}/>
      )}
    </div>
  );
}

function LazySection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useOnScreen('100px');
  return (
    <div ref={ref} className={className}>
      {visible ? (
        <div className="animate-[fadeUp_.4s_ease_both]">{children}</div>
      ) : (
        <div className="flex min-h-[120px] items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-amber-400"></div>
        </div>
      )}
    </div>
  );
}

function GlowBtn({ onClick, children, variant = 'gold' }: { onClick: () => void; children: React.ReactNode; variant?: 'gold' | 'green' | 'dark' }) {
  const base = 'glow-btn group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-4 text-[15px] font-extrabold shadow-xl transition-all active:scale-[.97] sm:text-base';
  const styles = {
    gold: `${base} bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-neutral-900 shadow-[0_8px_32px_rgba(251,191,36,.45)] hover:shadow-[0_12px_40px_rgba(251,191,36,.6)]`,
    green: `${base} bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 text-white shadow-[0_8px_32px_rgba(16,185,129,.4)] hover:shadow-[0_12px_40px_rgba(16,185,129,.55)]`,
    dark: `${base} bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 text-white shadow-[0_8px_32px_rgba(0,0,0,.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,.45)]`,
  };
  return (
    <button onClick={onClick} className={styles[variant]}>
      <span className="glow-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"/>
      {children}
    </button>
  );
}

function ExtraImageStrip({ indices }: { indices: number[] }) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const srcs = indices.map(i => EXTRA_IMGS[i]).filter(Boolean);
  if (srcs.length === 0) return null;
  const anyLoaded = Object.values(loaded).some(Boolean);
  if (srcs.length > 0 && !anyLoaded) {
    srcs.forEach((src, idx) => {
      const img = new Image();
      img.onload = () => setLoaded(prev => ({ ...prev, [idx]: true }));
      img.onerror = () => setLoaded(prev => ({ ...prev, [idx]: false }));
      img.src = src;
    });
  }
  const visibleSrcs = srcs.filter((_, idx) => loaded[idx]);
  if (visibleSrcs.length === 0) return null;
  return (
    <div className="overflow-hidden py-4 sm:py-6">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 scrollbar-hide sm:justify-center sm:gap-4 sm:overflow-visible sm:px-0">
        {visibleSrcs.map((src, i) => (
          <div key={i} className="w-[70vw] max-w-[320px] shrink-0 snap-center sm:w-[300px] sm:max-w-none">
            <img src={src} alt="" className="w-full rounded-2xl border border-neutral-100 object-cover shadow-lg" loading="lazy"/>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VerrueTkLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [gi, setGi] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const gallery = [I.hero, I.g1, I.g2, I.g3];

  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const toastIdx = useRef(0);
  useEffect(() => {
    const show = () => {
      const t = TOASTS[toastIdx.current % TOASTS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 3000);
      setTimeout(() => setToast(null), 3400);
    };
    const first = setTimeout(show, 5000);
    const id = setInterval(show, 18000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, []);

  const [stock, setStock] = useState(23);
  useEffect(() => {
    const id = setInterval(() => setStock(s => s > 7 ? s - 1 : s), 50000);
    return () => clearInterval(id);
  }, []);

  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - now.getTime());
      setCountdown({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const [exitPopup, setExitPopup] = useState(false);
  const exitShown = useRef(false);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY < 10 && !exitShown.current && !modal) { exitShown.current = true; setExitPopup(true); }
    };
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  }, [modal]);

  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then(r => setProduct((r.data?.products || []).find((p: Product) => p.code?.toUpperCase() === TARGET_CODE) || null))
      .catch(() => setError('Impossible de charger le produit.'))
      .finally(() => setLoading(false));
  }, [company]);

  useEffect(() => { document.body.style.overflow = (modal || exitPopup) ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [modal, exitPopup]);

  const open = useCallback(() => { setFormErr(''); setName(''); setCity(''); setPhone(''); setQty(1); setModal(true); setExitPopup(false); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr('');
    if (!product) return;
    if (!name.trim()) return setFormErr('Entrez votre nom complet.');
    if (!city.trim()) return setFormErr('Entrez votre ville / commune.');
    if (!phone.trim()) return setFormErr('Entrez votre numero de telephone.');
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/public/order`, { company, productId: product.id, customerName: name.trim(), customerPhone: phone.trim(), customerCity: city.trim(), quantity: qty });
      const ref = res.data?.orderReference || '';
      const p = new URLSearchParams(); p.set('company', company); if (ref) p.set('ref', ref);
      navigate(`/anti-verrue/merci?${p.toString()}`);
    } catch (err: any) { setFormErr(err?.response?.data?.error || 'Erreur. Reessayez.'); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-amber-500"></div>
        <p className="mt-3 text-xs text-neutral-400">Chargement...</p>
      </div>
    </div>
  );
  if (error || !product) return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
        {error || 'Produit non disponible.'}
      </div>
    </div>
  );

  const stockPct = Math.round((stock / 30) * 100);

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideOutLeft{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-100%)}}
        .fade-up{animation:fadeUp .5s ease both}
        .marquee-track{animation:marquee 22s linear infinite}
        .toast-in{animation:slideInLeft .4s cubic-bezier(.22,1,.36,1) both}
        .toast-out{animation:slideOutLeft .35s cubic-bezier(.55,.08,.68,.53) both}
        details[open] summary .chevron{transform:rotate(180deg)}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes bounce-soft{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes sheen{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        .glow-btn{animation:bounce-soft 2.5s ease-in-out infinite}
        .glow-btn:hover{animation:none}
        .glow-sheen{animation:sheen 3s ease-in-out infinite}
      `}</style>

      {/* ══ STICKY COUNTDOWN TOP BAR — always visible ══ */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-neutral-900 px-3 py-2 sm:gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 sm:text-[11px]">Offre du jour</span>
        <div className="flex items-center gap-1">
          {[{ v: pad(countdown.h) },{ v: pad(countdown.m) },{ v: pad(countdown.s) }].map((u, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-[10px] font-bold text-amber-400/60">:</span>}
              <span className="inline-flex h-6 min-w-[26px] items-center justify-center rounded bg-white/10 px-1 font-mono text-[12px] font-black tabular-nums text-white sm:h-7 sm:min-w-[30px] sm:text-[13px]">{u.v}</span>
            </div>
          ))}
        </div>
        <span className="hidden text-[10px] text-amber-300/70 sm:inline">· Livraison 24h · Paiement a la livraison</span>
      </div>

      {/* ══ MARQUEE — immediate ══ */}
      <div className="overflow-hidden bg-neutral-800 py-1.5">
        <div className="marquee-track flex w-[200%] items-center gap-8 text-[9px] font-bold uppercase tracking-[.18em] text-amber-300/80 sm:text-[10px]">
          {[0,1].map(k=><div key={k} className="flex shrink-0 items-center gap-8">
            <span>Livraison 24h Abidjan</span><span className="h-1 w-1 rounded-full bg-amber-400/40"/>
            <span>Paiement a la livraison</span><span className="h-1 w-1 rounded-full bg-amber-400/40"/>
            <span>Resultat visible en quelques jours</span><span className="h-1 w-1 rounded-full bg-amber-400/40"/>
            <span>Support client 7j/7</span><span className="h-1 w-1 rounded-full bg-amber-400/40"/>
          </div>)}
        </div>
      </div>

      {/* ══ HERO — loads immediately (priority) ══ */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-5 sm:pb-10 sm:pt-8 md:pt-12">
        <div className="grid items-start gap-6 md:grid-cols-2 md:gap-10">
          <div className="fade-up">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 sm:rounded-3xl">
              <img src={gallery[gi]} alt="Creme anti verrue TK" className="h-full w-full object-cover transition-opacity duration-300" fetchPriority="high"/>
              <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg sm:left-4 sm:top-4 sm:text-xs">BEST-SELLER</span>
            </div>
            <div className="mt-2.5 flex gap-2 sm:mt-3">
              {gallery.map((src, i) => (
                <button key={i} onClick={() => setGi(i)}
                  className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition-all sm:h-[72px] sm:w-[72px] sm:rounded-xl ${i === gi ? 'border-amber-500 ring-2 ring-amber-200' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={src} alt="" className="h-full w-full object-cover"/>
                </button>
              ))}
            </div>
          </div>

          <div className="fade-up space-y-4 sm:space-y-5" style={{ animationDelay: '.1s' }}>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-600 sm:text-xs">Soin anti-verrue</p>
              <h1 className="text-[22px] font-extrabold leading-[1.2] sm:text-3xl md:text-[2.2rem]">Creme Anti-Verrue VERRUE TK</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">{[...Array(5)].map((_,i)=><Star key={i}/>)}</div>
              <span className="text-xs font-semibold text-neutral-600">4.8</span>
              <span className="text-xs text-neutral-400">(1 247 avis)</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-black sm:text-3xl">{fmt(PRICES[1])}</span>
              <span className="text-sm text-neutral-400 line-through">15 000 FCFA</span>
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">-34%</span>
            </div>
            <div className="flex items-center gap-1.5 self-start rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1.5">
              <span className="text-xs">📦</span>
              <span className="text-[12px] font-bold text-amber-700">Plus que {stock} en stock</span>
            </div>
            <p className="text-[13px] leading-relaxed text-neutral-500 sm:text-sm">
              Formule ciblee pour les verrues visibles. Application simple et sans douleur. Resultats constates en quelques jours.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-neutral-600 sm:text-[13px]">
              <span className="flex items-center gap-1.5"><Check/> Paiement a la livraison</span>
              <span className="flex items-center gap-1.5"><Check/> Livraison rapide</span>
              <span className="flex items-center gap-1.5"><Check/> Support 7j/7</span>
            </div>
            <div className="hidden sm:block">
              <GlowBtn onClick={open} variant="gold">
                <span className="relative z-10 flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900 opacity-40"/><span className="relative inline-flex h-2 w-2 rounded-full bg-neutral-900"/></span>
                  Commander maintenant — {fmt(PRICES[1])}
                </span>
              </GlowBtn>
              <p className="mt-2 text-center text-[11px] text-neutral-400">Aucun compte requis. Formulaire rapide en 30 secondes.</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
              <div className="flex -space-x-1.5">
                {['bg-amber-400','bg-emerald-400','bg-sky-400'].map((c,i)=>(
                  <div key={i} className={`h-7 w-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white`}>{['AK','JM','MD'][i]}</div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-bold text-neutral-700 sm:text-xs">+1 200 clients satisfaits</p>
                <p className="text-[10px] text-neutral-400">Cote d'Ivoire et Afrique de l'Ouest</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST STRIPS — lightweight, immediate ══ */}
      <div className="border-y border-neutral-100 bg-neutral-50 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-5 px-4 text-center sm:gap-8">
          {[{ ico: '📱', l: 'Vu sur TikTok' },{ ico: '⭐', l: '4.8/5 — 1247 avis' },{ ico: '🏆', l: '+1 200 commandes' },{ ico: '👨‍⚕️', l: 'Recommande' }].map((s,i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-sm">{s.ico}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[11px]">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-b border-neutral-100 bg-white py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-4 text-center sm:gap-10">
          {[{ n: '1 200+', l: 'Clients satisfaits' },{ n: '24h', l: 'Livraison Abidjan' },{ n: '4.8/5', l: 'Note moyenne' },{ n: '98%', l: 'Recommandent' }].map((s,i)=>(
            <div key={i}><p className="text-lg font-black sm:text-xl">{s.n}</p><p className="text-[10px] text-neutral-400 sm:text-[11px]">{s.l}</p></div>
          ))}
        </div>
      </div>

      {/* ══ BANNER IMAGE + CTA ══ */}
      <div className="relative overflow-hidden py-6 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-white to-white"/>
        <div className="relative mx-auto max-w-3xl px-4">
          <img src="/verrue-tk/banner-clients.jpg" alt="Clients satisfaits" className="w-full rounded-t-2xl border border-b-0 border-neutral-100 object-cover shadow-xl" loading="lazy"/>
          <div className="rounded-b-2xl border border-t-0 border-neutral-100 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-5 py-6 text-center shadow-xl sm:px-8 sm:py-8">
            <h3 className="mb-2 text-lg font-extrabold leading-tight text-white sm:text-xl">
              <span className="text-amber-400">✨</span> Dites STOP aux verrues rapidement !
            </h3>
            <p className="mx-auto mb-5 max-w-md text-[13px] leading-relaxed text-neutral-300 sm:text-sm">
              Grace a sa formule puissante, notre creme agit en profondeur pour eliminer les verrues a la racine, assecher la peau infectee et favoriser une regeneration saine.
            </p>
            <GlowBtn onClick={open} variant="gold">
              <span className="relative z-10 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900 opacity-40"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neutral-900"/></span>
                Commander maintenant — {fmt(PRICES[1])}
              </span>
            </GlowBtn>
          </div>
        </div>
      </div>

      {/* ══ EXTRA IMAGES STRIP 1 ══ */}
      <ExtraImageStrip indices={[0, 1]}/>

      {/* ══ PACK OFFERS — lazy ══ */}
      <LazySection className="relative overflow-hidden py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/60"/>
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-200/20 blur-3xl"/>
        <div className="pointer-events-none absolute -bottom-10 -left-20 h-48 w-48 rounded-full bg-amber-300/15 blur-3xl"/>
        <div className="relative mx-auto max-w-3xl px-4">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-600">Offres speciales</p>
          <h2 className="mb-2 text-center text-xl font-extrabold sm:text-2xl">Choisissez votre offre</h2>
          <p className="mx-auto mb-6 max-w-lg text-center text-[13px] text-neutral-400">Plus vous commandez, plus vous economisez.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {QTY_OPTS.map(o => (
              <button key={o.v} onClick={() => { setQty(o.v); open(); }}
                className={`relative rounded-2xl border-2 px-4 py-4 text-center transition-all hover:shadow-lg sm:p-5 ${o.v === 2 ? 'border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-200' : 'border-neutral-200 bg-white hover:border-amber-300'}`}>
                {o.tag && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold text-white shadow">{o.tag}</span>}
                <div className="flex items-center justify-between sm:flex-col sm:items-center sm:gap-1">
                  <div className="text-left sm:text-center">
                    <p className="text-[15px] font-black sm:text-lg">{o.label}</p>
                    <p className="text-[17px] font-black text-neutral-900 sm:text-xl">{o.sub}</p>
                    {o.v > 1 && <p className="text-[10px] font-bold text-emerald-600">{o.save}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-2 text-[11px] font-extrabold text-neutral-900 shadow-md sm:mt-2 sm:w-full sm:justify-center sm:px-4 sm:text-[12px]">
                    <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900 opacity-40"/><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neutral-900"/></span>
                    Commander
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </LazySection>

      {/* ══ EXTRA IMAGES STRIP 2 ══ */}
      <ExtraImageStrip indices={[2, 3]}/>

      {/* ══ VIDEOS — lazy loaded individually ══ */}
      <LazySection className="relative overflow-hidden border-y border-neutral-100 py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900"/>
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[80px]"/>
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-400">Preuves en video</p>
          <h2 className="mb-2 text-center text-xl font-extrabold text-white sm:text-2xl">Voyez les resultats vous-meme</h2>
          <p className="mx-auto mb-5 max-w-lg text-center text-[13px] text-neutral-400">Des utilisateurs partagent leur experience.</p>
        </div>
        <div className="relative mx-auto grid max-w-4xl grid-cols-3 gap-2 px-4 sm:gap-4">
          {VID.map((v,i) => (
            <div key={i} className="w-full">
              <LazyVideo src={v}/>
            </div>
          ))}
        </div>
      </LazySection>

      {/* ══ AVANT / APRES — lazy ══ */}
      <LazySection className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-600">Resultats constates</p>
          <h2 className="mb-2 text-center text-xl font-extrabold sm:text-2xl">Avant et apres utilisation</h2>
          <p className="mx-auto mb-7 max-w-lg text-center text-[13px] text-neutral-400">Evolution constatee par nos clients en quelques jours.</p>
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-5">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md">
              <div className="relative">
                <LazyImg src="/verrue-tk/avant.jpg" alt="Avant utilisation" className="aspect-[3/4] w-full object-cover"/>
                <span className="absolute bottom-3 left-3 rounded-full bg-red-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-lg sm:text-xs">AVANT</span>
              </div>
              <div className="p-3 sm:p-4"><p className="text-[11px] text-neutral-500 sm:text-[12px]">Verrues visibles genantes au quotidien.</p></div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md">
              <div className="relative">
                <LazyImg src="/verrue-tk/apres.jpg" alt="Apres utilisation" className="aspect-[3/4] w-full object-cover"/>
                <span className="absolute bottom-3 left-3 rounded-full bg-emerald-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-lg sm:text-xs">APRES</span>
              </div>
              <div className="p-3 sm:p-4"><p className="text-[11px] text-neutral-500 sm:text-[12px]">Peau nette apres utilisation de VERRUE TK.</p></div>
            </div>
          </div>
        </div>
      </LazySection>

      {/* ══ HOW TO USE — lazy ══ */}
      <LazySection className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-600">Mode d'emploi</p>
          <h2 className="mb-2 text-center text-xl font-extrabold sm:text-2xl">Simple a utiliser</h2>
          <p className="mx-auto mb-7 max-w-lg text-center text-[13px] text-neutral-400">4 etapes faciles.</p>
          <LazyImg src={I.usage} alt="Utilisation" className="mx-auto mb-8 w-full max-w-xl rounded-2xl border border-neutral-200 object-cover shadow-lg sm:rounded-3xl"/>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', t: 'Nettoyez', d: 'Lavez la zone concernee a l\'eau propre.', ico: '💧' },
              { n: '02', t: 'Appliquez', d: 'Deposez une petite quantite de creme.', ico: '🧴' },
              { n: '03', t: 'Repetez', d: 'Suivez la routine conseillee.', ico: '🔁' },
              { n: '04', t: 'Observez', d: 'Constatez l\'amelioration.', ico: '✨' },
            ].map(s => (
              <div key={s.n} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-2.5 flex items-center gap-2"><span className="text-lg">{s.ico}</span><span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">ETAPE {s.n}</span></div>
                <h3 className="mb-1 text-sm font-bold">{s.t}</h3>
                <p className="text-xs leading-relaxed text-neutral-400">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </LazySection>

      {/* ══ EXTRA IMAGES STRIP 3 ══ */}
      <ExtraImageStrip indices={[4, 5]}/>

      {/* ══ MID CTA — lazy ══ */}
      <LazySection className="relative overflow-hidden py-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/50"/>
        <div className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-emerald-200/20 blur-3xl"/>
        <div className="pointer-events-none absolute -right-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-amber-200/20 blur-3xl"/>
        <div className="relative mx-auto max-w-lg px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-2.5 flex-1 rounded-full bg-neutral-100"><div className="h-full rounded-full bg-gradient-to-r from-red-400 to-amber-400 transition-all" style={{ width: `${stockPct}%` }}/></div>
            <span className="shrink-0 text-[11px] font-bold text-red-500">Plus que {stock} unites</span>
          </div>
          <GlowBtn onClick={open} variant="gold">
            <span className="relative z-10 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900 opacity-40"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neutral-900"/></span>
              Je commande maintenant
            </span>
          </GlowBtn>
          <p className="mt-3 text-[11px] text-neutral-400">Paiement a la livraison — Formulaire en 30 secondes</p>
        </div>
      </LazySection>

      {/* ══ TESTIMONIALS — lazy ══ */}
      <LazySection className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex flex-col items-center gap-1 sm:mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600">Avis clients verifies</p>
            <h2 className="text-xl font-extrabold sm:text-2xl">+1 200 clients satisfaits</h2>
            <div className="mt-1 flex items-center gap-1.5"><div className="flex gap-0.5">{[...Array(5)].map((_,i)=><Star key={i}/>)}</div><span className="text-xs font-bold text-neutral-700">4.8/5</span><span className="text-[11px] text-neutral-400">— 1 247 avis</span></div>
          </div>
        </div>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide sm:justify-center sm:gap-4 sm:overflow-visible sm:px-0">
          {REVIEWS.map((t, i) => (
            <div key={i} className="w-[75vw] max-w-[300px] shrink-0 snap-center rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:w-[300px] sm:max-w-none sm:p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.bg} text-[11px] font-bold text-white shadow-md sm:h-10 sm:w-10 sm:text-xs`}>{t.init}</div>
                <div className="min-w-0"><p className="truncate text-[13px] font-bold">{t.n}</p><p className="text-[10px] text-neutral-400">{t.v}</p></div>
              </div>
              <div className="mb-2 flex items-center gap-2"><div className="flex gap-0.5">{[...Array(t.s)].map((_,j)=><Star key={j}/>)}</div></div>
              <p className="mb-3 text-[12px] leading-relaxed text-neutral-600 sm:text-[13px]">"{t.q}"</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600"><Check/> Achat verifie</span>
            </div>
          ))}
        </div>
      </LazySection>

      {/* ══ GUARANTEE — lazy ══ */}
      <LazySection className="relative overflow-hidden py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30"/>
        <div className="pointer-events-none absolute -right-16 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-emerald-200/15 blur-3xl"/>
        <div className="relative mx-auto max-w-3xl px-4">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg sm:p-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl shadow-sm">🛡️</div>
              <div>
                <h3 className="mb-1 text-[15px] font-extrabold text-emerald-900 sm:text-base">Commandez en toute confiance</h3>
                <p className="text-[12px] leading-relaxed text-emerald-700 sm:text-[13px]">Paiement uniquement a la livraison. Verifiez le colis avant de payer. Support 7j/7.</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[{ ico: '📦', t: 'Livraison securisee' },{ ico: '💰', t: 'Paiement reception' },{ ico: '📞', t: 'Support 7j/7' }].map((g,i) => (
                <div key={i} className="rounded-xl bg-white/80 p-3 text-center shadow-sm"><span className="text-xl">{g.ico}</span><p className="mt-1 text-[10px] font-bold text-emerald-800">{g.t}</p></div>
              ))}
            </div>
          </div>
        </div>
      </LazySection>

      {/* ══ FAQ — lazy ══ */}
      <LazySection className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-600">FAQ</p>
          <h2 className="mb-2 text-center text-xl font-extrabold sm:text-2xl">Questions frequentes</h2>
          <p className="mx-auto mb-7 max-w-lg text-center text-[13px] text-neutral-400">Tout savoir avant de commander.</p>
          <div className="space-y-2">
            {[
              { q: 'Est-ce douloureux ?', a: 'Non. Application locale, douce et rapide.' },
              { q: 'Dois-je payer avant ?', a: 'Non. Paiement uniquement a la reception.' },
              { q: 'Quand je vois les resultats ?', a: 'La plupart des clients voient une amelioration en quelques jours.' },
              { q: 'Comment suis-je contacte ?', a: 'Notre equipe vous appelle dans les heures qui suivent.' },
              { q: 'Convient a tous types de peau ?', a: 'Oui, formule concue pour tous les types de peau.' },
              { q: 'Plusieurs boites ?', a: '2 boites a 14 900 F ou 3 boites a 24 900 F. Offres groupees populaires.' },
            ].map((f, i) => (
              <details key={i} className="group rounded-xl border border-neutral-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-[13px] font-bold sm:text-sm">{f.q}<svg className="chevron h-4 w-4 shrink-0 text-neutral-300 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg></summary>
                <p className="px-4 pb-4 text-[13px] leading-relaxed text-neutral-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </LazySection>

      {/* ══ FINAL CTA — lazy ══ */}
      <LazySection className="relative overflow-hidden py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"/>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[100px]"/>
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-amber-400/5 blur-[60px]"/>
        <div className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-emerald-400/5 blur-[60px]"/>
        <div className="relative mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto mb-4 flex justify-center -space-x-2">
            {REVIEWS.slice(0,5).map((s,i)=><div key={i} className={`flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-neutral-900 ${s.bg} text-[10px] font-bold text-white`}>{s.init}</div>)}
          </div>
          <div className="mb-3 flex items-center justify-center gap-1"><div className="flex gap-0.5">{[...Array(5)].map((_,i)=><Star key={i}/>)}</div><span className="text-xs font-bold text-white">4.8/5</span></div>
          <h2 className="mb-2 text-xl font-extrabold text-white sm:text-2xl">Rejoignez +1 200 clients satisfaits</h2>
          <p className="mb-6 text-[13px] text-neutral-400">Commandez maintenant. Paiement a la livraison.</p>
          <GlowBtn onClick={open} variant="gold">
            <span className="relative z-10 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900 opacity-40"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neutral-900"/></span>
              Commander ici — {fmt(PRICES[1])}
            </span>
          </GlowBtn>
          <p className="mt-3 text-[11px] text-neutral-500">Aucun compte requis · Formulaire en 30 secondes</p>
        </div>
      </LazySection>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-neutral-100 bg-white pb-24 pt-6 sm:pb-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            {[{ ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },{ ico: '💰', t: 'Paiement livraison', d: 'Aucun risque' },{ ico: '📞', t: 'Support client', d: '7j/7' },{ ico: '🛡️', t: 'Commande securisee', d: 'Verifiez avant de payer' }].map((f,i)=>(
              <div key={i} className="w-[140px]"><span className="text-xl">{f.ico}</span><p className="mt-1 text-[11px] font-bold text-neutral-700">{f.t}</p><p className="text-[10px] text-neutral-400">{f.d}</p></div>
            ))}
          </div>
          <p className="mt-6 text-center text-[10px] text-neutral-300">© 2026 Creme Anti-Verrue TK · Cote d'Ivoire</p>
        </div>
      </footer>

      {/* ══ STICKY BAR ══ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:py-3">
          <img src={I.hero} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-neutral-100 object-cover sm:h-12 sm:w-12"/>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold sm:text-sm">Creme Anti-Verrue TK</p>
            <p className="text-[11px] text-neutral-400">{fmt(PRICES[1])} · Paiement a la livraison</p>
          </div>
          <button onClick={open} className="shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-2.5 text-[13px] font-extrabold text-neutral-900 shadow-[0_4px_16px_rgba(251,191,36,.35)] transition hover:shadow-[0_6px_24px_rgba(251,191,36,.5)] active:scale-[.97] sm:px-6 sm:text-sm">Commander</button>
        </div>
      </div>

      {/* ══ LIVE TOAST ══ */}
      {toast && (
        <div className={`${toast.visible ? 'toast-in' : 'toast-out'} fixed bottom-20 left-3 z-50 flex max-w-[300px] items-center gap-2.5 rounded-xl border border-neutral-100 bg-white/95 px-3.5 py-3 shadow-2xl backdrop-blur sm:bottom-20 sm:left-5`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm text-white">✓</div>
          <div>
            <p className="text-[12px] font-bold text-neutral-800">{toast.n} vient de commander</p>
            <p className="text-[10px] text-neutral-400">Creme Anti-Verrue · il y a {toast.t}</p>
          </div>
        </div>
      )}

      {/* ══ EXIT INTENT ══ */}
      {exitPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setExitPopup(false); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <button onClick={() => setExitPopup(false)} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition hover:bg-neutral-200">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <span className="mb-3 inline-block text-4xl">⚡</span>
            <h3 className="mb-1 text-lg font-extrabold">Attendez !</h3>
            <p className="mb-4 text-[13px] text-neutral-500">Ne partez pas sans votre creme anti-verrue. Commandez maintenant, payez a la livraison.</p>
            <button onClick={open} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-neutral-800 active:scale-[.98]">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60"/><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"/></span>
              Commander maintenant
            </button>
            <p className="mt-2 text-[10px] text-neutral-400">Offre disponible encore aujourd'hui</p>
          </div>
        </div>
      )}

      {/* ══ MODAL FORM ══ */}
      {modal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
          <div ref={formRef} className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-[400px] sm:rounded-2xl">
            <button onClick={() => setModal(false)} className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 sm:h-8 sm:w-8">
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="bg-neutral-900 px-4 pb-3 pt-4 text-white sm:px-5 sm:pb-4 sm:pt-5">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold text-amber-300 sm:text-[10px]">Livraison 24h</span>
                <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300 sm:text-[10px]">Paiement a la livraison</span>
              </div>
              <h3 className="text-base font-extrabold sm:text-lg">Finaliser votre commande</h3>
              <p className="mt-0.5 text-[11px] text-neutral-400 sm:text-[12px]">Nous vous appelons pour confirmer.</p>
            </div>
            <div className="h-1 bg-neutral-100"><div className="h-full w-4/5 bg-gradient-to-r from-amber-400 to-amber-500"/></div>
            <form onSubmit={submit} className="space-y-2.5 p-3 pb-4 sm:space-y-3 sm:p-4 sm:pb-5">
              {[
                { icon: '👤', label: 'Nom complet', val: name, set: setName, ph: 'Ex. Kouadio Fernand', type: 'text' as const },
                { icon: '📍', label: 'Ville / Commune', val: city, set: setCity, ph: 'Ex. Abidjan — Yopougon', type: 'text' as const },
                { icon: '📱', label: 'Telephone', val: phone, set: setPhone, ph: 'Ex. 07 00 00 00 00', type: 'tel' as const },
              ].map(f => (
                <label key={f.label} className="block">
                  <span className="mb-0.5 block text-[11px] font-bold text-neutral-700 sm:mb-1 sm:text-[12px]">{f.label} <span className="text-red-500">*</span></span>
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 transition-colors focus-within:border-amber-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(251,191,36,.12)]">
                    <span className="text-sm">{f.icon}</span>
                    <input type={f.type} inputMode={f.type === 'tel' ? 'tel' : undefined} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="h-10 w-full border-none bg-transparent text-[13px] font-medium outline-none placeholder:text-neutral-300 sm:h-11"/>
                  </div>
                </label>
              ))}
              <div>
                <span className="mb-1 block text-[11px] font-bold text-neutral-700 sm:mb-1.5 sm:text-[12px]">Quantite</span>
                <div className="grid gap-1.5 sm:gap-2">
                  {QTY_OPTS.map(o => (
                    <button key={o.v} type="button" onClick={() => setQty(o.v)} className={`relative flex items-center justify-between rounded-xl border-2 px-3 py-2 text-left transition-all sm:px-3.5 sm:py-2.5 ${qty === o.v ? 'border-amber-400 bg-amber-50/60 shadow-sm' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 sm:h-5 sm:w-5 ${qty === o.v ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'}`}>{qty === o.v && <div className="h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2"/>}</div>
                        <span className="text-[12px] font-bold sm:text-[13px]">{o.label}</span>
                      </div>
                      <span className="text-[12px] font-extrabold sm:text-[13px]">{o.sub}</span>
                      {o.tag && <span className="absolute -top-1.5 right-2 rounded-full bg-amber-500 px-1.5 py-px text-[8px] font-bold text-white sm:-top-2 sm:right-3 sm:px-2 sm:py-0.5 sm:text-[9px]">{o.tag}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-neutral-900 px-3 py-2.5 text-white sm:px-4 sm:py-3">
                <span className="text-[12px] font-semibold sm:text-[13px]">Total</span>
                <span className="text-[15px] font-black sm:text-base">{fmt(PRICES[qty] || PRICES[1])}</span>
              </div>
              {formErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600 sm:text-[12px]">{formErr}</p>}
              <button type="submit" disabled={sending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-[0_12px_30px_rgba(16,185,129,.3)] transition hover:bg-emerald-500 active:scale-[.98] disabled:cursor-wait disabled:opacity-70 sm:h-12 sm:text-[14px]">
                {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Envoi...</> : 'Valider ma commande'}
              </button>
              <p className="text-center text-[9px] text-neutral-400 sm:text-[10px]">Nous vous appelons pour confirmer.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
