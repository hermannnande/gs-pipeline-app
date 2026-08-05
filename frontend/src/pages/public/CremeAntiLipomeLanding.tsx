/**
 * Tunnel de vente — Crème Anti-Lipome (CREME_ANTI_LIPOME)
 * Slug: creme-anti-lipome
 *
 * Médias compressés : n1..n16.webp + w1/w2.mp4 + posters w1p/w2p.webp
 *   n1..n9   visuels produit / lifestyle
 *   n10..n16 avant/après de marque (voir scripts/download-lipome-extra-images.mjs)
 *
 * Palette : bleu profond · blanc · rouge corail (accent urgence).
 * Accordée à l'identité LipoSoin des visuels avant/après.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'creme-anti-lipome';
const PRODUCT_CODE = 'CREME_ANTI_LIPOME';
// Pixel Meta : 902265788982876 sur soindemoi.net (campagne en cours), 1857129471642967 ailleurs (obrille.com…)
const META_PIXEL_ID = typeof window !== 'undefined' && window.location.hostname.includes('soindemoi')
  ? '902265788982876'
  : '1857129471642967';
const THANK_YOU_URL = '/creme-anti-lipome/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const OLD_UNIT = 15000;
const DISCOUNT = Math.round((1 - PRICES[1] / OLD_UNIT) * 100);
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/ |,/g, ' ');
const fmtF = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
/** Prix ramené au tube — met en avant l'intérêt des packs 2 et 3. */
const perTube = (qty: number) => fmtF(Math.round(orderTotal(PRICES, qty) / qty));
const QTY_OPTS = [
  { v: 1, label: '1 tube', sub: packLabel(PRICES, 1, 'FCFA') },
  { v: 2, label: '2 tubes', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Le plus choisi', save: 'Économisez 2 900 F' },
  { v: 3, label: '3 tubes', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Meilleure offre', save: 'Économisez 4 800 F' },
];

const IMG = (n: number) => `/lipome/n${n}.webp`;
const VID = (n: number) => `/lipome/w${n}.mp4`;
const POSTER = (n: number) => `/lipome/w${n}p.webp`;
const NEWIMG = (n: number) => `/lipome/r${n}.webp`;

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

function useOnScreen(rootMargin = '280px') {
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
  const { ref, visible } = useOnScreen();
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
        <img src={src} alt={alt} loading="eager" decoding="async" fetchPriority="high" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full min-h-[240px] w-full animate-pulse bg-[#dbeafe]/80" />
      )}
    </div>
  );
}

