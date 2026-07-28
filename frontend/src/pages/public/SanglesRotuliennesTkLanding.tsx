/**
 * Landing premium — Sangles Rotuliennes Réglables, variante TIKTOK (SANGLE_ROTULIENNE_TK).
 * Slug : sangles-rotuliennes-tk · Prix : 9 900 / 18 900 / 26 900 F (-50 % affiché)
 * Variante TikTok (meme design, stats separees dans obgestion, produit dedie).
 * Pixel Meta desactive — Pixel TikTok : renseigner TIKTOK_PIXEL_ID.
 * Direction : degrades medicaux/sport energiques — bleu electrique #1D4ED8,
 * cyan #06B6D4, orange vif #F97316, touches emeraude #10B981.
 * CTA animes (bounce + shine) declines en 5 couleurs (.sg-cta-btn + variantes).
 * Pattern : copie conforme de SanglesRotuliennesLanding (validé client).
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const OrderModalSangleRotulienne = lazy(() => import('../../components/order/OrderModalSangleRotulienne'));

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'sangles-rotuliennes-tk';
const PRODUCT_CODE = 'SANGLE_ROTULIENNE_TK'; // Produit dedie : commandes TikTok separees dans obgestion
const CONTENT_NAME = 'Sangles Rotuliennes Réglables (paire)';
const META_PIXEL_ID = ''; // Variante TikTok : pas de pixel Meta (evite de polluer les stats Meta)
const TIKTOK_PIXEL_ID = ''; // <- renseigner l'ID pixel TikTok quand dispo (init conditionnée)
const THANK_YOU_URL = '/sangles-rotuliennes-tk/merci';

const PRICES: Record<number, number> = { 1: 8500, 2: 16100, 3: 22700 };
const OLD_UNIT = 17000; // prix barré cohérent avec l'offre -50 %
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/ |,/g, ' ');
const fmtN = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 paire', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 paires', sub: packLabel(PRICES, 2, 'F'), tag: 'Populaire', save: 'Économisez 900 F' },
  { v: 3, label: '3 paires', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 2 800 F' },
];

const M = (n: string) => `/sangles-rotuliennes/${n}`;
const MEDIA = {
  hero: M('n1.webp'),              // avant/apres genou - demandee en hero par le client
  avantApresHomme: M('n1.webp'),   // avant/après homme assis
  avantApresFemme: M('n2.webp'),   // avant/après femme escaliers
  avantApresMarche: M('n3.webp'),  // avant/après marche extérieur
  avantApresSport: M('n4.webp'),   // avant/après jeune sportif
  adoptes: M('n6.webp'),           // collage « ils ont adopté »
  salon: M('n7.webp'),             // avant/après canapé
  demoVideo1: M('w1.mp4'), demoPoster1: M('w1p.webp'),
  demoVideo2: M('w2.mp4'), demoPoster2: M('w2p.webp'),
  demoVideo3: M('w3.mp4'), demoPoster3: M('w3p.webp'),
};

// Variantes de couleurs des CTA animés (cycle sur les blocs).
type CtaVariant = 'blue' | 'orange' | 'emerald' | 'violet' | 'gold';
const CTA_CYCLE: CtaVariant[] = ['blue', 'orange', 'emerald', 'violet', 'gold'];

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any; ttq?: any; dataLayer?: any[] } }

function initMetaPixel(id: string) {
  if (!id || window.fbq) return;
  const f: any = (window.fbq = function (...a: any[]) { f.callMethod ? f.callMethod(...a) : f.queue.push(a); });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', id); window.fbq('track', 'PageView');
}

function initTiktokPixel(id: string) {
  if (!id || window.ttq) return;
  const t: any = (window.ttq = window.ttq || []);
  t.methods = ['track', 'page', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
  t.setAndDefer = (obj: any, method: string) => { obj[method] = (...args: any[]) => { obj.push([method, ...args]); }; };
  for (const m of t.methods) t.setAndDefer(t, m);
  t.load = (pixelId: string) => {
    const s = document.createElement('script'); s.async = true;
    s.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${pixelId}&lib=ttq`;
    document.head.appendChild(s);
  };
  t.load(id);
  t.page();
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
    if (window.ttq) {
      const p = { content_name: CONTENT_NAME, content_id: PRODUCT_CODE, content_type: 'product', value: (data.value as number) || 0, currency: 'XOF' };
      if (event === 'ViewContent') window.ttq.track('ViewContent', p);
      else if (event === 'OpenForm') window.ttq.track('InitiateCheckout', p);
      else if (event === 'SelectPack') window.ttq.track('AddToCart', p);
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
        <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-[#93C5FD]/40 to-[#F97316]/20" />
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
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#F97316]" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      {badge && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F97316] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F97316]" />
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
    <svg className="h-4 w-4 text-[#F59E0B]" fill={half ? 'url(#sgHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="sgHalfStar" x1="0" y1="0" x2="1" y2="0">
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
/* CTA animé (bounce + shine) décliné en 5 couleurs — classes .sg-*.   */
/* ------------------------------------------------------------------ */
function SgCTA({ onClick, children, big, variant = 'blue' }: { onClick: () => void; children: ReactNode; big?: boolean; variant?: CtaVariant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sg-cta-btn sg-cta-${variant} group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 ${big ? 'py-5 text-[16px] sm:text-[18px]' : 'py-4 text-[14px] sm:text-[15px]'} font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_44px_-12px_rgba(29,78,216,.5)] ring-2 ring-white/30 transition hover:scale-[1.02] active:scale-[0.99]`}
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
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1 leading-tight text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#BAE6FD]">-50 % · aujourd'hui</p>
            <p className="text-[15px] font-black">
              {fmtTotal(1)} F <span className="ml-1 text-[11px] font-semibold text-white/70 line-through">{fmtN(OLD_UNIT)} F</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClick}
            className="sg-cta-btn sg-cta-orange shrink-0 rounded-xl px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.1em] text-white shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
          >
            Commander 🦵
          </button>
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
      <div className="sg-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className={dark ? 'text-[#F97316]' : 'text-[#FDE68A]'}>✦</span>
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
/* Bloc média : carte arrondie sur dégradé distinct + texte + CTA.     */
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
        <div className={`overflow-hidden rounded-[28px] shadow-2xl ${dark ? 'ring-1 ring-white/25' : 'ring-1 ring-[#1D4ED8]/15'}`}>
          <div style={{ aspectRatio: ratio }} className="w-full [&>div]:h-full">{media}</div>
        </div>
        <div className="mt-5 text-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dark ? 'bg-white/15 text-[#FDBA74] ring-1 ring-white/25' : 'bg-white/70 text-[#1D4ED8] ring-1 ring-[#1D4ED8]/30'}`}>
            {kicker}
          </span>
          <h2 className={`mt-3 text-[22px] font-black leading-tight sm:text-[26px] ${dark ? 'text-white' : 'text-[#0B1E4B]'}`}>{title}</h2>
          <p className={`mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed sm:text-[14px] ${dark ? 'text-white/85' : 'text-[#1D4ED8]/75'}`}>{text}</p>
          <div className="mx-auto mt-5 max-w-sm"><SgCTA variant={variant} onClick={onCta}>{cta}</SgCTA></div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications d'achat (popup bas-gauche, rotation ~12 s).           */
