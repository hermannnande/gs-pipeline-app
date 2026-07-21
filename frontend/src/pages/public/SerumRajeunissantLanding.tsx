/**
 * Landing premium — Sérum Rajeunissant Anti-Âge Yeux (SERUM_RAJEUNISSANT).
 * Slug : serum-rajeunissant · Prix : 9 900 / 16 900 / 24 900 F (-50 % affiché)
 * Direction : dégradés fluides marron -> rose -> violet sur toute la page.
 * Cible : COD Côte d'Ivoire (80 % trafic mobile in-app Facebook/TikTok).
 * Pattern : copie conforme de MiniSacBandouliereLanding (validé client).
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const OrderModalSerumRajeunissant = lazy(() => import('../../components/order/OrderModalSerumRajeunissant'));

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'serum-rajeunissant';
const PRODUCT_CODE = 'SERUM_RAJEUNISSANT';
const CONTENT_NAME = 'Sérum Rajeunissant Anti-Âge Yeux';
const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (init conditionnée)
const THANK_YOU_URL = '/serum-rajeunissant/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const OLD_UNIT = 19800; // prix barré cohérent avec l'offre -50 %
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/ |,/g, ' ');
const fmtN = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 flacon', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 flacons', sub: packLabel(PRICES, 2, 'F'), tag: 'Populaire', save: 'Économisez 2 900 F' },
  { v: 3, label: '3 flacons', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 4 800 F' },
];

const M = (n: string) => `/serum-rajeunissant/${n}`;
const MEDIA = {
  hero: M('s01.webp'),
  packshotVideo: M('v1.mp4'), packshotPoster: M('v1p.webp'),
  portrait: M('s02.webp'),
  avantApresHomme: M('s03.webp'),
  avantApresFemme: M('s04.webp'),
  sourireEclatant: M('s05.webp'),
  gestuelleVideo: M('v2.mp4'), gestuellePoster: M('v2p.webp'),
  barbeGrise: M('s06.webp'),
  jeuneFemme: M('s07.webp'),
  posterOfficiel: M('s08.webp'),
  lifestyle: M('s09.webp'),
  application: M('s10.webp'),
  hommeTelephone: M('s11.webp'),
  cheveuxGris: M('s13.webp'),
  miniFlacon: M('s12.webp'),
};

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
        <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-[#F4A7C3]/40 to-[#A855F7]/20" />
      )}
    </div>
  );
}

function LazyVideo({ src, poster, badge }: { src: string; poster?: string; badge?: string }) {
  const { ref, visible } = useOnScreen();
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-[#2C2470]" style={{ aspectRatio: '9/16' }}>
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /> : null}
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#F4A7C3]" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      {badge && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8739E] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E8739E]" />
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
    <svg className="h-4 w-4 text-[#D4A24E]" fill={half ? 'url(#srHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="srHalfStar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="80%" stopColor="#D4A24E" />
            <stop offset="80%" stopColor="#E7D9C4" />
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
/* CTA dégradé marron -> rose -> violet + animations maison (.cta-*).  */
/* ------------------------------------------------------------------ */
function SerumCTA({ onClick, children, big }: { onClick: () => void; children: ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cta-attract group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#7B4B2A] via-[#E8739E] to-[#A855F7] px-6 ${big ? 'py-5 text-[16px] sm:text-[18px]' : 'py-4 text-[14px] sm:text-[15px]'} font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_44px_-12px_rgba(232,115,158,.55)] ring-2 ring-white/30 transition hover:scale-[1.02] hover:shadow-[0_22px_52px_-10px_rgba(168,85,247,.5)] active:scale-[0.99]`}
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
      <div className="border-t border-white/25 bg-gradient-to-r from-[#7B4B2A]/95 via-[#E8739E]/95 to-[#A855F7]/95 shadow-[0_-10px_34px_-10px_rgba(62,36,21,.45)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1 leading-tight text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">-50 % · aujourd'hui</p>
            <p className="text-[15px] font-black">
              {fmtTotal(1)} F <span className="ml-1 text-[11px] font-semibold text-white/70 line-through">{fmtN(OLD_UNIT)} F</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClick}
            className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.1em] text-[#7B4B2A] shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
          >
            Commander ✨
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
      ? 'border-y border-[#A855F7]/30 bg-gradient-to-r from-[#2C2470] via-[#7C3AED] to-[#2C2470] text-[#E4E6FF]'
      : 'border-y border-white/40 bg-gradient-to-r from-[#7B4B2A] via-[#E8739E] to-[#A855F7] text-white'}`}>
      <div className="sr-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className={dark ? 'text-[#F4A7C3]' : 'text-[#FFE9A8]'}>✦</span>
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
      <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#CDD0FF]">{label}</span>
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
  dark?: boolean;       // texte clair si fond profond
  ratio?: string;       // ratio image (défaut 4/5)
};

function MediaBlock({ media, bg, kicker, title, text, cta, onCta, dark, ratio = '4/5' }: MediaBlockProps) {
  return (
    <section className={`px-4 py-8 sm:py-10 ${bg}`}>
      <div className="mx-auto max-w-[560px]">
        <div className={`overflow-hidden rounded-[28px] shadow-2xl ${dark ? 'ring-1 ring-white/25' : 'ring-1 ring-[#7B4B2A]/10'}`}>
          <div style={{ aspectRatio: ratio }} className="w-full [&>div]:h-full">{media}</div>
        </div>
        <div className="mt-5 text-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dark ? 'bg-white/15 text-[#FFE9A8] ring-1 ring-white/25' : 'bg-white/70 text-[#A0683C] ring-1 ring-[#E8739E]/30'}`}>
            {kicker}
          </span>
          <h2 className={`mt-3 text-[22px] font-black leading-tight sm:text-[26px] ${dark ? 'text-white' : 'text-[#3E2415]'}`}>{title}</h2>
          <p className={`mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed sm:text-[14px] ${dark ? 'text-white/85' : 'text-[#7B4B2A]/80'}`}>{text}</p>
          <div className="mx-auto mt-5 max-w-sm"><SerumCTA onClick={onCta}>{cta}</SerumCTA></div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications d'achat (popup bas-gauche, rotation ~12 s).           */
