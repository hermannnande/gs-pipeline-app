/**
 * Tunnel premium — Lunettes Vision Nocturne (LUNETTE_VISION_NOCTUNE).
 * Slug : lunette-de-nuit · obrille.com/lunette-de-nuit/
 * Prix : 7 000 / 12 000 / 15 000 FCFA
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, DELIVERY_FEE_CI, packLabel } from '../../utils/pricingHelpers';
import { optimImg } from '../../utils/img';



const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'lunette-de-nuit';
const PRODUCT_CODE = 'LUNETTE_VISION_NOCTUNE';
const CONTENT_NAME = 'Lunettes Vision Nocturne';
const META_PIXEL_ID = '1491294965321454';
const THANK_YOU_URL = '/lunette-de-nuit/merci';

const PRICES: Record<number, number> = { 1: 7000, 2: 12000, 3: 15000 };
const OLD_UNIT = 15000;
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const fmtPack = (v: number) => packLabel(PRICES, v, 'F').replace(' F', '');
const QTY_OPTS = [
  { v: 1, label: '1 paire', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 paires', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi', save: 'Économisez 2 000 F' },
  { v: 3, label: '3 paires', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 6 000 F' },
];

const MEDIA = {
  heroPoster: optimImg('https://obrille.com/lunette-de-nuit/hero.jpg', 800),
  heroVideo: '/lunette-de-nuit/hero.mp4',
  v2: '/lunette-de-nuit/v2.mp4',
  v3: '/lunette-de-nuit/v3.mp4',
  v4: '/lunette-de-nuit/v4.mp4',
  m1: '/lunette-de-nuit/m1.webp',
  m2: '/lunette-de-nuit/m2.webp',
  m3: '/lunette-de-nuit/m3.webp',
  product: optimImg('https://obrille.com/lunette-de-nuit/hero.jpg', 800),
};

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: any; _fbq?: any; dataLayer?: any[] } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
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
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lvn-reveal ${shown ? 'lvn-reveal-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function LazyImg({ src, alt, priority, aspect, className = '' }: { src: string; alt: string; priority?: boolean; aspect?: string; className?: string }) {
  const { ref, visible } = useOnScreen();
  if (priority) return (
    <div className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {/* @ts-expect-error fetchpriority */}
      <img src={src} alt={alt} loading="eager" fetchpriority="high" className="h-full w-full object-cover" />
    </div>
  );
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible ? <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
        : <div className="min-h-[260px] animate-pulse bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900" />}
    </div>
  );
}

function CTA({ onClick, children, tone = 'main' }: { onClick: () => void; children: ReactNode; tone?: 'main' | 'gold' | 'dark' }) {
  const cls = tone === 'gold'
    ? 'from-amber-300 via-yellow-400 to-amber-500 text-neutral-900 shadow-[0_18px_50px_-10px_rgba(250,204,21,.65)] ring-amber-200/70'
    : tone === 'dark'
      ? 'from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-[0_18px_50px_-10px_rgba(34,211,238,.55)] ring-cyan-300/40'
      : 'from-cyan-400 via-sky-500 to-indigo-600 text-white shadow-[0_18px_50px_-10px_rgba(56,189,248,.6)] ring-cyan-200/50';
  return (
    <button type="button" onClick={onClick}
      className={`lvn-cta group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.14em] ring-2 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]`}>
      <span className="lvn-shine pointer-events-none absolute inset-0" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items }: { items: string[] }) {
  const c = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-cyan-400/20 bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 py-2.5 text-white">
      <div className="lvn-marquee flex gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.24em]">
        {c.map((t, i) => (<span key={i} className="inline-flex items-center gap-3">{t}<span className="text-amber-300/70">◆</span></span>))}
      </div>
    </div>
  );
}

/** Bloc image : média → titre → sous-titre → CTA */
function Block({ img, alt, title, sub, cta, onCta }: { img: string; alt: string; title: string; sub: string; cta: string; onCta: () => void }) {
  return (
    <section className="px-4 py-10 sm:py-14">
      <Reveal className="mx-auto max-w-[560px]">
        <div className="group overflow-hidden rounded-[28px] shadow-xl ring-1 ring-cyan-400/20 transition-transform duration-500 hover:scale-[1.01]">
          <LazyImg src={img} alt={alt} aspect="2/3" />
        </div>
        <div className="mt-5 text-center">
          <h2 className="text-[22px] font-black leading-tight text-slate-900 sm:text-[26px]">{title}</h2>
          <p className="mt-2 text-[13px] text-slate-500">{sub}</p>
          <div className="mx-auto mt-5 max-w-sm"><CTA onClick={onCta}>{cta}</CTA></div>
        </div>
      </Reveal>
    </section>
  );
}

