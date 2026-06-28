/**
 * Tunnel premium — Crème Minceur Brûle Graisse (crememinceurfb).
 * Slug : crememinceurfb · Produit : CREME_MINCEUR
 *
 * Palette : ROSE + NOIR + BLANC + JAUNE + accents corail/menthe.
 * 1 média = micro-texte dégradé + CTA lumineux. Aucune image dupliquée.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'crememinceurfb';
const PRODUCT_CODE = 'CREME_MINCEUR';
const META_PIXEL_ID = '1491294965321454';
const META_PIXEL_ID_2 = '1313100454309806';
const META_PIXEL_IDS = [META_PIXEL_ID, META_PIXEL_ID_2];
const THANK_YOU_URL = '/crememinceurfb/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 pot', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 pots', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + pris', save: 'Économisez 3 000 F' },
  { v: 3, label: '3 pots', sub: packLabel(PRICES, 3, 'F'), tag: 'Ultra pack', save: 'Économisez 5 100 F' },
];

const M = (n: string) => `/creme-minceur-fb/${n}`;
const MEDIA = {
  heroVideo: M('hero.mp4'),
  heroPoster: M('hero-poster.webp'),
  v1: M('v1.mp4'),
  v2: M('v2.mp4'),
  v3: M('v3.mp4'),
  v4: M('v4.mp4'),
  i1: M('i1.webp'),
  i2: M('i2.webp'),
  i3: M('i3.webp'),
  i4: M('i4.webp'),
  i5: M('i5.webp'),
  i6: M('i6.webp'),
  i7: M('i7.webp'),
  i8: M('i8.webp'),
};

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: any; _fbq?: any } }

const initedMetaPixels = new Set<string>();

function ensureFbqBase() {
  if (window.fbq) return;
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  `;
  document.head.appendChild(script);
}

function initMetaPixels(pixelIds: string[]) {
  const ids = [...new Set(pixelIds.filter(Boolean))];
  if (!ids.length) return;
  ensureFbqBase();
  let added = false;
  for (const id of ids) {
    if (initedMetaPixels.has(id)) continue;
    window.fbq('init', id);
    initedMetaPixels.add(id);
    added = true;
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(noscript);
  }
  if (added) window.fbq('track', 'PageView');
}

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

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

function LazyImg({ src, alt, priority, className = '', aspect }: { src: string; alt: string; priority?: boolean; className?: string; aspect?: string }) {
  const { ref, visible } = useOnScreen();
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
        {/* @ts-expect-error fetchpriority */}
        <img src={src} alt={alt} loading="eager" decoding="async" fetchpriority="high" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible
        ? <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        : <div className="h-full min-h-[280px] w-full animate-pulse bg-gradient-to-br from-rose-100 to-pink-50" />}
    </div>
  );
}

