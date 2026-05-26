/**
 * Tunnel de vente — Crème Contour des Yeux Anti-Cernes / Anti-Rides (CREME_ANTI_CERNE)
 * Slug : creme-anti-cerne
 *
 * Palette PREMIUM : blanc + rouge + noir élégant + beige/gris clair.
 * Disposition : 1 média = 1 bloc (texte court + média + CTA fluide).
 * Aucune image dupliquée, lazy load, mobile-first, hero en priorité.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'creme-anti-cerne';
const PRODUCT_CODE = 'CREME_ANTI_CERNE';
const META_PIXEL_ID = '950944984510412';
const THANK_YOU_URL = '/creme-anti-cerne/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const QTY_OPTS = [
  { v: 1, label: '1 crème', sub: '9 900 FCFA' },
  { v: 2, label: '2 crèmes', sub: '16 900 FCFA', tag: 'Le + choisi', save: 'Économisez 2 900 F' },
  { v: 3, label: '3 crèmes', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Économisez 4 800 F' },
];

const M = (n: string) => `/creme-anti-cerne/${n}`;

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

function LazyImg({ src, alt, aspect, priority, className = '', cover = false }: {
  src: string; alt: string;
  /** Si fourni : cadre fixe + object-cover/contain selon `cover`. Si omis : ratio natif (height auto), aucun decoupage. */
  aspect?: string;
  priority?: boolean;
  className?: string;
  /** N'agit que si `aspect` est fourni. true = remplit le cadre (peut rogner). false = contain avec fond beige. */
  cover?: boolean;
}) {
  const { ref, visible } = useOnScreen('320px');
  const hasAspect = !!aspect;

  // Sans aspect : l'image trouve sa hauteur naturelle (block + h-auto + w-full).
  if (!hasAspect) {
    if (priority) {
      return (
        <div className={`overflow-hidden ${className}`}>
          <img
            src={src}
            alt={alt}
            loading="eager"
            decoding="async"
            // @ts-expect-error fetchpriority
            fetchpriority="high"
            className="block h-auto w-full"
          />
        </div>
      );
    }
    return (
      <div ref={ref} className={`overflow-hidden ${className}`}>
        {visible ? (
          <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full" />
        ) : (
          <div className="min-h-[280px] w-full animate-pulse bg-rose-50" />
        )}
      </div>
    );
  }

  // Avec aspect : cadre fixe.
  const fit = cover ? 'object-cover' : 'object-contain';
  const bg = cover ? '' : 'bg-stone-50';
  const wrapStyle = { aspectRatio: aspect };

  if (priority) {
    return (
      <div className={`overflow-hidden ${bg} ${className}`} style={wrapStyle}>
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchpriority
          fetchpriority="high"
          className={`h-full w-full ${fit}`}
        />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${bg} ${className}`} style={wrapStyle}>
      {visible ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-full w-full ${fit}`} />
      ) : (
        <div className="h-full w-full animate-pulse bg-rose-50" />
      )}
    </div>
  );
}

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const Star = () => (
  <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

function Hot({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 bg-clip-text font-black text-transparent">
      {children}
    </span>
  );
}

function FluidCTA({ onClick, children, variant = 'red' }: { onClick: () => void; children: ReactNode; variant?: 'red' | 'dark' | 'white' }) {
  const cls =
    variant === 'red'
      ? 'from-red-600 via-rose-600 to-red-700 text-white ring-white/30'
      : variant === 'dark'
        ? 'from-neutral-950 via-neutral-800 to-neutral-950 text-white ring-rose-300/30'
        : 'from-white via-rose-50 to-white text-red-700 ring-rose-300';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cac-fluid cac-fluid-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.18em] shadow-[0_18px_44px_-10px_rgba(239,68,68,.55)] ring-2 transition hover:scale-[1.02] sm:text-[15px]`}
    >
      <span className="cac-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items, speed = 32 }: { items: string[]; speed?: number }) {
  return (
    <div className="overflow-hidden border-y border-rose-200 bg-gradient-to-r from-rose-50 via-white to-rose-50 py-2.5">
      <div
        className="cac-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.28em] text-red-700/85 sm:text-[11px]"
        style={{ animationDuration: `${speed}s` }}
      >
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className="text-rose-400">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type FicheProps = {
  kicker?: string;
  hook: ReactNode;
  cta: string;
  qty?: number;
  onOrder: (q?: number) => void;
  media: ReactNode;
  variant?: 'white' | 'beige' | 'dark';
};

function Fiche({ kicker, hook, cta, qty, onOrder, media, variant = 'white' }: FicheProps) {
  const bg =
    variant === 'dark'
      ? 'bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white'
      : variant === 'beige'
        ? 'bg-gradient-to-b from-stone-100 via-[#fafaf6] to-rose-50/50 text-neutral-900'
        : 'bg-white text-neutral-900';
  const kickerColor = variant === 'dark' ? 'text-rose-300' : 'text-red-600';
  const subColor = variant === 'dark' ? 'text-stone-300' : 'text-neutral-600';

  return (
    <section className={`relative overflow-hidden py-10 sm:py-14 ${bg}`}>
      <div className="pointer-events-none absolute -left-20 top-10 h-40 w-40 rounded-full bg-rose-300/20 blur-3xl cac-float-slow" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-48 w-48 rounded-full bg-red-300/15 blur-3xl cac-float-slow" style={{ animationDelay: '2.5s' }} />

      <div className="relative mx-auto max-w-xl px-4 text-center">
        {kicker && (
          <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.32em] ${kickerColor}`}>{kicker}</p>
        )}
        <div className="mb-5 text-balance text-[19px] font-black leading-tight sm:text-[23px]">
          {hook}
        </div>
        <div className="relative mx-auto max-w-[460px] overflow-hidden rounded-[2rem] ring-1 ring-rose-200 shadow-[0_25px_60px_-22px_rgba(239,68,68,.3)]">
          {media}
        </div>
        <div className="mt-6">
          <FluidCTA onClick={() => onOrder(qty)} variant={variant === 'dark' ? 'white' : 'red'}>{cta} <Arrow /></FluidCTA>
          <p className={`mt-2.5 text-[11px] font-semibold ${subColor}`}>
            🔒 Paiement à la livraison · Livraison rapide
          </p>
        </div>
      </div>
    </section>
  );
}

