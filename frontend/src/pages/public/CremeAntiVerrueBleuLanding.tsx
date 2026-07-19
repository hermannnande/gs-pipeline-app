/**
 * Tunnel de vente PREMIUM — Crème Anti-Verrues (variante BLEU).
 * Slug : creme-anti-verrue-bleu · productCode : CREME_ANTI_VERRUE_BLEU
 * Commandes -> obgestion (flux standard via OrderModalAntiVerrue).
 *
 * Design épuré : peu de texte. CHAQUE image = un bloc, avec sous l'image un
 * TITRE court accrocheur (dégradé) + un bouton CTA coloré à effet BOUNCE qui
 * ouvre le formulaire en popup. Dégradés fluides bleus, barres défilantes,
 * compte à rebours, notifications d'achat, avis, packs.
 * Médias locaux WebP (same-origin VPS) — lazy load + preload hero.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'creme-anti-verrue-bleu';
const PRODUCT_CODE = 'CREME_ANTI_VERRUE_BLEU';
const CONTENT_NAME = 'Crème Anti-Verrues';
const THANK_YOU_URL = '/creme-anti-verrue-bleu/merci';
const META_PIXEL_ID = '1417398840151713';
const META_PIXEL_ID_2 = '997153262936532';

const PRICES: Record<number, number> = { 1: 8500, 2: 14100, 3: 20700 };
const OLD_UNIT = 15000;
const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
const fmtPack = (v: number) => packLabel(PRICES, v, 'F').replace(' F', '');
const QTY_OPTS = [
  { v: 1, label: '1 boîte', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 boîtes', sub: packLabel(PRICES, 2, 'F'), tag: 'Populaire', save: 'Économisez 2 900 F' },
  { v: 3, label: '3 boîtes', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 4 800 F' },
];

const IMG_CACHE_VERSION = '20260628a';
const M = (n: string) => `/creme-anti-verrue-bleu/${n}?v=${IMG_CACHE_VERSION}`;
const VK = (file: string) => `/verrue-tk/${file}`;

type Tone = 'sky' | 'indigo' | 'cyan' | 'mix';
type ImageBlock = { src: string; title: ReactNode; tone: Tone; bg: string };
type MediaBlock =
  | { kind: 'image'; src: string; title: ReactNode; tone: Tone; bg: string; aspect?: string }
  | { kind: 'video'; src: string; poster?: string; title: ReactNode; tone: Tone; bg: string; aspect?: string };

/** Galerie principale (WebP locaux creme-anti-verrue-bleu). */
const IMAGES: ImageBlock[] = [
  { src: M('hero.webp'), title: 'Dites adieu aux verrues 👋', tone: 'cyan', bg: 'from-sky-100 via-cyan-50 to-sky-200/60' },
  { src: M('gallery-1.webp'), title: 'Une peau nette, sans complexe ✨', tone: 'indigo', bg: 'from-indigo-100 via-blue-50 to-cyan-100/50' },
  { src: M('gallery-2.webp'), title: 'Action ciblée, zéro douleur', tone: 'sky', bg: 'from-cyan-100 via-sky-50 to-blue-100/50' },
  { src: M('gallery-3.webp'), title: 'Résultats visibles en quelques jours', tone: 'cyan', bg: 'from-blue-100 via-indigo-50 to-sky-100/50' },
  { src: M('gallery-4.webp'), title: 'Efficace mains, pieds & corps', tone: 'mix', bg: 'from-sky-100 via-white to-indigo-100/60' },
  { src: M('gallery-5.webp'), title: 'Formule 100% botanique 🌿', tone: 'sky', bg: 'from-cyan-100 via-sky-50 to-indigo-100/50' },
  { src: M('gallery-6.webp'), title: 'Rejoignez des milliers de satisfaits ❤️', tone: 'indigo', bg: 'from-indigo-100 via-sky-50 to-cyan-100/60' },
];

