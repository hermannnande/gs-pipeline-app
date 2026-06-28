/**
 * Tunnel premium — Chaussettes chauffantes tourmaline (CHAUSSETTE_CHAUFFANTE).
 * Slug : chaussette · Pixel Meta : 1587475759254518
 *
 * Palette : orange + ambre + or + blanc chaud (minceur / bien-être).
 * Prix : 7 000 / 12 000 / 15 000 FCFA
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'chaussette';
const PRODUCT_CODE = 'CHAUSSETTE_CHAUFFANTE';
const CONTENT_NAME = 'Chaussettes chauffantes tourmaline';
const META_PIXEL_ID = '1587475759254518';
const THANK_YOU_URL = '/chaussette/merci';

const PRICES: Record<number, number> = { 1: 7000, 2: 12000, 3: 15000 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 paire',  sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 paires', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi', save: 'Économisez 2 000 F' },
  { v: 3, label: '3 paires', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 6 000 F' },
];

const M = (n: string) => `/chaussette/${n}.webp`;
const MEDIA = {
  heroPoster: M('hero'),
  heroVideo: '/chaussette/hero.mp4',
  m1: M('m1'), m2: M('m2'), m3: M('m3'), m4: M('m4'), m5: M('m5'),
  ba1b: M('ba1-before'), ba1a: M('ba1-after'),
  ba2b: M('ba2-before'), ba2a: M('ba2-after'),
  ba3b: M('ba3-before'), ba3a: M('ba3-after'),
};

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: any; _fbq?: any; dataLayer?: any[] } }

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
      const payload = {
        content_name: (data.content_name as string) || CONTENT_NAME,
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: data.value as number | undefined,
        currency: (data.currency as string) || 'XOF',
      };
      if (event === 'ViewContent') window.fbq('track', 'ViewContent', payload);
      else if (event === 'OpenForm') window.fbq('track', 'InitiateCheckout', payload);
      else if (event === 'SelectPack') window.fbq('track', 'AddToCart', payload);
      else window.fbq('trackCustom', event, data);
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
        : <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-50" />}
    </div>
  );
}

const CTA_TONES: Record<string, string> = {
  primary: 'from-amber-400 via-orange-500 to-red-500 text-white ring-amber-200/60',
  gold:    'from-yellow-300 via-amber-400 to-orange-500 text-neutral-900 ring-yellow-200/70',
  dark:    'from-orange-900 via-red-900 to-neutral-900 text-amber-100 ring-orange-400/30',
};
function CTA({ onClick, children, tone = 'primary', className = '' }: { onClick: () => void; children: ReactNode; tone?: keyof typeof CTA_TONES; className?: string }) {
  const cls = CTA_TONES[tone] || CTA_TONES.primary;
  return (
    <button type="button" onClick={onClick}
      className={`cch-cta cch-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.16em] shadow-[0_18px_44px_-12px_rgba(249,115,22,.55)] ring-2 transition hover:scale-[1.02] sm:text-[15px] ${className}`}>
      <span className="cch-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items, tone = 'warm' }: { items: string[]; tone?: 'warm' | 'gold' | 'dark' }) {
  const cls = tone === 'gold'
    ? 'border-amber-200/60 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 text-orange-900'
    : tone === 'dark'
      ? 'border-orange-400/30 bg-gradient-to-r from-orange-900 via-red-900 to-orange-950 text-amber-100'
      : 'border-orange-200/40 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white';
  const content = [...items, ...items, ...items];
  return (
    <div className={`relative overflow-hidden border-y py-2.5 ${cls}`}>
      <div className="cch-marquee flex items-center gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.24em] sm:text-[12px]">
        {content.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span>{t}</span><span className="opacity-50">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Block({ img, alt, eyebrow, title, sub, ctaLabel, onCta, tone = 'white', highlight }: {
  img: string; alt: string; eyebrow?: string; title: string; sub?: string;
  ctaLabel: string; onCta: () => void; tone?: 'white' | 'warm' | 'gold';
  highlight?: string;
}) {
  const toneBg: Record<string, string> = {
    white: 'bg-gradient-to-b from-white to-orange-50/40 text-neutral-900',
    warm:  'bg-gradient-to-b from-orange-50 to-amber-50 text-neutral-900',
    gold:  'bg-gradient-to-b from-amber-50 to-yellow-50 text-neutral-900',
  };
  const renderTitle = () => {
    if (!highlight || !title.includes(highlight)) return title;
    const i = title.indexOf(highlight);
    return (<>{title.slice(0, i)}<span className="cch-grad">{highlight}</span>{title.slice(i + highlight.length)}</>);
  };
  return (
    <section className={`relative overflow-hidden px-4 py-10 sm:py-14 ${toneBg[tone]}`}>
      <div className="relative mx-auto w-full max-w-[560px]">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_-20px_rgba(234,88,12,.35)] ring-1 ring-amber-100">
          <LazyImg src={img} alt={alt} aspect="1 / 1" />
        </div>
        <div className="mt-5 px-1 text-center">
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-orange-700 ring-1 ring-orange-300/40">
              {eyebrow}
            </span>
          )}
          <h2 className="mt-3 text-balance text-[22px] font-black leading-[1.1] tracking-tight sm:text-[26px]">{renderTitle()}</h2>
          {sub && <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 sm:text-[14px]">{sub}</p>}
          <div className="mx-auto mt-5 max-w-sm"><CTA onClick={onCta}>{ctaLabel}</CTA></div>
        </div>
      </div>
    </section>
  );
}

const WA_MSGS = [
  { t: 'Franchement vos chaussettes tourmaline c\'est incroyable 😍 En 2 semaines mes pieds sont moins gonflés.', n: 'Aïcha', h: '20:47' },
  { t: 'Je les porte tous les soirs devant la télé, ça chauffe doucement les jambes, j\'adore 🧦✨', n: 'Mariam', h: '21:15' },
  { t: 'Avant j\'avais toujours les jambes lourdes le soir… maintenant c\'est beaucoup plus léger 🙏', n: 'Fatou', h: '18:02' },
  { t: 'Je dors avec et je me réveille sans douleur, j\'en parle à toutes mes collègues.', n: 'Grâce', h: '18:10' },
  { t: 'Je vois déjà que mes mollets ont dégonflé, mon jean tombe mieux qu\'avant 😍', n: 'Aminata', h: '09:27' },
  { t: 'Je travaille debout toute la journée, avec vos chaussettes j\'ai beaucoup moins de gonflement le soir 🧦', n: 'Kadi', h: '22:11' },
];

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

export default function ChaussetteChauffanteLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    const pack = q || selectedPack || 1;
    setQty(pack);
    setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, [selectedPack]);

  const choosePack = useCallback((p: number) => {
    setSelectedPack(p);
    track('SelectPack', { product: PRODUCT_CODE, pack: p, value: orderTotal(PRICES, p), currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Chaussettes chauffantes tourmaline — Offre spéciale';
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) initMetaPixel(META_PIXEL_ID);
    track('ViewContent', { product: PRODUCT_CODE, content_name: CONTENT_NAME, value: orderTotal(PRICES, 1), currency: 'XOF' });
  }, [company]);

  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then(({ data }) => {
        const p = (data?.products || []).find((x: Product) => x.code === PRODUCT_CODE);
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

  const orderCfg = useMemo(() => ({
    slug: SLUG,
    productCode: PRODUCT_CODE,
    thankYouUrl: THANK_YOU_URL,
    company,
    prices: PRICES,
    title: 'Chaussettes chauffantes tourmaline',
    metaPixelId: META_PIXEL_ID,
    images: { hero: MEDIA.heroPoster },
  }), [company]);

  const faqs = [
    { q: 'Comment porter les chaussettes chauffantes ?', a: 'Enfilez-les le soir ou la nuit, comme des chaussettes classiques. Portez-les 2 à 4 h par jour pour de meilleurs résultats.' },
    { q: 'Quand vais-je voir des résultats ?', a: 'La plupart de nos clientes ressentent des jambes plus légères dès la 1ère semaine. Les résultats visibles apparaissent en 2 à 4 semaines.' },
    { q: 'Est-ce que ça chauffe vraiment ?', a: 'Oui, la fibre tourmaline retient la chaleur naturelle du corps et diffuse une chaleur douce et agréable.' },
    { q: 'Paiement et livraison ?', a: 'Paiement à la livraison uniquement. Livraison rapide à Abidjan et dans les principales villes de Côte d\'Ivoire.' },
  ];

  return (
    <div className="cch-page min-h-screen bg-gradient-to-b from-[#fff8f0] via-white to-[#fff5eb] pb-28 text-neutral-900" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        .cch-grad { background: linear-gradient(135deg,#ea580c,#f59e0b,#eab308); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .cch-grad-strong { background: linear-gradient(135deg,#c2410c,#ea580c,#fbbf24); -webkit-background-clip: text; background-clip: text; color: transparent; }
        @keyframes cch-marquee { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }
        .cch-marquee { animation: cch-marquee 28s linear infinite; }
        @keyframes cch-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.015)} }
        .cch-pulse { animation: cch-pulse 2.8s ease-in-out infinite; }
        @keyframes cch-sheen { to { transform: translateX(200%) } }
        .cch-cta:hover .cch-sheen { animation: cch-sheen .7s ease forwards; }
      `}</style>

      {/* Sticky bar */}
      <div className="sticky top-0 z-40 border-b border-orange-200/50 bg-white/95 backdrop-blur-md">
        <Marquee tone="dark" items={[
          'Offre spéciale aujourd\'hui',
          `1 paire ${fmtTotal(1)} Fr`,
          `2 paires ${fmtTotal(2)} Fr`,
          `3 paires ${fmtTotal(3)} Fr`,
          'Paiement à la livraison',
          'Livraison 24h Abidjan',
          'Tourmaline chauffante',
        ]} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-8 pb-12 sm:pt-12 sm:pb-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-300/25 blur-[120px]" />
        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white">
              🔥 Best seller
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-800 ring-1 ring-amber-200">
              Promo · {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-neutral-950 shadow-[0_30px_80px_-20px_rgba(234,88,12,.45)] ring-1 ring-amber-200">
            <video src={MEDIA.heroVideo} poster={MEDIA.heroPoster} autoPlay loop muted playsInline
              className="aspect-square w-full object-cover" />
          </div>

          <h1 className="mt-7 text-balance text-center text-[30px] font-black leading-[1.05] tracking-tight sm:text-[40px]">
            Finis la <span className="cch-grad">graisse</span> en 14 jours avec les chaussettes chauffantes
          </h1>
          <p className="mt-3 text-center text-[14px] leading-relaxed text-neutral-600">
            🔥 Garde vos pieds au chaud · jambes plus légères · tourmaline naturelle
          </p>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-500">Dès</span>
            <span className="cch-grad-strong text-5xl font-black sm:text-6xl">{fmtTotal(1)}</span>
            <span className="text-lg font-bold text-neutral-700">FCFA</span>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(selectedPack)}>Commander ici <Arrow /></CTA>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-neutral-600">
            {['💵 Paiement à la livraison', '🚚 Livraison rapide', '🔥 Tourmaline', '⏳ Offre limitée'].map((b) => (
              <span key={b} className="rounded-full bg-white/90 px-3 py-1 ring-1 ring-amber-100">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <Marquee tone="warm" items={['Chauffant', 'Amincissant', 'Anti-gonflement', 'Tourmaline', 'Confort', 'Bien-être']} />

      <Block img={MEDIA.m1} alt="Chaussettes tourmaline" eyebrow="Technologie tourmaline"
        title="Une chaleur douce qui active la circulation."
        highlight="chaleur douce" sub="Portez-les le soir et sentez la différence dès les premiers jours."
        ctaLabel="Je veux essayer" onCta={() => openModal(selectedPack)} tone="white" />

      <Block img={MEDIA.m2} alt="Chaussettes chauffantes amincissantes" eyebrow="Minceur"
        title="Aide à affiner jambes et mollets naturellement."
        highlight="affiner jambes" sub="Idéal pour celles qui veulent des jambes plus légères et moins gonflées."
        ctaLabel="Commander maintenant" onCta={() => openModal(selectedPack)} tone="warm" />

      <Block img={MEDIA.m3} alt="Confort chaussettes chauffantes" eyebrow="Confort"
        title="Douces, élastiques et agréables à porter."
        highlight="agréables à porter" sub="Tissu respirant — vous pouvez dormir avec sans gêne."
        ctaLabel="Profiter de l'offre" onCta={() => openModal(selectedPack)} tone="gold" />

      {/* WhatsApp testimonials */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1a0a] via-[#14532d] to-[#052e16] px-4 py-14 text-white">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200 ring-1 ring-emerald-400/30">
              💬 Avis WhatsApp
            </span>
            <h2 className="mt-3 text-balance text-[24px] font-black leading-[1.1] sm:text-[28px]">
              Des centaines de clientes <span className="text-emerald-300">satisfaites</span>
            </h2>
          </div>
          <div className="mt-6 space-y-3">
            {WA_MSGS.map((m, i) => (
              <div key={i} className="rounded-2xl bg-[#0b1410]/80 p-4 ring-1 ring-emerald-500/20">
                <p className="text-[13px] leading-relaxed text-emerald-50">{m.t}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-300/80">
                  <span className="font-bold">{m.n}</span>
                  <span>{m.h} ✓✓</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[10px] text-emerald-300/60">*Témoignages inspirés des retours WhatsApp de nos vraies clientes.</p>
        </div>
      </section>

      {/* Before / After */}
      <section className="relative overflow-hidden bg-white px-4 py-14">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-orange-700 ring-1 ring-orange-300/40">
              Résultats réels
            </span>
            <h2 className="mt-3 text-balance text-[24px] font-black leading-[1.1] sm:text-[28px]">
              Avant / Après de <span className="cch-grad">vraies clientes</span>
            </h2>
          </div>
          <div className="mt-7 space-y-6">
            {[
              { b: MEDIA.ba1b, a: MEDIA.ba1a, w: '2 semaines', d: 'Pieds moins gonflés, sandales moins serrées.' },
              { b: MEDIA.ba2b, a: MEDIA.ba2a, w: '3 semaines', d: 'Mollets dégonflés, jean tombe mieux.' },
              { b: MEDIA.ba3b, a: MEDIA.ba3a, w: '1 mois', d: 'Silhouette plus harmonieuse, jambes plus légères.' },
            ].map((x, i) => (
              <div key={i} className="rounded-2xl bg-orange-50/50 p-4 ring-1 ring-amber-100">
                <p className="mb-3 text-[12px] font-black uppercase tracking-wider text-orange-700">Client {i + 1} — {x.w}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Avant</p>
                    <LazyImg src={x.b} alt={`Avant client ${i + 1}`} aspect="3/4" className="rounded-xl" />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Après</p>
                    <LazyImg src={x.a} alt={`Après client ${i + 1}`} aspect="3/4" className="rounded-xl" />
                  </div>
                </div>
                <p className="mt-2 text-[12px] text-neutral-600">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Block img={MEDIA.m4} alt="Jambes lourdes" eyebrow="Anti-fatigue"
        title="Fini les jambes lourdes en fin de journée."
        highlight="jambes lourdes" sub="Parfait si vous travaillez debout ou marchez beaucoup."
        ctaLabel="Je commande" onCta={() => openModal(selectedPack)} tone="white" />

      <Block img={MEDIA.m5} alt="Chaussettes tourmaline premium" eyebrow="Premium"
        title="Le best seller minceur de l'année."
        highlight="best seller" sub="Des milliers de paires vendues en Côte d`Ivoire."
        ctaLabel="Choisir mon pack" onCta={() => openModal(selectedPack)} tone="warm" />

      {/* Packs */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50 to-white px-4 py-14">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-red-600 ring-1 ring-red-300/40">
              Offre du jour
            </span>
            <h2 className="mt-3 text-balance text-[26px] font-black leading-[1.1] sm:text-[30px]">
              Choisissez votre <span className="cch-grad">pack</span>
            </h2>
          </div>
          <div className="mt-7 space-y-3">
            {QTY_OPTS.map((o) => {
              const active = selectedPack === o.v;
              return (
                <button key={o.v} type="button" onClick={() => choosePack(o.v)}
                  className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${
                    active ? 'border-orange-500 bg-white shadow-lg shadow-orange-200/50 scale-[1.01]' : 'border-amber-100 bg-white/80 hover:border-orange-200'
                  }`}>
                  {o.tag && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-orange-500 px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[16px] font-black text-neutral-900">{o.label}</p>
                      {o.save && <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">{o.save}</p>}
                    </div>
                    <p className="text-[22px] font-black text-orange-600">{o.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(selectedPack)} tone="gold">Commander · {fmt(orderTotal(PRICES, selectedPack))} F <Arrow /></CTA>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12">
        <div className="mx-auto w-full max-w-[560px]">
          <h2 className="text-center text-[22px] font-black">Questions fréquentes</h2>
          <div className="mt-5 space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-amber-100 bg-white">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[13px] font-bold text-neutral-900">
                  {f.q}
                  <span className="text-orange-500">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="border-t border-amber-50 px-4 py-3 text-[12px] leading-relaxed text-neutral-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky CTA */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-amber-200/60 bg-white/95 px-4 py-3 backdrop-blur-md"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <div className="pointer-events-none min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-orange-600">Offre limitée</p>
            <p className="text-[18px] font-black text-neutral-900">{fmt(orderTotal(PRICES, 1))} F · 1 paire</p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="pointer-events-auto shrink-0 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-5 py-3.5 text-[12px] font-black uppercase tracking-wider text-white shadow-lg shadow-orange-300/40">
            Commander
          </button>
        </div>
      </div>

      <OrderModalDispatcher slug={SLUG} open={modal} onClose={() => setModal(false)}
        cfg={orderCfg} product={product} setProduct={setProduct} qtyOptions={QTY_OPTS} initialQty={qty} />

      <footer className="px-4 pb-8 pt-4 text-center text-[10px] text-neutral-400">
        © {new Date().getFullYear()} · Chaussettes chauffantes tourmaline · Côte d'Ivoire
      </footer>
    </div>
  );
}
