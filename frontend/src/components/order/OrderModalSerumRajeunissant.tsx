/**
 * Modal commande — Sérum Rajeunissant Anti-Âge Yeux (SERUM_RAJEUNISSANT).
 * Base : OrderModalMiniSac (logique metier useOrderSubmit 100% conservee).
 * Pas de selection de coloris : un seul produit, packs 1/2/3 flacons.
 *
 * Theme : marron #7B4B2A / rose #E8739E / violet #A855F7.
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';
import { cleanPhoneCI } from '../../utils/phone';
import { orderTotal } from '../../utils/pricingHelpers';

interface QtyOption { v: number; label: string; sub: string; tag?: string; save?: string; }
interface Props {
  open: boolean; onClose: () => void;
  cfg: OrderSubmitConfig & { images: { hero: string } };
  product: OrderProduct | null; setProduct?: (p: OrderProduct | null) => void;
  qtyOptions: QtyOption[]; initialQty?: number;
}

function fmt(n: number) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F'; }
const pad = (n: number) => String(n).padStart(2, '0');
const inputCls = 'block h-12 w-full rounded-2xl border border-[#F4A7C3]/50 bg-white px-4 text-[16px] font-medium outline-none focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/25';

export default function OrderModalSerumRajeunissant({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });
  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState(''); const [city, setCity] = useState(''); const [phone, setPhone] = useState('');
  const [cd, setCd] = useState({ m: 0, s: 0 });
  const wasOpenRef = useRef(false); const trackRef = useRef(trackOpen); const nameRef = useRef<HTMLInputElement>(null);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (!open) { wasOpenRef.current = false; return; }
    setQty(initialQty);
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      trackRef.current(initialQty);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open, initialQty]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !sending) onClose(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [open, sending, onClose]);

  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - Date.now());
      setCd({ m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [open]);

  if (!open) return null;
  const total = orderTotal(cfg.prices || {}, qty);
  const selected = qtyOptions.find((o) => o.v === qty);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div onClick={() => !sending && onClose()} className="absolute inset-0 bg-[#2C1810]/60 backdrop-blur-[2px]" />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[28px] bg-gradient-to-b from-[#FFF6EF] to-white shadow-2xl sm:rounded-3xl">
        <div className="shrink-0 border-b border-[#F4A7C3]/30 px-5 pb-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E8739E]/40 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0683C]">Paiement à la livraison</p>
              <h3 className="mt-0.5 text-[18px] font-black text-[#3E2415]">{cfg.title || 'Sérum Rajeunissant Anti-Âge Yeux'}</h3>
              <p className="mt-1 text-[11px] font-semibold tabular-nums text-[#E8739E]">⏱ {pad(cd.m)}:{pad(cd.s)} · offre -50 % ce soir</p>
            </div>
            <button type="button" onClick={() => !sending && onClose()} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4A7C3]/20 text-[#A0683C]">✕</button>
          </div>
        </div>

        <form
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-col gap-4 overflow-y-auto px-5 py-4"
        >
          <div className="grid grid-cols-3 gap-2">
            {qtyOptions.map((o) => {
              const active = qty === o.v;
              return (
                <button key={o.v} type="button" onClick={() => setQty(o.v)}
                  className={`relative rounded-2xl border-2 px-2 py-3 text-center transition ${active ? 'scale-[1.02] border-[#A855F7] bg-gradient-to-b from-[#FDF0F5] to-[#F3E8FF] shadow-md' : 'border-[#F4A7C3]/40 bg-white'}`}>
                  {o.tag && active && <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#E8739E] to-[#A855F7] px-2 py-0.5 text-[7px] font-black uppercase text-white">{o.tag}</span>}
                  <p className={`text-[15px] font-black ${active ? 'text-[#7C3AED]' : 'text-neutral-800'}`}>{o.sub}</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase text-[#A0683C]">{o.label}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom complet" required className={inputCls} />
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville (ex. Abidjan…)" required className={inputCls} />
            <div className="flex h-12 overflow-hidden rounded-2xl border border-[#F4A7C3]/50 bg-white">
              <span className="flex items-center border-r border-[#F4A7C3]/40 bg-[#FFF6EF] px-3 text-[13px] font-bold text-[#A0683C]">+225</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(cleanPhoneCI(e.target.value))} placeholder="07 XX XX XX XX" required className="h-full w-full bg-transparent px-3 text-[16px] outline-none" />
            </div>
          </div>

          {formErr && <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-[12px] font-semibold text-red-600">{formErr}</p>}
          <button type="submit" disabled={sending}
            className="flex h-[54px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#7B4B2A] via-[#E8739E] to-[#A855F7] text-[15px] font-black text-white shadow-[0_14px_36px_-10px_rgba(232,115,158,.55)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60">
            {sending ? 'Envoi en cours…' : <>Commander · {fmt(total)}</>}
          </button>
          {selected?.save && <p className="-mt-2 text-center text-[10px] font-semibold text-emerald-600">{selected.save}</p>}
        </form>
        <p className="shrink-0 px-5 pb-4 text-center text-[10px] text-[#A0683C]" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          🔒 Aucun paiement en ligne · Vous payez à la réception · Confirmation par téléphone
        </p>
      </div>
    </div>
  );
}
