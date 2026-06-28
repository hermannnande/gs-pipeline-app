/**
 * Tunnel de vente — CHAPEAU GAVROCHE (mapping CHAPEAU_GAVROCHE).
 * Slug : chapeau-gavroche
 *
 * Palette PREMIUM vintage moderne :
 *   - Noir profond #0a0a0a, blanc casse #faf7f0, beige #e7d8b8,
 *     marron chic #6b4423, doré #d4af37
 * Vibe : magazine GQ vintage, peu de texte, beaucoup d'images.
 *
 * Structure : pattern repete "1 image grande = 1 phrase courte = 1 CTA lumineux"
 * pour TOUTES les 11 images (aucune repetition, aucune image cachee).
 * 2 tickers lumineux dores entre les fiches. Notifications achats temps reel.
 *
 * Pour modifier :
 *  - Prix : tableau PRICES (lignes ~25)
 *  - Pixel Meta : META_PIXEL_ID (ligne ~22)
 *  - Medias : URLs WordPress dans MEDIA (externes)
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import type { OrderProduct } from '../../hooks/useOrderSubmit';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';
import { optimImg } from '../../utils/img';

const SLUG = 'chapeau-gavroche';
const PRODUCT_CODE = 'CHAPEAU_GAVROCHE';
// Pixel Meta dedie a la campagne Chapeau Gavroche (Purchase + CAPI dedup via eventID = orderReference)
const META_PIXEL_ID = '1613380123108753';
const THANK_YOU_URL = '/chapeau-gavroche/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 chapeau',  sub: packLabel(PRICES, 1, 'F') },
  { v: 2, label: '2 chapeaux', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi',     save: 'Économisez 1 900 F' },
  { v: 3, label: '3 chapeaux', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure valeur', save: 'Économisez 5 800 F + livraison express' },
];

const WP = (n: string) => optimImg(`https://obrille.com/wp-content/uploads/2026/05/${n}`, 1000);
const MEDIA = {
  m01: WP('ChatGPT-Image-23-mai-2026-22_27_26.png'),
  m02: WP('ChatGPT-Image-23-mai-2026-22_27_11.png'),
  m03: WP('ChatGPT-Image-23-mai-2026-22_26_52-1.png'),
  m04: WP('ChatGPT-Image-23-mai-2026-22_27_43.png'),
  m05: WP('ChatGPT-Image-23-mai-2026-22_27_16.png'),
  m06: WP('ChatGPT-Image-23-mai-2026-22_27_07.png'),
  m07: WP('ChatGPT-Image-23-mai-2026-22_27_33.png'),
  m08: WP('ChatGPT-Image-23-mai-2026-22_27_47.png'),
  m09: WP('ChatGPT-Image-23-mai-2026-22_27_59.png'),
  m10: WP('ChatGPT-Image-23-mai-2026-22_27_54.png'),
  m11: WP('ChatGPT-Image-23-mai-2026-22_28_10.png'),
};

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

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

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
const pad = (n: number) => String(n).padStart(2, '0');

/* ---------------- Hooks ---------------- */

function useOnScreen(rootMargin = '320px') {
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

function useEndOfDayCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return useMemo(() => {
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    let diff = Math.max(0, Math.floor((end.getTime() - now) / 1000));
    const h = Math.floor(diff / 3600); diff -= h * 3600;
    const m = Math.floor(diff / 60); const s = diff - m * 60;
    return { h: pad(h), m: pad(m), s: pad(s) };
  }, [now]);
}

/* ---------------- Lazy image ---------------- */

function LazyImg({ src, alt, priority, className = '', width, height, aspect }: {
  src: string; alt: string; priority?: boolean; className?: string;
  width?: number; height?: number; aspect?: string;
}) {
  const { ref, visible } = useOnScreen('340px');
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img
          src={src} alt={alt} loading="eager" decoding="async"
          width={width} height={height}
          // @ts-expect-error fetchpriority valid HTML
          fetchpriority="high"
          className="block h-auto w-full"
        />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {visible ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" width={width} height={height} className="block h-auto w-full" />
      ) : (
        <div className={`w-full bg-gradient-to-br from-stone-100 to-stone-200 ${aspect || 'aspect-[4/5]'}`} />
      )}
    </div>
  );
}

