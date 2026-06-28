/**
 * Tunnel de vente — Crème Anti-Lipome (CREME_ANTI_LIPOME)
 * Slug: creme-anti-lipome
 *
 * Disposition unique : stack vertical 100 % "fiche pleine largeur".
 * Une fiche = micro-texte (1-2 phrases courtes, mots forts en degrade)
 *           + UN media (image OU video, jamais 2 cote a cote)
 *           + UN CTA fluide pulsant.
 *
 * 16 medias UNIQUES (zero repetition) :
 *   - 13 images : /lipome/m1.webp .. m13.webp (compressees < 200 KB chacune)
 *   - 3 videos  : /lipome/v1.mp4 .. v3.mp4 (lazy load)
 *
 * Couleur dominante : VERT EMERAUDE / LIME / FORET (couleur du produit).
 * Sections distinctes : carrousel WhatsApp, SMS bulles, marquee logos presse,
 * expert portrait, bundles upsell (-15 %), compte a rebours sticky, FAQ.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'creme-anti-lipome';
const PRODUCT_CODE = 'CREME_ANTI_LIPOME';
const META_PIXEL_ID = '1857129471642967';
const THANK_YOU_URL = '/creme-anti-lipome/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 tube', sub: packLabel(PRICES, 1, 'FCFA') },
  { v: 2, label: '2 tubes', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Populaire', save: 'Économisez 2 900 F' },
  { v: 3, label: '3 tubes', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Max économie', save: 'Économisez 4 800 F' },
];

const M = (n: string) => `/lipome/${n}`;

interface Product { id: number; code: string; nom: string; prixUnitaire: number }

declare global { interface Window { fbq: any; _fbq: any } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const pad = (n: number) => String(n).padStart(2, '0');

// ============================================================================
// Lazy helpers
// ============================================================================
function useOnScreen(rootMargin = '300px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function LazyImg({ src, alt, aspect, priority, className = '' }: {
  src: string; alt: string; aspect?: string; priority?: boolean; className?: string;
}) {
  const { ref, visible } = useOnScreen('320px');
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchpriority
          fetchpriority="high"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full min-h-[260px] w-full animate-pulse bg-emerald-100/70" />
      )}
    </div>
  );
}

function LazyVideo({ src, poster }: { src: string; poster?: string }) {
  const { ref, visible } = useOnScreen('320px');
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-emerald-950" style={{ aspectRatio: '9/16' }}>
      {visible ? (
        <video
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-emerald-900/50">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200/30 border-t-lime-300" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-950/85 to-transparent" />
      <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-80" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime-400" />
        </span>
        Live demo
      </span>
    </div>
  );
}

// ============================================================================
// UI atoms
// ============================================================================
const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const Star = ({ className = '' }: { className?: string }) => (
  <svg className={`h-3.5 w-3.5 text-amber-400 ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

function Hot({ children, gold }: { children: ReactNode; gold?: boolean }) {
  return (
    <span className={
      gold
        ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text font-black text-transparent'
        : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-green-500 bg-clip-text font-black text-transparent'
    }>
      {children}
    </span>
  );
}

function FluidCTA({ onClick, children, glow = true }: { onClick: () => void; children: ReactNode; glow?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cal-fluid group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 px-6 py-4 text-[15px] font-black text-white shadow-[0_18px_44px_-10px_rgba(16,185,129,.65)] ring-2 ring-white/25 transition hover:scale-[1.02] sm:text-[16px] ${glow ? 'cal-fluid-pulse' : ''}`}
    >
      <span className="cal-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items, speed = 30 }: { items: string[]; speed?: number }) {
  return (
    <div className="overflow-hidden border-y border-emerald-300/30 bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-900 py-2.5">
      <div
        className="cal-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100 sm:text-[11px]"
        style={{ animationDuration: `${speed}s` }}
      >
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className="text-lime-300">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Bloc fiche : 1 hook + 1 media + 1 CTA — pleine largeur
// ============================================================================
type FicheProps = {
  kicker?: string;
  hook: ReactNode;
  cta: string;
  qty?: number;
  onOrder: (q?: number) => void;
  media: ReactNode;
  /** Variante de fond : ivoire (defaut), foret (sombre vert), lime (clair lime). */
  variant?: 'ivory' | 'forest' | 'lime';
  /** Forme du media : portrait carre arrondi (defaut), bord plein, decale. */
  shape?: 'card' | 'edge' | 'tilt';
};

