/**
 * Tunnel premium — Bande sport minceur (BANDE_SPORT_MINCEUR).
 * Slug : bande-sport-minceur · Prix : 7 000 / 12 000 / 15 000 F
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'bande-sport-minceur';
const PRODUCT_CODE = 'BANDE_SPORT_MINCEUR';
const CONTENT_NAME = 'Bande sport minceur';
const META_PIXEL_ID = '1587475759254518';
const THANK_YOU_URL = '/bande-sport-minceur/merci';

const PRICES: Record<number, number> = { 1: 7000, 2: 12000, 3: 15000 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 bande',  sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 bandes', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi', save: 'Économisez 2 000 F' },
  { v: 3, label: '3 bandes', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 6 000 F' },
];

const M = (n: string) => `/bande-sport-minceur/${n}.webp`;
const MEDIA = {
  heroPoster: M('hero'),
  heroVideo: '/bande-sport-minceur/hero.mp4',
  v2: '/bande-sport-minceur/v2.mp4',
  m1: M('m1'), m2: M('m2'), m3: M('m3'), m4: M('m4'), m5: M('m5'),
};

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: any; _fbq?: any; dataLayer?: any[] } }

function initMetaPixel(id: string) {
  if (!id || window.fbq) return;
  const f: any = (window.fbq = function (...a: any[]) { f.callMethod ? f.callMethod(...a) : f.queue.push(a); });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', id); window.fbq('track', 'PageView');
}

function track(event: string, data: Record<string, unknown> = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
    if (typeof window.fbq === 'function') {
      const p = { content_name: CONTENT_NAME, content_ids: [PRODUCT_CODE], content_type: 'product', value: data.value as number, currency: 'XOF' };
      if (event === 'ViewContent') window.fbq('track', 'ViewContent', p);
      else if (event === 'OpenForm') window.fbq('track', 'InitiateCheckout', p);
      else if (event === 'SelectPack') window.fbq('track', 'AddToCart', p);
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

function LazyImg({ src, alt, priority, aspect }: { src: string; alt: string; priority?: boolean; aspect?: string }) {
  const { ref, visible } = useOnScreen();
  if (priority) return (
    <div className="overflow-hidden" style={aspect ? { aspectRatio: aspect } : undefined}>
      {/* @ts-expect-error fetchpriority */}
      <img src={src} alt={alt} loading="eager" fetchpriority="high" className="h-full w-full object-cover" />
    </div>
  );
  return (
    <div ref={ref} className="overflow-hidden" style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible ? <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
        : <div className="min-h-[260px] animate-pulse bg-gradient-to-br from-sky-100 to-emerald-50" />}
    </div>
  );
}

function CTA({ onClick, children, tone = 'sport' }: { onClick: () => void; children: ReactNode; tone?: 'sport' | 'dark' | 'lime' }) {
  const cls = tone === 'dark' ? 'from-slate-900 via-cyan-900 to-emerald-950 text-cyan-100'
    : tone === 'lime' ? 'from-lime-400 via-emerald-400 to-cyan-500 text-neutral-900'
      : 'from-sky-500 via-cyan-500 to-emerald-500 text-white';
  return (
    <button type="button" onClick={onClick}
      className={`relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.14em] shadow-[0_18px_44px_-12px_rgba(14,165,233,.5)] ring-2 ring-cyan-200/40 transition hover:scale-[1.02]`}>
      {children}
    </button>
  );
}

function Marquee({ items }: { items: string[] }) {
  const c = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-cyan-300/30 bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-600 py-2.5 text-white">
      <div className="bsm-marquee flex gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.24em]">
        {c.map((t, i) => (<span key={i} className="inline-flex items-center gap-3">{t}<span className="opacity-50">◆</span></span>))}
      </div>
    </div>
  );
}

function Block({ img, alt, title, sub, cta, onCta }: { img: string; alt: string; title: string; sub: string; cta: string; onCta: () => void }) {
  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-[560px]">
        <div className="overflow-hidden rounded-[28px] shadow-xl ring-1 ring-sky-100"><LazyImg src={img} alt={alt} aspect="2/3" /></div>
        <div className="mt-5 text-center">
          <h2 className="text-[22px] font-black leading-tight sm:text-[26px]">{title}</h2>
          <p className="mt-2 text-[13px] text-neutral-600">{sub}</p>
          <div className="mx-auto mt-5 max-w-sm"><CTA onClick={onCta}>{cta}</CTA></div>
        </div>
      </div>
    </section>
  );
}

