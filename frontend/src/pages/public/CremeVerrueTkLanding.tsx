/**
 * Tunnel de vente — CREME VERRUE TK (mapping CREME_ANTI_VERRUES).
 * Slug : creme-verrue-tk
 *
 * REFONTE COMPLETE V2 :
 *   Palette PREMIUM marron + blanc + rose + accents dores/champagne.
 *   Vibe : cosmetique luxe, vintage chic, dermatologique premium.
 *   Layout : hero asymetrique + 13 medias uniques en fiches + barres
 *   defilantes lumineuses + temoignages etoiles + bundles + notifications.
 *
 * Config conservee :
 *   - PRODUCT_CODE : CREME_ANTI_VERRUES
 *   - META_PIXEL_ID : 1417398840151713
 *   - Prix : 9 900 / 16 900 / 24 900 FCFA
 *
 * Pour modifier les medias : voir scripts/compress-creme-verrue-tk.mjs
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import type { OrderProduct } from '../../hooks/useOrderSubmit';

const SLUG = 'creme-verrue-tk';
const PRODUCT_CODE = 'CREME_ANTI_VERRUES';
const META_PIXEL_ID = '1417398840151713';
const THANK_YOU_URL = '/creme-verrue-tk/merci';

// Prix faciles a modifier
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const QTY_OPTS = [
  { v: 1, label: '1 boîte',  sub: '9 900 F' },
  { v: 2, label: '2 boîtes', sub: '16 900 F', tag: 'Le + choisi',     save: 'Économisez 2 900 F' },
  { v: 3, label: '3 boîtes', sub: '24 900 F', tag: 'Meilleure offre', save: 'Économisez 4 800 F + guide offert' },
];

// Images compressees en WebP local (creme-verrue-tk-v2) + video existante
const M = (n: string) => `/creme-verrue-tk-v2/${n}.webp`;
const MEDIA = {
  hero:    M('hero'),
  m01:     M('m01'),
  m02:     M('m02'),
  m03:     M('m03'),
  m04:     M('m04'),
  m05:     M('m05'),
  m06:     M('m06'),
  m07:     M('m07'),
  wa:      M('wa'),
  m08:     M('m08'),
  avant:   M('avant'),
  apres:   M('apres'),
  m09:     M('m09'),
  new7:    '/verrue-tk/new-7.webp',          // ancien webp deja optimise
  video2:  '/verrue-tk/video-2.mp4',         // video existante
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

/* ---------------- Lazy image + video ---------------- */

function LazyImg({ src, alt, priority, className = '', width, height, aspect }: {
  src: string; alt: string; priority?: boolean; className?: string;
  width?: number; height?: number; aspect?: string;
}) {
  const { ref, visible } = useOnScreen('340px');
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img src={src} alt={alt} loading="eager" decoding="async" width={width} height={height}
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
        <div className={`w-full bg-gradient-to-br from-pink-50 to-amber-50 ${aspect || 'aspect-[4/5]'}`} />
      )}
    </div>
  );
}

function LazyVideo({ src }: { src: string }) {
  const { ref, visible } = useOnScreen('400px');
  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl bg-pink-50 ring-1 ring-pink-200/60">
      {visible ? (
        <video src={src} className="block h-auto w-full" preload="metadata" playsInline muted loop autoPlay controls={false} />
      ) : (
        <div className="aspect-[9/16] w-full bg-gradient-to-br from-pink-50 to-amber-50" />
      )}
    </div>
  );
}

/* ---------------- CTA lumineux bounce ---------------- */