/** Bloc vidéo : vidéo → titre → sous-titre → CTA */
function VideoBlock({
  video, poster, title, sub, cta, onCta, tone = 'gold', dark = false, aspect = 'aspect-video',
}: {
  video: string; poster: string; title: ReactNode; sub?: string; cta: string; onCta: () => void;
  tone?: 'main' | 'gold' | 'dark'; dark?: boolean; aspect?: string;
}) {
  const wrap = dark ? 'relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-14 text-white' : 'px-4 py-10 sm:py-14';
  const subCls = dark ? 'text-cyan-200/80' : 'text-slate-500';
  const titleCls = dark ? 'text-white' : 'text-slate-900';
  return (
    <section className={wrap}>
      {dark && <div className="lvn-stars pointer-events-none absolute inset-0 opacity-70" />}
      <Reveal className="relative z-10 mx-auto max-w-[520px]">
        <div className={`group overflow-hidden rounded-[28px] shadow-2xl transition-transform duration-500 hover:scale-[1.01] ${dark ? 'ring-2 ring-amber-300/40 lvn-glow' : 'ring-1 ring-cyan-400/20'}`}>
          <video src={video} poster={poster} autoPlay loop muted playsInline className={`${aspect} w-full object-cover`} />
        </div>
        <h2 className={`mt-5 text-center text-[22px] font-black leading-tight sm:text-[26px] ${titleCls}`}>{title}</h2>
        {sub && <p className={`mt-2 text-center text-[13px] ${subCls}`}>{sub}</p>}
        <div className="mx-auto mt-5 max-w-sm"><CTA tone={tone} onClick={onCta}>{cta}</CTA></div>
      </Reveal>
    </section>
  );
}

const BENEFITS = [
  { i: '🌙', t: 'Vision nocturne', s: 'Contraste renforcé dans l\'obscurité.' },
  { i: '🚗', t: 'Anti-éblouissement', s: 'Halos des phares réduits.' },
  { i: '🛡️', t: 'Conduite sûre', s: 'Moins de risques la nuit.' },
  { i: '👁️', t: 'Confort visuel', s: 'Moins de fatigue oculaire.' },
  { i: '🕶️', t: 'Légères & élégantes', s: 'Monture mixte confortable.' },
  { i: '🌧️', t: 'Pluie & brouillard', s: 'Vision nette par temps humide.' },
];

const REVIEWS = [
  { t: 'Plus d\'éblouissement avec les phares en face. Je distingue mieux les marquages, la conduite est beaucoup plus sereine.', n: 'Franck K.', v: 'Abidjan, Yopougon' },
  { t: 'Je travaille tard. Les lunettes m\'aident à mieux voir les trottoirs et les panneaux. Moins de fatigue oculaire.', n: 'Prisca A.', v: 'Cocody' },
  { t: 'Livraison rapide. Qualité correcte pour le prix, la différence est nette sur route humide la nuit.', n: 'Ismaël T.', v: 'Treichville' },
  { t: 'Mon mari conduit beaucoup la nuit. Il dit que c\'est un vrai changement, surtout sur l\'autoroute.', n: 'Aminata D.', v: 'Marcory' },
];