function LazyVideo({ src, poster, aspect = '9/16', priority = false, className = '' }: {
  src: string; poster?: string; aspect?: string; priority?: boolean; className?: string;
}) {
  const { ref, visible } = useOnScreen();
  if (priority) {
    return (
      <div className={`relative w-full overflow-hidden bg-neutral-950 ${className}`} style={{ aspectRatio: aspect }}>
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="auto" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className={`relative w-full overflow-hidden bg-neutral-950 ${className}`} style={{ aspectRatio: aspect }}>
      {visible
        ? <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
        : <div className="flex h-full min-h-[320px] w-full items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-300/40 border-t-rose-500" /></div>}
    </div>
  );
}

function G({ children }: { children: ReactNode }) {
  return <span className="cmf-grad bg-clip-text font-black text-transparent">{children}</span>;
}

function CTA({ onClick, children, tone = 'rose' }: { onClick: () => void; children: ReactNode; tone?: 'rose' | 'gold' | 'dark' }) {
  const cls = tone === 'gold'
    ? 'from-amber-300 via-yellow-400 to-amber-500 text-neutral-900 ring-amber-200/70'
    : tone === 'dark'
      ? 'from-neutral-900 via-rose-950 to-black text-rose-100 ring-rose-500/30'
      : 'from-pink-500 via-rose-500 to-fuchsia-600 text-white ring-pink-200/60';
  return (
    <button type="button" onClick={onClick}
      className={`cmf-cta cmf-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.14em] shadow-[0_18px_44px_-12px_rgba(236,72,153,.55)] ring-2 transition hover:scale-[1.02] sm:text-[15px]`}>
      <span className="cmf-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

const BANDE_TONES: Record<string, { wrap: string; text: string; dot: string }> = {
  noir:    { wrap: 'border-rose-500/25 bg-gradient-to-r from-neutral-950 via-rose-950 to-neutral-900', text: 'text-rose-100', dot: 'text-amber-400' },
  rose:    { wrap: 'border-pink-300/40 bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600', text: 'text-white', dot: 'text-yellow-200' },
  gold:    { wrap: 'border-amber-300/50 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400', text: 'text-neutral-900', dot: 'text-rose-600' },
  blush:   { wrap: 'border-rose-200/60 bg-gradient-to-r from-rose-50 via-pink-100 to-amber-50', text: 'text-rose-800', dot: 'text-fuchsia-500' },
  dark:    { wrap: 'border-rose-900/40 bg-gradient-to-r from-black via-rose-950 to-neutral-950', text: 'text-rose-200', dot: 'text-amber-300' },
  sunset:  { wrap: 'border-orange-300/30 bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400', text: 'text-white', dot: 'text-rose-100' },
  candy:   { wrap: 'border-fuchsia-300/35 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-400', text: 'text-white', dot: 'text-yellow-300' },
  pearl:   { wrap: 'border-white/60 bg-gradient-to-r from-white via-rose-50 to-amber-50', text: 'text-neutral-800', dot: 'text-rose-500' },
  emerald: { wrap: 'border-emerald-500/30 bg-gradient-to-r from-emerald-900 via-neutral-900 to-rose-950', text: 'text-emerald-200', dot: 'text-amber-300' },
  ink:     { wrap: 'border-rose-500/20 bg-gradient-to-r from-neutral-900 via-pink-900/80 to-neutral-900', text: 'text-pink-100', dot: 'text-yellow-400' },
};

function Marquee({
  items,
  tone = 'noir',
  reverse = false,
  speed = 26,
}: {
  items: string[];
  tone?: keyof typeof BANDE_TONES;
  reverse?: boolean;
  speed?: number;
}) {
  const t = BANDE_TONES[tone] || BANDE_TONES.noir;
  const lightBand = tone === 'gold' || tone === 'blush' || tone === 'pearl';
  const gradCls = lightBand ? 'cmf-grad-text-dark' : 'cmf-grad-text';
  const content = [...items, ...items, ...items];
  return (
    <div className={`relative overflow-hidden border-y py-3 ${t.wrap}`}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-white/15 opacity-50" />
      <div
        className={`cmf-marquee flex items-center gap-10 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.26em] sm:text-[11px] ${t.text} ${reverse ? 'cmf-marquee-rev' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {content.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span className={gradCls}>{item}</span>
            <span className={`${t.dot} text-[10px]`}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

type BandeauCfg = {
  items: string[];
  tone?: keyof typeof BANDE_TONES;
  reverse?: boolean;
  speed?: number;
};

type BlockProps = {
  kicker?: string;
  hook: ReactNode;
  cta: string;
  qty?: number;
  onOrder: (q?: number) => void;
  media: ReactNode;
  variant?: 'white' | 'rose' | 'dark' | 'gold';
  ctaTone?: 'rose' | 'gold' | 'dark';
  bandeau?: BandeauCfg;
};

function Block({ kicker, hook, cta, qty, onOrder, media, variant = 'white', ctaTone, bandeau }: BlockProps) {
  const bg = {
    white: 'bg-gradient-to-b from-white via-rose-50/40 to-white text-neutral-900',
    rose: 'bg-gradient-to-b from-rose-50 via-pink-50 to-white text-neutral-900',
    dark: 'bg-gradient-to-b from-neutral-950 via-rose-950 to-neutral-900 text-white',
    gold: 'bg-gradient-to-b from-amber-50 via-yellow-50/80 to-white text-neutral-900',
  }[variant];
  const sub = variant === 'dark' ? 'text-rose-200/80' : 'text-neutral-500';
  return (
    <>
      <section className={`relative overflow-hidden px-4 py-10 sm:py-14 ${bg}`}>
        <div className="pointer-events-none absolute -right-20 top-8 h-64 w-64 rounded-full bg-pink-400/20 blur-[100px] cmf-float" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-amber-300/15 blur-[100px] cmf-float" style={{ animationDelay: '2s' }} />
        <div className="relative mx-auto max-w-xl text-center">
          {kicker && <p className="mb-3 text-[10px] font-black uppercase tracking-[0.32em] text-rose-600">{kicker}</p>}
          <div className="mb-5 text-balance text-[19px] font-black leading-tight sm:text-[22px]">{hook}</div>
          <div className="overflow-hidden rounded-[28px] shadow-[0_24px_60px_-20px_rgba(190,24,93,.4)] ring-1 ring-rose-200/60">{media}</div>
          <div className="mt-6">
            <CTA onClick={() => onOrder(qty ?? 1)} tone={ctaTone || (variant === 'dark' ? 'gold' : 'rose')}>{cta} →</CTA>
            <p className={`mt-2.5 text-[11px] font-semibold ${sub}`}>🔒 Paiement à la livraison · Stock limité</p>
          </div>
        </div>
      </section>
      {bandeau && <Marquee items={bandeau.items} tone={bandeau.tone} reverse={bandeau.reverse} speed={bandeau.speed} />}
    </>
  );
}

export default function CremeMinceurFbLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(19);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [reviewIdx, setReviewIdx] = useState(0);
  const [expertIdx, setExpertIdx] = useState(0);
  const [toast, setToast] = useState<{ n: string; v: string; act: string; visible: boolean } | null>(null);

  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const openModal = useCallback((q?: number) => { setQty(q || 1); setModal(true); }, []);

  const TOASTS = useMemo(() => [
    { n: 'Aminata', v: 'Yopougon', act: 'vient de commander 2 pots' },
    { n: 'Fatou', v: 'Cocody', act: 'consulte l\'offre ventre plat' },
    { n: 'Marie', v: 'Bouaké', act: 'a laissé 5 étoiles ★★★★★' },
    { n: 'Adjoua', v: 'Marcory', act: 'vient de commander 3 pots' },
    { n: 'Kouassi', v: 'Daloa', act: 'a reçu sa livraison aujourd\'hui' },
    { n: 'Awa', v: 'Abobo', act: 'consulte le pack brûle graisse' },
  ], []);

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
    initMetaPixels(META_PIXEL_IDS);
    window.fbq?.('track', 'ViewContent', {
        content_name: 'Crème Minceur Brûle Graisse',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
        currency: 'XOF',
      });
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
    const id = setInterval(() => setStock((s) => (s > 5 ? s - 1 : s)), 52000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setReviewIdx((c) => (c + 1) % 4), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setExpertIdx((c) => (c + 1) % 3), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const show = () => {
      const t = TOASTS[toastIdx.current % TOASTS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast((p) => (p ? { ...p, visible: false } : null)), 4000);
      setTimeout(() => setToast(null), 4400);
    };
    const first = setTimeout(show, 4500);
    const id = setInterval(show, 13000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [TOASTS]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const waReviews = [
    { name: 'Aminata', city: 'Yopougon', txt: 'Mon ventre est plus plat après 3 semaines. Je recommande à toutes mes amies 💕', t: '09:12' },
    { name: 'Fatou', city: 'Cocody', txt: 'Livraison rapide, payé au livreur. La crème sent bon et pénètre vite.', t: '14:28' },
    { name: 'Marie', city: 'Bouaké', txt: 'J\'ai perdu 2 cm de tour de taille. Très contente du résultat !', t: '18:45' },
  ];
  const smsReviews = [
    { from: 'Adjoua', txt: 'Bonjour, colis reçu. Déjà moins de ballonnements au 5e jour 👍', t: '08:33' },
    { from: 'Kouassi', txt: 'Vous livrez à San-Pédro ? Je veux le pack 3 pots.', t: '16:02' },
  ];
  const reviews = [
    { name: 'Aminata', city: 'Yopougon', txt: 'Ventre plus ferme, peau lisse. Résultat visible en 1 mois.', stars: 5 },
    { name: 'Fatou', city: 'Cocody', txt: 'Brûle les graisses localisées. Application matin & soir.', stars: 5 },
    { name: 'Awa', city: 'Abobo', txt: 'Paiement à la livraison, sérieux. Je commande encore.', stars: 5 },
    { name: 'Yao', city: 'Daloa', txt: 'Moins de cellulite sur les cuisses. Très satisfaite.', stars: 5 },
  ];
  const press = ['FemmeCI Mag', 'Beauté Afrique', 'Santé & Forme', 'Le Quotidien Bien-être', 'Afrik Wellness'];
  const experts = [
    { name: 'Dr. N\'Guessan A.', role: 'Nutritionniste', quote: 'Formule thermo-active adaptée aux zones rebelles.' },
    { name: 'Coach Aya K.', role: 'Fitness CI', quote: 'Complément idéal pour affiner la silhouette.' },
    { name: 'Esthéticienne Pro', role: 'Spa Abidjan', quote: 'Texture fondante, absorption rapide, zéro gras.' },
  ];

  const stockPct = Math.round((stock / 30) * 100);

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
      <style>{`
        .cmf-grad { background-image: linear-gradient(90deg,#ec4899,#f43f5e,#fbbf24,#ec4899); background-size: 200% auto; animation: cmf-shimmer 4s linear infinite; }
        @keyframes cmf-shimmer { 0% { background-position: 0% 50% } 100% { background-position: 200% 50% } }
        @keyframes cmf-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-33%) } }
        @keyframes cmf-marquee-rev { 0% { transform: translateX(-33%) } 100% { transform: translateX(0) } }
        .cmf-marquee { animation: cmf-marquee 26s linear infinite }
        .cmf-marquee-rev { animation-name: cmf-marquee-rev }
        .cmf-grad-text {
          background-image: linear-gradient(90deg, #fff, #fde68a, #fb7185, #f9a8d4, #fff);
          background-size: 220% auto; background-clip: text; -webkit-background-clip: text;
          -webkit-text-fill-color: transparent; animation: cmf-shimmer 4.5s linear infinite;
        }
        .cmf-grad-text-dark {
          background-image: linear-gradient(90deg, #831843, #be123c, #b45309, #9d174d, #831843);
          background-size: 220% auto; background-clip: text; -webkit-background-clip: text;
          -webkit-text-fill-color: transparent; animation: cmf-shimmer 4.5s linear infinite;
        }
        @keyframes cmf-sheen { 0% { transform: translateX(-100%) } 60% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .cmf-sheen { animation: cmf-sheen 2.6s ease-in-out infinite }
        @keyframes cmf-pulse { 0%,100% { transform: translateY(0); box-shadow: 0 18px 44px -12px rgba(236,72,153,.5) } 50% { transform: translateY(-2px); box-shadow: 0 26px 56px -8px rgba(236,72,153,.75) } }
        .cmf-pulse { animation: cmf-pulse 2.3s ease-in-out infinite }
        .cmf-cta:hover { animation: none !important }
        @keyframes cmf-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-18px) } }
        .cmf-float { animation: cmf-float 8s ease-in-out infinite }
        @keyframes cmf-in { from { opacity:0; transform:translateX(-110%) } to { opacity:1; transform:translateX(0) } }
        @keyframes cmf-out { from { opacity:1 } to { opacity:0; transform:translateX(-110%) } }
        .cmf-toast-in { animation: cmf-in .45s cubic-bezier(.22,1,.36,1) both }
        .cmf-toast-out { animation: cmf-out .4s ease both }
      `}</style>

      {/* Barre urgence sticky */}
      <div className="sticky top-0 z-40 border-b border-rose-500/20 bg-neutral-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white sm:text-[11px]">
          <span className="flex items-center gap-1.5 text-rose-300">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" /></span>
            Offre -{Math.round(((PRICES[1] + 5000 - PRICES[1]) / (PRICES[1] + 5000)) * 100)}%
          </span>
          <span className="tabular-nums text-amber-300">⏱ {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>
          <span className="text-rose-200">{stock} pots restants</span>
        </div>
        <div className="h-1 bg-neutral-800"><div className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 transition-all" style={{ width: `${stockPct}%` }} /></div>
      </div>

      {/* HERO vidéo boucle */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <LazyVideo src={MEDIA.heroVideo} poster={MEDIA.heroPoster} aspect="4/5" priority className="max-h-[78vh] sm:max-h-[82vh]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-8 pt-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-rose-200 ring-1 ring-rose-400/40">
            🔥 Brûle graisse · Ventre plat
          </span>
          <h1 className="mt-3 text-balance text-[26px] font-black leading-[1.1] sm:text-[32px]">
            <G>Affinez</G> votre silhouette <G>sans effort</G>
          </h1>
          <p className="mt-2 text-[13px] font-semibold text-rose-100/90">Crème thermo-active · Résultats visibles · Paiement à la livraison</p>
          <div className="mx-auto mt-5 max-w-md">
            <CTA onClick={() => openModal(1)} tone="gold">Commander maintenant — dès {fmt(orderTotal(PRICES, 1))} F</CTA>
          </div>
        </div>
      </section>

      <Marquee tone="rose" speed={22} items={['Ventre plat', 'Anti-cellulite', 'Brûle graisse', 'Paiement à la livraison', 'Stock limité', 'Made for CI']} />

      <Block onOrder={openModal} kicker="Action rapide" hook={<>La texture <G>fond</G> sur la peau et <G>cible</G> les graisses tenaces.</>} cta="Je veux essayer" media={<LazyVideo src={MEDIA.v1} aspect="9/16" />} variant="rose"
        bandeau={{ tone: 'candy', reverse: true, speed: 24, items: ['Thermo-active', 'Zéro effort', 'Résultat rapide', '100% naturel', 'Côte d\'Ivoire'] }} />
      <Block onOrder={openModal} kicker="Formule premium" hook={<>Ingrédients <G>actifs</G> pour un ventre plus <G>plat</G>.</>} cta="Commander ma crème" media={<LazyImg src={MEDIA.i1} alt="Crème minceur texture premium" aspect="4/5" />} variant="white"
        bandeau={{ tone: 'blush', speed: 28, items: ['Formule premium', 'Ventre plat', 'Anti-ballonnement', 'Peau lisse', 'Offre du jour'] }} />
      <Block onOrder={openModal} kicker="Mode d'emploi" hook={<>Massage <G>2 min</G> matin & soir sur les zones à <G>traiter</G>.</>} cta="Obtenir ma livraison" media={<LazyVideo src={MEDIA.v2} aspect="9/16" />} variant="dark" ctaTone="gold"
        bandeau={{ tone: 'dark', reverse: true, speed: 20, items: ['Matin & soir', '2 minutes', 'Massage doux', 'Zones ciblées', 'Livraison 24-48h'] }} />
      <Block onOrder={openModal} kicker="Résultat" hook={<>Peau plus <G>ferme</G>, silhouette plus <G>harmonieuse</G>.</>} cta="Profiter de l'offre" media={<LazyImg src={MEDIA.i2} alt="Résultat minceur" aspect="4/5" />} variant="gold"
        bandeau={{ tone: 'gold', speed: 25, items: ['Silhouette affinée', 'Peau ferme', 'Confiance retrouvée', '★★★★★', 'Clientes satisfaites'] }} />
      <Block onOrder={openModal} kicker="Témoignage vidéo" hook={<>Des milliers de femmes <G>transformées</G> en Côte d'Ivoire.</>} cta="Rejoindre les clientes" media={<LazyVideo src={MEDIA.v3} aspect="9/16" />} variant="rose"
        bandeau={{ tone: 'sunset', reverse: true, speed: 23, items: ['2 400+ avis', 'Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yopougon'] }} />
      <Block onOrder={openModal} kicker="Ultra concentrée" hook={<>Une noisette suffit — <G>économique</G> et <G>efficace</G>.</>} cta="Commander aujourd'hui" media={<LazyImg src={MEDIA.i3} alt="Application crème minceur" aspect="4/5" />} variant="white"
        bandeau={{ tone: 'pearl', speed: 30, items: ['Ultra concentrée', '1 noisette', 'Longue durée', 'Meilleur rapport', 'Économisez'] }} />
      <Block onOrder={openModal} kicker="Transformation" hook={<>Voyez la <G>différence</G> sur le ventre et les hanches.</>} cta="Je commande maintenant" media={<LazyVideo src={MEDIA.v4} aspect="9/16" />} variant="dark" ctaTone="rose"
        bandeau={{ tone: 'ink', reverse: true, speed: 21, items: ['Avant / Après', 'Hanches', 'Ventre', 'Cuisses', 'Bras', 'Transformation'] }} />
      <Block onOrder={openModal} kicker="Avant traitement" hook={<>Fini le ventre qui <G>déborde</G> sous vos tenues.</>} cta="Lancer ma cure" media={<LazyImg src={MEDIA.i7} alt="Avant minceur" aspect="4/5" />} variant="rose"
        bandeau={{ tone: 'rose', speed: 26, items: ['Fini le ventre rond', 'Tenues ajustées', 'Confiance', 'Élégance', 'Bien-être'] }} />
      <Block onOrder={openModal} kicker="Après 4 semaines" hook={<>Silhouette <G>affûtée</G>, confiance <G>retrouvée</G>.</>} cta="Même résultat pour moi" media={<LazyImg src={MEDIA.i8} alt="Après minceur" aspect="4/5" />} variant="gold"
        bandeau={{ tone: 'gold', reverse: true, speed: 24, items: ['4 semaines', 'Résultat visible', 'Ventre plat', 'Silhouette fine', 'Objectif atteint'] }} />
      <Block onOrder={openModal} kicker="Texture veloutée" hook={<>S'absorbe en <G>30 secondes</G> — pas de film gras.</>} cta="Ajouter au panier" media={<LazyImg src={MEDIA.i4} alt="Texture crème" aspect="1/1" />} variant="white"
        bandeau={{ tone: 'blush', speed: 27, items: ['Texture veloutée', 'Absorption 30s', 'Non gras', 'Parfum délicat', 'Confort'] }} />
      <Block onOrder={openModal} kicker="Packaging premium" hook={<>Pot élégant — parfait pour une <G>routine beauté</G>.</>} cta="Commander le pack" media={<LazyImg src={MEDIA.i5} alt="Packaging" aspect="1/1" />} variant="rose"
        bandeau={{ tone: 'candy', reverse: true, speed: 22, items: ['Packaging luxe', 'Routine beauté', 'Cadeau idéal', 'Qualité premium', 'Made for you'] }} />
      <Block
        kicker="Cure complète"
        hook={<>3 pots = <G>meilleur prix</G> + résultats <G>durables</G>.</>}
        cta="Choisir le pack 3"
        qty={3}
        onOrder={openModal}
        media={<LazyImg src={MEDIA.i6} alt="Cure 3 pots" aspect="1/1" />}
        variant="dark"
        ctaTone="gold"
        bandeau={{ tone: 'noir', speed: 20, items: ['Pack 3 pots', 'Gommage OFFERT', 'Économisez 5 100 F', 'Ultra pack', 'Stock limité'] }}
      />

      {/* Bundles */}
      <section className="bg-gradient-to-b from-neutral-950 via-rose-950 to-neutral-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-400">Offres limitées</p>
          <h2 className="mt-2 text-[22px] font-black">Choisissez votre <G>pack</G></h2>
          <div className="mt-6 grid gap-3">
            {QTY_OPTS.map((o) => (
              <button key={o.v} type="button" onClick={() => openModal(o.v)}
                className={`relative rounded-2xl border-2 px-4 py-4 text-left transition hover:scale-[1.02] ${o.v === 2 ? 'border-amber-400 bg-gradient-to-r from-rose-900/80 to-neutral-900 ring-2 ring-amber-400/40' : 'border-rose-500/30 bg-neutral-900/60'}`}>
                {o.tag && <span className="absolute -right-2 -top-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-0.5 text-[9px] font-black uppercase text-neutral-900">{o.tag}</span>}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black">{o.label}</p>
                    {o.save && <p className="text-[12px] text-rose-200">{o.save}</p>}
                  </div>
                  <p className="text-xl font-black text-amber-300">{o.sub}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-[11px] font-bold text-rose-200 ring-1 ring-rose-500/30">
            + Gommage corps OFFERT sur le pack 3 pots (stock promo)
          </div>
        </div>
      </section>

      <Marquee tone="sunset" reverse speed={23} items={[`Pack 1 pot ${fmtTotal(1)} F`, `Pack 2 pots ${fmtTotal(2)} F`, `Pack 3 pots ${fmtTotal(3)} F`, 'Livraison gratuite', 'Gommage offert']} />

      {/* Experts carousel */}
      <section className="bg-white px-4 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-600">Recommandé par</p>
          <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 p-5 ring-1 ring-rose-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">{experts[expertIdx].role}</p>
            <p className="mt-2 text-[17px] font-black text-neutral-900">« {experts[expertIdx].quote} »</p>
            <p className="mt-2 text-[12px] font-semibold text-neutral-500">— {experts[expertIdx].name}</p>
          </div>
        </div>
      </section>

      <Marquee tone="pearl" speed={29} items={['Recommandé par des experts', 'Nutritionniste', 'Coach fitness', 'Spa Abidjan', 'Formule testée']} />

      {/* Presse */}
      <section className="border-y border-rose-100 bg-rose-50/50 px-4 py-8">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-neutral-500">Vu dans</p>
        <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-3">
          {press.map((p) => (
            <span key={p} className="rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wider text-neutral-700 shadow-sm ring-1 ring-rose-100">{p}</span>
          ))}
        </div>
      </section>

      <Marquee tone="blush" reverse speed={32} items={['FemmeCI Mag', 'Beauté Afrique', 'Santé & Forme', 'Le Quotidien Bien-être', 'Afrik Wellness', 'Vu dans la presse']} />

      {/* WhatsApp reviews */}
      <section className="bg-[#0b141a] px-4 py-10 text-white">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-emerald-400">Avis WhatsApp vérifiés</p>
        <div className="mx-auto mt-5 max-w-md space-y-3">
          {waReviews.map((r) => (
            <div key={r.name} className="rounded-2xl rounded-tl-sm bg-[#1f2c34] px-4 py-3 shadow-lg">
              <div className="flex items-center justify-between text-[11px] text-emerald-300/80"><span className="font-bold">{r.name} · {r.city}</span><span>{r.t}</span></div>
              <p className="mt-1.5 text-[14px] leading-snug text-[#e9edef]">{r.txt}</p>
            </div>
          ))}
        </div>
      </section>

      <Marquee tone="emerald" reverse speed={24} items={['Avis WhatsApp vérifiés', '★★★★★', 'Livraison OK', 'Payé au livreur', 'Recommandé']} />

      {/* SMS */}
      <section className="bg-gradient-to-b from-neutral-100 to-white px-4 py-10">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-neutral-500">Messages clients</p>
        <div className="mx-auto mt-5 max-w-md space-y-3">
          {smsReviews.map((r) => (
            <div key={r.from} className="rounded-2xl bg-white px-4 py-3 shadow-md ring-1 ring-neutral-200">
              <div className="flex justify-between text-[11px] font-bold text-neutral-400"><span>{r.from}</span><span>{r.t}</span></div>
              <p className="mt-1 text-[14px] text-neutral-800">{r.txt}</p>
            </div>
          ))}
        </div>
      </section>

      <Marquee tone="gold" speed={26} items={['Messages clients', 'Satisfaite', 'Colis reçu', 'Résultat rapide', 'Je recommande']} />

      {/* Carousel avis étoilés */}
      <section className="bg-gradient-to-b from-rose-50 to-white px-4 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-600">4,9/5 · 2 400+ avis</p>
          <div className="mt-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-rose-100">
            <div className="flex justify-center gap-0.5">
              {Array.from({ length: reviews[reviewIdx].stars }).map((_, i) => (
                <svg key={i} className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
            <p className="mt-3 text-[15px] font-semibold leading-snug text-neutral-800">« {reviews[reviewIdx].txt} »</p>
            <p className="mt-2 text-[12px] font-bold text-rose-600">{reviews[reviewIdx].name} — {reviews[reviewIdx].city}</p>
          </div>
        </div>
      </section>

      <Marquee tone="candy" reverse speed={20} items={['4,9/5 étoiles', '2 400+ clientes', 'Avis authentiques', 'Top vente CI', 'Brûle graisse N°1']} />

      {/* CTA final */}
      <section className="bg-neutral-950 px-4 py-14 text-center text-white">
        <h2 className="text-[24px] font-black"><G>Agissez maintenant</G></h2>
        <p className="mt-2 text-[13px] text-rose-200">Offre valable jusqu'à minuit · {stock} pots en stock</p>
        <div className="mx-auto mt-6 max-w-md space-y-3">
          <CTA onClick={() => openModal(2)} tone="gold">Commander — {fmt(orderTotal(PRICES, 2))} F (2 pots)</CTA>
          <CTA onClick={() => openModal(1)} tone="rose">1 pot — {fmt(orderTotal(PRICES, 1))} F</CTA>
        </div>
      </section>

      <Marquee tone="dark" speed={18} items={['Commandez maintenant', 'Offre expire ce soir', 'Stock limité', 'Paiement à la livraison', 'Agissez']} />

      {/* Toast live */}
      {toast && (
        <div className={`fixed bottom-20 left-3 z-50 max-w-[280px] rounded-xl bg-neutral-900/95 px-3 py-2.5 text-white shadow-2xl ring-1 ring-rose-500/40 backdrop-blur-sm sm:left-4 ${toast.visible ? 'cmf-toast-in' : 'cmf-toast-out'}`}>
          <p className="text-[11px] font-bold text-rose-300">{toast.n} · {toast.v}</p>
          <p className="text-[12px] font-semibold">{toast.act}</p>
        </div>
      )}

      {/* Barre CTA flottante */}
      {!modal && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-rose-500/20 bg-neutral-950/95 p-3 backdrop-blur-md" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom,0px))' }}>
          <button type="button" onClick={() => openModal(1)} className="cmf-pulse mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 px-4 py-3.5 text-[13px] font-black uppercase tracking-wide text-white shadow-lg">
            Commander — offre limitée ⏱ {pad(countdown.m)}:{pad(countdown.s)}
          </button>
        </div>
      )}

      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        product={product}
        setProduct={setProduct}
        initialQty={qty}
        cfg={{
          slug: SLUG,
          productCode: PRODUCT_CODE,
          title: 'Crème Minceur Brûle Graisse',
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          secondaryMetaPixelId: META_PIXEL_ID_2,
          company,
          navigate,
          prices: PRICES,
          images: { hero: MEDIA.i1, avant: MEDIA.i7, apres: MEDIA.i8, comparison: { before: MEDIA.i7, after: MEDIA.i8 } },
        }}
        qtyOptions={QTY_OPTS}
      />
    </div>
  );
}