function Fiche({ kicker, hook, cta, qty, onOrder, media, variant = 'ivory', shape = 'card' }: FicheProps) {
  const bg =
    variant === 'forest'
      ? 'bg-gradient-to-b from-emerald-950 via-green-950 to-emerald-900 text-white'
      : variant === 'lime'
        ? 'bg-gradient-to-b from-lime-50 via-white to-emerald-50/70 text-emerald-950'
        : 'bg-gradient-to-b from-emerald-50/70 via-white to-lime-50/60 text-emerald-950';

  const kickerColor = variant === 'forest' ? 'text-lime-300' : 'text-emerald-700';
  const subColor = variant === 'forest' ? 'text-emerald-200/95' : 'text-emerald-800/85';

  const mediaWrap =
    shape === 'edge'
      ? 'relative w-full overflow-hidden'
      : shape === 'tilt'
        ? 'relative mx-auto max-w-[460px] -rotate-[1.5deg] overflow-hidden rounded-[2rem] ring-2 ring-emerald-200 shadow-[0_30px_70px_-20px_rgba(6,78,59,.45)]'
        : 'relative mx-auto max-w-[460px] overflow-hidden rounded-[2rem] ring-2 ring-emerald-200/70 shadow-[0_30px_70px_-22px_rgba(6,78,59,.4)]';

  return (
    <section className={`relative overflow-hidden py-12 sm:py-16 ${bg}`}>
      {/* Halos */}
      <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-lime-300/30 blur-3xl cal-float-slow" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-48 w-48 rounded-full bg-emerald-400/25 blur-3xl cal-float-slow" style={{ animationDelay: '2.5s' }} />

      <div className="relative mx-auto max-w-xl px-4 text-center">
        {kicker && (
          <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.3em] ${kickerColor}`}>{kicker}</p>
        )}
        <div className="mb-6 text-balance text-[20px] font-black leading-tight sm:text-[24px]">
          {hook}
        </div>

        <div className={mediaWrap}>{media}</div>

        <div className="mt-7">
          <FluidCTA onClick={() => onOrder(qty)}>{cta} <Arrow /></FluidCTA>
          <p className={`mt-2.5 text-[11px] font-semibold ${subColor}`}>
            🔒 Paiement à la livraison · Express partout en CI
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Main
// ============================================================================
export default function CremeAntiLipomeLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(15);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [carouselIdx, setCarouselIdx] = useState(0);

  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    setQty(q || 1);
    setModal(true);
  }, []);

  // Preload hero
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = M('m1.webp');
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch { /* noop */ } };
  }, []);

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Crème Anti-Lipome',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
        currency: 'XOF',
      });
    }
  }, [company]);

  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then((r) => {
        const p = (r.data?.products || []).find((x: Product) => x.code?.toUpperCase() === PRODUCT_CODE);
        if (p) setProduct(p);
      })
      .catch(() => {});
  }, [company]);

  // Countdown -> minuit
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

  // Stock decroissant
  useEffect(() => {
    const id = setInterval(() => setStock((s) => (s > 5 ? s - 1 : s)), 45000);
    return () => clearInterval(id);
  }, []);

  // Carrousel temoignages
  useEffect(() => {
    const id = setInterval(() => setCarouselIdx((c) => (c + 1) % 4), 5500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const stockPct = Math.round((stock / 25) * 100);

  const reviews = [
    { name: 'Aminata K.', city: 'Abidjan', txt: 'La boule sur mon bras a fondu en 3 semaines. Bluffée 😍', stars: 5, t: '09:12' },
    { name: 'Mariam D.', city: 'Bouaké', txt: 'Texture verte douce, odeur agréable. Ma peau est plus lisse.', stars: 5, t: '11:28' },
    { name: 'Koffi E.', city: 'Yopougon', txt: 'Au début je doutais, après 2 tubes c’est radical. Merci !', stars: 5, t: '15:41' },
    { name: 'Fatou B.', city: 'Daloa', txt: 'Mon mari voit la différence. Livraison en 24h, top 🙏', stars: 5, t: '18:03' },
  ];

  const press = ['Santé+ Mag', 'Afrique Bien-être', 'Labo Nature CI', 'Forum Dermato', 'BeautyPro News', 'Pulse Santé'];

  return (
    <div className="min-h-screen bg-[#f4faf6]" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
      <style>{`
        @keyframes cal-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .cal-marquee { animation: cal-marquee 32s linear infinite }
        @keyframes cal-sheen { 0% { transform: translateX(-100%) } 60% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .cal-sheen { animation: cal-sheen 3s ease-in-out infinite }
        @keyframes cal-float-slow { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-22px) translateX(14px) } }
        .cal-float-slow { animation: cal-float-slow 9s ease-in-out infinite }
        @keyframes cal-fluid-pulse {
          0%, 100% { box-shadow: 0 18px 44px -10px rgba(16,185,129,.6); transform: translateY(0); }
          50% { box-shadow: 0 26px 60px -8px rgba(132,204,22,.7); transform: translateY(-2px); }
        }
        .cal-fluid-pulse { animation: cal-fluid-pulse 2.4s ease-in-out infinite }
        .cal-fluid:hover { animation: none !important; }
        @keyframes cal-bob { 0%,100% { transform: translateY(0) rotate(-1.5deg) } 50% { transform: translateY(-4px) rotate(.5deg) } }
        .cal-bob { animation: cal-bob 5s ease-in-out infinite }
        @keyframes cal-fade-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .cal-fade-up { animation: cal-fade-up .55s cubic-bezier(.22,.8,.4,1) both }
        @keyframes cal-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .cal-shimmer-gold {
          background: linear-gradient(90deg, #d4af37 0%, #fde68a 25%, #f59e0b 50%, #fef3c7 75%, #d4af37 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: cal-shimmer 3.5s linear infinite;
        }
        @keyframes cal-pulse-dot { 0% { transform: scale(.95); opacity: 1 } 100% { transform: scale(2); opacity: 0 } }
        .cal-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: cal-pulse-dot 1.6s cubic-bezier(0,0,.2,1) infinite }
      `}</style>

      {/* ====================================================================== */}
      {/* STICKY HEADER — countdown + stock                                      */}
      {/* ====================================================================== */}
      <div className="sticky top-0 z-50 border-b border-emerald-300/30 bg-emerald-950 shadow-lg shadow-emerald-900/30">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-3 py-2 sm:gap-4">
          <span className="relative flex h-2 w-2 text-lime-300 cal-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-300" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
            <span className="cal-shimmer-gold">Promo verte</span> · clôture minuit
          </span>
          <div className="flex items-center gap-1">
            {[countdown.h, countdown.m, countdown.s].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-emerald-500">:</span>}
                <span className="inline-flex h-7 min-w-[32px] items-center justify-center rounded-md bg-lime-300/15 px-1.5 font-mono text-[13px] font-black tabular-nums text-lime-200 ring-1 ring-lime-300/40">
                  {pad(v)}
                </span>
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-950">
            🔥 Stock {stock}
          </span>
        </div>
        <div className="h-[3px] w-full bg-emerald-900/80">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-lime-400 to-emerald-300 transition-all duration-700"
            style={{ width: `${stockPct}%` }}
          />
        </div>
      </div>

      <Marquee items={['CRÈME ANTI-LIPOME', 'TEXTURE VERTE FONDANTE', 'USAGE EXTERNE', 'CLINIQUEMENT TESTÉE', 'EXPRESS 24H ABIDJAN', 'PAIEMENT LIVRAISON']} />

      {/* ====================================================================== */}
      {/* HERO — m1                                                              */}
      {/* ====================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-lime-50 py-12 sm:py-16">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-emerald-300/35 blur-3xl cal-float-slow" />
        <div className="pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full bg-lime-300/35 blur-3xl cal-float-slow" style={{ animationDelay: '3s' }} />

        <div className="relative mx-auto max-w-xl px-4 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700 backdrop-blur cal-fade-up">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            Édition verte premium
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
          </p>

          <h1 className="mt-4 text-balance text-[34px] font-black leading-[1.05] tracking-tight text-emerald-950 sm:text-[46px] cal-fade-up" style={{ animationDelay: '.05s' }}>
            <Hot>Stop</Hot> aux <span className="bg-gradient-to-r from-emerald-700 via-green-600 to-lime-600 bg-clip-text text-transparent">boules</span> sur le corps.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[14px] font-semibold leading-relaxed text-emerald-900/85 sm:text-[16px] cal-fade-up" style={{ animationDelay: '.1s' }}>
            Une <Hot>crème verte</Hot> ciblée pour les <Hot gold>lipomes visibles</Hot>. Texture fondante. Application simple.
          </p>

          <div className="relative mt-8 cal-fade-up" style={{ animationDelay: '.15s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-emerald-300/45 via-lime-200/35 to-green-300/45 blur-3xl" />
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2.2rem] bg-white shadow-[0_30px_80px_-20px_rgba(6,78,59,.4)] ring-2 ring-emerald-200 cal-bob">
              <LazyImg src={M('m1.webp')} alt="Crème anti-lipome verte" aspect="4/5" priority />
            </div>

            <div className="absolute -left-3 top-10 rotate-[-7deg] rounded-md bg-emerald-950 px-3 py-2 text-center shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-lime-300">Action</p>
              <p className="cal-shimmer-gold text-[16px] font-black leading-tight">3-6 sem.</p>
            </div>
            <div className="absolute -right-3 bottom-12 rotate-[6deg] rounded-md bg-white px-3 py-2 shadow-xl ring-1 ring-emerald-200">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-700">Note</p>
              <p className="flex items-center gap-0.5 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 text-[11px] font-black text-emerald-950">4.9</span>
              </p>
            </div>
          </div>

          <div className="mt-8 cal-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">{fmtTotal(1)}</span>
              <span className="text-lg font-bold text-emerald-800 sm:text-xl">FCFA</span>
              <span className="text-sm text-emerald-400 line-through sm:text-base">15 000 FCFA</span>
              <span className="rounded-md bg-emerald-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">-34 %</span>
            </div>

            <div className="mx-auto mt-6 max-w-sm">
              <FluidCTA onClick={() => openModal(1)}>Je commande — {fmtTotal(1)} FCFA <Arrow /></FluidCTA>
            </div>
            <p className="mt-3 text-[11px] text-emerald-600">🔒 Paiement à la livraison · Sans risque</p>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* STATS BAR                                                              */}
      {/* ====================================================================== */}
      <section className="border-y border-emerald-200/70 bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:gap-4 sm:py-7">
          {[
            { n: '3-6 sem', l: 'Premiers résultats' },
            { n: '3 250+', l: 'Clients satisfaits' },
            { n: '4,9/5', l: 'Note moyenne' },
            { n: '24h', l: 'Livraison Abidjan' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 bg-clip-text text-[24px] font-black text-transparent sm:text-[30px]">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700/80 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FICHE 1 — VIDEO v1                                                     */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Démo réelle"
        hook={<><Hot>Regardez</Hot> l’action sur la peau. <Hot gold>Texture verte</Hot> fondante.</>}
        cta="Voir le pack populaire"
        qty={2}
        onOrder={openModal}
        variant="forest"
        shape="card"
        media={
          <div className="relative mx-auto max-w-[400px] overflow-hidden rounded-[2rem] ring-2 ring-emerald-400/40 shadow-[0_30px_80px_-20px_rgba(0,0,0,.5)]">
            <LazyVideo src={M('v1.mp4')} />
          </div>
        }
      />

      {/* ====================================================================== */}
      {/* FICHE 2 — m2 (formule)                                                 */}
      {/* ====================================================================== */}
      <Fiche
        kicker="La formule"
        hook={<>Une <Hot>chimie verte</Hot> qui <Hot gold>cible</Hot> les amas sous la peau.</>}
        cta="Oui, je veux ce soin"
        qty={1}
        onOrder={openModal}
        variant="ivory"
        shape="card"
        media={<LazyImg src={M('m2.webp')} alt="Formule verte" aspect="1/1" />}
      />

      {/* ====================================================================== */}
      {/* FICHE 3 — m9 "Finis les boules" — bord plein largeur (rupture)         */}
      {/* ====================================================================== */}
      <section className="relative overflow-hidden">
        <LazyImg src={M('m9.webp')} alt="Finis les boules sur le corps" aspect="16/9" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/65 to-emerald-900/30" />
        <div className="relative z-10 mx-auto max-w-xl px-4 py-20 text-center text-white sm:py-28">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-300">Promesse</p>
          <h2 className="mt-3 text-balance text-[28px] font-black leading-tight sm:text-[36px]">
            <Hot gold>Finis</Hot> les <span className="bg-gradient-to-r from-emerald-200 to-lime-200 bg-clip-text text-transparent">boules</span> qui se voient.
          </h2>
          <p className="mt-3 text-[14px] font-semibold text-emerald-100/90">Confort retrouvé. Confiance retrouvée.</p>
          <div className="mx-auto mt-7 max-w-sm">
            <FluidCTA onClick={() => openModal(1)}>J’en ai marre — je commande <Arrow /></FluidCTA>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FICHE 4 — m7 (zone)                                                    */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Zones ciblées"
        hook={<><Hot>Bras</Hot>, <Hot>front</Hot>, <Hot>main</Hot>, <Hot>dos</Hot>, <Hot>jambes</Hot>… on s’en occupe.</>}
        cta="Je sécurise mon tube"
        qty={1}
        onOrder={openModal}
        variant="lime"
        shape="tilt"
        media={<LazyImg src={M('m7.webp')} alt="Zone du corps" aspect="4/5" />}
      />

      {/* ====================================================================== */}
      {/* FICHE 5 — VIDEO v2                                                     */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Geste pro"
        hook={<>Application <Hot gold>en 30 secondes</Hot>. Pas plus.</>}
        cta="Pack 2 tubes — j’optimise"
        qty={2}
        onOrder={openModal}
        variant="ivory"
        shape="card"
        media={
          <div className="relative mx-auto max-w-[400px] overflow-hidden rounded-[2rem] ring-2 ring-emerald-200 shadow-[0_30px_80px_-20px_rgba(6,78,59,.4)]">
            <LazyVideo src={M('v2.mp4')} />
          </div>
        }
      />

      {/* ====================================================================== */}
      {/* SECTION : NOTE & VU DANS — presse                                      */}
      {/* ====================================================================== */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700">Vu dans</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {press.map((p) => (
              <span key={p} className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800 shadow-sm">{p}</span>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-950 px-4 py-2 text-white shadow-xl">
            <span className="flex">{[1,2,3,4,5].map(i => <Star key={i}/>)}</span>
            <span className="text-[12px] font-black">4,9/5</span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-300">3 250 avis vérifiés</span>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FICHE 6 — m4                                                           */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Avant / Aujourd’hui"
        hook={<>Un <Hot>résultat</Hot> qui se <Hot gold>voit</Hot> sous les chemises.</>}
        cta="Je veux ce rendu"
        qty={2}
        onOrder={openModal}
        variant="forest"
        shape="card"
        media={<LazyImg src={M('m4.webp')} alt="Résultat attendu" aspect="1/1" />}
      />

      {/* ====================================================================== */}
      {/* SECTION CARROUSEL TEMOIGNAGES                                          */}
      {/* ====================================================================== */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-white to-lime-50/40 py-14">
        <div className="mx-auto max-w-xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800">Avis client</span>
            <h2 className="mt-3 text-2xl font-black text-emerald-950 sm:text-3xl">
              Ce qu’<Hot>elles disent</Hot>.
            </h2>
          </div>

          <div className="relative mt-7 min-h-[230px] overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-emerald-100 shadow-xl">
            {reviews.map((r, i) => (
              <div
                key={r.name}
                className={`absolute inset-x-6 top-6 transition-all duration-700 ${
                  i === carouselIdx ? 'z-10 translate-y-0 opacity-100' : 'pointer-events-none z-0 translate-y-3 opacity-0'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-wider text-emerald-700">{r.name}</p>
                    <p className="text-[10px] font-bold text-emerald-500">{r.city}</p>
                  </div>
                  <span className="flex">{Array.from({length: r.stars}).map((_, j) => <Star key={j}/>)}</span>
                </div>
                <p className="mt-3 text-[16px] font-semibold leading-relaxed text-emerald-950">“{r.txt}”</p>
                <p className="mt-3 text-right text-[10px] text-emerald-500">{r.t} · ✓ Vérifié</p>
              </div>
            ))}
            <div className="mt-[210px] flex justify-center gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Avis ${i + 1}`}
                  onClick={() => setCarouselIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === carouselIdx ? 'w-8 bg-emerald-600' : 'w-2 bg-emerald-200 hover:bg-emerald-300'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-7">
            <FluidCTA onClick={() => openModal(2)}>Moi aussi je commande <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* SECTION WHATSAPP CHAT (style messagerie)                               */}
      {/* ====================================================================== */}
      <section className="bg-[#e5ddd4] py-14">
        <div className="mx-auto max-w-md px-4">
          <div className="overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-emerald-950">GS</div>
              <div className="flex-1">
                <p className="text-[13px] font-black">GS · Crème anti-lipome</p>
                <p className="text-[10px] text-emerald-200">● en ligne</p>
              </div>
              <span className="text-[10px] font-bold text-white/80">Aujourd’hui</span>
            </div>
            <div className="space-y-2 bg-[#ece5dd] px-3 py-4">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-emerald-700">Aminata K.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Bonjour, j’ai bien reçu mon tube. Je commence ce soir 🙏</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">07:14 ✓✓</p>
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
                <p className="text-[13px] text-neutral-800">Parfait Aminata 💚 Application matin et soir, photo dans 3 semaines !</p>
                <p className="mt-1 text-right text-[9px] text-neutral-500">07:16 ✓✓</p>
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-emerald-700">Aminata K.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">3 semaines plus tard… ma boule a quasi disparu 😱 Merci ❤️</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">il y a 4 j ✓✓</p>
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-lime-700">+225 07 •• •• 42</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Salam, je veux 2 tubes pour ma sœur stp.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">il y a 2h ✓✓</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <FluidCTA onClick={() => openModal(2)}>Rejoindre les avis 5★ <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FICHE 7 — VIDEO v3                                                     */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Dernière démo"
        hook={<>Une <Hot>vidéo</Hot> de plus, et <Hot gold>c’est à vous</Hot>.</>}
        cta="Trio famille — meilleur prix"
        qty={3}
        onOrder={openModal}
        variant="ivory"
        shape="card"
        media={
          <div className="relative mx-auto max-w-[400px] overflow-hidden rounded-[2rem] ring-2 ring-emerald-200 shadow-[0_30px_80px_-20px_rgba(6,78,59,.4)]">
            <LazyVideo src={M('v3.mp4')} />
          </div>
        }
      />

      {/* ====================================================================== */}
      {/* SECTION EXPERT (portrait carte)                                        */}
      {/* ====================================================================== */}
      <section className="relative overflow-hidden bg-emerald-950 py-14 sm:py-16">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl cal-float-slow" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-lime-400/15 blur-3xl cal-float-slow" style={{ animationDelay: '2s' }} />

        <div className="relative mx-auto grid max-w-3xl items-center gap-7 px-4 sm:grid-cols-[260px_1fr]">
          <div className="relative mx-auto h-[260px] w-[260px] overflow-hidden rounded-[28px] ring-2 ring-lime-300/40 shadow-[0_30px_70px_-20px_rgba(0,0,0,.6)]">
            <LazyImg src={M('m10.webp')} alt="Expert formulation" aspect="1/1" />
            <span className="absolute bottom-3 left-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">Expert formulation</span>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-300">Validé par notre expert</p>
            <h2 className="mt-3 text-balance text-2xl font-black leading-tight text-white sm:text-3xl">
              <span className="cal-shimmer-gold">« On a concentré l’actif vert</span> là où il agit le plus. »
            </h2>
            <p className="mt-3 text-[14px] font-semibold text-emerald-100/85">
              Formule encadrée. Usage externe. <Hot gold>2 applications par jour</Hot>.
            </p>
            <div className="mt-5 max-w-sm">
              <FluidCTA onClick={() => openModal(1)}>Suivre la routine expert <Arrow/></FluidCTA>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FICHE 8 — m3                                                           */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Texture pro"
        hook={<><Hot>Fondante</Hot>. Pénétration <Hot gold>rapide</Hot>. Aucun gras résiduel.</>}
        cta="Ajouter à ma commande"
        qty={1}
        onOrder={openModal}
        variant="lime"
        shape="card"
        media={<LazyImg src={M('m3.webp')} alt="Texture verte" aspect="4/3" />}
      />

      {/* ====================================================================== */}
      {/* SECTION BUNDLES + UPSELL                                               */}
      {/* ====================================================================== */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800">Choisis ton pack</span>
            <h2 className="mt-3 text-2xl font-black text-emerald-950 sm:text-3xl">
              Plus tu prends, <Hot>plus tu économises</Hot>.
            </h2>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { v: 1, n: '1 tube', p: orderTotal(PRICES, 1), old: 15000, sub: packLabel(PRICES, 1, 'F'), save: null },
              { v: 2, n: '2 tubes', p: orderTotal(PRICES, 2), old: 30000, sub: packLabel(PRICES, 2, 'F'), save: '-2 900 F', hot: true },
              { v: 3, n: '3 tubes', p: orderTotal(PRICES, 3), old: 45000, sub: packLabel(PRICES, 3, 'F'), save: '-4 800 F' },
            ].map((b) => (
              <button
                key={b.v}
                type="button"
                onClick={() => openModal(b.v)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition hover:scale-[1.02] hover:shadow-xl ${
                  b.hot
                    ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-white to-lime-50 shadow-lg ring-2 ring-amber-300/40'
                    : 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50'
                }`}
              >
                {b.hot && (
                  <span className="absolute -top-1 right-4 rotate-3 rounded-b-md bg-amber-400 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-950 shadow">★ POPULAIRE</span>
                )}
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">{b.sub}</p>
                <p className="mt-1 text-xl font-black text-emerald-950">{b.n}</p>
                <p className="mt-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-2xl font-black text-transparent">{b.p.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                <p className="mt-1 text-[11px] text-emerald-400 line-through">{b.old.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                {b.save && (
                  <p className="mt-2 inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">{b.save}</p>
                )}
              </button>
            ))}
          </div>

          {/* Upsell card */}
          <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-lime-50 p-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-3xl text-white shadow-lg">🎁</div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Bonus offert</p>
              <p className="text-[14px] font-black text-emerald-950">+1 mini-tube découverte avec le pack 3 tubes</p>
              <p className="mt-1 text-[11px] text-emerald-700">Idéal à offrir ou à garder dans le sac.</p>
            </div>
            <button
              type="button"
              onClick={() => openModal(3)}
              className="cal-fluid relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-[12px] font-black text-white shadow-lg ring-2 ring-white/20"
            >
              <span className="cal-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              <span className="relative">J’en profite</span>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FICHE 9 — m5 (packaging)                                               */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Packaging"
        hook={<>Format <Hot>cabine</Hot>. Look <Hot gold>boutique premium</Hot>.</>}
        cta="J’adopte ce flacon"
        qty={1}
        onOrder={openModal}
        variant="ivory"
        shape="tilt"
        media={<LazyImg src={M('m5.webp')} alt="Packaging premium" aspect="1/1" />}
      />

      {/* ====================================================================== */}
      {/* FICHE 10 — m11 (résultat illustratif)                                  */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Résultat ciblé"
        hook={<>Une peau <Hot>plus lisse</Hot>. Une <Hot gold>silhouette nette</Hot>.</>}
        cta="Je veux ce résultat"
        qty={2}
        onOrder={openModal}
        variant="forest"
        shape="card"
        media={<LazyImg src={M('m11.webp')} alt="Résultat ciblé" aspect="1/1" />}
      />

      {/* ====================================================================== */}
      {/* FICHE 11 — m6                                                          */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Routine simple"
        hook={<>2 fois par jour. <Hot>30 secondes</Hot>. C’est <Hot gold>tout</Hot>.</>}
        cta="Je commence ce soir"
        qty={1}
        onOrder={openModal}
        variant="lime"
        shape="card"
        media={<LazyImg src={M('m6.webp')} alt="Routine simple" aspect="4/5" />}
      />

      {/* ====================================================================== */}
      {/* FICHE 12 — m8 (geste)                                                  */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Le geste"
        hook={<>Un <Hot>geste lent</Hot>, circulaire, jusqu’à <Hot gold>pénétration totale</Hot>.</>}
        cta="Sécuriser mon tube"
        qty={1}
        onOrder={openModal}
        variant="ivory"
        shape="card"
        media={<LazyImg src={M('m8.webp')} alt="Geste d’application" aspect="4/5" />}
      />

      {/* ====================================================================== */}
      {/* FICHE 13 — m12                                                         */}
      {/* ====================================================================== */}
      <Fiche
        kicker="Confort retrouvé"
        hook={<><Hot>Vêtements moulants</Hot> ? Plus aucun <Hot gold>complexe</Hot>.</>}
        cta="Je récupère mon confort"
        qty={2}
        onOrder={openModal}
        variant="forest"
        shape="card"
        media={<LazyImg src={M('m12.webp')} alt="Confort retrouvé" aspect="1/1" />}
      />

      {/* ====================================================================== */}
      {/* SECTION SMS NOTIFICATION                                               */}
      {/* ====================================================================== */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-lime-50/60 py-14">
        <div className="mx-auto max-w-md px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700">SMS clients reçus</p>
          <h2 className="mt-2 text-center text-2xl font-black text-emerald-950 sm:text-3xl">
            <Hot>97 %</Hot> de retours positifs.
          </h2>
          <div className="mt-7 space-y-3">
            {[
              { phone: '+225 07 •• •• 42', txt: 'Colis bien reçu, je commence aujourd’hui 🙏', t: 'Aujourd’hui 14:02' },
              { phone: '+225 05 •• •• 18', txt: 'Salam ! Vraiment top, ma boule a réduit en 2 sem 💚', t: 'Hier 17:33' },
              { phone: '+225 01 •• •• 76', txt: 'Je commande à nouveau pour ma maman.', t: 'Lundi 09:11' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-emerald-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm5 5a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
                    </span>
                    <p className="text-[12px] font-black text-emerald-900">{s.phone}</p>
                  </div>
                  <p className="text-[10px] text-emerald-500">{s.t}</p>
                </div>
                <p className="mt-2 text-[13px] font-semibold text-emerald-900">{s.txt}</p>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <FluidCTA onClick={() => openModal(1)}>Recevoir le mien <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* GARANTIE BOX                                                           */}
      {/* ====================================================================== */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-green-700 to-emerald-800 p-7 text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-300">Notre engagement</p>
            <h3 className="mt-2 text-2xl font-black sm:text-3xl">
              Vous payez <Hot gold>uniquement à la livraison</Hot>.
            </h3>
            <ul className="mt-5 space-y-2 text-[14px]">
              {[
                'Formule dermatologique testée',
                'Livraison sous 24h à Abidjan, 48h en région',
                'Paiement cash à la réception',
                'Conseiller dispo sur WhatsApp',
              ].map((x, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400 text-emerald-900 shadow">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <FluidCTA onClick={() => openModal(1)}>J’achète sans risque <Arrow/></FluidCTA>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FAQ                                                                    */}
      {/* ====================================================================== */}
      <section className="bg-emerald-50/50 py-14">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-black text-emerald-950 sm:text-3xl">
            Vos <Hot>questions</Hot>.
          </h2>
          <div className="mt-7 space-y-3">
            {[
              { q: 'En combien de temps voit-on un résultat ?', a: 'Premiers effets en 1 à 2 semaines. Résultat marqué entre 3 et 6 semaines selon la zone.' },
              { q: 'Sur quelles zones l’utiliser ?', a: 'Lipomes superficiels : bras, front, main, dos, jambes. Usage externe uniquement, sur peau saine.' },
              { q: 'Est-ce douloureux ?', a: 'Non. Application douce, sensation fraîche. Aucune brûlure.' },
              { q: 'Combien d’applications par jour ?', a: '2 fois par jour (matin et soir). Massez 30 secondes, laissez pénétrer.' },
              { q: 'Comment je paie ?', a: 'Vous payez en CASH au livreur, après vérification du colis. Zéro risque.' },
              { q: 'Livraison partout en CI ?', a: 'Oui. 24h Abidjan, 48h en régions. Livraison gratuite sur tout le pays.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100 transition-all open:ring-emerald-300">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-emerald-950 sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="h-5 w-5 text-emerald-600 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-emerald-800 sm:text-[14px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* FICHE 14 — m13 (cloture forte)                                         */}
      {/* ====================================================================== */}
      <section className="relative overflow-hidden">
        <LazyImg src={M('m13.webp')} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-950/85 to-green-900/80" />
        <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-lime-400/30 blur-3xl cal-float-slow" />
        <div className="pointer-events-none absolute -right-16 bottom-12 h-48 w-48 rounded-full bg-emerald-400/25 blur-3xl cal-float-slow" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 mx-auto max-w-xl px-4 py-20 text-center text-white sm:py-24">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-300">Dernière ligne droite</p>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl">
            Votre peau <span className="cal-shimmer-gold">mérite ce soin</span>.
          </h2>
          <p className="mt-3 text-[13px] font-semibold text-emerald-100/95 sm:text-[14px]">Compte à rebours actif · stock affiché en temps réel.</p>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-lime-300/40 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-wider text-lime-200">Fin promo</span>
            <span className="font-mono text-[14px] font-black tabular-nums text-white">
              {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </span>
          </div>

          <div className="mx-auto mt-7 max-w-sm">
            <FluidCTA onClick={() => openModal(2)}>COMMANDE EXPRESS — {fmtTotal(2)} F <Arrow/></FluidCTA>
            <p className="mt-3 text-[11px] text-emerald-200">Sans engagement · paiement à la réception</p>
          </div>
        </div>
      </section>

      <footer className="bg-emerald-950 py-7 text-center text-[10px] font-semibold text-emerald-300/70">
        © {new Date().getFullYear()} · Crème anti-lipome · Usage externe · Résultats variables selon les individus
      </footer>

      {/* ====================================================================== */}
      {/* STICKY CTA BOTTOM (mobile)                                             */}
      {/* ====================================================================== */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transform border-t border-emerald-300/40 bg-emerald-950/95 px-3 py-2.5 backdrop-blur-md transition-all duration-300 sm:hidden ${
          modal ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100 cal-fade-up'
        }`}
        style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-lime-300">Promo · {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</p>
            <p className="text-[11px] font-bold text-white">{fmtTotal(1)} F</p>
          </div>
          <button
            type="button"
            onClick={() => openModal(1)}
            className="cal-fluid cal-fluid-pulse relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-green-600 to-lime-500 px-5 py-2.5 text-[13px] font-black text-white shadow-lg ring-2 ring-white/30"
          >
            <span className="cal-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <span className="relative">Commander</span>
            <Arrow />
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* MODAL                                                                  */}
      {/* ====================================================================== */}
      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: 'Crème Anti-Lipome',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          slug: SLUG,
          company,
          navigate,
          images: {
            hero: M('m1.webp'),
            avant: M('m7.webp'),
            apres: M('m9.webp'),
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
