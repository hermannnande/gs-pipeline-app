/**
 * Landing — Guide « Faire pousser vos cheveux naturellement ».
 * ============================================================================
 *
 * DEUX FORMATS au choix, chacun avec son propre circuit de vente :
 *
 *   1. EBOOK (8 900 F) — produit DIGITAL paye via CHARIOW (Mobile Money / carte).
 *      Apres paiement, Chariow delivre le PDF (portail client) et le webhook
 *      /api/chariow/webhook enregistre la vente dans obgestion.
 *      Code produit GUIDE_POUSSE_NATURELLE, ISOLE (utils/isolatedProducts.js) :
 *      ces ventes n'apparaissent pas dans le pipeline "a appeler"/livraison,
 *      seulement dans la page admin dediee (/admin/ventes-digitales).
 *
 *   2. LIVRE IMPRIME (9 900 F) — produit PHYSIQUE, paiement A LA LIVRAISON.
 *      Code produit GUIDE_POUSSE_NATURELLE_PHYSIQUE, volontairement ABSENT de
 *      ISOLATED_PRODUCT_CODES : ses commandes suivent le pipeline standard via
 *      POST /public/order — page "A appeler", validation, tournee.
 *
 * Flux d'achat :
 *   CTA -> modal ETAPE 1 : choix du format
 *     -> ebook    : nom, email, telephone -> useChariowCheckout -> Chariow
 *                   -> retour /guide-pousse-naturelle/merci?ref=<sale_id>
 *     -> imprime  : nom, ville, telephone -> useOrderSubmit -> POST /public/order
 *                   -> /guide-pousse-naturelle/merci?format=physique&ref=<ref>
 *
 * Design : emeraude #0E7A3D / #10B981, dore #D4AF37, creme #FBF7EE.
 * Formulations responsables : "aide a", "soutient", jamais "guerit".
 * Medias : WebP locaux dans /guide-pousse-naturelle/ (public), video self-hostee.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { trackPageView } from '../../utils/pageTracking';
import { useChariowCheckout, type ChariowCheckoutConfig } from '../../hooks/useChariowCheckout';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';
// Video hero self-hostee (compressee 720x720) + poster WebP, memes assets qu'avant.
import videoSrc from '../../assets/guide/video-guide.mp4';
import videoPoster from '../../assets/guide/video-guide-poster.webp';

const SLUG = 'guide-pousse-naturelle';
// Ebook : produit isole, vendu par Chariow.
const PRODUCT_CODE = 'GUIDE_POUSSE_NATURELLE';
// Livre imprime : produit standard, paiement a la livraison, pipeline "A appeler".
const PRODUCT_CODE_PHYSIQUE = 'GUIDE_POUSSE_NATURELLE_PHYSIQUE';
const TITLE = 'Faire pousser vos cheveux naturellement';
// Meta Pixel ID de cette page.
const META_PIXEL_ID = '2061376097807745';

// L'ecart de 1 000 F couvre l'impression et l'acheminement du livre.
const PRICE_EBOOK = 6900;
const PRICE_PHYSIQUE = 7900;
const OLD_PRICE_EBOOK = 15000;
const OLD_PRICE_PHYSIQUE = 18000;
// Prix d'appel affiche partout hors modal : le LIVRE PHYSIQUE est la vedette (demande client).
const PRICE = PRICE_PHYSIQUE;
const OLD_PRICE = OLD_PRICE_PHYSIQUE;
const PRICES: Record<number, number> = { 1: PRICE_EBOOK };
const PRICES_PHYSIQUE: Record<number, number> = { 1: PRICE_PHYSIQUE };

/** Remise arrondie, calculee (evite un pourcentage code en dur qui derive au 1er changement de prix). */
const discountPct = (price: number, old: number) => Math.round((1 - price / old) * 100);
const DISCOUNT = discountPct(PRICE_PHYSIQUE, OLD_PRICE_PHYSIQUE);

// Visuels locaux (public/guide-pousse-naturelle/), optimises WebP ~100 Ko.
const M = (n: string) => `/guide-pousse-naturelle/${n}`;
const MEDIA = {
  hero: M('n1.webp'),
  problem: M('n2.webp'),
  author: M('n3.webp'),
  recipes: M('n4.webp'),
  men: M('n5.webp'),
  women: M('n6.webp'),
  beard: M('n7.webp'),
};

const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
const pad = (n: number) => String(n).padStart(2, '0');

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any; } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

// Temoignages EXEMPLES — a remplacer par de vrais avis avant le lancement.
const TESTIMONIALS = [
  { n: 'Awa K.', v: 'Abidjan', stars: 5, t: "J'ai arrete d'acheter dix produits differents. Je fabrique mes soins et mes cheveux cassent beaucoup moins." },
  { n: 'Marc T.', v: 'Dakar', stars: 5, t: "Le programme homme pour les tempes est clair et realiste. Enfin une routine que je tiens." },
  { n: 'Nadia B.', v: 'Cotonou', stars: 5, t: "Le defi 30 jours m'a aidee a etre reguliere. Je vois la difference sur mes photos de suivi." },
  { n: 'Serge D.', v: 'Yamoussoukro', stars: 5, t: "La partie barbe vaut le guide a elle seule : ma barbe est souple et les zones clairsemees se remplissent doucement." },
];

const FAQ = [
  { q: 'Le guide convient-il aux hommes et aux femmes ?', a: 'Oui : programmes distincts hommes (tempes, couronne), femmes (longueur, casse) et barbe.' },
  { q: 'Le guide garantit-il la guerison de la calvitie ?', a: "Non. C'est un guide educatif qui aide a construire une routine adaptee et a savoir quand consulter. Il ne remplace pas un avis medical." },
  { q: 'Comment vais-je recevoir le guide ?', a: "Comme vous voulez : en ebook (PDF) recu immediatement apres paiement, lisible sur telephone, tablette et ordinateur ; ou en livre imprime livre chez vous, que vous payez seulement a la reception." },
  { q: 'Quelle difference entre l\'ebook et le livre imprime ?', a: "Le contenu est identique. L'ebook (6 900 F) arrive tout de suite et ne se perd pas. Le livre imprime (7 900 F) se lit sans ecran et s'annote a la main ; l'ecart couvre l'impression et la livraison." },
  { q: 'Quels moyens de paiement puis-je utiliser ?', a: 'Le paiement affiche automatiquement les solutions de votre pays : Mobile Money (Orange, Wave, MTN, Moov…) et cartes.' },
];

