/**
 * Modal de commande pour "Patch anti-douleur TK / FB" — PLEIN ECRAN PREMIUM.
 *
 * Layout :
 *   - Mobile : stack plein ecran (header sticky + body scroll + CTA en bas)
 *   - Desktop : split 2 colonnes (visuel/benefices a gauche, form a droite)
 *
 * Logique metier 100% inchangee :
 *   - useOrderSubmit -> /api/public/order
 *   - Champs name / city / phone / qty (memes IDs/types)
 *   - Tracking trackOpen + cfg.metaPixelId conserve
 *   - Countdown 15min + stock pulse conserves
 *
 * Sert les 2 slugs : patchdouleurtk ET patchdouleurfb.
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

export default function OrderModalPatchDouleur({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(12);
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
      setStock(8 + Math.floor(Math.random() * 6));
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

  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const oldTotal = total + (qty * 5000);
  const stockPct = Math.max(20, Math.min(100, Math.round((stock / 30) * 100)));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-stretch overflow-hidden bg-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pd-modal-title"
    >
      {/* ========== PANEL FULL-SCREEN ========== */}
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white animate-[pdslide_.25s_cubic-bezier(.22,.8,.4,1)] lg:flex-row">

        {/* ============================================== */}
        {/* COLONNE GAUCHE — visuel premium (desktop only) */}
        {/* ============================================== */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 lg:flex lg:w-[42%] lg:flex-col lg:px-10 lg:py-8 xl:w-[44%] xl:px-12 xl:py-10">
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div className="absolute -top-32 -right-20 h-[500px] w-[500px] rounded-full bg-cyan-400 blur-[120px]"/>
            <div className="absolute -bottom-32 -left-20 h-[500px] w-[500px] rounded-full bg-fuchsia-400 blur-[140px]"/>
          </div>

          {/* Top : badge + countdown */}
          <div className="relative flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200 ring-1 ring-cyan-300/30 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]"/>
              Commande securisee
            </span>
          </div>

          {/* Image produit */}
          <div className="relative mt-8 flex flex-1 items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-white/10 blur-2xl"/>
              <img
                src={cfg.images.hero}
                alt="Patch Anti-Douleur"
                loading="eager"
                decoding="async"
                className="relative max-h-[50vh] w-auto rounded-[28px] object-contain shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/20"
              />
              {/* Sticker -34% */}
              <div className="absolute -top-3 -right-3 flex h-20 w-20 rotate-[-12deg] flex-col items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_12px_30px_-4px_rgba(249,115,22,0.65)] ring-4 ring-white/30">
                <span className="text-[18px] font-black leading-none">-34%</span>
                <span className="text-[7px] font-black uppercase tracking-[0.2em]">aujourd'hui</span>
              </div>
            </div>
          </div>

          {/* Pitch + benefices + countdown */}
          <div className="relative mt-6 space-y-5">
            <h3 className="text-[26px] font-black leading-[1.05] tracking-tight text-white xl:text-[32px]">
              Stop aux douleurs.<br/>
              <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-cyan-300 bg-clip-text text-transparent">En 3 secondes.</span>
            </h3>

            <ul className="space-y-2 text-[13px] text-cyan-100/90 xl:text-[14px]">
              {[
                'Action chauffante en 3 secondes',
                'Soulagement jusqu\'a 12 heures',
                '100% naturel, sans medicament',
                'Paiement a la livraison',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            {/* Countdown card */}
            <div className="rounded-2xl bg-black/30 p-3 ring-1 ring-cyan-300/30 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.32em] text-cyan-300">Offre fin dans</p>
              <p className="mt-1 font-mono text-[28px] font-black tabular-nums leading-none text-white">
                <span className="pd-pulse-digit">{pad(countdown.m)}</span>
                <span className="opacity-50">:</span>
                <span className="pd-pulse-digit">{pad(countdown.s)}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-gradient-to-r from-cyan-300 to-white transition-all" style={{ width: `${stockPct}%` }}/>
                </div>
                <span className="text-[10px] font-black tabular-nums text-cyan-100">{stock} restantes</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-cyan-100/90">
              {[
                { ico: '🚚', t: 'Livraison 24h' },
                { ico: '💵', t: 'Paiement livraison' },
                { ico: '🔒', t: 'Commande securisee' },
                { ico: '📞', t: 'Conseiller 30 min' },
              ].map((b) => (
                <div key={b.t} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">
                  <span>{b.ico}</span>
                  <span>{b.t}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ============================================== */}
        {/* COLONNE DROITE — formulaire                    */}
        {/* ============================================== */}
        <div className="relative flex h-full flex-1 flex-col overflow-hidden">

          {/* Header sticky (mobile + desktop) */}
          <header className="relative z-10 shrink-0 border-b border-neutral-200 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-3 text-white sm:px-6 sm:py-4">
            <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-cyan-300/25 blur-2xl"/>
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/15 blur-2xl"/>

            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 hover:scale-105 disabled:opacity-50 sm:right-3 sm:top-3"
              disabled={sending}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative flex items-center justify-between gap-3 pr-10">
              <div>
                <h3 id="pd-modal-title" className="text-[16px] font-black leading-tight sm:text-[18px]">
                  Finaliser ma commande
                </h3>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200 sm:text-[11px]">
                  Patch Anti-Douleur
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 lg:hidden">
                <span className="rounded-md bg-black/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-200 ring-1 ring-cyan-300/25">Fin</span>
                <span className="font-mono text-[13px] font-black tabular-nums">
                  <span className="pd-pulse-digit">{pad(countdown.m)}</span>
                  <span className="mx-0.5 opacity-60">:</span>
                  <span className="pd-pulse-digit">{pad(countdown.s)}</span>
                </span>
              </div>
            </div>

            {/* Stock bar mobile */}
            <div className="relative mt-2.5 flex items-center gap-2 lg:hidden">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/30">
                <div className="h-full bg-gradient-to-r from-cyan-300 to-white transition-all" style={{ width: `${stockPct}%` }}/>
              </div>
              <span className="text-[10px] font-black tabular-nums text-cyan-100">{stock} restantes</span>
            </div>
          </header>

          {/* Body scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
            <form
              id="pd-order-form"
              onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
              className="mx-auto flex max-w-[520px] flex-col gap-4"
            >
              <OrderFormWarning title="Avant de commander">
                Paiement <strong>uniquement en cash</strong> à la livraison. Soyez <strong>présent(e)</strong> à l’adresse choisie sous <strong>24-48 h</strong> et préparez le montant exact.
              </OrderFormWarning>

              {/* Step 1 — quantite */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700">1</span>
                  Choisir la quantite
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {qtyOptions.map((o) => {
                    const active = qty === o.v;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setQty(o.v)}
                        className={`relative flex flex-col items-center justify-center rounded-xl border-2 px-2 py-3 transition-all ${
                          active
                            ? 'border-violet-500 bg-violet-50 shadow-[0_8px_20px_-6px_rgba(139,92,246,0.35)]'
                            : 'border-neutral-200 bg-white hover:border-violet-300'
                        }`}
                      >
                        {o.tag && (
                          <span className="absolute -right-1 -top-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-white shadow">
                            {o.tag}
                          </span>
                        )}
                        <span className={`text-[24px] font-black leading-none ${active ? 'text-violet-700' : 'text-neutral-900'}`}>{o.v}</span>
                        <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-500">{o.label}</span>
                        <span className={`mt-0.5 text-[10px] font-black ${active ? 'text-violet-600' : 'text-indigo-500'}`}>{o.sub}</span>
                        {o.save && <span className="mt-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] font-black text-emerald-700">{o.save}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 — coordonnees */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700">2</span>
                  Vos coordonnees
                </label>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom complet"
                    autoComplete="name"
                    required
                    className="block w-full rounded-xl border-[1.5px] border-neutral-200 bg-white px-4 py-3 text-[14px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />

                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ville (Abidjan, Bouake, Daloa...)"
                    autoComplete="address-level2"
                    required
                    className="block w-full rounded-xl border-[1.5px] border-neutral-200 bg-white px-4 py-3 text-[14px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />

                  <div className="flex overflow-hidden rounded-xl border-[1.5px] border-neutral-200 bg-white transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20">
                    <span className="flex items-center gap-1 border-r border-neutral-200 bg-neutral-50 px-3 text-[13px] font-bold text-neutral-700">🇨🇮 +225</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                      placeholder="07 XX XX XX XX"
                      autoComplete="tel-national"
                      required
                      className="h-full w-full bg-white px-3 py-3 text-[14px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 — total + reassurance */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-violet-900 to-indigo-950 p-4 text-white ring-1 ring-violet-500/30 shadow-[0_20px_40px_-15px_rgba(76,29,149,0.6)]">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-black uppercase tracking-[0.18em] text-cyan-200">Total a payer</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    {qty > 1 && <span className="text-[11px] text-neutral-400 line-through">{fmt(oldTotal)}</span>}
                    <span className="text-[22px] font-black tabular-nums text-cyan-300">{fmt(total)}</span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-300">livraison offerte</span>
                  <span className="rounded-md bg-amber-400/15 px-2 py-0.5 font-black uppercase tracking-widest text-amber-300 ring-1 ring-amber-300/30">paiement a la livraison</span>
                </div>
              </div>

              {formErr && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
              )}

              {/* Bouton submit (sera dupplique en footer sticky mobile) */}
              <button
                type="submit"
                disabled={sending}
                className="pd-cta group relative hidden h-[58px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500 text-[15px] font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_45px_-10px_rgba(99,102,241,0.65)] transition hover:shadow-[0_22px_50px_-8px_rgba(139,92,246,0.85)] active:translate-y-px disabled:cursor-wait disabled:opacity-60 lg:flex"
              >
                <span className="pd-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent"/>
                {sending ? (
                  <><span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /><span className="relative">Envoi en cours...</span></>
                ) : (
                  <>
                    <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="relative">Valider ma commande</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] font-medium text-neutral-500 lg:text-[12px]">
                🔒 Paiement a la livraison · Sans engagement · Conseiller sous 30 min
              </p>

              {/* Espace en bas sur mobile pour ne pas que le footer sticky cache le contenu */}
              <div className="h-20 lg:hidden"/>
            </form>
          </div>

          {/* Footer sticky mobile uniquement — CTA visible en permanence */}
          <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3 shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.15)] lg:hidden">
            <button
              type="submit"
              form="pd-order-form"
              disabled={sending}
              className="pd-cta group relative flex h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500 text-[14px] font-black uppercase tracking-[0.16em] text-white shadow-[0_15px_35px_-8px_rgba(99,102,241,0.65)] transition hover:shadow-[0_18px_40px_-6px_rgba(139,92,246,0.85)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
            >
              <span className="pd-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent"/>
              {sending ? (
                <><span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /><span className="relative">Envoi...</span></>
              ) : (
                <>
                  <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="relative">Valider ma commande · {fmt(total)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pdfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pdslide { from { transform: translateY(20px); opacity: 0.5 } to { transform: translateY(0); opacity: 1 } }
        @keyframes pdPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }
        @keyframes pdSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        .pd-pulse-digit { animation: pdPulseDigit 1s ease-in-out infinite }
        .pd-cta-sheen { animation: pdSheen 3.2s ease-in-out infinite }
      `}</style>
    </div>
  );
}
