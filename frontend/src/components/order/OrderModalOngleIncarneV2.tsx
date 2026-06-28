/**
 * Modal de commande — "Creme ongle incarne V2" (campagne dediee).
 *
 * Design TOTALEMENT different de OrderModalOngleIncarne (qui est sombre
 * violet/fuchsia) : ici carte CLAIRE premium BLEU / BLANC / ROUGE, avec un
 * COMPTE A REBOURS d'urgence integre au formulaire (demande client).
 *
 * Layout flexbox 3 zones (header / body scrollable / footer sticky) :
 *   - Mobile  : plein ecran h-[100svh] (suit le clavier)
 *   - Desktop : carte centree max-w-[440px] arrondie
 *
 * Logique metier 100% partagee via useOrderSubmit (aucune divergence).
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';
import { cleanPhoneCI } from '../../utils/phone';
import OrderFormWarning from './OrderFormWarning';
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
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}
const pad = (n: number) => String(n).padStart(2, '0');

export default function OrderModalOngleIncarneV2({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [cd, setCd] = useState({ h: 0, m: 0, s: 0 });

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) wasOpenRef.current = false;
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

  // Compte a rebours d'urgence (jusqu'a minuit) affiche dans le formulaire.
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - now.getTime());
      setCd({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  const total = orderTotal(cfg.prices || {}, qty);
  const oldTotal = total + (qty * 5100);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oiv2-modal-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-[oiv2fade_.2s_ease-out]"
      />

      <div className="oiv2-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden border-t-4 border-blue-600 bg-white shadow-2xl animate-[oiv2slide_.25s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[92vh] sm:max-w-[440px] sm:rounded-3xl sm:border-t-0 sm:ring-1 sm:ring-blue-100">

        {/* Halos bleu/rouge en fond */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />

        {/* ===== HEADER ===== */}
        <div className="relative flex-none px-5 pt-5 pb-3">
          <button
            type="button"
            onClick={() => !sending && onClose()}
            aria-label="Fermer"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:scale-105 disabled:opacity-50"
            disabled={sending}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-blue-600 to-sky-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow">
              ✦ Soin pieds certifié
            </span>
            <h3 id="oiv2-modal-title" className="mt-2 text-[20px] font-black text-slate-900">
              {cfg.title || 'Crème ongle incarné'}
            </h3>
            <p className="mt-1 text-[12px] font-medium text-slate-500">
              Remplissez le formulaire, on vous rappelle vite.
            </p>
          </div>

          {/* Compte a rebours urgence */}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-red-700">Prix promo réservé</span>
            <span className="flex items-center gap-0.5 font-mono text-[13px] font-black tabular-nums text-red-700">
              {pad(cd.h)}<span className="text-red-400">:</span>{pad(cd.m)}<span className="text-red-400">:</span>{pad(cd.s)}
            </span>
          </div>
        </div>

        {/* ===== BODY (scrollable) ===== */}
        <form
          id="oiv2-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-1 min-h-0 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-3 pt-2"
        >
          <OrderFormWarning title="Avant la livraison">
            Préparez le montant <strong>en cash</strong> à la réception. Vérifiez le produit avant de payer. Livraison sous <strong>24-48 h</strong>, soyez <strong>disponible</strong>.
          </OrderFormWarning>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Nombre de tubes
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {qtyOptions.map((o) => {
                const active = qty === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setQty(o.v)}
                    className={`relative flex flex-col items-center rounded-xl border-[1.5px] px-1 py-2 transition-all ${
                      active
                        ? 'border-blue-600 bg-blue-50 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    {o.tag && (
                      <span className="absolute -right-1 -top-2 rounded-full bg-gradient-to-r from-red-600 to-rose-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow">
                        {o.tag}
                      </span>
                    )}
                    <span className={`text-xl font-black leading-none ${active ? 'text-blue-700' : 'text-slate-900'}`}>{o.v}</span>
                    <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">{o.label}</span>
                    <span className={`text-[10px] font-black ${active ? 'text-blue-600' : 'text-slate-500'}`}>{o.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="oiv2-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Nom complet</label>
            <input id="oiv2-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Kouassi" autoComplete="name" required
              className="block w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3.5 h-11 text-[15px] sm:text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div>
            <label htmlFor="oiv2-city" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Ville de livraison</label>
            <input id="oiv2-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Abidjan, Bouaké, Daloa…" autoComplete="address-level2" required
              className="block w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3.5 h-11 text-[15px] sm:text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div>
            <label htmlFor="oiv2-phone" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Téléphone</label>
            <div className="flex h-11 overflow-hidden rounded-xl border-[1.5px] border-slate-200 bg-slate-50 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <span className="flex items-center gap-1 border-r border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-700">🇨🇮 +225</span>
              <input id="oiv2-phone" type="tel" inputMode="numeric" value={phone}
                onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                placeholder="07 XX XX XX XX" autoComplete="tel-national" required
                className="h-full w-full bg-transparent px-3 text-[15px] sm:text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400" />
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700 ring-1 ring-red-200">{formErr}</p>
          )}
        </form>

        {/* ===== FOOTER (toujours visible) ===== */}
        <div
          className="flex-none border-t border-slate-100 bg-white px-5 pt-3 shadow-[0_-4px_16px_-6px_rgba(15,23,42,0.12)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2.5 flex items-center justify-between rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 px-3.5 py-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[12px] font-semibold text-slate-600">Total</span>
            </div>
            <div className="flex items-baseline gap-2">
              {qty > 1 && <span className="text-[11px] text-slate-400 line-through">{fmt(oldTotal)}</span>}
              <span className="text-[17px] font-black text-blue-700">{fmt(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            form="oiv2-form"
            disabled={sending}
            className="oiv2-cta relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-red-600 text-[15px] font-extrabold text-white shadow-[0_10px_30px_-5px_rgba(37,99,235,0.55)] transition hover:brightness-110 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="oiv2-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            {sending ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Envoi...</>
            ) : (
              <span className="relative z-10 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Valider ma commande
              </span>
            )}
          </button>

          <p className="mt-1.5 text-center text-[11px] font-medium text-slate-400">🔒 Paiement à la livraison · Garantie satisfaction</p>
        </div>
      </div>

      <style>{`
        @keyframes oiv2fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes oiv2slide { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes oiv2sheen { 0% { transform: translateX(-100%) } 55% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .oiv2-sheen { animation: oiv2sheen 2.6s ease-in-out infinite }
        @supports (height: 100svh) { .oiv2-shell { height: 100svh; } }
        @media (min-width: 640px) { .oiv2-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .oiv2-shell input:focus, .oiv2-shell textarea:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
