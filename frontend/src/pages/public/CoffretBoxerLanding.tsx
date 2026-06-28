/**
 * Tunnel de vente — Coffrets Boxers Homme Premium (slug : coffret-boxer-homme)
 *
 * Particularites :
 *  - 2 offres en parallele : Coffret Tommy Hilfiger (3 boxers, {fmtP(PACK + DELIVERY_FEE_CI)} F) et
 *    Coffret Luxe Homme (3 boxers, {fmtP(PACK + DELIVERY_FEE_CI)} F).
 *  - Le wording "Louis Vuitton" est volontairement evite (risque de marque non
 *    certifiee) ; les visuels sont conserves mais le texte parle de "luxe",
 *    "prestige" et "design premium" uniquement.
 *  - Aucune integration backend Obgestion : le formulaire de commande POST
 *    sur l'endpoint PHP Versace (`/coffret-versace/order.php`) qui
 *    notifie Telegram + sauvegarde CSV/JSON cote VPS.
 *  - Toutes les classes CSS sont prefixees `cbh-` pour eviter les conflits avec
 *    le theme WordPress quand la page est embarquee.
 *
 * Palette : ivoire chaud, crème, accents or / rouge premium, cartes blanches
 * ombrées — lisible, lumineux, CTA animés (pulse léger).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPageView } from '../../utils/pageTracking';
import { DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

/**
 * Endpoint PHP qui recoit les commandes (meme backend que la page Versace).
 * Notifie Telegram + sauvegarde CSV/JSON cote VPS.
 */
const ORDER_ENDPOINT = 'https://obrille.com/coffret-versace/order.php';

const SLUG = 'coffret-boxer-homme';
const META_PIXEL_ID = '26809431761984777';
const PRODUCT_CODE = 'COFFRET_BOXER_HOMME';
const M = (n: string) => `/coffret-boxer-homme/${n}`;

type ProductKey = 'tommy' | 'luxe' | 'both';

const fmtP = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const PACK = 9900;
const DUO = 16900;
const PRODUCTS: Record<ProductKey, { label: string; price: number; sub: string }> = {
  tommy: { label: `Coffret de 3 boxers Tommy Hilfiger - ${fmtP(PACK + DELIVERY_FEE_CI)} F`, price: PACK + DELIVERY_FEE_CI, sub: '3 boxers Tommy Hilfiger' },
  luxe: { label: `Coffret de 3 boxers Louis Vuitton - ${fmtP(PACK + DELIVERY_FEE_CI)} F`, price: PACK + DELIVERY_FEE_CI, sub: '3 boxers Louis Vuitton' },
  both: { label: `Les deux coffrets (6 boxers) - ${fmtP(DUO + DELIVERY_FEE_CI)} F`, price: DUO + DELIVERY_FEE_CI, sub: '6 boxers (Tommy + Louis Vuitton)' },
};

const TOMMY_IMAGES = Array.from({ length: 9 }, (_, i) => M(`tommy-${i + 1}.webp`));
const LUXE_IMAGES = Array.from({ length: 5 }, (_, i) => M(`luxe-${i + 1}.webp`));

/* ---------------- Donnees defilantes (top bars + notifications) ---------------- */

const TOPBAR_DARK_MSGS = [
  '✓ Paiement à la livraison',
  '✓ Livraison express partout en Côte d\'Ivoire',
  '✓ Coffret 3 boxers premium',
  '✓ Coton stretch · Confort longue durée',
  '✓ Idéal pour offrir',
  '✓ Service client rapide',
  '✓ Emballage cadeau soigné',
  '✓ Stock vérifié',
];

const TOPBAR_GOLD_MSGS = [
  '⚡ OFFRE FLASH AUJOURD\'HUI',
  '🎁 Coffret 3 boxers à 11 400 F',
  '🔥 Stock limité — quelques coffrets restants',
  '💎 Édition Tommy & Luxe',
  '🚚 Livraison rapide partout en CI',
  '⏰ Profitez avant la fin de l\'offre',
];

const RECENT_ORDERS = [
  { nom: 'Kouassi', commune: 'Cocody', produit: 'Tommy Hilfiger', mins: 4 },
  { nom: 'Aïcha', commune: 'Yopougon', produit: 'Luxe', mins: 12 },
  { nom: 'Brou', commune: 'Marcory', produit: 'Tommy Hilfiger', mins: 19 },
  { nom: 'Salif', commune: 'Bouaké', produit: 'Luxe', mins: 27 },
  { nom: 'Aminata', commune: 'Treichville', produit: 'Tommy Hilfiger', mins: 38 },
  { nom: 'Konaté', commune: 'Abobo', produit: 'Luxe', mins: 51 },
  { nom: 'Ouattara', commune: 'Bingerville', produit: 'Tommy Hilfiger', mins: 64 },
  { nom: 'Diabaté', commune: 'San-Pédro', produit: 'Luxe', mins: 78 },
  { nom: 'Mariam', commune: 'Plateau', produit: 'Tommy Hilfiger', mins: 92 },
  { nom: 'Yao', commune: 'Adjamé', produit: 'Luxe', mins: 105 },
  { nom: 'Fatou', commune: 'Daloa', produit: 'Tommy Hilfiger', mins: 118 },
  { nom: 'Adama', commune: 'Korhogo', produit: 'Luxe', mins: 134 },
];

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  };
  if (!window._fbq) window._fbq = f;
  f.push = f;
  f.loaded = true;
  f.version = '2.0';
  f.queue = [];
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

/* ---------------- Hooks utilitaires ---------------- */