export default function CremeAntiCerneLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(15);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [toast, setToast] = useState<{ n: string; v: string; act: string; visible: boolean } | null>(null);

  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const TOASTS = useMemo(() => [
    { n: 'Aïcha',     v: 'Cocody',       act: 'vient de commander 2 crèmes' },
    { n: 'Mariam',    v: 'Yopougon',     act: 'consulte cette offre' },
    { n: 'Grâce',     v: 'Bingerville',  act: 'a laissé un avis 5 étoiles' },
    { n: 'Sandrine',  v: 'Abobo',        act: 'vient de commander 1 crème' },
    { n: 'Fatou',     v: 'Marcory',      act: 'consulte cette offre' },
    { n: 'Khadija',   v: 'Treichville',  act: 'vient de commander 3 crèmes' },
    { n: 'Aminata',   v: 'Plateau',      act: 'a laissé un avis 5 étoiles' },
    { n: 'Salimata',  v: 'Riviera',      act: 'vient de commander 2 crèmes' },
  ], []);

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
        content_name: 'Crème Anti-Cernes Contour des Yeux',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: PRICES[1],
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
    const id = setInterval(() => setStock((s) => (s > 5 ? s - 1 : s)), 45000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCarouselIdx((c) => (c + 1) % 4), 5500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setGalleryIdx((c) => (c + 1) % 5), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const show = () => {
      const t = TOASTS[toastIdx.current % TOASTS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast((prev) => (prev ? { ...prev, visible: false } : null)), 4000);
      setTimeout(() => setToast(null), 4400);
    };
    const first = setTimeout(show, 5000);
    const id = setInterval(show, 14000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [TOASTS]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const stockPct = Math.round((stock / 25) * 100);

  const reviews = [
    { name: 'Aïcha', city: 'Cocody', txt: 'J\'avais toujours l\'air fatiguée. Depuis que j\'utilise la crème, mon regard est plus frais.', stars: 5, t: '09:14' },
    { name: 'Mariam', city: 'Yopougon', txt: 'Mes poches sous les yeux sont moins visibles. Je recommande.', stars: 5, t: '11:28' },
    { name: 'Grâce', city: 'Bingerville', txt: 'Texture légère, facile à appliquer. J\'aime beaucoup.', stars: 5, t: '15:43' },
    { name: 'Sandrine', city: 'Abobo', txt: 'J\'ai commandé pour les cernes, et franchement le contour de mes yeux paraît plus lumineux.', stars: 5, t: '18:09' },
  ];

  const galleryImgs = ['m3.webp', 'm4.webp', 'm6.webp', 'm8.webp', 'm13.webp'];

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
      <style>{`
        @keyframes cac-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .cac-marquee { animation: cac-marquee 32s linear infinite }
        @keyframes cac-sheen { 0% { transform: translateX(-100%) } 60% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .cac-sheen { animation: cac-sheen 2.8s ease-in-out infinite }
        @keyframes cac-float-slow { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-22px) translateX(14px) } }
        .cac-float-slow { animation: cac-float-slow 9s ease-in-out infinite }
        @keyframes cac-fluid-pulse {
          0%, 100% { box-shadow: 0 18px 44px -10px rgba(239,68,68,.55); transform: translateY(0); }
          50% { box-shadow: 0 26px 60px -8px rgba(239,68,68,.75); transform: translateY(-2px); }
        }
        .cac-fluid-pulse { animation: cac-fluid-pulse 2.4s ease-in-out infinite }
        .cac-fluid:hover { animation: none !important; }
        @keyframes cac-bob { 0%,100% { transform: translateY(0) rotate(-1deg) } 50% { transform: translateY(-4px) rotate(.5deg) } }
        .cac-bob { animation: cac-bob 5s ease-in-out infinite }
        @keyframes cac-fade-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .cac-fade-up { animation: cac-fade-up .55s cubic-bezier(.22,.8,.4,1) both }
        @keyframes cac-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .cac-shimmer-red {
          background: linear-gradient(90deg, #dc2626 0%, #f87171 25%, #ef4444 50%, #fda4a4 75%, #dc2626 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: cac-shimmer 3.5s linear infinite;
        }
        @keyframes cac-pulse-dot { 0% { transform: scale(.95); opacity: 1 } 100% { transform: scale(2); opacity: 0 } }
        .cac-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: cac-pulse-dot 1.6s cubic-bezier(0,0,.2,1) infinite }
        @keyframes cac-toast-slide-in { from { opacity: 0; transform: translateX(-110%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes cac-toast-slide-out { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-110%) } }
        .cac-toast-in { animation: cac-toast-slide-in .45s cubic-bezier(.22,1,.36,1) both }
        .cac-toast-out { animation: cac-toast-slide-out .4s cubic-bezier(.55,.08,.68,.53) both }
      `}</style>

      {/* STICKY HEADER countdown */}
      <div className="sticky top-0 z-50 border-b border-rose-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-3 py-2 sm:gap-4">
          <span className="relative flex h-2 w-2 text-red-500 cac-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-red-700">
            <span className="cac-shimmer-red">Offre limitée</span> · clôture minuit
          </span>
          <div className="flex items-center gap-1">
            {[countdown.h, countdown.m, countdown.s].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-red-400">:</span>}
                <span className="inline-flex h-7 min-w-[32px] items-center justify-center rounded-md bg-red-50 px-1.5 font-mono text-[13px] font-black tabular-nums text-red-700 ring-1 ring-red-200">
                  {pad(v)}
                </span>
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
            🔥 Stock {stock}
          </span>
        </div>
        <div className="h-[3px] w-full bg-rose-50">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-red-600 transition-all duration-700"
            style={{ width: `${stockPct}%` }}
          />
        </div>
      </div>

      <Marquee items={['SOIN CONTOUR DES YEUX', 'ANTI-CERNES & ANTI-RIDES', 'TEXTURE LÉGÈRE', 'PAIEMENT LIVRAISON', '24H ABIDJAN', 'STOCK LIMITÉ']} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-white py-6 sm:py-10">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-rose-300/30 blur-3xl cac-float-slow" />
        <div className="pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full bg-red-300/25 blur-3xl cac-float-slow" style={{ animationDelay: '3s' }} />

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-red-700 backdrop-blur cac-fade-up">
            <span className="h-1 w-1 rounded-full bg-red-500" />
            Édition signature 2026
            <span className="h-1 w-1 rounded-full bg-red-500" />
          </p>

          <div className="relative mt-5 cac-fade-up" style={{ animationDelay: '.05s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-rose-300/40 via-red-200/30 to-rose-300/40 blur-3xl" />
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2.2rem] bg-white shadow-[0_30px_80px_-20px_rgba(239,68,68,.3)] ring-2 ring-rose-200 cac-bob">
              <LazyImg src={M('m1.webp')} alt="Crème contour des yeux anti-cernes premium" aspect="4/5" priority cover />
            </div>

            <div className="absolute -left-3 top-10 rotate-[-7deg] rounded-md bg-red-700 px-3 py-2 text-center shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-rose-200">Soin</p>
              <p className="cac-shimmer-red text-[16px] font-black leading-tight">Premium</p>
            </div>
            <div className="absolute -right-3 bottom-12 rotate-[6deg] rounded-md bg-white px-3 py-2 shadow-xl ring-1 ring-rose-200">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-neutral-700">Note</p>
              <p className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 text-[11px] font-black text-neutral-900">4.9</span>
              </p>
            </div>
          </div>

          <h1 className="mt-6 text-balance text-[32px] font-black leading-[1.05] tracking-tight text-neutral-900 sm:text-[44px] cac-fade-up" style={{ animationDelay: '.1s' }}>
            Un <Hot>regard plus jeune</Hot>, plus <Hot>frais</Hot>, plus <Hot>lumineux</Hot>.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-[13px] font-semibold leading-relaxed text-neutral-700 cac-fade-up sm:text-[15px]" style={{ animationDelay: '.15s' }}>
            Crème contour des yeux pour atténuer les <Hot>cernes</Hot>, les <Hot>poches</Hot> et les <Hot>ridules</Hot>.
          </p>

          <div className="mt-5 cac-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="cac-shimmer-red text-4xl font-black sm:text-5xl">9 900</span>
              <span className="text-lg font-bold text-neutral-800 sm:text-xl">FCFA</span>
              <span className="text-sm text-neutral-400 line-through sm:text-base">15 000 FCFA</span>
              <span className="rounded-md bg-red-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">-34 %</span>
            </div>
            <p className="mt-1 text-[12px] font-bold text-red-700">🚚 Livraison gratuite Abidjan</p>

            <div className="mx-auto mt-4 max-w-sm">
              <FluidCTA onClick={() => openModal(1)}>Commander maintenant <Arrow /></FluidCTA>
            </div>
            <p className="mt-2 text-[11px] text-neutral-500">🔒 Paiement à la livraison · Sans risque</p>
          </div>
        </div>
      </section>

      <section className="border-y border-rose-100 bg-rose-50/40">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:gap-4 sm:py-7">
          {[
            { n: '4,9/5', l: 'Note clients' },
            { n: '2 800+', l: 'Clientes ravies' },
            { n: '7-14 j', l: 'Premiers effets' },
            { n: '24h', l: 'Livraison Abidjan' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="cac-shimmer-red text-[24px] font-black sm:text-[30px]">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BLOC PROBLÈME */}
      <section className="bg-stone-50 py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-red-700">Le problème</p>
          <h2 className="mt-3 text-balance text-[24px] font-black leading-tight text-neutral-900 sm:text-[30px]">
            Vos yeux disent que vous êtes <Hot>fatigué</Hot> ?
          </h2>
          <ul className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2 text-left text-[13px] font-bold text-neutral-800 sm:text-[14px]">
            {['Cernes visibles', 'Poches sous les yeux', 'Ridules autour du regard', 'Regard terne et fatigué'].map((x, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-rose-100">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </span>
                {x}
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-6 max-w-[420px] overflow-hidden rounded-[2rem] ring-1 ring-rose-200 shadow-xl">
            <LazyImg src={M('m2.webp')} alt="Regard fatigué cernes poches ridules" />
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <FluidCTA onClick={() => openModal(1)}>Je veux corriger mon regard <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* BLOC SOLUTION */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-red-700">La solution</p>
          <h2 className="mt-3 text-balance text-[24px] font-black leading-tight text-neutral-900 sm:text-[30px]">
            Crème contour des yeux <Hot>anti-rides</Hot>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] font-semibold text-neutral-700 sm:text-[15px]">
            Une crème ciblée pour aider à <Hot>lisser</Hot>, défatiguer et illuminer le contour des yeux.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { ico: '✦', t: 'Atténue les cernes' },
              { ico: '◆', t: 'Réduit les poches' },
              { ico: '✧', t: 'Lisse les ridules' },
              { ico: '◈', t: 'Aide à raffermir le contour' },
              { ico: '☀', t: 'Illumine le regard' },
              { ico: '✿', t: 'Texture légère' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-stone-50 p-4 ring-1 ring-rose-100 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-500 text-lg text-white shadow">
                  {b.ico}
                </span>
                <span className="text-left text-[13px] font-black text-neutral-900">{b.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FICHE 1 — m3 avant/après */}
      <Fiche
        kicker="Avant / Après"
        hook={<>Avant : regard <Hot>fatigué</Hot>. Après : regard <Hot>plus frais</Hot>.</>}
        cta="Commander ma crème"
        qty={1}
        onOrder={openModal}
        variant="white"
        media={<LazyImg src={M('m3.webp')} alt="Avant après cernes" />}
      />

      {/* FICHE 2 — m4 */}
      <Fiche
        kicker="Résultat ciblé"
        hook={<>Moins de <Hot>poches</Hot>, plus d'<Hot>éclat</Hot>.</>}
        cta="Pack populaire (2 crèmes)"
        qty={2}
        onOrder={openModal}
        variant="beige"
        media={<LazyImg src={M('m4.webp')} alt="Résultat sur les poches" />}
      />

      {/* FICHE 3 — m5 application */}
      <Fiche
        kicker="L'application"
        hook={<>Quelques <Hot>gouttes</Hot> suffisent pour prendre soin du contour des yeux.</>}
        cta="Je commande maintenant"
        qty={1}
        onOrder={openModal}
        variant="white"
        media={<LazyImg src={M('m5.webp')} alt="Application de la crème" />}
      />

      {/* SECTION : VU PAR LES CLIENTES (sans fausses sources) */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-red-700">Vu par nos clientes</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {['Avis vérifiés WhatsApp', 'Recommandé par nos clientes', 'Témoignages clients', 'Résultats observés'].map((p) => (
              <span key={p} className="rounded-md border border-rose-200 bg-rose-50/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-700 shadow-sm">{p}</span>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-white shadow-xl">
            <span className="flex">{[1,2,3,4,5].map(i => <Star key={i}/>)}</span>
            <span className="text-[12px] font-black">4,9/5</span>
            <span className="text-[10px] uppercase tracking-wider text-rose-300">2 800+ clientes</span>
          </div>
        </div>
      </section>

      {/* CARROUSEL premium */}
      <section className="bg-stone-50 py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-red-700">Galerie</p>
          <h2 className="mt-3 text-center text-balance text-[22px] font-black leading-tight text-neutral-900 sm:text-[28px]">
            Des résultats qui <Hot>parlent</Hot> au premier regard
          </h2>

          <div className="relative mt-6 overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-rose-200">
            <div className="relative aspect-[4/5] sm:aspect-[16/10]">
              {galleryImgs.map((img, i) => (
                <div
                  key={img}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === galleryIdx ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img src={M(img)} alt={`Galerie ${i + 1}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                </div>
              ))}
              {/* Flèches */}
              <button
                type="button"
                aria-label="Précédent"
                onClick={() => setGalleryIdx((c) => (c - 1 + galleryImgs.length) % galleryImgs.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-700 shadow-lg ring-1 ring-rose-200 transition hover:bg-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button
                type="button"
                aria-label="Suivant"
                onClick={() => setGalleryIdx((c) => (c + 1) % galleryImgs.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-700 shadow-lg ring-1 ring-rose-200 transition hover:bg-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-2 py-3">
              {galleryImgs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  onClick={() => setGalleryIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === galleryIdx ? 'w-8 bg-red-600' : 'w-2 bg-rose-200 hover:bg-rose-300'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <FluidCTA onClick={() => openModal(2)}>Réserver ma crème <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* SECTION TEMOIGNAGES WHATSAPP */}
      <section className="bg-[#e5ddd5] py-12 sm:py-14">
        <div className="mx-auto max-w-md px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-red-800">Avis vérifiés WhatsApp</p>
          <h2 className="mt-2 text-center text-balance text-[22px] font-black leading-tight text-neutral-900 sm:text-[26px]">
            Ce qu'<Hot>elles disent</Hot>.
          </h2>

          <div className="mt-5 overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-500 font-black text-white">GS</div>
              <div className="flex-1">
                <p className="text-[13px] font-black">GS · Crème contour des yeux</p>
                <p className="text-[10px] text-emerald-200">● en ligne</p>
              </div>
              <span className="text-[10px] font-bold text-white/80">Aujourd'hui</span>
            </div>
            <div className="space-y-2 bg-[#ece5dd] px-3 py-4">
              {reviews.map((r, i) => (
                <div key={i} className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] font-black text-red-700">{r.name} · {r.city}</p>
                  <p className="mt-0.5 text-[13px] text-neutral-800">"{r.txt}"</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="flex">{Array.from({length: r.stars}).map((_, j) => <Star key={j}/>)}</span>
                    <p className="text-[9px] text-neutral-400">{r.t} ✓✓</p>
                  </div>
                </div>
              ))}
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
                <p className="text-[13px] text-neutral-800">Merci à toutes pour vos retours ❤️ Suivez la routine matin/soir pour des résultats optimaux.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-500">10:42 ✓✓</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <FluidCTA onClick={() => openModal(1)}>Moi aussi je commande <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* FICHE 4 — m6 */}
      <Fiche
        kicker="Carnation africaine"
        hook={<>Une formule qui <Hot>respecte</Hot> votre carnation et illumine votre regard.</>}
        cta="Je passe commande"
        qty={1}
        onOrder={openModal}
        variant="white"
        media={<LazyImg src={M('m6.webp')} alt="Avant après carnation africaine" />}
      />

      {/* FICHE 5 — m7 produit */}
      <Fiche
        kicker="Le produit"
        hook={<>Format <Hot>cabine</Hot>, packaging soigné. Effet <Hot>premium</Hot> au quotidien.</>}
        cta="Je veux ce soin"
        qty={1}
        onOrder={openModal}
        variant="beige"
        media={<LazyImg src={M('m7.webp')} alt="Crème packaging premium" />}
      />

      {/* SECTION EXPERT / RASSURANCE */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-red-700">Pourquoi un soin ciblé ?</p>
          <h2 className="mt-3 text-balance text-[22px] font-black leading-tight text-neutral-900 sm:text-[28px]">
            Pourquoi utiliser une crème <Hot>spéciale contour des yeux</Hot> ?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] font-semibold leading-relaxed text-neutral-700 sm:text-[14px]">
            La peau sous les yeux est <Hot>plus fine</Hot> et marque plus vite la fatigue, les ridules et les poches. Un soin ciblé aide à garder un regard <Hot>plus frais</Hot> et plus <Hot>lumineux</Hot>.
          </p>
          <ul className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2 text-left text-[12px] font-bold text-neutral-800 sm:text-[13px]">
            {['Texture légère', 'Application facile', 'Soin ciblé contour', 'Routine simple'].map((x, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-rose-50/60 p-3 ring-1 ring-rose-100">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FICHE 6 — m8 avant/après traitement */}
      <Fiche
        kicker="Avant / Après réel"
        hook={<>Un contour des yeux <Hot>plus lisse</Hot>. Un regard <Hot>plus jeune</Hot>.</>}
        cta="Je veux ce résultat"
        qty={2}
        onOrder={openModal}
        variant="beige"
        media={<LazyImg src={M('m8.webp')} alt="Avant après traitement" />}
      />

      {/* MODE D'EMPLOI */}
      <section className="bg-stone-50 py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-red-700">Mode d'emploi</p>
          <h2 className="mt-3 text-center text-balance text-[22px] font-black leading-tight text-neutral-900 sm:text-[28px]">
            Comment <Hot>l'utiliser</Hot> ?
          </h2>
          <ol className="mt-6 space-y-3">
            {[
              { n: '1', t: 'Nettoyez votre visage', d: 'Démaquillez et lavez votre visage à l\'eau tiède.' },
              { n: '2', t: 'Appliquez une petite quantité', d: 'Une noisette suffit, sous chaque œil.' },
              { n: '3', t: 'Tapotez doucement', d: 'Avec l\'annulaire, jusqu\'à pénétration totale.' },
              { n: '4', t: 'Matin ou soir', d: 'Selon votre routine beauté, idéalement les deux.' },
            ].map((s) => (
              <li key={s.n} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-rose-100 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-500 text-[14px] font-black text-white shadow">
                  {s.n}
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[14px] font-black text-neutral-900">{s.t}</p>
                  <p className="mt-0.5 text-[12px] text-neutral-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <FluidCTA onClick={() => openModal(1)}>Je veux essayer aujourd'hui <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* FICHE 7 — m9 résultat */}
      <Fiche
        kicker="Regard transformé"
        hook={<>La <Hot>beauté</Hot> commence par le regard.</>}
        cta="Profiter de l'offre"
        qty={2}
        onOrder={openModal}
        variant="white"
        media={<LazyImg src={M('m9.webp')} alt="Regard transformé" />}
      />

      {/* SECTION BUNDLES */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-red-700">Offre spéciale</span>
            <h2 className="mt-3 text-balance text-[22px] font-black leading-tight text-neutral-900 sm:text-[28px]">
              Plus vous prenez, <Hot>plus vous économisez</Hot>.
            </h2>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { v: 1, n: '1 crème', p: 9900, old: 15000, sub: 'Idéal pour tester', save: null },
              { v: 2, n: '2 crèmes', p: 16900, old: 30000, sub: '🔥 Le plus choisi', save: '-2 900 F', hot: true },
              { v: 3, n: '3 crèmes', p: 24900, old: 45000, sub: '⭐ Meilleure offre', save: '-4 800 F' },
            ].map((b) => (
              <button
                key={b.v}
                type="button"
                onClick={() => openModal(b.v)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition hover:scale-[1.02] hover:shadow-xl ${
                  b.hot
                    ? 'border-red-500 bg-gradient-to-br from-rose-50 via-white to-rose-50 shadow-lg ring-2 ring-red-300/40'
                    : 'border-rose-200 bg-gradient-to-br from-white to-stone-50'
                }`}
              >
                {b.hot && (
                  <span className="absolute -top-1 right-4 rotate-3 rounded-b-md bg-red-600 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow">★ POPULAIRE</span>
                )}
                <p className="text-[10px] font-black uppercase tracking-wider text-red-700">{b.sub}</p>
                <p className="mt-1 text-xl font-black text-neutral-900">{b.n}</p>
                <p className="mt-2 cac-shimmer-red text-2xl font-black">{b.p.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                <p className="mt-1 text-[11px] text-neutral-400 line-through">{b.old.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                {b.save && (
                  <p className="mt-2 inline-flex rounded-full bg-red-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">{b.save}</p>
                )}
              </button>
            ))}
          </div>

          {/* Upsell */}
          <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-red-300 bg-gradient-to-br from-rose-50 to-white p-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-700 text-3xl text-white shadow-lg">🎁</div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-700">Bonus offert</p>
              <p className="text-[14px] font-black text-neutral-900">+1 mini-format découverte avec le pack 3 crèmes</p>
              <p className="mt-1 text-[11px] text-neutral-600">Pour offrir ou garder dans le sac.</p>
            </div>
            <button
              type="button"
              onClick={() => openModal(3)}
              className="cac-fluid relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-white shadow-lg ring-2 ring-white/20"
            >
              <span className="cac-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              <span className="relative">J'en profite</span>
            </button>
          </div>
        </div>
      </section>

      {/* FICHE 8 — m10 application réelle */}
      <Fiche
        kicker="Geste simple"
        hook={<>Une <Hot>routine simple</Hot> qui change tout.</>}
        cta="Je commence aujourd'hui"
        qty={1}
        onOrder={openModal}
        variant="beige"
        media={<LazyImg src={M('m10.webp')} alt="Application crème geste simple" />}
      />

      {/* FICHE 9 — m11 carnation */}
      <Fiche
        kicker="Universelle"
        hook={<>Adaptée à <Hot>toutes les carnations</Hot>. Adoptée par des milliers de femmes.</>}
        cta="Je veux ce soin"
        qty={2}
        onOrder={openModal}
        variant="white"
        media={<LazyImg src={M('m11.webp')} alt="Crème universelle toutes carnations" />}
      />

      {/* FICHE 10 — m12 routine */}
      <Fiche
        kicker="Routine quotidienne"
        hook={<>Quelques gestes simples, un <Hot>regard plus frais</Hot>.</>}
        cta="J'ajoute à ma routine"
        qty={1}
        onOrder={openModal}
        variant="beige"
        media={<LazyImg src={M('m12.webp')} alt="Routine quotidienne contour des yeux" />}
      />

      {/* FICHE 11 — m14 hommes aussi */}
      <Fiche
        kicker="Pour eux aussi"
        hook={<>Les <Hot>hommes</Hot> méritent aussi un regard <Hot>frais et net</Hot>.</>}
        cta="Pack famille (3 crèmes)"
        qty={3}
        onOrder={openModal}
        variant="white"
        media={<LazyImg src={M('m14.webp')} alt="Avant après homme contour des yeux" />}
      />

      {/* GARANTIE BOX */}
      <section className="bg-stone-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl bg-gradient-to-br from-red-700 via-rose-700 to-red-800 p-7 text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-rose-200">Notre engagement</p>
            <h3 className="mt-2 text-balance text-[22px] font-black leading-tight sm:text-[28px]">
              Vous payez <Hot>uniquement à la livraison</Hot>.
            </h3>
            <ul className="mt-5 space-y-2 text-[14px]">
              {[
                'Paiement à la livraison · 100 % sans risque',
                'Livraison rapide à Abidjan, 24-48 h',
                'Commande simple en 30 secondes',
                'Support WhatsApp disponible',
                'Offre spéciale aujourd\'hui',
              ].map((x, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-red-700 shadow">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <FluidCTA onClick={() => openModal(1)} variant="white">J'achète sans risque <Arrow/></FluidCTA>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-balance text-[22px] font-black leading-tight text-neutral-900 sm:text-[28px]">
            Vos <Hot>questions</Hot>.
          </h2>
          <div className="mt-6 space-y-3">
            {[
              { q: 'En combien de temps voit-on un résultat ?', a: 'Premiers effets visibles entre 7 et 14 jours d\'utilisation régulière. Résultat marqué après 4 à 6 semaines.' },
              { q: 'La crème convient-elle à toutes les peaux ?', a: 'Oui, formulée pour le contour des yeux. Texture légère, sans gras résiduel, adaptée aux peaux sensibles.' },
              { q: 'Combien d\'applications par jour ?', a: '1 à 2 fois par jour (matin et/ou soir) selon votre routine. Une noisette suffit sous chaque œil.' },
              { q: 'Comment je paie ?', a: 'Vous payez en CASH au livreur, après réception du colis. Aucune avance.' },
              { q: 'Livraison partout en CI ?', a: 'Oui. 24h Abidjan, 48h en régions. Livraison gratuite.' },
              { q: 'Stock encore disponible ?', a: 'Stock limité aujourd\'hui. La promo se termine à minuit. Réservez votre crème dès maintenant.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-stone-50 shadow-sm ring-1 ring-rose-100 transition-all open:ring-rose-300 open:bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-neutral-900 sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="h-5 w-5 text-red-600 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-neutral-700 sm:text-[14px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOTURE FORTE — m15 / m16 carrousel témoignages premium */}
      <section className="relative overflow-hidden">
        <LazyImg src={M('m13.webp')} alt="" className="absolute inset-0 h-full w-full" cover />
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/95 via-red-900/85 to-rose-900/85" />
        <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-rose-400/30 blur-3xl cac-float-slow" />
        <div className="pointer-events-none absolute -right-16 bottom-12 h-48 w-48 rounded-full bg-red-300/20 blur-3xl cac-float-slow" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center text-white sm:py-20">
          <p className="text-[10px] font-black uppercase tracking-[0.36em] text-rose-300">Dernière ligne droite</p>
          <h2 className="mt-3 text-balance text-[26px] font-black leading-tight sm:text-[34px]">
            Votre regard <span className="cac-shimmer-red">mérite ce soin</span>.
          </h2>
          <p className="mt-3 text-[13px] font-semibold text-rose-100/95 sm:text-[14px]">Compte à rebours actif · stock affiché en temps réel.</p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-rose-300/40 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-200">Fin promo</span>
            <span className="font-mono text-[14px] font-black tabular-nums text-white">
              {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </span>
          </div>

          <div className="mx-auto mt-7 max-w-sm">
            <FluidCTA onClick={() => openModal(2)}>COMMANDE EXPRESS — 16 900 F <Arrow/></FluidCTA>
            <p className="mt-3 text-[11px] text-rose-200">Sans engagement · paiement à la réception</p>
          </div>
        </div>
      </section>

      {/* CARROUSEL TEMOIGNAGES (4 avis dots) */}
      <section className="bg-rose-50/40 py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-red-700">Témoignages clients</span>
            <h2 className="mt-3 text-balance text-[22px] font-black leading-tight text-neutral-900 sm:text-[28px]">
              <Hot>4,9/5</Hot> · des centaines de retours
            </h2>
          </div>

          <div className="relative mt-6 min-h-[210px] overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-rose-200 shadow-xl">
            {reviews.map((r, i) => (
              <div
                key={r.name}
                className={`absolute inset-x-6 top-6 transition-all duration-700 ${
                  i === carouselIdx ? 'z-10 translate-y-0 opacity-100' : 'pointer-events-none z-0 translate-y-3 opacity-0'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-wider text-neutral-900">{r.name}</p>
                    <p className="text-[10px] font-bold text-red-700">{r.city}</p>
                  </div>
                  <span className="flex">{Array.from({length: r.stars}).map((_, j) => <Star key={j}/>)}</span>
                </div>
                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-neutral-800">"{r.txt}"</p>
                <p className="mt-3 text-right text-[10px] text-red-600">{r.t} · ✓ Vérifié WhatsApp</p>
              </div>
            ))}
            <div className="mt-[190px] flex justify-center gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Avis ${i + 1}`}
                  onClick={() => setCarouselIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === carouselIdx ? 'w-8 bg-red-600' : 'w-2 bg-rose-200 hover:bg-rose-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-neutral-950 py-7 pb-24 text-center text-[10px] font-semibold text-rose-300/70 sm:pb-7">
        © {new Date().getFullYear()} · Crème contour des yeux · Soin premium · Côte d'Ivoire
      </footer>

      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: 'Crème Contour des Yeux',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          slug: SLUG,
          company,
          navigate,
          images: { hero: M('m1.webp') },
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />

      {/* TOAST SOCIAL PROOF */}
      {toast && !modal && (
        <div
          className={`fixed bottom-20 left-3 z-30 w-[88vw] max-w-[300px] sm:bottom-5 ${
            toast.visible ? 'cac-toast-in' : 'cac-toast-out'
          }`}
        >
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-white px-3 py-2.5 shadow-[0_12px_30px_-6px_rgba(239,68,68,.25)]">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-red-600 text-white font-black ring-2 ring-rose-100">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/50" />
              <span className="relative text-[12px]">{toast.n[0]}</span>
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-black text-neutral-900">
                <span className="text-red-700">{toast.n}</span> · {toast.v}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">{toast.act}</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">✓</span>
          </div>
        </div>
      )}

      {/* STICKY CTA BOTTOM mobile */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-rose-200 bg-white/97 px-3 py-2.5 backdrop-blur-md sm:hidden ${
          modal ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100 cac-fade-up'
        } transition-all duration-300`}
        style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-red-700">
              Promo · {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </p>
            <p className="text-[11px] font-bold text-neutral-800">9 900 F · livraison gratuite</p>
          </div>
          <button
            type="button"
            onClick={() => openModal(1)}
            className="cac-fluid cac-fluid-pulse relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 py-2.5 text-[13px] font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_-4px_rgba(239,68,68,.55)] ring-2 ring-white/30"
          >
            <span className="cac-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <span className="relative">Commander</span>
            <Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}
