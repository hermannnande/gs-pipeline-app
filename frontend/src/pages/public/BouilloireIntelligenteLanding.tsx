/**
 * Tunnel premium — Bouilloire Électrique Intelligente à température réglable.
 * Slug : bouilloire-intelligente
 * Palette : turquoise · jaune · bordeaux — dégradés fluides.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'bouilloire-intelligente';
const PRODUCT_CODE = 'BOUILLOIRE_INTELLIGENTE';
const CONTENT_NAME = 'Bouilloire Électrique Intelligente';
const THANK_YOU_URL = '/bouilloire-intelligente/merci';
const META_PIXEL_ID = '1333239138939400';

const PRICES: Record<number, number> = { 1: 8500, 2: 16000, 3: 21000 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const fmtPack = (v: number) => packLabel(PRICES, v, 'F').replace(' F', '');
const QTY_OPTS = [
  { v: 1, label: '1 bouilloire', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 bouilloires', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi', save: 'Économisez 1 000 F' },
  { v: 3, label: '3 bouilloires', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 4 500 F' },
];

const CACHE = '20260626perf';
const M = (n: string) => `/bouilloire-intelligente/${n}?v=${CACHE}`;

/** Médias locaux WebP + MP4 (same-origin, déployés sur le VPS). */
const MEDIA = {
  hero: M('hero.webp'),
  m1: M('m1.webp'),
  m2: M('m2.webp'),
  m3: M('m3.webp'),
  v1: M('v1.mp4'),
  v2: M('v2.mp4'),
  v3: M('v3.mp4'),
  v4: M('v4.mp4'),
};

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: any; _fbq?: any; dataLayer?: any[] } }

/** Injecte le pixel Meta (base fbevents) + init + PageView. Idempotent. */
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

function track(event: string, data: Record<string, unknown> = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
    if (typeof window.fbq === 'function') {
      const payload = { content_name: CONTENT_NAME, content_ids: [PRODUCT_CODE], content_type: 'product', value: data.value as number, currency: 'XOF' };
      if (event === 'ViewContent') window.fbq('track', 'ViewContent', payload);
      else if (event === 'OpenForm') window.fbq('track', 'InitiateCheckout', payload);
      else if (event === 'SelectPack') window.fbq('track', 'AddToCart', payload);
    }
  } catch { /* noop */ }
}

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

function useOnScreen(rootMargin = '320px') {
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
  return (
    <div ref={ref} className={`bol-reveal ${shown ? 'bol-reveal-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function LazyImg({ src, alt, priority, aspect, className = '', sizes = '560px' }: {
  src: string; alt: string; priority?: boolean; aspect?: string; className?: string; sizes?: string;
}) {
  const { ref, visible } = useOnScreen(priority ? '0px' : '280px');
  const frame = aspect ? { aspectRatio: aspect } : undefined;
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`} style={frame}>
        {/* @ts-expect-error fetchpriority */}
        <img src={src} alt={alt} width={720} height={900} loading="eager" decoding="async" fetchpriority="high" sizes={sizes} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={frame}>
      {visible
        ? <img src={src} alt={alt} width={720} height={900} loading="lazy" decoding="async" sizes={sizes} className="h-full w-full object-cover" />
        : <div className="h-full min-h-[280px] w-full bg-gradient-to-br from-teal-200/80 via-amber-100/80 to-rose-200/80" style={frame} aria-hidden />}
    </div>
  );
}

type CtaTone = 'turquoise' | 'yellow' | 'bordeaux' | 'rainbow';
const CTA_TONES: Record<CtaTone, string> = {
  turquoise: 'from-teal-400 via-cyan-400 to-teal-600 text-white ring-teal-200/50',
  yellow: 'from-amber-300 via-yellow-400 to-amber-500 text-neutral-900 ring-amber-200/70',
  bordeaux: 'from-rose-700 via-red-800 to-rose-950 text-amber-100 ring-rose-300/40',
  rainbow: 'from-teal-500 via-amber-400 to-rose-700 text-white ring-teal-200/40',
};