/* ------------------------------------------------------------------ */
const PURCHASE_NOTIFS = [
  { n: 'Koffi', q: 'Abobo', p: '1 paire' },
  { n: 'Aminata', q: 'Yopougon', p: '2 paires' },
  { n: 'Yao', q: 'Cocody', p: '1 paire' },
  { n: 'Fatou', q: 'Marcory', p: '3 paires' },
  { n: 'Ibrahim', q: 'Bouaké', p: '2 paires' },
  { n: 'Awa', q: 'Angré', p: '1 paire' },
  { n: 'Moussa', q: 'Koumassi', p: '2 paires' },
  { n: 'Adjoua', q: 'Treichville', p: '1 paire' },
  { n: 'Salimata', q: 'San-Pédro', p: '3 paires' },
  { n: 'Nadia', q: 'Riviera', p: '2 paires' },
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
  { n: 'Koffi', v: 'Abobo', stars: 5, t: "Maçon, je suis debout toute la journée. Depuis que je porte les sangles, mes genoux ne crient plus le soir. Réglage facile, ça tient bien 🙏🏾" },
  { n: 'Aminata', v: 'Yopougon', stars: 5, t: "Je faisais mes escaliers en grimaçant. Là, je monte sans m'arrêter. Le silicone ne pique pas et ne glisse pas, même quand il fait chaud." },
  { n: 'Ibrahim', v: 'Bouaké', stars: 4, t: "Je les mets pour le foot du dimanche : le genou est bien maintenu, j'ose enfin les appuis. Une paire pour moi, une pour mon frère." },
  { n: 'Nadia', v: 'Cocody', stars: 5, t: "Randonnée de 3 heures sans douleur, alors qu'avant je tenais 40 minutes. Légères, on les oublie. Je recommande 😍" },
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
  { n: 'Aïssata', v: 'Marcory', t: "Sis les sangles sont top 🙏🏾 Je fais le marché à pied tous les jours, mes genoux ne me lâchent plus. Et ça ne glisse pas du tout 😍", h: '09:42', stars: 5 },
  { n: 'Mamadou', v: 'Koumassi', t: "Reçu hier, payé à la livraison 👌🏾 Mis ce matin pour le chantier : le genou est bien calé, je sens la différence en fin de journée 😩🔥", h: '12:15', stars: 5 },
  { n: 'Adjoua', v: 'Treichville', t: "Commandé lundi, reçu mercredi. Je les mets pour mes marches du matin à Treichville : fini la douleur sous la rotule au réveil.", h: '18:03', stars: 5 },
  { n: 'Fatou', v: 'San-Pédro', t: "J'en ai pris 3 paires : une pour moi, une pour maman, une pour tata 🏠 Toute la famille marche mieux maintenant ❤️", h: '10:27', stars: 5 },
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

/* ================================================================== */
/* Landing                                                             */
/* ================================================================== */
export default function SanglesRotuliennesTkLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    // Sans quantité explicite, on ouvre toujours sur 1 paire (CTA collant,
    // hero, blocs). Seul le sélecteur de pack passe selectedPack en explicite.
    const pack = q || 1;
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Sangles Rotuliennes Réglables — Maintien du genou · -50 %';
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) initMetaPixel(META_PIXEL_ID);
    if (TIKTOK_PIXEL_ID) initTiktokPixel(TIKTOK_PIXEL_ID);
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
    <div className="min-h-screen bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#F0FDF4] pb-28 text-neutral-900">
      <style>{`
        @keyframes sg-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .sg-marquee { animation: sg-marquee 26s linear infinite; }
        .sg-grad { background: linear-gradient(120deg,#1D4ED8,#06B6D4 45%,#F97316); -webkit-background-clip:text; background-clip:text; color: transparent; }
        @keyframes sg-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes sg-shine { 0%{left:-60%} 55%{left:120%} 100%{left:120%} }
        .sg-cta-btn { position:relative; overflow:hidden; animation: sg-bounce 1.4s ease-in-out infinite; }
        .sg-cta-btn::after { content:''; position:absolute; top:0; left:-60%; height:100%; width:40%; transform:skewX(-20deg); background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent); animation:sg-shine 1.8s ease-in-out infinite; }
        .sg-cta-blue { background-image: linear-gradient(90deg,#1D4ED8,#3B82F6,#22D3EE); }
        .sg-cta-orange { background-image: linear-gradient(90deg,#C2410C,#F97316,#FB923C); }
        .sg-cta-emerald { background-image: linear-gradient(90deg,#047857,#10B981,#34D399); }
        .sg-cta-violet { background-image: linear-gradient(90deg,#6D28D9,#8B5CF6,#C4B5FD); }
        .sg-cta-gold { background-image: linear-gradient(90deg,#B45309,#F59E0B,#FCD34D); }
        @media (prefers-reduced-motion: reduce) { .sg-marquee, .sg-cta-btn, .sg-cta-btn::after { animation: none; } }
      `}</style>

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden px-4 pb-10 pt-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#06B6D4]/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#F97316]/20 blur-3xl" />
        <div className="relative mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">🦵 Nouveauté 2026</span>
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">-50 % aujourd'hui</span>
          </div>

          <h1 className="mt-5 text-[30px] font-black leading-[1.1] text-[#0B1E4B] sm:text-[38px]">
            Genoux fragiles ? <span className="sg-grad">Retrouvez un maintien ferme, dès aujourd'hui.</span>
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#0B1E4B]">4,8/5</span> <span className="text-neutral-400">(1 800+ avis)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[#1D4ED8] ring-1 ring-[#1D4ED8]/30">
              💙 +1 800 clients soulagés
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-[16px] font-bold text-neutral-400 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="sg-grad text-[44px] font-black leading-none sm:text-[54px]">{fmtTotal(1)} F</span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#EA580C]">La paire · Paiement à la livraison 🔒</p>

          <div className="relative mx-auto mt-6 max-w-[440px]">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#1D4ED8]/20 via-[#06B6D4]/25 to-[#F97316]/20 blur-xl" />
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/60">
              <LazyImg src={MEDIA.hero} alt="Sangles rotuliennes réglables en silicone souple : maintien ciblé, ajustement précis et confort respirant pour le sport et le quotidien" aspect="1/1" priority />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><SgCTA big variant="orange" onClick={() => openModal()}>Commander · {fmtTotal(1)} F</SgCTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-[#1D4ED8]/80">
            {['🎯 Soulagement ciblé', '🌬️ Confort respirant', '🔧 Taille réglable', '🏃 Sport & quotidien'].map((b) => (
              <span key={b} className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#1D4ED8]/25">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={['Paiement à la livraison', 'Sport · randonnée · travail debout', "-50 % aujourd'hui", 'Silicone souple & respirant', 'Vendu par paire réglable']} />

      {/* ==================== COMPTE À REBOURS ==================== */}
      <section className="bg-gradient-to-r from-[#0B1E4B] via-[#1D4ED8] to-[#0E7490] px-4 py-8">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FDBA74]">⚡ Offre -50 % expire ce soir</p>
          <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <p className="mt-3 text-[11px] font-semibold text-[#BFDBFE]">À minuit, la paire repasse à {fmtN(OLD_UNIT)} F. Après, il sera trop tard.</p>
        </div>
      </section>

      {/* ==================== BLOCS MÉDIAS ==================== */}
      <MediaBlock
        media={<LazyVideo src={MEDIA.demoVideo1} poster={MEDIA.demoPoster1} badge="Vidéo produit" />}
        bg="bg-gradient-to-b from-[#0B1E4B] via-[#1D4ED8] to-[#155E9C]"
        kicker="Le produit en vidéo"
        title={<>Un maintien qui épouse <span className="text-[#67E8F9]">votre genou</span></>}
        text="Silicone souple moulé autour de la rotule : la sangle soutient exactement là où ça tire, sans comprimer le reste de la jambe."
        cta="Je veux le mien"
        onCta={() => openModal()}
        variant="blue"
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.avantApresHomme} alt="Avant après : homme soulagé de sa douleur au genou grâce à la sangle rotulienne réglable" aspect="864/1080" />}
        bg="bg-gradient-to-b from-[#FFF7ED] to-[#FED7AA]/50"
        kicker="Avant / Après"
        title={<>Les douleurs du genou <span className="text-[#EA580C]">ne sont plus une fatalité</span></>}
        text="S'asseoir, se lever, marcher : quand chaque mouvement rappelle la douleur, on bouge de moins en moins. La sangle rotulienne aide à reprendre confiance, pas à pas."
        cta="Retrouver mon confort"
        onCta={() => openModal()}
        variant="orange"
        ratio="864/1080"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.avantApresFemme} alt="Avant après : femme montant les escaliers sans douleur avec la sangle rotulienne" aspect="864/1080" />}
        bg="bg-gradient-to-b from-[#ECFDF5] to-[#A7F3D0]/40"
        kicker="Au quotidien"
        title={<>Monter les escaliers <span className="text-[#059669]">sans grimacer</span></>}
        text="Escaliers, marché, ménage : les gestes de tous les jours redeviennent simples quand le genou est bien soutenu. Vendue par paire : une pour chaque genou."
        cta="Commander ma paire"
        onCta={() => openModal()}
        variant="emerald"
        ratio="864/1080"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.avantApresMarche} alt="Avant après : marche en extérieur sans douleur grâce aux sangles rotuliennes sport" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#EFF6FF] to-[#BFDBFE]/50"
        kicker="Marche & randonnée"
        title={<>Marchez plus longtemps, <span className="sg-grad">sans crainte</span></>}
        text="La pression ciblée sous la rotule stabilise le genou à chaque foulée : vos marches du matin et vos randonnées reprennent du plaisir."
        cta="Profiter du -50 %"
        onCta={() => openModal()}
        variant="violet"
        ratio="1/1"
      />

      <Marquee dark items={['Stock limité ce soir', 'Paiement uniquement à la livraison', 'Abidjan · Bouaké · San-Pédro · Yamoussoukro', '+1 800 clients notent 4,8/5']} />

      <MediaBlock
        media={<LazyVideo src={MEDIA.demoVideo2} poster={MEDIA.demoPoster2} badge="En mouvement" />}
        bg="bg-gradient-to-b from-[#312E81] via-[#6D28D9] to-[#8B5CF6]"
        kicker="En mouvement"
        title={<>Réglable <span className="text-[#FDE68A]">en quelques secondes</span></>}
        text="Scratch ajustable d'une main : vous serrez à votre mesure, ni trop fort ni trop lâche, et le maintien reste identique toute la journée."
        cta="Commander maintenant"
        onCta={() => openModal()}
        variant="gold"
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.avantApresSport} alt="Avant après : jeune sportif avec stabilité retrouvée grâce à la sangle rotulienne" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#F0F9FF] to-[#A5F3FC]/40"
        kicker="Sport"
        title={<>Foot, course, muscu : <span className="sg-grad">la stabilité retrouvée</span></>}
        text="Les appuis et les changements de direction sollicitent la rotule. Avec la sangle, le genou reste calé : vous jouez, vous n'y pensez plus."
        cta="Équiper mes genoux"
        onCta={() => openModal()}
        variant="blue"
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.adoptes} alt="Ils ont adopté la sangle rotulienne : sport, jardinage, yoga et travail debout" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#FFF7ED] via-[#FFEDD5]/60 to-[#FED7AA]/40"
        kicker="Ils l'ont adoptée"
        title={<>Partout : sport, jardin, maison, <span className="text-[#EA580C]">travail debout</span></>}
        text="Marcheurs, jardiniers, vendeuses, maçons, sportifs du dimanche : la même sangle, réglée à chaque genou, pour tenir la journée entière."
        cta="Rejoindre les adoptants"
        onCta={() => openModal()}
        variant="orange"
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.salon} alt="Avant après : confort retrouvé même assis grâce à la sangle rotulienne" aspect="864/1080" />}
        bg="bg-gradient-to-b from-[#ECFDF5] via-[#D1FAE5]/50 to-[#A7F3D0]/30"
        kicker="Confort permanent"
        title={<>Même au repos, vos genoux <span className="text-[#059669]">vous disent merci</span></>}
        text="Légère et respirante, la sangle se porte des heures sans gêne — au canapé comme au bureau. Vous l'oubliez ; vos genoux, non."
        cta="Essayer sans risque"
        onCta={() => openModal()}
        variant="emerald"
        ratio="864/1080"
      />

      <MediaBlock
        media={<LazyVideo src={MEDIA.demoVideo3} poster={MEDIA.demoPoster3} badge="Zoom matière" />}
        bg="bg-gradient-to-b from-[#0B1E4B] via-[#155E9C] to-[#06B6D4]"
        kicker="Zoom matière"
        title={<>Silicone souple, <span className="text-[#FDBA74]">confort toute la journée</span></>}
        text="Matière douce qui ne pique pas, ne gratte pas et se nettoie d'un coup d'éponge. Pensée pour la chaleur d'Abidjan comme pour l'effort."
        cta="Commander la mienne"
        onCta={() => openModal()}
        variant="violet"
        dark
        ratio="9/16"
      />

      <Marquee items={['Paiement à la livraison', "-50 % ce soir seulement", 'Silicone souple & réglable', 'Livraison rapide Abidjan & intérieur', 'Maintien toute la journée']} />

      {/* ==================== CHIFFRES / PREUVE SOCIALE ==================== */}
      <section className="bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#FFF7ED] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-3 gap-3 text-center">
          {[
            { v: '4,8/5', l: 'Note moyenne', i: '⭐' },
            { v: '+1 800', l: 'Clients soulagés', i: '💙' },
            { v: '96 %', l: 'Recommandent', i: '🦵' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#1D4ED8]/15">
              <span className="text-[18px]">{s.i}</span>
              <p className="sg-grad mt-1 text-[22px] font-black leading-none sm:text-[26px]">{s.v}</p>
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
              <Stars /> <span className="text-[#0B1E4B]">4,8/5 — +1 800 clients soulagés</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#0B1E4B] sm:text-[28px]">Ils marchent à nouveau <span className="sg-grad">sans douleur</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {TESTIMONIALS.map((r) => <TestimonialCard key={r.n} r={r} />)}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><SgCTA variant="blue" onClick={() => openModal()}>Rejoindre les clients soulagés</SgCTA></div>
        </div>
      </section>

      {/* ==================== TÉMOIGNAGES WHATSAPP ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] via-[#ECFEFF] to-[#FFF7ED] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#0B1E4B]">96 % de clients recommandent</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#0B1E4B] sm:text-[28px]">Ils nous écrivent <span className="sg-grad">sur WhatsApp</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-[#1D4ED8]">🔒 Paiement à la livraison · Vous ne payez qu'à la réception de votre paire</p>
          <div className="mx-auto mt-5 max-w-sm"><SgCTA variant="emerald" onClick={() => openModal()}>Commander en toute confiance</SgCTA></div>
        </div>
      </section>

      {/* ==================== OFFRE / URGENCE ==================== */}
      <section className="bg-gradient-to-b from-[#0B1E4B] via-[#1D4ED8] to-[#155E9C] px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FDBA74]">⏳ Dernières heures au prix sacrifié</p>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="text-[15px] font-bold text-white/50 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="text-[40px] font-black leading-none text-white">{fmtTotal(1)} F</span>
          </div>
          <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <div className="mx-auto mt-6 max-w-sm"><SgCTA big variant="orange" onClick={() => openModal()}>J'en profite avant minuit</SgCTA></div>
        </div>
      </section>

      {/* ==================== PACKS ==================== */}
      <section className="bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#FED7AA]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-[#0B1E4B] sm:text-[28px]">Choisissez votre <span className="sg-grad">pack</span></h2>
          <p className="mt-2 text-center text-[13px] text-[#1D4ED8]/75">1 paire pour essayer · 2 pour vous + un proche · 3 pour toute la famille.</p>
          <div className="mt-6 space-y-3">
            {QTY_OPTS.map((o) => {
              const active = selectedPack === o.v;
              return (
                <button key={o.v} type="button"
                  onClick={() => { setSelectedPack(o.v); track('SelectPack', { product: PRODUCT_CODE, pack: o.v, value: orderTotal(PRICES, o.v), currency: 'XOF' }); }}
                  className={`relative w-full rounded-2xl border-2 bg-white/90 p-4 text-left transition ${active ? 'scale-[1.01] border-[#F97316] shadow-xl' : 'border-[#93C5FD]/40 hover:border-[#1D4ED8]'}`}>
                  {o.tag && active && <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>}
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
            <SgCTA big variant="orange" onClick={() => openModal(selectedPack)}>Commander · {fmtTotal(selectedPack)} F</SgCTA>
          </div>
          <p className="mt-6 text-center text-[15px] font-black text-[#0B1E4B]">
            Genoux soutenus. Mouvements libérés. <span className="sg-grad">Pour de bon.</span>
          </p>
          <div className="mx-auto mt-4 max-w-sm"><SgCTA variant="violet" onClick={() => openModal()}>Dernier clic avant minuit ⏳</SgCTA></div>
        </div>
      </section>

      {/* ==================== GARANTIES COD ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] to-[#ECFEFF] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: '💵', t: 'Paiement à la livraison', d: 'Vous payez uniquement à la réception de votre paire.' },
            { icon: '🚚', t: 'Livraison rapide', d: "Abidjan et toutes les grandes villes de Côte d'Ivoire." },
            { icon: '📞', t: 'Confirmation par appel', d: 'Un conseiller vous appelle avant toute expédition.' },
          ].map((g) => (
            <div key={g.t} className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-[#93C5FD]/30">
              <span className="text-[24px]">{g.icon}</span>
              <p className="mt-2 text-[12px] font-black text-[#0B1E4B]">{g.t}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#1D4ED8]/70">{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FOOTER COD ==================== */}
      <footer className="bg-gradient-to-b from-[#0B1E4B] to-[#1E3A8A] px-4 pb-8 pt-6 text-center text-[10.5px] text-white/60">
        <p className="font-bold text-white/80">💵 Paiement à la livraison · 🚚 Abidjan & toute la Côte d'Ivoire</p>
        <p className="mt-1.5">Un conseiller vous appelle pour confirmer avant expédition.</p>
        <p className="mt-3">© {new Date().getFullYear()} · Sangles Rotuliennes Réglables · Côte d'Ivoire</p>
      </footer>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={() => openModal()} />

      <Suspense fallback={null}>
        {modal && (
          <OrderModalSangleRotulienne
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
