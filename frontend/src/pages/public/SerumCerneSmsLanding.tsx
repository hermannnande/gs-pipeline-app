/**
 * Landing ULTRA PREMIUM — Serum Anti-Cernes SMS (SERUM_CERNE_SMS) — clone serum-cerne
 * ==================================================================
 *
 * Palette : NAVY DEEP + OR + CORAIL + IVOIRE (style editorial beauty)
 *   - creme-anti-verrue : rouge/orange
 *   - patchdouleurtk    : indigo/violet
 *   - creme-verrue-tk   : bleu + orange
 *   - spraydouleurtk    : lime/noir + jaune
 *   - spraylipome       : pourpre/magenta/or rose
 *   - serum-cerne       : NAVY / OR / CORAIL / IVOIRE (beauty luxe nocturne)
 *
 * 12 medias UNIQUES utilises (aucune repetition) :
 *   - hero.webp     : Hero stacke
 *   - Ma-video-12.mp4 : Bloc probleme (cernes) — loop
 *   - ChatGPT-Image-8-juin-2026-23_30_57.png : Bloc solution
 *   - video-1.mp4   : Demo application (loop)
 *   - img-4.webp    : Bloc formule
 *   - img-5.webp    : Bloc eclat
 *   - video-2.mp4   : Demo resultats (loop)
 *   - img-6.webp    : Avant (cernes visibles)
 *   - img-7.webp    : Apres (peau radieuse)
 *   - img-8.webp    : Bloc routine
 *   - video-3.mp4   : Temoignage video (loop)
 *   - jj-1.mp4      : Bloc engagement / fond banniere finale — loop
 *
 * Signature visuelle :
 *   - Typographie SERIF pour les titres hero (elegance beauty)
 *   - Sections alternantes ivoire / navy deep
 *   - Filets or entre sections (signature editorial)
 *   - Section "VU DANS" avec logos presse stylises
 *   - Section avis stars format magazine
 *   - Bundles luxe flacons dores synthetiques
 *   - Marquees or/navy/corail
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';
import { optimImg } from '../../utils/img';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'anti-age';
const PRODUCT_CODE = 'SERUM_CERNE_SMS';
const META_PIXEL_ID = '26809431761984777';
/** Pixel campagne FB (meme que patchdouleurtk / crememinceurfb). */
const META_PIXEL_ID_CAMPAIGN = '1313100454309806';
const META_PIXEL_IDS = [META_PIXEL_ID_CAMPAIGN, META_PIXEL_ID];
const THANK_YOU_URL = '/anti-age/merci';

