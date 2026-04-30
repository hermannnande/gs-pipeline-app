/**
 * Modal de commande "Spray Anti-Lipome" — v3 CLEAN LIGHT PREMIUM.
 *
 * Design lisible, simple et elegant :
 *   - Fond blanc epure, typo noire nette (lisibilite maximale)
 *   - Accents pourpre / magenta sur les elements interactifs
 *   - Segmented control horizontal avec pill active magenta
 *   - Inputs clairs avec label au-dessus (pas de floating confus)
 *   - Recap style "facture" (sous-total, livraison, total en gros magenta)
 *   - CTA pleine largeur MAGENTA tres visible
 *   - Micro-countdown discret en haut a droite
 *
 * Logique metier 100 % inchangee (useOrderSubmit -> obgestion).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
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
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function OrderModalSprayLipome({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(13);
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
      setStock(9 + Math.floor(Math.random() * 6));
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

  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const unitPrice = cfg.prices?.[1] || 0;
  const fullPrice = unitPrice * qty;
  const saving = fullPrice - total;
  const oldTotal = fullPrice + (qty * 5000);

  const qtyIndex = useMemo(() => qtyOptions.findIndex(o => o.v === qty), [qty, qtyOptions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slm-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-purple-950/60 backdrop-blur-sm animate-[slmfade_.2s_ease-out]"
      />

      <div className="relative z-10 w-full max-w-[420px] max-h-[100dvh] overflow-hidden rounded-t-[24px] bg-white shadow-2xl animate-[slmslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:rounded-[24px]">

        {/* Fine ligne deco magenta en haut */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"/>

        {/* ===== HEADER SIMPLE ===== */}
        <div className="relative flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            {/* Icone spray rond */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white shadow-[0_6px_16px_-4px_rgba(217,70,239,.6)]">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 2h4v2H9V2zm-2 4h8v3H7V6zm1 4h6v11a1 1 0 01-1 1H9a1 1 0 01-1-1V10zm5-7v1h-4V3h4z"/>
              </svg>
            </div>
            <div>
              <h3 id="slm-title" className="text-[15px] font-black leading-tight text-neutral-900">
                Spray Anti-Lipome
              </h3>
              <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 font-bold text-fuchsia-600">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="font-mono tabular-nums">
                    {pad(countdown.m)}:<span className="slm-pulse-digit">{pad(countdown.s)}</span>
                  </span>
                </span>
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700">-34%</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !sending && onClose()}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-50"
            disabled={sending}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stock bar discret */}
        <div className="flex items-center gap-2 px-5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-rose-500 transition-all" style={{ width: `${Math.max(20, Math.min(100, Math.round((stock / 30) * 100)))}%` }}/>
          </div>
          <span className="text-[10px] font-black tabular-nums text-rose-600">
            <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">stock · </span>
            {stock} restants
          </span>
        </div>

        {/* ===== BODY ===== */}
        <div className="px-5 pt-4 pb-4">
          <form
            onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
            className="flex flex-col gap-3"
          >
            {/* ====== QUANTITE - segmented control light ====== */}
            <div>
              <label className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600">Votre pack</span>
                {qty > 1 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                    Vous economisez {fmt(saving)}
                  </span>
                )}
              </label>
              <div className="relative rounded-xl bg-neutral-100 p-1 ring-1 ring-neutral-200">
                {/* Indicator qui glisse */}
                <div
                  className="absolute inset-y-1 left-1 rounded-lg bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 shadow-[0_4px_14px_rgba(217,70,239,.45)] transition-all duration-300 ease-out"
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
                        className={`relative z-10 flex flex-col items-center justify-center rounded-lg px-2 py-2.5 transition-colors ${active ? 'text-white' : 'text-neutral-500 hover:text-neutral-800'}`}
                      >
                        <span className="text-[20px] font-black leading-none">{o.v}</span>
                        <span className={`mt-1 text-[9px] font-bold uppercase tracking-wider ${active ? 'text-white/85' : 'text-neutral-500'}`}>
                          {o.label.replace('sprays', 'sprays').replace('spray', 'spray')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ====== COORDONNEES ====== */}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600">Coordonnees</p>

              <div>
                <label htmlFor="slm-name" className="mb-0.5 block text-[10px] font-bold text-neutral-500">Nom complet</label>
                <input
                  type="text"
                  id="slm-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  autoComplete="name"
                  required
                  className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[14px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </div>

              <div>
                <label htmlFor="slm-phone" className="mb-0.5 block text-[10px] font-bold text-neutral-500">Telephone</label>
                <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white transition focus-within:border-fuchsia-500 focus-within:ring-2 focus-within:ring-fuchsia-500/20">
                  <span className="flex items-center gap-1 border-r border-neutral-200 bg-neutral-50 px-3 text-[13px] font-bold text-neutral-700">
                    <span>🇨🇮</span>
                    <span className="font-mono">+225</span>
                  </span>
                  <input
                    type="tel"
                    id="slm-phone"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="07 XX XX XX XX"
                    autoComplete="tel-national"
                    required
                    className="w-full bg-white px-3 py-2.5 text-[14px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="slm-city" className="mb-0.5 block text-[10px] font-bold text-neutral-500">Ville de livraison</label>
                <input
                  type="text"
                  id="slm-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Abidjan, Bouake, Daloa..."
                  autoComplete="address-level2"
                  required
                  className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[14px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </div>
            </div>

            {/* ====== RECAP FACTURE ====== */}
            <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-100">
              <div className="space-y-1 text-[12px]">
                <div className="flex items-baseline justify-between">
                  <span className="text-neutral-600">Sous-total · {qty} spray{qty > 1 ? 's' : ''}</span>
                  <span className="font-bold tabular-nums text-neutral-700">{fmt(fullPrice)}</span>
                </div>
                {saving > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-neutral-600">Remise pack</span>
                    <span className="font-bold tabular-nums text-emerald-600">-{fmt(saving)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-neutral-600">Livraison</span>
                  <span className="inline-flex items-center gap-1 font-black tabular-nums text-emerald-600">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.7 4.15a.75.75 0 01.14 1.05l-8 10.5a.75.75 0 01-1.13.08l-4.5-4.5a.75.75 0 011.06-1.06l3.9 3.89 7.48-9.82a.75.75 0 011.05-.14z"/></svg>
                    GRATUIT
                  </span>
                </div>
              </div>
              <div className="my-2 border-t border-dashed border-neutral-200"/>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-black uppercase tracking-wider text-neutral-700">Total a payer</span>
                <div className="flex items-baseline gap-2">
                  {qty > 1 && <span className="text-[11px] text-neutral-400 line-through">{fmt(oldTotal)}</span>}
                  <span className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-[22px] font-black tabular-nums text-transparent">
                    {fmt(total)}
                  </span>
                </div>
              </div>
            </div>

            {formErr && (
              <p className="rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
            )}

            {/* ====== CTA ====== */}
            <button
              type="submit"
              disabled={sending}
              className="slm-cta group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-[14px] font-black text-white shadow-[0_10px_24px_-4px_rgba(217,70,239,.55)] transition hover:shadow-[0_14px_30px_-4px_rgba(217,70,239,.75)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
            >
              <span className="slm-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent"/>
              {sending ? (
                <><span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /><span className="relative">Envoi...</span></>
              ) : (
                <>
                  <svg className="relative h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.62-4.02A11.96 11.96 0 0112 2.94a11.96 11.96 0 01-8.62 3.04A12.02 12.02 0 003 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02z" /></svg>
                  <span className="relative">Confirmer ma commande</span>
                </>
              )}
            </button>

            {/* ====== RASSURANCE ====== */}
            <div className="flex items-center justify-center gap-3 text-[10px] font-semibold text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <svg className="h-3 w-3 text-fuchsia-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                Paiement a la livraison
              </span>
              <span className="h-3 w-px bg-neutral-200"/>
              <span className="inline-flex items-center gap-1">
                <svg className="h-3 w-3 text-fuchsia-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/></svg>
                Livraison 24h Abidjan
              </span>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slmfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slmslide { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes slmPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes slmSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes slmFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        .slm-pulse-digit { animation: slmPulseDigit 1s ease-in-out infinite }
        .slm-cta { animation: slmFloat 2.8s ease-in-out infinite }
        .slm-cta:hover { animation: none; transform: translateY(-2px) }
        .slm-cta-sheen { animation: slmSheen 3.4s ease-in-out infinite }
      `}</style>
    </div>
  );
}