function useOnScreen(rootMargin = '320px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Compte a rebours qui descend jusqu'a minuit local puis reset au jour suivant. */
function useEndOfDayCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return useMemo(() => {
    const d = new Date(now);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    let diff = Math.max(0, Math.floor((end.getTime() - now) / 1000));
    const h = Math.floor(diff / 3600);
    diff -= h * 3600;
    const m = Math.floor(diff / 60);
    const s = diff - m * 60;
    return { h: pad(h), m: pad(m), s: pad(s) };
  }, [now]);
}

/* ---------------- Image lazy avec ratio natif ---------------- */

function LazyImg({
  src,
  alt,
  priority,
  className = '',
  rounded = true,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  rounded?: boolean;
}) {
  const { ref, visible } = useOnScreen('320px');
  const inner =
    'block h-auto w-full object-contain ' + (rounded ? 'rounded-2xl' : '');
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchpriority est valide cote DOM mais pas dans les types React
          fetchpriority="high"
          className={inner}
        />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {visible ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" className={inner} />
      ) : (
        <div className={`aspect-[4/5] w-full bg-gradient-to-br from-stone-100 to-amber-50/80 ${rounded ? 'rounded-2xl' : ''}`} />
      )}
    </div>
  );
}

/* ---------------- CTA fluide premium reutilisable ---------------- */

function FluidCTA({
  onClick,
  children,
  variant = 'gold',
  large,
  className = '',
}: {
  onClick: () => void;
  children: ReactNode;
  variant?: 'gold' | 'red' | 'navy' | 'wa';
  large?: boolean;
  className?: string;
}) {
  const palettes: Record<string, string> = {
    gold:
      'from-amber-300 via-yellow-200 to-amber-400 text-slate-900 shadow-[0_18px_40px_-12px_rgba(251,191,36,0.55)]',
    red:
      'from-rose-500 via-red-500 to-rose-600 text-white shadow-[0_18px_40px_-12px_rgba(225,29,72,0.55)]',
    navy:
      'from-slate-800 via-slate-700 to-slate-800 text-white shadow-[0_18px_40px_-12px_rgba(30,41,59,0.35)] ring-1 ring-slate-300/50',
    wa: 'from-emerald-500 via-emerald-400 to-emerald-500 text-white shadow-[0_18px_40px_-12px_rgba(16,185,129,0.55)]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cbh-cta cbh-cta-bounce group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${palettes[variant]} ${
        large ? 'px-7 py-4 text-base font-extrabold' : 'px-5 py-3 text-sm font-bold'
      } tracking-wide transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.03] active:scale-95 ${className}`}
    >
      <span className="cbh-sheen pointer-events-none absolute inset-0" aria-hidden />
      <span className="relative">{children}</span>
      <svg
        className="relative h-4 w-4 transition-transform group-hover:translate-x-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      >
        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ---------------- Carte produit ---------------- */

function ProductCard({
  variant,
  image,
  title,
  brand,
  description,
  bullets,
  badge,
  ctaLabel,
  onOrder,
}: {
  variant: 'tommy' | 'luxe';
  image: string;
  title: string;
  brand: string;
  description: string;
  bullets: string[];
  badge: string;
  ctaLabel: string;
  onOrder: () => void;
}) {
  const ringColor =
    variant === 'tommy' ? 'ring-rose-300/40' : 'ring-amber-300/50';
  const gradient =
    variant === 'tommy'
      ? 'from-rose-500 via-red-500 to-blue-700'
      : 'from-amber-300 via-yellow-200 to-amber-500';
  return (
    <article
      className={`cbh-card relative flex flex-col overflow-hidden rounded-3xl bg-white/95 p-5 sm:p-7 backdrop-blur-xl ring-1 ${ringColor} shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)]`}
    >
      <div
        className={`absolute -top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 rounded-full bg-gradient-to-br ${gradient} opacity-[0.14] blur-3xl pointer-events-none`}
      />
      <div className="relative">
        <span
          className={`absolute -top-1 left-0 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${gradient} px-3 py-1 text-[11px] font-extrabold tracking-wider text-white shadow-lg`}
        >
          {badge}
        </span>
        <div className="mt-7 overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
          <LazyImg src={image} alt={title} rounded={false} />
        </div>
      </div>
      <div className="relative mt-5 flex flex-1 flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700/90">{brand}</p>
        <h3 className="mt-1 text-2xl font-black leading-tight text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <svg
                className={`h-4 w-4 shrink-0 ${variant === 'tommy' ? 'text-rose-300' : 'text-amber-300'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
              >
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Prix</div>
            <div className="text-3xl font-black text-slate-900">
              {fmtP(PACK + DELIVERY_FEE_CI)} <span className="text-base font-bold text-amber-600">FCFA</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500">Paiement à la livraison</div>
          </div>
          <FluidCTA
            onClick={onOrder}
            variant={variant === 'tommy' ? 'red' : 'gold'}
          >
            {ctaLabel}
          </FluidCTA>
        </div>
      </div>
    </article>
  );
}

/* ---------------- Bloc media + texte court + CTA ---------------- */

