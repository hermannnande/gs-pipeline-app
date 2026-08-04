/**
 * Landing « MÉDICAL 2026 » — Oxymètre de Pouls Digital (OXYMETRE_POULS).
 * Slug : oxymetre-pouls · Prix : 8 500 / 15 900 / 22 900 F (-50 % affiché)
 *
 * MISE EN PAGE SIGNATURE (demande client) : blocs médias en ZIGZAG alterné
 * (média gauche / texte droite, puis inversé) avec REVELATION AU SCROLL :
 * chaque bloc glisse depuis son cote (IntersectionObserver, translateX + fade
 * ~0,6 s, une seule fois, prefers-reduced-motion respecte).
 *
 * Direction : medical moderne — bleu #1D4ED8 -> cyan #06B6D4 -> emeraude
 * #10B981, accents rouge battement de coeur #EF4444 (ligne ECG animee,
 * coeur pulsant dans le hero). CTAs animes (bounce + shine) prefixes ox-.
 *
 * CONFORMITÉ : l'appareil mesure SpO2 + pouls uniquement. Mentions visibles
 * « Ne mesure pas la tension arterielle » et « Ne remplace pas un avis medical ».
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const OrderModalOxymetrePouls = lazy(() => import('../../components/order/OrderModalOxymetrePouls'));

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'oxymetre-pouls';
const PRODUCT_CODE = 'OXYMETRE_POULS';
const CONTENT_NAME = 'Oxymètre de Pouls Digital';
const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (init conditionnée)
const THANK_YOU_URL = '/oxymetre-pouls/merci';

const PRICES: Record<number, number> = { 1: 8500, 2: 15900, 3: 22900 };
const OLD_UNIT = 17000; // prix barré cohérent avec l'offre -50 %
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/ |,/g, ' ');
const fmtN = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 oxymètre', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 oxymètres', sub: packLabel(PRICES, 2, 'F'), tag: 'Populaire', save: 'Économisez 1 100 F' },
  { v: 3, label: '3 oxymètres', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 2 600 F' },
];

const M = (n: string) => `/oxymetre-pouls/${n}`;
const MEDIA = {
  hero: M('o01.webp'),             // marketing officiel « Surveillez votre oxygène » (disclaimer inclus)
  personneAgee: M('o02.webp'),     // homme avec oxymètre + packshot
  packshot: M('o03.webp'),         // packshot OxyPulse « 8 secondes » + boîte
  huitSecondes: M('o04.webp'),     // « 8 Seconds Measure » doigt dans l'appareil
  demoVideo1: M('v01.mp4'), demoPoster1: M('v01p.webp'),
  demoVideo2: M('v02.mp4'), demoPoster2: M('v02p.webp'),
  demoVideo3: M('v03.mp4'), demoPoster3: M('v03p.webp'),
};

// Variantes de couleurs des CTA animés (cycle sur les blocs).
type CtaVariant = 'blue' | 'cyan' | 'emerald' | 'red' | 'noir';

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
        <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-[#1D4ED8]/20 to-[#06B6D4]/15" />
      )}
    </div>
  );
}

function LazyVideo({ src, poster, badge }: { src: string; poster?: string; badge?: string }) {
  const { ref, visible } = useOnScreen();
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-[#0B1E4B]" style={{ aspectRatio: '9/16' }}>
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /> : null}
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#EF4444]" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      {badge && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EF4444] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
          </span>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RÉVÉLATION AU SCROLL (une seule fois, translateX + fade, 0,6 s).    */