/* ------------------------------------------------------------------ */
const PURCHASE_NOTIFS = [
  { n: 'Aminata', q: 'Cocody', p: '2 flacons' },
  { n: 'Fatou', q: 'Yopougon', p: '1 flacon' },
  { n: 'Mariam', q: 'Marcory', p: '3 flacons' },
  { n: 'Adjoua', q: 'Treichville', p: '1 flacon' },
  { n: 'Awa', q: 'Koumassi', p: '2 flacons' },
  { n: 'Esther', q: 'Angré', p: '1 flacon' },
  { n: 'Salimata', q: 'Abobo', p: '2 flacons' },
  { n: 'Nadia', q: 'Plateau', p: '1 flacon' },
  { n: 'Ramatou', q: 'Bouaké', p: '3 flacons' },
  { n: 'Prisca', q: 'Riviera', p: '2 flacons' },
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
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-[0_16px_40px_-12px_rgba(123,75,42,.35)] ring-1 ring-[#F4A7C3]/50 backdrop-blur-md">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8739E] to-[#A855F7] text-[15px] font-black text-white">
          {it.n[0]}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight text-[#3E2415]">
            {it.n} · {it.q} <span className="font-normal text-neutral-500">vient de commander</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#A0683C]">
            Pack {it.p} · il y a {mins} min <span className="text-emerald-600">✓ vérifié</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Témoignages style WhatsApp (bulles + heure + double check).         */
/* ------------------------------------------------------------------ */
const WHATSAPP_REVIEWS = [
  { n: 'Aïssata', v: 'Cocody', t: "Bonjour sis 🙏🏾 10 jours d'utilisation et mes cernes ont vraiment fondu. Le matin je n'ai plus ce regard fatigué, même sans maquillage 😍", h: '09:42', stars: 5 },
  { n: 'Mariam', v: 'Yopougon', t: "Mes poches sous les yeux dégonflent en quelques minutes après l'application, c'est bluffant 😩🔥 J'ai déjà commandé le pack de 2 pour ma sœur.", h: '12:15', stars: 5 },
  { n: 'Adjoua', v: 'Treichville', t: 'Franchement efficace. Les rides au coin des yeux sont lissées, la texture est douce et ne pique pas. Livré en 2 jours, payé à la livraison 👌🏾', h: '18:03', stars: 5 },
  { n: 'Fatoumata', v: 'Bouaké', t: "À 52 ans on me dit que j'ai rajeuni 😅 Le regard est plus ouvert, plus reposé. Commandé lundi, reçu mercredi à Bouaké ❤️", h: '10:27', stars: 4 },
];

function WhatsAppBubble({ r, i }: { r: (typeof WHATSAPP_REVIEWS)[number]; i: number }) {
  const mine = i % 2 === 0;
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-tl-md bg-white ring-1 ring-[#E8739E]/15' : 'rounded-tr-md bg-[#DCF8C6] ring-1 ring-emerald-600/10'}`}>
        <p className={`text-[10px] font-black ${mine ? 'text-[#E8739E]' : 'text-emerald-700'}`}>{r.n} · {r.v}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-800">{r.t}</p>
        <p className="mt-1 flex items-center justify-end gap-1 text-[9px] font-semibold text-neutral-400">
          <span className="mr-auto inline-flex items-center gap-0.5">
            {Array.from({ length: r.stars }).map((_, k) => (
              <svg key={k} className="h-2.5 w-2.5 text-[#D4A24E]" fill="currentColor" viewBox="0 0 20 20">
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
export default function SerumRajeunissantLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    // Sans quantite explicite, on ouvre toujours sur 1 flacon (CTA collant,
    // hero, blocs). Seul le selecteur de pack passe selectedPack en explicite.
    const pack = q || 1;
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Sérum Rajeunissant Anti-Âge Yeux — Cernes, poches, rides · -50 %';
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
    <div className="min-h-screen bg-gradient-to-b from-[#FFF6EF] via-[#FDF0F5] to-[#F3E8FF] pb-28 text-neutral-900">
      <style>{`
        @keyframes sr-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .sr-marquee { animation: sr-marquee 26s linear infinite; }
        .sr-grad { background: linear-gradient(120deg,#7B4B2A,#E8739E 55%,#A855F7); -webkit-background-clip:text; background-clip:text; color: transparent; }
        @media (prefers-reduced-motion: reduce) { .sr-marquee { animation: none; } }
      `}</style>

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden px-4 pb-10 pt-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#F4A7C3]/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#A855F7]/25 blur-3xl" />
        <div className="relative mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#7B4B2A] to-[#A0683C] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">✨ Nouveauté 2026</span>
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#E8739E] to-[#A855F7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">-50 % aujourd'hui</span>
          </div>

          <h1 className="mt-5 text-[30px] font-black leading-[1.1] sm:text-[38px]">
            Un regard <span className="sr-grad">rajeuni de 10 ans</span>, dès les premières applications.
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#D4A24E]/40">
              <Stars /> <span className="text-[#3E2415]">4,8/5</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[#A0683C] ring-1 ring-[#E8739E]/30">
              💖 +2 300 clientes satisfaites
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-[16px] font-bold text-neutral-400 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="sr-grad text-[44px] font-black leading-none sm:text-[54px]">{fmtTotal(1)} F</span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#E8739E]">Paiement à la livraison 🔒</p>

          <div className="relative mx-auto mt-6 max-w-[440px]">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#7B4B2A]/20 via-[#E8739E]/25 to-[#A855F7]/20 blur-xl" />
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/60">
              <LazyImg src={MEDIA.hero} alt="Sérum Rajeunissant Anti-Âge Yeux — flacon tenu en main, révélez un regard éclatant" aspect="1080/1441" priority />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><SerumCTA big onClick={() => openModal()}>Commander · {fmtTotal(1)} F</SerumCTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-[#7B4B2A]/80">
            {['👁️ Anti-cernes', '💧 Hydrate & apaise', '✨ Lisse les rides', '🎈 Dégonfle les poches'].map((b) => (
              <span key={b} className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#E8739E]/25">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={['Paiement à la livraison', 'Cernes · poches · rides', "-50 % aujourd'hui", 'Formule douce contour des yeux', 'Résultats visibles rapidement']} />

      {/* ==================== COMPTE À REBOURS ==================== */}
      <section className="bg-gradient-to-r from-[#2C2470] via-[#4A38C0] to-[#7C3AED] px-4 py-8">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F4A7C3]">⚡ Offre -50 % expire ce soir</p>
          <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <p className="mt-3 text-[11px] font-semibold text-[#CDD0FF]">À minuit, le sérum repasse à {fmtN(OLD_UNIT)} F. Après, il sera trop tard.</p>
        </div>
      </section>

      {/* ==================== BLOCS MÉDIAS ==================== */}
      <MediaBlock
        media={<LazyVideo src={MEDIA.packshotVideo} poster={MEDIA.packshotPoster} badge="Packshot réel" />}
        bg="bg-gradient-to-b from-[#3E2415] via-[#7B4B2A] to-[#A0683C]"
        kicker="Le sérum"
        title={<>Un flacon concentré, <span className="text-[#F4A7C3]">un regard transformé</span></>}
        text="Formule douce spécialement pensée pour le contour délicat des yeux : elle hydrate, apaise et lisse jour après jour."
        cta="Je veux le mien"
        onCta={() => openModal()}
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.portrait} alt="Femme élégante tenant le flacon du sérum près de son visage" aspect="971/1619" />}
        bg="bg-gradient-to-b from-[#FDF2F7] to-[#F4A7C3]/40"
        kicker="Éclat quotidien"
        title={<>Le geste beauté qui <span className="sr-grad">illumine votre regard</span></>}
        text="Quelques gouttes matin et soir suffisent : votre regard paraît plus reposé, plus ouvert, plus jeune."
        cta="Commander maintenant"
        onCta={() => openModal()}
        ratio="971/1619"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.avantApresHomme} alt="Avant après : rides du front visiblement réduites chez un homme" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#FFF6EF] to-[#E8C4B0]/40"
        kicker="Avant / Après"
        title={<>Les rides se lissent, <span className="sr-grad">la preuve en image</span></>}
        text="Rides du front et pattes d'oie visiblement atténuées : les résultats parlent d'eux-mêmes après quelques applications."
        cta="Profiter du -50 %"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <Marquee dark items={['Stock limité ce soir', 'Paiement uniquement à la livraison', 'Abidjan · Bouaké · San-Pédro · Yamoussoukro', '+2 300 clientes notent 4,8/5']} />

      <MediaBlock
        media={<LazyImg src={MEDIA.avantApresFemme} alt="Avant après : regard rajeuni d'une femme mature avec le flacon" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#2C2470] via-[#4A38C0] to-[#7C3AED]"
        kicker="Résultats visibles"
        title={<>Cernes estompés, <span className="text-[#67E8F9]">regard reposé</span></>}
        text="Les cernes foncés s'éclaircissent et le regard retrouve sa fraîcheur — sans maquillage, sans filtre."
        cta="Commander le mien"
        onCta={() => openModal()}
        dark
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.sourireEclatant} alt="Avant après : sourire éclatant d'une femme au regard rajeuni" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#F3E8FF] to-[#E8739E]/30"
        kicker="Avant / Après"
        title={<>Un sourire qui rayonne, <span className="sr-grad">des yeux qui revivent</span></>}
        text="Quand les cernes disparaissent, tout le visage s'illumine : on vous demandera votre secret."
        cta="Choisir mon pack"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyVideo src={MEDIA.gestuelleVideo} poster={MEDIA.gestuellePoster} badge="Démo application" />}
        bg="bg-gradient-to-b from-[#E8739E] via-[#D946EF]/80 to-[#A855F7]"
        kicker="La bonne gestuelle"
        title={<>Tapotez délicatement <span className="text-[#FFE9A8]">de l'intérieur vers l'extérieur</span></>}
        text="La bonne gestuelle fait toute la différence : une noisette de sérum, tapotée du bout des doigts sans frotter, pour une efficacité maximale."
        cta="Je commande"
        onCta={() => openModal()}
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.barbeGrise} alt="Avant après : homme à la barbe grise, sourire, tenant le flacon" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#FDF0F5] to-[#F4A7C3]/40"
        kicker="Avant / Après"
        title={<>Les hommes aussi <span className="sr-grad">rajeunissent leur regard</span></>}
        text="Poches dégonflées et traits défatigués : efficace sur tous les types de peau, à tout âge."
        cta="Profiter de l'offre"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.jeuneFemme} alt="Avant après : jeune femme au regard frais avec le produit en insert" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#FFF6EF] to-[#E8C4B0]/40"
        kicker="Avant / Après"
        title={<>Un regard frais, <span className="sr-grad">même après les courtes nuits</span></>}
        text="Fatigue, écrans, stress : le sérum efface les signes de fatigue et prévient les premières rides."
        cta="Commander maintenant"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.posterOfficiel} alt="Poster officiel South Moon Eye Serum — révélez un regard éclatant" aspect="4/5" />}
        bg="bg-gradient-to-b from-[#3E2415] via-[#7B4B2A] to-[#A0683C]"
        kicker="Formule douce"
        title={<>Apaise, hydrate, <span className="text-[#F4A7C3]">doux pour les yeux</span></>}
        text="Réduit cernes et irritations, hydrate en profondeur : une formule respectueuse de la zone la plus fragile du visage."
        cta="Je veux ce regard"
        onCta={() => openModal()}
        dark
        ratio="4/5"
      />

      <Marquee items={['Résultats visibles dès les premières applications', 'Formule douce pour le contour des yeux', "-50 % ce soir seulement", 'Paiement à la livraison']} />

      <MediaBlock
        media={<LazyImg src={MEDIA.lifestyle} alt="Femme souriante serrant un flacon géant du sérum, visuel lifestyle" aspect="4/5" />}
        bg="bg-gradient-to-b from-[#FDF2F7] to-[#F4A7C3]/40"
        kicker="Elles en parlent"
        title={<>Le sérum dont tout Abidjan <span className="sr-grad">parle déjà</span></>}
        text="Adopté par des milliers de clientes : le réflexe regard qui ne quitte plus leur trousse beauté."
        cta="Rejoindre le mouvement"
        onCta={() => openModal()}
        ratio="4/5"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.application} alt="Femme appliquant le sérum sur son visage, flacon en coin" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#F3E8FF] to-[#E8739E]/30"
        kicker="Application"
        title={<>Quelques gouttes, <span className="sr-grad">matin et soir</span></>}
        text="Une texture légère qui pénètre vite, sans coller : parfaite sous le maquillage ou avant de dormir."
        cta="Commander le mien"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.hommeTelephone} alt="Avant après : homme à la barbe grise tenant flacon et téléphone" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#FFF6EF] to-[#E8C4B0]/40"
        kicker="Avant / Après"
        title={<>Ils ont commandé, <span className="sr-grad">ils ont vu la différence</span></>}
        text="Regard reposé, poches estompées : des résultats concrets qui donnent envie de recommander."
        cta="Je commande aussi"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.cheveuxGris} alt="Avant après : femme mature aux cheveux gris avec le flacon" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#FDF0F5] to-[#F4A7C3]/40"
        kicker="Avant / Après"
        title={<>À tout âge, <span className="sr-grad">un regard qui revit</span></>}
        text="Les rides du contour des yeux se lissent et le regard retrouve son éclat, même après 50 ans."
        cta="Profiter du -50 %"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.miniFlacon} alt="Main tenant le mini flacon du sérum sur fond gris minimaliste" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#2C2470] via-[#4A38C0] to-[#7C3AED]"
        kicker="Format pratique"
        title={<>Petit flacon, <span className="text-[#67E8F9]">grands résultats</span></>}
        text="Compact et nomade : il se glisse partout pour ne jamais rater une application, même en déplacement."
        cta="Commander maintenant"
        onCta={() => openModal()}
        dark
        ratio="1/1"
      />

      {/* ==================== TÉMOIGNAGES WHATSAPP ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] via-[#FDF0F5] to-[#F3E8FF] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#D4A24E]/40">
              <Stars /> <span className="text-[#3E2415]">4,8/5 — +2 300 clientes satisfaites</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black sm:text-[28px]">Elles nous écrivent <span className="sr-grad">sur WhatsApp</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-[#A0683C]">🔒 Paiement à la livraison · Vous ne payez qu'à la réception du sérum</p>
          <div className="mx-auto mt-5 max-w-sm"><SerumCTA onClick={() => openModal()}>Commander en toute confiance</SerumCTA></div>
        </div>
      </section>

      {/* ==================== OFFRE / URGENCE ==================== */}
      <section className="bg-gradient-to-b from-[#3E2415] via-[#7B4B2A] to-[#A0683C] px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FFE9A8]">⏳ Dernières heures au prix sacrifié</p>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="text-[15px] font-bold text-white/50 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="text-[40px] font-black leading-none text-white">{fmtTotal(1)} F</span>
          </div>
          <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <div className="mx-auto mt-6 max-w-sm"><SerumCTA big onClick={() => openModal()}>J'en profite avant minuit</SerumCTA></div>
        </div>
      </section>

      {/* ==================== PACKS ==================== */}
      <section className="bg-gradient-to-b from-[#FFF6EF] via-[#FDF0F5] to-[#E8C4B0]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black sm:text-[28px]">Choisissez votre <span className="sr-grad">pack</span></h2>
          <p className="mt-2 text-center text-[13px] text-[#7B4B2A]/80">1 pour découvrir · 2 pour une cure complète · 3 pour vous + vos proches.</p>
          <div className="mt-6 space-y-3">
            {QTY_OPTS.map((o) => {
              const active = selectedPack === o.v;
              return (
                <button key={o.v} type="button"
                  onClick={() => { setSelectedPack(o.v); track('SelectPack', { product: PRODUCT_CODE, pack: o.v, value: orderTotal(PRICES, o.v), currency: 'XOF' }); }}
                  className={`relative w-full rounded-2xl border-2 bg-white/90 p-4 text-left transition ${active ? 'scale-[1.01] border-[#A855F7] shadow-xl' : 'border-[#F4A7C3]/40 hover:border-[#E8739E]'}`}>
                  {o.tag && active && <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-[#E8739E] to-[#A855F7] px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-[#3E2415]">{o.label} <span className="ml-1 text-[13px] font-bold text-neutral-400 line-through">{fmtN(OLD_UNIT * o.v)} F</span></p>
                      {o.save && <p className="text-[11px] font-semibold text-emerald-600">{o.save}</p>}
                    </div>
                    <p className="text-[22px] font-black text-[#A0683C]">{o.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <SerumCTA big onClick={() => openModal(selectedPack)}>Commander · {fmtTotal(selectedPack)} F</SerumCTA>
          </div>
          <p className="mt-6 text-center text-[15px] font-black text-[#3E2415]">
            Cernes effacés. Poches dégonflées. <span className="sr-grad">Regard rajeuni.</span>
          </p>
          <div className="mx-auto mt-4 max-w-sm"><SerumCTA onClick={() => openModal()}>Dernier clic avant minuit ⏳</SerumCTA></div>
        </div>
      </section>

      {/* ==================== GARANTIES COD ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] to-[#FDF0F5] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: '💵', t: 'Paiement à la livraison', d: 'Vous payez uniquement à la réception du sérum.' },
            { icon: '🚚', t: 'Livraison rapide', d: 'Abidjan et toutes les grandes villes de Côte d\u2019Ivoire.' },
            { icon: '📞', t: 'Confirmation par appel', d: 'Un conseiller vous appelle avant toute expédition.' },
          ].map((g) => (
            <div key={g.t} className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-[#F4A7C3]/30">
              <span className="text-[24px]">{g.icon}</span>
              <p className="mt-2 text-[12px] font-black text-[#3E2415]">{g.t}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#7B4B2A]/75">{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FOOTER COD ==================== */}
      <footer className="bg-gradient-to-b from-[#2C1810] to-[#3E2415] px-4 pb-8 pt-6 text-center text-[10.5px] text-white/60">
        <p className="font-bold text-white/80">💵 Paiement à la livraison · 🚚 Abidjan & toute la Côte d'Ivoire</p>
        <p className="mt-1.5">Un conseiller vous appelle pour confirmer avant expédition.</p>
        <p className="mt-3">© {new Date().getFullYear()} · Sérum Rajeunissant Anti-Âge Yeux · Côte d'Ivoire</p>
      </footer>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={() => openModal()} />

      <Suspense fallback={null}>
        {modal && (
          <OrderModalSerumRajeunissant
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
