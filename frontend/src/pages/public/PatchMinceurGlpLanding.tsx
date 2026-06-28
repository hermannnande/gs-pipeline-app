/**
 * Tunnel premium — Patch Minceur GLP (PATCH_MINCEUR_GLP).
 * Slug : patch-minceur-glp · coachingexpertci.com/patch-minceur-glp/
 * Prix : {fmtTotal(1)} / 12 900 / 16 000 FCFA
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'patch-minceur-glp';
const PRODUCT_CODE = 'PATCH_MINCEUR_GLP';
const CONTENT_NAME = 'Patch Minceur GLP';
const META_PIXEL_ID = '924252450279192';
const THANK_YOU_URL = '/patch-minceur-glp/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 paquet',  sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 paquets', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi', save: 'Économisez 1 100 F' },
  { v: 3, label: '3 paquets', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 5 000 F' },
];

const M = (n: string) => `/patch-minceur-glp/${n}.webp`;
const MEDIA = {
  heroPoster: M('hero'),
  heroVideo: '/patch-minceur-glp/hero.mp4',
  v2: '/patch-minceur-glp/v2.mp4',
  m1: M('m1'), m2: M('m2'), m3: M('m3'), m4: M('m4'), m5: M('m5'),
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
        : <div className="min-h-[260px] animate-pulse bg-gradient-to-br from-violet-100 to-fuchsia-50" />}
    </div>
  );
}

function CTA({ onClick, children, tone = 'violet' }: { onClick: () => void; children: ReactNode; tone?: 'violet' | 'gold' | 'dark' }) {
  const cls = tone === 'gold' ? 'from-fuchsia-300 via-violet-400 to-purple-600 text-neutral-900'
    : tone === 'dark' ? 'from-violet-950 via-purple-900 to-neutral-900 text-violet-100'
      : 'from-violet-600 via-fuchsia-500 to-purple-600 text-white';
  return (
    <button type="button" onClick={onClick}
      className={`relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.14em] shadow-[0_18px_44px_-12px_rgba(139,92,246,.45)] ring-2 ring-violet-200/40 transition hover:scale-[1.02]`}>
      {children}
    </button>
  );
}

function Marquee({ items }: { items: string[] }) {
  const c = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-violet-200/40 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-purple-700 py-2.5 text-white">
      <div className="pmg-marquee flex gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.24em]">
        {c.map((t, i) => (<span key={i} className="inline-flex items-center gap-3">{t}<span className="opacity-50">◆</span></span>))}
      </div>
    </div>
  );
}

function Block({ img, alt, title, sub, cta, onCta }: { img: string; alt: string; title: string; sub: string; cta: string; onCta: () => void }) {
  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-[560px]">
        <div className="overflow-hidden rounded-[28px] shadow-xl ring-1 ring-violet-100"><LazyImg src={img} alt={alt} aspect="2/3" /></div>
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
  { i: '💊', t: 'Technologie GLP', s: 'Patch bien-être pensé pour accompagner votre minceur.' },
  { i: '⚡', t: 'Absorption x5', s: 'Technologie transdermique : libération progressive toute la journée.' },
  { i: '👕', t: 'Discret', s: 'Se porte sous les vêtements, invisible au quotidien.' },
  { i: '⏱', t: 'Routine simple', s: 'Application en quelques secondes, matin et soir.' },
  { i: '🔥', t: 'Minceur', s: 'Aide à cibler les graisses et affiner la silhouette.' },
  { i: '✨', t: 'Confort', s: 'Adhésif doux, confortable toute la journée.' },
];

const REVIEWS = [
  { t: 'J\'apprécie surtout le côté pratique. L\'application est simple et le produit reste discret sous les vêtements.', n: 'Nadia S.', v: 'Abidjan' },
  { t: 'Le design est propre, l\'utilisation est simple et je trouve le format vraiment adapté au quotidien.', n: 'Béatrice M.', v: 'Yopougon' },
  { t: 'Franchement satisfait. Je cherchais quelque chose de discret et simple à utiliser, c\'est exactement ce que je voulais.', n: 'Tomas L.', v: 'Bouaké' },
  { t: 'Très bonne expérience. Emballage soigné, produit pratique, la présentation donne vraiment confiance.', n: 'Trystan P.', v: 'Marcory' },
  { t: 'J\'aime beaucoup la discrétion du produit. L\'utilisation ne prend que quelques secondes.', n: 'Mireille D.', v: 'Cocody' },
];

export default function PatchMinceurGlpLanding() {
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
    document.title = 'Patch Minceur GLP — Bien-être & minceur';
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
    title: 'Patch Minceur GLP', images: { hero: MEDIA.heroPoster },
    metaPixelId: META_PIXEL_ID,
  }), [company]);

  const faqs = [
    { q: 'Comment appliquer le patch ?', a: 'Nettoyez la zone (ventre, bras…), posez le patch sur peau sèche et laissez agir selon la posologie. Remplacez selon les indications.' },
    { q: 'Est-ce discret ?', a: 'Oui, le patch est fin et se porte discrètement sous vos vêtements, à la maison comme en déplacement.' },
    { q: 'Paiement et livraison ?', a: 'Paiement à la livraison. Livraison rapide à Abidjan et dans les principales villes.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-fuchsia-50/40 pb-28">
      <style>{`
        .pmg-grad { background: linear-gradient(135deg,#7c3aed,#d946ef,#9333ea); -webkit-background-clip:text; background-clip:text; color:transparent; }
        @keyframes pmg-marquee { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
        .pmg-marquee { animation: pmg-marquee 28s linear infinite; }
      `}</style>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <Marquee items={['Patch Minceur GLP', `1 paquet ${fmtTotal(1)} Fr`, `2 paquets ${fmtTotal(2)} Fr`, `3 paquets ${fmtTotal(3)} Fr`, 'Discret · Pratique · Minceur', 'Paiement à la livraison']} />
      </div>

      <section className="px-4 pt-8 pb-12">
        <div className="mx-auto max-w-[560px] text-center">
          <span className="inline-flex rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase text-white">Patch bien-être GLP</span>
          <span className="ml-2 inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-[10px] font-black text-violet-800">⏱ {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>

          <div className="mt-5 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-violet-200">
            <video src={MEDIA.heroVideo} poster={MEDIA.heroPoster} autoPlay loop muted playsInline className="aspect-video w-full object-cover" />
          </div>

          <h1 className="mt-7 text-[30px] font-black leading-tight sm:text-[38px]">
            Patch minceur <span className="pmg-grad">GLP</span> — simple, discret & efficace
          </h1>
          <p className="mt-3 text-[14px] text-neutral-600">Absorption transdermique avancée · routine quotidienne · accompagne votre perte de poids.</p>

          <div className="mt-5 flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-neutral-500">Dès</span>
            <span className="pmg-grad text-5xl font-black sm:text-6xl">{fmtTotal(1)}</span>
            <span className="text-lg font-bold">FCFA</span>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal()}>Commander mon patch</CTA></div>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] font-bold text-neutral-600">
            {['💵 Paiement à la livraison', '🚚 Livraison rapide', '👕 Discret sous vêtements', '⏳ Offre limitée'].map((b) => (
              <span key={b} className="rounded-full bg-white px-3 py-1 ring-1 ring-violet-100">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-violet-950 to-purple-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-[520px]">
          <div className="overflow-hidden rounded-[28px] ring-2 ring-fuchsia-400/30">
            <video src={MEDIA.v2} poster={MEDIA.m4} autoPlay loop muted playsInline className="aspect-square w-full object-cover" />
          </div>
          <h2 className="mt-5 text-center text-[22px] font-black">Comme on le voit sur <span className="text-fuchsia-300">vous</span></h2>
          <p className="mt-2 text-center text-[13px] text-violet-200">Discret, pratique et facile à intégrer à votre routine du matin au soir.</p>
          <div className="mx-auto mt-5 max-w-sm"><CTA tone="gold" onClick={() => openModal()}>Je commande maintenant</CTA></div>
        </div>
      </section>

      <Block img={MEDIA.m1} alt="Patch GLP homme" title="Absorption 5 fois supérieure."
        sub="Technologie transdermique : libération progressive des ingrédients toute la journée." cta="Essayer le patch" onCta={() => openModal()} />
      <Block img={MEDIA.m2} alt="Patch minceur GLP" title="Marre des produits compliqués ?"
        sub="Un patch bien-être GLP pratique, discret et facile à intégrer à votre routine." cta="Commander maintenant" onCta={() => openModal()} />

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black">Pourquoi ce <span className="pmg-grad">patch</span> ?</h2>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {BENEFITS.map((b) => (
              <div key={b.t} className="rounded-2xl border border-violet-100 bg-violet-50/30 p-4">
                <div className="text-2xl">{b.i}</div>
                <p className="mt-1 text-[13px] font-black">{b.t}</p>
                <p className="mt-0.5 text-[11px] text-neutral-600">{b.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Block img={MEDIA.m3} alt="Patch GLP routine" title="Format discret, confort toute la journée."
        sub="Facile à appliquer, idéal à la maison comme en déplacement." cta="Profiter de l`offre" onCta={() => openModal()} />
      <Block img={MEDIA.m5} alt="Patch bien-être GLP" title="Une solution simple pour mincir."
        sub="Intégrez-le facilement à votre routine bien-être quotidienne." cta="Choisir mon pack" onCta={() => openModal()} />

      <section className="bg-gradient-to-b from-violet-950 to-purple-900 px-4 py-14 text-white">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <p className="text-[36px] font-black text-fuchsia-300">4,88</p>
            <p className="text-[12px] font-bold uppercase tracking-widest text-violet-300">★★★★★ · 24 avis clients</p>
          </div>
          <div className="mt-6 space-y-3">
            {REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/5 p-4 ring-1 ring-violet-400/20">
                <p className="text-[13px] leading-relaxed text-violet-50">{r.t}</p>
                <p className="mt-2 text-[11px] font-bold text-fuchsia-300">{r.n} · {r.v} ✓ Avis vérifié</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-fuchsia-50 to-violet-50 px-4 py-14">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[26px] font-black">Choisissez votre <span className="pmg-grad">pack</span></h2>
          <div className="mt-7 space-y-3">
            {QTY_OPTS.map((o) => (
              <button key={o.v} type="button" onClick={() => setSelectedPack(o.v)}
                className={`relative w-full rounded-2xl border-2 p-4 text-left transition ${selectedPack === o.v ? 'border-violet-500 bg-white shadow-lg' : 'border-violet-100 bg-white/80'}`}>
                {o.tag && selectedPack === o.v && <span className="absolute -top-2.5 right-4 rounded-full bg-violet-600 px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>}
                <div className="flex items-center justify-between">
                  <div><p className="font-black">{o.label}</p>{o.save && <p className="text-[11px] font-semibold text-fuchsia-600">{o.save}</p>}</div>
                  <p className="text-[22px] font-black text-violet-700">{o.sub}</p>
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
              <div key={i} className="rounded-2xl border border-violet-100 bg-white">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-bold">
                  {f.q}<span className="text-violet-600">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="border-t border-violet-50 px-4 py-3 text-[12px] text-neutral-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-violet-200 bg-white/95 px-4 py-3 backdrop-blur-md"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <div className="pointer-events-none min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-violet-600">Offre limitée</p>
            <p className="text-[18px] font-black">{fmt(orderTotal(PRICES, 1))} F · 1 paquet</p>
          </div>
          <button type="button" onClick={() => openModal(1)}
            className="pointer-events-auto shrink-0 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-[12px] font-black uppercase text-white shadow-lg">
            Commander
          </button>
        </div>
      </div>

      <OrderModalDispatcher slug={SLUG} open={modal} onClose={() => setModal(false)}
        cfg={orderCfg} product={product} setProduct={setProduct} qtyOptions={QTY_OPTS} initialQty={qty} />

      <footer className="px-4 pb-8 pt-4 text-center text-[10px] text-neutral-400">
        © {new Date().getFullYear()} · Patch Minceur GLP · Côte d'Ivoire
      </footer>
    </div>
  );
}
