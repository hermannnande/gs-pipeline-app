/**
 * Landing « NUIT PREMIUM » — Bandes Buccales pour le Sommeil (BANDES_BUCCALES_SOMMEIL).
 * Slug : bandes-buccales-sommeil · Prix : 9 900 / 18 900 / 26 900 F (-50 % affiché)
 *
 * Direction artistique VOLONTAIREMENT DIFFERENTE des autres landings (demande client) :
 * page sombre nuit #0B1035 / indigo #312E81 / violet #7C3AED, touches dorees
 * lune #FCD34D et cyan aube #22D3EE, etoiles scintillantes CSS (sans lib),
 * halo de lune radial, cartes glassmorphism (blur + bordure lumineuse).
 * CTA animes (bounce + shine) declines en 4 couleurs (.bb-cta-btn + variantes).
 *
 * Mecaniques de conversion identiques aux autres pages (validees client) :
 * countdown, marquees, PurchaseNotifs, temoignages + WhatsApp, packs,
 * sticky CTA, popup useOrderSubmit, COD paiement a la livraison.
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { orderTotal, packLabel } from '../../utils/pricingHelpers';

const OrderModalBandesBuccales = lazy(() => import('../../components/order/OrderModalBandesBuccales'));

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'bandes-buccales-sommeil';
const PRODUCT_CODE = 'BANDES_BUCCALES_SOMMEIL';
const CONTENT_NAME = 'Bandes Buccales pour le Sommeil (paquet de 30)';
const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (init conditionnée)
const THANK_YOU_URL = '/bandes-buccales-sommeil/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 18900, 3: 26900 };
const OLD_UNIT = 19800; // prix barré cohérent avec l'offre -50 %
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/ |,/g, ' ');
const fmtN = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');
const QTY_OPTS = [
  { v: 1, label: '1 paquet · 30 nuits', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 paquets · 60 nuits', sub: packLabel(PRICES, 2, 'F'), tag: 'Populaire', save: 'Économisez 900 F' },
  { v: 3, label: '3 paquets · 90 nuits', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 2 800 F' },
];

const M = (n: string) => `/bandes-buccales-sommeil/${n}`;
const MEDIA = {
  hero: M('n5.webp'),              // couple « Nuits plus paisibles » + packshot
  avantApresHomme: M('n1.webp'),   // avant/après homme « Une nuit plus paisible »
  avantApresLit: M('n2.webp'),     // avant/après homme lit blanc
  femme: M('n3.webp'),             // femme avant/après sans texte
  avantApresFemme: M('n4.webp'),   // avant/après femme + packshot
  demoVideo: M('w1.mp4'), demoPoster: M('w1p.webp'),
};

// Variantes de couleurs des CTA animés (cycle sur les blocs).
type CtaVariant = 'gold' | 'violet' | 'cyan' | 'rose';

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
/* Ciel étoilé : points scintillants en CSS pur (positions fixes,      */
/* délais/durées variés — aucun asset, aucune lib).                    */
/* ------------------------------------------------------------------ */
function Starfield({ count = 42 }: { count?: number }) {
  const stars = useMemo(() => {
    // Pseudo-aléatoire déterministe (rendu stable, pas de re-génération).
    let seed = 42;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rand() * 100,
      top: rand() * 100,
      size: 1 + rand() * 2.2,
      delay: rand() * 6,
      duration: 2.2 + rand() * 3.8,
      gold: rand() > 0.72,
    }));
  }, [count]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.id}
          className="bb-twinkle absolute rounded-full"
          style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: s.size, height: s.size,
            backgroundColor: s.gold ? '#FCD34D' : '#E0E7FF',
            boxShadow: s.gold ? '0 0 6px 1px rgba(252,211,77,.7)' : '0 0 5px 1px rgba(199,210,254,.55)',
            animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
          }}
        />
      ))}
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
        <div className="h-full min-h-[260px] w-full animate-pulse bg-gradient-to-br from-[#312E81]/60 to-[#7C3AED]/25" />
      )}
    </div>
  );
}