const BENEFITS = [
  { i: '🏃', t: 'Sport & fitness', s: 'Accompagne vos séances et vos mouvements.' },
  { i: '🔥', t: 'Minceur', s: 'Aide à cibler la graisse et affiner la silhouette.' },
  { i: '💪', t: 'Bonne santé', s: 'Soutient une routine active au quotidien.' },
  { i: '⚡', t: 'Chaleur douce', s: 'Technologie qui active la circulation.' },
  { i: '🎯', t: 'Zones ciblées', s: 'Ventre, taille, hanches — là où ça compte.' },
  { i: '✨', t: 'Confort', s: 'Souple, respirante, facile à porter.' },
];

const REVIEWS = [
  { t: 'Je la porte pendant mes séances à la maison, je transpire plus et je me sens plus légère.', n: 'Aïcha', v: 'Cocody' },
  { t: 'Parfaite pour le sport et pour mincir en même temps. Livraison rapide, je recommande.', n: 'Mariam', v: 'Yopougon' },
  { t: 'Mon mari et moi on en a pris chacun une, résultats visibles en 2 semaines.', n: 'Fatou', v: 'Marcory' },
  { t: 'Bande de qualité, ne glisse pas. Bon rapport qualité-prix avec le pack 2.', n: 'Kone', v: 'Bouaké' },
];

