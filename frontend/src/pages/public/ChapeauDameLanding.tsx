/**
 * Tunnel de vente — Chapeau Élégant Dame (slug : chapeau-dame, mapping CHEAPEAU_DAME)
 *
 * Page mode féminine premium : chic, élégante, colorée, très visuelle, mobile-first.
 * Palette : rouge (CTA/urgence) + bleu ciel (fraîcheur) + blanc + marron + noir + bleu foncé.
 * Disposition tunnel : 1 média = micro-titre + média + texte court + CTA animé.
 *
 * Commande -> POST /api/public/order (système Obgestion, mapping CHEAPEAU_DAME).
 * La couleur choisie est envoyée dans customerAddress (visible dans la commande reçue).
 * Médias optimisés (webp/mp4) servis depuis /chapeau-dame/. Classes CSS préfixées `cd-`.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'chapeau-dame';
const PRODUCT_CODE = 'CHEAPEAU_DAME';
const META_PIXEL_ID = '1312638417153297';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const PRICE = orderTotal(PRICES, 1);
const THANK_YOU_URL = '/chapeau-dame/merci';

const M = (n: string) => `/chapeau-dame/${n}`;
const IMG = {
  i1: M('i1.webp'), i2: M('i2.webp'), i3: M('i3.webp'), i4: M('i4.webp'),
  i5: M('i5.webp'), i6: M('i6.webp'), i7: M('i7.webp'),
  poster: M('hero-poster.webp'), v1: M('v1.mp4'), v2: M('v2.mp4'),
};

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

type ColorKey = 'Noir' | 'Blanc' | 'Gris' | 'Marron' | 'Rouge';
const COLORS: { key: ColorKey; hex: string; ring?: boolean }[] = [
  { key: 'Noir', hex: '#141414' },
  { key: 'Blanc', hex: '#ffffff', ring: true },
  { key: 'Gris', hex: '#9ca3af' },
  { key: 'Marron', hex: '#7c4a2d' },
  { key: 'Rouge', hex: '#dc2626' },
];

const PACKS = [
  { v: 1, label: '1 chapeau', sub: 'L\'essentiel', price: orderTotal(PRICES, 1), badge: null as string | null },
  { v: 2, label: '2 chapeaux', sub: 'Le plus choisi', price: orderTotal(PRICES, 2), badge: 'Recommandé' },
  { v: 3, label: '3 chapeaux', sub: 'Meilleure offre', price: orderTotal(PRICES, 3), badge: 'Top affaire' },
];

interface Product { id: number; code: string; nom?: string }
declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}
function getCookie(n: string): string | undefined {
  const v = `; ${document.cookie}`; const p = v.split(`; ${n}=`);
  return p.length === 2 ? p.pop()!.split(';').shift() : undefined;
}

function useEndOfDayCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  return useMemo(() => {
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    let d = Math.max(0, Math.floor((end.getTime() - now) / 1000));
    const h = Math.floor(d / 3600); d -= h * 3600; const m = Math.floor(d / 60); const s = d - m * 60;
    return { h: pad(h), m: pad(m), s: pad(s) };
  }, [now]);
}

function useOnScreen(rootMargin = '240px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin });
    obs.observe(el); return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

const Arrow = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>);
const Heart = () => (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.5C.5 8 2 4.5 5.5 4.5c2 0 3.4 1.2 4.5 2.6 1.1-1.4 2.5-2.6 4.5-2.6 3.5 0 5 3.5 3.5 7C19.5 16.1 12 21 12 21z" /></svg>);

const CTA_TONES: Record<string, string> = {
  red: 'from-red-600 via-rose-500 to-red-500 text-white ring-red-300/50',
  sky: 'from-sky-400 via-cyan-300 to-sky-200 text-slate-900 ring-sky-200/60',
  mix: 'from-red-600 via-rose-500 to-sky-500 text-white ring-rose-300/50',
  dark: 'from-slate-900 via-[#1a2740] to-black text-sky-200 ring-sky-500/30',
  mocha: 'from-[#7c4a2d] via-[#9c5d38] to-[#c08552] text-white ring-amber-200/40',
};
function CTA({ onClick, children, tone = 'red', className = '' }: { onClick: () => void; children: ReactNode; tone?: string; className?: string }) {
  const cls = CTA_TONES[tone] || CTA_TONES.red;
  return (
    <button type="button" onClick={onClick}
      className={`cd-cta cd-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.12em] shadow-[0_16px_40px_-12px_rgba(220,38,38,.5)] ring-2 transition hover:scale-[1.02] active:scale-95 sm:text-[15px] ${className}`}>
      <span className="cd-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function LazyImg({ src, alt, priority, className = '' }: { src: string; alt: string; priority?: boolean; className?: string }) {
  const { ref, visible } = useOnScreen();
  if (priority) {
    return (<div className={`overflow-hidden ${className}`}>{/* @ts-expect-error fetchpriority */}
      <img src={src} alt={alt} loading="eager" decoding="async" fetchpriority="high" className="block h-auto w-full object-cover" /></div>);
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {visible ? <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full object-cover" />
        : <div className="aspect-[4/5] w-full animate-pulse bg-gradient-to-br from-sky-100 to-rose-100" />}
    </div>
  );
}
function LazyVideo({ src, poster, priority }: { src: string; poster?: string; priority?: boolean }) {
  const { ref, visible } = useOnScreen('160px');
  return (
    <div ref={ref} className="overflow-hidden rounded-[2rem]">
      {(visible || priority)
        ? <video src={src} poster={poster} autoPlay muted loop playsInline preload={priority ? 'auto' : 'metadata'} className="block w-full object-cover" />
        : <div className="aspect-[9/16] w-full animate-pulse bg-gradient-to-br from-sky-100 via-rose-50 to-amber-50" />}
    </div>
  );
}