function LazyVideo({ src, poster, badge }: { src: string; poster?: string; badge?: string }) {
  const { ref, visible } = useOnScreen();
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-[#0B1035]" style={{ aspectRatio: '9/16' }}>
      {visible ? (
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /> : null}
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#FCD34D]" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      {badge && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FCD34D] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FCD34D]" />
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
    <svg className="h-4 w-4 text-[#FCD34D]" fill={half ? 'url(#bbHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="bbHalfStar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="80%" stopColor="#FCD34D" />
            <stop offset="80%" stopColor="#475569" />
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
/* CTA animé (bounce + shine) décliné en 4 couleurs — classes .bb-*.   */
/* ------------------------------------------------------------------ */
function BbCTA({ onClick, children, big, variant = 'gold' }: { onClick: () => void; children: ReactNode; big?: boolean; variant?: CtaVariant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bb-cta-btn bb-cta-${variant} group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 ${big ? 'py-5 text-[16px] sm:text-[18px]' : 'py-4 text-[14px] sm:text-[15px]'} font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_44px_-12px_rgba(124,58,237,.55)] ring-2 ring-white/25 transition hover:scale-[1.02] active:scale-[0.99]`}
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
      <div className="border-t border-[#FCD34D]/25 bg-gradient-to-r from-[#0B1035]/95 via-[#312E81]/95 to-[#0B1035]/95 shadow-[0_-10px_34px_-10px_rgba(11,16,53,.7)] backdrop-blur-md">
        <div className="mx-auto max-w-lg px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 leading-tight text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FCD34D]/90">-50 % · cette nuit</p>
              <p className="text-[15px] font-black">
                {fmtTotal(1)} F <span className="ml-1 text-[11px] font-semibold text-white/60 line-through">{fmtN(OLD_UNIT)} F</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClick}
              className="bb-cta-btn bb-cta-gold shrink-0 rounded-xl px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.08em] text-white shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
            >
              Commander 🌙
            </button>
          </div>
          <p className="mt-1 text-center text-[9.5px] font-semibold text-white/55">🔒 Paiement à la livraison · +2 300 clients satisfaits</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barre défilante (marquee) en dégradés nuit / doré.                  */
/* ------------------------------------------------------------------ */
function Marquee({ items, gold }: { items: string[]; gold?: boolean }) {
  return (
    <div className={`overflow-hidden py-2.5 ${gold
      ? 'border-y border-[#FCD34D]/30 bg-gradient-to-r from-[#312E81] via-[#7C3AED] to-[#312E81] text-[#FDE68A]'
      : 'border-y border-[#22D3EE]/25 bg-gradient-to-r from-[#0B1035] via-[#1E1B4B] to-[#0B1035] text-[#C7D2FE]'}`}>
      <div className="bb-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className={gold ? 'text-white/80' : 'text-[#FCD34D]'}>✦</span>
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
      <span className={`bb-glass inline-flex min-w-[52px] items-center justify-center rounded-2xl font-black tabular-nums text-white ${compact ? 'px-2.5 py-1.5 text-[16px]' : 'px-3 py-2.5 text-[24px]'}`}>
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
/* Bloc média nuit : carte glassmorphism + halo coloré + texte + CTA.  */
/* ------------------------------------------------------------------ */
type NightBlockProps = {
  media: ReactNode;
  glow: string;         // dégradé du halo derrière la carte (différent par bloc)
  kicker: string;
  title: ReactNode;
  text: string;
  cta: string;
  onCta: () => void;
  variant: CtaVariant;  // couleur du bouton animé
  ratio?: string;
};

function NightBlock({ media, glow, kicker, title, text, cta, onCta, variant, ratio = '1/1' }: NightBlockProps) {
  return (
    <section className="relative px-4 py-8 sm:py-10">
      <div className="relative mx-auto max-w-[560px]">
        <div className={`absolute -inset-4 rounded-[38px] bg-gradient-to-br ${glow} opacity-70 blur-2xl`} />
        <div className="bb-glass relative overflow-hidden rounded-[30px] p-3 shadow-2xl">
          <div className="overflow-hidden rounded-[22px]" style={{ aspectRatio: ratio }}>
            <div className="h-full [&>div]:h-full">{media}</div>
          </div>
          <div className="px-2 pb-3 pt-5 text-center">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#FCD34D] ring-1 ring-white/20">
              {kicker}
            </span>
            <h2 className="mt-3 text-[22px] font-black leading-tight text-[#F5F3FF] sm:text-[26px]">{title}</h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-white/70 sm:text-[14px]">{text}</p>
            <div className="mx-auto mt-5 max-w-sm"><BbCTA variant={variant} onClick={onCta}>{cta}</BbCTA></div>
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
  { n: 'Koffi', q: 'Abobo', p: '1 paquet' },
  { n: 'Aminata', q: 'Yopougon', p: '2 paquets' },
  { n: 'Yao', q: 'Cocody', p: '1 paquet' },
  { n: 'Fatou', q: 'Marcory', p: '3 paquets' },
  { n: 'Ibrahim', q: 'Bouaké', p: '2 paquets' },
  { n: 'Awa', q: 'Angré', p: '1 paquet' },
  { n: 'Moussa', q: 'Koumassi', p: '2 paquets' },
  { n: 'Adjoua', q: 'Treichville', p: '1 paquet' },
  { n: 'Salimata', q: 'San-Pédro', p: '3 paquets' },
  { n: 'Nadia', q: 'Riviera', p: '2 paquets' },
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
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-[0_16px_40px_-12px_rgba(11,16,53,.5)] ring-1 ring-[#C7D2FE]/50 backdrop-blur-md">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#312E81] to-[#7C3AED] text-[15px] font-black text-white">
          {it.n[0]}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight text-[#1E1B4B]">
            {it.n} · {it.q} <span className="font-normal text-neutral-500">vient de commander</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#6D28D9]">
            Pack {it.p} · il y a {mins} min <span className="text-emerald-600">✓ vérifié</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Témoignages (cartes étoilées glassmorphism, prénoms ivoiriens).     */
/* ------------------------------------------------------------------ */
const TESTIMONIALS = [
  { n: 'Koffi', v: 'Abobo', stars: 5, t: "Ma femme ne dormait plus à cause de mes ronflements. Depuis 2 semaines avec la bande, elle dort... et moi aussi 😅 Bouche sèche finie au réveil." },
  { n: 'Aminata', v: 'Yopougon', stars: 5, t: "J'étais sceptique sur le scotch sur la bouche, honnêtement. Ça se retire tout doux, ça ne pique pas, et je me réveille sans mal de gorge." },
  { n: 'Ibrahim', v: 'Bouaké', stars: 4, t: "Première nuit bizarre, deuxième nuit adoptée. Je ronflais fort selon ma femme : là, silence presque total. Je pars avec 2 paquets en voyage." },
  { n: 'Nadia', v: 'Cocody', stars: 5, t: "La bouche pâteuse le matin, c'est fini. Je respire par le nez toute la nuit et mon sommeil est plus profond 😍 Même ma fille en veut." },
];

function TestimonialCard({ r }: { r: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="bb-glass rounded-2xl p-4 shadow-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#312E81] via-[#7C3AED] to-[#22D3EE] text-[15px] font-black text-white">
          {r.n[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-[#F5F3FF]">{r.n} <span className="font-semibold text-white/40">· {r.v}</span></p>
          <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: r.stars }).map((_, k) => (
              <svg key={k} className="h-3 w-3 text-[#FCD34D]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-black text-emerald-300 ring-1 ring-emerald-300/30">✓ Achat vérifié</span>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/75">{r.t}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Témoignages style WhatsApp (bulles + heure + double check).         */
/* ------------------------------------------------------------------ */
const WHATSAPP_REVIEWS = [
  { n: 'Aïssata', v: 'Marcory', t: "Sis ça marche vraiment 🙏🏾 Mon mari ne ronfle presque plus. La première nuit il a trouvé ça drôle, maintenant il réclame sa bande chaque soir 😂", h: '09:42', stars: 5 },
  { n: 'Mamadou', v: 'Koumassi', t: "Reçu hier, payé à la livraison 👌🏾 Bouche sèche terminée au réveil, et je me lève moins fatigué. L'adhésif ne tire pas la barbe 😩🔥", h: '12:15', stars: 5 },
  { n: 'Adjoua', v: 'Treichville', t: "Commandé lundi, reçu mercredi. J'avais peur de pas pouvoir respirer : en fait on respire par le nez naturellement, c'est même plus calme.", h: '18:03', stars: 5 },
  { n: 'Fatou', v: 'San-Pédro', t: "J'en ai pris 3 paquets : un pour moi, un pour mon mari, un pour ma belle-sœur 🏠 Toute la maison dort mieux maintenant ❤️", h: '10:27', stars: 5 },
];

function WhatsAppBubble({ r, i }: { r: (typeof WHATSAPP_REVIEWS)[number]; i: number }) {
  const mine = i % 2 === 0;
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-tl-md bg-white ring-1 ring-[#C7D2FE]/40' : 'rounded-tr-md bg-[#DCF8C6] ring-1 ring-emerald-600/10'}`}>
        <p className={`text-[10px] font-black ${mine ? 'text-[#6D28D9]' : 'text-emerald-700'}`}>{r.n} · {r.v}</p>
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
/* FAQ (accordéon sombre — vraies objections).                         */
/* ------------------------------------------------------------------ */
const FAQ = [
  { q: 'Est-ce dangereux de dormir la bouche fermée ?', a: "Non. La respiration nasale est le mode de respiration naturel : la bande invite simplement la bouche à rester fermée, et elle se retire facilement d'un geste. Ne l'utilisez pas en cas de nez bouché, de rhume important ou d'apnée du sommeil sévère non traitée (demandez d'abord un avis médical)." },
  { q: 'Ça tient vraiment toute la nuit ?', a: "Oui : l'adhésif est pensé pour tenir 8 heures, même en bougeant, et se retire sans douleur au réveil. Appliquez sur peau propre et sèche pour une tenue parfaite." },
  { q: 'Ça irrite la peau ?', a: "Non : adhésif doux hypoallergénique, testé dermatologiquement, adapté aux peaux sensibles. En cas de rougeur persistante, espacez simplement les nuits d'utilisation." },
  { q: 'Ça arrête vraiment le ronflement ?', a: "Ça aide dans la plupart des cas : la bouche ouverte est la première cause du ronflement simple. En favorisant la respiration nasale, la majorité des utilisateurs constatent des nuits nettement plus silencieuses dès les premiers jours." },
  { q: 'Combien de bandes dans un paquet ?', a: "30 bandes par paquet, soit 30 nuits complètes — un mois de sommeil." },
  { q: 'Livraison partout en Côte d\'Ivoire ?', a: "Oui : Abidjan et toutes les grandes villes. Livraison à vos frais, et vous payez uniquement à la réception du paquet." },
];

/* ================================================================== */
/* Landing                                                             */
/* ================================================================== */
export default function BandesBuccalesSommeilLanding() {
  const company = useMemo(co, []);
  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const openModal = useCallback((q?: number) => {
    // Sans quantité explicite, on ouvre toujours sur 1 paquet (CTA collant,
    // hero, blocs). Seul le sélecteur de pack passe selectedPack en explicite.
    const pack = q || 1;
    setQty(pack); setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: orderTotal(PRICES, pack), currency: 'XOF' });
  }, []);

  useEffect(() => {
    document.title = 'Bandes Buccales Sommeil — Dormez la bouche fermée · -50 %';
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
    <div className="relative min-h-screen bg-gradient-to-b from-[#0B1035] via-[#1E1B4B] to-[#0B1035] pb-28 text-white">
      <style>{`
        @keyframes bb-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .bb-marquee { animation: bb-marquee 26s linear infinite; }
        .bb-grad { background: linear-gradient(120deg,#FCD34D,#FDE68A 40%,#22D3EE); -webkit-background-clip:text; background-clip:text; color: transparent; }
        @keyframes bb-twinkle { 0%,100%{opacity:.12; transform:scale(.75)} 50%{opacity:.95; transform:scale(1.2)} }
        .bb-twinkle { animation: bb-twinkle 3.5s ease-in-out infinite; }
        .bb-glass { background: rgba(255,255,255,.07); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,.15); }
        .bb-moon { background: radial-gradient(circle at 50% 18%, rgba(252,211,77,.20), rgba(252,211,77,.05) 42%, transparent 68%); }
        @keyframes bb-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes bb-shine { 0%{left:-60%} 55%{left:120%} 100%{left:120%} }
        .bb-cta-btn { position:relative; overflow:hidden; animation: bb-bounce 1.4s ease-in-out infinite; }
        .bb-cta-btn::after { content:''; position:absolute; top:0; left:-60%; height:100%; width:40%; transform:skewX(-20deg); background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent); animation:bb-shine 1.8s ease-in-out infinite; }
        .bb-cta-gold { background-image: linear-gradient(90deg,#B45309,#F59E0B,#FCD34D); }
        .bb-cta-violet { background-image: linear-gradient(90deg,#5B21B6,#7C3AED,#A78BFA); }
        .bb-cta-cyan { background-image: linear-gradient(90deg,#0E7490,#06B6D4,#22D3EE); }
        .bb-cta-rose { background-image: linear-gradient(90deg,#9F1239,#F43F5E,#FB7185); }
        @media (prefers-reduced-motion: reduce) { .bb-marquee, .bb-twinkle, .bb-cta-btn, .bb-cta-btn::after { animation: none; } }
      `}</style>

      <Starfield />

      <div className="relative z-10">
        {/* ==================== HERO ==================== */}
        <section className="bb-moon relative overflow-hidden px-4 pb-10 pt-10">
          <div className="pointer-events-none absolute left-1/2 top-6 h-40 w-40 -translate-x-1/2 rounded-full bg-[#FCD34D]/15 blur-3xl" />
          <div className="relative mx-auto max-w-[560px] text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="bb-glass inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#FCD34D]">🌙 Nouveauté sommeil 2026</span>
              <span className="inline-flex rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#312E81]">-50 % cette nuit</span>
            </div>

            <h1 className="mt-6 text-[31px] font-black leading-[1.12] text-[#F5F3FF] sm:text-[40px]">
              Dormez la bouche fermée. <span className="bb-grad">Réveillez-vous enfin reposé.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[440px] text-[13.5px] leading-relaxed text-white/70 sm:text-[15px]">
              Une petite bande douce sur les lèvres, et votre corps fait le reste : respiration nasale, ronflement calmé, bouche sèche oubliée. 30 nuits par paquet.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
              <span className="bb-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
                <Stars /> <span className="text-white">4,8/5</span> <span className="text-white/50">(+2 300 dormeurs)</span>
              </span>
              <span className="bb-glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[#A5F3FC]">
                😴 +2 300 nuits transformées
              </span>
            </div>

            <div className="mt-5 flex items-baseline justify-center gap-3">
              <span className="text-[16px] font-bold text-white/40 line-through">{fmtN(OLD_UNIT)} F</span>
              <span className="bb-grad text-[46px] font-black leading-none sm:text-[56px]">{fmtTotal(1)} F</span>
            </div>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#FCD34D]">Le paquet de 30 nuits · Paiement à la livraison 🔒</p>

            <div className="relative mx-auto mt-7 max-w-[440px]">
              <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-br from-[#7C3AED]/40 via-[#312E81]/30 to-[#22D3EE]/25 blur-2xl" />
              <div className="bb-glass relative overflow-hidden rounded-[30px] p-2.5 shadow-2xl">
                <div className="overflow-hidden rounded-[22px]">
                  <LazyImg src={MEDIA.hero} alt="Couple dormant paisiblement grâce aux bandes buccales Premium Tape : nuits plus paisibles et respiration nasale favorisée" aspect="1/1" priority />
                </div>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-sm"><BbCTA big variant="gold" onClick={() => openModal()}>Dormir mieux ce soir · {fmtTotal(1)} F</BbCTA></div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-white/70">
              {['🌿 Adhésif hypoallergénique', '😴 30 nuits par paquet', '👃 Respiration nasale', '🔇 Ronflement calmé'].map((b) => (
                <span key={b} className="bb-glass rounded-full px-3 py-1">{b}</span>
              ))}
            </div>
          </div>
        </section>

        <Marquee gold items={['Paiement à la livraison', '30 nuits par paquet', "-50 % cette nuit", 'Adhésif doux hypoallergénique', 'Respiration nasale naturelle']} />

        {/* ==================== COMPTE À REBOURS (carte glass) ==================== */}
        <section className="px-4 py-9">
          <div className="bb-glass relative mx-auto max-w-[560px] overflow-hidden rounded-[28px] p-6 text-center shadow-2xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#7C3AED]/30 blur-2xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FCD34D]">⚡ L'offre -50 % s'endort à minuit</p>
            <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
            <p className="mt-3 text-[11px] font-semibold text-white/60">À minuit, le paquet repasse à {fmtN(OLD_UNIT)} F. Dormez sur vos deux oreilles, pas sur l'offre.</p>
          </div>
        </section>

        {/* ==================== BLOCS MÉDIAS NUIT ==================== */}
        <NightBlock
          media={<LazyVideo src={MEDIA.demoVideo} poster={MEDIA.demoPoster} badge="Motion design" />}
          glow="from-[#7C3AED]/50 to-[#22D3EE]/25"
          kicker="La méthode en vidéo"
          title={<>Une bande le soir, <span className="bb-grad">le silence toute la nuit</span></>}
          text="On la pose en 3 secondes sur les lèvres, et la bouche reste doucement fermée : le corps bascule en respiration nasale, comme la nature l'a prévu."
          cta="Je veux essayer ce soir"
          onCta={() => openModal()}
          variant="violet"
          ratio="9/16"
        />

        <NightBlock
          media={<LazyImg src={MEDIA.avantApresHomme} alt="Avant après : homme passant d'une nuit bouche ouverte avec ronflements à une nuit paisible bouche fermée avec la bande buccale" aspect="1/1" />}
          glow="from-[#312E81]/60 to-[#818CF8]/25"
          kicker="Avant / Après"
          title={<>Bouche ouverte, ronflements. <span className="bb-grad">Bouche fermée, nuit paisible.</span></>}
          text="La différence entre une nuit qui épuise et une nuit qui répare tient souvent à quelques centimètres de bande douce. Lui a trouvé les siens."
          cta="Transformer mes nuits"
          onCta={() => openModal()}
          variant="cyan"
          ratio="1/1"
        />

        <Marquee items={['Stock limité cette nuit', 'Paiement uniquement à la livraison', 'Abidjan · Bouaké · San-Pédro · Yamoussoukro', '+2 300 dormeurs notent 4,8/5']} />

        <NightBlock
          media={<LazyImg src={MEDIA.avantApresLit} alt="Avant après : sommeil réparateur retrouvé avec la bande buccale Premium Tape" aspect="1/1" />}
          glow="from-[#0E7490]/55 to-[#22D3EE]/25"
          kicker="Bouche sèche terminée"
          title={<>Réveil sans gorge sèche, <span className="bb-grad">sans mal de tête</span></>}
          text="Respirer par la bouche toute la nuit dessèche la gorge et fragmente le sommeil. La respiration nasale humidifie, filtre et apaise — vous sentez la différence au premier réveil."
          cta="Dormir la bouche fermée"
          onCta={() => openModal()}
          variant="gold"
          ratio="1/1"
        />

        <NightBlock
          media={<LazyImg src={MEDIA.femme} alt="Femme dormant paisiblement avec la bande buccale douce sur les lèvres" aspect="1/1" />}
          glow="from-[#9F1239]/50 to-[#FB7185]/25"
          kicker="Douceur peau sensible"
          title={<>Un adhésif si doux, <span className="bb-grad">vous l'oublierez</span></>}
          text="Hypoallergénique et testé dermatologiquement : la bande tient toute la nuit sans tirer, et se retire le matin sans douleur ni trace."
          cta="Commander mon paquet"
          onCta={() => openModal()}
          variant="rose"
          ratio="1/1"
        />

        <NightBlock
          media={<LazyImg src={MEDIA.avantApresFemme} alt="Avant après : femme passant de nuits agitées à un sommeil calme avec la bande buccale" aspect="1/1" />}
          glow="from-[#065F46]/55 to-[#34D399]/25"
          kicker="Couples réconciliés"
          title={<>Quand l'un arrête de ronfler, <span className="bb-grad">les deux dorment</span></>}
          text="Le ronflement fatigue deux personnes : celle qui ronfle et celle qui écoute. Un paquet chacun, et la chambre retrouve son calme."
          cta="Offrir le silence"
          onCta={() => openModal()}
          variant="violet"
          ratio="1/1"
        />

        {/* ==================== CHIFFRES GRAND FORMAT ==================== */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-[560px]">
            <div className="bb-glass rounded-[30px] p-6 shadow-2xl sm:p-8">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.24em] text-[#FCD34D]">La preuve par les nuits</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  { v: '4,8/5', l: 'Note moyenne', i: '⭐' },
                  { v: '+2 300', l: 'Dormeurs', i: '😴' },
                  { v: '30', l: 'Nuits / paquet', i: '🌙' },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <span className="text-[20px]">{s.i}</span>
                    <p className="bb-grad mt-1 text-[24px] font-black leading-none sm:text-[30px]">{s.v}</p>
                    <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/50">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== TÉMOIGNAGES ==================== */}
        <section className="px-4 py-10">
          <div className="mx-auto max-w-[560px]">
            <div className="text-center">
              <span className="bb-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold">
                <Stars /> <span className="text-white">4,8/5 — +2 300 dormeurs</span>
              </span>
              <h2 className="mt-3 text-[24px] font-black text-[#F5F3FF] sm:text-[28px]">Ils dorment enfin <span className="bb-grad">profondément</span></h2>
            </div>
            <div className="mt-6 space-y-3">
              {TESTIMONIALS.map((r) => <TestimonialCard key={r.n} r={r} />)}
            </div>
            <div className="mx-auto mt-6 max-w-sm"><BbCTA variant="cyan" onClick={() => openModal()}>Rejoindre les dormeurs</BbCTA></div>
          </div>
        </section>

        {/* ==================== WHATSAPP ==================== */}
        <section className="px-4 py-10">
          <div className="mx-auto max-w-[560px]">
            <div className="text-center">
              <span className="bb-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold">
                <Stars /> <span className="text-white">96 % de dormeurs recommandent</span>
              </span>
              <h2 className="mt-3 text-[24px] font-black text-[#F5F3FF] sm:text-[28px]">Ils nous écrivent <span className="bb-grad">sur WhatsApp</span></h2>
            </div>
            <div className="bb-glass mt-6 rounded-[26px] p-4 shadow-2xl">
              <div className="space-y-3">
                {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] font-bold text-[#A5F3FC]">🔒 Paiement à la livraison · Vous ne payez qu'à la réception du paquet</p>
            <div className="mx-auto mt-5 max-w-sm"><BbCTA variant="gold" onClick={() => openModal()}>Commander en toute confiance</BbCTA></div>
          </div>
        </section>

        {/* ==================== GARANTIE DÉDIÉE ==================== */}
        <section className="px-4 py-10">
          <div className="relative mx-auto max-w-[560px]">
            <div className="absolute -inset-3 rounded-[34px] bg-gradient-to-br from-[#F59E0B]/35 to-[#7C3AED]/25 blur-2xl" />
            <div className="bb-glass relative overflow-hidden rounded-[28px] p-6 text-center shadow-2xl sm:p-8">
              <span className="text-[34px]">🛡️</span>
              <h2 className="mt-2 text-[22px] font-black text-[#F5F3FF] sm:text-[26px]">Satisfait ou remboursé <span className="bb-grad">pendant 7 jours</span></h2>
              <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-white/70">
                Essayez les bandes une semaine complète. Si vos nuits ne changent pas, nous vous remboursons. Et comme toujours : <strong className="text-white">paiement à la livraison</strong> — vous ne payez qu'à la réception, jamais en ligne.
              </p>
              <div className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-3 text-left sm:grid-cols-3">
                {[
                  { icon: '💵', t: 'Paiement à la réception', d: 'Rien à payer en ligne, vous payez au livreur.' },
                  { icon: '🚚', t: 'Livraison rapide', d: "Abidjan et toutes les grandes villes de Côte d'Ivoire." },
                  { icon: '📞', t: 'Confirmation par appel', d: 'Un conseiller vous appelle avant expédition.' },
                ].map((g) => (
                  <div key={g.t} className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
                    <span className="text-[20px]">{g.icon}</span>
                    <p className="mt-1.5 text-[12px] font-black text-white">{g.t}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/60">{g.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== FAQ ACCORDÉON SOMBRE ==================== */}
        <section className="px-4 py-10">
          <div className="mx-auto max-w-[560px]">
            <h2 className="text-center text-[24px] font-black text-[#F5F3FF] sm:text-[28px]">Vos questions, <span className="bb-grad">nos réponses</span></h2>
            <div className="mt-6 space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="bb-glass group rounded-2xl p-4 open:ring-1 open:ring-[#FCD34D]/30">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-[13.5px] font-bold text-[#EDE9FE] marker:content-none">
                    {f.q}
                    <span className="shrink-0 text-[#FCD34D] transition group-open:rotate-45">＋</span>
                  </summary>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/70">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== OFFRE / URGENCE ==================== */}
        <section className="px-4 py-10">
          <div className="bb-glass relative mx-auto max-w-[560px] overflow-hidden rounded-[28px] p-6 text-center shadow-2xl sm:p-8">
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#22D3EE]/20 blur-2xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FCD34D]">⏳ Dernières heures au prix de lancement</p>
            <div className="mt-5 flex items-baseline justify-center gap-3">
              <span className="text-[15px] font-bold text-white/40 line-through">{fmtN(OLD_UNIT)} F</span>
              <span className="text-[42px] font-black leading-none text-white">{fmtTotal(1)} F</span>
            </div>
            <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
            <div className="mx-auto mt-6 max-w-sm"><BbCTA big variant="rose" onClick={() => openModal()}>J'en profite avant minuit</BbCTA></div>
          </div>
        </section>

        {/* ==================== PACKS ==================== */}
        <section className="px-4 pb-12 pt-2">
          <div className="mx-auto max-w-[560px]">
            <h2 className="text-center text-[24px] font-black text-[#F5F3FF] sm:text-[28px]">Choisissez vos <span className="bb-grad">nuits</span></h2>
            <p className="mt-2 text-center text-[13px] text-white/60">1 paquet pour essayer · 2 pour le couple · 3 pour trois mois de sommeil.</p>
            <div className="mt-6 space-y-3">
              {QTY_OPTS.map((o) => {
                const active = selectedPack === o.v;
                return (
                  <button key={o.v} type="button"
                    onClick={() => { setSelectedPack(o.v); track('SelectPack', { product: PRODUCT_CODE, pack: o.v, value: orderTotal(PRICES, o.v), currency: 'XOF' }); }}
                    className={`relative w-full rounded-2xl border-2 p-4 text-left transition ${active ? 'scale-[1.01] border-[#FCD34D] bg-white/10 shadow-xl' : 'border-white/15 bg-white/5 hover:border-[#7C3AED]'}`}>
                    {o.tag && active && <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] px-3 py-0.5 text-[9px] font-black uppercase text-[#312E81]">{o.tag}</span>}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{o.label} <span className="ml-1 text-[13px] font-bold text-white/40 line-through">{fmtN(OLD_UNIT * o.v)} F</span></p>
                        {o.save && <p className="text-[11px] font-semibold text-emerald-300">{o.save}</p>}
                      </div>
                      <p className="bb-grad text-[22px] font-black">{o.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mx-auto mt-6 max-w-sm">
              <BbCTA big variant="gold" onClick={() => openModal(selectedPack)}>Commander · {fmtTotal(selectedPack)} F</BbCTA>
            </div>
            <p className="mt-6 text-center text-[15px] font-black text-white">
              Bouche fermée. Nez ouvert. <span className="bb-grad">Nuits réparées.</span>
            </p>
            <div className="mx-auto mt-4 max-w-sm"><BbCTA variant="violet" onClick={() => openModal()}>Dernier clic avant minuit ⏳</BbCTA></div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="border-t border-white/10 bg-[#070B26] px-4 pb-8 pt-6 text-center text-[10.5px] text-white/45">
          <p className="font-bold text-white/75">💵 Paiement à la livraison · 🚚 Abidjan & toute la Côte d'Ivoire</p>
          <p className="mt-1.5">Livraison à vos frais · Paiement à la réception. Un conseiller vous appelle pour confirmer avant expédition.</p>
          <p className="mt-3">© {new Date().getFullYear()} · Bandes Buccales pour le Sommeil · Côte d'Ivoire</p>
        </footer>
      </div>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={() => openModal()} />

      <Suspense fallback={null}>
        {modal && (
          <OrderModalBandesBuccales
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
