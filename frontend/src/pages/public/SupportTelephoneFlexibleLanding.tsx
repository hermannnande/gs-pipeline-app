/**
 * Landing premium — Support Téléphone Flexible Mains Libres (SUPPORT_TELEPHONE_FLEXIBLE).
 * Slug : support-telephone-flexible · Prix : 9 900 / 16 900 / 24 900 F (-50 % affiché)
 * Direction : dégradés fluides cyan -> bleu -> violet sur toute la page (thème tech).
 * Cible : COD Côte d'Ivoire (80 % trafic mobile in-app Facebook/TikTok).
 * Pattern : copie conforme de SerumRajeunissantLanding (validé client).
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const OrderModalSupportTelephone = lazy(() => import('../../components/order/OrderModalSupportTelephone'));

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'support-telephone-flexible';
const PRODUCT_CODE = 'SUPPORT_TELEPHONE_FLEXIBLE';
const CONTENT_NAME = 'Support Téléphone Flexible Mains Libres';
const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (init conditionnée)
const THANK_YOU_URL = '/support-telephone-flexible/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const OLD_UNIT = 19800; // prix barré cohérent avec l'offre -50 %
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/ |,/g, ' ');
const fmtN = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 support', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 supports', sub: packLabel(PRICES, 2, 'F'), tag: 'Populaire', save: 'Économisez 2 900 F' },
  { v: 3, label: '3 supports', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 4 800 F' },
];

const M = (n: string) => `/support-telephone-flexible/${n}`;
const MEDIA = {
  hero: M('n1.webp'),
  demoFlexVideo: M('w1.mp4'), demoFlexPoster: M('w1p.webp'),
  canape: M('n2.webp'),
  cuisine: M('n3.webp'),
  sport: M('n4.webp'),
  voitureVideo: M('w2.mp4'), voiturePoster: M('w2p.webp'),
  lit: M('n5.webp'),
  bureau: M('n6.webp'),
  veloVideo: M('w3.mp4'), veloPoster: M('w3p.webp'),
  multitache: M('n8.webp'),
  gaming: M('n7.webp'),
  cadeauVideo: M('w4.mp4'), cadeauPoster: M('w4p.webp'),
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
        <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-[#67E8F9]/40 to-[#8B5CF6]/20" />
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
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#22D3EE]" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      {badge && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22D3EE] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
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
    <svg className="h-4 w-4 text-[#F59E0B]" fill={half ? 'url(#stHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="stHalfStar" x1="0" y1="0" x2="1" y2="0">
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
/* CTA dégradé cyan -> bleu -> violet + animations maison (.cta-*).    */
/* ------------------------------------------------------------------ */
function FlexCTA({ onClick, children, big }: { onClick: () => void; children: ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cta-attract group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] px-6 ${big ? 'py-5 text-[16px] sm:text-[18px]' : 'py-4 text-[14px] sm:text-[15px]'} font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_44px_-12px_rgba(59,130,246,.55)] ring-2 ring-white/30 transition hover:scale-[1.02] hover:shadow-[0_22px_52px_-10px_rgba(139,92,246,.5)] active:scale-[0.99]`}
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
      <div className="border-t border-white/25 bg-gradient-to-r from-[#06B6D4]/95 via-[#3B82F6]/95 to-[#8B5CF6]/95 shadow-[0_-10px_34px_-10px_rgba(11,30,75,.45)] backdrop-blur-md">
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
            className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.1em] text-[#1D4ED8] shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
          >
            Commander 📱
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
      ? 'border-y border-[#8B5CF6]/30 bg-gradient-to-r from-[#0B1E4B] via-[#6D28D9] to-[#0B1E4B] text-[#E0E7FF]'
      : 'border-y border-white/40 bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] text-white'}`}>
      <div className="st-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className={dark ? 'text-[#22D3EE]' : 'text-[#FDE68A]'}>✦</span>
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
  dark?: boolean;       // texte clair si fond profond
  ratio?: string;       // ratio image (défaut 1/1)
};

