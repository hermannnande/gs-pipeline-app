/**
 * Modal de commande pour "Creme minceur FB" — VERSION SIMPLIFIEE.
 *
 * Layout B variante feminine : bandeau haut pink -> rose + card blanche tres
 * douce (rose clair). Accent rose/pink pour le CTA. Design pense pour une
 * audience feminine.
 *
 * v2 : Layout flexbox fullscreen mobile + footer sticky avec total + CTA
 *      pour eviter que le bouton "Valider" disparaisse sous le clavier.
 *
 * IMPORTANT : logique metier 100% inchangee (useOrderSubmit -> obgestion).
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';

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

export default function OrderModalMinceur({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

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

  if (!open) return null;

  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const oldTotal = total + (qty * 5000);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="minc-modal-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-rose-950/75 backdrop-blur-sm animate-[mnfade_.2s_ease-out]"
      />

      {/* Container shell - flexbox vertical */}
      <div className="mn-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-gradient-to-b from-rose-50 to-white shadow-2xl animate-[mnslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[92vh] sm:max-w-[440px] sm:rounded-3xl">

        {/* ========== HEADER (flex-none) - bandeau pink/rose ========== */}
        <div className="relative flex-none overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 px-5 pt-5 pb-4 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-300/50 blur-2xl" />
          <div className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-rose-300/50 blur-2xl" />

          <button
            type="button"
            onClick={() => !sending && onClose()}
            aria-label="Fermer"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 hover:scale-105 disabled:opacity-50"
            disabled={sending}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] backdrop-blur-sm">
              ♥ Silhouette & bien-être
            </span>
            <h3 id="minc-modal-title" className="mt-2 text-[20px] font-black leading-tight">
              {cfg.title || 'Crème minceur'}
            </h3>
            <p className="mt-0.5 text-[12px] font-medium text-pink-50">
              Paiement à la livraison · Résultats en 4 semaines
            </p>
          </div>
        </div>

        {/* ========== BODY (flex-1, scrollable) ========== */}
        <form
          id="mn-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-5 py-4"
        >
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-rose-700">Nombre de pots</label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {qtyOptions.map((o) => {
                const active = qty === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setQty(o.v)}
                    className={`relative flex flex-col items-center rounded-xl border-2 px-1 py-2 transition-all ${
                      active
                        ? 'border-rose-400 bg-rose-50 shadow-sm'
                        : 'border-rose-100 bg-white hover:border-rose-300 hover:bg-rose-50/50'
                    }`}
                  >
                    {o.tag && (
                      <span className="absolute -right-1 -top-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow">
                        {o.tag}
                      </span>
                    )}
                    <span className={`text-xl font-black leading-none ${active ? 'text-rose-600' : 'text-rose-900'}`}>{o.v}</span>
                    <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-rose-400">{o.label}</span>
                    <span className={`text-[10px] font-black ${active ? 'text-rose-500' : 'text-pink-500'}`}>{o.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="mn-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-rose-700">Prénom &amp; Nom</label>
            <input id="mn-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adjoua Kouadio" autoComplete="name" required
              className="block h-11 w-full rounded-xl border-[1.5px] border-rose-100 bg-white px-3.5 text-[15px] sm:text-[14px] font-medium text-rose-900 outline-none transition placeholder:text-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20" />
          </div>

          <div>
            <label htmlFor="mn-city" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-rose-700">Ville de livraison</label>
            <input id="mn-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Abidjan, Bouaké, Daloa…" autoComplete="address-level2" required
              className="block h-11 w-full rounded-xl border-[1.5px] border-rose-100 bg-white px-3.5 text-[15px] sm:text-[14px] font-medium text-rose-900 outline-none transition placeholder:text-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20" />
          </div>

          <div>
            <label htmlFor="mn-phone" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-rose-700">Téléphone</label>
            <div className="flex h-11 overflow-hidden rounded-xl border-[1.5px] border-rose-100 bg-white transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20">
              <span className="flex items-center gap-1 border-r border-rose-100 bg-rose-50 px-3 text-[13px] font-bold text-rose-700">🇨🇮 +225</span>
              <input id="mn-phone" type="tel" inputMode="numeric" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="07 XX XX XX XX" autoComplete="tel-national" required
                className="h-full w-full bg-white px-3 text-[15px] sm:text-[14px] font-medium text-rose-900 outline-none placeholder:text-rose-300" />
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}
        </form>

        {/* ========== FOOTER (flex-none, sticky bottom) ========== */}
        <div
          className="flex-none border-t border-rose-100 bg-white px-5 pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2.5 flex items-center justify-between rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 px-3.5 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[12px] font-semibold">Total</span>
              <span className="text-[10px] text-pink-100">livraison gratuite</span>
            </div>
            <div className="flex items-baseline gap-2">
              {qty > 1 && <span className="text-[11px] text-pink-200/70 line-through">{fmt(oldTotal)}</span>}
              <span className="text-[18px] font-black">{fmt(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="mn-form"
            disabled={sending}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-[15px] font-extrabold text-white shadow-[0_10px_25px_-5px_rgba(236,72,153,0.5)] transition hover:shadow-[0_14px_30px_-5px_rgba(236,72,153,0.65)] hover:brightness-110 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            {sending ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Envoi...</>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Valider ma commande
              </>
            )}
          </button>

          <p className="mt-1.5 text-center text-[11px] font-medium text-rose-400">🔒 Paiement à la livraison · Satisfaite ou remboursée</p>
        </div>
      </div>

      <style>{`
        @keyframes mnfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mnslide { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

        @supports (height: 100svh) { .mn-shell { height: 100svh; } }
        @media (min-width: 640px) { .mn-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .mn-shell input:focus,
          .mn-shell textarea:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