function CTA({ onClick, children, tone = 'rainbow', className = '' }: { onClick: () => void; children: ReactNode; tone?: CtaTone; className?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`bol-cta group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${CTA_TONES[tone]} px-6 py-4 text-[14px] font-black uppercase tracking-[0.12em] ring-2 shadow-lg transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] ${className}`}>
      <span className="bol-shine pointer-events-none absolute inset-0" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

/** Vidéo portrait : poster immédiat, src chargé uniquement à l'entrée viewport. */
function LazyPortraitVideo({ src, poster }: { src: string; poster: string }) {
  const { ref, visible } = useOnScreen('180px');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!visible || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  }, [visible]);

  return (
    <div ref={ref} className="mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden bg-teal-100">
      {visible ? (
        <video
          ref={videoRef}
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
        <img src={poster} alt="" width={360} height={640} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

function CountdownDisplay({ compact = false }: { compact?: boolean }) {
  const [cd, setCd] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - Date.now());
      setCd({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (compact) {
    return <span className="tabular-nums">{pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}</span>;
  }

  return (
    <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-amber-300/30">
      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Fin de l&apos;offre</span>
      {[{ v: cd.h, l: 'h' }, { v: cd.m, l: 'm' }, { v: cd.s, l: 's' }].map(({ v, l }, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-amber-300/60">:</span>}
          <span className="flex min-w-[2.4rem] flex-col items-center rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-2 py-1 text-neutral-900 shadow-md">
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
    <div className="overflow-hidden border-y border-teal-400/25 bg-gradient-to-r from-teal-600 via-amber-500 to-rose-800 py-2.5 text-white">
      <div className="bol-marquee flex gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.22em]">
        {c.map((t, i) => (<span key={i} className="inline-flex items-center gap-3">{t}<span className="text-amber-200/80">◆</span></span>))}
      </div>
    </div>
  );
}

type GradVariant = 'turquoise' | 'yellow' | 'bordeaux' | 'mixed';

function GradText({ children, variant = 'mixed' }: { children: ReactNode; variant?: GradVariant }) {
  const cls = variant === 'turquoise' ? 'bol-grad-tq' : variant === 'yellow' ? 'bol-grad-yel' : variant === 'bordeaux' ? 'bol-grad-bdx' : 'bol-grad-mix';
  return <span className={cls}>{children}</span>;
}

/** Bloc média + texte dégradé court + CTA */
function MediaBlock({
  bg, children, caption, captionGrad = 'mixed', ctaLabel, ctaTone = 'rainbow', onCta,
}: {
  bg: string; children: ReactNode; caption: ReactNode; captionGrad?: GradVariant;
  ctaLabel: string; ctaTone?: CtaTone; onCta: () => void;
}) {
  return (
    <section className={`bol-cv relative overflow-hidden px-4 py-12 sm:py-16 ${bg}`}>
      <Reveal className="relative z-10 mx-auto max-w-[560px]">
        <div className="overflow-hidden rounded-[28px] shadow-2xl ring-2 ring-white/30">
          {children}
        </div>
        <p className="bol-caption mt-6 text-center text-[17px] font-black leading-snug sm:text-[20px]">
          <GradText variant={captionGrad}>{caption}</GradText>
        </p>
        <div className="mx-auto mt-5 max-w-sm"><CTA tone={ctaTone} onClick={onCta}>{ctaLabel}</CTA></div>
      </Reveal>
    </section>
  );
}

const BENEFITS = [
  { i: '🌡️', t: 'Température réglable', s: 'De 40°C à 100°C — thé, café, bébé, tisane.' },
  { i: '⚡', t: 'Chauffe ultra-rapide', s: 'Eau bouillante en quelques minutes seulement.' },
  { i: '🔒', t: 'Arrêt automatique', s: 'Sécurité totale : plus de risque d\'oubli sur le feu.' },
  { i: '💧', t: 'Inox premium', s: 'Sans BPA, facile à nettoyer, goût pur garanti.' },
  { i: '☕', t: 'Multi-usages', s: 'Cuisine, bureau, chambre — partout où vous voulez.' },
  { i: '🎁', t: 'Idée cadeau', s: 'Pratique, moderne, appréciée par toute la famille.' },
];

const REVIEWS = [
  { t: 'Je règle 80°C pour mon thé vert — enfin la bonne température ! Ma bouilloire classique brûlait tout.', n: 'Aïcha M.', v: 'Cocody' },
  { t: 'Chauffe très vite le matin avant le boulot. Le design est élégant, ça fait pro dans ma cuisine.', n: 'Koffi B.', v: 'Yopougon' },
  { t: 'Pour le biberon de bébé à 40°C c\'est parfait. Livraison rapide, paiement à la livraison rassurant.', n: 'Mariam S.', v: 'Marcory' },
  { t: 'J\'en ai commandé deux — une pour la maison, une pour le bureau. Qualité au-dessus de ce que j\'attendais.', n: 'Serge N.', v: 'Plateau' },
];

export default function BouilloireIntelligenteLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [toast, setToast] = useState<{ n: string; v: string; q: string; t: string; visible: boolean } | null>(null);
  const toastIdx = useRef(0);

  const NOTIFS = useMemo(() => [
    { n: 'Aïcha M.', v: 'Cocody', q: '1 bouilloire', t: '3 min' },
    { n: 'Koffi B.', v: 'Yopougon', q: '2 bouilloires', t: '6 min' },
    { n: 'Mariam S.', v: 'Marcory', q: '1 bouilloire', t: '9 min' },
    { n: 'Serge N.', v: 'Plateau', q: '3 bouilloires', t: '14 min' },
    { n: 'Fatou K.', v: 'Abobo', q: '2 bouilloires', t: '18 min' },
  ], []);

  const openModal = useCallback((q?: number) => {
    const pack = q || selectedPack || 1;
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, [selectedPack]);

  useEffect(() => {
    document.title = 'Bouilloire Intelligente — Température réglable · Promo';
    initMetaPixel(META_PIXEL_ID);
    trackPageView(SLUG, company);
    track('ViewContent', { product: PRODUCT_CODE, value: orderTotal(PRICES, 1), currency: 'XOF' });

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = MEDIA.hero;
    link.type = 'image/webp';
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [company]);

  useEffect(() => {
    const load = () => {
      axios.get(`${API_URL}/public/products`, { params: { company } })
        .then(({ data }) => setProduct((data?.products || []).find((x: Product) => x.code === PRODUCT_CODE) || null))
        .catch(() => {});
    };
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(load, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(load, 1200);
    return () => clearTimeout(t);
  }, [company]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      const item = NOTIFS[toastIdx.current % NOTIFS.length];
      toastIdx.current++;
      setToast({ ...item, visible: true });
      setTimeout(() => setToast((p) => (p ? { ...p, visible: false } : null)), 4500);
      setTimeout(() => setToast(null), 4900);
      timer = setTimeout(show, 11000 + Math.random() * 7000);
    };
    timer = setTimeout(show, 5000);
    return () => clearTimeout(timer);
  }, [NOTIFS]);

  const orderCfg = useMemo(() => ({
    slug: SLUG, productCode: PRODUCT_CODE, thankYouUrl: THANK_YOU_URL, company, prices: PRICES,
    title: 'Bouilloire Électrique Intelligente', images: { hero: MEDIA.hero },
    metaPixelId: META_PIXEL_ID,
  }), [company]);

  const faqs = [
    { q: 'Quelles températures puis-je régler ?', a: 'De 40°C (biberon, tisanes délicates) à 100°C (eau bouillante). Chaque boisson à sa température idéale pour préserver arômes et nutriments.' },
    { q: 'Est-ce sécurisé ?', a: 'Oui : arrêt automatique, protection surchauffe et châssis isolant. Conçue pour un usage quotidien en toute tranquillité.' },
    { q: 'Paiement et livraison ?', a: 'Paiement uniquement à la livraison. Livraison rapide à Abidjan et dans les principales villes de Côte d\'Ivoire.' },
  ];

  const OLD_UNIT = 15000;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/80 via-white to-rose-50/30 pb-28">
      <style>{`
        .bol-grad-tq { background: linear-gradient(120deg,#14b8a6,#2dd4bf,#06b6d4,#14b8a6); background-size:220% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation: bol-pan 5s linear infinite; }
        .bol-grad-yel { background: linear-gradient(120deg,#fbbf24,#f59e0b,#fcd34d,#fbbf24); background-size:220% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation: bol-pan 4.5s linear infinite; }
        .bol-grad-bdx { background: linear-gradient(120deg,#be123c,#881337,#9f1239,#be123c); background-size:220% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation: bol-pan 5.5s linear infinite; }
        .bol-grad-mix { background: linear-gradient(120deg,#14b8a6,#fbbf24,#be123c,#2dd4bf,#f59e0b); background-size:300% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation: bol-pan 6s linear infinite; }
        @keyframes bol-pan { to { background-position:300% center; } }
        @keyframes bol-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .bol-marquee { animation: bol-marquee 24s linear infinite; }
        .bol-cv { content-visibility: auto; contain-intrinsic-size: auto 520px; }
        .bol-reveal { opacity:0; transform:translateY(16px); transition: opacity .5s ease, transform .5s ease; }
        .bol-reveal-in { opacity:1; transform:translateY(0); }
        @media (prefers-reduced-motion: reduce) { .bol-reveal,.bol-marquee,.bol-grad-tq,.bol-grad-yel,.bol-grad-bdx,.bol-grad-mix{animation:none;opacity:1;transform:none} }
        .bol-shine { background: linear-gradient(110deg, transparent 18%, rgba(255,255,255,.45) 45%, transparent 72%); transform: translateX(-130%); }
        .bol-cta:hover .bol-shine { transform: translateX(130%); transition: transform .85s ease; }
        @keyframes bol-toast-in { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes bol-toast-out { from{opacity:1} to{opacity:0;transform:translateX(-20px)} }
        .bol-toast-in { animation: bol-toast-in .4s cubic-bezier(.22,1,.36,1) both; }
        .bol-toast-out { animation: bol-toast-out .35s ease-in both; }
      `}</style>

      <div className="sticky top-0 z-40 bg-teal-950">
        <Marquee items={[
          'Bouilloire Intelligente', `1 unité ${fmtPack(1)} Fr`, `2 unités ${fmtPack(2)} Fr`, `3 unités ${fmtPack(3)} Fr`,
          'Température réglable 40–100°C', 'Paiement à la livraison',
        ]} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-rose-950 px-4 pt-8 pb-14 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(45,212,191,.25),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(190,18,60,.2),transparent_45%),radial-gradient(ellipse_at_60%_40%,rgba(251,191,36,.12),transparent_40%)]" />
        <div className="relative z-10 mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-teal-400/20 px-3 py-1 text-[10px] font-black uppercase text-teal-100 ring-1 ring-teal-300/40">🌡️ Température réglable</span>
            <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase text-neutral-900">🔥 Promo du jour</span>
          </div>

          <CountdownDisplay />

          <div className="mt-6 overflow-hidden rounded-[32px] shadow-2xl ring-2 ring-teal-300/40">
            <LazyImg src={MEDIA.hero} alt="Bouilloire électrique intelligente" priority aspect="4/5" />
          </div>

          <h1 className="mt-7 text-[28px] font-black leading-tight sm:text-[36px]">
            L&apos;eau parfaite, <GradText variant="yellow">à chaque degré</GradText>
          </h1>
          <p className="mt-3 text-[14px] text-teal-100/85">
            Bouilloire intelligente · 40°C à 100°C · Chauffe rapide · Arrêt auto · Inox premium
          </p>

          <div className="mt-4 flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-white/35 line-through">{fmt(OLD_UNIT + DELIVERY_FEE_CI)} F</span>
            <span className="bol-grad-yel text-5xl font-black sm:text-6xl">{fmt(orderTotal(PRICES, 1))}</span>
            <span className="text-lg font-bold">FCFA</span>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><CTA tone="yellow" onClick={() => openModal()}>☕ Commander ma bouilloire</CTA></div>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] font-bold text-teal-100/80">
            {['💵 Paiement à la livraison', '⚡ Chauffe en minutes', '🌡️ 40–100°C', '⏳ Stock limité'].map((b) => (
              <span key={b} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <MediaBlock
        bg="bg-gradient-to-br from-teal-100 via-cyan-50 to-teal-200/60"
        caption="Regardez-la en action — chauffe ultra-rapide, écran digital précis, zéro effort."
        captionGrad="turquoise"
        ctaLabel="Je veux la tester"
        ctaTone="turquoise"
        onCta={() => openModal()}
      >
        <LazyPortraitVideo src={MEDIA.v1} poster={MEDIA.hero} />
      </MediaBlock>

      <MediaBlock
        bg="bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200/50"
        caption="Un clic, la température idéale — thé vert, café, tisane ou biberon à 40°C."
        captionGrad="yellow"
        ctaLabel="Commander maintenant"
        ctaTone="yellow"
        onCta={() => openModal()}
      >
        <LazyPortraitVideo src={MEDIA.v2} poster={MEDIA.m2} />
      </MediaBlock>

      <MediaBlock
        bg="bg-gradient-to-br from-rose-100 via-rose-50 to-teal-100/40"
        caption="Votre cuisine devient un espace moderne — pratique, élégante, au quotidien."
        captionGrad="bordeaux"
        ctaLabel="Adopter la bouilloire smart"
        ctaTone="bordeaux"
        onCta={() => openModal()}
      >
        <LazyImg src={MEDIA.m1} alt="Femme utilisant la bouilloire en cuisine" aspect="4/5" />
      </MediaBlock>

      <MediaBlock
        bg="bg-gradient-to-br from-teal-50 via-white to-amber-50"
        caption="Design premium inox — compacte, robuste, belle sur votre plan de travail."
        captionGrad="mixed"
        ctaLabel="Profiter de l'offre"
        ctaTone="rainbow"
        onCta={() => openModal()}
      >
        <LazyImg src={MEDIA.m2} alt="Bouilloire intelligente design premium" aspect="4/5" />
      </MediaBlock>

      <MediaBlock
        bg="bg-gradient-to-br from-rose-900/10 via-rose-50 to-amber-100/60"
        caption="Écran digital + réglage précis — fini l'eau trop chaude qui gâche vos boissons."
        captionGrad="bordeaux"
        ctaLabel="Choisir ma température"
        ctaTone="rainbow"
        onCta={() => openModal()}
      >
        <LazyImg src={MEDIA.m3} alt="Réglage température bouilloire intelligente" aspect="4/5" />
      </MediaBlock>

      <MediaBlock
        bg="bg-gradient-to-br from-cyan-100 via-teal-100 to-rose-100/50"
        caption="La preuve en vidéo — qualité, rapidité et sécurité qui convainquent dès la 1ère utilisation."
        captionGrad="turquoise"
        ctaLabel="Commander avant rupture"
        ctaTone="turquoise"
        onCta={() => openModal()}
      >
        <LazyPortraitVideo src={MEDIA.v3} poster={MEDIA.m3} />
      </MediaBlock>

      <MediaBlock
        bg="bg-gradient-to-br from-amber-200/40 via-yellow-100 to-teal-100/50"
        caption="Offre limitée ce soir — ne repassez plus une seule matinée sans eau à la bonne température."
        captionGrad="yellow"
        ctaLabel="🔥 Je commande tout de suite"
        ctaTone="yellow"
        onCta={() => openModal()}
      >
        <LazyPortraitVideo src={MEDIA.v4} poster={MEDIA.hero} />
      </MediaBlock>

      {/* Avantages */}
      <section className="bg-gradient-to-b from-white via-teal-50/30 to-amber-50/40 px-4 py-14">
        <Reveal className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-neutral-900">Pourquoi cette <GradText variant="turquoise">bouilloire</GradText> ?</h2>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {BENEFITS.map((b) => (
              <div key={b.t} className="h-full rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/50 p-4 shadow-sm">
                  <div className="text-2xl">{b.i}</div>
                  <p className="mt-1 text-[13px] font-black text-neutral-900">{b.t}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{b.s}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal()}>Commander maintenant</CTA></div>
        </Reveal>
      </section>

      {/* Avis */}
      <section className="bg-gradient-to-b from-rose-50/50 via-white to-teal-50/40 px-4 py-14">
        <Reveal className="mx-auto max-w-[560px]">
          <div className="text-center">
            <p className="bol-grad-yel text-[44px] font-black leading-none">4,9</p>
            <p className="mt-1 text-[15px] tracking-wide text-amber-500">★★★★★</p>
            <p className="text-[12px] font-bold uppercase tracking-widest text-neutral-500">412 avis clients vérifiés</p>
          </div>
          <div className="mt-6 space-y-3">
            {REVIEWS.map((r, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 text-amber-400">★★★★★</div>
                  <p className="text-[13px] leading-relaxed text-neutral-700">&ldquo;{r.t}&rdquo;</p>
                  <p className="mt-2 text-[11px] font-bold text-teal-600">{r.n} · {r.v} ✓ Achat vérifié</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA tone="bordeaux" onClick={() => openModal()}>Rejoindre les clients satisfaits</CTA></div>
        </Reveal>
      </section>

      {/* Packs */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-950 via-rose-950 to-teal-900 px-4 py-14 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(251,191,36,.15),transparent_40%)]" />
        <Reveal className="relative z-10 mx-auto max-w-[560px]">
          <h2 className="text-center text-[26px] font-black">Choisissez votre <GradText variant="yellow">pack</GradText></h2>
          <p className="mt-2 text-center text-[12px] text-teal-200/70">⏱ Promo encore <CountdownDisplay compact /></p>
          <div className="mt-7 space-y-3">
            {QTY_OPTS.map((o) => (
              <button key={o.v} type="button" onClick={() => { setSelectedPack(o.v); track('SelectPack', { pack: o.v, value: orderTotal(PRICES, o.v) }); }}
                className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${selectedPack === o.v ? 'scale-[1.02] border-amber-400 bg-white/10 shadow-[0_0_28px_-6px_rgba(251,191,36,.45)]' : 'border-white/15 bg-white/5 hover:border-teal-400/50'}`}>
                {o.tag && <span className={`absolute -top-2.5 right-4 rounded-full px-3 py-0.5 text-[9px] font-black uppercase ${selectedPack === o.v ? 'bg-amber-400 text-neutral-900' : 'bg-white/20 text-white'}`}>{o.tag}</span>}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black">{o.label}</p>
                    {o.save && <p className="text-[11px] font-semibold text-teal-300">{o.save}</p>}
                  </div>
                  <p className="bol-grad-yel text-[22px] font-black">{o.sub}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA tone="yellow" onClick={() => openModal()}>Commander · {fmt(orderTotal(PRICES, selectedPack))} F</CTA></div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12">
        <Reveal className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[20px] font-black">Questions <GradText variant="mixed">fréquentes</GradText></h2>
          <div className="mt-5 space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-teal-100 bg-white">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[13px] font-bold text-neutral-800">
                  {f.q}<span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden"><p className="border-t border-teal-50 px-4 py-3 text-[12px] leading-relaxed text-neutral-500">{f.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Toast social proof */}
      {toast && !modal && (
        <div className={`pointer-events-none fixed bottom-24 left-3 z-40 max-w-[300px] sm:bottom-8 ${toast.visible ? 'bol-toast-in' : 'bol-toast-out'}`}>
          <div className="flex items-center gap-2.5 rounded-xl border border-teal-300/40 bg-teal-950 px-3.5 py-3 shadow-lg">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-amber-400 text-[12px] font-black text-white">{toast.n[0]}</span>
            <div className="min-w-0 flex-1 text-[11px] leading-tight text-white">
              <span className="font-black text-teal-300">{toast.n}</span> · {toast.v}<br />
              <span className="text-neutral-300">a commandé </span><span className="font-bold text-amber-300">{toast.q}</span> · il y a {toast.t}
            </div>
          </div>
        </div>
      )}

      {/* Barre fixe */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-teal-400/30 bg-teal-950 px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <div className="pointer-events-none min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-amber-400">🔥 Promo · <CountdownDisplay compact /></p>
            <p className="text-[18px] font-black text-white">{fmt(orderTotal(PRICES, 1))} F <span className="text-[12px] line-through text-white/35">{fmt(OLD_UNIT)} F</span></p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="pointer-events-auto shrink-0 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-5 py-3.5 text-[12px] font-black uppercase text-neutral-900 shadow-lg">
            Commander
          </button>
        </div>
      </div>

      <OrderModalDispatcher slug={SLUG} open={modal} onClose={() => setModal(false)}
        cfg={orderCfg} product={product} setProduct={setProduct} qtyOptions={QTY_OPTS} initialQty={qty} />

      <footer className="bg-teal-950 px-4 pb-8 pt-8 text-center text-white">
        <p className="text-[15px] font-black"><GradText variant="mixed">Bouilloire Électrique Intelligente</GradText></p>
        <p className="mt-4 text-[10px] text-teal-500">© {new Date().getFullYear()} · Côte d&apos;Ivoire · Paiement à la livraison</p>
      </footer>
    </div>
  );
}
