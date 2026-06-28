/**
 * Landing ULTRA PREMIUM — Patch Anti-Douleur (TK / FB)
 * ==================================================================
 *
 * Composant generique partage par 2 slugs :
 *   - patchdouleurtk -> productCode PATCH_DOULEUR_TK (canal direct)
 *   - patchdouleurfb -> productCode PATCH_DOULEUR_FB (canal Facebook ads)
 *
 * Logique metier 100% inchangee :
 *   - Form : OrderModalPatchDouleur (palette indigo/violet/cyan, identique TK/FB)
 *   - Prix : { 1: 7000, 2: 12000, 3: 15000 } (oldPrice 15000)
 *   - Submit : useOrderSubmit -> /api/public/order
 *   - Redirect post-commande : /<slug>/merci
 *   - Tracking : trackPageView + Meta Pixel (ViewContent / AddToCart / InitiateCheckout)
 *
 * Design specifique :
 *   - Palette OBSIDIAN + CYAN ELECTRIC + CORAIL URGENCE + OR
 *   - Polices Bricolage Grotesque (display) + Outfit (body), chargees via index.html
 *   - 1 image OU video PAR BLOC, jamais groupees
 *   - 13 medias UNIQUES (aucune repetition)
 *   - Mobile-first, lazy-load, mots forts en gradient
 *   - Sticky countdown bar, exit-intent popup, floating toast
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, DELIVERY_FEE_CI, packLabel } from '../../utils/pricingHelpers';

// =========================================================
// CONFIG
// =========================================================
export interface PatchDouleurLandingProps {
  slug: 'patchdouleurtk' | 'patchdouleurfb';
  productCode: 'PATCH_DOULEUR_TK' | 'PATCH_DOULEUR_FB';
  thankYouUrl: string;
  contentName: string;
  /**
   * Meta Pixel ID — par defaut le pixel TK historique. Surcharge possible
   * pour tracker un canal specifique (ex : pixel dedie patchdouleurfb).
   */
  metaPixelId?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_META_PIXEL_ID = '26809431761984777';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const OLD_PRICE_UNIT = 15000;
const DISCOUNT_PCT = Math.round((1 - PRICES[1] / OLD_PRICE_UNIT) * 100);
const fmtTot = (v: number) => orderTotal(PRICES, v).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

const QTY_OPTS = [
  { v: 1, label: '1 boite',  sub: `${fmtTot(1)} FCFA`,  save: '' },
  { v: 2, label: '2 boites', sub: `${fmtTot(2)} FCFA`, tag: 'Populaire',     save: 'Economisez 2 000 F' },
  { v: 3, label: '3 boites', sub: `${fmtTot(3)} FCFA`, tag: 'Meilleure offre', save: 'Economisez 6 000 F' },
];

// 13 medias UNIQUES — chaque slot est utilise UNE fois
// Note : ?v=2 sur hero pour forcer le contournement du cache navigateur/CDN
// apres remplacement du fichier (28/04/2026).
const MEDIA = {
  hero:        '/patch-douleur-tk/hero.webp?v=2',      // bloc 0 hero (poster video TK)
  heroVideo:   '/patch-douleur-tk/hero.mp4',          // hero video patchdouleurtk
  avant:       '/patch-douleur-tk/avant.webp',         // bloc 1 slider before
  apres:       '/patch-douleur-tk/apres.webp',         // bloc 1 slider after
  video1:      '/patch-douleur-tk/video-1.mp4',        // bloc 2
  gallery1:    '/patch-douleur-tk/gallery-1.webp',     // bloc 3
  video2:      '/patch-douleur-tk/video-2.mp4',        // bloc 4
  manBack1:    '/patch-douleur-tk/premium/man-back-1.webp', // bloc 5 (premium homme)
  usage:       '/patch-douleur-tk/usage.webp',         // bloc 6 (3 gestes)
  video3:      '/patch-douleur-tk/video-3.mp4',        // bloc 7
  gallery2:    '/patch-douleur-tk/gallery-2.webp',     // bloc 8
  manBack2:    '/patch-douleur-tk/premium/man-back-2.webp', // bloc 9 (premium homme bis)
  gallery3:    '/patch-douleur-tk/gallery-3.webp',     // bloc 10
  banner:      '/patch-douleur-tk/banner.webp',        // bloc 10 (split)
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
const fmtNum = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fmtF = (v: number) => `${fmtNum(v)} F`;
const fmt = (v: number) => fmtNum(v) + ' FCFA';
const pad = (n: number) => String(n).padStart(2, '0');

// =========================================================
// HOOKS — lazy-load + reveal-on-scroll
// =========================================================
function useOnScreen(rootMargin = '250px') {
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

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('pd-reveal-in'); obs.disconnect(); }
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// =========================================================
// LAZY MEDIA COMPONENTS
// =========================================================
function LazyImg({ src, alt, className = '', aspect, eager = false }: { src: string; alt: string; className?: string; aspect?: string; eager?: boolean }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {(visible || eager)
        ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" {...(eager ? { fetchPriority: 'high' as any } : {})} className="h-full w-full object-cover"/>
        : <div className="h-full w-full animate-pulse bg-gradient-to-br from-cyan-50 to-sky-100"/>}
    </div>
  );
}

function LazyVideo({
  src,
  aspect = '9/16',
  className = '',
  priority = false,
  poster,
}: {
  src: string;
  aspect?: string;
  className?: string;
  priority?: boolean;
  poster?: string;
}) {
  const { ref, visible } = useOnScreen('400px');
  if (priority) {
    return (
      <div
        className={`relative w-full overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#1a2540] ${className}`}
        style={{ aspectRatio: aspect }}
      >
        <video
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a1628]/60 to-transparent"/>
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#1a2540] ring-1 ring-cyan-400/20 shadow-[0_25px_70px_-15px_rgba(6,182,212,0.3)] ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {visible ? (
        <video src={src} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"/>
        </div>
      )}
      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-cyan-300/10 rounded-3xl"/>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a1628]/70 to-transparent"/>
    </div>
  );
}

