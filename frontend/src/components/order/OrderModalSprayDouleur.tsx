/**
 * Modal de commande pour "Spray Anti-Douleur TK" — v2 (fix mobile fullscreen).
 *
 * Style : "Receipt/Ticket premium light" preserve.
 *   - Fond blanc epure, cadres arrondis + trait vertical lime sur le cote
 *   - Pills HORIZONTALES pour la quantite
 *   - Inputs "floating icons" avec underline lime au focus
 *   - Recap style ticket de caisse (lignes pointillees, sous-total, economies)
 *
 * v2 : Layout flexbox fullscreen mobile + footer sticky avec total + CTA
 *      pour eviter que le bouton "Confirmer et payer" disparaisse sous le
 *      clavier mobile.
 *
 * Logique metier 100 % inchangee (useOrderSubmit -> obgestion).
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';
import { cleanPhoneCI } from '../../utils/phone';
import OrderFormWarning from './OrderFormWarning';

interface QtyOption {
  v: number;
  label: string;
  sub: string;
  tag?: string;
  save?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cfg: OrderSubmitConfig & { images: { hero: string; avant?: string; apres?: string; comparison?: { before: string; after: string } } };
  product: OrderProduct | null;
  setProduct?: (p: OrderProduct | null) => void;
  qtyOptions: QtyOption[];
  initialQty?: number;
}

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

const IconUser = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);
const IconPhone = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11 11 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
  </svg>
);
const IconPin = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);
const IconClock = () => (
  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IconSpray = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 2h4v2H9V2zm-2 4h8v3H7V6zm1 4h6v11a1 1 0 01-1 1H9a1 1 0 01-1-1V10zm5-7v1h-4V3h4z"/>
  </svg>
);

export default function OrderModalSprayDouleur({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(14);
  const [countdown, setCountdown] = useState({ m: 14, s: 59 });

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setCountdown({ m: 14, s: 59 });
      setStock(9 + Math.floor(Math.random() * 7));
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) wasOpenRef.current = false;
  }, [open, initialQty]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setCountdown(c => {
        const total = Math.max(0, c.m * 60 + c.s - 1);
        return { m: Math.floor(total / 60), s: total % 60 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !sending) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, sending, onClose]);

  if (!open) return null;

  const unitPrice = cfg.prices?.[1] || 0;
  const total = cfg.prices?.[qty] || unitPrice;
  const fullPrice = unitPrice * qty;
  const saving = fullPrice - total;
  const oldFullPrice = fullPrice + (qty * 5000);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spm-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-neutral-900/70 backdrop-blur-md animate-[spmfade_.2s_ease-out]"
      />

      {/* Container shell - flexbox vertical avec h-[100svh] mobile + max-w-[420px] desktop */}
      <div className="spm-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-white shadow-[0_-20px_60px_-12px_rgba(0,0,0,.4)] animate-[spmslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[92vh] sm:max-w-[420px] sm:rounded-[28px]">

        {/* Liseret lime vertical sur le cote gauche - signature visuelle */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-lime-400 via-green-400 to-emerald-500"/>

        {/* ========== HEADER (flex-none) ========== */}
        <div className="relative flex-none">
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 via-green-400 to-emerald-400 text-neutral-900 shadow-[0_4px_14px_rgba(132,204,22,.5)]">
                <IconSpray/>
              </div>
              <div>
                <h3 id="spm-title" className="text-[14px] font-black leading-tight text-neutral-900">
                  Spray Anti-Douleur TK
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <IconClock/>
                  <span className="font-mono tabular-nums">
                    {pad(countdown.m)}:<span className="spm-pulse-digit">{pad(countdown.s)}</span>
                  </span>
                  <span className="text-neutral-400">· offre</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:scale-105 disabled:opacity-50"
              disabled={sending}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative flex items-center gap-2 px-5">
            <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Stock</span>
            <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all" style={{ width: `${Math.max(20, Math.min(100, Math.round((stock / 30) * 100)))}%` }}/>
            </div>
            <span className="text-[10px] font-black tabular-nums text-emerald-600">{stock} restants</span>
          </div>

          <div className="relative px-5 pt-3">
            <div className="border-t border-dashed border-neutral-200"/>
          </div>
        </div>

        {/* ========== BODY (flex-1, scrollable) ========== */}
        <form
          id="spm-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-5 pt-3 pb-4"
        >
          <OrderFormWarning>
            Soyez <strong>présent</strong> à l’adresse de livraison : <strong>express 24-48 h</strong> partout en CI. Paiement uniquement en <strong>cash</strong> à la livraison.
          </OrderFormWarning>

          {/* QUANTITE pills horizontales */}
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500">Quantite</p>
            <div className="flex gap-1.5">
              {qtyOptions.map((o) => {
                const active = qty === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setQty(o.v)}
                    className={`group relative flex-1 overflow-hidden rounded-2xl px-2 py-2.5 transition-all ${
                      active
                        ? 'bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 ring-2 ring-lime-500 shadow-[0_4px_14px_rgba(132,204,22,.25)]'
                        : 'bg-neutral-50 ring-1 ring-neutral-200 hover:ring-lime-300 hover:bg-lime-50/40'
                    }`}
                  >
                    {o.tag && (
                      <span className={`absolute -right-1 -top-1 rounded-full bg-gradient-to-r from-lime-500 to-emerald-500 px-1.5 py-px text-[7px] font-black uppercase tracking-wider text-white shadow-md ${active ? 'scale-110' : ''}`}>
                        {o.v === 2 ? 'TOP' : 'DEAL'}
                      </span>
                    )}
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className={`text-[22px] font-black leading-none ${active ? 'bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent' : 'text-neutral-800'}`}>
                        {o.v}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">x</span>
                    </div>
                    <p className={`mt-1 text-center text-[10px] font-black ${active ? 'text-emerald-600' : 'text-neutral-600'}`}>
                      {o.sub.replace(' FCFA', ' F')}
                    </p>
                    {active && (
                      <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-lime-500 to-emerald-500"/>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INPUTS focus-within wrappers preserves */}
          <div className="space-y-2">
            <label className="group relative block">
              <div className="flex h-11 items-center gap-2 rounded-xl bg-neutral-50 px-3 ring-1 ring-neutral-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-lime-400">
                <span className="text-neutral-400 group-focus-within:text-emerald-600 transition-colors"><IconUser/></span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom complet"
                  autoComplete="name"
                  required
                  className="w-full bg-transparent text-[15px] sm:text-[14px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
                />
                {name.length > 1 && <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
              </div>
            </label>

            <label className="group relative block">
              <div className="flex h-11 items-center gap-2 rounded-xl bg-neutral-50 px-3 ring-1 ring-neutral-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-lime-400">
                <span className="text-neutral-400 group-focus-within:text-emerald-600 transition-colors"><IconPhone/></span>
                <span className="text-[12px] font-black text-neutral-600">🇨🇮 +225</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                  placeholder="07 00 00 00 00"
                  autoComplete="tel-national"
                  required
                  className="w-full bg-transparent text-[15px] sm:text-[14px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
                />
                {phone.length >= 8 && <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
              </div>
            </label>

            <label className="group relative block">
              <div className="flex h-11 items-center gap-2 rounded-xl bg-neutral-50 px-3 ring-1 ring-neutral-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-lime-400">
                <span className="text-neutral-400 group-focus-within:text-emerald-600 transition-colors"><IconPin/></span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ville (Abidjan, Bouake...)"
                  autoComplete="address-level2"
                  required
                  className="w-full bg-transparent text-[15px] sm:text-[14px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
                />
                {city.length > 1 && <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
              </div>
            </label>
          </div>

          {/* RECAP TICKET */}
          <div className="border-t border-dashed border-neutral-200 pt-3 space-y-1 text-[12px]">
            <div className="flex items-baseline justify-between">
              <span className="text-neutral-500">Sous-total ({qty} spray{qty > 1 ? 's' : ''})</span>
              <span className="font-bold tabular-nums text-neutral-700">{fmt(fullPrice)}</span>
            </div>
            {saving > 0 && (
              <div className="flex items-baseline justify-between">
                <span className="text-neutral-500">Remise quantite</span>
                <span className="font-bold tabular-nums text-emerald-600">-{fmt(saving)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-neutral-500">Livraison</span>
              <span className="inline-flex items-center gap-1 font-black tabular-nums text-emerald-600">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"/></svg>
                GRATUIT
              </span>
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}
        </form>

        {/* ========== FOOTER (flex-none, sticky bottom) ========== */}
        <div
          className="flex-none border-t border-neutral-200 bg-white px-5 pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2.5 flex items-baseline justify-between rounded-xl bg-gradient-to-r from-lime-50 via-green-50 to-emerald-50 px-3 py-2 ring-1 ring-lime-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700">Total a payer</span>
            <div className="flex items-baseline gap-2">
              {qty > 1 && <span className="text-[10px] text-neutral-400 line-through">{fmt(oldFullPrice)}</span>}
              <span className="bg-gradient-to-r from-lime-600 via-green-600 to-emerald-600 bg-clip-text text-[20px] font-black tabular-nums text-transparent">
                {fmt(total)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            form="spm-form"
            disabled={sending}
            className="spm-cta group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 text-[15px] font-black text-white shadow-[0_10px_24px_-4px_rgba(16,185,129,.55)] transition hover:shadow-[0_14px_30px_-4px_rgba(16,185,129,.75)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="spm-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"/>
            {sending ? (
              <><span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /><span className="relative">Envoi...</span></>
            ) : (
              <>
                <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="relative">Confirmer et payer a la livraison</span>
              </>
            )}
          </button>

          <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] font-semibold text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              Cash a la livraison
            </span>
            <span className="h-3 w-px bg-neutral-200"/>
            <span className="inline-flex items-center gap-1">
              <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Sans risque
            </span>
            <span className="h-3 w-px bg-neutral-200"/>
            <span className="inline-flex items-center gap-1">
              <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/></svg>
              Livraison 24h
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spmfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes spmslide { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes spmPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes spmSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes spmFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        .spm-pulse-digit { animation: spmPulseDigit 1s ease-in-out infinite }
        .spm-cta { animation: spmFloat 2.8s ease-in-out infinite }
        .spm-cta:hover { animation: none; transform: translateY(-2px) }
        .spm-cta-sheen { animation: spmSheen 3.4s ease-in-out infinite }

        @supports (height: 100svh) { .spm-shell { height: 100svh; } }
        @media (min-width: 640px) { .spm-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .spm-shell input:focus,
          .spm-shell textarea:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