export default function LunetteDeNuitLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [toast, setToast] = useState<{ n: string; v: string; q: string; t: string; visible: boolean } | null>(null);
  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const NOTIFS = useMemo(() => [
    { n: 'Franck K.',  v: 'Yopougon',    q: '1 paire',  t: '2 min' },
    { n: 'Prisca A.',  v: 'Cocody',      q: '2 paires', t: '5 min' },
    { n: 'Ismaël T.',  v: 'Treichville', q: '1 paire',  t: '8 min' },
    { n: 'Aminata D.', v: 'Marcory',     q: '3 paires', t: '12 min' },
    { n: 'Serge M.',   v: 'Bouaké',      q: '2 paires', t: '15 min' },
    { n: 'Kouamé J.',  v: 'Plateau',     q: '1 paire',  t: '18 min' },
    { n: 'Adjoua B.',  v: 'Abobo',       q: '2 paires', t: '22 min' },
    { n: 'Moussa D.',  v: 'Daloa',       q: '1 paire',  t: '27 min' },
  ], []);

  const openModal = useCallback((q?: number) => {
    const pack = q || selectedPack || 1;
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, [selectedPack]);

  useEffect(() => {
    document.title = 'Lunettes Vision Nocturne — Conduite de nuit sécurisée';
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) initMetaPixel(META_PIXEL_ID);
    track('ViewContent', { product: PRODUCT_CODE, value: orderTotal(PRICES, 1), currency: 'XOF' });
  }, [company]);

  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then(({ data }) => setProduct((data?.products || []).find((x: Product) => x.code === PRODUCT_CODE) || null))
      .catch(() => {});
  }, [company]);

  useEffect(() => {
    const tick = () => {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - Date.now());
      setCountdown({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      const item = NOTIFS[toastIdx.current % NOTIFS.length];
      toastIdx.current++;
      setToast({ ...item, visible: true });
      setTimeout(() => setToast((p) => (p ? { ...p, visible: false } : null)), 4500);
      setTimeout(() => setToast(null), 4900);
      timer = setTimeout(show, 12000 + Math.random() * 6000);
    };
    timer = setTimeout(show, 6000);
    return () => clearTimeout(timer);
  }, [NOTIFS]);

  const orderCfg = useMemo(() => ({
    slug: SLUG, productCode: PRODUCT_CODE, thankYouUrl: THANK_YOU_URL, company, prices: PRICES,
    title: 'Lunettes Vision Nocturne', images: { hero: MEDIA.heroPoster },
    metaPixelId: META_PIXEL_ID,
  }), [company]);

  const faqs = [
    { q: 'Comment fonctionnent les lunettes vision nocturne ?', a: 'Elles filtrent la lumière bleue des phares et renforcent le contraste pour mieux distinguer la route, les marquages et les obstacles dans l\'obscurité.' },
    { q: 'Puis-je les porter aussi le jour ?', a: 'Oui, elles conviennent à un usage mixte. Elles restent confortables en journée tout en étant optimisées pour la conduite de nuit.' },
    { q: 'Paiement et livraison ?', a: 'Paiement à la livraison uniquement. Livraison rapide à Abidjan et dans les principales villes de Côte d\'Ivoire.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 pb-28">
      <style>{`
        .lvn-grad { background: linear-gradient(120deg,#22d3ee,#3b82f6,#6366f1,#22d3ee); background-size:200% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation: lvn-pan 6s linear infinite; }
        .lvn-grad-warm { background: linear-gradient(120deg,#fbbf24,#f59e0b,#fcd34d); background-size:200% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation: lvn-pan 5s linear infinite; }
        @keyframes lvn-pan { to { background-position:200% center; } }
        @keyframes lvn-marquee { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
        .lvn-marquee { animation: lvn-marquee 28s linear infinite; }
        @keyframes lvn-toast-in { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes lvn-toast-out { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(-24px)} }
        .lvn-toast-in { animation: lvn-toast-in .45s cubic-bezier(.22,1,.36,1) both; }
        .lvn-toast-out { animation: lvn-toast-out .35s ease-in both; }
        .lvn-reveal { opacity:0; transform:translateY(28px); transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .lvn-reveal-in { opacity:1; transform:translateY(0); }
        @media (prefers-reduced-motion: reduce) { .lvn-reveal{opacity:1;transform:none;transition:none} }
        .lvn-shine { background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,.55) 45%, transparent 70%); transform: translateX(-130%); }
        .lvn-cta:hover .lvn-shine { transform: translateX(130%); transition: transform .9s ease; }
        @keyframes lvn-pulse-ring { 0%{box-shadow:0 0 0 0 rgba(34,211,238,.5)} 70%{box-shadow:0 0 0 16px rgba(34,211,238,0)} 100%{box-shadow:0 0 0 0 rgba(34,211,238,0)} }
        .lvn-pulse { animation: lvn-pulse-ring 2.4s infinite; }
        @keyframes lvn-glow { 0%,100%{box-shadow:0 0 28px -6px rgba(34,211,238,.45)} 50%{box-shadow:0 0 46px -2px rgba(99,102,241,.6)} }
        .lvn-glow { animation: lvn-glow 4s ease-in-out infinite; }
        @keyframes lvn-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .lvn-float { animation: lvn-float 5s ease-in-out infinite; }
        .lvn-stars { background-image: radial-gradient(1.4px 1.4px at 18% 24%, rgba(255,255,255,.9), transparent), radial-gradient(1.6px 1.6px at 67% 38%, rgba(165,243,252,.85), transparent), radial-gradient(1.2px 1.2px at 42% 72%, rgba(255,255,255,.7), transparent), radial-gradient(1.8px 1.8px at 83% 64%, rgba(199,210,254,.8), transparent), radial-gradient(1.2px 1.2px at 30% 88%, rgba(255,255,255,.6), transparent); animation: lvn-twinkle 4.5s ease-in-out infinite; }
        @keyframes lvn-twinkle { 0%,100%{opacity:.45} 50%{opacity:.9} }
        @keyframes lvn-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }
        .lvn-bob { animation: lvn-bob 1.6s ease-in-out infinite; }
      `}</style>

      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md">
        <Marquee items={['Lunettes Vision Nocturne', `1 paire ${fmtPack(1)} Fr`, `2 paires ${fmtPack(2)} Fr`, `3 paires ${fmtPack(3)} Fr`, 'Anti-éblouissement · Conduite sûre', 'Paiement à la livraison']} />
      </div>

      {/* Hero immersif nuit : vidéo → titre → prix → CTA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 pt-9 pb-14 text-white">
        <div className="lvn-stars pointer-events-none absolute inset-0 opacity-80" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-cyan-200 ring-1 ring-cyan-300/30 backdrop-blur">🌙 Vision nocturne</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase text-slate-900">🔥 -50% aujourd&apos;hui</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-white ring-1 ring-white/20 backdrop-blur lvn-bob">⏱ {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>
          </div>

          <div className="lvn-float mt-6 overflow-hidden rounded-[32px] shadow-2xl ring-2 ring-cyan-400/30 lvn-glow">
            <video src={MEDIA.heroVideo} poster={MEDIA.heroPoster} autoPlay loop muted playsInline className="aspect-video w-full object-cover" />
          </div>

          <h1 className="mt-7 text-[30px] font-black leading-tight sm:text-[38px]">
            Voir dans le noir — <span className="lvn-grad">Lunettes anti-éblouissement</span>
          </h1>
          <p className="mt-3 text-[14px] text-cyan-100/80">
            Contraste renforcé · Halos réduits · Conduisez la nuit sans stress ni accident.
          </p>

          <div className="mt-2 flex items-center justify-center gap-1.5 text-amber-300">
            <span className="text-[15px]">★★★★★</span>
            <span className="text-[11px] font-bold text-white/70">4,8/5 · 327 avis vérifiés</span>
          </div>

          <div className="mt-5 flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-white/40 line-through">{fmt(OLD_UNIT + DELIVERY_FEE_CI)} F</span>
            <span className="lvn-grad-warm text-5xl font-black sm:text-6xl">{fmt(orderTotal(PRICES, 1))}</span>
            <span className="text-lg font-bold text-white">FCFA</span>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal()}>🌙 Commander mes lunettes</CTA></div>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] font-bold text-cyan-100/80">
            {['💵 Paiement à la livraison', '🚚 Livraison rapide', '🛡️ Moins d\'accidents', '⏳ Offre limitée'].map((b) => (
              <span key={b} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 backdrop-blur">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <VideoBlock
        video={MEDIA.v2} poster={MEDIA.m2} dark tone="gold" aspect="aspect-square"
        title={<>Ne craignez plus la <span className="lvn-grad-warm">nuit</span></>}
        sub="Voyez clairement dans l'obscurité — même quand les phares vous éblouissent."
        cta="Je commande maintenant"
        onCta={() => openModal()}
      />

      <Block
        img={MEDIA.m1} alt="Vision nocturne sur route"
        title="Route de nuit — chaque détail révélé."
        sub="Contraste renforcé pour distinguer marquages, panneaux et obstacles avant qu'il ne soit trop tard."
        cta="Essayer les lunettes"
        onCta={() => openModal()}
      />

      <Block
        img={MEDIA.m2} alt="Lunettes anti-éblouissement"
        title="Halos réduits — confort immédiat."
        sub="Fini les phares opposés qui vous aveuglent. Une vision apaisée, même sur autoroute."
        cta="Commander maintenant"
        onCta={() => openModal()}
      />

      {/* Avant / Après : images → titre → CTA */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-10 sm:py-14">
        <Reveal className="mx-auto max-w-[560px]">
          <div className="grid grid-cols-2 gap-3">
            <div className="overflow-hidden rounded-[20px] shadow-lg ring-2 ring-red-300/60">
              <LazyImg src={MEDIA.m3} alt="Avant — éblouissement" aspect="3/4" />
              <p className="bg-gradient-to-r from-red-500 to-rose-600 py-2 text-center text-[10px] font-black uppercase text-white">Avant 😵 Éblouissement</p>
            </div>
            <div className="overflow-hidden rounded-[20px] shadow-lg ring-2 ring-emerald-400/70 lvn-glow">
              <LazyImg src={MEDIA.product} alt="Après — vision nette" aspect="3/4" />
              <p className="bg-gradient-to-r from-emerald-500 to-teal-600 py-2 text-center text-[10px] font-black uppercase text-white">Après 😎 Vision nette</p>
            </div>
          </div>
          <div className="mt-5 text-center">
            <h2 className="text-[22px] font-black leading-tight text-slate-900 sm:text-[26px]">
              La différence est <span className="lvn-grad">immédiate</span>
            </h2>
            <p className="mt-2 text-[13px] text-slate-500">Halos réduits dès la première utilisation — conduite plus sereine.</p>
            <div className="mx-auto mt-5 max-w-sm"><CTA tone="gold" onClick={() => openModal()}>Profiter de l&apos;offre -50%</CTA></div>
          </div>
        </Reveal>
      </section>

      <VideoBlock
        video={MEDIA.v3} poster={MEDIA.m1}
        title="Conduite sous la pluie — vision claire garantie."
        sub="Routes mouillées, brouillard ou éclairage faible : vous voyez net."
        cta="Commander ma paire"
        onCta={() => openModal()}
      />

      <VideoBlock
        video={MEDIA.v4} poster={MEDIA.heroPoster}
        title="Protégez-vous — et protégez votre famille."
        sub="Chaque trajet de nuit devient plus sûr, plus confortable, moins stressant."
        cta="Je veux mes lunettes"
        onCta={() => openModal()}
      />

      <Block
        img={MEDIA.product} alt="Monture légère mixte"
        title="Monture légère, design élégant — mixte homme/femme."
        sub="Confortable toute la journée. Idéale en voiture comme au quotidien."
        cta="Choisir ma paire"
        onCta={() => openModal()}
      />

      {/* Avantages + CTA */}
      <section className="bg-white px-4 py-14">
        <Reveal className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-slate-900">Pourquoi ces <span className="lvn-grad">lunettes</span> ?</h2>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.t} delay={i * 70}>
                <div className="h-full rounded-2xl border border-cyan-100 bg-gradient-to-br from-indigo-50/60 to-cyan-50/40 p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-200/40">
                  <div className="text-2xl">{b.i}</div>
                  <p className="mt-1 text-[13px] font-black text-slate-900">{b.t}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{b.s}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal()}>Commander maintenant</CTA></div>
        </Reveal>
      </section>

      {/* Avis */}
      <section className="bg-gradient-to-b from-slate-50 to-indigo-50 px-4 py-14">
        <Reveal className="mx-auto max-w-[560px]">
          <div className="text-center">
            <p className="lvn-grad-warm text-[44px] font-black leading-none">4,8</p>
            <p className="mt-1 text-[15px] tracking-wide text-amber-400">★★★★★</p>
            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500">327 avis clients vérifiés</p>
          </div>
          <div className="mt-6 space-y-3">
            {REVIEWS.map((r, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md hover:shadow-cyan-200/40">
                  <div className="mb-2 flex gap-0.5 text-amber-400">★★★★★</div>
                  <p className="text-[13px] leading-relaxed text-slate-700">&ldquo;{r.t}&rdquo;</p>
                  <p className="mt-2 text-[11px] font-bold text-emerald-600">{r.n} · {r.v} ✓ Achat vérifié</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal()}>Rejoindre les clients satisfaits</CTA></div>
        </Reveal>
      </section>

      {/* Packs */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-14 text-white">
        <div className="lvn-stars pointer-events-none absolute inset-0 opacity-60" />
        <Reveal className="relative z-10 mx-auto max-w-[560px]">
          <h2 className="text-center text-[26px] font-black">Choisissez votre <span className="lvn-grad">pack</span></h2>
          <p className="mt-2 text-center text-[12px] text-cyan-200/70">⏱ Offre -50% valable encore {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</p>
          <div className="mt-7 space-y-3">
            {QTY_OPTS.map((o) => (
              <button key={o.v} type="button" onClick={() => { setSelectedPack(o.v); track('SelectPack', { pack: o.v, value: orderTotal(PRICES, o.v) }); }}
                className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-300 ${selectedPack === o.v ? 'scale-[1.02] border-cyan-400 bg-white/10 shadow-[0_0_30px_-6px_rgba(34,211,238,.5)] backdrop-blur' : 'border-white/15 bg-white/5 hover:border-cyan-400/50'}`}>
                {o.tag && <span className={`absolute -top-2.5 right-4 rounded-full px-3 py-0.5 text-[9px] font-black uppercase ${selectedPack === o.v ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white'}`}>{o.tag}</span>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selectedPack === o.v ? 'border-cyan-400 bg-cyan-400' : 'border-white/40'}`}>
                      {selectedPack === o.v && <span className="text-[10px] font-black text-slate-900">✓</span>}
                    </span>
                    <div><p className="font-black">{o.label}</p>{o.save && <p className="text-[11px] font-semibold text-emerald-400">{o.save}</p>}</div>
                  </div>
                  <p className="lvn-grad-warm text-[22px] font-black">{o.sub}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA tone="gold" onClick={() => openModal()}>Commander · {fmt(orderTotal(PRICES, selectedPack))} F</CTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] font-bold text-cyan-100/70">
            {['💵 Paiement à la livraison', '🔒 Sans risque', '🚚 Livraison rapide'].map((b) => (
              <span key={b} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{b}</span>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-4 py-12">
        <Reveal className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[20px] font-black text-slate-900">Questions <span className="lvn-grad">fréquentes</span></h2>
          <div className="mt-5 space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-cyan-100 bg-white transition-shadow hover:shadow-sm">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[13px] font-bold text-slate-800">
                  {f.q}<span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="border-t border-cyan-50 px-4 py-3 text-[12px] leading-relaxed text-slate-500">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Toast — achats récents (social proof) */}
      {toast && !modal && (
        <div className={`pointer-events-none fixed bottom-24 left-3 z-40 max-w-[310px] sm:bottom-8 ${toast.visible ? 'lvn-toast-in' : 'lvn-toast-out'}`}>
          <div className="flex items-center gap-2.5 rounded-xl border border-cyan-300/40 bg-slate-900/90 px-3.5 py-3 shadow-[0_14px_36px_-8px_rgba(34,211,238,.45)] backdrop-blur-md">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-[13px] font-black text-white ring-2 ring-cyan-300/40">
              <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/40" />
              <span className="relative">{toast.n[0]}</span>
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[12px] font-black text-white">
                <span className="text-cyan-300">{toast.n}</span> · {toast.v}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-300">
                vient de commander <span className="font-bold text-emerald-400">{toast.q}</span> · il y a {toast.t}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[9px] font-bold text-amber-300">★★★★★ <span className="text-slate-400">Achat vérifié</span></p>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">✓</span>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-cyan-400/30 bg-slate-950/95 px-4 py-3 backdrop-blur-md"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <div className="pointer-events-none min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-400">🔥 Offre -50% · Fin ce soir</p>
            <p className="text-[18px] font-black text-white">{fmt(orderTotal(PRICES, 1))} F <span className="text-[12px] font-bold text-white/40 line-through">{fmt(OLD_UNIT + DELIVERY_FEE_CI)} F</span></p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="pointer-events-auto lvn-pulse shrink-0 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-5 py-3.5 text-[12px] font-black uppercase text-slate-900 shadow-lg transition-transform hover:scale-[1.03] active:scale-95">
            Commander
          </button>
        </div>
      </div>

      <OrderModalDispatcher slug={SLUG} open={modal} onClose={() => setModal(false)}
        cfg={orderCfg} product={product} setProduct={setProduct} qtyOptions={QTY_OPTS} initialQty={qty} />

      <footer className="bg-slate-950 px-4 pb-8 pt-8 text-center text-white">
        <div className="mx-auto max-w-[560px]">
          <p className="text-[15px] font-black"><span className="lvn-grad">Lunettes Vision Nocturne</span></p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] font-bold text-cyan-100/70">
            {['💵 Paiement à la livraison', '🚚 Livraison rapide', '🛡️ Conduite sécurisée', '⭐ 4,8/5'].map((b) => (
              <span key={b} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{b}</span>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-500">© {new Date().getFullYear()} · Lunettes Vision Nocturne · Côte d&apos;Ivoire</p>
        </div>
      </footer>
    </div>
  );
}
