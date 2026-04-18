/**
 * Modal de commande SPECIFIQUE au produit "Chaussette de compression".
 *
 * Design : sélecteur de taille interactif S/M/L/XL avec correspondance des
 * pointures, illustration SVG d'une jambe avec chaussette qui change de couleur
 * selon la taille selectionnee. Couleurs teal/cyan (sante veineuse, fraicheur).
 *
 * COMPACT MOBILE : tout doit tenir sur iPhone SE SANS scroll dans le formulaire.
 * Layout split desktop : illustration + selecteur a gauche, formulaire a droite.
 *
 * Utilise le hook useOrderSubmit pour la logique metier.
 *
 * NOTE : la taille selectionnee n'est PAS envoyee au backend (le formulaire
 * standard n'a pas de champ taille). Elle sert juste de UX pedagogique pour
 * rassurer le client qu'il peut choisir sa pointure. La gestion de la taille
 * se fera lors de l'appel telephonique de confirmation.
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

interface Size {
  code: 'S' | 'M' | 'L' | 'XL';
  shoe: string;
  height: string;
  color: string;
  bgFill: string;
  desc: string;
}

const SIZES: Size[] = [
  { code: 'S',  shoe: '35-37', height: '< 1m65', color: '#22d3ee', bgFill: 'from-cyan-400 to-teal-400', desc: 'Petite morphologie' },
  { code: 'M',  shoe: '38-40', height: '1m65-1m75', color: '#14b8a6', bgFill: 'from-teal-500 to-emerald-500', desc: 'Taille standard' },
  { code: 'L',  shoe: '41-43', height: '1m75-1m85', color: '#0d9488', bgFill: 'from-teal-600 to-emerald-600', desc: 'Grande morphologie' },
  { code: 'XL', shoe: '44-46', height: '> 1m85', color: '#0f766e', bgFill: 'from-teal-700 to-emerald-700', desc: 'Tres grande morphologie' },
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
  const [size, setSize] = useState<Size['code']>('M');

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
  const sz = SIZES.find((s) => s.code === size) || SIZES[1];

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

      {/* HERO : Illustration jambe SVG + selecteur de taille */}
      <div className="relative flex flex-shrink-0 flex-col bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 sm:flex-1 sm:flex-shrink">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(20,184,166,.12) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(34,211,238,.12) 0%, transparent 50%)' }} />

        <div className="relative flex flex-1 items-center justify-center px-4 py-3 sm:px-8 sm:py-8">
          <div className="flex w-full max-w-md items-center gap-3 sm:gap-6">
            {/* SVG Jambe avec chaussette */}
            <div className="relative flex-shrink-0">
              <svg viewBox="0 0 120 280" className="h-[200px] w-auto sm:h-[340px]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sz.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={sz.color} stopOpacity="0.7" />
                  </linearGradient>
                  <pattern id="weave" width="6" height="6" patternUnits="userSpaceOnUse">
                    <path d="M 0 3 L 6 3 M 3 0 L 3 6" stroke="white" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>

                {/* Jambe (peau) */}
                <path d="M 50 0 Q 45 5 45 20 L 42 80 Q 41 110 44 140 L 46 180" fill="none" stroke="#fed7aa" strokeWidth="22" strokeLinecap="round" />
                {/* Mollet plus large */}
                <ellipse cx="48" cy="100" rx="13" ry="22" fill="#fed7aa" />

                {/* Chaussette compression */}
                <g>
                  {/* Tube haut */}
                  <path
                    d="M 36 50 Q 33 60 33 80 L 31 145 Q 30 175 32 200 L 34 230 Q 35 240 40 245 L 60 245 Q 65 240 66 230 L 68 200 Q 70 175 69 145 L 67 80 Q 67 60 64 50 Z"
                    fill="url(#sockGrad)"
                    stroke={sz.color}
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 36 50 Q 33 60 33 80 L 31 145 Q 30 175 32 200 L 34 230 Q 35 240 40 245 L 60 245 Q 65 240 66 230 L 68 200 Q 70 175 69 145 L 67 80 Q 67 60 64 50 Z"
                    fill="url(#weave)"
                  />
                  {/* Bande haute renforcee */}
                  <rect x="33" y="48" width="34" height="7" fill={sz.color} stroke="white" strokeWidth="1" rx="2" />
                  {/* Pied */}
                  <path d="M 34 245 Q 30 250 30 258 Q 35 268 50 268 L 75 268 Q 88 266 88 258 Q 86 248 78 246 L 66 245 Z" fill={sz.color} stroke="white" strokeWidth="1" />
                  {/* Lignes de compression */}
                  {[80, 110, 140, 170, 200, 225].map((y) => (
                    <ellipse key={y} cx="50" cy={y} rx="20" ry="2" fill="none" stroke="white" strokeWidth="0.8" opacity="0.55" />
                  ))}

                  {/* Badge taille au mollet */}
                  <circle cx="50" cy="120" r="14" fill="white" stroke={sz.color} strokeWidth="2" />
                  <text x="50" y="125" textAnchor="middle" fontSize="14" fontWeight="900" fill={sz.color}>
                    {sz.code}
                  </text>
                </g>
              </svg>

              {/* Indicateur compression flottant */}
              <div className="absolute -right-2 top-8 flex flex-col items-center rounded-lg bg-white px-2 py-1.5 shadow-lg sm:-right-4 sm:px-3 sm:py-2" key={size}>
                <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[9px]">Compression</span>
                <span className="text-[14px] font-black sm:text-[18px]" style={{ color: sz.color }}>23 mmHg</span>
              </div>
            </div>

            {/* Selecteur taille */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl bg-white p-3 shadow-xl ring-1 ring-teal-100 sm:p-5">
                <div className="mb-2 flex items-center gap-1.5 sm:mb-3">
                  <svg className="h-4 w-4 text-teal-600 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-neutral-700 sm:text-[14px]">Choisissez votre taille</h3>
                </div>

                <div className="mb-2.5 grid grid-cols-4 gap-1 sm:mb-3 sm:gap-1.5">
                  {SIZES.map((s) => {
                    const isActive = s.code === size;
                    return (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => setSize(s.code)}
                        className={`flex flex-col items-center rounded-lg border-2 px-1 py-1.5 transition-all sm:rounded-xl sm:py-2.5 ${
                          isActive
                            ? `border-teal-500 bg-gradient-to-br ${s.bgFill} text-white shadow-lg scale-[1.05]`
                            : 'border-neutral-200 bg-white hover:border-teal-300'
                        }`}
                      >
                        <span className={`text-[14px] font-black sm:text-[18px] ${isActive ? 'text-white' : 'text-neutral-900'}`}>
                          {s.code}
                        </span>
                        <span className={`text-[8px] font-bold sm:text-[9px] ${isActive ? 'text-white/90' : 'text-neutral-400'}`}>
                          {s.shoe}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-lg bg-teal-50 p-2 sm:p-3" key={`info-${size}`}>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 sm:text-[11px]">Taille {sz.code}</span>
                    <span className="text-[9px] text-neutral-500 sm:text-[10px]">{sz.desc}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[12px]">
                    <div>
                      <span className="block font-semibold text-neutral-500">Pointure</span>
                      <span className="block font-black text-neutral-900">{sz.shoe}</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-neutral-500">Taille</span>
                      <span className="block font-black text-neutral-900">{sz.height}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1.5 text-center sm:py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white sm:text-[12px]">
            Confort journee complete <span className="text-cyan-100">·</span> Anti-fatigue
          </p>
        </div>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          // Concatene la taille a la ville pour que l'operateur la voie au call
          await submit({ name, city: `${city} | TAILLE ${size}`, phone, qty });
        }}
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
                  ? 'border-teal-500 bg-teal-50 shadow-sm scale-[1.02]'
                  : 'border-neutral-200 bg-white hover:border-teal-300'
              }`}
            >
              {o.tag && (
                <span className="absolute -right-0.5 -top-1.5 rounded-full bg-cyan-500 px-1 py-0 text-[7px] font-black uppercase tracking-wider text-white shadow sm:-right-1 sm:-top-2 sm:px-1.5 sm:py-0.5 sm:text-[8px]">
                  {o.tag}
                </span>
              )}
              <span className="text-base font-black text-neutral-900 sm:text-2xl">{o.v}</span>
              <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[9px]">
                {o.label}
              </span>
              <span className="text-[10px] font-black text-teal-600 sm:text-[12px]">{o.sub}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville / Commune *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
        </div>

        <div className="flex h-9 overflow-hidden rounded-lg border border-neutral-200 transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 sm:h-11 sm:rounded-xl">
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

        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-teal-900 to-cyan-900 px-3 py-2 text-white sm:rounded-xl sm:py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold sm:text-[12px]">Total</span>
            <span className="text-[9px] text-cyan-300 sm:text-[10px]">livraison gratuite</span>
            <span className="rounded bg-teal-500 px-1.5 text-[9px] font-black text-white sm:text-[10px]">{size}</span>
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
          className="cta-attract group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 bg-[length:200%_100%] text-[13px] font-extrabold text-white shadow-lg shadow-teal-500/30 transition-shadow hover:bg-[position:100%_0] hover:shadow-2xl hover:shadow-teal-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-[52px] sm:rounded-2xl sm:text-[15px]"
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
              Confirmer ma taille {size}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[9px] font-semibold text-neutral-400 sm:gap-4 sm:text-[11px]">
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-teal-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Paiement a la livraison
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-teal-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Echange taille gratuit
          </span>
        </div>
      </form>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
