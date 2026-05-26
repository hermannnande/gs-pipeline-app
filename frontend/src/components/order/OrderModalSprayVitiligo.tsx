/**
 * Modal commande — Spray Vitiligo (CREME_VITILIGO).
 * Palette PREMIUM BLEU medical : bleu nuit + bleu profond + cyan.
 * Compte a rebours interne, recap facture, sticky CTA glow bleu, fullscreen mobile.
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

export default function OrderModalSprayVitiligo({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(12);
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
      setStock(7 + Math.floor(Math.random() * 8));
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
  const oldTotal = fullPrice + qty * 4000;

  const qtyIndex = useMemo(() => qtyOptions.findIndex((o) => o.v === qty), [qty, qtyOptions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sv-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-[#042366]/85 backdrop-blur-md animate-[svfade_.2s_ease-out]"
      />

      <div className="sv-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-white shadow-2xl animate-[svslide_.3s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[94vh] sm:max-w-[440px] sm:rounded-[28px]">
        <div className="h-1 w-full flex-none bg-gradient-to-r from-[#38BDF8] via-[#0B5ED7] to-[#063B8E] sv-bar-glow" />

        {/* HEADER bleu dégradé */}
        <div className="relative flex-none bg-gradient-to-br from-[#063B8E] via-[#0B5ED7] to-[#0B5ED7] text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/30 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-300/25 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3 px-5 pb-2 pt-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0B5ED7] shadow-[0_8px_24px_-6px_rgba(56,189,248,0.5)] ring-1 ring-sky-200">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 2c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v2h-6V2zm-2 4h10v3l-1 1v9c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2v-9l-1-1V6z" />
                </svg>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.32em] text-sky-200">Soin ciblé peau</p>
                <h3 id="sv-title" className="mt-0.5 text-[15px] font-black leading-tight">
                  Spray <span className="text-sky-200">Vitiligo</span>
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-black text-sky-100 ring-1 ring-white/30 backdrop-blur">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono tabular-nums">
                      {pad(countdown.m)}:<span className="sv-pulse-digit">{pad(countdown.s)}</span>
                    </span>
                  </span>
                  <span className="rounded-full bg-sky-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#063B8E]">
                    Offre du jour
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-50 ring-1 ring-white/20"
              disabled={sending}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 px-5 pb-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-gradient-to-r from-sky-300 via-sky-200 to-white transition-all"
                style={{ width: `${Math.max(20, Math.min(100, Math.round((stock / 25) * 100)))}%` }}
              />
            </div>
            <span className="text-[10px] font-black tabular-nums text-sky-100">
              {stock} restants
            </span>
          </div>
        </div>

        <form
          id="sv-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-3 pt-3"
        >
          <input type="hidden" name="produit" value="CREME_VITILIGO" />

          <div className="rounded-xl bg-sky-50 p-2.5 ring-1 ring-sky-200">
            <p className="text-[11px] text-slate-700">
              <strong className="text-[#063B8E]">Remplissez vos informations.</strong>
              {' '}Un conseiller vous contactera rapidement pour confirmer votre commande.
            </p>
          </div>

          <OrderFormWarning title="Avant de commander">
            Soyez <strong>disponible</strong> pour la livraison sous <strong>24-48 h</strong>. Paiement <strong>cash</strong> à la réception.
          </OrderFormWarning>

          {/* QUANTITE - segmented control bleu */}
          <div>
            <label className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">Choisissez votre pack</span>
              {qty > 1 && saving > 0 && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black text-[#063B8E] ring-1 ring-sky-300">
                  -{fmt(saving)}
                </span>
              )}
            </label>
            <div className="relative rounded-xl bg-sky-50 p-1 ring-1 ring-sky-200">
              <div
                className="absolute inset-y-1 left-1 rounded-lg bg-gradient-to-br from-[#0B5ED7] via-[#1d6fe0] to-[#063B8E] shadow-[0_4px_18px_rgba(11,94,215,.45)] transition-all duration-300 ease-out"
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
                      className={`relative z-10 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 transition-colors ${active ? 'text-white' : 'text-[#063B8E]/80 hover:text-[#063B8E]'}`}
                    >
                      <span className="text-[18px] font-black leading-none">{o.v}</span>
                      <span className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${active ? 'text-sky-200' : 'text-[#0B5ED7]/70'}`}>
                        {o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">Coordonnées</p>

            <div>
              <label htmlFor="sv-name" className="mb-0.5 block text-[10px] font-bold text-slate-500">Nom complet</label>
              <input
                type="text"
                id="sv-name"
                name="nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Mariam K."
                autoComplete="name"
                required
                className="block h-11 w-full rounded-lg border border-sky-200 bg-white px-3 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B5ED7] focus:ring-2 focus:ring-[#0B5ED7]/25 sm:text-[14px]"
              />
            </div>

            <div>
              <label htmlFor="sv-phone" className="mb-0.5 block text-[10px] font-bold text-slate-500">Téléphone</label>
              <div className="flex h-11 overflow-hidden rounded-lg border border-sky-200 bg-white transition focus-within:border-[#0B5ED7] focus-within:ring-2 focus-within:ring-[#0B5ED7]/25">
                <span className="flex items-center gap-1 border-r border-sky-200 bg-sky-50 px-3 text-[13px] font-bold text-slate-700">
                  <span>🇨🇮</span>
                  <span className="font-mono">+225</span>
                </span>
                <input
                  type="tel"
                  id="sv-phone"
                  name="telephone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                  placeholder="07 XX XX XX XX"
                  autoComplete="tel-national"
                  required
                  className="h-full w-full bg-white px-3 text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400 sm:text-[14px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sv-city" className="mb-0.5 block text-[10px] font-bold text-slate-500">Ville / Commune</label>
              <input
                type="text"
                id="sv-city"
                name="ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cocody, Yopougon, Bingerville…"
                autoComplete="address-level2"
                required
                className="block h-11 w-full rounded-lg border border-sky-200 bg-white px-3 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B5ED7] focus:ring-2 focus:ring-[#0B5ED7]/25 sm:text-[14px]"
              />
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}
        </form>

        {/* FOOTER recap + CTA bleu glow */}
        <div
          className="flex-none border-t border-sky-100 bg-white px-5 pt-2.5 shadow-[0_-6px_20px_-6px_rgba(11,94,215,0.12)]"
          style={{ paddingBottom: 'calc(0.7rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2 rounded-xl bg-sky-50/70 p-2.5 ring-1 ring-sky-100">
            <div className="space-y-0.5 text-[12px]">
              <div className="flex items-baseline justify-between">
                <span className="text-slate-600">Sous-total · {qty} flacon{qty > 1 ? 's' : ''}</span>
                <span className="font-bold tabular-nums text-slate-900">{fmt(fullPrice)}</span>
              </div>
              {saving > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-600">Remise pack</span>
                  <span className="font-bold tabular-nums text-emerald-600">-{fmt(saving)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-slate-600">Livraison</span>
                <span className="font-black tabular-nums text-emerald-600">À la commune</span>
              </div>
            </div>
            <div className="my-1.5 border-t border-dashed border-sky-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Total à payer</span>
              <div className="flex items-baseline gap-2">
                {qty > 1 && <span className="text-[11px] text-slate-400 line-through">{fmt(oldTotal)}</span>}
                <span className="bg-gradient-to-r from-[#063B8E] via-[#0B5ED7] to-[#38BDF8] bg-clip-text text-[20px] font-black tabular-nums text-transparent">
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="sv-form"
            disabled={sending}
            className="sv-cta group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#063B8E] via-[#0B5ED7] to-[#063B8E] text-[14px] font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_-6px_rgba(11,94,215,.65)] ring-2 ring-sky-300/50 transition hover:shadow-[0_18px_36px_-6px_rgba(11,94,215,.9)] hover:ring-sky-200 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="sv-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            {sending ? (
              <>
                <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="relative">Envoi…</span>
              </>
            ) : (
              <>
                <svg className="relative h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.62-4.02A11.96 11.96 0 0112 2.94a11.96 11.96 0 01-8.62 3.04A12.02 12.02 0 003 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02z" />
                </svg>
                <span className="relative">Valider ma commande</span>
              </>
            )}
          </button>

          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] font-semibold text-slate-500">
            <span>🔒 Cash livraison</span>
            <span className="h-3 w-px bg-sky-200" />
            <span>📞 Confirmation 30 min</span>
            <span className="h-3 w-px bg-sky-200" />
            <span>📦 Express CI</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes svfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes svslide { from { transform: translateY(36px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes svPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
        @keyframes svSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes svBarGlow { 0%,100% { filter: brightness(1) saturate(1) } 50% { filter: brightness(1.3) saturate(1.4) } }
        .sv-pulse-digit { animation: svPulseDigit 1s ease-in-out infinite }
        .sv-bar-glow { animation: svBarGlow 2.4s ease-in-out infinite }
        .sv-cta-sheen { animation: svSheen 3.2s ease-in-out infinite }
        @supports (height: 100svh) { .sv-shell { height: 100svh; } }
        @media (min-width: 640px) { .sv-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .sv-shell input:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
