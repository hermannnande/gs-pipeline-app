/**
 * Tunnel de vente — Chaussettes Homme Luxe (CHAUSSETTE_HOMME)
 * Slug: chaussette-homme
 *
 * Disposition unique : magazine GQ, sections offset, hero fullscreen, fiches stack
 * 1 media + 1 hook + 1 CTA fluide. Palette MASCULINE LUXE : noir charcoal + or
 * champagne + ivoire. Pack de 5 paires assorties a 9 900 F.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'chaussette-homme';
const PRODUCT_CODE = 'CHAUSSETTE_HOMME';
const META_PIXEL_ID = '952340034030644';
const THANK_YOU_URL = '/chaussette-homme/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const QTY_OPTS = [
  { v: 1, label: '5 paires', sub: '9 900 FCFA' },
  { v: 2, label: '10 paires', sub: '16 900 FCFA', tag: 'Populaire', save: 'Economisez 2 900 F' },
  { v: 3, label: '15 paires', sub: '24 900 FCFA', tag: 'Stock pro', save: 'Economisez 4 800 F' },
];

const M = (n: string) => `/chaussettes-homme/${n}`;

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
        <div className="h-full min-h-[260px] w-full animate-pulse bg-neutral-200" />
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

function Gold({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text font-black text-transparent">
      {children}
    </span>
  );
}

function FluidCTA({ onClick, children, dark = false }: { onClick: () => void; children: ReactNode; dark?: boolean }) {
  const cls = dark
    ? 'from-amber-300 via-yellow-300 to-amber-400 text-neutral-950 ring-amber-200/40'
    : 'from-neutral-950 via-neutral-800 to-neutral-950 text-amber-300 ring-amber-300/40';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chh-fluid chh-fluid-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.18em] shadow-[0_18px_44px_-10px_rgba(0,0,0,.55)] ring-2 transition hover:scale-[1.02] sm:text-[15px]`}
    >
      <span className="chh-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items, speed = 32 }: { items: string[]; speed?: number }) {
  return (
    <div className="overflow-hidden border-y border-amber-300/30 bg-neutral-950 py-2.5">
      <div
        className="chh-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/85 sm:text-[11px]"
        style={{ animationDuration: `${speed}s` }}
      >
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className="text-amber-200">◆</span>
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
  variant?: 'ivory' | 'noir' | 'sand';
};

function Fiche({ kicker, hook, cta, qty, onOrder, media, variant = 'ivory' }: FicheProps) {
  const bg =
    variant === 'noir'
      ? 'bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white'
      : variant === 'sand'
        ? 'bg-gradient-to-b from-stone-100 via-[#fafaf6] to-stone-50 text-neutral-900'
        : 'bg-[#fafaf6] text-neutral-900';
  const kickerColor = variant === 'noir' ? 'text-amber-300' : 'text-amber-700';
  const subColor = variant === 'noir' ? 'text-stone-300' : 'text-neutral-600';
  const ctaDark = variant !== 'noir';

  return (
    <section className={`relative overflow-hidden py-14 sm:py-20 ${bg}`}>
      <div className="pointer-events-none absolute -left-20 top-10 h-40 w-40 rounded-full bg-amber-300/15 blur-3xl chh-float-slow" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-48 w-48 rounded-full bg-yellow-300/15 blur-3xl chh-float-slow" style={{ animationDelay: '2.5s' }} />

      <div className="relative mx-auto max-w-xl px-4 text-center">
        {kicker && (
          <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.32em] ${kickerColor}`}>{kicker}</p>
        )}
        <div className="mb-6 text-balance text-[20px] font-black leading-tight sm:text-[24px]">
          {hook}
        </div>
        <div className="relative mx-auto max-w-[460px] overflow-hidden rounded-[2rem] ring-1 ring-amber-300/40 shadow-[0_30px_70px_-22px_rgba(0,0,0,.5)]">
          {media}
        </div>
        <div className="mt-7">
          <FluidCTA onClick={() => onOrder(qty)} dark={ctaDark}>{cta} <Arrow /></FluidCTA>
          <p className={`mt-2.5 text-[11px] font-semibold ${subColor}`}>
            🔒 Paiement à la livraison · Express partout en CI
          </p>
        </div>
      </div>
    </section>
  );
}

export default function ChaussetteHommeLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(15);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);

  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const TOASTS = useMemo(() => [
    { n: 'Konan A.',     v: 'Plateau',   t: '3 min'  },
    { n: 'Yao M.',       v: 'Cocody',    t: '7 min'  },
    { n: 'Diabate F.',   v: 'Yopougon',  t: '12 min' },
    { n: 'Kouassi B.',   v: 'Bouake',    t: '16 min' },
    { n: 'Traore I.',    v: 'Marcory',   t: '21 min' },
    { n: 'Kone S.',      v: 'San Pedro', t: '25 min' },
    { n: 'Bamba D.',     v: 'Daloa',     t: '29 min' },
    { n: 'Coulibaly E.', v: 'Korhogo',   t: '34 min' },
  ], []);

  const openModal = useCallback((q?: number) => {
    setQty(q || 1);
    setModal(true);
  }, []);

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
        content_name: 'Chaussettes Homme Luxe',
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
    const show = () => {
      const t = TOASTS[toastIdx.current % TOASTS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast((prev) => (prev ? { ...prev, visible: false } : null)), 4000);
      setTimeout(() => setToast(null), 4400);
    };
    const first = setTimeout(show, 5000);
    const id = setInterval(show, 15000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [TOASTS]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const stockPct = Math.round((stock / 25) * 100);

  const reviews = [
    { name: 'Konan A.', city: 'Abidjan Plateau', txt: 'Tissu solide, classe au bureau. Mes collegues m\'ont demande la marque 👌', stars: 5, t: '09:14' },
    { name: 'Yao M.', city: 'Cocody', txt: '5 paires d\'un coup, je tourne toute la semaine sans soucis. Top qualite.', stars: 5, t: '12:27' },
    { name: 'Diabate F.', city: 'Yopougon', txt: 'Confort excellent en costume comme en jean. Livraison en 24h.', stars: 5, t: '15:43' },
    { name: 'Kone S.', city: 'Bouake', txt: 'Mon mari les adore. J\'ai recommande pour Noel pour les freres.', stars: 5, t: '18:09' },
  ];

  const press = ['GQ Afrique', 'Forbes Style', 'Mens Bureau', 'Elite Magazine', 'Style+', 'Gentleman CI'];

  return (
    <div className="min-h-screen bg-[#fafaf6] text-neutral-900" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
      <style>{`
        @keyframes chh-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .chh-marquee { animation: chh-marquee 32s linear infinite }
        @keyframes chh-sheen { 0% { transform: translateX(-100%) } 60% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .chh-sheen { animation: chh-sheen 3s ease-in-out infinite }
        @keyframes chh-float-slow { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-22px) translateX(14px) } }
        .chh-float-slow { animation: chh-float-slow 9s ease-in-out infinite }
        @keyframes chh-fluid-pulse {
          0%, 100% { box-shadow: 0 18px 44px -10px rgba(0,0,0,.55); transform: translateY(0); }
          50% { box-shadow: 0 26px 60px -8px rgba(212,175,55,.55); transform: translateY(-2px); }
        }
        .chh-fluid-pulse { animation: chh-fluid-pulse 2.6s ease-in-out infinite }
        .chh-fluid:hover { animation: none !important; }
        @keyframes chh-bob { 0%,100% { transform: translateY(0) rotate(-1deg) } 50% { transform: translateY(-4px) rotate(.5deg) } }
        .chh-bob { animation: chh-bob 5s ease-in-out infinite }
        @keyframes chh-fade-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .chh-fade-up { animation: chh-fade-up .55s cubic-bezier(.22,.8,.4,1) both }
        @keyframes chh-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .chh-shimmer-gold {
          background: linear-gradient(90deg, #d4af37 0%, #fde68a 25%, #f59e0b 50%, #fef3c7 75%, #d4af37 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: chh-shimmer 3.5s linear infinite;
        }
        .chh-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500 }
        @keyframes chh-pulse-dot { 0% { transform: scale(.95); opacity: 1 } 100% { transform: scale(2); opacity: 0 } }
        .chh-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: chh-pulse-dot 1.6s cubic-bezier(0,0,.2,1) infinite }
        @keyframes chh-toast-slide-in { from { opacity: 0; transform: translateX(-110%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes chh-toast-slide-out { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-110%) } }
        .chh-toast-in { animation: chh-toast-slide-in .45s cubic-bezier(.22,1,.36,1) both }
        .chh-toast-out { animation: chh-toast-slide-out .4s cubic-bezier(.55,.08,.68,.53) both }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" />

      {/* STICKY HEADER countdown noir/or */}
      <div className="sticky top-0 z-50 border-b border-amber-300/40 bg-neutral-950 shadow-lg">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-3 py-2 sm:gap-4">
          <span className="relative flex h-2 w-2 text-amber-300 chh-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
            <span className="chh-shimmer-gold">Edition limitee</span> · cloture minuit
          </span>
          <div className="flex items-center gap-1">
            {[countdown.h, countdown.m, countdown.s].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-amber-500">:</span>}
                <span className="inline-flex h-7 min-w-[32px] items-center justify-center rounded-md bg-amber-400/15 px-1.5 font-mono text-[13px] font-black tabular-nums text-amber-200 ring-1 ring-amber-400/40">
                  {pad(v)}
                </span>
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-950">
            ✦ Stock {stock}
          </span>
        </div>
        <div className="h-[3px] w-full bg-neutral-900">
          <div
            className="h-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-500 transition-all duration-700"
            style={{ width: `${stockPct}%` }}
          />
        </div>
      </div>

      <Marquee items={['CHAUSSETTES HOMME LUXE', '5 PAIRES ASSORTIES', 'COTON PEIGNE', 'BUREAU & SORTIES', '24H ABIDJAN', 'CASH LIVRAISON']} />

      {/* HERO editorial */}
      <section className="relative overflow-hidden bg-[#fafaf6] py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl chh-float-slow" />
        <div className="pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full bg-yellow-300/25 blur-3xl chh-float-slow" style={{ animationDelay: '3s' }} />

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-amber-700 backdrop-blur chh-fade-up">
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            Edition signature 2026
            <span className="h-1 w-1 rounded-full bg-amber-500" />
          </p>

          <div className="relative mt-6 chh-fade-up" style={{ animationDelay: '.05s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-amber-300/40 via-yellow-200/30 to-amber-300/40 blur-3xl" />
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2.2rem] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.4)] ring-2 ring-amber-300/50 chh-bob">
              <LazyImg src={M('m1.webp')} alt="Chaussettes homme luxe pack 5" aspect="4/5" priority />
            </div>

            <div className="absolute -left-3 top-10 rotate-[-7deg] rounded-md bg-neutral-950 px-3 py-2 text-center shadow-xl ring-1 ring-amber-300/40">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-amber-300">Pack</p>
              <p className="chh-shimmer-gold text-[16px] font-black leading-tight">5 paires</p>
            </div>
            <div className="absolute -right-3 bottom-12 rotate-[6deg] rounded-md bg-white px-3 py-2 shadow-xl ring-1 ring-amber-300/40">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-neutral-700">Note</p>
              <p className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i}/>)}
                <span className="ml-1 text-[11px] font-black text-neutral-900">4.9</span>
              </p>
            </div>
          </div>

          <h1 className="mt-8 text-[40px] leading-[1.05] tracking-tight chh-fade-up sm:text-[58px]" style={{ animationDelay: '.1s' }}>
            <span className="chh-serif block text-neutral-900">L'allure</span>
            <span className="chh-shimmer-gold block font-black">d'un homme</span>
            <span className="chh-serif mt-1 block text-neutral-700">commence aux pieds.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-[14px] font-semibold leading-relaxed text-neutral-700 chh-fade-up sm:text-[16px]" style={{ animationDelay: '.15s' }}>
            <Gold>5 paires</Gold> assorties. Coton peigne. <Gold>Bureau, sortie, week-end</Gold>.
          </p>

          <div className="mt-8 chh-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="chh-shimmer-gold text-4xl font-black sm:text-5xl">9 900</span>
              <span className="text-lg font-bold text-neutral-800 sm:text-xl">FCFA</span>
              <span className="text-sm text-neutral-400 line-through sm:text-base">15 000 FCFA</span>
              <span className="rounded-md bg-neutral-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">-34 %</span>
            </div>
            <p className="mt-1 text-[12px] font-bold text-amber-700">🚚 Livraison gratuite Abidjan</p>

            <div className="mx-auto mt-6 max-w-sm">
              <FluidCTA onClick={() => openModal(1)}>Je commande — 9 900 F <Arrow /></FluidCTA>
            </div>
            <p className="mt-3 text-[11px] text-neutral-500">🔒 Paiement à la livraison · Sans risque</p>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:gap-4 sm:py-7">
          {[
            { n: '5 paires', l: 'Pack assorti' },
            { n: '12 500+', l: 'Hommes equipes' },
            { n: '4,9/5', l: 'Note moyenne' },
            { n: '24h', l: 'Livraison' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="chh-shimmer-gold text-[24px] font-black sm:text-[30px]">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FICHE 1 — m2 / la qualite */}
      <Fiche
        kicker="Le tissu"
        hook={<>Coton <Gold>peigne haut de gamme</Gold>. Doux comme un costume sur-mesure.</>}
        cta="Je passe commande"
        qty={1}
        onOrder={openModal}
        variant="ivory"
        media={<LazyImg src={M('m2.webp')} alt="Coton peigne haut de gamme" aspect="4/5" />}
      />

      {/* FICHE 2 — m4 / les 5 paires */}
      <Fiche
        kicker="Le pack"
        hook={<><Gold>5 paires assorties</Gold> pour traverser la semaine. Aucune repetition.</>}
        cta="Pack populaire (10 paires)"
        qty={2}
        onOrder={openModal}
        variant="noir"
        media={<LazyImg src={M('m4.webp')} alt="5 paires assorties" aspect="1/1" />}
      />

      {/* FICHE 3 — m6 / au pied */}
      <Fiche
        kicker="Au pied"
        hook={<>Effet <Gold>seconde peau</Gold>. Aucun glissement dans la chaussure.</>}
        cta="Je veux ce confort"
        qty={1}
        onOrder={openModal}
        variant="sand"
        media={<LazyImg src={M('m6.webp')} alt="Confort au pied" aspect="4/5" />}
      />

      {/* SECTION : VU DANS - presse */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-700">Vu dans</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {press.map((p) => (
              <span key={p} className="rounded-md border border-amber-200 bg-stone-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-neutral-800 shadow-sm">{p}</span>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-white shadow-xl">
            <span className="flex">{[1,2,3,4,5].map(i => <Star key={i}/>)}</span>
            <span className="text-[12px] font-black">4,9/5</span>
            <span className="text-[10px] uppercase tracking-wider text-amber-300">12 500+ avis</span>
          </div>
        </div>
      </section>

      {/* FICHE 4 — m7 / look bureau */}
      <Fiche
        kicker="Bureau"
        hook={<>L'<Gold>elegance discrete</Gold> qui en dit long sur vous.</>}
        cta="J'ajoute a ma garde-robe"
        qty={1}
        onOrder={openModal}
        variant="ivory"
        media={<LazyImg src={M('m7.webp')} alt="Look bureau" aspect="1/1" />}
      />

      {/* FICHE 5 — m8 / look sortie */}
      <Fiche
        kicker="Sortie"
        hook={<>Du <Gold>bureau</Gold> au <Gold>cocktail</Gold>, sans changer de paire.</>}
        cta="Pack 10 paires"
        qty={2}
        onOrder={openModal}
        variant="noir"
        media={<LazyImg src={M('m8.webp')} alt="Look soir" aspect="4/5" />}
      />

      {/* SECTION CARROUSEL TEMOIGNAGES */}
      <section className="bg-stone-50 py-14">
        <div className="mx-auto max-w-xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-800">Avis hommes</span>
            <h2 className="mt-3 text-2xl font-black text-neutral-900 sm:text-3xl">
              Ce qu'<Gold>ils disent</Gold>.
            </h2>
          </div>

          <div className="relative mt-7 min-h-[230px] overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-amber-200 shadow-xl">
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
                    <p className="text-[10px] font-bold text-amber-700">{r.city}</p>
                  </div>
                  <span className="flex">{Array.from({length: r.stars}).map((_, j) => <Star key={j}/>)}</span>
                </div>
                <p className="mt-3 text-[16px] font-semibold leading-relaxed text-neutral-800">"{r.txt}"</p>
                <p className="mt-3 text-right text-[10px] text-amber-600">{r.t} · ✓ Verifie</p>
              </div>
            ))}
            <div className="mt-[210px] flex justify-center gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Avis ${i + 1}`}
                  onClick={() => setCarouselIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === carouselIdx ? 'w-8 bg-amber-500' : 'w-2 bg-amber-200 hover:bg-amber-300'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-7">
            <FluidCTA onClick={() => openModal(2)}>Moi aussi je m'equipe <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* SECTION WHATSAPP CHAT */}
      <section className="bg-[#e5ddd5] py-14">
        <div className="mx-auto max-w-md px-4">
          <div className="overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-300 font-black text-neutral-950">GS</div>
              <div className="flex-1">
                <p className="text-[13px] font-black">GS · Chaussettes Homme</p>
                <p className="text-[10px] text-emerald-200">● en ligne</p>
              </div>
              <span className="text-[10px] font-bold text-white/80">Aujourd'hui</span>
            </div>
            <div className="space-y-2 bg-[#ece5dd] px-3 py-4">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-neutral-900">Konan A.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Bonjour, vos chaussettes sont impeccables. Merci 👌</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">07:14 ✓✓</p>
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
                <p className="text-[13px] text-neutral-800">Merci Konan ✦ Pack express livre 24h. Bon bureau !</p>
                <p className="mt-1 text-right text-[9px] text-neutral-500">07:16 ✓✓</p>
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-neutral-900">+225 07 •• •• 42</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Salam ! Je veux 2 packs pour mon frere et moi.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">il y a 1h ✓✓</p>
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-neutral-900">Yao M.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Tres satisfait. Tient bien la lessive. Je recommande.</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">il y a 3j ✓✓</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <FluidCTA onClick={() => openModal(2)}>Rejoindre les avis 5★ <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* FICHE 6 — m9 / look complet */}
      <Fiche
        kicker="Look complet"
        hook={<>Avec un costume, un jean ou un short. <Gold>Ca fonctionne</Gold>.</>}
        cta="Je veux ce look"
        qty={1}
        onOrder={openModal}
        variant="sand"
        media={<LazyImg src={M('m9.webp')} alt="Look complet" aspect="4/5" />}
      />

      {/* SECTION EXPERT (portrait) */}
      <section className="relative overflow-hidden bg-neutral-950 py-14 sm:py-16">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl chh-float-slow" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-yellow-300/15 blur-3xl chh-float-slow" style={{ animationDelay: '2s' }} />

        <div className="relative mx-auto grid max-w-3xl items-center gap-7 px-4 sm:grid-cols-[260px_1fr]">
          <div className="relative mx-auto h-[260px] w-[260px] overflow-hidden rounded-[28px] ring-2 ring-amber-300/40 shadow-[0_30px_70px_-20px_rgba(0,0,0,.6)]">
            <LazyImg src={M('m10.webp')} alt="Styliste expert" aspect="1/1" />
            <span className="absolute bottom-3 left-3 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-950">Styliste GS</span>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">Validee par notre expert</p>
            <h2 className="mt-3 text-balance text-2xl font-black leading-tight text-white sm:text-3xl">
              <span className="chh-shimmer-gold">"Une bonne chaussette,</span> ca change l'allure d'un homme."
            </h2>
            <p className="mt-3 text-[14px] font-semibold text-stone-300">
              Coupe haute, maintien parfait. <Gold>2 ans</Gold> de port intensif sans s'user.
            </p>
            <div className="mt-5 max-w-sm">
              <FluidCTA onClick={() => openModal(1)} dark>Suivre la routine expert <Arrow/></FluidCTA>
            </div>
          </div>
        </div>
      </section>

      {/* FICHE 7 — m11 */}
      <Fiche
        kicker="Detail luxe"
        hook={<>Coutures <Gold>renforcees</Gold>. Bord cote elastique. Finition <Gold>impeccable</Gold>.</>}
        cta="J'achete sans hesiter"
        qty={1}
        onOrder={openModal}
        variant="ivory"
        media={<LazyImg src={M('m11.webp')} alt="Detail couture luxe" aspect="1/1" />}
      />

      {/* FICHE 8 — m12 */}
      <Fiche
        kicker="Tenue jour & soir"
        hook={<>Du <Gold>matin au cocktail</Gold>, vos pieds restent frais.</>}
        cta="Pack 10 paires - le + choisi"
        qty={2}
        onOrder={openModal}
        variant="noir"
        media={<LazyImg src={M('m12.webp')} alt="Tenue jour soir" aspect="4/5" />}
      />

      {/* SECTION BUNDLES */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-800">Choisissez votre pack</span>
            <h2 className="mt-3 text-2xl font-black text-neutral-900 sm:text-3xl">
              Plus vous prenez, <Gold>plus vous economisez</Gold>.
            </h2>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { v: 1, n: '5 paires', p: 9900, old: 15000, sub: 'Decouverte', save: null },
              { v: 2, n: '10 paires', p: 16900, old: 30000, sub: 'Le + choisi', save: '-2 900 F', hot: true },
              { v: 3, n: '15 paires', p: 24900, old: 45000, sub: 'Stock pro', save: '-4 800 F' },
            ].map((b) => (
              <button
                key={b.v}
                type="button"
                onClick={() => openModal(b.v)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition hover:scale-[1.02] hover:shadow-xl ${
                  b.hot
                    ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-white to-stone-50 shadow-lg ring-2 ring-amber-300/40'
                    : 'border-neutral-200 bg-gradient-to-br from-white to-stone-50'
                }`}
              >
                {b.hot && (
                  <span className="absolute -top-1 right-4 rotate-3 rounded-b-md bg-amber-400 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-neutral-950 shadow">★ POPULAIRE</span>
                )}
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">{b.sub}</p>
                <p className="mt-1 text-xl font-black text-neutral-900">{b.n}</p>
                <p className="mt-2 chh-shimmer-gold text-2xl font-black">{b.p.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                <p className="mt-1 text-[11px] text-neutral-400 line-through">{b.old.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                {b.save && (
                  <p className="mt-2 inline-flex rounded-full bg-neutral-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300">{b.save}</p>
                )}
              </button>
            ))}
          </div>

          {/* Upsell */}
          <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-stone-50 p-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-3xl text-amber-300 shadow-lg">🎁</div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Bonus offert</p>
              <p className="text-[14px] font-black text-neutral-900">+1 pochette voyage avec le pack 15 paires</p>
              <p className="mt-1 text-[11px] text-neutral-600">Idéale pour le bureau ou les déplacements.</p>
            </div>
            <button
              type="button"
              onClick={() => openModal(3)}
              className="chh-fluid relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-neutral-950 to-neutral-800 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-amber-300 ring-2 ring-amber-300/30 shadow-lg"
            >
              <span className="chh-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
              <span className="relative">J'en profite</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION SMS NOTIFICATIONS */}
      <section className="bg-gradient-to-br from-stone-50 via-white to-amber-50/40 py-14">
        <div className="mx-auto max-w-md px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-amber-700">SMS clients reçus</p>
          <h2 className="mt-2 text-center text-2xl font-black text-neutral-900 sm:text-3xl">
            <Gold>98 %</Gold> de retours positifs.
          </h2>
          <div className="mt-7 space-y-3">
            {[
              { phone: '+225 07 •• •• 42', txt: 'Pack reçu, qualité au rendez-vous 👌', t: 'Aujourd\'hui 14:02' },
              { phone: '+225 05 •• •• 18', txt: 'Mon collègue m\'a demandé l\'adresse, top !', t: 'Hier 17:33' },
              { phone: '+225 01 •• •• 76', txt: 'Je commande à nouveau pour mes 2 frères.', t: 'Lundi 09:11' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-amber-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-amber-300 shadow ring-1 ring-amber-300/40">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm5 5a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
                    </span>
                    <p className="text-[12px] font-black text-neutral-900">{s.phone}</p>
                  </div>
                  <p className="text-[10px] text-amber-600">{s.t}</p>
                </div>
                <p className="mt-2 text-[13px] font-semibold text-neutral-800">{s.txt}</p>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <FluidCTA onClick={() => openModal(1)}>Recevoir mon pack <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* FICHE 9 — m13 */}
      <Fiche
        kicker="Cabine"
        hook={<>Le <Gold>standard hotel 5★</Gold> dans votre tiroir.</>}
        cta="J'adopte le standard"
        qty={1}
        onOrder={openModal}
        variant="ivory"
        media={<LazyImg src={M('m13.webp')} alt="Standard luxe" aspect="1/1" />}
      />

      {/* FICHE 10 — m14 */}
      <Fiche
        kicker="Detail signature"
        hook={<>Logo brode <Gold>discret</Gold>. La marque que portent les <Gold>responsables</Gold>.</>}
        cta="J'achete le luxe"
        qty={2}
        onOrder={openModal}
        variant="noir"
        media={<LazyImg src={M('m14.webp')} alt="Logo brode signature" aspect="4/5" />}
      />

      {/* GARANTIE BOX */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-7 text-white shadow-2xl ring-1 ring-amber-300/30">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">Notre engagement</p>
            <h3 className="mt-2 text-2xl font-black sm:text-3xl">
              Vous payez <Gold>uniquement à la livraison</Gold>.
            </h3>
            <ul className="mt-5 space-y-2 text-[14px]">
              {[
                'Coton peigne premium - tenue 2 ans+',
                'Livraison sous 24h Abidjan, 48h regions',
                'Paiement cash à la reception',
                'Conseiller dispo sur WhatsApp',
              ].map((x, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-neutral-950 shadow">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <FluidCTA onClick={() => openModal(1)} dark>J'achète sans risque <Arrow/></FluidCTA>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-stone-50 py-14">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-black text-neutral-900 sm:text-3xl">
            Vos <Gold>questions</Gold>.
          </h2>
          <div className="mt-7 space-y-3">
            {[
              { q: 'Quelles tailles disponibles ?', a: 'Taille universelle adulte (40-44). Le tissu s\'adapte au pied. Si besoin, contactez-nous au moment de la commande.' },
              { q: 'Quelles couleurs dans le pack ?', a: '5 couleurs distinctes : noir, gris anthracite, marine, gris perle, bordeaux. Adaptees a tous les costumes et tenues casual.' },
              { q: 'Comment laver ?', a: 'Machine à 30°C, séchage à l\'air libre. Le coton peigne tient parfaitement après 50+ lavages.' },
              { q: 'Combien de temps ça dure ?', a: 'Avec un usage quotidien, comptez 18 à 24 mois sans usure visible. Largement plus que les chaussettes classiques.' },
              { q: 'Comment je paie ?', a: 'Vous payez en CASH au livreur, après réception du colis. Zéro avance.' },
              { q: 'Livraison partout en CI ?', a: 'Oui. 24h Abidjan, 48h en régions. Livraison gratuite.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-amber-200 transition-all open:ring-amber-300">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-neutral-900 sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="h-5 w-5 text-amber-600 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-neutral-700 sm:text-[14px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOTURE FORTE — m15 */}
      <section className="relative overflow-hidden">
        <LazyImg src={M('m15.webp')} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/95 via-neutral-950/85 to-neutral-900/85" />
        <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-amber-400/30 blur-3xl chh-float-slow" />
        <div className="pointer-events-none absolute -right-16 bottom-12 h-48 w-48 rounded-full bg-yellow-300/20 blur-3xl chh-float-slow" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 mx-auto max-w-xl px-4 py-20 text-center text-white sm:py-24">
          <p className="text-[10px] font-black uppercase tracking-[0.36em] text-amber-300">Derniere ligne droite</p>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl">
            Un homme <span className="chh-shimmer-gold">se reconnaît</span> aux détails.
          </h2>
          <p className="mt-3 text-[13px] font-semibold text-stone-300 sm:text-[14px]">Compte à rebours actif · stock affiché en temps réel.</p>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-amber-300/40 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">Fin promo</span>
            <span className="font-mono text-[14px] font-black tabular-nums text-white">
              {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </span>
          </div>

          <div className="mx-auto mt-7 max-w-sm">
            <FluidCTA onClick={() => openModal(2)} dark>COMMANDE EXPRESS — 16 900 F <Arrow/></FluidCTA>
            <p className="mt-3 text-[11px] text-stone-300">Sans engagement · paiement à la réception</p>
          </div>
        </div>
      </section>

      {/* FICHE 11-13 finales pour utiliser les images restantes */}
      <Fiche
        kicker="Geste signature"
        hook={<>Le <Gold>geste pro</Gold> qui se voit jusqu'à la cheville.</>}
        cta="Sécuriser mon pack"
        qty={1}
        onOrder={openModal}
        variant="sand"
        media={<LazyImg src={M('m16.webp')} alt="Geste signature" aspect="4/5" />}
      />

      <Fiche
        kicker="Decontracte chic"
        hook={<>Avec un <Gold>jean droit</Gold> et des derbys. Look <Gold>responsable</Gold> assure.</>}
        cta="J'achete le combo"
        qty={2}
        onOrder={openModal}
        variant="ivory"
        media={<LazyImg src={M('m17.webp')} alt="Decontracte chic" aspect="1/1" />}
      />

      <Fiche
        kicker="Apres l'achat"
        hook={<>Vous portez votre <Gold>signature</Gold>. Tous les jours. <Gold>Sans effort</Gold>.</>}
        cta="Je veux ma signature"
        qty={1}
        onOrder={openModal}
        variant="noir"
        media={<LazyImg src={M('m3.webp')} alt="Signature quotidienne" aspect="1/1" />}
      />

      {/* FICHE 14 — m5 */}
      <Fiche
        kicker="Le pack famille"
        hook={<>Pour vous, votre <Gold>frere</Gold>, votre <Gold>père</Gold>. Le cadeau <Gold>impeccable</Gold>.</>}
        cta="Pack 15 paires - meilleur prix"
        qty={3}
        onOrder={openModal}
        variant="sand"
        media={<LazyImg src={M('m5.webp')} alt="Pack famille 15 paires" aspect="4/5" />}
      />

      <footer className="bg-neutral-950 py-7 pb-24 text-center text-[10px] font-semibold text-amber-300/80 sm:pb-7">
        © {new Date().getFullYear()} · Chaussettes homme luxe · Coton peigne premium · Côte d'Ivoire
      </footer>

      {/* TOAST SOCIAL PROOF (bas gauche, mobile + desktop, sauf si modal ouvert) */}
      {toast && !modal && (
        <div
          className={`fixed bottom-20 left-3 z-30 w-[88vw] max-w-[280px] sm:bottom-5 ${
            toast.visible ? 'chh-toast-in' : 'chh-toast-out'
          }`}
        >
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-300/40 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-3 py-2.5 shadow-[0_12px_30px_-6px_rgba(0,0,0,.55)]">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-neutral-950 font-black ring-2 ring-amber-200/40">
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-300/40" />
              <span className="relative text-[12px]">{toast.n.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-black text-white">
                <span className="text-amber-300">{toast.n}</span> · {toast.v}
              </p>
              <p className="mt-0.5 text-[10px] text-stone-300">
                vient de commander <span className="font-bold text-amber-200">il y a {toast.t}</span>
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">✓</span>
          </div>
        </div>
      )}

      {/* STICKY CTA BOTTOM (mobile only) — visible des l'arrivee */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-amber-300/40 bg-neutral-950/95 px-3 py-2.5 backdrop-blur-md sm:hidden ${
          modal ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100 chh-fade-up'
        } transition-all duration-300`}
        style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              Promo · {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </p>
            <p className="text-[11px] font-bold text-white">9 900 F · livraison gratuite</p>
          </div>
          <button
            type="button"
            onClick={() => openModal(1)}
            className="chh-fluid chh-fluid-pulse relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 px-5 py-2.5 text-[13px] font-black uppercase tracking-[0.18em] text-neutral-950 shadow-[0_10px_24px_-4px_rgba(212,175,55,.65)] ring-2 ring-amber-200/30"
          >
            <span className="chh-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <span className="relative">Commander ici</span>
            <Arrow />
          </button>
        </div>
      </div>

      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: 'Chaussettes Homme Luxe',
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
    </div>
  );
}
