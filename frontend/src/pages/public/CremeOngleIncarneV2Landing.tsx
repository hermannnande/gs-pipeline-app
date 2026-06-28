/**
 * Tunnel de vente — Crème Anti-Ongle Incarné (V2 / campagne dédiée)
 * Slug : creme-ongle-incarne-v2   ·   Mapping produit : CREME_ONGLE_INCARNE
 *
 * Page TOTALEMENT distincte de la page produit existante :
 *  - Palette dominante BLEU + BLANC + ROUGE (urgence) + accents cyan (produit).
 *  - Disposition "1 média = micro-texte dégradé + média + CTA fluide" (jamais 2 images côte à côte).
 *  - Vidéo hero en boucle, vidéos verticales (cadre téléphone), images compressées (webp ~50-120 Ko).
 *  - Preuve sociale complète : WhatsApp + SMS, notes étoilées, presse, toasts live, compte à rebours.
 *  - Aucune image dupliquée : chaque média n'apparaît qu'une seule fois.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'creme-ongle-incarne-v2';
const PRODUCT_CODE = 'CREME_ONGLE_INCARNE';
// Pixel Meta partagé avec patchdouleurfb et chaussette-compression-v2
// (token CAPI déjà enregistré sur Vercel via META_PIXEL_TOKENS).
const META_PIXEL_ID = '1491294965321454';
const THANK_YOU_URL = '/creme-ongle-incarne-v2/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 boite', sub: packLabel(PRICES, 1, 'F') },
  { v: 2, label: '2 boites', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + pris', save: 'Économisez 1 100 F' },
  { v: 3, label: '3 boites', sub: packLabel(PRICES, 3, 'F'), tag: 'Top offre', save: 'Économisez 6 100 F' },
];

// NB : le dossier média est volontairement nommé différemment du slug
// (`ongle-incarne-v2` ≠ `creme-ongle-incarne-v2`) pour éviter la collision
// DirectorySlash (301) au niveau de la racine web du VPS.
const M = (n: string) => `/ongle-incarne-v2/${n}`;
const MEDIA = {
  heroVideo: M('hero.mp4'),
  heroPoster: M('hero-poster.webp'),
  v2: M('v2.mp4'),
  v3: M('v3.mp4'),
  v4: M('v4.mp4'),
  i1: M('i1.webp'),
  i2: M('i2.webp'),
  i3: M('i3.webp'),
  i4: M('i4.webp'),
  i5: M('i5.webp'),
  i6: M('i6.webp'),
};

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
  src: string; alt: string; aspect?: string; priority?: boolean; className?: string; cover?: boolean;
}) {
  const { ref, visible } = useOnScreen('320px');
  const hasAspect = !!aspect;
  if (!hasAspect) {
    if (priority) {
      return (
        <div className={`overflow-hidden ${className}`}>
          {/* @ts-expect-error fetchpriority */}
          <img src={src} alt={alt} loading="eager" decoding="async" fetchpriority="high" className="block h-auto w-full" />
        </div>
      );
    }
    return (
      <div ref={ref} className={`overflow-hidden ${className}`}>
        {visible
          ? <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full" />
          : <div className="min-h-[280px] w-full animate-pulse bg-blue-50" />}
      </div>
    );
  }
  const fit = cover ? 'object-cover' : 'object-contain';
  const bg = cover ? '' : 'bg-slate-50';
  return (
    <div ref={ref} className={`overflow-hidden ${bg} ${className}`} style={{ aspectRatio: aspect }}>
      {visible
        ? <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-full w-full ${fit}`} />
        : <div className="h-full w-full animate-pulse bg-blue-50" />}
    </div>
  );
}

function LazyVideo({ src, poster, aspect = '9/16', className = '', priority = false }: {
  src: string; poster?: string; aspect?: string; className?: string; priority?: boolean;
}) {
  const { ref, visible } = useOnScreen('320px');
  if (priority) {
    return (
      <div className={`relative w-full overflow-hidden bg-slate-900 ${className}`} style={{ aspectRatio: aspect }}>
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="auto" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className={`relative w-full overflow-hidden bg-slate-900 ${className}`} style={{ aspectRatio: aspect }}>
      {visible
        ? <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
        : <div className="flex h-full w-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-sky-400" /></div>}
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

// Gradient bleu->cyan->rouge sur les mots forts
function G({ children }: { children: ReactNode }) {
  return <span className="oiv-grad bg-clip-text font-black text-transparent">{children}</span>;
}

function FluidCTA({ onClick, children, variant = 'blue' }: { onClick: () => void; children: ReactNode; variant?: 'blue' | 'red' | 'white' }) {
  const cls =
    variant === 'red'
      ? 'from-red-600 via-rose-600 to-red-700 text-white ring-white/30'
      : variant === 'white'
        ? 'from-white via-blue-50 to-white text-blue-700 ring-blue-200'
        : 'from-blue-600 via-blue-700 to-red-600 text-white ring-white/30';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`oiv-fluid oiv-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.16em] shadow-[0_18px_44px_-10px_rgba(37,99,235,.55)] ring-2 transition hover:scale-[1.02] sm:text-[15px]`}
    >
      <span className="oiv-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items, speed = 30 }: { items: string[]; speed?: number }) {
  return (
    <div className="overflow-hidden border-y border-blue-500/30 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 py-2.5">
      <div className="oiv-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.26em] text-white sm:text-[11px]" style={{ animationDuration: `${speed}s` }}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">{t}<span className="text-sky-300">✦</span></span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Cadre "téléphone" pour les vidéos verticales 9:16
function PhoneFrame({ children, glow = 'blue' }: { children: ReactNode; glow?: 'blue' | 'red' }) {
  const ring = glow === 'red' ? 'ring-red-200 shadow-[0_30px_70px_-22px_rgba(220,38,38,.45)]' : 'ring-blue-200 shadow-[0_30px_70px_-22px_rgba(37,99,235,.45)]';
  return (
    <div className={`relative mx-auto w-full max-w-[290px] overflow-hidden rounded-[2.2rem] border-4 border-slate-900 bg-slate-900 ring-2 ${ring}`}>
      <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/30" />
      {children}
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
  variant?: 'white' | 'sky' | 'dark';
  ctaVariant?: 'blue' | 'red' | 'white';
};

function Fiche({ kicker, hook, cta, qty, onOrder, media, variant = 'white', ctaVariant }: FicheProps) {
  const bg =
    variant === 'dark'
      ? 'bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white'
      : variant === 'sky'
        ? 'bg-gradient-to-b from-sky-50 via-white to-blue-50/60 text-slate-900'
        : 'bg-white text-slate-900';
  const kickerColor = variant === 'dark' ? 'text-sky-300' : 'text-blue-700';
  const subColor = variant === 'dark' ? 'text-slate-300' : 'text-slate-500';
  return (
    <section className={`relative overflow-hidden py-10 sm:py-14 ${bg}`}>
      <div className="pointer-events-none absolute -left-20 top-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl oiv-float" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-48 w-48 rounded-full bg-red-400/15 blur-3xl oiv-float" style={{ animationDelay: '2.5s' }} />
      <div className="relative mx-auto max-w-xl px-4 text-center">
        {kicker && <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.32em] ${kickerColor}`}>{kicker}</p>}
        <div className="mb-5 text-balance text-[19px] font-black leading-tight sm:text-[23px]">{hook}</div>
        {media}
        <div className="mt-6">
          <FluidCTA onClick={() => onOrder(qty)} variant={ctaVariant || (variant === 'dark' ? 'white' : 'blue')}>{cta} <Arrow /></FluidCTA>
          <p className={`mt-2.5 text-[11px] font-semibold ${subColor}`}>🔒 Paiement à la livraison · Livraison rapide</p>
        </div>
      </div>
    </section>
  );
}

