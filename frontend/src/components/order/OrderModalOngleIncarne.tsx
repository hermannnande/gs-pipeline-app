/**
 * Modal de commande pour "Creme ongle incarne" — FULLSCREEN MOBILE + STICKY CTA.
 *
 * Fix bug bouton invisible sur mobile :
 *   - Mobile : modal en plein ecran (h-[100svh] qui suit le clavier mobile)
 *   - Desktop : modal centre avec max-w-[440px] et coins arrondis
 *   - Layout flexbox 3 zones :
 *       1) HEADER  (flex-none) : badge + titre + sous-titre
 *       2) BODY    (flex-1, overflow-y-auto) : qty + inputs
 *       3) FOOTER  (flex-none, sticky bottom) : total + CTA TOUJOURS VISIBLE
 *
 * Layout C : card SOMBRE premium violet/fuchsia (style different des autres
 * modaux clairs). Accent dore-violet pour donner une impression de soin de
 * pointe, de qualite professionnelle.
 *
 * IMPORTANT : logique metier 100% inchangee (useOrderSubmit -> obgestion).
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
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function OrderModalOngleIncarne({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
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
      aria-labelledby="ongle-modal-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-[oifade_.2s_ease-out]"
      />

      {/*
        Conteneur modal - LAYOUT FLEXBOX VERTICAL :
        - Mobile  : h-[100svh] (suit le clavier mobile via small viewport units)
        - Desktop : max-h-[92vh] + max-w-[440px] + rounded-3xl

        flex flex-col -> 3 zones empilees (header / body / footer)
        Le footer reste TOUJOURS visible grace au flex-1 du body qui scroll.
      */}
      <div className="oi-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden border-t border-fuchsia-500/40 bg-gradient-to-b from-[#1a0e28] via-[#1a0826] to-[#0f0719] shadow-2xl animate-[oislide_.25s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[92vh] sm:max-w-[440px] sm:rounded-3xl sm:border sm:border-fuchsia-500/40">

        {/* Halos violet/fuchsia en fond */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" />

        {/* ========== HEADER (flex-none) ========== */}
        <div className="relative flex-none px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={() => !sending && onClose()}
            aria-label="Fermer"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-sm transition hover:bg-white/20 hover:scale-105 disabled:opacity-50"
            disabled={sending}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">
              ✦ Soin professionnel
            </span>
            <h3 id="ongle-modal-title" className="mt-2 text-[20px] font-black text-white">
              {cfg.title || 'Crème ongle incarné'}
            </h3>
            <p className="mt-1 text-[12px] font-medium text-violet-200/70">
              Remplissez le formulaire, nous vous contactons.
            </p>
          </div>
        </div>

        {/*
          ========== BODY (flex-1, scrollable) ==========
          overscroll-contain empeche le scroll de "sortir" du modal.
        */}
        <form
          id="oi-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-5 py-3"
        >
          <OrderFormWarning title="Avant la livraison">
            Préparez le montant <strong>en cash</strong> à la réception. Vérifiez le produit avant de payer. Livraison sous <strong>24-48 h</strong>, soyez <strong>disponible</strong>.
          </OrderFormWarning>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-violet-200/80">
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
                        ? 'border-fuchsia-400 bg-fuchsia-500/15 shadow-[0_0_0_3px_rgba(232,121,249,0.15)]'
                        : 'border-white/10 bg-white/5 hover:border-violet-400/50 hover:bg-white/10'
                    }`}
                  >
                    {o.tag && (
                      <span className="absolute -right-1 -top-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow">
                        {o.tag}
                      </span>
                    )}
                    <span className={`text-xl font-black leading-none ${active ? 'text-fuchsia-300' : 'text-white'}`}>{o.v}</span>
                    <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-white/50">{o.label}</span>
                    <span className={`text-[10px] font-black ${active ? 'text-fuchsia-200' : 'text-violet-300'}`}>{o.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="oi-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-violet-200/80">Nom complet</label>
            <input id="oi-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Kouassi" autoComplete="name" required
              className="block w-full rounded-xl border-[1.5px] border-white/10 bg-white/5 px-3.5 h-11 text-[15px] sm:text-[14px] font-medium text-white outline-none transition placeholder:text-white/30 focus:border-fuchsia-400 focus:bg-white/10 focus:ring-2 focus:ring-fuchsia-400/25" />
          </div>

          <div>
            <label htmlFor="oi-city" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-violet-200/80">Ville de livraison</label>
            <input id="oi-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Abidjan, Bouaké, Daloa…" autoComplete="address-level2" required
              className="block w-full rounded-xl border-[1.5px] border-white/10 bg-white/5 px-3.5 h-11 text-[15px] sm:text-[14px] font-medium text-white outline-none transition placeholder:text-white/30 focus:border-fuchsia-400 focus:bg-white/10 focus:ring-2 focus:ring-fuchsia-400/25" />
          </div>

          <div>
            <label htmlFor="oi-phone" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-violet-200/80">Téléphone</label>
            <div className="flex h-11 overflow-hidden rounded-xl border-[1.5px] border-white/10 bg-white/5 transition focus-within:border-fuchsia-400 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-fuchsia-400/25">
              <span className="flex items-center gap-1 border-r border-white/10 bg-white/5 px-3 text-[13px] font-bold text-white">🇨🇮 +225</span>
              <input id="oi-phone" type="tel" inputMode="numeric" value={phone}
                onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                placeholder="07 XX XX XX XX" autoComplete="tel-national" required
                className="h-full w-full bg-transparent px-3 text-[15px] sm:text-[14px] font-medium text-white outline-none placeholder:text-white/30" />
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-[12px] font-semibold text-red-300 ring-1 ring-red-500/30">{formErr}</p>
          )}
        </form>

        {/*
          ========== FOOTER (flex-none, TOUJOURS VISIBLE) ==========
          Fond sombre pour matcher le theme du modal.
          padding-bottom : safe-area-inset-bottom pour iPhones avec notch.
        */}
        <div
          className="flex-none border-t border-white/10 bg-[#0f0719] px-5 pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.3)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2.5 flex items-center justify-between rounded-xl border border-fuchsia-400/25 bg-gradient-to-r from-violet-600/25 via-fuchsia-600/20 to-violet-600/25 px-3.5 py-3 text-white">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[12px] font-semibold">Total</span>
              <span className="text-[10px] text-fuchsia-300">livraison gratuite</span>
            </div>
            <div className="flex items-baseline gap-2">
              {qty > 1 && <span className="text-[11px] text-white/40 line-through">{fmt(oldTotal)}</span>}
              <span className="text-[17px] font-black text-fuchsia-200">{fmt(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="oi-form"
            disabled={sending}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600 text-[15px] font-extrabold text-white shadow-[0_10px_30px_-5px_rgba(217,70,239,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:shadow-[0_14px_35px_-5px_rgba(217,70,239,0.7)] hover:brightness-110 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
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

          <p className="mt-1.5 text-center text-[11px] font-medium text-white/40">🔒 Paiement à la livraison · Garantie satisfaction</p>
        </div>
      </div>

      <style>{`
        @keyframes oifade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes oislide { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

        @supports (height: 100svh) {
          .oi-shell { height: 100svh; }
        }
        @media (min-width: 640px) {
          .oi-shell { height: auto !important; }
        }
        @media (max-width: 639px) {
          .oi-shell input:focus,
          .oi-shell textarea:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
