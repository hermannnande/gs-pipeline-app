/**
 * Modal commande — Chaussettes chauffantes tourmaline (CHAUSSETTE_CHAUFFANTE).
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';
import { cleanPhoneCI } from '../../utils/phone';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';

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
const pad = (n: number) => String(n).padStart(2, '0');

const inputCls =
  'block h-12 w-full rounded-2xl border border-amber-100 bg-white px-4 text-[16px] font-medium text-neutral-900 outline-none transition placeholder:text-amber-300/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/30';

export default function OrderModalChaussetteChauffante({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [cd, setCd] = useState({ m: 0, s: 0 });

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  const nameRef = useRef<HTMLInputElement>(null);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    setQty(initialQty);
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      trackRef.current(initialQty);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open, initialQty]);

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

  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - now.getTime());
      setCd({ m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  const total = orderTotal(cfg.prices || {}, qty);
  const selected = qtyOptions.find((o) => o.v === qty);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="cch-modal-title">
      <div onClick={() => !sending && onClose()} className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px] animate-[cchfade_.18s_ease-out]" />

      <div className="cch-shell relative z-10 flex w-full max-w-[420px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl animate-[cchsheet_.32s_cubic-bezier(.22,1,.36,1)] sm:rounded-3xl">
        <div className="flex-none border-b border-amber-50 px-5 pb-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-amber-200 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Paiement à la livraison</p>
              <h3 id="cch-modal-title" className="mt-0.5 truncate text-[18px] font-black text-neutral-900">
                {cfg.title || 'Chaussettes chauffantes'}
              </h3>
              <p className="mt-1 text-[11px] font-semibold tabular-nums text-orange-600">
                ⏱ {pad(cd.m)}:{pad(cd.s)} · livraison 24h Abidjan
              </p>
            </div>
            <button type="button" onClick={() => !sending && onClose()} aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition hover:bg-amber-100" disabled={sending}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form id="cch-form" onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-col gap-4 px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            {qtyOptions.map((o) => {
              const active = qty === o.v;
              return (
                <button key={o.v} type="button" onClick={() => setQty(o.v)}
                  className={`relative rounded-2xl border-2 px-2 py-3 text-center transition-all duration-200 ${
                    active
                      ? 'scale-[1.02] border-amber-500 bg-gradient-to-b from-amber-50 to-orange-50 shadow-md shadow-amber-200/50'
                      : 'border-amber-100 bg-white hover:border-amber-200'
                  }`}>
                  {o.tag && active && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-2 py-0.5 text-[7px] font-black uppercase text-white">
                      {o.tag}
                    </span>
                  )}
                  <p className={`text-[15px] font-black ${active ? 'text-amber-700' : 'text-neutral-800'}`}>{o.sub}</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-500">{o.label}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <input ref={nameRef} id="cch-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom complet" autoComplete="name" required className={inputCls} />
            <input id="cch-city" type="text" value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Ville (ex. Abidjan, Bouaké…)" autoComplete="address-level2" required className={inputCls} />
            <div className="flex h-12 overflow-hidden rounded-2xl border border-amber-100 bg-white transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-300/30">
              <span className="flex items-center border-r border-amber-100 bg-amber-50/80 px-3 text-[13px] font-bold text-amber-700">+225</span>
              <input id="cch-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                placeholder="07 XX XX XX XX" autoComplete="tel-national" required
                className="h-full w-full bg-transparent px-3 text-[16px] font-medium text-neutral-900 outline-none placeholder:text-amber-300/80" />
            </div>
          </div>

          {formErr && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-[12px] font-semibold text-red-600">{formErr}</p>
          )}

          <button type="submit" disabled={sending}
            className="cch-cta flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-[15px] font-black text-white shadow-lg shadow-orange-300/40 transition active:scale-[0.98] disabled:opacity-60">
            {sending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Envoi en cours…
              </>
            ) : (
              <>Commander · {fmt(total)}</>
            )}
          </button>

          {selected?.save && (
            <p className="-mt-2 text-center text-[10px] font-semibold text-emerald-600">{selected.save}</p>
          )}
        </form>

        <p className="flex-none px-5 pb-4 text-center text-[10px] text-amber-500"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          🔒 Aucun paiement en ligne · Vous payez à la réception
        </p>
      </div>

      <style>{`
        @keyframes cchfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cchsheet { from { transform: translateY(100%); opacity: .6 } to { transform: translateY(0); opacity: 1 } }
        @media (min-width: 640px) {
          @keyframes cchsheet { from { transform: translateY(16px) scale(.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
        }
        @keyframes cch-cta-pulse {
          0%, 100% { box-shadow: 0 10px 28px -8px rgba(249,115,22,.45) }
          50% { box-shadow: 0 14px 36px -6px rgba(249,115,22,.65) }
        }
        .cch-cta:not(:disabled) { animation: cch-cta-pulse 2.4s ease-in-out infinite }
        .cch-cta:hover:not(:disabled) { animation: none }
      `}</style>
    </div>
  );
}
