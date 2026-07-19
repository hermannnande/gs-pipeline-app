/**
 * Tunnel de vente — Crème Anti-Eczéma (CREME_ECZEMA)
 * Slug: creme-eczema
 *
 * Médias : n1..n3.webp + w1/w2.mp4 + posters w1p/w2p.webp
 * Palette : bleu · violet · blanc dégradé
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'creme-eczema';
const PRODUCT_CODE = 'CREME_ECZEMA';
const META_PIXEL_ID = '1857129471642967';
const THANK_YOU_URL = '/creme-eczema/merci';

const PRICES: Record<number, number> = { 1: 9500, 2: 16100, 3: 23700 };
/** Prix de reference barre : 9 500 / 14 400 = -34 %, coherent avec le badge. */
const OLD_UNIT = 14400;
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 tube', sub: packLabel(PRICES, 1, 'FCFA') },
  { v: 2, label: '2 tubes', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Le plus choisi', save: 'Économisez 2 900 F' },
  { v: 3, label: '3 tubes', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Meilleure offre', save: 'Économisez 4 800 F' },
];

const IMG = (n: number) => `/creme-eczema/n${n}.webp`;
const VID = (n: number) => `/creme-eczema/w${n}.mp4`;
const POSTER = (n: number) => `/creme-eczema/w${n}p.webp`;

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
        <div className="h-full min-h-[240px] w-full animate-pulse bg-[#ede9fe]/80" />
      )}
    </div>
  );
}