function Fiche({
  image,
  text,
  highlight,
  ctaLabel,
  ctaVariant = 'gold',
  bgClass = '',
  onOrder,
}: {
  image: string;
  text: string;
  /** mots a souligner avec le degrade (mis en valeur visuellement) */
  highlight?: string[];
  ctaLabel: string;
  ctaVariant?: 'gold' | 'red' | 'navy';
  bgClass?: string;
  onOrder: () => void;
}) {
  let rendered: ReactNode = text;
  if (highlight && highlight.length) {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${highlight.map(escape).join('|')})`, 'gi'));
    rendered = parts.map((p, i) =>
      highlight.some((h) => h.toLowerCase() === p.toLowerCase()) ? (
        <span key={i} className="cbh-grad-text font-extrabold">
          {p}
        </span>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  }
  return (
    <section className={`cbh-fiche relative overflow-hidden py-10 sm:py-14 ${bgClass}`}>
      <div className="mx-auto max-w-3xl px-4">
        <div className="overflow-hidden rounded-[26px] bg-white p-3 ring-1 ring-slate-200/90 shadow-[0_28px_56px_-32px_rgba(15,23,42,0.2)]">
          <LazyImg src={image} alt="Coffret boxer homme" rounded />
        </div>
        <p className="mt-6 text-center text-base sm:text-lg leading-relaxed text-slate-700">
          {rendered}
        </p>
        <div className="mt-5 flex justify-center">
          <FluidCTA onClick={onOrder} variant={ctaVariant} large>
            {ctaLabel}
          </FluidCTA>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Galerie cartes hover ---------------- */

function Gallery({
  title,
  subtitle,
  images,
  accent,
  onOrder,
}: {
  title: string;
  subtitle: string;
  images: string[];
  accent: 'rose' | 'amber';
  onOrder: () => void;
}) {
  const accentMap = {
    rose: {
      ring: 'ring-rose-300/50',
      grad: 'from-rose-500/80 to-blue-700/80',
      btn: 'red' as const,
    },
    amber: {
      ring: 'ring-amber-300/60',
      grad: 'from-amber-400/80 to-amber-700/80',
      btn: 'gold' as const,
    },
  }[accent];
  return (
    <section className="cbh-gallery relative px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700/80">{subtitle}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            <span className="cbh-grad-text">{title}</span>
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <figure
              key={img}
              className={`cbh-photo group relative overflow-hidden rounded-3xl bg-white ring-1 ${accentMap.ring} shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)]'}`}
            >
              <div className="overflow-hidden">
                <img
                  src={img}
                  alt={`${title} - vue ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${accentMap.grad} opacity-0 transition-opacity duration-500 group-hover:opacity-90`}
              />
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-4 pb-4 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold drop-shadow">3 boxers · {fmtP(PACK + DELIVERY_FEE_CI)} F</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider backdrop-blur">
                    Stock limité
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <FluidCTA onClick={onOrder} variant={accentMap.btn} large>
            Commander ce coffret
          </FluidCTA>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Avantages glassmorphism ---------------- */

