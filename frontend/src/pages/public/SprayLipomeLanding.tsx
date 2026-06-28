/**
 * Landing ULTRA PREMIUM — Spray Anti-Lipome (SRAY_LIPOME)
 * ==================================================================
 *
 * Palette : POURPRE DEEP + MAGENTA/FUCHSIA + OR ROSE (cosmetique luxe)
 *   - creme-anti-verrue : rouge/orange/amber
 *   - patchdouleurtk    : indigo/violet/cyan
 *   - creme-verrue-tk   : bleu/sky + orange
 *   - spraydouleurtk    : lime/noir + jaune
 *   - spraylipome       : POURPRE + MAGENTA + OR ROSE (nouveau, luxe medical)
 *
 * 13 medias UNIQUES (zero repetition) :
 *   - product-1 : Hero stacke (visuel promo principal)
 *   - hand-1    : Bloc probleme (lipome visible)
 *   - hand-2    : Bloc action (usage produit)
 *   - video-1   : Demo #1 (application)
 *   - product-2 : Bloc formule
 *   - video-2   : Demo #2 (resultat)
 *   - product-3 : Bloc penetration
 *   - video-3   : Demo #3 (temoignage)
 *   - hand-3    : Avant (lipome)
 *   - product-4 : Apres (peau nette)
 *   - product-5 : Bloc confort
 *   - product-6 : Bloc engagement (garantie)
 *   - product-7 : Banniere finale (fond opacifie)
 *
 * Textes inspires de 2.obrille.com/lipome/ + avis clients reels.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'spraylipome';
const PRODUCT_CODE = 'SRAY_LIPOME';
const META_PIXEL_ID = '902265788982876';
const META_PIXEL_ID_SECONDARY = '952340034030644';
const THANK_YOU_URL = '/spraylipome/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const OLD_PRICE_UNIT = 15000;
const QTY_OPTS = [
  { v: 1, label: '1 spray', sub: packLabel(PRICES, 1, 'FCFA') },
  { v: 2, label: '2 sprays', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Populaire', save: 'Economisez 2 900 F' },
  { v: 3, label: '3 sprays', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
];

// 13 medias UNIQUES
const MEDIA = {
  hero:       '/spray-lipome/product-1.webp',
  problem:    '/spray-lipome/hand-1.webp',
  action:     '/spray-lipome/hand-2.webp',
  video1:     '/spray-lipome/video-1.mp4',
  formula:    '/spray-lipome/product-2.webp',
  video2:     '/spray-lipome/video-2.mp4',
  penet:      '/spray-lipome/product-3.webp',
  video3:     '/spray-lipome/video-3.mp4',
  avant:      '/spray-lipome/hand-3.webp',
  apres:      '/spray-lipome/product-4.webp',
  comfort:    '/spray-lipome/product-5.webp',
  engagement: '/spray-lipome/product-6.webp',
  banner:     '/spray-lipome/product-7.webp',
};

declare global { interface Window { fbq: any; _fbq: any; } }

function initMetaPixel(pixelIds: string | string[]) {
  const ids = (Array.isArray(pixelIds) ? pixelIds : [pixelIds]).filter(Boolean);
  if (!ids.length || window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); };
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  for (const id of ids) window.fbq('init', id);
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
      className="relative w-full overflow-hidden rounded-3xl border border-fuchsia-400/30 bg-purple-950 shadow-[0_20px_60px_-12px_rgba(168,85,247,.45)]"
      style={{ aspectRatio: aspect }}
    >
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-fuchsia-400"/>
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-purple-950/80 to-transparent"/>
    </div>
  );
}

function LazyImg({ src, alt, className, aspect, priority }: { src: string; alt: string; className?: string; aspect?: string; priority?: boolean }) {
  const { ref, visible } = useOnScreen('300px');
  // priority=true -> pas de lazy, charge et decode en priorite (pour le hero)
  if (priority) {
    return (
      <div className={`overflow-hidden ${className || ''}`} style={aspect ? { aspectRatio: aspect } : undefined}>
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          // @ts-ignore React 18 supports fetchPriority as lowercase
          fetchpriority="high"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className || ''}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible
        ? <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover"/>
        : <div className="h-full w-full animate-pulse bg-purple-50"/>}
    </div>
  );
}

// =========================================================
// UI atoms — palette POURPRE + MAGENTA + OR ROSE
// =========================================================
const Check = () => (
  <svg className="h-4 w-4 shrink-0 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

// CTA premium — gradient magenta/or
function CTA({
  onClick,
  children,
  variant = 'magenta',
  size = 'md',
  fullWidth = true,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'magenta' | 'gold' | 'purple' | 'rose' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const grads: Record<string, string> = {
    magenta: 'from-fuchsia-500 via-pink-500 to-rose-500',
    gold:    'from-amber-300 via-yellow-300 to-amber-400',
    purple:  'from-purple-600 via-fuchsia-500 to-pink-500',
    rose:    'from-rose-400 via-pink-400 to-fuchsia-400',
    dark:    'from-purple-900 via-fuchsia-900 to-purple-900',
  };
  const glows: Record<string, string> = {
    magenta: 'shadow-[0_12px_40px_-4px_rgba(217,70,239,.6)] hover:shadow-[0_16px_50px_-4px_rgba(217,70,239,.85)]',
    gold:    'shadow-[0_12px_40px_-4px_rgba(251,191,36,.65)] hover:shadow-[0_16px_50px_-4px_rgba(251,191,36,.9)]',
    purple:  'shadow-[0_12px_40px_-4px_rgba(168,85,247,.6)] hover:shadow-[0_16px_50px_-4px_rgba(168,85,247,.85)]',
    rose:    'shadow-[0_12px_40px_-4px_rgba(244,114,182,.55)] hover:shadow-[0_16px_50px_-4px_rgba(244,114,182,.8)]',
    dark:    'shadow-[0_12px_40px_-4px_rgba(0,0,0,.5)] ring-1 ring-fuchsia-400/30',
  };
  const textColor = variant === 'gold' ? 'text-purple-900' : 'text-white';
  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-[13px]',
    md: 'px-6 py-3.5 text-[14px]',
    lg: 'px-8 py-4 text-[15px] sm:text-base',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group sl-cta relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${grads[variant]} font-black ${textColor} ${glows[variant]} transition-shadow ${sizes[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="sl-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"/>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

// Marquee horizontal
function Marquee({ items, variant = 'purple', speed = 28 }: {
  items: string[];
  variant?: 'purple' | 'gold' | 'magenta' | 'light';
  speed?: number;
}) {
  const variantClasses: Record<string, string> = {
    purple:  'bg-gradient-to-r from-purple-900 via-fuchsia-900 to-purple-900 text-rose-200 border-y border-fuchsia-400/30',
    magenta: 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 text-white border-y-2 border-white/20',
    gold:    'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 text-purple-900 border-y-2 border-purple-900/10',
    light:   'bg-purple-50 text-purple-800 border-y border-purple-100',
  };
  return (
    <div className={`overflow-hidden py-2 ${variantClasses[variant]}`}>
      <div className="sl-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] sm:text-[11px]" style={{ animationDuration: `${speed}s` }}>
        {[0, 1].map(k => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-3">
                <span>{t}</span>
                <svg className="inline-block h-3 w-3 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z"/>
                </svg>
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
export default function SprayLipomeLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(22);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const [exitPopup, setExitPopup] = useState(false);
  const exitShown = useRef(false);
  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const TOASTS = useMemo(() => [
    { n: 'Aminata K.', v: 'Abidjan',   t: '3 min'  },
    { n: 'Moussa B.',  v: 'Bouake',    t: '6 min'  },
    { n: 'Fatou D.',   v: 'Yopougon',  t: '10 min' },
    { n: 'Salif C.',   v: 'Daloa',     t: '14 min' },
    { n: 'Clarisse T.',v: 'San Pedro', t: '19 min' },
    { n: 'Abdoul R.',  v: 'Korhogo',   t: '23 min' },
  ], []);

  // Preload du hero + DNS prefetch API des que possible (avant le render du hero)
  useEffect(() => {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = MEDIA.hero;
    // @ts-ignore fetchPriority pas encore dans les types DOM TS
    preloadLink.fetchPriority = 'high';
    document.head.appendChild(preloadLink);

    return () => { try { document.head.removeChild(preloadLink); } catch {} };
  }, []);

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) {
      initMetaPixel([META_PIXEL_ID, META_PIXEL_ID_SECONDARY]);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Spray Anti-Lipome',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
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
    const id = setInterval(() => setStock(s => (s > 8 ? s - 1 : s)), 40000);
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

  const stockPct = Math.round((stock / 35) * 100);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#faf7fb] text-neutral-900" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes sl-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes sl-fade-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes sl-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes sl-float-slow { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-18px) translateX(10px) } }
        @keyframes sl-sheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes sl-pulse-ring { 0% { transform: scale(.95); opacity: 1 } 100% { transform: scale(1.65); opacity: 0 } }
        @keyframes sl-slide-in-left { from { opacity: 0; transform: translateX(-100%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes sl-slide-out-left { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-100%) } }
        @keyframes sl-gradient-shift { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        @keyframes sl-heartbeat { 0%,100% { transform: scale(1) } 25% { transform: scale(1.12) } 50% { transform: scale(.94) } 75% { transform: scale(1.06) } }
        @keyframes sl-shimmer-text { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        @keyframes sl-bob { 0%,100% { transform: translateY(0) rotate(-1deg) } 50% { transform: translateY(-8px) rotate(1deg) } }

        .sl-fade-up { animation: sl-fade-up .6s cubic-bezier(.22,.8,.4,1) both }
        .sl-marquee { animation: sl-marquee 28s linear infinite }
        .sl-float { animation: sl-float 3s ease-in-out infinite }
        .sl-float-slow { animation: sl-float-slow 8s ease-in-out infinite }
        .sl-bob { animation: sl-bob 4s ease-in-out infinite }
        .sl-cta { animation: sl-float 2.6s ease-in-out infinite }
        .sl-cta:hover { animation: none; transform: translateY(-2px) }
        .sl-cta-sheen { animation: sl-sheen 3s ease-in-out infinite }
        .sl-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: sl-pulse-ring 1.6s cubic-bezier(0,0,.2,1) infinite }
        .sl-toast-in { animation: sl-slide-in-left .4s cubic-bezier(.22,1,.36,1) both }
        .sl-toast-out { animation: sl-slide-out-left .35s cubic-bezier(.55,.08,.68,.53) both }
        .sl-animated-bg { background-size: 220% 220%; animation: sl-gradient-shift 9s ease infinite }
        .sl-heartbeat { animation: sl-heartbeat 1.4s ease-in-out infinite }
        .sl-shimmer-text {
          background: linear-gradient(90deg, #a855f7 0%, #ec4899 25%, #fbbf24 50%, #ec4899 75%, #a855f7 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: sl-shimmer-text 3.5s linear infinite;
        }
        .sl-shimmer-gold {
          background: linear-gradient(90deg, #fbbf24 0%, #fde047 25%, #fcd34d 50%, #fde047 75%, #fbbf24 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: sl-shimmer-text 3s linear infinite;
        }
        .sl-dots-bg {
          background-image: radial-gradient(circle, rgba(217,70,239,.15) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        details[open] summary .sl-chev { transform: rotate(180deg) }

        /* content-visibility: auto -> le navigateur skip le layout/paint
           des sections tant qu'elles sont hors viewport. contain-intrinsic-size
           reserve de la place pour eviter un jump lors de l'apparition.
           Gain : ~30-50% sur le First Contentful Paint sur mobile lent. */
        .sl-cv { content-visibility: auto; contain-intrinsic-size: 0 800px }
        .sl-cv-sm { content-visibility: auto; contain-intrinsic-size: 0 500px }
      `}</style>

      {/* ===================================================== */}
      {/* STICKY TOP BAR - pourpre deep avec or rose             */}
      {/* ===================================================== */}
      <div className="sticky top-0 z-50 border-b border-amber-300/30 bg-gradient-to-r from-purple-900 via-fuchsia-900 to-purple-900 sl-animated-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-3 py-2 sm:gap-3">
          <span className="relative flex h-2 w-2 text-amber-300 sl-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300"/>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white sm:text-[11px]">
            <span className="sl-shimmer-gold">Offre du jour</span> - fin dans
          </span>
          <div className="flex items-center gap-1">
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] font-bold text-amber-300/70">:</span>}
                <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md bg-amber-300/15 px-1.5 font-mono text-[12px] font-black tabular-nums text-amber-200 ring-1 ring-amber-300/40 sm:h-7 sm:min-w-[32px] sm:text-[13px]">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee 1 - promesses or sur pourpre */}
      <Marquee
        variant="purple"
        items={['Spray Anti-Lipome dermatologique', 'Formule vegetale', 'Simple a appliquer', 'Paiement a la livraison', 'Livraison 24h Abidjan', '2 500+ peaux soulagees']}
      />

      {/* ===================================================== */}
      {/* HERO STACKE : titre -> image -> CTA                    */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-rose-50"/>
        <div className="absolute inset-0 sl-dots-bg opacity-60"/>
        <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-fuchsia-300/40 blur-3xl sl-float-slow"/>
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl sl-float-slow" style={{ animationDelay: '2s' }}/>
        <div className="pointer-events-none absolute top-1/3 right-10 h-48 w-48 rounded-full bg-purple-300/30 blur-3xl sl-float-slow" style={{ animationDelay: '4s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-6 text-center sm:pt-10 md:pt-14 md:pb-14">

          <div className="sl-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-300/60 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-700 shadow-md backdrop-blur-sm sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 sl-heartbeat"/>
              Serum Anti-Lipome Premium
            </span>
          </div>

          {/* TITRE - inspire du site source */}
          <h1 className="mt-4 text-[34px] font-black leading-[1.02] tracking-tight sm:text-5xl md:text-[54px] sl-fade-up" style={{ animationDelay: '.05s' }}>
            <span className="text-purple-900">Finis les</span>
            <span className="mt-1 block sl-shimmer-text">
              LIPOMES
            </span>
            <span className="block text-purple-900">
              <span className="bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">aujourd'hui</span>.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-neutral-700 sm:text-[16px] sl-fade-up" style={{ animationDelay: '.1s' }}>
            Quand un lipome devient visible sur le{' '}
            <span className="font-black text-fuchsia-600">front</span>, le{' '}
            <span className="font-black text-purple-600">bras</span> ou la{' '}
            <span className="font-black text-rose-600">main</span>, retrouvez une peau lisse.
          </p>

          {/* IMAGE CENTRALE stackee */}
          <div className="relative mt-6 sl-fade-up" style={{ animationDelay: '.15s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-fuchsia-400/40 via-pink-400/30 to-amber-300/40 blur-3xl"/>
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_70px_-12px_rgba(217,70,239,.5)] ring-1 ring-fuchsia-200 sl-bob">
              <LazyImg src={MEDIA.hero} alt="Spray Anti-Lipome" aspect="4/5" priority/>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-purple-950/30 to-transparent"/>
            </div>

            {/* Badge or rose */}
            <div className="absolute -left-2 top-6 rotate-[-8deg] rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 px-3 py-2 text-center text-purple-900 shadow-xl sl-heartbeat sm:-left-4">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Resultat</p>
              <p className="text-[18px] font-black leading-none">Visible</p>
            </div>
            {/* Badge etoiles */}
            <div className="absolute -right-2 bottom-8 rotate-[6deg] rounded-xl bg-white px-3 py-2 shadow-xl ring-1 ring-fuchsia-100 sm:-right-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-700">Note clients</p>
              <p className="flex items-center gap-0.5 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 text-[11px] font-black text-purple-900">4.9</span>
              </p>
            </div>
          </div>

          {/* Prix + CTA */}
          <div className="mt-8 sl-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="sl-shimmer-text text-4xl font-black sm:text-5xl">{fmtTotal(1)}</span>
              <span className="text-lg font-bold text-purple-900 sm:text-xl">FCFA</span>
              <span className="text-sm text-neutral-400 line-through sm:text-base">15 000 FCFA</span>
              <span className="rounded-full bg-gradient-to-r from-amber-300 to-yellow-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-900 shadow">-34%</span>
            </div>

            {/* CTA magenta principal */}
            <div className="mx-auto mt-5 max-w-sm">
              <CTA onClick={() => openModal(1)} variant="magenta" size="lg">
                Je commande - {fmtTotal(1)} FCFA <Arrow/>
              </CTA>
            </div>
            <p className="mt-3 text-[11px] text-neutral-500">
              🔒 Paiement a la livraison - sans risque
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] font-semibold text-neutral-700 sm:grid-cols-4 sm:gap-3 sm:text-[12px] sl-fade-up" style={{ animationDelay: '.25s' }}>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-fuchsia-100 backdrop-blur-sm"><Check/>Formule douce</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-fuchsia-100 backdrop-blur-sm"><Check/>Facile a appliquer</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-fuchsia-100 backdrop-blur-sm"><Check/>Livre en 24h</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-fuchsia-100 backdrop-blur-sm"><Check/>Cash a livraison</span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 sl-fade-up" style={{ animationDelay: '.3s' }}>
            <div className="flex -space-x-2">
              {['bg-fuchsia-400','bg-pink-400','bg-purple-400','bg-amber-300','bg-rose-400'].map((c, i) => (
                <div key={i} className={`h-7 w-7 rounded-full ${c} ring-2 ring-white`}/>
              ))}
            </div>
            <div className="text-[11px] sm:text-[12px]">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 font-black text-purple-900">4.9/5</span>
              </div>
              <p className="text-neutral-500">2 547 avis verifies</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* STATS BAR                                              */}
      {/* ===================================================== */}
      <section className="bg-white border-y border-fuchsia-50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:gap-4 sm:py-7">
          {[
            { n: '2 500+', l: 'Clients satisfaits' },
            { n: '4.9/5',  l: 'Note clients' },
            { n: '100%',   l: 'Formule vegetale' },
            { n: '24h',    l: 'Livraison Abidjan' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-rose-500 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC 1 : PROBLEME (hand-1)                             */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 py-12 sm:py-16">
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl"/>
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sl-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-purple-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 shadow">
                Le probleme
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Une boule qui{' '}
                <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">derange</span>.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Certaines personnes perdent confiance, evitent les photos ou n'aiment plus montrer
                certaines zones de leur corps.
                <span className="mt-2 block font-black text-rose-600">Vous meritez mieux.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="rose" size="lg" fullWidth={false}>
                  Je veux retrouver ma peau <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sl-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-rose-300/40 via-pink-300/30 to-fuchsia-300/40 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-rose-100">
                  <LazyImg src={MEDIA.problem} alt="Lipome visible" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee milieu - avis courts */}
      <Marquee
        variant="magenta"
        items={['"La boule a commence a diminuer" - Aminata', '"Ma peau est plus lisse" - Mariam', '"Vrai changement" - Fatou', '"Zone apaisee" - Salif', '"Je ne regrette pas" - Clarisse']}
      />

      {/* ===================================================== */}
      {/* BLOC 2 : ACTION (hand-2)                               */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-fuchsia-50/50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sl-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-fuchsia-300/50 via-pink-300/40 to-purple-300/50 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-fuchsia-200">
                  <LazyImg src={MEDIA.action} alt="Spray en usage" aspect="1/1"/>
                </div>
              </div>
            </div>
            <div className="sl-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-block rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow">
                Solution premium
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Un geste{' '}
                <span className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">simple</span>,{' '}
                un effet{' '}
                <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">visible</span>.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Spray concu pour les personnes qui cherchent une solution pratique, douce et facile a
                integrer dans une routine reguliere.
                <span className="mt-2 block font-black text-fuchsia-600">Pas de bistouri. Pas de douleur.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="magenta" size="lg" fullWidth={false}>
                  Je veux essayer <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* VIDEO 1                                                */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sl-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-purple-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 shadow">
                🎬 Demo reelle
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Voyez par{' '}
                <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">vous-meme</span>.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Application precise, absorption rapide. Aucun residus sur la peau.
                <span className="mt-2 block font-black text-purple-700">Le changement commence ici.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="purple" size="lg" fullWidth={false}>
                  Je commande <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sl-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative mx-auto max-w-sm">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-purple-400/50 via-fuchsia-400/40 to-pink-400/50 blur-3xl"/>
                <LazyVideo src={MEDIA.video1} aspect="9/16"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC 3 : FORMULE (product-2)                           */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-gradient-to-b from-amber-50/40 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sl-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-amber-300/40 via-yellow-300/30 to-fuchsia-300/40 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-amber-100">
                  <LazyImg src={MEDIA.formula} alt="Formule dermatologique" aspect="1/1"/>
                </div>
              </div>
            </div>
            <div className="sl-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-block rounded-full bg-gradient-to-r from-amber-300 to-yellow-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-purple-900 shadow">
                Formule exclusive
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Des actifs{' '}
                <span className="sl-shimmer-gold">nobles</span>.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Extraits vegetaux, huiles essentielles dermatologiques. Une formule pensee pour agir en profondeur
                sans agresser la peau.
                <span className="mt-2 block font-black text-amber-600">Brevetee. Testee. Approuvee.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="gold" size="lg" fullWidth={false}>
                  Je veux cette formule <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* VIDEO 2                                                */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-purple-50/40 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sl-fade-up">
              <div className="relative mx-auto max-w-sm">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-fuchsia-400/50 via-pink-400/40 to-amber-300/50 blur-3xl"/>
                <LazyVideo src={MEDIA.video2} aspect="9/16"/>
              </div>
            </div>
            <div className="sl-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-700 shadow-md ring-1 ring-fuchsia-100 sm:text-[11px]">
                🎥 Resultat filme
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Le{' '}
                <span className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">gonflement</span>{' '}
                disparait.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Apres plusieurs jours d'application, la zone diminue visiblement.
                La peau retrouve sa texture lisse.
                <span className="mt-2 block font-black text-fuchsia-600">Vos clients le confirment.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="magenta" size="lg" fullWidth={false}>
                  Moi aussi je veux ca <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC PENETRATION (product-3)                           */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sl-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-purple-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 shadow">
                Action ciblee
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Penetre{' '}
                <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">en profondeur</span>.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Les actifs atteignent le tissu graisseux en quelques minutes. Une sensation apaisante
                immediate, sans odeur forte.
                <span className="mt-2 block font-black text-purple-700">Efficace. Discret. Professionnel.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="purple" size="lg" fullWidth={false}>
                  J'achete maintenant <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sl-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-purple-300/40 via-fuchsia-300/30 to-pink-300/40 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-purple-100">
                  <LazyImg src={MEDIA.penet} alt="Penetration active" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* VIDEO 3                                                */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-gradient-to-br from-purple-50 via-fuchsia-50 to-rose-50 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg sm:text-[11px]">
            ✨ Preuve en mouvement
          </span>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            La{' '}
            <span className="sl-shimmer-text">transformation</span>{' '}
            en direct.
          </h2>
          <p className="mt-2 text-[13px] text-neutral-500 sm:text-[14px]">
            Chaque semaine des centaines de clients partagent leurs resultats.
          </p>

          <div className="mx-auto mt-6 max-w-sm sl-fade-up">
            <LazyVideo src={MEDIA.video3} aspect="9/16"/>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="magenta" size="lg">
              Je rejoins ces clients <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* AVANT / APRES (hand-3 + product-4)                     */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-white py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rose-50/30 via-transparent to-fuchsia-50/30"/>
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
              Resultats clients
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Avant{' '}
              <span className="text-neutral-400 mx-1">→</span>{' '}
              <span className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">Apres</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="sl-fade-up group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-rose-100">
              <LazyImg src={MEDIA.avant} alt="Avant" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-purple-950/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">Avant</p>
                <p className="text-lg font-black text-white">Lipome visible, genant.</p>
              </div>
            </div>
            <div className="sl-fade-up group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-fuchsia-100" style={{ animationDelay: '.15s' }}>
              <LazyImg src={MEDIA.apres} alt="Apres" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-purple-950/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">Apres usage</p>
                <p className="text-lg font-black text-white">Peau lisse, uniforme.</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="magenta" size="lg">
              Je veux ce resultat <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* Marquee AVIS ETOILES (or) */}
      <Marquee
        variant="gold"
        items={['★★★★★ 4.9/5 sur 2 547 avis', '★★★★★ "La boule a commence a diminuer" - Aminata', '★★★★★ "Simple a appliquer" - Mariam', '★★★★★ "Gonflement moins apparent" - Fatou', '★★★★★ "Je ne regrette pas" - Clarisse']}
        speed={24}
      />

      {/* ===================================================== */}
      {/* BLOC CONFORT (product-5)                               */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-gradient-to-br from-fuchsia-50 via-pink-50 to-rose-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sl-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-gradient-to-r from-rose-400 to-pink-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow">
                Confiance retrouvee
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Reprenez{' '}
                <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">confiance</span>.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Photos sans complexe. Vetements courts sans hesitation. Votre peau reflete
                votre meilleure version.
                <span className="mt-2 block font-black text-rose-600">Votre beaute vous appartient.</span>
              </p>
              <div className="mt-5">
                <CTA onClick={() => openModal(1)} variant="rose" size="lg" fullWidth={false}>
                  Retrouver ma confiance <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sl-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-rose-300/40 via-pink-300/30 to-fuchsia-300/40 blur-2xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-rose-100">
                  <LazyImg src={MEDIA.comfort} alt="Confort retrouve" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BUNDLES - visuels synthetiques spray dore              */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-purple-950 py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0 sl-dots-bg opacity-20"/>
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-fuchsia-500/30 blur-3xl"/>
        <div className="pointer-events-none absolute left-10 bottom-10 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl sl-float-slow"/>

        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-amber-300 to-yellow-300 px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-900 shadow-lg">
              Pack luxe
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
              Choisissez votre{' '}
              <span className="sl-shimmer-gold">cure</span>.
            </h2>
            <p className="mt-2 text-[13px] text-rose-200/80 sm:text-[14px]">
              Plus vous achetez, <span className="font-black text-amber-300">plus vous economisez.</span>
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
            {[
              {
                qty: 1,
                label: '1 spray',
                desc: 'Decouvrir',
                price: orderTotal(PRICES, 1),
                oldPrice: OLD_PRICE_UNIT,
                tag: '',
                saveLabel: 'Pour essayer',
                accent: 'from-neutral-300 to-neutral-500',
                bg: 'from-neutral-900 to-neutral-800',
                ringColor: 'ring-1 ring-neutral-700',
              },
              {
                qty: 2,
                label: '2 sprays',
                desc: 'Cure complete',
                price: orderTotal(PRICES, 2),
                oldPrice: OLD_PRICE_UNIT * 2,
                tag: 'POPULAIRE',
                saveLabel: 'Economisez 13 100 F',
                accent: 'from-fuchsia-400 via-pink-400 to-rose-400',
                bg: 'from-fuchsia-950 to-pink-950',
                ringColor: 'ring-2 ring-fuchsia-400',
              },
              {
                qty: 3,
                label: '3 sprays',
                desc: 'Pack premium',
                price: orderTotal(PRICES, 3),
                oldPrice: OLD_PRICE_UNIT * 3,
                tag: 'MEILLEURE OFFRE',
                saveLabel: 'Economisez 20 100 F',
                accent: 'from-amber-300 via-yellow-300 to-amber-400',
                bg: 'from-amber-950 to-yellow-950',
                ringColor: 'ring-2 ring-amber-300',
              },
            ].map((b) => (
              <button
                key={b.qty}
                onClick={() => openModal(b.qty)}
                className={`group relative overflow-hidden rounded-2xl bg-purple-900/80 p-3 text-left shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-4 ${b.ringColor} ${b.qty === 2 ? 'sm:scale-[1.04]' : ''}`}
              >
                {b.tag && (
                  <span className={`absolute right-2 top-2 z-10 inline-flex animate-pulse items-center gap-1 rounded-full bg-gradient-to-r ${b.accent} px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-purple-900 shadow-lg sm:text-[10px]`}>
                    {b.qty === 2 ? '💜' : '👑'} {b.tag}
                  </span>
                )}

                <div className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br ${b.accent} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30`}/>

                <div className={`relative flex aspect-square items-end justify-center overflow-hidden rounded-xl bg-gradient-to-br ${b.bg}`}>
                  <div className="pointer-events-none absolute left-4 top-6 h-4 w-4 rounded-full bg-fuchsia-400/30 blur-sm sl-float"/>
                  <div className="pointer-events-none absolute left-8 top-10 h-3 w-3 rounded-full bg-amber-300/40 blur-sm sl-float" style={{ animationDelay: '.5s' }}/>

                  <div className="flex items-end gap-1.5 pb-4">
                    {Array.from({ length: b.qty }).map((_, i) => (
                      <div
                        key={i}
                        className="relative flex flex-col items-center"
                        style={{ transform: `translateY(${Math.abs(i - (b.qty - 1) / 2) * 2}px)` }}
                      >
                        <div className={`h-3 w-6 rounded-t bg-gradient-to-b ${b.accent} sm:h-4 sm:w-8`}/>
                        <div className="h-1 w-4 bg-purple-800 sm:w-5"/>
                        <div className={`h-20 w-9 rounded-md bg-gradient-to-b ${b.accent} shadow-xl sm:h-24 sm:w-11`}>
                          <div className="mx-auto mt-2 h-1 w-7 rounded-full bg-white/40 sm:mt-3"/>
                          <p className="mt-8 text-center text-[7px] font-black uppercase tracking-widest text-purple-900/70 sm:mt-10 sm:text-[8px]">LIPOME</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white font-black shadow-lg ring-2 ring-white/90 sm:h-12 sm:w-12">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[18px] text-transparent sm:text-[20px]`}>x{b.qty}</span>
                  </div>
                </div>

                <div className="relative mt-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-rose-200/70">{b.label}</p>
                  <p className="text-[10px] font-bold text-rose-300/60">{b.desc}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[22px] font-black text-transparent sm:text-[26px]`}>
                      {fmt(b.price)}
                    </span>
                    <span className="text-[11px] text-rose-300/50 line-through sm:text-[12px]">{fmt(b.oldPrice)}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-amber-300 sm:text-[12px]">{b.saveLabel}</p>

                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${b.accent} px-4 py-2 text-[12px] font-black text-purple-900 shadow-md transition-transform group-hover:scale-105 sm:text-[13px]`}>
                    Je commande <Arrow/>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-rose-200/70">
            Paiement a la livraison
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* MID-CTA + stock bar                                    */}
      {/* ===================================================== */}
      <section className="sl-cv bg-white py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold sm:text-[12px]">
            <span className="text-neutral-500">💜 Stock ce jour</span>
            <span className="inline-flex items-center gap-1 text-fuchsia-600">
              <span className="sl-heartbeat">🔥</span> {stock} restants
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-fuchsia-100">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 transition-all duration-500"
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <div className="mt-6">
            <CTA onClick={() => openModal(1)} variant="magenta" size="lg">
              <span className="sl-heartbeat">•</span> Commander maintenant <Arrow/>
            </CTA>
          </div>
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Paiement <span className="font-bold">a la livraison</span>
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* WHATSAPP TESTIMONIALS (5 avis reels du site source)    */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-gradient-to-b from-[#e5ddd5] to-[#d9d2c4] py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30L30 0L60 30L30 60z' fill='none' stroke='%23581c87' stroke-width='.5'/%3E%3C/svg%3E\")" }}/>

        <div className="relative mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-lg">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Messages clients WhatsApp
            </span>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Ce que{' '}
              <span className="bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">ils disent</span>.
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[#ece5dd] shadow-2xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 font-black">GS</div>
              <div className="flex-1">
                <p className="text-[13px] font-black">GS - Spray Anti-Lipome</p>
                <p className="text-[10px] text-emerald-300">● en ligne</p>
              </div>
              <svg className="h-4 w-4 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>

            <div className="space-y-3 px-4 py-5">
              {/* 5 avis reels recuperes de 2.obrille.com/lipome */}
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sl-fade-up">
                <p className="text-[11px] font-black text-fuchsia-600">Aminata K.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Franchement je suis satisfaite. La boule que j'avais a commence a diminuer petit a petit. Merci beaucoup pour le produit 🙏</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">09:14 ✓✓</p>
              </div>

              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sl-fade-up" style={{ animationDelay: '.12s' }}>
                <p className="text-[11px] font-black text-pink-600">Mariam D.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">J'ai aime surtout parce que c'est simple a appliquer. Ma peau est plus lisse maintenant et le lipome est beaucoup moins visible.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">11:32 ✓✓</p>
              </div>

              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm sl-fade-up" style={{ animationDelay: '.24s' }}>
                <p className="text-[13px] text-neutral-800">Merci beaucoup pour vos retours 💜 Continuez a appliquer matin et soir pour des resultats plus visibles.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-500">11:35 ✓✓</p>
              </div>

              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sl-fade-up" style={{ animationDelay: '.36s' }}>
                <p className="text-[11px] font-black text-purple-600">Fatou B.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Au debut j'avais des doutes mais apres utilisation j'ai vu un vrai changement. Le gonflement est moins apparent. Je recommande.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">18:06 ✓✓</p>
              </div>

              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sl-fade-up" style={{ animationDelay: '.48s' }}>
                <p className="text-[11px] font-black text-rose-600">Salif T.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Merci encore. Le spray m'aide vraiment. La zone est apaisee et visuellement c'est deja beaucoup mieux qu'avant ❤️</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">07:51 ✓✓</p>
              </div>

              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sl-fade-up" style={{ animationDelay: '.6s' }}>
                <p className="text-[11px] font-black text-amber-600">Clarisse N.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">J'ai commande sans trop reflechir et je ne regrette pas. Produit pratique, bonne sensation sur la peau et resultat encourageant 👌</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">13:25 ✓✓</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-md">
            <CTA onClick={() => openModal(1)} variant="magenta" size="lg">
              Moi aussi je commande <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC ENGAGEMENT (product-6)                            */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sl-fade-up order-2 md:order-1">
              <span className="inline-block rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow">
                Notre engagement
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Votre{' '}
                <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">satisfaction</span>{' '}
                garantie.
              </h2>
              <ul className="mt-5 space-y-2.5 text-[13px] sm:text-[14px]">
                {[
                  'Formule dermatologique - actifs vegetaux',
                  'Testee et approuvee par 2 500+ clients',
                  'Simple a appliquer au quotidien',
                  'Livraison 24h a Abidjan, 48h en region',
                  'Paiement uniquement a la livraison',
                ].map((x, i) => (
                  <li key={i} className="flex items-start gap-2 text-neutral-700">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="purple" size="lg" fullWidth={false}>
                  J'achete sans risque <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sl-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-purple-300/40 via-fuchsia-300/30 to-pink-300/40 blur-3xl"/>
                <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-purple-100">
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
      <section className="sl-cv bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Vos{' '}
              <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">questions</span>.
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'En combien de temps voit-on un resultat ?', a: 'Les premiers effets sont visibles apres quelques jours. Pour un changement significatif, comptez 3 a 6 semaines d\'application reguliere.' },
              { q: 'Le spray fait-il mal ?',                    a: 'Non. Formule douce sans aucune sensation desagreable. Application simple, sensation apaisante.' },
              { q: 'Sur quels lipomes ca marche ?',             a: 'Lipomes superficiels : bras, front, main, dos, jambes. Usage externe uniquement, sur peau saine.' },
              { q: 'Je paie avant ou apres ?',                  a: 'Paiement uniquement a la livraison. Vous verifiez le produit avant de payer. Zero risque.' },
              { q: 'Livre partout ?',                           a: 'Oui, partout en Cote d\'Ivoire. 24h Abidjan, 48h en regions. Livraison gratuite.' },
              { q: 'Combien de fois par jour l\'appliquer ?',   a: '2 fois par jour (matin et soir) sur la zone concernee. Laissez penetrer 1 minute avant de vous rhabiller.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-fuchsia-50/60 shadow-sm ring-1 ring-fuchsia-100 transition-all open:shadow-lg open:bg-white open:ring-fuchsia-300">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-neutral-900 sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="sl-chev h-5 w-5 text-fuchsia-500 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
      {/* BANNIERE FINALE (fond image product-7 opacifie)        */}
      {/* ===================================================== */}
      <section className="sl-cv relative overflow-hidden py-16 sm:py-24">
        <img src={MEDIA.banner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25"/>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-900/90 via-fuchsia-900/85 to-purple-900/90 sl-animated-bg" style={{ backgroundSize: '200% 200%' }}/>
        <div className="pointer-events-none absolute left-10 top-10 h-32 w-32 rounded-full bg-fuchsia-400/30 blur-2xl sl-float-slow"/>
        <div className="pointer-events-none absolute right-10 bottom-10 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl sl-float-slow" style={{ animationDelay: '2s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 backdrop-blur-sm">
            ✨ Derniere chance
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            Votre{' '}
            <span className="sl-shimmer-gold">peau lisse</span>{' '}
            vous attend.
          </h2>
          <p className="mt-4 text-[14px] text-rose-200/90 sm:text-[16px]">
            Spray Anti-Lipome · {fmtTotal(1)} FCFA · Paiement a la livraison
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="gold" size="lg">
              <span className="sl-heartbeat">•</span> Je commande maintenant
            </CTA>
          </div>
          <p className="mt-3 text-[12px] text-rose-200/75">
            🔒 Paiement a la livraison · Sans risque
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FOOTER                                                 */}
      {/* ===================================================== */}
      <footer className="bg-purple-950 py-8 text-center text-[11px] text-rose-200/70">
        <p>© 2026 · Cote d`Ivoire · GS Pipeline · Tous droits reserves</p>
        <p className="mt-1">Service client 7j/7 · Livraison Abidjan 24h · Paiement a la livraison</p>
      </footer>

      {/* ===================================================== */}
      {/* STICKY BOTTOM BAR                                      */}
      {/* ===================================================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-fuchsia-500 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,.08)] backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img src={MEDIA.hero} alt="" className="h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-fuchsia-300 sm:h-12 sm:w-12"/>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black text-neutral-900 sm:text-[13px]">Spray Anti-Lipome</p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span className="font-bold text-fuchsia-600">{fmtTotal(1)} FCFA</span>
                <span className="text-neutral-400">·</span>
                <span className="inline-flex items-center gap-0.5 font-mono font-bold text-amber-500">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"/>
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => openModal(1)}
            className="sl-cta relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 px-5 py-2.5 text-[13px] font-black text-white shadow-[0_10px_25px_-4px_rgba(217,70,239,.6)] transition-transform hover:scale-105 sm:px-6 sm:py-3 sm:text-[14px]"
          >
            <span className="sl-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"/>
            <span className="relative">Commander</span>
            <Arrow/>
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* TOAST                                                  */}
      {/* ===================================================== */}
      {toast && (
        <div className={`fixed bottom-20 left-3 z-40 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-2xl ring-1 ring-fuchsia-100 sm:bottom-24 sm:left-4 ${toast.visible ? 'sl-toast-in' : 'sl-toast-out'}`}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-500 text-white shadow">
            <Check/>
            <span className="absolute inset-0 rounded-full bg-fuchsia-400/30 sl-pulse-dot"/>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-[sl-fade-up_.3s_ease-out]">
            <button
              onClick={() => setExitPopup(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-fuchsia-900 to-purple-900 px-6 py-8 text-center text-white sl-animated-bg" style={{ backgroundSize: '200% 200%' }}>
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-fuchsia-400/30 blur-2xl"/>
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-300/25 blur-2xl"/>
              <span className="inline-block rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200 backdrop-blur-sm">
                🎁 Cadeau
              </span>
              <h3 className="mt-3 text-2xl font-black leading-tight">
                Attendez ! <br/>Votre peau merite mieux.
              </h3>
              <p className="mt-2 text-[13px] text-rose-200/90">
                Paiement a la livraison.
              </p>
            </div>

            <div className="px-6 py-5">
              <CTA onClick={() => openModal(1)} variant="magenta" size="lg">
                Je commande maintenant <Arrow/>
              </CTA>
              <button
                onClick={() => setExitPopup(false)}
                className="mt-2 w-full text-[11px] font-medium text-neutral-400 hover:text-neutral-600"
              >
                Non merci, je garde mes lipomes
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
          title: 'Spray Anti-Lipome',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          secondaryMetaPixelId: META_PIXEL_ID_SECONDARY,
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
