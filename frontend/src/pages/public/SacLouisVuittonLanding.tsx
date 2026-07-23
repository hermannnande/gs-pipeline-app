/**
 * Tunnel de vente — Pochette sac homme premium style Louis Vuitton (slug : sac-louis-vuitton)
 *
 * Direction artistique LUXE : noir #1A1A1A + marron #7B4B2A + doré #D4AF37 + crème #F5EFE6,
 * dégradés fluides, arrière-plans riches derrière chaque bloc.
 *
 * 2 coloris : Marron & Noir · 9 900 F l'unité (total = 9 900 × quantité).
 * Commandes envoyées via /sac-lv/order.php (Telegram + CSV/JSON côté VPS),
 * JAMAIS vers Obgestion. Classes CSS préfixées `slv-` pour éviter les conflits.
 *
 * Structure : copie conforme des landings validées (support-telephone, repulsif)
 * + modal de commande intégrée avec POST PHP (pattern CoffretBoxerLuxeV3Landing).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { trackPageView } from '../../utils/pageTracking';
import { cleanPhoneCI } from '../../utils/phone';

const ORDER_ENDPOINT = 'https://obrille.com/sac-lv/order.php';
const SLUG = 'sac-louis-vuitton';
const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (init conditionnée)
const PRODUCT_CODE = 'SAC_LOUIS_VUITTON';
const UNIT_PRICE = 9900;
const OLD_UNIT = 19800; // prix barré cohérent avec l'offre -50 %

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
const getCookie = (n: string) => {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${n}=`);
  return p.length === 2 ? p.pop()!.split(';').shift() || null : null;
};

type ColorKey = 'marron' | 'noir';
const COLORS: Record<ColorKey, { label: string; emoji: string; swatch: string }> = {
  marron: { label: 'Marron', emoji: '🤎', swatch: 'bg-[#7B4B2A]' },
  noir: { label: 'Noir', emoji: '🖤', swatch: 'bg-[#1A1A1A]' },
};

const M = (n: string) => `/sac-louis-vuitton/${n}`;
const MEDIA = {
  hero: M('n1.webp'),
  elegante: M('n2.webp'),
  capacite: M('n4.webp'),
  voyage: M('n3.webp'),
  coloris: M('n5.webp'),
  cadeau: M('n6.webp'),
};

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any; dataLayer?: any[] } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function track(event: string, data: Record<string, unknown> = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
    if (typeof window.fbq === 'function') {
      const p = { content_name: 'Pochette Sac Homme Premium', content_ids: [PRODUCT_CODE], content_type: 'product', value: data.value as number, currency: 'XOF' };
      if (event === 'ViewContent') window.fbq('track', 'ViewContent', p);
      else if (event === 'OpenForm') window.fbq('track', 'InitiateCheckout', p);
    }
  } catch { /* noop */ }
}

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';

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
        <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-[#D4AF37]/30 to-[#7B4B2A]/20" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Étoiles dorées (note 4,8/5).                                        */
/* ------------------------------------------------------------------ */
function Star({ half }: { half?: boolean }) {
  return (
    <svg className="h-4 w-4 text-[#D4AF37]" fill={half ? 'url(#slvHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="slvHalfStar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="80%" stopColor="#D4AF37" />
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
/* CTA dégradé doré (ambiance luxe des visuels produit).               */
/* ------------------------------------------------------------------ */
function LuxeCTA({ onClick, children, big }: { onClick: () => void; children: ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cta-attract group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#F0D98C] via-[#D4AF37] to-[#8B6914] px-6 ${big ? 'py-5 text-[16px] sm:text-[18px]' : 'py-4 text-[14px] sm:text-[15px]'} font-black uppercase tracking-[0.12em] text-[#1A1A1A] shadow-[0_18px_44px_-12px_rgba(212,175,55,.55)] ring-2 ring-white/40 transition hover:scale-[1.02] hover:shadow-[0_22px_52px_-10px_rgba(139,105,20,.55)] active:scale-[0.99]`}
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
      <div className="border-t border-[#D4AF37]/30 bg-gradient-to-r from-[#1A1A1A]/95 via-[#2C1A10]/95 to-[#7B4B2A]/95 shadow-[0_-10px_34px_-10px_rgba(26,26,26,.5)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1 leading-tight text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F0D98C]">-50 % · aujourd'hui</p>
            <p className="text-[15px] font-black">
              {fmt(UNIT_PRICE)} F <span className="ml-1 text-[11px] font-semibold text-white/60 line-through">{fmt(OLD_UNIT)} F</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClick}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#F0D98C] to-[#D4AF37] px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.1em] text-[#1A1A1A] shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
          >
            Commander 👑
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
      ? 'border-y border-[#D4AF37]/30 bg-gradient-to-r from-[#1A1A1A] via-[#3E2415] to-[#1A1A1A] text-[#F5EFE6]'
      : 'border-y border-white/40 bg-gradient-to-r from-[#7B4B2A] via-[#A0683C] to-[#D4AF37] text-white'}`}>
      <div className="slv-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className={dark ? 'text-[#D4AF37]' : 'text-[#FFF3C4]'}>✦</span>
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
      <span className={`inline-flex min-w-[52px] items-center justify-center rounded-2xl bg-white/10 font-black tabular-nums text-white ring-1 ring-[#D4AF37]/30 backdrop-blur-sm ${compact ? 'px-2.5 py-1.5 text-[16px]' : 'px-3 py-2.5 text-[24px]'}`}>
        {pad(v)}
      </span>
      <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#F0D98C]">{label}</span>
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
  bg: string;
  kicker: string;
  title: ReactNode;
  text: string;
  cta: string;
  onCta: () => void;
  dark?: boolean;
  ratio?: string;
};

function MediaBlock({ media, bg, kicker, title, text, cta, onCta, dark, ratio = '1/1' }: MediaBlockProps) {
  return (
    <section className={`px-4 py-8 sm:py-10 ${bg}`}>
      <div className="mx-auto max-w-[560px]">
        <div className={`overflow-hidden rounded-[28px] shadow-2xl ${dark ? 'ring-1 ring-[#D4AF37]/30' : 'ring-1 ring-[#7B4B2A]/15'}`}>
          <div style={{ aspectRatio: ratio }} className="w-full [&>div]:h-full">{media}</div>
        </div>
        <div className="mt-5 text-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dark ? 'bg-white/10 text-[#F0D98C] ring-1 ring-[#D4AF37]/40' : 'bg-white/70 text-[#7B4B2A] ring-1 ring-[#D4AF37]/40'}`}>
            {kicker}
          </span>
          <h2 className={`mt-3 text-[22px] font-black leading-tight sm:text-[26px] ${dark ? 'text-white' : 'text-[#2C1A10]'}`}>{title}</h2>
          <p className={`mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed sm:text-[14px] ${dark ? 'text-white/85' : 'text-[#7B4B2A]/80'}`}>{text}</p>
          <div className="mx-auto mt-5 max-w-sm"><LuxeCTA onClick={onCta}>{cta}</LuxeCTA></div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications d'achat (popup bas-gauche, rotation ~12 s).           */
/* ------------------------------------------------------------------ */
const PURCHASE_NOTIFS = [
  { n: 'Yao', q: 'Cocody', p: 'Pochette Marron' },
  { n: 'Koffi', q: 'Yopougon', p: 'Pochette Noir' },
  { n: 'Ibrahim', q: 'Marcory', p: 'Pochette Marron' },
  { n: 'Moussa', q: 'Abobo', p: '2 pochettes' },
  { n: 'Emmanuel', q: 'Angré', p: 'Pochette Noir' },
  { n: 'Kouassi', q: 'Bouaké', p: 'Pochette Marron' },
  { n: 'Serge', q: 'Plateau', p: 'Pochette Noir' },
  { n: 'Fatou', q: 'Treichville', p: 'Pochette Marron' },
  { n: 'Mamadou', q: 'Koumassi', p: '2 pochettes' },
  { n: 'Jean', q: 'Riviera', p: 'Pochette Noir' },
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
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-[0_16px_40px_-12px_rgba(26,26,26,.35)] ring-1 ring-[#D4AF37]/50 backdrop-blur-md">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7B4B2A] to-[#D4AF37] text-[15px] font-black text-white">
          {it.n[0]}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight text-[#2C1A10]">
            {it.n} · {it.q} <span className="font-normal text-neutral-500">vient de commander</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#A0683C]">
            {it.p} · il y a {mins} min <span className="text-emerald-600">✓ vérifié</span>
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
  { n: 'Koffi', v: 'Cocody', stars: 5, t: "Prise en Marron pour mes déplacements Abidjan–Bouaké : chargeur, parfum, documents, tout rentre. La finition fait vraiment haut de gamme 👌🏾" },
  { n: 'Ibrahim', v: 'Yopougon', stars: 5, t: "On m'a demandé où je l'avais achetée dès le premier jour. Le monogramme est propre, la poignée solide. À ce prix, c'est donné." },
  { n: 'Yao', v: 'Marcory', stars: 4, t: "Commandée le lundi, reçue le mercredi. Grande capacité comme annoncé, parfaite pour le quotidien au bureau. Je recommande." },
  { n: 'Emmanuel', v: 'Angré', stars: 5, t: "Offerte à mon petit frère pour son anniversaire 🎁 Il ne la quitte plus. Le Noir est vraiment classe, je vais me prendre la Marron." },
];

function TestimonialCard({ r }: { r: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#D4AF37]/25">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7B4B2A] to-[#D4AF37] text-[15px] font-black text-white">
          {r.n[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-[#2C1A10]">{r.n} <span className="font-semibold text-neutral-400">· {r.v}</span></p>
          <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: r.stars }).map((_, k) => (
              <svg key={k} className="h-3 w-3 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
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
  { n: 'Mamadou', v: 'Abobo', t: "Frère la pochette est arrivée 🙏🏾 La Marron est encore plus belle qu'en photo. Tout mon matériel rentre dedans, qualité premium 🔥", h: '09:42', stars: 5 },
  { n: 'Aïssata', v: 'Cocody', t: "Commandée en Noir pour offrir à mon mari 🎁 Il était trop content, il la porte tous les jours au travail 😍 Merci pour la livraison rapide.", h: '12:15', stars: 5 },
  { n: 'Kouassi', v: 'Bouaké', t: "Reçue à Bouaké en 2 jours, payée à la livraison 👌🏾 La finition est sérieuse, rien à voir avec les pochettes du marché.", h: '18:03', stars: 5 },
  { n: 'Serge', v: 'Plateau', t: "Deux commandées (Marron + Noir) pour moi et mon associé. Grande capacité, poignée pratique, c'est du beau travail 👏🏾", h: '10:27', stars: 5 },
];

function WhatsAppBubble({ r, i }: { r: (typeof WHATSAPP_REVIEWS)[number]; i: number }) {
  const mine = i % 2 === 0;
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-tl-md bg-white ring-1 ring-[#D4AF37]/20' : 'rounded-tr-md bg-[#DCF8C6] ring-1 ring-emerald-600/10'}`}>
        <p className={`text-[10px] font-black ${mine ? 'text-[#A0683C]' : 'text-emerald-700'}`}>{r.n} · {r.v}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-800">{r.t}</p>
        <p className="mt-1 flex items-center justify-end gap-1 text-[9px] font-semibold text-neutral-400">
          <span className="mr-auto inline-flex items-center gap-0.5">
            {Array.from({ length: r.stars }).map((_, k) => (
              <svg key={k} className="h-2.5 w-2.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
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
/* Modal de commande — POST vers /sac-lv/order.php (jamais Obgestion). */
/* ------------------------------------------------------------------ */
function OrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [ville, setVille] = useState('');
  const [color, setColor] = useState<ColorKey | ''>('');
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cd, setCd] = useState({ m: 0, s: 0 });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitted(false); setErrorMsg('');
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, submitting, onClose]);

  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - Date.now());
      setCd({ m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  const total = UNIT_PRICE * qty;
  const invalid = (v: string) => submitted && !v.trim();
  const colorMissing = submitted && !color;

  async function submit() {
    if (!nom.trim() || !ville.trim() || !tel.trim() || !color) { setSubmitted(true); return; }
    setSubmitting(true); setErrorMsg('');
    const payload = {
      name: nom.trim(),
      city: ville.trim(),
      phone: tel.trim(),
      quantity: qty,
      color,
      product: `Sac Louis Vuitton (${color})`,
      product_key: 'sac-lv',
      product_code: PRODUCT_CODE,
      total_estimated: total,
      source: SLUG,
      sourceUrl: window.location.href,
      fbc: getCookie('_fbc') || undefined,
      fbp: getCookie('_fbp') || undefined,
      website: '',
    };
    try {
      const res = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error || `Erreur ${res.status}`);
      try {
        sessionStorage.setItem('slv_last_order', JSON.stringify({
          ref: data.orderId || '', color, qty, total, nom: nom.trim(), tel: tel.trim(), ville: ville.trim(), ts: Date.now(),
        }));
      } catch { /* noop */ }
      window.location.href = `/sac-louis-vuitton/merci?ref=${encodeURIComponent(data.orderId || '')}&qty=${qty}&color=${encodeURIComponent(color)}`;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Connexion impossible. Réessayez dans quelques secondes.');
      setSubmitting(false);
    }
  }

  const inputCls = (bad: boolean) =>
    `block h-12 w-full rounded-2xl border bg-white px-4 text-[16px] font-medium outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 ${bad ? 'border-red-400' : 'border-[#D4AF37]/40'}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div onClick={() => !submitting && onClose()} className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-[2px]" />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[28px] bg-gradient-to-b from-[#F5EFE6] to-white shadow-2xl sm:rounded-3xl">
        <div className="shrink-0 border-b border-[#D4AF37]/30 px-5 pb-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D4AF37]/50 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0683C]">Paiement à la livraison</p>
              <h3 className="mt-0.5 text-[18px] font-black text-[#2C1A10]">Pochette Sac Homme Premium</h3>
              <p className="mt-1 text-[11px] font-semibold tabular-nums text-[#8B6914]">⏱ {pad(cd.m)}:{pad(cd.s)} · offre -50 % ce soir</p>
            </div>
            <button type="button" onClick={() => !submitting && onClose()} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#7B4B2A]">✕</button>
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {/* Sélecteur de couleur — OBLIGATOIRE */}
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#7B4B2A]">Votre coloris <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(COLORS) as ColorKey[]).map((c) => {
                const active = color === c;
                return (
                  <button key={c} type="button" onClick={() => setColor(c)} disabled={submitting}
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3.5 text-[14px] font-black transition ${active ? 'scale-[1.02] border-[#D4AF37] bg-gradient-to-b from-[#F5EFE6] to-[#F0D98C]/40 shadow-md' : colorMissing ? 'border-red-300 bg-white' : 'border-[#D4AF37]/30 bg-white hover:border-[#D4AF37]'}`}>
                    <span className={`h-5 w-5 rounded-full ring-2 ring-white shadow ${COLORS[c].swatch}`} />
                    {COLORS[c].label} {COLORS[c].emoji}
                  </button>
                );
              })}
            </div>
            {colorMissing && <p className="mt-1.5 text-center text-[11px] font-semibold text-red-500">Choisissez votre coloris pour continuer</p>}
          </div>

          {/* Quantité */}
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#7B4B2A]">Quantité</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((q) => {
                const active = qty === q;
                return (
                  <button key={q} type="button" onClick={() => setQty(q)} disabled={submitting}
                    className={`relative rounded-2xl border-2 px-2 py-3 text-center transition ${active ? 'scale-[1.02] border-[#D4AF37] bg-gradient-to-b from-[#F5EFE6] to-[#F0D98C]/40 shadow-md' : 'border-[#D4AF37]/30 bg-white'}`}>
                    <p className={`text-[15px] font-black ${active ? 'text-[#8B6914]' : 'text-neutral-800'}`}>{fmt(UNIT_PRICE * q)} F</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase text-[#A0683C]">{q} pochette{q > 1 ? 's' : ''}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Champs */}
          <div className="space-y-3">
            <input ref={nameRef} type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom complet" autoComplete="name" disabled={submitting} className={inputCls(invalid(nom))} />
            <input type="text" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville (ex. Abidjan…)" autoComplete="address-level2" disabled={submitting} className={inputCls(invalid(ville))} />
            <div className={`flex h-12 overflow-hidden rounded-2xl border bg-white ${invalid(tel) ? 'border-red-400' : 'border-[#D4AF37]/40'}`}>
              <span className="flex items-center border-r border-[#D4AF37]/30 bg-[#F5EFE6] px-3 text-[13px] font-bold text-[#7B4B2A]">+225</span>
              <input type="tel" value={tel} onChange={(e) => setTel(cleanPhoneCI(e.target.value))} placeholder="07 XX XX XX XX" autoComplete="tel" disabled={submitting} className="h-full w-full bg-transparent px-3 text-[16px] outline-none" />
            </div>
          </div>

          {/* Récap */}
          <div className="rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 to-[#7B4B2A]/10 p-3 ring-1 ring-[#D4AF37]/30">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-[#2C1A10]">
                {qty} pochette{qty > 1 ? 's' : ''}{color ? ` · ${COLORS[color].label}` : ''}
              </span>
              <span className="text-xl font-black text-[#8B6914]">{fmt(total)} F</span>
            </div>
            <p className="mt-1 text-[11px] text-[#7B4B2A]/70">{fmt(UNIT_PRICE)} F × {qty} · Paiement uniquement à la réception</p>
          </div>

          {errorMsg && <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-[12px] font-semibold text-red-600">{errorMsg}</p>}

          <p className="-mb-1 text-center text-[10.5px] font-semibold text-[#7B4B2A]/70">🚚 Livraison à vos frais · Paiement à la réception</p>
          <button type="button" onClick={submit} disabled={submitting}
            className="flex h-[54px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#F0D98C] via-[#D4AF37] to-[#8B6914] text-[15px] font-black text-[#1A1A1A] shadow-[0_14px_36px_-10px_rgba(212,175,55,.55)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60">
            {submitting ? 'Envoi en cours…' : <>Commander · {fmt(total)} F</>}
          </button>
        </div>
        <p className="shrink-0 px-5 pb-4 pt-2 text-center text-[10px] text-[#A0683C]" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          🔒 Aucun paiement en ligne · Vous payez à la réception · Confirmation par téléphone
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Landing                                                             */
/* ================================================================== */
export default function SacLouisVuittonLanding() {
  const company = useMemo(co, []);
  const [modal, setModal] = useState(false);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const openModal = useCallback(() => {
    setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, value: UNIT_PRICE, currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Pochette Sac Homme Premium — Marron & Noir · 9 900 F (-50 %)';
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) initMetaPixel(META_PIXEL_ID);
    track('ViewContent', { product: PRODUCT_CODE, value: UNIT_PRICE, currency: 'XOF' });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFE6] via-[#FAF6EF] to-[#F0E6D6] pb-28 text-neutral-900">
      <style>{`
        @keyframes slv-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .slv-marquee { animation: slv-marquee 26s linear infinite; }
        .slv-grad { background: linear-gradient(120deg,#8B6914,#D4AF37 50%,#F0D98C); -webkit-background-clip:text; background-clip:text; color: transparent; }
        @media (prefers-reduced-motion: reduce) { .slv-marquee { animation: none; } }
      `}</style>

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden px-4 pb-10 pt-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#7B4B2A]/20 blur-3xl" />
        <div className="relative mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#1A1A1A] to-[#3E2415] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#F0D98C]">👑 Édition Premium</span>
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#D4AF37] to-[#8B6914] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">-50 % aujourd'hui</span>
          </div>

          <h1 className="mt-5 text-[30px] font-black leading-[1.1] text-[#2C1A10] sm:text-[38px]">
            La pochette qui <span className="slv-grad">habille votre style.</span>
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#D4AF37]/40">
              <Stars /> <span className="text-[#2C1A10]">4,8/5</span> <span className="text-neutral-400">(1 900+ avis)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[#A0683C] ring-1 ring-[#D4AF37]/30">
              🤎🖤 2 coloris : Marron & Noir
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-[16px] font-bold text-neutral-400 line-through">{fmt(OLD_UNIT)} F</span>
            <span className="slv-grad text-[44px] font-black leading-none sm:text-[54px]">{fmt(UNIT_PRICE)} F</span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#A0683C]">Paiement à la livraison 🔒</p>

          <div className="relative mx-auto mt-6 max-w-[440px]">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#7B4B2A]/20 via-[#D4AF37]/25 to-[#1A1A1A]/15 blur-xl" />
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-[#D4AF37]/40">
              <LazyImg src={MEDIA.hero} alt="Pochette sac homme premium style Louis Vuitton : monogramme élégant, disponible en Noir et Marron, 9 900 FCFA" aspect="1/1" priority />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><LuxeCTA big onClick={openModal}>Commander · {fmt(UNIT_PRICE)} F</LuxeCTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-[#7B4B2A]/80">
            {['👝 Grande capacité', '✈️ Idéale voyage & sorties', '🎨 2 coloris élégants', '✨ Finition premium'].map((b) => (
              <span key={b} className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#D4AF37]/30">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={['Paiement à la livraison', 'Livraison rapide Abidjan & intérieur', "-50 % aujourd'hui", '2 coloris : Marron & Noir', 'Édition premium']} />

      {/* ==================== COMPTE À REBOURS ==================== */}
      <section className="bg-gradient-to-r from-[#1A1A1A] via-[#3E2415] to-[#7B4B2A] px-4 py-8">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F0D98C]">⚡ Offre -50 % expire ce soir</p>
          <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <p className="mt-3 text-[11px] font-semibold text-[#E7D9C4]">À minuit, la pochette repasse à {fmt(OLD_UNIT)} F. Après, il sera trop tard.</p>
        </div>
      </section>

      {/* ==================== BLOCS MÉDIAS ==================== */}
      <MediaBlock
        media={<LazyImg src={MEDIA.elegante} alt="Homme élégant tenant la pochette monogramme marron, modèle noir à côté" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#F5EFE6] to-[#E7D9C4]/60"
        kicker="Style premium"
        title={<>L'élégance qui se remarque, <span className="slv-grad">sans se ruiner</span></>}
        text="Monogramme raffiné, finitions soignées, allure haut de gamme : la pochette qui complète un look, du bureau aux sorties."
        cta="Je veux la mienne"
        onCta={openModal}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.capacite} alt="Gros plan sur la pochette marron : grande capacité pour tout l'essentiel du quotidien" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#1A1A1A] via-[#2C1A10] to-[#3E2415]"
        kicker="Grande capacité"
        title={<>Tout votre essentiel, <span className="text-[#F0D98C]">au même endroit</span></>}
        text="Chargeur, parfum, portefeuille, clés, documents : sa grande capacité avale tout, et sa poignée pratique la suit partout."
        cta="Commander maintenant"
        onCta={openModal}
        dark
        ratio="1/1"
      />

      <Marquee dark items={['Stock limité ce soir', 'Paiement uniquement à la livraison', 'Abidjan · Bouaké · San-Pédro · Yamoussoukro', '+1 900 clients notent 4,8/5']} />

      <MediaBlock
        media={<LazyImg src={MEDIA.voyage} alt="La pochette au quotidien et en voyage : quatre scènes de vie avec les modèles marron et noir" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#F0E6D6] to-[#D4AF37]/25"
        kicker="Voyage & sorties"
        title={<>Votre compagne de route, <span className="slv-grad">du quotidien aux voyages</span></>}
        text="Week-end, déplacement, soirée ou salle de sport : compacte dans la valise, élégante à la main, pratique en toute occasion."
        cta="Profiter du -50 %"
        onCta={openModal}
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.coloris} alt="Les deux pochettes côte à côte : monogramme noir et monogramme marron" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#2C1A10] via-[#7B4B2A] to-[#A0683C]"
        kicker="2 coloris"
        title={<>Marron 🤎 ou Noir 🖤 : <span className="text-[#F0D98C]">le vôtre vous attend</span></>}
        text="Deux coloris intemporels qui vont avec tout : Marron pour le caractère, Noir pour la sobriété. Certains prennent les deux."
        cta="Choisir mon coloris"
        onCta={openModal}
        dark
        ratio="1/1"
      />

      <MediaBlock
        media={<LazyImg src={MEDIA.cadeau} alt="Homme assis tenant la pochette noire premium, ambiance luxe" aspect="1/1" />}
        bg="bg-gradient-to-b from-[#1A1A1A] via-[#1A1A1A] to-[#3E2415]"
        kicker="Idée cadeau"
        title={<>Le cadeau qui fait <span className="text-[#F0D98C]">toujours plaisir</span></>}
        text="Pour un anniversaire, une fête ou simplement pour faire plaisir : la pochette premium qui impressionne dès l'ouverture."
        cta="Offrir la mienne 🎁"
        onCta={openModal}
        dark
        ratio="1/1"
      />

      <Marquee items={['Paiement à la livraison', "-50 % ce soir seulement", '2 coloris : Marron & Noir', 'Livraison rapide Abidjan & intérieur', 'Édition premium']} />

      {/* ==================== CHIFFRES / PREUVE SOCIALE ==================== */}
      <section className="bg-gradient-to-b from-[#F5EFE6] via-[#FAF6EF] to-[#F0E6D6] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-3 gap-3 text-center">
          {[
            { v: '4,8/5', l: 'Note moyenne', i: '⭐' },
            { v: '+1 900', l: 'Clients satisfaits', i: '🤎' },
            { v: '97 %', l: 'Recommandent', i: '👍' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white/85 p-4 shadow-lg ring-1 ring-[#D4AF37]/25">
              <span className="text-[18px]">{s.i}</span>
              <p className="slv-grad mt-1 text-[22px] font-black leading-none sm:text-[26px]">{s.v}</p>
              <p className="mt-1.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-[#7B4B2A]/70">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TÉMOIGNAGES ==================== */}
      <section className="bg-gradient-to-b from-[#F0E6D6] to-[#E7D9C4]/50 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#D4AF37]/40">
              <Stars /> <span className="text-[#2C1A10]">4,8/5 — +1 900 clients satisfaits</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#2C1A10] sm:text-[28px]">Ils l'ont adoptée <span className="slv-grad">au quotidien</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {TESTIMONIALS.map((r) => <TestimonialCard key={r.n} r={r} />)}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><LuxeCTA onClick={openModal}>Rejoindre les clients satisfaits</LuxeCTA></div>
        </div>
      </section>

      {/* ==================== TÉMOIGNAGES WHATSAPP ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] via-[#FAF6EF] to-[#F0E6D6] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#D4AF37]/40">
              <Stars /> <span className="text-[#2C1A10]">97 % de clients recommandent</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#2C1A10] sm:text-[28px]">Ils nous écrivent <span className="slv-grad">sur WhatsApp</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-[#A0683C]">🔒 Paiement à la livraison · Vous ne payez qu'à la réception de la pochette</p>
          <div className="mx-auto mt-5 max-w-sm"><LuxeCTA onClick={openModal}>Commander en toute confiance</LuxeCTA></div>
        </div>
      </section>

      {/* ==================== OFFRE / URGENCE ==================== */}
      <section className="bg-gradient-to-b from-[#1A1A1A] via-[#2C1A10] to-[#7B4B2A] px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F0D98C]">⏳ Dernières heures au prix sacrifié</p>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="text-[15px] font-bold text-white/50 line-through">{fmt(OLD_UNIT)} F</span>
            <span className="text-[40px] font-black leading-none text-white">{fmt(UNIT_PRICE)} F</span>
          </div>
          <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <div className="mx-auto mt-6 max-w-sm"><LuxeCTA big onClick={openModal}>J'en profite avant minuit</LuxeCTA></div>
        </div>
      </section>

      {/* ==================== COLORIS / RAPPEL OFFRE ==================== */}
      <section className="bg-gradient-to-b from-[#F5EFE6] via-[#FAF6EF] to-[#E7D9C4]/50 px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <h2 className="text-[24px] font-black text-[#2C1A10] sm:text-[28px]">Quel coloris <span className="slv-grad">pour vous ?</span></h2>
          <p className="mt-2 text-[13px] text-[#7B4B2A]/80">Marron 🤎 pour le caractère · Noir 🖤 pour la sobriété · Les deux pour ne pas choisir.</p>
          <div className="mx-auto mt-6 max-w-sm"><LuxeCTA big onClick={openModal}>Commander · {fmt(UNIT_PRICE)} F</LuxeCTA></div>
          <p className="mt-6 text-[15px] font-black text-[#2C1A10]">
            Élégance. Capacité. Finition premium. <span className="slv-grad">9 900 F seulement.</span>
          </p>
          <div className="mx-auto mt-4 max-w-sm"><LuxeCTA onClick={openModal}>Dernier clic avant minuit ⏳</LuxeCTA></div>
        </div>
      </section>

      {/* ==================== GARANTIES COD ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] to-[#F5EFE6] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: '💵', t: 'Paiement à la livraison', d: 'Vous payez uniquement à la réception de la pochette.' },
            { icon: '🚚', t: 'Livraison rapide', d: "Abidjan et toutes les grandes villes de Côte d'Ivoire." },
            { icon: '📞', t: 'Confirmation par appel', d: 'Un conseiller vous appelle avant toute expédition.' },
          ].map((g) => (
            <div key={g.t} className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-[#D4AF37]/25">
              <span className="text-[24px]">{g.icon}</span>
              <p className="mt-2 text-[12px] font-black text-[#2C1A10]">{g.t}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#7B4B2A]/75">{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FOOTER COD ==================== */}
      <footer className="bg-gradient-to-b from-[#1A1A1A] to-[#2C1A10] px-4 pb-8 pt-6 text-center text-[10.5px] text-white/60">
        <p className="font-bold text-[#F0D98C]">💵 Paiement à la livraison · 🚚 Abidjan & toute la Côte d'Ivoire</p>
        <p className="mt-1.5">Un conseiller vous appelle pour confirmer avant expédition.</p>
        <p className="mt-3">© {new Date().getFullYear()} · Pochette Sac Homme Premium · Côte d'Ivoire</p>
      </footer>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={openModal} />

      <OrderModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