function BounceCTA({ onClick, children, variant = 'rose', large, className = '' }: {
  onClick: () => void; children: ReactNode;
  variant?: 'rose' | 'brown' | 'gold' | 'outline';
  large?: boolean; className?: string;
}) {
  const palettes: Record<string, string> = {
    rose:
      'from-pink-500 via-rose-400 to-pink-600 text-white shadow-[0_18px_44px_-10px_rgba(236,72,153,0.75)] ring-2 ring-pink-300/70',
    brown:
      'from-[#6b3e1e] via-[#8b5a2b] to-[#6b3e1e] text-amber-100 shadow-[0_18px_44px_-12px_rgba(107,62,30,0.7)] ring-2 ring-amber-300/60',
    gold:
      'from-amber-400 via-yellow-300 to-amber-500 text-[#4a2a14] shadow-[0_18px_44px_-10px_rgba(245,158,11,0.7)] ring-2 ring-amber-200/70',
    outline:
      'from-transparent to-transparent text-[#6b3e1e] shadow-[0_8px_24px_-12px_rgba(107,62,30,0.3)] ring-2 ring-[#6b3e1e] hover:bg-[#6b3e1e]/5',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cv-cta cv-cta-bounce group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${palettes[variant]} ${large ? 'px-8 py-4 text-base font-extrabold' : 'px-6 py-3 text-sm font-bold'} uppercase tracking-[0.1em] transition-all duration-300 active:scale-95 ${className}`}
    >
      <span className="cv-cta-sheen pointer-events-none absolute inset-0" aria-hidden />
      <span className="cv-cta-glow pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      <span className="relative">{children}</span>
      <svg className="relative h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ---------------- Barre defilante lumineuse ---------------- */

function ScrollingBar({ variant = 'brown' }: { variant?: 'brown' | 'rose' | 'cream' }) {
  const messages = {
    brown: '✦ Paiement à la livraison ✦ Livraison rapide CI ✦ Soin ciblé peau ✦ Édition 2026 ✦ Stock limité ✦ Service client réactif',
    rose:  '⚡ OFFRE DU JOUR — 1 boîte 9 900 F ⚡ Pack 2 = -2 900 F ⚡ Pack 3 = -4 800 F + guide ⚡ Profitez avant fin ⚡',
    cream: '★ Crème dermatologique premium ★ Aide à atténuer les verrues ★ Application simple ★ +500 clients satisfaits ★',
  };
  const text = messages[variant];
  return (
    <div className={`relative overflow-hidden cv-bar-${variant}`}>
      <div className="cv-bar-shine pointer-events-none absolute inset-0" aria-hidden />
      <div className="cv-bar-track relative flex whitespace-nowrap py-2.5 text-sm font-black uppercase tracking-[0.22em]">
        <span>{text}</span>
        <span className="mx-12">✦</span>
        <span aria-hidden>{text}</span>
        <span aria-hidden className="mx-12">✦</span>
      </div>
    </div>
  );
}

/* ---------------- Fiche : media + phrase + CTA ---------------- */

function ImageFiche({ src, isVideo, alt, phrase, highlight, ctaLabel, ctaVariant = 'rose', onOrder, priority, dark = false }: {
  src: string;
  isVideo?: boolean;
  alt: string;
  phrase: string;
  highlight?: string[];
  ctaLabel: string;
  ctaVariant?: 'rose' | 'brown' | 'gold';
  onOrder: () => void;
  priority?: boolean;
  dark?: boolean;
}) {
  let rendered: ReactNode = phrase;
  if (highlight && highlight.length) {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = phrase.split(new RegExp(`(${highlight.map(escape).join('|')})`, 'gi'));
    rendered = parts.map((p, i) =>
      highlight.some((h) => h.toLowerCase() === p.toLowerCase()) ? (
        <span key={i} className="cv-grad-rose font-black">{p}</span>
      ) : (<span key={i}>{p}</span>),
    );
  }
  return (
    <section className={`relative px-3 py-10 sm:py-14 ${dark ? 'bg-[#3d2317]' : 'bg-white'}`}>
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-pink-300/25 blur-2xl" aria-hidden />
          <div className={`relative overflow-hidden rounded-3xl shadow-[0_30px_70px_-30px_rgba(107,62,30,0.4)] ${dark ? 'ring-1 ring-amber-300/30' : 'ring-1 ring-pink-200'}`}>
            {isVideo ? <LazyVideo src={src} /> : <LazyImg src={src} alt={alt} priority={priority} aspect="aspect-[4/5]" width={1024} height={1280} />}
          </div>
        </div>
        <p className={`mx-auto mt-7 max-w-xl text-center text-xl font-bold leading-snug sm:text-2xl ${dark ? 'text-amber-100' : 'text-[#3d2317]'}`}>
          {rendered}
        </p>
        <div className="mt-6 flex justify-center">
          <BounceCTA onClick={onOrder} variant={ctaVariant} large>
            {ctaLabel}
          </BounceCTA>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Notifications achats ---------------- */

const NOTIFICATIONS = [
  { nom: 'Awa',     ville: 'Cocody',      pack: '1 boîte',  t: 3 },
  { nom: 'Mariam',  ville: 'Yopougon',    pack: '2 boîtes', t: 9 },
  { nom: 'Kouadio', ville: 'Marcory',     pack: '1 boîte',  t: 17 },
  { nom: 'Fatou',   ville: 'Bingerville', pack: '3 boîtes', t: 24 },
  { nom: 'Aminata', ville: 'Treichville', pack: '2 boîtes', t: 38 },
  { nom: 'Konaté',  ville: 'Abobo',       pack: '1 boîte',  t: 51 },
  { nom: 'Salif',   ville: 'Bouaké',      pack: '2 boîtes', t: 67 },
  { nom: 'Adjoua',  ville: 'San-Pédro',   pack: '1 boîte',  t: 89 },
  { nom: 'Yao',     ville: 'Plateau',     pack: '3 boîtes', t: 105 },
  { nom: 'Brou',    ville: 'Adjamé',      pack: '1 boîte',  t: 118 },
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
          schedule(() => showCycle((idx + 1) % NOTIFICATIONS.length), 8000 + Math.random() * 5000);
        }, 450);
      }, 6000);
    };
    schedule(() => showCycle(0), 4500);
    return () => { cancelled = true; timers.forEach((t) => window.clearTimeout(t)); };
  }, []);

  if (phase === 'hidden') return null;
  const n = NOTIFICATIONS[i];
  const tLabel = n.t < 60 ? `il y a ${n.t} min` : `il y a ${Math.floor(n.t / 60)} h`;

  return (
    <div className={`cv-toast fixed bottom-24 left-3 z-[55] sm:bottom-4 sm:left-4 ${phase === 'in' ? 'cv-toast-in' : 'cv-toast-out'}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 pr-4 shadow-[0_18px_48px_-18px_rgba(107,62,30,0.35)] ring-1 ring-pink-200/80 backdrop-blur-md">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="cv-pulse absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-extrabold text-[#3d2317]">
            {n.nom} <span className="font-semibold text-[#8b5a2b]">à {n.ville}</span>
          </p>
          <p className="text-[11px] text-[#5a3a20]">vient de commander <span className="font-bold text-pink-600">{n.pack}</span></p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            <span className="cv-pulse mr-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-emerald-500" />
            {tLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page principale ---------------- */

export default function CremeVerrueTkLanding() {
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
    document.title = 'Crème Anti-Verrues TK — Soin ciblé peau premium';
    trackPageView(SLUG);
    if (!pixelFired.current && META_PIXEL_ID) {
      pixelFired.current = true;
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Crème Anti-Verrues TK',
        content_ids: [PRODUCT_CODE], content_type: 'product',
        value: PRICES[1], currency: 'XOF',
      });
    }
    return () => { document.title = prev; };
  }, []);

  const orderCfg = {
    slug: SLUG, productCode: PRODUCT_CODE, title: 'Crème Anti-Verrues TK',
    prices: PRICES, metaPixelId: META_PIXEL_ID || undefined,
    thankYouUrl: THANK_YOU_URL,
    images: { hero: MEDIA.hero, avant: MEDIA.avant, apres: MEDIA.apres },
  };

  return (
    <div className="cv-root antialiased">
      <CvCSS />

      {/* ============ BARRE DEFILANTE TOP (marron) ============ */}
      <ScrollingBar variant="brown" />

      {/* ============ HERO ============ */}
      <header className="relative overflow-hidden">
        <div className="cv-hero-bg absolute inset-0" aria-hidden />
        <div className="cv-hero-grain absolute inset-0 opacity-[0.05]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">

            {/* Image hero priority */}
            <div className="order-1">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-3 -z-10 rounded-[40px] bg-gradient-to-br from-pink-300/40 via-amber-200/30 to-[#6b3e1e]/20 blur-3xl" aria-hidden />
                <div className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-pink-200 shadow-[0_40px_80px_-30px_rgba(107,62,30,0.45)]">
                  <LazyImg src={MEDIA.hero} alt="Crème Anti-Verrues TK" priority width={1200} height={1200} />
                </div>
                <span className="absolute -right-2 top-4 -rotate-3 rounded-xl border-2 border-[#6b3e1e] bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b3e1e] shadow-lg">
                  Édition <span className="text-pink-600">2026</span>
                </span>
                <span className="absolute -left-2 bottom-4 rotate-2 rounded-xl bg-[#3d2317] px-3 py-1.5 text-amber-200 shadow-xl">
                  <span className="block text-[8px] font-bold uppercase tracking-[0.3em] text-amber-300/80">À partir de</span>
                  <span className="block text-lg font-black leading-none">9 900 <span className="text-pink-300">F</span></span>
                </span>
              </div>
            </div>

            {/* Texte hero */}
            <div className="order-2 text-center lg:text-left">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-pink-700 ring-1 ring-pink-200">
                  <span className="cv-pulse h-1.5 w-1.5 rounded-full bg-pink-500" />
                  Édition Premium · Stock limité
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-[1] tracking-tight text-[#3d2317] sm:text-5xl md:text-6xl">
                Crème <span className="cv-grad-rose italic">Anti-Verrues</span>
                <br />
                <span className="cv-grad-brown italic">TK Premium</span>
              </h1>
              <p className="mt-4 max-w-md mx-auto lg:mx-0 text-base text-[#5a3a20] sm:text-lg">
                Un soin ciblé pour <span className="font-bold text-[#3d2317]">accompagner votre peau</span> et aider à atténuer l'apparence des verrues.
              </p>

              {/* Note étoilée */}
              <div className="mt-5 flex items-center justify-center gap-3 lg:justify-start">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-[#3d2317]">4.9/5 · 312 avis</span>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <BounceCTA onClick={() => openModal(1)} variant="rose" large>
                  Commander — 9 900 F
                </BounceCTA>
              </div>

              {/* Badges confiance */}
              <div className="mx-auto mt-6 grid max-w-md grid-cols-4 gap-1.5 lg:mx-0">
                {[
                  { ic: '🚚', t: 'Livraison' },
                  { ic: '💵', t: 'Cash' },
                  { ic: '✨', t: 'Premium' },
                  { ic: '🔥', t: 'Stock limité' },
                ].map((b) => (
                  <div key={b.t} className="flex items-center justify-center gap-1 rounded-lg bg-white/90 px-1.5 py-1.5 text-[10px] font-bold text-[#3d2317] ring-1 ring-pink-100">
                    <span className="text-sm">{b.ic}</span>
                    <span>{b.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ BARRE DEFILANTE 2 (rose) ============ */}
      <ScrollingBar variant="rose" />

      {/* ============ FICHE 1 — m01 ============ */}
      <ImageFiche
        src={MEDIA.m01}
        alt="Verrue visible sur la peau"
        phrase="Les verrues visibles peuvent toucher la confiance."
        highlight={['verrues visibles']}
        ctaLabel="Je commande maintenant"
        ctaVariant="rose"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 2 — m02 ============ */}
      <ImageFiche
        src={MEDIA.m02}
        alt="Crème en application"
        phrase="Un geste simple, une routine ciblée."
        highlight={['geste simple', 'routine ciblée']}
        ctaLabel="Je veux ce soin"
        ctaVariant="brown"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 3 — video démo ============ */}
      <ImageFiche
        src={MEDIA.video2}
        isVideo
        alt="Démo application crème"
        phrase="Application rapide. Format pratique. Routine facile."
        highlight={['Application rapide']}
        ctaLabel="Profiter de l'offre"
        ctaVariant="rose"
        onOrder={() => openModal(2)}
      />

      {/* ============ FICHE 4 — m03 ============ */}
      <ImageFiche
        src={MEDIA.m03}
        alt="Soin ciblé peau"
        phrase="Aide à atténuer l'apparence des verrues."
        highlight={['atténuer l\'apparence']}
        ctaLabel="Acheter à 9 900 F"
        ctaVariant="gold"
        onOrder={() => openModal(1)}
      />

      {/* ============ BARRE DEFILANTE 3 (cream/champagne) ============ */}
      <ScrollingBar variant="cream" />

      {/* ============ FICHE 5 — m04 (fond marron) ============ */}
      <ImageFiche
        src={MEDIA.m04}
        alt="Application zone ciblée"
        phrase="Pour les zones visibles : mains, pieds, doigts."
        highlight={['mains', 'pieds', 'doigts']}
        ctaLabel="Je le veux"
        ctaVariant="gold"
        dark
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 6 — m05 ============ */}
      <ImageFiche
        src={MEDIA.m05}
        alt="Routine soin peau"
        phrase="Votre peau mérite une attention douce et régulière."
        highlight={['attention douce', 'régulière']}
        ctaLabel="Je commande maintenant"
        ctaVariant="rose"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 7 — m06 ============ */}
      <ImageFiche
        src={MEDIA.m06}
        alt="Crème dermatologique"
        phrase="Formule pensée pour accompagner votre routine."
        highlight={['accompagner votre routine']}
        ctaLabel="Voir l'offre"
        ctaVariant="brown"
        onOrder={() => openModal(2)}
      />

      {/* ============ AVANT / APRES (utilise avant + apres) ============ */}
      <section className="bg-gradient-to-b from-pink-50/40 to-white px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-pink-700">Preuves visuelles</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-[#3d2317] sm:text-4xl">
            <span className="cv-grad-rose italic">Avant</span> / <span className="cv-grad-brown italic">Après</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm italic text-[#8b5a2b]">
            Images illustratives. Les résultats peuvent varier selon les personnes.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <figure className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-pink-200/60 shadow-[0_24px_60px_-28px_rgba(107,62,30,0.25)]">
              <span className="absolute left-3 top-3 z-10 rounded-full bg-[#3d2317]/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-200 backdrop-blur">Avant</span>
              <LazyImg src={MEDIA.avant} alt="Avant utilisation" width={1024} height={1280} />
              <figcaption className="px-4 py-3 text-center text-xs font-semibold text-[#5a3a20]">Verrue visible</figcaption>
            </figure>
            <figure className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-pink-200/60 shadow-[0_24px_60px_-28px_rgba(107,62,30,0.25)]">
              <span className="absolute left-3 top-3 z-10 rounded-full bg-pink-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur">Après routine</span>
              <LazyImg src={MEDIA.apres} alt="Après routine régulière" width={1024} height={1280} />
              <figcaption className="px-4 py-3 text-center text-xs font-semibold text-[#5a3a20]">Peau visiblement plus nette</figcaption>
            </figure>
          </div>
          <div className="mt-8 flex justify-center">
            <BounceCTA onClick={() => openModal(2)} variant="rose" large>
              Essayer maintenant
            </BounceCTA>
          </div>
        </div>
      </section>

      {/* ============ FICHE 8 — m07 ============ */}
      <ImageFiche
        src={MEDIA.m07}
        alt="Formule premium"
        phrase="Élégance et soin. Tout dans une boîte."
        highlight={['Élégance', 'soin']}
        ctaLabel="L'ajouter à ma routine"
        ctaVariant="brown"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 9 — m08 ============ */}
      <ImageFiche
        src={MEDIA.m08}
        alt="Crème en boîte premium"
        phrase="Texture légère, application douce."
        highlight={['Texture légère']}
        ctaLabel="Je commande à 9 900 F"
        ctaVariant="gold"
        onOrder={() => openModal(1)}
      />

      {/* ============ FICHE 10 — m09 (fond marron) ============ */}
      <ImageFiche
        src={MEDIA.m09}
        alt="Soin peau prestige"
        phrase="Le soin qui change ta routine peau."
        highlight={['change ta routine']}
        ctaLabel="Recevoir le mien"
        ctaVariant="gold"
        dark
        onOrder={() => openModal(1)}
      />

      {/* ============ TEMOIGNAGES ETOILES ============ */}
      <section className="bg-gradient-to-b from-pink-50/30 to-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-pink-700">Témoignages clients</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-[#3d2317] sm:text-4xl">
            Ils l'ont <span className="cv-grad-rose italic">essayé</span>
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <svg key={s} className="h-6 w-6 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
                </svg>
              ))}
            </div>
            <span className="text-base font-bold text-[#3d2317]">4.9/5 · 312 avis vérifiés</span>
          </div>

          {/* Capture WhatsApp + témoignages */}
          <div className="mt-10 grid items-center gap-6 rounded-3xl bg-white p-5 ring-1 ring-pink-200 shadow-[0_28px_56px_-32px_rgba(107,62,30,0.2)] sm:p-7 md:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-emerald-700">Conversation client</p>
              <h3 className="mt-2 text-2xl font-black text-[#3d2317]">
                Témoignages reçus sur <span className="text-emerald-600">WhatsApp</span>
              </h3>
              <p className="mt-3 text-sm text-[#5a3a20]">
                Nos clients nous écrivent au fil de leur routine. Voici un aperçu réel de leurs retours.
              </p>
              <div className="mt-5">
                <BounceCTA onClick={() => openModal(2)} variant="rose" large>
                  Je commande aussi
                </BounceCTA>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl ring-1 ring-emerald-200/50">
              <LazyImg src={MEDIA.wa} alt="Capture conversation client WhatsApp" width={800} height={1000} />
            </div>
          </div>

          {/* Cartes témoignages */}
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { n: 'Awa K.', v: 'Cocody', t: "J'ai vu une amélioration progressive sur certaines zones. Très contente." },
              { n: 'Mariam D.', v: 'Yopougon', t: 'Texture agréable, format pratique. Je l\'utilise tous les soirs.' },
              { n: 'Kouadio B.', v: 'Marcory', t: 'Livraison rapide, conseiller attentif. Je recommande.' },
              { n: 'Fatou S.', v: 'Bingerville', t: 'Application simple, je commence ma routine.' },
              { n: 'Aïcha M.', v: 'Treichville', t: 'La crème est douce, parfaite pour la peau sensible.' },
              { n: 'Sékou T.', v: 'Bouaké', t: 'Bon produit, j\'aime le rituel matin/soir.' },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 ring-1 ring-pink-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-pink-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-[#3d2317]">{c.n}</p>
                    <p className="text-xs text-[#8b5a2b]">{c.v}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Vérifié
                  </span>
                </div>
                <div className="mt-2 flex">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#5a3a20]">"{c.t}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BLOC ENGAGEMENT — new7 (image deja optimisee) ============ */}
      <ImageFiche
        src={MEDIA.new7}
        alt="Engagement qualité"
        phrase="Une promesse simple : accompagner votre peau au quotidien."
        highlight={['accompagner votre peau']}
        ctaLabel="Je commande mon soin"
        ctaVariant="brown"
        onOrder={() => openModal(1)}
      />

      {/* ============ BUNDLES + COUNTDOWN ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fef7f0] to-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-pink-700">Offre du jour</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-[#3d2317] sm:text-5xl">
            <span className="cv-grad-rose italic">Choisis</span> ton pack
          </h2>

          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#8b5a2b]">Offre disponible encore</span>
            <div className="flex items-center gap-2">
              {[{ v: cd.h, l: 'H' }, { v: cd.m, l: 'M' }, { v: cd.s, l: 'S' }].map((b, i) => (
                <div key={i} className="flex flex-col items-center rounded-xl bg-gradient-to-br from-[#3d2317] via-[#5a3a20] to-[#3d2317] px-4 py-2 ring-1 ring-pink-400/30 shadow-md">
                  <span className="text-2xl font-black tabular-nums text-pink-300">{b.v}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300/70">{b.l}</span>
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
                  className={`relative flex flex-col rounded-3xl bg-white p-6 transition-all hover:-translate-y-1 ${best ? 'ring-2 ring-pink-500 shadow-[0_28px_64px_-24px_rgba(236,72,153,0.5)] sm:scale-[1.04]' : featured ? 'ring-1 ring-[#6b3e1e] shadow-[0_22px_48px_-22px_rgba(107,62,30,0.3)]' : 'ring-1 ring-pink-100 shadow-sm'}`}
                >
                  {o.tag && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md ${best ? 'bg-gradient-to-r from-pink-500 to-rose-600' : 'bg-[#3d2317] text-amber-200'}`}>
                      {o.tag}
                    </span>
                  )}
                  <div className="text-center">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-[#8b5a2b]">{o.label}</div>
                    <div className="mt-2 text-4xl font-black text-[#3d2317] tabular-nums">{fmt(PRICES[o.v])}</div>
                    {o.save && <div className="mt-1 text-xs font-bold text-emerald-600">{o.save}</div>}
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-[#5a3a20]">
                    <li className="flex items-center gap-2"><span className="text-pink-500">✦</span> Paiement à la livraison</li>
                    <li className="flex items-center gap-2"><span className="text-pink-500">✦</span> Livraison rapide CI</li>
                    {o.v >= 2 && <li className="flex items-center gap-2"><span className="text-pink-500">✦</span> Pack économique</li>}
                    {featured && <li className="flex items-center gap-2"><span className="text-pink-500">✦</span> Guide d'utilisation offert</li>}
                    <li className="flex items-center gap-2"><span className="text-pink-500">✦</span> Édition Premium 2026</li>
                  </ul>
                  <div className="mt-6 flex justify-center">
                    <BounceCTA onClick={() => openModal(o.v)} variant={best ? 'rose' : 'brown'} large>
                      Choisir ce pack
                    </BounceCTA>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FAQ MINIMAL ============ */}
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-[#3d2317] sm:text-4xl">
            <span className="cv-grad-rose italic">Questions</span> fréquentes
          </h2>
          <div className="mt-8 space-y-3">
            {[
              { q: 'Comment utiliser la crème ?', a: 'Nettoyez la zone concernée, appliquez une petite quantité de crème sur la verrue, massez doucement. À répéter matin et soir.' },
              { q: 'Sur quelles zones l\'appliquer ?', a: 'Sur les zones visibles : mains, pieds, doigts. Éviter le contour des yeux et les muqueuses.' },
              { q: 'Quand voir une amélioration ?', a: 'Les résultats peuvent varier selon les personnes. Une routine régulière est recommandée pour observer un changement visible.' },
              { q: 'Est-ce que je paie avant ?', a: 'Non, le paiement se fait à la livraison. Vous payez en cash uniquement quand vous recevez votre crème.' },
              { q: 'Comment se passe la livraison ?', a: 'Un conseiller vous appelle sous 30 minutes pour confirmer, puis livraison rapide dans votre commune.' },
            ].map((f) => (
              <details key={f.q} className="group rounded-2xl bg-pink-50/40 p-5 ring-1 ring-pink-100 transition-all open:bg-white open:ring-pink-400 open:shadow-md">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-extrabold text-[#3d2317]">
                  <span>{f.q}</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-100 text-pink-700 transition-transform group-open:rotate-45">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#5a3a20]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-gradient-to-b from-[#3d2317] to-[#2a1810] px-4 py-10 text-center text-amber-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-pink-300">Crème Anti-Verrues TK</p>
        <p className="mt-3 text-xs">Édition Premium 2026 · Côte d'Ivoire</p>
        <div className="mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-3 text-[10px] font-semibold">
          <span>💵 Cash livraison</span><span className="text-pink-400">·</span>
          <span>🚚 Livraison rapide</span><span className="text-pink-400">·</span>
          <span>💬 WhatsApp</span><span className="text-pink-400">·</span>
          <span>🔒 Sécurisée</span>
        </div>
        <p className="mt-6 text-[10px] italic text-amber-300/70">Les résultats peuvent varier selon les personnes.</p>
        <p className="mt-1 text-[10px] text-amber-400/50">© 2026</p>
      </footer>

      {/* ============ STICKY CTA MOBILE ============ */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-pink-200/40 bg-gradient-to-r from-[#3d2317] via-[#5a3a20] to-[#3d2317] px-3 py-2.5 shadow-[0_-12px_40px_-12px_rgba(107,62,30,0.5)] sm:hidden"
        style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">À partir de</div>
            <div className="text-base font-black text-pink-200">{fmt(PRICES[1])} <span className="text-[10px] font-normal text-amber-300/60">/ boîte</span></div>
          </div>
          <button
            type="button"
            onClick={() => openModal(1)}
            className="cv-cta cv-cta-bounce relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_18px_40px_-12px_rgba(236,72,153,0.7)] ring-2 ring-pink-300"
          >
            <span className="cv-cta-sheen pointer-events-none absolute inset-0" aria-hidden />
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

/* ---------------- Styles isolés (scope cv-) ---------------- */

function CvCSS() {
  return (
    <style>{`
      .cv-root {
        font-family: 'Inter','Poppins',system-ui,-apple-system,'Segoe UI',sans-serif;
        color: #3d2317;
        background: #fef7f0;
        min-height: 100vh;
        padding-bottom: 88px;
        scroll-behavior: smooth;
      }
      @media (min-width: 640px) { .cv-root { padding-bottom: 0; } }

      .cv-hero-bg {
        background:
          radial-gradient(60% 50% at 20% 20%, rgba(236,72,153,0.18), transparent 60%),
          radial-gradient(50% 40% at 80% 80%, rgba(245,158,11,0.12), transparent 60%),
          linear-gradient(160deg, #fef7f0 0%, #fff 50%, #fdf2f8 100%);
      }
      .cv-hero-grain {
        background-image:
          repeating-radial-gradient(circle at 0 0, rgba(107,62,30,0.04) 0, rgba(107,62,30,0.04) 1px, transparent 1px, transparent 5px);
        mix-blend-mode: multiply;
      }

      /* Gradients shine */
      .cv-grad-rose {
        background: linear-gradient(120deg, #be185d 0%, #ec4899 30%, #f9a8d4 50%, #ec4899 70%, #be185d 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: cv-grad-shine 4s linear infinite;
      }
      .cv-grad-brown {
        background: linear-gradient(120deg, #4a2a14 0%, #8b5a2b 30%, #d4a574 50%, #8b5a2b 70%, #4a2a14 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: cv-grad-shine 4s linear infinite;
      }
      @keyframes cv-grad-shine {
        0%   { background-position: 200% 50%; }
        100% { background-position: -200% 50%; }
      }

      /* CTA BOUNCE LUMINEUX */
      @keyframes cv-cta-bounce-anim {
        0%, 100% { transform: translateY(0) scale(1); }
        25%      { transform: translateY(-6px) scale(1.02); }
        50%      { transform: translateY(0) scale(1); }
        75%      { transform: translateY(-3px) scale(1.01); }
      }
      .cv-cta-bounce {
        animation: cv-cta-bounce-anim 2.4s ease-in-out infinite;
        will-change: transform;
      }
      .cv-cta-bounce:hover, .cv-cta-bounce:focus-visible {
        animation: none;
        transform: translateY(-4px) scale(1.05);
      }

      /* Sheen lumineux qui balaie */
      @keyframes cv-sheen-anim {
        0%   { transform: translateX(-150%) skewX(-15deg); }
        100% { transform: translateX(250%)  skewX(-15deg); }
      }
      .cv-cta-sheen {
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 55%, transparent 100%);
        width: 60%;
        animation: cv-sheen-anim 2.2s ease-in-out infinite;
      }

      /* Glow rose pulsant */
      @keyframes cv-glow-anim {
        0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0.4); }
        50%      { box-shadow: 0 0 28px 6px rgba(236,72,153,0.45); }
      }
      .cv-cta-glow { animation: cv-glow-anim 2.4s ease-in-out infinite; }

      /* Pulse cercle */
      @keyframes cv-pulse-anim {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.88); }
      }
      .cv-pulse { animation: cv-pulse-anim 1.6s ease-in-out infinite; }

      /* Barres defilantes */
      .cv-bar-brown {
        background: linear-gradient(90deg, #3d2317 0%, #6b3e1e 50%, #3d2317 100%);
        color: #fde68a;
        border-top: 1px solid rgba(245,158,11,0.3);
        border-bottom: 1px solid rgba(0,0,0,0.2);
      }
      .cv-bar-rose {
        background: linear-gradient(90deg, #be185d 0%, #ec4899 50%, #be185d 100%);
        color: #fff;
        border-top: 1px solid rgba(255,255,255,0.25);
        border-bottom: 1px solid rgba(190,24,93,0.4);
        text-shadow: 0 1px 2px rgba(0,0,0,0.15);
      }
      .cv-bar-cream {
        background: linear-gradient(90deg, #fde68a 0%, #f5d490 30%, #fef3c7 50%, #f5d490 70%, #fde68a 100%);
        color: #4a2a14;
        border-top: 1px solid rgba(255,255,255,0.5);
        border-bottom: 1px solid rgba(180,83,9,0.25);
        text-shadow: 0 1px 0 rgba(255,255,255,0.4);
      }
      .cv-bar-shine {
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.4) 45%, transparent 60%);
        mix-blend-mode: overlay;
        width: 40%;
        animation: cv-bar-shine-anim 4s linear infinite;
      }
      @keyframes cv-bar-shine-anim {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(350%); }
      }
      .cv-bar-track {
        animation: cv-bar-track-anim 28s linear infinite;
        will-change: transform;
        gap: 2.5rem;
      }
      @keyframes cv-bar-track-anim {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* Toast */
      .cv-toast {
        max-width: 92vw; width: 320px;
        opacity: 0; transform: translateY(12px) translateX(-12px);
        transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .cv-toast-in  { opacity: 1; transform: translateY(0) translateX(0); }
      .cv-toast-out { opacity: 0; transform: translateY(8px) translateX(-8px); }
      @media (min-width: 640px) { .cv-toast { width: 340px; } }

      @media (prefers-reduced-motion: reduce) {
        .cv-grad-rose, .cv-grad-brown, .cv-cta-bounce, .cv-cta-sheen, .cv-cta-glow,
        .cv-pulse, .cv-bar-shine, .cv-bar-track { animation: none !important; }
        .cv-toast { transition: opacity 0.2s ease !important; }
        .cv-root { scroll-behavior: auto; }
      }
    `}</style>
  );
}