/* ---------------- CTA fluide lumineux ---------------- */

function LuminousCTA({ onClick, children, variant = 'gold', large, className = '' }: {
  onClick: () => void; children: ReactNode;
  variant?: 'gold' | 'dark' | 'outline';
  large?: boolean; className?: string;
}) {
  const palettes: Record<string, string> = {
    gold:
      'from-amber-500 via-yellow-300 to-amber-600 text-stone-900 shadow-[0_18px_44px_-10px_rgba(212,175,55,0.75)] ring-2 ring-amber-300/70',
    dark:
      'from-stone-900 via-stone-800 to-stone-900 text-amber-300 shadow-[0_18px_44px_-12px_rgba(10,10,10,0.7)] ring-2 ring-amber-400/60',
    outline:
      'from-transparent via-transparent to-transparent text-amber-300 shadow-[0_8px_24px_-12px_rgba(212,175,55,0.4)] ring-2 ring-amber-400 hover:bg-amber-400/10',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cg-cta cg-cta-pulse group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${palettes[variant]} ${large ? 'px-8 py-4 text-base font-extrabold' : 'px-6 py-3 text-sm font-bold'} uppercase tracking-[0.12em] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] active:scale-95 ${className}`}
    >
      <span className="cg-cta-sheen pointer-events-none absolute inset-0" aria-hidden />
      <span className="cg-cta-glow pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      <span className="relative">{children}</span>
      <svg className="relative h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ---------------- Fiche : image + phrase courte + CTA lumineux ---------------- */

function ImageFiche({ src, alt, phrase, highlight, ctaLabel, ctaVariant = 'gold', onOrder, priority, dark = false }: {
  src: string;
  alt: string;
  phrase: string;
  highlight?: string[];
  ctaLabel: string;
  ctaVariant?: 'gold' | 'dark' | 'outline';
  onOrder: () => void;
  priority?: boolean;
  /** Fond noir pour effet contraste */
  dark?: boolean;
}) {
  let rendered: ReactNode = phrase;
  if (highlight && highlight.length) {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = phrase.split(new RegExp(`(${highlight.map(escape).join('|')})`, 'gi'));
    rendered = parts.map((p, i) =>
      highlight.some((h) => h.toLowerCase() === p.toLowerCase()) ? (
        <span key={i} className="cg-grad-gold italic font-black">{p}</span>
      ) : (<span key={i}>{p}</span>),
    );
  }
  return (
    <section className={`relative px-3 py-10 sm:py-14 ${dark ? 'bg-[#0a0a0a]' : 'bg-[#faf7f0]'}`}>
      <div className="mx-auto max-w-3xl">
        <div className={`relative overflow-hidden rounded-3xl shadow-[0_30px_70px_-30px_rgba(10,10,10,0.4)] ${dark ? 'ring-1 ring-amber-400/30' : 'ring-1 ring-stone-900/10'}`}>
          <LazyImg src={src} alt={alt} priority={priority} aspect="aspect-[4/5]" width={1024} height={1280} />
          <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-amber-400/20 blur-2xl" aria-hidden />
        </div>
        <p className={`mx-auto mt-7 max-w-xl text-center text-2xl font-black leading-tight sm:text-3xl ${dark ? 'text-stone-100' : 'text-stone-900'}`}>
          {rendered}
        </p>
        <div className="mt-6 flex justify-center">
          <LuminousCTA onClick={onOrder} variant={ctaVariant} large>
            {ctaLabel}
          </LuminousCTA>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Ticker lumineux defilant ---------------- */

function LuminousTicker({ messages, variant = 'gold' }: { messages: string[]; variant?: 'gold' | 'dark' }) {
  const text = messages.join('   ✦   ');
  return (
    <div className={`cg-ticker-wrap relative overflow-hidden py-3 ${variant === 'gold' ? 'cg-ticker-gold' : 'cg-ticker-dark'}`}>
      <div className="cg-ticker-shine pointer-events-none absolute inset-0" aria-hidden />
      <div className="cg-ticker-track relative flex whitespace-nowrap text-sm font-black uppercase tracking-[0.3em]">
        <span>{text}</span>
        <span className="mx-12">✦</span>
        <span aria-hidden>{text}</span>
        <span aria-hidden className="mx-12">✦</span>
      </div>
    </div>
  );
}

/* ---------------- Notifications achats temps reel ---------------- */

const NOTIFICATIONS = [
  { nom: 'Yao',     ville: 'Cocody',      pack: '1 chapeau',  t: 3 },
  { nom: 'Aminata', ville: 'Yopougon',    pack: '2 chapeaux', t: 9 },
  { nom: 'Kouassi', ville: 'Marcory',     pack: '1 chapeau',  t: 17 },
  { nom: 'Mariam',  ville: 'Bingerville', pack: '1 chapeau',  t: 24 },
  { nom: 'Brou',    ville: 'Plateau',     pack: '3 chapeaux', t: 38 },
  { nom: 'Fatou',   ville: 'Treichville', pack: '2 chapeaux', t: 51 },
  { nom: 'Konaté',  ville: 'Abobo',       pack: '1 chapeau',  t: 67 },
  { nom: 'Salif',   ville: 'Bouaké',      pack: '2 chapeaux', t: 82 },
  { nom: 'Adjoua',  ville: 'San-Pédro',   pack: '1 chapeau',  t: 96 },
  { nom: 'Awa',     ville: 'Adjamé',      pack: '3 chapeaux', t: 115 },
];

function RecentToast() {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'hidden' | 'in' | 'out'>('hidden');

  useEffect(() => {
    let cancelled = false;
    let timers: number[] = [];
    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(id);
    };
    const showCycle = (idx: number) => {
      if (cancelled) return;
      setI(idx); setPhase('in');
      schedule(() => {
        setPhase('out');
        schedule(() => {
          setPhase('hidden');
          schedule(() => showCycle((idx + 1) % NOTIFICATIONS.length), 3000);
        }, 450);
      }, 6000);
    };
    schedule(() => showCycle(0), 4000);
    return () => { cancelled = true; timers.forEach((t) => window.clearTimeout(t)); };
  }, []);

  if (phase === 'hidden') return null;
  const n = NOTIFICATIONS[i];
  const tLabel = n.t < 60 ? `il y a ${n.t} min` : `il y a ${Math.floor(n.t / 60)} h`;

  return (
    <div className={`cg-toast fixed bottom-20 left-3 z-[55] sm:bottom-4 sm:left-4 ${phase === 'in' ? 'cg-toast-in' : 'cg-toast-out'}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl bg-[#0a0a0a] px-3 py-2.5 pr-4 shadow-[0_18px_48px_-18px_rgba(10,10,10,0.6)] ring-1 ring-amber-400/40 backdrop-blur-md">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-900 shadow-md">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4 0-7 2.5-7 6 0 1.5.5 2.5 1.5 3.5L4 14l1 3h14l1-3-2.5-1.5C18.5 11.5 19 10.5 19 9c0-3.5-3-6-7-6z" />
          </svg>
          <span className="cg-pulse absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-stone-900" />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-extrabold text-stone-100">
            {n.nom} <span className="font-semibold text-stone-400">à {n.ville}</span>
          </p>
          <p className="text-[11px] text-stone-300">vient de commander <span className="font-bold text-amber-300">{n.pack}</span></p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            <span className="cg-pulse mr-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-emerald-500" />
            {tLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Bandeau annonce vintage haut de page ---------------- */

function AnnouncementBar() {
  return (
    <div className="relative overflow-hidden bg-[#0a0a0a] text-stone-200">
      <div className="cg-marquee flex items-center gap-12 whitespace-nowrap py-2.5 text-[11px] font-bold uppercase tracking-[0.32em]">
        <span><span className="text-amber-400">✦</span> Édition Premium 2026</span>
        <span><span className="text-amber-400">✦</span> Livraison rapide CI</span>
        <span><span className="text-amber-400">✦</span> Paiement à la livraison</span>
        <span><span className="text-amber-400">✦</span> Homme & Femme</span>
        <span><span className="text-amber-400">✦</span> Style vintage moderne</span>
        <span aria-hidden><span className="text-amber-400">✦</span> Édition Premium 2026</span>
        <span aria-hidden><span className="text-amber-400">✦</span> Livraison rapide CI</span>
        <span aria-hidden><span className="text-amber-400">✦</span> Paiement à la livraison</span>
        <span aria-hidden><span className="text-amber-400">✦</span> Homme & Femme</span>
        <span aria-hidden><span className="text-amber-400">✦</span> Style vintage moderne</span>
      </div>
    </div>
  );
}

/* ---------------- Page principale ---------------- */

export default function ChapeauGavrocheLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialQty, setInitialQty] = useState(1);
  const [product, setProduct] = useState<OrderProduct | null>(null);
  const cd = useEndOfDayCountdown();
  const pixelFired = useRef(false);

  const openModal = useCallback((qty: number = 1) => {
    setInitialQty(qty);
    setModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    const prev = document.title;
    document.title = `CHAPEAU GAVROCHE — ${fmtTotal(1)} F · Le détail chic`;
    trackPageView(SLUG);
    if (!pixelFired.current && META_PIXEL_ID) {
      pixelFired.current = true;
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'CHAPEAU GAVROCHE',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
        currency: 'XOF',
      });
    }
    return () => { document.title = prev; };
  }, []);

  const orderCfg = {
    slug: SLUG, productCode: PRODUCT_CODE, title: 'CHAPEAU GAVROCHE',
    prices: PRICES, metaPixelId: META_PIXEL_ID || undefined,
    thankYouUrl: THANK_YOU_URL, images: { hero: MEDIA.m01 },
  };

  return (
    <div className="cg-root antialiased">
      <CgCSS />

      <AnnouncementBar />

      {/* ============ HERO — IMAGE EN HAUT, TEXTE EN BAS ============ */}
      <header className="relative overflow-hidden bg-[#faf7f0]">
        <div className="cg-hero-grain absolute inset-0 opacity-[0.04]" aria-hidden />
        <div className="cg-hero-bg absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-3 pt-6 pb-8 sm:pt-8">

          {/* IMAGE EN HAUT — grand format, priority */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-amber-400/20 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-stone-900/10 shadow-[0_40px_80px_-30px_rgba(10,10,10,0.45)]">
              <LazyImg src={MEDIA.m01} alt="Chapeau Gavroche Premium" priority width={1024} height={1280} />
              {/* Petite étiquette flottante "Édition 2026" */}
              <span className="absolute right-3 top-3 -rotate-3 rounded-xl border-2 border-stone-900 bg-[#faf7f0] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-stone-900 shadow-lg">
                Édition <span className="text-amber-700">2026</span>
              </span>
              {/* Étiquette prix collée en bas */}
              <span className="absolute bottom-3 left-3 rotate-1 rounded-xl bg-stone-900 px-3 py-1.5 text-amber-300 shadow-xl">
                <span className="block text-[8px] font-bold uppercase tracking-[0.3em] text-stone-400">À partir de</span>
                <span className="block text-lg font-black leading-none">{fmtTotal(1)} <span className="text-amber-400">F</span></span>
              </span>
            </div>
          </div>

          {/* TEXTE EN BAS — sous l`image */}
          <div className="mt-7 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-stone-900/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-stone-700 ring-1 ring-stone-900/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 cg-pulse" />
              Édition Premium · Stock limité
            </span>
            <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight text-stone-900 sm:text-6xl md:text-7xl">
              <span className="cg-grad-gold italic">Chapeau</span>
              <br />
              <span className="text-stone-900">Gavroche</span>
            </h1>
            <p className="mt-4 text-base font-semibold text-stone-600 sm:text-lg">
              Le détail chic qui transforme ton style.
            </p>
            <div className="mt-6 flex justify-center">
              <LuminousCTA onClick={() => openModal(1)} variant="dark" large>
                Commander — {fmtTotal(1)} F
              </LuminousCTA>
            </div>
            {/* Badges confiance */}
            <div className="mx-auto mt-7 grid max-w-md grid-cols-4 gap-1.5 sm:gap-2">
              {[
                { ic: '🚚', t: 'Livraison' },
                { ic: '💵', t: 'Cash' },
                { ic: '👤', t: 'Unisexe' },
                { ic: '🔥', t: 'Stock limité' },
              ].map((b) => (
                <div key={b.t} className="flex items-center justify-center gap-1 rounded-lg bg-white/80 px-1.5 py-1.5 text-[10px] font-bold text-stone-700 ring-1 ring-stone-200">
                  <span className="text-sm">{b.ic}</span>
                  <span>{b.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ============ TICKER LUMINEUX 1 — dore ============ */}
      <LuminousTicker
        variant="gold"
        messages={[
          '✦ Stock limité',
          '✦ Livraison rapide en Côte d\'Ivoire',
          '✦ Paiement à la livraison',
          '✦ Édition Premium 2026',
          '✦ Homme & Femme',
        ]}
      />

      {/* ============ FICHE 2 ============ */}
      <ImageFiche
        src={MEDIA.m02}
        alt="Chapeau Gavroche porté homme"
        phrase="Vintage. Moderne. Intemporel."
        highlight={['Vintage', 'Intemporel']}
        ctaLabel="Je veux ce chapeau"
        ctaVariant="dark"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 3 ============ */}
      <ImageFiche
        src={MEDIA.m03}
        alt="Chapeau Gavroche style femme"
        phrase="Un style chic en quelques secondes."
        highlight={['chic']}
        ctaLabel={`Acheter à ${fmtTotal(1)} F`}
        ctaVariant="gold"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 4 — fond noir ============ */}
      <ImageFiche
        src={MEDIA.m04}
        alt="Chapeau Gavroche détail premium"
        phrase="Porte-le. Remarque la différence."
        highlight={['Porte-le', 'différence']}
        ctaLabel="Voir l'offre"
        ctaVariant="gold"
        dark
        onOrder={() => openModal(2)}
      />

      {/* ============ FICHE 5 ============ */}
      <ImageFiche
        src={MEDIA.m05}
        alt="Chapeau Gavroche lifestyle"
        phrase="Un accessoire simple, une présence forte."
        highlight={['présence forte']}
        ctaLabel="Je le veux"
        ctaVariant="dark"
        onOrder={() => openModal(1)}
      />

      {/* ============ TICKER LUMINEUX 2 — sombre ============ */}
      <LuminousTicker
        variant="dark"
        messages={[
          '★ Édition Premium 2026',
          '★ +200 commandes ce mois',
          '★ Note 4.9/5',
          '★ Style vintage moderne',
        ]}
      />

      {/* ============ FICHE 6 ============ */}
      <ImageFiche
        src={MEDIA.m06}
        alt="Chapeau Gavroche styling chic"
        phrase="Élégance au quotidien."
        highlight={['Élégance']}
        ctaLabel="Commander mon style"
        ctaVariant="gold"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 7 ============ */}
      <ImageFiche
        src={MEDIA.m07}
        alt="Chapeau Gavroche lookbook 1"
        phrase="Simple à porter, impossible à ignorer."
        highlight={['impossible à ignorer']}
        ctaLabel="Profiter de l'offre"
        ctaVariant="dark"
        onOrder={() => openModal(2)}
      />

      {/* ============ FICHE 8 — fond noir ============ */}
      <ImageFiche
        src={MEDIA.m08}
        alt="Chapeau Gavroche lookbook 2"
        phrase="Un look qui s'impose en silence."
        highlight={['s\'impose']}
        ctaLabel="L'ajouter à ma tenue"
        ctaVariant="gold"
        dark
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 9 ============ */}
      <ImageFiche
        src={MEDIA.m09}
        alt="Chapeau Gavroche lookbook 3"
        phrase="Le détail qui fait toute la classe."
        highlight={['toute la classe']}
        ctaLabel={`Je commande à ${fmtTotal(1)} F`}
        ctaVariant="gold"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 10 ============ */}
      <ImageFiche
        src={MEDIA.m10}
        alt="Chapeau Gavroche lookbook 4"
        phrase="Chic. Confortable. Intemporel."
        highlight={['Chic', 'Intemporel']}
        ctaLabel="Recevoir le mien"
        ctaVariant="dark"
        onOrder={() => openModal(1)}
      />

      {/* ============ TICKER LUMINEUX 3 — dore intense ============ */}
      <LuminousTicker
        variant="gold"
        messages={[
          '⚡ OFFRE DU JOUR',
          `⚡ ${fmtTotal(1)} F seulement`,
          '⚡ Pack 2 chapeaux = -1 900 F',
          '⚡ Pack 3 = livraison express',
          '⚡ Stock très limité',
        ]}
      />

      {/* ============ FICHE 11 — closing fond noir ============ */}
      <ImageFiche
        src={MEDIA.m11}
        alt="Chapeau Gavroche édition finale"
        phrase={`Commande aujourd'hui à ${fmtTotal(1)} FCFA.`}
        highlight={['aujourd\'hui', `${fmtTotal(1)} FCFA`]}
        ctaLabel="Finaliser ma commande"
        ctaVariant="gold"
        dark
        onOrder={() => openModal(1)}
      />

      {/* ============ AVIS CLIENTS (compact) ============ */}
      <section className="bg-[#faf7f0] px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-bold text-stone-700">4.9/5 · 218 avis</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { n: 'Yao P.', v: 'Cocody', t: 'Très beau chapeau, qualité propre. Style chic !', style: 'wa' },
              { n: 'Aminata D.', v: 'Yopougon', t: 'Livraison rapide, encore plus beau en vrai.', style: 'wa' },
              { n: 'Kouassi B.', v: 'Marcory', t: 'Le style vintage change tout. J\'adore.', style: 'sms' },
              { n: 'Mariam K.', v: 'Bingerville', t: 'Confortable, très classe. Parfait.', style: 'wa' },
            ].map((t, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 shadow-sm ${t.style === 'wa' ? 'ring-emerald-200/60' : 'ring-blue-200/60'}`}>
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${t.style === 'wa' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {t.style === 'wa' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-extrabold text-stone-900">{t.n} <span className="font-normal text-stone-400">· {t.v}</span></p>
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (<svg key={s} className="h-2.5 w-2.5 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z"/></svg>))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-stone-600">"{t.t}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BUNDLES + COUNTDOWN ============ */}
      <section className="relative overflow-hidden bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-amber-700">Offre du jour</p>
          <h2 className="mt-2 text-center text-3xl font-black tracking-tight text-stone-900 sm:text-5xl">
            <span className="cg-grad-gold italic">Choisis</span> ton pack
          </h2>

          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-500">Offre disponible encore</span>
            <div className="flex items-center gap-2">
              {[{ v: cd.h, l: 'H' }, { v: cd.m, l: 'M' }, { v: cd.s, l: 'S' }].map((b, i) => (
                <div key={i} className="flex flex-col items-center rounded-xl bg-stone-900 px-4 py-2 ring-1 ring-amber-400/30 shadow-md">
                  <span className="text-2xl font-black tabular-nums text-amber-300">{b.v}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{b.l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {QTY_OPTS.map((o, i) => {
              const best = i === 1;
              const featured = i === 2;
              return (
                <div
                  key={o.v}
                  className={`relative flex flex-col rounded-3xl bg-white p-6 transition-all hover:-translate-y-1 ${best ? 'ring-2 ring-amber-500 shadow-[0_28px_64px_-24px_rgba(212,175,55,0.5)] sm:scale-[1.04]' : featured ? 'ring-1 ring-stone-900 shadow-[0_22px_48px_-22px_rgba(10,10,10,0.3)]' : 'ring-1 ring-stone-200 shadow-sm'}`}
                >
                  {o.tag && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-md ${best ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900' : 'bg-stone-900 text-amber-300'}`}>
                      {o.tag}
                    </span>
                  )}
                  <div className="text-center">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-stone-500">{o.label}</div>
                    <div className="mt-2 text-4xl font-black text-stone-900 tabular-nums">{fmt(orderTotal(PRICES, o.v))}</div>
                    {o.save && <div className="mt-1 text-xs font-bold text-emerald-700">{o.save}</div>}
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-stone-600">
                    <li className="flex items-center gap-2"><span className="text-amber-600">✦</span> Paiement à la livraison</li>
                    <li className="flex items-center gap-2"><span className="text-amber-600">✦</span> Livraison rapide CI</li>
                    {o.v >= 2 && <li className="flex items-center gap-2"><span className="text-amber-600">✦</span> Pack économique</li>}
                    {featured && <li className="flex items-center gap-2"><span className="text-amber-600">✦</span> Livraison express prioritaire</li>}
                  </ul>
                  <div className="mt-6 flex justify-center">
                    <LuminousCTA onClick={() => openModal(o.v)} variant={best ? 'gold' : 'dark'} large>
                      Choisir ce pack
                    </LuminousCTA>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FOOTER NOIR MINIMAL ============ */}
      <footer className="bg-[#0a0a0a] px-4 py-10 text-center text-stone-400">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-amber-400">Chapeau Gavroche</p>
        <p className="mt-3 text-xs">Édition Premium 2026 · Côte d'Ivoire</p>
        <div className="mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-3 text-[10px] font-semibold text-stone-500">
          <span>💵 Cash livraison</span>
          <span className="text-amber-400">·</span>
          <span>🚚 Livraison rapide</span>
          <span className="text-amber-400">·</span>
          <span>📞 WhatsApp</span>
          <span className="text-amber-400">·</span>
          <span>🔒 Sécurisé</span>
        </div>
        <p className="mt-6 text-[10px] text-stone-600">© 2026</p>
      </footer>

      {/* ============ STICKY CTA MOBILE ============ */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-400/30 bg-[#0a0a0a]/95 px-3 py-2.5 shadow-[0_-12px_40px_-12px_rgba(10,10,10,0.5)] backdrop-blur-xl sm:hidden"
        style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">À partir de</div>
            <div className="text-base font-black text-amber-300">{fmt(orderTotal(PRICES, 1))}</div>
          </div>
          <button
            type="button"
            onClick={() => openModal(1)}
            className="cg-cta cg-cta-pulse relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-stone-900 shadow-[0_18px_40px_-12px_rgba(212,175,55,0.7)] ring-1 ring-amber-300"
          >
            <span className="cg-cta-sheen pointer-events-none absolute inset-0" aria-hidden />
            <span className="relative">Commander</span>
          </button>
        </div>
      </div>

      {/* Notifications achats */}
      <RecentToast />

      {/* Modal commande */}
      <OrderModalDispatcher
        slug={SLUG}
        open={modalOpen}
        onClose={closeModal}
        cfg={orderCfg}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={initialQty}
      />
    </div>
  );
}

