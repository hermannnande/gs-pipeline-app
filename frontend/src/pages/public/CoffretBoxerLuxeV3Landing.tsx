/**
 * Tunnel de vente — Boxers Homme de Luxe (slug : coffret-boxer-luxe-v3)
 *
 * 3e page boxers, distincte de coffret-boxer-homme.
 * Direction artistique : NOIR profond + ORANGE + BLEU CIEL + BLEU ROI,
 * dégradés fluides, arrière-plans riches derrière chaque bloc.
 *
 * Disposition tunnel : 1 média (image/vidéo) = micro-texte vendeur dégradé +
 * 1 bouton "Commander" qui ouvre une popup de commande simple.
 *
 * 2 coffrets premium à 7 000 F (3 boxers chacun) + offre duo.
 * Commandes envoyées via /coffret-versace/order.php (Telegram + CSV/JSON cote VPS),
 * jamais vers Obgestion. Classes CSS prefixees `bxl-` pour eviter les conflits WordPress.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPageView } from '../../utils/pageTracking';
import { DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const ORDER_ENDPOINT = 'https://obrille.com/coffret-versace/order.php';
const SLUG = 'coffret-boxer-luxe-v3';
const META_PIXEL_ID = '1674022793901764';
const PRODUCT_CODE = 'COFFRET_BOXER_LUXE_V3';

type ProductKey = 'noir' | 'pro' | 'both';

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const getCookie = (n: string) => {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${n}=`);
  return p.length === 2 ? p.pop()!.split(';').shift() || null : null;
};

const UNIT_PRICE = 9900;
const DUO_PRICE = 16900;

const PRODUCTS: Record<ProductKey, { label: string; price: number; sub: string }> = {
  noir: { label: `Coffret Élégance Noir — 3 boxers — ${fmt(UNIT_PRICE + DELIVERY_FEE_CI)} F`, price: UNIT_PRICE + DELIVERY_FEE_CI, sub: '3 boxers premium' },
  pro: { label: `Coffret Pack Pro Luxe — 3 boxers — ${fmt(UNIT_PRICE + DELIVERY_FEE_CI)} F`, price: UNIT_PRICE + DELIVERY_FEE_CI, sub: '3 boxers Pack Pro' },
  both: { label: `Les 2 coffrets (6 boxers) — ${fmt(DUO_PRICE + DELIVERY_FEE_CI)} F`, price: DUO_PRICE + DELIVERY_FEE_CI, sub: '6 boxers premium' },
};

// Médias optimisés (webp/mp4 compressés) servis depuis /coffret-boxer-luxe-v3/.
// Bruts WordPress ~7.2 Mo -> optimisés ~1 Mo. Voir scripts/optimize-coffret-boxer-luxe-v3.mjs
const M = (n: string) => `/coffret-boxer-luxe-v3/${n}`;
const IMG = {
  noir1: M('noir1.webp'),
  cta1: M('cta1.webp'),
  cta2: M('cta2.webp'),
  noir2: M('noir2.webp'),
  pro1: M('pro1.webp'),
  pro2: M('pro2.webp'),
  pro3: M('pro3.webp'),
  pro4: M('pro4.webp'),
  poster: M('hero-poster.webp'),
  vid1: M('vid1.mp4'),
  vid2: M('vid2.mp4'),
};

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

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

function useEndOfDayCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return useMemo(() => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let diff = Math.max(0, Math.floor((end.getTime() - now) / 1000));
    const h = Math.floor(diff / 3600); diff -= h * 3600;
    const m = Math.floor(diff / 60); const s = diff - m * 60;
    return { h: pad(h), m: pad(m), s: pad(s) };
  }, [now]);
}

function useOnScreen(rootMargin = '240px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);
const Bolt = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
);

/* CTA dégradés variés (orange / bleu ciel / bleu roi / nuit / feu) */
const CTA_TONES: Record<string, string> = {
  orange: 'from-orange-500 via-orange-400 to-amber-300 text-black ring-orange-300/50',
  sky: 'from-sky-400 via-cyan-300 to-sky-200 text-slate-900 ring-sky-200/60',
  royal: 'from-blue-700 via-blue-600 to-indigo-700 text-white ring-blue-400/40',
  fire: 'from-orange-600 via-red-500 to-orange-400 text-white ring-orange-400/50',
  night: 'from-slate-900 via-blue-950 to-black text-sky-200 ring-blue-500/30',
};
function CTA({ onClick, children, tone = 'orange', className = '' }: { onClick: () => void; children: ReactNode; tone?: string; className?: string }) {
  const cls = CTA_TONES[tone] || CTA_TONES.orange;
  return (
    <button type="button" onClick={onClick}
      className={`bxl-cta bxl-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.14em] shadow-[0_18px_44px_-12px_rgba(0,0,0,.55)] ring-2 transition hover:scale-[1.02] active:scale-95 sm:text-[15px] ${className}`}>
      <span className="bxl-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function LazyImg({ src, alt, priority, className = '' }: { src: string; alt: string; priority?: boolean; className?: string }) {
  const { ref, visible } = useOnScreen();
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`}>
        {/* @ts-expect-error fetchpriority valide cote DOM */}
        <img src={src} alt={alt} loading="eager" decoding="async" fetchpriority="high" className="block h-auto w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {visible
        ? <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full object-cover" />
        : <div className="aspect-[4/5] w-full animate-pulse bg-gradient-to-br from-slate-800 to-blue-950" />}
    </div>
  );
}

function LazyVideo({ src, poster, priority }: { src: string; poster?: string; priority?: boolean }) {
  const { ref, visible } = useOnScreen('160px');
  return (
    <div ref={ref} className="overflow-hidden rounded-[2rem]">
      {(visible || priority) ? (
        <video src={src} poster={poster} autoPlay muted loop playsInline
          preload={priority ? 'auto' : 'metadata'} className="block w-full object-cover" />
      ) : (
        <div className="aspect-[9/16] w-full animate-pulse bg-gradient-to-br from-orange-900/40 via-blue-950 to-black" />
      )}
    </div>
  );
}

const GRAD: Record<string, string> = {
  fire: 'bxl-grad-fire', sky: 'bxl-grad-sky', royal: 'bxl-grad-royal', sunset: 'bxl-grad-sunset', ice: 'bxl-grad-ice',
};

/* Bloc tunnel : arriere-plan dégradé + média + micro-texte + CTA popup */
function TunnelBlock({ bg, badge, kicker, title, text, cta, ctaTone, gradTitle = 'fire', product, onOrder, children }: {
  bg: string; badge?: string; kicker: string; title: string; text: string; cta: string;
  ctaTone: string; gradTitle?: string; product: ProductKey; onOrder: (p: ProductKey) => void; children: ReactNode;
}) {
  const { ref, visible } = useOnScreen();
  return (
    <section className={`relative overflow-hidden py-11 sm:py-16 ${bg}`}>
      <div className="bxl-aurora pointer-events-none absolute inset-0" />
      <div ref={ref} className={`relative mx-auto max-w-md px-4 text-center ${visible ? 'bxl-fade-up' : 'opacity-0'}`}>
        <div className="relative overflow-hidden rounded-[2rem] ring-2 ring-white/15 shadow-[0_34px_80px_-28px_rgba(0,0,0,.8)]">
          {children}
          {badge && (
            <span className="absolute left-3 top-3 rotate-[-4deg] rounded-lg bg-black/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300 ring-1 ring-orange-400/40 backdrop-blur">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.34em] text-sky-300/90">{kicker}</p>
        <h2 className={`mt-2 text-balance text-[22px] font-black leading-tight sm:text-[28px] ${GRAD[gradTitle] || GRAD.fire}`}>{title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-slate-200/90">{text}</p>
        <div className="mx-auto mt-5 max-w-sm"><CTA tone={ctaTone} onClick={() => onOrder(product)}>{cta} <Arrow /></CTA></div>
      </div>
    </section>
  );
}

function Marquee({ items, tone }: { items: string[]; tone: string }) {
  const line = items.join('   ◆   ');
  return (
    <div className={`overflow-hidden border-y py-2.5 ${tone}`}>
      <div className="bxl-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        <span className="shrink-0">{line}</span>
        <span className="shrink-0" aria-hidden>{line}</span>
      </div>
    </div>
  );
}

/* Notifications d'achats récents */
const RECENT = [
  { n: 'Kouassi', v: 'Cocody', p: 'Coffret Noir' },
  { n: 'Salif', v: 'Yopougon', p: 'Pack Pro' },
  { n: 'Brou', v: 'Marcory', p: 'Les 2 coffrets' },
  { n: 'Yao', v: 'Abobo', p: 'Coffret Noir' },
  { n: 'Aristide', v: 'Bingerville', p: 'Pack Pro' },
  { n: 'Konaté', v: 'Treichville', p: 'Coffret Noir' },
];
function RecentToast() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    let t: number[] = [];
    const loop = (idx: number) => {
      setI(idx); setShow(true);
      t.push(window.setTimeout(() => {
        setShow(false);
        t.push(window.setTimeout(() => loop((idx + 1) % RECENT.length), 3000));
      }, 5000));
    };
    t.push(window.setTimeout(() => loop(0), 4500));
    return () => t.forEach(clearTimeout);
  }, []);
  const o = RECENT[i];
  return (
    <div className={`fixed bottom-24 left-3 z-[60] transition-all duration-500 sm:left-4 ${show ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'}`} role="status">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900/95 px-3 py-2.5 pr-4 shadow-[0_18px_48px_-18px_rgba(0,0,0,.6)] ring-1 ring-orange-400/30 backdrop-blur-md">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-blue-600 text-white shadow-md">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-extrabold text-white">{o.n} <span className="font-semibold text-slate-400">à {o.v}</span></p>
          <p className="text-[11px] text-slate-300">vient de commander <span className="font-bold text-orange-300">{o.p}</span></p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Popup commande -> POST PHP ---------------- */
function OrderModal({ open, initialProduct, onClose }: { open: boolean; initialProduct: ProductKey; onClose: () => void }) {
  const navigate = useNavigate();
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [commune, setCommune] = useState('');
  const [product, setProduct] = useState<ProductKey>(initialProduct);
  const qty = product === 'both' ? 2 : 1;
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { if (open) { setProduct(initialProduct); setErrorMsg(''); setSubmitted(false); } }, [open, initialProduct]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const total = PRODUCTS[product].price;
  const totalFmt = fmt(total) + ' FCFA';
  const invalid = (v: string) => submitted && !v.trim();

  async function submit() {
    if (!nom.trim() || !tel.trim() || !commune.trim()) { setSubmitted(true); return; }
    setSubmitting(true); setErrorMsg('');
    const payload = {
      name: `${nom.trim()} — ${PRODUCTS[product].label}`,
      customer_name: nom.trim(),
      city: commune.trim(),
      phone: tel.trim(),
      quantity: qty,
      product: PRODUCTS[product].label,
      product_key: product,
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
        sessionStorage.setItem('bxl_last_order', JSON.stringify({
          ref: data.orderId || '', productKey: product,
          productLabel: PRODUCTS[product].label, productSub: PRODUCTS[product].sub,
          qty, total, nom: nom.trim(), tel: tel.trim(), commune: commune.trim(), ts: Date.now(),
        }));
      } catch { /* noop */ }
      const params = new URLSearchParams({ ref: data.orderId || '', product, qty: String(qty) });
      navigate(`/${SLUG}/merci?${params.toString()}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Connexion impossible. Réessayez dans quelques secondes.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 backdrop-blur-md sm:items-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bxl-modal-card relative w-full max-w-md max-h-[100svh] overflow-y-auto rounded-t-3xl bg-gradient-to-b from-slate-900 to-black p-5 ring-1 ring-orange-400/30 shadow-2xl sm:max-h-[92vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
        <button type="button" onClick={onClose} aria-label="Fermer"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
        </button>

        <div className="text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-blue-600 shadow-lg">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8h18v12H3z" /></svg>
          </div>
          <h3 className="mt-3 text-xl font-black text-white"><span className="bxl-grad-sunset">Commander mon coffret</span></h3>
          <p className="mt-1 text-xs text-slate-400">Réponse rapide · Paiement à la livraison</p>
        </div>

        <div className="mt-5 space-y-3 text-left">
          {[
            { lbl: 'Nom complet', val: nom, set: setNom, type: 'text', ph: 'Ex : Kouassi Jean', ac: 'name' },
            { lbl: 'Téléphone', val: tel, set: setTel, type: 'tel', ph: '07 ou 05 ou 01', ac: 'tel' },
            { lbl: 'Commune / Ville', val: commune, set: setCommune, type: 'text', ph: 'Ex : Cocody, Yopougon…', ac: 'address-level2' },
          ].map((f) => (
            <div key={f.lbl}>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">{f.lbl}</label>
              <input value={f.val} onChange={(e) => f.set(e.target.value)} type={f.type} autoComplete={f.ac}
                inputMode={f.type === 'tel' ? 'tel' : undefined} placeholder={f.ph} disabled={submitting}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 ${invalid(f.val) ? 'border-red-400' : 'border-white/10'}`} />
            </div>
          ))}
          <div className="rounded-2xl bg-gradient-to-r from-orange-500/15 to-blue-600/15 p-3 ring-1 ring-orange-400/25">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-white">{PRODUCTS[product].label.split(' — ')[0]}</span>
              <span className="text-xl font-black bxl-grad-sunset">{totalFmt}</span>
            </div>
            <p className="mt-1 text-[12px] text-slate-300">{PRODUCTS[product].sub}</p>
          </div>

          {errorMsg && <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-200">{errorMsg}</div>}

          <CTA tone="fire" onClick={submit}>
            {submitting ? 'Envoi en cours…' : <>Valider ma commande <Arrow /></>}
          </CTA>
          <p className="text-center text-[11px] text-slate-500">En validant, vous acceptez d'être recontacté pour confirmer la livraison.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Blocs tunnel ---------------- */
const TUNNEL: {
  bg: string; badge?: string; kicker: string; title: string; text: string; cta: string;
  ctaTone: string; gradTitle: string; product: ProductKey; type: 'img' | 'vid'; src: string; poster?: string;
}[] = [
  {
    bg: 'bg-gradient-to-br from-blue-950 via-sky-900/60 to-black', badge: 'Best-seller',
    kicker: 'Élégance noire', title: 'Coffret Noir Signature',
    text: 'Un look sobre et puissant. Coton stretch doux, coupe parfaite, finitions premium — l\'essentiel du dressing masculin.',
    cta: 'Je veux le coffret noir', ctaTone: 'royal', gradTitle: 'ice', product: 'noir', type: 'img', src: IMG.noir1,
  },
  {
    bg: 'bg-gradient-to-br from-orange-800/40 via-black to-blue-900', badge: 'Confort +',
    kicker: 'Sensation premium', title: 'Confort toute la journée',
    text: 'Respirant, doux et résistant. Ces boxers tiennent au corps sans comprimer — parfaits du bureau à la soirée.',
    cta: 'Commander maintenant', ctaTone: 'fire', gradTitle: 'fire', product: 'noir', type: 'img', src: IMG.cta1,
  },
  {
    bg: 'bg-gradient-to-br from-sky-900/50 via-blue-950 to-orange-950/40', badge: 'Pack Pro',
    kicker: 'Édition Pro', title: 'Coffret Pack Pro Luxe',
    text: '3 boxers haut de gamme dans un emballage soigné. Le cadeau parfait pour lui — ou pour se faire plaisir.',
    cta: 'Commander le Pack Pro', ctaTone: 'sky', gradTitle: 'sky', product: 'pro', type: 'img', src: IMG.pro1,
  },
  {
    bg: 'bg-gradient-to-br from-indigo-950 via-blue-900 to-black', badge: 'Qualité luxe',
    kicker: 'Le détail qui change tout', title: 'Finitions de luxe',
    text: 'Coutures renforcées, élastique confortable, tissu premium qui ne déteint pas. Une qualité qui dure dans le temps.',
    cta: 'Obtenir mon coffret', ctaTone: 'royal', gradTitle: 'royal', product: 'pro', type: 'img', src: IMG.pro2,
  },
  {
    bg: 'bg-gradient-to-br from-black via-orange-900/45 to-sky-950', badge: 'Offre duo',
    kicker: '2 modèles, 1 prix doux', title: '2 coffrets = 6 boxers',
    text: 'Prenez les deux modèles et profitez d\'un dressing complet. Noir + Pack Pro, livrés ensemble.',
    cta: 'Commander les 2 coffrets', ctaTone: 'orange', gradTitle: 'sunset', product: 'both', type: 'img', src: IMG.cta2,
  },
  {
    bg: 'bg-gradient-to-br from-blue-900 via-black to-orange-900/40', badge: 'Style affirmé',
    kicker: 'Pour les hommes exigeants', title: 'Affirmez votre style',
    text: 'Des couleurs intenses, un confort absolu. Le coffret que l\'on garde et que l\'on recommande.',
    cta: 'Commander — stock limité', ctaTone: 'fire', gradTitle: 'fire', product: 'noir', type: 'img', src: IMG.noir2,
  },
  {
    bg: 'bg-gradient-to-br from-sky-800/40 via-indigo-950 to-black', badge: 'Édition limitée',
    kicker: 'Collection Pro', title: 'Pack Pro — séries limitées',
    text: 'Modèles variés, qualité supérieure. Il ne reste que quelques coffrets — ne ratez pas l\'offre du jour.',
    cta: 'Je commande le Pack Pro', ctaTone: 'sky', gradTitle: 'ice', product: 'pro', type: 'img', src: IMG.pro3,
  },
  {
    bg: 'bg-gradient-to-br from-orange-700/25 via-blue-950 to-black', badge: 'Vidéo réelle',
    kicker: 'Voyez par vous-même', title: 'La qualité en action',
    text: 'Regardez le rendu réel : tissu premium, coupe moderne, finitions soignées. Tout est pensé pour durer.',
    cta: 'Commander avant la fin', ctaTone: 'orange', gradTitle: 'sunset', product: 'pro', type: 'vid', src: IMG.vid1, poster: IMG.pro4,
  },
  {
    bg: 'bg-gradient-to-br from-black via-blue-900 to-orange-800/30', badge: 'Dernière chance',
    kicker: 'Offre du jour', title: `${fmt(UNIT_PRICE + DELIVERY_FEE_CI)} F seulement`,
    text: 'Paiement à la livraison partout en Côte d\'Ivoire. Livraison express — commandez avant minuit.',
    cta: 'Commander mon coffret', ctaTone: 'fire', gradTitle: 'fire', product: 'both', type: 'img', src: IMG.pro4,
  },
];

const TRUST = [
  { i: '💳', t: 'Paiement à la livraison' },
  { i: '🚚', t: 'Livraison GRATUITE' },
  { i: '🧵', t: 'Coton stretch premium' },
  { i: '🎁', t: 'Idéal pour offrir' },
  { i: '🔒', t: 'Commande sécurisée' },
  { i: '📞', t: 'Service client rapide' },
];

const REVIEWS = [
  { txt: 'Très bonne qualité, le coffret noir est classe. Confort parfait toute la journée.', n: 'Marc', v: 'Cocody' },
  { txt: 'J\'ai pris les 2 coffrets, livraison rapide et boxers vraiment premium. Je recommande.', n: 'Stéphane', v: 'Yopougon' },
  { txt: 'Le Pack Pro est top, tissu agréable et ça ne serre pas. Bon rapport qualité-prix.', n: 'Daniel', v: 'Abidjan' },
  { txt: 'Commande simple, on m\'a rappelé tout de suite. Très satisfait du rendu.', n: 'Arnaud', v: 'Bingerville' },
];

const FAQ = [
  { q: 'Combien de boxers dans un coffret ?', a: 'Chaque coffret contient 3 boxers homme premium.' },
  { q: 'Quel est le prix ?', a: `Un coffret de 3 boxers coûte ${fmt(UNIT_PRICE + DELIVERY_FEE_CI)} F, livraison gratuite incluse. Les 2 coffrets (6 boxers) reviennent à ${fmt(DUO_PRICE + DELIVERY_FEE_CI)} F.` },
  { q: 'Comment se passe le paiement ?', a: 'Vous payez en cash à la livraison, à la réception de votre coffret.' },
  { q: 'Comment commander ?', a: 'Cliquez sur "Commander", remplissez le formulaire (nom, téléphone, commune) et notre équipe vous rappelle pour confirmer.' },
  { q: 'La livraison est-elle gratuite ?', a: 'Oui ! La livraison est entièrement gratuite partout en Côte d\'Ivoire.' },
];

export default function CoffretBoxerLuxeV3Landing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [picked, setPicked] = useState<ProductKey>('noir');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const cd = useEndOfDayCountdown();
  const pixelFired = useRef(false);

  const open = useCallback((product: ProductKey = 'noir') => {
    setPicked(product);
    setModalOpen(true);
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'InitiateCheckout', {
        content_name: PRODUCTS[product].label, content_ids: [PRODUCT_CODE],
        content_type: 'product', value: PRODUCTS[product].price, currency: 'XOF',
      });
    }
  }, []);
  const close = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    const prev = document.title;
    document.title = `Boxers Homme de Luxe — ${fmt(UNIT_PRICE + DELIVERY_FEE_CI)} F | Coffret 3 boxers`;
    trackPageView(SLUG);
    if (!pixelFired.current && META_PIXEL_ID) {
      pixelFired.current = true;
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Boxers Homme de Luxe', content_ids: [PRODUCT_CODE],
        content_type: 'product', value: UNIT_PRICE, currency: 'XOF',
      });
    }
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
      <style>{`
        @keyframes bxl-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .bxl-marquee { animation: bxl-marquee 26s linear infinite }
        @keyframes bxl-sheen { 0% { transform: translateX(-100%) } 60% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .bxl-sheen { animation: bxl-sheen 3s ease-in-out infinite }
        @keyframes bxl-pulse { 0%,100% { transform: translateY(0); box-shadow: 0 18px 44px -12px rgba(0,0,0,.55) } 50% { transform: translateY(-2px); box-shadow: 0 26px 56px -10px rgba(249,115,22,.45) } }
        .bxl-pulse { animation: bxl-pulse 2.6s ease-in-out infinite } .bxl-cta:hover { animation: none !important }
        @keyframes bxl-fade-up { from { opacity:0; transform: translateY(22px) } to { opacity:1; transform: none } }
        .bxl-fade-up { animation: bxl-fade-up .6s cubic-bezier(.22,.8,.4,1) both }
        @keyframes bxl-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .bxl-grad-fire { background: linear-gradient(90deg,#fb923c,#f97316,#fde047,#38bdf8); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: bxl-shimmer 4s linear infinite }
        .bxl-grad-sky { background: linear-gradient(90deg,#7dd3fc,#38bdf8,#818cf8,#e0f2fe); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: bxl-shimmer 4s linear infinite }
        .bxl-grad-royal { background: linear-gradient(90deg,#60a5fa,#2563eb,#1e3a8a,#93c5fd); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: bxl-shimmer 4s linear infinite }
        .bxl-grad-sunset { background: linear-gradient(90deg,#f97316,#fb923c,#fde047,#38bdf8); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: bxl-shimmer 4s linear infinite }
        .bxl-grad-ice { background: linear-gradient(90deg,#e0f2fe,#7dd3fc,#38bdf8,#2563eb); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: bxl-shimmer 4s linear infinite }
        .bxl-aurora { background: radial-gradient(60% 40% at 20% 0%, rgba(249,115,22,.14), transparent 60%), radial-gradient(50% 40% at 90% 20%, rgba(56,189,248,.14), transparent 60%), radial-gradient(60% 50% at 50% 110%, rgba(37,99,235,.16), transparent 70%); }
        @media (prefers-reduced-motion: reduce) { .bxl-pulse,.bxl-sheen,.bxl-marquee,.bxl-fade-up,[class^="bxl-grad-"] { animation: none !important } }
      `}</style>

      {/* Barres + compte à rebours */}
      <div className="sticky top-0 z-50 shadow-xl">
        <Marquee tone="bg-gradient-to-r from-black via-orange-900 to-blue-950 text-orange-200 border-orange-500/20"
          items={['Offre flash aujourd\'hui', `3 boxers à ${fmt(UNIT_PRICE + DELIVERY_FEE_CI)} F`, 'Paiement à la livraison', 'Livraison GRATUITE', 'Stock limité']} />
        <Marquee tone="bg-gradient-to-r from-blue-900 via-sky-800 to-orange-700 text-white border-sky-400/20"
          items={['⚡ Fin de promo ce soir', '🎁 Noir + Pack Pro', '🔥 Qualité luxe', '🚚 Livraison gratuite', '⏰ Avant minuit']} />
        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 via-orange-500 to-blue-700 px-4 py-2.5">
          <span className="text-[10px] font-black uppercase tracking-[0.26em] text-white/90">Offre expire dans</span>
          {[cd.h, cd.m, cd.s].map((v, i) => (
            <span key={i} className="inline-flex flex-col items-center">
              <span className="grid min-w-[2.4rem] place-items-center rounded-lg bg-black/35 px-2 py-1 text-lg font-black tabular-nums text-white ring-1 ring-white/20">{v}</span>
              <span className="mt-0.5 text-[8px] font-bold uppercase text-white/70">{['h', 'min', 'sec'][i]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-blue-950 to-orange-950/40 py-9 sm:py-14">
        <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-md px-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-orange-300 backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-orange-400" /> Édition luxe 2026 <span className="h-1 w-1 rounded-full bg-sky-400" />
          </p>
          <h1 className="mt-5 text-[34px] font-black leading-[1.04] sm:text-[46px]">
            <span className="bxl-grad-sunset">Boxers Homme</span><br /><span className="text-white">de Luxe</span>
          </h1>
          <p className="mt-3 text-[15px] font-semibold text-sky-200">Coffret 3 boxers premium — confort, style et élégance au quotidien.</p>
          <div className="mt-4 flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-slate-400">Le coffret</span>
            <span className="bxl-grad-fire text-5xl font-black">{fmt(UNIT_PRICE)}</span>
            <span className="text-lg font-bold text-slate-200">FCFA</span>
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[12px] font-black uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-400/30">🚚 Livraison gratuite</p>
          <div className="mx-auto mt-6 max-w-sm overflow-hidden rounded-[2.2rem] ring-2 ring-orange-300/30 shadow-[0_40px_90px_-30px_rgba(0,0,0,.85)]">
            <LazyVideo src={IMG.vid2} poster={IMG.poster} priority />
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA tone="orange" onClick={() => open('noir')}><Bolt /> Commander mon coffret <Arrow /></CTA></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['Paiement à la livraison', 'Livraison gratuite', '3 boxers premium', 'Stock limité'].map((b) => (
              <span key={b} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-300">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Sélecteur 2 coffrets */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-black to-orange-950/50 py-11 sm:py-16">
        <div className="bxl-aurora pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-lg px-4">
          <h2 className="text-center text-[26px] font-black bxl-grad-royal sm:text-[32px]">Choisissez votre coffret</h2>
          <p className="mt-2 text-center text-sm text-slate-300">2 modèles premium · 3 boxers · {fmt(UNIT_PRICE + DELIVERY_FEE_CI)} F · <span className="font-bold text-emerald-400">Livraison gratuite</span></p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {([
              { key: 'noir' as ProductKey, name: 'Élégance Noir', img: IMG.noir1, desc: 'Look sobre et puissant.', tone: 'royal' },
              { key: 'pro' as ProductKey, name: 'Pack Pro Luxe', img: IMG.pro1, desc: 'Finitions haut de gamme.', tone: 'sky' },
            ]).map((c) => (
              <div key={c.key} className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/15 shadow-xl">
                <LazyImg src={c.img} alt={c.name} />
                <div className="p-4 text-center">
                  <h3 className="text-lg font-black bxl-grad-sky">{c.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{c.desc}</p>
                  <p className="mt-2 text-2xl font-black text-orange-400">{fmt(UNIT_PRICE)} F</p>
                  <div className="mt-3"><CTA tone={c.tone} onClick={() => open(c.key)}>Commander <Arrow /></CTA></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[1.75rem] bg-gradient-to-r from-orange-500/20 via-blue-600/20 to-orange-500/20 p-5 text-center ring-1 ring-orange-400/30">
            <p className="text-sm font-bold text-slate-200">Offre duo · Les 2 coffrets (6 boxers)</p>
            <p className="mt-1 text-3xl font-black bxl-grad-sunset">{fmt(DUO_PRICE)} F</p>
            <div className="mx-auto mt-4 max-w-sm"><CTA tone="fire" onClick={() => open('both')}>Commander les 2 coffrets <Arrow /></CTA></div>
          </div>
        </div>
      </section>

      {/* Blocs tunnel */}
      {TUNNEL.map((b, i) => (
        <TunnelBlock key={i} bg={b.bg} badge={b.badge} kicker={b.kicker} title={b.title} text={b.text}
          cta={b.cta} ctaTone={b.ctaTone} gradTitle={b.gradTitle} product={b.product} onOrder={open}>
          {b.type === 'vid'
            ? <LazyVideo src={b.src} poster={b.poster} />
            : <LazyImg src={b.src} alt={b.title} />}
        </TunnelBlock>
      ))}

      {/* Réassurance */}
      <section className="bg-gradient-to-br from-black via-blue-950 to-black py-11">
        <div className="mx-auto max-w-lg px-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TRUST.map((t) => (
              <div key={t.t} className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
                <span className="text-xl">{t.i}</span>
                <span className="text-[12px] font-bold text-slate-200">{t.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avis */}
      <section className="bg-gradient-to-br from-blue-950 via-black to-orange-950/40 py-11">
        <div className="mx-auto max-w-lg px-4">
          <h2 className="text-center text-[24px] font-black bxl-grad-ice sm:text-[28px]">Ils ont déjà commandé</h2>
          <div className="mt-6 space-y-3">
            {REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex gap-0.5 text-orange-400">{'★★★★★'.split('').map((s, k) => <span key={k}>{s}</span>)}</div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate-200">“{r.txt}”</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-sky-300">{r.n} · {r.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gradient-to-br from-black via-blue-900/40 to-black py-11">
        <div className="mx-auto max-w-lg px-4">
          <h2 className="text-center text-[24px] font-black bxl-grad-sunset sm:text-[28px]">Questions fréquentes</h2>
          <div className="mt-6 space-y-2.5">
            {FAQ.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
                  <span className="text-[13.5px] font-bold text-slate-100">{f.q}</span>
                  <span className={`shrink-0 text-orange-400 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                  </span>
                </button>
                {openFaq === i && <p className="px-4 pb-4 text-[13px] leading-relaxed text-slate-300">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600/30 via-black to-blue-900 py-13">
        <div className="bxl-aurora pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-md px-4 py-2 text-center">
          <h2 className="text-[28px] font-black bxl-grad-fire">Ne ratez pas l'offre</h2>
          <p className="mt-3 text-sm text-slate-300">{fmt(UNIT_PRICE)} F le coffret · Paiement à la livraison · <span className="font-bold text-emerald-400">Livraison gratuite</span> partout en CI</p>
          <div className="mx-auto mt-6 max-w-sm"><CTA tone="orange" onClick={() => open('noir')}><Bolt /> Commander maintenant <Arrow /></CTA></div>
          <p className="mt-3 text-[11px] text-slate-500">Offre valable jusqu'à minuit · Stock limité</p>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black py-8 pb-28 text-center text-[11px] text-slate-500">
        <p className="font-bold uppercase tracking-[0.3em] text-slate-600">Boxers Homme de Luxe</p>
        <p className="mt-2">Paiement à la livraison · Livraison gratuite partout en Côte d'Ivoire</p>
      </footer>

      {/* Barre CTA collante en bas */}
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-orange-400/30 bg-gradient-to-r from-black/95 via-slate-900/95 to-black/95 backdrop-blur-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-md items-center gap-3 px-3 py-2.5">
          <div className="leading-tight">
            <p className="text-[15px] font-black text-orange-400">{fmt(UNIT_PRICE)} F</p>
          </div>
          <button type="button" onClick={() => open('noir')}
            className="bxl-pulse group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-3.5 text-[14px] font-black uppercase tracking-[0.12em] text-black shadow-[0_-6px_28px_-8px_rgba(249,115,22,.6)] ring-2 ring-orange-300/50 transition active:scale-95">
            <span className="bxl-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <span className="relative z-10 flex items-center gap-2"><Bolt /> Commander <Arrow /></span>
          </button>
        </div>
      </div>

      <RecentToast />
      <OrderModal open={modalOpen} initialProduct={picked} onClose={close} />
    </div>
  );
}
