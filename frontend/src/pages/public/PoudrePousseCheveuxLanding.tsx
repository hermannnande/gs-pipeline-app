/**
 * Landing MAGAZINE EDITORIAL — Poudre Ultra Pousse Cheveux (POUDRE_CHEVEUX)
 * =========================================================================
 *
 * Style signature : MAGAZINE DE LUXE / EDITORIAL VOGUE
 *   - Fond IVOIRE / CREME dominant (zero hero "sombre" classique)
 *   - Hero plein-bleed asymetrique : image dominante a droite, typographie XL a gauche
 *   - Chapitres numerotes (CHAPITRE 01, 02...) facon edition limitee
 *   - Lettrines (drop caps) au debut des paragraphes editoriaux
 *   - Quotes XL italiques en fond chamois
 *   - Slider avant/apres INTERACTIF drag-to-reveal
 *   - Timeline resultats horizontale Jour 7 / 14 / 30 / 60
 *   - Stories format Instagram en scroll horizontal
 *   - Mosaique editoriale 4 cellules pour la formule
 *   - Logos presse minimalistes sans cadre
 *   - Bundle cards horizontales avec ribbon doré
 *
 * Palette : IVOIRE FONCE / TERRACOTTA / OR ROSE / EMERAUDE accent
 *
 * 13 medias UNIQUES dans des layouts uniques :
 *   hero      - couverture magazine plein-bleed
 *   block-1   - photo problematique (chute) - layout split asymetrique
 *   block-2   - photo tempes - quote XL italique
 *   block-3   - photo routine - mosaique 4 cellules
 *   block-4   - photo calvitie - timeline timeline jour 7-14-30
 *   block-5   - photo densite - bloc testimonial XL
 *   block-6   - affiche brand - section "ingredients & promesse"
 *   block-7   - avant - slider interactif
 *   block-8   - apres - slider interactif
 *   avatar    - portrait dans temoignage XL
 *   video-1   - video formule (loop) - bloc cinema
 *   video-2   - video temoignage (loop) - stories format
 *   video-3   - video resultat (loop) - bloc cinema XL
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'poudre-pousse-cheveux';
const PRODUCT_CODE = 'POUDRE_CHEVEUX';
// Pixel Meta dedie a la campagne Poudre Pousse Cheveux (Purchase + CAPI dedup via eventID = orderReference)
const META_PIXEL_ID = '1985154128771811';
const THANK_YOU_URL = '/poudre-pousse-cheveux/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 boite',  sub: packLabel(PRICES, 1, 'FCFA'),  tag: '',                save: '' },
  { v: 2, label: '2 boites', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Populaire',       save: 'Economisez 2 900 F' },
  { v: 3, label: '3 boites', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Cure complete',   save: 'Economisez 4 800 F' },
];

const MEDIA = {
  hero:       '/poudre-pousse-cheveux/hero.webp',
  heroVideo:  '/poudre-pousse-cheveux/hero.mp4',
  block1:  '/poudre-pousse-cheveux/block-1.webp',
  block2:  '/poudre-pousse-cheveux/block-2.webp',
  block3:  '/poudre-pousse-cheveux/block-3.webp',
  block4:  '/poudre-pousse-cheveux/block-4.webp',
  block5:  '/poudre-pousse-cheveux/block-5.webp',
  block6:  '/poudre-pousse-cheveux/block-6.webp',
  block7:  '/poudre-pousse-cheveux/block-7.webp',
  block8:  '/poudre-pousse-cheveux/block-8.webp',
  avatar:  '/poudre-pousse-cheveux/avatar.webp',
  video1:  '/poudre-pousse-cheveux/video-1.mp4',
  video2:  '/poudre-pousse-cheveux/video-2.mp4',
  video3:  '/poudre-pousse-cheveux/video-3.mp4',
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
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '-80px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function LazyVideo({ src, aspect = '9/16', className = '', priority = false, poster }: { src: string; aspect?: string; className?: string; priority?: boolean; poster?: string }) {
  const { ref, visible } = useOnScreen('300px');
  // Mode priority : charge et joue immediatement (utilise pour la video hero).
  if (priority) {
    return (
      <div className={`relative w-full overflow-hidden bg-neutral-200 ${className}`} style={{ aspectRatio: aspect }}>
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
      </div>
    );
  }
  return (
    <div ref={ref} className={`relative w-full overflow-hidden bg-neutral-200 ${className}`} style={{ aspectRatio: aspect }}>
      {visible ? (
        <video src={src} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-600"/>
        </div>
      )}
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
        : <div className="h-full w-full animate-pulse bg-neutral-200"/>}
    </div>
  );
}

// =========================================================
// Atoms
// =========================================================
const Star = ({ className = "" }: { className?: string }) => (
  <svg className={`h-3.5 w-3.5 ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

const ArrowR = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-7l7 7-7 7"/>
  </svg>
);

// CTA editorial : pilule fine, glow chaud
function CTA({
  onClick,
  children,
  variant = 'gold',
  size = 'md',
  fullWidth = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'gold' | 'ivory' | 'emerald' | 'electric';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const styles: Record<string, string> = {
    gold:    'bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 text-neutral-950 hover:from-cyan-500 hover:via-cyan-400 hover:to-blue-600 shadow-[0_18px_40px_-12px_rgba(0,212,255,0.55)] hover:shadow-[0_24px_55px_-10px_rgba(0,128,255,0.85)] ring-1 ring-cyan-200/50 ppc-glow-cyan',
    ivory:   'bg-neutral-50 text-neutral-900 ring-1 ring-neutral-300 hover:bg-white shadow-[0_10px_28px_-8px_rgba(0,0,0,0.18)]',
    emerald: 'bg-neutral-950 text-cyan-300 hover:bg-black shadow-[0_14px_32px_-10px_rgba(0,128,255,0.5)] ring-1 ring-cyan-400/40',
    electric:'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-white hover:from-cyan-500 hover:via-sky-600 hover:to-blue-700 shadow-[0_18px_45px_-10px_rgba(0,212,255,0.65)] hover:shadow-[0_24px_55px_-8px_rgba(0,128,255,0.9)] ring-1 ring-cyan-300/50 ppc-glow-cyan',
  };
  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-[11px]',
    md: 'px-7 py-3.5 text-[12px]',
    lg: 'px-9 py-4 text-[12.5px] sm:text-[13.5px]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ppc-cta group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-black uppercase tracking-[0.22em] transition-all duration-300 ${styles[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="ppc-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/65 to-transparent"/>
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </button>
  );
}

// Marquee fine editoriale
function MarqueeBar({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <div className={`overflow-hidden border-y py-2.5 ${dark ? 'border-cyan-300/15 bg-neutral-900 text-cyan-200' : 'border-neutral-300/50 bg-neutral-100 text-neutral-800'}`}>
      <div className="ppc-marquee flex w-[200%] items-center gap-10 text-[10px] font-black uppercase tracking-[0.32em]">
        {[0, 1].map(k => (
          <div key={k} className="flex shrink-0 items-center gap-10">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-3.5">
                <span>{t}</span>
                <span className="inline-block h-[3px] w-[3px] rotate-45 bg-current"/>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Numero de chapitre style edition limitee
function ChapterMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-neutral-700">
      <span className="ppc-display block text-[68px] leading-[0.85] tracking-tight text-[#00d4ff] sm:text-[88px]">{n}</span>
      <div className="flex flex-col">
        <span className="text-[8.5px] font-black uppercase tracking-[0.42em] text-neutral-500">Chapitre</span>
        <span className="ppc-serif mt-0.5 text-[14px] italic leading-tight text-neutral-700 sm:text-[16px]">{label}</span>
      </div>
    </div>
  );
}

// Quote XL en italique avec guillemets en or
function PullQuote({ children, source }: { children: React.ReactNode; source?: string }) {
  return (
    <figure className="relative my-10 px-5">
      <span className="ppc-display absolute -top-6 left-0 text-[100px] leading-none text-[#00d4ff]/40 select-none">“</span>
      <blockquote className="ppc-serif relative z-10 text-[24px] italic leading-[1.25] text-neutral-800 sm:text-[30px]">
        {children}
      </blockquote>
      {source && (
        <figcaption className="mt-3 text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
          — {source}
        </figcaption>
      )}
    </figure>
  );
}

// Slider avant/apres interactif (drag pour comparer)
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMove = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    setPos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onMove(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    onMove(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none overflow-hidden rounded-[2px] bg-neutral-200 ring-1 ring-neutral-300"
      style={{ aspectRatio: '4/5', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <LazyImg src={after} alt="Apres" className="absolute inset-0" aspect="4/5"/>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <div className="h-full" style={{ width: wrapRef.current ? `${wrapRef.current.offsetWidth}px` : '100%' }}>
          <LazyImg src={before} alt="Avant" className="h-full w-full" aspect="4/5"/>
        </div>
      </div>

      <div className="absolute left-3 top-3 rounded-sm bg-neutral-900/85 px-2 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-cyan-200">Avant</div>
      <div className="absolute right-3 top-3 rounded-sm bg-cyan-200 px-2 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-neutral-900">Apres</div>

      {/* Handle vertical */}
      <div
        className="pointer-events-none absolute inset-y-0 z-20 w-[2px] bg-cyan-200 shadow-[0_0_20px_rgba(252,211,77,0.7)]"
        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
      />
      <div
        className="absolute z-30 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-200 text-neutral-900 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] ring-2 ring-neutral-900"
        style={{ left: `${pos}%`, top: '50%', transform: 'translate(-50%,-50%)' }}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5l-7 7 7 7M13 5l7 7-7 7"/>
        </svg>
      </div>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900/85 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-cyan-200">Glissez pour comparer</span>
    </div>
  );
}