/* ---------------- Styles isolés (scope cg-) ---------------- */

function CgCSS() {
  return (
    <style>{`
      .cg-root {
        font-family: 'Inter','Poppins',system-ui,-apple-system,'Segoe UI',sans-serif;
        color: #1c1917;
        background: #faf7f0;
        min-height: 100vh;
        padding-bottom: 88px;
        scroll-behavior: smooth;
      }
      @media (min-width: 640px) { .cg-root { padding-bottom: 0; } }

      .cg-hero-bg {
        background:
          radial-gradient(60% 50% at 10% 20%, rgba(212,175,55,0.12), transparent 60%),
          radial-gradient(50% 40% at 90% 80%, rgba(107,68,35,0.06), transparent 60%);
      }
      .cg-hero-grain {
        background-image:
          repeating-radial-gradient(circle at 0 0, rgba(10,10,10,0.04) 0, rgba(10,10,10,0.04) 1px, transparent 1px, transparent 5px);
        mix-blend-mode: multiply;
      }

      /* Gradient or vintage premium */
      .cg-grad-gold {
        background: linear-gradient(120deg, #92400e 0%, #d4af37 30%, #fde68a 50%, #d4af37 70%, #92400e 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: cg-grad-shine 4s linear infinite;
      }
      @keyframes cg-grad-shine {
        0%   { background-position: 200% 50%; }
        100% { background-position: -200% 50%; }
      }

      /* CTA pulse glow lumineux */
      @keyframes cg-cta-pulse-anim {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-3px) scale(1.015); }
      }
      .cg-cta-pulse {
        animation: cg-cta-pulse-anim 2.6s ease-in-out infinite;
        will-change: transform;
      }
      .cg-cta-pulse:hover, .cg-cta-pulse:focus-visible {
        animation: none;
      }

      /* CTA sheen lumineux qui balaie */
      @keyframes cg-sheen-anim {
        0%   { transform: translateX(-150%) skewX(-15deg); }
        100% { transform: translateX(250%)  skewX(-15deg); }
      }
      .cg-cta-sheen {
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.65) 55%, transparent 100%);
        width: 60%;
        animation: cg-sheen-anim 2.4s ease-in-out infinite;
      }

      /* Glow doré pulsant autour du CTA */
      @keyframes cg-glow-anim {
        0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.6), inset 0 0 0 0 rgba(255,255,255,0); }
        50%      { box-shadow: 0 0 24px 4px rgba(212,175,55,0.45), inset 0 0 12px 0 rgba(255,235,150,0.25); }
      }
      .cg-cta-glow {
        animation: cg-glow-anim 2.6s ease-in-out infinite;
      }

      /* Pulse petit cercle */
      @keyframes cg-pulse-anim {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.88); }
      }
      .cg-pulse { animation: cg-pulse-anim 1.6s ease-in-out infinite; }

      /* ============ TICKERS LUMINEUX ============ */
      .cg-ticker-wrap { position: relative; isolation: isolate; }
      .cg-ticker-gold {
        background: linear-gradient(90deg, #b45309 0%, #d4af37 25%, #fde68a 50%, #d4af37 75%, #b45309 100%);
        color: #1c1917;
        border-top: 1px solid rgba(255,255,255,0.4);
        border-bottom: 1px solid rgba(0,0,0,0.15);
        text-shadow: 0 1px 1px rgba(255,255,255,0.4);
      }
      .cg-ticker-dark {
        background: linear-gradient(90deg, #0a0a0a 0%, #1c1917 50%, #0a0a0a 100%);
        color: #fde68a;
        border-top: 1px solid rgba(212,175,55,0.35);
        border-bottom: 1px solid rgba(212,175,55,0.35);
      }
      .cg-ticker-shine {
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.5) 45%, transparent 60%);
        mix-blend-mode: overlay;
        width: 40%;
        animation: cg-ticker-shine-anim 4s linear infinite;
      }
      @keyframes cg-ticker-shine-anim {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(350%); }
      }
      .cg-ticker-track {
        animation: cg-ticker-track-anim 26s linear infinite;
        will-change: transform;
        gap: 2.5rem;
      }
      @keyframes cg-ticker-track-anim {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* Marquee bandeau annonce */
      @keyframes cg-marquee-anim {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .cg-marquee {
        animation: cg-marquee-anim 48s linear infinite;
        will-change: transform;
      }

      /* Toast notifications */
      .cg-toast {
        max-width: 92vw; width: 320px;
        opacity: 0; transform: translateY(12px) translateX(-12px);
        transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .cg-toast-in  { opacity: 1; transform: translateY(0) translateX(0); }
      .cg-toast-out { opacity: 0; transform: translateY(8px) translateX(-8px); }
      @media (min-width: 640px) { .cg-toast { width: 340px; } }

      @media (prefers-reduced-motion: reduce) {
        .cg-grad-gold, .cg-cta-pulse, .cg-cta-sheen, .cg-cta-glow, .cg-pulse,
        .cg-ticker-shine, .cg-ticker-track, .cg-marquee { animation: none !important; }
        .cg-toast { transition: opacity 0.2s ease !important; }
        .cg-root { scroll-behavior: auto; }
      }
    `}</style>
  );
}
