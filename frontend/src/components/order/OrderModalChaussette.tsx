/**
 * Modal de commande pour "Chaussette de compression" — VERSION SIMPLIFIEE.
 *
 * Layout A (bottom-sheet clair) + selecteur de TAILLE S/M/L/XL/XXL inline.
 * Palette teal/cyan (sante veineuse, fraicheur).
 *
 * IMPORTANT : la taille selectionnee est concatenee au champ "city" avant le
 * submit : `${city} | TAILLE ${size}`. C'est volontaire — le backend obgestion
 * n'a pas de champ taille dedie, mais l'operateur voit la taille dans le champ
 * adresse et peut la confirmer au telephone. Comportement historique preserve.
 *
 * Logique metier (useOrderSubmit -> /api/public/order) 100% inchangee.
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

type SizeCode = 'S' | 'M' | 'L' | 'XL' | 'XXL';
interface Size { code: SizeCode; shoe: string; desc: string; }
const SIZES: Size[] = [
  { code: 'S',   shoe: '35-37', desc: 'Petite morphologie' },
  { code: 'M',   shoe: '38-40', desc: 'Taille standard' },
  { code: 'L',   shoe: '41-43', desc: 'Grande morphologie' },
  { code: 'XL',  shoe: '44-46', desc: 'Très grande' },
  { code: 'XXL', shoe: '47-49', desc: 'Morphologie XXL' },
];

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function OrderModalChaussette({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [size, setSize] = useState<SizeCode>('M');

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setSize('M');
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
  const selectedSize = SIZES.find((s) => s.code === size) || SIZES[1];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chaus-modal-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-teal-950/80 backdrop-blur-sm animate-[chfade_.2s_ease-out]"
      />

      <div className="relative z-10 w-full max-w-[460px] max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-teal-200 bg-white px-5 py-5 shadow-2xl animate-[chslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:rounded-3xl sm:border sm:border-teal-100 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => !sending && onClose()}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition hover:bg-teal-100 hover:scale-105 disabled:opacity-50"
          disabled={sending}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">
            ✓ Compression médicale
          </span>
          <h3 id="chaus-modal-title" className="mt-2 text-[20px] font-black text-teal-900">
            {cfg.title || 'Chaussettes de compression'}
          </h3>
          <p className="mt-1 text-[12px] font-medium text-teal-600/70">
            Choisissez votre taille et remplissez le formulaire.
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await submit({ name, city: `${city} | TAILLE ${size}`, phone, qty });
          }}
          className="flex flex-col gap-3"
        >
          {/* SELECTEUR TAILLE - 5 boutons */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-teal-700">Votre taille</label>
              <span className="text-[10px] font-semibold text-teal-600">Pointure {selectedSize.shoe} · {selectedSize.desc}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {SIZES.map((s) => {
                const active = size === s.code;
                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setSize(s.code)}
                    className={`flex flex-col items-center rounded-xl border-2 px-1 py-2 transition-all ${
                      active
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'
                    }`}
                  >
                    <span className={`text-[13px] font-black ${active ? 'text-teal-700' : 'text-slate-800'}`}>{s.code}</span>
                    <span className={`text-[9px] font-bold ${active ? 'text-teal-600' : 'text-slate-400'}`}>{s.shoe}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-teal-700">Nombre de paires</label>
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
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'
                    }`}
                  >
                    {o.tag && (
                      <span className="absolute -right-1 -top-2 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow">
                        {o.tag}
                      </span>
                    )}
                    <span className={`text-xl font-black leading-none ${active ? 'text-teal-700' : 'text-slate-900'}`}>{o.v}</span>
                    <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">{o.label}</span>
                    <span className={`text-[10px] font-black ${active ? 'text-teal-600' : 'text-teal-500'}`}>{o.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="ch-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-teal-700">Nom complet</label>
            <input id="ch-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Kouassi" autoComplete="name" required
              className="block w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
          </div>

          <div>
            <label htmlFor="ch-city" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-teal-700">Ville de livraison</label>
            <input id="ch-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Abidjan, Bouaké, Daloa…" autoComplete="address-level2" required
              className="block w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
          </div>

          <div>
            <label htmlFor="ch-phone" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-teal-700">Téléphone</label>
            <div className="flex overflow-hidden rounded-xl border-[1.5px] border-slate-200 bg-white transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
              <span className="flex items-center gap-1 border-r border-slate-200 bg-slate-50 px-3 text-[13px] font-bold text-slate-700">🇨🇮 +225</span>
              <input id="ch-phone" type="tel" inputMode="numeric" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="07 XX XX XX XX" autoComplete="tel-national" required
                className="h-full w-full bg-white px-3 py-3 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-teal-900 to-cyan-900 px-3.5 py-3 text-white">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[12px] font-semibold">Total</span>
              <span className="text-[10px] text-cyan-300">livraison gratuite · Taille {size}</span>
            </div>
            <div className="flex items-baseline gap-2">
              {qty > 1 && <span className="text-[11px] text-slate-400 line-through">{fmt(oldTotal)}</span>}
              <span className="text-[17px] font-black">{fmt(total)}</span>
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="mt-1 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 bg-[length:200%_100%] text-[15px] font-extrabold text-white shadow-[0_10px_25px_-5px_rgba(20,184,166,0.5)] transition-all hover:bg-[position:100%_0] hover:shadow-[0_14px_30px_-5px_rgba(20,184,166,0.6)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
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

          <p className="text-center text-[11px] font-medium text-slate-400">🔒 Paiement à la livraison · Garantie satisfaction</p>
        </form>
      </div>

      <style>{`
        @keyframes chfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes chslide { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
