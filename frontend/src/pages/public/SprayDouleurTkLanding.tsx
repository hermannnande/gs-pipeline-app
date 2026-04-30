/**
 * Landing ULTRA PREMIUM — Spray Anti-Douleur TK (SPRAY_DOULEUR)
 * ==================================================================
 *
 * Palette : LIME + NOIR + JAUNE urgence (sport/performance/frais)
 *   - creme-anti-verrue : rouge/orange/amber
 *   - patchdouleurtk    : indigo/violet/cyan
 *   - creme-verrue-tk   : bleu/sky + orange
 *   - spraydouleurtk    : LIME/EMERALD + NOIR + JAUNE urgence
 *
 * 8 medias UNIQUES (aucune repetition decorative) :
 *   - hero      -> Hero stacke
 *   - gallery-3 -> Bloc probleme
 *   - gallery-1 -> Bloc action rapide
 *   - gallery-2 -> Bloc confort retrouve
 *   - video-1   -> Bloc video demonstration
 *   - usage     -> Section 3 gestes
 *   - avant     -> Avant
 *   - apres     -> Apres
 *
 * Signature visuelle :
 *   - Fond noir/lime type "sport moderne"
 *   - 3 marquees defilants (top, milieu, bas avis etoiles)
 *   - Temoignages WhatsApp + SMS (2 chats stylises)
 *   - Hero STACKE (titre -> image -> CTA, comme demande)
 *   - 1 image = 1 bloc (pas d'images groupees)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'spraydouleurtk';
const PRODUCT_CODE = 'SPRAY_DOULEUR';
const META_PIXEL_ID = '26809431761984777';
const THANK_YOU_URL = '/spraydouleurtk/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const OLD_PRICE_UNIT = 15000;
const QTY_OPTS = [
  { v: 1, label: '1 spray', sub: '9 900 FCFA' },
  { v: 2, label: '2 sprays', sub: '16 900 FCFA', tag: 'Populaire', save: 'Economisez 2 900 F' },
  { v: 3, label: '3 sprays', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
];

// 8 medias UNIQUES
const MEDIA = {
  hero:       '/spray-douleur/hero.webp',
  problem:    '/spray-douleur/gallery-3.webp',
  action:     '/spray-douleur/gallery-1.webp',
  comfort:    '/spray-douleur/gallery-2.webp',
  video1:     '/spray-douleur/video-1.mp4',
  usage:      '/spray-douleur/usage.webp',
  avant:      '/spray-douleur/avant.webp',
  apres:      '/spray-douleur/apres.webp',
};

declare global { interface Window { fbq: any; _fbq: any; } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); };
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
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
      className="relative w-full overflow-hidden rounded-3xl border border-lime-400/30 bg-neutral-950 shadow-[0_20px_60px_-12px_rgba(132,204,22,.35)]"
      style={{ aspectRatio: aspect }}
    >
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-lime-400"/>
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950/80 to-transparent"/>
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
// UI atoms — palette LIME/EMERALD + JAUNE urgence + NOIR
// =========================================================
const Check = () => (
  <svg className="h-4 w-4 shrink-0 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
  </svg>
);

const Star = ({ className = "" }: { className?: string }) => (
  <svg className={`h-3.5 w-3.5 ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

// CTA premium avec variantes lime / jaune urgence / emerald / neon
function CTA({
  onClick,
  children,
  variant = 'lime',
  size = 'md',
  fullWidth = true,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'lime' | 'yellow' | 'emerald' | 'neon' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const grads: Record<string, string> = {
    lime:    'from-lime-400 via-green-400 to-emerald-400',
    yellow:  'from-yellow-400 via-amber-400 to-orange-500',
    emerald: 'from-emerald-400 via-green-400 to-lime-400',
    neon:    'from-lime-300 via-yellow-300 to-lime-300',
    dark:    'from-neutral-900 via-neutral-800 to-neutral-900',
  };
  const glows: Record<string, string> = {
    lime:    'shadow-[0_12px_40px_-4px_rgba(132,204,22,.7)] hover:shadow-[0_16px_50px_-4px_rgba(132,204,22,.9)]',
    yellow:  'shadow-[0_12px_40px_-4px_rgba(250,204,21,.65)] hover:shadow-[0_16px_50px_-4px_rgba(250,204,21,.85)]',
    emerald: 'shadow-[0_12px_40px_-4px_rgba(52,211,153,.6)] hover:shadow-[0_16px_50px_-4px_rgba(52,211,153,.8)]',
    neon:    'shadow-[0_0_30px_rgba(163,230,53,.6)] hover:shadow-[0_0_50px_rgba(163,230,53,.9)]',
    dark:    'shadow-[0_12px_40px_-4px_rgba(0,0,0,.5)] hover:shadow-[0_16px_50px_-4px_rgba(0,0,0,.7)] ring-2 ring-lime-400',
  };
  const textColor = variant === 'dark' ? 'text-lime-400' : 'text-neutral-900';
  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-[13px]',
    md: 'px-6 py-3.5 text-[14px]',
    lg: 'px-8 py-4 text-[15px] sm:text-base',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group sp-cta relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${grads[variant]} font-black ${textColor} ${glows[variant]} transition-shadow ${sizes[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="sp-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"/>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

// Marquee horizontal (bande defilante)
function Marquee({ items, variant = 'dark', speed = 28 }: {
  items: string[];
  variant?: 'dark' | 'lime' | 'yellow';
  speed?: number;
}) {
  const variantClasses: Record<string, string> = {
    dark:   'bg-neutral-950 text-lime-400 border-y border-lime-400/20',
    lime:   'bg-gradient-to-r from-lime-400 via-green-400 to-lime-400 text-neutral-900 border-y-2 border-neutral-900',
    yellow: 'bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300 text-neutral-900 border-y-2 border-neutral-900',
  };
  return (
    <div className={`overflow-hidden py-2 ${variantClasses[variant]}`}>
      <div className="sp-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] sm:text-[11px]" style={{ animationDuration: `${speed}s` }}>
        {[0, 1].map(k => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-3">
                <span>{t}</span>
                <svg className="inline-block h-3 w-3 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z"/></svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================
// Main component
// =========================================================
export default function SprayDouleurTkLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(33);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const [exitPopup, setExitPopup] = useState(false);
  const exitShown = useRef(false);
  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const TOASTS = useMemo(() => [
    { n: 'Ibrahim S.',  v: 'Abidjan',   t: '2 min'  },
    { n: 'Mariam K.',   v: 'Yopougon',  t: '6 min'  },
    { n: 'Kouame D.',   v: 'Bouake',    t: '9 min'  },
    { n: 'Fatou B.',    v: 'Daloa',     t: '13 min' },
    { n: 'Adama T.',    v: 'San Pedro', t: '17 min' },
    { n: 'Rokia C.',    v: 'Korhogo',   t: '21 min' },
  ], []);

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Spray Anti-Douleur TK',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: PRICES[1],
        currency: 'XOF',
      });
    }
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
    const id = setInterval(() => setStock(s => (s > 11 ? s - 1 : s)), 38000);
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
    const first = setTimeout(show, 5500);
    const id = setInterval(show, 16000);
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
    <div className="min-h-screen bg-[#fafaf5] text-neutral-900" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes sp-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes sp-fade-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes sp-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes sp-float-slow { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-20px) translateX(14px) } }
        @keyframes sp-sheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes sp-pulse-ring { 0% { transform: scale(.95); opacity: 1 } 100% { transform: scale(1.65); opacity: 0 } }
        @keyframes sp-slide-in-left { from { opacity: 0; transform: translateX(-100%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes sp-slide-out-left { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-100%) } }
        @keyframes sp-gradient-shift { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        @keyframes sp-heartbeat { 0%,100% { transform: scale(1) } 25% { transform: scale(1.12) } 50% { transform: scale(.94) } 75% { transform: scale(1.06) } }
        @keyframes sp-shimmer-text { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        @keyframes sp-neon-pulse { 0%,100% { box-shadow: 0 0 20px rgba(163,230,53,.6), 0 0 40px rgba(163,230,53,.3) } 50% { box-shadow: 0 0 30px rgba(163,230,53,.9), 0 0 60px rgba(163,230,53,.5) } }
        @keyframes sp-bob { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(-8px) rotate(1deg) } }
        @keyframes sp-spray { 0% { transform: translateX(-10px) scale(0); opacity: 0 } 30% { opacity: 1 } 100% { transform: translateX(50px) scale(1.5); opacity: 0 } }

        .sp-fade-up { animation: sp-fade-up .6s cubic-bezier(.22,.8,.4,1) both }
        .sp-marquee { animation: sp-marquee 28s linear infinite }
        .sp-float { animation: sp-float 3s ease-in-out infinite }
        .sp-float-slow { animation: sp-float-slow 8s ease-in-out infinite }
        .sp-bob { animation: sp-bob 4s ease-in-out infinite }
        .sp-cta { animation: sp-float 2.6s ease-in-out infinite }
        .sp-cta:hover { animation: none; transform: translateY(-2px) }
        .sp-cta-sheen { animation: sp-sheen 3s ease-in-out infinite }
        .sp-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: sp-pulse-ring 1.6s cubic-bezier(0,0,.2,1) infinite }
        .sp-toast-in { animation: sp-slide-in-left .4s cubic-bezier(.22,1,.36,1) both }
        .sp-toast-out { animation: sp-slide-out-left .35s cubic-bezier(.55,.08,.68,.53) both }
        .sp-animated-bg { background-size: 220% 220%; animation: sp-gradient-shift 9s ease infinite }
        .sp-heartbeat { animation: sp-heartbeat 1.4s ease-in-out infinite }
        .sp-neon-pulse { animation: sp-neon-pulse 2s ease-in-out infinite }
        .sp-shimmer-text {
          background: linear-gradient(90deg, #a3e635 0%, #fde047 25%, #84cc16 50%, #fde047 75%, #a3e635 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: sp-shimmer-text 3.5s linear infinite;
        }
        .sp-grid-bg {
          background-image: linear-gradient(rgba(163,230,53,.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(163,230,53,.08) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        details[open] summary .sp-chev { transform: rotate(180deg) }
      `}</style>

      {/* ===================================================== */}
      {/* STICKY TOP BAR - noir + lime pulsant                   */}
      {/* ===================================================== */}
      <div className="sticky top-0 z-50 border-b-2 border-lime-400 bg-neutral-950">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-3 py-2 sm:gap-3">
          <span className="relative flex h-2 w-2 text-yellow-400 sp-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400"/>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white sm:text-[11px]">
            <span className="text-lime-400">Offre flash</span> - fin dans
          </span>
          <div className="flex items-center gap-1">
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] font-bold text-lime-400/70">:</span>}
                <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md bg-lime-400/15 px-1.5 font-mono text-[12px] font-black tabular-nums text-lime-300 ring-1 ring-lime-400/40 sm:h-7 sm:min-w-[32px] sm:text-[13px]">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee 1 - promesses en lime sur noir */}
      <Marquee
        variant="dark"
        items={['Soulagement en 60 secondes', 'Formule menthol + camphre', 'Sans ordonnance', 'Livraison 24h Abidjan', 'Paiement a la livraison', '5 000+ clients soulages']}
      />

      {/* ===================================================== */}
      {/* HERO STACKE : titre -> image -> CTA en bas             */}
      {/* Fond noir avec grille + halo lime (look sport moderne) */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-neutral-950 sp-grid-bg">
        <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-lime-400/25 blur-3xl sp-float-slow"/>
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-yellow-400/20 blur-3xl sp-float-slow" style={{ animationDelay: '2s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-6 text-center sm:pt-10 md:pt-14 md:pb-14">

          {/* Badge */}
          <div className="sp-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300 backdrop-blur-sm sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400 sp-heartbeat"/>
              Spray dermatologique pro
            </span>
          </div>

          {/* TITRE */}
          <h1 className="mt-4 text-[36px] font-black leading-[1.02] tracking-tight sm:text-5xl md:text-[58px] sp-fade-up" style={{ animationDelay: '.05s' }}>
            <span className="text-white">STOP</span>
            <span className="mt-1 block sp-shimmer-text">
              DOULEUR
            </span>
            <span className="block text-white">
              en <span className="bg-gradient-to-r from-lime-300 via-yellow-300 to-lime-300 bg-clip-text text-transparent">60 secondes</span>.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-neutral-300 sm:text-[16px] sp-fade-up" style={{ animationDelay: '.1s' }}>
            Le spray qui agit <span className="font-black text-lime-400">instantanement</span> sur
            les muscles, articulations et douleurs dorsales.{' '}
            <span className="font-black text-yellow-300">5 000+</span> clients soulages.
          </p>

          {/* IMAGE CENTRALE (stackee) */}
          <div className="relative mt-6 sp-fade-up" style={{ animationDelay: '.15s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-lime-400/40 via-green-400/30 to-yellow-400/40 blur-3xl"/>
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_-12px_rgba(163,230,53,.55)] ring-2 ring-lime-400/40 sp-bob">
              <LazyImg src={MEDIA.hero} alt="Spray Anti-Douleur TK" aspect="1/1"/>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950/50 to-transparent"/>
            </div>

            {/* Badges flottants */}
            <div className="absolute -left-2 top-6 rotate-[-8deg] rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 px-3 py-2 text-center text-neutral-900 shadow-2xl sp-heartbeat sm:-left-4">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Effet</p>
              <p className="text-[18px] font-black leading-none">60s</p>
            </div>
            <div className="absolute -right-2 bottom-6 rotate-[6deg] rounded-xl bg-lime-400 px-3 py-2 shadow-2xl ring-1 ring-neutral-900 sm:-right-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-900">Note</p>
              <p className="flex items-center gap-0.5 text-neutral-900">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 text-[11px] font-black">4.9</span>
              </p>
            </div>
          </div>

          {/* Prix + CTA juste sous l'image */}
          <div className="mt-8 sp-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="sp-shimmer-text text-4xl font-black sm:text-5xl">9 900</span>
              <span className="text-lg font-bold text-white sm:text-xl">FCFA</span>
              <span className="text-sm text-neutral-500 line-through sm:text-base">15 000 FCFA</span>
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-neutral-900">-34%</span>
            </div>
            <p className="mt-1 text-[12px] font-semibold text-lime-400">Livraison gratuite a Abidjan</p>

            {/* CTA JAUNE fluo - contraste maximal sur fond noir */}
            <div className="mx-auto mt-5 max-w-sm">
              <CTA onClick={() => openModal(1)} variant="yellow" size="lg">
                Je commande - 9 900 FCFA <Arrow/>
              </CTA>
            </div>
            <p className="mt-3 text-[11px] text-neutral-400">
              🔒 Paiement a la livraison - sans risque
            </p>
          </div>

          {/* Trust badges en bas */}
          <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] font-semibold text-neutral-200 sm:grid-cols-4 sm:gap-3 sm:text-[12px] sp-fade-up" style={{ animationDelay: '.25s' }}>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-lime-400/20 bg-white/5 px-3 py-1.5 backdrop-blur-sm"><Check/>Menthol pur</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-lime-400/20 bg-white/5 px-3 py-1.5 backdrop-blur-sm"><Check/>Effet 60s</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-lime-400/20 bg-white/5 px-3 py-1.5 backdrop-blur-sm"><Check/>24h Abidjan</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-lime-400/20 bg-white/5 px-3 py-1.5 backdrop-blur-sm"><Check/>Cash livraison</span>
          </div>

          {/* Reviews rating bar */}
          <div className="mt-6 flex items-center justify-center gap-2 sp-fade-up" style={{ animationDelay: '.3s' }}>
            <div className="flex -space-x-2">
              {['bg-lime-400','bg-yellow-400','bg-emerald-400','bg-green-400','bg-orange-400'].map((c, i) => (
                <div key={i} className={`h-7 w-7 rounded-full ${c} ring-2 ring-neutral-950`}/>
              ))}
            </div>
            <div className="text-[11px] text-neutral-300 sm:text-[12px]">
              <div className="flex items-center gap-0.5 text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 font-black text-white">4.9/5</span>
              </div>
              <p className="text-neutral-400">5 041 avis verifies</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* STATS BAR (fond blanc, chiffres lime)                  */}
      {/* ===================================================== */}
      <section className="bg-white border-b border-neutral-100">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:gap-4 sm:py-7">
          {[
            { n: '60s',    l: 'Effet immediat' },
            { n: '5 000+', l: 'Clients soulages' },
            { n: '100%',   l: 'Actifs naturels' },
            { n: '4.9/5',  l: 'Avis clients' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC 1 : PROBLEME (gallery-3)                          */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-12 sm:py-16">
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"/>
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sp-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-neutral-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300 shadow">
                Le probleme
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                La douleur vous{' '}
                <span className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">paralyse</span>.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Dos, genoux, epaules, muscles tendus... chaque mouvement devient une epreuve.
                Les anti-douleurs en pharmacie ne font pas effet assez vite.
                <span className="mt-2 block font-black text-orange-600">Il vous faut du soulagement MAINTENANT.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="yellow" size="lg" fullWidth={false}>
                  Je veux etre soulage <Arrow/>
                </CTA>
              </div>
            </div>

            <div className="order-1 sp-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-yellow-300/40 via-amber-300/30 to-orange-300/40 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-orange-100">
                  <LazyImg src={MEDIA.problem} alt="Douleur musculaire" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee milieu - temoignages en LIME sur noir avec bordure */}
      <Marquee
        variant="lime"
        items={['"En 1 minute plus rien" - Kouame D.', '"Je recommande" - Fatou S.', '"Miracle" - Ibrahim T.', '"Ca marche vraiment" - Mariam B.', '"Achat validé" - Adama K.']}
      />

      {/* ===================================================== */}
      {/* BLOC 2 : ACTION RAPIDE (gallery-1)                     */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-lime-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sp-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-lime-300/50 via-green-300/40 to-emerald-300/50 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-lime-200">
                  <LazyImg src={MEDIA.action} alt="Spray en action" aspect="1/1"/>
                </div>
              </div>
            </div>
            <div className="sp-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-block rounded-full bg-neutral-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300 shadow">
                Action ultra rapide
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 bg-clip-text text-transparent">1 pschit</span>.{' '}
                Effet immediat.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Le menthol et le camphre penetrent la peau en 3 secondes.
                Une sensation de froid. Puis la chaleur.
                <span className="mt-2 block font-black text-lime-600">La douleur s'efface.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="lime" size="lg" fullWidth={false}>
                  J'achete maintenant <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC 3 : CONFORT RETROUVE (gallery-2)                  */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sp-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-lime-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-900 shadow">
                Liberte retrouvee
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Bougez{' '}
                <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 bg-clip-text text-transparent">sans limite</span>.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Reprenez le sport, jouez avec vos enfants, dormez sur le dos.
                Votre corps redevient souple.
                <span className="mt-2 block font-black text-emerald-600">Vous retrouvez votre vie d'avant.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="emerald" size="lg" fullWidth={false}>
                  Retrouver ma liberte <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sp-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-emerald-300/40 via-green-300/30 to-lime-300/40 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-lime-200">
                  <LazyImg src={MEDIA.comfort} alt="Confort retrouve" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC VIDEO (video-1) + CTA                             */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-neutral-950 py-14 sm:py-20 sp-grid-bg">
        <div className="pointer-events-none absolute top-10 left-1/4 h-60 w-60 rounded-full bg-lime-400/20 blur-3xl sp-float-slow"/>
        <div className="pointer-events-none absolute bottom-10 right-1/4 h-60 w-60 rounded-full bg-yellow-400/20 blur-3xl sp-float-slow" style={{ animationDelay: '3s' }}/>

        <div className="relative mx-auto max-w-4xl px-4 text-center text-white">
          <span className="inline-block rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300 backdrop-blur-sm sm:text-[11px]">
            🎬 Voyez la difference
          </span>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            Une <span className="sp-shimmer-text">demonstration</span>{' '}
            vaut mille mots.
          </h2>
          <p className="mt-2 text-[13px] text-neutral-400 sm:text-[14px]">
            Regardez comment le spray agit en temps reel.
          </p>

          <div className="mx-auto mt-6 max-w-sm sp-fade-up">
            <LazyVideo src={MEDIA.video1} aspect="9/16"/>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="lime" size="lg">
              Je veux ce resultat <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC USAGE 3 GESTES (usage.webp)                       */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-lime-50 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-neutral-900 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300 shadow">
              3 gestes simples
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Aussi simple qu'{' '}
              <span className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 bg-clip-text text-transparent">un deodorant</span>.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div className="sp-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-lime-300/40 via-green-300/30 to-yellow-300/40 blur-3xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-lime-200">
                  <LazyImg src={MEDIA.usage} alt="Application du spray" aspect="4/3"/>
                </div>
              </div>
            </div>

            <div className="sp-fade-up space-y-3" style={{ animationDelay: '.1s' }}>
              {[
                { n: '01', t: 'Secouez', d: 'Secouez le spray 2-3 fois avant usage.' },
                { n: '02', t: 'Pulverisez', d: 'A 15 cm de la zone douloureuse, 1-2 pressions.' },
                { n: '03', t: 'Massez', d: 'Massez doucement. L\'effet arrive en 60 secondes.' },
              ].map((x, i) => (
                <div key={i} className="flex gap-3 rounded-2xl bg-white p-4 shadow-md ring-1 ring-lime-100 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:ring-lime-300">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900 font-black text-lime-400 shadow ring-2 ring-lime-400/40">
                    {x.n}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black sm:text-[15px]">{x.t}</h4>
                    <p className="text-[12px] text-neutral-600 sm:text-[13px]">{x.d}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <CTA onClick={() => openModal(1)} variant="lime" size="lg">
                  Commander mon spray <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* AVANT/APRES (avant.webp + apres.webp)                  */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-white py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-50/30 via-transparent to-lime-50/40"/>
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-lime-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
              Photos reelles clients
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Avant{' '}
              <span className="text-neutral-400 mx-1">→</span>{' '}
              <span className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 bg-clip-text text-transparent">Apres 1 min</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="sp-fade-up group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-orange-100">
              <LazyImg src={MEDIA.avant} alt="Avant pulverisation" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Avant</p>
                <p className="text-lg font-black text-white">Douleur intense. Raideur.</p>
              </div>
            </div>
            <div className="sp-fade-up group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-lime-200" style={{ animationDelay: '.15s' }}>
              <LazyImg src={MEDIA.apres} alt="Apres pulverisation" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">Apres 60 sec</p>
                <p className="text-lg font-black text-white">Soulagement total. Mobile.</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="lime" size="lg">
              Je veux ce resultat <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* Marquee AVIS ETOILES (jaune) */}
      <Marquee
        variant="yellow"
        items={['★★★★★ 4.9/5 sur 5 041 avis', '★★★★★ "Impressionnant" - Ibrahim', '★★★★★ "Rapide efficace" - Mariam', '★★★★★ "J\'en ai commande 3" - Kouame', '★★★★★ "Meilleur achat 2026" - Fatou']}
        speed={24}
      />

      {/* ===================================================== */}
      {/* BUNDLES - visuels synthetiques SPRAY (pas d'images)    */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-neutral-950 py-14 sm:py-20 sp-grid-bg">
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-lime-400/30 blur-3xl"/>

        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-lime-400 px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-900 shadow-lg">
              💎 Pack premium
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
              Choisissez votre{' '}
              <span className="sp-shimmer-text">pack</span>.
            </h2>
            <p className="mt-2 text-[13px] text-neutral-400 sm:text-[14px]">
              Plus vous achetez, <span className="font-black text-lime-400">plus vous economisez.</span>
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
            {[
              {
                qty: 1,
                label: '1 spray',
                desc: 'Pour tester',
                price: PRICES[1],
                oldPrice: OLD_PRICE_UNIT,
                tag: '',
                saveLabel: 'Pour essayer',
                accent: 'from-neutral-400 to-neutral-600',
                bg: 'from-neutral-900 to-neutral-800',
                ringColor: 'ring-1 ring-neutral-700',
              },
              {
                qty: 2,
                label: '2 sprays',
                desc: 'Maison + bureau',
                price: PRICES[2],
                oldPrice: OLD_PRICE_UNIT * 2,
                tag: 'POPULAIRE',
                saveLabel: 'Economisez 13 100 F',
                accent: 'from-lime-400 via-green-400 to-emerald-400',
                bg: 'from-lime-950 to-green-950',
                ringColor: 'ring-2 ring-lime-400',
              },
              {
                qty: 3,
                label: '3 sprays',
                desc: 'Toute la famille',
                price: PRICES[3],
                oldPrice: OLD_PRICE_UNIT * 3,
                tag: 'MEILLEURE OFFRE',
                saveLabel: 'Economisez 20 100 F',
                accent: 'from-yellow-400 via-amber-400 to-orange-400',
                bg: 'from-yellow-950 to-amber-950',
                ringColor: 'ring-1 ring-yellow-400/50',
              },
            ].map((b) => (
              <button
                key={b.qty}
                onClick={() => openModal(b.qty)}
                className={`group relative overflow-hidden rounded-2xl bg-neutral-900 p-3 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-4 ${b.ringColor} ${b.qty === 2 ? 'sm:scale-[1.04]' : ''}`}
              >
                {b.tag && (
                  <span className={`absolute right-2 top-2 z-10 inline-flex animate-pulse items-center gap-1 rounded-full bg-gradient-to-r ${b.accent} px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-neutral-900 shadow-lg sm:text-[10px]`}>
                    {b.qty === 2 ? '💚' : '⭐'} {b.tag}
                  </span>
                )}

                <div className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br ${b.accent} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30`}/>

                {/* Visuel synthetique : sprays empiles */}
                <div className={`relative flex aspect-square items-end justify-center overflow-hidden rounded-xl bg-gradient-to-br ${b.bg}`}>
                  {/* Nuage pschit decoratif */}
                  <div className="pointer-events-none absolute left-4 top-6 h-4 w-4 rounded-full bg-lime-400/30 blur-sm sp-float"/>
                  <div className="pointer-events-none absolute left-8 top-10 h-3 w-3 rounded-full bg-lime-400/40 blur-sm sp-float" style={{ animationDelay: '.5s' }}/>

                  <div className="flex items-end gap-1.5 pb-4">
                    {Array.from({ length: b.qty }).map((_, i) => (
                      <div
                        key={i}
                        className="relative flex flex-col items-center"
                        style={{ transform: `translateY(${Math.abs(i - (b.qty - 1) / 2) * 2}px)` }}
                      >
                        {/* Tete de spray */}
                        <div className={`h-3 w-6 rounded-t bg-gradient-to-b ${b.accent} sm:h-4 sm:w-8`}/>
                        {/* Col */}
                        <div className="h-1 w-4 bg-neutral-700 sm:w-5"/>
                        {/* Bouteille */}
                        <div className={`h-20 w-9 rounded-md bg-gradient-to-b ${b.accent} shadow-xl sm:h-24 sm:w-11`}>
                          <div className="mx-auto mt-2 h-1 w-7 rounded-full bg-white/30 sm:mt-3"/>
                          <p className="mt-8 text-center text-[7px] font-black uppercase tracking-widest text-neutral-900/70 sm:mt-10 sm:text-[8px]">TK</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white font-black shadow-lg ring-2 ring-white/90 sm:h-12 sm:w-12">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[18px] text-transparent sm:text-[20px]`}>x{b.qty}</span>
                  </div>
                </div>

                <div className="relative mt-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-neutral-400">{b.label}</p>
                  <p className="text-[10px] font-bold text-neutral-500">{b.desc}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[22px] font-black text-transparent sm:text-[26px]`}>
                      {fmt(b.price)}
                    </span>
                    <span className="text-[11px] text-neutral-500 line-through sm:text-[12px]">{fmt(b.oldPrice)}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-lime-400 sm:text-[12px]">{b.saveLabel}</p>

                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${b.accent} px-4 py-2 text-[12px] font-black text-neutral-900 shadow-md transition-transform group-hover:scale-105 sm:text-[13px]`}>
                    Je commande <Arrow/>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-neutral-400">
            Livraison <span className="font-black text-lime-400">gratuite</span> · Paiement a la livraison
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* MID-CTA + stock bar dynamique                          */}
      {/* ===================================================== */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold sm:text-[12px]">
            <span className="text-neutral-500">💚 Stock dispo ce jour</span>
            <span className="inline-flex items-center gap-1 text-orange-600">
              <span className="sp-heartbeat">🔥</span> {stock} restants
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-lime-100">
            <div
              className="h-full bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <div className="mt-6">
            <CTA onClick={() => openModal(1)} variant="yellow" size="lg">
              <span className="sp-heartbeat">•</span> Commander maintenant <Arrow/>
            </CTA>
          </div>
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Livraison <span className="font-bold text-lime-600">gratuite</span> · Paiement <span className="font-bold">a la livraison</span>
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* WHATSAPP + SMS TESTIMONIALS (2 chats stylises)         */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#e5ddd5] to-[#d9d2c4] py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30L30 0L60 30L30 60z' fill='none' stroke='%23475569' stroke-width='.5'/%3E%3C/svg%3E\")" }}/>

        <div className="relative mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-neutral-900 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-lime-300 shadow-lg">
              💬 Conversations reelles
            </span>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Ils nous{' '}
              <span className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 bg-clip-text text-transparent">remercient</span>{' '}
              chaque jour.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* ========== CHAT WHATSAPP ========== */}
            <div className="overflow-hidden rounded-2xl bg-[#ece5dd] shadow-2xl">
              <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-lime-400 to-green-400 font-black text-neutral-900">GS</div>
                <div className="flex-1">
                  <p className="flex items-center gap-2 text-[13px] font-black">
                    GS - Spray TK
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
                  </p>
                  <p className="text-[10px] text-emerald-300">● en ligne</p>
                </div>
              </div>

              <div className="space-y-2.5 px-3 py-4">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sp-fade-up">
                  <p className="text-[11px] font-black text-green-600">Kouame D.</p>
                  <p className="mt-0.5 text-[13px] text-neutral-800">Salut ! J'ai recu le spray hier. Effet immediat sur mon dos 🔥 Merci !</p>
                  <p className="mt-1 text-right text-[9px] text-neutral-400">07:45</p>
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm sp-fade-up" style={{ animationDelay: '.12s' }}>
                  <p className="text-[13px] text-neutral-800">Genial Kouame 🎉 Merci pour le retour.</p>
                  <p className="mt-1 text-right text-[9px] text-neutral-500">07:48 ✓✓</p>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sp-fade-up" style={{ animationDelay: '.24s' }}>
                  <p className="text-[11px] font-black text-emerald-600">Mariam B.</p>
                  <p className="mt-0.5 text-[13px] text-neutral-800">Je commande le pack 3 pour ma famille 💚 Tout le monde en profitera.</p>
                  <p className="mt-1 text-right text-[9px] text-neutral-400">14:22</p>
                </div>
              </div>
            </div>

            {/* ========== CHAT SMS ========== */}
            <div className="overflow-hidden rounded-2xl bg-neutral-100 shadow-2xl">
              <div className="flex items-center gap-3 bg-neutral-900 px-4 py-3 text-white">
                <svg className="h-5 w-5 text-lime-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 4l-6 3.75L6 8V6l6 3.75L18 6v2z"/></svg>
                <div className="flex-1">
                  <p className="text-[13px] font-black">Messages</p>
                  <p className="text-[10px] text-lime-300">+225 07 XX XX XX XX</p>
                </div>
                <span className="rounded-full bg-lime-400 px-2 py-0.5 text-[9px] font-black uppercase text-neutral-900">SMS</span>
              </div>

              <div className="space-y-2.5 px-3 py-4">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sp-fade-up">
                  <p className="text-[11px] font-black text-neutral-900">Ibrahim T.</p>
                  <p className="mt-0.5 text-[13px] text-neutral-800">Bonjour jai utilise le spray hier soir pour mon genou. Ce matin ca va bien mieux merci</p>
                  <p className="mt-1 text-right text-[9px] text-neutral-400">06:12 · Remis</p>
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-lime-400 to-green-400 px-3 py-2 shadow-sm sp-fade-up" style={{ animationDelay: '.12s' }}>
                  <p className="text-[13px] font-medium text-neutral-900">Ravi de l'apprendre Ibrahim ! Pensez a appliquer matin et soir pendant 3 jours pour un effet durable.</p>
                  <p className="mt-1 text-right text-[9px] text-neutral-900/70">06:15 · Remis</p>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sp-fade-up" style={{ animationDelay: '.24s' }}>
                  <p className="text-[11px] font-black text-neutral-900">Fatou S.</p>
                  <p className="mt-0.5 text-[13px] text-neutral-800">Jen veux 2 autres svp. C'est trop efficace 👍</p>
                  <p className="mt-1 text-right text-[9px] text-neutral-400">11:03 · Remis</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-md">
            <CTA onClick={() => openModal(1)} variant="lime" size="lg">
              Moi aussi je commande <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* AVIS ETOILES GRID (6 avis notes)                       */}
      {/* ===================================================== */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-yellow-400 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-900 shadow">
              ⭐ Avis verifies
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 bg-clip-text text-transparent">5 041</span>{' '}
              avis · 4.9/5
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { n: 'Ibrahim S.', v: 'Abidjan',   s: 5, t: 'Douleur au genou depuis 2 ans. En 1 pchit plus rien. Bluffant.' },
              { n: 'Mariam K.',  v: 'Yopougon',  s: 5, t: 'Excellente odeur de menthol. Effet rapide. Je recommande vivement.' },
              { n: 'Kouame D.',  v: 'Bouake',    s: 5, t: 'Apres le sport j\'utilise le spray. Pas de courbatures le lendemain.' },
              { n: 'Fatou B.',   v: 'Daloa',     s: 5, t: 'Mes parents sont ages et l\'adorent. Je vais en racheter 3.' },
              { n: 'Adama T.',   v: 'San Pedro', s: 4, t: 'Tres bon produit. Livre en 24h a San Pedro. Service au top.' },
              { n: 'Rokia C.',   v: 'Korhogo',   s: 5, t: 'J\'avais tout essaye. Rien ne marchait. Sauf ce spray. Merci !' },
            ].map((r, i) => (
              <div key={i} className="rounded-2xl bg-gradient-to-br from-lime-50 to-white p-4 shadow-sm ring-1 ring-lime-100 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:ring-lime-300">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-lime-400 to-green-500 text-sm font-black text-neutral-900">
                    {r.n.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[13px] font-black">{r.n}</p>
                    <p className="text-[10px] text-neutral-500">{r.v}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5 text-yellow-400">
                    {Array.from({ length: r.s }).map((_, i) => <Star key={i}/>)}
                    {Array.from({ length: 5 - r.s }).map((_, i) => <Star key={i} className="text-neutral-300"/>)}
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-neutral-700">"{r.t}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FAQ                                                    */}
      {/* ===================================================== */}
      <section className="bg-lime-50 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Vos{' '}
              <span className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 bg-clip-text text-transparent">questions</span>.
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Sur quelles douleurs ca marche ?',        a: 'Dos, cou, epaules, genoux, muscles, articulations, courbatures post-sport. Toutes les douleurs musculaires et articulaires.' },
              { q: 'En combien de temps on sent l\'effet ?',  a: 'Effet ressenti en 60 secondes. Efficace pendant 4 a 6 heures selon l\'intensite.' },
              { q: 'Y a-t-il des effets secondaires ?',       a: 'Non. Formule naturelle : menthol + camphre + huiles essentielles. Usage externe uniquement.' },
              { q: 'Je paie quand ?',                         a: 'A la livraison. Vous verifiez le produit avant de payer. Zero risque.' },
              { q: 'Livre ou ?',                              a: 'Partout en Cote d\'Ivoire. 24h Abidjan, 48h regions. Livraison gratuite.' },
              { q: 'Puis-je l\'utiliser quotidiennement ?',   a: 'Oui. 2 a 3 applications par jour max sur la zone douloureuse.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-lime-100 transition-all open:shadow-lg open:ring-lime-300">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-neutral-900 sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="sp-chev h-5 w-5 text-lime-500 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
      {/* BANNIERE FINALE (fond noir + grille lime)              */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-neutral-950 py-16 sm:py-24 sp-grid-bg">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-lime-500/20 via-transparent to-yellow-400/20 sp-animated-bg" style={{ backgroundSize: '200% 200%' }}/>
        <div className="pointer-events-none absolute left-10 top-10 h-32 w-32 rounded-full bg-lime-400/30 blur-2xl sp-float-slow"/>
        <div className="pointer-events-none absolute right-10 bottom-10 h-40 w-40 rounded-full bg-yellow-400/30 blur-3xl sp-float-slow" style={{ animationDelay: '2s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-lime-300 backdrop-blur-sm">
            Derniere chance
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            Votre{' '}
            <span className="sp-shimmer-text">liberte</span>{' '}
            vous attend.
          </h2>
          <p className="mt-4 text-[14px] text-neutral-300 sm:text-[16px]">
            Spray Anti-Douleur TK · 9 900 FCFA seulement · Paiement a la livraison
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="yellow" size="lg">
              <span className="sp-heartbeat">•</span> Je commande maintenant
            </CTA>
          </div>
          <p className="mt-3 text-[12px] text-neutral-400">
            🔒 Paiement a la livraison · Sans risque · Livraison gratuite
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FOOTER                                                 */}
      {/* ===================================================== */}
      <footer className="bg-neutral-950 border-t border-lime-400/20 py-8 text-center text-[11px] text-lime-200/70">
        <p>© 2026 · Cote d'Ivoire · GS Pipeline · Tous droits reserves</p>
        <p className="mt-1">Service client 7j/7 · Livraison Abidjan 24h · Paiement a la livraison</p>
      </footer>

      {/* ===================================================== */}
      {/* STICKY BOTTOM BAR                                      */}
      {/* ===================================================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-lime-400 bg-neutral-950/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,.3)] backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img src={MEDIA.hero} alt="" className="h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-lime-400 sm:h-12 sm:w-12"/>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black text-white sm:text-[13px]">Spray Anti-Douleur TK</p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span className="font-bold text-lime-400">9 900 FCFA</span>
                <span className="text-neutral-500">·</span>
                <span className="inline-flex items-center gap-0.5 font-mono font-bold text-yellow-400">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400"/>
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => openModal(1)}
            className="sp-cta relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-5 py-2.5 text-[13px] font-black text-neutral-900 shadow-[0_10px_25px_-4px_rgba(250,204,21,.6)] transition-transform hover:scale-105 sm:px-6 sm:py-3 sm:text-[14px]"
          >
            <span className="sp-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"/>
            <span className="relative">Commander</span>
            <Arrow/>
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* TOAST                                                  */}
      {/* ===================================================== */}
      {toast && (
        <div className={`fixed bottom-20 left-3 z-40 flex items-center gap-2.5 rounded-2xl border border-lime-400/30 bg-neutral-900 px-3.5 py-2.5 shadow-2xl sm:bottom-24 sm:left-4 ${toast.visible ? 'sp-toast-in' : 'sp-toast-out'}`}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-lime-400 to-green-500 text-neutral-900 shadow">
            <Check/>
            <span className="absolute inset-0 rounded-full bg-lime-400/40 sp-pulse-dot"/>
          </div>
          <div>
            <p className="text-[12px] font-black text-white">{toast.n} vient de commander</p>
            <p className="text-[10px] text-neutral-400">a {toast.v} · il y a {toast.t}</p>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* EXIT INTENT POPUP                                      */}
      {/* ===================================================== */}
      {exitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-[sp-fade-up_.3s_ease-out]">
            <button
              onClick={() => setExitPopup(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="bg-neutral-950 sp-grid-bg px-6 py-8 text-center text-white relative overflow-hidden">
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-lime-400/30 blur-2xl"/>
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-yellow-400/25 blur-2xl"/>
              <span className="inline-block rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lime-300 backdrop-blur-sm">
                🎁 Cadeau de bienvenue
              </span>
              <h3 className="mt-3 text-2xl font-black leading-tight">
                Attendez ! <br/>Soulagez-vous aujourd'hui.
              </h3>
              <p className="mt-2 text-[13px] text-neutral-300">
                Livraison 100% gratuite + paiement a la livraison.
              </p>
            </div>

            <div className="px-6 py-5">
              <CTA onClick={() => openModal(1)} variant="yellow" size="lg">
                Je commande maintenant <Arrow/>
              </CTA>
              <button
                onClick={() => setExitPopup(false)}
                className="mt-2 w-full text-[11px] font-medium text-neutral-400 hover:text-neutral-600"
              >
                Non merci, je garde ma douleur
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
          title: 'Spray Anti-Douleur TK',
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