function LazyVideo({ src, poster }: { src: string; poster?: string }) {
  const { ref, visible } = useOnScreen();
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-[#1e1b4b]" style={{ aspectRatio: '9/16' }}>
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#312e81]/60">
          {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" /> : null}
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#a78bfa]" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1e1b4b]/90 to-transparent" />
      <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a78bfa] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
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
  <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

function Hot({ children, violet }: { children: ReactNode; violet?: boolean }) {
  return (
    <span className={violet
      ? 'bg-gradient-to-r from-[#a78bfa] via-[#c4b5fd] to-[#e9d5ff] bg-clip-text font-black text-transparent'
      : 'bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#60a5fa] bg-clip-text font-black text-transparent'
    }>
      {children}
    </span>
  );
}

function FluidCTA({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ce-cta group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#3b82f6] px-6 py-4 text-[15px] font-black text-white shadow-[0_16px_44px_-10px_rgba(124,58,237,.55)] ring-2 ring-white/30 transition hover:scale-[1.015] hover:shadow-[0_20px_50px_-8px_rgba(59,130,246,.45)] active:scale-[0.99] sm:text-[16px]"
    >
      <span className="ce-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden border-y border-[#7c3aed]/20 bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] py-2.5">
      <div className="ce-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#e9d5ff] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className="text-[#a78bfa]">✦</span>
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
  sub?: string;
  cta: string;
  qty?: number;
  onOrder: (q?: number) => void;
  media: ReactNode;
  variant?: 'cream' | 'forest' | 'mint';
  shape?: 'card' | 'edge' | 'tilt';
};

function Fiche({ kicker, hook, sub, cta, qty, onOrder, media, variant = 'cream', shape = 'card' }: FicheProps) {
  const bg =
    variant === 'forest'
      ? 'bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white'
      : variant === 'mint'
        ? 'bg-gradient-to-b from-[#faf5ff] via-white to-[#eff6ff] text-[#1e1b4b]'
        : 'bg-gradient-to-b from-[#f8fafc] via-white to-[#faf5ff] text-[#1e1b4b]';

  const mediaWrap =
    shape === 'edge'
      ? 'relative w-full overflow-hidden'
      : shape === 'tilt'
        ? 'relative mx-auto max-w-[440px] -rotate-[1.2deg] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_-18px_rgba(124,58,237,.3)] ring-1 ring-[#a78bfa]/25'
        : 'relative mx-auto max-w-[440px] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_-18px_rgba(124,58,237,.25)] ring-1 ring-[#7c3aed]/20';

  return (
    <section className={`relative overflow-hidden py-11 sm:py-14 ${bg}`}>
      <div className="pointer-events-none absolute -left-20 top-8 h-48 w-48 rounded-full bg-[#a78bfa]/25 blur-3xl ce-float" />
      <div className="relative mx-auto max-w-xl px-4 text-center">
        {kicker && (
          <p className={`mb-2.5 text-[10px] font-black uppercase tracking-[0.28em] ${variant === 'forest' ? 'text-[#c4b5fd]' : 'text-[#7c3aed]'}`}>
            {kicker}
          </p>
        )}
        <h2 className="text-balance text-[21px] font-black leading-snug sm:text-[25px]">{hook}</h2>
        {sub && <p className={`mx-auto mt-2.5 max-w-sm text-[13px] font-medium leading-relaxed ${variant === 'forest' ? 'text-[#e9d5ff]/90' : 'text-[#475569]'}`}>{sub}</p>}
        <div className={`mt-6 ${mediaWrap}`}>{media}</div>
        <div className="mt-6">
          <FluidCTA onClick={() => onOrder(qty)}>{cta} <Arrow /></FluidCTA>
          <p className={`mt-2 text-[11px] font-semibold ${variant === 'forest' ? 'text-[#c4b5fd]/80' : 'text-[#64748b]'}`}>
            Paiement à la livraison · Livraison express en CI
          </p>
        </div>
      </div>
    </section>
  );
}

export default function CremeEczemaLanding() {
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
    l.rel = 'preload'; l.as = 'image'; l.href = IMG(1);
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
        content_name: 'Crème Anti-Eczéma',
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
    { name: 'Adjoua M.', city: 'Cocody', txt: 'Les démangeaisons sur mes coudes ont cessé en 10 jours. Ma peau ne brûle plus la nuit — je dors enfin !', stars: 5 },
    { name: 'Seydou T.', city: 'Yopougon', txt: 'Mon fils avait l\'eczéma derrière les genoux. En 3 semaines, les plaques rouges ont presque disparu. Merci.', stars: 5 },
    { name: 'Aïcha B.', city: 'Bouaké', txt: 'Texture légère, pas grasse. J\'applique matin et soir et ma peau est enfin apaisée. Je recommande.', stars: 5 },
    { name: 'Kouamé L.', city: 'Marcory', txt: 'J\'avais tout essayé sans succès. Cette crème a calmé les irritations dès la première semaine. Livraison rapide.', stars: 5 },
  ];

  const badges = [
    { icon: '🌿', label: 'Formule douce', sub: 'Sans cortisone' },
    { icon: '💧', label: 'Hydratation 24h', sub: 'Peau nourrie' },
    { icon: '🛡️', label: 'Testée dermo', sub: 'Tolérance élevée' },
    { icon: '⚡', label: 'Action rapide', sub: 'Dès 7-10 jours' },
    { icon: '🇨🇮', label: 'Livraison CI', sub: '24-48h' },
    { icon: '✓', label: 'Paiement livraison', sub: 'Zéro risque' },
  ];

  const press = ['Santé+ Mag', 'Afrique Bien-être', 'Dermo Nature', 'BeautyPro', 'Pulse Santé'];

  return (
    <div className="min-h-screen bg-[#faf5ff]" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
      <style>{`
        @keyframes ce-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .ce-marquee { animation: ce-marquee 30s linear infinite }
        @keyframes ce-sheen { 0% { transform: translateX(-100%) } 55% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .ce-sheen { animation: ce-sheen 2.8s ease-in-out infinite }
        @keyframes ce-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-16px) } }
        .ce-float { animation: ce-float 8s ease-in-out infinite }
        @keyframes ce-fade-up { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        .ce-fade-up { animation: ce-fade-up .5s cubic-bezier(.22,.8,.4,1) both }
        @keyframes ce-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .ce-violet { background: linear-gradient(90deg,#7c3aed,#a78bfa,#e9d5ff,#a78bfa,#7c3aed); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation:ce-shimmer 3.2s linear infinite }
        @keyframes ce-pulse-dot { 0% { transform:scale(.95);opacity:1 } 100% { transform:scale(2);opacity:0 } }
        .ce-pulse-dot::after { content:''; position:absolute; inset:0; border-radius:9999px; background:currentColor; animation:ce-pulse-dot 1.5s cubic-bezier(0,0,.2,1) infinite }
        .ce-cta:hover { animation: none }
      `}</style>

      <div className="sticky top-0 z-50 border-b border-[#7c3aed]/25 bg-gradient-to-r from-[#1e1b4b]/98 via-[#312e81]/95 to-[#1e1b4b]/98 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-3 py-2 sm:gap-3">
          <span className="relative flex h-2 w-2 text-[#c4b5fd] ce-pulse-dot">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c4b5fd]" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e9d5ff]">
            <span className="ce-violet">Offre limitée</span> · fin à minuit
          </span>
          <div className="flex items-center gap-1">
            {[countdown.h, countdown.m, countdown.s].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[#a78bfa]">:</span>}
                <span className="inline-flex h-7 min-w-[30px] items-center justify-center rounded-md bg-[#7c3aed]/30 px-1 font-mono text-[12px] font-black tabular-nums text-white ring-1 ring-[#c4b5fd]/30">
                  {pad(v)}
                </span>
              </span>
            ))}
          </div>
          <span className="rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
            {stock} restants
          </span>
        </div>
        <div className="h-[2px] w-full bg-[#312e81]">
          <div className="h-full bg-gradient-to-r from-[#a78bfa] via-[#7c3aed] to-[#3b82f6] transition-all duration-700" style={{ width: `${stockPct}%` }} />
        </div>
      </div>

      <Marquee items={['CRÈME ANTI-ECZÉMA', 'APAISE LES DÉMANGEAISONS', 'FORMULE DOUCE', 'PAIEMENT À LA LIVRAISON', 'EXPRESS 24H', 'SANS RISQUE']} />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#faf5ff] via-white to-[#eff6ff] py-10 sm:py-14">
        <div className="pointer-events-none absolute -left-16 -top-12 h-64 w-64 rounded-full bg-[#a78bfa]/30 blur-3xl ce-float" />
        <div className="pointer-events-none absolute -right-12 top-20 h-48 w-48 rounded-full bg-[#60a5fa]/20 blur-3xl ce-float" style={{ animationDelay: '2s' }} />
        <div className="relative mx-auto max-w-xl px-4 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#7c3aed]/20 bg-white/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#7c3aed] ce-fade-up">
            Solution n°1 contre l'eczéma & les irritations en CI
          </p>

          <h1 className="mt-3 text-balance text-[32px] font-black leading-[1.06] tracking-tight text-[#1e1b4b] sm:text-[44px] ce-fade-up" style={{ animationDelay: '.04s' }}>
            Enfin une crème qui <Hot>calme</Hot> l'eczéma et les <Hot violet>démangeaisons</Hot>.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[14px] font-medium leading-relaxed text-[#475569] sm:text-[15px] ce-fade-up" style={{ animationDelay: '.08s' }}>
            Formule apaisante à action rapide. Application simple matin et soir. Des milliers d'Ivoiriens ont retrouvé une peau douce, hydratée et sans grattage.
          </p>

          <div className="relative mt-7 ce-fade-up" style={{ animationDelay: '.12s' }}>
            <div className="pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#a78bfa]/35 via-white/20 to-[#60a5fa]/25 blur-2xl" />
            <div className="relative mx-auto max-w-[380px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_28px_70px_-20px_rgba(124,58,237,.35)] ring-1 ring-[#7c3aed]/15">
              <LazyImg src={IMG(1)} alt="Crème anti-eczéma — formule apaisante" aspect="4/5" priority />
            </div>
            <div className="absolute -left-2 top-8 rotate-[-6deg] rounded-lg bg-[#1e1b4b] px-3 py-2 shadow-xl">
              <p className="text-[8px] font-black uppercase tracking-wider text-[#c4b5fd]">Premiers signes</p>
              <p className="ce-violet text-[15px] font-black">7-10 jours</p>
            </div>
            <div className="absolute -right-2 bottom-10 rotate-[5deg] rounded-lg bg-white px-3 py-2 shadow-xl ring-1 ring-[#7c3aed]/15">
              <p className="text-[8px] font-black uppercase tracking-wider text-[#7c3aed]">4,9/5</p>
              <p className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i}/>)}</p>
            </div>
          </div>

          <div className="mt-7 ce-fade-up" style={{ animationDelay: '.16s' }}>
            <div className="flex items-baseline justify-center gap-2 sm:gap-3">
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-4xl font-black text-transparent sm:text-5xl">{fmtTotal(1)}</span>
              <span className="text-base font-bold text-[#475569]">FCFA</span>
              <span className="text-sm text-[#94a3b8] line-through">{OLD_UNIT.toLocaleString('fr-FR').replace(/ |,/g, ' ')}</span>
              <span className="rounded-md bg-[#1e1b4b] px-2 py-0.5 text-[9px] font-black uppercase text-[#c4b5fd]">-34%</span>
            </div>
            <div className="mx-auto mt-5 max-w-sm">
              <FluidCTA onClick={() => openModal(1)}>Commander maintenant — {fmtTotal(1)} F <Arrow /></FluidCTA>
            </div>
            <p className="mt-2.5 text-[11px] text-[#64748b]">Vous ne payez qu'à la réception du colis</p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#7c3aed]/10 bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:py-6">
          {[
            { n: '7-10 j.', l: 'Apaisement visible' },
            { n: '3 800+', l: 'Clients satisfaits' },
            { n: '4,9/5', l: 'Note moyenne' },
            { n: '24h', l: 'Livraison Abidjan' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-[22px] font-black text-transparent sm:text-[28px]">{s.n}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748b] sm:text-[10px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#faf5ff] to-white py-10 sm:py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-[#7c3aed]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#7c3aed]">Pourquoi nous choisir</span>
            <h2 className="mt-3 text-2xl font-black text-[#1e1b4b] sm:text-3xl">Des <Hot>atouts</Hot> qui font la <Hot violet>différence</Hot>.</h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((b) => (
              <div key={b.label} className="rounded-2xl border border-[#7c3aed]/10 bg-white p-4 text-center shadow-sm ring-1 ring-[#a78bfa]/10 transition hover:shadow-md">
                <span className="text-2xl">{b.icon}</span>
                <p className="mt-2 text-[12px] font-black text-[#1e1b4b]">{b.label}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-[#7c3aed]">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Fiche
        kicker="Regardez par vous-même"
        hook={<>Cette crème <Hot>apaise</Hot> les démangeaisons <Hot violet>en quelques minutes</Hot>.</>}
        sub="Des milliers de personnes ont retrouvé le sommeil et le confort au quotidien."
        cta="Je veux essayer — pack 2 tubes"
        qty={2}
        onOrder={openModal}
        variant="forest"
        media={<LazyVideo src={VID(1)} poster={POSTER(1)} />}
      />

      <Fiche
        kicker="La science derrière la formule"
        hook={<>Des actifs <Hot>apaisants</Hot> qui réparent la barrière cutanée et <Hot violet>hydratent en profondeur</Hot>.</>}
        sub="Sans cortisone. Sans parabènes. Formule douce pour toute la famille."
        cta="Oui, je veux cette formule"
        qty={1}
        onOrder={openModal}
        variant="cream"
        media={<LazyImg src={IMG(2)} alt="Formule anti-eczéma apaisante" aspect="1/1" />}
      />

      <section className="relative overflow-hidden">
        <LazyImg src={IMG(3)} alt="Avant après crème anti-eczéma" aspect="16/10" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] via-[#1e1b4b]/70 to-[#1e1b4b]/25" />
        <div className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center text-white sm:py-22">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#c4b5fd]">La promesse</p>
          <h2 className="mt-3 text-balance text-[26px] font-black leading-tight sm:text-[34px]">
            Dites adieu aux <span className="ce-violet">plaques rouges</span> et au grattage nocturne.
          </h2>
          <p className="mt-3 text-[14px] font-medium text-[#e9d5ff]/95">Retrouvez une peau saine, douce et confortable — sans complexe.</p>
          <div className="mx-auto mt-6 max-w-sm">
            <FluidCTA onClick={() => openModal(1)}>Je reprends le contrôle <Arrow /></FluidCTA>
          </div>
        </div>
      </section>

      <Fiche
        kicker="Résultats réels"
        hook={<>Une peau <Hot>apaisée</Hot>, des démangeaisons <Hot violet>enfin calmées</Hot>.</>}
        sub="Regardez comment cette crème transforme le quotidien de nos clients."
        cta="Pack 2 tubes — meilleur rapport"
        qty={2}
        onOrder={openModal}
        variant="mint"
        shape="tilt"
        media={<LazyVideo src={VID(2)} poster={POSTER(2)} />}
      />

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7c3aed]">Recommandé par</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {press.map((p) => (
              <span key={p} className="rounded-lg border border-[#7c3aed]/15 bg-[#faf5ff] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#1e1b4b]">{p}</span>
            ))}
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1e1b4b] px-4 py-2 text-white">
            <span className="flex">{[1,2,3,4,5].map(i => <Star key={i}/>)}</span>
            <span className="text-[12px] font-black">4,9/5</span>
            <span className="text-[10px] text-[#c4b5fd]">· 3 800+ avis</span>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#faf5ff] to-white py-12">
        <div className="mx-auto max-w-xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-[#7c3aed]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#7c3aed]">Témoignages vérifiés</span>
            <h2 className="mt-3 text-2xl font-black text-[#1e1b4b] sm:text-3xl">Ils en parlent <Hot>mieux que nous</Hot>.</h2>
          </div>
          <div className="relative mt-6 min-h-[200px] overflow-hidden rounded-2xl bg-white p-5 shadow-lg ring-1 ring-[#7c3aed]/10">
            {reviews.map((r, i) => (
              <div key={r.name} className={`absolute inset-x-5 top-5 transition-all duration-600 ${i === carouselIdx ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black text-[#7c3aed]">{r.name}</p>
                    <p className="text-[10px] font-semibold text-[#64748b]">{r.city}</p>
                  </div>
                  <span className="flex">{Array.from({ length: r.stars }).map((_, j) => <Star key={j} />)}</span>
                </div>
                <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#1e1b4b]">« {r.txt} »</p>
                <p className="mt-2 text-right text-[10px] text-[#94a3b8]">✓ Achat vérifié</p>
              </div>
            ))}
            <div className="mt-[185px] flex justify-center gap-1.5">
              {reviews.map((_, i) => (
                <button key={i} type="button" aria-label={`Avis ${i + 1}`} onClick={() => setCarouselIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? 'w-7 bg-[#7c3aed]' : 'w-1.5 bg-[#ede9fe]'}`} />
              ))}
            </div>
          </div>
          <div className="mt-6"><FluidCTA onClick={() => openModal(2)}>Rejoindre les clients satisfaits <Arrow /></FluidCTA></div>
        </div>
      </section>

      <section className="bg-[#e8e0d5] py-12">
        <div className="mx-auto max-w-md px-4">
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] text-sm font-black text-white">GS</div>
              <div><p className="text-[13px] font-black">Support GS · Anti-eczéma</p><p className="text-[10px] text-[#c4b5fd]">● en ligne</p></div>
            </div>
            <div className="space-y-2 bg-[#ece5dd] px-3 py-4">
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-[#7c3aed]">Adjoua M.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">Bonjour, colis reçu ! Je commence ce soir 🙏</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">07:14 ✓✓</p>
              </div>
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
                <p className="text-[13px] text-neutral-800">Parfait ! Matin + soir sur les zones irritées. Photo dans 10 jours 💜</p>
                <p className="mt-1 text-right text-[9px] text-neutral-500">07:16 ✓✓</p>
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-black text-[#7c3aed]">Adjoua M.</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">10 jours après… plus de démangeaisons la nuit 😱 Merci !</p>
                <p className="mt-1 text-right text-[9px] text-neutral-400">il y a 3 j ✓✓</p>
              </div>
            </div>
          </div>
          <div className="mt-5"><FluidCTA onClick={() => openModal(2)}>Commander comme Adjoua <Arrow /></FluidCTA></div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-[#7c3aed]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#7c3aed]">Choisissez votre pack</span>
            <h2 className="mt-3 text-2xl font-black text-[#1e1b4b] sm:text-3xl">Plus vous commandez, <Hot>plus vous économisez</Hot>.</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { v: 1, n: '1 tube', p: orderTotal(PRICES, 1), old: OLD_UNIT, sub: packLabel(PRICES, 1, 'F'), save: null },
              { v: 2, n: '2 tubes', p: orderTotal(PRICES, 2), old: OLD_UNIT * 2, sub: packLabel(PRICES, 2, 'F'), save: '-2 900 F', hot: true },
              { v: 3, n: '3 tubes', p: orderTotal(PRICES, 3), old: OLD_UNIT * 3, sub: packLabel(PRICES, 3, 'F'), save: '-4 800 F' },
            ].map((b) => (
              <button key={b.v} type="button" onClick={() => openModal(b.v)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition hover:scale-[1.02] hover:shadow-lg ${
                  b.hot ? 'border-[#7c3aed] bg-gradient-to-br from-[#faf5ff] to-white ring-2 ring-[#a78bfa]/35' : 'border-[#7c3aed]/15 bg-[#faf5ff]'
                }`}>
                {b.hot && <span className="absolute -top-0.5 right-3 rounded-b-md bg-[#7c3aed] px-2 py-0.5 text-[8px] font-black uppercase text-white">★ Populaire</span>}
                <p className="text-[9px] font-black uppercase tracking-wider text-[#7c3aed]">{b.sub}</p>
                <p className="mt-1 text-lg font-black text-[#1e1b4b]">{b.n}</p>
                <p className="mt-1.5 text-2xl font-black text-[#7c3aed]">{b.p.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                <p className="text-[11px] text-[#94a3b8] line-through">{b.old.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                {b.save && <p className="mt-1.5 inline-flex rounded-full bg-[#7c3aed] px-2 py-0.5 text-[8px] font-black uppercase text-white">{b.save}</p>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#faf5ff] py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#3b82f6] p-6 text-white shadow-xl shadow-violet-500/20">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#e9d5ff]">Zéro risque pour vous</p>
            <h3 className="mt-2 text-xl font-black sm:text-2xl">Vous payez <span className="ce-violet">uniquement à la livraison</span>.</h3>
            <ul className="mt-4 space-y-2 text-[13px]">
              {['Formule testée dermatologiquement', 'Livraison 24h Abidjan · 48h régions', 'Paiement cash au livreur', 'Conseiller WhatsApp disponible'].map((x, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c4b5fd] text-[#1e1b4b]">
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

      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-black text-[#1e1b4b]">Questions <Hot>fréquentes</Hot></h2>
          <div className="mt-6 space-y-2">
            {[
              { q: 'En combien de temps les démangeaisons s\'arrêtent-elles ?', a: 'La plupart de nos clients ressentent un apaisement dès les premières applications. Les plaques rouges diminuent visiblement entre 7 et 14 jours selon la gravité.' },
              { q: 'Sur quelles zones puis-je l\'appliquer ?', a: 'Sur toutes les zones touchées par l\'eczéma : bras, jambes, cou, mains, visage (éviter le contour des yeux). Usage externe uniquement.' },
              { q: 'Est-ce adapté aux enfants ?', a: 'Oui. La formule est douce, sans cortisone ni parabènes. Convient aux peaux sensibles de toute la famille.' },
              { q: 'Comment payer ma commande ?', a: 'Vous réglez en espèces directement au livreur, après avoir vérifié votre colis. Aucun paiement en avance.' },
              { q: 'Livrez-vous partout en Côte d\'Ivoire ?', a: 'Oui. 24h à Abidjan, 48h en régions. Livraison gratuite sur tout le territoire.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-xl bg-[#faf5ff] ring-1 ring-[#7c3aed]/10 open:ring-[#7c3aed]/25">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-[14px] font-black text-[#1e1b4b]">
                  {f.q}
                  <svg className="h-4 w-4 shrink-0 text-[#7c3aed] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </summary>
                <p className="px-4 pb-4 text-[13px] leading-relaxed text-[#475569]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <LazyImg src={IMG(3)} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b]/92 via-[#312e81]/88 to-[#1e1b4b]/90" />
        <div className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center text-white sm:py-20">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#c4b5fd]">Dernière chance aujourd'hui</p>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl">
            Votre peau mérite <span className="ce-violet">cette solution</span>.
          </h2>
          <p className="mt-3 text-[13px] text-[#e9d5ff]/90">Stock limité · promo valable jusqu'à minuit.</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-[#c4b5fd]/30">
            <span className="font-mono text-sm font-black tabular-nums">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <FluidCTA onClick={() => openModal(2)}>COMMANDER — {fmtTotal(2)} F <Arrow /></FluidCTA>
            <p className="mt-2 text-[11px] text-[#c4b5fd]/80">Paiement uniquement à la réception</p>
          </div>
        </div>
      </section>

      <footer className="bg-[#1e1b4b] py-6 text-center text-[10px] font-medium text-[#64748b]">
        © {new Date().getFullYear()} · Crème anti-eczéma · Usage externe · Résultats variables selon les individus
      </footer>

      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#7c3aed]/20 bg-[#1e1b4b]/95 px-3 py-2 backdrop-blur-md transition-all sm:hidden ${modal ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase text-[#c4b5fd]">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</p>
            <p className="text-[12px] font-black text-white">{fmtTotal(1)} F</p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#3b82f6] px-5 py-2.5 text-[12px] font-black text-white shadow-lg shadow-violet-500/30">
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
          title: 'Crème Anti-Eczéma',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          slug: SLUG,
          company,
          navigate,
          images: { hero: IMG(1), avant: IMG(2), apres: IMG(3) },
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />
    </div>
  );
}