const GRAD: Record<string, string> = { red: 'cd-grad-red', sky: 'cd-grad-sky', mocha: 'cd-grad-mocha', night: 'cd-grad-night', rose: 'cd-grad-rose' };

function TunnelBlock({ bg, kicker, title, text, cta, ctaTone, gradTitle = 'red', onOrder, children }: {
  bg: string; kicker: string; title: string; text: string; cta: string; ctaTone: string; gradTitle?: string; onOrder: () => void; children: ReactNode;
}) {
  const { ref, visible } = useOnScreen();
  return (
    <section className={`relative overflow-hidden py-10 sm:py-14 ${bg}`}>
      <div className="cd-soft pointer-events-none absolute inset-0" />
      <div ref={ref} className={`relative mx-auto max-w-md px-4 text-center ${visible ? 'cd-fade-up' : 'opacity-0'}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-red-500/90">{kicker}</p>
        <h2 className={`mt-1.5 text-balance text-[21px] font-black leading-tight sm:text-[27px] ${GRAD[gradTitle] || GRAD.red}`}>{title}</h2>
        <div className="relative mt-4 overflow-hidden rounded-[2rem] shadow-[0_28px_70px_-26px_rgba(15,23,42,.5)] ring-1 ring-black/5">{children}</div>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-slate-600">{text}</p>
        <div className="mx-auto mt-4 max-w-sm"><CTA tone={ctaTone} onClick={onOrder}>{cta} <Arrow /></CTA></div>
      </div>
    </section>
  );
}

function Marquee({ items, tone }: { items: string[]; tone: string }) {
  const line = items.join('   •   ');
  return (
    <div className={`overflow-hidden border-y py-2 ${tone}`}>
      <div className="cd-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]">
        <span className="shrink-0">{line}</span><span className="shrink-0" aria-hidden>{line}</span>
      </div>
    </div>
  );
}

/* Notifications d'achats récents */
const RECENT = [
  { n: 'Awa', v: 'Cocody', c: 'Blanc' }, { n: 'Mariam', v: 'Yopougon', c: 'Rouge' },
  { n: 'Fatou', v: 'Marcory', c: 'Noir' }, { n: 'Aïcha', v: 'Treichville', c: 'Marron' },
  { n: 'Salimata', v: 'Abobo', c: 'Gris' }, { n: 'Rokia', v: 'Bingerville', c: 'Rouge' },
];
function RecentToast({ hidden }: { hidden: boolean }) {
  const [i, setI] = useState(0); const [show, setShow] = useState(false);
  useEffect(() => {
    let t: number[] = [];
    const loop = (idx: number) => { setI(idx); setShow(true);
      t.push(window.setTimeout(() => { setShow(false); t.push(window.setTimeout(() => loop((idx + 1) % RECENT.length), 3000)); }, 5000)); };
    t.push(window.setTimeout(() => loop(0), 4500));
    return () => t.forEach(clearTimeout);
  }, []);
  const o = RECENT[i];
  return (
    <div className={`fixed bottom-24 left-3 z-[55] transition-all duration-500 sm:left-4 ${show && !hidden ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'}`} role="status">
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-2.5 pr-4 shadow-[0_18px_48px_-18px_rgba(15,23,42,.3)] ring-1 ring-rose-200/80 backdrop-blur-md">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white"><Heart /></div>
        <div className="leading-tight">
          <p className="text-[13px] font-extrabold text-slate-900">{o.n} <span className="font-semibold text-slate-500">à {o.v}</span></p>
          <p className="text-[11px] text-slate-600">vient de commander · <span className="font-bold text-red-600">{o.c}</span></p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Popup commande -> POST /public/order ---------------- */
function OrderModal({ open, onClose, onFocusChange }: { open: boolean; onClose: () => void; onFocusChange: (f: boolean) => void }) {
  const navigate = useNavigate();
  const company = useMemo(co, []);
  const cd = useEndOfDayCountdown();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [color, setColor] = useState<ColorKey | ''>('');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (open) { setSubmitted(false); setErr(''); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden'; window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const total = orderTotal(PRICES, qty);
  const invalid = (v: string) => submitted && !v.trim();
  const colorInvalid = submitted && !color;

  async function submit() {
    setSubmitted(true);
    if (!name.trim() || !phone.trim() || !city.trim() || !color) {
      setErr('Veuillez remplir tous les champs et choisir une couleur.'); return;
    }
    setSending(true); setErr('');
    try {
      // 1. Résoudre le produit par code
      const pr = await axios.get(`${API_URL}/public/products`, { params: { company }, timeout: 25000 });
      const prod: Product | undefined = (pr.data?.products || []).find((p: Product) => p.code?.toUpperCase() === PRODUCT_CODE);
      if (!prod) throw new Error('Produit indisponible. Réessayez plus tard.');

      // 2. Couleur (+ notes) dans customerAddress -> visible dans la commande reçue
      const addr = `🎨 Couleur: ${color}${notes.trim() ? ` — ${notes.trim()}` : ''}`;
      const payload = {
        company, productId: prod.id,
        customerName: name.trim(), customerPhone: phone.trim(), customerCity: city.trim(),
        customerAddress: addr, quantity: qty,
        fbc: getCookie('_fbc'), fbp: getCookie('_fbp'),
        sourceUrl: window.location.href,
        metaPixelId: META_PIXEL_ID || undefined,
      };
      const res = await axios.post(`${API_URL}/public/order`, payload, { timeout: 30000 });
      const ref = res.data?.orderReference || '';
      try {
        sessionStorage.setItem('cd_last_order', JSON.stringify({ ref, color, qty, total, name: name.trim(), phone: phone.trim(), city: city.trim(), ts: Date.now() }));
      } catch { /* noop */ }
      const p = new URLSearchParams({ ref, qty: String(qty), color });
      navigate(`${THANK_YOU_URL}?${p.toString()}`);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Échec de l\'envoi. Réessayez.');
    } finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 backdrop-blur-md sm:items-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md max-h-[100svh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl ring-1 ring-rose-200/70 sm:max-h-[94vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
        </button>

        <div className="text-center">
          <h3 className="text-xl font-black text-slate-900"><span className="cd-grad-red">Commander mon chapeau</span></h3>
          <p className="mt-1 text-xs text-slate-500">Paiement à la livraison disponible</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600 ring-1 ring-red-200">
            ⏳ Offre {fmtTotal(1)} FR : {cd.h}:{cd.m}:{cd.s}
          </div>
        </div>

        <div className="mt-4 space-y-3 text-left">
          {[
            { lbl: 'Nom complet', val: name, set: setName, type: 'text', ph: 'Ex : Awa Koné', ac: 'name' },
            { lbl: 'Téléphone', val: phone, set: setPhone, type: 'tel', ph: '07 ou 05 ou 01', ac: 'tel' },
            { lbl: 'Ville / Commune', val: city, set: setCity, type: 'text', ph: 'Ex : Cocody, Yopougon…', ac: 'address-level2' },
          ].map((f) => (
            <div key={f.lbl}>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">{f.lbl}</label>
              <input value={f.val} onChange={(e) => f.set(e.target.value)} type={f.type} autoComplete={f.ac}
                inputMode={f.type === 'tel' ? 'tel' : undefined} placeholder={f.ph} disabled={sending}
                onFocus={() => onFocusChange(true)} onBlur={() => onFocusChange(false)}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 ${invalid(f.val) ? 'border-red-400' : 'border-slate-200'}`} />
            </div>
          ))}

          {/* Sélecteur couleur obligatoire avec pastilles */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Couleur souhaitée *</label>
            <p className="mb-2 text-[11px] text-slate-400">Choisissez votre couleur préférée selon le stock disponible.</p>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((c) => (
                <button key={c.key} type="button" onClick={() => setColor(c.key)} disabled={sending}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2 transition ${color === c.key ? 'border-red-500 bg-red-50' : colorInvalid ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="h-6 w-6 rounded-full shadow-inner" style={{ background: c.hex, boxShadow: c.ring ? 'inset 0 0 0 1px #cbd5e1' : undefined }} />
                  <span className="text-[10px] font-bold text-slate-600">{c.key}</span>
                </button>
              ))}
            </div>
            <select value={color} onChange={(e) => setColor(e.target.value as ColorKey)} disabled={sending}
              onFocus={() => onFocusChange(true)} onBlur={() => onFocusChange(false)}
              className={`mt-2 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-400 ${colorInvalid ? 'border-red-400' : 'border-slate-200'}`}>
              <option value="">— Sélectionnez une couleur —</option>
              {COLORS.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
            </select>
          </div>

          {/* Quantité */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Quantité</label>
            <div className="grid grid-cols-3 gap-2">
              {PACKS.map((p) => (
                <button key={p.v} type="button" onClick={() => setQty(p.v)} disabled={sending}
                  className={`relative rounded-xl border-2 px-2 py-2.5 text-center transition ${qty === p.v ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  {p.badge && <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-black uppercase text-white">{p.badge}</span>}
                  <span className="block text-[13px] font-black text-slate-900">{p.label}</span>
                  <span className="block text-[10px] text-slate-500">{fmt(p.price)} F</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes / précision (facultatif)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ex : livraison après 17h" disabled={sending}
              onFocus={() => onFocusChange(true)} onBlur={() => onFocusChange(false)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100" />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-red-50 to-sky-50 p-3 ring-1 ring-red-100">
            <div>
              <p className="text-[11px] text-slate-500">Total · {qty} {qty > 1 ? 'chapeaux' : 'chapeau'}</p>
              <p className="text-[11px] font-bold text-emerald-600">Paiement à la livraison</p>
            </div>
            <span className="text-2xl font-black cd-grad-red">{fmt(total)} F</span>
          </div>

          {err && <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-700">{err}</div>}

          <CTA tone="red" onClick={submit}>{sending ? 'Envoi en cours…' : <>Valider ma commande <Arrow /></>}</CTA>
          <p className="text-center text-[11px] text-slate-400">En validant, vous acceptez d'être recontactée pour confirmer la livraison.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Blocs tunnel (1 média unique chacun) ---------------- */
const TUNNEL: { bg: string; kicker: string; title: string; text: string; cta: string; ctaTone: string; gradTitle: string; type: 'img' | 'vid'; src: string; poster?: string }[] = [
  { bg: 'bg-gradient-to-br from-rose-50 via-white to-sky-50', kicker: 'Élégance instantanée', title: 'Un style chic sans effort', text: 'Le détail mode qui sublime votre tenue en quelques secondes.', cta: 'Je veux mon chapeau', ctaTone: 'red', gradTitle: 'red', type: 'img', src: IMG.i1 },
  { bg: 'bg-gradient-to-br from-sky-50 via-white to-slate-50', kicker: 'Voyez le rendu en vrai', title: 'Un effet très classe', text: 'Un chapeau simple, mais un rendu élégant et remarqué sur la tenue.', cta: 'Je commande maintenant', ctaTone: 'sky', gradTitle: 'sky', type: 'vid', src: IMG.v2, poster: IMG.i2 },
  { bg: 'bg-gradient-to-br from-amber-50 via-white to-rose-50', kicker: 'Parfait pour vos sorties', title: 'La touche qui fait la différence', text: 'Bureau, sortie, photos, événements — il s\'adapte à tous vos moments.', cta: 'Choisir ma couleur', ctaTone: 'mocha', gradTitle: 'mocha', type: 'img', src: IMG.i3 },
  { bg: 'bg-gradient-to-br from-slate-50 via-white to-sky-50', kicker: 'Un look chic sans effort', title: 'Élégance au quotidien', text: 'Léger, confortable et facile à porter avec toutes vos tenues.', cta: 'Profiter de l\'offre', ctaTone: 'mix', gradTitle: 'night', type: 'img', src: IMG.i4 },
  { bg: 'bg-gradient-to-br from-rose-50 via-white to-amber-50', kicker: 'Plusieurs couleurs', title: 'Sublimez chaque tenue', text: 'Disponible en plusieurs couleurs pour s\'accorder à votre style.', cta: `Commander à ${fmtTotal(1)} FR`, ctaTone: 'red', gradTitle: 'rose', type: 'img', src: IMG.i5 },
  { bg: 'bg-gradient-to-br from-sky-50 via-white to-slate-100', kicker: 'Détails premium', title: 'Une finition soignée', text: 'Des matières agréables et une coupe pensée pour un rendu haut de gamme.', cta: 'Je veux mon chapeau', ctaTone: 'sky', gradTitle: 'sky', type: 'img', src: IMG.i6 },
];

const BENEFITS = [
  { i: '👒', t: 'Style chic' }, { i: '🎨', t: 'Plusieurs couleurs' }, { i: '🪶', t: 'Léger & confortable' },
  { i: '📸', t: 'Sortie · bureau · photos' }, { i: '🚚', t: 'Livraison rapide' },
];
const REVIEWS = [
  { txt: 'J\'ai pris le blanc, il est trop chic. Ça change directement la tenue.', n: 'Awa', v: 'Cocody' },
  { txt: 'Très belle qualité, j\'aime beaucoup le rendu.', n: 'Mariam', v: 'Yopougon' },
  { txt: 'J\'ai commandé le noir et le rouge, les deux sont magnifiques.', n: 'Fatou', v: 'Marcory' },
];
const FAQ = [
  { q: 'Le chapeau est disponible en quelles couleurs ?', a: 'Noir, blanc, gris, marron et rouge selon le stock disponible.' },
  { q: 'Le prix est combien ?', a: `1 chapeau : ${fmtTotal(1)} FR · 2 chapeaux : ${fmtTotal(2)} FR · 3 chapeaux : ${fmtTotal(3)} FR. Paiement à la livraison.` },
  { q: 'Comment commander ?', a: 'Remplissez le formulaire, choisissez votre couleur puis validez votre commande.' },
  { q: 'Est-ce adapté à toutes les tenues ?', a: 'Oui, le style est chic et facile à porter avec robe, chemise, blazer, ensemble ou tenue simple.' },
];

export default function ChapeauDameLanding() {
  const company = useMemo(co, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const cd = useEndOfDayCountdown();
  const pixelFired = useRef(false);

  const open = useCallback(() => {
    setModalOpen(true);
    if (META_PIXEL_ID) { initMetaPixel(META_PIXEL_ID); window.fbq?.('track', 'InitiateCheckout', { content_name: 'Chapeau Élégant Dame', content_ids: [PRODUCT_CODE], content_type: 'product', value: PRICE, currency: 'XOF' }); }
  }, []);
  const close = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    const prev = document.title;
    document.title = `Chapeau Élégant Dame — ${fmtTotal(1)} FR | Chic & Premium`;
    trackPageView(SLUG, company);
    if (!pixelFired.current && META_PIXEL_ID) {
      pixelFired.current = true; initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', { content_name: 'Chapeau Élégant Dame', content_ids: [PRODUCT_CODE], content_type: 'product', value: PRICE, currency: 'XOF' });
    }
    return () => { document.title = prev; };
  }, [company]);

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: 'Outfit,system-ui,-apple-system,Segoe UI,sans-serif' }}>
      <style>{`
        @keyframes cd-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .cd-marquee { animation: cd-marquee 24s linear infinite }
        @keyframes cd-sheen { 0% { transform: translateX(-100%) } 60% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .cd-sheen { animation: cd-sheen 3s ease-in-out infinite }
        @keyframes cd-pulse { 0%,100% { transform: translateY(0); box-shadow: 0 16px 40px -12px rgba(220,38,38,.5) } 50% { transform: translateY(-2px); box-shadow: 0 22px 50px -10px rgba(56,189,248,.45) } }
        .cd-pulse { animation: cd-pulse 2.6s ease-in-out infinite } .cd-cta:hover { animation: none !important }
        @keyframes cd-fade-up { from { opacity:0; transform: translateY(22px) } to { opacity:1; transform: none } }
        .cd-fade-up { animation: cd-fade-up .6s cubic-bezier(.22,.8,.4,1) both }
        @keyframes cd-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .cd-grad-red { background: linear-gradient(90deg,#dc2626,#f43f5e,#fb7185,#38bdf8); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: cd-shimmer 4s linear infinite }
        .cd-grad-sky { background: linear-gradient(90deg,#0ea5e9,#38bdf8,#7dd3fc,#1e3a8a); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: cd-shimmer 4s linear infinite }
        .cd-grad-mocha { background: linear-gradient(90deg,#7c4a2d,#9c5d38,#c08552,#dc2626); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: cd-shimmer 4s linear infinite }
        .cd-grad-night { background: linear-gradient(90deg,#1e3a8a,#2563eb,#dc2626,#0ea5e9); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: cd-shimmer 4s linear infinite }
        .cd-grad-rose { background: linear-gradient(90deg,#e11d48,#fb7185,#fda4af,#38bdf8); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: cd-shimmer 4s linear infinite }
        .cd-soft { background: radial-gradient(60% 40% at 18% 0%, rgba(244,63,94,.06), transparent 60%), radial-gradient(50% 40% at 90% 15%, rgba(56,189,248,.07), transparent 60%); }
        @media (prefers-reduced-motion: reduce) { .cd-pulse,.cd-sheen,.cd-marquee,.cd-fade-up,[class^="cd-grad-"] { animation: none !important } }
      `}</style>

      {/* Barres + compte à rebours */}
      <div className="sticky top-0 z-50 shadow-md">
        <Marquee tone="bg-gradient-to-r from-red-600 via-rose-500 to-red-500 text-white border-red-400/30"
          items={['Offre du jour', `Chapeau Élégant Dame à ${fmtTotal(1)} FR`, 'Paiement à la livraison', 'Stock limité selon les couleurs', 'Livraison rapide']} />
        <div className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-slate-900 via-[#1a2740] to-sky-700 px-4 py-2">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Offre {fmtTotal(1)} FR dans</span>
          {[cd.h, cd.m, cd.s].map((v, i) => (
            <span key={i} className="inline-flex flex-col items-center">
              <span className="grid min-w-[2.2rem] place-items-center rounded-lg bg-white/10 px-1.5 py-0.5 text-base font-black tabular-nums text-white ring-1 ring-white/20">{v}</span>
              <span className="mt-0.5 text-[7px] font-bold uppercase text-white/60">{['h', 'min', 'sec'][i]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50 via-white to-sky-50 py-8 sm:py-12">
        <div className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-md px-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/70 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-red-500 backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-red-500" /> Collection mode 2026 <span className="h-1 w-1 rounded-full bg-sky-400" />
          </p>
          <h1 className="mt-4 text-[32px] font-black leading-[1.05] sm:text-[44px]">
            <span className="cd-grad-red">Chapeaux Élégants</span><br /><span className="text-slate-900">Dame</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] font-semibold text-slate-600">Le détail chic qui transforme votre tenue en quelques secondes.</p>
          <div className="mt-4 flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-slate-400">Seulement</span>
            <span className="cd-grad-red text-5xl font-black">{fmtTotal(1)}</span>
            <span className="text-lg font-bold text-slate-600">FR</span>
          </div>
          <div className="mx-auto mt-6 max-w-[19rem] overflow-hidden rounded-[2.2rem] ring-4 ring-white shadow-[0_36px_80px_-28px_rgba(15,23,42,.5)]">
            <LazyVideo src={IMG.v1} poster={IMG.poster} priority />
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA tone="red" onClick={open}><Heart /> Commander maintenant <Arrow /></CTA></div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200">✓ Paiement à la livraison</span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600 ring-1 ring-red-200">🔥 Stock limité selon les couleurs</span>
          </div>
        </div>
      </section>

      {/* Bandeau bénéfices */}
      <section className="border-y border-slate-100 bg-white py-5">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-3 px-4">
          {BENEFITS.map((b) => (
            <div key={b.t} className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600"><span className="text-lg">{b.i}</span>{b.t}</div>
          ))}
        </div>
      </section>

      {/* Couleurs disponibles */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-rose-50 py-10">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h2 className="text-[24px] font-black cd-grad-night sm:text-[28px]">Choisissez votre couleur</h2>
          <p className="mt-1.5 text-sm text-slate-500">Choisissez la couleur qui complète votre style.</p>
          <div className="mt-6 grid grid-cols-5 gap-2.5">
            {COLORS.map((c) => (
              <button key={c.key} type="button" onClick={open} className="group flex flex-col items-center gap-1.5">
                <span className="h-12 w-12 rounded-2xl shadow-md ring-1 ring-black/5 transition group-hover:scale-105" style={{ background: c.hex, boxShadow: c.ring ? 'inset 0 0 0 1px #e2e8f0' : undefined }} />
                <span className="text-[11px] font-bold text-slate-600">{c.key}</span>
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA tone="mix" onClick={open}>Choisir ma couleur <Arrow /></CTA></div>
        </div>
      </section>

      {/* Blocs tunnel */}
      {TUNNEL.map((b, i) => (
        <TunnelBlock key={i} bg={b.bg} kicker={b.kicker} title={b.title} text={b.text} cta={b.cta} ctaTone={b.ctaTone} gradTitle={b.gradTitle} onOrder={open}>
          {b.type === 'vid' ? <LazyVideo src={b.src} poster={b.poster} /> : <LazyImg src={b.src} alt={b.title} />}
        </TunnelBlock>
      ))}

      {/* Avant / Après */}
      <section className="bg-gradient-to-br from-slate-900 via-[#1a2740] to-slate-900 py-12 text-white">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h2 className="text-[24px] font-black cd-grad-sky sm:text-[28px]">Avant / Après le chapeau</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Avant</p>
              <div className="mt-3 overflow-hidden rounded-xl"><LazyImg src={IMG.i7} alt="Tenue simple" /></div>
              <p className="mt-2 text-[12px] text-slate-300">Tenue simple</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-red-400/30">
              <p className="text-[11px] font-black uppercase tracking-wider text-red-400">Après</p>
              <div className="mt-3 overflow-hidden rounded-xl"><LazyImg src={IMG.i1} alt="Look chic" /></div>
              <p className="mt-2 text-[12px] text-slate-200">Look chic, élégant et remarqué</p>
            </div>
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA tone="red" onClick={open}>Je veux ce look <Arrow /></CTA></div>
        </div>
      </section>

      {/* Pourquoi elles aiment */}
      <section className="bg-white py-11">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h2 className="text-[24px] font-black cd-grad-rose sm:text-[28px]">Pourquoi elles l'adorent</h2>
          <p className="mt-1.5 text-sm text-slate-500">Un accessoire simple, mais qui change tout le look.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            {['Il va avec presque toutes les tenues', 'Il donne un style chic rapidement', 'Il existe en plusieurs couleurs', 'Il est léger et agréable à porter'].map((t) => (
              <div key={t} className="flex items-start gap-2 rounded-2xl bg-rose-50/60 p-3 ring-1 ring-rose-100">
                <span className="mt-0.5 text-red-500">✓</span><span className="text-[13px] font-semibold text-slate-700">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offre spéciale + packs */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-red-500 py-12 text-white">
        <div className="relative mx-auto max-w-lg px-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Offre spéciale aujourd'hui</p>
          <h2 className="mt-2 text-[26px] font-black sm:text-[32px]">1 chapeau élégant à {fmtTotal(1)} FR</h2>
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {PACKS.map((p) => (
              <button key={p.v} type="button" onClick={open} className="relative rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20">
                {p.badge && <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-2 py-0.5 text-[8px] font-black uppercase text-white">{p.badge}</span>}
                <p className="text-[13px] font-black">{p.label}</p>
                <p className="mt-0.5 text-[10px] text-white/70">{p.sub}</p>
                <p className="mt-1 text-base font-black">{fmt(p.price)} F</p>
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <button type="button" onClick={open} className="cd-pulse cd-cta group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 py-4 text-[15px] font-black uppercase tracking-[0.12em] text-red-600 shadow-xl ring-2 ring-white transition hover:scale-[1.02]">
              <span className="cd-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-red-200/50 to-transparent" />
              <span className="relative z-10 flex items-center gap-2"><Heart /> Profiter de l'offre <Arrow /></span>
            </button>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-rose-50 py-11">
        <div className="mx-auto max-w-lg px-4">
          <h2 className="text-center text-[24px] font-black cd-grad-night sm:text-[28px]">Elles ont commandé</h2>
          <div className="mt-6 space-y-3">
            {REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-black text-slate-800">{r.n} · {r.v}</span>
                  <span className="text-amber-400">★★★★★</span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">“{r.txt}”</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {['Clientes satisfaites', 'Plusieurs couleurs', 'Livraison rapide', 'Commande simple'].map((t) => (
              <div key={t} className="rounded-xl bg-white px-2 py-3 text-[11px] font-bold text-slate-600 ring-1 ring-slate-100">{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-11">
        <div className="mx-auto max-w-lg px-4">
          <h2 className="text-center text-[24px] font-black cd-grad-red sm:text-[28px]">Questions fréquentes</h2>
          <div className="mt-6 space-y-2.5">
            {FAQ.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
                  <span className="text-[13.5px] font-bold text-slate-800">{f.q}</span>
                  <span className={`shrink-0 text-red-500 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                  </span>
                </button>
                {openFaq === i && <p className="px-4 pb-4 text-[13px] leading-relaxed text-slate-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-sky-50 py-12">
        <div className="relative mx-auto max-w-md px-4 text-center">
          <h2 className="text-[26px] font-black cd-grad-red">Offrez-vous ce style chic</h2>
          <p className="mt-2 text-sm text-slate-500">{fmtTotal(1)} FR · Paiement à la livraison · Plusieurs couleurs disponibles</p>
          <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-[12px] font-bold text-white">⏳ Offre à {fmtTotal(1)} FR : {cd.h}:{cd.m}:{cd.s}</div>
          <div className="mx-auto mt-5 max-w-sm"><CTA tone="red" onClick={open}><Heart /> Commander à {fmtTotal(1)} FR <Arrow /></CTA></div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white py-8 pb-28 text-center text-[11px] text-slate-400">
        <p className="font-bold uppercase tracking-[0.3em] text-slate-500">Chapeau Élégant Dame</p>
        <p className="mt-2">Paiement à la livraison · Livraison rapide partout en Côte d`Ivoire</p>
      </footer>

      {/* CTA flottant mobile (se cache pendant la saisie) */}
      <div className={`fixed inset-x-0 bottom-0 z-[70] border-t border-rose-200 bg-white/95 backdrop-blur-md transition-transform duration-300 ${typing || modalOpen ? 'translate-y-full' : 'translate-y-0'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-md items-center gap-3 px-3 py-2.5">
          <div className="leading-tight">
            <p className="text-[15px] font-black cd-grad-red">{fmtTotal(1)} FR</p>
            <p className="text-[10px] font-bold text-emerald-600">Paiement à la livraison</p>
          </div>
          <button type="button" onClick={open} className="cd-pulse group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 px-4 py-3.5 text-[14px] font-black uppercase tracking-[0.1em] text-white shadow-[0_-6px_28px_-8px_rgba(220,38,38,.6)] ring-2 ring-red-300/50 transition active:scale-95">
            <span className="cd-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <span className="relative z-10 flex items-center gap-2"><Heart /> Commander — {fmtTotal(1)} FR</span>
          </button>
        </div>
      </div>

      <RecentToast hidden={typing || modalOpen} />
      <OrderModal open={modalOpen} onClose={close} onFocusChange={setTyping} />
    </div>
  );
}