// =========================================================
// Main component
// =========================================================
export default function PoudrePousseCheveuxLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(23);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const [exitPopup, setExitPopup] = useState(false);
  const [watchers, setWatchers] = useState(34);
  const [showSticky, setShowSticky] = useState(false);
  const exitShown = useRef(false);
  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const TOASTS = useMemo(() => [
    { n: 'Marie K.',     v: 'Cocody',      t: '4 min'  },
    { n: 'Yao A.',       v: 'Yopougon',    t: '8 min'  },
    { n: 'Aicha B.',     v: 'Treichville', t: '12 min' },
    { n: 'Serge T.',     v: 'Bouake',      t: '17 min' },
    { n: 'Fatou D.',     v: 'San Pedro',   t: '22 min' },
    { n: 'Mariam S.',    v: 'Daloa',       t: '25 min' },
    { n: 'Awa O.',       v: 'Korhogo',     t: '29 min' },
    { n: 'Konan P.',     v: 'Abobo',       t: '34 min' },
  ], []);

  // Preload hero (video au-dessus du fold)
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'video'; l.href = MEDIA.heroVideo;
    // @ts-ignore
    l.fetchPriority = 'high';
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch {} };
  }, []);

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Poudre Ultra Pousse Cheveux',
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
    const id = setInterval(() => setStock(s => Math.max(7, s - (Math.random() < 0.3 ? 1 : 0))), 18000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setWatchers(w => Math.max(22, Math.min(58, w + Math.floor((Math.random() - 0.5) * 6)))), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let mounted = true;
    const showNext = () => {
      if (!mounted) return;
      const t = TOASTS[toastIdx.current % TOASTS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 4200);
    };
    const t1 = setTimeout(showNext, 3500);
    const id = setInterval(showNext, 12000);
    return () => { mounted = false; clearTimeout(t1); clearInterval(id); };
  }, [TOASTS]);

  useEffect(() => {
    const onLeave = (e: MouseEvent) => {
      if (exitShown.current) return;
      if (e.clientY < 10) { exitShown.current = true; setExitPopup(true); }
    };
    document.addEventListener('mouseleave', onLeave);
    return () => document.removeEventListener('mouseleave', onLeave);
  }, []);

  const openOrder = useCallback((q: number = 1) => {
    setQty(q);
    setModal(true);
  }, []);

  const stockPct = Math.max(15, Math.min(100, Math.round((stock / 35) * 100)));

  const ch1 = useReveal(); const ch2 = useReveal(); const ch3 = useReveal();
  const ch4 = useReveal(); const ch5 = useReveal(); const ch6 = useReveal();

  return (
    <div className="ppc-root min-h-screen overflow-x-hidden bg-[#f5f5f7] text-neutral-900 antialiased">
      {/* ============================================== */}
      {/* MASTHEAD - en-tete magazine */}
      {/* ============================================== */}
      <header className="border-b border-neutral-300/60 bg-[#f5f5f7]">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-5 py-3 sm:py-4">
          <span className="text-[8.5px] font-black uppercase tracking-[0.4em] text-neutral-600 sm:text-[10px]">N° 04 · Edition limitee</span>
          <span className="ppc-display text-[18px] font-bold tracking-tight text-neutral-900 sm:text-[22px]">Powder Power Hair</span>
          <span className="hidden text-[8.5px] font-black uppercase tracking-[0.4em] text-neutral-600 sm:inline sm:text-[10px]">Avril 2026</span>
          <span className="text-[8.5px] font-black uppercase tracking-[0.4em] text-neutral-600 sm:hidden">Avr. 26</span>
        </div>
      </header>

      <MarqueeBar
        items={[
          'Plus que ' + stock + ' boites',
          'Livraison 24h Abidjan',
          'Paiement a la livraison',
          'Hommes & Femmes',
          'Sans effet secondaire',
          'Resultats en quelques jours',
          `100% naturel`,
        ]}
      />

      {/* ============================================== */}
      {/* HERO ALLEGE — VIDEO en avant, texte minimal */}
      {/* ============================================== */}
      <section className="relative overflow-hidden bg-[#f5f5f7] px-4 pt-5 pb-8 sm:pt-8 sm:pb-12">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center lg:gap-10">

          {/* Colonne VIDEO en hero (au-dessus sur mobile, a droite sur desktop) */}
          <div className="relative z-0 order-1 lg:order-2 lg:col-span-7">
            <div className="relative">
              <div className="absolute -inset-2 hidden bg-[#00d4ff]/10 sm:block"/>
              <div className="absolute -inset-1 hidden border border-[#00d4ff]/30 sm:block"/>
              <div className="relative">
                <LazyVideo
                  src={MEDIA.heroVideo}
                  poster={MEDIA.hero}
                  aspect="4/5"
                  className="w-full"
                  priority
                />
                <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-neutral-900/5"/>
              </div>
              {/* Sticker rond "edition limitee" */}
              <div className="absolute -bottom-5 -right-2 flex h-24 w-24 rotate-[-10deg] flex-col items-center justify-center rounded-full bg-neutral-900 text-cyan-200 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.4)] sm:-bottom-8 sm:-right-5 sm:h-32 sm:w-32">
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Edition</span>
                <span className="ppc-display text-[22px] leading-none sm:text-[28px]">04</span>
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Limitee</span>
              </div>
              {/* Sticker stock */}
              <div className="absolute -top-2 left-2 rotate-[-3deg] bg-cyan-200 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-neutral-900 shadow-md sm:-top-4 sm:left-6 sm:py-2.5">
                Stock : {stock} boites
              </div>
            </div>
          </div>

          {/* Colonne TYPO ultra-courte */}
          <div className="relative z-10 order-2 lg:order-1 lg:col-span-5">
            <div className="flex items-center gap-2.5 text-neutral-600">
              <span className="ppc-display text-[44px] leading-[0.8] text-[#00d4ff] sm:text-[60px]">N°1</span>
              <div className="border-l border-neutral-300 pl-2.5">
                <p className="text-[9px] font-black uppercase tracking-[0.42em] text-neutral-500">Beaute capillaire</p>
                <p className="ppc-serif mt-0.5 text-[13px] italic text-neutral-700 sm:text-[15px]">la formule signature</p>
              </div>
            </div>

            <h1 className="ppc-display mt-5 text-[44px] font-bold leading-[0.92] tracking-tight text-neutral-900 sm:text-[58px] lg:text-[68px]">
              Reveiller <span className="italic text-[#00d4ff]">vos cheveux</span>.
            </h1>

            {/* Prix + CTA inline */}
            <div className="mt-6 flex flex-wrap items-end gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="ppc-display text-[38px] leading-none text-neutral-900 sm:text-[48px]">{fmtTotal(1)} <span className="text-[18px] font-bold tracking-tight text-neutral-500">F</span></span>
                  <span className="text-[12px] font-bold text-neutral-400 line-through">15 000 F</span>
                </div>
                <span className="mt-1 inline-block rounded-sm bg-neutral-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-200">-34% aujourd`hui</span>
              </div>
              <CTA onClick={() => openOrder(1)} variant="gold" size="lg">
                Commander
                <ArrowR/>
              </CTA>
            </div>

            {/* Etoiles + countdown discret */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-700">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5 text-[#00d4ff]">
                  {[...Array(5)].map((_, k) => <Star key={k} className="h-3.5 w-3.5"/>)}
                </div>
                <span className="text-[11px] font-bold tracking-wide">4.9 · 1 247 avis</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">
                Offre dans
                <span className="ppc-display ml-1 text-[14px] tabular-nums text-neutral-900">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* CHAPITRE 01 — split asymetrique : image + texte editorial */}
      {/* ============================================== */}
      <section ref={ch1.ref} className={`relative overflow-hidden bg-[#f5f5f7] px-5 py-12 sm:py-20 ${ch1.visible ? 'ppc-reveal-in' : 'ppc-reveal-pre'}`}>
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-12">
          <div className="lg:col-span-6">
            <ChapterMark n="01" label="Le probleme silencieux"/>
            <h2 className="ppc-display mt-7 text-[44px] font-bold leading-[0.92] text-neutral-900 sm:text-[58px]">
              <span className="ppc-underline-thick">La chute</span><br/>
              <span className="italic text-neutral-700">commence en silence.</span>
            </h2>
            <p className="ppc-serif mt-6 text-[16px] leading-[1.65] text-neutral-800 sm:text-[17px]">
              <span className="ppc-dropcap">D</span>ans la brosse. Sur l'oreiller. Au fond de la douche. Quand la chute s'installe, on attend. On espere. On regarde la racine s'eclaircir, mois apres mois.
            </p>
            <p className="ppc-serif mt-4 text-[16px] leading-[1.65] text-neutral-800 sm:text-[17px]">
              Le bon moment d'agir n'est pas demain. <em>C'est aujourd'hui.</em>
            </p>
            <div className="mt-8">
              <CTA onClick={() => openOrder(1)} variant="gold" size="lg">
                Stopper la chute
                <ArrowR/>
              </CTA>
            </div>
          </div>
          <div className="relative lg:col-span-6">
            <div className="relative">
              <LazyImg src={MEDIA.block1} alt="Probleme chute" className="w-full" aspect="3/4"/>
              <div className="absolute -bottom-3 left-3 max-w-[230px] bg-neutral-900 px-4 py-3 text-cyan-200 sm:-bottom-5 sm:left-5">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] opacity-70">Statistique</p>
                <p className="ppc-display mt-1 text-[18px] leading-tight sm:text-[20px]">8 personnes sur 10 verront leurs cheveux s`eclaircir avant 35 ans.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE XL */}
      <section className="bg-[#fafafa] px-5 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <PullQuote source="Aicha B. — Treichville">
            "Mes tresses avaient abime les bords. <span className="text-[#00d4ff] not-italic font-bold">Powder Power Hair</span> a tout change. Mes bordures sont pleines, mes cheveux poussent visiblement plus vite — et <em>ca ne graisse pas.</em>"
          </PullQuote>
        </div>
      </section>

      {/* ============================================== */}
      {/* CHAPITRE 02 — split inverse : video formule + texte */}
      {/* ============================================== */}
      <section ref={ch2.ref} className={`relative overflow-hidden bg-[#f5f5f7] px-5 py-12 sm:py-20 ${ch2.visible ? 'ppc-reveal-in' : 'ppc-reveal-pre'}`}>
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* Texte gauche */}
          <div className="order-2 lg:order-1 lg:col-span-6">
            <ChapterMark n="02" label="La formule"/>
            <h2 className="ppc-display mt-7 text-[44px] font-bold leading-[0.92] text-neutral-900 sm:text-[58px]">
              Une <span className="italic text-[#00d4ff]">poudre.</span><br/>
              Trente <span className="ppc-underline-thick">secondes.</span>
            </h2>
            <p className="ppc-serif mt-6 text-[16px] leading-[1.65] text-neutral-800 sm:text-[17px]">
              <span className="ppc-dropcap">U</span>n geste, le matin ou le soir. Massage doux du cuir chevelu, 20 a 30 secondes. La poudre nourrit en profondeur — sans rincage, sans effet gras, sans odeur.
            </p>
            <ul className="mt-6 space-y-2 text-[14px] text-neutral-800 sm:text-[15px]">
              {['Ne salit pas le coussin', 'Ne graisse pas les racines', 'Convient a tous les types de cuirs chevelus'].map((it, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rotate-45 bg-[#00d4ff]"/>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <CTA onClick={() => openOrder(2)} variant="gold" size="lg">
                Je commande ma cure
                <ArrowR/>
              </CTA>
            </div>
          </div>
          {/* Video droite */}
          <div className="order-1 lg:order-2 lg:col-span-6">
            <div className="relative">
              <div className="absolute -inset-1 hidden border border-[#00d4ff]/30 sm:block"/>
              <LazyVideo src={MEDIA.video1} aspect="9/16" className="relative"/>
              <span className="absolute left-3 top-3 rounded-sm bg-neutral-900/85 px-2 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-cyan-200">Demo formule</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* MOSAIQUE EDITORIALE — 4 cellules avec block-3 + 3 micro-textes */}
      {/* ============================================== */}
      <section className="bg-[#fafafa] px-5 py-12 sm:py-20">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-neutral-500">Decryptage</span>
            <h3 className="ppc-display mt-2 text-[36px] leading-[0.95] text-neutral-900 sm:text-[48px]">
              <span className="italic text-[#00d4ff]">Quatre</span> verites
              <br/>
              sur la pousse
            </h3>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {/* Cellule 1 - image */}
            <div className="relative col-span-2 row-span-2 lg:col-span-2 lg:row-span-2">
              <LazyImg src={MEDIA.block3} alt="Routine simple" className="w-full" aspect="1/1"/>
              <div className="absolute bottom-0 left-0 max-w-[80%] bg-neutral-900 px-3 py-2 text-cyan-200">
                <p className="text-[9px] font-black uppercase tracking-[0.32em] opacity-70">N°01</p>
                <p className="ppc-serif mt-0.5 text-[14px] italic">une routine, des resultats.</p>
              </div>
            </div>
            {/* Cellule 2 */}
            <div className="aspect-square bg-[#00d4ff] p-5 text-cyan-50">
              <p className="text-[9px] font-black uppercase tracking-[0.32em] opacity-80">Action</p>
              <p className="ppc-display mt-3 text-[34px] leading-[0.9] sm:text-[44px]">+89%</p>
              <p className="mt-2 text-[12px] leading-snug">de densite ressentie en 8 semaines</p>
            </div>
            {/* Cellule 3 */}
            <div className="aspect-square bg-neutral-900 p-5 text-cyan-200">
              <p className="text-[9px] font-black uppercase tracking-[0.32em] opacity-70">Vitesse</p>
              <p className="ppc-display mt-3 text-[34px] leading-[0.9] text-cyan-200 sm:text-[44px]">7j</p>
              <p className="mt-2 text-[12px] leading-snug text-cyan-200/85">premiers signes visibles des la 1ere semaine</p>
            </div>
            {/* Cellule 4 */}
            <div className="aspect-square bg-neutral-50 p-5 text-neutral-900 ring-1 ring-neutral-300">
              <p className="text-[9px] font-black uppercase tracking-[0.32em] text-neutral-500">Origine</p>
              <p className="ppc-display mt-3 text-[34px] leading-[0.9] sm:text-[44px]">100%</p>
              <p className="mt-2 text-[12px] leading-snug text-neutral-700">extraits de plantes — zero produit chimique agressif</p>
            </div>
            {/* Cellule 5 */}
            <div className="aspect-square bg-[#f5f5f7] p-5 text-neutral-900 ring-1 ring-neutral-300">
              <p className="text-[9px] font-black uppercase tracking-[0.32em] text-neutral-500">Confort</p>
              <p className="ppc-display mt-3 text-[34px] leading-[0.9] sm:text-[44px]">0</p>
              <p className="mt-2 text-[12px] leading-snug text-neutral-700">effet secondaire — formule douce certifiee</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <CTA onClick={() => openOrder(2)} variant="emerald" size="lg">
              Adopter la routine
              <ArrowR/>
            </CTA>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* CHAPITRE 03 — Slider avant/apres interactif */}
      {/* ============================================== */}
      <section ref={ch3.ref} className={`relative overflow-hidden bg-[#f5f5f7] px-5 py-12 sm:py-20 ${ch3.visible ? 'ppc-reveal-in' : 'ppc-reveal-pre'}`}>
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-5">
            <ChapterMark n="03" label="La preuve qui parle"/>
            <h2 className="ppc-display mt-7 text-[44px] font-bold leading-[0.92] text-neutral-900 sm:text-[56px]">
              <span className="italic text-neutral-700">Glissez,</span><br/>
              voyez la <span className="ppc-underline-thick">difference.</span>
            </h2>
            <p className="ppc-serif mt-6 text-[16px] italic leading-[1.65] text-neutral-700 sm:text-[17px]">
              <span className="ppc-dropcap">L</span>e meme client. Le meme angle. La meme lumiere. <em>Trois mois d'ecart.</em>
            </p>
            <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.3em] text-neutral-500">↔ Glissez le curseur pour comparer</p>
            <div className="mt-7">
              <CTA onClick={() => openOrder(2)} variant="gold" size="lg">
                Je veux ce resultat
                <ArrowR/>
              </CTA>
            </div>
          </div>
          <div className="lg:col-span-7">
            <BeforeAfterSlider before={MEDIA.block7} after={MEDIA.block8}/>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* TIMELINE — Jour 7 / 14 / 30 / 60 */}
      {/* ============================================== */}
      <section className="relative overflow-hidden bg-neutral-900 px-5 py-12 text-cyan-100 sm:py-20">
        <span className="pointer-events-none absolute -top-40 -left-20 h-80 w-80 rounded-full bg-[#00d4ff]/20 blur-3xl"/>
        <span className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl"/>

        <div className="relative mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-cyan-300/70">Chronologie</span>
            <h3 className="ppc-display mt-2 text-[36px] leading-[0.95] text-cyan-50 sm:text-[52px]">
              60 jours qui<br/>
              <span className="italic text-cyan-300">tout changent.</span>
            </h3>
          </div>

          <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:gap-6 lg:justify-center lg:overflow-visible">
            {[
              { day: '07', title: 'La sensation', text: 'Cuir chevelu plus tonique. Premiers signes : moins de cheveux dans la brosse.', img: null as string | null },
              { day: '14', title: 'Le declic',    text: 'La densite est ressentie au coiffage. Les baby hair pointent leur nez.', img: MEDIA.block2 },
              { day: '30', title: 'Le miracle',   text: 'Tempes comblees. Les bordures retrouvent leur jeunesse. Volume rebondi.', img: MEDIA.block4 },
              { day: '60', title: 'Le triomphe',  text: 'Cheveux denses, brillants, coiffure XXL retrouvee. Confiance maximale.', img: MEDIA.block5 },
            ].map((s, i) => (
              <div key={i} className="relative flex w-[230px] shrink-0 snap-center flex-col bg-neutral-800 p-5 ring-1 ring-cyan-300/15 sm:w-[260px]">
                <div className="flex items-baseline gap-2">
                  <span className="text-[8.5px] font-black uppercase tracking-[0.42em] text-cyan-300/70">Jour</span>
                  <span className="ppc-display text-[60px] leading-[0.85] text-cyan-300 sm:text-[72px]">{s.day}</span>
                </div>
                <p className="ppc-serif mt-1 text-[16px] italic text-cyan-50 sm:text-[18px]">{s.title}</p>
                <p className="mt-3 text-[12px] leading-relaxed text-cyan-100/85 sm:text-[13px]">{s.text}</p>
                <div className="mt-4">
                  {s.img ? (
                    <LazyImg src={s.img} alt={`Jour ${s.day}`} className="w-full" aspect="3/4"/>
                  ) : (
                    <div className="relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br from-black via-cyan-950 to-black ring-1 ring-cyan-300/20" style={{ aspectRatio: '3/4' }}>
                      <span className="ppc-display select-none text-[120px] font-black leading-none text-cyan-300/90 sm:text-[140px]">{s.day}</span>
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-[0.42em] text-cyan-200/70">Premiers signaux</span>
                      <span className="pointer-events-none absolute -inset-1 bg-gradient-to-tr from-cyan-400/0 via-teal-400/10 to-cyan-400/0"/>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <CTA onClick={() => openOrder(3)} variant="gold" size="lg">
              Demarrer ma chronologie
              <ArrowR/>
            </CTA>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/60">cure 3 boites recommandee pour 60 jours</p>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* CHAPITRE 04 — Bloc cinema video resultat HD */}
      {/* ============================================== */}
      <section ref={ch4.ref} className={`relative overflow-hidden bg-[#f5f5f7] px-0 py-12 sm:py-20 ${ch4.visible ? 'ppc-reveal-in' : 'ppc-reveal-pre'}`}>
        <div className="mx-auto w-full max-w-[1100px] px-5">
          <div className="text-center">
            <ChapterMark n="04" label="Sequence cinema"/>
            <h2 className="ppc-display mt-6 text-[44px] leading-[0.95] text-neutral-900 sm:text-[58px]">
              Voyez la <span className="italic text-[#00d4ff]">transformation</span>
              <br/>
              en <span className="ppc-underline-thick">haute definition.</span>
            </h2>
          </div>
        </div>
        <div className="relative mt-10 w-full">
          <LazyVideo src={MEDIA.video3} aspect="16/9" className="w-full"/>
          {/* Overlay magazine */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-5 sm:p-10">
            <span className="rounded-sm bg-neutral-900/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">HD 1080p · sans filtre</span>
            <span className="ppc-display rotate-[-2deg] bg-cyan-200 px-4 py-2 text-[16px] text-neutral-900 shadow sm:text-[20px]">"transformation reelle"</span>
          </div>
        </div>
        <div className="mt-10 text-center px-5">
          <CTA onClick={() => openOrder(3)} variant="emerald" size="lg">
            Profiter de l'offre
            <ArrowR/>
          </CTA>
        </div>
      </section>

      {/* QUOTE XL #2 */}
      <section className="bg-[#fafafa] px-5 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <PullQuote source="Yao A. — Yopougon">
            "Je portais la casquette tout le temps. Apres un mois, je l`ai laissee a la maison. <span className="text-[#00d4ff] not-italic font-bold">Mes baby hair poussent.</span>"
          </PullQuote>
        </div>
      </section>

      {/* ============================================== */}
      {/* TESTIMONIAL HERO XL — bloc full editorial avec photo */}
      {/* ============================================== */}
      <section ref={ch5.ref} className={`relative overflow-hidden bg-[#f5f5f7] px-5 py-12 sm:py-20 ${ch5.visible ? 'ppc-reveal-in' : 'ppc-reveal-pre'}`}>
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-2 bg-[#00d4ff]/10"/>
              <LazyImg src={MEDIA.avatar} alt="Marie K. cliente" className="relative w-full" aspect="3/4"/>
            </div>
          </div>
          <div className="lg:col-span-7">
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-neutral-500">Cliente du mois</span>
            <p className="ppc-display mt-2 text-[40px] leading-[1] text-neutral-900 sm:text-[54px]">Marie K. <span className="italic text-neutral-500">29 ans, Cocody</span></p>
            <div className="mt-3 flex items-center gap-2 text-[#00d4ff]">
              {[...Array(5)].map((_, k) => <Star key={k} className="h-5 w-5"/>)}
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-700">Achat verifie</span>
            </div>
            <p className="ppc-serif mt-6 text-[20px] italic leading-[1.4] text-neutral-800 sm:text-[22px]">
              <span className="ppc-dropcap">«</span>J'avais essaye trois traitements avant. Trois deceptions. Powder Power Hair, c'est une revelation : mes tempes sont visiblement plus pleines des la 4e semaine. Mon mari l'a remarque avant moi. <em>Un cadeau.</em>»
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <CTA onClick={() => openOrder(2)} variant="gold" size="lg">
                Vivre la meme experience
                <ArrowR/>
              </CTA>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">+1 247 clientes satisfaites</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* STORIES horizontales — temoignages format Instagram */}
      {/* ============================================== */}
      <section className="bg-neutral-900 px-5 py-12 text-cyan-100 sm:py-20">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.42em] text-cyan-300/70">Stories clientes</span>
              <h3 className="ppc-display mt-2 text-[36px] leading-[0.95] text-cyan-50 sm:text-[48px]">
                Ils en <span className="italic text-cyan-300">parlent.</span>
              </h3>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/60">Glissez →</p>
            </div>
          </div>

          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:gap-5">
            {/* Story 1 - video */}
            <div className="relative w-[240px] shrink-0 snap-center sm:w-[280px]">
              <LazyVideo src={MEDIA.video2} aspect="9/16" className="rounded-sm"/>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/30 to-transparent p-3">
                <p className="ppc-serif text-[14px] italic text-cyan-50">"meilleure decision"</p>
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300/80">Aicha · Treichville</p>
              </div>
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-sm bg-cyan-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"/>Live
              </span>
            </div>

            {/* Stories text-only */}
            {[
              { name: 'Yao A.',    city: 'Yopougon',  text: 'Mes baby hair poussent. La casquette est rangee !', color: 'from-cyan-400 to-amber-600',  rate: 5, time: '4h' },
              { name: 'Fatou D.',  city: 'San Pedro', text: 'Mes amies me demandent quel produit j\'utilise. La densite est dingue.', color: 'from-cyan-400 to-cyan-600', rate: 5, time: '8h' },
              { name: 'Konan P.',  city: 'Abobo',     text: 'Calvitie naissante : la zone parait moins visible chaque semaine.', color: 'from-emerald-400 to-emerald-600', rate: 5, time: '12h' },
              { name: 'Mariam S.', city: 'Daloa',     text: 'Bordures retrouvees apres 5 semaines. Magique.', color: 'from-teal-400 to-teal-600', rate: 5, time: '1j' },
              { name: 'Awa O.',    city: 'Korhogo',   text: 'Volume +++, brillance +++. 10/10 je recommande.', color: 'from-teal-400 to-teal-600', rate: 5, time: '2j' },
            ].map((s, i) => (
              <div key={i} className="relative flex w-[200px] shrink-0 snap-center flex-col justify-between bg-gradient-to-br p-5 sm:w-[230px]" style={{ aspectRatio: '9/16' }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-95`}/>
                <span className="absolute inset-0 bg-neutral-900/30"/>
                <div className="relative">
                  <span className="block text-[8.5px] font-black uppercase tracking-[0.35em] text-white/85">il y a {s.time}</span>
                  <p className="ppc-display mt-3 text-[36px] leading-[0.9] text-white sm:text-[44px]">"</p>
                  <p className="ppc-serif mt-1 text-[15px] leading-[1.3] italic text-white sm:text-[16px]">{s.text}</p>
                </div>
                <div className="relative mt-auto">
                  <div className="flex gap-0.5 text-cyan-200">{[...Array(s.rate)].map((_, k) => <Star key={k}/>)}</div>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.28em] text-white">{s.name}</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/70">{s.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* CONVERSATION WHATSAPP — 1 seule, ultra premium */}
      {/* ============================================== */}
      <section className="bg-[#f5f5f7] px-5 py-12 sm:py-20">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-6">
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-neutral-500">Conversation reelle</span>
            <h3 className="ppc-display mt-2 text-[40px] leading-[0.95] text-neutral-900 sm:text-[52px]">
              Une<br/>
              <span className="italic text-[#00d4ff]">conversation</span><br/>
              vaut <span className="ppc-underline-thick">mille promesses.</span>
            </h3>
            <p className="ppc-serif mt-6 text-[16px] italic leading-[1.65] text-neutral-700 sm:text-[17px]">
              <span className="ppc-dropcap">L</span>es retours WhatsApp ne mentent pas. Ils sont spontanes, parfois maladroits, toujours sinceres. Voila ce qu'on lit chaque jour.
            </p>
            <div className="mt-7">
              <CTA onClick={() => openOrder(1)} variant="emerald" size="lg">
                Rejoindre la communaute
                <ArrowR/>
              </CTA>
            </div>
          </div>

          {/* Carte WhatsApp realiste */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-[400px]">
              <div className="absolute -inset-2 bg-emerald-700/10"/>
              <div className="relative overflow-hidden rounded-[22px] bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.25)] ring-1 ring-neutral-200">
                {/* Header */}
                <div className="flex items-center gap-3 bg-emerald-700 px-4 py-3 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 text-[14px] font-black text-white shadow">M</div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold">Marie K.</p>
                    <p className="text-[10px] text-emerald-100/80">en ligne</p>
                  </div>
                  <svg className="h-4 w-4 text-emerald-100" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
                </div>
                {/* Messages */}
                <div className="space-y-2 bg-[#e7e1d8] px-3 py-3">
                  {[
                    { side: 'them', text: 'Bonjour ! J\'utilise Powder Power Hair depuis 3 semaines. Mes tempes sont moins vides ✨', time: '08:42' },
                    { side: 'me',   text: 'Merci Marie ! Massage 20-30s, 1x par jour.', time: '08:43' },
                    { side: 'them', text: 'Recu en 24h. Paiement a la livraison nickel. J\'en commande 2 boites de plus 🙏', time: '08:44' },
                    { side: 'me',   text: 'Top, je vous prepare ca tout de suite ✅', time: '08:44' },
                  ].map((m, j) => (
                    <div key={j} className={`flex ${m.side === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed shadow-sm ${
                        m.side === 'me' ? 'bg-[#dcf8c6] text-neutral-900' : 'bg-white text-neutral-900'
                      }`}>
                        <p>{m.text}</p>
                        <p className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${m.side === 'me' ? 'text-emerald-700/70' : 'text-neutral-400'}`}>
                          <span>{m.time}</span>
                          {m.side === 'me' && <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" opacity=".7"/></svg>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-white px-4 py-2.5 text-[11px] font-bold">
                  <div className="flex gap-0.5 text-[#00d4ff]">{[...Array(5)].map((_, k) => <Star key={k}/>)}</div>
                  <span className="text-neutral-500 uppercase tracking-widest text-[9px]">Verifie · Achat confirme</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* SMS TEMOIGNAGES — preuve sociale "boucle a boucle" */}
      {/* Differents formats vs WhatsApp pour casser la repetition */}
      {/* ============================================== */}
      <section className="relative overflow-hidden bg-neutral-950 px-5 py-14 text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl"/>
          <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl"/>
        </div>

        <div className="relative mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-cyan-300/80">Messages clients</span>
            <h3 className="ppc-display mt-2 text-[40px] leading-[0.95] text-white sm:text-[54px]">
              Les <span className="italic bg-gradient-to-r from-cyan-300 via-sky-300 to-teal-300 bg-clip-text text-transparent">SMS</span> qu'on recoit
              <br/>
              <span className="ppc-underline-thick" style={{ backgroundImage: 'linear-gradient(transparent 60%, rgba(0,128,255,0.55) 60%, rgba(0,128,255,0.55) 95%, transparent 95%)' }}>chaque jour.</span>
            </h3>
            <p className="ppc-serif mx-auto mt-3 max-w-[520px] text-[14px] italic text-cyan-100/80 sm:text-[16px]">
              Ces messages spontanés sont la <span className="not-italic font-bold text-cyan-300">meilleure publicité</span>.
            </p>
          </div>

          {/* Grille SMS bubbles (style iPhone iMessage gradient bleu/rose) */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { from: '+225 07 81 22 ••', text: 'Salut, ma cousine veut commander 2 boites comme toi. Tu m\'envoies le lien stp ?', tag: '+1 vente generee', delay: '08:14', stars: 5 },
              { from: '+225 05 67 09 ••', text: 'Mes amies ont remarque mes baby hair hier au mariage 🥹 j\'avais oublie comme c\'etait beau', tag: 'Cliente fidele', delay: '12:42', stars: 5 },
              { from: '+225 01 23 45 ••', text: 'JE SUIS CHOQUEE. 3 semaines seulement et mes tempes sont presque pleines 😍', tag: 'Avant/apres post', delay: '19:08', stars: 5 },
              { from: '+225 09 90 12 ••', text: 'Mon mari m\'a complimente sans savoir que j\'utilisais un produit. Top secret 🤫', tag: 'Romance restored', delay: '21:33', stars: 5 },
              { from: '+225 07 65 43 ••', text: 'Bonjour, ma maman a essaye votre poudre. Elle a 58 ans, ca pousse vraiment. Merci !', tag: 'Multi-ages', delay: '07:55', stars: 5 },
              { from: '+225 05 11 22 ••', text: 'Je vous recommande sur tous mes groupes WhatsApp. Continue ce travail 💯', tag: 'Ambassadrice', delay: '15:20', stars: 5 },
            ].map((s, i) => (
              <div key={i} className="group relative">
                {/* Halo glow rose au hover */}
                <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-500/40 via-teal-500/30 to-sky-500/40 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"/>
                <div className="relative overflow-hidden rounded-3xl bg-neutral-900/90 p-5 ring-1 ring-cyan-300/15 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300/80">{s.from}</p>
                    <p className="text-[9px] font-bold text-neutral-400">{s.delay}</p>
                  </div>

                  {/* Bubble iMessage gradient */}
                  <div className="mt-3 inline-block max-w-full rounded-2xl rounded-tl-md bg-gradient-to-br from-cyan-500 via-teal-500 to-sky-500 px-4 py-3 text-[13.5px] leading-relaxed text-white shadow-[0_12px_30px_-8px_rgba(0,128,255,0.5)]">
                    {s.text}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-0.5 text-cyan-300">{[...Array(s.stars)].map((_, k) => <Star key={k} className="h-3 w-3"/>)}</div>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-200">
                      {s.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <CTA onClick={() => openOrder(2)} variant="electric" size="lg">
              Recevoir mon SMS de bienvenue
              <ArrowR/>
            </CTA>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/60">+1 247 clientes nous ecrivent chaque mois</p>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* PRESSE — logos minimaliste editorial + notes XL */}
      {/* ============================================== */}
      <section className="border-y border-neutral-300/60 bg-[#fafafa] px-5 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <p className="text-center text-[9px] font-black uppercase tracking-[0.42em] text-neutral-500">Vu dans la presse</p>

          {/* Logos */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-14">
            {[
              { name: 'JEUNE AFRIQUE',  serif: true },
              { name: 'RFI Afrique',    serif: false },
              { name: 'Afrik.com',      serif: true },
              { name: 'AFRICA RADIO',   serif: false },
              { name: 'BEAUTY CI',      serif: true },
              { name: 'GLAMOUR AFRIK',  serif: true },
            ].map((m, i) => (
              <span key={i} className={`text-neutral-700 ${m.serif ? 'ppc-display text-[18px] sm:text-[22px]' : 'text-[12px] font-black uppercase tracking-[0.32em] sm:text-[14px]'}`}>{m.name}</span>
            ))}
          </div>

          {/* Notes presse — citations en grille */}
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { rate: '9.4/10', source: 'Beauty CI · Avril 2026',  cite: '"Une revolution silencieuse pour les bordures africaines."' },
              { rate: '★★★★★',  source: 'Glamour Afrik · Mars 2026', cite: '"Une formule qui tient ses promesses sans cosmetique gras."' },
              { rate: '9.7/10', source: 'Jeune Afrique · Fev 2026', cite: '"Le geste minute qui transforme la routine capillaire."' },
            ].map((n, i) => (
              <div key={i} className="relative bg-white p-6 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.18)] ring-1 ring-neutral-200">
                <span className="ppc-display absolute -top-4 left-5 text-[60px] leading-none text-[#00d4ff]">"</span>
                <p className="mt-1 text-[18px] font-black tracking-tight text-neutral-900 sm:text-[20px]">{n.rate}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.32em] text-neutral-500">{n.source}</p>
                <p className="ppc-serif mt-3 text-[14px] italic leading-relaxed text-neutral-700">{n.cite}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* INGREDIENTS / PROMESSE — bloc avec block-6 affiche */}
      {/* ============================================== */}
      <section ref={ch6.ref} className={`relative bg-[#f5f5f7] px-5 py-12 sm:py-20 ${ch6.visible ? 'ppc-reveal-in' : 'ppc-reveal-pre'}`}>
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-6">
            <div className="relative">
              <div className="absolute -inset-2 bg-[#00d4ff]/10"/>
              <LazyImg src={MEDIA.block6} alt="Powder Power Hair" className="relative w-full" aspect="3/4"/>
            </div>
          </div>
          <div className="lg:col-span-6">
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-neutral-500">La promesse</span>
            <h3 className="ppc-display mt-2 text-[40px] leading-[0.95] text-neutral-900 sm:text-[52px]">
              <span className="italic text-[#00d4ff]">Naturelle.</span><br/>
              <span className="ppc-underline-thick">Active. Concentree.</span>
            </h3>
            <ul className="mt-7 space-y-5 text-[14px] leading-relaxed text-neutral-800 sm:text-[15px]">
              {[
                { title: 'Extraits de plantes africaines', sub: 'Reactivent les follicules endormis pour combler les zones clairsemees.' },
                { title: 'Formule sans rincage', sub: 'Massage doux, application en 30 secondes. Aucun residu visible.' },
                { title: 'Pour elles ET pour eux', sub: 'Tempes degarnies, calvitie naissante, bordures abimees, perte de volume.' },
                { title: 'Resultats en quelques jours', sub: '7 jours pour ressentir, 30 jours pour voir, 60 jours pour transformer.' },
              ].map((it, i) => (
                <li key={i} className="grid grid-cols-[24px_1fr] gap-x-3 border-b border-neutral-300/60 pb-5 last:border-b-0">
                  <span className="ppc-display text-[18px] text-[#00d4ff]">0{i + 1}</span>
                  <div>
                    <p className="ppc-serif text-[16px] italic text-neutral-900 sm:text-[18px]">{it.title}</p>
                    <p className="mt-1 text-[13px] text-neutral-700 sm:text-[14px]">{it.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* STATS PROOFLINE — 4 KPI editoriaux */}
      {/* ============================================== */}
      <section className="bg-[#00d4ff] px-5 py-12 text-cyan-50 sm:py-16">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { k: '1 247', sub: 'avis verifies' },
            { k: '4.9/5', sub: 'note moyenne' },
            { k: '89%',   sub: 'observent une difference' },
            { k: '24h',   sub: 'livraison Abidjan' },
          ].map((s, i) => (
            <div key={i} className="border-l border-cyan-50/30 pl-4">
              <p className="ppc-display text-[40px] leading-[0.9] sm:text-[58px]">{s.k}</p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-50/85">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================== */}
      {/* BUNDLES — cards horizontales editorial premium */}
      {/* ============================================== */}
      <section className="bg-[#f5f5f7] px-5 py-12 sm:py-20">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-neutral-500">Choisissez votre cure</span>
            <h3 className="ppc-display mt-2 text-[40px] leading-[0.95] text-neutral-900 sm:text-[56px]">
              Plus de boites,<br/>
              <span className="italic text-[#00d4ff]">plus d'economies.</span>
            </h3>
          </div>

          <div className="mt-10 space-y-4">
            {QTY_OPTS.map(o => {
              const isPop = o.tag === 'Populaire';
              const isBest = o.tag === 'Cure complete';
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => openOrder(o.v)}
                  className={`group relative grid w-full grid-cols-[60px_1fr_auto] items-center gap-4 overflow-hidden border-2 p-5 text-left transition-all sm:grid-cols-[80px_1fr_auto] sm:gap-6 sm:p-6 ${
                    isBest
                      ? 'border-[#00d4ff] bg-neutral-900 text-cyan-50 shadow-[0_22px_60px_-20px_rgba(0,212,255,0.7)]'
                      : isPop
                      ? 'border-[#00d4ff] bg-[#fafafa] text-neutral-900 hover:bg-[#e3d6bf]'
                      : 'border-neutral-300 bg-neutral-50 text-neutral-900 hover:border-neutral-500'
                  }`}
                >
                  {/* Badge */}
                  {o.tag && (
                    <span className={`absolute -top-2.5 right-4 rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-[0.3em] ${
                      isBest ? 'bg-cyan-200 text-neutral-900' : 'bg-[#00d4ff] text-cyan-50'
                    }`}>{o.tag}</span>
                  )}

                  <span className={`ppc-display text-[58px] leading-[0.85] sm:text-[80px] ${
                    isBest ? 'text-cyan-300' : 'text-[#00d4ff]'
                  }`}>{o.v}</span>

                  <div>
                    <p className={`ppc-serif text-[20px] italic leading-tight sm:text-[24px] ${isBest ? 'text-cyan-50' : 'text-neutral-900'}`}>{o.label}</p>
                    {o.save && <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.3em] ${isBest ? 'text-cyan-300' : 'text-[#00d4ff]'}`}>{o.save}</p>}
                    <p className={`mt-2 text-[11px] uppercase tracking-[0.25em] ${isBest ? 'text-cyan-100/75' : 'text-neutral-600'}`}>au lieu de {fmt(15000 * o.v)} F</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`ppc-display text-[28px] leading-none tabular-nums sm:text-[36px] ${isBest ? 'text-cyan-50' : 'text-neutral-900'}`}>{fmtTotal(o.v)} F</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] ${
                      isBest ? 'bg-cyan-200 text-neutral-900' : 'bg-neutral-900 text-cyan-200'
                    }`}>
                      Choisir <ArrowR/>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.32em] text-neutral-600">
            Paiement a la livraison · Sans engagement
          </p>
        </div>
      </section>

      {/* ============================================== */}
      {/* GARANTIES — bandeau editorial */}
      {/* ============================================== */}
      <section className="bg-[#fafafa] px-5 py-10 sm:py-14">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { t: 'Livraison 24h', sub: 'Abidjan & province' },
            { t: 'Paiement', sub: 'a la livraison uniquement' },
            { t: 'Sans risque', sub: 'satisfait ou rembourse' },
            { t: '100% naturel', sub: '0 effet secondaire' },
          ].map((g, i) => (
            <div key={i} className="border-l border-neutral-400/40 pl-4">
              <p className="ppc-serif text-[16px] italic text-neutral-900 sm:text-[18px]">{g.t}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-neutral-600">{g.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================== */}
      {/* CTA FINAL — couverture magazine */}
      {/* ============================================== */}
      <section className="relative overflow-hidden bg-neutral-900 px-5 py-14 text-cyan-100 sm:py-24">
        <span className="pointer-events-none absolute -top-32 -left-20 h-80 w-80 rounded-full bg-[#00d4ff]/20 blur-3xl"/>
        <span className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl"/>

        <div className="relative mx-auto w-full max-w-[1100px] text-center">
          <span className="text-[9px] font-black uppercase tracking-[0.42em] text-cyan-300/70">Edition 04 · Stock limite</span>
          <h2 className="ppc-display mt-3 text-[56px] leading-[0.92] text-cyan-50 sm:text-[88px] lg:text-[110px]">
            Reveiller<br/>
            <span className="italic text-cyan-300">vos cheveux.</span>
          </h2>
          <p className="ppc-serif mt-6 text-[16px] italic text-cyan-100/85 sm:text-[18px]">
            <span className="ppc-dropcap">A</span>vant la rupture. Avant que l'histoire ne se referme.
          </p>

          {/* Countdown XL */}
          <div className="mt-7 inline-flex items-center gap-3 border border-cyan-300/30 bg-neutral-800 px-5 py-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/70">Termine dans</span>
            <div className="ppc-display flex items-center gap-2 text-[28px] tabular-nums text-cyan-300 sm:text-[34px]">
              <span className="ppc-pulse-digit">{pad(countdown.h)}</span>
              <span className="opacity-50">:</span>
              <span className="ppc-pulse-digit">{pad(countdown.m)}</span>
              <span className="opacity-50">:</span>
              <span className="ppc-pulse-digit">{pad(countdown.s)}</span>
            </div>
          </div>

          {/* Stock bar */}
          <div className="mx-auto mt-5 max-w-xs">
            <div className="h-[3px] overflow-hidden bg-cyan-300/15">
              <div className="h-full bg-gradient-to-r from-[#00d4ff] via-cyan-300 to-[#00d4ff] transition-all" style={{ width: `${stockPct}%` }}/>
            </div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/70">Plus que {stock} boites</p>
          </div>

          <div className="mt-8">
            <CTA onClick={() => openOrder(2)} variant="gold" size="lg">
              Commander maintenant
              <ArrowR/>
            </CTA>
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/60">Aucun pre-paiement · Livraison rapide · 100% sans risque</p>
        </div>
      </section>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}
      <footer className="bg-neutral-900 px-5 py-7 text-center">
        <p className="ppc-display text-[14px] text-cyan-100 sm:text-[16px]">Powder Power Hair</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-cyan-300/40">© Edition 04 · Distribution Cote d`Ivoire</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-cyan-300/30">Service client : +225 05 01 25 92 44</p>
      </footer>

      {/* ============================================== */}
      {/* STICKY BOTTOM CTA */}
      {/* ============================================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
        <div className="border-t border-neutral-300 bg-[#f5f5f7]/95 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#00d4ff]">Termine dans</p>
              <p className="ppc-display text-[16px] tabular-nums text-neutral-900">
                <span className="ppc-pulse-digit">{pad(countdown.h)}</span>:
                <span className="ppc-pulse-digit">{pad(countdown.m)}</span>:
                <span className="ppc-pulse-digit">{pad(countdown.s)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => openOrder(1)}
              className="ppc-cta relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#00d4ff] via-[#33ddff] to-[#00d4ff] px-4 py-3 text-[12px] font-black uppercase tracking-[0.18em] text-neutral-900 shadow-[0_10px_30px_-4px_rgba(0,212,255,0.6)]"
            >
              <span className="ppc-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent"/>
              <span className="relative">Commander</span>
              <ArrowR/>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================== */}
      {/* STICKY COUNTDOWN BAR — apparait au scroll       */}
      {/* ============================================== */}
      <div
        className={`fixed inset-x-0 top-0 z-40 transform transition-transform duration-500 ${showSticky ? 'translate-y-0' : '-translate-y-full'}`}
        aria-hidden={!showSticky}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-black via-cyan-950/80 to-black shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)]">
          {/* halo lumineux animé */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="ppc-glow-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"/>
          </div>

          <div className="relative mx-auto flex w-full max-w-[1100px] items-center gap-3 px-3 py-2 sm:px-5 sm:py-2.5">
            {/* Pulse dot + label */}
            <div className="hidden items-center gap-2 sm:flex">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-75"/>
                <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-400"/>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">En direct</span>
            </div>

            {/* Countdown */}
            <div className="flex flex-1 items-center justify-center gap-2 text-white sm:gap-3">
              <span className="hidden text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/80 sm:block">Offre expire dans</span>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/80 sm:hidden">Expire</span>
              <div className="flex items-center gap-1 font-black tabular-nums">
                {[
                  { v: pad(countdown.h), l: 'H' },
                  { v: pad(countdown.m), l: 'M' },
                  { v: pad(countdown.s), l: 'S' },
                ].map((t, i) => (
                  <span key={i} className="inline-flex items-baseline gap-0.5 rounded-md bg-white/10 px-2 py-1 text-[15px] sm:text-[16px]">
                    <span className="ppc-pulse-digit">{t.v}</span>
                    <span className="text-[8px] text-cyan-200/70 sm:text-[9px]">{t.l}</span>
                  </span>
                ))}
              </div>
              <span className="hidden text-[9px] font-black uppercase tracking-[0.28em] text-cyan-200/70 lg:block">Stock : {stock}</span>
            </div>

            {/* CTA mini */}
            <button
              type="button"
              onClick={() => openOrder(2)}
              className="ppc-cta group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-sky-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_8px_24px_-6px_rgba(0,128,255,0.65)] hover:shadow-[0_10px_28px_-4px_rgba(0,128,255,0.85)] transition-all duration-300 sm:px-5 sm:py-2 sm:text-[11px]"
            >
              <span className="ppc-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/65 to-transparent"/>
              <span className="relative z-10 flex items-center gap-1.5">
                Commander
                <ArrowR/>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================== */}
      {/* TOAST */}
      {/* ============================================== */}
      {toast && (
        <div className={`fixed bottom-20 left-3 z-50 max-w-[280px] bg-[#f5f5f7] p-3 shadow-2xl ring-1 ring-neutral-300 transition-all sm:bottom-6 ${toast.visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
          <div className="flex items-start gap-2">
            <div className="ppc-display flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-900 text-[14px] text-cyan-200">{toast.n[0]}</div>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-neutral-900">{toast.n} <span className="font-normal text-neutral-600">de {toast.v}</span></p>
              <p className="text-[10px] text-neutral-700/80">vient de commander · il y a {toast.t}</p>
              <div className="mt-1 flex gap-0.5 text-[#00d4ff]">{[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3"/>)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* EXIT-INTENT POPUP */}
      {/* ============================================== */}
      {exitPopup && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-neutral-900/85 px-4 backdrop-blur-md" onClick={() => setExitPopup(false)}>
          <div className="relative w-full max-w-[420px] overflow-hidden bg-[#f5f5f7] p-7 shadow-2xl ring-1 ring-[#00d4ff]/40" onClick={e => e.stopPropagation()}>
            <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-900" onClick={() => setExitPopup(false)} aria-label="Fermer">×</button>
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-neutral-500">Avant de partir</span>
            <h4 className="ppc-display mt-2 text-[34px] leading-[0.95] text-neutral-900">
              <span className="italic text-[#00d4ff]">Attendez.</span>
            </h4>
            <p className="ppc-serif mt-3 text-[14px] italic leading-relaxed text-neutral-700">
              <span className="ppc-dropcap">P</span>rofitez de l'offre <strong className="not-italic font-bold text-neutral-900">2 boites a {fmtTotal(2)} F</strong> avant la rupture.
            </p>
            <div className="mt-5">
              <CTA onClick={() => { setExitPopup(false); openOrder(2); }} variant="gold" size="lg" fullWidth>
                Profiter de l'offre
                <ArrowR/>
              </CTA>
            </div>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Stock : {stock} boites</p>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* MODAL COMMANDE */}
      {/* ============================================== */}
      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          productName: 'Poudre Ultra Pousse Cheveux',
          slug: SLUG,
          metaPixelId: META_PIXEL_ID,
          thankYouUrl: THANK_YOU_URL,
          prices: PRICES,
          images: { hero: MEDIA.hero, avant: MEDIA.block7, apres: MEDIA.block8 },
          onSuccess: () => navigate(THANK_YOU_URL),
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />

      {/* ============================================== */}
      {/* STYLES INLINE */}
      {/* ============================================== */}
      <style>{`
        @keyframes ppcPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        @keyframes ppcSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes ppcMarquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes ppcRevealIn {
          0%   { opacity: 0; transform: translateY(28px) }
          100% { opacity: 1; transform: translateY(0) }
        }

        .ppc-pulse-digit { animation: ppcPulseDigit 1s ease-in-out infinite }
        .ppc-marquee     { animation: ppcMarquee 28s linear infinite }
        .ppc-cta-sheen   { animation: ppcSheen 3.5s ease-in-out infinite }
        .ppc-cta:hover .ppc-cta-sheen { animation-duration: 1.5s }

        /* Glow cyan pulsant pour CTAs lumineux (style packaging) */
        @keyframes ppcGlowCyan {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.6), 0 18px 45px -10px rgba(0,212,255,0.7) }
          50%      { box-shadow: 0 0 0 10px rgba(0,212,255,0), 0 24px 55px -8px rgba(0,128,255,0.85) }
        }
        .ppc-glow-cyan { animation: ppcGlowCyan 2.4s ease-in-out infinite }

        /* Sweep lumineux qui parcourt le sticky bar */
        @keyframes ppcGlowSweep {
          0%   { transform: translateX(0) }
          100% { transform: translateX(400%) }
        }
        .ppc-glow-sweep { animation: ppcGlowSweep 3.5s ease-in-out infinite }

        .ppc-reveal-pre  { opacity: 0; transform: translateY(28px) }
        .ppc-reveal-in   { animation: ppcRevealIn 0.8s cubic-bezier(.22,.8,.4,1) forwards }

        /* Typographies editoriales */
        .ppc-display {
          font-family: 'Bricolage Grotesque', 'Sora', 'Inter', 'Helvetica Neue', sans-serif;
          font-weight: 800;
          letter-spacing: -0.028em;
        }
        .ppc-serif {
          font-family: 'Outfit', 'Inter', 'Helvetica Neue', sans-serif;
          font-weight: 400;
          letter-spacing: -0.005em;
        }

        /* Lettrine / drop cap */
        .ppc-dropcap {
          font-family: 'Bricolage Grotesque', 'Sora', 'Inter', sans-serif;
          font-weight: 900;
          font-style: normal;
          font-size: 4em;
          line-height: 0.85;
          float: left;
          margin: 0.05em 0.1em -0.05em 0;
          color: #00d4ff;
          text-shadow: 0 0 24px rgba(0,212,255,0.45);
        }

        /* Soulignement chamois */
        .ppc-underline {
          background-image: linear-gradient(transparent 65%, rgba(0,212,255,0.35) 65%, rgba(0,212,255,0.35) 95%, transparent 95%);
          background-repeat: no-repeat;
          padding-bottom: 0.08em;
        }
        .ppc-underline-thick {
          background-image: linear-gradient(transparent 60%, rgba(0,212,255,0.6) 60%, rgba(0,212,255,0.6) 95%, transparent 95%);
          background-repeat: no-repeat;
          padding-bottom: 0.08em;
        }

        /* Bullet rotee cyan glow tech */
        .ppc-bullet {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #00d4ff;
          transform: rotate(45deg);
          box-shadow: 0 0 12px rgba(0,212,255,0.7), 0 0 24px rgba(0,212,255,0.4);
        }

        /* Hide scrollbar mais permettre scroll horizontal sur stories/timeline */
        .ppc-root section [class*="overflow-x-auto"]::-webkit-scrollbar { height: 0 }
        .ppc-root section [class*="overflow-x-auto"] { scrollbar-width: none }

        /* Bottom safe area iOS */
        @supports (padding: max(0px)) {
          .ppc-root { padding-bottom: env(safe-area-inset-bottom); }
        }
      `}</style>
    </div>
  );
}
