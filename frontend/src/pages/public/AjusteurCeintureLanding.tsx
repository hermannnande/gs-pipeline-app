/**
 * Landing premium — Ajusteur de Ceinture Élastique (AJUSTEUR_CEINTURE).
 * Slug : ajusteur-ceinture · Prix : 6 900 / 12 900 / 16 900 F (-50 % affiché)
 *
 * Direction : degrades bleu indigo denim #1E3A8A -> violet profond #6D28D9,
 * accents or/ambre #F59E0B (crochets metalliques), touches emeraude #10B981.
 * NOUVEAUTÉ : carrousel « file d'attente » (4 images, rotation 1 s, fade/slide).
 * CTA animes (bounce + shine) declines en 5 couleurs (.aj-cta-btn + variantes).
 * Pattern : landings 2026 validees client (sangles / bandes buccales).
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const OrderModalAjusteurCeinture = lazy(() => import('../../components/order/OrderModalAjusteurCeinture'));

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'ajusteur-ceinture';
const PRODUCT_CODE = 'AJUSTEUR_CEINTURE';
const CONTENT_NAME = 'Ajusteur de Ceinture Élastique';
const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (init conditionnée)
const THANK_YOU_URL = '/ajusteur-ceinture/merci';

const PRICES: Record<number, number> = { 1: 6900, 2: 12900, 3: 16900 };
const OLD_UNIT = 13800; // prix barré cohérent avec l'offre -50 %
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/ |,/g, ' ');
const fmtN = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 ajusteur', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 ajusteurs', sub: packLabel(PRICES, 2, 'F'), tag: 'Populaire', save: 'Économisez 900 F' },
  { v: 3, label: '3 ajusteurs', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 3 800 F' },
];

const M = (n: string) => `/ajusteur-ceinture/${n}`;
const MEDIA = {
  // 4 images RÉSERVÉES au carrousel file d'attente (jamais utilisées ailleurs).
  carousel: [M('a01.webp'), M('a02.webp'), M('a03.webp'), M('a04.webp')],
  // 6 images seules + 3 vidéos = 9 blocs classiques.
  dosBaille: M('a05.webp'),
  pertePoids: M('a06.webp'),
  invisible: M('a07.webp'),
  crochets: M('a08.webp'),
  dressing: M('a09.webp'),
  costume: M('a10.webp'),
  demoVideo1: M('v01.mp4'), demoPoster1: M('v01p.webp'),
  demoVideo2: M('v02.mp4'), demoPoster2: M('v02p.webp'),
  demoVideo3: M('v03.mp4'), demoPoster3: M('v03p.webp'),
};

// Variantes de couleurs des CTA animés (cycle sur les blocs).
type CtaVariant = 'gold' | 'indigo' | 'violet' | 'emerald' | 'noir';

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any; dataLayer?: any[] } }

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

/* ------------------------------------------------------------------ */
/* CARROUSEL « file d'attente » : 4 images carrees, rotation continue  */
/* toutes les 1 s (la 1re passe a la fin), transition fade/slide.      */
/* Mise en pause automatique si prefers-reduced-motion.                */
/* ------------------------------------------------------------------ */
function QueueCarousel({ images }: { images: string[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {[0, 1, 2, 3].map((slot) => {
        const img = images[(slot + tick) % images.length];
        return (
          <div key={slot} className="relative aspect-square overflow-hidden rounded-2xl bg-[#1E3A8A]/10 shadow-lg ring-1 ring-white/30">
            <img
              key={img}
              src={img}
              alt="Ajusteur de ceinture élastique porté sur différents pantalons"
              loading="lazy"
              decoding="async"
              className="aj-enter absolute inset-0 h-full w-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lazy loading à l'approche du viewport (pattern maison).             */
/* ------------------------------------------------------------------ */
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

function LazyImg({ src, alt, aspect, priority }: { src: string; alt: string; aspect?: string; priority?: boolean }) {
  const { ref, visible } = useOnScreen();
  if (priority) {
    return (
      <div className="overflow-hidden" style={aspect ? { aspectRatio: aspect } : undefined}>
        <img src={src} alt={alt} loading="eager" decoding="async" fetchPriority="high" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className="overflow-hidden" style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-[#1E3A8A]/25 to-[#6D28D9]/20" />
      )}
    </div>
  );
}

function LazyVideo({ src, poster, badge }: { src: string; poster?: string; badge?: string }) {
  const { ref, visible } = useOnScreen();
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-[#14142B]" style={{ aspectRatio: '9/16' }}>
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /> : null}
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#F59E0B]" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      {badge && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F59E0B] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
          </span>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Étoiles dorées (note 4,8/5).                                        */
/* ------------------------------------------------------------------ */
function Star({ half }: { half?: boolean }) {
  return (
    <svg className="h-4 w-4 text-[#F59E0B]" fill={half ? 'url(#ajHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="ajHalfStar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="80%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>
      )}
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function Stars() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star /><Star /><Star /><Star /><Star half />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* CTA animé (bounce + shine) décliné en 5 couleurs — classes .aj-*.   */
/* ------------------------------------------------------------------ */
function AjCTA({ onClick, children, big, variant = 'gold' }: { onClick: () => void; children: ReactNode; big?: boolean; variant?: CtaVariant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`aj-cta-btn aj-cta-${variant} group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 ${big ? 'py-5 text-[16px] sm:text-[18px]' : 'py-4 text-[14px] sm:text-[15px]'} font-black uppercase tracking-[0.12em] shadow-[0_18px_44px_-12px_rgba(245,158,11,.45)] ring-2 ring-white/30 transition hover:scale-[1.02] active:scale-[0.99]`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* CTA collant bas de page (visible dès le chargement, masqué si modal).*/
/* ------------------------------------------------------------------ */
function StickyCTA({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="border-t border-[#F59E0B]/30 bg-gradient-to-r from-[#14142B]/95 via-[#1E3A8A]/95 to-[#312E81]/95 shadow-[0_-10px_34px_-10px_rgba(20,20,43,.6)] backdrop-blur-md">
        <div className="mx-auto max-w-lg px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 leading-tight text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FCD34D]/90">-50 % · aujourd'hui</p>
              <p className="text-[15px] font-black">
                {fmtTotal(1)} F <span className="ml-1 text-[11px] font-semibold text-white/60 line-through">{fmtN(OLD_UNIT)} F</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClick}
              className="aj-cta-btn aj-cta-gold shrink-0 rounded-xl px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.08em] shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
            >
              Commander 👖
            </button>
          </div>
          <p className="mt-1 text-center text-[9.5px] font-semibold text-white/55">💰 Paiement à la livraison · ✅ Satisfait ou remboursé 7 jours</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barre défilante (marquee) : OR ou INDIGO selon la section.          */
/* ------------------------------------------------------------------ */
function Marquee({ items, gold }: { items: string[]; gold?: boolean }) {
  return (
    <div className={`overflow-hidden py-2.5 ${gold
      ? 'border-y border-[#FCD34D]/30 bg-gradient-to-r from-[#92400E] via-[#F59E0B] to-[#92400E] text-[#FFFBEB]'
      : 'border-y border-[#818CF8]/25 bg-gradient-to-r from-[#14142B] via-[#1E3A8A] to-[#312E81] text-[#C7D2FE]'}`}>
      <div className="aj-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className={gold ? 'text-white/85' : 'text-[#FCD34D]'}>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compte à rebours (fin de l'offre à minuit) — pills glassmorphism.   */
/* ------------------------------------------------------------------ */
function Countdown({ h, m, s, compact }: { h: number; m: number; s: number; compact?: boolean }) {
  const cell = (v: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className={`aj-glass inline-flex min-w-[52px] items-center justify-center rounded-2xl font-black tabular-nums text-white ${compact ? 'px-2.5 py-1.5 text-[16px]' : 'px-3 py-2.5 text-[24px]'}`}>
        {pad(v)}
      </span>
      <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#FCD34D]/80">{label}</span>
    </div>
  );
  return (
    <div className="flex items-start justify-center gap-2.5">
      {cell(h, 'Heures')}
      <span className={`font-black text-white/50 ${compact ? 'pt-1 text-[14px]' : 'pt-2 text-[20px]'}`}>:</span>
      {cell(m, 'Min')}
      <span className={`font-black text-white/50 ${compact ? 'pt-1 text-[14px]' : 'pt-2 text-[20px]'}`}>:</span>
      {cell(s, 'Sec')}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bloc média : carte sur dégradé distinct + texte court + CTA.        */
/* ------------------------------------------------------------------ */
type MediaBlockProps = {
  media: ReactNode;
  bg: string;           // classes de fond dégradé de la section
  kicker: string;
  title: ReactNode;
  text: string;
  cta: string;
  onCta: () => void;
  variant: CtaVariant;  // couleur du bouton animé
  dark?: boolean;       // texte clair si fond profond
  ratio?: string;       // ratio image (défaut 1/1)
};

function MediaBlock({ media, bg, kicker, title, text, cta, onCta, variant, dark, ratio = '1/1' }: MediaBlockProps) {
  return (
    <section className={`px-4 py-8 sm:py-10 ${bg}`}>
      <div className="mx-auto max-w-[560px]">
        <div className={`overflow-hidden rounded-[28px] shadow-2xl ${dark ? 'ring-1 ring-white/25' : 'ring-1 ring-[#1E3A8A]/15'}`}>
          <div style={{ aspectRatio: ratio }} className="w-full [&>div]:h-full">{media}</div>
        </div>
        <div className="mt-5 text-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dark ? 'bg-white/15 text-[#FCD34D] ring-1 ring-white/25' : 'bg-white/70 text-[#1E3A8A] ring-1 ring-[#1E3A8A]/25'}`}>
            {kicker}
          </span>
          <h2 className={`mt-3 text-[22px] font-black leading-tight sm:text-[26px] ${dark ? 'text-white' : 'text-[#1E1B4B]'}`}>{title}</h2>
          <p className={`mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed sm:text-[14px] ${dark ? 'text-white/85' : 'text-[#1E3A8A]/75'}`}>{text}</p>
          <div className="mx-auto mt-5 max-w-sm"><AjCTA variant={variant} onClick={onCta}>{cta}</AjCTA></div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications d'achat (popup bas-gauche, rotation ~12 s).           */
/* ------------------------------------------------------------------ */
const PURCHASE_NOTIFS = [
  { n: 'Koffi', q: 'Abobo', p: '1 ajusteur' },
  { n: 'Aminata', q: 'Yopougon', p: '2 ajusteurs' },
  { n: 'Yao', q: 'Cocody', p: '1 ajusteur' },
  { n: 'Fatou', q: 'Marcory', p: '3 ajusteurs' },
  { n: 'Ibrahim', q: 'Bouaké', p: '2 ajusteurs' },
  { n: 'Awa', q: 'Angré', p: '1 ajusteur' },
  { n: 'Moussa', q: 'Koumassi', p: '2 ajusteurs' },
  { n: 'Adjoua', q: 'Treichville', p: '1 ajusteur' },
  { n: 'Salimata', q: 'San-Pédro', p: '3 ajusteurs' },
  { n: 'Nadia', q: 'Riviera', p: '2 ajusteurs' },
];

function PurchaseNotifs() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mins, setMins] = useState(3);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    const show = () => {
      setIdx((i) => (i + 1) % PURCHASE_NOTIFS.length);
      setMins(2 + Math.floor(Math.random() * 12));
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 5200);
    };
    const first = setTimeout(show, 3500);
    const loop = setInterval(show, 12000);
    return () => { clearTimeout(first); clearInterval(loop); clearTimeout(hideTimer); };
  }, []);

  const it = PURCHASE_NOTIFS[idx];
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed bottom-4 left-3 z-40 max-w-[300px] transition-all duration-500 sm:left-5 ${
        visible ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'
      }`}
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-[0_16px_40px_-12px_rgba(20,20,43,.4)] ring-1 ring-[#818CF8]/40 backdrop-blur-md">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#6D28D9] text-[15px] font-black text-white">
          {it.n[0]}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight text-[#1E1B4B]">
            {it.n} · {it.q} <span className="font-normal text-neutral-500">vient de commander</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#4F46E5]">
            Pack {it.p} · il y a {mins} min <span className="text-emerald-600">✓ vérifié</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Témoignages (cartes étoilées, prénoms ivoiriens).                   */
/* ------------------------------------------------------------------ */
const TESTIMONIALS = [
  { n: 'Koffi', v: 'Abobo', stars: 5, t: "J'ai perdu 8 kg et tous mes pantalons flottaient. Au lieu de tout refaire chez le couturier, j'ai pris 2 ajusteurs : taille parfaite en 5 secondes 🙏🏾" },
  { n: 'Aminata', v: 'Yopougon', stars: 5, t: "Mon jean baillait toujours dans le dos, même avec une ceinture. Là c'est plaqué, et personne ne voit rien sous le t-shirt. Génial." },
  { n: 'Ibrahim', v: 'Bouaké', stars: 4, t: "Les crochets tiennent vraiment bien, même en bougeant toute la journée au chantier. Sobre et solide, je recommande." },
  { n: 'Nadia', v: 'Cocody', stars: 5, t: "J'en ai mis un sur le pantalon de travail et un sur mon jean du week-end. Fini les ceintures qui font mal au ventre 😍" },
];

function TestimonialCard({ r }: { r: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#1E3A8A]/15">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3A8A] via-[#6D28D9] to-[#F59E0B] text-[15px] font-black text-white">
          {r.n[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-[#1E1B4B]">{r.n} <span className="font-semibold text-neutral-400">· {r.v}</span></p>
          <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: r.stars }).map((_, k) => (
              <svg key={k} className="h-3 w-3 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-600 ring-1 ring-emerald-200">✓ Achat vérifié</span>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-neutral-700">{r.t}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Témoignages style WhatsApp (bulles + heure + double check).         */
/* ------------------------------------------------------------------ */
const WHATSAPP_REVIEWS = [
  { n: 'Aïssata', v: 'Marcory', t: "Sis l'ajusteur est top 🙏🏾 Mon pantalon de bureau ne descend plus du tout, et on ne voit rien sous la chemise 😍", h: '09:42', stars: 5 },
  { n: 'Mamadou', v: 'Koumassi', t: "Reçu hier, payé à la livraison 👌🏾 Installé en 5 secondes sur mon jean qui baillait derrière. Les crochets ne bougent pas 😩🔥", h: '12:15', stars: 5 },
  { n: 'Adjoua', v: 'Treichville', t: "J'ai maigri et je ne voulais pas racheter mes pantalons. Avec ça, je les garde tous. J'en ai repris 2 pour ma sœur.", h: '18:03', stars: 5 },
  { n: 'Fatou', v: 'San-Pédro', t: "J'en ai pris 3 : un pour moi, un pour mon mari, un pour maman 🏠 Tout le monde a la taille ajustée maintenant ❤️", h: '10:27', stars: 5 },
];

function WhatsAppBubble({ r, i }: { r: (typeof WHATSAPP_REVIEWS)[number]; i: number }) {
  const mine = i % 2 === 0;
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-tl-md bg-white ring-1 ring-[#1E3A8A]/15' : 'rounded-tr-md bg-[#DCF8C6] ring-1 ring-emerald-600/10'}`}>
        <p className={`text-[10px] font-black ${mine ? 'text-[#4F46E5]' : 'text-emerald-700'}`}>{r.n} · {r.v}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-800">{r.t}</p>
        <p className="mt-1 flex items-center justify-end gap-1 text-[9px] font-semibold text-neutral-400">
          <span className="mr-auto inline-flex items-center gap-0.5">
            {Array.from({ length: r.stars }).map((_, k) => (
              <svg key={k} className="h-2.5 w-2.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </span>
          {r.h} <span className="text-sky-500">✓✓</span>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ (vraies objections).                                            */
/* ------------------------------------------------------------------ */
const FAQ = [
  { q: 'Est-ce visible sous un t-shirt ?', a: "Non : l'ajusteur est plat et se porte à l'intérieur de la ceinture du pantalon. Totalement invisible, même sous un t-shirt près du corps." },
  { q: 'Est-ce que ça abîme le pantalon ?', a: "Non : les crochets se fixent sur les passants existants. Aucune couture, aucun perçage, aucune trace sur le tissu." },
  { q: 'Pour quelle taille de pantalon ?', a: "Universel : la bande élastique s'ajuste sur tous les passants standards — jean, chino, pantalon de ville ou costume." },
  { q: 'Combien de temps pour le mettre ?', a: "5 secondes : un crochet sur chaque passant, et c'est ajusté. Sans couturier, sans outil." },
  { q: 'Livraison en combien de temps ?', a: "Abidjan : 24-48 h. Intérieur du pays : 48-72 h. Livraison à vos frais, paiement à la réception." },
];

/* ================================================================== */
/* Landing                                                             */
/* ================================================================== */
export default function AjusteurCeintureLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    // Sans quantité explicite, on ouvre toujours sur 1 ajusteur (CTA collant,
    // hero, blocs). Seul le sélecteur de pack passe selectedPack en explicite.
    const pack = q || 1;
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Ajusteur de Ceinture Élastique — Pantalon ajusté en 5 secondes · -50 %';
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

  // CTA collant : visible dès l'arrivée sur la page (masqué quand la modal est ouverte).
  useEffect(() => { setSticky(true); }, []);

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
    title: CONTENT_NAME, images: { hero: MEDIA.carousel[0] },
    ...(META_PIXEL_ID ? { metaPixelId: META_PIXEL_ID } : {}),
  }), [company]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] via-[#E0E7FF] to-[#ECFDF5] pb-28 text-neutral-900">
      <style>{`
        @keyframes aj-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .aj-marquee { animation: aj-marquee 26s linear infinite; }
        .aj-grad { background: linear-gradient(120deg,#1E3A8A,#6D28D9 50%,#F59E0B); -webkit-background-clip:text; background-clip:text; color: transparent; }
        .aj-glass { background: rgba(255,255,255,.08); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,.18); }
        @keyframes aj-enter { from{opacity:0; transform:translateX(14px) scale(.96)} to{opacity:1; transform:translateX(0) scale(1)} }
        .aj-enter { animation: aj-enter .45s ease-out both; }
        @keyframes aj-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes aj-shine { 0%{left:-60%} 55%{left:120%} 100%{left:120%} }
        .aj-cta-btn { position:relative; overflow:hidden; animation: aj-bounce 1.4s ease-in-out infinite; }
        .aj-cta-btn::after { content:''; position:absolute; top:0; left:-60%; height:100%; width:40%; transform:skewX(-20deg); background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent); animation:aj-shine 1.8s ease-in-out infinite; }
        .aj-cta-gold { background-image: linear-gradient(90deg,#B45309,#F59E0B,#FCD34D); color: #1A1207; }
        .aj-cta-indigo { background-image: linear-gradient(90deg,#1E3A8A,#3B82F6,#60A5FA); color: #FFFFFF; }
        .aj-cta-violet { background-image: linear-gradient(90deg,#4C1D95,#6D28D9,#A78BFA); color: #FFFFFF; }
        .aj-cta-emerald { background-image: linear-gradient(90deg,#047857,#10B981,#34D399); color: #FFFFFF; }
        .aj-cta-noir { background-image: linear-gradient(90deg,#14142B,#26263B); color: #FCD34D; box-shadow: inset 0 0 0 1px rgba(252,211,77,.45), 0 18px 44px -12px rgba(0,0,0,.6); }
        @media (prefers-reduced-motion: reduce) { .aj-marquee, .aj-enter, .aj-cta-btn, .aj-cta-btn::after { animation: none; } }
      `}</style>

      {/* ==================== HERO (texte pur, aucune image du tunnel) ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14142B] via-[#1E3A8A] to-[#312E81] px-4 pb-12 pt-10 text-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#3B82F6]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-[#F59E0B]/20 blur-3xl" />
        <div className="relative mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#FCD34D] ring-1 ring-white/25">👖 Nouveauté dressing 2026</span>
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1A1207]">-50 % aujourd'hui</span>
          </div>

          <h1 className="mt-6 text-[31px] font-black leading-[1.1] sm:text-[40px]">
            Pantalon trop large ? <span className="bg-gradient-to-r from-[#FCD34D] via-[#F59E0B] to-[#FCD34D] bg-clip-text text-transparent">Resserrez-le en 5 secondes, sans couture.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[440px] text-[13.5px] leading-relaxed text-white/75 sm:text-[15px]">
            L'ajusteur élastique à crochets métalliques qui rapproche les côtés de votre pantalon. Invisible, solide, sans couturier.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
              <Stars /> <span className="text-white">4,8/5</span> <span className="text-white/50">(500+ avis)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[#A7F3D0] ring-1 ring-white/20">
              👖 +1 200 pantalons ajustés ce mois-ci
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-[16px] font-bold text-white/40 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] bg-clip-text text-[46px] font-black leading-none text-transparent sm:text-[56px]">{fmtTotal(1)} F</span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#FCD34D]">Paiement à la livraison 🔒 · Satisfait ou remboursé 7 jours</p>

          <div className="mx-auto mt-6 max-w-sm"><AjCTA big variant="gold" onClick={() => openModal()}>Ajuster mon pantalon · {fmtTotal(1)} F</AjCTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-white/70">
            {['⚡ Prêt en 5 secondes', '🪝 Crochets métalliques', '👖 Tous les pantalons', '🙈 Invisible sous les vêtements'].map((b) => (
              <span key={b} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <Marquee gold items={['🚚 Livraison rapide partout', '💰 Paiement à la livraison', '✅ Satisfait ou remboursé', "-50 % aujourd'hui", '⚡ Ajustement en 5 secondes']} />

      {/* ==================== COMPTE À REBOURS ==================== */}
      <section className="bg-gradient-to-b from-[#14142B] via-[#1E3A8A] to-[#14142B] px-4 py-9">
        <div className="aj-glass relative mx-auto max-w-[560px] overflow-hidden rounded-[28px] p-6 text-center shadow-2xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#6D28D9]/30 blur-2xl" />
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FCD34D]">⚡ Offre -50 % expire ce soir</p>
          <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <p className="mt-3 text-[11px] font-semibold text-white/60">À minuit, l'ajusteur repasse à {fmtN(OLD_UNIT)} F.</p>
        </div>
      </section>

      {/* ==================== CARROUSEL FILE D'ATTENTE ==================== */}
      <section className="bg-gradient-to-b from-[#EEF2FF] to-[#C7D2FE]/50 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#1E3A8A] ring-1 ring-[#1E3A8A]/25">
              Tous vos pantalons
            </span>
            <h2 className="mt-3 text-[22px] font-black leading-tight text-[#1E1B4B] sm:text-[26px]">📸 Il s'adapte à <span className="aj-grad">tous vos pantalons</span></h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-[#1E3A8A]/75 sm:text-[14px]">Jean, chino, costume, pantalon de travail : le même geste, la même taille parfaite.</p>
          </div>
          <div className="mt-5"><QueueCarousel images={MEDIA.carousel} /></div>
          <div className="mx-auto mt-5 max-w-sm"><AjCTA variant="indigo" onClick={() => openModal()}>Ajuster tous mes pantalons</AjCTA></div>
        </div>
      </section>

      {/* ==================== BLOCS MÉDIAS ==================== */}
      <MediaBlock
        media={<LazyVideo src={MEDIA.demoVideo1} poster={MEDIA.demoPoster1} badge="Démo réelle" />}
        bg="bg-gradient-to-b from-[#14142B] via-[#1E3A8A] to-[#155E9C]"
        kicker="La démo en vidéo"
        title={<>Regardez : <span className="text-[#67E8F9]">5 secondes chrono</span></>}
        text="Un crochet sur chaque passant, la bande élastique rapproche les côtés : le pantalon épouse votre taille, sans un point de couture."
        cta="Je veux le mien"
        onCta={() => openModal()}
        variant="gold"
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.dosBaille} alt="Jean qui baille dans le dos corrigé par l'ajusteur de ceinture élastique à crochets" aspect="960/1200" />}
        bg="bg-gradient-to-b from-[#F5F3FF] to-[#DDD6FE]/50"
        kicker="Le problème classique"
        title={<>Jean qui baille dans le dos ? <span className="aj-grad">C'est fini.</span></>}
        text="Même avec une ceinture, le dos du jean se décolle à chaque mouvement. L'ajusteur plaque la taille exactement où il faut, toute la journée."
        cta="Corriger mon jean"
        onCta={() => openModal()}
        variant="violet"
        ratio="960/1200"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.pertePoids} alt="Pantalon devenu trop large après une perte de poids, réajusté sans couturier" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#ECFDF5] to-[#A7F3D0]/40"
        kicker="Après votre perte de poids"
        title={<>Vous avez maigri ? <span className="text-[#059669]">Gardez vos pantalons.</span></>}
        text="Bravo pour les kilos perdus. Plutôt que de tout racheter ou payer le couturier pour chaque pantalon, un ajusteur suffit — réutilisable à l'infini."
        cta="Garder mes pantalons"
        onCta={() => openModal()}
        variant="emerald"
        ratio="1/1"
      />

      <Marquee items={['Stock limité ce soir', 'Paiement uniquement à la livraison', 'Abidjan · Bouaké · San-Pédro · Yamoussoukro', '+1 200 pantalons ajustés ce mois-ci']} />

      <MediaBlock
        media={<LazyVideo src={MEDIA.demoVideo2} poster={MEDIA.demoPoster2} badge="Fixation express" />}
        bg="bg-gradient-to-b from-[#312E81] via-[#6D28D9] to-[#4C1D95]"
        kicker="Fixation express"
        title={<>Posé en 5 secondes, <span className="text-[#FDE68A]">retiré en 2</span></>}
        text="Pas d'outil, pas de couture, pas de perçage. Les crochets métalliques s'ouvrent et se ferment d'une main — vous changez de pantalon en un clin d'œil."
        cta="Commander maintenant"
        onCta={() => openModal()}
        variant="gold"
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.invisible} alt="Ajusteur de ceinture invisible sous un t-shirt, porté à l'intérieur du pantalon" aspect="960/1200" />}
        bg="bg-gradient-to-b from-[#FFF7ED] to-[#FED7AA]/50"
        kicker="Totalement discret"
        title={<>Invisible sous le t-shirt, <span className="text-[#EA580C]">même près du corps</span></>}
        text="Plat et porté à l'intérieur de la ceinture du pantalon : personne ne devine rien. Votre silhouette reste nette, votre secret est gardé."
        cta="Rester élégant en secret"
        onCta={() => openModal()}
        variant="noir"
        ratio="960/1200"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.crochets} alt="Gros plan sur les crochets métalliques solides de l'ajusteur de ceinture élastique" aspect="960/1200" />}
        bg="bg-gradient-to-b from-[#EFF6FF] to-[#BFDBFE]/50"
        kicker="Maintien solide"
        title={<>Des crochets métalliques <span className="aj-grad">qui ne lâchent pas</span></>}
        text="Pas du plastique fragile : de vrais crochets en métal qui tiennent ferme au bureau, au chantier comme en soirée. Réutilisable des années."
        cta="Choisir le solide"
        onCta={() => openModal()}
        variant="indigo"
        ratio="960/1200"
      />

      <MediaBlock
        media={<LazyVideo src={MEDIA.demoVideo3} poster={MEDIA.demoPoster3} badge="En situation réelle" />}
        bg="bg-gradient-to-b from-[#0F172A] via-[#1E3A8A] to-[#14142B]"
        kicker="En situation réelle"
        title={<>Bureau, chantier, mariage : <span className="text-[#67E8F9]">il suit partout</span></>}
        text="Assis, debout, penché, en voiture : la bande élastique bouge avec vous sans jamais se décrocher ni serrer trop fort."
        cta="Équiper mon quotidien"
        onCta={() => openModal()}
        variant="violet"
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.dressing} alt="Un seul ajusteur de ceinture pour tout le dressing : jean, chino et pantalon de ville" aspect="960/1200" />}
        bg="bg-gradient-to-b from-[#F0FDF4] to-[#BBF7D0]/40"
        kicker="Tout le dressing"
        title={<>Une seule ceinture élastique, <span className="text-[#059669]">tous vos pantalons</span></>}
        text="Jean du week-end, chino du bureau, pantalon de cérémonie : vous déplacez l'ajusteur en 5 secondes. Prenez-en 2 ou 3 pour ne plus y penser."
        cta="Équiper mon dressing"
        onCta={() => openModal()}
        variant="emerald"
        ratio="960/1200"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.costume} alt="Ajusteur de ceinture porté avec un costume : taille ajustée et élégance au quotidien" aspect="960/1200" />}
        bg="bg-gradient-to-b from-[#EEF2FF] to-[#C7D2FE]/40"
        kicker="Même en costume"
        title={<>Costume, jean ou chino : <span className="aj-grad">le même geste</span></>}
        text="Du plus habillé au plus décontracté : l'ajusteur reste discret et le maintien impeccable. L'élégance sans retouche chez le tailleur."
        cta="Être impeccable partout"
        onCta={() => openModal()}
        variant="gold"
        ratio="960/1200"
      />

      {/* ==================== CHIFFRES / PREUVE SOCIALE ==================== */}
      <section className="bg-gradient-to-b from-[#EEF2FF] via-[#E0E7FF] to-[#FFF7ED] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-3 gap-3 text-center">
          {[
            { v: '4,8/5', l: 'Note moyenne', i: '⭐' },
            { v: '+1 200', l: 'Pantalons ajustés', i: '👖' },
            { v: '97 %', l: 'Recommandent', i: '👍' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#1E3A8A]/15">
              <span className="text-[18px]">{s.i}</span>
              <p className="aj-grad mt-1 text-[22px] font-black leading-none sm:text-[26px]">{s.v}</p>
              <p className="mt-1.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-[#1E3A8A]/70">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TÉMOIGNAGES ==================== */}
      <section className="bg-gradient-to-b from-[#E0E7FF] to-[#C7D2FE]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#1E1B4B]">4,8/5 — 500+ avis vérifiés</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#1E1B4B] sm:text-[28px]">Ils ont retrouvé <span className="aj-grad">leur taille</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {TESTIMONIALS.map((r) => <TestimonialCard key={r.n} r={r} />)}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><AjCTA variant="indigo" onClick={() => openModal()}>Rejoindre les clients satisfaits</AjCTA></div>
        </div>
      </section>

      {/* ==================== WHATSAPP ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] via-[#E0E7FF] to-[#FFF7ED] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#1E1B4B]">97 % de clients recommandent</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#1E1B4B] sm:text-[28px]">Ils nous écrivent <span className="aj-grad">sur WhatsApp</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-[#1E3A8A]">🔒 Paiement à la livraison · Vous ne payez qu'à la réception</p>
          <div className="mx-auto mt-5 max-w-sm"><AjCTA variant="emerald" onClick={() => openModal()}>Commander en toute confiance</AjCTA></div>
        </div>
      </section>

      {/* ==================== GARANTIE ==================== */}
      <section className="bg-gradient-to-b from-[#FFF7ED] to-[#FED7AA]/40 px-4 py-10">
        <div className="mx-auto max-w-[560px]">
          <div className="rounded-[28px] bg-white/85 p-6 text-center shadow-xl ring-1 ring-[#F59E0B]/30 sm:p-8">
            <span className="text-[34px]">🛡️</span>
            <h2 className="mt-2 text-[22px] font-black text-[#1E1B4B] sm:text-[26px]">Satisfait ou remboursé <span className="aj-grad">pendant 7 jours</span></h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-neutral-600">
              Essayez l'ajusteur une semaine complète sur tous vos pantalons. Pas convaincu ? Nous vous remboursons. Et vous ne payez qu'à la réception, jamais en ligne.
            </p>
            <div className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-3 text-center sm:grid-cols-3">
              {[
                { icon: '💵', t: 'Paiement à la livraison', d: 'Rien à payer en ligne.' },
                { icon: '🚚', t: 'Livraison rapide', d: 'Abidjan 24-48 h, intérieur 48-72 h.' },
                { icon: '📞', t: 'Confirmation par appel', d: 'Un conseiller vous appelle avant expédition.' },
              ].map((g) => (
                <div key={g.t} className="rounded-2xl bg-[#EEF2FF]/70 p-3.5 ring-1 ring-[#1E3A8A]/15">
                  <span className="text-[20px]">{g.icon}</span>
                  <p className="mt-1.5 text-[12px] font-black text-[#1E1B4B]">{g.t}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{g.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="bg-gradient-to-b from-[#EEF2FF] to-[#E0E7FF] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-[#1E1B4B] sm:text-[28px]">Questions <span className="aj-grad">fréquentes</span></h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-[#1E3A8A]/15">
                <summary className="cursor-pointer text-[13.5px] font-bold text-[#1E3A8A]">{f.q}</summary>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== OFFRE / URGENCE ==================== */}
      <section className="bg-gradient-to-b from-[#14142B] via-[#1E3A8A] to-[#312E81] px-4 py-12 text-white">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FCD34D]">⏳ Dernières heures au prix sacrifié</p>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="text-[15px] font-bold text-white/50 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="text-[40px] font-black leading-none text-white">{fmtTotal(1)} F</span>
          </div>
          <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <div className="mx-auto mt-6 max-w-sm"><AjCTA big variant="gold" onClick={() => openModal()}>J'en profite avant minuit</AjCTA></div>
        </div>
      </section>

      {/* ==================== PACKS ==================== */}
      <section className="bg-gradient-to-b from-[#EEF2FF] via-[#E0E7FF] to-[#FED7AA]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-[#1E1B4B] sm:text-[28px]">Choisissez votre <span className="aj-grad">pack</span></h2>
          <p className="mt-2 text-center text-[13px] text-[#1E3A8A]/75">1 pour essayer · 2 pour jean + travail · 3 pour tout le dressing.</p>
          <div className="mt-6 space-y-3">
            {QTY_OPTS.map((o) => {
              const active = selectedPack === o.v;
              return (
                <button key={o.v} type="button"
                  onClick={() => { setSelectedPack(o.v); track('SelectPack', { product: PRODUCT_CODE, pack: o.v, value: orderTotal(PRICES, o.v), currency: 'XOF' }); }}
                  className={`relative w-full rounded-2xl border-2 bg-white/90 p-4 text-left transition ${active ? 'scale-[1.01] border-[#F59E0B] shadow-xl' : 'border-[#818CF8]/40 hover:border-[#1E3A8A]'}`}>
                  {o.tag && active && <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-[#1E1B4B]">{o.label} <span className="ml-1 text-[13px] font-bold text-neutral-400 line-through">{fmtN(OLD_UNIT * o.v)} F</span></p>
                      {o.save && <p className="text-[11px] font-semibold text-emerald-600">{o.save}</p>}
                    </div>
                    <p className="text-[22px] font-black text-[#1E3A8A]">{o.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <AjCTA big variant="gold" onClick={() => openModal(selectedPack)}>Commander · {fmtTotal(selectedPack)} F</AjCTA>
          </div>
          <p className="mt-6 text-center text-[15px] font-black text-[#1E1B4B]">
            Taille ajustée. Style impeccable. <span className="aj-grad">En 5 secondes.</span>
          </p>
          <div className="mx-auto mt-4 max-w-sm"><AjCTA variant="violet" onClick={() => openModal()}>Dernier clic avant minuit ⏳</AjCTA></div>
        </div>
      </section>

      {/* ==================== FOOTER COD ==================== */}
      <footer className="bg-gradient-to-b from-[#14142B] to-[#1E1B4B] px-4 pb-8 pt-6 text-center text-[10.5px] text-white/60">
        <p className="font-bold text-white/80">💵 Paiement à la livraison · 🚚 Abidjan & toute la Côte d'Ivoire</p>
        <p className="mt-1.5">Livraison à vos frais · Paiement à la réception. Un conseiller vous appelle pour confirmer avant expédition.</p>
        <p className="mt-3">© {new Date().getFullYear()} · Ajusteur de Ceinture Élastique · Côte d'Ivoire</p>
      </footer>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={() => openModal()} />

      <Suspense fallback={null}>
        {modal && (
          <OrderModalAjusteurCeinture
            open={modal}
            onClose={() => setModal(false)}
            cfg={orderCfg}
            product={product}
            setProduct={(p) => setProduct(p as Product | null)}
            qtyOptions={QTY_OPTS}
            initialQty={qty}
          />
        )}
      </Suspense>
    </div>
  );
}
