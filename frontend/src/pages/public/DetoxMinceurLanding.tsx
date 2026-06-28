/**
 * Tunnel premium — Pack Détox Minceur (PATCH_DETOX_MINCEUR).
 * Slug : detoxminceur · Remplace Elementor obrille.com/detoxminceur/
 * Prix : {fmtTotal(1)} / 12 000 / 15 000 FCFA
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'detoxminceur';
const PRODUCT_CODE = 'PATCH_DETOX_MINCEUR';
const CONTENT_NAME = 'Pack Détox Minceur';
const META_PIXEL_ID = '2067584707359831';
const THANK_YOU_URL = '/detoxminceur/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 boîte',  sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 boîtes', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi', save: 'Économisez 2 000 F' },
  { v: 3, label: '3 boîtes', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 6 000 F' },
];

const M = (n: string) => `/detoxminceur/${n}.webp`;
const MEDIA = {
  heroPoster: M('hero'),
  heroVideo: '/detoxminceur/hero.mp4',
  gif1: '/detoxminceur/gif1.gif',
  m1: M('m1'), m2: M('m2'),
  ba1b: M('ba1-before'), ba1a: M('ba1-after'),
  ba2b: M('ba2-before'), ba2a: M('ba2-after'),
  ba3b: M('ba3-before'), ba3a: M('ba3-after'),
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
      {visible ? <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        : <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-emerald-100 to-lime-50" />}
    </div>
  );
}

function CTA({ onClick, children, tone = 'green' }: { onClick: () => void; children: ReactNode; tone?: 'green' | 'gold' | 'dark' }) {
  const cls = tone === 'gold' ? 'from-lime-300 via-emerald-400 to-green-600 text-neutral-900'
    : tone === 'dark' ? 'from-emerald-900 via-green-900 to-neutral-900 text-lime-100'
      : 'from-emerald-500 via-lime-500 to-green-600 text-white';
  return (
    <button type="button" onClick={onClick}
      className={`group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.16em] shadow-[0_18px_44px_-12px_rgba(16,185,129,.45)] ring-2 ring-emerald-200/50 transition hover:scale-[1.02]`}>
      {children}
    </button>
  );
}

function Marquee({ items }: { items: string[] }) {
  const content = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-emerald-200/40 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 py-2.5 text-white">
      <div className="dxm-marquee flex gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.24em]">
        {content.map((t, i) => (<span key={i} className="inline-flex items-center gap-3">{t}<span className="opacity-50">◆</span></span>))}
      </div>
    </div>
  );
}

function Block({ img, alt, title, sub, cta, onCta }: { img: string; alt: string; title: string; sub: string; cta: string; onCta: () => void }) {
  return (
    <section className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-[560px]">
        <div className="overflow-hidden rounded-[28px] shadow-xl ring-1 ring-emerald-100"><LazyImg src={img} alt={alt} aspect="2/3" /></div>
        <div className="mt-5 text-center">
          <h2 className="text-[22px] font-black leading-tight sm:text-[26px]">{title}</h2>
          <p className="mt-2 text-[13px] text-neutral-600">{sub}</p>
          <div className="mx-auto mt-5 max-w-sm"><CTA onClick={onCta}>{cta}</CTA></div>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { b: MEDIA.ba1b, a: MEDIA.ba1a, q: '« En 14 jours, j\'ai vu mon ventre dégonfler. Texture agréable, pas gras, j\'adore ! »', n: 'Marie, 29 ans', s: 'Perte de tour de taille' },
  { b: MEDIA.ba2b, a: MEDIA.ba2a, q: '« J\'avais des bourrelets sur les côtés. Le produit affine zone par zone, résultat progressif. »', n: 'Awa, 34 ans', s: 'Hanches & bas du dos' },
  { b: MEDIA.ba3b, a: MEDIA.ba3a, q: '« Peau plus lisse, moins de cellulite, j\'ai repris confiance en quelques semaines. »', n: 'Sandra, 37 ans', s: 'Cuisses & fesses' },
];

export default function DetoxMinceurLanding() {
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
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, [selectedPack]);

  useEffect(() => {
    document.title = 'Pack Détox Minceur — Offre spéciale';
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
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const orderCfg = useMemo(() => ({
    slug: SLUG, productCode: PRODUCT_CODE, thankYouUrl: THANK_YOU_URL, company, prices: PRICES,
    title: 'Pack Détox Minceur', images: { hero: MEDIA.heroPoster },
    metaPixelId: META_PIXEL_ID,
  }), [company]);

  const faqs = [
    { q: 'Comment utiliser le pack détox ?', a: 'Suivez la posologie indiquée sur la boîte, matin et soir, avec une alimentation légère et de l\'eau.' },
    { q: 'Quand voir des résultats ?', a: 'La plupart des clientes ressentent un ventre moins gonflé dès la 1ère semaine. Résultats visibles en 2 à 4 semaines.' },
    { q: 'Paiement et livraison ?', a: 'Paiement à la livraison uniquement. Livraison rapide à Abidjan et principales villes de Côte d\'Ivoire.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] via-white to-[#ecfdf5] pb-28 text-neutral-900">
      <style>{`
        .dxm-grad { background: linear-gradient(135deg,#059669,#22c55e,#84cc16); -webkit-background-clip:text; background-clip:text; color:transparent; }
        @keyframes dxm-marquee { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
        .dxm-marquee { animation: dxm-marquee 28s linear infinite; }
      `}</style>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <Marquee items={['Offre spéciale Detox', `1 boîte ${fmtTotal(1)} Fr`, `2 boîtes ${fmtTotal(2)} Fr`, `3 boîtes ${fmtTotal(3)} Fr`, 'Paiement à la livraison', 'Perdez du poids rapidement']} />
      </div>

      <section className="px-4 pt-8 pb-12">
        <div className="mx-auto max-w-[560px] text-center">
          <span className="inline-flex rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">Offre Detox</span>
          <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">⏱ {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>

          <div className="mt-5 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-emerald-200">
            <video src={MEDIA.heroVideo} poster={MEDIA.heroPoster} autoPlay loop muted playsInline className="aspect-video w-full object-cover" />
          </div>

          <h1 className="mt-7 text-[30px] font-black leading-tight sm:text-[38px]">
            Offre spéciale <span className="text-orange-600">Detox</span> — perdez du <span className="text-red-600">poids</span> en quelques jours
          </h1>
          <p className="mt-3 text-[14px] text-neutral-600">Purifiez votre corps · brûlez les graisses · retrouvez une silhouette plus légère.</p>

          <div className="mt-5 flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-neutral-500">Dès</span>
            <span className="dxm-grad text-5xl font-black sm:text-6xl">{fmtTotal(1)}</span>
            <span className="text-lg font-bold">FCFA</span>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal()}>Commander ma détox</CTA></div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-emerald-900 to-green-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-[520px]">
          <div className="overflow-hidden rounded-[28px] ring-2 ring-lime-400/30">
            <img src={MEDIA.gif1} alt="Pack détox en action" className="aspect-square w-full object-cover" loading="lazy" />
          </div>
          <h2 className="mt-5 text-center text-[22px] font-black">Détoxifiez · Affinez · <span className="text-lime-300">Transformez</span></h2>
          <div className="mx-auto mt-5 max-w-sm"><CTA tone="gold" onClick={() => openModal()}>Je veux ma cure détox</CTA></div>
        </div>
      </section>

      <Block img={MEDIA.m1} alt="Pack détox minceur" title="Une formule complète pour purifier et mincir."
        sub="Ingredients naturels sélectionnés pour éliminer les toxines et activer le métabolisme."
        cta="Commander maintenant" onCta={() => openModal()} />

      <Block img={MEDIA.m2} alt="Résultats détox" title="Affinez votre silhouette naturellement."
        sub="Idéal pour celles qui veulent un ventre plus plat et moins de rétention d`eau."
        cta="Profiter de l`offre" onCta={() => openModal()} />

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black">Témoignages clients <span className="dxm-grad">100% satisfaits</span></h2>
          <div className="mt-7 space-y-5">
            {TESTIMONIALS.map((t, i) => (
              <article key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Avant</p><LazyImg src={t.b} alt={`Avant ${i + 1}`} aspect="3/4" className="rounded-xl" /></div>
                  <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Après</p><LazyImg src={t.a} alt={`Après ${i + 1}`} aspect="3/4" className="rounded-xl" /></div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-neutral-700">{t.q}</p>
                <p className="mt-2 text-[12px] font-bold text-emerald-800">{t.n} · {t.s}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-lime-50 to-emerald-50 px-4 py-14">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[26px] font-black">Choisissez votre <span className="dxm-grad">pack</span></h2>
          <div className="mt-7 space-y-3">
            {QTY_OPTS.map((o) => (
              <button key={o.v} type="button" onClick={() => setSelectedPack(o.v)}
                className={`relative w-full rounded-2xl border-2 p-4 text-left transition ${selectedPack === o.v ? 'border-emerald-500 bg-white shadow-lg' : 'border-emerald-100 bg-white/80'}`}>
                {o.tag && selectedPack === o.v && <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>}
                <div className="flex items-center justify-between">
                  <div><p className="font-black">{o.label}</p>{o.save && <p className="text-[11px] font-semibold text-emerald-600">{o.save}</p>}</div>
                  <p className="text-[22px] font-black text-emerald-700">{o.sub}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal()}>Commander · {fmt(orderTotal(PRICES, selectedPack))} F</CTA></div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[20px] font-black">Questions fréquentes</h2>
          <div className="mt-4 space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl border border-emerald-100 bg-white">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-bold">
                  {f.q}<span className="text-emerald-600">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="border-t border-emerald-50 px-4 py-3 text-[12px] text-neutral-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 backdrop-blur-md"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <div className="pointer-events-none min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Offre limitée</p>
            <p className="text-[18px] font-black">{fmt(orderTotal(PRICES, 1))} F · 1 boîte</p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="pointer-events-auto shrink-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-3.5 text-[12px] font-black uppercase text-white shadow-lg">
            Commander
          </button>
        </div>
      </div>

      <OrderModalDispatcher slug={SLUG} open={modal} onClose={() => setModal(false)}
        cfg={orderCfg} product={product} setProduct={setProduct} qtyOptions={QTY_OPTS} initialQty={qty} />

      <footer className="px-4 pb-8 pt-4 text-center text-[10px] text-neutral-400">
        © {new Date().getFullYear()} · Pack Détox Minceur · Côte d'Ivoire
      </footer>
    </div>
  );
}