function LazyVideo({ src, poster }: { src: string; poster?: string }) {
  const { ref, visible } = useOnScreen();
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-[#0a1e3d]" style={{ aspectRatio: '9/16' }}>
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#0f2a52]/60">
          {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" /> : null}
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#60a5fa]" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a1e3d]/90 to-transparent" />
      <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef4444] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
        </span>
        Démo réelle
      </span>
    </div>
  );
}

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const Star = () => (
  <svg className="h-3.5 w-3.5 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/** Emphase dans les titres : bleu pour la marque, rouge pour le problème / l'urgence. */
function Hot({ children, red }: { children: ReactNode; red?: boolean }) {
  return (
    <span className={red
      ? 'bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#f87171] bg-clip-text font-black text-transparent'
      : 'bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#60a5fa] bg-clip-text font-black text-transparent'
    }>
      {children}
    </span>
  );
}

/** CTA principal : dégradé bleu, reflet balayant + tremblement périodique. */
function FluidCTA({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cal-cta cal-shake group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] px-6 py-4 text-[15px] font-black text-white shadow-[0_16px_44px_-10px_rgba(37,99,235,.6)] ring-2 ring-white/30 transition hover:scale-[1.015] hover:shadow-[0_20px_50px_-8px_rgba(14,165,233,.5)] active:scale-[0.99] sm:text-[16px]"
    >
      <span className="cal-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden border-y border-[#3b82f6]/25 bg-gradient-to-r from-[#0a1e3d] via-[#1e3a8a] to-[#0a1e3d] py-2.5">
      <div className="cal-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#dbeafe] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className="text-[#f87171]">✦</span>
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
  variant?: 'light' | 'dark' | 'soft';
  shape?: 'card' | 'tilt';
};

/** Bloc image/vidéo + accroche courte + CTA. Volontairement sans paragraphe. */
function Fiche({ kicker, hook, cta, qty, onOrder, media, variant = 'light', shape = 'card' }: FicheProps) {
  const bg =
    variant === 'dark'
      ? 'bg-gradient-to-b from-[#0a1e3d] via-[#1e3a8a] to-[#0a1e3d] text-white'
      : variant === 'soft'
        ? 'bg-gradient-to-b from-[#eff6ff] via-white to-[#f1f5f9] text-[#0a1e3d]'
        : 'bg-gradient-to-b from-[#f8fafc] via-white to-[#eff6ff] text-[#0a1e3d]';

  const mediaWrap =
    shape === 'tilt'
      ? 'relative mx-auto max-w-[440px] -rotate-[1.2deg] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_-18px_rgba(37,99,235,.35)] ring-1 ring-[#3b82f6]/30'
      : 'relative mx-auto max-w-[440px] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_-18px_rgba(37,99,235,.3)] ring-1 ring-[#3b82f6]/25';

  return (
    <section className={`relative overflow-hidden py-11 sm:py-14 ${bg}`}>
      <div className="pointer-events-none absolute -left-20 top-8 h-48 w-48 rounded-full bg-[#60a5fa]/25 blur-3xl cal-float" />
      <div className="relative mx-auto max-w-xl px-4 text-center">
        {kicker && (
          <p className={`mb-2.5 text-[10px] font-black uppercase tracking-[0.28em] ${variant === 'dark' ? 'text-[#bfdbfe]' : 'text-[#2563eb]'}`}>
            {kicker}
          </p>
        )}
        <h2 className="text-balance text-[23px] font-black leading-snug sm:text-[28px]">{hook}</h2>
        <div className={`mt-6 ${mediaWrap}`}>{media}</div>
        <div className="mt-6">
          <FluidCTA onClick={() => onOrder(qty)}>{cta} <Arrow /></FluidCTA>
          <p className={`mt-2 text-[11px] font-semibold ${variant === 'dark' ? 'text-[#bfdbfe]/80' : 'text-[#64748b]'}`}>
            Paiement à la livraison · Express CI
          </p>
        </div>
      </div>
    </section>
  );
}

export default function CremeAntiLipomeLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(14);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [carouselIdx, setCarouselIdx] = useState(0);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    setQty(q || 1);
    setModal(true);
  }, []);

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = NEWIMG(1);
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

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - now.getTime());
      setCountdown({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setStock((s) => (s > 4 ? s - 1 : s)), 50000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCarouselIdx((c) => (c + 1) % 4), 5200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const stockPct = Math.round((stock / 22) * 100);

  const reviews = [
    { name: 'Aminata K.', city: 'Cocody', txt: 'Ma boule au bras a fondu en 4 semaines. Incroyable.', stars: 5 },
    { name: 'Mariam D.', city: 'Bouaké', txt: 'Peau lisse, odeur naturelle. Je recommande à 100 %.', stars: 5 },
    { name: 'Koffi E.', city: 'Yopougon', txt: 'J’avais tout essayé. Après 2 tubes, la différence est nette.', stars: 5 },
    { name: 'Fatou B.', city: 'Daloa', txt: 'Mon mari l’a remarqué avant moi. Je reprends le pack 3.', stars: 5 },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
      <style>{`
        @keyframes cal-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .cal-marquee { animation: cal-marquee 30s linear infinite }
        @keyframes cal-sheen { 0% { transform: translateX(-100%) } 55% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .cal-sheen { animation: cal-sheen 2.8s ease-in-out infinite }
        @keyframes cal-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-16px) } }
        .cal-float { animation: cal-float 8s ease-in-out infinite }
        @keyframes cal-fade-up { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        .cal-fade-up { animation: cal-fade-up .5s cubic-bezier(.22,.8,.4,1) both }
        @keyframes cal-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .cal-shine { background: linear-gradient(90deg,#b91c1c,#ef4444,#fecaca,#ef4444,#b91c1c); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation:cal-shimmer 3.2s linear infinite }
        @keyframes cal-pulse-dot { 0% { transform:scale(.95);opacity:1 } 100% { transform:scale(2);opacity:0 } }
        .cal-pulse-dot::after { content:''; position:absolute; inset:0; border-radius:9999px; background:currentColor; animation:cal-pulse-dot 1.5s cubic-bezier(0,0,.2,1) infinite }

        /* CTA qui tremble : secousse courte toutes les ~4 s.
           Uniquement des transform (composités GPU) — pas de box-shadow animée,
           qui repeindrait chaque frame sur les ~17 CTA de la page. */
        @keyframes cal-shake {
          0%, 82%, 100% { transform: translate3d(0,0,0) rotate(0deg) }
          84% { transform: translate3d(-4px,0,0) rotate(-.9deg) }
          86% { transform: translate3d(4px,0,0) rotate(.9deg) }
          88% { transform: translate3d(-3px,0,0) rotate(-.7deg) }
          90% { transform: translate3d(3px,0,0) rotate(.7deg) }
          92% { transform: translate3d(-2px,0,0) rotate(-.4deg) }
          94% { transform: translate3d(2px,0,0) rotate(.4deg) }
          96% { transform: translate3d(-1px,0,0) }
        }
        .cal-shake { animation: cal-shake 4.2s ease-in-out infinite }
        .cal-shake:hover, .cal-shake:active { animation-play-state: paused }

        @media (prefers-reduced-motion: reduce) {
          .cal-shake, .cal-sheen, .cal-float, .cal-marquee, .cal-shine { animation: none !important }
        }
      `}</style>

      {/* Sticky header */}
      <div className="sticky top-0 z-50 border-b border-[#3b82f6]/30 bg-gradient-to-r from-[#0a1e3d]/98 via-[#1e3a8a]/95 to-[#0a1e3d]/98 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-3 py-2 sm:gap-3">
          <span className="relative flex h-2 w-2 text-[#93c5fd] cal-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#93c5fd]" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#dbeafe]">
            <span className="cal-shine">Offre limitée</span> · fin à minuit
          </span>
          <div className="flex items-center gap-1">
            {[countdown.h, countdown.m, countdown.s].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[#3b82f6]">:</span>}
                <span className="inline-flex h-7 min-w-[30px] items-center justify-center rounded-md bg-[#3b82f6]/25 px-1 font-mono text-[12px] font-black tabular-nums text-white ring-1 ring-[#93c5fd]/30">
                  {pad(v)}
                </span>
              </span>
            ))}
          </div>
          <span className="rounded-full bg-[#dc2626] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
            {stock} restants
          </span>
        </div>
        <div className="h-[2px] w-full bg-[#0f2a52]">
          <div className="h-full bg-gradient-to-r from-[#dc2626] via-[#60a5fa] to-[#2563eb] transition-all duration-700" style={{ width: `${stockPct}%` }} />
        </div>
      </div>

      <Marquee items={['STOP AUX LIPOMES', 'SOIN CIBLÉ', 'RÉSULTATS VISIBLES', 'PAIEMENT À LA LIVRAISON', 'EXPRESS 24H']} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eff6ff] via-white to-[#f1f5f9] py-10 sm:py-14">
        <div className="pointer-events-none absolute -left-16 -top-12 h-64 w-64 rounded-full bg-[#60a5fa]/35 blur-3xl cal-float" />
        <div className="pointer-events-none absolute -right-12 top-20 h-48 w-48 rounded-full bg-[#f87171]/20 blur-3xl cal-float" style={{ animationDelay: '2s' }} />
        <div className="relative mx-auto max-w-xl px-4 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2563eb]/25 bg-white/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8] cal-fade-up">
            N°1 contre les lipomes en Côte d’Ivoire
          </p>

          <h1 className="mt-3 text-balance text-[34px] font-black leading-[1.04] tracking-tight text-[#0a1e3d] sm:text-[46px] cal-fade-up" style={{ animationDelay: '.04s' }}>
            <Hot red>Stop</Hot> aux <Hot>bosses</Hot><br />sous la peau.
          </h1>

          <p className="mx-auto mt-4 max-w-xs text-[15px] font-bold leading-snug text-[#334155] cal-fade-up" style={{ animationDelay: '.08s' }}>
            La bosse fond. La peau redevient lisse.
          </p>

          <div className="relative mt-7 cal-fade-up" style={{ animationDelay: '.12s' }}>
            <div className="pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#60a5fa]/40 via-white/20 to-[#f87171]/25 blur-2xl" />
            <div className="relative mx-auto max-w-[380px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_28px_70px_-20px_rgba(37,99,235,.4)] ring-1 ring-[#2563eb]/20">
              <LazyImg src={NEWIMG(1)} alt="Crème ciblée contre les lipomes" aspect="4/5" priority />
            </div>
            <div className="absolute -left-2 top-8 rotate-[-6deg] rounded-lg bg-[#0a1e3d] px-3 py-2 shadow-xl">
              <p className="text-[8px] font-black uppercase tracking-wider text-[#bfdbfe]">Premiers signes</p>
              <p className="cal-shine text-[15px] font-black">2-4 sem.</p>
            </div>
            <div className="absolute -right-2 bottom-10 rotate-[5deg] rounded-lg bg-white px-3 py-2 shadow-xl ring-1 ring-[#2563eb]/20">
              <p className="text-[8px] font-black uppercase tracking-wider text-[#1d4ed8]">4,9/5</p>
              <p className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i}/>)}</p>
            </div>
          </div>

          <div className="mt-7 cal-fade-up" style={{ animationDelay: '.16s' }}>
            <div className="flex items-baseline justify-center gap-2 sm:gap-3">
              <span className="bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] bg-clip-text text-4xl font-black text-transparent sm:text-5xl">{fmtTotal(1)}</span>
              <span className="text-base font-bold text-[#475569]">FCFA</span>
              <span className="text-sm text-[#94a3b8] line-through">{fmtF(OLD_UNIT)}</span>
              <span className="rounded-md bg-[#dc2626] px-2 py-0.5 text-[9px] font-black uppercase text-white">-{DISCOUNT}%</span>
            </div>
            <div className="mx-auto mt-5 max-w-sm">
              <FluidCTA onClick={() => openModal(1)}>Je commande — {fmtTotal(1)} F <Arrow /></FluidCTA>
            </div>
            <p className="mt-2.5 text-[11px] font-semibold text-[#64748b]">Vous payez à la réception du colis</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#2563eb]/15 bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:py-6">
          {[
            { n: '2-4 sem.', l: 'Premiers résultats' },
            { n: '4 100+', l: 'Clients satisfaits' },
            { n: '4,9/5', l: 'Note moyenne' },
            { n: '24h', l: 'Livraison Abidjan' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] bg-clip-text text-[22px] font-black text-transparent sm:text-[28px]">{s.n}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748b] sm:text-[10px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Avant/après — le plus parlant, placé tôt */}
      <Fiche
        kicker="Avant / Après"
        hook={<>Cette boule sur la main ? <Hot red>Disparue</Hot>.</>}
        cta="Je veux le même résultat"
        qty={2}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={IMG(14)} alt="Avant après : lipome sur la main" aspect="1/1" />}
      />

      <Fiche
        kicker="Regardez"
        hook={<>Elle <Hot red>fond</Hot> là où les autres <Hot>échouent</Hot>.</>}
        cta="Je veux ce résultat"
        qty={2}
        onOrder={openModal}
        variant="dark"
        media={<LazyVideo src={VID(1)} poster={POSTER(1)} />}
      />

      <Fiche
        kicker="Résultat réel"
        hook={<>Le poignet retrouve sa <Hot>ligne nette</Hot>.</>}
        cta="Commander mon tube"
        qty={1}
        onOrder={openModal}
        variant="soft"
        shape="tilt"
        media={<LazyImg src={IMG(10)} alt="Avant après : lipome au poignet" aspect="9/16" />}
      />

      <Fiche
        kicker="La formule"
        hook={<>Un soin <Hot>ciblé</Hot>. Zéro bistouri.</>}
        cta="Oui, je veux cette crème"
        qty={1}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={NEWIMG(2)} alt="Soin ciblé contre les lipomes" aspect="1/1" />}
      />

      {/* Bannière pleine largeur */}
      <section className="relative overflow-hidden">
        <LazyImg src={IMG(3)} alt="Avant après crème anti-lipome" aspect="16/10" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e3d] via-[#0a1e3d]/75 to-[#0a1e3d]/30" />
        <div className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center text-white sm:py-20">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#bfdbfe]">La promesse</p>
          <h2 className="mt-3 text-balance text-[28px] font-black leading-tight sm:text-[36px]">
            Plus jamais honte de vos <span className="cal-shine">bras</span>.
          </h2>
          <div className="mx-auto mt-6 max-w-sm">
            <FluidCTA onClick={() => openModal(1)}>Je reprends le contrôle <Arrow /></FluidCTA>
          </div>
        </div>
      </section>

      <Fiche
        kicker="Trois zones, trois fois"
        hook={<>Le même résultat, <Hot>encore et encore</Hot>.</>}
        cta="Je sécurise mon tube"
        qty={1}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={IMG(15)} alt="Trois avant après sur la main" aspect="1/1" />}
      />

      <Fiche
        kicker="Toutes les zones"
        hook={<>Bras, dos, nuque, jambes — <Hot red>partout</Hot>.</>}
        cta="Commander maintenant"
        qty={1}
        onOrder={openModal}
        variant="soft"
        shape="tilt"
        media={<LazyImg src={IMG(4)} alt="Zones du corps traitées" aspect="4/5" />}
      />

      <Fiche
        kicker="Témoignage"
        hook={<>Son front, <Hot red>4 semaines</Hot> plus tard.</>}
        cta="Je commence aujourd’hui"
        qty={2}
        onOrder={openModal}
        variant="dark"
        media={<LazyImg src={NEWIMG(3)} alt="Avant après : lipome au front" aspect="1/1" />}
      />

      <Fiche
        kicker="Le geste"
        hook={<><Hot red>30 secondes</Hot>, matin et soir. C’est tout.</>}
        cta="Pack 2 tubes — le plus choisi"
        qty={2}
        onOrder={openModal}
        variant="light"
        media={<LazyVideo src={VID(2)} poster={POSTER(2)} />}
      />

      {/* Témoignages */}
      <section className="bg-gradient-to-b from-[#eff6ff] to-white py-12">
        <div className="mx-auto max-w-xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-[#2563eb]/12 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">Avis vérifiés</span>
            <h2 className="mt-3 text-[24px] font-black text-[#0a1e3d] sm:text-3xl">Elles l’ont fait <Hot>avant vous</Hot>.</h2>
          </div>
          <div className="relative mt-6 min-h-[180px] overflow-hidden rounded-2xl bg-white p-5 shadow-lg ring-1 ring-[#2563eb]/12">
            {reviews.map((r, i) => (
              <div key={r.name} className={`absolute inset-x-5 top-5 transition-all duration-500 ${i === carouselIdx ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black text-[#1d4ed8]">{r.name}</p>
                    <p className="text-[10px] font-semibold text-[#64748b]">{r.city}</p>
                  </div>
                  <span className="flex">{Array.from({ length: r.stars }).map((_, j) => <Star key={j} />)}</span>
                </div>
                <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#0a1e3d]">« {r.txt} »</p>
                <p className="mt-2 text-right text-[10px] text-[#94a3b8]">✓ Achat vérifié</p>
              </div>
            ))}
            <div className="mt-[150px] flex justify-center gap-1.5">
              {reviews.map((_, i) => (
                <button key={i} type="button" aria-label={`Avis ${i + 1}`} onClick={() => setCarouselIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? 'w-7 bg-[#2563eb]' : 'w-1.5 bg-[#bfdbfe]'}`} />
              ))}
            </div>
          </div>
          <div className="mt-6"><FluidCTA onClick={() => openModal(2)}>Je les rejoins <Arrow /></FluidCTA></div>
        </div>
      </section>

      <Fiche
        kicker="Front dégagé"
        hook={<>La bosse au front <Hot>s’efface</Hot>.</>}
        cta="Je veux ça aussi"
        qty={2}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={NEWIMG(4)} alt="Avant après : lipome sur le front" aspect="1/1" />}
      />

      {/* WhatsApp */}
      <section className="bg-[#e8e0d5] py-12">
        <div className="mx-auto max-w-md px-4">
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2563eb] to-[#dc2626] text-sm font-black text-white">GS</div>
              <div><p className="text-[13px] font-black">Support GS · Anti-lipome</p><p className="text-[10px] text-[#bfdbfe]">● en ligne</p></div>
            </div>
            <div className="space-y-2 bg-[#ece5dd] px-3 py-4">
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-[#1d4ed8]">Aminata K.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Colis reçu ! Je commence ce soir 🙏</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">07:14 ✓✓</p>
              </div>
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
                <p className="text-[13px] text-neutral-800">Matin + soir, 30 sec de massage 💙</p>
                <p className="mt-1 text-right text-[9px] text-neutral-500">07:16 ✓✓</p>
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-[#1d4ed8]">Aminata K.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">3 semaines après… ma boule a presque disparu 😱</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">il y a 4 j ✓✓</p>
              </div>
            </div>
          </div>
          <div className="mt-5"><FluidCTA onClick={() => openModal(2)}>Commander comme Aminata <Arrow /></FluidCTA></div>
        </div>
      </section>

      <Fiche
        kicker="Il ne se cache plus"
        hook={<>Un visage <Hot>net</Hot>, sans rien à masquer.</>}
        cta="Retrouver ma peau lisse"
        qty={2}
        onOrder={openModal}
        variant="soft"
        shape="tilt"
        media={<LazyImg src={NEWIMG(5)} alt="Avant après : lipome sur le visage" aspect="1/1" />}
      />

      {/* Packs */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-[#2563eb]/12 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">Votre pack</span>
            <h2 className="mt-3 text-[24px] font-black text-[#0a1e3d] sm:text-3xl">Plus de tubes, <Hot red>moins cher</Hot>.</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { v: 1, n: '1 tube', p: orderTotal(PRICES, 1), save: null },
              { v: 2, n: '2 tubes', p: orderTotal(PRICES, 2), save: '-2 900 F', hot: true },
              { v: 3, n: '3 tubes', p: orderTotal(PRICES, 3), save: '-4 800 F' },
            ].map((b) => (
              <button key={b.v} type="button" onClick={() => openModal(b.v)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition hover:scale-[1.02] hover:shadow-lg ${
                  b.hot ? 'border-[#dc2626] bg-gradient-to-br from-[#fef2f2] to-white ring-2 ring-[#f87171]/40' : 'border-[#2563eb]/20 bg-[#f8fafc]'
                }`}>
                {b.hot && <span className="absolute -top-0.5 right-3 rounded-b-md bg-[#dc2626] px-2 py-0.5 text-[8px] font-black uppercase text-white">★ Populaire</span>}
                <p className="text-[9px] font-black uppercase tracking-wider text-[#1d4ed8]">{perTube(b.v)} F / tube</p>
                <p className="mt-1 text-lg font-black text-[#0a1e3d]">{b.n}</p>
                <p className="mt-1.5 text-2xl font-black text-[#2563eb]">{fmtF(b.p)} F</p>
                <p className="text-[11px] text-[#94a3b8] line-through">{fmtF(OLD_UNIT * b.v)} F</p>
                {b.save && <p className="mt-1.5 inline-flex rounded-full bg-[#2563eb] px-2 py-0.5 text-[8px] font-black uppercase text-white">{b.save}</p>}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#2563eb]/30 bg-[#eff6ff] p-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563eb] text-2xl text-white">🎁</div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-[#1d4ed8]">Bonus pack 3</p>
              <p className="text-[13px] font-black text-[#0a1e3d]">+1 mini-tube offert</p>
            </div>
            <button type="button" onClick={() => openModal(3)} className="shrink-0 rounded-full bg-[#2563eb] px-4 py-2 text-[11px] font-black text-white">J’en profite</button>
          </div>
        </div>
      </section>

      <Fiche
        kicker="Simple au quotidien"
        hook={<>Une peau plus lisse, <Hot>simplement</Hot>.</>}
        cta="Adopter ce soin"
        qty={1}
        onOrder={openModal}
        variant="dark"
        media={<LazyImg src={NEWIMG(6)} alt="Avant après et packaging du soin ciblé" aspect="1/1" />}
      />

      {/* Garantie */}
      <section className="bg-[#eff6ff] py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] p-6 text-white shadow-xl shadow-blue-500/25">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#dbeafe]">Zéro risque</p>
            <h3 className="mt-2 text-[22px] font-black sm:text-2xl">Vous payez <span className="cal-shine">à la livraison</span>.</h3>
            <ul className="mt-4 space-y-2 text-[13px] font-semibold">
              {['Testée dermatologiquement', 'Livraison 24h Abidjan · 48h régions', 'Cash au livreur, après vérification', 'Conseiller WhatsApp dispo'].map((x, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#1d4ed8]">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-5"><FluidCTA onClick={() => openModal(1)}>Commander sans risque <Arrow /></FluidCTA></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-[24px] font-black text-[#0a1e3d]">Questions <Hot>fréquentes</Hot></h2>
          <div className="mt-6 space-y-2">
            {[
              { q: 'En combien de temps ?', a: 'Premiers signes dès 2 semaines, résultat net entre 4 et 8 semaines.' },
              { q: 'Sur quelles zones ?', a: 'Tous les lipomes superficiels : bras, dos, nuque, mains, front. Usage externe.' },
              { q: 'C’est douloureux ?', a: 'Non. Sensation fraîche et apaisante, aucune irritation rapportée.' },
              { q: 'Comment je paie ?', a: 'En espèces au livreur, après vérification du colis. Rien à l’avance.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-xl bg-[#f8fafc] ring-1 ring-[#2563eb]/12 open:ring-[#2563eb]/30">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-[14px] font-black text-[#0a1e3d]">
                  {f.q}
                  <svg className="h-4 w-4 shrink-0 text-[#2563eb] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </summary>
                <p className="px-4 pb-4 text-[13px] leading-relaxed text-[#475569]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Clôture */}
      <section className="relative overflow-hidden">
        <LazyImg src={IMG(9)} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1e3d]/94 via-[#0f2a52]/90 to-[#0a1e3d]/92" />
        <div className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center text-white sm:py-20">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#bfdbfe]">Dernière chance</p>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl">
            Demain, elle sera <span className="cal-shine">encore là</span>.
          </h2>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-[#93c5fd]/30">
            <span className="font-mono text-sm font-black tabular-nums">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <FluidCTA onClick={() => openModal(2)}>COMMANDER — {fmtTotal(2)} F <Arrow /></FluidCTA>
            <p className="mt-2 text-[11px] font-semibold text-[#bfdbfe]/80">Paiement uniquement à la réception</p>
          </div>
        </div>
      </section>

      <footer className="bg-[#0a1e3d] py-6 text-center text-[10px] font-medium text-[#64748b]">
        © {new Date().getFullYear()} · Crème anti-lipome · Usage externe · Résultats variables selon les individus
      </footer>

      {/* Sticky mobile CTA */}
      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#3b82f6]/25 bg-[#0a1e3d]/95 px-3 py-2 backdrop-blur-md transition-all sm:hidden ${modal ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase text-[#bfdbfe]">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</p>
            <p className="text-[12px] font-black text-white">{fmtTotal(1)} F</p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="cal-shake inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] px-5 py-2.5 text-[12px] font-black text-white shadow-lg shadow-blue-500/40">
            Commander <Arrow />
          </button>
        </div>
      </div>

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
          images: { hero: NEWIMG(1), avant: IMG(4), apres: IMG(5) },
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />
    </div>
  );
}
