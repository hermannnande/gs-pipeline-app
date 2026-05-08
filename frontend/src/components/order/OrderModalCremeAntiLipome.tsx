/**
 * Modal commande — Creme Anti-Lipome (CREME_ANTI_LIPOME).
 * Palette vert emeraude + lime + ivoire. Compte a rebours interne, recap facture,
 * sticky CTA glow, fullscreen mobile.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
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
  cfg: OrderSubmitConfig & {
    images: { hero: string; avant?: string; apres?: string; comparison?: { before: string; after: string } };
  };
  product: OrderProduct | null;
  setProduct?: (p: OrderProduct | null) => void;
  qtyOptions: QtyOption[];
  initialQty?: number;
}

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
const pad = (n: number) => String(n).padStart(2, '0');

export default function OrderModalCremeAntiLipome({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(11);
  const [countdown, setCountdown] = useState({ m: 9, s: 59 });

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setCountdown({ m: 9, s: 59 });
      setStock(7 + Math.floor(Math.random() * 6));
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) wasOpenRef.current = false;
  }, [open, initialQty]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setCountdown((c) => {
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

  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const unitPrice = cfg.prices?.[1] || 0;
  const fullPrice = unitPrice * qty;
  const saving = fullPrice - total;
  const oldTotal = fullPrice + qty * 5000;

  const qtyIndex = useMemo(() => qtyOptions.findIndex((o) => o.v === qty), [qty, qtyOptions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cal-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-emerald-950/70 backdrop-blur-md animate-[calfade_.2s_ease-out]"
      />

      <div className="cal-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-white shadow-2xl animate-[calslide_.3s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[94vh] sm:max-w-[440px] sm:rounded-[28px]">
        <div className="h-1.5 w-full flex-none bg-gradient-to-r from-emerald-400 via-lime-400 to-green-500 cal-bar-glow" />

        {/* HEADER */}
        <div className="relative flex-none bg-gradient-to-b from-emerald-50/80 to-white">
          <div className="relative flex items-start justify-between gap-3 px-5 pb-2 pt-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-lime-500 to-green-600 text-white shadow-[0_8px_24px_-6px_rgba(16,185,129,.6)]">
                <span className="absolute inset-0 rounded-xl bg-white/10 cal-pulse-ring" />
                <svg className="relative h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0v-6m0-6v.01" />
                </svg>
              </div>
              <div>
                <h3 id="cal-title" className="text-[15px] font-black leading-tight text-emerald-950">
                  Crème <span className="bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent">anti-lipome</span>
                </h3>
                <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-black text-emerald-800">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono tabular-nums">
                      {pad(countdown.m)}:<span className="cal-pulse-digit">{pad(countdown.s)}</span>
                    </span>
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                    -34%
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              disabled={sending}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stock bar - compact */}
          <div className="flex items-center gap-2 px-5 pb-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-lime-400 to-green-500 transition-all"
                style={{ width: `${Math.max(20, Math.min(100, Math.round((stock / 25) * 100)))}%` }}
              />
            </div>
            <span className="text-[10px] font-black tabular-nums text-emerald-700">
              {stock} restants
            </span>
          </div>
        </div>

        <form
          id="cal-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="cal-body relative flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-3 pt-2"
        >
          <OrderFormWarning>
            Assurez-vous d’être <strong>disponible</strong> à l’adresse indiquée pour recevoir le colis sous <strong>24-48 h</strong>. Le livreur appellera à votre arrivée.
          </OrderFormWarning>

          {/* QUANTITE - segmented control */}
          <div>
            <label className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Choisis ton pack</span>
              {qty > 1 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                  -{fmt(saving)}
                </span>
              )}
            </label>
            <div className="relative rounded-xl bg-emerald-50 p-1 ring-1 ring-emerald-100">
              <div
                className="absolute inset-y-1 left-1 rounded-lg bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 shadow-[0_4px_18px_rgba(16,185,129,.5)] transition-all duration-300 ease-out"
                style={{
                  width: `calc((100% - 8px) / ${qtyOptions.length})`,
                  transform: `translateX(${qtyIndex * 100}%)`,
                }}
              />
              <div className="relative grid" style={{ gridTemplateColumns: `repeat(${qtyOptions.length}, 1fr)` }}>
                {qtyOptions.map((o) => {
                  const active = qty === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setQty(o.v)}
                      className={`relative z-10 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 transition-colors ${active ? 'text-white' : 'text-emerald-700 hover:text-emerald-900'}`}
                    >
                      <span className="text-[18px] font-black leading-none">{o.v}</span>
                      <span className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${active ? 'text-white/85' : 'text-emerald-600/80'}`}>
                        {o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COORDONNEES */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Coordonnées</p>

            <div>
              <label htmlFor="cal-name" className="mb-0.5 block text-[10px] font-bold text-emerald-600">Nom complet</label>
              <input
                type="text"
                id="cal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Aminata K."
                autoComplete="name"
                required
                className="block h-10 w-full rounded-lg border border-emerald-200 bg-white px-3 text-[15px] font-medium text-emerald-950 outline-none transition placeholder:text-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 sm:text-[14px]"
              />
            </div>

            <div>
              <label htmlFor="cal-phone" className="mb-0.5 block text-[10px] font-bold text-emerald-600">Téléphone</label>
              <div className="flex h-10 overflow-hidden rounded-lg border border-emerald-200 bg-white transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25">
                <span className="flex items-center gap-1 border-r border-emerald-100 bg-emerald-50 px-3 text-[13px] font-bold text-emerald-800">
                  <span>🇨🇮</span>
                  <span className="font-mono">+225</span>
                </span>
                <input
                  type="tel"
                  id="cal-phone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                  placeholder="07 XX XX XX XX"
                  autoComplete="tel-national"
                  required
                  className="h-full w-full bg-white px-3 text-[15px] font-medium text-emerald-950 outline-none placeholder:text-emerald-300 sm:text-[14px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cal-city" className="mb-0.5 block text-[10px] font-bold text-emerald-600">Ville de livraison</label>
              <input
                type="text"
                id="cal-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Abidjan, Bouaké, Daloa…"
                autoComplete="address-level2"
                required
                className="block h-10 w-full rounded-lg border border-emerald-200 bg-white px-3 text-[15px] font-medium text-emerald-950 outline-none transition placeholder:text-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 sm:text-[14px]"
              />
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}
        </form>

        {/* Indicateur de scroll - fade en bas du form */}
        <div className="cal-scroll-fade pointer-events-none -mt-3 h-3 w-full bg-gradient-to-t from-white to-transparent" />

        {/* FOOTER sticky avec recap + CTA glow */}
        <div
          className="flex-none border-t border-emerald-100 bg-white px-5 pt-2 shadow-[0_-6px_20px_-6px_rgba(16,185,129,0.18)]"
          style={{ paddingBottom: 'calc(0.7rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2 rounded-xl bg-gradient-to-br from-emerald-50 via-white to-lime-50/70 p-2.5 ring-1 ring-emerald-100">
            <div className="space-y-0.5 text-[12px]">
              <div className="flex items-baseline justify-between">
                <span className="text-emerald-700">Sous-total · {qty} tube{qty > 1 ? 's' : ''}</span>
                <span className="font-bold tabular-nums text-emerald-900">{fmt(fullPrice)}</span>
              </div>
              {saving > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-emerald-700">Remise pack</span>
                  <span className="font-bold tabular-nums text-emerald-600">-{fmt(saving)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-emerald-700">Livraison</span>
                <span className="inline-flex items-center gap-1 font-black tabular-nums text-emerald-600">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.7 4.15a.75.75 0 01.14 1.05l-8 10.5a.75.75 0 01-1.13.08l-4.5-4.5a.75.75 0 011.06-1.06l3.9 3.89 7.48-9.82a.75.75 0 011.05-.14z"/></svg>
                  GRATUIT
                </span>
              </div>
            </div>
            <div className="my-1.5 border-t border-dashed border-emerald-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Total</span>
              <div className="flex items-baseline gap-2">
                {qty > 1 && <span className="text-[11px] text-emerald-400 line-through">{fmt(oldTotal)}</span>}
                <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 bg-clip-text text-[20px] font-black tabular-nums text-transparent">
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="cal-form"
            disabled={sending}
            className="cal-cta group relative flex h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 text-[14px] font-black text-white shadow-[0_14px_30px_-6px_rgba(16,185,129,.6)] ring-2 ring-white/30 transition hover:shadow-[0_18px_36px_-6px_rgba(16,185,129,.8)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="cal-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            {sending ? (
              <>
                <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="relative">Envoi en cours…</span>
              </>
            ) : (
              <>
                <svg className="relative h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.62-4.02A11.96 11.96 0 0112 2.94a11.96 11.96 0 01-8.62 3.04A12.02 12.02 0 003 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02z" />
                </svg>
                <span className="relative">Confirmer ma commande</span>
              </>
            )}
          </button>

          <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] font-semibold text-emerald-600">
            <span>🔒 Paiement à la livraison</span>
            <span className="h-3 w-px bg-emerald-200" />
            <span>📦 Express CI</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes calfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes calslide { from { transform: translateY(36px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes calPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
        @keyframes calSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes calBarGlow { 0%,100% { filter: brightness(1) saturate(1) } 50% { filter: brightness(1.3) saturate(1.4) } }
        @keyframes calPulseRing { 0% { transform: scale(.95); opacity: .7 } 100% { transform: scale(1.4); opacity: 0 } }
        .cal-pulse-digit { animation: calPulseDigit 1s ease-in-out infinite }
        .cal-bar-glow { animation: calBarGlow 2.4s ease-in-out infinite }
        .cal-pulse-ring { animation: calPulseRing 1.6s cubic-bezier(0,0,.2,1) infinite }
        .cal-cta-sheen { animation: calSheen 3.2s ease-in-out infinite }
        @supports (height: 100svh) { .cal-shell { height: 100svh; } }
        @media (min-width: 640px) { .cal-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .cal-shell input:focus, .cal-shell textarea:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