// Indicatifs pays (le client choisit le sien ; Chariow affiche ensuite les
// moyens de paiement adaptés à ce pays). code = ISO alpha-2 envoyé à Chariow.
const COUNTRIES: { code: string; name: string; dial: string; flag: string }[] = [
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'BJ', name: 'Bénin', dial: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'GN', name: 'Guinée', dial: '+224', flag: '🇬🇳' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { code: 'CM', name: 'Cameroun', dial: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'RD Congo', dial: '+243', flag: '🇨🇩' },
  { code: 'TD', name: 'Tchad', dial: '+235', flag: '🇹🇩' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', dial: '+32', flag: '🇧🇪' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'US', name: 'États-Unis', dial: '+1', flag: '🇺🇸' },
];

/* ------------------------------------------------------------------ */
/* Etoiles dorees (note 4,8/5).                                        */
/* ------------------------------------------------------------------ */
function Star({ half }: { half?: boolean }) {
  return (
    <svg className="h-4 w-4 text-[#D4AF37]" fill={half ? 'url(#gpnHalfStar)' : 'currentColor'} viewBox="0 0 20 20">
      {half && (
        <defs>
          <linearGradient id="gpnHalfStar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="80%" stopColor="#D4AF37" />
            <stop offset="80%" stopColor="#E7E2D4" />
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
/* CTA principal — degrade emeraude -> dore, glossy.                   */
/* ------------------------------------------------------------------ */
function GpnCTA({ onClick, children, big }: { onClick: () => void; children: ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`gpn-cta-btn group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0E7A3D] via-[#10B981] to-[#D4AF37] px-6 ${big ? 'py-5 text-[16px] sm:text-[18px]' : 'py-4 text-[14px] sm:text-[15px]'} font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_44px_-12px_rgba(14,122,61,.55)] ring-2 ring-white/40 transition hover:scale-[1.02] hover:shadow-[0_22px_52px_-10px_rgba(212,175,55,.45)] active:scale-[0.99]`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Barre defilante (marquee).                                          */
/* ------------------------------------------------------------------ */
function Marquee({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <div className={`overflow-hidden py-2.5 ${dark
      ? 'border-y border-[#D4AF37]/30 bg-gradient-to-r from-[#062A16] via-[#0E7A3D] to-[#062A16] text-[#D9F2E4]'
      : 'border-y border-white/50 bg-gradient-to-r from-[#0E7A3D] via-[#10B981] to-[#D4AF37] text-white'}`}>
      <div className="gpn-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-2">
                {t}<span className={dark ? 'text-[#D4AF37]' : 'text-[#FDF3C8]'}>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compte a rebours (fin de l'offre a minuit).                         */
/* ------------------------------------------------------------------ */
function Countdown({ h, m, s, compact }: { h: number; m: number; s: number; compact?: boolean }) {
  const cell = (v: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className={`inline-flex min-w-[52px] items-center justify-center rounded-2xl bg-white/10 font-black tabular-nums text-white ring-1 ring-[#D4AF37]/40 backdrop-blur-sm ${compact ? 'px-2.5 py-1.5 text-[16px]' : 'px-3 py-2.5 text-[24px]'}`}>
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
/* Bloc media : image arrondie sur degrade distinct + texte + CTA.     */
/* ------------------------------------------------------------------ */
type MediaBlockProps = {
  img: string;
  alt: string;
  ratio?: string;
  bg: string;
  kicker: string;
  title: ReactNode;
  text: string;
  cta: string;
  onCta: () => void;
  dark?: boolean;
};

function MediaBlock({ img, alt, ratio = '1/1', bg, kicker, title, text, cta, onCta, dark }: MediaBlockProps) {
  return (
    <section className={`px-4 py-8 sm:py-10 ${bg}`}>
      <div className="mx-auto max-w-[560px]">
        <div className={`overflow-hidden rounded-[28px] shadow-2xl ${dark ? 'ring-1 ring-[#D4AF37]/40' : 'ring-1 ring-[#0E7A3D]/15'}`}>
          <img src={img} alt={alt} loading="lazy" decoding="async" style={{ aspectRatio: ratio }} className="w-full object-cover" />
        </div>
        <div className="mt-5 text-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dark ? 'bg-white/15 text-[#F0D98C] ring-1 ring-[#D4AF37]/40' : 'bg-white/80 text-[#0E7A3D] ring-1 ring-[#0E7A3D]/25'}`}>
            {kicker}
          </span>
          <h2 className={`mt-3 text-[22px] font-black leading-tight sm:text-[26px] ${dark ? 'text-white' : 'text-[#123B25]'}`}>{title}</h2>
          <p className={`mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed sm:text-[14px] ${dark ? 'text-white/85' : 'text-[#0E7A3D]/80'}`}>{text}</p>
          <div className="mx-auto mt-5 max-w-sm"><GpnCTA onClick={onCta}>{cta}</GpnCTA></div>
        </div>
      </div>
    </section>
  );
}

/**
 * Video hero — lecteur natif, format carre 1:1 (source 1080x1080 self-hostee).
 * SON ACTIF EN PERMANENCE (demande client) :
 * - On tente d'emblee l'autoplay AVEC le son.
 * - Les navigateurs bloquent l'autoplay sonore avant toute interaction : dans ce
 *   cas on bascule en muet juste pour lancer la lecture (video visible), puis on
 *   force le son au tout premier micro-geste (mousemove / scroll / clic / touche).
 * - Les ecouteurs restent actifs : si le navigateur re-coupe le son, le geste
 *   suivant le reactive. Aucun retour volontaire au muet, aucun bouton mute.
 * - Poster WebP affiche instantanement pendant le buffering (perf).
 */
function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = 1;

    // 1) Tente l'autoplay avec son ; sinon fallback muet pour lancer la lecture.
    v.muted = false;
    v.play()
      .then(() => setSoundOn(true))
      .catch(() => {
        v.muted = true;
        setSoundOn(false);
        v.play().catch(() => { /* autoplay bloque : le poster reste affiche */ });
      });

    // 2) Au moindre geste, on (re)active le son et on le garde.
    const enableSound = () => {
      const el = videoRef.current;
      if (el && el.muted) { el.muted = false; el.volume = 1; el.play().catch(() => { /* noop */ }); setSoundOn(true); }
    };
    const opts = { passive: true } as const;
    window.addEventListener('pointerdown', enableSound, opts);
    window.addEventListener('touchstart', enableSound, opts);
    window.addEventListener('scroll', enableSound, opts);
    window.addEventListener('mousemove', enableSound, opts);
    window.addEventListener('keydown', enableSound);

    return () => {
      window.removeEventListener('pointerdown', enableSound);
      window.removeEventListener('touchstart', enableSound);
      window.removeEventListener('scroll', enableSound);
      window.removeEventListener('mousemove', enableSound);
      window.removeEventListener('keydown', enableSound);
    };
  }, []);

  const forceSound = () => {
    const el = videoRef.current;
    if (el) { el.muted = false; el.volume = 1; el.play().catch(() => { /* noop */ }); setSoundOn(true); }
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px] overflow-hidden rounded-[1.75rem] bg-black shadow-[0_20px_50px_-12px_rgba(6,42,22,.55)] ring-4 ring-[#D4AF37]/70">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={videoSrc}
        poster={videoPoster}
        autoPlay
        loop
        playsInline
        preload="metadata"
      />
      {!soundOn && (
        <button
          type="button"
          onClick={forceSound}
          className="absolute inset-x-0 bottom-4 z-10 mx-auto w-max animate-pulse rounded-full bg-gradient-to-r from-[#F0D98C] via-[#D4AF37] to-[#B8902A] px-5 py-2.5 text-[13px] font-black uppercase tracking-wide text-[#3A2800] shadow-xl ring-2 ring-white/60"
        >
          🔊 Activer le son
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications d'achat (popup bas-gauche, rotation ~12 s).           */
/* ------------------------------------------------------------------ */
const PURCHASE_NOTIFS = [
  { n: 'Koffi', q: 'Abobo', p: 'Ebook PDF' },
  { n: 'Aminata', q: 'Yopougon', p: 'Livre imprime' },
  { n: 'Yao', q: 'Cocody', p: 'Ebook PDF' },
  { n: 'Fatou', q: 'Marcory', p: 'Livre imprime' },
  { n: 'Ibrahim', q: 'Bouake', p: 'Ebook PDF' },
  { n: 'Awa', q: 'Angre', p: 'Livre imprime' },
  { n: 'Moussa', q: 'Koumassi', p: 'Ebook PDF' },
  { n: 'Adjoua', q: 'Treichville', p: 'Livre imprime' },
  { n: 'Salimata', q: 'San-Pedro', p: 'Ebook PDF' },
  { n: 'Nadia', q: 'Riviera', p: 'Livre imprime' },
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
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-[0_16px_40px_-12px_rgba(6,42,22,.35)] ring-1 ring-[#10B981]/40 backdrop-blur-md">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7A3D] to-[#D4AF37] text-[15px] font-black text-white">
          {it.n[0]}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight text-[#123B25]">
            {it.n} · {it.q} <span className="font-normal text-neutral-500">vient de commander</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#0E7A3D]">
            {it.p} · il y a {mins} min <span className="text-emerald-600">✓ verifie</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Temoignages (cartes etoilees).                                      */
/* ------------------------------------------------------------------ */
function TestimonialCard({ r }: { r: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-lg ring-1 ring-[#0E7A3D]/15">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7A3D] via-[#10B981] to-[#D4AF37] text-[15px] font-black text-white">
          {r.n[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-[#123B25]">{r.n} <span className="font-semibold text-neutral-400">· {r.v}</span></p>
          <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: r.stars }).map((_, k) => (
              <svg key={k} className="h-3 w-3 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 ring-1 ring-emerald-200">✓ Achat verifie</span>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-neutral-700">{r.t}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Temoignages style WhatsApp (bulles + heure + double check).         */
/* ------------------------------------------------------------------ */
const WHATSAPP_REVIEWS = [
  { n: 'Aissata', v: 'Marcory', t: "Ma soeur m'a demande ce que j'avais mis dans mes cheveux 😂 C'est juste le macera du guide, fait dans ma cuisine 🌿 2 mois de defi, mes tempes repoussent doucement 🙏🏾", h: '09:42', stars: 5 },
  { n: 'Mamadou', v: 'Koumassi', t: "J'ai pris le livre imprime, paye a la livraison 👌🏾 Le programme tempes est serieux : massage + huile maison tous les soirs. Ca devient un rituel.", h: '12:15', stars: 5 },
  { n: 'Adjoua', v: 'Treichville', t: "Fini les cremes a 15 000 F chaque mois 😩🔥 Mes masques me coutent 3 fois rien et mes cheveux ne cassent plus au demelage.", h: '18:03', stars: 5 },
  { n: 'Fatou', v: 'San-Pedro', t: "L'ebook recu en 2 minutes apres le paiement 📱 J'ai commence le defi 30 jours avec ma fille, on note tout dans le journal de suivi ❤️", h: '10:27', stars: 5 },
];

function WhatsAppBubble({ r, i }: { r: (typeof WHATSAPP_REVIEWS)[number]; i: number }) {
  const mine = i % 2 === 0;
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-tl-md bg-white ring-1 ring-[#0E7A3D]/15' : 'rounded-tr-md bg-[#DCF8C6] ring-1 ring-emerald-600/10'}`}>
        <p className={`text-[10px] font-black ${mine ? 'text-[#0E7A3D]' : 'text-emerald-700'}`}>{r.n} · {r.v}</p>
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
/* CTA collant bas de page (visible des l'arrivee, masque si modal).   */
/* ------------------------------------------------------------------ */
function StickyCTA({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="border-t border-[#D4AF37]/40 bg-gradient-to-r from-[#062A16]/95 via-[#0E7A3D]/95 to-[#065F46]/95 shadow-[0_-10px_34px_-10px_rgba(6,42,22,.5)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1 leading-tight text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F0D98C]">-{DISCOUNT} % · aujourd'hui</p>
            <p className="text-[15px] font-black">
              {fmt(PRICE)} <span className="ml-1 text-[11px] font-semibold text-white/60 line-through">{fmt(OLD_PRICE)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClick}
            className="gpn-cta-btn shrink-0 rounded-xl bg-gradient-to-r from-[#F0D98C] via-[#D4AF37] to-[#B8902A] px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.08em] text-[#3A2800] shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
          >
            Obtenir le guide 🌿
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Landing                                                             */
/* ================================================================== */
export default function GuidePousseNaturelleLanding() {
  const company = useMemo(() => new URLSearchParams(window.location.search).get('company') || 'ci', []);
  const [modal, setModal] = useState(false);
  // Etape du modal : 'choix' (les 2 formats) -> 'ebook' | 'physique'.
  const [step, setStep] = useState<'choix' | 'ebook' | 'physique'>('choix');
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: 'CI' });
  const [formPhy, setFormPhy] = useState({ name: '', city: '', phone: '' });
  const [product, setProduct] = useState<OrderProduct | null>(null);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [sticky, setSticky] = useState(false);
  const pixelFired = useRef(false);

  const cfg: ChariowCheckoutConfig = useMemo(
    () => ({ slug: SLUG, productCode: PRODUCT_CODE, title: TITLE, metaPixelId: META_PIXEL_ID || undefined, prices: PRICES }),
    [],
  );
  const { checkout, sending, formErr, setFormErr } = useChariowCheckout({ cfg, company });

  // Circuit physique : meme pipeline que les produits classiques (POST /public/order).
  const cfgPhy: OrderSubmitConfig = useMemo(
    () => ({
      slug: SLUG,
      productCode: PRODUCT_CODE_PHYSIQUE,
      title: `${TITLE} (livre imprime)`,
      metaPixelId: META_PIXEL_ID || undefined,
      prices: PRICES_PHYSIQUE,
      // Le format distingue les deux parcours sur la page merci partagee.
      thankYouUrl: `/${SLUG}/merci?format=physique`,
    }),
    [],
  );
  const {
    submit: submitPhy,
    sending: sendingPhy,
    formErr: formErrPhy,
    setFormErr: setFormErrPhy,
    trackOpen: trackOpenPhy,
  } = useOrderSubmit({ cfg: cfgPhy, product, setProduct, company });

  useEffect(() => {
    document.title = `${TITLE} — Ebook ou livre imprime · -${DISCOUNT} %`;
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: TITLE,
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: PRICE_EBOOK,
        currency: 'XOF',
      });
    }
  }, [company]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  // CTA collant : visible des l'arrivee sur la page (masque quand le modal est ouvert).
  useEffect(() => { setSticky(true); }, []);

  // Compte a rebours jusqu'a minuit (remise du jour).
  useEffect(() => {
    const tick = () => {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - Date.now());
      setCountdown({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const openModal = useCallback(() => {
    setFormErr('');
    setFormErrPhy('');
    setStep('choix');
    setModal(true);
  }, [setFormErr, setFormErrPhy]);

  const busy = sending || sendingPhy;
  const closeModal = useCallback(() => { if (!busy) setModal(false); }, [busy]);

  const submitPhysique = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await submitPhy({ name: formPhy.name, city: formPhy.city, phone: formPhy.phone, qty: 1 });
    },
    [submitPhy, formPhy],
  );

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await checkout({
        slug: SLUG,
        qty: 1,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        customerCity: 'En ligne', // produit digital : pas d'adresse de livraison
        displayedAmount: PRICE_EBOOK,
        // Pays choisi par le client -> Chariow affiche les moyens de paiement
        // adaptés (Mobile Money du pays, cartes, etc.).
        countryCode: form.country,
        // Garde tout le parcours (paiement -> merci) sur le meme domaine.
        redirectBase: window.location.origin,
      });
    },
    [checkout, form],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBF7EE] via-[#F5F0E1] to-[#EDF7F0] pb-28 text-neutral-900">
      <style>{`
        @keyframes gpn-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .gpn-marquee { animation: gpn-marquee 26s linear infinite; }
        .gpn-grad { background: linear-gradient(120deg,#0E7A3D,#10B981 45%,#D4AF37); -webkit-background-clip:text; background-clip:text; color: transparent; }
        /* Bouton CTA interieur des cartes de format : bounce + scintillement */
        @keyframes gpn-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes gpn-shine { 0%{left:-60%} 55%{left:120%} 100%{left:120%} }
        .gpn-cta-btn { position:relative; overflow:hidden; animation: gpn-bounce 1.4s ease-in-out infinite; }
        .gpn-cta-btn::after { content:''; position:absolute; top:0; left:-60%; height:100%; width:40%; transform:skewX(-20deg); background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent); animation:gpn-shine 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .gpn-marquee, .gpn-cta-btn, .gpn-cta-btn::after { animation: none; } }
      `}</style>

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden px-4 pb-10 pt-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#10B981]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#D4AF37]/25 blur-3xl" />
        <div className="relative mx-auto max-w-[560px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#0E7A3D] to-[#10B981] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">🌿 Guide 2026</span>
            <span className="inline-flex rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8902A] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">-{DISCOUNT} % aujourd'hui</span>
          </div>

          <h1 className="mt-5 text-[30px] font-black leading-[1.12] text-[#123B25] sm:text-[38px]">
            Vous avez tout essaye contre la chute ? <span className="gpn-grad">Fabriquez votre propre traitement.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[440px] text-[13.5px] leading-relaxed text-[#0E7A3D]/80 sm:text-[14.5px]">
            Des dizaines de produits achetes contre la calvitie et la chute… sans resultat durable ? Ce guide vous apprend a creer vous-meme vos soins, chez vous, avec des ingredients naturels.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#D4AF37]/50">
              <Stars /> <span className="text-[#123B25]">4,8/5</span> <span className="text-neutral-400">(1 500+ lecteurs)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[#0E7A3D] ring-1 ring-[#10B981]/30">
              🌿 Recettes 100 % naturelles
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-[16px] font-bold text-neutral-400 line-through">{fmt(OLD_PRICE)}</span>
            <span className="gpn-grad text-[44px] font-black leading-none sm:text-[54px]">{fmt(PRICE)}</span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#0E7A3D]">Livre paye a la livraison · ou ebook immediat 🔒</p>

          <div className="relative mx-auto mt-6 max-w-[440px]">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#0E7A3D]/20 via-[#10B981]/25 to-[#D4AF37]/25 blur-xl" />
            <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/60">
              <img src={MEDIA.hero} alt="Faire pousser vos cheveux naturellement : huiles, serums et soins capillaires faits maison" loading="eager" decoding="async" fetchPriority="high" className="aspect-square w-full object-cover" />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-sm"><GpnCTA big onClick={openModal}>Obtenir le guide maintenant</GpnCTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold text-[#0E7A3D]/85">
            {['📱 Ebook recu en 2 min', '📦 Livre paye a la livraison', '🌿 Ingredients de cuisine', '📅 Defi 30 jours inclus'].map((b) => (
              <span key={b} className="rounded-full bg-white/75 px-3 py-1 ring-1 ring-[#10B981]/25">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={['Ebook immediat ou livre chez vous', 'Paiement a la livraison pour le livre', 'Mobile Money accepte', 'Recettes 100 % naturelles', `-${DISCOUNT} % aujourd'hui`]} />

      {/* ==================== COMPTE A REBOURS ==================== */}
      <section className="bg-gradient-to-r from-[#062A16] via-[#0E7A3D] to-[#065F46] px-4 py-8">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F0D98C]">⚡ L'offre -{DISCOUNT} % expire ce soir</p>
          <div className="mt-4"><Countdown h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <p className="mt-3 text-[11px] font-semibold text-[#D9F2E4]">A minuit, le guide repasse a {fmt(OLD_PRICE)}. Apres, il sera trop tard.</p>
        </div>
      </section>

      {/* ==================== VIDEO (son permanent, logique conservee) ==================== */}
      <section className="bg-gradient-to-b from-[#062A16] via-[#0B3D22] to-[#0E7A3D] px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-[560px]">
          <HeroVideo />
          <div className="mt-5 text-center">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#F0D98C] ring-1 ring-[#D4AF37]/40">
              La methode en video
            </span>
            <h2 className="mt-3 text-[22px] font-black leading-tight text-white sm:text-[26px]">Regardez comment <span className="text-[#F0D98C]">ca fonctionne</span></h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-white/85 sm:text-[14px]">
              Huiles, maceras, massages du cuir chevelu : la methode pas a pas, fabriquee dans votre cuisine.
            </p>
            <div className="mx-auto mt-5 max-w-sm"><GpnCTA onClick={openModal}>Je veux la methode</GpnCTA></div>
          </div>
        </div>
      </section>

      {/* ==================== PROBLEME ==================== */}
      <MediaBlock
        img={MEDIA.problem}
        alt="Accumulation de produits capillaires couteux et inadaptes"
        bg="bg-gradient-to-b from-[#FBF7EE] to-[#F0E6CF]/60"
        kicker="Ras-le-bol"
        title={<>Arretez de depenser dans des produits <span className="text-[#B0761B]">qui ne marchent pas</span></>}
        text="Chaque mois un nouveau produit « miracle », et toujours le meme resultat : rien. Tant que la vraie cause n'est pas identifiee, on gaspille son argent."
        cta="Trouver ma routine"
        onCta={openModal}
      />

      {/* ==================== RECETTES ==================== */}
      <MediaBlock
        img={MEDIA.recipes}
        alt="Recettes naturelles du guide : huiles, serums, maceras et masques faits maison"
        ratio="608/1080"
        bg="bg-gradient-to-b from-[#EDF7F0] to-[#A7E3C4]/40"
        kicker="Votre laboratoire maison"
        title={<>Plus de 15 recettes, <span className="gpn-grad">fabriquees dans votre cuisine</span></>}
        text="Huiles, serums, maceras, masques, lotions, shampoings : chaque fiche detaille ingredients, preparation, usage et conservation. Vous ne rachetez plus rien."
        cta="Decouvrir les recettes"
        onCta={openModal}
      />

      {/* ==================== AUTEUR / DIAGNOSTIC ==================== */}
      <MediaBlock
        img={MEDIA.author}
        alt="La methode du guide : diagnostic de la vraie cause de la chute avant toute routine"
        bg="bg-gradient-to-b from-[#FBF7EE] via-[#F5F0E1] to-[#F0E6CF]/50"
        kicker="D'abord, comprendre"
        title={<>Un diagnostic pour identifier <span className="text-[#0E7A3D]">votre vraie cause</span></>}
        text="Chute hormonale, casse, tempes degarnies, cuir chevelu asphyxie : la methode commence par comprendre VOTRE probleme — et vous dit aussi quand consulter."
        cta="Faire mon diagnostic"
        onCta={openModal}
      />

      <Marquee dark items={['Programmes homme · femme · barbe', 'Defi 30 jours + journal de suivi', 'Ingredients naturels et economiques', 'Livre 7 900 F · Ebook 6 900 F']} />

      {/* ==================== HOMMES ==================== */}
      <MediaBlock
        img={MEDIA.men}
        alt="Programme hommes : routine pour les tempes et la couronne"
        ratio="864/1080"
        bg="bg-gradient-to-b from-[#062A16] via-[#0B3D22] to-[#14532D]"
        kicker="Programme hommes"
        title={<>Tempes et couronne : <span className="text-[#F0D98C]">une routine qui se tient</span></>}
        text="Massage du cuir chevelu, huile maison, gestes simples du soir : un programme realiste pour les zones clairsemees, pense pour durer."
        cta="Commencer le programme homme"
        onCta={openModal}
        dark
      />

      {/* ==================== FEMMES ==================== */}
      <MediaBlock
        img={MEDIA.women}
        alt="Programme femmes : longueur, casse et coiffures protectrices"
        bg="bg-gradient-to-b from-[#FDF6EC] to-[#F0D98C]/30"
        kicker="Programme femmes"
        title={<>Longueur et casse : <span className="gpn-grad">des cheveux qui poussent enfin</span></>}
        text="Demelage doux, coiffures protectrices, tempes preservees : la routine complete pour retenir la longueur au lieu de la voir partir a chaque coiffage."
        cta="Lancer mon defi 30 jours"
        onCta={openModal}
      />

      {/* ==================== BARBE ==================== */}
      <MediaBlock
        img={MEDIA.beard}
        alt="Programme barbe : souplesse, entretien et zones clairsemees"
        ratio="864/1080"
        bg="bg-gradient-to-b from-[#0B3D22] via-[#0E7A3D] to-[#065F46]"
        kicker="Programme barbe"
        title={<>Une barbe plus douce, <span className="text-[#F0D98C]">mieux fournie</span></>}
        text="Huile a barbe maison, brossage, patience : le protocole pour discipliner la barbe et densifier progressivement les zones clairsemees."
        cta="Prendre soin de ma barbe"
        onCta={openModal}
        dark
      />

      {/* ==================== CONTENU DU GUIDE ==================== */}
      <section className="bg-gradient-to-b from-[#EDF7F0] via-[#F5F0E1] to-[#FBF7EE] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#0E7A3D] ring-1 ring-[#10B981]/30">Contenu complet</span>
            <h2 className="mt-3 text-[24px] font-black text-[#123B25] sm:text-[28px]">Tout ce que contient <span className="gpn-grad">le guide</span></h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] text-[#0E7A3D]/80">Une methode complete, pas quelques recettes en vrac.</p>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {[
              'Methode de diagnostic pour identifier votre vrai probleme',
              'Plus de 15 recettes : huiles, serums, macerats, masques, lotions, shampoings',
              'Fiches completes : ingredients, preparation, usage, conservation',
              'Programmes distincts : homme, femme et barbe',
              'Bonnes doses, substitutions et melanges a eviter',
              'Regles de conservation pour eviter la contamination',
              'BONUS : defi 30 jours + journal de suivi',
              'BONUS : grille photos & mesures + FAQ',
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-[#10B981]/15">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7A3D] to-[#10B981] text-xs text-white">✓</span>
                <span className="text-[13px] leading-snug text-neutral-700">{t}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] italic text-[#0E7A3D]/70">Le tout dans un seul guide, en livre imprime a {fmt(PRICE_PHYSIQUE)} ou en ebook a {fmt(PRICE_EBOOK)}.</p>
          <div className="mx-auto mt-6 max-w-sm"><GpnCTA onClick={openModal}>Je veux le guide complet</GpnCTA></div>
        </div>
      </section>

      {/* ==================== CHIFFRES / PREUVE SOCIALE ==================== */}
      <section className="bg-gradient-to-b from-[#FBF7EE] via-[#F5F0E1] to-[#EDF7F0] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-3 gap-3 text-center">
          {[
            { v: '4,8/5', l: 'Note moyenne', i: '⭐' },
            { v: '+1 500', l: 'Lecteurs du guide', i: '📖' },
            { v: '97 %', l: 'Recommandent', i: '🌿' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white/90 p-4 shadow-lg ring-1 ring-[#0E7A3D]/15">
              <span className="text-[18px]">{s.i}</span>
              <p className="gpn-grad mt-1 text-[22px] font-black leading-none sm:text-[26px]">{s.v}</p>
              <p className="mt-1.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-[#0E7A3D]/70">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TEMOIGNAGES ==================== */}
      <section className="bg-gradient-to-b from-[#EDF7F0] to-[#A7E3C4]/30 px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#D4AF37]/50">
              <Stars /> <span className="text-[#123B25]">4,8/5 — +1 500 lecteurs</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#123B25] sm:text-[28px]">Ils suivent enfin <span className="gpn-grad">une routine</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {TESTIMONIALS.map((r) => <TestimonialCard key={r.n} r={r} />)}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><GpnCTA onClick={openModal}>Rejoindre les lecteurs</GpnCTA></div>
        </div>
      </section>

      {/* ==================== TEMOIGNAGES WHATSAPP ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] via-[#F5F0E1] to-[#FBF7EE] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold ring-1 ring-[#D4AF37]/50">
              <Stars /> <span className="text-[#123B25]">97 % de lecteurs recommandent</span>
            </span>
            <h2 className="mt-3 text-[24px] font-black text-[#123B25] sm:text-[28px]">Ils nous ecrivent <span className="gpn-grad">sur WhatsApp</span></h2>
          </div>
          <div className="mt-6 space-y-3">
            {WHATSAPP_REVIEWS.map((r, i) => <WhatsAppBubble key={i} r={r} i={i} />)}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-[#0E7A3D]">🔒 Ebook recu immediatement · Livre paye seulement a la livraison</p>
          <div className="mx-auto mt-5 max-w-sm"><GpnCTA onClick={openModal}>Commander en toute confiance</GpnCTA></div>
        </div>
      </section>

      {/* ==================== OFFRE / URGENCE ==================== */}
      <section className="bg-gradient-to-b from-[#062A16] via-[#0E7A3D] to-[#065F46] px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F0D98C]">⏳ Dernieres heures au prix reduit</p>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="text-[15px] font-bold text-white/50 line-through">{fmt(OLD_PRICE)}</span>
            <span className="text-[40px] font-black leading-none text-white">{fmt(PRICE)}</span>
          </div>
          <div className="mt-5"><Countdown compact h={countdown.h} m={countdown.m} s={countdown.s} /></div>
          <div className="mx-auto mt-6 max-w-sm"><GpnCTA big onClick={openModal}>J'en profite avant minuit</GpnCTA></div>
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section className="bg-gradient-to-b from-[#FBF7EE] via-[#F5F0E1] to-[#EDF7F0] px-4 py-12">
        <div className="mx-auto max-w-[560px] text-center">
          <h2 className="text-[24px] font-black text-[#123B25] sm:text-[28px]">Arretez d'acheter. <span className="gpn-grad">Fabriquez enfin ce qui marche.</span></h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[13px] text-[#0E7A3D]/80">En ebook des maintenant, ou en livre imprime livre chez vous — paye a la reception.</p>
          <div className="mx-auto mt-6 max-w-sm"><GpnCTA big onClick={openModal}>Obtenir le guide · {fmt(PRICE)}</GpnCTA></div>
        </div>
      </section>

      {/* ==================== GARANTIES ==================== */}
      <section className="bg-gradient-to-b from-[#E9F7EF] to-[#FBF7EE] px-4 py-10">
        <div className="mx-auto grid max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: '📱', t: 'Ebook immediat', d: 'Recu en quelques minutes apres paiement, sur telephone, tablette ou ordinateur.' },
            { icon: '📦', t: 'Livre a la livraison', d: 'Livre chez vous : vous ne payez qu\'a la reception, en main propre.' },
            { icon: '🔒', t: 'Paiement securise', d: 'Mobile Money et cartes via Chariow. Aucune donnee de carte sur ce site.' },
          ].map((g) => (
            <div key={g.t} className="rounded-2xl bg-white/85 p-4 text-center ring-1 ring-[#10B981]/25">
              <span className="text-[24px]">{g.icon}</span>
              <p className="mt-2 text-[12px] font-black text-[#123B25]">{g.t}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#0E7A3D]/75">{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="bg-gradient-to-b from-[#FBF7EE] to-[#F5F0E1] px-4 py-12">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-center text-[24px] font-black text-[#123B25] sm:text-[28px]">Questions <span className="gpn-grad">frequentes</span></h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-[#0E7A3D]/15">
                <summary className="cursor-pointer text-[13.5px] font-bold text-[#0E7A3D]">{f.q}</summary>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOOTER / DISCLAIMER ==================== */}
      <footer className="bg-gradient-to-b from-[#062A16] to-[#04180D] px-4 pb-8 pt-8 text-center text-[10.5px] text-white/60">
        <p className="mx-auto max-w-3xl leading-relaxed">Ce guide est educatif et ne remplace pas un diagnostic medical. Les resultats varient selon la cause de la chute, la regularite, la genetique et l'etat du follicule. Consultez un dermatologue en cas de chute brutale, de plaques rondes, de douleurs, de pus, de croutes ou de zones lisses et brillantes.</p>
        <p className="mt-3 font-bold text-white/80">🌿 Guide Pousse Naturelle · Ebook & livre imprime</p>
        <p className="mt-1.5">© {new Date().getFullYear()} · Faire pousser vos cheveux naturellement</p>
      </footer>

      <PurchaseNotifs />

      <StickyCTA visible={sticky && !modal} onClick={openModal} />

      {/* ==================== MODAL — etape 1 : choix du format, puis formulaire ==================== */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={closeModal}>
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] bg-gradient-to-b from-[#FBF7EE] to-[#F5F0E1] p-5 shadow-2xl ring-1 ring-[#D4AF37]/40 sm:rounded-[1.75rem]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[17px] font-black text-[#123B25]">
                {step === 'choix' ? 'Comment voulez-vous recevoir votre guide ?' : 'Finaliser ma commande'}
              </h3>
              <button type="button" onClick={closeModal} className="text-2xl leading-none text-neutral-400 hover:text-neutral-600" aria-label="Fermer">×</button>
            </div>

            {/* ETAPE 1 — les deux formats, gros CTA glossy */}
            {step === 'choix' && (
              <div className="space-y-3.5">
                <p className="text-[12.5px] text-[#0E7A3D]/75">Le meme guide complet, dans le format qui vous convient.</p>

                {/* LIVRE IMPRIME — dore brillant glossy (mis en avant, 1er choix) */}
                <button
                  type="button"
                  onClick={() => { setFormErrPhy(''); trackOpenPhy(1); setStep('physique'); }}
                  className="group relative w-full overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#F0D98C] via-[#D4AF37] to-[#A0761B] p-[18px] text-left text-[#3A2800] shadow-[0_16px_40px_-10px_rgba(212,175,55,.55)] ring-1 ring-white/50 transition hover:scale-[1.015] hover:shadow-[0_20px_48px_-10px_rgba(176,118,27,.5)] active:scale-[0.99]"
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[26px] leading-none" aria-hidden>📦</span>
                        <span className="text-[19px] font-black tracking-wide">LIVRE IMPRIME</span>
                        <span className="rounded-full bg-[#3A2800]/85 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#F0D98C]">Je paie a la livraison</span>
                      </div>
                      <p className="mt-2 text-[12px] font-bold text-[#3A2800]/90">Livre chez vous — vous ne payez rien maintenant</p>
                      <p className="mt-1 text-[11px] text-[#3A2800]/70">Se lit sans ecran et s'annote a la main.</p>
                      <span className="gpn-cta-btn mt-3 inline-flex items-center gap-2 rounded-xl bg-[#3A2800] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.06em] text-[#F0D98C] shadow-lg ring-1 ring-white/30">
                        📦 Je choisis le livre <span aria-hidden>→</span>
                      </span>
                    </div>
                    <div className="shrink-0 text-right leading-none">
                      <div className="text-[22px] font-black">{fmt(PRICE_PHYSIQUE)}</div>
                      <div className="mt-1 text-[11px] text-[#3A2800]/55 line-through">{fmt(OLD_PRICE_PHYSIQUE)}</div>
                      <div className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#3A2800]/85 text-[16px] font-black text-[#F0D98C] transition group-hover:translate-x-0.5">→</div>
                    </div>
                  </div>
                </button>

                {/* EBOOK — emeraude brillant glossy */}
                <button
                  type="button"
                  onClick={() => { setFormErr(''); setStep('ebook'); }}
                  className="group relative w-full overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#10B981] via-[#0E7A3D] to-[#065F46] p-[18px] text-left text-white shadow-[0_16px_40px_-10px_rgba(14,122,61,.55)] ring-1 ring-white/30 transition hover:scale-[1.015] hover:shadow-[0_20px_48px_-10px_rgba(16,185,129,.55)] active:scale-[0.99]"
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[26px] leading-none" aria-hidden>📱</span>
                        <span className="text-[19px] font-black tracking-wide">EBOOK PDF</span>
                        <span className="rounded-full bg-white/25 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white ring-1 ring-white/40">Recu immediatement</span>
                      </div>
                      <p className="mt-2 text-[12px] font-semibold text-white/90">Paiement en ligne securise (Mobile Money, carte)</p>
                      <p className="mt-1 text-[11px] text-white/70">Telephone, tablette, ordinateur — il ne se perd pas.</p>
                      <span className="gpn-cta-btn mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.06em] text-[#065F46] shadow-lg ring-1 ring-white/60">
                        📱 Je choisis l'ebook <span aria-hidden>→</span>
                      </span>
                    </div>
                    <div className="shrink-0 text-right leading-none">
                      <div className="text-[22px] font-black">{fmt(PRICE_EBOOK)}</div>
                      <div className="mt-1 text-[11px] text-white/60 line-through">{fmt(OLD_PRICE_EBOOK)}</div>
                      <div className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-[16px] font-black ring-1 ring-white/40 transition group-hover:translate-x-0.5">→</div>
                    </div>
                  </div>
                </button>

                <p className="text-center text-[10.5px] text-neutral-400">🔒 Aucun paiement sur cette page : vous choisissez d'abord votre format.</p>
              </div>
            )}

            {/* ETAPE 2b — livre imprime : paiement a la livraison */}
            {step === 'physique' && (
              <>
                <button type="button" onClick={() => setStep('choix')} className="mb-3 text-[12px] font-bold text-neutral-400 hover:text-neutral-600">← Changer de format</button>
                <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#F0D98C]/50 to-[#D4AF37]/30 px-4 py-3 ring-1 ring-[#D4AF37]/50">
                  <span className="text-sm font-bold text-[#3A2800]">📦 Livre imprime</span>
                  <span className="text-lg font-black text-[#A0761B]">{fmt(PRICE_PHYSIQUE)}</span>
                </div>

                <form onSubmit={submitPhysique} className="space-y-3">
                  <input
                    type="text" required placeholder="Votre nom complet" value={formPhy.name}
                    onChange={(e) => setFormPhy((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-[#D4AF37]/40 bg-white px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25"
                  />
                  <input
                    type="text" required placeholder="Votre ville / commune" value={formPhy.city}
                    onChange={(e) => setFormPhy((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-xl border border-[#D4AF37]/40 bg-white px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25"
                  />
                  <input
                    type="tel" required placeholder="Votre numero de telephone" value={formPhy.phone}
                    onChange={(e) => setFormPhy((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl border border-[#D4AF37]/40 bg-white px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25"
                  />
                  <p className="text-[11px] text-neutral-400">Un conseiller vous appelle pour confirmer l'adresse et la date de livraison.</p>

                  {formErrPhy && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{formErrPhy}</p>}

                  <button
                    type="submit" disabled={sendingPhy}
                    className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#F0D98C] via-[#D4AF37] to-[#A0761B] py-4 text-[15px] font-black uppercase tracking-wide text-[#3A2800] shadow-[0_14px_34px_-10px_rgba(212,175,55,.6)] ring-1 ring-white/50 transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                    <span className="relative">{sendingPhy ? 'Envoi…' : `Commander · ${fmt(PRICE_PHYSIQUE)} a la livraison`}</span>
                  </button>
                  <p className="text-center text-[11px] text-neutral-400">🚚 Livraison a vos frais · Paiement a la reception — vous ne payez rien maintenant.</p>
                </form>
              </>
            )}

            {/* ETAPE 2a — ebook : paiement en ligne Chariow */}
            {step === 'ebook' && (
              <>
                <button type="button" onClick={() => setStep('choix')} className="mb-3 text-[12px] font-bold text-neutral-400 hover:text-neutral-600">← Changer de format</button>
                <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#10B981]/20 to-[#0E7A3D]/15 px-4 py-3 ring-1 ring-[#10B981]/40">
                  <span className="text-sm font-bold text-[#123B25]">📱 Ebook (PDF)</span>
                  <span className="text-lg font-black text-[#0E7A3D]">{fmt(PRICE_EBOOK)}</span>
                </div>

                <form onSubmit={submit} className="space-y-3">
                  <input
                    type="text" required placeholder="Votre nom complet" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-[#10B981]/40 bg-white px-4 py-3 text-sm outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/25"
                  />
                  <input
                    type="email" required placeholder="Votre email (recevra l'acces)" value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl border border-[#10B981]/40 bg-white px-4 py-3 text-sm outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/25"
                  />
                  <div className="flex gap-2">
                    <select
                      aria-label="Indicatif pays"
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      className="w-[44%] rounded-xl border border-[#10B981]/40 bg-white px-2 py-3 text-sm outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/25"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c.dial} · {c.name}</option>
                      ))}
                    </select>
                    <input
                      type="tel" required placeholder="Numero (sans l'indicatif)" value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="flex-1 rounded-xl border border-[#10B981]/40 bg-white px-4 py-3 text-sm outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/25"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400">Choisissez votre pays : le paiement affichera les moyens disponibles chez vous (Mobile Money, carte…).</p>

                  {formErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{formErr}</p>}

                  <button
                    type="submit" disabled={sending}
                    className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#10B981] via-[#0E7A3D] to-[#065F46] py-4 text-[15px] font-black uppercase tracking-wide text-white shadow-[0_14px_34px_-10px_rgba(14,122,61,.6)] ring-1 ring-white/30 transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                    <span className="relative">{sending ? 'Redirection…' : `Recevoir mon ebook · ${fmt(PRICE_EBOOK)}`}</span>
                  </button>
                  <p className="text-center text-[11px] text-neutral-400">🔒 Paiement securise par Chariow · Mobile Money & carte. Aucune donnee de carte sur ce site.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