const PRICES: Record<number, number> = { 1: 6500, 2: 12000, 3: 15000 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const OLD_PRICE_UNIT = 15000;
const DISCOUNT_PCT = Math.round((1 - PRICES[1] / OLD_PRICE_UNIT) * 100);
const QTY_OPTS = [
  { v: 1, label: '1 flacon', sub: packLabel(PRICES, 1, 'FCFA') },
  { v: 2, label: '2 flacons', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Populaire', save: 'Economisez 1 000 F' },
  { v: 3, label: '3 flacons', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Meilleure offre', save: 'Economisez 4 500 F' },
];

// 12 medias UNIQUES (dossier /serum-yeux/ pour eviter le conflit avec le slug /serum-cerne)
const MEDIA = {
  hero:       optimImg('https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-8-juin-2026-15_41_35.png', 1000),
  problem:    'https://obrille.com/wp-content/uploads/2026/06/Ma-video-12.mp4',
  solution:   optimImg('https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-8-juin-2026-23_30_57.png', 1000),
  video1:     '/serum-yeux/video-1.mp4',
  formula:    '/serum-yeux/img-4.webp',
  glow:       '/serum-yeux/img-5.webp',
  video2:     '/serum-yeux/video-2.mp4',
  avant:      optimImg('https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-8-juin-2026-23_22_44-1.png', 1000),
  apres:      '/serum-yeux/img-7.webp',
  routine:    '/serum-yeux/img-8.webp',
  video3:     '/serum-yeux/video-3.mp4',
  engagement: 'https://obrille.com/wp-content/uploads/2026/06/jj-1.mp4',
};

declare global { interface Window { fbq: any; _fbq: any; } }

const initedMetaPixels = new Set<string>();

function ensureFbqBase(): void {
  if (window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(args); };
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
}

function initMetaPixels(pixelIds: string[]): void {
  const ids = [...new Set(pixelIds.filter(Boolean))];
  if (!ids.length) return;
  ensureFbqBase();
  let added = false;
  for (const id of ids) {
    if (initedMetaPixels.has(id)) continue;
    window.fbq('init', id);
    initedMetaPixels.add(id);
    added = true;
  }
  if (added) window.fbq('track', 'PageView');
}

interface Product { id: number; code: string; nom: string; prixUnitaire: number }

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const fmtNum = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fmt = (v: number) => fmtNum(v) + ' FCFA';
const fmtSave = (v: number) => `Economisez ${fmtNum(v)} F`;
const pad = (n: number) => String(n).padStart(2, '0');

// =========================================================
// Lazy helpers
// =========================================================
function useOnScreen(rootMargin = '300px') {
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

function LazyVideo({ src, aspect = '9/16' }: { src: string; aspect?: string }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-3xl border border-amber-300/30 bg-slate-950 shadow-[0_20px_60px_-12px_rgba(212,175,55,.35)]"
      style={{ aspectRatio: aspect }}
    >
      {visible ? (
        <video src={src} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-amber-400"/>
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/80 to-transparent"/>
    </div>
  );
}

function LazyImg({ src, alt, className, aspect, priority }: { src: string; alt: string; className?: string; aspect?: string; priority?: boolean }) {
  const { ref, visible } = useOnScreen('300px');
  if (priority) {
    return (
      <div className={`overflow-hidden ${className || ''}`} style={aspect ? { aspectRatio: aspect } : undefined}>
        {/* @ts-ignore */}
        <img src={src} alt={alt} loading="eager" decoding="async" fetchpriority="high" className="h-full w-full object-cover"/>
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className || ''}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible
        ? <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover"/>
        : <div className="h-full w-full animate-pulse bg-amber-50"/>}
    </div>
  );
}

// =========================================================
// UI atoms
// =========================================================
const Check = () => (
  <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

// Filet or decoratif entre sections (signature editorial)
function GoldDivider() {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400"/>
      <svg className="mx-3 h-4 w-4 rotate-45 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2L18 10L10 18L2 10Z" opacity="0.5"/>
        <path d="M10 5L15 10L10 15L5 10Z"/>
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400"/>
    </div>
  );
}

// CTA premium navy/or/corail
function CTA({
  onClick,
  children,
  variant = 'gold',
  size = 'md',
  fullWidth = true,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'gold' | 'coral' | 'navy' | 'cream';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const grads: Record<string, string> = {
    gold:   'from-amber-300 via-yellow-300 to-amber-400',
    coral:  'from-orange-300 via-rose-300 to-pink-300',
    navy:   'from-slate-800 via-slate-900 to-slate-800',
    cream:  'from-stone-100 via-amber-50 to-stone-100',
  };
  const glows: Record<string, string> = {
    gold:   'shadow-[0_10px_30px_-4px_rgba(212,175,55,.55)] hover:shadow-[0_16px_40px_-4px_rgba(212,175,55,.8)]',
    coral:  'shadow-[0_10px_30px_-4px_rgba(244,114,182,.45)] hover:shadow-[0_16px_40px_-4px_rgba(244,114,182,.65)]',
    navy:   'shadow-[0_10px_30px_-4px_rgba(15,33,55,.55)] hover:shadow-[0_16px_40px_-4px_rgba(15,33,55,.75)] ring-1 ring-amber-400',
    cream:  'shadow-[0_10px_30px_-4px_rgba(0,0,0,.12)] hover:shadow-[0_16px_40px_-4px_rgba(0,0,0,.2)] ring-1 ring-amber-200',
  };
  const textColor = variant === 'navy' ? 'text-amber-300' : 'text-slate-900';
  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-[12px]',
    md: 'px-6 py-3.5 text-[13px]',
    lg: 'px-8 py-4 text-[13px] sm:text-[14px] tracking-[0.15em]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sc-cta group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${grads[variant]} font-black uppercase ${textColor} ${glows[variant]} transition-shadow ${sizes[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="sc-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"/>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

// Marquee
function Marquee({ items, variant = 'gold', speed = 28 }: { items: string[]; variant?: 'gold' | 'navy' | 'cream'; speed?: number; }) {
  const classes: Record<string, string> = {
    gold:  'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 text-slate-900 border-y-2 border-slate-900/10',
    navy:  'bg-slate-950 text-amber-300 border-y border-amber-400/20',
    cream: 'bg-stone-100 text-slate-800 border-y border-amber-200',
  };
  return (
    <div className={`overflow-hidden py-2 ${classes[variant]}`}>
      <div className="sc-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.25em] sm:text-[11px]" style={{ animationDuration: `${speed}s` }}>
        {[0, 1].map(k => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-3">
                <span>{t}</span>
                <svg className="h-3 w-3 rotate-45 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L18 10L10 18L2 10Z"/>
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
export default function SerumCerneSmsLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(18);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const [exitPopup, setExitPopup] = useState(false);
  const exitShown = useRef(false);
  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const TOASTS = useMemo(() => [
    { n: 'Aminata K.',   v: 'Abidjan',   t: '4 min'  },
    { n: 'Fatou D.',     v: 'Yopougon',  t: '8 min'  },
    { n: 'Mariam S.',    v: 'Bouake',    t: '12 min' },
    { n: 'Rokia B.',     v: 'Daloa',     t: '17 min' },
    { n: 'Clarisse T.',  v: 'San Pedro', t: '22 min' },
    { n: 'Awa M.',       v: 'Korhogo',   t: '25 min' },
  ], []);

  // Preload hero
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = MEDIA.hero;
    // @ts-ignore
    l.fetchPriority = 'high';
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch {} };
  }, []);

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    initMetaPixels(META_PIXEL_IDS);
    window.fbq?.('track', 'ViewContent', {
        content_name: 'Serum Anti-Cernes Premium',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
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
    const id = setInterval(() => setStock(s => (s > 7 ? s - 1 : s)), 38000);
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
    const first = setTimeout(show, 6500);
    const id = setInterval(show, 18000);
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

  const stockPct = Math.round((stock / 25) * 100);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes sc-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes sc-fade-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes sc-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes sc-float-slow { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-18px) translateX(10px) } }
        @keyframes sc-sheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes sc-pulse-ring { 0% { transform: scale(.95); opacity: 1 } 100% { transform: scale(1.65); opacity: 0 } }
        @keyframes sc-slide-in { from { opacity: 0; transform: translateX(-100%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes sc-slide-out { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-100%) } }
        @keyframes sc-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        @keyframes sc-bob { 0%,100% { transform: translateY(0) rotate(-.5deg) } 50% { transform: translateY(-6px) rotate(.5deg) } }

        .sc-fade-up { animation: sc-fade-up .6s cubic-bezier(.22,.8,.4,1) both }
        .sc-marquee { animation: sc-marquee 28s linear infinite }
        .sc-float { animation: sc-float 3s ease-in-out infinite }
        .sc-float-slow { animation: sc-float-slow 8s ease-in-out infinite }
        .sc-bob { animation: sc-bob 5s ease-in-out infinite }
        .sc-cta { animation: sc-float 2.8s ease-in-out infinite }
        .sc-cta:hover { animation: none; transform: translateY(-2px) }
        .sc-cta-sheen { animation: sc-sheen 3s ease-in-out infinite }
        .sc-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: sc-pulse-ring 1.6s cubic-bezier(0,0,.2,1) infinite }
        .sc-toast-in { animation: sc-slide-in .4s cubic-bezier(.22,1,.36,1) both }
        .sc-toast-out { animation: sc-slide-out .35s cubic-bezier(.55,.08,.68,.53) both }
        .sc-shimmer-gold {
          background: linear-gradient(90deg, #d4af37 0%, #fde68a 25%, #fbbf24 50%, #fef3c7 75%, #d4af37 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: sc-shimmer 3.5s linear infinite;
        }
        .sc-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500 }
        .sc-texture {
          background-image:
            radial-gradient(circle at 20% 30%, rgba(212,175,55,.06) 0, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(244,114,182,.05) 0, transparent 40%);
        }
        .sc-cv { content-visibility: auto; contain-intrinsic-size: 0 800px }
        details[open] summary .sc-chev { transform: rotate(180deg) }
      `}</style>

      {/* Import serif font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"/>

      {/* ===== STICKY TOP BAR - navy + or ===== */}
      <div className="sticky top-0 z-50 border-b border-amber-400/30 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-3 py-2 sm:gap-3">
          <span className="relative flex h-2 w-2 text-rose-300 sc-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-300"/>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-100 sm:text-[11px]">
            <span className="sc-shimmer-gold">Offre exclusive</span> · fin
          </span>
          <div className="flex items-center gap-1">
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] font-bold text-amber-300/60">:</span>}
                <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-sm bg-amber-400/10 px-1.5 font-mono text-[12px] font-black tabular-nums text-amber-200 ring-1 ring-amber-400/30 sm:h-7 sm:min-w-[32px] sm:text-[13px]">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Marquee 1 - or ===== */}
      <Marquee
        variant="gold"
        items={['Serum Anti-Cernes Premium', 'Rajeunissement visible', 'Formule dermatologique', 'Sans effet secondaire', 'Livraison 24h Abidjan', 'Paiement a la livraison']}
      />

      {/* ===================================================== */}
      {/* HERO STACKE : titre -> image -> CTA (demande user)    */}
      {/* Fond IVOIRE avec glows or/corail                       */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-[#faf8f5] sc-texture">
        <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-rose-300/30 blur-3xl sc-float-slow" style={{ animationDelay: '2s' }}/>
        <div className="pointer-events-none absolute top-1/3 right-10 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl sc-float-slow" style={{ animationDelay: '4s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-8 text-center sm:pt-12 md:pt-16">
          <div className="sc-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-white/60 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-700 shadow-sm backdrop-blur-sm sm:text-[11px]">
              <span className="h-1 w-1 rounded-full bg-amber-500"/>
              Edition limitee 2026
              <span className="h-1 w-1 rounded-full bg-amber-500"/>
            </span>
          </div>

          {/* TITRE - serif italic pour l'élégance */}
          <h1 className="mt-6 text-[40px] leading-[1.05] tracking-tight sm:text-[56px] md:text-[68px] sc-fade-up" style={{ animationDelay: '.05s' }}>
            <span className="sc-serif block text-slate-900">Rajeunissez</span>
            <span className="sc-shimmer-gold block font-black">en 7 jours</span>
            <span className="sc-serif mt-1 block text-slate-700">sans effort.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-slate-600 sm:text-[16px] sc-fade-up" style={{ animationDelay: '.1s' }}>
            Serum dermatologique contre{' '}
            <span className="font-black text-slate-900">cernes, rides et poches</span>.
            Formule premium, eclat immediat,{' '}
            <span className="bg-gradient-to-r from-amber-500 via-rose-400 to-amber-500 bg-clip-text font-black text-transparent">sans effet secondaire</span>.
          </p>

          {/* IMAGE centrale stackee */}
          <div className="relative mt-8 sc-fade-up" style={{ animationDelay: '.15s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-amber-300/50 via-rose-300/30 to-amber-300/50 blur-3xl"/>
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_70px_-12px_rgba(15,33,55,.25)] ring-1 ring-amber-300/30 sc-bob">
              <LazyImg src={MEDIA.hero} alt="Serum Anti-Cernes" aspect="4/5" priority/>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/20 to-transparent"/>
            </div>

            {/* Badges flottants */}
            <div className="absolute -left-2 top-8 rotate-[-8deg] rounded-sm bg-slate-950 px-3 py-2 text-center shadow-xl sm:-left-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-300">Resultat</p>
              <p className="sc-shimmer-gold text-[16px] font-black leading-tight">7 jours</p>
            </div>
            <div className="absolute -right-2 bottom-8 rotate-[6deg] rounded-sm bg-white px-3 py-2 shadow-xl ring-1 ring-amber-200 sm:-right-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-800">Note clients</p>
              <p className="flex items-center gap-0.5 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 text-[11px] font-black text-slate-900">4.9</span>
              </p>
            </div>
          </div>

          {/* Prix + CTA */}
          <div className="mt-10 sc-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="sc-shimmer-gold text-4xl font-black sm:text-5xl">{fmtNum(orderTotal(PRICES, 1))}</span>
              <span className="text-lg font-bold text-slate-800 sm:text-xl">FCFA</span>
              <span className="text-sm text-slate-400 line-through sm:text-base">{fmt(OLD_PRICE_UNIT)}</span>
              <span className="rounded-sm bg-slate-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">-{DISCOUNT_PCT}%</span>
            </div>

            <div className="mx-auto mt-6 max-w-sm">
              <CTA onClick={() => openModal(1)} variant="navy" size="lg">
                Je commande · {fmt(orderTotal(PRICES, 1))} <Arrow/>
              </CTA>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              🔒 Paiement a la livraison · Sans risque
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 sm:grid-cols-4 sm:gap-3 sm:text-[12px] sc-fade-up" style={{ animationDelay: '.25s' }}>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-amber-200 backdrop-blur-sm"><Check/>Formule douce</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-amber-200 backdrop-blur-sm"><Check/>Sans paraben</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-amber-200 backdrop-blur-sm"><Check/>Livre en 24h</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-amber-200 backdrop-blur-sm"><Check/>Cash livraison</span>
          </div>
        </div>
      </section>

      <GoldDivider/>

      {/* ===== STATS BAR ===== */}
      <section className="bg-white border-y border-amber-100">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:gap-4 sm:py-8">
          {[
            { n: '7 j', l: 'Premiers resultats' },
            { n: '3 500+', l: 'Clientes ravies' },
            { n: '100%', l: 'Dermatologique' },
            { n: '4.9/5', l: 'Note clients' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="sc-shimmer-gold text-[26px] font-black sm:text-[32px]">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC 1 : PROBLEME (img-2)                              */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-[#faf8f5] py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up order-2 md:order-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Le probleme</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Ces</span>
                <span className="block bg-gradient-to-r from-rose-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">cernes fatigues</span>
                <span className="sc-serif block text-slate-700">vous trahissent.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Regard terne, rides marquees, peau gonflee au reveil.
                Vous paraissez plus agee que vous ne l'etes.
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="coral" size="lg" fullWidth={false}>
                  Je veux en finir <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sc-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-rose-300/30 to-orange-300/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-rose-100">
                  <LazyVideo src={MEDIA.problem} aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee avis courts */}
      <Marquee
        variant="navy"
        items={['"Mes cernes ont disparu" - Aminata', '"Ma peau illumine" - Fatou', '"Resultat spectaculaire" - Mariam', '"Je parais 5 ans plus jeune" - Rokia', '"Merci" - Clarisse']}
      />

      {/* ===================================================== */}
      {/* BLOC 2 : SOLUTION (img-3)                              */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-300/40 to-yellow-300/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-amber-100">
                  <LazyImg src={MEDIA.solution} alt="Solution premium" aspect="1/1"/>
                </div>
              </div>
            </div>
            <div className="sc-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">La solution</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Le serum</span>
                <span className="sc-shimmer-gold block">qui efface</span>
                <span className="sc-serif block text-slate-700">vos annees.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Actifs brevetes : acide hyaluronique,
                caffeine pure, peptides anti-age.
                <span className="mt-2 block font-black text-amber-700">Effet immediat. Resultat durable.</span>
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="gold" size="lg" fullWidth={false}>
                  J'essaye maintenant <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GoldDivider/>

      {/* ===================================================== */}
      {/* VIDEO 1 - DEMO                                         */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-slate-950 py-16 sm:py-20">
        <div className="pointer-events-none absolute top-10 left-1/4 h-60 w-60 rounded-full bg-amber-400/20 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute bottom-10 right-1/4 h-60 w-60 rounded-full bg-rose-400/15 blur-3xl sc-float-slow" style={{ animationDelay: '3s' }}/>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Demonstration</span>
          <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
            <span className="sc-serif block">Une goutte</span>
            <span className="sc-shimmer-gold block">change tout.</span>
          </h2>
          <p className="mt-3 text-[13px] text-stone-300 sm:text-[14px]">
            Application simple, absorption immediate.
          </p>

          <div className="mx-auto mt-8 max-w-sm sc-fade-up">
            <LazyVideo src={MEDIA.video1} aspect="9/16"/>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="gold" size="lg">
              Je veux ce resultat <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC 3 : FORMULE (img-4)                               */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-[#faf8f5] py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up order-2 md:order-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Formule exclusive</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Des actifs</span>
                <span className="block bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 bg-clip-text text-transparent">premium</span>
                <span className="sc-serif block text-slate-700">venus du labo.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Caffeine anti-poches. Acide hyaluronique hydrate.
                Vitamine C illumine. Peptides redensifient.
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="navy" size="lg" fullWidth={false}>
                  J'achete la formule <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sc-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-300/40 to-rose-300/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-amber-100">
                  <LazyImg src={MEDIA.formula} alt="Formule premium" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC 4 : ECLAT (img-5)                                 */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-rose-50 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-rose-300/40 to-orange-300/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-rose-100">
                  <LazyImg src={MEDIA.glow} alt="Peau illuminee" aspect="1/1"/>
                </div>
              </div>
            </div>
            <div className="sc-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Eclat retrouve</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Une peau</span>
                <span className="block bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 bg-clip-text text-transparent">illuminee</span>
                <span className="sc-serif block text-slate-700">des le 1er matin.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Eclat naturel, grain de peau lisse,
                teint uniforme. Tout le monde remarque.
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="coral" size="lg" fullWidth={false}>
                  Je veux cet eclat <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* VIDEO 2 - RESULTATS                                    */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up order-2 md:order-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Resultats filmes</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Les clientes</span>
                <span className="sc-shimmer-gold block">temoignent.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Centaines de transformations partagees chaque semaine.
                La preuve en mouvement.
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="gold" size="lg" fullWidth={false}>
                  Je veux essayer <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sc-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative mx-auto max-w-sm">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-400/40 to-rose-300/30 blur-3xl"/>
                <LazyVideo src={MEDIA.video2} aspect="9/16"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GoldDivider/>

      {/* ===================================================== */}
      {/* AVANT / APRES (img-6 + img-7)                          */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-[#faf8f5] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Clientes reelles</span>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              <span className="sc-serif block text-slate-900">Avant</span>
              <span className="text-slate-400 mx-1">→</span>
              <span className="sc-shimmer-gold">Apres 7 jours</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="sc-fade-up group relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-rose-100">
              <LazyImg src={MEDIA.avant} alt="Avant" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300">Avant</p>
                <p className="sc-serif text-2xl text-white">Cernes visibles.</p>
              </div>
            </div>
            <div className="sc-fade-up group relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-amber-100" style={{ animationDelay: '.15s' }}>
              <LazyImg src={MEDIA.apres} alt="Apres" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">Apres 7 jours</p>
                <p className="sc-serif text-2xl text-white">Peau illuminee.</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="navy" size="lg">
              Je veux ce resultat <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===== Marquee avis or ===== */}
      <Marquee
        variant="gold"
        items={['★★★★★ 4.9/5 · 3 500+ avis', '★★★★★ "Transformation" - Aminata', '★★★★★ "Je rajeunis" - Mariam', '★★★★★ "Incroyable" - Fatou', '★★★★★ "Le meilleur serum" - Rokia']}
        speed={24}
      />

      {/* ===================================================== */}
      {/* BLOC ROUTINE (img-8) - 3 etapes                        */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Routine simple</span>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              <span className="sc-serif block text-slate-900">Votre nouveau</span>
              <span className="sc-shimmer-gold">rituel beaute.</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div className="sc-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-300/40 to-rose-300/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-amber-100">
                  <LazyImg src={MEDIA.routine} alt="Routine beaute" aspect="4/3"/>
                </div>
              </div>
            </div>

            <div className="sc-fade-up space-y-3" style={{ animationDelay: '.1s' }}>
              {[
                { n: 'I', t: 'Nettoyer', d: 'Sur peau propre et seche, matin et soir.' },
                { n: 'II', t: 'Appliquer', d: '2-3 gouttes sur le contour de l\'oeil.' },
                { n: 'III', t: 'Masser', d: 'Tapotements doux. Laissez penetrer 1 minute.' },
              ].map((x, i) => (
                <div key={i} className="flex gap-4 rounded-[1.5rem] bg-[#faf8f5] p-4 shadow-md ring-1 ring-amber-100 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 font-black text-amber-300 shadow">
                    {x.n}
                  </div>
                  <div>
                    <h4 className="sc-serif text-lg font-bold text-slate-900">{x.t}</h4>
                    <p className="text-[12px] text-slate-600 sm:text-[13px]">{x.d}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <CTA onClick={() => openModal(1)} variant="gold" size="lg">
                  Commencer mon rituel <Arrow/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* VIDEO 3 - TEMOIGNAGE                                   */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-slate-950 py-16 sm:py-20">
        <div className="pointer-events-none absolute top-10 right-1/4 h-60 w-60 rounded-full bg-rose-400/15 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute bottom-10 left-1/4 h-60 w-60 rounded-full bg-amber-400/20 blur-3xl sc-float-slow" style={{ animationDelay: '3s' }}/>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Temoignage video</span>
          <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
            <span className="sc-serif block">Des</span>
            <span className="sc-shimmer-gold block">transformations</span>
            <span className="sc-serif block">qui inspirent.</span>
          </h2>

          <div className="mx-auto mt-8 max-w-sm sc-fade-up">
            <LazyVideo src={MEDIA.video3} aspect="9/16"/>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="gold" size="lg">
              Je rejoins ces clientes <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* VU DANS - logos presse stylises                        */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-[#faf8f5] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">On en parle</span>
            <h3 className="sc-serif mt-2 text-2xl text-slate-900 sm:text-3xl">Vu dans la presse.</h3>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              { name: 'VOGUE', quote: '"Le serum culte"', stars: 5 },
              { name: 'ELLE', quote: '"Effet immediat"', stars: 5 },
              { name: 'MARIE CLAIRE', quote: '"Revolutionnaire"', stars: 5 },
              { name: 'BIBA', quote: '"A adopter"', stars: 5 },
            ].map((p, i) => (
              <div key={i} className="rounded-[1rem] bg-white p-5 text-center shadow-sm ring-1 ring-amber-100 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <p className="sc-serif text-xl font-bold tracking-[0.2em] text-slate-900">{p.name}</p>
                <div className="mt-2 flex justify-center gap-0.5 text-amber-400">
                  {Array.from({ length: p.stars }).map((_, i) => <Star key={i}/>)}
                </div>
                <p className="sc-serif mt-2 text-[12px] italic text-slate-500">{p.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BUNDLES LUXE - flacons dores synthetiques              */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-slate-950 py-16 sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-400/30 blur-3xl"/>
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-sm bg-amber-400 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 shadow-lg">
              Coffret exclusif
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
              <span className="sc-serif block">Choisissez votre</span>
              <span className="sc-shimmer-gold block">cure beaute.</span>
            </h2>
            <p className="mt-2 text-[13px] text-stone-400 sm:text-[14px]">
              Plus de jours · <span className="font-black text-amber-400">plus d'economies</span>.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
            {[
              {
                qty: 1, label: '1 flacon', desc: 'Decouvrir',
                price: orderTotal(PRICES, 1), oldPrice: OLD_PRICE_UNIT,
                tag: '', saveLabel: 'Pour tester',
                accent: 'from-stone-300 to-stone-500',
                bg: 'from-stone-800 to-stone-900',
                ring: 'ring-1 ring-stone-700',
              },
              {
                qty: 2, label: '2 flacons', desc: 'Cure complete',
                price: orderTotal(PRICES, 2), oldPrice: OLD_PRICE_UNIT * 2,
                tag: 'POPULAIRE', saveLabel: fmtSave(OLD_PRICE_UNIT * 2 - PRICES[2]),
                accent: 'from-amber-300 via-yellow-300 to-amber-400',
                bg: 'from-amber-950 to-yellow-950',
                ring: 'ring-2 ring-amber-400',
              },
              {
                qty: 3, label: '3 flacons', desc: 'Coffret premium',
                price: orderTotal(PRICES, 3), oldPrice: OLD_PRICE_UNIT * 3,
                tag: 'MEILLEURE OFFRE', saveLabel: fmtSave(OLD_PRICE_UNIT * 3 - PRICES[3]),
                accent: 'from-rose-300 via-pink-300 to-amber-300',
                bg: 'from-rose-950 to-amber-950',
                ring: 'ring-2 ring-rose-300',
              },
            ].map((b) => (
              <button
                key={b.qty}
                onClick={() => openModal(b.qty)}
                className={`group relative overflow-hidden rounded-[1.5rem] bg-slate-900/80 p-3 text-left shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-4 ${b.ring} ${b.qty === 2 ? 'sm:scale-[1.04]' : ''}`}
              >
                {b.tag && (
                  <span className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-sm bg-gradient-to-r ${b.accent} px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-lg animate-pulse sm:text-[10px]`}>
                    {b.qty === 2 ? '◆' : '♛'} {b.tag}
                  </span>
                )}

                <div className={`pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br ${b.accent} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30`}/>

                {/* Flacons dores synthetiques */}
                <div className={`relative flex aspect-square items-end justify-center overflow-hidden rounded-xl bg-gradient-to-br ${b.bg}`}>
                  <div className="pointer-events-none absolute left-4 top-4 h-4 w-4 rounded-full bg-amber-400/30 blur-sm sc-float"/>
                  <div className="pointer-events-none absolute right-6 top-10 h-3 w-3 rounded-full bg-rose-300/40 blur-sm sc-float" style={{ animationDelay: '.5s' }}/>

                  <div className="flex items-end gap-1.5 pb-4">
                    {Array.from({ length: b.qty }).map((_, i) => (
                      <div
                        key={i}
                        className="relative flex flex-col items-center"
                        style={{ transform: `translateY(${Math.abs(i - (b.qty - 1) / 2) * 2}px)` }}
                      >
                        {/* Cap dore */}
                        <div className={`h-2 w-4 rounded-t-sm bg-gradient-to-b ${b.accent} sm:h-3 sm:w-5`}/>
                        {/* Col */}
                        <div className="h-1 w-3 bg-slate-700 sm:w-4"/>
                        {/* Flacon */}
                        <div className={`h-20 w-8 rounded-md bg-gradient-to-b ${b.accent} shadow-xl sm:h-24 sm:w-10`}>
                          <div className="mx-auto mt-3 h-0.5 w-6 rounded-full bg-white/50 sm:mt-4"/>
                          <p className="mt-10 text-center text-[6px] font-black uppercase tracking-[0.2em] text-slate-900/70 sm:mt-12 sm:text-[7px]">serum</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white font-black shadow-lg ring-2 ring-white/90 sm:h-12 sm:w-12">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[18px] text-transparent sm:text-[20px]`}>×{b.qty}</span>
                  </div>
                </div>

                <div className="relative mt-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-stone-400">{b.label}</p>
                  <p className="text-[10px] font-bold text-stone-500">{b.desc}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[22px] font-black text-transparent sm:text-[26px]`}>
                      {fmt(b.price)}
                    </span>
                    <span className="text-[11px] text-stone-500 line-through sm:text-[12px]">{fmt(b.oldPrice)}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-amber-300 sm:text-[12px]">{b.saveLabel}</p>

                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${b.accent} px-4 py-2 text-[12px] font-black uppercase tracking-wider text-slate-900 shadow-md transition-transform group-hover:scale-105 sm:text-[13px]`}>
                    Je commande <Arrow/>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-stone-400">
            Paiement a la livraison
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* MID-CTA + stock bar                                    */}
      {/* ===================================================== */}
      <section className="sc-cv bg-white py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold sm:text-[12px]">
            <span className="text-slate-500">Disponible ce jour</span>
            <span className="inline-flex items-center gap-1 text-rose-600">
              <span>🔥</span> {stock} restants
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 transition-all duration-500"
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <div className="mt-6">
            <CTA onClick={() => openModal(1)} variant="navy" size="lg">
              Commander maintenant <Arrow/>
            </CTA>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Paiement <span className="font-bold">a la livraison</span>
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* CHAT WHATSAPP + SMS (2 conversations)                  */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-gradient-to-b from-[#e5ddd5] to-[#d9d2c4] py-14 sm:py-20">
        <div className="relative mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-300 shadow-lg">
              Conversations reelles
            </span>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              <span className="sc-serif block text-slate-900">Elles nous</span>
              <span className="sc-shimmer-gold block">remercient</span>
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* WhatsApp */}
            <div className="overflow-hidden rounded-2xl bg-[#ece5dd] shadow-2xl">
              <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 font-black text-slate-900">GS</div>
                <div className="flex-1">
                  <p className="flex items-center gap-2 text-[13px] font-black">
                    GS - Serum Cerne
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35m-5.42 7.4h0a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.23-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 005.69 1.45h0c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 00-3.48-8.41z"/></svg>
                  </p>
                  <p className="text-[10px] text-emerald-300">● en ligne</p>
                </div>
              </div>
              <div className="space-y-2.5 px-3 py-4">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sc-fade-up">
                  <p className="text-[11px] font-black text-amber-700">Aminata K.</p>
                  <p className="mt-0.5 text-[13px] text-slate-800">Bonjour ! 7 jours avec le serum et mes cernes ont presque disparu. Je suis bluffee 🤩</p>
                  <p className="mt-1 text-right text-[9px] text-slate-400">08:23 ✓✓</p>
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.12s' }}>
                  <p className="text-[13px] text-slate-800">Merci Aminata ! Continuez, vous allez voir encore mieux dans 2 semaines 💛</p>
                  <p className="mt-1 text-right text-[9px] text-slate-500">08:25 ✓✓</p>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.24s' }}>
                  <p className="text-[11px] font-black text-rose-600">Mariam D.</p>
                  <p className="mt-0.5 text-[13px] text-slate-800">Je prends le pack 3 flacons pour ma maman et ma soeur. Produit exceptionnel ❤️</p>
                  <p className="mt-1 text-right text-[9px] text-slate-400">14:08</p>
                </div>
              </div>
            </div>

            {/* SMS */}
            <div className="overflow-hidden rounded-2xl bg-stone-100 shadow-2xl">
              <div className="flex items-center gap-3 bg-slate-950 px-4 py-3 text-white">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 4l-6 3.75L6 8V6l6 3.75L18 6v2z"/></svg>
                <div className="flex-1">
                  <p className="text-[13px] font-black">Messages</p>
                  <p className="text-[10px] text-amber-300">+225 07 XX XX XX XX</p>
                </div>
                <span className="rounded-sm bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase text-slate-900">SMS</span>
              </div>
              <div className="space-y-2.5 px-3 py-4">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sc-fade-up">
                  <p className="text-[11px] font-black text-slate-900">Fatou S.</p>
                  <p className="mt-0.5 text-[13px] text-slate-800">bonjour jai commande le serum hier jai recu aujourdhui livraison rapide</p>
                  <p className="mt-1 text-right text-[9px] text-slate-400">09:47 · Remis</p>
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-amber-300 to-yellow-300 px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.12s' }}>
                  <p className="text-[13px] font-medium text-slate-900">Parfait Fatou ! Appliquez matin et soir pendant 7 jours. Vous verrez la difference ✨</p>
                  <p className="mt-1 text-right text-[9px] text-slate-800/70">09:48 · Remis</p>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.24s' }}>
                  <p className="text-[11px] font-black text-slate-900">Rokia B.</p>
                  <p className="mt-0.5 text-[13px] text-slate-800">Incroyable ! Je parais 5 ans plus jeune. Mes collegues n'en reviennent pas 👏</p>
                  <p className="mt-1 text-right text-[9px] text-slate-400">16:32 · Remis</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-md">
            <CTA onClick={() => openModal(1)} variant="gold" size="lg">
              Moi aussi je commande <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* GRILLE 6 AVIS ETOILES                                  */}
      {/* ===================================================== */}
      <section className="sc-cv bg-white py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-sm bg-amber-400 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 shadow">
              3 500+ avis verifies
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              <span className="sc-serif block text-slate-900">Elles en parlent</span>
              <span className="sc-shimmer-gold block">avec emotion.</span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { n: 'Aminata K.', v: 'Abidjan',   s: 5, t: 'Je suis metamorphosee. Mes cernes, disparus. Ma peau, illuminee. 7 jours seulement.' },
              { n: 'Mariam D.',  v: 'Yopougon',  s: 5, t: 'Je doutais. Mes rides d\'expression se sont lissees. Mon mari a remarque tout de suite.' },
              { n: 'Fatou S.',   v: 'Bouake',    s: 5, t: 'Livraison rapide, packaging luxe. Et surtout ca marche vraiment. Je recommande.' },
              { n: 'Rokia B.',   v: 'Daloa',     s: 5, t: 'Mes collegues me demandent ce que je fais. Je leur dis que c\'est ce serum.' },
              { n: 'Clarisse T.',v: 'San Pedro', s: 4, t: 'Tres bon produit. Les resultats sont la au bout d\'une semaine. Je suis satisfaite.' },
              { n: 'Awa M.',     v: 'Korhogo',   s: 5, t: 'J\'ai essaye beaucoup de serums. Celui-ci est de loin le meilleur. Illumination incroyable.' },
            ].map((r, i) => (
              <div key={i} className="rounded-[1.2rem] bg-gradient-to-br from-amber-50/40 to-white p-4 shadow-sm ring-1 ring-amber-100 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:ring-amber-300">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-sm font-black text-slate-900 shadow">
                    {r.n.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[13px] font-black">{r.n}</p>
                    <p className="text-[10px] text-slate-500">{r.v}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: r.s }).map((_, i) => <Star key={i}/>)}
                    {Array.from({ length: 5 - r.s }).map((_, i) => <Star key={i} className="text-stone-300"/>)}
                  </div>
                </div>
                <p className="sc-serif mt-3 text-[14px] italic leading-relaxed text-slate-700">« {r.t} »</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC ENGAGEMENT (img-9)                                */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-rose-50 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up order-2 md:order-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Notre engagement</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Satisfaction</span>
                <span className="sc-shimmer-gold block">garantie.</span>
              </h2>
              <ul className="mt-5 space-y-2.5 text-[13px] sm:text-[14px]">
                {[
                  'Formule dermatologique brevetee · actifs premium',
                  'Testee et approuvee par 3 500+ clientes',
                  'Sans paraben · sans effet secondaire',
                  'Livraison 24h a Abidjan · 48h regions',
                  'Paiement uniquement a la livraison',
                ].map((x, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-amber-300 shadow">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="gold" size="lg" fullWidth={false}>
                  J'achete sans risque <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sc-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-300/40 to-rose-300/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-amber-100">
                  <LazyVideo src={MEDIA.engagement} aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FAQ                                                    */}
      {/* ===================================================== */}
      <section className="sc-cv bg-[#faf8f5] py-14 sm:py-18">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              <span className="sc-serif block text-slate-900">Vos</span>
              <span className="sc-shimmer-gold block">questions.</span>
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'En combien de temps voit-on les resultats ?', a: 'Premiers effets des le 3e-4e jour. Resultat visible spectaculaire en 7 a 14 jours d\'application matin et soir.' },
              { q: 'Le serum convient-il a ma peau ?',            a: 'Oui. Formule dermatologique douce, convient a tous les types de peau, meme sensibles. Sans paraben ni substance irritante.' },
              { q: 'Y a-t-il des effets secondaires ?',           a: 'Non. Aucun effet secondaire. Produit teste et approuve dermatologiquement. Usage externe, contour des yeux uniquement.' },
              { q: 'Je paie quand ?',                             a: 'A la livraison. Vous recevez le produit, vous verifiez, puis vous payez. Zero risque.' },
              { q: 'Livre ou ?',                                  a: 'Partout en Cote d\'Ivoire. 24h Abidjan, 48h regions. Livraison gratuite.' },
              { q: 'A quel age puis-je l\'utiliser ?',            a: 'A partir de 25 ans pour la prevention, et jusqu\'a tout age pour traiter cernes, poches et rides.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-[1rem] bg-white shadow-sm ring-1 ring-amber-100 transition-all open:shadow-lg open:ring-amber-300">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-slate-900 sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="sc-chev h-5 w-5 text-amber-500 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BANNIERE FINALE avec fond video opacifie               */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden py-16 sm:py-24">
        <video src={MEDIA.engagement} autoPlay loop muted playsInline aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"/>
        <div className="pointer-events-none absolute inset-0 bg-slate-950/85"/>
        <div className="pointer-events-none absolute left-10 top-10 h-32 w-32 rounded-full bg-amber-400/30 blur-2xl sc-float-slow"/>
        <div className="pointer-events-none absolute right-10 bottom-10 h-40 w-40 rounded-full bg-rose-400/25 blur-3xl sc-float-slow" style={{ animationDelay: '2s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-amber-300">Derniere chance</span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            <span className="sc-serif block">Rajeunissez</span>
            <span className="sc-shimmer-gold block">maintenant.</span>
          </h2>
          <p className="mt-4 text-[14px] text-stone-300 sm:text-[16px]">
            Serum Anti-Cernes Premium · {fmt(orderTotal(PRICES, 1))} · Paiement a la livraison
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="gold" size="lg">
              Je commande maintenant
            </CTA>
          </div>
          <p className="mt-3 text-[12px] text-stone-400">
            🔒 Paiement a la livraison · Sans risque
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-950 py-8 text-center text-[11px] text-amber-200/60">
        <p>© 2026 · Cote d`Ivoire · GS Pipeline · Tous droits reserves</p>
        <p className="mt-1">Service client 7j/7 · Livraison Abidjan 24h · Paiement a la livraison</p>
      </footer>

      {/* ===== STICKY BOTTOM BAR ===== */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-amber-400/30 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,.1)] backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="pointer-events-none flex items-center gap-2.5 sm:gap-3">
            <img src={MEDIA.hero} alt="" className="h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-amber-300 sm:h-12 sm:w-12"/>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black text-slate-900 sm:text-[13px]">Serum Anti-Cernes</p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span className="font-bold text-amber-700">{fmt(orderTotal(PRICES, 1))}</span>
                <span className="text-slate-400">·</span>
                <span className="inline-flex items-center gap-0.5 font-mono font-bold text-rose-500">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"/>
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => openModal(1)}
            className="pointer-events-auto sc-cta relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-black uppercase tracking-wider text-amber-300 shadow-[0_10px_25px_-4px_rgba(15,33,55,.5)] ring-1 ring-amber-400 transition-transform hover:scale-105 sm:px-6 sm:py-3 sm:text-[14px]"
          >
            <span className="sc-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"/>
            <span className="relative">Commander</span>
            <Arrow/>
          </button>
        </div>
      </div>

      {/* ===== TOAST ===== */}
      {toast && (
        <div className={`fixed bottom-20 left-3 z-40 flex items-center gap-2.5 rounded-[1rem] bg-white px-3.5 py-2.5 shadow-2xl ring-1 ring-amber-100 sm:bottom-24 sm:left-4 ${toast.visible ? 'sc-toast-in' : 'sc-toast-out'}`}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 shadow">
            <Check/>
            <span className="absolute inset-0 rounded-full bg-amber-400/30 sc-pulse-dot"/>
          </div>
          <div>
            <p className="text-[12px] font-black text-slate-900">{toast.n} vient de commander</p>
            <p className="text-[10px] text-slate-500">a {toast.v} · il y a {toast.t}</p>
          </div>
        </div>
      )}

      {/* ===== EXIT POPUP ===== */}
      {exitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-md overflow-hidden rounded-[1.5rem] bg-white shadow-2xl animate-[sc-fade-up_.3s_ease-out]">
            <button
              onClick={() => setExitPopup(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-slate-600 transition hover:bg-stone-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-center text-white">
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-400/30 blur-2xl"/>
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-rose-400/25 blur-2xl"/>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-amber-300">Attendez</span>
              <h3 className="sc-serif mt-3 text-2xl leading-tight">
                Votre peau merite <br/>
                <span className="sc-shimmer-gold">ce serum premium</span>.
              </h3>
              <p className="mt-2 text-[13px] text-stone-300">
                Paiement a la livraison.
              </p>
            </div>

            <div className="px-6 py-5">
              <CTA onClick={() => openModal(1)} variant="gold" size="lg">
                Je commande maintenant
              </CTA>
              <button
                onClick={() => setExitPopup(false)}
                className="mt-2 w-full text-[11px] font-medium text-stone-400 hover:text-slate-700"
              >
                Non merci, je garde mes cernes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ===== */}
      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: 'Serum Anti-Cernes Premium',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID_CAMPAIGN,
          secondaryMetaPixelId: META_PIXEL_ID,
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
