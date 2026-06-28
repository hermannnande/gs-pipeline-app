/**
 * Tunnel de vente — SPRAY VITILIGO (mapping CREME_VITILIGO).
 * Slug : spray-vitiligo
 *
 * Palette PREMIUM medicale/cosmetique BLEU :
 *   - Bleu principal #0B5ED7, Bleu nuit #063B8E, Bleu clair #38BDF8
 *   - Blanc #FFFFFF, Gris clair #F3F7FB, Texte fonce #0F172A
 *
 * Layout : hero impactant + barres defilantes + sections problemes/solution
 * + blocs media isoles + avant/apres + mode d'emploi + offre + temoignages
 * + FAQ + notifications achats + sticky CTA + WhatsApp flottant.
 *
 * Conformite : aucune promesse medicale ("aide a attenuer", "favorise une
 * peau plus uniforme", "resultats variables").
 *
 * Pour modifier :
 *  - Prix : PRICES (lignes ~30)
 *  - Pixel Meta : META_PIXEL_ID (ligne ~22)
 *  - Numero WhatsApp : WHATSAPP_NUMBER (ligne ~27)
 *  - Medias : MEDIA (lignes ~40)
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import type { OrderProduct } from '../../hooks/useOrderSubmit';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const SLUG = 'spray-vitiligo';
const PRODUCT_CODE = 'CREME_VITILIGO';
// Pixel Meta dedie a la campagne Spray Vitiligo (Purchase + CAPI dedup via eventID = orderReference)
const META_PIXEL_ID = '1800280300964462';
const THANK_YOU_URL = '/spray-vitiligo/merci';

// Prix faciles a modifier
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 flacon',  sub: packLabel(PRICES, 1, 'F') },
  { v: 2, label: '2 flacons', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi',     save: 'Économisez 2 900 F' },
  { v: 3, label: '3 flacons', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 4 800 F + guide offert' },
];

// Images compressees en WebP, servies depuis /public/spray-vitiligo/ (bundle local)
// Total bundle : ~1.1 MB (vs 22 MB en PNG WordPress = -95%)
// Script de regeneration : node scripts/compress-spray-vitiligo.mjs
const M = (n: string) => `/spray-vitiligo/${n}.webp`;
const WP = (n: string) => `https://obrille.com/wp-content/uploads/2026/05/${n}`;
const MEDIA = {
  hero:    M('hero'),     // NEW image hero (ChatGPT-Image-24-mai-2026-15_15_38)
  affiche: M('affiche'),  // ancien hero Affiche-Spray-Vitiligo, reutilise en fiche
  m01:     M('m01'),
  m02:     M('m02'),
  m03:     M('m03'),
  m04:     M('m04'),
  realCC:  M('realCC'),   // photo reelle (CC license)
  expert:  M('expert'),
  m08:     M('m08'),
  m09:     M('m09'),
  m10:     M('m10'),
  m11:     M('m11'),
  video1:  WP('ffdz-1.mp4'),  // videos restent sur WP (deja petites, lazy load)
  video2:  WP('ff-1-1.mp4'),
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

function LazyImg({ src, alt, priority, className = '', width, height, rounded = true, aspect }: {
  src: string; alt: string; priority?: boolean; className?: string;
  width?: number; height?: number; rounded?: boolean; aspect?: string;
}) {
  const { ref, visible } = useOnScreen('340px');
  const inner = 'block h-auto w-full object-contain ' + (rounded ? 'rounded-2xl' : '');
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img src={src} alt={alt} loading="eager" decoding="async" width={width} height={height}
          // @ts-expect-error fetchpriority valid HTML
          fetchpriority="high"
          className={inner}
        />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {visible ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" width={width} height={height} className={inner} />
      ) : (
        <div className={`w-full bg-gradient-to-br from-sky-50 to-blue-100 ${aspect || 'aspect-[4/5]'} ${rounded ? 'rounded-2xl' : ''}`} />
      )}
    </div>
  );
}

/* ---------------- Lazy video (autoplay muted loop) ---------------- */

function LazyVideo({ src, className = '' }: { src: string; className?: string }) {
  const { ref, visible } = useOnScreen('400px');
  return (
    <div ref={ref} className={`relative overflow-hidden rounded-2xl bg-sky-50 ring-1 ring-sky-200/60 ${className}`}>
      {visible ? (
        <video
          src={src}
          className="block h-auto w-full"
          preload="metadata"
          playsInline
          muted
          loop
          autoPlay
          controls={false}
        />
      ) : (
        <div className="aspect-[9/16] w-full bg-gradient-to-br from-sky-50 to-blue-100" />
      )}
    </div>
  );
}