export default function BandeSportMinceurLanding() {
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
    document.title = 'Bande sport minceur — Sport, santé & perte de poids';
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

  const orderCfg = useMemo(() => ({
    slug: SLUG, productCode: PRODUCT_CODE, thankYouUrl: THANK_YOU_URL, company, prices: PRICES,
    title: 'Bande sport minceur', images: { hero: MEDIA.heroPoster },
  }), [company]);

  const faqs = [
    { q: 'Comment porter la bande sport ?', a: 'Placez-la sur la zone à travailler (ventre, taille…) pendant le sport ou la marche, 30 min à 2 h par jour.' },
    { q: 'Est-ce que ça aide vraiment à mincir ?', a: 'La chaleur et la compression ciblée activent la transpiration et soutiennent vos efforts minceur avec une alimentation équilibrée.' },
    { q: 'Paiement et livraison ?', a: 'Paiement à la livraison. Livraison rapide à Abidjan et dans les principales villes.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50/40 pb-28">
      <style>{`
        .bsm-grad { background: linear-gradient(135deg,#0284c7,#06b6d4,#10b981); -webkit-background-clip:text; background-clip:text; color:transparent; }
        @keyframes bsm-marquee { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
        .bsm-marquee { animation: bsm-marquee 28s linear infinite; }
      `}</style>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <Marquee items={['Bande sport minceur', `1 bande ${fmtTotal(1)} Fr`, `2 bandes ${fmtTotal(2)} Fr`, `3 bandes ${fmtTotal(3)} Fr`, 'Sport · Santé · Minceur', 'Paiement à la livraison']} />
      </div>

      <section className="px-4 pt-8 pb-12">
        <div className="mx-auto max-w-[560px] text-center">
          <span className="inline-flex rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-black uppercase text-white">🏋️ Sport & minceur</span>
          <span className="ml-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black text-cyan-800">⏱ {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>

          <div className="mt-5 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-cyan-200">
            <video src={MEDIA.heroVideo} poster={MEDIA.heroPoster} autoPlay loop muted playsInline className="aspect-video w-full object-cover" />
          </div>

          <h1 className="mt-7 text-[30px] font-black leading-tight sm:text-[38px]">
            Bande sport minceur — <span className="bsm-grad">bonne santé</span> & perte de poids
          </h1>
          <p className="mt-3 text-[14px] text-neutral-600">Améliore vos performances · active la transpiration · affine votre silhouette naturellement.</p>

          <div className="mt-5 flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-neutral-500">Dès</span>
            <span className="bsm-grad text-5xl font-black sm:text-6xl">{fmtTotal(1)}</span>
            <span className="text-lg font-bold">FCFA</span>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal()}>Commander ma bande</CTA></div>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] font-bold text-neutral-600">
            {['💵 Paiement à la livraison', '🚚 Livraison rapide', '🏃 Sport & minceur', '⏳ Offre limitée'].map((b) => (
              <span key={b} className="rounded-full bg-white px-3 py-1 ring-1 ring-sky-100">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-900 to-cyan-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-[520px]">
          <div className="overflow-hidden rounded-[28px] ring-2 ring-cyan-400/30">
            <video src={MEDIA.v2} poster={MEDIA.m1} autoPlay loop muted playsInline className="aspect-square w-full object-cover" />
          </div>
          <h2 className="mt-5 text-center text-[22px] font-black">Bougez · Transpirez · <span className="text-lime-300">Mincissez</span></h2>
          <div className="mx-auto mt-5 max-w-sm"><CTA tone="lime" onClick={() => openModal()}>Je commande maintenant</CTA></div>
        </div>
      </section>

      <Block img={MEDIA.m1} alt="Bande sport minceur en action" title="Une bande pensée pour le sport et la minceur."
        sub="Compression ciblée + chaleur douce pour maximiser vos séances." cta="Essayer la bande" onCta={() => openModal()} />
      <Block img={MEDIA.m2} alt="Résultats bande sport" title="Affinez votre silhouette en restant actif."
        sub="Idéal pendant la marche, le fitness ou les exercices à domicile." cta="Commander maintenant" onCta={() => openModal()} />

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black">Pourquoi choisir cette <span className="bsm-grad">bande</span> ?</h2>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {BENEFITS.map((b) => (
              <div key={b.t} className="rounded-2xl border border-sky-100 bg-sky-50/30 p-4">
                <div className="text-2xl">{b.i}</div>
                <p className="mt-1 text-[13px] font-black">{b.t}</p>
                <p className="mt-0.5 text-[11px] text-neutral-600">{b.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Block img={MEDIA.m3} alt="Confort bande sport" title="Confortable, souple et efficace."
        sub="Se porte discrètement sous vos vêtements de sport." cta="Profiter de l'offre" onCta={() => openModal()} />
      <Block img={MEDIA.m4} alt="Bande minceur premium" title="Le choix des sportifs qui veulent mincir."
        sub="Des milliers de bandes vendues en Côte d`Ivoire." cta="Choisir mon pack" onCta={() => openModal()} />

      <section className="bg-gradient-to-b from-cyan-950 to-slate-900 px-4 py-14 text-white">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black">Avis <span className="text-lime-300">clients</span></h2>
          <div className="mt-6 space-y-3">
            {REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/5 p-4 ring-1 ring-cyan-400/20">
                <p className="text-[13px] leading-relaxed text-cyan-50">{r.t}</p>
                <p className="mt-2 text-[11px] font-bold text-lime-300">{r.n} · {r.v} ✓✓</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-emerald-50 to-sky-50 px-4 py-14">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[26px] font-black">Choisissez votre <span className="bsm-grad">pack</span></h2>
          <div className="mt-7 space-y-3">
            {QTY_OPTS.map((o) => (
              <button key={o.v} type="button" onClick={() => setSelectedPack(o.v)}
                className={`relative w-full rounded-2xl border-2 p-4 text-left transition ${selectedPack === o.v ? 'border-cyan-500 bg-white shadow-lg' : 'border-sky-100 bg-white/80'}`}>
                {o.tag && selectedPack === o.v && <span className="absolute -top-2.5 right-4 rounded-full bg-cyan-500 px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>}
                <div className="flex items-center justify-between">
                  <div><p className="font-black">{o.label}</p>{o.save && <p className="text-[11px] font-semibold text-emerald-600">{o.save}</p>}</div>
                  <p className="text-[22px] font-black text-cyan-700">{o.sub}</p>
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
              <div key={i} className="rounded-2xl border border-sky-100 bg-white">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-bold">
                  {f.q}<span className="text-cyan-600">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="border-t border-sky-50 px-4 py-3 text-[12px] text-neutral-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-sky-200 bg-white/95 px-4 py-3 backdrop-blur-md"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <div className="pointer-events-none min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-cyan-600">Offre limitée</p>
            <p className="text-[18px] font-black">{fmt(orderTotal(PRICES, 1))} F · 1 bande</p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="pointer-events-auto shrink-0 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-3.5 text-[12px] font-black uppercase text-white shadow-lg">
            Commander
          </button>
        </div>
      </div>

      <OrderModalDispatcher slug={SLUG} open={modal} onClose={() => setModal(false)}
        cfg={orderCfg} product={product} setProduct={setProduct} qtyOptions={QTY_OPTS} initialQty={qty} />

      <footer className="px-4 pb-8 pt-4 text-center text-[10px] text-neutral-400">
        © {new Date().getFullYear()} · Bande sport minceur · Côte d'Ivoire
      </footer>
    </div>
  );
}
