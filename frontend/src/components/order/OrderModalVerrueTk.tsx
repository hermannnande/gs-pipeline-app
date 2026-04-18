/**
 * Modal de commande SPECIFIQUE au produit "Creme verrue TK".
 *
 * Design : slider avant/apres drag interactif en hero du modal pour montrer
 * visuellement l'efficacite du produit avant que le client remplisse ses infos.
 * Couleurs medical-emerald (rassurant, gueris). Animations fluides au drag.
 *
 * COMPACT MOBILE : tout doit tenir sur iPhone SE (568px utiles) SANS scroll
 * dans le formulaire. Sur desktop (sm:), revient aux tailles confortables.
 *
 * Utilise le hook useOrderSubmit pour la logique metier (validation, axios,
 * Meta Pixel, redirect merci) - donc le code ici se concentre 100% sur l'UX.
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';

// Images avant/apres specifiques au produit Creme verrue TK (hardcoded car
// ce composant est exclusif a ce produit). Override toujours la config backend.
const VERRUE_TK_BEFORE = 'https://coachingexpertci.com/wp-content/uploads/2026/04/Design-sans-titre-7.jpg';
const VERRUE_TK_AFTER = 'https://coachingexpertci.com/wp-content/uploads/2026/04/feqcsw.jpg';

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

export default function OrderModalVerrueTk({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [sliderPos, setSliderPos] = useState(50);
  const [hint, setHint] = useState(true);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  // Ref pour reset les champs UNE SEULE FOIS a l'ouverture (pas a chaque
  // rerender, sinon les inputs se vident a chaque frappe).
  const wasOpenRef = useRef(false);
  // Ref vers trackOpen pour eviter qu'elle declenche le reset.
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setSliderPos(50);
      setHint(true);
      trackRef.current(initialQty);
      const t = setTimeout(() => setHint(false), 3000);
      return () => clearTimeout(t);
    }
    if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [open, initialQty]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const handlePointer = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
    if (hint) setHint(false);
  };

  if (!open) return null;

  const beforeImg = VERRUE_TK_BEFORE;
  const afterImg = VERRUE_TK_AFTER;

  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const oldTotal = total + (qty * 5000);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-[fadeIn_.25s] sm:flex-row">
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-lg backdrop-blur transition hover:bg-white hover:scale-110 sm:right-4 sm:top-4 sm:h-11 sm:w-11"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* SLIDER AVANT/APRES IMMERSIF - prend toute la hauteur dispo (mobile :
          ~45vh en haut, desktop : full height a gauche en split layout) */}
      <div className="relative flex flex-shrink-0 flex-col bg-neutral-900 sm:flex-1 sm:flex-shrink">
        <div
          ref={sliderRef}
          className="relative h-[45vh] flex-shrink-0 cursor-ew-resize select-none overflow-hidden sm:h-auto sm:flex-1"
          onMouseDown={(e) => { isDragging.current = true; handlePointer(e.clientX); }}
          onMouseUp={() => { isDragging.current = false; }}
          onMouseLeave={() => { isDragging.current = false; }}
          onMouseMove={(e) => { if (isDragging.current) handlePointer(e.clientX); }}
          onTouchStart={(e) => { isDragging.current = true; handlePointer(e.touches[0].clientX); }}
          onTouchEnd={() => { isDragging.current = false; }}
          onTouchMove={(e) => { if (isDragging.current) handlePointer(e.touches[0].clientX); }}
        >
          <img src={afterImg} alt="Apres traitement" draggable={false} className="absolute inset-0 h-full w-full object-cover pointer-events-none" />

          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ width: `${sliderPos}%` }}>
            <img
              src={beforeImg}
              alt="Avant traitement"
              draggable={false}
              className="absolute inset-0 h-full object-cover"
              style={{ width: `${(100 / sliderPos) * 100}%`, maxWidth: 'none', minWidth: '100%' }}
            />
          </div>

          <span className="absolute left-3 top-3 rounded-full bg-red-500/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[12px]">
            AVANT
          </span>
          <span className="absolute right-14 top-3 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow backdrop-blur sm:right-16 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[12px]">
            APRES
          </span>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_rgba(0,0,0,.5)] pointer-events-none"
            style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-2xl ring-2 ring-emerald-500/40 sm:h-14 sm:w-14">
              <svg className="h-5 w-5 text-neutral-900 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
              </svg>
            </div>
          </div>

          {hint && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur animate-[pulse_1.5s_ease-in-out_infinite] sm:bottom-6 sm:gap-2 sm:px-4 sm:py-2 sm:text-[13px]">
              <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Glissez pour comparer
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-center sm:py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white sm:text-[13px]">
            Resultat reel apres 14 jours <span className="text-emerald-200">·</span> Sans douleur
          </p>
        </div>
      </div>

      {/* FORMULAIRE - prend le reste de l'ecran. Mobile : col, desktop : panel
          fixe a droite, vertically centered */}
      <form
        onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3 sm:w-[460px] sm:flex-none sm:justify-center sm:gap-4 sm:overflow-y-auto sm:px-8 sm:py-8"
      >
          {/* Quantites - cartes compactes */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {qtyOptions.map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setQty(o.v)}
                className={`relative flex flex-col items-center rounded-lg border-2 px-1 py-1 transition-all sm:rounded-xl sm:px-2 sm:py-2.5 ${
                  qty === o.v
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm scale-[1.02]'
                    : 'border-neutral-200 bg-white hover:border-emerald-300'
                }`}
              >
                {o.tag && (
                  <span className="absolute -right-0.5 -top-1.5 rounded-full bg-red-500 px-1 py-0 text-[7px] font-black uppercase tracking-wider text-white shadow sm:-right-1 sm:-top-2 sm:px-1.5 sm:py-0.5 sm:text-[8px]">
                    {o.tag}
                  </span>
                )}
                <span className="text-base font-black text-neutral-900 sm:text-2xl">{o.v}</span>
                <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[9px]">
                  {o.label}
                </span>
                <span className="text-[10px] font-black text-emerald-600 sm:text-[12px]">{o.sub}</span>
              </button>
            ))}
          </div>

          {/* Champs compacts - 3 inputs sur 2 lignes (nom+ville | tel) */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom complet *"
              className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville / Commune *"
              className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
            />
          </div>

          <div className="flex h-9 overflow-hidden rounded-lg border border-neutral-200 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 sm:h-11 sm:rounded-xl">
            <span className="flex items-center gap-1 border-r border-neutral-200 bg-neutral-50 px-2.5 text-[11px] font-bold text-neutral-600 sm:px-3 sm:text-[13px]">
              +225
            </span>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telephone *"
              className="h-full w-full bg-neutral-50 px-2.5 text-[12px] font-medium outline-none placeholder:text-neutral-400 focus:bg-white sm:px-3 sm:text-[13px]"
            />
          </div>

          {/* Total compact - 1 seule ligne */}
          <div className="flex items-center justify-between rounded-lg bg-neutral-900 px-3 py-2 text-white sm:rounded-xl sm:py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold sm:text-[12px]">Total</span>
              <span className="text-[9px] text-emerald-400 sm:text-[10px]">livraison gratuite</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              {qty > 1 && (
                <span className="text-[9px] text-neutral-400 line-through sm:text-[11px]">{fmt(oldTotal)}</span>
              )}
              <span className="text-[14px] font-black sm:text-[17px]">{fmt(total)}</span>
            </div>
          </div>

          {formErr && (
            <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-100 sm:rounded-lg sm:py-2 sm:text-[12px]">
              {formErr}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="cta-attract group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 bg-[length:200%_100%] text-[13px] font-extrabold text-white shadow-lg shadow-emerald-500/30 transition-shadow hover:bg-[position:100%_0] hover:shadow-2xl hover:shadow-emerald-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-[52px] sm:rounded-2xl sm:text-[15px]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {sending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Envoi...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Confirmer ma commande
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[9px] font-semibold text-neutral-400 sm:gap-4 sm:text-[11px]">
            <span className="flex items-center gap-1">
              <svg className="h-2.5 w-2.5 text-emerald-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Paiement a la livraison
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-2.5 w-2.5 text-emerald-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Garantie satisfaction
            </span>
          </div>
      </form>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