/* ---------------- CTA fluide premium bleu ---------------- */

function FluidCTA({ onClick, children, variant = 'blue', large, className = '' }: {
  onClick: () => void; children: ReactNode;
  variant?: 'blue' | 'navy' | 'sky' | 'outline';
  large?: boolean; className?: string;
}) {
  const palettes: Record<string, string> = {
    blue:
      'from-[#0B5ED7] via-[#1d6fe0] to-[#063B8E] text-white shadow-[0_18px_44px_-10px_rgba(11,94,215,0.7)] ring-2 ring-sky-300/60',
    navy:
      'from-[#063B8E] via-[#0B5ED7] to-[#063B8E] text-white shadow-[0_18px_44px_-12px_rgba(6,59,142,0.7)] ring-2 ring-sky-400/40',
    sky:
      'from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] text-white shadow-[0_18px_44px_-10px_rgba(14,165,233,0.65)] ring-2 ring-sky-200/60',
    outline:
      'from-transparent via-transparent to-transparent text-[#0B5ED7] shadow-[0_8px_24px_-12px_rgba(11,94,215,0.4)] ring-2 ring-[#0B5ED7] hover:bg-[#0B5ED7]/5',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sv-cta sv-cta-pulse group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${palettes[variant]} ${large ? 'px-8 py-4 text-base font-extrabold' : 'px-6 py-3 text-sm font-bold'} uppercase tracking-[0.1em] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] active:scale-95 ${className}`}
    >
      <span className="sv-cta-sheen pointer-events-none absolute inset-0" aria-hidden />
      <span className="sv-cta-glow pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      <span className="relative">{children}</span>
      <svg className="relative h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ---------------- Bandeau defilant cyan/bleu ---------------- */

function ScrollingBar({ variant = 'blue' }: { variant?: 'blue' | 'cyan' }) {
  const text = 'Livraison 24h à Abidjan ✦ Paiement à la livraison ✦ Stock limité ✦ Offre spéciale aujourd\'hui ✦ Commande simple par téléphone';
  return (
    <div className={`relative overflow-hidden ${variant === 'cyan' ? 'sv-bar-cyan' : 'sv-bar-blue'}`}>
      <div className="sv-bar-shine pointer-events-none absolute inset-0" aria-hidden />
      <div className="sv-bar-track relative flex whitespace-nowrap py-2.5 text-sm font-black uppercase tracking-[0.22em] text-white">
        <span>{text}</span>
        <span className="mx-12">✦</span>
        <span aria-hidden>{text}</span>
        <span aria-hidden className="mx-12">✦</span>
      </div>
    </div>
  );
}

/* ---------------- Fiche : media + phrase courte + CTA ---------------- */

function ImageFiche({ src, isVideo, alt, phrase, highlight, ctaLabel, ctaVariant = 'blue', onOrder, priority }: {
  src: string;
  isVideo?: boolean;
  alt: string;
  phrase: string;
  highlight?: string[];
  ctaLabel: string;
  ctaVariant?: 'blue' | 'navy' | 'sky';
  onOrder: () => void;
  priority?: boolean;
}) {
  let rendered: ReactNode = phrase;
  if (highlight && highlight.length) {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = phrase.split(new RegExp(`(${highlight.map(escape).join('|')})`, 'gi'));
    rendered = parts.map((p, i) =>
      highlight.some((h) => h.toLowerCase() === p.toLowerCase()) ? (
        <span key={i} className="sv-grad-text font-black">{p}</span>
      ) : (<span key={i}>{p}</span>),
    );
  }
  return (
    <section className="relative bg-white px-3 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-sky-400/20 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-sky-200 shadow-[0_30px_70px_-30px_rgba(11,94,215,0.4)]">
            {isVideo ? (
              <LazyVideo src={src} />
            ) : (
              <LazyImg src={src} alt={alt} priority={priority} aspect="aspect-[4/5]" width={1024} height={1280} />
            )}
          </div>
        </div>
        <p className="mx-auto mt-7 max-w-xl text-center text-xl font-bold leading-snug text-slate-800 sm:text-2xl">
          {rendered}
        </p>
        <div className="mt-6 flex justify-center">
          <FluidCTA onClick={onOrder} variant={ctaVariant} large>
            {ctaLabel}
          </FluidCTA>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Notifications achats ---------------- */

const NOTIFICATIONS = [
  { nom: 'Awa',     ville: 'Cocody',      pack: '1 spray',  t: 3 },
  { nom: 'Fatou',   ville: 'Yopougon',    pack: '2 sprays', t: 9 },
  { nom: 'Mariam',  ville: 'Marcory',     pack: '1 spray',  t: 16 },
  { nom: 'Kouamé',  ville: 'Abobo',       pack: '3 sprays', t: 24 },
  { nom: 'Grâce',   ville: 'Bingerville', pack: '1 spray',  t: 35 },
  { nom: 'Aminata', ville: 'Treichville', pack: '2 sprays', t: 47 },
  { nom: 'Yao',     ville: 'Plateau',     pack: '1 spray',  t: 58 },
  { nom: 'Salif',   ville: 'Bouaké',      pack: '2 sprays', t: 71 },
  { nom: 'Adjoua',  ville: 'San-Pédro',   pack: '1 spray',  t: 89 },
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
          // intervalle entre 8 et 15 sec
          schedule(() => showCycle((idx + 1) % NOTIFICATIONS.length), 8000 + Math.random() * 7000);
        }, 450);
      }, 5500);
    };
    schedule(() => showCycle(0), 5000);
    return () => { cancelled = true; timers.forEach((t) => window.clearTimeout(t)); };
  }, []);

  if (phase === 'hidden') return null;
  const n = NOTIFICATIONS[i];
  const tLabel = n.t < 60 ? `il y a ${n.t} min` : `il y a ${Math.floor(n.t / 60)} h`;

  return (
    <div className={`sv-toast fixed bottom-24 left-3 z-[55] sm:bottom-4 sm:left-4 ${phase === 'in' ? 'sv-toast-in' : 'sv-toast-out'}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 pr-4 shadow-[0_18px_48px_-18px_rgba(11,94,215,0.4)] ring-1 ring-sky-200/80 backdrop-blur-md">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0B5ED7] to-[#063B8E] text-white shadow-md">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sv-pulse absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-extrabold text-slate-900">
            {n.nom} <span className="font-semibold text-slate-500">à {n.ville}</span>
          </p>
          <p className="text-[11px] text-slate-600">vient de commander <span className="font-bold text-[#0B5ED7]">{n.pack}</span></p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            <span className="sv-pulse mr-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-emerald-500" />
            {tLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page principale ---------------- */

export default function SprayVitiligoLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialQty, setInitialQty] = useState(1);
  const [product, setProduct] = useState<OrderProduct | null>(null);
  const cd = useEndOfDayCountdown();
  const pixelFired = useRef(false);

  const openModal = useCallback((qty: number = 1) => {
    setInitialQty(qty); setModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Spray Vitiligo — Aide à uniformiser l\'apparence de la peau';
    trackPageView(SLUG);
    if (!pixelFired.current && META_PIXEL_ID) {
      pixelFired.current = true;
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'SPRAY VITILIGO',
        content_ids: [PRODUCT_CODE], content_type: 'product',
        value: orderTotal(PRICES, 1), currency: 'XOF',
      });
    }
    return () => { document.title = prev; };
  }, []);

  const orderCfg = {
    slug: SLUG, productCode: PRODUCT_CODE, title: 'SPRAY VITILIGO',
    prices: PRICES, metaPixelId: META_PIXEL_ID || undefined,
    thankYouUrl: THANK_YOU_URL,
    images: { hero: MEDIA.hero, avant: MEDIA.realCC, apres: MEDIA.expert },
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sv-root antialiased">
      <SvCSS />

      {/* ============ BARRES DEFILANTES (top) ============ */}
      <ScrollingBar variant="blue" />

      {/* ============ HERO ============ */}
      <header className="relative overflow-hidden">
        <div className="sv-hero-bg absolute inset-0" aria-hidden />
        <div className="sv-hero-grain absolute inset-0 opacity-[0.05]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-12 lg:pt-16">

          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Texte hero */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#063B8E] ring-1 ring-sky-200 backdrop-blur">
                  <span className="text-[#0B5ED7]">🚚</span> Livraison rapide Abidjan
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#063B8E] ring-1 ring-sky-200 backdrop-blur">
                  <span className="text-[#0B5ED7]">💵</span> Cash livraison
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-[1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Retrouvez une
                <br />
                <span className="sv-grad-text">peau plus uniforme</span>
              </h1>
              <p className="mt-4 max-w-md mx-auto lg:mx-0 text-base text-slate-600 sm:text-lg">
                Un spray conçu pour <span className="font-bold text-slate-900">aider à atténuer l'apparence des taches</span> et améliorer l'uniformité du teint.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <FluidCTA onClick={() => openModal(1)} variant="blue" large>
                  Commander maintenant
                </FluidCTA>
                <button
                  type="button"
                  onClick={() => scrollTo('avant-apres')}
                  className="rounded-full border-2 border-[#0B5ED7] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#0B5ED7] transition-all hover:-translate-y-0.5 hover:bg-[#0B5ED7] hover:text-white"
                >
                  Voir les résultats
                </button>
              </div>

              {/* Preuve sociale */}
              <div className="mt-7 flex flex-col items-center gap-2 lg:items-start">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-700">Avis clients positifs</span>
                </div>
                <p className="text-xs text-slate-500">Déjà adopté par de nombreux clients satisfaits</p>
              </div>
            </div>

            {/* Image hero */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 -z-10 rounded-[40px] bg-gradient-to-br from-[#38BDF8]/40 via-[#0B5ED7]/20 to-[#063B8E]/30 blur-3xl" aria-hidden />
                <div className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-sky-200 shadow-[0_40px_80px_-30px_rgba(11,94,215,0.5)]">
                  <LazyImg src={MEDIA.hero} alt="Spray Vitiligo — flacon" priority rounded={false} width={1024} height={1280} />
                </div>
                <span className="absolute -right-2 top-4 -rotate-3 rounded-xl border-2 border-[#063B8E] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#063B8E] shadow-lg">
                  Édition <span className="text-[#0B5ED7]">2026</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ BARRE DEFILANTE 2 ============ */}
      <ScrollingBar variant="cyan" />

      {/* ============ SOLUTION PRODUIT ============ */}
      <section className="relative overflow-hidden bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-sky-400/20 blur-2xl" aria-hidden />
              <div className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-sky-200 shadow-xl">
                <LazyImg src={MEDIA.m01} alt="Spray Vitiligo en application" rounded={false} width={1024} height={1280} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#0B5ED7]">La solution</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                Le spray qui accompagne votre <span className="sv-grad-text">routine peau</span>
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Sa formule est pensée pour aider à améliorer l'apparence de la peau et favoriser un teint plus homogène.
              </p>
              <div className="mt-5 grid gap-2.5">
                {[
                  'Aide à uniformiser l\'apparence du teint',
                  'Application simple en spray',
                  'Format pratique au quotidien',
                  'Convient aux mains, bras, cou et visage',
                ].map((b) => (
                  <div key={b} className="flex items-start gap-2.5 rounded-xl bg-[#F3F7FB] p-3 ring-1 ring-sky-100">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0B5ED7] text-white">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{b}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7">
                <FluidCTA onClick={() => openModal(1)} variant="blue" large>
                  Je commande mon spray
                </FluidCTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BLOCS MEDIA INDIVIDUELS ============ */}
      <ImageFiche
        src={MEDIA.m02}
        alt="Taches visibles sur les mains"
        phrase="Des taches visibles sur les mains peuvent vite attirer les regards. Ce spray aide à accompagner votre peau vers une apparence plus uniforme."
        highlight={['apparence plus uniforme']}
        ctaLabel="Je commande mon spray"
        ctaVariant="blue"
        onOrder={() => openModal(1)}
      />

      <ImageFiche
        src={MEDIA.video1}
        isVideo
        alt="Démo application du spray"
        phrase="Regardez comment intégrer facilement le spray dans votre routine quotidienne."
        highlight={['facilement', 'routine quotidienne']}
        ctaLabel="Je commande mon spray"
        ctaVariant="navy"
        onOrder={() => openModal(2)}
      />

      <ImageFiche
        src={MEDIA.m03}
        alt="Routine peau ciblée"
        phrase="Une routine simple, une application rapide, et une peau qui paraît progressivement plus homogène."
        highlight={['Une routine simple', 'plus homogène']}
        ctaLabel="Je commande mon spray"
        ctaVariant="blue"
        onOrder={() => openModal(1)}
      />

      <ImageFiche
        src={MEDIA.m04}
        alt="Application zones visibles"
        phrase="Idéal pour les zones visibles comme les mains, les bras, le cou et le visage."
        highlight={['mains', 'bras', 'cou', 'visage']}
        ctaLabel="Je commande mon spray"
        ctaVariant="sky"
        onOrder={() => openModal(1)}
      />

      <ImageFiche
        src={MEDIA.video2}
        isVideo
        alt="Démo routine spray"
        phrase="Une solution pratique pour ceux qui veulent prendre soin de l'apparence de leur peau."
        highlight={['prendre soin']}
        ctaLabel="Je commande mon spray"
        ctaVariant="blue"
        onOrder={() => openModal(2)}
      />

      <ImageFiche
        src={MEDIA.m08}
        alt="Soin peau ciblée"
        phrase="Votre peau mérite une attention douce et régulière."
        highlight={['attention douce', 'régulière']}
        ctaLabel="Je commande mon spray"
        ctaVariant="navy"
        onOrder={() => openModal(1)}
      />

      <ImageFiche
        src={MEDIA.m09}
        alt="Application spray facile"
        phrase="Application rapide, format pratique, routine facile."
        highlight={['Application rapide']}
        ctaLabel="Profiter de l'offre"
        ctaVariant="blue"
        onOrder={() => openModal(2)}
      />

      <ImageFiche
        src={MEDIA.m10}
        alt="Soin homogène"
        phrase="Un geste simple pour accompagner l'apparence de votre peau."
        highlight={['Un geste simple']}
        ctaLabel="Je commande mon spray"
        ctaVariant="sky"
        onOrder={() => openModal(1)}
      />

      <ImageFiche
        src={MEDIA.m11}
        alt="Résultat peau plus uniforme"
        phrase="Commandez aujourd'hui, payez à la livraison."
        highlight={['aujourd\'hui', 'à la livraison']}
        ctaLabel="Je commande mon spray"
        ctaVariant="blue"
        onOrder={() => openModal(1)}
      />

      <ImageFiche
        src={MEDIA.affiche}
        alt="Affiche Spray Vitiligo"
        phrase="Aidez votre peau à retrouver une apparence plus homogène."
        highlight={['apparence plus homogène']}
        ctaLabel="Je commande mon spray"
        ctaVariant="navy"
        onOrder={() => openModal(1)}
      />

      {/* ============ AVANT / APRES ============ */}
      <section id="avant-apres" className="bg-[#F3F7FB] px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-[#0B5ED7]">Preuves visuelles</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            <span className="sv-grad-text">Avant / Après</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm italic text-slate-500">
            Images illustratives de résultats possibles. Les résultats peuvent varier selon les personnes.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <figure className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-sky-200/60 shadow-[0_24px_60px_-28px_rgba(11,94,215,0.3)]">
              <span className="absolute left-3 top-3 z-10 rounded-full bg-slate-900/85 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur">Avant</span>
              <LazyImg src={MEDIA.realCC} alt="Avant — taches visibles" rounded={false} width={800} height={1000} />
              <figcaption className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Taches visibles sur la peau</figcaption>
            </figure>
            <figure className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-sky-200/60 shadow-[0_24px_60px_-28px_rgba(11,94,215,0.3)]">
              <span className="absolute left-3 top-3 z-10 rounded-full bg-[#0B5ED7] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur">Après routine</span>
              <LazyImg src={MEDIA.expert} alt="Après routine — peau plus uniforme" rounded={false} width={1024} height={1280} />
              <figcaption className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Peau visiblement plus uniforme</figcaption>
            </figure>
          </div>
          <div className="mt-8 flex justify-center">
            <FluidCTA onClick={() => openModal(2)} variant="blue" large>
              Essayer maintenant
            </FluidCTA>
          </div>
        </div>
      </section>

      {/* ============ COMMENT UTILISER ============ */}
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-[#0B5ED7]">3 étapes</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Comment <span className="sv-grad-text">l'utiliser</span>
          </h2>
          <ol className="mt-8 space-y-3">
            {[
              'Nettoyer la zone concernée',
              'Appliquer le spray sur la zone ciblée',
              'Répéter régulièrement selon la routine recommandée',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-4 rounded-2xl bg-[#F3F7FB] p-4 ring-1 ring-sky-100">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0B5ED7] to-[#063B8E] text-base font-black text-white shadow-md">
                  {i + 1}
                </div>
                <p className="pt-1.5 text-base font-semibold text-slate-800">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            <strong>Note :</strong> Éviter le contact avec les yeux. En cas de doute ou de peau sensible, demander l'avis d'un professionnel.
          </div>
          <div className="mt-7 flex justify-center">
            <FluidCTA onClick={() => openModal(1)} variant="blue" large>
              Commander et commencer ma routine
            </FluidCTA>
          </div>
        </div>
      </section>

      {/* ============ OFFRE BUNDLES ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F3F7FB] to-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-[#0B5ED7]">Offre du jour</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            <span className="sv-grad-text">Offre spéciale</span> aujourd'hui
          </h2>

          {/* Compte à rebours */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">Offre disponible encore</span>
            <div className="flex items-center gap-2">
              {[{ v: cd.h, l: 'H' }, { v: cd.m, l: 'M' }, { v: cd.s, l: 'S' }].map((b, i) => (
                <div key={i} className="flex flex-col items-center rounded-xl bg-gradient-to-br from-[#0B5ED7] to-[#063B8E] px-4 py-2 ring-1 ring-sky-300/50 shadow-md">
                  <span className="text-2xl font-black tabular-nums text-white">{b.v}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-sky-200">{b.l}</span>
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
                  className={`relative flex flex-col rounded-3xl bg-white p-6 transition-all hover:-translate-y-1 ${best ? 'ring-2 ring-[#0B5ED7] shadow-[0_28px_64px_-24px_rgba(11,94,215,0.5)] sm:scale-[1.04]' : featured ? 'ring-1 ring-[#063B8E] shadow-[0_22px_48px_-22px_rgba(6,59,142,0.3)]' : 'ring-1 ring-sky-100 shadow-sm'}`}
                >
                  {o.tag && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md ${best ? 'bg-gradient-to-r from-[#0B5ED7] to-[#063B8E]' : 'bg-slate-900'}`}>
                      {o.tag}
                    </span>
                  )}
                  <div className="text-center">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{o.label}</div>
                    <div className="mt-2 text-4xl font-black text-slate-900 tabular-nums">{fmt(orderTotal(PRICES, o.v))}</div>
                    {o.save && <div className="mt-1 text-xs font-bold text-emerald-600">{o.save}</div>}
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><span className="text-[#0B5ED7]">✓</span> Paiement à la livraison</li>
                    <li className="flex items-center gap-2"><span className="text-[#0B5ED7]">✓</span> Livraison rapide CI</li>
                    {o.v >= 2 && <li className="flex items-center gap-2"><span className="text-[#0B5ED7]">✓</span> Pack économique</li>}
                    {featured && <li className="flex items-center gap-2"><span className="text-[#0B5ED7]">✓</span> Guide d'utilisation offert</li>}
                    <li className="flex items-center gap-2"><span className="text-[#0B5ED7]">✓</span> Support WhatsApp</li>
                  </ul>
                  <div className="mt-6 flex justify-center">
                    <FluidCTA onClick={() => openModal(o.v)} variant={best ? 'blue' : featured ? 'navy' : 'sky'} large>
                      Choisir ce pack
                    </FluidCTA>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            Commandez avec <strong className="text-slate-700">paiement à la livraison</strong> — Un conseiller vous contacte sous 30 min.
          </p>
        </div>
      </section>

      {/* ============ TEMOIGNAGES ============ */}
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-[#0B5ED7]">Témoignages clients</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Ils l'ont <span className="sv-grad-text">essayé</span>
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <svg key={s} className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-bold text-slate-700">4.8/5 · 247 avis vérifiés</span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { n: 'Awa K.', v: 'Cocody', t: 'J\'avais des taches visibles sur la main, j\'ai aimé la simplicité d\'utilisation.' },
              { n: 'Fatou D.', v: 'Yopougon', t: 'Le spray est facile à appliquer et le format est pratique.' },
              { n: 'Mariam B.', v: 'Marcory', t: 'Livraison rapide, produit bien emballé. Je commence ma routine.' },
              { n: 'Kouamé S.', v: 'Abobo', t: 'J\'ai vu une amélioration progressive sur certaines zones.' },
              { n: 'Grâce M.', v: 'Bingerville', t: 'Très bon produit, la texture est légère et pénètre vite.' },
              { n: 'Aïcha T.', v: 'Treichville', t: 'Je continue ma routine, le conseiller était à l\'écoute.' },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl bg-[#F3F7FB] p-5 ring-1 ring-sky-100 transition hover:-translate-y-1 hover:shadow-md hover:ring-sky-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{c.n}</p>
                    <p className="text-xs text-slate-500">{c.v}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Vérifié
                  </span>
                </div>
                <div className="mt-2 flex">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z"/>
                    </svg>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">"{c.t}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="bg-[#F3F7FB] px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            <span className="sv-grad-text">Questions</span> fréquentes
          </h2>
          <p className="mt-3 text-center text-sm text-slate-500">
            Les résultats peuvent varier selon le type de peau, la régularité d'utilisation et la zone concernée.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { q: 'Comment utiliser le spray ?', a: 'Nettoyez la zone, appliquez le spray sur peau sèche, répétez régulièrement selon la routine recommandée.' },
              { q: 'En combien de temps peut-on voir une amélioration ?', a: 'Les résultats varient selon les personnes. Une routine régulière est recommandée pour observer un changement visible.' },
              { q: 'Peut-on l\'utiliser sur le visage ?', a: 'Oui, en évitant le contour des yeux et les muqueuses. Effectuez d\'abord un test sur une petite zone.' },
              { q: 'Est-ce adapté aux mains et aux bras ?', a: 'Oui, ces zones visibles font partie des zones d\'application recommandées.' },
              { q: 'Comment passer commande ?', a: 'Cliquez sur "Commander", remplissez le formulaire (nom, téléphone, ville, quantité). Un conseiller vous appelle sous 30 min.' },
              { q: 'Le paiement se fait comment ?', a: 'Paiement à la livraison. Vous payez en cash uniquement quand vous recevez votre commande.' },
              { q: 'La livraison est-elle rapide ?', a: 'Livraison sous 24-48h à Abidjan et selon disponibilité dans le reste de la Côte d\'Ivoire.' },
              { q: 'Les résultats sont-ils garantis ?', a: 'Les résultats peuvent varier selon les personnes, le type de peau et la régularité d\'utilisation. Le produit accompagne votre routine sans promesse de guérison.' },
            ].map((f) => (
              <details key={f.q} className="group rounded-2xl bg-white p-5 ring-1 ring-sky-100 transition-all open:ring-[#0B5ED7] open:shadow-md">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-extrabold text-slate-900">
                  <span>{f.q}</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0B5ED7] to-[#063B8E] text-white transition-transform group-open:rotate-45">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROBLEME — DEPLACE EN BAS ============ */}
      <section className="bg-[#F3F7FB] px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-[#0B5ED7]">Le constat</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Les <span className="sv-grad-text">taches visibles</span> peuvent toucher la confiance
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-600 sm:text-base">
            Quand la peau perd son uniformité, beaucoup cherchent une solution simple à intégrer dans leur routine.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              { ic: '✋', t: 'Sur les mains', d: 'Zone très exposée au quotidien' },
              { ic: '😊', t: 'Sur le visage', d: 'Source de gêne au quotidien' },
              { ic: '💪', t: 'Sur les bras', d: 'Zones visibles selon les saisons' },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl bg-white p-5 ring-1 ring-sky-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#0B5ED7] to-[#063B8E] text-2xl text-white shadow-md">
                  <span>{b.ic}</span>
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-900">{b.t}</h3>
                <p className="mt-1 text-sm text-slate-600">{b.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <FluidCTA onClick={() => openModal(1)} variant="blue" large>
              Je commande mon spray
            </FluidCTA>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-gradient-to-b from-[#063B8E] to-[#042366] px-4 py-10 text-center text-sky-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-sky-300">Spray Vitiligo</p>
        <p className="mt-3 text-xs">Soin ciblé pour une peau plus uniforme · Côte d'Ivoire</p>
        <div className="mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-3 text-[10px] font-semibold">
          <span>💵 Cash livraison</span><span className="text-sky-400">·</span>
          <span>🚚 Livraison rapide</span><span className="text-sky-400">·</span>
          <span>💬 WhatsApp</span><span className="text-sky-400">·</span>
          <span>🔒 Sécurisée</span>
        </div>
        <p className="mt-6 text-[10px] italic text-sky-300/80">Les résultats peuvent varier selon les personnes.</p>
        <p className="mt-1 text-[10px] text-sky-400/60">© 2026 — Spray Vitiligo</p>
      </footer>

      {/* ============ STICKY CTA MOBILE ============ */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sky-300/40 bg-gradient-to-r from-[#063B8E] via-[#0B5ED7] to-[#063B8E] px-3 py-2.5 shadow-[0_-12px_40px_-12px_rgba(11,94,215,0.6)] sm:hidden"
        style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200">Aujourd'hui</div>
            <div className="text-base font-black text-white">{fmt(orderTotal(PRICES, 1))} <span className="text-[10px] font-normal text-sky-200">/ flacon</span></div>
          </div>
          <button
            type="button"
            onClick={() => openModal(1)}
            className="sv-cta sv-cta-pulse relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-[#063B8E] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.4)] ring-2 ring-sky-300"
          >
            <span className="sv-cta-sheen pointer-events-none absolute inset-0" aria-hidden />
            <svg className="relative h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="relative">Commander</span>
          </button>
        </div>
        <div className="mt-1 text-center text-[10px] font-semibold text-sky-200">Paiement à la livraison</div>
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

/* ---------------- Styles isolés (scope sv-) ---------------- */

function SvCSS() {
  return (
    <style>{`
      .sv-root {
        font-family: 'Inter','Poppins',system-ui,-apple-system,'Segoe UI',sans-serif;
        color: #0F172A;
        background: #FFFFFF;
        min-height: 100vh;
        padding-bottom: 100px;
        scroll-behavior: smooth;
      }
      @media (min-width: 640px) { .sv-root { padding-bottom: 0; } }

      .sv-hero-bg {
        background:
          radial-gradient(60% 50% at 80% 10%, rgba(56,189,248,0.35), transparent 60%),
          radial-gradient(50% 40% at 10% 90%, rgba(11,94,215,0.18), transparent 60%),
          linear-gradient(160deg, #ffffff 0%, #F3F7FB 50%, #e0f2fe 100%);
      }
      .sv-hero-grain {
        background-image:
          repeating-radial-gradient(circle at 0 0, rgba(11,94,215,0.05) 0, rgba(11,94,215,0.05) 1px, transparent 1px, transparent 5px);
        mix-blend-mode: multiply;
      }

      /* Gradient bleu lumineux qui scintille */
      .sv-grad-text {
        background: linear-gradient(120deg, #063B8E 0%, #0B5ED7 30%, #38BDF8 50%, #0B5ED7 70%, #063B8E 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: sv-grad-shine 4s linear infinite;
      }
      @keyframes sv-grad-shine {
        0%   { background-position: 200% 50%; }
        100% { background-position: -200% 50%; }
      }

      /* CTA pulse glow lumineux */
      @keyframes sv-cta-pulse-anim {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-3px) scale(1.015); }
      }
      .sv-cta-pulse {
        animation: sv-cta-pulse-anim 2.6s ease-in-out infinite;
        will-change: transform;
      }
      .sv-cta-pulse:hover, .sv-cta-pulse:focus-visible { animation: none; }

      /* CTA sheen lumineux qui balaie */
      @keyframes sv-sheen-anim {
        0%   { transform: translateX(-150%) skewX(-15deg); }
        100% { transform: translateX(250%)  skewX(-15deg); }
      }
      .sv-cta-sheen {
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.65) 55%, transparent 100%);
        width: 60%;
        animation: sv-sheen-anim 2.4s ease-in-out infinite;
      }

      /* Glow bleu pulsant */
      @keyframes sv-glow-anim {
        0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.4); }
        50%      { box-shadow: 0 0 26px 6px rgba(56,189,248,0.4); }
      }
      .sv-cta-glow { animation: sv-glow-anim 2.6s ease-in-out infinite; }

      /* Pulse petit cercle */
      @keyframes sv-pulse-anim {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.88); }
      }
      .sv-pulse { animation: sv-pulse-anim 1.6s ease-in-out infinite; }

      /* Barres défilantes bleu */
      .sv-bar-blue {
        background: linear-gradient(90deg, #063B8E 0%, #0B5ED7 50%, #063B8E 100%);
        border-top: 1px solid rgba(255,255,255,0.15);
        border-bottom: 1px solid rgba(0,0,0,0.2);
      }
      .sv-bar-cyan {
        background: linear-gradient(90deg, #0EA5E9 0%, #38BDF8 50%, #0EA5E9 100%);
        border-top: 1px solid rgba(255,255,255,0.25);
        border-bottom: 1px solid rgba(6,59,142,0.2);
      }
      .sv-bar-shine {
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.4) 45%, transparent 60%);
        mix-blend-mode: overlay;
        width: 40%;
        animation: sv-bar-shine-anim 4s linear infinite;
      }
      @keyframes sv-bar-shine-anim {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(350%); }
      }
      .sv-bar-track {
        animation: sv-bar-track-anim 30s linear infinite;
        will-change: transform;
        gap: 2.5rem;
      }
      @keyframes sv-bar-track-anim {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* Toast notifications */
      .sv-toast {
        max-width: 92vw; width: 320px;
        opacity: 0; transform: translateY(12px) translateX(-12px);
        transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .sv-toast-in  { opacity: 1; transform: translateY(0) translateX(0); }
      .sv-toast-out { opacity: 0; transform: translateY(8px) translateX(-8px); }
      @media (min-width: 640px) { .sv-toast { width: 340px; } }

      @media (prefers-reduced-motion: reduce) {
        .sv-grad-text, .sv-cta-pulse, .sv-cta-sheen, .sv-cta-glow, .sv-pulse,
        .sv-bar-shine, .sv-bar-track { animation: none !important; }
        .sv-toast { transition: opacity 0.2s ease !important; }
        .sv-root { scroll-behavior: auto; }
      }
    `}</style>
  );
}