/** Suite en bas de page — médias verrue-tk (ajout, sans remplacer la galerie ci-dessus). */
const EXTRA_BLOCKS: MediaBlock[] = [
  { kind: 'image', src: VK('new-6.webp'), title: 'Résultat visible, peau nette 📸', tone: 'cyan', bg: 'from-sky-100 via-cyan-50 to-indigo-100/50' },
  { kind: 'video', src: VK('video-1.mp4'), poster: VK('promo-video.webp'), title: 'La crème en action, résultat réel 🎬', tone: 'indigo', bg: 'from-indigo-100 via-blue-50 to-cyan-100/50', aspect: '9/16' },
  { kind: 'image', src: VK('new-6.webp'), title: 'Éliminez vos verrues sans stress', tone: 'sky', bg: 'from-cyan-100 via-sky-50 to-blue-100/50' },
  { kind: 'image', src: VK('new-6.webp'), title: 'Formule douce, action puissante 💪', tone: 'mix', bg: 'from-blue-100 via-white to-sky-100/60' },
  { kind: 'video', src: VK('video-2.mp4'), poster: VK('new-4.webp'), title: 'Simple à appliquer, efficace vite ⚡', tone: 'cyan', bg: 'from-blue-100 via-indigo-50 to-sky-100/50', aspect: '9/16' },
  { kind: 'image', src: VK('new-6.webp'), title: 'Mains, pieds, corps — partout ✓', tone: 'indigo', bg: 'from-indigo-100 via-sky-50 to-cyan-100/60' },
  { kind: 'image', src: VK('new-6.webp'), title: 'Des clients conquis chaque jour ❤️', tone: 'sky', bg: 'from-cyan-100 via-sky-50 to-indigo-100/50' },
  { kind: 'video', src: VK('video-3.mp4'), poster: VK('new-5.webp'), title: 'Voyez la différence par vous-même 🎥', tone: 'cyan', bg: 'from-sky-100 via-cyan-50 to-sky-200/60', aspect: '9/16' },
  { kind: 'image', src: VK('new-6.webp'), title: 'Commandez maintenant, payez à la livraison 🚚', tone: 'mix', bg: 'from-indigo-100 via-blue-50 to-cyan-100/50' },
  { kind: 'image', src: VK('new-6.webp'), title: 'Offre promo — stock limité 🔥', tone: 'indigo', bg: 'from-indigo-100 via-sky-50 to-cyan-100/60' },
];

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: any; _fbq?: any; dataLayer?: any[] } }

function initMetaPixel(pixelId: string) {
  if (!pixelId) return;
  if (!window.fbq) {
    const f: any = window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); };
    if (!window._fbq) window._fbq = f;
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    const s = document.createElement('script');
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function initSecondaryMetaPixel(pixelId: string) {
  if (!pixelId || !window.fbq) return;
  window.fbq('init', pixelId);
  window.fbq('trackSingle', pixelId, 'PageView');
}

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const pad = (n: number) => String(n).padStart(2, '0');

function useOnScreen(rootMargin = '280px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin });
    obs.observe(el); return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`av-reveal ${shown ? 'av-reveal-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function LazyVideo({ src, poster, aspect = '9/16', className = '' }: { src: string; poster?: string; aspect?: string; className?: string }) {
  const { ref, visible } = useOnScreen('280px');
  const frame = { aspectRatio: aspect };
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={frame}>
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-gradient-to-br from-sky-200/80 via-indigo-100/70 to-cyan-200/80" style={frame} aria-hidden>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-300/40 border-t-cyan-500" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-indigo-950/40 to-transparent" />
    </div>
  );
}

function BlockMedia({ block, alt, priority }: { block: MediaBlock; alt: string; priority?: boolean }) {
  const aspect = block.aspect || '4/5';
  if (block.kind === 'video') {
    return <LazyVideo src={block.src} poster={block.poster} aspect={aspect} />;
  }
  return <LazyImg src={block.src} alt={alt} priority={priority} aspect={aspect} />;
}

function LazyImg({ src, alt, priority, aspect = '4/5', className = '' }: { src: string; alt: string; priority?: boolean; aspect?: string; className?: string }) {
  const { ref, visible } = useOnScreen(priority ? '0px' : '260px');
  const frame = { aspectRatio: aspect };
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`} style={frame}>
        {/* @ts-expect-error fetchpriority */}
        <img src={src} alt={alt} width={760} height={950} loading="eager" decoding="async" fetchpriority="high" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={frame}>
      {visible
        ? <img src={src} alt={alt} width={760} height={950} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        : <div className="h-full min-h-[280px] w-full bg-gradient-to-br from-sky-200/80 via-indigo-100/70 to-cyan-200/80" style={frame} aria-hidden />}
    </div>
  );
}

