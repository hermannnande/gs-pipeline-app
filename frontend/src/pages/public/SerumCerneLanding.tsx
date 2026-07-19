/**
 * Landing ULTRA PREMIUM — Serum Anti-Cernes (SERUM_CERNE)
 * ==================================================================
 *
 * Palette : NAVY PROFOND + OR CHAMPAGNE + CORAIL CHAUD + IVOIRE DORE (conversion beauty)
 *   - creme-anti-verrue : rouge/orange
 *   - patchdouleurtk    : indigo/violet
 *   - creme-verrue-tk   : bleu + orange
 *   - spraydouleurtk    : lime/noir + jaune
 *   - spraylipome       : pourpre/magenta/or rose
 *   - serum-cerne       : NAVY / OR / CORAIL / IVOIRE (beauty luxe nocturne)
 *
 * Medias juillet 2026 (wp-content/uploads/2026/07/) :
 *   - hero + solution + formule + eclat + avant/apres (6 visuels PNG)
 *   - Dame_applique_serum_anti_age : video application (demo, resultats, engagement)
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
import { getPublicProducts } from '../../utils/publicApi';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface SerumCerneLandingConfig {
  slug: string;
  productCode: string;
  thankYouUrl: string;
  metaPixelIdCampaign: string;
  metaPixelId: string;
  prices: Record<number, number>;
  oldPriceUnit: number;
}

export const SERUM_CERNE_FB_CONFIG: SerumCerneLandingConfig = {
  slug: 'serum-cerne',
  productCode: 'SERUM_CERNE',
  thankYouUrl: '/serum-cerne/merci',
  metaPixelIdCampaign: '1313100454309806',
  metaPixelId: '26809431761984777',
  prices: { 1: 8500, 2: 14100, 3: 20700 },
  oldPriceUnit: 15000,
};

export const SERUM_CERNE_TIKTOK_CONFIG: SerumCerneLandingConfig = {
  slug: 'serum-cerne-tiktok',
  productCode: 'SERUM_CERNE_TIKTOK',
  thankYouUrl: '/serum-cerne-tiktok/merci',
  metaPixelIdCampaign: '',
  metaPixelId: '',
  prices: { 1: 8500, 2: 14100, 3: 20700 },
  oldPriceUnit: 15000,
};

// Medias locaux WebP + MP4 compresses (scripts/compress-serum-cerne.mjs)
const M = '/serum-cerne-media';
const MEDIA = {
  hero:       `${M}/hero.webp`,
  problem:    `${M}/problem.webp`,
  solution:   `${M}/solution.webp`,
  formula:    `${M}/formula.webp`,
  glow:       `${M}/glow.webp`,
  avant:      `${M}/avant.webp`,
  apres:      `${M}/apres.webp`,
  routine:    `${M}/solution.webp`,
  videoApp:   `${M}/video-app.mp4`,
  videoPoster:`${M}/video-app-poster.webp`,
  video1:     `${M}/video-app.mp4`,
  video2:     `${M}/video-app.mp4`,
  video3:     `${M}/video-app.mp4`,
  engagement: `${M}/video-app.mp4`,
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

function LazyVideo({ src, aspect = '9/16', poster }: { src: string; aspect?: string; poster?: string }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-3xl border border-[#E8C547]/35 bg-[#0C1829] shadow-[0_20px_60px_-12px_rgba(201,162,39,.4)]"
      style={{ aspectRatio: aspect }}
    >
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : poster ? (
        <img src={poster} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover"/>
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
  <svg className="h-4 w-4 shrink-0 text-[#C9A227]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
      <span className="h-px w-20 bg-gradient-to-r from-transparent via-[#E8C547]/60 to-[#C9A227]"/>
      <svg className="mx-3 h-4 w-4 rotate-45 text-[#C9A227]" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2L18 10L10 18L2 10Z" opacity="0.5"/>
        <path d="M10 5L15 10L10 15L5 10Z"/>
      </svg>
      <span className="h-px w-20 bg-gradient-to-l from-transparent via-[#E8C547]/60 to-[#C9A227]"/>
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
    gold:   'from-[#C9A227] via-[#E8C547] to-[#D4A82A]',
    coral:  'from-[#D94A5F] via-[#FF5C72] to-[#FF8A9B]',
    navy:   'from-[#0C1829] via-[#152A45] to-[#1E3A5F]',
    cream:  'from-[#FDF6EE] via-[#FBF0E4] to-[#FDF6EE]',
  };
  const glows: Record<string, string> = {
    gold:   'shadow-[0_10px_32px_-4px_rgba(201,162,39,.65)] hover:shadow-[0_18px_44px_-4px_rgba(232,197,71,.85)]',
    coral:  'shadow-[0_10px_32px_-4px_rgba(217,74,95,.55)] hover:shadow-[0_18px_44px_-4px_rgba(255,92,114,.75)]',
    navy:   'shadow-[0_10px_32px_-4px_rgba(12,24,41,.6)] hover:shadow-[0_18px_44px_-4px_rgba(21,42,69,.8)] ring-1 ring-[#E8C547]/70',
    cream:  'shadow-[0_10px_30px_-4px_rgba(0,0,0,.12)] hover:shadow-[0_16px_40px_-4px_rgba(0,0,0,.2)] ring-1 ring-[#E8C547]/40',
  };
  const textColor = variant === 'navy' ? 'text-[#F0D78C]' : variant === 'coral' ? 'text-white' : 'text-[#1A1208]';
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
    gold:  'bg-gradient-to-r from-[#C9A227] via-[#E8C547] to-[#C9A227] text-[#1A1208] border-y-2 border-[#1A1208]/10',
    navy:  'bg-gradient-to-r from-[#0C1829] via-[#152A45] to-[#0C1829] text-[#F0D78C] border-y border-[#E8C547]/25',
    cream: 'bg-gradient-to-r from-[#FDF6EE] via-[#FBF0E4] to-[#FDF6EE] text-[#1A2B4A] border-y border-[#E8C547]/30',
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
export function SerumCerneLandingPage({ config }: { config: SerumCerneLandingConfig }) {
  const SLUG = config.slug;
  const PRODUCT_CODE = config.productCode;
  const THANK_YOU_URL = config.thankYouUrl;
  const META_PIXEL_ID_CAMPAIGN = config.metaPixelIdCampaign;
  const META_PIXEL_ID = config.metaPixelId;
  const META_PIXEL_IDS = [META_PIXEL_ID_CAMPAIGN, META_PIXEL_ID].filter(Boolean);
  const PRICES = config.prices;
  const OLD_PRICE_UNIT = config.oldPriceUnit;
  const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
  const DISCOUNT_PCT = Math.round((1 - PRICES[1] / OLD_PRICE_UNIT) * 100);
  const QTY_OPTS = [
    { v: 1, label: '1 flacon', sub: packLabel(PRICES, 1, 'FCFA') },
    { v: 2, label: '2 flacons', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Populaire', save: 'Economisez 2 900 F' },
    { v: 3, label: '3 flacons', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
  ];

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

  // Preload hero image uniquement (video lazy + poster)
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
    if (META_PIXEL_IDS.length) {
      initMetaPixels(META_PIXEL_IDS);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Serum Anti-Cernes Premium',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
        currency: 'XOF',
      });
    }
  }, [company, SLUG, PRODUCT_CODE, PRICES, META_PIXEL_IDS]);

  useEffect(() => {
    getPublicProducts(company)
      .then(products => {
        const p = products.find((p: Product) => p.code?.toUpperCase() === PRODUCT_CODE);
        if (p) setProduct(p);
      }).catch(() => {});
  }, [company, PRODUCT_CODE]);

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
    <div className="min-h-screen bg-[#FDF6EE] text-[#1A2B4A]" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
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
          background: linear-gradient(90deg, #B8922A 0%, #E8C547 20%, #F5E6A3 40%, #FFF8E7 55%, #E8C547 70%, #C9A227 85%, #B8922A 100%);
          background-size: 220% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: sc-shimmer 3s linear infinite;
        }
        .sc-gradient-coral {
          background: linear-gradient(135deg, #D94A5F 0%, #FF5C72 45%, #FF8A9B 100%);
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
        }
        .sc-gradient-gold {
          background: linear-gradient(135deg, #B8922A 0%, #E8C547 50%, #C9A227 100%);
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
        }
        .sc-gradient-dual {
          background: linear-gradient(135deg, #0C1829 0%, #D94A5F 35%, #C9A227 65%, #FF8A9B 100%);
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
        }
        .sc-gradient-rose {
          background: linear-gradient(135deg, #D94A5F 0%, #FF6B7A 50%, #FF8A9B 100%);
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
        }
        .sc-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500 }
        .sc-texture {
          background-image:
            radial-gradient(ellipse 80% 60% at 15% 20%, rgba(232,197,71,.10) 0, transparent 55%),
            radial-gradient(ellipse 70% 50% at 85% 75%, rgba(255,92,114,.08) 0, transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(201,162,39,.06) 0, transparent 45%);
        }
        .sc-navy-section {
          background: linear-gradient(145deg, #0C1829 0%, #112035 40%, #1A2F4A 100%);
        }
        .sc-cv { content-visibility: auto; contain-intrinsic-size: 0 800px }
        details[open] summary .sc-chev { transform: rotate(180deg) }
      `}</style>

      {/* Import serif font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"/>

      {/* ===== STICKY TOP BAR - navy + or ===== */}
      <div className="sticky top-0 z-50 border-b border-[#E8C547]/35 bg-gradient-to-r from-[#0C1829] via-[#152A45] to-[#0C1829]">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-3 py-2 sm:gap-3">
          <span className="relative flex h-2 w-2 text-[#FF6B7A] sc-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B7A]"/>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-100 sm:text-[11px]">
            <span className="sc-shimmer-gold">Offre exclusive</span> · fin
          </span>
          <div className="flex items-center gap-1">
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] font-bold text-[#E8C547]/70">:</span>}
                <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-sm bg-[#E8C547]/15 px-1.5 font-mono text-[12px] font-black tabular-nums text-[#F0D78C] ring-1 ring-[#E8C547]/35 sm:h-7 sm:min-w-[32px] sm:text-[13px]">
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
        items={['Serum Anti-Cernes Clinique', 'Regard rajeuni en 7 jours', 'Formule dermatologique certifiee', 'Zero paraben · Zero risque', 'Livraison express 24h', 'Paiement securise a la livraison']}
      />

      {/* ===================================================== */}
      {/* HERO STACKE : titre -> image -> CTA (demande user)    */}
      {/* Fond IVOIRE avec glows or/corail                       */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-[#FDF6EE] sc-texture">
        <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-[#E8C547]/25 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#FF6B7A]/20 blur-3xl sc-float-slow" style={{ animationDelay: '2s' }}/>
        <div className="pointer-events-none absolute top-1/3 right-10 h-48 w-48 rounded-full bg-[#F0D78C]/35 blur-3xl sc-float-slow" style={{ animationDelay: '4s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-4 text-center sm:pt-6 md:pt-8">
          {/* IMAGE hero — premier plan a l'arrivee */}
          <div className="relative sc-fade-up">
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#E8C547]/45 via-[#FF8A9B]/25 to-[#E8C547]/45 blur-3xl"/>
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_70px_-12px_rgba(12,24,41,.28)] ring-1 ring-[#E8C547]/40 sc-bob">
              <LazyImg src={MEDIA.hero} alt="Serum Anti-Cernes Premium" aspect="4/5" priority/>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0C1829]/25 to-transparent"/>
            </div>

            <div className="absolute -left-2 top-8 rotate-[-8deg] rounded-sm bg-gradient-to-br from-[#0C1829] to-[#1A2F4A] px-3 py-2 text-center shadow-xl sm:-left-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#F0D78C]">Visible des</p>
              <p className="sc-shimmer-gold text-[16px] font-black leading-tight">J+3</p>
            </div>
            <div className="absolute -right-2 bottom-8 rotate-[6deg] rounded-sm bg-white px-3 py-2 shadow-xl ring-1 ring-[#E8C547]/50 sm:-right-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#1A2B4A]">Note clients</p>
              <p className="flex items-center gap-0.5 text-[#C9A227]">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 text-[11px] font-black text-[#0C1829]">4.9</span>
              </p>
            </div>
          </div>

          <div className="mt-6 sc-fade-up" style={{ animationDelay: '.05s' }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E8C547]/50 bg-white/70 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#8B6914] shadow-sm backdrop-blur-sm sm:text-[11px]">
              <span className="h-1 w-1 rounded-full bg-[#C9A227]"/>
              Formule anti-age 2026
              <span className="h-1 w-1 rounded-full bg-[#C9A227]"/>
            </span>
          </div>

          <h1 className="mt-5 text-[40px] leading-[1.05] tracking-tight sm:text-[56px] md:text-[68px] sc-fade-up" style={{ animationDelay: '.1s' }}>
            <span className="sc-serif block text-[#0C1829]">Un regard</span>
            <span className="sc-gradient-dual block font-black">10 ans plus jeune</span>
            <span className="sc-serif mt-1 block text-[#2A3F5F]">en une semaine.</span>
          </h1>

          {/* VIDEO application — mise en avant */}
          <div className="relative mx-auto mt-8 max-w-sm sc-fade-up" style={{ animationDelay: '.18s' }}>
            <div className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#E8C547]/35 via-[#FF6B7A]/20 to-[#E8C547]/35 blur-2xl"/>
            <div className="relative overflow-hidden rounded-[1.75rem] shadow-[0_20px_50px_-12px_rgba(12,24,41,.35)] ring-2 ring-[#E8C547]/40">
              <LazyVideo src={MEDIA.videoApp} poster={MEDIA.videoPoster} aspect="9/16"/>
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-[#0C1829]/60 to-transparent p-4 text-left">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F0D78C]">Application reelle</p>
                <p className="sc-serif text-[15px] text-white">30 secondes suffisent.</p>
              </div>
            </div>
          </div>

          {/* Prix + CTA */}
          <div className="mt-10 sc-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="sc-shimmer-gold text-4xl font-black sm:text-5xl">{fmtNum(orderTotal(PRICES, 1))}</span>
              <span className="text-lg font-bold text-[#1A2B4A] sm:text-xl">FCFA</span>
              <span className="text-sm text-slate-400 line-through sm:text-base">{fmt(OLD_PRICE_UNIT)}</span>
              <span className="rounded-sm bg-gradient-to-r from-[#D94A5F] to-[#FF5C72] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-md">-{DISCOUNT_PCT}%</span>
            </div>

            <div className="mx-auto mt-6 max-w-sm">
              <CTA onClick={() => openModal(1)} variant="coral" size="lg">
                Je commande · {fmt(orderTotal(PRICES, 1))} <Arrow/>
              </CTA>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              🔒 Paiement a la livraison · Sans risque
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#2A3F5F] sm:grid-cols-4 sm:gap-3 sm:text-[12px] sc-fade-up" style={{ animationDelay: '.25s' }}>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-[#E8C547]/40 backdrop-blur-sm"><Check/>Formule douce</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-[#E8C547]/40 backdrop-blur-sm"><Check/>Sans paraben</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-[#E8C547]/40 backdrop-blur-sm"><Check/>Livre en 24h</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-[#E8C547]/40 backdrop-blur-sm"><Check/>Cash livraison</span>
          </div>
        </div>
      </section>

      <GoldDivider/>

      {/* ===== STATS BAR ===== */}
      <section className="bg-gradient-to-r from-white via-[#FDF6EE] to-white border-y border-[#E8C547]/25">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:gap-4 sm:py-8">
          {[
            { n: '7 j', l: 'Transformation visible' },
            { n: '3 500+', l: 'Femmes conquises' },
            { n: '100%', l: 'Actifs certifies' },
            { n: '4.9/5', l: 'Satisfaction client' },
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
      <section className="sc-cv relative overflow-hidden bg-[#FDF6EE] py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up order-2 md:order-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#D94A5F]">Le constat</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Votre regard</span>
                <span className="block sc-gradient-rose">trahit votre fatigue</span>
                <span className="sc-serif block text-slate-700">chaque matin.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Cernes marques, teint terne, poches au reveil…
                <span className="mt-2 block font-semibold text-[#1A2B4A]">Vous meritez un soin digne des instituts de beaute — sans quitter votre domicile.</span>
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="coral" size="lg" fullWidth={false}>
                  Je reprends le controle <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sc-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#FF6B7A]/30 via-[#FF8A9B]/20 to-[#E8C547]/25 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-rose-100">
                  <LazyImg src={MEDIA.problem} alt="Cernes et fatigue visible" aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee avis courts */}
      <Marquee
        variant="navy"
        items={['"Mon regard a change" - Aminata', '"Resultat des le 3e jour" - Fatou', '"Le meilleur investissement beaute" - Mariam', '"Je me sens confiante" - Rokia', '"Livraison ultra rapide" - Clarisse']}
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
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#8B6914]">La reponse scientifique</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Le serum qui</span>
                <span className="sc-shimmer-gold block">reactive</span>
                <span className="sc-serif block text-slate-700">votre eclat naturel.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Concentration optimale d&apos;acide hyaluronique, caffeine pure et peptides anti-age.
                <span className="mt-2 block font-black sc-gradient-dual">Penetration rapide · Action ciblee · Zero residue gras.</span>
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="gold" size="lg" fullWidth={false}>
                  Decouvrir la formule <Arrow/>
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
      <section className="sc-cv relative overflow-hidden sc-navy-section py-16 sm:py-20">
        <div className="pointer-events-none absolute top-10 left-1/4 h-60 w-60 rounded-full bg-[#E8C547]/20 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute bottom-10 right-1/4 h-60 w-60 rounded-full bg-[#FF6B7A]/15 blur-3xl sc-float-slow" style={{ animationDelay: '3s' }}/>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#E8C547]">Geste beaute</span>
          <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
            <span className="sc-serif block">Regardez</span>
            <span className="sc-gradient-dual block">comment l&apos;appliquer</span>
          </h2>
          <p className="mt-3 text-[13px] text-stone-300 sm:text-[14px]">
            Technique professionnelle en 30 secondes. Absorption instantanee, fini veloute.
          </p>

          <div className="mx-auto mt-8 max-w-sm sc-fade-up">
            <LazyVideo src={MEDIA.videoApp} poster={MEDIA.videoPoster} aspect="9/16"/>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="gold" size="lg">
              Je veux ce geste beaute <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC 3 : FORMULE (img-4)                               */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-[#FDF6EE] py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up order-2 md:order-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#8B6914]">Laboratoire certifie</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Une formule</span>
                <span className="block sc-gradient-gold">clinique</span>
                <span className="sc-serif block text-slate-700">pensee pour vos yeux.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Caffeine drainante · Acide hyaluronique repulpant · Vitamine C eclaircissante · Peptides restructurants.
                <span className="mt-2 block font-semibold text-[#1A2B4A]">Testee dermatologiquement. Convient aux peaux sensibles.</span>
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="navy" size="lg" fullWidth={false}>
                  Commander la formule <Arrow/>
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
      <section className="sc-cv relative overflow-hidden bg-gradient-to-br from-[#FBF0E4] via-white to-[#FFF0F2] py-14 sm:py-18">
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
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#D94A5F]">Eclat premium</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Un teint</span>
                <span className="block sc-gradient-dual">lumineux et repose</span>
                <span className="sc-serif block text-slate-700">des le reveil.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Grain de peau affine, cernes estompes, regard frais et jeune.
                <span className="mt-2 block font-black sc-gradient-coral">L&apos;effet « bonne nuit de sommeil » — chaque jour.</span>
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="coral" size="lg" fullWidth={false}>
                  Reveler mon eclat <Arrow/>
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
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#8B6914]">Preuve en video</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Elles l&apos;appliquent,</span>
                <span className="sc-shimmer-gold block">elles adorent.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Gestuelle simple, texture legere, resultat visible.
                <span className="mt-2 block font-semibold text-[#1A2B4A]">Des milliers de femmes en Cote d&apos;Ivoire l&apos;ont deja adopte.</span>
              </p>
              <div className="mt-6">
                <CTA onClick={() => openModal(1)} variant="gold" size="lg" fullWidth={false}>
                  Essayer comme elles <Arrow/>
                </CTA>
              </div>
            </div>
            <div className="order-1 sc-fade-up md:order-2" style={{ animationDelay: '.1s' }}>
              <div className="relative mx-auto max-w-sm">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-400/40 to-rose-300/30 blur-3xl"/>
                <LazyVideo src={MEDIA.videoApp} poster={MEDIA.videoPoster} aspect="9/16"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GoldDivider/>

      {/* ===================================================== */}
      {/* AVANT / APRES (img-6 + img-7)                          */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-[#FDF6EE] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#8B6914]">Resultats authentiques</span>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              <span className="sc-serif block text-slate-900">Avant</span>
              <span className="text-slate-400 mx-1">→</span>
              <span className="sc-gradient-dual">Apres 7 jours</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[13px] text-slate-600 sm:text-[14px]">
              Transformation reelle, sans filtre. <span className="font-bold sc-gradient-coral">Votre tour maintenant.</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="sc-fade-up group relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-rose-100">
              <LazyImg src={MEDIA.avant} alt="Avant traitement" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300">Avant</p>
                <p className="sc-serif text-2xl text-white">Regard fatigue.</p>
              </div>
            </div>
            <div className="sc-fade-up group relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-amber-100" style={{ animationDelay: '.15s' }}>
              <LazyImg src={MEDIA.apres} alt="Apres 7 jours" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">Apres 7 jours</p>
                <p className="sc-serif text-2xl text-white">Regard rajeuni.</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="coral" size="lg">
              Obtenir ce resultat <Arrow/>
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
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#8B6914]">Rituel 3 etapes</span>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              <span className="sc-serif block text-slate-900">Votre routine</span>
              <span className="sc-gradient-dual">anti-age express.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-slate-600">Moins de 2 minutes, matin et soir. <span className="font-bold sc-gradient-gold">Resultats cumulatifs.</span></p>
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
                { n: 'I', t: 'Preparer', d: 'Nettoyez le visage. Sechez delicatement le contour des yeux.' },
                { n: 'II', t: 'Appliquer', d: '2 a 3 gouttes sur l\'anneau. Tapotez du coin interne vers l\'externe.' },
                { n: 'III', t: 'Activer', d: 'Laissez penetrer 60 secondes. Admirez l\'eclat immediat.' },
              ].map((x, i) => (
                <div key={i} className="flex gap-4 rounded-[1.5rem] bg-[#FDF6EE] p-4 shadow-md ring-1 ring-amber-100 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0C1829] to-[#1A2F4A] font-black text-[#F0D78C] shadow">
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
      <section className="sc-cv relative overflow-hidden sc-navy-section py-16 sm:py-20">
        <div className="pointer-events-none absolute top-10 right-1/4 h-60 w-60 rounded-full bg-[#FF6B7A]/15 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute bottom-10 left-1/4 h-60 w-60 rounded-full bg-[#E8C547]/20 blur-3xl sc-float-slow" style={{ animationDelay: '3s' }}/>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#E8C547]">Experience client</span>
          <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
            <span className="sc-serif block">Elles ont</span>
            <span className="sc-gradient-dual block">transforme leur regard</span>
          </h2>
          <p className="mt-3 text-[13px] text-stone-300 sm:text-[14px]">
            Application quotidienne, resultats progressifs et durables.
          </p>

          <div className="mx-auto mt-8 max-w-sm sc-fade-up">
            <LazyVideo src={MEDIA.videoApp} poster={MEDIA.videoPoster} aspect="9/16"/>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="gold" size="lg">
              Rejoindre le mouvement <Arrow/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* VU DANS - logos presse stylises                        */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-[#FDF6EE] py-14">
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
      <section className="sc-cv relative overflow-hidden sc-navy-section py-16 sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-[#E8C547]/25 blur-3xl"/>
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-sm bg-gradient-to-r from-[#C9A227] via-[#E8C547] to-[#C9A227] px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1208] shadow-lg">
              Coffret exclusif
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
              <span className="sc-serif block">Investissez dans</span>
              <span className="sc-shimmer-gold block">votre beaute.</span>
            </h2>
            <p className="mt-2 text-[13px] text-stone-400 sm:text-[14px]">
              Plus vous commandez, <span className="font-black text-[#E8C547]">plus vous economisez</span> sur votre cure.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
            {[
              {
                qty: 1, label: '1 flacon', desc: 'Decouvrir',
                price: orderTotal(PRICES, 1), oldPrice: OLD_PRICE_UNIT,
                tag: '', saveLabel: 'Pour tester',
                accent: 'from-[#6B7280] to-[#9CA3AF]',
                bg: 'from-[#1F2937] to-[#111827]',
                ring: 'ring-1 ring-stone-600',
              },
              {
                qty: 2, label: '2 flacons', desc: 'Cure complete',
                price: orderTotal(PRICES, 2), oldPrice: OLD_PRICE_UNIT * 2,
                tag: 'POPULAIRE', saveLabel: fmtSave(OLD_PRICE_UNIT * 2 - PRICES[2]),
                accent: 'from-[#C9A227] via-[#E8C547] to-[#D4A82A]',
                bg: 'from-[#1A1508] to-[#2D2208]',
                ring: 'ring-2 ring-[#E8C547]',
              },
              {
                qty: 3, label: '3 flacons', desc: 'Coffret premium',
                price: orderTotal(PRICES, 3), oldPrice: OLD_PRICE_UNIT * 3,
                tag: 'MEILLEURE OFFRE', saveLabel: fmtSave(OLD_PRICE_UNIT * 3 - PRICES[3]),
                accent: 'from-[#D94A5F] via-[#FF6B7A] to-[#E8C547]',
                bg: 'from-[#1A0A10] to-[#2D1810]',
                ring: 'ring-2 ring-[#FF6B7A]',
              },
            ].map((b) => (
              <button
                key={b.qty}
                onClick={() => openModal(b.qty)}
                className={`group relative overflow-hidden rounded-[1.5rem] bg-[#0C1829]/90 p-3 text-left shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-4 ${b.ring} ${b.qty === 2 ? 'sm:scale-[1.04] ring-[#E8C547]/60 shadow-[0_0_40px_-8px_rgba(232,197,71,.5)]' : ''}`}
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
            <span className="inline-flex items-center gap-1 text-[#D94A5F]">
              <span>🔥</span> {stock} restants
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#FBF0E4]">
            <div
              className="h-full bg-gradient-to-r from-[#D94A5F] via-[#E8C547] to-[#FF6B7A] transition-all duration-500"
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <div className="mt-6">
            <CTA onClick={() => openModal(1)} variant="coral" size="lg">
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
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C1829] to-[#1A2F4A] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#F0D78C] shadow-lg">
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
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#C9A227] via-[#E8C547] to-[#D4A82A] px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.12s' }}>
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
            <span className="inline-block rounded-sm bg-gradient-to-r from-[#C9A227] via-[#E8C547] to-[#C9A227] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1208] shadow">
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
              <div key={i} className="rounded-[1.2rem] bg-gradient-to-br from-[#FBF0E4]/60 via-white to-[#FFF0F2]/40 p-4 shadow-sm ring-1 ring-[#E8C547]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:ring-[#E8C547]/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227] via-[#E8C547] to-[#D4A82A] text-sm font-black text-[#1A1208] shadow">
                    {r.n.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[13px] font-black">{r.n}</p>
                    <p className="text-[10px] text-slate-500">{r.v}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5 text-[#C9A227]">
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
      <section className="sc-cv relative overflow-hidden bg-gradient-to-br from-[#FBF0E4] via-white to-[#FFF0F2] py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up order-2 md:order-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#8B6914]">Notre promesse</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-slate-900">Qualite</span>
                <span className="sc-gradient-dual block">sans compromis.</span>
              </h2>
              <ul className="mt-5 space-y-2.5 text-[13px] sm:text-[14px]">
                {[
                  'Formule brevetee · actifs de grade cosmetique',
                  'Validee par plus de 3 500 clientes satisfaites',
                  'Sans paraben, sans silicone, sans parfum agressif',
                  'Livraison express 24h Abidjan · 48h en regions',
                  'Paiement uniquement a reception — zero avance',
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
                  <LazyVideo src={MEDIA.videoApp} poster={MEDIA.videoPoster} aspect="1/1"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FAQ                                                    */}
      {/* ===================================================== */}
      <section className="sc-cv bg-[#FDF6EE] py-14 sm:py-18">
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
        <video src={MEDIA.videoApp} autoPlay loop muted playsInline aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"/>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0C1829]/90 via-[#0C1829]/88 to-[#152A45]/92"/>
        <div className="pointer-events-none absolute left-10 top-10 h-32 w-32 rounded-full bg-[#E8C547]/25 blur-2xl sc-float-slow"/>
        <div className="pointer-events-none absolute right-10 bottom-10 h-40 w-40 rounded-full bg-[#FF6B7A]/20 blur-3xl sc-float-slow" style={{ animationDelay: '2s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#E8C547]">Offre du jour</span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            <span className="sc-serif block">Offrez-vous le regard</span>
            <span className="sc-gradient-dual block">que vous meritez.</span>
          </h2>
          <p className="mt-4 text-[14px] text-stone-300 sm:text-[16px]">
            Serum Anti-Cernes Premium · <span className="sc-shimmer-gold font-black">{fmt(orderTotal(PRICES, 1))}</span> · Livraison offerte
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="coral" size="lg">
              Je commande maintenant
            </CTA>
          </div>
          <p className="mt-3 text-[12px] text-stone-400">
            🔒 Paiement a la livraison · Sans risque
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gradient-to-r from-[#0C1829] via-[#152A45] to-[#0C1829] py-8 text-center text-[11px] text-[#E8C547]/70">
        <p>© 2026 · Cote d`Ivoire · GS Pipeline · Tous droits reserves</p>
        <p className="mt-1">Service client 7j/7 · Livraison Abidjan 24h · Paiement a la livraison</p>
      </footer>

      {/* ===== STICKY BOTTOM BAR ===== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8C547]/30 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(12,24,41,.12)] backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img src={MEDIA.hero} alt="" className="h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-[#E8C547]/50 sm:h-12 sm:w-12"/>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black text-[#0C1829] sm:text-[13px]">Serum Anti-Cernes</p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span className="font-bold text-[#8B6914]">{fmt(orderTotal(PRICES, 1))}</span>
                <span className="text-slate-400">·</span>
                <span className="inline-flex items-center gap-0.5 font-mono font-bold text-[#D94A5F]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF5C72]"/>
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => openModal(1)}
            className="sc-cta relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#D94A5F] via-[#FF5C72] to-[#FF8A9B] px-5 py-2.5 text-[13px] font-black uppercase tracking-wider text-white shadow-[0_10px_28px_-4px_rgba(217,74,95,.55)] ring-1 ring-white/20 transition-transform hover:scale-105 sm:px-6 sm:py-3 sm:text-[14px]"
          >
            <span className="sc-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"/>
            <span className="relative">Commander</span>
            <Arrow/>
          </button>
        </div>
      </div>

      {/* ===== TOAST ===== */}
      {toast && (
        <div className={`fixed bottom-20 left-3 z-40 flex items-center gap-2.5 rounded-[1rem] bg-white px-3.5 py-2.5 shadow-2xl ring-1 ring-[#E8C547]/30 sm:bottom-24 sm:left-4 ${toast.visible ? 'sc-toast-in' : 'sc-toast-out'}`}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227] via-[#E8C547] to-[#D4A82A] text-[#1A1208] shadow">
            <Check/>
            <span className="absolute inset-0 rounded-full bg-[#E8C547]/30 sc-pulse-dot"/>
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

            <div className="relative overflow-hidden bg-gradient-to-br from-[#0C1829] via-[#152A45] to-[#1A2F4A] px-6 py-8 text-center text-white">
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[#E8C547]/30 blur-2xl"/>
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-[#FF6B7A]/25 blur-2xl"/>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#E8C547]">Attendez</span>
              <h3 className="sc-serif mt-3 text-2xl leading-tight">
                Votre peau merite <br/>
                <span className="sc-gradient-dual">un soin d&apos;exception</span>.
              </h3>
              <p className="mt-2 text-[13px] text-stone-300">
                Livraison rapide · Paiement a la reception · Satisfait ou rembourse.
              </p>
            </div>

            <div className="px-6 py-5">
              <CTA onClick={() => openModal(1)} variant="coral" size="lg">
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

export default function SerumCerneLanding() {
  return <SerumCerneLandingPage config={SERUM_CERNE_FB_CONFIG} />;
}
