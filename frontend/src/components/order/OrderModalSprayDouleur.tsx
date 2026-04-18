/**
 * Modal de commande SPECIFIQUE au produit "Spray douleur TK".
 *
 * Design : silhouette humaine SVG vue de face avec 6 zones de douleur
 * cliquables (cou, epaules, dos, coudes, genoux, chevilles). Au clic, la zone
 * pulse en rouge et un texte explicatif apparait, montrant que le spray cible
 * cette douleur. Couleurs feu/orange (chaleur, urgence, soulagement).
 *
 * COMPACT MOBILE : tout doit tenir sur iPhone SE SANS scroll dans le formulaire.
 * Layout split desktop : silhouette a gauche, formulaire a droite.
 *
 * Utilise le hook useOrderSubmit pour la logique metier.
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

interface PainZone {
  id: string;
  label: string;
  cx: number;
  cy: number;
  description: string;
}

const PAIN_ZONES: PainZone[] = [
  { id: 'neck', label: 'Cou', cx: 100, cy: 38, description: 'Tensions cervicales et torticolis' },
  { id: 'shoulder', label: 'Epaule', cx: 138, cy: 60, description: 'Douleurs et raideurs articulaires' },
  { id: 'back', label: 'Bas du dos', cx: 100, cy: 105, description: 'Lombalgie et sciatique' },
  { id: 'elbow', label: 'Coude', cx: 60, cy: 110, description: 'Tendinite et epicondylite' },
  { id: 'knee', label: 'Genou', cx: 82, cy: 175, description: 'Arthrose et entorse' },
  { id: 'ankle', label: 'Cheville', cx: 75, cy: 230, description: 'Foulure et torsion' },
];

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function OrderModalSprayDouleur({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [activeZone, setActiveZone] = useState<string>('back');

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setActiveZone('back');
      trackRef.current(initialQty);
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

  if (!open) return null;

  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const oldTotal = total + (qty * 5000);
  const zone = PAIN_ZONES.find((z) => z.id === activeZone) || PAIN_ZONES[0];

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

      {/* HERO : Silhouette humaine + zones douleur cliquables */}
      <div className="relative flex flex-shrink-0 flex-col bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 sm:flex-1 sm:flex-shrink">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(239,68,68,.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(249,115,22,.08) 0%, transparent 50%)' }} />

        <div className="relative flex flex-1 items-center justify-center px-4 py-4 sm:px-8 sm:py-8">
          <div className="flex w-full max-w-md items-center gap-3 sm:gap-6">
            {/* Silhouette SVG */}
            <div className="relative flex-shrink-0">
              <svg viewBox="0 0 200 280" className="h-[180px] w-auto sm:h-[340px]" xmlns="http://www.w3.org/2000/svg">
                {/* Tete */}
                <circle cx="100" cy="22" r="16" fill="#fed7aa" stroke="#fb923c" strokeWidth="1.5" />
                {/* Cou */}
                <rect x="93" y="36" width="14" height="8" fill="#fed7aa" stroke="#fb923c" strokeWidth="1" />
                {/* Torse */}
                <path d="M 70 50 Q 70 45 75 44 L 125 44 Q 130 45 130 50 L 135 110 Q 132 125 100 130 Q 68 125 65 110 Z" fill="#fed7aa" stroke="#fb923c" strokeWidth="1.5" />
                {/* Bras gauche */}
                <path d="M 70 52 Q 50 70 48 110 Q 47 145 50 165" fill="none" stroke="#fb923c" strokeWidth="14" strokeLinecap="round" />
                {/* Bras droit */}
                <path d="M 130 52 Q 150 70 152 110 Q 153 145 150 165" fill="none" stroke="#fb923c" strokeWidth="14" strokeLinecap="round" />
                {/* Mains */}
                <circle cx="49" cy="170" r="8" fill="#fed7aa" stroke="#fb923c" strokeWidth="1.2" />
                <circle cx="151" cy="170" r="8" fill="#fed7aa" stroke="#fb923c" strokeWidth="1.2" />
                {/* Hanches/cuisses */}
                <path d="M 70 130 L 65 175 Q 65 180 72 180 L 95 180 Z" fill="#fb923c" stroke="#ea580c" strokeWidth="1" />
                <path d="M 130 130 L 135 175 Q 135 180 128 180 L 105 180 Z" fill="#fb923c" stroke="#ea580c" strokeWidth="1" />
                {/* Jambes */}
                <path d="M 80 180 Q 78 220 76 250" fill="none" stroke="#fb923c" strokeWidth="16" strokeLinecap="round" />
                <path d="M 120 180 Q 122 220 124 250" fill="none" stroke="#fb923c" strokeWidth="16" strokeLinecap="round" />
                {/* Pieds */}
                <ellipse cx="74" cy="258" rx="10" ry="5" fill="#92400e" />
                <ellipse cx="126" cy="258" rx="10" ry="5" fill="#92400e" />

                {/* Zones douleur cliquables */}
                {PAIN_ZONES.map((z) => {
                  const isActive = z.id === activeZone;
                  return (
                    <g key={z.id} onClick={() => setActiveZone(z.id)} style={{ cursor: 'pointer' }}>
                      {isActive && (
                        <>
                          <circle cx={z.cx} cy={z.cy} r="14" fill="#ef4444" opacity="0.3">
                            <animate attributeName="r" values="10;18;10" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={z.cx} cy={z.cy} r="9" fill="#ef4444" opacity="0.5" />
                        </>
                      )}
                      <circle
                        cx={z.cx}
                        cy={z.cy}
                        r="6"
                        fill={isActive ? '#dc2626' : '#fb923c'}
                        stroke="white"
                        strokeWidth="2"
                        className="transition-all"
                      />
                      <text
                        x={z.cx}
                        y={z.cy + 1.5}
                        textAnchor="middle"
                        fontSize="7"
                        fontWeight="900"
                        fill="white"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        !
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Carte info zone active */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl bg-white p-3 shadow-xl ring-1 ring-orange-100 sm:p-5" key={activeZone}>
                <div className="mb-2 flex items-center gap-1.5 sm:mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white sm:h-8 sm:w-8 sm:text-[12px]">
                    !
                  </div>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-red-700 sm:text-[10px]">
                    Zone douloureuse
                  </span>
                </div>
                <h3 className="mb-1 text-[16px] font-black text-neutral-900 sm:text-[22px]">{zone.label}</h3>
                <p className="text-[11px] text-neutral-600 sm:text-[13px]">{zone.description}</p>
                <div className="mt-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 text-center sm:mt-4 sm:py-2.5">
                  <p className="text-[9px] font-extrabold uppercase tracking-wide text-white sm:text-[11px]">
                    Soulagement en 90 secondes
                  </p>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1 text-center sm:mt-3 sm:gap-1.5">
                  {PAIN_ZONES.slice(0, 6).map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setActiveZone(z.id)}
                      className={`rounded-md px-1 py-1 text-[8px] font-bold transition sm:rounded-lg sm:py-1.5 sm:text-[10px] ${
                        z.id === activeZone
                          ? 'bg-red-500 text-white shadow'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-orange-100'
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1.5 text-center sm:py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white sm:text-[12px]">
            Action rapide <span className="text-orange-200">·</span> Sans effets indesirables
          </p>
        </div>
      </div>

      <form
        onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3 sm:w-[460px] sm:flex-none sm:justify-center sm:gap-4 sm:overflow-y-auto sm:px-8 sm:py-8"
      >
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {qtyOptions.map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setQty(o.v)}
              className={`relative flex flex-col items-center rounded-lg border-2 px-1 py-1 transition-all sm:rounded-xl sm:px-2 sm:py-2.5 ${
                qty === o.v
                  ? 'border-red-500 bg-red-50 shadow-sm scale-[1.02]'
                  : 'border-neutral-200 bg-white hover:border-red-300'
              }`}
            >
              {o.tag && (
                <span className="absolute -right-0.5 -top-1.5 rounded-full bg-orange-500 px-1 py-0 text-[7px] font-black uppercase tracking-wider text-white shadow sm:-right-1 sm:-top-2 sm:px-1.5 sm:py-0.5 sm:text-[8px]">
                  {o.tag}
                </span>
              )}
              <span className="text-base font-black text-neutral-900 sm:text-2xl">{o.v}</span>
              <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[9px]">
                {o.label}
              </span>
              <span className="text-[10px] font-black text-red-600 sm:text-[12px]">{o.sub}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville / Commune *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
        </div>

        <div className="flex h-9 overflow-hidden rounded-lg border border-neutral-200 transition focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 sm:h-11 sm:rounded-xl">
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

        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-neutral-900 to-red-900 px-3 py-2 text-white sm:rounded-xl sm:py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold sm:text-[12px]">Total</span>
            <span className="text-[9px] text-orange-300 sm:text-[10px]">livraison gratuite</span>
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
          className="cta-attract group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-[length:200%_100%] text-[13px] font-extrabold text-white shadow-lg shadow-red-500/30 transition-shadow hover:bg-[position:100%_0] hover:shadow-2xl hover:shadow-red-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-[52px] sm:rounded-2xl sm:text-[15px]"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Soulager ma douleur
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[9px] font-semibold text-neutral-400 sm:gap-4 sm:text-[11px]">
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-red-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Paiement a la livraison
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-red-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
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
