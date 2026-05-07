/**
 * Landing ULTRA PREMIUM — Creme Anti-Verrues BOTANIQUE (VERRUE_TK)
 * Palette sage/emerald/amber/ivoire — focus formule plante medicinale
 * Distinct visuellement de creme-verrue-tk (serum bleu Wart Killer)
 * ==================================================================
 *
 * Palette : BLEU DOMINANT (produit bleu)
 *   - sky / blue / cyan / indigo : couleurs principales
 *   - orange / amber : urgence (contraste fort)
 *   - emerald : accents discrets (checkmarks)
 *
 * 9 images UNIQUES utilisees (aucune repetition) :
 *   - new-6  -> Hero stacke (+ fond banniere finale)
 *   - man-1  -> Bloc probleme
 *   - new-1  -> Etape 1 (timeline)
 *   - new-2  -> Etape 2
 *   - new-3  -> Etape 3
 *   - new-4  -> Bloc usage (en 3 gestes)
 *   - man-2  -> Avant
 *   - new-5  -> Apres
 *   - new-7  -> Bloc engagement
 *
 * + 3 videos conservees : video-1 / video-2 / video-3
 *
 * Hero = STACKE : titre principal -> image -> CTA en bas (comme demande)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'creme-anti-verrue';
const PRODUCT_CODE = 'VERRUE_TK';
const META_PIXEL_ID = '974673311723451';
const THANK_YOU_URL = '/creme-anti-verrue/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const OLD_PRICE_UNIT = 15000;
const QTY_OPTS = [
  { v: 1, label: '1 boite', sub: '9 900 FCFA' },
  { v: 2, label: '2 boites', sub: '16 900 FCFA', tag: 'Populaire', save: 'Economisez 2 900 F' },
  { v: 3, label: '3 boites', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
];

// ================= 9 images UNIQUES + 3 videos =================
const MEDIA = {
  hero:       '/creme-anti-verrue/hero.webp',
  problem:    '/creme-anti-verrue/usage.webp',
  step1:      '/creme-anti-verrue/gallery-1.webp',
  step2:      '/creme-anti-verrue/gallery-2.webp',
  step3:      '/creme-anti-verrue/gallery-3.webp',
  usage:      '/creme-anti-verrue/result-1.webp',
  avant:      '/creme-anti-verrue/avant.webp',
  apres:      '/creme-anti-verrue/apres.webp',
  engagement: '/creme-anti-verrue/banner-clients.webp',
  video1:     '/verrue-tk/video-1.mp4',
  video1Post: '/creme-anti-verrue/result-2.webp',
  video2:     '/verrue-tk/video-2.mp4',
  video3:     '/verrue-tk/video-3.mp4',
};

declare global { interface Window { fbq: any; _fbq: any; } }

function initMetaPixel(pixelId: string) {
  if (!pixelId) return;
  if (!window.fbq) {
    const f: any = window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); };
    if (!window._fbq) window._fbq = f;
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    const s = document.createElement('script');
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

interface Product { id: number; code: string; nom: string; prixUnitaire: number }

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
const pad = (n: number) => String(n).padStart(2, '0');

// =========================================================
// Lazy helpers
// =========================================================
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

function LazyVideo({ src, poster, aspect = '9/16' }: { src: string; poster?: string; aspect?: string }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-3xl border border-lime-200 bg-emerald-950 shadow-[0_20px_60px_-12px_rgba(37,99,235,.45)]"
      style={{ aspectRatio: aspect }}
    >
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-lime-400"/>
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-950/80 to-transparent"/>
    </div>
  );
}

function LazyImg({ src, alt, className, aspect }: { src: string; alt: string; className?: string; aspect?: string }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div ref={ref} className={`overflow-hidden ${className || ''}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible
        ? <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover"/>
        : <div className="h-full w-full animate-pulse bg-lime-50"/>}
    </div>
  );
}

// =========================================================
// UI atoms — palette BLEU dominante
// =========================================================
const Check = () => (
  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
  </svg>
);

const Star = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

// Divider en vague (SVG) - signature visuelle
function WaveDivider({ color = '#eff6ff', flip = false }: { color?: string; flip?: boolean }) {
  return (
    <div className={`pointer-events-none w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''}`} aria-hidden="true">
      <svg className="block h-12 w-full sm:h-16" preserveAspectRatio="none" viewBox="0 0 1200 120">
        <path
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

// CTA premium - palette bleu dominant + orange pour l'urgence
function CTA({
  onClick,
  children,
  variant = 'blue',
  size = 'md',
  fullWidth = true,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'blue' | 'sky' | 'indigo' | 'orange' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const grads: Record<string, string> = {
    blue:    'from-emerald-600 via-lime-500 to-amber-500',
    sky:     'from-lime-500 via-emerald-500 to-indigo-600',
    indigo:  'from-indigo-600 via-emerald-600 to-lime-500',
    cyan:    'from-amber-500 via-lime-500 to-emerald-600',
    orange:  'from-orange-500 via-amber-500 to-red-500',
  };
  const glows: Record<string, string> = {
    blue:    'shadow-[0_12px_40px_-4px_rgba(37,99,235,.6)] hover:shadow-[0_16px_50px_-4px_rgba(37,99,235,.8)]',
    sky:     'shadow-[0_12px_40px_-4px_rgba(14,165,233,.55)] hover:shadow-[0_16px_50px_-4px_rgba(14,165,233,.75)]',
    indigo:  'shadow-[0_12px_40px_-4px_rgba(79,70,229,.55)] hover:shadow-[0_16px_50px_-4px_rgba(79,70,229,.75)]',
    cyan:    'shadow-[0_12px_40px_-4px_rgba(6,182,212,.55)] hover:shadow-[0_16px_50px_-4px_rgba(6,182,212,.75)]',
    orange:  'shadow-[0_12px_40px_-4px_rgba(249,115,22,.6)] hover:shadow-[0_16px_50px_-4px_rgba(249,115,22,.85)]',
  };
  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-[13px]',
    md: 'px-6 py-3.5 text-[14px]',
    lg: 'px-8 py-4 text-[15px] sm:text-base',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group vt-cta relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${grads[variant]} font-extrabold text-white ${glows[variant]} transition-shadow ${sizes[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="vt-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"/>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

// =========================================================
// Main component
// =========================================================
export default function CremeAntiVerrueLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(29);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const [exitPopup, setExitPopup] = useState(false);
  const exitShown = useRef(false);
  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const TOASTS = useMemo(() => [
    { n: 'Awa K.',       v: 'Abidjan',   t: '3 min'  },
    { n: 'Jean-Marc B.', v: 'Bouake',    t: '7 min'  },
    { n: 'Mariam D.',    v: 'Yopougon',  t: '11 min' },
    { n: 'Kouassi F.',   v: 'Daloa',     t: '15 min' },
    { n: 'Fatou S.',     v: 'San Pedro', t: '19 min' },
    { n: 'Aminata C.',   v: 'Man',       t: '24 min' },
  ], []);

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    initMetaPixel(META_PIXEL_ID);
    window.fbq?.('track', 'ViewContent', {
      content_name: 'Creme Anti-Verrues Botanique',
      content_ids: [PRODUCT_CODE],
      content_type: 'product',
      value: PRICES[1],
      currency: 'XOF',
    });
  }, [company]);

  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then(r => {
        const p = (r.data?.products || []).find((p: Product) => p.code?.toUpperCase() === PRODUCT_CODE);
        if (p) setProduct(p);
      }).catch(() => {});
  }, [company]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - now.getTime());
      setCountdown({
        h: Math.floor(d / 3600000),
        m: Math.floor((d % 3600000) / 60000),
        s: Math.floor((d % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setStock(s => (s > 9 ? s - 1 : s)), 42000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const show = () => {
      const t = TOASTS[toastIdx.current % TOASTS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 3000);
      setTimeout(() => setToast(null), 3400);
    };
    const first = setTimeout(show, 6000);
    const id = setInterval(show, 17000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [TOASTS]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY < 10 && !exitShown.current && !modal) { exitShown.current = true; setExitPopup(true); }
    };
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  }, [modal]);

  useEffect(() => {
    document.body.style.overflow = (modal || exitPopup) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal, exitPopup]);

  const openModal = useCallback((q?: number) => {
    if (q) setQty(q); else setQty(1);
    setModal(true);
    setExitPopup(false);
  }, []);

  const stockPct = Math.round((stock / 40) * 100);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#f8fbff] text-neutral-900" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      {/* Styles locaux - classes "vt-" (verrue-tk) */}
      <style>{`
        @keyframes vt-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes cav-fade-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes cav-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes vt-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes vt-float-slow { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-20px) translateX(14px) } }
        @keyframes vt-sheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes cav-pulse-ring { 0% { transform: scale(.95); opacity: 1 } 100% { transform: scale(1.65); opacity: 0 } }
        @keyframes cav-slide-in-left { from { opacity: 0; transform: translateX(-100%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes cav-slide-out-left { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-100%) } }
        @keyframes vt-gradient-shift { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        @keyframes vt-heartbeat { 0%,100% { transform: scale(1) } 25% { transform: scale(1.1) } 50% { transform: scale(.95) } 75% { transform: scale(1.05) } }
        @keyframes cav-shimmer-text { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        @keyframes cav-pulse-bg { 0%,100% { opacity: .25 } 50% { opacity: .55 } }
        @keyframes vt-bob { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(-8px) rotate(1deg) } }

        .cav-fade-up { animation: cav-fade-up .6s cubic-bezier(.22,.8,.4,1) both }
        .cav-fade-in { animation: cav-fade-in .5s ease-out both }
        .vt-marquee { animation: vt-marquee 28s linear infinite }
        .vt-float { animation: vt-float 3s ease-in-out infinite }
        .vt-float-slow { animation: vt-float-slow 8s ease-in-out infinite }
        .vt-bob { animation: vt-bob 4s ease-in-out infinite }
        .vt-cta { animation: vt-float 2.6s ease-in-out infinite }
        .vt-cta:hover { animation: none; transform: translateY(-2px) }
        .vt-cta-sheen { animation: vt-sheen 3.2s ease-in-out infinite }
        .cav-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: cav-pulse-ring 1.6s cubic-bezier(0,0,.2,1) infinite }
        .vt-toast-in { animation: cav-slide-in-left .4s cubic-bezier(.22,1,.36,1) both }
        .vt-toast-out { animation: cav-slide-out-left .35s cubic-bezier(.55,.08,.68,.53) both }
        .vt-animated-bg { background-size: 220% 220%; animation: vt-gradient-shift 9s ease infinite }
        .vt-heartbeat { animation: vt-heartbeat 1.4s ease-in-out infinite }
        .cav-pulse-bg { animation: cav-pulse-bg 3s ease-in-out infinite }
        .cav-shimmer-text {
          background: linear-gradient(90deg, #0ea5e9 0%, #2563eb 25%, #0891b2 50%, #2563eb 75%, #0ea5e9 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: cav-shimmer-text 3.5s linear infinite;
        }
        .vt-rail::before {
          content: '';
          position: absolute;
          left: 50%; top: 0; bottom: 0;
          width: 3px;
          transform: translateX(-50%);
          background: linear-gradient(180deg, transparent 0%, #0ea5e9 10%, #2563eb 50%, #4f46e5 90%, transparent 100%);
          border-radius: 9999px;
          opacity: .4;
        }
        @media (max-width: 767px) {
          .vt-rail::before { left: 20px }
        }
        details[open] summary .vt-chev { transform: rotate(180deg) }
      `}</style>

      {/* ===================================================== */}
      {/* STICKY TOP BAR - bleu dominant + urgence orange        */}
      {/* ===================================================== */}
      <div className="sticky top-0 z-50 border-b border-lime-400/30 bg-gradient-to-r from-emerald-700 via-lime-600 to-amber-600 vt-animated-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-3 py-2 sm:gap-3">
          <span className="relative flex h-2 w-2 text-orange-300 cav-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-300"/>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white sm:text-[11px]">
            Offre speciale - fin dans
          </span>
          <div className="flex items-center gap-1">
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] font-bold text-white/70">:</span>}
                <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md bg-black/30 px-1.5 font-mono text-[12px] font-black tabular-nums text-white ring-1 ring-white/20 sm:h-7 sm:min-w-[32px] sm:text-[13px]">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* MARQUEE                                                */}
      {/* ===================================================== */}
      <div className="overflow-hidden bg-emerald-950 py-1.5">
        <div className="vt-marquee flex w-[200%] items-center gap-8 text-[9px] font-bold uppercase tracking-[0.2em] text-lime-300/90 sm:text-[10px]">
          {[0, 1].map(k => (
            <div key={k} className="flex shrink-0 items-center gap-8">
              {[
                'Formule 100% botanique - plantes medicinales',
                'Sans douleur - sans cicatrice',
                'Resultat en 5 a 10 jours',
                'Paiement a la livraison',
                'Livraison 24h Abidjan',
                '2 000+ peaux liberees',
              ].map((t, i) => (
                <span key={`${k}-${i}`}>{t}<span className="ml-8 inline-block h-1 w-1 rounded-full bg-lime-400/60"/></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================== */}
      {/* HERO STACKE : titre -> image -> CTA en bas             */}
      {/* (comme demande par l'utilisateur)                      */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden">
        {/* Fond gradient bleu */}
        <div className="absolute inset-0 bg-gradient-to-br from-lime-50 via-emerald-50 to-indigo-50"/>
        <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-lime-300/40 blur-3xl vt-float-slow"/>
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl vt-float-slow" style={{ animationDelay: '2s' }}/>
        <div className="pointer-events-none absolute top-1/3 right-10 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl cav-pulse-bg"/>

        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-6 text-center sm:pt-10 md:pt-14 md:pb-14">

          {/* Badge */}
          <div className="cav-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-md ring-1 ring-emerald-100 sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500 vt-heartbeat"/>
              Creme botanique - 100% plante medicinale
            </span>
          </div>

          {/* TITRE PRINCIPAL */}
          <h1 className="mt-4 text-[36px] font-black leading-[1.02] tracking-tight sm:text-5xl md:text-[56px] cav-fade-up" style={{ animationDelay: '.05s' }}>
            <span className="cav-shimmer-text">ANTI-VERRUES</span>
            <span className="mt-1 block text-neutral-900">
              efface vos verrues
            </span>
            <span className="block text-neutral-900">
              <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-transparent">sans douleur</span>.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-neutral-600 sm:text-[16px] cav-fade-up" style={{ animationDelay: '.1s' }}>
            Creme botanique aux plantes medicinales. Resultat visible en{' '}
            <span className="font-black text-emerald-600">5 a 10 jours</span>. Plus de{' '}
            <span className="font-black text-lime-700">2 000 clients</span> soulages.
          </p>

          {/* ============= IMAGE CENTRALE (stackee) ============= */}
          <div className="relative mt-6 cav-fade-up" style={{ animationDelay: '.15s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-lime-400/50 via-emerald-400/40 to-indigo-400/50 blur-3xl"/>
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-emerald-100 vt-bob">
              <LazyImg src={MEDIA.hero} alt="Creme Anti-Verrues" aspect="1/1"/>
              {/* Overlay liseret bas */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-950/40 to-transparent"/>
            </div>

            {/* Badges flottants */}
            <div className="absolute -left-2 top-8 rotate-[-8deg] rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-500 px-3 py-2 text-center text-white shadow-xl vt-heartbeat sm:-left-4">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-90">Stock</p>
              <p className="text-[18px] font-black leading-none">Limite</p>
            </div>
            <div className="absolute -right-2 bottom-6 rotate-[6deg] rounded-xl bg-white px-3 py-2 shadow-xl ring-1 ring-emerald-100 sm:-right-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Testee cliniquement</p>
              <p className="flex items-center gap-0.5 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
              </p>
            </div>
          </div>

          {/* Prix + CTA juste sous l'image */}
          <div className="mt-8 cav-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
                9 900
              </span>
              <span className="text-lg font-bold text-neutral-900 sm:text-xl">FCFA</span>
              <span className="text-sm text-neutral-400 line-through sm:text-base">15 000 FCFA</span>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600">-34%</span>
            </div>
            <p className="mt-1 text-[12px] font-semibold text-lime-600">🚚 Livraison gratuite a Abidjan</p>

            {/* CTA orange (contraste fort avec le bleu, tres visible) */}
            <div className="mx-auto mt-5 max-w-sm">
              <CTA onClick={() => openModal(1)} variant="orange" size="lg">
                Je commande - 9 900 FCFA <Arrow/>
              </CTA>
            </div>
            <p className="mt-3 text-[11px] text-neutral-500">
              🔒 Paiement a la livraison - sans risque
            </p>
          </div>

          {/* Trust badges en bas */}
          <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] font-semibold text-neutral-700 sm:grid-cols-4 sm:gap-3 sm:text-[12px] cav-fade-up" style={{ animationDelay: '.25s' }}>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-emerald-100"><Check/>100% vegetal</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-emerald-100"><Check/>Sans douleur</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-emerald-100"><Check/>Livre en 24h</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-emerald-100"><Check/>Cash livraison</span>
          </div>

          {/* Reviews */}
          <div className="mt-6 flex items-center justify-center gap-2 cav-fade-up" style={{ animationDelay: '.3s' }}>
            <div className="flex -space-x-2">
              {['bg-lime-400','bg-emerald-400','bg-amber-400','bg-indigo-400','bg-orange-400'].map((c, i) => (
                <div key={i} className={`h-7 w-7 rounded-full ${c} ring-2 ring-white`}/>
              ))}
            </div>
            <div className="text-[11px] sm:text-[12px]">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 font-black text-neutral-900">4.9/5</span>
              </div>
              <p className="text-neutral-500">2 034 avis verifies</p>
            </div>
          </div>
        </div>

        <WaveDivider color="#ffffff"/>
      </section>

      {/* ===================================================== */}
      {/* STATS BAR                                              */}
      {/* ===================================================== */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:gap-4 sm:py-7">
          {[
            { n: '2 000+', l: 'Peaux liberees' },
            { n: '5-10j',  l: 'Pour un resultat' },
            { n: '100%',   l: 'Vegetal' },
            { n: '4.9/5',  l: 'Avis clients' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC PROBLEME - avec man-1                             */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 py-12 sm:py-16">
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"/>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="cav-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-600 shadow ring-1 ring-orange-100">
                🩺 Le probleme
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Les verrues ne{' '}
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 bg-clip-text text-transparent">disparaissent pas</span>{' '}
                seules.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Elles grossissent, se multiplient, se transmettent. Et les solutions cheres de pharmacie ? Douleur, brulure, cicatrice.
                <span className="mt-2 block font-black text-orange-600">Il existe mieux.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="orange" size="lg" fullWidth={false}>
                  Je veux en finir <Arrow/>
                </CTA>
              </div>
            </div>

            <div className="order-1 cav-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-orange-300/40 via-amber-300/30 to-red-300/40 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-orange-100">
                  <LazyImg src={MEDIA.problem} alt="Verrue tenace" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* TIMELINE - 3 ETAPES avec new-1/2/3                     */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-emerald-600 to-lime-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
              ✨ Comment ca marche
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-[44px]">
              En{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-transparent">3 etapes</span>{' '}
              simples.
            </h2>
            <p className="mt-2 text-[13px] text-neutral-500 sm:text-[14px]">
              La formule agit en profondeur, jour apres jour.
            </p>
          </div>

          {/* TIMELINE */}
          <div className="vt-rail relative">
            {[
              { n: 1, img: MEDIA.step1, t: 'Application ciblee', d: 'Quelques gouttes directement sur la verrue, matin et soir.', color: 'from-lime-500 to-emerald-500' },
              { n: 2, img: MEDIA.step2, t: 'Penetration active', d: 'Les actifs vegetaux penetrent la couche infectee en moins de 5 minutes.', color: 'from-emerald-500 to-indigo-500' },
              { n: 3, img: MEDIA.step3, t: 'Peau nette',         d: 'La verrue noircit, se retracte puis se decolle. Votre peau redevient lisse.', color: 'from-amber-500 to-lime-500' },
            ].map((s, i) => (
              <div key={s.n} className={`relative grid items-center gap-6 py-8 md:gap-12 md:py-10 md:grid-cols-2 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>

                {/* NODE centre */}
                <div className="absolute left-5 top-10 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-white to-lime-50 ring-4 ring-white shadow-lg md:left-1/2 md:top-1/2 md:-translate-y-1/2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-sm font-black text-white shadow-lg`}>
                    {s.n}
                  </div>
                </div>

                {/* Image */}
                <div className="cav-fade-up pl-14 md:pl-0">
                  <div className="relative">
                    <div className={`pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br ${s.color} opacity-20 blur-2xl`}/>
                    <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-emerald-100">
                      <LazyImg src={s.img} alt={s.t} aspect="1/1"/>
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="cav-fade-up pl-14 md:pl-0" style={{ animationDelay: '.1s' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 sm:text-[11px]">Etape {s.n}</p>
                  <h3 className="mt-1 text-xl font-black leading-tight sm:text-2xl md:text-[28px]">{s.t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 sm:text-[14px]">{s.d}</p>
                  <div className="mt-4">
                    <CTA onClick={() => openModal(1)} variant={i % 2 ? 'cyan' : 'blue'} size="sm" fullWidth={false}>
                      Commander <Arrow/>
                    </CTA>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider color="#ecfeff" flip/>

      {/* ===================================================== */}
      {/* BLOC VIDEO 1 + texte + CTA                             */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-amber-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="cav-fade-up">
              <div className="relative mx-auto max-w-sm">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-300/50 via-lime-300/40 to-emerald-300/50 blur-3xl"/>
                <LazyVideo src={MEDIA.video1} poster={MEDIA.video1Post} aspect="9/16"/>
              </div>
            </div>

            <div className="cav-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 shadow-md ring-1 ring-amber-100 sm:text-[11px]">
                🎬 Vue en action
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Une{' '}
                <span className="bg-gradient-to-r from-amber-600 via-lime-500 to-emerald-600 bg-clip-text text-transparent">goutte</span>{' '}
                suffit.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Application locale, precise, indolore. Pas d'odeur desagreable. Pas de residus.
                <span className="mt-2 block font-black text-emerald-700">Simple comme un soin quotidien.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="cyan" size="lg" fullWidth={false}>
                  Je veux essayer <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC USAGE EN 3 GESTES - avec new-4                    */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-lime-50 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow ring-1 ring-emerald-100">
              👐 En 3 gestes
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Une{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-transparent">routine</span>{' '}
              sans effort.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div className="cav-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-lime-300/40 via-emerald-300/30 to-amber-300/40 blur-3xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-emerald-100">
                  <LazyImg src={MEDIA.usage} alt="Application du produit" aspect="4/3"/>
                </div>
              </div>
            </div>

            <div className="cav-fade-up space-y-3" style={{ animationDelay: '.1s' }}>
              {[
                { n: '01', t: 'Nettoyer', d: 'Lavez et sechez la zone concernee.' },
                { n: '02', t: 'Appliquer', d: 'Deposez 1-2 gouttes directement sur la verrue.' },
                { n: '03', t: 'Attendre', d: 'Laissez agir 2 minutes. Repetez matin et soir.' },
              ].map((x, i) => (
                <div key={i} className="flex gap-3 rounded-2xl bg-white p-4 shadow-md ring-1 ring-emerald-100 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-lime-500 to-amber-500 font-black text-white shadow">
                    {x.n}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black sm:text-[15px]">{x.t}</h4>
                    <p className="text-[12px] text-neutral-600 sm:text-[13px]">{x.d}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <CTA onClick={() => openModal(1)} variant="blue" size="lg">
                  Commencer ma cure <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* AVANT / APRES - man-2 (avant) + new-5 (apres)          */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-white py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-50/30 via-transparent to-lime-50/30"/>
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
              📸 Photos reelles clients
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Avant{' '}
              <span className="text-neutral-400 mx-1">→</span>{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-transparent">Apres</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="cav-fade-up group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-orange-100">
              <LazyImg src={MEDIA.avant} alt="Avant traitement" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Avant</p>
                <p className="text-lg font-black text-white">Verrue visible, persistante.</p>
              </div>
            </div>
            <div className="cav-fade-up group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-emerald-100" style={{ animationDelay: '.15s' }}>
              <LazyImg src={MEDIA.apres} alt="Apres traitement" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">Apres 10 jours</p>
                <p className="text-lg font-black text-white">Peau lisse. Disparition totale.</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="blue" size="lg">
              Je veux ce resultat <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      <WaveDivider color="#f0f9ff"/>

      {/* ===================================================== */}
      {/* BLOC VIDEO 2                                           */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-lime-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="cav-fade-up order-2 md:order-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-md ring-1 ring-emerald-100 sm:text-[11px]">
                🎥 Temoignage video
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-transparent">Vraies</span>{' '}
                histoires. Vrais resultats.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Des centaines de clients, chaque semaine, nous partagent leurs transformations.
                <span className="mt-2 block font-black text-emerald-600">Rejoignez-les.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="sky" size="lg" fullWidth={false}>
                  Commander maintenant <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 cav-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative mx-auto max-w-sm">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-lime-300/50 via-emerald-300/40 to-indigo-300/50 blur-3xl"/>
                <LazyVideo src={MEDIA.video2} aspect="9/16"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC VIDEO 3 - grand format centré                     */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow ring-1 ring-emerald-100 sm:text-[11px]">
            🎬 La preuve en mouvement
          </span>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            Voyez par{' '}
            <span className="bg-gradient-to-r from-amber-600 via-lime-500 to-emerald-600 bg-clip-text text-transparent">vous-meme</span>.
          </h2>

          <div className="mx-auto mt-6 max-w-sm cav-fade-up">
            <LazyVideo src={MEDIA.video3} aspect="9/16"/>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="cyan" size="lg">
              Je passe commande <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      <WaveDivider color="#eff6ff" flip/>

      {/* ===================================================== */}
      {/* BUNDLES - visuels synthetiques (pas d'images repetees) */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-lime-50/50 to-white py-14 sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-lime-300/40 blur-3xl"/>

        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-emerald-600 to-lime-500 px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
              💎 Offres du jour
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Choisissez{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-transparent">votre cure</span>.
            </h2>
            <p className="mt-2 text-[13px] text-neutral-500 sm:text-[14px]">
              Plus vous traitez de verrues, <span className="font-black text-emerald-600">plus vous economisez.</span>
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
            {[
              {
                qty: 1,
                label: '1 boite',
                desc: 'Pour une verrue',
                price: PRICES[1],
                oldPrice: OLD_PRICE_UNIT,
                tag: '',
                saveLabel: 'Pour essayer',
                accent: 'from-neutral-700 to-neutral-500',
                bg: 'from-neutral-100 to-neutral-50',
                ringColor: '',
              },
              {
                qty: 2,
                label: '2 boites',
                desc: 'Cure complete',
                price: PRICES[2],
                oldPrice: OLD_PRICE_UNIT * 2,
                tag: 'POPULAIRE',
                saveLabel: 'Economisez 13 100 F',
                accent: 'from-emerald-600 via-lime-500 to-amber-500',
                bg: 'from-lime-100 to-emerald-50',
                ringColor: 'ring-2 ring-lime-300',
              },
              {
                qty: 3,
                label: '3 boites',
                desc: 'Toute la famille',
                price: PRICES[3],
                oldPrice: OLD_PRICE_UNIT * 3,
                tag: 'MEILLEURE OFFRE',
                saveLabel: 'Economisez 20 100 F',
                accent: 'from-orange-500 via-amber-500 to-red-500',
                bg: 'from-orange-100 to-amber-50',
                ringColor: '',
              },
            ].map((b) => (
              <button
                key={b.qty}
                onClick={() => openModal(b.qty)}
                className={`group relative overflow-hidden rounded-2xl bg-white p-3 text-left shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-4 ${b.ringColor} ${b.qty === 2 ? 'sm:scale-[1.04]' : ''}`}
              >
                {b.tag && (
                  <span className={`absolute right-2 top-2 z-10 inline-flex animate-pulse items-center gap-1 rounded-full bg-gradient-to-r ${b.accent} px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg sm:text-[10px]`}>
                    {b.qty === 2 ? '💧' : b.qty === 3 ? '⭐' : ''} {b.tag}
                  </span>
                )}

                <div className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br ${b.accent} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-25`}/>

                {/* Visuel synthetique de bundle : X boites empilees */}
                <div className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${b.bg}`}>
                  <div className="flex items-end gap-1.5">
                    {Array.from({ length: b.qty }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex h-20 w-10 items-end justify-center rounded-md bg-gradient-to-br ${b.accent} pb-1.5 font-black text-white shadow-lg sm:h-24 sm:w-12`}
                        style={{ transform: `translateY(${i * 2}px) rotate(${(i - (b.qty - 1) / 2) * 3}deg)` }}
                      >
                        <span className="text-[8px] uppercase tracking-wider opacity-80">BIO</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white font-black text-neutral-900 shadow-lg ring-2 ring-white sm:h-12 sm:w-12">
                    <span className="bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-[18px] text-transparent sm:text-[20px]">x{b.qty}</span>
                  </div>
                </div>

                <div className="relative mt-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-neutral-400">{b.label}</p>
                  <p className="text-[10px] font-bold text-neutral-500">{b.desc}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[22px] font-black text-transparent sm:text-[26px]`}>
                      {fmt(b.price)}
                    </span>
                    <span className="text-[11px] text-neutral-400 line-through sm:text-[12px]">{fmt(b.oldPrice)}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-emerald-600 sm:text-[12px]">{b.saveLabel}</p>

                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${b.accent} px-4 py-2 text-[12px] font-black text-white shadow-md transition-transform group-hover:scale-105 sm:text-[13px]`}>
                    Je commande <Arrow/>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-neutral-500">
            Livraison <span className="font-black text-emerald-600">gratuite</span> · Paiement a la livraison
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* MID-CTA + stock bar dynamique                          */}
      {/* ===================================================== */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold sm:text-[12px]">
            <span className="text-neutral-500">💧 Stock dispo ce jour</span>
            <span className="inline-flex items-center gap-1 text-orange-600">
              <span className="vt-heartbeat">🔥</span> {stock} restants
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-lime-100">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-lime-500 to-amber-500 transition-all duration-500"
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <div className="mt-6">
            <CTA onClick={() => openModal(1)} variant="orange" size="lg">
              <span className="vt-heartbeat">•</span> Commander maintenant <Arrow/>
            </CTA>
          </div>
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Livraison <span className="font-bold text-emerald-600">gratuite</span> · Paiement <span className="font-bold">a la livraison</span>
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* WHATSAPP TESTIMONIALS                                  */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#e5ddd5] to-[#d9d2c4] py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30L30 0L60 30L30 60z' fill='none' stroke='%23075e54' stroke-width='.5'/%3E%3C/svg%3E\")" }}/>

        <div className="relative mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-lg">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Messages clients WhatsApp
            </span>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Nos clients nous{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent">remercient</span>.
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[#ece5dd] shadow-2xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 font-black">GS</div>
              <div className="flex-1">
                <p className="text-[13px] font-black">GS Pipeline - Creme Anti-Verrues Botanique</p>
                <p className="text-[10px] text-emerald-300">● en ligne</p>
              </div>
              <svg className="h-4 w-4 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>

            <div className="space-y-3 px-4 py-5">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm cav-fade-up">
                <p className="text-[11px] font-black text-emerald-600">Awa K.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Bonjour, juste pour dire merci 🙏 7 jours d'utilisation, ma verrue sur le doigt a disparu. Je n'y croyais plus.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">08:12</p>
              </div>

              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm cav-fade-up" style={{ animationDelay: '.12s' }}>
                <p className="text-[13px] text-neutral-800">Bonjour Awa 🎉 On est ravis pour vous ! Merci de partager.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-500">08:15 ✓✓</p>
              </div>

              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm cav-fade-up" style={{ animationDelay: '.24s' }}>
                <p className="text-[11px] font-black text-lime-600">Jean-Marc B.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Commande recue le lendemain a Bouake. Application ce soir. Deja moins de demangeaison 😌</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">15:44</p>
              </div>

              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm cav-fade-up" style={{ animationDelay: '.36s' }}>
                <p className="text-[11px] font-black text-amber-600">Mariam D.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Je recommande FORTEMENT. Ma mere avait 3 verrues. Toutes parties en 12 jours. Sa peau est impeccable ❤️</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">19:21</p>
              </div>

              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm cav-fade-up" style={{ animationDelay: '.48s' }}>
                <p className="text-[11px] font-black text-indigo-600">Fatou S.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Apres 2 echecs avec d'autres produits, enfin une creme qui marche 💯 Merci GS Pipeline !</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">22:03</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-md">
            <CTA onClick={() => openModal(1)} variant="sky" size="lg">
              Moi aussi je commande <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC ENGAGEMENT - avec new-7                           */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-lime-50 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="cav-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow ring-1 ring-emerald-100">
                🛡️ Notre engagement
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Nous{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-transparent">garantissons</span>{' '}
                votre satisfaction.
              </h2>
              <ul className="mt-5 space-y-2.5 text-[13px] sm:text-[14px]">
                {[
                  'Formule botanique brevetee - extraits de plantes medicinales',
                  'Teste et approuve par plus de 2 000 clients',
                  'Sans douleur ni brulure cutanee',
                  'Livraison 24h a Abidjan, 48h en region',
                  'Paiement uniquement a la livraison',
                ].map((x, i) => (
                  <li key={i} className="flex items-start gap-2 text-neutral-700">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 text-white shadow">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="blue" size="lg" fullWidth={false}>
                  J'achete sans risque <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 cav-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-300/40 via-lime-300/30 to-amber-300/40 blur-3xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-emerald-100">
                  <LazyImg src={MEDIA.engagement} alt="Engagement qualite" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FAQ                                                    */}
      {/* ===================================================== */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Vos{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-500 bg-clip-text text-transparent">questions</span>.
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Combien de temps pour voir les resultats ?', a: 'Premiers effets des 3-5 jours. Disparition totale en 5 a 10 jours selon la taille.' },
              { q: 'La creme fait-elle mal ?',                   a: 'Non, aucune douleur ni brulure. Formule 100% vegetale douce pour la peau.' },
              { q: 'Je paie avant de recevoir ?',                a: 'Non. Paiement uniquement a la livraison. Vous verifiez avant de payer.' },
              { q: 'Convient-elle aux enfants ?',                a: 'Oui, a partir de 6 ans, avec la supervision d\'un adulte lors de l\'application.' },
              { q: 'Ca marche sur toutes les verrues ?',         a: 'Verrues plantaires, vulgaires, seborrheiques. Sur peau saine, evitez les zones fragiles.' },
              { q: 'Livree ou ?',                                a: 'Partout en Cote d\'Ivoire. 24h Abidjan, 48h regions. Livraison gratuite.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-lime-50/50 shadow-sm ring-1 ring-lime-100 transition-all open:shadow-lg open:bg-white open:ring-lime-200">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-neutral-900 sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="vt-chev h-5 w-5 text-emerald-600 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-neutral-600 sm:text-[14px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BANNIERE FINALE (fond gradient bleu pur - pas d'image) */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-700 via-lime-600 to-amber-600 vt-animated-bg" style={{ backgroundSize: '200% 200%' }}/>
        <div className="pointer-events-none absolute inset-0 bg-black/10"/>
        {/* Particules decoratives */}
        <div className="pointer-events-none absolute left-10 top-10 h-32 w-32 rounded-full bg-lime-300/30 blur-2xl vt-float-slow"/>
        <div className="pointer-events-none absolute right-10 bottom-10 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl vt-float-slow" style={{ animationDelay: '2s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm ring-1 ring-white/20">
            💧 Derniere chance
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            Votre{' '}
            <span className="bg-gradient-to-r from-amber-200 via-lime-100 to-white bg-clip-text text-transparent">peau nette</span>{' '}
            vous attend.
          </h2>
          <p className="mt-4 text-[14px] text-white/85 sm:text-[16px]">
            Creme Anti-Verrues Botanique · 9 900 FCFA seulement · Paiement a la livraison
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="orange" size="lg">
              <span className="vt-heartbeat">•</span> Je commande maintenant
            </CTA>
          </div>
          <p className="mt-3 text-[12px] text-white/75">
            🔒 Paiement a la livraison · Sans risque · Livraison gratuite
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FOOTER                                                 */}
      {/* ===================================================== */}
      <footer className="bg-emerald-950 py-8 text-center text-[11px] text-lime-200/80">
        <p>© 2026 · Cote d'Ivoire · GS Pipeline · Tous droits reserves</p>
        <p className="mt-1">Service client 7j/7 · Livraison Abidjan 24h · Paiement a la livraison</p>
      </footer>

      {/* ===================================================== */}
      {/* STICKY BOTTOM BAR                                      */}
      {/* ===================================================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-lime-200 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,.08)] backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img src={MEDIA.hero} alt="" className="h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-lime-100 sm:h-12 sm:w-12"/>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black text-neutral-900 sm:text-[13px]">Creme Anti-Verrues</p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span className="font-bold text-emerald-600">9 900 FCFA</span>
                <span className="text-neutral-400">·</span>
                <span className="inline-flex items-center gap-0.5 font-mono font-bold text-orange-500">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500"/>
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => openModal(1)}
            className="vt-cta relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 px-5 py-2.5 text-[13px] font-black text-white shadow-[0_10px_25px_-4px_rgba(249,115,22,.55)] transition-transform hover:scale-105 sm:px-6 sm:py-3 sm:text-[14px]"
          >
            <span className="vt-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"/>
            <span className="relative">Commander</span>
            <Arrow/>
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* TOAST                                                  */}
      {/* ===================================================== */}
      {toast && (
        <div className={`fixed bottom-20 left-3 z-40 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-2xl ring-1 ring-emerald-100 sm:bottom-24 sm:left-4 ${toast.visible ? 'vt-toast-in' : 'vt-toast-out'}`}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-500 text-white shadow">
            <Check/>
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 cav-pulse-dot"/>
          </div>
          <div>
            <p className="text-[12px] font-black text-neutral-900">{toast.n} vient de commander</p>
            <p className="text-[10px] text-neutral-500">a {toast.v} · il y a {toast.t}</p>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* EXIT INTENT POPUP                                      */}
      {/* ===================================================== */}
      {exitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-[cav-fade-up_.3s_ease-out]">
            <button
              onClick={() => setExitPopup(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="bg-gradient-to-br from-emerald-600 via-lime-500 to-amber-600 px-6 py-8 text-center text-white vt-animated-bg" style={{ backgroundSize: '200% 200%' }}>
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                🎁 Cadeau de bienvenue
              </span>
              <h3 className="mt-3 text-2xl font-black leading-tight">
                Attendez ! <br/>Votre peau merite mieux.
              </h3>
              <p className="mt-2 text-[13px] text-white/90">
                Livraison 100% gratuite + paiement a la livraison.
              </p>
            </div>

            <div className="px-6 py-5">
              <CTA onClick={() => openModal(1)} variant="orange" size="lg">
                Je commande maintenant <Arrow/>
              </CTA>
              <button
                onClick={() => setExitPopup(false)}
                className="mt-2 w-full text-[11px] font-medium text-neutral-400 hover:text-neutral-600"
              >
                Non merci, je garde mes verrues
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL DE COMMANDE                                      */}
      {/* ===================================================== */}
      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: 'Creme Anti-Verrues Botanique',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          slug: SLUG,
          company,
          navigate,
          images: {
            hero: MEDIA.hero,
            avant: MEDIA.avant,
            apres: MEDIA.apres,
          },
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />
    </div>
  );
}