export default function CremeOngleIncarneV2Landing() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(17);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [toast, setToast] = useState<{ n: string; v: string; act: string; visible: boolean } | null>(null);

  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const TOASTS = useMemo(() => [
    { n: 'Konan',    v: 'Cocody',      act: 'vient de commander 2 tubes' },
    { n: 'Awa',      v: 'Yopougon',    act: 'consulte cette offre' },
    { n: 'Ibrahim',  v: 'Bouaké',      act: 'a laissé un avis 5 étoiles' },
    { n: 'Marie',    v: 'Abobo',       act: 'vient de commander 1 tube' },
    { n: 'Yao',      v: 'Daloa',       act: 'consulte cette offre' },
    { n: 'Fatou',    v: 'Marcory',     act: 'vient de commander 3 tubes' },
    { n: 'Serge',    v: 'Treichville', act: 'a reçu sa commande aujourd\'hui' },
    { n: 'Aminata',  v: 'San-Pédro',   act: 'vient de commander 2 tubes' },
  ], []);

  const openModal = useCallback((q?: number) => { setQty(q || 1); setModal(true); }, []);

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = MEDIA.heroPoster;
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
        content_name: 'Crème Anti-Ongle Incarné',
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
    const id = setInterval(() => setStock((s) => (s > 6 ? s - 1 : s)), 45000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setGalleryIdx((c) => (c + 1) % 3), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setReviewIdx((c) => (c + 1) % 4), 5500);
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

  const galleryImgs = [MEDIA.i3, MEDIA.i4, MEDIA.i5];
  const press = ['Santé+ Mag', 'BeautéCI', 'Le Quotidien Bien-être', 'Afrik Wellness', 'Conso Santé'];
  const waReviews = [
    { name: 'Konan', city: 'Cocody', txt: 'Mon ongle me faisait souffrir depuis des mois. En 1 semaine, la douleur a beaucoup baissé.', t: '08:51' },
    { name: 'Awa', city: 'Yopougon', txt: 'J\'avais peur de la chirurgie. La crème a vraiment aidé, je remarche normalement.', t: '12:07' },
    { name: 'Serge', city: 'Marcory', txt: 'Reçu hier, payé à la livraison. Application simple, soulagement rapide. Merci !', t: '17:32' },
  ];
  const smsReviews = [
    { from: 'Ibrahim', txt: 'Bonjour, j\'ai reçu le colis et payé au livreur. Déjà 3 jours, c\'est moins gonflé 👍', t: '09:14' },
    { from: 'Marie', txt: 'Le tube marche bien, ma sœur en veut aussi. Vous livrez à Abobo ?', t: '15:48' },
  ];
  const reviews = [
    { name: 'Konan', city: 'Cocody', txt: 'Douleur nettement réduite en quelques jours. Je recommande à 100 %.', stars: 5, t: '08:51' },
    { name: 'Awa', city: 'Yopougon', txt: 'Enfin une solution sans bistouri. Application facile, résultat visible.', stars: 5, t: '12:07' },
    { name: 'Yao', city: 'Daloa', txt: 'Livraison rapide, paiement à la réception. Sérieux et efficace.', stars: 5, t: '14:22' },
    { name: 'Fatou', city: 'Marcory', txt: 'Mon orteil était rouge et gonflé. Beaucoup mieux maintenant.', stars: 5, t: '18:09' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
      <style>{`
        .oiv-grad { background-image: linear-gradient(90deg,#2563eb,#0ea5e9,#dc2626); }
        @keyframes oiv-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .oiv-marquee { animation: oiv-marquee 30s linear infinite }
        @keyframes oiv-sheen { 0% { transform: translateX(-100%) } 60% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .oiv-sheen { animation: oiv-sheen 2.8s ease-in-out infinite }
        @keyframes oiv-float { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-22px) translateX(14px) } }
        .oiv-float { animation: oiv-float 9s ease-in-out infinite }
        @keyframes oiv-pulse {
          0%,100% { box-shadow: 0 18px 44px -10px rgba(37,99,235,.55); transform: translateY(0) }
          50% { box-shadow: 0 26px 60px -8px rgba(37,99,235,.78); transform: translateY(-2px) }
        }
        .oiv-pulse { animation: oiv-pulse 2.4s ease-in-out infinite }
        .oiv-fluid:hover { animation: none !important }
        @keyframes oiv-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        .oiv-bob { animation: oiv-bob 5s ease-in-out infinite }
        @keyframes oiv-fade-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .oiv-fade-up { animation: oiv-fade-up .55s cubic-bezier(.22,.8,.4,1) both }
        @keyframes oiv-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .oiv-shimmer {
          background: linear-gradient(90deg,#1d4ed8,#3b82f6,#0ea5e9,#ef4444,#1d4ed8);
          background-size: 200% auto; background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent; animation: oiv-shimmer 3.5s linear infinite;
        }
        @keyframes oiv-dot { 0% { transform: scale(.95); opacity: 1 } 100% { transform: scale(2); opacity: 0 } }
        .oiv-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: oiv-dot 1.6s cubic-bezier(0,0,.2,1) infinite }
        @keyframes oiv-in { from { opacity: 0; transform: translateX(-110%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes oiv-out { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-110%) } }
        .oiv-toast-in { animation: oiv-in .45s cubic-bezier(.22,1,.36,1) both }
        .oiv-toast-out { animation: oiv-out .4s cubic-bezier(.55,.08,.68,.53) both }
      `}</style>

      {/* STICKY COUNTDOWN */}
      <div className="sticky top-0 z-50 border-b border-blue-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-3 py-2 sm:gap-4">
          <span className="relative flex h-2 w-2 text-red-500 oiv-dot"><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-800">
            <span className="oiv-shimmer">Offre limitée</span> · clôture minuit
          </span>
          <div className="flex items-center gap-1">
            {[countdown.h, countdown.m, countdown.s].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-blue-400">:</span>}
                <span className="inline-flex h-7 min-w-[32px] items-center justify-center rounded-md bg-blue-50 px-1.5 font-mono text-[13px] font-black tabular-nums text-blue-700 ring-1 ring-blue-200">{pad(v)}</span>
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">🔥 Stock {stock}</span>
        </div>
        <div className="h-[3px] w-full bg-blue-50">
          <div className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-red-600 transition-all duration-700" style={{ width: `${stockPct}%` }} />
        </div>
      </div>

      <Marquee items={['SOIN ONGLE INCARNÉ', 'SANS CHIRURGIE', 'SOULAGEMENT RAPIDE', 'PAIEMENT À LA LIVRAISON', '24H ABIDJAN', 'STOCK LIMITÉ']} />

      {/* HERO — vidéo en boucle */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50/50 to-white py-6 sm:py-10">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl oiv-float" />
        <div className="pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full bg-red-300/20 blur-3xl oiv-float" style={{ animationDelay: '3s' }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-blue-800 backdrop-blur oiv-fade-up">
            <span className="h-1 w-1 rounded-full bg-red-500" /> Solution N°1 en Côte d'Ivoire <span className="h-1 w-1 rounded-full bg-red-500" />
          </p>

          <h1 className="mt-5 text-balance text-[30px] font-black leading-[1.05] tracking-tight sm:text-[44px] oiv-fade-up" style={{ animationDelay: '.05s' }}>
            Stop à la <G>douleur</G> de l'<G>ongle incarné</G>.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[13px] font-semibold text-slate-600 sm:text-[15px] oiv-fade-up" style={{ animationDelay: '.1s' }}>
            Une crème qui <G>soulage</G> et aide à <G>traiter</G> — sans bistouri.
          </p>

          <div className="relative mt-6 oiv-fade-up" style={{ animationDelay: '.15s' }}>
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-blue-300/40 via-sky-200/30 to-red-300/30 blur-3xl" />
            <div className="relative oiv-bob">
              <PhoneFrame>
                <LazyVideo src={MEDIA.heroVideo} poster={MEDIA.heroPoster} aspect="9/16" priority />
              </PhoneFrame>
            </div>
            <div className="absolute left-1 top-8 rotate-[-7deg] rounded-md bg-blue-700 px-3 py-2 text-center shadow-xl sm:left-10">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-sky-200">Soin</p>
              <p className="oiv-shimmer text-[16px] font-black leading-tight">Pro</p>
            </div>
            <div className="absolute right-1 bottom-10 rotate-[6deg] rounded-md bg-white px-3 py-2 shadow-xl ring-1 ring-blue-200 sm:right-10">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-600">Note</p>
              <p className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i}/>)}<span className="ml-1 text-[11px] font-black">4.9</span></p>
            </div>
          </div>

          <div className="mt-7 oiv-fade-up" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-3">
              <span className="oiv-shimmer text-4xl font-black sm:text-5xl">{fmtTotal(1)}</span>
              <span className="text-lg font-bold text-slate-800 sm:text-xl">FCFA</span>
              <span className="text-sm text-slate-400 line-through sm:text-base">15 000 F</span>
              <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">-53 %</span>
            </div>
            <div className="mx-auto mt-4 max-w-sm">
              <FluidCTA onClick={() => openModal(1)}>Commander maintenant <Arrow /></FluidCTA>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">🔒 Paiement à la livraison · Sans risque</p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-blue-100 bg-blue-50/40">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:gap-4 sm:py-7">
          {[
            { n: '4,9/5', l: 'Note clients' },
            { n: '3 100+', l: 'Clients soulagés' },
            { n: '7 j', l: 'Premiers effets' },
            { n: '24h', l: 'Livraison Abidjan' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="oiv-shimmer text-[24px] font-black sm:text-[30px]">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 sm:text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLÈME (i1) */}
      <section className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-red-600">Le problème</p>
          <h2 className="mt-3 text-balance text-[24px] font-black leading-tight sm:text-[30px]">
            Chaque pas vous fait <G>mal</G> ?
          </h2>
          <ul className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2 text-left text-[13px] font-bold text-slate-800 sm:text-[14px]">
            {['Orteil rouge et gonflé', 'Douleur en marchant', 'Risque d\'infection', 'Peur de la chirurgie'].map((x, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-blue-100">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </span>{x}
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-6 max-w-[420px] overflow-hidden rounded-[2rem] ring-1 ring-blue-200 shadow-xl">
            <LazyImg src={MEDIA.i1} alt="Ongle incarné douloureux et gonflé" />
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <FluidCTA onClick={() => openModal(1)} variant="red">Je veux être soulagé <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* PRESSE — Ils en parlent */}
      <section className="bg-white py-9">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-700">Ils en parlent</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {press.map((p) => (
              <span key={p} className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 shadow-sm">{p}</span>
            ))}
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white shadow-xl">
            <span className="flex">{[1,2,3,4,5].map(i => <Star key={i}/>)}</span>
            <span className="text-[12px] font-black">4,9/5</span>
            <span className="text-[10px] uppercase tracking-wider text-sky-300">3 100+ avis</span>
          </div>
        </div>
      </section>

      {/* SOLUTION (i2) */}
      <section className="bg-gradient-to-b from-sky-50 via-white to-white py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-700">La solution</p>
          <h2 className="mt-3 text-balance text-[24px] font-black leading-tight sm:text-[30px]">
            La crème qui <G>cible la racine</G> du problème.
          </h2>
          <div className="mx-auto mt-6 max-w-[420px] overflow-hidden rounded-[2rem] ring-1 ring-blue-200 shadow-xl">
            <LazyImg src={MEDIA.i2} alt="Crème anti-ongle incarné premium" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { ico: '✦', t: 'Soulage la douleur' },
              { ico: '◆', t: 'Réduit le gonflement' },
              { ico: '✧', t: 'Aide à assainir' },
              { ico: '◈', t: 'Assouplit l\'ongle' },
              { ico: '☀', t: 'Sans chirurgie' },
              { ico: '✿', t: 'Application simple' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-blue-100 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-lg text-white shadow">{b.ico}</span>
                <span className="text-left text-[13px] font-black">{b.t}</span>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-7 max-w-sm">
            <FluidCTA onClick={() => openModal(1)}>Je commande ma crème <Arrow/></FluidCTA>
          </div>
        </div>
      </section>

      {/* FICHE VIDÉO v2 */}
      <Fiche
        kicker="En vidéo"
        hook={<>Voyez le <G>geste simple</G> qui change tout.</>}
        cta="Je veux ce résultat"
        qty={1}
        onOrder={openModal}
        variant="sky"
        media={<div className="oiv-bob"><PhoneFrame><LazyVideo src={MEDIA.v2} aspect="9/16" /></PhoneFrame></div>}
      />

      {/* AVIS WHATSAPP */}
      <section className="bg-[#e5ddd5] py-12 sm:py-14">
        <div className="mx-auto max-w-md px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-blue-800">Avis vérifiés WhatsApp</p>
          <h2 className="mt-2 text-center text-balance text-[22px] font-black leading-tight sm:text-[26px]">Ce qu'<G>ils disent</G>.</h2>
          <div className="mt-5 overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-500 font-black">GS</div>
              <div className="flex-1">
                <p className="text-[13px] font-black">GS · Crème ongle incarné</p>
                <p className="text-[10px] text-emerald-200">● en ligne</p>
              </div>
              <span className="text-[10px] font-bold text-white/80">Aujourd`hui</span>
            </div>
            <div className="space-y-2 bg-[#ece5dd] px-3 py-4">
              {waReviews.map((r, i) => (
                <div key={i} className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] font-black text-blue-700">{r.name} · {r.city}</p>
                  <p className="mt-0.5 text-[13px] text-slate-800">"{r.txt}"</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="flex">{[1,2,3,4,5].map(j => <Star key={j}/>)}</span>
                    <p className="text-[9px] text-slate-400">{r.t} ✓✓</p>
                  </div>
                </div>
              ))}
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
                <p className="text-[13px] text-slate-800">Merci pour vos retours ❤️ Appliquez matin et soir pour un soulagement optimal.</p>
                <p className="mt-1 text-right text-[9px] text-slate-500">10:42 ✓✓</p>
              </div>
            </div>
          </div>
          <div className="mt-6"><FluidCTA onClick={() => openModal(1)}>Moi aussi je commande <Arrow/></FluidCTA></div>
        </div>
      </section>

      {/* PORTFOLIO / CARROUSEL (i3,i4,i5) */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-blue-700">Portfolio résultats</p>
          <h2 className="mt-3 text-center text-balance text-[22px] font-black leading-tight sm:text-[28px]">
            Des résultats qui <G>parlent</G>.
          </h2>
          <div className="relative mt-6 overflow-hidden rounded-[2rem] bg-slate-50 shadow-xl ring-1 ring-blue-200">
            <div className="relative aspect-[4/5] sm:aspect-[16/12]">
              {galleryImgs.map((img, i) => (
                <div key={img} className={`absolute inset-0 transition-opacity duration-700 ${i === galleryIdx ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={img} alt={`Résultat ${i + 1}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                </div>
              ))}
              <button type="button" aria-label="Précédent" onClick={() => setGalleryIdx((c) => (c - 1 + galleryImgs.length) % galleryImgs.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-blue-700 shadow-lg ring-1 ring-blue-200 transition hover:bg-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button type="button" aria-label="Suivant" onClick={() => setGalleryIdx((c) => (c + 1) % galleryImgs.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-blue-700 shadow-lg ring-1 ring-blue-200 transition hover:bg-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
            <div className="flex justify-center gap-2 py-3">
              {galleryImgs.map((_, i) => (
                <button key={i} type="button" aria-label={`Image ${i + 1}`} onClick={() => setGalleryIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === galleryIdx ? 'w-8 bg-blue-600' : 'w-2 bg-blue-200 hover:bg-blue-300'}`} />
              ))}
            </div>
          </div>
          <div className="mt-6"><FluidCTA onClick={() => openModal(2)} variant="red">Réserver mon pack <Arrow/></FluidCTA></div>
        </div>
      </section>

      {/* FICHE VIDÉO v3 (dark) */}
      <Fiche
        kicker="Démonstration"
        hook={<>Un soin <G>discret</G>, des effets <G>concrets</G>.</>}
        cta="J'en profite aujourd'hui"
        qty={2}
        onOrder={openModal}
        variant="dark"
        media={<div className="oiv-bob"><PhoneFrame glow="red"><LazyVideo src={MEDIA.v3} aspect="9/16" /></PhoneFrame></div>}
      />

      {/* AVIS SMS */}
      <section className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-md px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-blue-700">Messages clients (SMS)</p>
          <h2 className="mt-2 text-center text-balance text-[22px] font-black leading-tight sm:text-[26px]">Reçus, payés, <G>soulagés</G>.</h2>
          <div className="mt-5 space-y-3">
            {smsReviews.map((s, i) => (
              <div key={i} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-blue-700">{s.from}</span>
                  <span className="text-[9px] text-slate-400">SMS · {s.t}</span>
                </div>
                <div className="mt-1 max-w-[88%] rounded-2xl rounded-tl-sm bg-blue-600 px-3 py-2 text-[13px] text-white shadow">{s.txt}</div>
              </div>
            ))}
          </div>
          <div className="mt-6"><FluidCTA onClick={() => openModal(1)}>Commander comme eux <Arrow/></FluidCTA></div>
        </div>
      </section>

      {/* MODE D'EMPLOI */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.32em] text-blue-700">Mode d'emploi</p>
          <h2 className="mt-3 text-center text-balance text-[22px] font-black leading-tight sm:text-[28px]">Simple en <G>3 gestes</G>.</h2>
          <ol className="mt-6 space-y-3">
            {[
              { n: '1', t: 'Nettoyez le pied', d: 'Lavez et séchez bien l\'orteil concerné.' },
              { n: '2', t: 'Appliquez la crème', d: 'Une noisette sur la zone de l\'ongle incarné.' },
              { n: '3', t: 'Matin & soir', d: 'Répétez chaque jour jusqu\'au soulagement.' },
            ].map((s) => (
              <li key={s.n} className="flex gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-blue-100 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-[14px] font-black text-white shadow">{s.n}</div>
                <div className="flex-1 leading-tight">
                  <p className="text-[14px] font-black">{s.t}</p>
                  <p className="mt-0.5 text-[12px] text-slate-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6"><FluidCTA onClick={() => openModal(1)}>Je commence aujourd'hui <Arrow/></FluidCTA></div>
        </div>
      </section>

      {/* FICHE VIDÉO v4 */}
      <Fiche
        kicker="Avant / Après"
        hook={<>Retrouvez des pieds <G>sains</G> et <G>sans douleur</G>.</>}
        cta="Pack famille (3 tubes)"
        qty={3}
        onOrder={openModal}
        variant="sky"
        media={<div className="oiv-bob"><PhoneFrame><LazyVideo src={MEDIA.v4} aspect="9/16" /></PhoneFrame></div>}
      />

      {/* EXPERT / RASSURANCE */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4">
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-white p-6 ring-1 ring-blue-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-2xl text-white shadow">🩺</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Avis d'expert</p>
                <p className="text-[15px] font-black">Pourquoi agir tôt ?</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] font-semibold leading-relaxed text-slate-700 sm:text-[14px]">
              Un ongle incarné non traité peut <G>s'infecter</G> et empirer. Un soin <G>ciblé</G> et régulier aide à calmer la douleur et à éviter d'en arriver à la chirurgie.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-[12px] font-bold text-slate-800 sm:text-[13px]">
              {['Geste préventif', 'Application facile', 'Usage quotidien', 'Soin à la maison'].map((x, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl bg-white p-3 ring-1 ring-blue-100">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></span>{x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* BUNDLES + UPSELL */}
      <section className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Offre spéciale</span>
            <h2 className="mt-3 text-balance text-[22px] font-black leading-tight sm:text-[28px]">Plus vous prenez, <G>plus vous économisez</G>.</h2>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { v: 1, n: '1 boite', p: orderTotal(PRICES, 1), old: 15000, sub: packLabel(PRICES, 1, 'F'), save: null as string | null },
              { v: 2, n: '2 boites', p: orderTotal(PRICES, 2), old: 30000, sub: packLabel(PRICES, 2, 'F'), save: '-17 100 F', hot: true },
              { v: 3, n: '3 boites', p: orderTotal(PRICES, 3), old: 45000, sub: packLabel(PRICES, 3, 'F'), save: '-30 100 F' },
            ].map((b) => (
              <button key={b.v} type="button" onClick={() => openModal(b.v)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition hover:scale-[1.02] hover:shadow-xl ${b.hot ? 'border-red-500 bg-gradient-to-br from-blue-50 via-white to-red-50 shadow-lg ring-2 ring-red-300/40' : 'border-blue-200 bg-gradient-to-br from-white to-slate-50'}`}>
                {b.hot && <span className="absolute -top-1 right-4 rotate-3 rounded-b-md bg-red-600 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow">★ POPULAIRE</span>}
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">{b.sub}</p>
                <p className="mt-1 text-xl font-black">{b.n}</p>
                <p className="mt-2 oiv-shimmer text-2xl font-black">{b.p.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                <p className="mt-1 text-[11px] text-slate-400 line-through">{b.old.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                {b.save && <p className="mt-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">{b.save}</p>}
              </button>
            ))}
          </div>
          {/* Upsell bonus */}
          <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-white p-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-3xl text-white shadow-lg">🎁</div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Bonus offert</p>
              <p className="text-[14px] font-black">+ Guide soin des pieds OFFERT avec le pack 3 tubes</p>
              <p className="mt-1 text-[11px] text-slate-600">Conseils anti-récidive, à garder chez vous.</p>
            </div>
            <button type="button" onClick={() => openModal(3)}
              className="oiv-fluid relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-red-600 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-white shadow-lg ring-2 ring-white/20">
              <span className="oiv-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              <span className="relative">J'en profite</span>
            </button>
          </div>
        </div>
      </section>

      {/* GARANTIE */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-7 text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-300">Notre engagement</p>
            <h3 className="mt-2 text-balance text-[22px] font-black leading-tight sm:text-[28px]">Vous payez <span className="oiv-shimmer">à la livraison</span>.</h3>
            <ul className="mt-5 space-y-2 text-[14px]">
              {['Paiement à la livraison · 100 % sans risque','Livraison rapide à Abidjan, 24-48 h','Commande simple en 30 secondes','Support WhatsApp disponible','Offre spéciale aujourd\'hui'].map((x, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-blue-700 shadow"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></span>{x}
                </li>
              ))}
            </ul>
            <div className="mt-6"><FluidCTA onClick={() => openModal(1)} variant="white">J'achète sans risque <Arrow/></FluidCTA></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-balance text-[22px] font-black leading-tight sm:text-[28px]">Vos <G>questions</G>.</h2>
          <div className="mt-6 space-y-3">
            {[
              { q: 'En combien de temps voit-on un résultat ?', a: 'Beaucoup de clients ressentent un soulagement dès les premiers jours. Pour un résultat optimal, utilisez la crème matin et soir de façon régulière.' },
              { q: 'Faut-il une ordonnance ?', a: 'Non. La crème s\'utilise à la maison. En cas d\'infection sévère, consultez un professionnel de santé.' },
              { q: 'Comment je paie ?', a: 'Vous payez en CASH au livreur, après réception du colis. Aucune avance.' },
              { q: 'Livraison partout en CI ?', a: 'Oui. 24h à Abidjan, 48h en régions. Livraison gratuite à Abidjan.' },
              { q: 'Stock encore disponible ?', a: 'Stock limité aujourd\'hui. La promo se termine à minuit. Réservez votre tube dès maintenant.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-blue-100 transition-all open:ring-blue-300">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black sm:text-[15px]">
                  <span>{f.q}</span>
                  <svg className="h-5 w-5 text-blue-600 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOTURE FORTE (i6 bg) */}
      <section className="relative overflow-hidden">
        <LazyImg src={MEDIA.i6} alt="" className="absolute inset-0 h-full w-full" cover />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-red-950/85" />
        <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-sky-400/30 blur-3xl oiv-float" />
        <div className="pointer-events-none absolute -right-16 bottom-12 h-48 w-48 rounded-full bg-red-400/20 blur-3xl oiv-float" style={{ animationDelay: '2s' }} />
        <div className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center text-white sm:py-20">
          <p className="text-[10px] font-black uppercase tracking-[0.36em] text-sky-300">Dernière ligne droite</p>
          <h2 className="mt-3 text-balance text-[26px] font-black leading-tight sm:text-[34px]">
            Vos pieds méritent d`être <span className="oiv-shimmer">soulagés</span>.
          </h2>
          <p className="mt-3 text-[13px] font-semibold text-sky-100/95 sm:text-[14px]">Compte à rebours actif · stock affiché en temps réel.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-sky-300/40 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-200">Fin promo</span>
            <span className="font-mono text-[14px] font-black tabular-nums">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>
          </div>
          <div className="mx-auto mt-7 max-w-sm">
            <FluidCTA onClick={() => openModal(2)} variant="red">COMMANDE EXPRESS — {fmtTotal(2)} F <Arrow/></FluidCTA>
            <p className="mt-3 text-[11px] text-sky-200">Sans engagement · paiement à la réception</p>
          </div>
        </div>
      </section>

      {/* CARROUSEL AVIS (texte) */}
      <section className="bg-blue-50/40 py-12 sm:py-14">
        <div className="mx-auto max-w-xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Témoignages clients</span>
            <h2 className="mt-3 text-balance text-[22px] font-black leading-tight sm:text-[28px]"><G>4,9/5</G> · des centaines de retours</h2>
          </div>
          <div className="relative mt-6 min-h-[210px] overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-blue-200 shadow-xl">
            {reviews.map((r, i) => (
              <div key={r.name} className={`absolute inset-x-6 top-6 transition-all duration-700 ${i === reviewIdx ? 'z-10 translate-y-0 opacity-100' : 'pointer-events-none z-0 translate-y-3 opacity-0'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-wider">{r.name}</p>
                    <p className="text-[10px] font-bold text-blue-700">{r.city}</p>
                  </div>
                  <span className="flex">{Array.from({length: r.stars}).map((_, j) => <Star key={j}/>)}</span>
                </div>
                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-slate-800">"{r.txt}"</p>
                <p className="mt-3 text-right text-[10px] text-blue-600">{r.t} · ✓ Vérifié</p>
              </div>
            ))}
            <div className="mt-[190px] flex justify-center gap-2">
              {reviews.map((_, i) => (
                <button key={i} type="button" aria-label={`Avis ${i + 1}`} onClick={() => setReviewIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === reviewIdx ? 'w-8 bg-blue-600' : 'w-2 bg-blue-200 hover:bg-blue-300'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 py-7 pb-24 text-center text-[10px] font-semibold text-sky-300/70 sm:pb-7">
        © {new Date().getFullYear()} · Crème Anti-Ongle Incarné · Soin premium · Côte d'Ivoire
      </footer>

      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: 'Crème Anti-Ongle Incarné',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          slug: SLUG,
          company,
          navigate,
          images: { hero: MEDIA.heroPoster },
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />

      {/* TOAST SOCIAL PROOF */}
      {toast && !modal && (
        <div className={`fixed bottom-20 left-3 z-30 w-[88vw] max-w-[300px] sm:bottom-5 ${toast.visible ? 'oiv-toast-in' : 'oiv-toast-out'}`}>
          <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-white px-3 py-2.5 shadow-[0_12px_30px_-6px_rgba(37,99,235,.28)]">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-sky-500 to-blue-600 text-white font-black ring-2 ring-blue-100">
              <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/50" />
              <span className="relative text-[12px]">{toast.n[0]}</span>
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-black"><span className="text-blue-700">{toast.n}</span> · {toast.v}</p>
              <p className="mt-0.5 text-[10px] text-slate-600">{toast.act}</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">✓</span>
          </div>
        </div>
      )}

      {/* STICKY CTA BOTTOM mobile */}
      <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-blue-200 bg-white/97 px-3 py-2.5 backdrop-blur-md sm:hidden ${modal ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100 oiv-fade-up'} transition-all duration-300`}
        style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-3">
          <div className="pointer-events-none flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-red-600">Promo · {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</p>
            <p className="text-[11px] font-bold text-slate-800">{fmtTotal(1)} F</p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="pointer-events-auto oiv-fluid oiv-pulse relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-red-600 px-5 py-2.5 text-[13px] font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_-4px_rgba(37,99,235,.55)] ring-2 ring-white/30">
            <span className="oiv-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <span className="relative">Commander</span><Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}
