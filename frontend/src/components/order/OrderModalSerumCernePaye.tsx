/**
 * Modal de commande "Serum Anti-Cernes PAYE" - DUAL PAYMENT (v3 - Paystack).
 * ============================================================
 *
 * v3 : MIGRATION CHARIOW -> PAYSTACK
 *
 * Le mode de paiement est CHOISI EN AMONT via PaymentChoicePopup. Ce modal
 * recoit `initialPaymentMode` via `cfg` et adapte son contenu.
 *
 * Modes de paiement supportes :
 *
 *   (A) cash : Cash a la livraison
 *       - Submit -> useOrderSubmit -> POST /api/public/order
 *       - Statut NOUVELLE, modePaiement=null, montantPaye=null
 *       - Redirige sur /<slug>/merci?ref=<orderRef>&qty=<qty>
 *
 *   (B) paystack : Mobile Money DIRECT (Wave / Orange / MTN)
 *       - NOUVEAUTE : le client ne quitte JAMAIS la landing (Charge API native).
 *       - Champ email obligatoire (requis par Paystack pour la facture).
 *       - Selecteur d'operateur (Wave, Orange, MTN).
 *       - Affiche le prix -10%, badge livraison express 2h.
 *       - Submit -> usePaystackCheckout.chargeMobileMoney -> POST /api/paystack/charge
 *       - Apres POST, on affiche un ECRAN D'ATTENTE "Validez sur votre telephone"
 *         avec polling auto vers /api/paystack/charge/:reference toutes les 4s.
 *       - Quand Paystack confirme (webhook -> charge.success), on redirige sur
 *         /<slug>/merci?ref=pst_xxx -> page merci avec WhatsApp + livraison 2h.
 *       - DB : modePaiement=PAYSTACK_MOBILE_MONEY, referencePayment=pst_xxx.
 *
 * Palette : NAVY + OR + IVOIRE editorial luxe.
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';
import { usePaystackCheckout, type MobileMoneyProvider } from '../../hooks/usePaystackCheckout';

interface QtyOption {
  v: number;
  label: string;
  sub: string;
  tag?: string;
  save?: string;
}

type PaymentMode = 'cash' | 'paystack';

interface Props {
  open: boolean;
  onClose: () => void;
  cfg: OrderSubmitConfig & {
    images: { hero: string; avant?: string; apres?: string; comparison?: { before: string; after: string } };
    /** Mode de paiement choisi dans la popup AMONT (defaut: 'paystack') */
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

  // Hook 2 : flux Paystack (Mobile Money DIRECT + Carte Redirect)
  // - chargeMobileMoney : Mobile Money sans quitter la landing
  // - redirectToCard : redirection vers checkout.paystack.com pour Visa/Mastercard
  // Les 2 utilisent le meme prix (-10% deja applique sur totalPaystackDisplay).
  const {
    chargeMobileMoney,
    redirectToCard,
    submitOtp,
    reset: resetPaystack,
    status: paystackStatus,
    displayText: paystackDisplay,
    formErr: errPaystack,
    sending: sendingPaystack,
  } = usePaystackCheckout({
    cfg: {
      slug: cfg.slug,
      productCode: cfg.productCode,
      title: cfg.title,
      metaPixelId: cfg.metaPixelId,
      prices: cfg.prices,
    },
  });

  const sending = sendingCash || sendingPaystack;
  const formErr = errCash || errPaystack;

  // Mode de paiement vient de la popup AMONT (defaut: paystack = recommande)
  const initialMode: PaymentMode = cfg.initialPaymentMode || 'paystack';
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialMode);
  // Sous-mode actif quand paymentMode === 'paystack' :
  //   'mobile-money' (defaut) : Wave/Orange/MTN, validation telephone, in-page
  //   'card'                  : redirection Paystack pour Visa/Mastercard
  // Les 2 partagent le meme prix (-10% applique).
  const [subMode, setSubMode] = useState<'mobile-money' | 'card'>('mobile-money');
  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<MobileMoneyProvider>('orange');
  const [otp, setOtp] = useState('');
  const [stock, setStock] = useState(11);
  const [countdown, setCountdown] = useState({ m: 14, s: 59 });

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setEmail(''); setCity(''); setPhone('');
      setProvider('orange');
      setSubMode('mobile-money');
      setOtp('');
      setQty(initialQty);
      setPaymentMode(initialMode);
      setCountdown({ m: 14, s: 59 });
      setStock(8 + Math.floor(Math.random() * 6));
      resetPaystack();
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) wasOpenRef.current = false;
  }, [open, initialQty, initialMode, resetPaystack]);

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
  // ET reel cette fois - on envoie ce montant a Paystack via displayedAmount).
  const totalCash = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const totalPaystackDisplay = Math.round(totalCash * 0.9 / 10) * 10; // arrondi a la dizaine
  const total = paymentMode === 'paystack' ? totalPaystackDisplay : totalCash;
  const oldTotal = paymentMode === 'paystack' ? totalCash : totalCash + (qty * 5000);
  const stockPct = Math.max(20, Math.min(100, Math.round((stock / 25) * 100)));

  // Etats UI du flux Paystack (overlay "validez sur votre telephone")
  // L'overlay ne s'affiche que pour Mobile Money (le flux carte redirige
  // immediatement vers checkout.paystack.com, pas d'overlay pendant le redirect).
  const isPaystackAwaiting = paymentMode === 'paystack' && subMode === 'mobile-money' && (paystackStatus === 'awaiting' || paystackStatus === 'pending' || paystackStatus === 'creating');
  const isPaystackOtp = paymentMode === 'paystack' && subMode === 'mobile-money' && paystackStatus === 'send_otp';
  const isPaystackFailed = paymentMode === 'paystack' && subMode === 'mobile-money' && (paystackStatus === 'failed' || paystackStatus === 'timeout');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMode === 'cash') {
      await submit({ name, city, phone, qty });
      return;
    }
    // Paystack : 2 sous-flux selon subMode
    const commonData = {
      slug: cfg.slug,
      qty,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      customerCity: city,
      displayedAmount: totalPaystackDisplay,
    };
    if (subMode === 'card') {
      // Flux Carte : redirige vers checkout.paystack.com (puis revient via callback_url)
      await redirectToCard(commonData);
    } else {
      // Flux Mobile Money : reste sur la landing + valide via push telephone
      await chargeMobileMoney({ ...commonData, provider });
    }
  };

  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) return;
    await submitOtp(otp);
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
        <div className="relative px-5 py-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-3">

            {/* ===== BADGE MODE DE PAIEMENT (compact + bouton Changer) ===== */}
            {paymentMode === 'paystack' ? (
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
                    <p className="truncate text-[9px] text-emerald-700">Wave · Orange · MTN · livraison 2h</p>
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

              {/* Email visible UNIQUEMENT pour Mobile Money (Paystack le requiert) */}
              {paymentMode === 'paystack' && (
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

              {/* Selecteur d'operateur Mobile Money (uniquement si Paystack + sous-mode MM) */}
              {paymentMode === 'paystack' && subMode === 'mobile-money' && (
                <div>
                  <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.25em] text-emerald-700">
                    Choisissez votre operateur
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { v: 'wave',   label: 'Wave',    color: 'sky',     emoji: '🌊' },
                      { v: 'orange', label: 'Orange',  color: 'orange',  emoji: '🟠' },
                      { v: 'mtn',    label: 'MTN',     color: 'amber',   emoji: '💛' },
                    ] as const).map((p) => {
                      const active = provider === p.v;
                      return (
                        <button
                          key={p.v}
                          type="button"
                          onClick={() => setProvider(p.v as MobileMoneyProvider)}
                          className={`flex flex-col items-center justify-center gap-0.5 rounded-[0.6rem] border-2 px-1 py-2 transition-all ${
                            active
                              ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-400/30'
                              : 'border-stone-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <span className="text-[18px] leading-none">{p.emoji}</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-emerald-800' : 'text-slate-700'}`}>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Indicateur visuel mode Carte (uniquement si Paystack + sous-mode card) */}
              {paymentMode === 'paystack' && subMode === 'card' && (
                <div className="flex items-center gap-2 overflow-hidden rounded-[0.6rem] border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 px-3 py-2 ring-1 ring-indigo-300/30">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[18px] shadow-sm ring-1 ring-indigo-200">💳</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-indigo-800">Carte bancaire</p>
                    <p className="text-[9px] text-indigo-700">Visa · Mastercard · Paiement securise via Paystack</p>
                  </div>
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
              paymentMode === 'paystack'
                ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-700'
                : 'bg-slate-950'
            }`}>
              <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-amber-400/25 blur-2xl"/>
              <div className="relative flex items-baseline justify-between">
                <div>
                  <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${paymentMode === 'paystack' ? 'text-emerald-100' : 'text-amber-300/80'}`}>
                    Total a payer
                  </p>
                  <p className={`text-[9px] font-bold ${paymentMode === 'paystack' ? 'text-amber-200' : 'text-emerald-300'}`}>
                    {paymentMode === 'paystack' ? 'Livraison express 2h offerte' : 'Livraison offerte'}
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  {(qty > 1 || paymentMode === 'paystack') && (
                    <span className={`text-[10px] line-through ${paymentMode === 'paystack' ? 'text-emerald-200/60' : 'text-stone-400'}`}>{fmt(oldTotal)}</span>
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
                paymentMode === 'paystack'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-[0_10px_24px_-4px_rgba(16,185,129,.5)] hover:shadow-[0_14px_30px_-4px_rgba(16,185,129,.7)]'
                  : 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-slate-900 shadow-[0_10px_24px_-4px_rgba(212,175,55,.5)] hover:shadow-[0_14px_30px_-4px_rgba(212,175,55,.7)]'
              }`}
            >
              <span className="scm-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"/>
              {sending ? (
                <>
                  <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="relative">
                    {paymentMode === 'paystack'
                      ? subMode === 'card' ? 'Redirection Paystack...' : 'Initialisation paiement...'
                      : 'Envoi...'}
                  </span>
                </>
              ) : paymentMode === 'paystack' && subMode === 'card' ? (
                <>
                  <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h2m3 0h4M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  <span className="relative">Payer par carte</span>
                </>
              ) : paymentMode === 'paystack' ? (
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

            {/* Toggle "Payer par carte" / "Revenir Mobile Money" (uniquement en mode Paystack) */}
            {paymentMode === 'paystack' && (
              <button
                type="button"
                onClick={() => setSubMode(subMode === 'mobile-money' ? 'card' : 'mobile-money')}
                disabled={sending}
                className="flex items-center justify-center gap-1.5 text-center text-[10px] font-bold text-emerald-700 underline-offset-2 transition hover:text-emerald-900 hover:underline disabled:opacity-50"
              >
                {subMode === 'mobile-money' ? (
                  <>
                    <span className="text-[12px]">💳</span>
                    <span>Pas de Mobile Money ? <span className="font-black">Payer par carte plutot</span></span>
                  </>
                ) : (
                  <>
                    <span className="text-[12px]">📱</span>
                    <span>Revenir au <span className="font-black">paiement Mobile Money</span></span>
                  </>
                )}
              </button>
            )}

            <p className="text-center text-[9px] font-bold uppercase tracking-[0.25em] text-stone-500">
              {paymentMode === 'paystack'
                ? subMode === 'card'
                  ? '🔒 Paiement securise via Paystack · Visa · Mastercard'
                  : '🔒 Paiement securise via Paystack · Wave · Orange · MTN'
                : '🔒 Paiement a la livraison · Sans risque'}
            </p>
          </form>

          {/* ===== OVERLAY "Validez sur votre telephone" ===== */}
          {(isPaystackAwaiting || isPaystackOtp || isPaystackFailed) && (
            <div className="absolute inset-0 z-[20] flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-[20px] p-6">
              <div className="w-full max-w-sm">

                {/* AWAITING : spinner + message + countdown */}
                {isPaystackAwaiting && (
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 ring-4 ring-emerald-50 scm-pulse-mm">
                      <span className="text-[40px]">📱</span>
                    </div>
                    <h4 className="scm-serif mb-2 text-[20px] font-bold leading-tight text-slate-900">
                      Validez sur votre telephone
                    </h4>
                    <p className="mb-3 text-[13px] leading-snug text-slate-600">
                      {paystackDisplay || (
                        <>
                          Ouvre l'app <strong className="text-emerald-700">{provider === 'wave' ? 'Wave' : provider === 'orange' ? 'Orange Money' : 'MTN MoMo'}</strong> et confirme le paiement de <strong className="text-slate-900">{fmt(total)}</strong>.
                        </>
                      )}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"/>
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700">En attente de validation...</span>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-500">
                      Le delai est de 3 minutes. Aucun montant n'est preleve si vous ne validez pas.
                    </p>
                  </div>
                )}

                {/* OTP : input pour saisir le code */}
                {isPaystackOtp && (
                  <form onSubmit={onSubmitOtp} className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 ring-4 ring-amber-50">
                      <span className="text-[40px]">🔐</span>
                    </div>
                    <h4 className="scm-serif mb-2 text-[20px] font-bold leading-tight text-slate-900">
                      Code de verification
                    </h4>
                    <p className="mb-4 text-[13px] leading-snug text-slate-600">
                      {paystackDisplay || 'Entrez le code recu par SMS pour valider le paiement.'}
                    </p>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="123456"
                      autoFocus
                      className="block w-full rounded-[0.6rem] border-2 border-emerald-300 bg-white px-3 py-3 text-center text-[20px] font-black tracking-[0.5em] text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {formErr && (
                      <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-100">{formErr}</p>
                    )}
                    <button
                      type="submit"
                      disabled={otp.trim().length < 4 || sending}
                      className="mt-4 flex h-[48px] w-full items-center justify-center gap-2 rounded-[0.8rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-lg disabled:opacity-50"
                    >
                      {sending ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Verification...
                        </>
                      ) : 'Valider le code'}
                    </button>
                  </form>
                )}

                {/* FAILED / TIMEOUT : message d'erreur + retry */}
                {isPaystackFailed && (
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 ring-4 ring-rose-50">
                      <svg className="h-10 w-10 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h4 className="scm-serif mb-2 text-[20px] font-bold leading-tight text-slate-900">
                      {paystackStatus === 'timeout' ? 'Delai depasse' : 'Paiement refuse'}
                    </h4>
                    <p className="mb-4 text-[13px] leading-snug text-slate-600">
                      {formErr || 'Aucun montant n\'a ete preleve. Vous pouvez reessayer ou choisir le paiement a la livraison.'}
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => resetPaystack()}
                        className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[0.8rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-lg"
                      >
                        Reessayer
                      </button>
                      {cfg.onChangePaymentMode && (
                        <button
                          type="button"
                          onClick={() => { resetPaystack(); cfg.onChangePaymentMode?.(); }}
                          className="rounded-md bg-stone-100 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-200"
                        >
                          Choisir un autre moyen de paiement
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes scmfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scmslide { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes scmPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        @keyframes scmSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes scmFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        @keyframes scmShimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        @keyframes scmPulseMm { 0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,0.4) } 50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(16,185,129,0) } }

        .scm-pulse-mm { animation: scmPulseMm 1.6s ease-out infinite }
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
