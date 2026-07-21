/**
 * Landing premium — Mini sac bandoulière tactile (MINI_SAC_BANDOULIERE).
 * Variante TIKTOK (slug mini-sac-bandouliere-tk) : meme design, stats separees.
 * Pixel Meta desactive (trafic TikTok) — Pixel TikTok : renseigner TIKTOK_PIXEL_ID.
 * Prix : 9 900 / 16 900 / 24 900 F (-50 % affiché)
 * Direction : dégradés fluides marron -> rose -> violet sur toute la page.
 * Cible : COD Côte d'Ivoire (80 % trafic mobile in-app Facebook/TikTok).
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const OrderModalMiniSac = lazy(() => import('../../components/order/OrderModalMiniSac'));

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'mini-sac-bandouliere-tk';
const PRODUCT_CODE = 'MINI_SAC_BANDOULIERE_TK'; // Produit dedie : commandes TikTok separees de la page Meta dans obgestion
const CONTENT_NAME = 'Mini sac bandoulière tactile';
const META_PIXEL_ID = ''; // Variante TikTok : pas de pixel Meta (evite de polluer les stats Meta)
const TIKTOK_PIXEL_ID = ''; // <- renseigner l'ID pixel TikTok quand dispo (init conditionnée)
const THANK_YOU_URL = '/mini-sac-bandouliere-tk/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const OLD_UNIT = 19800; // prix barré cohérent avec les posters (-50 %)
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const fmtN = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 sac', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 sacs', sub: packLabel(PRICES, 2, 'F'), tag: 'Populaire', save: 'Économisez 2 900 F' },
  { v: 3, label: '3 sacs', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 4 800 F' },
];

const M = (n: string) => `/mini-sac-bandouliere/${n}`;
const MEDIA = {
  hero: M('n1.webp'),
  tactileVideo: M('w1.mp4'), tactilePoster: M('w1p.webp'),
  mains: M('n2.webp'),
  portefeuille: M('n3.webp'),
  demoVideo: M('w2.mp4'), demoPoster: M('w2p.webp'),
  lifestyle: M('n4.webp'),
  musique: M('n5.webp'),
  adoptentVideo: M('w3.mp4'), adoptentPoster: M('w3p.webp'),
  coloris: M('n6.webp'),
  offre: M('n7.webp'),
  viralVideo: M('w4.mp4'), viralPoster: M('w4p.webp'),
  final: M('n8.webp'),
};

/** 8 coloris — pastilles partagées landing (présélection) + modal. Seul Marron en stock. */
const COLORIS = [
  { id: 'marron', label: 'Marron', hex: '#8B5E3C', stock: true },
  { id: 'rose-poudre', label: 'Rose poudré', hex: '#F2B8C6', stock: false },
  { id: 'beige-rose', label: 'Beige rosé', hex: '#E8C4B0', stock: false },
  { id: 'rouge', label: 'Rouge', hex: '#C0392B', stock: false },
  { id: 'vert-eau', label: "Vert d'eau", hex: '#9FD8CB', stock: false },
  { id: 'gris', label: 'Gris', hex: '#9AA0A6', stock: false },
  { id: 'bleu', label: 'Bleu', hex: '#4A6FA5', stock: false },
  { id: 'noir', label: 'Noir', hex: '#2B2B2B', stock: false },
];

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
    <svg className="h-4 w-4 text-[#D4A24E]" fill={half ? 'url(#msbHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="msbHalfStar" x1="0" y1="0" x2="1" y2="0">
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
function SacCTA({ onClick, children, big }: { onClick: () => void; children: ReactNode; big?: boolean }) {
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
/* CTA collant bas de page (apparaît après le hero, masqué si modal).  */
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
            Commander 🛍️
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
      <div className="msb-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
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
          <div className="mx-auto mt-5 max-w-sm"><SacCTA onClick={onCta}>{cta}</SacCTA></div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications d'achat (popup bas-gauche, rotation ~12 s).           */
/* ------------------------------------------------------------------ */
const PURCHASE_NOTIFS = [
  { n: 'Aminata', q: 'Cocody', c: 'Marron' },
  { n: 'Fatou', q: 'Yopougon', c: 'Rose poudré' },
  { n: 'Mariam', q: 'Marcory', c: 'Noir' },
  { n: 'Adjoua', q: 'Treichville', c: "Vert d'eau" },
  { n: 'Awa', q: 'Koumassi', c: 'Rouge' },
  { n: 'Esther', q: 'Angré', c: 'Beige rosé' },
  { n: 'Salimata', q: 'Abobo', c: 'Bleu' },
  { n: 'Nadia', q: 'Plateau', c: 'Gris' },
  { n: 'Ramatou', q: 'Bouaké', c: 'Marron' },
  { n: 'Prisca', q: 'Riviera', c: 'Rose poudré' },
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
            Coloris {it.c} · il y a {mins} min <span className="text-emerald-600">✓ vérifié</span>
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
  { n: 'Aïssata', v: 'Cocody', t: "Bonjour sis 🙏🏾 j'ai bien reçu mon sac marron. La fenêtre tactile marche trop bien, je réponds à mes messages sans sortir le téléphone 😍", h: '09:42', stars: 5 },
  { n: 'Mariam', v: 'Yopougon', t: "Le sac est trop beau 😩🔥 j'ai pris rose poudré, toutes mes copines veulent le même. Livré en 2 jours à Yop.", h: '12:15', stars: 5 },
  { n: 'Adjoua', v: 'Treichville', t: 'Franchement pratique. Mes cartes et mon téléphone rentrent dedans, je ne porte plus mon gros sac. Qualité correcte pour le prix 👌🏾', h: '18:03', stars: 5 },
  { n: 'Fatoumata', v: 'Bouaké', t: "Commandé lundi, reçu mercredi à Bouaké. J'ai payé à la livraison comme promis. Le vert d'eau est magnifique ❤️", h: '10:27', stars: 4 },
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
export default function MiniSacBandouliereTkLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [coloris, setColoris] = useState(COLORIS[0].label);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number, c?: string) => {
    // Sans quantite explicite, on ouvre toujours sur 1 sac (CTA collant,
    // hero, blocs). Seul le selecteur de pack passe selectedPack en explicite.
    const pack = q || 1;
    if (c) setColoris(c);
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Mini sac bandoulière tactile — Fenêtre tactile & portefeuille intégré · -50 %';
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
    <div className="min-h-screen bg-gradient-to-b from-[#FFF6EF] via-[#FDF0F5] to-[#F3E8FF] pb-28 text-neutral-900">
      <style>{`
        @keyframes msb-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .msb-marquee { animation: msb-marquee 26s linear infinite; }
        .msb-grad { background: linear-gradient(120deg,#7B4B2A,#E8739E 55%,#A855F7); -webkit-background-clip:text; background-clip:text; color: transparent; }
        @media (prefers-reduced-motion: reduce) { .msb-marquee { animation: none; } }
      `}</style>

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden px-4 pb-10 pt-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#F4A7C3]/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#A855F7]/25 blur-3xl" />
        <div className="relative mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#7B4B2A] to-[#A0683C] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">👜 Nouveauté 2026</span>
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#E8739E] to-[#A855F7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">-50 % aujourd'hui</span>
          </div>

          <h1 className="mt-5 text-[30px] font-black leading-[1.1] sm:text-[38px]">
            Le mini-sac <span className="msb-grad">tactile</span> qui change tout.
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
            <span className="msb-grad text-[44px] font-black leading-none sm:text-[54px]">{fmtTotal(1)} F</span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#E8739E]">Paiement à la livraison 🔒</p>

          <div className="relative mx-auto mt-6 max-w-[440px]">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#7B4B2A]/20 via-[#E8739E]/25 to-[#A855F7]/20 blur-xl" />
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/60">
              <LazyImg src={MEDIA.hero} alt="Mini sac bandoulière tactile marron porté par un modèle" aspect="4/5" priority />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><SacCTA big onClick={() => openModal()}>Commander · {fmtTotal(1)} F</SacCTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-[#7B4B2A]/80">
            {['📱 Fenêtre tactile', '👛 Portefeuille intégré', '🎨 8 coloris', '🚚 Livraison rapide'].map((b) => (
              <span key={b} className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#E8739E]/25">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={['Paiement à la livraison', 'Livraison rapide Abidjan & intérieur', "-50 % aujourd'hui", '8 coloris disponibles', 'Fenêtre tactile premium']} />

      {/* ==================== COMPTE À REBOURS ==================== */}
      <section className="bg-gradient-to-r from-[#2C2470] via-[#4A38C0] to-[#7C3AED] px-4 py-8">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F4A7C3]">⚡ Offre -50 % expire ce soir</p>
          <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <p className="mt-3 text-[11px] font-semibold text-[#CDD0FF]">À minuit, le sac repasse à {fmtN(OLD_UNIT)} F. Après, il sera trop tard.</p>
        </div>
      </section>

      {/* ==================== BLOCS MÉDIAS ==================== */}
      <MediaBlock
        media={<LazyVideo src={MEDIA.tactileVideo} poster={MEDIA.tactilePoster} badge="Démo réelle" />}
        bg="bg-gradient-to-b from-[#3E2415] via-[#7B4B2A] to-[#A0683C]"
        kicker="Fenêtre tactile"
        title={<>Répondez, scrollez, likez — <span className="text-[#F4A7C3]">sans sortir le téléphone</span></>}
        text="La fenêtre tactile garde votre écran utilisable à travers le sac. Messages, appels, GPS : tout se pilote du bout des doigts, téléphone en sécurité."
        cta="Je veux le mien"
        onCta={() => openModal()}
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.mains} alt="Mains utilisant l'écran du téléphone à travers la fenêtre tactile du sac rose" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#FDF2F7] to-[#F4A7C3]/40"
        kicker="Usage quotidien"
        title={<>Vos messages répondent <span className="msb-grad">à travers le sac</span></>}
        text="Au marché, dans le taxi, en terrasse : votre téléphone reste protégé contre les pickpockets pendant que vous tapez tranquillement."
        cta="Commander maintenant"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.portefeuille} alt="Intérieur du sac avec emplacements cartes et billets" aspect="443/400" />}
        bg="bg-gradient-to-b from-[#FFF6EF] to-[#E8C4B0]/40"
        kicker="Portefeuille intégré"
        title={<>Cartes, billets, téléphone : <span className="msb-grad">tout tient dedans</span></>}
        text="Emplacements cartes dédiés + poche billets + compartiment téléphone. Fini le portefeuille en plus : le sac suffit pour toute la journée."
        cta="Profiter du -50 %"
        onCta={() => openModal()}
        ratio="443/400"
      />

      <MediaBlock
        media={<LazyVideo src={MEDIA.demoVideo} poster={MEDIA.demoPoster} badge="Scroll + rangements" />}
        bg="bg-gradient-to-b from-[#2C2470] via-[#4A38C0] to-[#7C3AED]"
        kicker="Démo produit"
        title={<>Scroll tactile fluide + <span className="text-[#67E8F9]">compartiments malins</span></>}
        text="Regardez : l'écran répond au doigt à travers la fenêtre, et chaque affaire a sa place. Un petit sac qui remplace un grand."
        cta="Commander le mien"
        onCta={() => openModal()}
        dark
        ratio="3/4"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.lifestyle} alt="Sac rose porté à l'épaule en tenue élégante" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#F3E8FF] to-[#E8739E]/30"
        kicker="Style"
        title={<>Du bureau à la soirée, <span className="msb-grad">il suit partout</span></>}
        text="Format mini, allure maxi. Bandoulière ajustable, finitions soignées : le détail qui habille toutes vos tenues."
        cta="Choisir mon coloris"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.musique} alt="Contrôle de la musique via la fenêtre tactile du sac" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#E8739E] via-[#D946EF]/80 to-[#A855F7]"
        kicker="Mains libres"
        title={<>Musique, appels, photos : <span className="text-[#FFE9A8]">tout sans ouvrir le sac</span></>}
        text="Changez de morceau, décrochez, cadrez votre selfie : la fenêtre tactile répond à chaque geste, même en marchant."
        cta="Je commande"
        onCta={() => openModal()}
        dark
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyVideo src={MEDIA.adoptentVideo} poster={MEDIA.adoptentPoster} badge="Elles l'adoptent" />}
        bg="bg-gradient-to-b from-[#FDF0F5] to-[#9FD8CB]/30"
        kicker="Elles l'adoptent"
        title={<>Le sac dont tout Abidjan <span className="msb-grad">parle déjà</span></>}
        text="En vert d'eau, en marron ou en rose : elles l'ont adopté pour son côté pratique autant que pour son look."
        cta="Rejoindre le mouvement"
        onCta={() => openModal()}
        ratio="9/16"
      />

      {/* ==================== COLORIS ==================== */}
      <section className="bg-gradient-to-b from-[#FFF6EF] to-[#F4A7C3]/25 px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#A0683C] ring-1 ring-[#E8739E]/30">🎨 Coloris du moment</span>
          <h2 className="mt-3 text-[24px] font-black sm:text-[28px]">Disponible en <span className="msb-grad">Marron</span></h2>
          <p className="mt-2 text-[13px] text-[#7B4B2A]/80">Le coloris <strong>Marron</strong> — élégant, intemporel, le plus demandé.</p>
          <div className="mx-auto mt-5 max-w-[440px] overflow-hidden rounded-[28px] shadow-xl ring-1 ring-[#7B4B2A]/10">
            <LazyImg src={MEDIA.coloris} alt="Mini sac bandoulière tactile coloris Marron" aspect="4/5" />
          </div>
          <div className="mx-auto mt-5 flex max-w-[160px] justify-center">
            {COLORIS.filter((c) => c.stock).map((c) => {
              const active = coloris === c.label;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColoris(c.label)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl bg-white/80 px-4 py-2.5 ring-2 transition ${active ? 'scale-[1.03] ring-[#A855F7] shadow-lg' : 'ring-transparent hover:ring-[#F4A7C3]'}`}
                >
                  <span className="h-7 w-7 rounded-full ring-2 ring-white shadow-md" style={{ background: c.hex }} />
                  <span className={`text-[9px] font-bold leading-tight ${active ? 'text-[#7C3AED]' : 'text-neutral-600'}`}>{c.label}</span>
                  <span className="-mt-1 text-[7px] font-black uppercase text-emerald-500">Disponible</span>
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-5 max-w-sm">
            <SacCTA onClick={() => openModal(undefined, coloris)}>Commander en {coloris}</SacCTA>
          </div>
        </div>
      </section>

      <Marquee dark items={['Stock limité ce soir', 'Paiement uniquement à la livraison', 'Abidjan · Bouaké · San-Pédro · Yamoussoukro', '+2 300 clientes notent 4,8/5']} />

      {/* ==================== TÉMOIGNAGES WHATSAPP ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] via-[#FDF0F5] to-[#F3E8FF] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#D4A24E]/40">
              <Stars /> <span className="text-[#3E2415]">4,8/5 — +2 300 clientes satisfaites</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black sm:text-[28px]">Elles nous écrivent <span className="msb-grad">sur WhatsApp</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-[#A0683C]">🔒 Paiement à la livraison · Vous ne payez qu'à la réception du sac</p>
          <div className="mx-auto mt-5 max-w-sm"><SacCTA onClick={() => openModal()}>Commander en toute confiance</SacCTA></div>
        </div>
      </section>

      {/* ==================== OFFRE / URGENCE ==================== */}
      <section className="bg-gradient-to-b from-[#3E2415] via-[#7B4B2A] to-[#A0683C] px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FFE9A8]">⏳ Dernières heures au prix sacrifié</p>
          <div className="mx-auto mt-5 max-w-[420px] overflow-hidden rounded-[28px] shadow-2xl ring-1 ring-white/25">
            <LazyImg src={MEDIA.offre} alt="Poster premium du mini sac marron avec offre -50 %" aspect="4/5" />
          </div>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="text-[15px] font-bold text-white/50 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="text-[40px] font-black leading-none text-white">{fmtTotal(1)} F</span>
          </div>
          <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <div className="mx-auto mt-6 max-w-sm"><SacCTA big onClick={() => openModal()}>J'en profite avant minuit</SacCTA></div>
        </div>
      </section>

      {/* ==================== VIRAL / RÉSEAUX ==================== */}
      <section className="bg-gradient-to-b from-[#1A1440] via-[#2C2470] to-[#4A38C0] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#F4A7C3] ring-1 ring-white/25">📱 Vu sur TikTok & Facebook</span>
            <h2 className="mt-3 text-[24px] font-black text-white sm:text-[28px]">Le sac qui fait <span className="text-[#67E8F9]">tourner les têtes</span></h2>
          </div>
          <div className="mx-auto mt-6 max-w-[340px] overflow-hidden rounded-[28px] shadow-2xl ring-2 ring-[#E8739E]/40">
            <LazyVideo src={MEDIA.viralVideo} poster={MEDIA.viralPoster} badge="Tendance" />
          </div>
          <div className="mx-auto mt-6 max-w-sm"><SacCTA onClick={() => openModal()}>Commander le mien aussi</SacCTA></div>
        </div>
      </section>

      {/* ==================== PACKS + FINAL ==================== */}
      <section className="bg-gradient-to-b from-[#FFF6EF] via-[#FDF0F5] to-[#E8C4B0]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black sm:text-[28px]">Choisissez votre <span className="msb-grad">pack</span></h2>
          <p className="mt-2 text-center text-[13px] text-[#7B4B2A]/80">1 pour vous · 2 pour vous + une amie · 3 pour toute la famille.</p>
          <div className="mt-6 space-y-3">
            {QTY_OPTS.map((o) => {
              const active = selectedPack === o.v;
              return (
                <button key={o.v} type="button"
                  onClick={() => setSelectedPack(o.v)}
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
            <SacCTA big onClick={() => openModal(selectedPack)}>Commander · {fmtTotal(selectedPack)} F</SacCTA>
          </div>

          <div className="relative mx-auto mt-10 max-w-[440px]">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#D4A24E]/25 via-[#E8739E]/20 to-[#A855F7]/20 blur-xl" />
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/60">
              <LazyImg src={MEDIA.final} alt="Poster élégant crème et doré du mini sac bandoulière" aspect="4/5" />
            </div>
          </div>
          <p className="mt-6 text-center text-[15px] font-black text-[#3E2415]">
            Élégante. Pratique. <span className="msb-grad">À vous ce soir.</span>
          </p>
          <div className="mx-auto mt-4 max-w-sm"><SacCTA onClick={() => openModal()}>Dernier clic avant minuit ⏳</SacCTA></div>
        </div>
      </section>

      {/* ==================== FOOTER COD ==================== */}
      <footer className="bg-gradient-to-b from-[#2C1810] to-[#3E2415] px-4 pb-8 pt-6 text-center text-[10.5px] text-white/60">
        <p className="font-bold text-white/80">💵 Paiement à la livraison · 🚚 Abidjan & toute la Côte d'Ivoire</p>
        <p className="mt-1.5">Un conseiller vous appelle pour confirmer avant expédition.</p>
        <p className="mt-3">© {new Date().getFullYear()} · Mini sac bandoulière tactile · Côte d'Ivoire</p>
      </footer>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={() => openModal()} />

      <Suspense fallback={null}>
        {modal && (
          <OrderModalMiniSac
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