/* ------------------------------------------------------------------ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); obs.disconnect(); }
    }, { threshold: 0.18 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, shown };
}

/* ------------------------------------------------------------------ */
/* Étoiles dorées (note 4,8/5).                                        */
/* ------------------------------------------------------------------ */
function Star({ half }: { half?: boolean }) {
  return (
    <svg className="h-4 w-4 text-[#F59E0B]" fill={half ? 'url(#oxHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="oxHalfStar" x1="0" y1="0" x2="1" y2="0">
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
/* Ligne ECG animée (hero) + coeur pulsant.                            */
/* ------------------------------------------------------------------ */
function EcgLine({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 40" className={className} aria-hidden>
      <path
        d="M0 20 H60 L75 20 L85 6 L95 34 L105 20 H140 L155 20 L165 10 L175 30 L185 20 H220 L235 20 L245 4 L255 36 L265 20 H300"
        fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="ox-ecg-path"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* CTA animé (bounce + shine) décliné en 5 couleurs — classes .ox-*.   */
/* ------------------------------------------------------------------ */
function OxCTA({ onClick, children, big, variant = 'blue' }: { onClick: () => void; children: ReactNode; big?: boolean; variant?: CtaVariant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ox-cta-btn ox-cta-${variant} group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 ${big ? 'py-5 text-[16px] sm:text-[18px]' : 'py-4 text-[14px] sm:text-[15px]'} font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_44px_-12px_rgba(29,78,216,.5)] ring-2 ring-white/30 transition hover:scale-[1.02] active:scale-[0.99]`}
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
      <div className="border-t border-white/25 bg-gradient-to-r from-[#0B1E4B]/95 via-[#1D4ED8]/95 to-[#06B6D4]/95 shadow-[0_-10px_34px_-10px_rgba(11,30,75,.5)] backdrop-blur-md">
        <div className="mx-auto max-w-lg px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 leading-tight text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A5F3FC]">-50 % · aujourd'hui</p>
              <p className="text-[15px] font-black">
                {fmtTotal(1)} F <span className="ml-1 text-[11px] font-semibold text-white/70 line-through">{fmtN(OLD_UNIT)} F</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClick}
              className="ox-cta-btn ox-cta-red shrink-0 rounded-xl px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.1em] text-white shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
            >
              Commander ❤️
            </button>
          </div>
          <p className="mt-1 text-center text-[9.5px] font-semibold text-white/55">💰 Paiement à la livraison · ✅ Garantie 7 jours</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barre défilante (marquee) à fond dégradé.                           */
/* ------------------------------------------------------------------ */
function Marquee({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <div className={`overflow-hidden py-2.5 ${dark
      ? 'border-y border-[#06B6D4]/30 bg-gradient-to-r from-[#0B1E4B] via-[#1D4ED8] to-[#0B1E4B] text-[#DBEAFE]'
      : 'border-y border-white/40 bg-gradient-to-r from-[#1D4ED8] via-[#06B6D4] to-[#10B981] text-white'}`}>
      <div className="ox-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className={dark ? 'text-[#EF4444]' : 'text-[#FDE68A]'}>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compte à rebours (fin de l'offre à minuit) — pills chiffres.        */
/* ------------------------------------------------------------------ */
function Countdown({ h, m, s, compact }: { h: number; m: number; s: number; compact?: boolean }) {
  const cell = (v: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className={`inline-flex min-w-[52px] items-center justify-center rounded-2xl bg-white/10 font-black tabular-nums text-white ring-1 ring-white/25 backdrop-blur-sm ${compact ? 'px-2.5 py-1.5 text-[16px]' : 'px-3 py-2.5 text-[24px]'}`}>
        {pad(v)}
      </span>
      <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#A5F3FC]">{label}</span>
    </div>
  );
  return (
    <div className="flex items-start justify-center gap-2.5">
      {cell(h, 'Heures')}
      <span className={`font-black text-white/60 ${compact ? 'pt-1 text-[14px]' : 'pt-2 text-[20px]'}`}>:</span>
      {cell(m, 'Min')}
      <span className={`font-black text-white/60 ${compact ? 'pt-1 text-[14px]' : 'pt-2 text-[20px]'}`}>:</span>
      {cell(s, 'Sec')}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BLOC ZIGZAG : média d'un cote, texte de l'autre, révélation scroll. */
/* ------------------------------------------------------------------ */
type ZigBlockProps = {
  media: ReactNode;
  side: 'left' | 'right'; // position du média sur desktop
  bg: string;
  kicker: string;
  title: ReactNode;
  text: string;
  cta: string;
  onCta: () => void;
  variant: CtaVariant;
  dark?: boolean;
  ratio?: string;
};

function ZigBlock({ media, side, bg, kicker, title, text, cta, onCta, variant, dark, ratio = '960/1200' }: ZigBlockProps) {
  const { ref, shown } = useReveal();
  const fromLeft = side === 'left';
  return (
    <section className={`px-4 py-8 sm:py-10 ${bg}`}>
      <div
        ref={ref}
        className={`mx-auto max-w-[920px] transition-all duration-[600ms] ease-out ${shown ? 'translate-x-0 opacity-100' : fromLeft ? '-translate-x-14 opacity-0' : 'translate-x-14 opacity-0'}`}
      >
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <div className={`overflow-hidden rounded-[28px] shadow-2xl ${dark ? 'ring-1 ring-white/25' : 'ring-1 ring-[#1D4ED8]/15'} ${fromLeft ? '' : 'md:order-2'}`}>
            <div style={{ aspectRatio: ratio }} className="w-full [&>div]:h-full">{media}</div>
          </div>
          <div className={`text-center md:text-left ${fromLeft ? '' : 'md:order-1'}`}>
            <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dark ? 'bg-white/15 text-[#A5F3FC] ring-1 ring-white/25' : 'bg-white/70 text-[#1D4ED8] ring-1 ring-[#1D4ED8]/25'}`}>
              {kicker}
            </span>
            <h2 className={`mt-3 text-[22px] font-black leading-tight sm:text-[28px] ${dark ? 'text-white' : 'text-[#0B1E4B]'}`}>{title}</h2>
            <p className={`mt-2 max-w-[440px] text-[13px] leading-relaxed sm:text-[14.5px] max-md:mx-auto ${dark ? 'text-white/85' : 'text-[#1D4ED8]/75'}`}>{text}</p>
            <div className="mt-5 max-w-sm max-md:mx-auto"><OxCTA variant={variant} onClick={onCta}>{cta}</OxCTA></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications d'achat (popup bas-gauche, rotation ~12 s).           */
/* ------------------------------------------------------------------ */
const PURCHASE_NOTIFS = [
  { n: 'Koffi', q: 'Abobo', p: '1 oxymètre' },
  { n: 'Aminata', q: 'Yopougon', p: '2 oxymètres' },
  { n: 'Yao', q: 'Cocody', p: '1 oxymètre' },
  { n: 'Fatou', q: 'Marcory', p: '3 oxymètres' },
  { n: 'Ibrahim', q: 'Bouaké', p: '2 oxymètres' },
  { n: 'Awa', q: 'Angré', p: '1 oxymètre' },
  { n: 'Moussa', q: 'Koumassi', p: '2 oxymètres' },
  { n: 'Adjoua', q: 'Treichville', p: '1 oxymètre' },
  { n: 'Salimata', q: 'San-Pédro', p: '3 oxymètres' },
  { n: 'Nadia', q: 'Riviera', p: '2 oxymètres' },
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
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-[0_16px_40px_-12px_rgba(11,30,75,.35)] ring-1 ring-[#93C5FD]/50 backdrop-blur-md">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#06B6D4] text-[15px] font-black text-white">
          {it.n[0]}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight text-[#0B1E4B]">
            {it.n} · {it.q} <span className="font-normal text-neutral-500">vient de commander</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#1D4ED8]">
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
  { n: 'Koffi', v: 'Abobo', stars: 5, t: "Je surveille le SpO2 de ma mère chaque matin. En 8 secondes c'est lu, l'écran est grand et clair. Elle a 72 ans et s'en sert seule 🙏🏾" },
  { n: 'Aminata', v: 'Yopougon', stars: 5, t: "Après le sport, je vérifie mon pouls et mon oxygène. Petit, léger, dans la poche du sac. Exactement ce qu'il me fallait." },
  { n: 'Ibrahim', v: 'Bouaké', stars: 4, t: "Un seul bouton, même pas besoin de lire la notice. Je l'ai pris pour moi et un pour mon père. Rassurant au quotidien." },
  { n: 'Nadia', v: 'Cocody', stars: 5, t: "Mon SpO2 à 97 %, pouls stable : je suis rassurée avant de dormir. Et la livraison à Koumassi en 2 jours, payée à la réception 😍" },
];

function TestimonialCard({ r }: { r: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#1D4ED8]/15">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D4ED8] via-[#06B6D4] to-[#10B981] text-[15px] font-black text-white">
          {r.n[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-[#0B1E4B]">{r.n} <span className="font-semibold text-neutral-400">· {r.v}</span></p>
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
  { n: 'Aïssata', v: 'Marcory', t: "Sis l'oxymètre est top 🙏🏾 Je contrôle papa tous les soirs : SpO2 98 %, pouls normal. Ça nous rassure toute la famille 😍", h: '09:42', stars: 5 },
  { n: 'Mamadou', v: 'Koumassi', t: "Reçu hier, payé à la livraison 👌🏾 Après mon footing, pouls et oxygène lus en 8 secondes. L'écran se voit même en plein soleil 😩🔥", h: '12:15', stars: 5 },
  { n: 'Adjoua', v: 'Treichville', t: "Commandé lundi, reçu mercredi. Ma tante mesure son SpO2 toute seule avec le bouton unique. Elle ne veut plus le rendre 😂", h: '18:03', stars: 5 },
  { n: 'Fatou', v: 'San-Pédro', t: "J'en ai pris 3 : un pour moi, un pour mes parents, un pour le sac de sport 🏠 Toute la famille est équipée maintenant ❤️", h: '10:27', stars: 5 },
];

function WhatsAppBubble({ r, i }: { r: (typeof WHATSAPP_REVIEWS)[number]; i: number }) {
  const mine = i % 2 === 0;
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-tl-md bg-white ring-1 ring-[#1D4ED8]/15' : 'rounded-tr-md bg-[#DCF8C6] ring-1 ring-emerald-600/10'}`}>
        <p className={`text-[10px] font-black ${mine ? 'text-[#1D4ED8]' : 'text-emerald-700'}`}>{r.n} · {r.v}</p>
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
/* FAQ (honnête — conformité produit).                                 */
/* ------------------------------------------------------------------ */
const FAQ = [
  { q: 'Est-ce que ça mesure la tension artérielle ?', a: "Non. L'oxymètre mesure uniquement le taux d'oxygène dans le sang (SpO2) et le rythme cardiaque (pouls). Il ne remplace ni un tensiomètre ni un avis médical." },
  { q: 'Comment lire le SpO2 ?', a: "Entre 95 et 100 %, c'est la zone normale. En dessous de 95 %, surveillez régulièrement et parlez-en à un professionnel de santé." },
  { q: 'Il fonctionne avec des piles ?', a: "Oui, avec des piles standard — pas besoin de chargeur. L'appareil est économe et s'éteint automatiquement après la mesure." },
  { q: 'Pour qui est-ce fait ?', a: "Parents âgés, sportifs, familles, suivi à domicile ou après l'effort. C'est un geste de rassurance quotidienne, pas un appareil de diagnostic." },
  { q: 'Livraison en combien de temps ?', a: "Abidjan : 24-48 h. Intérieur du pays : 48-72 h. Livraison à vos frais, paiement à la réception." },
];

/* ================================================================== */
/* Landing                                                             */
/* ================================================================== */
export default function OxymetresPoulsLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    // Sans quantité explicite, on ouvre toujours sur 1 oxymètre (CTA collant,
    // hero, blocs). Seul le sélecteur de pack passe selectedPack en explicite.
    const pack = q || 1;
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Oxymètre de Pouls Digital — SpO2 + rythme cardiaque en 8 s · -50 %';
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
    title: CONTENT_NAME, images: { hero: MEDIA.hero },
    ...(META_PIXEL_ID ? { metaPixelId: META_PIXEL_ID } : {}),
  }), [company]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#ECFDF5] pb-28 text-neutral-900">
      <style>{`
        @keyframes ox-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .ox-marquee { animation: ox-marquee 26s linear infinite; }
        .ox-grad { background: linear-gradient(120deg,#1D4ED8,#06B6D4 45%,#10B981); -webkit-background-clip:text; background-clip:text; color: transparent; }
        @keyframes ox-ecg { from{stroke-dashoffset:300} to{stroke-dashoffset:0} }
        .ox-ecg-path { stroke-dasharray: 300; animation: ox-ecg 2.4s linear infinite; }
        @keyframes ox-heartbeat { 0%,100%{transform:scale(1)} 25%{transform:scale(1.18)} 40%{transform:scale(1)} 60%{transform:scale(1.12)} }
        .ox-heart { animation: ox-heartbeat 1.2s ease-in-out infinite; transform-origin: center; }
        @keyframes ox-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ox-shine { 0%{left:-60%} 55%{left:120%} 100%{left:120%} }
        .ox-cta-btn { position:relative; overflow:hidden; animation: ox-bounce 1.4s ease-in-out infinite; }
        .ox-cta-btn::after { content:''; position:absolute; top:0; left:-60%; height:100%; width:40%; transform:skewX(-20deg); background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent); animation:ox-shine 1.8s ease-in-out infinite; }
        .ox-cta-blue { background-image: linear-gradient(90deg,#1E3A8A,#1D4ED8,#3B82F6); }
        .ox-cta-cyan { background-image: linear-gradient(90deg,#0E7490,#06B6D4,#22D3EE); }
        .ox-cta-emerald { background-image: linear-gradient(90deg,#047857,#10B981,#34D399); }
        .ox-cta-red { background-image: linear-gradient(90deg,#B91C1C,#EF4444,#F87171); }
        .ox-cta-noir { background-image: linear-gradient(90deg,#0B1E4B,#1E3A8A); box-shadow: inset 0 0 0 1px rgba(147,197,253,.4), 0 18px 44px -12px rgba(11,30,75,.6); }
        @media (prefers-reduced-motion: reduce) { .ox-marquee, .ox-ecg-path, .ox-heart, .ox-cta-btn, .ox-cta-btn::after { animation: none; } }
      `}</style>

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden px-4 pb-10 pt-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#06B6D4]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#EF4444]/15 blur-3xl" />
        <div className="relative mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">🫀 Résultat en 8 secondes</span>
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#EF4444] to-[#F87171] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">-50 % aujourd'hui</span>
          </div>

          <h1 className="mt-5 text-[30px] font-black leading-[1.1] text-[#0B1E4B] sm:text-[38px]">
            Votre oxygène et votre cœur, <span className="ox-grad">mesurés en 8 secondes.</span>
          </h1>

          <div className="mx-auto mt-3 flex max-w-[300px] items-center justify-center gap-2">
            <span className="ox-heart text-[26px]">❤️</span>
            <EcgLine className="h-9 w-full max-w-[240px]" />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#0B1E4B]">4,8/5</span> <span className="text-neutral-400">(400+ avis)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[#1D4ED8] ring-1 ring-[#1D4ED8]/30">
              🫁 SpO2 + ❤️ Pouls
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-center gap-3">
            <span className="text-[16px] font-bold text-neutral-400 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="ox-grad text-[44px] font-black leading-none sm:text-[54px]">{fmtTotal(1)} F</span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#EF4444]">Paiement à la livraison 🔒</p>

          <div className="relative mx-auto mt-6 max-w-[440px]">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#1D4ED8]/20 via-[#06B6D4]/25 to-[#10B981]/20 blur-xl" />
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/60">
              <LazyImg src={MEDIA.hero} alt="Oxymètre de pouls digital : surveillez votre oxygène (SpO2) et votre rythme cardiaque à la maison, lecture rapide en quelques secondes" aspect="960/1200" priority />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><OxCTA big variant="red" onClick={() => openModal()}>Mesurer mon SpO2 · {fmtTotal(1)} F</OxCTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-[#1D4ED8]/80">
            {['🫁 SpO2 · 95-100 % normal', '❤️ Pouls en temps réel', '🔘 Un seul bouton', '🎒 Compact & portable'].map((b) => (
              <span key={b} className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#1D4ED8]/25">{b}</span>
            ))}
          </div>
          <p className="mt-3 text-[10px] font-semibold text-neutral-500">⚠️ Ne mesure pas la tension artérielle · Ne remplace pas un avis médical</p>
        </div>
      </section>

      <Marquee items={['🚚 Livraison rapide partout', '💰 Paiement à la livraison', '✅ Garantie 7 jours', 'Résultat en 8 secondes', 'SpO2 + rythme cardiaque']} />

      {/* ==================== COMPTE À REBOURS ==================== */}
      <section className="bg-gradient-to-r from-[#0B1E4B] via-[#1D4ED8] to-[#0E7490] px-4 py-8">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FCA5A5]">⚡ Offre -50 % expire ce soir</p>
          <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <p className="mt-3 text-[11px] font-semibold text-[#BFDBFE]">À minuit, l'oxymètre repasse à {fmtN(OLD_UNIT)} F.</p>
        </div>
      </section>

      {/* ==================== BLOCS ZIGZAG (média alterné + scroll-reveal) ==================== */}
      <ZigBlock
        media={<LazyVideo src={MEDIA.demoVideo1} poster={MEDIA.demoPoster1} badge="Démo réelle" />}
        side="left"
        bg="bg-gradient-to-b from-[#0B1E4B] via-[#1D4ED8] to-[#155E9C]"
        kicker="La démo en vidéo"
        title={<>Clipsez le doigt, <span className="text-[#67E8F9]">lisez en 8 secondes</span></>}
        text="Un seul bouton : vous insérez le doigt, l'écran s'allume, le SpO2 et le pouls s'affichent. Aucun réglage, aucune application à installer."
        cta="Je veux le mien"
        onCta={() => openModal()}
        variant="red"
        dark
        ratio="9/16"
      />

      <ZigBlock
        media={<LazyImg src={MEDIA.personneAgee} alt="Parent âgé surveillant son oxygène et son rythme cardiaque à la maison avec l'oxymètre de pouls digital" aspect="960/1200" />}
        side="right"
        bg="bg-gradient-to-b from-[#EFF6FF] to-[#BFDBFE]/50"
        kicker="Parents âgés"
        title={<>Veillez sur vos parents, <span className="ox-grad">même à distance</span></>}
        text="Un contrôle rapide chaque matin : SpO2 et pouls lisibles en gros chiffres, par un appareil qu'ils utilisent seuls, sans aide et sans stress."
        cta="Équiper mes parents"
        onCta={() => openModal()}
        variant="blue"
        ratio="960/1200"
      />

      <ZigBlock
        media={<LazyImg src={MEDIA.packshot} alt="Oxymètre de pouls OxyPulse avec sa boîte : mesure SpO2 et rythme cardiaque, lecture rapide en 8 secondes" aspect="960/1200" />}
        side="left"
        bg="bg-gradient-to-b from-[#ECFEFF] to-[#A5F3FC]/40"
        kicker="Le produit en détail"
        title={<>Compact, lisible, <span className="ox-grad">pensé pour durer</span></>}
        text="Écran digital clair et coloré, ouverture confortable du clip, arrêt automatique après la mesure. Dans la poche, le sac ou la trousse de voyage."
        cta="Commander maintenant"
        onCta={() => openModal()}
        variant="cyan"
        ratio="960/1200"
      />

      <Marquee dark items={['Stock limité ce soir', 'Paiement uniquement à la livraison', 'Abidjan · Bouaké · San-Pédro · Yamoussoukro', '400+ avis notent 4,8/5']} />

      <ZigBlock
        media={<LazyVideo src={MEDIA.demoVideo2} poster={MEDIA.demoPoster2} badge="Le geste simple" />}
        side="right"
        bg="bg-gradient-to-b from-[#134E4A] via-[#0F766E] to-[#10B981]"
        kicker="Le geste simple"
        title={<>Un bouton. <span className="text-[#A7F3D0]">C'est tout.</span></>}
        text="Pas de mode d'emploi à retenir : un appui, le doigt dedans, les chiffres arrivent. Idéal pour les grands-parents comme pour les sportifs pressés."
        cta="Profiter du -50 %"
        onCta={() => openModal()}
        variant="noir"
        dark
        ratio="9/16"
      />

      <ZigBlock
        media={<LazyImg src={MEDIA.huitSecondes} alt="Mesure en 8 secondes : doigt inséré dans l'oxymètre de pouls digital, SpO2 et pouls affichés" aspect="1/1" />}
        side="left"
        bg="bg-gradient-to-b from-[#FFF7ED] to-[#FED7AA]/50"
        kicker="8 secondes chrono"
        title={<>Le temps de respirer, <span className="text-[#EA580C]">c'est déjà mesuré</span></>}
        text="Le capteur infrarouge lit l'oxygène du sang et le rythme du cœur pendant que vous respirez calmement. Résultat net, sans attente."
        cta="Mesurer en 8 secondes"
        onCta={() => openModal()}
        variant="red"
        ratio="1/1"
      />

      {/* ==================== COMMENT ÇA MARCHE (3 étapes) ==================== */}
      <section className="bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#F0FDF4] px-4 py-12">
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#1D4ED8] ring-1 ring-[#1D4ED8]/25">Mode d'emploi</span>
            <h2 className="mt-3 text-[24px] font-black text-[#0B1E4B] sm:text-[28px]">Comment ça marche, <span className="ox-grad">en 3 étapes</span></h2>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              { n: '1', i: '🫳', t: 'Clipsez le doigt', d: 'Insérez le doigt dans la pince, écran vers le haut, restez détendu.' },
              { n: '2', i: '⏱️', t: 'Attendez 8 secondes', d: 'Respirez normalement pendant que le capteur mesure SpO2 et pouls.' },
              { n: '3', i: '📊', t: 'Lisez le résultat', d: 'SpO2 (95-100 % = normal) et rythme cardiaque en gros chiffres.' },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-white/85 p-5 text-center shadow-lg ring-1 ring-[#1D4ED8]/15">
                <span className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] text-[13px] font-black text-white">{s.n}</span>
                <span className="mt-2 block text-[30px]">{s.i}</span>
                <p className="mt-2 text-[14px] font-black text-[#0B1E4B]">{s.t}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><OxCTA variant="emerald" onClick={() => openModal()}>Essayer ce soir</OxCTA></div>
        </div>
      </section>

      <ZigBlock
        media={<LazyVideo src={MEDIA.demoVideo3} poster={MEDIA.demoPoster3} badge="Partout avec vous" />}
        side="right"
        bg="bg-gradient-to-b from-[#0B1E4B] via-[#155E9C] to-[#06B6D4]"
        kicker="Partout avec vous"
        title={<>Maison, sport, voyage : <span className="text-[#A5F3FC]">il vous suit</span></>}
        text="Après l'effort, en déplacement, ou simplement pour se rassurer : l'oxymètre tient dans une poche et répond en 8 secondes, où que vous soyez."
        cta="L'emporter partout"
        onCta={() => openModal()}
        variant="cyan"
        dark
        ratio="9/16"
      />

      {/* ==================== CHIFFRES / PREUVE SOCIALE ==================== */}
      <section className="bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#FFF7ED] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-3 gap-3 text-center">
          {[
            { v: '4,8/5', l: 'Note moyenne', i: '⭐' },
            { v: '8 s', l: 'Par mesure', i: '⏱️' },
            { v: '97 %', l: 'Recommandent', i: '🫀' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#1D4ED8]/15">
              <span className="text-[18px]">{s.i}</span>
              <p className="ox-grad mt-1 text-[22px] font-black leading-none sm:text-[26px]">{s.v}</p>
              <p className="mt-1.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-[#1D4ED8]/70">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TÉMOIGNAGES ==================== */}
      <section className="bg-gradient-to-b from-[#ECFEFF] to-[#A5F3FC]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#0B1E4B]">4,8/5 — 400+ avis vérifiés</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#0B1E4B] sm:text-[28px]">Ils surveillent leur santé <span className="ox-grad">à la maison</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {TESTIMONIALS.map((r) => <TestimonialCard key={r.n} r={r} />)}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><OxCTA variant="blue" onClick={() => openModal()}>Rejoindre les familles équipées</OxCTA></div>
        </div>
      </section>

      {/* ==================== WHATSAPP ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] via-[#ECFEFF] to-[#FFF7ED] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#0B1E4B]">97 % de clients recommandent</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#0B1E4B] sm:text-[28px]">Ils nous écrivent <span className="ox-grad">sur WhatsApp</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-[#1D4ED8]">🔒 Paiement à la livraison · Vous ne payez qu'à la réception</p>
          <div className="mx-auto mt-5 max-w-sm"><OxCTA variant="emerald" onClick={() => openModal()}>Commander en toute confiance</OxCTA></div>
        </div>
      </section>

      {/* ==================== GARANTIE + CONFORMITÉ ==================== */}
      <section className="bg-gradient-to-b from-[#FFF7ED] to-[#FED7AA]/40 px-4 py-10">
        <div className="mx-auto max-w-[560px]">
          <div className="rounded-[28px] bg-white/85 p-6 text-center shadow-xl ring-1 ring-[#1D4ED8]/20 sm:p-8">
            <span className="text-[34px]">🛡️</span>
            <h2 className="mt-2 text-[22px] font-black text-[#0B1E4B] sm:text-[26px]">Satisfait ou remboursé <span className="ox-grad">pendant 7 jours</span></h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-neutral-600">
              Essayez l'oxymètre une semaine complète. Pas convaincu ? Nous vous remboursons. Et vous ne payez qu'à la réception, jamais en ligne.
            </p>
            <div className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-3 text-center sm:grid-cols-3">
              {[
                { icon: '💵', t: 'Paiement à la livraison', d: 'Rien à payer en ligne.' },
                { icon: '🚚', t: 'Livraison rapide', d: 'Abidjan 24-48 h, intérieur 48-72 h.' },
                { icon: '📞', t: 'Confirmation par appel', d: 'Un conseiller vous appelle avant expédition.' },
              ].map((g) => (
                <div key={g.t} className="rounded-2xl bg-[#EFF6FF]/70 p-3.5 ring-1 ring-[#1D4ED8]/15">
                  <span className="text-[20px]">{g.icon}</span>
                  <p className="mt-1.5 text-[12px] font-black text-[#0B1E4B]">{g.t}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{g.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-red-700 ring-1 ring-red-200">
              ⚠️ Rappel honnête : cet appareil mesure le SpO2 et le pouls uniquement. Il <strong>ne mesure pas la tension artérielle</strong> et <strong>ne remplace pas un avis médical</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="bg-gradient-to-b from-[#EFF6FF] to-[#ECFEFF] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-[#0B1E4B] sm:text-[28px]">Questions <span className="ox-grad">fréquentes</span></h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-[#1D4ED8]/15">
                <summary className="cursor-pointer text-[13.5px] font-bold text-[#1D4ED8]">{f.q}</summary>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== OFFRE / URGENCE ==================== */}
      <section className="bg-gradient-to-b from-[#0B1E4B] via-[#1D4ED8] to-[#155E9C] px-4 py-12 text-white">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FCA5A5]">⏳ Dernières heures au prix sacrifié</p>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="text-[15px] font-bold text-white/50 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="text-[40px] font-black leading-none text-white">{fmtTotal(1)} F</span>
          </div>
          <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <div className="mx-auto mt-6 max-w-sm"><OxCTA big variant="red" onClick={() => openModal()}>J'en profite avant minuit</OxCTA></div>
        </div>
      </section>

      {/* ==================== PACKS ==================== */}
      <section className="bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#FED7AA]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-[#0B1E4B] sm:text-[28px]">Choisissez votre <span className="ox-grad">pack</span></h2>
          <p className="mt-2 text-center text-[13px] text-[#1D4ED8]/75">1 pour vous · 2 pour vous + vos parents · 3 pour toute la famille.</p>
          <div className="mt-6 space-y-3">
            {QTY_OPTS.map((o) => {
              const active = selectedPack === o.v;
              return (
                <button key={o.v} type="button"
                  onClick={() => { setSelectedPack(o.v); track('SelectPack', { product: PRODUCT_CODE, pack: o.v, value: orderTotal(PRICES, o.v), currency: 'XOF' }); }}
                  className={`relative w-full rounded-2xl border-2 bg-white/90 p-4 text-left transition ${active ? 'scale-[1.01] border-[#EF4444] shadow-xl' : 'border-[#93C5FD]/40 hover:border-[#1D4ED8]'}`}>
                  {o.tag && active && <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-[#EF4444] to-[#B91C1C] px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-[#0B1E4B]">{o.label} <span className="ml-1 text-[13px] font-bold text-neutral-400 line-through">{fmtN(OLD_UNIT * o.v)} F</span></p>
                      {o.save && <p className="text-[11px] font-semibold text-emerald-600">{o.save}</p>}
                    </div>
                    <p className="text-[22px] font-black text-[#1D4ED8]">{o.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <OxCTA big variant="red" onClick={() => openModal(selectedPack)}>Commander · {fmtTotal(selectedPack)} F</OxCTA>
          </div>
          <p className="mt-6 text-center text-[15px] font-black text-[#0B1E4B]">
            Oxygène mesuré. Cœur écouté. <span className="ox-grad">Esprit tranquille.</span>
          </p>
          <div className="mx-auto mt-4 max-w-sm"><OxCTA variant="cyan" onClick={() => openModal()}>Dernier clic avant minuit ⏳</OxCTA></div>
        </div>
      </section>

      {/* ==================== FOOTER COD + CONFORMITÉ ==================== */}
      <footer className="bg-gradient-to-b from-[#0B1E4B] to-[#1E3A8A] px-4 pb-8 pt-6 text-center text-[10.5px] text-white/60">
        <p className="font-bold text-white/80">💵 Paiement à la livraison · 🚚 Abidjan & toute la Côte d'Ivoire</p>
        <p className="mt-1.5">Livraison à vos frais · Paiement à la réception. Un conseiller vous appelle pour confirmer avant expédition.</p>
        <p className="mt-2">⚠️ Mesure SpO2 et pouls uniquement · Ne mesure pas la tension artérielle · Ne remplace pas un avis médical.</p>
        <p className="mt-3">© {new Date().getFullYear()} · Oxymètre de Pouls Digital · Côte d'Ivoire</p>
      </footer>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={() => openModal()} />

      <Suspense fallback={null}>
        {modal && (
          <OrderModalOxymetrePouls
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
