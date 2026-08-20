/**
 * Landing RETARGETING META — Serum Anti-Cernes (SERUM_CERNE_OFFRE) — slug serum-cerne-offre
 * ==================================================================
 * Clone de SerumCerneTkLanding, reoriente retargeting (visiteur de retour) :
 *   - Bandeau hero "Vous etiez passee... votre offre -20% est encore active"
 *   - Prix -20% : 7 900 / 13 900 / 18 900 F (barre 9 900, prix page originale)
 *   - Countdown minuit, stock faible, toasts d'achat, CTA sticky, exit popup
 *   - 4 pixels Meta (26809431761984777 + 1313100454309806 + 2511991909304152
 *     + 1973354584052136) : PageView/ViewContent en trackSingle, AddToCart /
 *     InitiateCheckout via useOrderSubmit, Purchase browser + CAPI sur /merci
 *
 * Palette : VIOLET NUIT (#180a2e/#241040/#37205a) + OR ROSE (#e8b4b8/#b76e79)
 *           + IVOIRE (#faf8f5)
 *
 * 12 medias UNIQUES (dossier /serum-cerne-offre/, aucune repetition) :
 *   - hero.webp       : Flacon Obrille 50ml (crop 4/5)
 *   - problem.webp    : Cernes visibles (crop AVANT duo 21-juil)
 *   - solution.webp   : EYE SERUM violet "Revelez un regard eclatant"
 *   - video-1.mp4     : Demo pipette (Ma-video-65, loop)
 *   - formula.webp    : Mains + flacon dore (luxe)
 *   - glow.webp       : Regard eclatant + flacon (crop APRES duo 21-juil)
 *   - video-2.mp4     : Resultats before/after (Ma-video-66, loop)
 *   - avant.webp      : Femme mine fatiguee (crop AVANT duo 15-juil)
 *   - apres.webp      : Meme femme radieuse + flacon (crop APRES duo 15-juil)
 *   - routine.webp    : Visage sourire (frame Ma-video-64 @1s)
 *   - video-3.mp4     : Temoignage "regard plus jeune" (Ma-video-64, loop)
 *   - engagement.webp : Collage avant/apres x4 (preuve sociale, banniere finale)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'serum-cerne-offre';
const PRODUCT_CODE = 'SERUM_CERNE_OFFRE';
const META_PIXEL_IDS = ['26809431761984777', '1313100454309806', '2511991909304152', '1973354584052136'];
const THANK_YOU_URL = '/serum-cerne-offre/merci';

const PRICES: Record<number, number> = { 1: 7900, 2: 13900, 3: 18900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const OLD_PRICE_UNIT = 9900;
const QTY_OPTS = [
  { v: 1, label: '1 flacon', sub: packLabel(PRICES, 1, 'FCFA') },
  { v: 2, label: '2 flacons', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Populaire', save: 'Economisez 5 900 F' },
  { v: 3, label: '3 flacons', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Meilleure offre', save: 'Economisez 10 800 F' },
];

// 12 medias UNIQUES (dossier /serum-cerne-offre/, aucune repetition)
const MEDIA = {
  hero:       '/serum-cerne-offre/hero.webp',
  problem:    '/serum-cerne-offre/problem.webp',
  solution:   '/serum-cerne-offre/solution.webp',
  video1:     '/serum-cerne-offre/video-1.mp4',
  formula:    '/serum-cerne-offre/formula.webp',
  glow:       '/serum-cerne-offre/glow.webp',
  video2:     '/serum-cerne-offre/video-2.mp4',
  avant:      '/serum-cerne-offre/avant.webp',
  apres:      '/serum-cerne-offre/apres.webp',
  routine:    '/serum-cerne-offre/routine.webp',
  video3:     '/serum-cerne-offre/video-3.mp4',
  engagement: '/serum-cerne-offre/engagement.webp',
};

declare global { interface Window { fbq: any; _fbq: any; } }

const initedMetaPixels = new Set<string>();

function ensureFbqBase(): void {
  if (window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); };
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
  for (const id of ids) {
    if (initedMetaPixels.has(id)) continue;
    window.fbq('init', id);
    initedMetaPixels.add(id);
    window.fbq('trackSingle', id, 'PageView');
  }
}

interface Product { id: number; code: string; nom: string; prixUnitaire: number }

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
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
      className="relative w-full overflow-hidden rounded-3xl border border-[#f0c6c9]/30 bg-[#180a2e] shadow-[0_20px_60px_-12px_rgba(232,180,184,.35)]"
      style={{ aspectRatio: aspect }}
    >
      {visible ? (
        <video src={src} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#e8b4b8]"/>
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#180a2e]/80 to-transparent"/>
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
        : <div className="h-full w-full animate-pulse bg-[#fdf6f7]"/>}
    </div>
  );
}

// =========================================================
// UI atoms
// =========================================================
const Check = () => (
  <svg className="h-4 w-4 shrink-0 text-[#c9848e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#e8b4b8]"/>
      <svg className="mx-3 h-4 w-4 rotate-45 text-[#e8b4b8]" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2L18 10L10 18L2 10Z" opacity="0.5"/>
        <path d="M10 5L15 10L10 15L5 10Z"/>
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#e8b4b8]"/>
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
    gold:   'from-[#e8b4b8] via-[#fbe9ea] to-[#dda0a6]',
    coral:  'from-[#c9848e] via-[#f0c6c9] to-[#b76e79]',
    navy:   'from-[#37205a] via-[#241040] to-[#37205a]',
    cream:  'from-stone-100 via-[#fdf6f7] to-stone-100',
  };
  const glows: Record<string, string> = {
    gold:   'shadow-[0_10px_30px_-4px_rgba(232,180,184,.55)] hover:shadow-[0_16px_40px_-4px_rgba(232,180,184,.8)]',
    coral:  'shadow-[0_10px_30px_-4px_rgba(201,132,142,.45)] hover:shadow-[0_16px_40px_-4px_rgba(201,132,142,.65)]',
    navy:   'shadow-[0_10px_30px_-4px_rgba(24,10,46,.55)] hover:shadow-[0_16px_40px_-4px_rgba(24,10,46,.75)] ring-1 ring-[#e8b4b8]',
    cream:  'shadow-[0_10px_30px_-4px_rgba(0,0,0,.12)] hover:shadow-[0_16px_40px_-4px_rgba(0,0,0,.2)] ring-1 ring-[#f7dbdd]',
  };
  const textColor = variant === 'navy' ? 'text-[#f0c6c9]' : 'text-[#241040]';
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
    gold:  'bg-gradient-to-r from-[#e8b4b8] via-[#f7dbdd] to-[#e8b4b8] text-[#241040] border-y-2 border-[#241040]/10',
    navy:  'bg-[#180a2e] text-[#f0c6c9] border-y border-[#e8b4b8]/20',
    cream: 'bg-stone-100 text-[#37205a] border-y border-[#f7dbdd]',
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
export default function SerumCerneOffreLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(9);
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
    if (META_PIXEL_IDS.length) {
      initMetaPixels(META_PIXEL_IDS);
      const vcPayload = {
        content_name: 'Serum Anti-Cernes Premium',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
        currency: 'XOF',
      };
      for (const pid of META_PIXEL_IDS) window.fbq?.('trackSingle', pid, 'ViewContent', vcPayload);
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
    const id = setInterval(() => setStock(s => (s > 4 ? s - 1 : s)), 38000);
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

  const stockPct = Math.round((stock / 14) * 100);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#241040]" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
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
          background: linear-gradient(90deg, #b76e79 0%, #f7dbdd 25%, #e8b4b8 50%, #fdf3f4 75%, #b76e79 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: sc-shimmer 3.5s linear infinite;
        }
        .sc-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500 }
        .sc-texture {
          background-image:
            radial-gradient(circle at 20% 30%, rgba(232,180,184,.06) 0, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(201,132,142,.05) 0, transparent 40%);
        }
        .sc-cv { content-visibility: auto; contain-intrinsic-size: 0 800px }
        details[open] summary .sc-chev { transform: rotate(180deg) }
      `}</style>

      {/* Import serif font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"/>

      {/* ===== STICKY TOP BAR - navy + or ===== */}
      <div className="sticky top-0 z-50 border-b border-[#e8b4b8]/30 bg-[#180a2e]">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-3 py-2 sm:gap-3">
          <span className="relative flex h-2 w-2 text-[#f0c6c9] sc-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f0c6c9]"/>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-100 sm:text-[11px]">
            <span className="sc-shimmer-gold">Votre offre -20%</span> · expire
          </span>
          <div className="flex items-center gap-1">
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] font-bold text-[#f0c6c9]/60">:</span>}
                <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-sm bg-[#e8b4b8]/10 px-1.5 font-mono text-[12px] font-black tabular-nums text-[#f7dbdd] ring-1 ring-[#e8b4b8]/30 sm:h-7 sm:min-w-[32px] sm:text-[13px]">
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
        items={['Offre retour -20% ce soir', 'Rajeunissement visible', 'Formule dermatologique', 'Sans effet secondaire', 'Livraison 24h Abidjan', 'Paiement a la livraison']}
      />

      {/* ===================================================== */}
      {/* HERO STACKE : titre -> image -> CTA (demande user)    */}
      {/* Fond IVOIRE avec glows or/corail                       */}
      {/* ===================================================== */}
      <section className="relative overflow-hidden bg-[#faf8f5] sc-texture">
        <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-[#f0c6c9]/30 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#f0c6c9]/30 blur-3xl sc-float-slow" style={{ animationDelay: '2s' }}/>
        <div className="pointer-events-none absolute top-1/3 right-10 h-48 w-48 rounded-full bg-[#f7dbdd]/40 blur-3xl sc-float-slow" style={{ animationDelay: '4s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-8 text-center sm:pt-12 md:pt-16">
          {/* BANDEAU RETARGETING : visiteur de retour */}
          <div className="sc-fade-up mx-auto mb-6 max-w-xl rounded-2xl border border-[#e8b4b8]/50 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
            <p className="text-[12px] font-bold leading-snug text-[#4a2c74] sm:text-[13px]">
              Vous etiez passee par ici... <span className="font-black text-[#b76e79]">votre offre -20% est encore active</span> — elle expire ce soir a minuit.
            </p>
          </div>
          <div className="sc-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e8b4b8]/40 bg-white/60 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#a4636e] shadow-sm backdrop-blur-sm sm:text-[11px]">
              <span className="h-1 w-1 rounded-full bg-[#c9848e]"/>
              Offre retour -20% ce soir
              <span className="h-1 w-1 rounded-full bg-[#c9848e]"/>
            </span>
          </div>

          {/* TITRE - serif italic pour l'élégance */}
          <h1 className="mt-6 text-[40px] leading-[1.05] tracking-tight sm:text-[56px] md:text-[68px] sc-fade-up" style={{ animationDelay: '.05s' }}>
            <span className="sc-serif block text-[#241040]">Rajeunissez</span>
            <span className="sc-shimmer-gold block font-black">en 7 jours</span>
            <span className="sc-serif mt-1 block text-[#4a2c74]">sans effort.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-[#5b4a6e] sm:text-[16px] sc-fade-up" style={{ animationDelay: '.1s' }}>
            Serum dermatologique contre{' '}
            <span className="font-black text-[#241040]">cernes, rides et poches</span>.
            Formule premium, eclat immediat,{' '}
            <span className="bg-gradient-to-r from-[#c9848e] via-[#e8b4b8] to-[#c9848e] bg-clip-text font-black text-transparent">sans effet secondaire</span>.
          </p>

          {/* IMAGE centrale stackee */}
          <div className="relative mt-8 sc-fade-up" style={{ animationDelay: '.15s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#e8b4b8]/50 via-[#f7dbdd]/30 to-[#e8b4b8]/50 blur-3xl"/>
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_70px_-12px_rgba(24,10,46,.25)] ring-1 ring-[#f0c6c9]/30 sc-bob">
              <LazyImg src={MEDIA.hero} alt="Serum Anti-Cernes Premium" aspect="4/5" priority/>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#241040]/20 to-transparent"/>
            </div>

            {/* Badges flottants */}
            <div className="absolute -left-2 top-8 rotate-[-8deg] rounded-sm bg-[#180a2e] px-3 py-2 text-center shadow-xl sm:-left-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#f0c6c9]">Resultat</p>
              <p className="sc-shimmer-gold text-[16px] font-black leading-tight">7 jours</p>
            </div>
            <div className="absolute -right-2 bottom-8 rotate-[6deg] rounded-sm bg-white px-3 py-2 shadow-xl ring-1 ring-[#f7dbdd] sm:-right-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#37205a]">Note clients</p>
              <p className="flex items-center gap-0.5 text-[#e8b4b8]">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 text-[11px] font-black text-[#241040]">4.9</span>
              </p>
            </div>
          </div>

          {/* Prix + CTA */}
          <div className="mt-10 sc-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="sc-shimmer-gold text-4xl font-black sm:text-5xl">{fmtTotal(1)}</span>
              <span className="text-lg font-bold text-[#37205a] sm:text-xl">FCFA</span>
              <span className="text-sm text-[#a396b0] line-through sm:text-base">9 900 FCFA</span>
              <span className="rounded-sm bg-[#180a2e] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#f0c6c9]">-20%</span>
            </div>

            <div className="mx-auto mt-6 max-w-sm">
              <CTA onClick={() => openModal(1)} variant="navy" size="lg">
                Je profite de -20% · {fmtTotal(1)} FCFA <Arrow/>
              </CTA>
            </div>
            <p className="mt-3 text-[11px] text-[#7a6b8a]">
              🔒 Paiement a la livraison · Sans risque
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#4a2c74] sm:grid-cols-4 sm:gap-3 sm:text-[12px] sc-fade-up" style={{ animationDelay: '.25s' }}>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#f7dbdd] backdrop-blur-sm"><Check/>Formule douce</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#f7dbdd] backdrop-blur-sm"><Check/>Sans paraben</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#f7dbdd] backdrop-blur-sm"><Check/>Livre en 24h</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#f7dbdd] backdrop-blur-sm"><Check/>Cash livraison</span>
          </div>
        </div>
      </section>

      <GoldDivider/>

      {/* ===== STATS BAR ===== */}
      <section className="bg-white border-y border-[#fbeef0]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:gap-4 sm:py-8">
          {[
            { n: '7 j', l: 'Premiers resultats' },
            { n: '3 500+', l: 'Clientes ravies' },
            { n: '100%', l: 'Dermatologique' },
            { n: '4.9/5', l: 'Note clients' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="sc-shimmer-gold text-[26px] font-black sm:text-[32px]">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7a6b8a] sm:text-[11px]">{s.l}</p>
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
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#c9848e]">Le probleme</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-[#241040]">Ces</span>
                <span className="block bg-gradient-to-r from-[#e8b4b8] via-[#c9848e] to-[#e8b4b8] bg-clip-text text-transparent">cernes fatigues</span>
                <span className="sc-serif block text-[#4a2c74]">vous trahissent.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-[#5b4a6e] sm:text-[15px]">
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
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#f0c6c9]/30 to-[#e8b4b8]/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[#fbeef0]">
                  <LazyImg src={MEDIA.problem} alt="Cernes visibles" aspect="1/1"/>
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
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#f0c6c9]/40 to-[#e8b4b8]/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[#fbeef0]">
                  <LazyImg src={MEDIA.solution} alt="Solution premium" aspect="1/1"/>
                </div>
              </div>
            </div>
            <div className="sc-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#b76e79]">La solution</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-[#241040]">Le serum</span>
                <span className="sc-shimmer-gold block">qui efface</span>
                <span className="sc-serif block text-[#4a2c74]">vos annees.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-[#5b4a6e] sm:text-[15px]">
                Actifs brevetes : acide hyaluronique,
                caffeine pure, peptides anti-age.
                <span className="mt-2 block font-black text-[#a4636e]">Effet immediat. Resultat durable.</span>
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
      <section className="sc-cv relative overflow-hidden bg-[#180a2e] py-16 sm:py-20">
        <div className="pointer-events-none absolute top-10 left-1/4 h-60 w-60 rounded-full bg-[#e8b4b8]/20 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute bottom-10 right-1/4 h-60 w-60 rounded-full bg-[#e8b4b8]/15 blur-3xl sc-float-slow" style={{ animationDelay: '3s' }}/>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#e8b4b8]">Demonstration</span>
          <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
            <span className="sc-serif block">Une goutte</span>
            <span className="sc-shimmer-gold block">change tout.</span>
          </h2>
          <p className="mt-3 text-[13px] text-[#d8c9e3] sm:text-[14px]">
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
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#b76e79]">Formule exclusive</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-[#241040]">Des actifs</span>
                <span className="block bg-gradient-to-r from-[#b76e79] via-[#e8b4b8] to-[#b76e79] bg-clip-text text-transparent">premium</span>
                <span className="sc-serif block text-[#4a2c74]">venus du labo.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-[#5b4a6e] sm:text-[15px]">
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
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#f0c6c9]/40 to-[#e8b4b8]/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[#fbeef0]">
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
      <section className="sc-cv relative overflow-hidden bg-gradient-to-br from-[#fdf6f7] via-white to-[#fdf6f7] py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#f0c6c9]/40 to-[#e8b4b8]/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[#fbeef0]">
                  <LazyImg src={MEDIA.glow} alt="Peau illuminee" aspect="1/1"/>
                </div>
              </div>
            </div>
            <div className="sc-fade-up" style={{ animationDelay: '.1s' }}>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#c9848e]">Eclat retrouve</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-[#241040]">Une peau</span>
                <span className="block bg-gradient-to-r from-[#b76e79] via-[#e8b4b8] to-[#b76e79] bg-clip-text text-transparent">illuminee</span>
                <span className="sc-serif block text-[#4a2c74]">des le 1er matin.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-[#5b4a6e] sm:text-[15px]">
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
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#b76e79]">Resultats filmes</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-[#241040]">Les clientes</span>
                <span className="sc-shimmer-gold block">temoignent.</span>
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-[#5b4a6e] sm:text-[15px]">
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
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#e8b4b8]/40 to-[#f0c6c9]/30 blur-3xl"/>
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
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#b76e79]">Clientes reelles</span>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              <span className="sc-serif block text-[#241040]">Avant</span>
              <span className="text-[#a396b0] mx-1">→</span>
              <span className="sc-shimmer-gold">Apres 7 jours</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="sc-fade-up group relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[#fbeef0]">
              <LazyImg src={MEDIA.avant} alt="Avant" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#180a2e]/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0c6c9]">Avant</p>
                <p className="sc-serif text-2xl text-white">Cernes visibles.</p>
              </div>
            </div>
            <div className="sc-fade-up group relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[#fbeef0]" style={{ animationDelay: '.15s' }}>
              <LazyImg src={MEDIA.apres} alt="Apres" aspect="4/5"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#180a2e]/80 to-transparent p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0c6c9]">Apres 7 jours</p>
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
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#b76e79]">Routine simple</span>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              <span className="sc-serif block text-[#241040]">Votre nouveau</span>
              <span className="sc-shimmer-gold">rituel beaute.</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div className="sc-fade-up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#f0c6c9]/40 to-[#e8b4b8]/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[#fbeef0]">
                  <LazyImg src={MEDIA.routine} alt="Routine beaute" aspect="1/1"/>
                </div>
              </div>
            </div>

            <div className="sc-fade-up space-y-3" style={{ animationDelay: '.1s' }}>
              {[
                { n: 'I', t: 'Nettoyer', d: 'Sur peau propre et seche, matin et soir.' },
                { n: 'II', t: 'Appliquer', d: '2-3 gouttes sur le contour de l\'oeil.' },
                { n: 'III', t: 'Masser', d: 'Tapotements doux. Laissez penetrer 1 minute.' },
              ].map((x, i) => (
                <div key={i} className="flex gap-4 rounded-[1.5rem] bg-[#faf8f5] p-4 shadow-md ring-1 ring-[#fbeef0] transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#180a2e] font-black text-[#f0c6c9] shadow">
                    {x.n}
                  </div>
                  <div>
                    <h4 className="sc-serif text-lg font-bold text-[#241040]">{x.t}</h4>
                    <p className="text-[12px] text-[#5b4a6e] sm:text-[13px]">{x.d}</p>
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
      <section className="sc-cv relative overflow-hidden bg-[#180a2e] py-16 sm:py-20">
        <div className="pointer-events-none absolute top-10 right-1/4 h-60 w-60 rounded-full bg-[#e8b4b8]/15 blur-3xl sc-float-slow"/>
        <div className="pointer-events-none absolute bottom-10 left-1/4 h-60 w-60 rounded-full bg-[#e8b4b8]/20 blur-3xl sc-float-slow" style={{ animationDelay: '3s' }}/>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#e8b4b8]">Temoignage video</span>
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
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#b76e79]">On en parle</span>
            <h3 className="sc-serif mt-2 text-2xl text-[#241040] sm:text-3xl">Vu dans la presse.</h3>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              { name: 'VOGUE', quote: '"Le serum culte"', stars: 5 },
              { name: 'ELLE', quote: '"Effet immediat"', stars: 5 },
              { name: 'MARIE CLAIRE', quote: '"Revolutionnaire"', stars: 5 },
              { name: 'BIBA', quote: '"A adopter"', stars: 5 },
            ].map((p, i) => (
              <div key={i} className="rounded-[1rem] bg-white p-5 text-center shadow-sm ring-1 ring-[#fbeef0] transition-all hover:-translate-y-0.5 hover:shadow-md">
                <p className="sc-serif text-xl font-bold tracking-[0.2em] text-[#241040]">{p.name}</p>
                <div className="mt-2 flex justify-center gap-0.5 text-[#e8b4b8]">
                  {Array.from({ length: p.stars }).map((_, i) => <Star key={i}/>)}
                </div>
                <p className="sc-serif mt-2 text-[12px] italic text-[#7a6b8a]">{p.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BUNDLES LUXE - flacons dores synthetiques              */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-[#180a2e] py-16 sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-[#e8b4b8]/30 blur-3xl"/>
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-sm bg-[#e8b4b8] px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#241040] shadow-lg">
              Votre offre -20%
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
              <span className="sc-serif block">Choisissez votre</span>
              <span className="sc-shimmer-gold block">cure beaute.</span>
            </h2>
            <p className="mt-2 text-[13px] text-[#b3a2c4] sm:text-[14px]">
              Plus de jours · <span className="font-black text-[#e8b4b8]">plus d'economies</span>.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
            {[
              {
                qty: 1, label: '1 flacon', desc: 'Decouvrir',
                price: orderTotal(PRICES, 1), oldPrice: OLD_PRICE_UNIT,
                tag: '', saveLabel: 'Pour tester',
                accent: 'from-[#d8c9e3] to-[#9383a5]',
                bg: 'from-[#2a1547] to-[#1c0e33]',
                ring: 'ring-1 ring-[#4a2c74]',
              },
              {
                qty: 2, label: '2 flacons', desc: 'Cure complete',
                price: orderTotal(PRICES, 2), oldPrice: OLD_PRICE_UNIT * 2,
                tag: 'POPULAIRE', saveLabel: 'Economisez 5 900 F',
                accent: 'from-[#e8b4b8] via-[#fbe9ea] to-[#dda0a6]',
                bg: 'from-[#33182a] to-[#24101c]',
                ring: 'ring-2 ring-[#e8b4b8]',
              },
              {
                qty: 3, label: '3 flacons', desc: 'Coffret premium',
                price: orderTotal(PRICES, 3), oldPrice: OLD_PRICE_UNIT * 3,
                tag: 'MEILLEURE OFFRE', saveLabel: 'Economisez 10 800 F',
                accent: 'from-[#c9848e] via-[#f0c6c9] to-[#e8b4b8]',
                bg: 'from-[#33182a] to-[#24101c]',
                ring: 'ring-2 ring-[#f0c6c9]',
              },
            ].map((b) => (
              <button
                key={b.qty}
                onClick={() => openModal(b.qty)}
                className={`group relative overflow-hidden rounded-[1.5rem] bg-[#241040]/80 p-3 text-left shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-4 ${b.ring} ${b.qty === 2 ? 'sm:scale-[1.04]' : ''}`}
              >
                {b.tag && (
                  <span className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-sm bg-gradient-to-r ${b.accent} px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#241040] shadow-lg animate-pulse sm:text-[10px]`}>
                    {b.qty === 2 ? '◆' : '♛'} {b.tag}
                  </span>
                )}

                <div className={`pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br ${b.accent} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30`}/>

                {/* Flacons dores synthetiques */}
                <div className={`relative flex aspect-square items-end justify-center overflow-hidden rounded-xl bg-gradient-to-br ${b.bg}`}>
                  <div className="pointer-events-none absolute left-4 top-4 h-4 w-4 rounded-full bg-[#e8b4b8]/30 blur-sm sc-float"/>
                  <div className="pointer-events-none absolute right-6 top-10 h-3 w-3 rounded-full bg-[#f0c6c9]/40 blur-sm sc-float" style={{ animationDelay: '.5s' }}/>

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
                        <div className="h-1 w-3 bg-[#4a2c74] sm:w-4"/>
                        {/* Flacon */}
                        <div className={`h-20 w-8 rounded-md bg-gradient-to-b ${b.accent} shadow-xl sm:h-24 sm:w-10`}>
                          <div className="mx-auto mt-3 h-0.5 w-6 rounded-full bg-white/50 sm:mt-4"/>
                          <p className="mt-10 text-center text-[6px] font-black uppercase tracking-[0.2em] text-[#241040]/70 sm:mt-12 sm:text-[7px]">serum</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white font-black shadow-lg ring-2 ring-white/90 sm:h-12 sm:w-12">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[18px] text-transparent sm:text-[20px]`}>×{b.qty}</span>
                  </div>
                </div>

                <div className="relative mt-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#b3a2c4]">{b.label}</p>
                  <p className="text-[10px] font-bold text-[#9383a5]">{b.desc}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`bg-gradient-to-r ${b.accent} bg-clip-text text-[22px] font-black text-transparent sm:text-[26px]`}>
                      {fmt(b.price)}
                    </span>
                    <span className="text-[11px] text-[#9383a5] line-through sm:text-[12px]">{fmt(b.oldPrice)}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-[#f0c6c9] sm:text-[12px]">{b.saveLabel}</p>

                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${b.accent} px-4 py-2 text-[12px] font-black uppercase tracking-wider text-[#241040] shadow-md transition-transform group-hover:scale-105 sm:text-[13px]`}>
                    Je commande <Arrow/>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-[#b3a2c4]">
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
            <span className="text-[#7a6b8a]">Disponible ce jour</span>
            <span className="inline-flex items-center gap-1 text-[#b76e79]">
              <span>🔥</span> {stock} restants
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-gradient-to-r from-[#c9848e] via-[#f0c6c9] to-[#c9848e] transition-all duration-500"
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <div className="mt-6">
            <CTA onClick={() => openModal(1)} variant="navy" size="lg">
              Commander maintenant <Arrow/>
            </CTA>
          </div>
          <p className="mt-3 text-center text-[11px] text-[#7a6b8a]">
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
            <span className="inline-flex items-center gap-2 rounded-full bg-[#180a2e] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#f0c6c9] shadow-lg">
              Conversations reelles
            </span>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              <span className="sc-serif block text-[#241040]">Elles nous</span>
              <span className="sc-shimmer-gold block">remercient</span>
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* WhatsApp */}
            <div className="overflow-hidden rounded-2xl bg-[#ece5dd] shadow-2xl">
              <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e8b4b8] to-[#c9848e] font-black text-[#241040]">GS</div>
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
                  <p className="text-[11px] font-black text-[#a4636e]">Aminata K.</p>
                  <p className="mt-0.5 text-[13px] text-[#37205a]">Bonjour ! 7 jours avec le serum et mes cernes ont presque disparu. Je suis bluffee 🤩</p>
                  <p className="mt-1 text-right text-[9px] text-[#a396b0]">08:23 ✓✓</p>
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.12s' }}>
                  <p className="text-[13px] text-[#37205a]">Merci Aminata ! Continuez, vous allez voir encore mieux dans 2 semaines 💛</p>
                  <p className="mt-1 text-right text-[9px] text-[#7a6b8a]">08:25 ✓✓</p>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.24s' }}>
                  <p className="text-[11px] font-black text-[#b76e79]">Mariam D.</p>
                  <p className="mt-0.5 text-[13px] text-[#37205a]">Je prends le pack 3 flacons pour ma maman et ma soeur. Produit exceptionnel ❤️</p>
                  <p className="mt-1 text-right text-[9px] text-[#a396b0]">14:08</p>
                </div>
              </div>
            </div>

            {/* SMS */}
            <div className="overflow-hidden rounded-2xl bg-stone-100 shadow-2xl">
              <div className="flex items-center gap-3 bg-[#180a2e] px-4 py-3 text-white">
                <svg className="h-5 w-5 text-[#e8b4b8]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 4l-6 3.75L6 8V6l6 3.75L18 6v2z"/></svg>
                <div className="flex-1">
                  <p className="text-[13px] font-black">Messages</p>
                  <p className="text-[10px] text-[#f0c6c9]">+225 07 XX XX XX XX</p>
                </div>
                <span className="rounded-sm bg-[#e8b4b8] px-2 py-0.5 text-[9px] font-black uppercase text-[#241040]">SMS</span>
              </div>
              <div className="space-y-2.5 px-3 py-4">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sc-fade-up">
                  <p className="text-[11px] font-black text-[#241040]">Fatou S.</p>
                  <p className="mt-0.5 text-[13px] text-[#37205a]">bonjour jai commande le serum hier jai recu aujourdhui livraison rapide</p>
                  <p className="mt-1 text-right text-[9px] text-[#a396b0]">09:47 · Remis</p>
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#f0c6c9] to-[#e8b4b8] px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.12s' }}>
                  <p className="text-[13px] font-medium text-[#241040]">Parfait Fatou ! Appliquez matin et soir pendant 7 jours. Vous verrez la difference ✨</p>
                  <p className="mt-1 text-right text-[9px] text-[#37205a]/70">09:48 · Remis</p>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm sc-fade-up" style={{ animationDelay: '.24s' }}>
                  <p className="text-[11px] font-black text-[#241040]">Rokia B.</p>
                  <p className="mt-0.5 text-[13px] text-[#37205a]">Incroyable ! Je parais 5 ans plus jeune. Mes collegues n'en reviennent pas 👏</p>
                  <p className="mt-1 text-right text-[9px] text-[#a396b0]">16:32 · Remis</p>
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
            <span className="inline-block rounded-sm bg-[#e8b4b8] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#241040] shadow">
              3 500+ avis verifies
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              <span className="sc-serif block text-[#241040]">Elles en parlent</span>
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
              <div key={i} className="rounded-[1.2rem] bg-gradient-to-br from-[#fdf6f7]/40 to-white p-4 shadow-sm ring-1 ring-[#fbeef0] transition-all hover:-translate-y-0.5 hover:shadow-xl hover:ring-[#f0c6c9]">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e8b4b8] to-[#c9848e] text-sm font-black text-[#241040] shadow">
                    {r.n.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[13px] font-black">{r.n}</p>
                    <p className="text-[10px] text-[#7a6b8a]">{r.v}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5 text-[#e8b4b8]">
                    {Array.from({ length: r.s }).map((_, i) => <Star key={i}/>)}
                    {Array.from({ length: 5 - r.s }).map((_, i) => <Star key={i} className="text-[#d8c9e3]"/>)}
                  </div>
                </div>
                <p className="sc-serif mt-3 text-[14px] italic leading-relaxed text-[#4a2c74]">« {r.t} »</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BLOC ENGAGEMENT (img-9)                                */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden bg-gradient-to-br from-[#fdf6f7] via-white to-[#fdf6f7] py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="sc-fade-up order-2 md:order-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#b76e79]">Notre engagement</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                <span className="sc-serif block text-[#241040]">Satisfaction</span>
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
                  <li key={i} className="flex items-start gap-2 text-[#4a2c74]">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#180a2e] text-[#f0c6c9] shadow">
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
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#f0c6c9]/40 to-[#e8b4b8]/30 blur-3xl"/>
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[#fbeef0]">
                  <LazyImg src={MEDIA.engagement} alt="Qualite premium" aspect="1/1"/>
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
              <span className="sc-serif block text-[#241040]">Vos</span>
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
              <details key={i} className="group overflow-hidden rounded-[1rem] bg-white shadow-sm ring-1 ring-[#fbeef0] transition-all open:shadow-lg open:ring-[#f0c6c9]">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-[#241040] sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="sc-chev h-5 w-5 text-[#c9848e] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-[#5b4a6e] sm:text-[14px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* BANNIERE FINALE avec fond img-9 opacifie               */}
      {/* ===================================================== */}
      <section className="sc-cv relative overflow-hidden py-16 sm:py-24">
        <img src={MEDIA.engagement} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-20"/>
        <div className="pointer-events-none absolute inset-0 bg-[#180a2e]/85"/>
        <div className="pointer-events-none absolute left-10 top-10 h-32 w-32 rounded-full bg-[#e8b4b8]/30 blur-2xl sc-float-slow"/>
        <div className="pointer-events-none absolute right-10 bottom-10 h-40 w-40 rounded-full bg-[#e8b4b8]/25 blur-3xl sc-float-slow" style={{ animationDelay: '2s' }}/>

        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#f0c6c9]">Derniere chance · -20%</span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            <span className="sc-serif block">Rajeunissez</span>
            <span className="sc-shimmer-gold block">maintenant.</span>
          </h2>
          <p className="mt-4 text-[14px] text-[#d8c9e3] sm:text-[16px]">
            Votre remise -20% expire a minuit · {fmtTotal(1)} FCFA au lieu de 9 900 FCFA
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <CTA onClick={() => openModal(1)} variant="gold" size="lg">
              Je commande maintenant
            </CTA>
          </div>
          <p className="mt-3 text-[12px] text-[#b3a2c4]">
            🔒 Paiement a la livraison · Sans risque
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#180a2e] py-8 text-center text-[11px] text-[#f7dbdd]/60">
        <p>© 2026 · Cote d`Ivoire · GS Pipeline · Tous droits reserves</p>
        <p className="mt-1">Service client 7j/7 · Livraison Abidjan 24h · Paiement a la livraison</p>
      </footer>

      {/* ===== STICKY BOTTOM BAR ===== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8b4b8]/30 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,.1)] backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img src={MEDIA.hero} alt="" className="h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-[#f0c6c9] sm:h-12 sm:w-12"/>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black text-[#241040] sm:text-[13px]">Serum Anti-Cernes · -20%</p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span className="font-bold text-[#a4636e]">{fmtTotal(1)} FCFA</span>
                <span className="text-[#a396b0]">·</span>
                <span className="inline-flex items-center gap-0.5 font-mono font-bold text-[#c9848e]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9848e]"/>
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => openModal(1)}
            className="sc-cta relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-[#180a2e] px-5 py-2.5 text-[13px] font-black uppercase tracking-wider text-[#f0c6c9] shadow-[0_10px_25px_-4px_rgba(24,10,46,.5)] ring-1 ring-[#e8b4b8] transition-transform hover:scale-105 sm:px-6 sm:py-3 sm:text-[14px]"
          >
            <span className="sc-cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#f0c6c9]/30 to-transparent"/>
            <span className="relative">Commander</span>
            <Arrow/>
          </button>
        </div>
      </div>

      {/* ===== TOAST ===== */}
      {toast && (
        <div className={`fixed bottom-20 left-3 z-40 flex items-center gap-2.5 rounded-[1rem] bg-white px-3.5 py-2.5 shadow-2xl ring-1 ring-[#fbeef0] sm:bottom-24 sm:left-4 ${toast.visible ? 'sc-toast-in' : 'sc-toast-out'}`}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#e8b4b8] to-[#c9848e] text-[#241040] shadow">
            <Check/>
            <span className="absolute inset-0 rounded-full bg-[#e8b4b8]/30 sc-pulse-dot"/>
          </div>
          <div>
            <p className="text-[12px] font-black text-[#241040]">{toast.n} vient de commander</p>
            <p className="text-[10px] text-[#7a6b8a]">a {toast.v} · il y a {toast.t}</p>
          </div>
        </div>
      )}

      {/* ===== EXIT POPUP ===== */}
      {exitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#180a2e]/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-md overflow-hidden rounded-[1.5rem] bg-white shadow-2xl animate-[sc-fade-up_.3s_ease-out]">
            <button
              onClick={() => setExitPopup(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-[#5b4a6e] transition hover:bg-stone-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="relative overflow-hidden bg-[#180a2e] px-6 py-8 text-center text-white">
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[#e8b4b8]/30 blur-2xl"/>
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-[#e8b4b8]/25 blur-2xl"/>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#f0c6c9]">Votre -20% expire ce soir</span>
              <h3 className="sc-serif mt-3 text-2xl leading-tight">
                Votre peau merite <br/>
                <span className="sc-shimmer-gold">ce serum premium</span>.
              </h3>
              <p className="mt-2 text-[13px] text-[#d8c9e3]">
                Paiement a la livraison.
              </p>
            </div>

            <div className="px-6 py-5">
              <CTA onClick={() => openModal(1)} variant="gold" size="lg">
                Je commande maintenant
              </CTA>
              <button
                onClick={() => setExitPopup(false)}
                className="mt-2 w-full text-[11px] font-medium text-[#b3a2c4] hover:text-[#4a2c74]"
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
          title: 'Serum Anti-Cernes Premium (Offre -20%)',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_IDS[0],
          secondaryMetaPixelId: META_PIXEL_IDS[1],
          extraMetaPixelIds: META_PIXEL_IDS.slice(2),
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
