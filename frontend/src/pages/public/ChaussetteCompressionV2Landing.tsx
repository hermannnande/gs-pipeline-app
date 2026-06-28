/**
 * Tunnel premium V2 — Chaussette de Compression (CHAUSSETTE_DE_COMPRESSION).
 * Slug : chaussette-compression-v2 (page distincte, l'ancienne reste intacte).
 *
 * Direction artistique : bleu marine + turquoise + blanc + beige clair + gris doux,
 * accent noir. Mobile-first, peu de texte, beaucoup de visuel.
 *
 * Disposition UNIQUE : 1 bloc = 1 image (ou GIF) + petit texte vendeur en bas +
 * 1 CTA lumineux. Aucune image n'est repetee.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'chaussette-compression-v2';
const PRODUCT_CODE = 'CHAUSSETTE_DE_COMPRESSION';
const CONTENT_NAME = 'Chaussette de compression';
const META_PIXEL_ID = '1491294965321454';
const THANK_YOU_URL = '/chaussette-compression-v2/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 paire',  sub: packLabel(PRICES, 1, 'FCFA') },
  { v: 2, label: '2 paires', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Le plus choisi',  save: 'Économisez 2 000 F' },
  { v: 3, label: '3 paires', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Meilleure offre', save: 'Économisez 6 000 F' },
];

const M = (n: string) => `/chaussette-compression-v2/${n}.webp`;
const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: any; _fbq?: any; ttq?: any; dataLayer?: any[] } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
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
      else if (event === 'Lead') window.fbq('track', 'Lead', payload);
      else window.fbq('trackCustom', event, data);
    }
    if (typeof window.ttq?.track === 'function') window.ttq.track(event, data);
  } catch { /* noop */ }
}

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
        : <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50" />}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// CTA lumineux : degrade bleu/turquoise, halo, sheen anime.