const ADVANTAGES: { icon: ReactNode; title: string; sub: string }[] = [
  {
    title: 'Paiement à la livraison',
    sub: 'Vous payez uniquement quand vous recevez',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 10h.01M18 10h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Livraison rapide',
    sub: 'Express partout en Côte d’Ivoire',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7" />
        <circle cx="7.5" cy="17" r="1.8" />
        <circle cx="17" cy="17" r="1.8" />
      </svg>
    ),
  },
  {
    title: 'Coffret premium',
    sub: 'Packaging soigné, prêt à offrir',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8h18v12H3z" />
        <path d="M3 8l3-4h12l3 4M12 8v12M8 12h8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Idéal pour offrir',
    sub: 'Le cadeau homme intemporel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 8c-2-3-7-2-7 2 0 3 7 8 7 8s7-5 7-8c0-4-5-5-7-2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Confort quotidien',
    sub: 'Coton premium, coupe ajustée',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 4h14l-2 16H7L5 4z" strokeLinejoin="round" />
        <path d="M9 4v3M15 4v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Stock limité',
    sub: 'Quelques coffrets disponibles',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/* ---------------- Toast bonjour (rappel WA) ---------------- */

function GhostToast({ children }: { children: ReactNode }) {
  return (
    <div className="cbh-ghost pointer-events-none absolute inset-0 flex items-end justify-center pb-3">
      <span className="rounded-full bg-emerald-500/90 px-4 py-1 text-[11px] font-bold text-white shadow-lg">
        {children}
      </span>
    </div>
  );
}

/* ---------------- Modal commande -> POST PHP coffret-versace ---------------- */

function OrderModal({
  open,
  initialProduct,
  onClose,
}: {
  open: boolean;
  initialProduct: ProductKey;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [commune, setCommune] = useState('');
  const [product, setProduct] = useState<ProductKey>(initialProduct);
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setProduct(initialProduct);
      setErrorMsg('');
      setSubmitted(false);
    }
  }, [open, initialProduct]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const total = PRODUCTS[product].price * qty;
  const totalFmt = total.toLocaleString('fr-FR') + ' FCFA';

  async function submit() {
    if (!nom.trim() || !tel.trim() || !commune.trim()) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    // L`endpoint PHP attend name/city/phone/quantity. On suffixe le nom avec
    // le produit choisi pour que ca apparaisse dans Telegram + CSV sans
    // toucher au PHP existant.
    const payload = {
      name: `${nom.trim()} — ${PRODUCTS[product].label}`,
      city: commune.trim(),
      phone: tel.trim(),
      quantity: qty,
      // champs ignores cote PHP mais utiles si quelqu'un lit la requete
      product: PRODUCTS[product].label,
      product_key: product,
      total_estimated: total,
      source: 'coffret-boxer-homme',
      website: '', // honeypot vide
    };

    try {
      const res = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error || `Erreur ${res.status}`);
      }

      // Stocke le contexte pour la page merci (recap commande visible apres redirection)
      try {
        sessionStorage.setItem(
          'cbh_last_order',
          JSON.stringify({
            ref: data.orderId || '',
            productKey: product,
            productLabel: PRODUCTS[product].label,
            productSub: PRODUCTS[product].sub,
            qty,
            total,
            nom: nom.trim(),
            tel: tel.trim(),
            commune: commune.trim(),
            ts: Date.now(),
          }),
        );
      } catch {
        /* sessionStorage indispo (mode prive iOS) → on continue quand meme */
      }

      const params = new URLSearchParams({
        ref: data.orderId || '',
        product,
        qty: String(qty),
      });
      navigate(`/coffret-boxer-homme/merci?${params.toString()}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Connexion impossible. Réessayez dans quelques secondes.');
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (v: string) => submitted && !v.trim();

  return (
    <div
      className="cbh-modal fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-md sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cbh-modal-title"
    >
      <div
        className="cbh-modal-card relative w-full max-w-md max-h-[100svh] overflow-y-auto rounded-t-3xl bg-white p-5 ring-1 ring-amber-200/80 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <>
            <div className="text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg">
                <svg className="h-6 w-6 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 8h18v12H3z" />
                </svg>
              </div>
              <h3 id="cbh-modal-title" className="mt-3 text-xl font-black text-slate-900">
                <span className="cbh-grad-text">Commander mon coffret</span>
              </h3>
              <p className="mt-1 text-xs text-slate-500">Réponse sous quelques minutes · Paiement à la livraison</p>
            </div>

            <div className="mt-5 space-y-3 text-left">
              <div>
                <label className="cbh-lbl">Nom complet</label>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  type="text"
                  autoComplete="name"
                  placeholder="Ex : Kouassi Jean"
                  className={`cbh-input ${invalid(nom) ? 'cbh-input-err' : ''}`}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="cbh-lbl">Téléphone</label>
                <input
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="07 ou 05 ou 01"
                  className={`cbh-input ${invalid(tel) ? 'cbh-input-err' : ''}`}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="cbh-lbl">Commune / Ville</label>
                <input
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Ex : Cocody, Yopougon, Bouaké…"
                  className={`cbh-input ${invalid(commune) ? 'cbh-input-err' : ''}`}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="cbh-lbl">Produit choisi</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value as ProductKey)}
                  className="cbh-input cbh-select"
                  disabled={submitting}
                >
                  {(Object.keys(PRODUCTS) as ProductKey[]).map((k) => (
                    <option key={k} value={k}>
                      {PRODUCTS[k].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cbh-lbl">Quantité</label>
                <select
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="cbh-input cbh-select"
                  disabled={submitting}
                >
                  <option value={1}>1 coffret</option>
                  <option value={2}>2 coffrets</option>
                  <option value={3}>3 coffrets</option>
                </select>
              </div>

              <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200/70">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Prix estimé</span>
                  <span className="text-xl font-black text-amber-700">{totalFmt}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Le total final sera confirmé par téléphone avec les frais de livraison de votre zone.
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="cbh-cta cbh-cta-bounce group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-6 py-4 text-base font-extrabold text-slate-900 shadow-[0_18px_40px_-12px_rgba(251,191,36,0.55)] transition disabled:cursor-not-allowed disabled:opacity-70 disabled:animate-none"
              >
                <span className="cbh-sheen pointer-events-none absolute inset-0" aria-hidden />
                {submitting ? (
                  <>
                    <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                    <span className="relative">Envoi en cours…</span>
                  </>
                ) : (
                  <>
                    <span className="relative">Valider ma commande</span>
                    <svg className="relative h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-500">
                En validant, vous acceptez d'être recontacté pour confirmer la livraison.
              </p>
            </div>
          </>
      </div>
    </div>
  );
}

/* ---------------- Barres defilantes top (2 niveaux) ---------------- */

function TopBars() {
  // Concatene + duplique pour boucle infinie fluide
  const dark = TOPBAR_DARK_MSGS.join('   •   ');
  const gold = TOPBAR_GOLD_MSGS.join('   •   ');
  return (
    <div className="cbh-topbars sticky top-0 z-50 isolate">
      <div className="cbh-topbar cbh-topbar-dark">
        <div className="cbh-topbar-track">
          <span>{dark}</span>
          <span aria-hidden="true">{dark}</span>
        </div>
      </div>
      <div className="cbh-topbar cbh-topbar-gold">
        <div className="cbh-topbar-track cbh-topbar-track-rev">
          <span>{gold}</span>
          <span aria-hidden="true">{gold}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Toast notifications achats recents ---------------- */

function RecentOrderToast() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'hidden' | 'in' | 'visible' | 'out'>('hidden');

  useEffect(() => {
    let cancelled = false;
    let timers: number[] = [];

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
    };

    const showCycle = (i: number) => {
      if (cancelled) return;
      setIndex(i);
      setPhase('in');
      schedule(() => {
        setPhase('visible');
        schedule(() => {
          setPhase('out');
          schedule(() => {
            setPhase('hidden');
            schedule(() => showCycle((i + 1) % RECENT_ORDERS.length), 3500);
          }, 450);
        }, 6500);
      }, 50);
    };

    // Premier toast apres 5s
    schedule(() => showCycle(0), 5000);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  if (phase === 'hidden') return null;

  const order = RECENT_ORDERS[index];
  const timeLabel =
    order.mins < 60
      ? `il y a ${order.mins} min`
      : `il y a ${Math.floor(order.mins / 60)} h${order.mins % 60 ? ` ${order.mins % 60}` : ''}`;

  return (
    <div
      className={`cbh-toast fixed bottom-20 left-3 z-[60] sm:bottom-4 sm:left-4 ${
        phase === 'in' ? 'cbh-toast-in' : phase === 'out' ? 'cbh-toast-out' : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-2.5 pr-4 shadow-[0_18px_48px_-18px_rgba(15,23,42,0.35)] ring-1 ring-emerald-200/80 backdrop-blur-md">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="cbh-pulse absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-extrabold text-slate-900">
            {order.nom} <span className="font-semibold text-slate-500">à {order.commune}</span>
          </p>
          <p className="text-[11px] text-slate-600">
            vient de commander <span className="font-bold text-slate-800">{order.produit}</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            <span className="cbh-pulse mr-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-emerald-500" />
            {timeLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page principale ---------------- */

export default function CoffretBoxerLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [picked, setPicked] = useState<ProductKey>('tommy');
  const cd = useEndOfDayCountdown();
  const pixelFired = useRef(false);

  const open = useCallback((product: ProductKey = 'tommy') => {
    setPicked(product);
    setModalOpen(true);
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'InitiateCheckout', {
        content_name: PRODUCTS[product].label,
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: PRODUCTS[product].price,
        currency: 'XOF',
      });
    }
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        try {
          window.scrollTo({ top: window.scrollY, behavior: 'instant' as ScrollBehavior });
        } catch {
          /* noop */
        }
      });
    }
  }, []);
  const close = useCallback(() => setModalOpen(false), []);

  /* Document title + tracking analytics + Meta Pixel */
  useEffect(() => {
    const prev = document.title;
    document.title = `Coffrets Boxers Homme Premium — ${fmtP(PACK + DELIVERY_FEE_CI)} F | Tommy & Luxe`;
    trackPageView(SLUG);
    if (!pixelFired.current && META_PIXEL_ID) {
      pixelFired.current = true;
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Coffrets Boxers Homme Premium',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: PRODUCTS.tommy.price,
        currency: 'XOF',
      });
    }
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="cbh-root antialiased">
      <CoffretCSS />

      {/* Barres defilantes premium en haut de page */}
      <TopBars />

      {/* Hero */}
      <header className="cbh-hero relative overflow-hidden">
        <div className="cbh-hero-bg absolute inset-0" aria-hidden />
        <div className="cbh-hero-grain absolute inset-0 opacity-[0.07]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:pt-16">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-rose-700 ring-1 ring-rose-200/80 shadow-sm">
              <span className="cbh-pulse h-2 w-2 rounded-full bg-rose-500" /> Offre limitée
            </span>
          </div>
          <h1 className="mt-5 text-center text-3xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            <span className="cbh-grad-gold block">Coffrets Boxers Homme</span>
            <span className="cbh-grad-red block">Premium</span>
          </h1>

          {/* Hero visuels remontes : c'est la 1ere chose que voit le client */}
          <div className="mx-auto mt-6 grid max-w-4xl gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-rose-300/40 shadow-[0_30px_70px_-30px_rgba(225,29,72,0.5)]">
              <LazyImg src={M('tommy-1.webp')} alt="Coffret Tommy Hilfiger" priority rounded={false} />
              <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                Tommy
              </span>
              <button
                type="button"
                onClick={() => open('tommy')}
                className="cbh-cta cbh-cta-bounce absolute inset-x-3 bottom-3 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg sm:text-sm"
              >
                Commander Tommy
              </button>
            </div>
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-amber-300/50 shadow-[0_30px_70px_-30px_rgba(251,191,36,0.45)]">
              <LazyImg src={M('luxe-1.webp')} alt="Coffret Luxe Homme" priority rounded={false} />
              <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-900 shadow-lg">
                Luxe
              </span>
              <button
                type="button"
                onClick={() => open('luxe')}
                className="cbh-cta cbh-cta-bounce absolute inset-x-3 bottom-3 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-900 shadow-lg sm:text-sm"
              >
                Commander Luxe
              </button>
            </div>
          </div>

          <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">Fin de l'offre dans</span>
          </div>
          <div className="mx-auto mt-2 flex max-w-md items-center justify-center gap-2">
            {[
              { v: cd.h, l: 'Heures' },
              { v: cd.m, l: 'Min' },
              { v: cd.s, l: 'Sec' },
            ].map((b, i) => (
              <div
                key={i}
                className="cbh-clock w-20 rounded-2xl bg-white/90 px-2 py-3 text-center ring-1 ring-amber-200/80 shadow-md backdrop-blur"
              >
                <div className="text-3xl font-black tracking-tight text-amber-700 tabular-nums">{b.v}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">{b.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <FluidCTA onClick={() => open('tommy')} variant="gold" large>
              Commander maintenant
            </FluidCTA>
          </div>
        </div>
      </header>

      {/* Choix coffret */}
      <section className="cbh-choice relative px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            <span className="cbh-grad-text">Choisissez votre coffret</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-600 sm:text-base">
            Deux ambiances. Un même prix. Le confort premium pour homme.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ProductCard
              variant="tommy"
              image={TOMMY_IMAGES[1]}
              title="Coffret Tommy Hilfiger"
              brand="Tommy Hilfiger · Édition coffret"
              description="Un coffret élégant avec 3 boxers confortables pour un style premium au quotidien."
              bullets={['3 boxers (noir, gris, bleu nuit)', 'Confort coton stretch', 'Élégant au bureau', 'Idéal pour offrir']}
              badge="Coffret 3 boxers"
              ctaLabel="Commander Tommy"
              onOrder={() => open('tommy')}
            />
            <ProductCard
              variant="luxe"
              image={LUXE_IMAGES[0]}
              title="Coffret Luxe Homme"
              brand="Style prestige · Design premium"
              description="Un coffret au design prestige, parfait pour les hommes qui aiment le style et le confort."
              bullets={['Design luxe', 'Confort quotidien', 'Coffret cadeau', 'Qualité premium']}
              badge="Coffret 3 boxers"
              ctaLabel="Commander Luxe"
              onOrder={() => open('luxe')}
            />
          </div>
        </div>
      </section>

      {/* Bandeau marquee premium */}
      <div className="cbh-marquee bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 py-2 text-slate-900">
        <div className="cbh-marquee-track text-xs font-extrabold uppercase tracking-[0.32em]">
          <span>Stock limité ✦ 3 boxers premium ✦ Paiement à la livraison ✦ Cadeau homme ✦ Express CI ✦ Coton stretch ✦</span>
          <span aria-hidden>Stock limité ✦ 3 boxers premium ✦ Paiement à la livraison ✦ Cadeau homme ✦ Express CI ✦ Coton stretch ✦</span>
        </div>
      </div>

      {/* Fiches alternées Tommy ↔ Luxe */}
      <Fiche
        image={TOMMY_IMAGES[2]}
        text="Un coffret chic, confortable et parfait pour votre quotidien."
        highlight={['chic', 'confortable', 'quotidien']}
        ctaLabel="Je commande Tommy"
        ctaVariant="red"
        bgClass="cbh-section-alt"
        onOrder={() => open('tommy')}
      />
      <Fiche
        image={LUXE_IMAGES[1]}
        text="Le style premium à petit prix, idéal pour vous ou pour offrir."
        highlight={['style premium', 'idéal', 'offrir']}
        ctaLabel="Je commande Luxe"
        ctaVariant="gold"
        bgClass="cbh-section-warm"
        onOrder={() => open('luxe')}
      />
      <Fiche
        image={TOMMY_IMAGES[3]}
        text="3 couleurs sobres, faciles à porter, parfaites pour homme."
        highlight={['3 couleurs', 'sobres', 'parfaites']}
        ctaLabel="J'ajoute Tommy"
        ctaVariant="navy"
        bgClass="cbh-section-alt"
        onOrder={() => open('tommy')}
      />
      <Fiche
        image={LUXE_IMAGES[2]}
        text="Un design prestige pour un style homme affirmé."
        highlight={['prestige', 'affirmé']}
        ctaLabel="J'achète le Luxe"
        ctaVariant="gold"
        bgClass="cbh-section-warm"
        onOrder={() => open('luxe')}
      />

      {/* Galerie Tommy Hilfiger */}
      <Gallery
        title="Galerie Tommy Hilfiger"
        subtitle="Coffret 3 boxers · Édition signature"
        images={TOMMY_IMAGES}
        accent="rose"
        onOrder={() => open('tommy')}
      />

      {/* Citation entre deux galeries */}
      <Fiche
        image={TOMMY_IMAGES[5]}
        text="Confort, style et qualité dans un seul coffret."
        highlight={['Confort', 'style', 'qualité']}
        ctaLabel="Je commande Tommy"
        ctaVariant="red"
        bgClass="cbh-section-alt"
        onOrder={() => open('tommy')}
      />

      {/* Galerie Coffret Luxe */}
      <Gallery
        title="Galerie Coffret Luxe Homme"
        subtitle="Design prestige · Style affirmé"
        images={LUXE_IMAGES}
        accent="amber"
        onOrder={() => open('luxe')}
      />

      {/* Bloc final luxe */}
      <Fiche
        image={LUXE_IMAGES[3]}
        text="Élégance, confort et finition premium."
        highlight={['Élégance', 'confort', 'finition premium']}
        ctaLabel="Commander le Luxe"
        ctaVariant="gold"
        bgClass="cbh-section-warm"
        onOrder={() => open('luxe')}
      />
      <Fiche
        image={LUXE_IMAGES[4]}
        text="Un look luxe à prix accessible."
        highlight={['look luxe', 'accessible']}
        ctaLabel="J'en profite"
        ctaVariant="gold"
        bgClass="cbh-section-alt"
        onOrder={() => open('luxe')}
      />

      {/* Avantages */}
      <section className="cbh-adv relative px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            <span className="cbh-grad-gold">Pourquoi vous allez aimer</span>
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map((a) => (
              <div
                key={a.title}
                className="cbh-glass relative flex items-start gap-4 rounded-2xl bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-20px_rgba(15,23,42,0.16)]"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow-lg">
                  <span className="block h-6 w-6">{a.icon}</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{a.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section urgence */}
      <section className="cbh-urgency relative overflow-hidden bg-gradient-to-br from-rose-700 via-rose-600 to-amber-600 px-4 py-14 sm:py-16">
        <div className="absolute inset-0 cbh-hero-grain opacity-10" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-[11px] font-extrabold uppercase tracking-[0.25em] text-white ring-1 ring-white/20 backdrop-blur">
            <span className="cbh-pulse h-2 w-2 rounded-full bg-white" /> Stock limité
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
            Offre spéciale aujourd'hui
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-rose-50/90">
            Profitez du <strong>coffret 3 boxers à seulement {fmtP(PACK + DELIVERY_FEE_CI)} F</strong> avant la fin de la promo.
          </p>
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2">
            {[
              { v: cd.h, l: 'H' },
              { v: cd.m, l: 'M' },
              { v: cd.s, l: 'S' },
            ].map((b, i) => (
              <div
                key={i}
                className="w-20 rounded-2xl bg-slate-950/40 px-2 py-3 text-center ring-1 ring-white/30 backdrop-blur"
              >
                <div className="text-3xl font-black tabular-nums text-white">{b.v}</div>
                <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-widest text-rose-100">{b.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex justify-center">
            <FluidCTA onClick={() => open('tommy')} variant="gold" large>
              Commander avant la fin de l'offre
            </FluidCTA>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="cbh-faq px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            <span className="cbh-grad-text">Vos questions</span>
          </h2>
          <div className="mt-8 space-y-3">
            {[
              {
                q: 'Combien de boxers dans le coffret ?',
                a: 'Chaque coffret contient 3 boxers homme premium.',
              },
              {
                q: 'Le prix est combien ?',
                a: `Le coffret est à ${fmtP(PACK + DELIVERY_FEE_CI)} F. Le pack 2 coffrets est à ${fmtP(DUO + DELIVERY_FEE_CI)} F.`,
              },
              {
                q: 'Comment commander ?',
                a: 'Cliquez sur le bouton commander, remplissez le formulaire et validez. Notre équipe vous appelle sous quelques minutes pour confirmer votre commande.',
              },
              {
                q: 'Le paiement se fait comment ?',
                a: 'Paiement à la livraison. Vous payez en cash quand vous recevez votre coffret.',
              },
              {
                q: 'Où livrez-vous ?',
                a: 'Nous livrons selon disponibilité partout en Côte d\'Ivoire. Les frais et délais exacts vous seront confirmés au téléphone avec votre commune.',
              },
            ].map((f) => (
              <details
                key={f.q}
                className="cbh-faq-item group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/90 transition-all open:shadow-md open:ring-amber-200/60"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-extrabold text-slate-900">
                  <span>{f.q}</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 transition-transform group-open:rotate-45">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="cbh-footer px-4 py-10 text-center text-xs text-slate-500">
        <p className="font-bold uppercase tracking-[0.3em] text-slate-600">Coffrets boxers homme</p>
        <p className="mt-2">Tommy Hilfiger · Coffret Luxe Homme</p>
        <p className="mt-1">Paiement à la livraison · Livraison rapide en Côte d'Ivoire</p>
      </footer>

      {/* Sticky CTA mobile */}
      <div
        className="cbh-sticky fixed inset-x-0 bottom-0 z-40 border-t border-amber-200/80 bg-white/95 px-3 py-2 shadow-[0_-12px_40px_-16px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:hidden"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Aujourd'hui</div>
            <div className="text-base font-black text-slate-900">
              <span className="cbh-grad-text">{fmtP(PACK + DELIVERY_FEE_CI)} F</span>{' '}
              <span className="text-xs text-slate-500">le coffret</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => open('tommy')}
            className="cbh-cta cbh-cta-bounce relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-5 py-3 text-sm font-extrabold text-slate-900 shadow-[0_18px_40px_-12px_rgba(251,191,36,0.55)]"
          >
            <span className="cbh-sheen pointer-events-none absolute inset-0" aria-hidden />
            <span className="relative">Commander</span>
          </button>
        </div>
      </div>

      {/* Toast notifications d'achats recents (social proof / FOMO) */}
      <RecentOrderToast />

      <OrderModal open={modalOpen} initialProduct={picked} onClose={close} />
    </div>
  );
}

/* ---------------- Styles isolés (scope cbh-) ---------------- */

function CoffretCSS() {
  return (
    <style>{`
      .cbh-root {
        font-family: 'Inter','Poppins',system-ui,-apple-system,'Segoe UI',sans-serif;
        color: #1e293b;
        background: linear-gradient(180deg, #fffdfb 0%, #faf7f2 28%, #f0f9ff 100%);
        min-height: 100vh;
        padding-bottom: 96px;
        scroll-behavior: smooth;
      }
      @media (min-width: 640px) { .cbh-root { padding-bottom: 0; } }

      /* Hero — fond lumineux, reflets doux */
      .cbh-hero { background: transparent; }
      .cbh-hero-bg {
        background:
          radial-gradient(70% 55% at 8% 0%, rgba(251,191,36,0.28), transparent 58%),
          radial-gradient(55% 45% at 92% 12%, rgba(244,63,94,0.14), transparent 52%),
          radial-gradient(75% 55% at 50% 100%, rgba(59,130,246,0.1), transparent 58%),
          linear-gradient(165deg, #fffdfb 0%, #fef7ed 42%, #f8fafc 100%);
      }
      .cbh-hero-grain {
        background-image:
          repeating-radial-gradient(circle at 0 0, rgba(15,23,42,0.04) 0, rgba(15,23,42,0.04) 1px, transparent 1px, transparent 5px);
        mix-blend-mode: multiply;
        opacity: 0.35;
      }

      /* Sections alternées */
      .cbh-choice { background: linear-gradient(180deg, #f8fafc 0%, #fff 100%); }
      .cbh-gallery { background: linear-gradient(180deg, #fff 0%, #fef7ed 100%); }
      .cbh-adv { background: linear-gradient(180deg, #fef7ed 0%, #f0f9ff 100%); }
      .cbh-faq { background: #f8fafc; }
      .cbh-footer { background: #fff; border-top: 1px solid rgba(226,232,240,0.9); }
      .cbh-section-alt { background: linear-gradient(180deg, #fff 0%, #f8fafc 100%); }
      .cbh-section-warm { background: linear-gradient(180deg, #fffbeb 0%, #fff 100%); }

      /* Texte dégradé — lisible sur fond clair */
      .cbh-grad-text {
        background: linear-gradient(120deg, #b45309 0%, #d97706 48%, #ea580c 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .cbh-grad-gold {
        background: linear-gradient(120deg, #92400e 0%, #d97706 45%, #b45309 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .cbh-grad-red {
        background: linear-gradient(120deg, #be123c 0%, #dc2626 50%, #ea580c 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }

      /* CTA — léger mouvement + halo pulsant */
      @keyframes cbh-cta-float {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-5px) scale(1.025); }
      }
      @keyframes cbh-cta-glow {
        0%, 100% { filter: drop-shadow(0 10px 22px rgba(251,191,36,0.35)); }
        50% { filter: drop-shadow(0 14px 28px rgba(251,191,36,0.55)); }
      }
      .cbh-cta-bounce {
        animation: cbh-cta-float 2.2s ease-in-out infinite, cbh-cta-glow 2.2s ease-in-out infinite;
        will-change: transform;
      }
      .cbh-cta-bounce:nth-of-type(2n) { animation-delay: 0.35s; }
      .cbh-cta-bounce:hover,
      .cbh-cta-bounce:focus-visible {
        animation: none;
        transform: translateY(-3px) scale(1.04);
      }

      @keyframes cbh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.88); } }
      .cbh-pulse { animation: cbh-pulse 1.6s ease-in-out infinite; }

      @keyframes cbh-sheen-anim {
        0%   { transform: translateX(-120%) skewX(-15deg); }
        100% { transform: translateX(220%)  skewX(-15deg); }
      }
      .cbh-sheen {
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%);
        width: 50%;
        animation: cbh-sheen-anim 2.4s ease-in-out infinite;
      }

      @keyframes cbh-marquee-anim { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .cbh-marquee { overflow: hidden; }
      .cbh-marquee-track { display: inline-flex; white-space: nowrap; gap: 3rem; animation: cbh-marquee-anim 28s linear infinite; }

      @keyframes cbh-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
      .cbh-card, .cbh-fiche, .cbh-photo, .cbh-glass { animation: cbh-fade-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .cbh-clock { animation: cbh-fade-up 0.5s ease-out both; }

      @media (prefers-reduced-motion: reduce) {
        .cbh-pulse, .cbh-sheen, .cbh-marquee-track, .cbh-cta-bounce,
        .cbh-card, .cbh-fiche, .cbh-photo, .cbh-glass, .cbh-clock { animation: none !important; }
        .cbh-root { scroll-behavior: auto; }
      }

      /* Formulaire modal — clair */
      .cbh-lbl { display:block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color:#64748b; margin-bottom: 6px; }
      .cbh-input {
        width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px;
        background: #f8fafc; color: #0f172a;
        border: 1px solid #e2e8f0; outline: none; font-size: 14.5px;
        transition: border-color .2s, box-shadow .2s, background .2s;
        -webkit-appearance: none; appearance: none;
      }
      .cbh-input::placeholder { color: #94a3b8; }
      .cbh-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); background: #fff; }
      .cbh-input-err { border-color: #f87171 !important; box-shadow: 0 0 0 3px rgba(248,113,113,0.2) !important; }
      .cbh-textarea { resize: vertical; min-height: 56px; }
      .cbh-select {
        appearance: none; -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23d97706' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-position: right 14px center;
        background-repeat: no-repeat;
        padding-right: 38px;
      }

      .cbh-modal { animation: cbh-fade-up 0.25s ease-out both; }
      .cbh-modal-card { -webkit-overflow-scrolling: touch; }

      .cbh-card { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease; }
      .cbh-card:hover { transform: translateY(-6px); box-shadow: 0 28px 64px -28px rgba(15,23,42,0.22); }
      .cbh-photo { transition: transform 0.4s ease, box-shadow 0.4s ease; }
      .cbh-photo:hover { transform: translateY(-3px); }

      /* ====== Barres defilantes top (2 niveaux, sticky) ====== */
      .cbh-topbars {
        box-shadow: 0 8px 24px -16px rgba(15,23,42,0.4);
      }
      .cbh-topbar {
        position: relative;
        overflow: hidden;
        line-height: 1;
      }
      .cbh-topbar-dark {
        background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        color: #f1f5f9;
        border-bottom: 1px solid rgba(251,191,36,0.25);
      }
      .cbh-topbar-dark .cbh-topbar-track {
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.18em;
        padding: 7px 0;
        text-transform: uppercase;
      }
      .cbh-topbar-dark .cbh-topbar-track > span {
        color: #fef3c7;
      }
      @media (min-width: 640px) {
        .cbh-topbar-dark .cbh-topbar-track { font-size: 12.5px; padding: 8px 0; }
      }
      .cbh-topbar-gold {
        background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 35%, #fde68a 55%, #fbbf24 75%, #f59e0b 100%);
        color: #0f172a;
        border-bottom: 1px solid rgba(180,83,9,0.25);
      }
      .cbh-topbar-gold .cbh-topbar-track {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.14em;
        padding: 7px 0;
        text-transform: uppercase;
        text-shadow: 0 1px 0 rgba(255,255,255,0.35);
      }
      @media (min-width: 640px) {
        .cbh-topbar-gold .cbh-topbar-track { font-size: 13px; padding: 8px 0; }
      }
      .cbh-topbar-track {
        display: inline-flex;
        white-space: nowrap;
        gap: 2.5rem;
        animation: cbh-topbar-anim 38s linear infinite;
        will-change: transform;
      }
      .cbh-topbar-track-rev {
        animation: cbh-topbar-anim-rev 32s linear infinite;
      }
      @keyframes cbh-topbar-anim {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes cbh-topbar-anim-rev {
        0%   { transform: translateX(-50%); }
        100% { transform: translateX(0); }
      }

      /* ====== Toast notifications achats recents ====== */
      .cbh-toast {
        max-width: 92vw;
        width: 320px;
        opacity: 0;
        transform: translateY(12px) translateX(-12px);
        transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .cbh-toast-in {
        opacity: 1;
        transform: translateY(0) translateX(0);
      }
      .cbh-toast-out {
        opacity: 0;
        transform: translateY(8px) translateX(-8px);
      }
      @media (min-width: 640px) {
        .cbh-toast { width: 340px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .cbh-topbar-track, .cbh-topbar-track-rev { animation: none !important; }
        .cbh-toast { transition: opacity 0.2s ease !important; }
      }
    `}</style>
  );
}
