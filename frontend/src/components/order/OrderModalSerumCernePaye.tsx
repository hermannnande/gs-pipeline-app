/**
 * Modal de commande "Serum Anti-Cernes PAYE" — DUAL PAYMENT (v2).
 * ============================================================
 *
 * V2 : Le mode de paiement est CHOISI EN AMONT via PaymentChoicePopup.
 * Ce modal recoit `initialPaymentMode` via `cfg` et adapte son contenu.
 *
 * Au lieu d'afficher le gros selecteur cash/mobile-money en haut, on affiche
 * un BADGE RECAPITULATIF compact avec un bouton "Changer" qui reouvre la
 * popup choix (via `cfg.onChangePaymentMode`).
 *
 * Modes de paiement supportes :
 *
 *   (A) cash : Cash a la livraison
 *       - Submit -> useOrderSubmit -> POST /api/public/order
 *       - Statut NOUVELLE, modePaiement=null, montantPaye=null
 *       - Redirige sur /<slug>/merci?ref=<orderRef>&qty=<qty>
 *
 *   (B) chariow : Mobile Money en ligne (Chariow)
 *       - Champ email obligatoire (requis par Chariow)
 *       - Affiche le prix -10%, badge livraison express 2h
 *       - Submit -> useChariowCheckout -> POST /api/chariow/checkout
 *       - Redirige le navigateur vers payment.chariow.com
 *       - Apres paiement, pulse webhook cree la commande obgestion
 *         (statut NOUVELLE, modePaiement=CHARIOW_MOBILE_MONEY, montantPaye=total).
 *
 * Palette : NAVY + OR + IVOIRE editorial luxe.
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';
import { useChariowCheckout } from '../../hooks/useChariowCheckout';

interface QtyOption {
  v: number;
  label: string;
  sub: string;
  tag?: string;
  save?: string;
}

type PaymentMode = 'cash' | 'chariow';

interface Props {
  open: boolean;
  onClose: () => void;
  cfg: OrderSubmitConfig & {
    images: { hero: string; avant?: string; apres?: string; comparison?: { before: string; after: string } };
    /** Mode de paiement choisi dans la popup AMONT (defaut: 'chariow') */
    initialPaymentMode?: PaymentMode;
    /** Callback pour reouvrir la popup choix (bouton "Changer") */
    onChangePaymentMode?: () => void;
  };
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