// ───────────────────────────────────────────────────────────────────────────
const CTA_TONES: Record<string, string> = {
  primary: 'from-sky-400 via-cyan-500 to-blue-700 text-white ring-cyan-200/60',
  navy:    'from-[#0a1f44] via-[#0b2350] to-[#060b16] text-cyan-100 ring-cyan-300/30',
  teal:    'from-teal-300 via-cyan-500 to-sky-700 text-white ring-teal-200/60',
  beige:   'from-amber-100 via-stone-100 to-amber-200 text-[#0a1f44] ring-amber-200/60',
};
function CTA({ onClick, children, tone = 'primary', className = '' }: { onClick: () => void; children: ReactNode; tone?: keyof typeof CTA_TONES; className?: string }) {
  const cls = CTA_TONES[tone] || CTA_TONES.primary;
  return (
    <button type="button" onClick={onClick}
      className={`cc2-cta cc2-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.16em] shadow-[0_18px_44px_-12px_rgba(8,145,178,.55)] ring-2 transition hover:scale-[1.02] sm:text-[15px] ${className}`}>
      <span className="cc2-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Marquee defilant : plusieurs degrades selon le ton.
// ───────────────────────────────────────────────────────────────────────────
const MQ_TONES: Record<string, string> = {
  navy:   'border-cyan-300/30 bg-gradient-to-r from-[#0a1f44] via-[#062047] to-[#0e2f5a] text-cyan-100',
  teal:   'border-teal-200/40 bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600 text-white',
  beige:  'border-amber-200/60 bg-gradient-to-r from-amber-100 via-stone-50 to-amber-100 text-[#0a1f44]',
  silver: 'border-slate-200 bg-gradient-to-r from-slate-100 via-white to-slate-100 text-slate-700',
};
function Marquee({ items, tone = 'navy' }: { items: string[]; tone?: keyof typeof MQ_TONES }) {
  const cls = MQ_TONES[tone] || MQ_TONES.navy;
  const content = [...items, ...items, ...items];
  return (
    <div className={`relative overflow-hidden border-y py-2.5 ${cls}`}>
      <div className="cc2-marquee flex items-center gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.24em] sm:text-[12px]">
        {content.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span>{t}</span><span className="opacity-50">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Bloc image individuel : 1 image + texte court (avec mots forts en degrade) + CTA.
// ───────────────────────────────────────────────────────────────────────────
function Block({
  img, alt, eyebrow, title, sub, ctaLabel, onCta, tone = 'white', highlight,
}: {
  img: string;
  alt: string;
  eyebrow?: string;
  title: string;
  sub?: string;
  ctaLabel: string;
  onCta: () => void;
  tone?: 'white' | 'navy' | 'beige' | 'teal';
  highlight?: string; // mot(s) a mettre en degrade dans le titre
}) {
  const toneBg: Record<string, string> = {
    white: 'bg-gradient-to-b from-white to-slate-50 text-slate-900',
    navy:  'bg-gradient-to-b from-[#0a1f44] to-[#06122a] text-white',
    beige: 'bg-gradient-to-b from-amber-50 to-stone-100 text-slate-900',
    teal:  'bg-gradient-to-b from-cyan-50 to-teal-50 text-slate-900',
  };
  const subColor = tone === 'navy' ? 'text-cyan-100/85' : 'text-slate-600';

  // Highlight : remplace la premiere occurrence par un span degrade.
  const renderTitle = () => {
    if (!highlight || !title.includes(highlight)) return title;
    const i = title.indexOf(highlight);
    return (
      <>
        {title.slice(0, i)}
        <span className="cc2-grad">{highlight}</span>
        {title.slice(i + highlight.length)}
      </>
    );
  };

  return (
    <section className={`relative overflow-hidden px-4 py-10 sm:py-14 ${toneBg[tone]}`}>
      <div className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-cyan-400/15 blur-[110px]" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-300/15 blur-[110px]" />
      <div className="relative mx-auto w-full max-w-[560px]">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_-20px_rgba(8,30,67,.35)] ring-1 ring-slate-200">
          <LazyImg src={img} alt={alt} aspect="1 / 1" />
        </div>
        <div className="mt-5 px-1 text-center">
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700 ring-1 ring-cyan-300/40">
              {eyebrow}
            </span>
          )}
          <h2 className={`mt-3 text-balance text-[22px] font-black leading-[1.1] tracking-tight sm:text-[26px] ${tone === 'navy' ? 'text-white' : 'text-slate-900'}`}>
            {renderTitle()}
          </h2>
          {sub && <p className={`mt-2 text-[13px] leading-relaxed sm:text-[14px] ${subColor}`}>{sub}</p>}
          <div className="mx-auto mt-5 max-w-sm">
            <CTA onClick={onCta} tone="primary">{ctaLabel}</CTA>
          </div>
        </div>
      </div>
    </section>
  );
}

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);
const Star = () => (
  <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.04a1 1 0 00-1.18 0l-2.8 2.04c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12l-2.8-2.03c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" /></svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function ChaussetteCompressionV2Landing() {
  const navigate = useNavigate();
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [stock, setStock] = useState(17);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; q: string; visible: boolean } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const NOTIFS = useMemo(() => [
    { n: 'Aïssatou', v: 'Cocody',     q: '2 paires' },
    { n: 'Marc',     v: 'Yopougon',   q: '1 paire'  },
    { n: 'Fatou',    v: 'Bingerville', q: '3 paires' },
    { n: 'Daniel',   v: 'Plateau',    q: '2 paires' },
    { n: 'Kone',     v: 'Marcory',    q: '1 paire'  },
    { n: 'Grâce',    v: 'Treichville', q: '2 paires' },
  ], []);

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

  // Tracking + preload hero
  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) initMetaPixel(META_PIXEL_ID);
    track('ViewContent', { product: PRODUCT_CODE, content_name: CONTENT_NAME, value: orderTotal(PRICES, 1), currency: 'XOF' });
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = M('hero');
    document.head.appendChild(l);
  }, [company]);

  // Resolution produit en BDD (par code) pour la commande.
  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then((r) => {
        const p = (r.data?.products || []).find((x: Product) => x.code?.toUpperCase() === PRODUCT_CODE);
        if (p) setProduct(p);
      })
      .catch(() => { /* noop */ });
  }, [company]);

  // Compte a rebours 24h glissant (minuit) + redemarrage auto.
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

  // Notifications d'achat toutes les 12-18 s.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      const t = NOTIFS[toastIdx.current % NOTIFS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast((p) => (p ? { ...p, visible: false } : null)), 4500);
      setTimeout(() => setToast(null), 4900);
      timer = setTimeout(show, 12000 + Math.random() * 6000);
    };
    timer = setTimeout(show, 6000);
    return () => clearTimeout(timer);
  }, [NOTIFS]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const stockPct = Math.max(20, Math.round((stock / 30) * 100));

  const TESTIS = [
    { txt: 'Mes pieds sont plus légers à la fin de la journée.',         n: 'Aïssatou', v: 'Cocody'      },
    { txt: 'Très agréable à porter tous les jours au bureau.',           n: 'Marc',     v: 'Yopougon'    },
    { txt: 'Je sens un meilleur maintien quand je marche longtemps.',    n: 'Fatou',    v: 'Bingerville' },
    { txt: 'Idéal quand on reste longtemps debout au travail.',          n: 'Daniel',   v: 'Plateau'    },
    { txt: 'Commande reçue rapidement, produit bien emballé.',           n: 'Kone',     v: 'Marcory'    },
    { txt: 'Discret sous les chaussures, confortable toute la journée.', n: 'Grâce',    v: 'Treichville' },
  ];

  const FAQ = [
    { q: 'Comment porter la chaussette de compression ?',     a: 'Enfilez-la le matin sur peau sèche, comme une chaussette classique. Lissez bien le tissu pour un maintien uniforme.' },
    { q: 'Peut-on la porter tous les jours ?',                a: 'Oui, elle est conçue pour un usage quotidien confortable au bureau, en voyage ou pendant vos déplacements.' },
    { q: 'Convient-elle aux pieds fatigués et enflés ?',      a: 'Oui, sa compression ciblée aide à réduire l\'inconfort et la sensation de jambes lourdes en fin de journée.' },
    { q: 'Est-elle confortable pour marcher ?',               a: 'Le tissu respirant et le maintien progressif sont pensés pour un confort optimal même lors de longues marches.' },
    { q: 'Peut-on la porter au travail ou en déplacement ?',  a: 'Parfait pour le bureau, les longues stations debout, les voyages en avion ou en voiture.' },
    { q: 'Comment se passe la livraison ?',                   a: 'Remplissez le formulaire, notre équipe vous appelle pour confirmer, puis livraison rapide. Paiement à la réception.' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 antialiased" style={{ fontFamily: 'Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>

      {/* ─── 0. STICKY TOP : marquee navy ──────────────────────────────── */}
      <div className="sticky top-0 z-40">
        <Marquee tone="navy" items={[
          'Offre spéciale aujourd\'hui',
          `1 paire ${fmtTotal(1)} Fr`,
          `2 paires ${fmtTotal(2)} Fr`,
          `3 paires ${fmtTotal(3)} Fr`,
          'Paiement à la livraison',
          'Livraison rapide',
          'Confort • Maintien • Soulagement',
        ]} />
        <div className="h-[3px] w-full overflow-hidden bg-cyan-100">
          <div className="h-full bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-700" style={{ width: `${stockPct}%` }} />
        </div>
      </div>

      {/* ─── 1. HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eaf6fc] via-white to-[#f5fbfd] px-4 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-300/30 blur-[120px]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-sky-300/25 blur-[120px]" />

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700 ring-1 ring-cyan-300/50 backdrop-blur">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" /></span>
              Édition signature 2026
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0a1f44] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 ring-1 ring-cyan-300/30">
              Confort premium
            </span>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_-20px_rgba(8,30,67,.45)] ring-1 ring-slate-200">
            <LazyImg src={M('hero.webp')} alt="Chaussette de compression premium" priority aspect="1 / 1" />
          </div>

          <h1 className="mt-7 text-balance text-center text-[32px] font-black leading-[1.05] tracking-tight sm:text-[42px]">
            Soulagez vos <span className="cc2-grad">pieds fatigués</span> et enflés
          </h1>
          <p className="mt-3 text-center text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
            Maintien ciblé · tissu respirant · confort toute la journée.
          </p>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Dès</span>
            <span className="cc2-grad-strong text-5xl font-black sm:text-6xl">{fmtTotal(1)}</span>
            <span className="text-lg font-bold text-slate-700">FCFA</span>
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(selectedPack)}>Commander maintenant <Arrow /></CTA>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-600">
            {['💵 Paiement à la livraison', '🚚 Livraison rapide', '✓ Confortable', '⏳ Offre limitée'].map((b) => (
              <span key={b} className="rounded-full bg-white/90 px-3 py-1 ring-1 ring-slate-200">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. MARQUEE ────────────────────────────────────────────── */}
      <Marquee tone="teal" items={['Confort', 'Maintien', 'Soulagement', 'Anti-fatigue', 'Tissu respirant', 'Usage quotidien']} />

      {/* ─── 3. BLOC IMAGE 1 (m1) ──────────────────────────────────── */}
      <Block
        img={M('m1')} alt="Chaussette de compression - confort à chaque pas"
        eyebrow="Le confort"
        title="Retrouvez un meilleur confort à chaque pas."
        highlight="meilleur confort"
        sub="Maintien progressif, tissu doux. Vos pieds vous remercient."
        ctaLabel="Je veux plus de confort"
        onCta={() => openModal(selectedPack)}
        tone="white"
      />

      {/* ─── 4. BLOC IMAGE 2 (m2) ──────────────────────────────────── */}
      <Block
        img={M('m2')} alt="Pieds fatigués soulagés"
        eyebrow="Pieds sensibles"
        title="Idéal pour les pieds fatigués et sensibles."
        highlight="pieds fatigués"
        sub="Une solution simple, à porter au quotidien."
        ctaLabel="Commander maintenant"
        onCta={() => openModal(selectedPack)}
        tone="teal"
      />

      {/* ─── 5. MARQUEE ────────────────────────────────────────────── */}
      <Marquee tone="navy" items={['Anti-douleur', 'Anti-gonflement', 'Usage quotidien', 'Soulagement durable']} />

      {/* ─── 6. BLOC GIF (gif1) ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#06122a] via-[#0a1f44] to-[#06122a] px-4 py-12 text-white sm:py-16">
        <div className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-cyan-400/25 blur-[110px]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-400/20 blur-[110px]" />
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)] ring-1 ring-cyan-300/30">
            <LazyImg src={M('gif1')} alt="Animation anti-fatigue compression" aspect="1 / 1" />
          </div>
          <div className="mt-5 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200 ring-1 ring-cyan-300/30">
              En action
            </span>
            <h2 className="mt-3 text-balance text-[22px] font-black leading-[1.1] tracking-tight text-white sm:text-[26px]">
              Aide à <span className="cc2-grad-light">réduire l'inconfort</span> au quotidien.
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-cyan-100/85 sm:text-[14px]">
              Une compression douce, ciblée et bien pensée.
            </p>
            <div className="mx-auto mt-5 max-w-sm">
              <CTA onClick={() => openModal(selectedPack)} tone="primary">Je commande ma paire <Arrow /></CTA>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. BLOC IMAGE 3 (m3) ──────────────────────────────────── */}
      <Block
        img={M('m3')} alt="Maintien ciblé"
        eyebrow="Le maintien"
        title="Un maintien ciblé pour plus de stabilité."
        highlight="maintien ciblé"
        sub="Conçu pour soutenir cheville et voûte plantaire."
        ctaLabel="Profiter de l'offre"
        onCta={() => openModal(selectedPack)}
        tone="beige"
      />

      {/* ─── 8. MARQUEE ────────────────────────────────────────────── */}
      <Marquee tone="beige" items={['Léger', 'Respirant', 'Facile à porter', 'Discret sous la chaussure']} />

      {/* ─── 9. BLOC IMAGE 4 (m4) ──────────────────────────────────── */}
      <Block
        img={M('m4')} alt="Longues journées debout"
        eyebrow="Travail debout"
        title="Parfait pour les longues journées debout."
        highlight="longues journées"
        sub="Bureau, commerce, voyage : restez à l'aise."
        ctaLabel="Je veux plus de confort"
        onCta={() => openModal(selectedPack)}
        tone="white"
      />

      {/* ─── 10. BLOC IMAGE 5 (m5) ─────────────────────────────────── */}
      <Block
        img={M('m5')} alt="Confortable et discret"
        eyebrow="Discret"
        title="Confortable, discret et facile à porter."
        highlight="discret"
        sub="Se porte sous toutes les chaussures du quotidien."
        ctaLabel="Commander maintenant"
        onCta={() => openModal(selectedPack)}
        tone="teal"
      />

      {/* ─── 11. MARQUEE ───────────────────────────────────────────── */}
      <Marquee tone="silver" items={['Paiement à la livraison', 'Livraison rapide', 'Offre spéciale aujourd\'hui']} />

      {/* ─── 12. BLOC IMAGE 6 (m6) ─────────────────────────────────── */}
      <Block
        img={M('m6')} alt="Réduire l'enflure"
        eyebrow="Anti-gonflement"
        title="Aide à soulager l'enflure des pieds."
        highlight="soulager l'enflure"
        sub="Une routine simple pour des pieds plus légers."
        ctaLabel="Profiter de l'offre"
        onCta={() => openModal(selectedPack)}
        tone="white"
      />

      {/* ─── 13. BLOC IMAGE 7 (m7) ─────────────────────────────────── */}
      <Block
        img={M('m7')} alt="Bien-être au quotidien"
        eyebrow="Bien-être"
        title="Une solution simple pour plus de bien-être."
        highlight="plus de bien-être"
        sub="Un geste doux à intégrer dans votre routine."
        ctaLabel="Je commande ma paire"
        onCta={() => openModal(selectedPack)}
        tone="beige"
      />

      {/* ─── 14. SECTION BENEFICES ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#eef9fc] to-white px-4 py-14">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700 ring-1 ring-cyan-300/40">
              Pourquoi l'adopter
            </span>
            <h2 className="mt-3 text-balance text-[26px] font-black leading-[1.1] tracking-tight sm:text-[30px]">
              Vos pieds méritent un <span className="cc2-grad">confort premium</span>.
            </h2>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {[
              { i: '💓', t: 'Circulation',  s: 'Aide à mieux circuler.' },
              { i: '🦶', t: 'Inconfort',    s: 'Aide à le réduire.' },
              { i: '💧', t: 'Anti-enflure', s: 'Aide à diminuer.' },
              { i: '🛏️', t: 'Pieds légers', s: 'Soulage la fatigue.' },
              { i: '🎯', t: 'Maintien',     s: 'Cible cheville + voûte.' },
              { i: '🌬️', t: 'Respirant',    s: 'Tissu doux et aéré.' },
              { i: '📆', t: 'Quotidien',    s: 'Idéal tous les jours.' },
              { i: '✨', t: 'Discret',      s: 'Sous toutes chaussures.' },
            ].map((b) => (
              <div key={b.t} className="group rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-14px_rgba(8,30,67,.25)]">
                <div className="text-2xl">{b.i}</div>
                <p className="mt-1.5 text-[13px] font-black tracking-tight text-slate-900">{b.t}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{b.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 15. POUR QUI ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eef9fc] to-white px-4 py-14">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700 ring-1 ring-cyan-300/40">
              Pour qui ?
            </span>
            <h2 className="mt-3 text-balance text-[24px] font-black leading-[1.1] tracking-tight sm:text-[28px]">
              Pensé pour <span className="cc2-grad">tous ceux</span> qui sollicitent leurs pieds.
            </h2>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {[
              { i: '🧍', t: 'Debout longtemps' },
              { i: '🚶', t: 'Marche fréquente' },
              { i: '😴', t: 'Pieds fatigués' },
              { i: '💧', t: 'Pieds gonflés' },
              { i: '💼', t: 'Travail bureau' },
              { i: '🏃', t: 'Sport léger' },
              { i: '✈️', t: 'Voyages' },
              { i: '📅', t: 'Usage quotidien' },
            ].map((b) => (
              <div key={b.t} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200">
                <span className="text-xl">{b.i}</span>
                <span className="text-[12px] font-bold text-slate-700">{b.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 16. BLOC IMAGE 8 (m8) ─────────────────────────────────── */}
      <Block
        img={M('m8')} alt="Légèreté retrouvée"
        eyebrow="Légèreté"
        title="Retrouvez la légèreté en fin de journée."
        highlight="légèreté"
        sub="Sensation de jambes plus légères dès les premiers jours."
        ctaLabel="Commander maintenant"
        onCta={() => openModal(selectedPack)}
        tone="white"
      />

      {/* ─── 17. PREUVE SOCIALE — Marquee + toast ──────────────────── */}
      <Marquee tone="teal" items={['Des clients satisfaits', 'Commande confirmée par téléphone', 'Livraison partout en CI', 'Paiement à la livraison']} />

      {/* ─── 18. TEMOIGNAGES ───────────────────────────────────────── */}
      <section className="relative bg-white px-4 py-14">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="text-center">
            <div className="mb-2 inline-flex items-center gap-1.5">
              {[1,2,3,4,5].map((i) => <Star key={i} />)}
              <span className="ml-1 text-[12px] font-bold text-slate-700">4,9/5 · clients satisfaits</span>
            </div>
            <h2 className="text-balance text-[26px] font-black leading-[1.1] tracking-tight sm:text-[30px]">
              Ils nous <span className="cc2-grad">font confiance</span>.
            </h2>
          </div>
          <div className="mt-7 space-y-3">
            {TESTIS.map((t, i) => (
              <div key={i} className="rounded-2xl bg-gradient-to-br from-white to-[#f5fbfd] p-4 shadow-sm ring-1 ring-slate-200">
                <div className="mb-1 flex items-center gap-1">{[1,2,3,4,5].map((j) => <Star key={j} />)}</div>
                <p className="text-[13px] leading-relaxed text-slate-700 sm:text-[14px]">"{t.txt}"</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-cyan-700">— {t.n}, {t.v} · <span className="text-emerald-600">✓ Vérifié</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 19. BLOC IMAGE 9 (m9) ─────────────────────────────────── */}
      <Block
        img={M('m9')} alt="Geste simple bien-être"
        eyebrow="Au quotidien"
        title="Un geste simple pour accompagner votre peau."
        highlight="geste simple"
        sub="Une routine douce, à la maison comme au travail."
        ctaLabel="Je commande ma paire"
        onCta={() => openModal(selectedPack)}
        tone="beige"
      />

      {/* ─── 20. MARQUEE AVANT FORMULAIRE ──────────────────────────── */}
      <Marquee tone="navy" items={['Offre spéciale disponible aujourd\'hui', 'Choisissez votre pack maintenant', 'Stock limité']} />

      {/* ─── 21. OFFRES / BUNDLES ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eaf6fc] via-white to-[#f5fbfd] px-4 py-14">
        <div className="pointer-events-none absolute -right-20 top-12 h-72 w-72 rounded-full bg-cyan-300/25 blur-[110px]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-sky-300/25 blur-[110px]" />

        <div className="relative mx-auto w-full max-w-[600px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700 ring-1 ring-cyan-300/40">
              Nos offres
            </span>
            <h2 className="mt-3 text-balance text-[26px] font-black leading-[1.1] tracking-tight sm:text-[30px]">
              Plus vous prenez, <span className="cc2-grad">plus vous économisez</span>.
            </h2>
            <p className="mt-2 text-[13px] text-slate-600">Compte à rebours actif · paiement à la livraison.</p>
          </div>

          {/* Countdown */}
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 ring-1 ring-cyan-300/40 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Offre se termine dans</span>
            <span className="font-mono text-[14px] font-black tabular-nums text-cyan-700">
              {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </span>
          </div>

          {/* 3 packs */}
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { v: 1, n: '1 paire',  p: orderTotal(PRICES, 1),  old: 9900,  sub: packLabel(PRICES, 1, 'F'),         badge: null, save: null },
              { v: 2, n: '2 paires', p: orderTotal(PRICES, 2), old: 14000, sub: packLabel(PRICES, 2, 'F'),   badge: '★ POPULAIRE', save: '-2 000 F', hot: true },
              { v: 3, n: '3 paires', p: orderTotal(PRICES, 3), old: 21000, sub: packLabel(PRICES, 3, 'F'), badge: 'Meilleure offre', save: '-6 000 F' },
            ].map((b) => {
              const active = selectedPack === b.v;
              return (
                <button
                  key={b.v}
                  type="button"
                  onClick={() => { choosePack(b.v); }}
                  className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition hover:scale-[1.02] hover:shadow-xl ${
                    active
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 via-white to-sky-50 shadow-[0_18px_44px_-14px_rgba(8,145,178,.45)] ring-2 ring-cyan-300/40'
                      : b.hot
                        ? 'border-cyan-300 bg-gradient-to-br from-white to-cyan-50/40 shadow-sm'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  {b.badge && (
                    <span className="absolute -right-1 top-3 rounded-l-full bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                      {b.badge}
                    </span>
                  )}
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{b.sub}</p>
                  <p className="mt-1 text-[18px] font-black text-slate-900">{b.n}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="cc2-grad-strong text-2xl font-black sm:text-3xl">{fmt(b.p)}</span>
                    <span className="text-xs font-bold text-slate-700">F</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400 line-through">{fmt(b.old)} F</p>
                  {b.save && (
                    <span className="mt-2 inline-block rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-800 ring-1 ring-cyan-200">
                      {b.save}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(selectedPack)} tone="primary">
              Commander {selectedPack === 1 ? '1 paire' : `${selectedPack} paires`} — {fmt(orderTotal(PRICES, selectedPack))} F
              <Arrow />
            </CTA>
            <p className="mt-2 text-center text-[11px] text-slate-500">🔒 Aucun paiement en ligne · vous payez à la réception.</p>
          </div>
        </div>
      </section>

      {/* ─── 22. RÉASSURANCE / COMMANDE SIMPLE ─────────────────────── */}
      <section className="bg-white px-4 py-12">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="text-center">
            <h2 className="text-balance text-[22px] font-black leading-[1.1] tracking-tight sm:text-[26px]">
              Commande <span className="cc2-grad">simple et rassurante</span>.
            </h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { i: '📝', t: 'Vous remplissez le formulaire' },
              { i: '📞', t: 'Notre équipe vous appelle' },
              { i: '🚚', t: 'Livraison rapide' },
              { i: '💵', t: 'Paiement à la livraison' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-white to-[#f5fbfd] px-3 py-3 shadow-sm ring-1 ring-slate-200">
                <span className="text-xl">{s.i}</span>
                <span className="text-[12px] font-bold text-slate-700">{s.t}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] font-semibold text-slate-500">
            🔒 Aucun paiement en ligne obligatoire. Vous payez à la réception.
          </p>
        </div>
      </section>

      {/* ─── 23. FAQ ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-white to-[#f5fbfd] px-4 py-14">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700 ring-1 ring-cyan-300/40">
              FAQ
            </span>
            <h2 className="mt-3 text-balance text-[26px] font-black leading-[1.1] tracking-tight sm:text-[30px]">
              Vos <span className="cc2-grad">questions</span>.
            </h2>
          </div>
          <div className="mt-6 space-y-2">
            {FAQ.map((f, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className={`block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 transition ${open ? 'ring-cyan-300' : 'ring-slate-200'}`}
                >
                  <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <span className="text-[13px] font-black text-slate-900 sm:text-[14px]">{f.q}</span>
                    <svg className={`h-5 w-5 flex-none text-cyan-600 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {open && <p className="px-5 pb-5 text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">{f.a}</p>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 24. CLOTURE ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1f44] to-[#06122a] px-4 py-14 text-white">
        <div className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-cyan-400/25 blur-[110px]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-400/20 blur-[110px]" />
        <div className="relative mx-auto w-full max-w-[520px] text-center">
          <h2 className="text-balance text-[28px] font-black leading-[1.05] tracking-tight sm:text-[32px]">
            Prêt à offrir à vos pieds <span className="cc2-grad-light">un vrai confort</span> ?
          </h2>
          <p className="mt-3 text-[13px] text-cyan-100/85 sm:text-[14px]">Compte à rebours actif · paiement à la livraison.</p>
          <div className="mx-auto mt-6 max-w-sm">
            <CTA onClick={() => openModal(selectedPack)} tone="primary">Commander maintenant — dès {fmtTotal(1)} F <Arrow /></CTA>
          </div>
        </div>
      </section>

      {/* ─── 25. FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-[#06122a] py-6 text-center text-[11px] text-cyan-100/60">
        © {new Date().getFullYear()} {CONTENT_NAME} · Côte d`Ivoire · Paiement à la livraison
      </footer>

      {/* ─── TOAST notif d'achat ───────────────────────────────────── */}
      {toast && (
        <div className={`pointer-events-none fixed bottom-20 left-1/2 z-40 -translate-x-1/2 transition-all duration-500 ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} sm:bottom-6 sm:left-6 sm:translate-x-0`}>
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/30 bg-[#0a1f44]/95 px-4 py-3 shadow-2xl backdrop-blur">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-600 text-white">✓</div>
            <div className="text-left">
              <p className="text-[11px] font-black text-white">{toast.n} à {toast.v}</p>
              <p className="text-[10px] text-cyan-100/80">vient de commander · {toast.q}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── STICKY CTA MOBILE ─────────────────────────────────────── */}
      <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 border-t border-cyan-300/30 bg-[#0a1f44]/95 px-3 py-2.5 backdrop-blur-md sm:hidden ${modal ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'} transition-all duration-300`} style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-3">
          <div className="pointer-events-none flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Offre · {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</p>
            <p className="text-[11px] font-bold text-white">Dès {fmtTotal(1)} F · paiement à la livraison</p>
          </div>
          <button type="button" onClick={() => openModal(selectedPack)} className="pointer-events-auto cc2-pulse relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-700 px-5 py-2.5 text-[13px] font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_-4px_rgba(8,145,178,.6)] ring-2 ring-cyan-200/40">
            <span className="cc2-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <span className="relative">Commander</span><Arrow />
          </button>
        </div>
      </div>

      {/* ─── ORDER MODAL ───────────────────────────────────────────── */}
      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: CONTENT_NAME,
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          slug: SLUG,
          company,
          navigate,
          metaPixelId: META_PIXEL_ID,
          images: { hero: M('hero') },
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />

      {/* ─── CSS ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes cc2sheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes cc2pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(8,145,178,.45) } 70% { box-shadow: 0 0 0 14px rgba(8,145,178,0) } }
        @keyframes cc2marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-33.333%) } }
        .cc2-sheen { animation: cc2sheen 3.2s ease-in-out infinite }
        .cc2-pulse { animation: cc2pulse 2.6s ease-out infinite }
        .cc2-marquee { animation: cc2marquee 28s linear infinite }
        .cc2-grad { background: linear-gradient(90deg,#0891b2 0%,#06b6d4 50%,#0ea5e9 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .cc2-grad-strong { background: linear-gradient(90deg,#0a1f44 0%,#0891b2 50%,#0ea5e9 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .cc2-grad-light { background: linear-gradient(90deg,#67e8f9 0%,#bae6fd 50%,#ffffff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        @media (max-width: 639px) { html { scroll-behavior: smooth; } }
      `}</style>
    </div>
  );
}