function MediaBlock({ media, bg, kicker, title, text, cta, onCta, dark, ratio = '1/1' }: MediaBlockProps) {
  return (
    <section className={`px-4 py-8 sm:py-10 ${bg}`}>
      <div className="mx-auto max-w-[560px]">
        <div className={`overflow-hidden rounded-[28px] shadow-2xl ${dark ? 'ring-1 ring-white/25' : 'ring-1 ring-[#3B82F6]/15'}`}>
          <div style={{ aspectRatio: ratio }} className="w-full [&>div]:h-full">{media}</div>
        </div>
        <div className="mt-5 text-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dark ? 'bg-white/15 text-[#A5F3FC] ring-1 ring-white/25' : 'bg-white/70 text-[#1D4ED8] ring-1 ring-[#3B82F6]/30'}`}>
            {kicker}
          </span>
          <h2 className={`mt-3 text-[22px] font-black leading-tight sm:text-[26px] ${dark ? 'text-white' : 'text-[#0B2A5B]'}`}>{title}</h2>
          <p className={`mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed sm:text-[14px] ${dark ? 'text-white/85' : 'text-[#1E3A8A]/75'}`}>{text}</p>
          <div className="mx-auto mt-5 max-w-sm"><FlexCTA onClick={onCta}>{cta}</FlexCTA></div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications d'achat (popup bas-gauche, rotation ~12 s).           */
/* ------------------------------------------------------------------ */
const PURCHASE_NOTIFS = [
  { n: 'Yao', q: 'Cocody', p: '1 support' },
  { n: 'Aminata', q: 'Yopougon', p: '2 supports' },
  { n: 'Koffi', q: 'Marcory', p: '1 support' },
  { n: 'Fatou', q: 'Abobo', p: '3 supports' },
  { n: 'Ibrahim', q: 'Bouaké', p: '2 supports' },
  { n: 'Awa', q: 'Angré', p: '1 support' },
  { n: 'Moussa', q: 'Koumassi', p: '2 supports' },
  { n: 'Adjoua', q: 'Treichville', p: '1 support' },
  { n: 'Salimata', q: 'San-Pédro', p: '2 supports' },
  { n: 'Prisca', q: 'Riviera', p: '1 support' },
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
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-[0_16px_40px_-12px_rgba(11,30,75,.35)] ring-1 ring-[#67E8F9]/50 backdrop-blur-md">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] text-[15px] font-black text-white">
          {it.n[0]}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight text-[#0B2A5B]">
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
  { n: 'Koffi', v: 'Yopougon', stars: 5, t: "Fixé sur l'appui-tête, mes enfants regardent leurs dessins animés derrière sans toucher mon téléphone. Les trajets Abidjan–Bouaké sont devenus calmes 😄" },
  { n: 'Awa', v: 'Cocody', stars: 5, t: "Je regarde mes séries au lit sans tenir le téléphone. Le bras se plie exactement comme je veux, il ne bouge plus de la nuit. Top !" },
  { n: 'Ibrahim', v: 'Bouaké', stars: 4, t: "Sur le guidon du vélo pour le GPS, ça tient bien même sur les dos-d'âne. Léger, solide, rien à dire pour ce prix." },
  { n: 'Nadia', v: 'Marcory', stars: 5, t: "Autour du cou quand je cuisine : je suis mes recettes vidéo les mains libres. Ma sœur en a voulu un direct, j'ai repris le pack de 2 😅" },
];

function TestimonialCard({ r }: { r: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#3B82F6]/15">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] text-[15px] font-black text-white">
          {r.n[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-[#0B2A5B]">{r.n} <span className="font-semibold text-neutral-400">· {r.v}</span></p>
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
  { n: 'Aïssata', v: 'Cocody', t: "Sis le support est arrivé ce matin 🙏🏾 Je l'ai mis autour du cou pour regarder mon film au lit, quel bonheur 😍 Fini les bras qui font mal !", h: '09:42', stars: 5 },
  { n: 'Mamadou', v: 'Abobo', t: "Commandé mardi, reçu jeudi. Sur l'appui-tête de ma voiture ça marche trop bien, les passagers arrière valident 😩🔥", h: '12:15', stars: 5 },
  { n: 'Adjoua', v: 'Treichville', t: "Franchement pratique. Je suis mes recettes en cuisinant sans poser le téléphone n'importe où. Payé à la livraison 👌🏾", h: '18:03', stars: 5 },
  { n: 'Fatou', v: 'Yamoussoukro', t: "J'en ai pris 3 : un pour moi, deux pour offrir 🎁 Le bras est bien rigide, il tient mon téléphone sans glisser ❤️", h: '10:27', stars: 5 },
];

function WhatsAppBubble({ r, i }: { r: (typeof WHATSAPP_REVIEWS)[number]; i: number }) {
  const mine = i % 2 === 0;
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-tl-md bg-white ring-1 ring-[#3B82F6]/15' : 'rounded-tr-md bg-[#DCF8C6] ring-1 ring-emerald-600/10'}`}>
        <p className={`text-[10px] font-black ${mine ? 'text-[#0284C7]' : 'text-emerald-700'}`}>{r.n} · {r.v}</p>
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
export default function SupportTelephoneFlexibleLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    // Sans quantité explicite, on ouvre toujours sur 1 support (CTA collant,
    // hero, blocs). Seul le sélecteur de pack passe selectedPack en explicite.
    const pack = q || 1;
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Support Téléphone Flexible Mains Libres — Cou, lit, voiture, vélo · -50 %';
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
    <div className="min-h-screen bg-gradient-to-b from-[#ECFEFF] via-[#EFF6FF] to-[#F5F3FF] pb-28 text-neutral-900">
      <style>{`
        @keyframes st-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .st-marquee { animation: st-marquee 26s linear infinite; }
        .st-grad { background: linear-gradient(120deg,#06B6D4,#3B82F6 55%,#8B5CF6); -webkit-background-clip:text; background-clip:text; color: transparent; }
        @media (prefers-reduced-motion: reduce) { .st-marquee { animation: none; } }
      `}</style>

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden px-4 pb-10 pt-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#67E8F9]/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#8B5CF6]/25 blur-3xl" />
        <div className="relative mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">🔥 Nouveauté 2026</span>
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">-50 % aujourd'hui</span>
          </div>

          <h1 className="mt-5 text-[30px] font-black leading-[1.1] text-[#0B2A5B] sm:text-[38px]">
            Le support téléphone <span className="st-grad">mains libres</span> qui change tout.
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#0B2A5B]">4,8/5</span> <span className="text-neutral-400">(2 300+ avis)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[#1D4ED8] ring-1 ring-[#3B82F6]/30">
              💙 +2 300 clients satisfaits
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-[16px] font-bold text-neutral-400 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="st-grad text-[44px] font-black leading-none sm:text-[54px]">{fmtTotal(1)} F</span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#0284C7]">Paiement à la livraison 🔒</p>

          <div className="relative mx-auto mt-6 max-w-[440px]">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#06B6D4]/20 via-[#3B82F6]/25 to-[#8B5CF6]/20 blur-xl" />
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/60">
              <LazyImg src={MEDIA.hero} alt="Support téléphone flexible mains libres : bras ajustable 360° avec pince universelle, à la maison, au lit, en voiture et en extérieur" aspect="1/1" priority />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><FlexCTA big onClick={() => openModal()}>Commander · {fmtTotal(1)} F</FlexCTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-[#1E3A8A]/80">
            {['🌀 Flexible 360°', '📱 Tous smartphones', '🛋️ Cou · lit · bureau', '🚗 Voiture & vélo'].map((b) => (
              <span key={b} className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#3B82F6]/25">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={['Paiement à la livraison', 'Livraison rapide Abidjan & intérieur', "-50 % aujourd'hui", 'Universel — tous smartphones', 'Flexible 360°']} />

      {/* ==================== COMPTE À REBOURS ==================== */}
      <section className="bg-gradient-to-r from-[#0B1E4B] via-[#1D4ED8] to-[#7C3AED] px-4 py-8">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A5F3FC]">⚡ Offre -50 % expire ce soir</p>
          <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <p className="mt-3 text-[11px] font-semibold text-[#C7D2FE]">À minuit, le support repasse à {fmtN(OLD_UNIT)} F. Après, il sera trop tard.</p>
        </div>
      </section>

      {/* ==================== BLOCS MÉDIAS ==================== */}
      <MediaBlock
        media={<LazyVideo src={MEDIA.demoFlexVideo} poster={MEDIA.demoFlexPoster} badge="Démo réelle" />}
        bg="bg-gradient-to-b from-[#0B1E4B] via-[#1E3A8A] to-[#312E81]"
        kicker="Le support"
        title={<>Il se plie dans tous les sens, <span className="text-[#67E8F9]">littéralement</span></>}
        text="Un bras flexible ajustable à 360° qui garde la position que vous lui donnez : votre téléphone reste exactement où vous le voulez."
        cta="Je veux le mien"
        onCta={() => openModal()}
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.canape} alt="Homme détendu sur son canapé regardant un film avec le support autour du cou" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#ECFEFF] to-[#A5F3FC]/50"
        kicker="Au canapé"
        title={<>Vos films et séries, <span className="st-grad">les mains 100 % libres</span></>}
        text="Installé dans le canapé, le téléphone suspendu à hauteur des yeux : zéro bras fatigué, zéro téléphone qui tombe sur le visage."
        cta="Commander maintenant"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.cuisine} alt="Femme en cuisine suivant une recette vidéo avec le support autour du cou" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#EFF6FF] to-[#BFDBFE]/50"
        kicker="En cuisine"
        title={<>Vos recettes sous les yeux, <span className="st-grad">vos mains dans la cuisine</span></>}
        text="Suivez vos recettes vidéo pas à pas sans poser le téléphone près des casseroles : propre, pratique, toujours visible."
        cta="Profiter du -50 %"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <Marquee dark items={['Stock limité ce soir', 'Paiement uniquement à la livraison', 'Abidjan · Bouaké · San-Pédro · Yamoussoukro', '+2 300 clients notent 4,8/5']} />

      <MediaBlock
        media={<LazyImg src={MEDIA.sport} alt="Homme souriant sur un vélo d'appartement avec le support téléphone autour du cou" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#F5F3FF] to-[#DDD6FE]/50"
        kicker="Sport & vélo"
        title={<>Même en plein effort, <span className="st-grad">votre écran reste stable</span></>}
        text="Vélo d'appartement, séance de sport, guidon de vélo en extérieur : la pince universelle tient ferme, vous gardez le rythme."
        cta="Commander le mien"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyVideo src={MEDIA.voitureVideo} poster={MEDIA.voiturePoster} badge="En voiture" />}
        bg="bg-gradient-to-b from-[#082F49] via-[#0369A1] to-[#1D4ED8]"
        kicker="En voiture"
        title={<>GPS devant, <span className="text-[#67E8F9]">cinéma derrière</span></>}
        text="Fixé sur l'appui-tête, il occupe les passagers arrière pendant vos trajets ; posé près de vous, il devient un GPS toujours visible."
        cta="Je commande"
        onCta={() => openModal()}
        dark
        ratio="9/16"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.lit} alt="Homme allongé dans son lit regardant une vidéo avec le support autour du cou" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#ECFEFF] to-[#C7D2FE]/40"
        kicker="Au lit"
        title={<>Allongé, détendu, <span className="st-grad">l'écran vient à vous</span></>}
        text="Plus besoin de tenir votre téléphone au-dessus de votre tête : le support autour du cou le suspend à la distance parfaite."
        cta="Choisir mon pack"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.bureau} alt="Femme souriante à son bureau avec le support autour du cou pour étudier et travailler" aspect="1024/1536" />}
        bg="bg-gradient-to-b from-[#F5F3FF] to-[#C4B5FD]/40"
        kicker="Bureau & études"
        title={<>Appels vidéo, cours en ligne : <span className="st-grad">vos mains restent libres</span></>}
        text="Prenez des notes, tapez au clavier ou feuilletez vos documents pendant que votre téléphone tient la visio à votre place."
        cta="Profiter de l'offre"
        onCta={() => openModal()}
        ratio="1024/1536"
      />

      <MediaBlock
        media={<LazyVideo src={MEDIA.veloVideo} poster={MEDIA.veloPoster} badge="En extérieur" />}
        bg="bg-gradient-to-b from-[#1E1B4B] via-[#4C1D95] to-[#7C3AED]"
        kicker="Vélo & extérieur"
        title={<>Sur le guidon, <span className="text-[#A5F3FC]">il ne lâche rien</span></>}
        text="Accroché au guidon pour suivre votre itinéraire en balade ou en livraison : stable, orientable à 360°, prêt pour l'extérieur."
        cta="Commander maintenant"
        onCta={() => openModal()}
        dark
        ratio="9/16"
      />

      <Marquee items={['Paiement à la livraison', "-50 % ce soir seulement", 'Pince universelle — tous smartphones', 'Livraison rapide Abidjan & intérieur', 'Flexible 360°']} />

      <MediaBlock
        media={<LazyImg src={MEDIA.multitache} alt="Femme active cuisinant tout en suivant son téléphone sur le support autour du cou" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#ECFEFF] to-[#A5F3FC]/50"
        kicker="Multitâche"
        title={<>Cuisiner, répondre, regarder : <span className="st-grad">tout en même temps</span></>}
        text="Appel vidéo avec la famille pendant le dîner, série qui tourne pendant le repassage : votre téléphone vous suit partout."
        cta="Je veux le mien"
        onCta={() => openModal()}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.gaming} alt="Jeune homme jouant à la manette avec son téléphone sur le support flexible" aspect="1024/1536" />}
        bg="bg-gradient-to-b from-[#0B1E4B] via-[#1D4ED8] to-[#7C3AED]"
        kicker="Gaming & streaming"
        title={<>Jouez sans limite, <span className="text-[#67E8F9]">les mains libres</span></>}
        text="Manette en main, téléphone suspendu au bon angle : vos sessions gaming et vos lives passent au niveau supérieur."
        cta="Passer commande"
        onCta={() => openModal()}
        dark
        ratio="1024/1536"
      />

      <MediaBlock
        media={<LazyVideo src={MEDIA.cadeauVideo} poster={MEDIA.cadeauPoster} badge="Idée cadeau" />}
        bg="bg-gradient-to-b from-[#164E63] via-[#0E7490] to-[#3B82F6]"
        kicker="À offrir"
        title={<>Le cadeau utile <span className="text-[#FDE68A]">que tout le monde utilise</span></>}
        text="Pour un étudiant, un chauffeur, un sportif ou un accro aux séries : le cadeau malin qui sert tous les jours, à petit prix."
        cta="Offrir le mien aussi 🎁"
        onCta={() => openModal()}
        dark
        ratio="9/16"
      />

      {/* ==================== CHIFFRES / PREUVE SOCIALE ==================== */}
      <section className="bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#F5F3FF] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-3 gap-3 text-center">
          {[
            { v: '4,8/5', l: 'Note moyenne', i: '⭐' },
            { v: '+2 300', l: 'Clients satisfaits', i: '💙' },
            { v: '97 %', l: 'Recommandent', i: '👍' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#3B82F6]/15">
              <span className="text-[18px]">{s.i}</span>
              <p className="st-grad mt-1 text-[22px] font-black leading-none sm:text-[26px]">{s.v}</p>
              <p className="mt-1.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-[#1E3A8A]/70">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TÉMOIGNAGES ==================== */}
      <section className="bg-gradient-to-b from-[#F5F3FF] to-[#DDD6FE]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#0B2A5B]">4,8/5 — +2 300 clients satisfaits</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#0B2A5B] sm:text-[28px]">Ils l'ont adopté <span className="st-grad">partout en Côte d'Ivoire</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {TESTIMONIALS.map((r) => <TestimonialCard key={r.n} r={r} />)}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><FlexCTA onClick={() => openModal()}>Rejoindre les clients satisfaits</FlexCTA></div>
        </div>
      </section>

      {/* ==================== TÉMOIGNAGES WHATSAPP ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] via-[#ECFEFF] to-[#F5F3FF] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#F59E0B]/40">
              <Stars /> <span className="text-[#0B2A5B]">97 % de clients recommandent</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#0B2A5B] sm:text-[28px]">Ils nous écrivent <span className="st-grad">sur WhatsApp</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-[#1D4ED8]">🔒 Paiement à la livraison · Vous ne payez qu'à la réception du support</p>
          <div className="mx-auto mt-5 max-w-sm"><FlexCTA onClick={() => openModal()}>Commander en toute confiance</FlexCTA></div>
        </div>
      </section>

      {/* ==================== OFFRE / URGENCE ==================== */}
      <section className="bg-gradient-to-b from-[#0B1E4B] via-[#1E3A8A] to-[#4C1D95] px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A5F3FC]">⏳ Dernières heures au prix sacrifié</p>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="text-[15px] font-bold text-white/50 line-through">{fmtN(OLD_UNIT)} F</span>
            <span className="text-[40px] font-black leading-none text-white">{fmtTotal(1)} F</span>
          </div>
          <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <div className="mx-auto mt-6 max-w-sm"><FlexCTA big onClick={() => openModal()}>J'en profite avant minuit</FlexCTA></div>
        </div>
      </section>

      {/* ==================== PACKS ==================== */}
      <section className="bg-gradient-to-b from-[#ECFEFF] via-[#EFF6FF] to-[#BFDBFE]/40 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-[#0B2A5B] sm:text-[28px]">Choisissez votre <span className="st-grad">pack</span></h2>
          <p className="mt-2 text-center text-[13px] text-[#1E3A8A]/75">1 pour découvrir · 2 pour vous + la maison · 3 pour vous + vos proches.</p>
          <div className="mt-6 space-y-3">
            {QTY_OPTS.map((o) => {
              const active = selectedPack === o.v;
              return (
                <button key={o.v} type="button"
                  onClick={() => { setSelectedPack(o.v); track('SelectPack', { product: PRODUCT_CODE, pack: o.v, value: orderTotal(PRICES, o.v), currency: 'XOF' }); }}
                  className={`relative w-full rounded-2xl border-2 bg-white/90 p-4 text-left transition ${active ? 'scale-[1.01] border-[#8B5CF6] shadow-xl' : 'border-[#67E8F9]/40 hover:border-[#3B82F6]'}`}>
                  {o.tag && active && <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-3 py-0.5 text-[9px] font-black uppercase text-white">{o.tag}</span>}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-[#0B2A5B]">{o.label} <span className="ml-1 text-[13px] font-bold text-neutral-400 line-through">{fmtN(OLD_UNIT * o.v)} F</span></p>
                      {o.save && <p className="text-[11px] font-semibold text-emerald-600">{o.save}</p>}
                    </div>
                    <p className="text-[22px] font-black text-[#1D4ED8]">{o.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <FlexCTA big onClick={() => openModal(selectedPack)}>Commander · {fmtTotal(selectedPack)} F</FlexCTA>
          </div>
          <p className="mt-6 text-center text-[15px] font-black text-[#0B2A5B]">
            Cou. Lit. Bureau. Voiture. Vélo. <span className="st-grad">Mains libres partout.</span>
          </p>
          <div className="mx-auto mt-4 max-w-sm"><FlexCTA onClick={() => openModal()}>Dernier clic avant minuit ⏳</FlexCTA></div>
        </div>
      </section>

      {/* ==================== GARANTIES COD ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] to-[#ECFEFF] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: '💵', t: 'Paiement à la livraison', d: 'Vous payez uniquement à la réception du support.' },
            { icon: '🚚', t: 'Livraison rapide', d: "Abidjan et toutes les grandes villes de Côte d'Ivoire." },
            { icon: '📞', t: 'Confirmation par appel', d: 'Un conseiller vous appelle avant toute expédition.' },
          ].map((g) => (
            <div key={g.t} className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-[#67E8F9]/30">
              <span className="text-[24px]">{g.icon}</span>
              <p className="mt-2 text-[12px] font-black text-[#0B2A5B]">{g.t}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#1E3A8A]/70">{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FOOTER COD ==================== */}
      <footer className="bg-gradient-to-b from-[#0B1E4B] to-[#172554] px-4 pb-8 pt-6 text-center text-[10.5px] text-white/60">
        <p className="font-bold text-white/80">💵 Paiement à la livraison · 🚚 Abidjan & toute la Côte d'Ivoire</p>
        <p className="mt-1.5">Un conseiller vous appelle pour confirmer avant expédition.</p>
        <p className="mt-3">© {new Date().getFullYear()} · Support Téléphone Flexible Mains Libres · Côte d'Ivoire</p>
      </footer>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={() => openModal()} />

      <Suspense fallback={null}>
        {modal && (
          <OrderModalSupportTelephone
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