// =========================================================
// ATOMS — palette OBSIDIAN + CYAN + CORAIL + OR
// =========================================================
const Check = ({ className = '' }: { className?: string }) => (
  <svg className={`h-4 w-4 shrink-0 text-cyan-500 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);

const ArrowR = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
  </svg>
);

const Star = ({ className = '' }: { className?: string }) => (
  <svg className={`h-3.5 w-3.5 ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

// =========================================================
// CTA — primary cyan / urgent corail / dark obsidian
// =========================================================
function CTA({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'urgent' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 text-white hover:from-cyan-500 hover:via-cyan-600 hover:to-sky-600 shadow-[0_18px_45px_-10px_rgba(6,182,212,0.65)] hover:shadow-[0_24px_55px_-8px_rgba(14,165,233,0.85)] ring-1 ring-cyan-300/40 pd-glow-cyan',
    urgent:  'bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 text-white hover:from-rose-500 hover:via-orange-500 hover:to-amber-500 shadow-[0_18px_45px_-10px_rgba(249,115,22,0.65)] hover:shadow-[0_24px_55px_-8px_rgba(244,63,94,0.85)] ring-1 ring-orange-300/40 pd-glow-coral',
    dark:    'bg-[#0a1628] text-cyan-300 hover:bg-[#0c1e2e] ring-1 ring-cyan-400/40 shadow-[0_14px_32px_-10px_rgba(6,182,212,0.5)]',
  };
  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-[11px]',
    md: 'px-7 py-3.5 text-[12.5px]',
    lg: 'px-9 py-4 text-[13px] sm:text-[14px]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pd-cta group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-black uppercase tracking-[0.18em] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${styles[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="pd-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent"/>
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </button>
  );
}

// Marquee defilante
function Marquee({ items, dark = false, accent = false }: { items: string[]; dark?: boolean; accent?: boolean }) {
  const bg = dark
    ? 'bg-[#0a1628] text-cyan-200 border-cyan-400/15'
    : accent
      ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-500 text-white border-transparent'
      : 'bg-neutral-50 text-neutral-800 border-neutral-200/70';
  return (
    <div className={`overflow-hidden border-y py-2.5 ${bg}`}>
      <div className="pd-marquee flex w-[200%] items-center gap-10 text-[10px] font-black uppercase tracking-[0.32em]">
        {[0, 1].map(k => (
          <div key={k} className="flex w-1/2 shrink-0 items-center justify-around gap-10">
            {items.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2.5 whitespace-nowrap">
                <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-60"/>
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Slider AVANT/APRES drag
function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pct, setPct] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMove = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((clientX - r.left) / r.width) * 100;
    setPct(Math.max(0, Math.min(100, x)));
  }, []);

  return (
    <div
      ref={ref}
      onPointerDown={(e) => { dragging.current = true; ref.current?.setPointerCapture(e.pointerId); onMove(e.clientX); }}
      onPointerMove={(e) => { if (dragging.current) onMove(e.clientX); }}
      onPointerUp={(e) => { dragging.current = false; try { ref.current?.releasePointerCapture(e.pointerId); } catch {} }}
      className="relative w-full select-none overflow-hidden rounded-3xl bg-neutral-200 ring-1 ring-cyan-300/30 shadow-[0_30px_80px_-20px_rgba(6,182,212,0.35)]"
      style={{ aspectRatio: '4/5', cursor: 'ew-resize', touchAction: 'none' }}
    >
      <img src={after} alt="Apres patch anti-douleur" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover"/>
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <img src={before} alt="Avant patch anti-douleur" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ width: `${100 / (pct / 100 || 0.001)}%` }}/>
      </div>

      <span className="absolute left-3 top-3 rounded-md bg-rose-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-white shadow-md">Avant</span>
      <span className="absolute right-3 top-3 rounded-md bg-cyan-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-white shadow-md">Apres</span>

      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
        <div className="h-full w-[3px] bg-white shadow-[0_0_18px_rgba(6,182,212,0.7)]"/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0a1628] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] ring-2 ring-cyan-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l-7 7 7 7M15 5l7 7-7 7"/></svg>
        </div>
      </div>

      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0a1628]/80 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-cyan-200 backdrop-blur-sm">Glissez pour comparer</span>
    </div>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function PatchDouleurLandingPremium({
  slug,
  productCode,
  thankYouUrl,
  contentName,
  metaPixelId = DEFAULT_META_PIXEL_ID,
}: PatchDouleurLandingProps) {
  const company = co();
  const isTk = slug === 'patchdouleurtk';

  const [product, setProduct] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock] = useState(() => 18 + Math.floor(Math.random() * 12));
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const [exitPopup, setExitPopup] = useState(false);
  const [watchers, setWatchers] = useState(38);
  // Sticky CTA bar : visible des l'arrivee sur la page (pas de scroll requis)
  const [showSticky] = useState(true);
  const exitShown = useRef(false);
  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  // ============= TRACKING =============
  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(slug, company);
    if (metaPixelId) {
      initMetaPixel(metaPixelId);
      window.fbq?.('track', 'ViewContent', {
        content_name: contentName,
        content_ids: [productCode],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
        currency: 'XOF',
      });
    }
  }, [slug, company, productCode, contentName, metaPixelId]);

  // ============= FETCH PRODUCT =============
  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company }, timeout: 20000 })
      .then((r) => {
        const p = (r.data?.products || []).find((p: Product) => p.code?.toUpperCase() === productCode);
        if (p) setProduct(p);
      })
      .catch(() => { /* noop */ });
  }, [company, productCode]);

  // ============= COUNTDOWN =============
  const endTs = useMemo(() => {
    const stored = sessionStorage.getItem(`pd_end_${slug}`);
    if (stored) return parseInt(stored, 10);
    const t = Date.now() + 60 * 60 * 1000; // 60 min
    sessionStorage.setItem(`pd_end_${slug}`, String(t));
    return t;
  }, [slug]);

  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, endTs - Date.now());
      setCountdown({
        h: Math.floor(d / 3600000),
        m: Math.floor((d % 3600000) / 60000),
        s: Math.floor((d % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTs]);

  // ============= LIVE WATCHERS =============
  useEffect(() => {
    const id = setInterval(() => setWatchers((w) => Math.max(20, Math.min(58, w + (Math.random() < 0.5 ? -1 : 1)))), 5000);
    return () => clearInterval(id);
  }, []);

  // Note : la sticky CTA bar est affichee en permanence (init showSticky=true).

  // ============= TOAST NOTIFICATIONS =============
  const TOASTS = useMemo(() => [
    { n: 'Sidibe K.',  v: 'Cocody',      t: '3 min'  },
    { n: 'Aminata B.', v: 'Bouake',      t: '7 min'  },
    { n: 'Yao D.',     v: 'Yopougon',    t: '10 min' },
    { n: 'Kone N.',    v: 'Daloa',       t: '14 min' },
    { n: 'Fatou M.',   v: 'San Pedro',   t: '18 min' },
    { n: 'Oumar T.',   v: 'Korhogo',     t: '22 min' },
    { n: 'Awa O.',     v: 'Treichville', t: '27 min' },
    { n: 'Konan P.',   v: 'Abobo',       t: '31 min' },
  ], []);

  useEffect(() => {
    const showNext = () => {
      const t = TOASTS[toastIdx.current % TOASTS.length];
      toastIdx.current += 1;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast((s) => s ? { ...s, visible: false } : null), 4500);
    };
    const init = setTimeout(showNext, 5000);
    const id = setInterval(showNext, 12000);
    return () => { clearTimeout(init); clearInterval(id); };
  }, [TOASTS]);

  // ============= EXIT INTENT =============
  useEffect(() => {
    const onLeave = (e: MouseEvent) => {
      if (exitShown.current) return;
      if (e.clientY < 8 && window.scrollY > 200) { exitShown.current = true; setExitPopup(true); }
    };
    document.addEventListener('mouseleave', onLeave);
    return () => document.removeEventListener('mouseleave', onLeave);
  }, []);

  // ============= OPEN ORDER =============
  const openOrder = useCallback((quantity = 1) => {
    setQty(quantity);
    setOpen(true);
    if (metaPixelId) {
      window.fbq?.('track', 'AddToCart', {
        content_name: contentName,
        content_ids: [productCode],
        content_type: 'product',
        value: orderTotal(PRICES, quantity),
        currency: 'XOF',
        contents: [{ id: productCode, quantity }],
      });
    }
  }, [contentName, productCode, metaPixelId]);

  // ============= CFG =============
  const cfg = useMemo(() => ({
    slug,
    productCode,
    title: contentName,
    thankYouUrl,
    metaPixelId,
    prices: PRICES,
    images: { hero: MEDIA.hero, avant: MEDIA.avant, apres: MEDIA.apres },
  }), [slug, productCode, contentName, thankYouUrl, metaPixelId]);

  // ============= REVEAL HOOKS =============
  const r1 = useReveal(); const r2 = useReveal(); const r3 = useReveal(); const r4 = useReveal();
  const r5 = useReveal(); const r6 = useReveal(); const r7 = useReveal(); const r8 = useReveal();
  const r9 = useReveal(); const r10 = useReveal();

  // ============= PRELOAD HERO =============
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'preload';
    if (isTk) {
      l.as = 'video';
      l.href = MEDIA.heroVideo;
    } else {
      l.as = 'image';
      l.href = MEDIA.hero;
    }
    (l as any).fetchPriority = 'high';
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch {} };
  }, [isTk]);

  const stockPct = Math.max(15, Math.min(100, Math.round((stock / 35) * 100)));

  return (
    <div
      className="pd-root min-h-screen overflow-x-hidden bg-[#fafaf9] text-[#0a1628] antialiased"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
    >

      {/* ============================================== */}
      {/* TOP STRIP - urgence + countdown                */}
      {/* ============================================== */}
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0c1e2e] to-[#0a1628] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white sm:text-[11px]">
        <span className="text-cyan-300">Offre exclusive</span>
        <span className="mx-2 opacity-50">·</span>
        <span>fin dans</span>
        <span className="ml-2 inline-flex items-center gap-1 font-mono tabular-nums text-cyan-200">
          <span className="pd-pulse-digit">{pad(countdown.h)}</span>:
          <span className="pd-pulse-digit">{pad(countdown.m)}</span>:
          <span className="pd-pulse-digit">{pad(countdown.s)}</span>
        </span>
      </div>

      {/* ============================================== */}
      {/* HEADER — masque sur TK (video en premier)        */}
      {/* ============================================== */}
      {!isTk && (
        <header className="relative z-10 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-cyan-500 text-white shadow-[0_8px_18px_-4px_rgba(6,182,212,0.55)]">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3.5 5a2 2 0 012-2h9a2 2 0 012 2v10a2 2 0 01-2 2h-9a2 2 0 01-2-2V5z" opacity=".25"/><path fillRule="evenodd" d="M5 4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zm2 6a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              </span>
              <span className="pd-display text-[16px] font-extrabold tracking-tight text-[#0a1628] sm:text-[18px]">Patch Anti-Douleur</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-700 ring-1 ring-cyan-200 sm:px-3 sm:py-1.5 sm:text-[10px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"/>
              <span className="hidden xs:inline">En direct · </span>{watchers} regardent
            </div>
          </div>
        </header>
      )}

      {/* ============================================== */}
      {/* HERO — TK : video en haut, texte + CTA en bas    */}
      {/* ============================================== */}
      {isTk ? (
        <section className="relative overflow-hidden bg-[#fafaf9]">
          <div className="relative w-full bg-[#0a1628]">
            <LazyVideo
              src={MEDIA.heroVideo}
              poster="/patch-douleur-tk/hero.webp"
              aspect="9/16"
              priority
              className="mx-auto max-h-[78vh] max-w-[720px] rounded-none shadow-[0_30px_80px_-20px_rgba(6,182,212,0.45)]"
            />
            <div className="absolute right-3 top-3 rounded-full bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-white shadow-lg ring-2 ring-white/80">
              -{DISCOUNT_PCT}%
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[640px] px-4 pb-10 pt-6 text-center sm:px-6 sm:pb-12">
            <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-300/25 blur-[80px]"/>

            <p className="text-[9px] font-black uppercase tracking-[0.38em] text-cyan-600">Patch Anti-Douleur · N°1</p>

            <h1 className="pd-display relative mt-3 text-[38px] font-black leading-[0.95] tracking-tight text-[#0a1628] sm:text-[52px]">
              Stop aux <span className="pd-grad-cyan">douleurs</span>
              <br/>
              en <span className="pd-grad-coral">3 secondes</span>
            </h1>

            <p className="pd-body relative mt-3 text-[14px] font-semibold leading-snug text-neutral-600 sm:text-[15px]">
              Chaleur therapeutique <span className="pd-grad-cyan">jusqu&apos;a 12h</span> · dos, genoux, sciatique
            </p>

            <div className="relative mt-4 flex items-center justify-center gap-2">
              <div className="flex gap-0.5 text-amber-400">{[...Array(5)].map((_, k) => <Star key={k} className="h-3.5 w-3.5"/>)}</div>
              <span className="text-[11px] font-bold text-neutral-600">4.7/5 · 800+ avis</span>
            </div>

            <div className="relative mt-6 rounded-3xl border border-cyan-200/60 bg-white/95 p-5 shadow-[0_25px_60px_-15px_rgba(6,182,212,0.3)]">
              <div className="flex items-baseline justify-center gap-2">
                <span className="pd-display text-[36px] font-black leading-none text-[#0a1628] sm:text-[42px]">{fmtNum(orderTotal(PRICES, 1))} <span className="text-[16px] font-bold text-neutral-500">F</span></span>
                <span className="text-[13px] font-bold text-neutral-400 line-through">{fmtF(OLD_PRICE_UNIT)}</span>
              </div>
              <CTA onClick={() => openOrder(1)} variant="primary" size="lg" fullWidth>
                Commander maintenant
                <ArrowR/>
              </CTA>
              <p className="mt-3 text-[9px] font-black uppercase tracking-[0.32em] text-neutral-500">
                Paiement a la livraison · {stock} restantes
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-16">
          <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-300/30 blur-[120px]"/>
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-orange-200/30 blur-[120px]"/>

          <div className="relative mx-auto w-full max-w-[1100px]">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a1628] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.32em] text-cyan-300 ring-1 ring-cyan-400/30">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]"/>
                N°1 anti-douleur
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.32em] text-rose-600 ring-1 ring-rose-300">
                -{DISCOUNT_PCT}% aujourd'hui
              </span>
            </div>

            <h1 className="pd-display mx-auto max-w-[860px] text-center text-[42px] font-black leading-[1] tracking-[-0.02em] text-[#0a1628] sm:text-[64px] lg:text-[80px]">
              Stop aux <span className="pd-grad-cyan">douleurs</span>.<br/>
              En <span className="pd-grad-coral">3 secondes</span>.
            </h1>

            <p className="pd-body mx-auto mt-5 max-w-[640px] text-center text-[14px] leading-relaxed text-neutral-700 sm:text-[16px]">
              Patch chauffant nouvelle generation. Diffusion therapeutique <strong className="font-bold text-[#0a1628]">jusqu'a 12h</strong> sur la zone douloureuse. Mal de dos, sciatique, arthrose, rhumatismes — le soulagement est instantane.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex gap-0.5 text-amber-400">{[...Array(5)].map((_, k) => <Star key={k} className="h-4 w-4"/>)}</div>
              <span className="text-[12px] font-bold text-neutral-700">4.7 / 5 · <span className="underline decoration-dotted underline-offset-2">800+ avis verifies</span></span>
            </div>

            <div className="relative mx-auto mt-8 max-w-[680px]">
              <div className="absolute -inset-2 hidden rounded-[40px] bg-gradient-to-br from-cyan-200/40 via-sky-200/40 to-orange-200/40 blur-2xl sm:block"/>
              <div className="relative overflow-hidden rounded-[36px] ring-1 ring-cyan-300/30 shadow-[0_40px_100px_-20px_rgba(6,182,212,0.4)]">
                <LazyImg src={MEDIA.hero} alt="Patch Anti-Douleur — vue produit" eager aspect="1/1" className="bg-neutral-100"/>
                <div className="absolute -bottom-5 -right-3 flex h-24 w-24 rotate-[-10deg] flex-col items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white shadow-[0_20px_45px_-12px_rgba(249,115,22,0.7)] ring-4 ring-white sm:-right-6 sm:h-32 sm:w-32">
                  <span className="pd-display text-[28px] font-black leading-none sm:text-[36px]">-{DISCOUNT_PCT}%</span>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] sm:text-[9px]">aujourd'hui</span>
                </div>
                <div className="absolute -top-3 left-3 rotate-[-3deg] rounded-md bg-cyan-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-md sm:-top-4 sm:left-6">
                  Sans effets secondaires
                </div>
              </div>
            </div>

            <div className="mx-auto mt-10 flex max-w-[640px] flex-col items-center gap-5 rounded-3xl border border-cyan-200/70 bg-white/90 p-6 shadow-[0_25px_60px_-15px_rgba(6,182,212,0.25)] backdrop-blur sm:flex-row sm:justify-between">
              <div className="flex items-end gap-3">
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500">Prix d'introduction</span>
                  <div className="mt-1 flex items-baseline gap-2.5">
                    <span className="pd-display text-[40px] font-black leading-none text-[#0a1628] sm:text-[48px]">{fmtNum(orderTotal(PRICES, 1))} <span className="text-[18px] font-bold tracking-tight text-neutral-500">F</span></span>
                    <span className="text-[14px] font-bold text-neutral-400 line-through">{fmtF(OLD_PRICE_UNIT)}</span>
                  </div>
                </div>
              </div>
              <CTA onClick={() => openOrder(1)} variant="primary" size="lg">
                Commander maintenant
                <ArrowR/>
              </CTA>
            </div>

            <div className="mx-auto mt-6 flex max-w-[640px] items-center gap-3 rounded-2xl bg-[#0a1628] px-5 py-3 text-cyan-100 ring-1 ring-cyan-400/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-75"/>
                <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-400"/>
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2 text-[11px] font-bold">
                  <span className="uppercase tracking-[0.18em] text-cyan-300">Stock disponible</span>
                  <span className="tabular-nums text-white">{stock} restantes</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-sky-400 transition-all" style={{ width: `${stockPct}%` }}/>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Marquee items={[
        'Soulagement en 3 secondes',
        'Patch chauffant therapeutique',
        'Livraison 24h Abidjan',
        'Paiement a la livraison',
        'Sans effet secondaire',
        '800+ clients soulages',
      ]} accent/>

      {/* ============================================== */}
      {/* BLOC 1 — AVANT/APRES SLIDER                    */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20" ref={r1}>
        <div className="mx-auto w-full max-w-[860px] text-center">
          {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-600">Bloc 01 · Avant / Apres</span>}
          <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[34px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[48px]'}`}>
            Le <span className="pd-grad-cyan">resultat</span> {isTk ? 'visible' : 'qui parle de lui-meme'}.
          </h2>
          {!isTk && <p className="pd-body mx-auto mt-3 max-w-[520px] text-[14px] text-neutral-600 sm:text-[15px]">Glissez le curseur pour voir la transformation en quelques secondes seulement.</p>}

          <div className="mx-auto mt-8 max-w-[520px]">
            <BeforeAfter before={MEDIA.avant} after={MEDIA.apres}/>
          </div>

          <div className="mt-8">
            <CTA onClick={() => openOrder(1)} variant="primary" size="lg">
              Je veux le meme resultat
              <ArrowR/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BLOC 2 — VIDEO 1 (en action)                   */}
      {/* ============================================== */}
      <section className="relative bg-[#0a1628] px-4 py-14 text-white sm:px-6 sm:py-20" ref={r2}>
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-40 right-10 h-[400px] w-[400px] rounded-full bg-cyan-500 blur-[140px]"/>
          <div className="absolute -bottom-40 left-10 h-[400px] w-[400px] rounded-full bg-sky-500 blur-[140px]"/>
        </div>
        <div className="relative mx-auto w-full max-w-[860px] text-center">
          {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-300">Bloc 02 · En action</span>}
          <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[34px] font-black leading-[1.05] tracking-tight text-white sm:text-[48px]'}`}>
            Vous le sentez en <span className="pd-grad-cyan">3 secondes</span>.
          </h2>
          {!isTk && <p className="pd-body mx-auto mt-3 max-w-[520px] text-[14px] text-cyan-100/85 sm:text-[15px]">Une chaleur progressive, profonde, qui detend le muscle et apaise le nerf.</p>}

          <div className="mx-auto mt-8 max-w-[420px]">
            <LazyVideo src={MEDIA.video1} aspect="9/16"/>
          </div>

          <div className="mt-8">
            <CTA onClick={() => openOrder(1)} variant="primary" size="lg">
              Soulager mes douleurs
              <ArrowR/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BLOC 3 — IMAGE GALLERY-1 (effet chauffant)     */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20" ref={r3}>
        <div className="mx-auto w-full max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-600">Bloc 03 · Effet chauffant</span>}
            <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[32px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[44px]'}`}>
              <span className="pd-grad-cyan">Chaleur therapeutique</span> {isTk ? '12h' : 'qui agit en profondeur.'}
            </h2>
            {!isTk && <p className="pd-body mt-4 text-[14px] text-neutral-600 sm:text-[15px]">Le patch chauffe en quelques secondes et libere une chaleur douce pendant 8 a 12 heures. Aucun risque, aucun effet secondaire.</p>}
            {!isTk && (
              <ul className="mt-5 space-y-2.5 text-[13px] text-neutral-700 sm:text-[14px]">
                <li className="flex items-start gap-2.5"><Check/>Activation en 3 secondes apres pose</li>
                <li className="flex items-start gap-2.5"><Check/>Chaleur diffuse jusqu'a 12 heures</li>
                <li className="flex items-start gap-2.5"><Check/>Discret sous les vetements</li>
                <li className="flex items-start gap-2.5"><Check/>100% naturel, sans medicament</li>
              </ul>
            )}
            <div className="mt-6">
              <CTA onClick={() => openOrder(1)} variant="primary" size="lg">
                Profiter de l'offre aujourd'hui
                <ArrowR/>
              </CTA>
            </div>
          </div>
          <div className="relative lg:col-span-7">
            <div className="absolute -inset-3 hidden rounded-[40px] bg-gradient-to-br from-cyan-200/40 to-sky-200/40 blur-2xl sm:block"/>
            <div className="relative overflow-hidden rounded-[32px] ring-1 ring-cyan-300/30 shadow-[0_30px_70px_-15px_rgba(6,182,212,0.3)]">
              <LazyImg src={MEDIA.gallery1} alt="Patch chauffant en action" aspect="4/3"/>
            </div>
          </div>
        </div>
      </section>

      <Marquee items={[
        'Mal de dos · Mal de genoux · Sciatique',
        'Articulations · Tensions musculaires',
        'Arthrose · Rhumatismes · Lombalgie',
        'Pour homme et pour femme',
      ]} dark/>

      {/* ============================================== */}
      {/* BLOC 4 — VIDEO 2 (mal de dos)                  */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20" ref={r4}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-orange-50/60 to-transparent"/>
        <div className="relative mx-auto w-full max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <div className="relative lg:col-span-7 lg:order-1">
            <div className="absolute -inset-3 hidden rounded-[40px] bg-gradient-to-br from-orange-200/40 to-rose-200/40 blur-2xl sm:block"/>
            <div className="relative mx-auto max-w-[420px] sm:max-w-none">
              <LazyVideo src={MEDIA.video2} aspect="9/16"/>
            </div>
          </div>
          <div className="lg:col-span-5 lg:order-2">
            {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-600">Bloc 04 · Mal de dos</span>}
            <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[32px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[44px]'}`}>
              Douleurs qui <span className="pd-grad-coral">reviennent</span> ?
            </h2>
            {!isTk && <p className="pd-body mt-4 text-[14px] text-neutral-600 sm:text-[15px]">Lombalgie, sciatique, tensions, raideurs... Un patch suffit. Posez, sentez la chaleur, vivez sans douleur.</p>}
            <div className="mt-6">
              <CTA onClick={() => openOrder(2)} variant="urgent" size="lg">
                Commander maintenant
                <ArrowR/>
              </CTA>
              {!isTk && <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">2 boites · economisez {fmtNum(PRICES[1] * 2 - PRICES[2])} F</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BLOC 5 — PREMIUM MAN-BACK-1 (homme)            */}
      {/* ============================================== */}
      <section className="relative bg-gradient-to-br from-[#fafaf9] via-cyan-50/40 to-orange-50/40 px-4 py-14 sm:px-6 sm:py-20" ref={r5}>
        <div className="mx-auto w-full max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-600">Bloc 05 · Pour homme</span>}
            <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[32px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[44px]'}`}>
              Dos qui <span className="pd-grad-coral">souffre</span> ?
            </h2>
            {!isTk && <p className="pd-body mt-4 text-[14px] text-neutral-600 sm:text-[15px]">Travail penible, posture, age, sport... Quelle que soit la cause, ce patch redonne mobilite et confort.</p>}
            {!isTk && (
              <ul className="mt-5 grid grid-cols-2 gap-2.5 text-[13px] text-neutral-700">
                <li className="flex items-start gap-2"><Check/>Bureau prolonge</li>
                <li className="flex items-start gap-2"><Check/>Sport intensif</li>
                <li className="flex items-start gap-2"><Check/>Travaux physiques</li>
                <li className="flex items-start gap-2"><Check/>Stress chronique</li>
              </ul>
            )}
            <div className="mt-6">
              <CTA onClick={() => openOrder(1)} variant="primary" size="lg">
                Je passe ma commande
                <ArrowR/>
              </CTA>
            </div>
          </div>
          <div className="relative lg:col-span-7">
            <div className="relative overflow-hidden rounded-[32px] ring-1 ring-cyan-300/30 shadow-[0_30px_70px_-15px_rgba(6,182,212,0.3)]">
              <LazyImg src={MEDIA.manBack1} alt="Homme avec mal de dos — solution patch chauffant" aspect="4/3"/>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1628]/30 via-transparent to-transparent"/>
              <div className="absolute bottom-4 left-4 max-w-[70%] rounded-2xl bg-white/95 p-3.5 ring-1 ring-cyan-200 backdrop-blur sm:p-4">
                <p className="text-[12px] font-black uppercase tracking-widest text-cyan-700 sm:text-[13px]">Resultat ressenti</p>
                <p className="mt-1 text-[15px] font-bold leading-tight text-[#0a1628] sm:text-[17px]">"Mon dos ne me reveille plus la nuit."</p>
                <p className="mt-1 text-[11px] text-neutral-500">— Sidibe K., Cocody</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BLOC 6 — USAGE 3 GESTES                        */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20" ref={r6}>
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-600">Bloc 06 · 3 gestes</span>}
            <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[34px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[48px]'}`}>
              <span className="pd-grad-cyan">3 gestes</span>. <span className="pd-grad-coral">3 sec</span>.
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            <div className="relative lg:col-span-7">
              <div className="absolute -inset-3 hidden rounded-[40px] bg-gradient-to-br from-cyan-200/30 to-orange-200/30 blur-2xl sm:block"/>
              <div className="relative overflow-hidden rounded-[32px] ring-1 ring-cyan-300/30 shadow-[0_30px_70px_-15px_rgba(6,182,212,0.3)]">
                <LazyImg src={MEDIA.usage} alt="Comment utiliser le patch anti-douleur — 3 etapes" aspect="4/3"/>
              </div>
            </div>
            <div className="lg:col-span-5">
              <ol className="space-y-4">
                {[
                  { n: '01', t: 'Retirez', d: 'Decollez le film protecteur du patch.' },
                  { n: '02', t: 'Appliquez', d: 'Posez sur la zone douloureuse, peau seche.' },
                  { n: '03', t: 'Soulagez', d: 'Le patch chauffe et agit pendant 8 a 12h.' },
                ].map((s) => (
                  <li key={s.n} className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-4 ring-1 ring-cyan-100 transition-shadow hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.3)]">
                    <span className="pd-display flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-cyan-500 text-[18px] font-black text-white shadow-[0_8px_20px_-4px_rgba(6,182,212,0.65)]">{s.n}</span>
                    <div>
                      <p className="pd-display text-[18px] font-extrabold tracking-tight text-[#0a1628]">{s.t}</p>
                      {!isTk && <p className="pd-body mt-1 text-[13px] text-neutral-600">{s.d}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <CTA onClick={() => openOrder(1)} variant="primary" size="lg" fullWidth>
                  Soulager maintenant
                  <ArrowR/>
                </CTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BLOC 7 — VIDEO 3 (sciatique/arthrose)          */}
      {/* ============================================== */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#1a2540] px-4 py-14 text-white sm:px-6 sm:py-20" ref={r7}>
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500 blur-[160px]"/>
        </div>
        <div className="relative mx-auto w-full max-w-[860px] text-center">
          {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Bloc 07 · Douleurs chroniques</span>}
          <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[34px] font-black leading-[1.05] tracking-tight text-white sm:text-[48px]'}`}>
            <span className="pd-grad-cyan">Sciatique</span> · <span className="pd-grad-coral">arthrose</span>
          </h2>
          {!isTk && <p className="pd-body mx-auto mt-4 max-w-[560px] text-[14px] text-cyan-100/85 sm:text-[15px]">Solution naturelle plebiscitee pour les douleurs chroniques de l'age. Action profonde, soulagement durable, mobilite retrouvee.</p>}

          <div className="mx-auto mt-8 max-w-[420px]">
            <LazyVideo src={MEDIA.video3} aspect="9/16"/>
          </div>

          <div className="mt-8">
            <CTA onClick={() => openOrder(2)} variant="urgent" size="lg">
              Commander avec paiement a la livraison
              <ArrowR/>
            </CTA>
            {!isTk && <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/60">aucun risque · paiement uniquement a la reception</p>}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BLOC 8 — IMAGE GALLERY-2 (clients soulages)    */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20" ref={r8}>
        <div className="mx-auto w-full max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <div className="relative lg:col-span-7 lg:order-1">
            <div className="absolute -inset-3 hidden rounded-[40px] bg-gradient-to-br from-cyan-200/30 to-amber-200/30 blur-2xl sm:block"/>
            <div className="relative overflow-hidden rounded-[32px] ring-1 ring-cyan-300/30 shadow-[0_30px_70px_-15px_rgba(6,182,212,0.3)]">
              <LazyImg src={MEDIA.gallery2} alt="Clients soulages par le patch anti-douleur" aspect="4/3"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a1628]/85 via-[#0a1628]/40 to-transparent p-5 text-white sm:p-6">
                <span className="rounded-md bg-amber-400 px-2 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-[#0a1628]">verifie</span>
                <p className="pd-display mt-2 text-[20px] font-extrabold leading-tight text-white sm:text-[24px]">Des centaines de clients soulages.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 lg:order-2">
            {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-amber-600">Bloc 08 · Preuve</span>}
            <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[32px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[44px]'}`}>
              Ils <span className="pd-grad-cyan">recommandent</span>
            </h2>
            {!isTk && <p className="pd-body mt-4 text-[14px] text-neutral-600 sm:text-[15px]">Parce qu'apres une seule pose, ils sentent la difference. La douleur s'estompe, le muscle se detend, le confort revient.</p>}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex gap-0.5 text-amber-400">{[...Array(5)].map((_, k) => <Star key={k}/>)}</div>
              <span className="text-[12px] font-bold text-neutral-700">4.7 / 5 sur 800+ avis</span>
            </div>
            <div className="mt-6">
              <CTA onClick={() => openOrder(1)} variant="primary" size="lg">
                Je veux mon patch
                <ArrowR/>
              </CTA>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BLOC 9 — PREMIUM MAN-BACK-2 (homme & femme)    */}
      {/* ============================================== */}
      <section className="relative bg-gradient-to-br from-orange-50/40 via-white to-cyan-50/40 px-4 py-14 sm:px-6 sm:py-20" ref={r9}>
        <div className="mx-auto w-full max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-600">Bloc 09 · Pour tous</span>}
            <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[32px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[44px]'}`}>
              <span className="pd-grad-coral">Homme</span> & <span className="pd-grad-cyan">femme</span>
            </h2>
            {!isTk && <p className="pd-body mt-4 text-[14px] text-neutral-600 sm:text-[15px]">Articulations, dos, epaules, genoux, cervicales — adapte a toutes les zones et a tous les ages.</p>}
            {!isTk && (
              <ul className="mt-5 grid grid-cols-2 gap-2.5 text-[13px] text-neutral-700">
                <li className="flex items-start gap-2"><Check/>Adultes & seniors</li>
                <li className="flex items-start gap-2"><Check/>Homme & femme</li>
                <li className="flex items-start gap-2"><Check/>Sportifs & sedentaires</li>
                <li className="flex items-start gap-2"><Check/>Sans contre-indication</li>
              </ul>
            )}
            <div className="mt-6">
              <CTA onClick={() => openOrder(2)} variant="urgent" size="lg">
                Profiter de l'offre
                <ArrowR/>
              </CTA>
            </div>
          </div>
          <div className="relative lg:col-span-7">
            <div className="relative overflow-hidden rounded-[32px] ring-1 ring-orange-300/30 shadow-[0_30px_70px_-15px_rgba(249,115,22,0.3)]">
              <LazyImg src={MEDIA.manBack2} alt="Patch anti-douleur applique sur le dos" aspect="4/3"/>
              <div className="absolute right-4 top-4 rounded-md bg-amber-400 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-[#0a1628] shadow-md">100% naturel</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BLOC 10 — GALLERY-3 + BANNER (split clients)   */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20" ref={r10}>
        <div className="mx-auto w-full max-w-[1100px] text-center">
          {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-600">Bloc 10 · Adopte partout</span>}
          <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[34px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[48px]'}`}>
            <span className="pd-grad-cyan">Abidjan</span> · <span className="pd-grad-coral">partout en CI</span>
          </h2>
          {!isTk && <p className="pd-body mx-auto mt-3 max-w-[560px] text-[14px] text-neutral-600 sm:text-[15px]">Adopte par des centaines de clients en Cote d'Ivoire pour ses resultats rapides.</p>}

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-[28px] ring-1 ring-cyan-300/30 shadow-[0_25px_60px_-15px_rgba(6,182,212,0.3)]">
              <LazyImg src={MEDIA.gallery3} alt="Galerie clients patch anti-douleur" aspect="4/3"/>
            </div>
            <div className="relative overflow-hidden rounded-[28px] ring-1 ring-orange-300/30 shadow-[0_25px_60px_-15px_rgba(249,115,22,0.3)]">
              <LazyImg src={MEDIA.banner} alt="Bandeau clients et avis Patch Anti-Douleur" aspect="4/3"/>
            </div>
          </div>

          <div className="mt-8">
            <CTA onClick={() => openOrder(1)} variant="primary" size="lg">
              Commander avec paiement a la livraison
              <ArrowR/>
            </CTA>
          </div>
        </div>
      </section>

      <Marquee items={[
        '⭐ 4.7/5 · 800+ avis verifies',
        'Livraison 24h Abidjan',
        'Paiement a la livraison',
        'Plus que ' + stock + ' boites',
        'Sans effets secondaires',
      ]} dark/>

      {/* ============================================== */}
      {/* STATS BADGES                                   */}
      {/* ============================================== */}
      <section className="relative bg-gradient-to-br from-cyan-50/30 via-white to-orange-50/30 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
          {[
            { n: '800+', l: 'Clients soulages' },
            { n: '24h',  l: 'Livraison Abidjan' },
            { n: '4.7/5', l: 'Note moyenne' },
            { n: '97%',  l: 'Recommandent' },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl border border-cyan-200/50 bg-white p-5 text-center shadow-[0_20px_40px_-20px_rgba(6,182,212,0.25)]">
              <p className="pd-display text-[34px] font-black leading-none tracking-tight text-[#0a1628] sm:text-[42px]">{s.n}</p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-neutral-600 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================== */}
      {/* TEMOIGNAGES — WhatsApp + SMS                   */}
      {/* ============================================== */}
      <section className="relative bg-[#0a1628] px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-cyan-500 blur-[140px]"/>
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-orange-400 blur-[140px]"/>
        </div>
        <div className="relative mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            {!isTk && <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-300">Temoignages clients</span>}
            <h2 className={`pd-display ${isTk ? 'mt-0' : 'mt-3'} text-[34px] font-black leading-[1.05] tracking-tight text-white sm:text-[48px]'}`}>
              <span className="pd-grad-cyan">Confort</span> retrouve
            </h2>
            {!isTk && <p className="pd-body mx-auto mt-3 max-w-[520px] text-[14px] text-cyan-100/80 sm:text-[15px]">Avis recents, messages WhatsApp, SMS — tous verifies.</p>}
          </div>

          {/* Chat WhatsApp 1 */}
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* WhatsApp */}
            <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)] ring-1 ring-cyan-300/15">
              <div className="flex items-center gap-3 bg-emerald-700 px-4 py-3 text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-[14px] font-black">SK</div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold leading-tight">Sidibe K.</p>
                  <p className="text-[10px] text-emerald-100/85">+225 07 ** ** 81 · en ligne</p>
                </div>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.96.57 3.78 1.55 5.32L2 22l4.83-1.55C8.27 21.43 10.06 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.45 14.43c-.23.65-1.34 1.23-1.85 1.32-.47.08-1.07.13-1.74-.11-.4-.13-.91-.3-1.57-.58-2.78-1.2-4.59-3.99-4.74-4.18-.13-.18-1.13-1.5-1.13-2.86 0-1.36.71-2.03.96-2.31.25-.28.55-.35.74-.35h.51c.16 0 .39-.05.61.46.23.55.79 1.91.86 2.05.07.14.12.3.02.48-.09.18-.14.3-.28.46-.14.16-.3.36-.43.49-.14.14-.29.29-.13.55.16.27.71 1.18 1.52 1.91 1.05.94 1.93 1.23 2.2 1.36.27.13.43.11.59-.07.16-.18.69-.81.87-1.09.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.13.46.2.52.31.06.12.06.66-.17 1.31z"/></svg>
              </div>
              <div className="space-y-2 bg-[#ECE5DD] p-4">
                {[
                  { side: 'them', text: 'Bonjour ! J\'utilise le patch depuis 5 jours pour mon mal de dos.', time: '08:42' },
                  { side: 'them', text: 'Je dors enfin la nuit, merci 🙏', time: '08:42' },
                  { side: 'me',   text: 'Super Sidibe ! Continuez 1 patch/jour pendant 14j.', time: '08:43' },
                  { side: 'them', text: 'Je vais commander 2 boites de plus pour ma femme', time: '08:44' },
                ].map((m, j) => (
                  <div key={j} className={`flex ${m.side === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed shadow-sm ${m.side === 'me' ? 'bg-[#dcf8c6] text-neutral-900' : 'bg-white text-neutral-900'}`}>
                      <p>{m.text}</p>
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${m.side === 'me' ? 'text-emerald-700/70' : 'text-neutral-400'}`}>
                        <span>{m.time}</span>
                        {m.side === 'me' && <svg className="h-3 w-3 text-cyan-500" fill="currentColor" viewBox="0 0 24 24"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" opacity=".7"/></svg>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-white px-4 py-2.5 text-[11px] font-bold text-neutral-700">
                <div className="flex gap-0.5 text-amber-400">{[...Array(5)].map((_, k) => <Star key={k}/>)}</div>
                <span className="uppercase tracking-widest text-[9px]">Verifie · achat confirme</span>
              </div>
            </div>

            {/* SMS messages */}
            <div className="lg:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { n: 'Aminata B.', city: 'Bouake', ph: '+225 05 ** ** 17', q: 'Mon mal de dos depuis 6 mois a disparu en 1 semaine. Incroyable.' },
                { n: 'Yao D.',     city: 'Yopougon', ph: '+225 07 ** ** 42', q: 'Le patch chauffe vraiment. Au boulot je n\'ai plus mal au dos.' },
                { n: 'Kone N.',    city: 'Daloa', ph: '+225 01 ** ** 90', q: 'Ma sciatique me reveillait la nuit. Plus rien depuis 4 jours.' },
                { n: 'Fatou M.',   city: 'San Pedro', ph: '+225 05 ** ** 33', q: 'Service rapide. Le produit est efficace, je recommande.' },
                { n: 'Oumar T.',   city: 'Korhogo', ph: '+225 07 ** ** 65', q: 'Mon pere l\'utilise pour ses rhumatismes. Il revit.' },
                { n: 'Awa O.',     city: 'Treichville', ph: '+225 01 ** ** 14', q: 'Je mets le patch et la chaleur me detend en 3 secondes.' },
              ].map((m, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-cyan-500 p-[1px]">
                  <div className="rounded-[15px] bg-[#0c1e2e] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-black text-white">{m.n}</p>
                      <p className="text-[9px] font-mono text-cyan-300/80">{m.ph}</p>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-snug text-cyan-50">"{m.q}"</p>
                    <div className="mt-3 flex items-center justify-between text-[9px]">
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 font-black uppercase tracking-widest text-cyan-200">{m.city}</span>
                      <div className="flex gap-0.5 text-amber-400">{[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3"/>)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <CTA onClick={() => openOrder(2)} variant="urgent" size="lg">
              Je veux soulager mes douleurs
              <ArrowR/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* ILS EN PARLENT (formulations prudentes)        */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-600">Ils en parlent</span>
            <h2 className="pd-display mt-3 text-[28px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[36px]">
              Adopte par les <span className="pd-grad-cyan">clients du quotidien</span>.
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { ico: '🩹', t: 'Recommande par de nombreux utilisateurs', d: 'Pour son action chauffante rapide.' },
              { ico: '⭐', t: 'Tres apprecie pour les douleurs du quotidien', d: 'Lombalgie, sciatique, raideurs.' },
              { ico: '🇨🇮', t: 'Adopte a Abidjan et partout en Cote d\'Ivoire', d: 'Livre dans toutes les villes en 24-48h.' },
              { ico: '🌿', t: '100% naturel et sans effet secondaire', d: 'Aucun medicament dans la formule.' },
            ].map((it, i) => (
              <div key={i} className="rounded-3xl border border-cyan-200/50 bg-white p-5 shadow-[0_20px_40px_-20px_rgba(6,182,212,0.25)] transition-transform duration-300 hover:-translate-y-1">
                <div className="text-[28px]">{it.ico}</div>
                <p className="pd-display mt-2 text-[15px] font-extrabold leading-snug tracking-tight text-[#0a1628] sm:text-[16px]">{it.t}</p>
                <p className="pd-body mt-1.5 text-[12.5px] text-neutral-600">{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* BUNDLES                                        */}
      {/* ============================================== */}
      <section className="relative bg-gradient-to-br from-cyan-50/40 via-white to-orange-50/40 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-600">Choisissez votre cure</span>
            <h2 className="pd-display mt-3 text-[34px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[48px]">
              <span className="pd-grad-coral">Offre speciale</span> aujourd`hui.
            </h2>
            <p className="pd-body mx-auto mt-3 max-w-[520px] text-[14px] text-neutral-600 sm:text-[15px]">Plus vous prenez, plus vous economisez. Stock limite a {stock} unites.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {QTY_OPTS.map((o) => {
              const isBest = o.v === 3;
              const isPopular = o.v === 2;
              const oldVal = o.v * OLD_PRICE_UNIT;
              const realVal = orderTotal(PRICES, o.v);
              return (
                <div
                  key={o.v}
                  className={`relative overflow-hidden rounded-[28px] border-2 p-6 transition-all hover:-translate-y-1 ${
                    isBest
                      ? 'border-orange-400 bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#0a1628] text-white shadow-[0_25px_60px_-15px_rgba(249,115,22,0.5)]'
                      : isPopular
                        ? 'border-cyan-400 bg-cyan-50/50 text-[#0a1628] shadow-[0_20px_45px_-15px_rgba(6,182,212,0.4)]'
                        : 'border-neutral-200 bg-white text-[#0a1628] hover:border-cyan-300'
                  }`}
                >
                  {(o.tag) && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-[0.32em] shadow-md ${
                      isBest ? 'bg-gradient-to-r from-orange-400 to-rose-400 text-white' : 'bg-gradient-to-r from-cyan-400 to-sky-400 text-white'
                    }`}>{o.tag}</span>
                  )}

                  <div className="flex items-baseline gap-2">
                    <span className={`pd-display text-[42px] font-black leading-none ${isBest ? 'text-cyan-300' : 'text-[#0a1628]'} sm:text-[52px]`}>{o.v}</span>
                    <span className={`pd-display text-[20px] italic ${isBest ? 'text-cyan-100' : 'text-neutral-600'}`}>{o.label}</span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`pd-display text-[28px] font-black tabular-nums ${isBest ? 'text-white' : 'text-[#0a1628]'} sm:text-[34px]'}`}>{fmt(realVal).split(' ').slice(0, -1).join(' ')}</span>
                    <span className={`text-[14px] font-bold ${isBest ? 'text-cyan-200' : 'text-neutral-500'}`}>F</span>
                  </div>

                  {o.v > 1 && (
                    <p className={`mt-1 text-[11px] ${isBest ? 'text-cyan-200/80' : 'text-neutral-500'}`}>
                      au lieu de <span className="line-through">{fmt(oldVal).replace(' FCFA', ' F')}</span>
                    </p>
                  )}

                  {o.save && (
                    <span className={`mt-3 inline-block rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                      isBest ? 'bg-amber-400 text-[#0a1628]' : 'bg-emerald-100 text-emerald-700'
                    }`}>{o.save}</span>
                  )}

                  <ul className={`mt-5 space-y-2 text-[12px] ${isBest ? 'text-cyan-100/85' : 'text-neutral-700'}`}>
                    <li className="flex items-start gap-2"><Check className={isBest ? 'text-cyan-300' : ''}/>{o.v} boite{o.v > 1 ? 's' : ''} de patchs</li>
                    <li className="flex items-start gap-2"><Check className={isBest ? 'text-cyan-300' : ''}/>Livraison 24-48h</li>
                    <li className="flex items-start gap-2"><Check className={isBest ? 'text-cyan-300' : ''}/>Paiement a la livraison</li>
                    {isBest && <li className="flex items-start gap-2"><Check className="text-amber-400"/>Garantie satisfait ou rembourse</li>}
                  </ul>

                  <button
                    onClick={() => openOrder(o.v)}
                    className={`pd-cta group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3.5 text-[12.5px] font-black uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5 ${
                      isBest
                        ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-[#0a1628] shadow-[0_18px_40px_-10px_rgba(249,115,22,0.65)] pd-glow-coral'
                        : isPopular
                          ? 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 text-white shadow-[0_18px_40px_-10px_rgba(6,182,212,0.55)] pd-glow-cyan'
                          : 'bg-[#0a1628] text-cyan-300 ring-1 ring-cyan-400/30 hover:bg-[#0c1e2e]'
                    }`}
                  >
                    <span className="pd-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent"/>
                    <span className="relative z-10">Commander</span>
                    <ArrowR/>
                  </button>

                  <p className={`mt-2.5 text-center text-[10px] ${isBest ? 'text-cyan-200/60' : 'text-neutral-500'}`}>Stock : {Math.max(2, stock - (o.v * 4))} restantes</p>
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { ico: '🚚', t: 'Livraison 24-48h', d: 'Toute la Cote d\'Ivoire' },
              { ico: '💵', t: 'Paiement livraison', d: 'Aucun risque' },
              { ico: '🔒', t: 'Commande securisee', d: 'Confidentialite totale' },
              { ico: '📞', t: 'Conseiller dedie', d: 'Appel sous 30 min' },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl bg-white p-4 ring-1 ring-cyan-200/60 shadow-[0_15px_30px_-15px_rgba(6,182,212,0.25)]">
                <div className="text-[22px]">{b.ico}</div>
                <p className="pd-display mt-1.5 text-[13px] font-extrabold leading-tight text-[#0a1628]">{b.t}</p>
                <p className="pd-body text-[11px] text-neutral-500">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* FAQ COMPACTE                                   */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-[820px]">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.45em] text-cyan-600">Questions frequentes</span>
            <h2 className="pd-display mt-3 text-[28px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[36px]">
              Tout ce que vous devez <span className="pd-grad-cyan">savoir</span>.
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {[
              { q: 'Combien de temps dure le soulagement ?', a: 'Le patch agit pendant 8 a 12 heures par application.' },
              { q: 'Est-ce adapte au mal de dos ?', a: 'Oui — dos, epaules, genoux, cervicales, sciatique, rhumatisme.' },
              { q: 'Dois-je payer avant la livraison ?', a: 'Non. Paiement uniquement a la reception.' },
              { q: 'Y a-t-il des effets secondaires ?', a: 'Non. Le patch est 100% naturel et sans medicament.' },
              { q: 'Peut-on le porter sous les vetements ?', a: 'Oui, il est discret, fin et confortable toute la journee.' },
            ].map((it, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white open:ring-1 open:ring-cyan-300">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-[13.5px] font-bold text-[#0a1628] sm:text-[14px]">
                  <span>{it.q}</span>
                  <svg className="h-4 w-4 shrink-0 text-cyan-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <div className="px-4 pb-4 text-[13px] text-neutral-600">{it.a}</div>
              </details>
            ))}
          </div>

          <div className="mt-8 text-center">
            <CTA onClick={() => openOrder(1)} variant="primary" size="lg">
              Commander maintenant
              <ArrowR/>
            </CTA>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">paiement a la livraison · sans engagement</p>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* CTA FINAL DRAMATIQUE                           */}
      {/* ============================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#1a2540] px-4 py-16 text-center text-white sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-cyan-500 blur-[160px]"/>
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-orange-500 blur-[160px]"/>
        </div>
        <div className="relative mx-auto w-full max-w-[820px]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200 ring-1 ring-cyan-300/30 backdrop-blur">
            Offre disponible aujourd'hui
          </span>
          <h2 className="pd-display mt-5 text-[40px] font-black leading-[1] tracking-tight text-white sm:text-[60px]">
            Votre <span className="pd-grad-cyan">confort</span> commence ici.
          </h2>
          <p className="pd-body mx-auto mt-4 max-w-[560px] text-[14px] text-cyan-100/85 sm:text-[16px]">Reservez votre patch maintenant. Paiement a la livraison. Aucun engagement.</p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <CTA onClick={() => openOrder(2)} variant="urgent" size="lg">
              Profiter de l'offre aujourd'hui
              <ArrowR/>
            </CTA>
            <span className="font-mono text-[12px] tabular-nums text-cyan-300/80">
              fin dans <span className="pd-pulse-digit">{pad(countdown.h)}</span>:<span className="pd-pulse-digit">{pad(countdown.m)}</span>:<span className="pd-pulse-digit">{pad(countdown.s)}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* FOOTER                                         */}
      {/* ============================================== */}
      <footer className="bg-[#0a1628] px-4 py-8 text-center text-cyan-200/60 sm:px-6">
        <div className="mx-auto max-w-[1100px]">
          <p className="pd-display text-[14px] font-extrabold tracking-tight text-cyan-200">Patch Anti-Douleur · Ob'rille</p>
          <p className="mt-2 text-[11px] text-cyan-200/60">Paiement a la livraison · Livraison rapide en Cote d'Ivoire</p>
          <p className="mt-1 text-[11px] text-cyan-200/40">© 2026 — Tous droits reserves</p>
        </div>
      </footer>

      {/* ============================================== */}
      {/* STICKY BUY BAR — fixe en BAS de l`ecran        */}
      {/* ============================================== */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-500 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}
        aria-hidden={!showSticky}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0a1628] via-[#0c1e2e] to-[#0a1628] shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.6)] ring-1 ring-cyan-400/20">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="pd-glow-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"/>
          </div>
          <div className="relative mx-auto flex w-full max-w-[1100px] items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
            {/* Prix + countdown (gauche) */}
            <div className="pointer-events-none flex flex-1 flex-col gap-0.5 leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="pd-display text-[19px] font-black tabular-nums text-cyan-300 sm:text-[22px]">{fmtF(orderTotal(PRICES, 1))}</span>
                <span className="text-[11px] font-bold text-neutral-400 line-through">{fmtF(OLD_PRICE_UNIT)}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-cyan-200/85 sm:text-[11px]">
                <span className="hidden sm:inline">offre fin dans </span>
                <span className="pd-pulse-digit">{pad(countdown.h)}</span>:<span className="pd-pulse-digit">{pad(countdown.m)}</span>:<span className="pd-pulse-digit">{pad(countdown.s)}</span>
                <span className="ml-2 inline-flex items-center gap-1 align-middle">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-75"/>
                    <span className="relative h-1.5 w-1.5 rounded-full bg-rose-400"/>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-200">live</span>
                </span>
              </span>
            </div>
            {/* CTA primary (droite) */}
            <button
              onClick={() => openOrder(1)}
              className="pointer-events-auto pd-cta group relative flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_-4px_rgba(6,182,212,0.7)] transition hover:-translate-y-0.5 sm:px-5 sm:py-3 sm:text-[12.5px] pd-glow-cyan"
            >
              <span className="pd-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent"/>
              <span className="relative">Commander</span>
              <ArrowR/>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================== */}
      {/* FLOATING TOAST — preuve sociale, ancree a GAUCHE */}
      {/* Position : bottom + left calee a gauche, decalee */}
      {/* au-dessus du sticky CTA bar pour ne pas le gener.*/}
      {/* ============================================== */}
      {toast && (
        <div
          className={`pointer-events-none fixed left-3 z-[45] max-w-[calc(100vw-1.5rem)] transform transition-all duration-500 sm:left-6 sm:max-w-[340px] ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
        >
          <div className="flex items-start gap-3 rounded-2xl bg-white p-3 pr-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-cyan-200">
            <div className="pd-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-cyan-500 text-[14px] font-black text-white">{toast.n[0]}</div>
            <div className="text-left">
              <p className="text-[12px] font-bold text-[#0a1628]">{toast.n} <span className="font-normal text-neutral-500">de {toast.v}</span></p>
              <p className="text-[10.5px] text-neutral-500">vient de commander · il y a {toast.t}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* EXIT INTENT POPUP                              */}
      {/* ============================================== */}
      {exitPopup && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-[#0a1628]/85 px-4 backdrop-blur-md" onClick={() => setExitPopup(false)}>
          <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-cyan-300/30" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200" onClick={() => setExitPopup(false)} aria-label="Fermer">×</button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-rose-700 ring-1 ring-rose-200">attendez !</span>
            <h4 className="pd-display mt-3 text-[28px] font-black leading-[1.05] tracking-tight text-[#0a1628]">
              <span className="pd-grad-coral">Offre speciale</span> avant de partir.
            </h4>
            <p className="pd-body mt-3 text-[13.5px] text-neutral-600">Profitez de l'offre <strong className="text-[#0a1628]">2 boites a {fmtF(orderTotal(PRICES, 2))}</strong> avant la rupture de stock.</p>
            <div className="mt-5">
              <CTA onClick={() => { setExitPopup(false); openOrder(2); }} variant="urgent" size="lg" fullWidth>
                Je profite de l'offre
                <ArrowR/>
              </CTA>
              <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">paiement a la livraison · livraison 24h</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* ORDER MODAL                                    */}
      {/* ============================================== */}
      <OrderModalDispatcher
        slug={slug}
        open={open}
        onClose={() => setOpen(false)}
        cfg={cfg}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />

      {/* ============================================== */}
      {/* INLINE STYLES                                  */}
      {/* ============================================== */}
      <style>{`
        @keyframes pdMarquee   { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes pdSheen     { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes pdPulseDigit{ 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        @keyframes pdRevealIn  { 0% { opacity: 0; transform: translateY(28px) } 100% { opacity: 1; transform: translateY(0) } }
        @keyframes pdGlowCyan  {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.55), 0 18px 45px -10px rgba(6,182,212,0.55) }
          50%      { box-shadow: 0 0 0 8px rgba(6,182,212,0),    0 22px 55px -8px rgba(14,165,233,0.85) }
        }
        @keyframes pdGlowCoral {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.55), 0 18px 45px -10px rgba(249,115,22,0.55) }
          50%      { box-shadow: 0 0 0 8px rgba(249,115,22,0),    0 22px 55px -8px rgba(244,63,94,0.85) }
        }
        @keyframes pdGlowSweep {
          0%   { transform: translateX(0) }
          100% { transform: translateX(400%) }
        }

        .pd-marquee     { animation: pdMarquee 28s linear infinite }
        .pd-cta-sheen   { animation: pdSheen 3.5s ease-in-out infinite }
        .pd-cta:hover .pd-cta-sheen { animation-duration: 1.5s }
        .pd-pulse-digit { animation: pdPulseDigit 1s ease-in-out infinite }
        .pd-glow-cyan   { animation: pdGlowCyan 2.6s ease-in-out infinite }
        .pd-glow-coral  { animation: pdGlowCoral 2.6s ease-in-out infinite }
        .pd-glow-sweep  { animation: pdGlowSweep 3.5s ease-in-out infinite }

        /* Reveal-on-scroll */
        .pd-reveal-pre  { opacity: 0; transform: translateY(28px) }
        .pd-reveal-in   { animation: pdRevealIn 0.8s cubic-bezier(.22,.8,.4,1) forwards }

        /* Typographies (chargees via index.html) */
        .pd-display {
          font-family: 'Bricolage Grotesque', 'Sora', 'Inter', 'Helvetica Neue', sans-serif;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .pd-body {
          font-family: 'Outfit', 'Inter', 'Helvetica Neue', sans-serif;
          font-weight: 400;
        }

        /* Mots forts en gradient cyan */
        .pd-grad-cyan {
          background-image: linear-gradient(110deg, #0891b2 0%, #06b6d4 35%, #22d3ee 70%, #06b6d4 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        /* Mots forts en gradient corail/orange */
        .pd-grad-coral {
          background-image: linear-gradient(110deg, #f43f5e 0%, #f97316 50%, #fb923c 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </div>
  );
}