export default function OrderModalSerumCernePaye({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  // Hook 1 : flux cash a la livraison (existant, inchange).
  const { submit, sending: sendingCash, formErr: errCash, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  // Hook 2 : flux Chariow Mobile Money (redirection vers payment.chariow.com).
  const { checkout, sending: sendingChariow, formErr: errChariow } = useChariowCheckout({
    cfg: {
      slug: cfg.slug,
      productCode: cfg.productCode,
      title: cfg.title,
      metaPixelId: cfg.metaPixelId,
      prices: cfg.prices,
    },
  });

  const sending = sendingCash || sendingChariow;
  const formErr = errCash || errChariow;

  // Mode de paiement vient de la popup AMONT (defaut: chariow = recommande)
  const initialMode: PaymentMode = cfg.initialPaymentMode || 'chariow';
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialMode);
  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(11);
  const [countdown, setCountdown] = useState({ m: 14, s: 59 });

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setEmail(''); setCity(''); setPhone('');
      setQty(initialQty);
      setPaymentMode(initialMode);
      setCountdown({ m: 14, s: 59 });
      setStock(8 + Math.floor(Math.random() * 6));
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) wasOpenRef.current = false;
  }, [open, initialQty, initialMode]);

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

  // Affichage des prix : pour Mobile Money on affiche -10% (calcul cosmetique
  // uniquement, le prix reel est defini cote Chariow dans le dashboard).
  const totalCash = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const totalChariowDisplay = Math.round(totalCash * 0.9 / 10) * 10; // arrondi a la dizaine
  const total = paymentMode === 'chariow' ? totalChariowDisplay : totalCash;
  const oldTotal = paymentMode === 'chariow' ? totalCash : totalCash + (qty * 5000);
  const stockPct = Math.max(20, Math.min(100, Math.round((stock / 25) * 100)));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMode === 'cash') {
      await submit({ name, city, phone, qty });
    } else {
      await checkout({
        slug: cfg.slug,
        qty,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerCity: city,
        displayedAmount: totalChariowDisplay,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scm-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md animate-[scmfade_.2s_ease-out]"
      />

      <div className="relative z-10 w-full max-w-[440px] max-h-[100dvh] overflow-y-auto rounded-t-[20px] bg-[#faf8f5] shadow-2xl animate-[scmslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:rounded-[20px]">

        {/* Liseret or en haut */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"/>

        {/* ===== HEADER navy + or ===== */}
        <div className="relative overflow-hidden bg-slate-950 px-5 pt-4 pb-4 text-white">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-400/25 blur-2xl"/>
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-rose-400/20 blur-2xl"/>

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-300/70">Reservation</p>
              <h3 id="scm-title" className="scm-serif mt-0.5 text-[18px] leading-tight text-white">
                Serum Anti-Cernes Premium
              </h3>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Edition premium</p>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-white/15 hover:scale-105 disabled:opacity-50"
              disabled={sending}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Separateur diamant */}
          <div className="mt-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/50"/>
            <svg className="h-3 w-3 rotate-45 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L18 10L10 18L2 10Z" opacity="0.5"/>
              <path d="M10 5L15 10L10 15L5 10Z"/>
            </svg>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/50"/>
          </div>

          {/* Countdown expiration */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-300/80">Expire</p>
            <div className="flex items-center gap-1 font-mono tabular-nums">
              <span className="scm-shimmer-gold text-[16px] font-black scm-pulse-digit">{pad(countdown.m)}</span>
              <span className="text-amber-300/70">:</span>
              <span className="scm-shimmer-gold text-[16px] font-black scm-pulse-digit">{pad(countdown.s)}</span>
            </div>
          </div>

          {/* Stock bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-amber-400/15">
              <div className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 transition-all" style={{ width: `${stockPct}%` }}/>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">{stock} dispo</span>
          </div>
        </div>

        {/* ===== BODY FORM ===== */}
        <div className="px-5 py-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-3">

            {/* ===== BADGE MODE DE PAIEMENT (compact + bouton Changer) ===== */}
            {paymentMode === 'chariow' ? (
              <div className="flex items-center justify-between gap-2 overflow-hidden rounded-[0.75rem] border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 px-3 py-2 ring-1 ring-emerald-300/30">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[16px] shadow-sm ring-1 ring-emerald-200">
                    📱
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-800">
                      Mobile Money
                      <span className="rounded-sm bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white">-10%</span>
                    </p>
                    <p className="truncate text-[9px] text-emerald-700">Wave · Orange · MTN · Moov · livraison 2h</p>
                  </div>
                </div>
                {cfg.onChangePaymentMode && (
                  <button
                    type="button"
                    onClick={cfg.onChangePaymentMode}
                    className="shrink-0 rounded-md bg-white px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50 hover:ring-emerald-300"
                  >
                    Changer
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 overflow-hidden rounded-[0.75rem] border-2 border-amber-300 bg-amber-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[16px] shadow-sm ring-1 ring-amber-200">
                    💵
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-amber-900">
                      A la livraison
                      <span className="rounded-sm bg-amber-200 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-amber-900">CASH</span>
                    </p>
                    <p className="truncate text-[9px] text-amber-700">Vous payez en cash a la reception du produit</p>
                  </div>
                </div>
                {cfg.onChangePaymentMode && (
                  <button
                    type="button"
                    onClick={cfg.onChangePaymentMode}
                    className="shrink-0 rounded-md bg-white px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50 hover:ring-amber-300"
                  >
                    Changer
                  </button>
                )}
              </div>
            )}

            {/* ===== Quantite ===== */}
            <div>
              <p className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.35em] text-amber-700">Votre cure</p>
              <div className="grid grid-cols-3 gap-1.5">
                {qtyOptions.map((o) => {
                  const active = qty === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setQty(o.v)}
                      className={`relative flex flex-col items-center justify-center rounded-[0.75rem] border-2 px-1 py-2 transition-all ${
                        active
                          ? 'border-amber-400 bg-amber-50 shadow-md'
                          : 'border-stone-200 bg-white hover:border-amber-300'
                      }`}
                    >
                      {o.tag && (
                        <span className="absolute -right-1 -top-1.5 rounded-sm bg-slate-950 px-1 py-px text-[7px] font-black uppercase tracking-widest text-amber-300 shadow">
                          {o.tag === 'Populaire' ? '◆' : '♛'}
                        </span>
                      )}
                      <span className={`text-[20px] font-black leading-none ${active ? 'text-slate-900' : 'text-slate-700'}`}>{o.v}</span>
                      <span className="scm-serif mt-0.5 text-[10px] italic text-slate-500">{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ===== Inputs ===== */}
            <div className="space-y-2">
              <div>
                <label htmlFor="scm-name" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-amber-700">Nom complet</label>
                <input
                  type="text"
                  id="scm-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Prenom et nom"
                  autoComplete="name"
                  required
                  className="block w-full rounded-[0.6rem] border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Email visible UNIQUEMENT pour Mobile Money (Chariow le requiert) */}
              {paymentMode === 'chariow' && (
                <div>
                  <label htmlFor="scm-email" className="mb-1 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.25em] text-emerald-700">
                    <span>Email</span>
                    <span className="text-[8px] font-medium normal-case tracking-normal text-emerald-600">requis pour la facture</span>
                  </label>
                  <input
                    type="email"
                    id="scm-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    required
                    className="block w-full rounded-[0.6rem] border border-emerald-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}

              <div>
                <label htmlFor="scm-phone" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-amber-700">Telephone</label>
                <div className="flex overflow-hidden rounded-[0.6rem] border border-stone-200 bg-white transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
                  <span className="flex items-center gap-1 border-r border-stone-200 bg-stone-50 px-3 text-[12px] font-bold text-slate-700">🇨🇮 <span className="font-mono">+225</span></span>
                  <input
                    type="tel"
                    id="scm-phone"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="07 XX XX XX XX"
                    autoComplete="tel-national"
                    required
                    className="w-full bg-white px-3 py-2 text-[13px] font-medium text-slate-900 outline-none placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="scm-city" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-amber-700">Ville</label>
                <input
                  type="text"
                  id="scm-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Abidjan, Bouake, Daloa..."
                  autoComplete="address-level2"
                  required
                  className="block w-full rounded-[0.6rem] border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* ===== Total ===== */}
            <div className={`relative overflow-hidden rounded-[0.8rem] px-4 py-3 text-white shadow-inner ${
              paymentMode === 'chariow'
                ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-700'
                : 'bg-slate-950'
            }`}>
              <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-amber-400/25 blur-2xl"/>
              <div className="relative flex items-baseline justify-between">
                <div>
                  <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${paymentMode === 'chariow' ? 'text-emerald-100' : 'text-amber-300/80'}`}>
                    Total a payer
                  </p>
                  <p className={`text-[9px] font-bold ${paymentMode === 'chariow' ? 'text-amber-200' : 'text-emerald-300'}`}>
                    {paymentMode === 'chariow' ? 'Livraison express 2h offerte' : 'Livraison offerte'}
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  {(qty > 1 || paymentMode === 'chariow') && (
                    <span className={`text-[10px] line-through ${paymentMode === 'chariow' ? 'text-emerald-200/60' : 'text-stone-400'}`}>{fmt(oldTotal)}</span>
                  )}
                  <span className="scm-shimmer-gold text-[22px] font-black tabular-nums">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {formErr && (
              <p className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-100">{formErr}</p>
            )}

            {/* ===== CTA ===== */}
            <button
              type="submit"
              disabled={sending}
              className={`scm-cta group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-[0.8rem] text-[12px] font-black uppercase tracking-[0.2em] shadow-lg transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${
                paymentMode === 'chariow'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-[0_10px_24px_-4px_rgba(16,185,129,.5)] hover:shadow-[0_14px_30px_-4px_rgba(16,185,129,.7)]'
                  : 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-slate-900 shadow-[0_10px_24px_-4px_rgba(212,175,55,.5)] hover:shadow-[0_14px_30px_-4px_rgba(212,175,55,.7)]'
              }`}
            >
              <span className="scm-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"/>
              {sending ? (
                <>
                  <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="relative">{paymentMode === 'chariow' ? 'Redirection vers Chariow...' : 'Envoi...'}</span>
                </>
              ) : paymentMode === 'chariow' ? (
                <>
                  <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="relative">Payer Mobile Money</span>
                </>
              ) : (
                <>
                  <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="relative">Confirmer la commande</span>
                </>
              )}
            </button>

            <p className="text-center text-[9px] font-bold uppercase tracking-[0.25em] text-stone-500">
              {paymentMode === 'chariow'
                ? '🔒 Paiement securise · Wave · Orange · MTN · Moov'
                : '🔒 Paiement a la livraison · Sans risque'}
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes scmfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scmslide { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes scmPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        @keyframes scmSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes scmFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        @keyframes scmShimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }

        .scm-pulse-digit { animation: scmPulseDigit 1s ease-in-out infinite }
        .scm-cta { animation: scmFloat 2.8s ease-in-out infinite }
        .scm-cta:hover { animation: none; transform: translateY(-2px) }
        .scm-cta-sheen { animation: scmSheen 3.4s ease-in-out infinite }
        .scm-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-weight: 500 }
        .scm-shimmer-gold {
          background: linear-gradient(90deg, #d4af37 0%, #fde68a 25%, #fbbf24 50%, #fef3c7 75%, #d4af37 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: scmShimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
