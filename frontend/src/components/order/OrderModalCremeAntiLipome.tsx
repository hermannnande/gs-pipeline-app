/**
 * Modal commande — Crème Anti-Lipome (CREME_ANTI_LIPOME + clone CREME_LIPOME_TK3).
 * Palette : bleu profond · blanc · rouge corail (accent urgence).
 * Accordée à l'identité LipoSoin des visuels de la landing.
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

/** Champ de saisie : icône à gauche, focus bleu, hauteur confortable au pouce. */
function Field({ icon, ...input }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="group relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] transition-colors group-focus-within:text-[#2563eb]">
        {icon}
      </span>
      <input
        {...input}
        className="block h-[52px] w-full rounded-2xl border-2 border-[#2563eb]/15 bg-[#f8fafc] pl-11 pr-3 text-[15px] font-semibold text-[#0a1e3d] outline-none transition-all placeholder:font-medium placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,99,235,.12)]"
      />
    </div>
  );
}

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
      setStock(6 + Math.floor(Math.random() * 7));
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="cal-title">
      <div onClick={() => !sending && onClose()} className="absolute inset-0 bg-[#0a1e3d]/80 backdrop-blur-md animate-[calfade_.2s_ease-out]" />

      <div className="cal-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-white shadow-2xl animate-[calslide_.3s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[94vh] sm:max-w-[440px] sm:rounded-[26px]">
        <div className="h-1.5 w-full flex-none bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9]" />

        {/* Header produit + urgence */}
        <div className="relative flex-none overflow-hidden bg-gradient-to-b from-[#eff6ff] to-white">
          <div className="flex items-center gap-3 px-4 pb-2 pt-3">
            {cfg.images?.hero && (
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-[#2563eb]/20 shadow-md">
                <img src={cfg.images.hero} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 id="cal-title" className="truncate text-[15px] font-black text-[#0a1e3d]">
                Crème <span className="text-[#2563eb]">anti-lipome</span>
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2563eb]/12 px-2 py-0.5 text-[10px] font-black text-[#1d4ed8]">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono tabular-nums">{pad(countdown.m)}:{pad(countdown.s)}</span>
                </span>
                <span className="rounded-full bg-[#dc2626]/25 px-2 py-0.5 text-[9px] font-black uppercase text-[#b91c1c]">Promo</span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-black text-rose-600">{stock} restants</span>
              </div>
            </div>
            <button type="button" onClick={() => !sending && onClose()} aria-label="Fermer" disabled={sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb]/10 text-[#1d4ed8] transition hover:bg-[#2563eb]/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mx-4 mb-2 h-1 overflow-hidden rounded-full bg-[#2563eb]/12">
            <div className="h-full bg-gradient-to-r from-[#2563eb] to-[#dc2626] transition-all"
              style={{ width: `${Math.max(18, Math.min(100, Math.round((stock / 22) * 100)))}%` }} />
          </div>
        </div>

        <form id="cal-form" onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="cal-body relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-2 pt-1">

          <OrderFormWarning>
            Soyez <strong>joignable</strong> à l’adresse indiquée. Le livreur vous appellera sous <strong>24-48 h</strong>.
          </OrderFormWarning>

          {/* Sélecteur de pack */}
          <div>
            <label className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">Votre pack</span>
              {saving > 0 && <span className="rounded-full bg-[#dc2626]/30 px-2 py-0.5 text-[10px] font-black text-[#b91c1c]">-{fmt(saving)}</span>}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {qtyOptions.map((o) => {
                const active = qty === o.v;
                const price = cfg.prices?.[o.v] || 0;
                return (
                  <button key={o.v} type="button" onClick={() => setQty(o.v)}
                    className={`relative flex flex-col items-center rounded-2xl border-2 px-2 py-3 transition-all ${
                      active
                        ? 'border-[#2563eb] bg-gradient-to-b from-[#eff6ff] to-white shadow-md ring-2 ring-[#3b82f6]/25'
                        : 'border-[#2563eb]/12 bg-[#f8fafc] hover:border-[#2563eb]/35'
                    }`}>
                    {o.tag && active && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#dc2626] px-1.5 py-0.5 text-[7px] font-black uppercase text-[#0a1e3d]">{o.tag}</span>
                    )}
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563eb] text-white">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                    <span className={`text-[22px] font-black leading-none ${active ? 'text-[#2563eb]' : 'text-[#475569]'}`}>{o.v}</span>
                    <span className={`mt-0.5 text-[8px] font-bold uppercase ${active ? 'text-[#1d4ed8]' : 'text-[#94a3b8]'}`}>{o.label}</span>
                    <span className={`mt-1 text-[11px] font-black tabular-nums ${active ? 'text-[#0a1e3d]' : 'text-[#64748b]'}`}>
                      {price.toLocaleString('fr-FR').replace(/,/g, ' ')} F
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coordonnées */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">Vos coordonnées</p>

            <Field
              type="text" id="cal-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nom complet" autoComplete="name" required
              icon={<svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>}
            />

            <Field
              type="tel" id="cal-phone" inputMode="numeric" value={phone}
              onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
              placeholder="07 XX XX XX XX" autoComplete="tel-national" required
              icon={<span className="text-[15px] leading-none">🇨🇮</span>}
            />

            <Field
              type="text" id="cal-city" value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Ville de livraison" autoComplete="address-level2" required
              icon={<svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>}
            />
          </div>

          {formErr && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-600 ring-1 ring-rose-100">{formErr}</p>
          )}
        </form>

        <div className="pointer-events-none -mt-2 h-3 w-full bg-gradient-to-t from-white to-transparent" />

        {/* Récap + validation */}
        <div className="flex-none border-t border-[#3b82f6]/12 bg-white px-4 pt-2 shadow-[0_-8px_24px_-8px_rgba(37,99,235,.15)]"
          style={{ paddingBottom: 'calc(0.65rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="mb-2 rounded-2xl bg-gradient-to-br from-[#eff6ff] via-white to-[#f1f5f9] p-2.5 ring-1 ring-[#3b82f6]/20">
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between text-[#475569]">
                <span>Sous-total · {qty} tube{qty > 1 ? 's' : ''}</span>
                <span className="font-bold tabular-nums">{fmt(fullPrice)}</span>
              </div>
              {saving > 0 && (
                <div className="flex justify-between text-[#1d4ed8]">
                  <span>Remise pack</span>
                  <span className="font-bold tabular-nums">-{fmt(saving)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#475569]">
                <span>Livraison</span>
                <span className="font-black text-[#2563eb]">GRATUIT ✓</span>
              </div>
            </div>
            <div className="my-1.5 border-t border-dashed border-[#2563eb]/20" />
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">Total à payer</span>
              <div className="flex items-baseline gap-2">
                {qty > 1 && <span className="text-[10px] text-[#94a3b8] line-through">{fmt(oldTotal)}</span>}
                <span className="text-[24px] font-black tabular-nums text-[#2563eb]">{fmt(total)}</span>
              </div>
            </div>
          </div>

          <button type="submit" form="cal-form" disabled={sending}
            className="cal-submit group relative flex h-[56px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] text-[15px] font-black text-white shadow-[0_12px_28px_-6px_rgba(37,99,235,.55)] ring-2 ring-white/30 transition hover:shadow-[0_16px_32px_-6px_rgba(14,165,233,.5)] active:translate-y-px disabled:opacity-60">
            <span className="cal-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            {sending ? (
              <>
                <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="relative">Envoi en cours…</span>
              </>
            ) : (
              <>
                <svg className="relative h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.62-4.02A11.96 11.96 0 0112 2.94a11.96 11.96 0 01-8.62 3.04A12.02 12.02 0 003 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02z" />
                </svg>
                <span className="relative">Confirmer ma commande</span>
              </>
            )}
          </button>

          <div className="mt-1.5 flex items-center justify-center gap-3 text-[9px] font-semibold text-[#64748b]">
            <span>🔒 Sans paiement anticipé</span>
            <span className="h-3 w-px bg-[#2563eb]/20" />
            <span>📦 Express CI</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes calfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes calslide { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes calSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        .cal-cta-sheen { animation: calSheen 3s ease-in-out infinite }
        @keyframes calSubmitShake {
          0%, 86%, 100% { transform: translate3d(0,0,0) }
          88% { transform: translate3d(-3px,0,0) }
          90% { transform: translate3d(3px,0,0) }
          92% { transform: translate3d(-2px,0,0) }
          94% { transform: translate3d(2px,0,0) }
          96% { transform: translate3d(-1px,0,0) }
        }
        .cal-submit:not(:disabled) { animation: calSubmitShake 4.6s ease-in-out infinite }
        .cal-submit:hover, .cal-submit:active { animation-play-state: paused }
        @supports (height: 100svh) { .cal-shell { height: 100svh; } }
        @media (min-width: 640px) { .cal-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .cal-shell input:focus { font-size: 16px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cal-submit, .cal-cta-sheen { animation: none !important }
        }
      `}</style>
    </div>
  );
}