function Countdown({ compact = false }: { compact?: boolean }) {
  const [cd, setCd] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - Date.now());
      setCd({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  if (compact) return <span className="tabular-nums">{pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}</span>;
  return (
    <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-sky-300/30 backdrop-blur">
      <span className="text-[10px] font-bold uppercase tracking-widest text-sky-200">Fin de l&apos;offre</span>
      {[{ v: cd.h, l: 'h' }, { v: cd.m, l: 'm' }, { v: cd.s, l: 's' }].map(({ v, l }, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-sky-300/60">:</span>}
          <span className="flex min-w-[2.5rem] flex-col items-center rounded-xl bg-gradient-to-b from-sky-300 to-indigo-500 px-2 py-1 text-white shadow-md">
            <span className="text-lg font-black tabular-nums leading-none">{pad(v)}</span>
            <span className="text-[8px] font-bold uppercase">{l}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function Marquee({ items }: { items: string[] }) {
  const c = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-sky-400/25 bg-gradient-to-r from-indigo-700 via-sky-600 to-cyan-600 py-2.5 text-white">
      <div className="av-marquee flex gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.22em]">
        {c.map((t, i) => (<span key={i} className="inline-flex items-center gap-3">{t}<span className="text-sky-200/80">◆</span></span>))}
      </div>
    </div>
  );
}

function GradText({ children, v = 'mix' }: { children: ReactNode; v?: Tone }) {
  const cls = v === 'sky' ? 'av-grad-sky' : v === 'indigo' ? 'av-grad-indigo' : v === 'cyan' ? 'av-grad-cyan' : 'av-grad-mix';
  return <span className={cls}>{children}</span>;
}

/** Bouton CTA coloré avec effet BOUNCE permanent. */
function BounceCTA({ onClick, children, tone = 'mix' }: { onClick: () => void; children: ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    sky: 'from-sky-400 via-cyan-400 to-sky-600',
    indigo: 'from-indigo-500 via-blue-600 to-indigo-700',
    cyan: 'from-cyan-400 via-sky-500 to-blue-600',
    mix: 'from-fuchsia-500 via-sky-500 to-cyan-400',
  };
  return (
    <button type="button" onClick={onClick}
      className={`av-bounce relative inline-flex w-full max-w-sm items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${tones[tone]} px-6 py-4 text-[15px] font-black uppercase tracking-[0.12em] text-white ring-2 ring-white/40 shadow-[0_12px_28px_-6px_rgba(56,189,248,.6)]`}>
      <span className="av-shine pointer-events-none absolute inset-0" />
      <span className="relative z-10">🛒 {children}</span>
    </button>
  );
}

export default function CremeAntiVerrueBleuLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [toast, setToast] = useState<{ n: string; v: string; q: string; t: string; visible: boolean } | null>(null);
  const toastIdx = useRef(0);

  const NOTIFS = useMemo(() => [
    { n: 'Aïcha K.', v: 'Cocody', q: '2 boîtes', t: '3 min' },
    { n: 'Koffi B.', v: 'Yopougon', q: '1 boîte', t: '7 min' },
    { n: 'Mariam S.', v: 'Marcory', q: '3 boîtes', t: '11 min' },
    { n: 'Serge N.', v: 'Plateau', q: '2 boîtes', t: '16 min' },
    { n: 'Fatou D.', v: 'Abobo', q: '1 boîte', t: '21 min' },
  ], []);

  const track = useCallback((event: string, value?: number) => {
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event, product: PRODUCT_CODE, value, currency: 'XOF' }); } catch { /* noop */ }
  }, []);

  const openModal = useCallback((q?: number) => {
    const pack = q || selectedPack || 1;
    setQty(pack); setModal(true);
    track('OpenForm', orderTotal(PRICES, pack));
  }, [selectedPack, track]);

  useEffect(() => {
    document.title = 'Crème Anti-Verrues — Élimine vos verrues · Promo';
    trackPageView(SLUG, company);
    initMetaPixel(META_PIXEL_ID);
    initSecondaryMetaPixel(META_PIXEL_ID_2);
    window.fbq?.('track', 'ViewContent', {
      content_name: CONTENT_NAME,
      content_ids: [PRODUCT_CODE],
      content_type: 'product',
      value: orderTotal(PRICES, 1),
      currency: 'XOF',
    });
    track('ViewContent', orderTotal(PRICES, 1));
    const link = document.createElement('link');
    link.rel = 'preload'; link.as = 'image'; link.href = IMAGES[0].src;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [company, track]);

  useEffect(() => {
    const load = () => axios.get(`${API_URL}/public/products`, { params: { company } })
      .then(({ data }) => setProduct((data?.products || []).find((x: Product) => x.code === PRODUCT_CODE) || null))
      .catch(() => {});
    const schedule = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1500);
    const id = schedule(load);
    return () => {
      if (typeof cancelIdleCallback === 'function' && typeof id === 'number') cancelIdleCallback(id);
      else clearTimeout(id as ReturnType<typeof setTimeout>);
    };
  }, [company]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      const item = NOTIFS[toastIdx.current % NOTIFS.length];
      toastIdx.current++;
      setToast({ ...item, visible: true });
      setTimeout(() => setToast((p) => (p ? { ...p, visible: false } : null)), 4500);
      setTimeout(() => setToast(null), 4900);
      timer = setTimeout(show, 11000 + Math.random() * 6000);
    };
    timer = setTimeout(show, 5000);
    return () => clearTimeout(timer);
  }, [NOTIFS]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50/40 pb-28">
      <style>{`
        .av-grad-sky { background:linear-gradient(120deg,#0ea5e9,#38bdf8,#22d3ee,#0ea5e9); background-size:220% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation:av-pan 5s linear infinite; }
        .av-grad-indigo { background:linear-gradient(120deg,#4f46e5,#6366f1,#3b82f6,#4f46e5); background-size:220% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation:av-pan 5s linear infinite; }
        .av-grad-cyan { background:linear-gradient(120deg,#06b6d4,#22d3ee,#38bdf8,#06b6d4); background-size:220% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation:av-pan 4.5s linear infinite; }
        .av-grad-mix { background:linear-gradient(120deg,#4f46e5,#0ea5e9,#22d3ee,#3b82f6,#06b6d4); background-size:300% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation:av-pan 6s linear infinite; }
        @keyframes av-pan { to { background-position:300% center; } }
        @keyframes av-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .av-marquee { animation:av-marquee 24s linear infinite; }
        .av-cv { content-visibility:auto; contain-intrinsic-size:auto 600px; }
        .av-reveal { opacity:0; transform:translateY(16px); transition:opacity .5s ease, transform .5s ease; }
        .av-reveal-in { opacity:1; transform:translateY(0); }
        .av-animated-bg { background-size:180% 180%; animation:av-bg 12s ease infinite; }
        @keyframes av-bg { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .av-shine { background:linear-gradient(110deg,transparent 18%,rgba(255,255,255,.5) 45%,transparent 72%); transform:translateX(-130%); }
        .av-bounce:hover .av-shine { transform:translateX(130%); transition:transform .85s ease; }
        @keyframes av-bounce-kf { 0%,100%{transform:translateY(0)} 25%{transform:translateY(-9px)} 45%{transform:translateY(0)} 60%{transform:translateY(-4px)} 75%{transform:translateY(0)} }
        .av-bounce { animation:av-bounce-kf 1.8s ease-in-out infinite; }
        .av-bounce:hover { animation-play-state:paused; transform:scale(1.04); transition:transform .2s ease; }
        @keyframes av-toast-in { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes av-toast-out { from{opacity:1} to{opacity:0;transform:translateX(-20px)} }
        .av-toast-in { animation:av-toast-in .4s cubic-bezier(.22,1,.36,1) both; }
        .av-toast-out { animation:av-toast-out .35s ease-in both; }
        @media (prefers-reduced-motion: reduce){ .av-reveal,.av-marquee,.av-animated-bg,.av-bounce,.av-grad-sky,.av-grad-indigo,.av-grad-cyan,.av-grad-mix{animation:none;opacity:1;transform:none} }
      `}</style>

      {/* Barre défilante haut */}
      <div className="sticky top-0 z-40 bg-indigo-950">
        <Marquee items={[
          'Crème Anti-Verrues', `1 boîte ${fmtPack(1)} F`, `2 boîtes ${fmtPack(2)} F`, `3 boîtes ${fmtPack(3)} F`,
          'Paiement à la livraison', 'Sans douleur · Sans cicatrice',
        ]} />
      </div>

      {/* Hero compact (peu de texte) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-900 px-4 pt-8 pb-12 text-white">
        <div className="pointer-events-none absolute inset-0 av-animated-bg bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,.3),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(99,102,241,.3),transparent_45%)]" />
        <div className="relative z-10 mx-auto max-w-[560px] text-center">
          <span className="inline-block rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-black uppercase text-indigo-950">🔥 Promo du jour</span>
          <Countdown />
          <div className="mt-5 overflow-hidden rounded-[32px] shadow-2xl ring-2 ring-sky-300/40">
            <LazyImg src={IMAGES[0].src} alt="Crème anti-verrues" priority aspect="4/5" />
          </div>
          <h1 className="mt-6 text-[26px] font-black leading-tight sm:text-[34px]">
            <GradText v="cyan">{IMAGES[0].title}</GradText>
          </h1>
          <div className="mt-3 flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-white/35 line-through">{fmt(OLD_UNIT)} F</span>
            <span className="av-grad-cyan text-5xl font-black">{fmt(orderTotal(PRICES, 1))}</span>
            <span className="text-lg font-bold">FCFA</span>
          </div>
          <div className="mt-6 flex justify-center"><BounceCTA tone="cyan" onClick={() => openModal()}>Commander</BounceCTA></div>
        </div>
      </section>

      {/* GALERIE principale (images locales) */}
      {IMAGES.slice(1).map((img, i) => (
        <section key={`main-${i}`} className={`av-cv relative overflow-hidden px-4 py-12 sm:py-14 bg-gradient-to-br ${img.bg}`}>
          <div className="pointer-events-none absolute inset-0 av-animated-bg bg-[radial-gradient(ellipse_at_20%_10%,rgba(56,189,248,.22),transparent_55%),radial-gradient(ellipse_at_90%_90%,rgba(99,102,241,.22),transparent_50%)]" />
          <Reveal className="relative z-10 mx-auto max-w-[560px]">
            <div className="overflow-hidden rounded-[28px] shadow-2xl ring-2 ring-white/50">
              <LazyImg src={img.src} alt={`Crème anti-verrues ${i + 1}`} aspect="4/5" />
            </div>
            <p className="mt-5 text-center text-[20px] font-black leading-snug sm:text-[24px]">
              <GradText v={img.tone}>{img.title}</GradText>
            </p>
            <div className="mt-5 flex justify-center"><BounceCTA tone={img.tone} onClick={() => openModal()}>Commander</BounceCTA></div>
          </Reveal>
          {i === 1 && (
            <div className="relative z-10 mx-auto mt-10 max-w-[560px]">
              <Marquee items={['✓ Résultats visibles', '✓ Sans cicatrice', '✓ 100% botanique', '✓ Paiement à la livraison']} />
            </div>
          )}
        </section>
      ))}

      {/* Suite verrue-tk (ajout en bas — new-6.webp + vidéos) */}
      {EXTRA_BLOCKS.map((block, i) => (
        <section key={`extra-${i}`} className={`av-cv relative overflow-hidden px-4 py-12 sm:py-14 bg-gradient-to-br ${block.bg}`}>
          <div className="pointer-events-none absolute inset-0 av-animated-bg bg-[radial-gradient(ellipse_at_20%_10%,rgba(56,189,248,.22),transparent_55%),radial-gradient(ellipse_at_90%_90%,rgba(99,102,241,.22),transparent_50%)]" />
          <Reveal className="relative z-10 mx-auto max-w-[560px]">
            <div className="overflow-hidden rounded-[28px] shadow-2xl ring-2 ring-white/50">
              <BlockMedia block={block} alt={`Crème anti-verrues suite ${i + 1}`} />
            </div>
            <p className="mt-5 text-center text-[20px] font-black leading-snug sm:text-[24px]">
              <GradText v={block.tone}>{block.title}</GradText>
            </p>
            <div className="mt-5 flex justify-center"><BounceCTA tone={block.tone} onClick={() => openModal()}>Commander</BounceCTA></div>
          </Reveal>
        </section>
      ))}

      {/* Avis (court) */}
      <section className="bg-gradient-to-b from-indigo-50/50 via-white to-sky-50/40 px-4 py-12">
        <Reveal className="mx-auto max-w-[560px] text-center">
          <p className="av-grad-cyan text-[40px] font-black leading-none">4,9 ★</p>
          <p className="text-[12px] font-bold uppercase tracking-widest text-neutral-500">+ 600 avis clients vérifiés</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[{ t: 'En 10 jours, verrue partie !', n: 'Aïcha · Cocody' }, { t: 'Plus de douleur au pied 🙏', n: 'Koffi · Yopougon' }, { t: 'Simple et efficace ❤️', n: 'Mariam · Marcory' }].map((r, i) => (
              <div key={i} className="rounded-2xl border border-sky-100 bg-white p-3 text-left shadow-sm">
                <div className="text-amber-400 text-sm">★★★★★</div>
                <p className="mt-1 text-[13px] font-semibold text-neutral-700">{r.t}</p>
                <p className="mt-1 text-[11px] font-bold text-sky-600">{r.n}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Packs */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-900 to-cyan-900 px-4 py-12 text-white">
        <div className="pointer-events-none absolute inset-0 av-animated-bg bg-[radial-gradient(circle_at_20%_50%,rgba(34,211,238,.18),transparent_40%)]" />
        <Reveal className="relative z-10 mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black">Choisissez votre <GradText v="cyan">pack</GradText></h2>
          <div className="mt-6 space-y-3">
            {QTY_OPTS.map((o) => (
              <button key={o.v} type="button" onClick={() => { setSelectedPack(o.v); track('SelectPack', orderTotal(PRICES, o.v)); }}
                className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${selectedPack === o.v ? 'scale-[1.02] border-cyan-400 bg-white/10 shadow-[0_0_28px_-6px_rgba(34,211,238,.5)]' : 'border-white/15 bg-white/5 hover:border-sky-400/50'}`}>
                {o.tag && <span className={`absolute -top-2.5 right-4 rounded-full px-3 py-0.5 text-[9px] font-black uppercase ${selectedPack === o.v ? 'bg-cyan-400 text-indigo-950' : 'bg-white/20 text-white'}`}>{o.tag}</span>}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black">{o.label}</p>
                    {o.save && <p className="text-[11px] font-semibold text-cyan-300">{o.save}</p>}
                  </div>
                  <p className="av-grad-cyan text-[22px] font-black">{o.sub}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-center"><BounceCTA tone="cyan" onClick={() => openModal()}>Commander · {fmt(orderTotal(PRICES, selectedPack))} F</BounceCTA></div>
        </Reveal>
      </section>

      {/* Toast preuve sociale */}
      {toast && !modal && (
        <div className={`pointer-events-none fixed bottom-24 left-3 z-40 max-w-[300px] sm:bottom-8 ${toast.visible ? 'av-toast-in' : 'av-toast-out'}`}>
          <div className="flex items-center gap-2.5 rounded-xl border border-sky-300/40 bg-indigo-950 px-3.5 py-3 shadow-lg">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 text-[12px] font-black text-white">{toast.n[0]}</span>
            <div className="min-w-0 flex-1 text-[11px] leading-tight text-white">
              <span className="font-black text-sky-300">{toast.n}</span> · {toast.v}<br />
              <span className="text-neutral-300">a commandé </span><span className="font-bold text-cyan-300">{toast.q}</span> · il y a {toast.t}
            </div>
          </div>
        </div>
      )}

      {/* Barre fixe bas */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-sky-400/30 bg-indigo-950 px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <div className="pointer-events-none min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-cyan-400">🔥 Promo · <Countdown compact /></p>
            <p className="text-[18px] font-black text-white">{fmt(orderTotal(PRICES, 1))} F <span className="text-[12px] line-through text-white/35">{fmt(OLD_UNIT)} F</span></p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="pointer-events-auto shrink-0 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 px-5 py-3.5 text-[12px] font-black uppercase text-white shadow-lg">
            Commander
          </button>
        </div>
      </div>

      <OrderModalDispatcher slug={SLUG} open={modal} onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: CONTENT_NAME,
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          secondaryMetaPixelId: META_PIXEL_ID_2,
          slug: SLUG,
          company,
          navigate,
          images: { hero: M('hero.webp'), avant: M('gallery-2.webp'), apres: M('gallery-3.webp') },
        }}
        product={product} setProduct={setProduct} qtyOptions={QTY_OPTS} initialQty={qty} />

      <footer className="bg-indigo-950 px-4 pb-8 pt-8 text-center text-white">
        <p className="text-[15px] font-black"><GradText v="mix">Crème Anti-Verrues</GradText></p>
        <p className="mt-4 text-[10px] text-sky-500">© {new Date().getFullYear()} · Côte d&apos;Ivoire · Paiement à la livraison</p>
      </footer>
    </div>
  );
}
