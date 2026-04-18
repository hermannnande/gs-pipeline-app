/**
 * Modal de commande SPECIFIQUE au produit "Creme Minceur Brule-Graisse".
 *
 * Design : silhouette feminine SVG vue de profil avec 4 zones a affiner (ventre,
 * hanches, cuisses, bras). Au clic sur une zone, la silhouette "s'affine" via un
 * morph SVG, et un metre ruban affiche les cm perdus correspondants. Le compteur
 * de cm perdus s'incremente avec la quantite (qty=1 : -2cm, qty=2 : -5cm, qty=3 : -8cm).
 *
 * Couleurs : rose pastel + menthe (feminin, naturel, fitness). Ambiance spa.
 *
 * COMPACT MOBILE : tout doit tenir sur iPhone SE SANS scroll dans le formulaire.
 * Layout split desktop : silhouette + metre a gauche, formulaire a droite.
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

interface SlimZone {
  id: 'belly' | 'hips' | 'thighs' | 'arms';
  label: string;
  desc: string;
  emoji: string;
}

const SLIM_ZONES: SlimZone[] = [
  { id: 'belly',  label: 'Ventre',  desc: 'Affine le tour de taille en ciblant la graisse abdominale tenace', emoji: '◐' },
  { id: 'hips',   label: 'Hanches', desc: 'Resculpte la silhouette en eliminant les capitons des hanches',    emoji: '◓' },
  { id: 'thighs', label: 'Cuisses', desc: 'Lisse la peau et reduit la cellulite des cuisses',                 emoji: '◑' },
  { id: 'arms',   label: 'Bras',    desc: 'Tonifie et raffermit les bras pour un effet ferme et galbe',       emoji: '◒' },
];

const CM_PER_QTY: Record<number, number> = { 1: 2, 2: 5, 3: 8 };

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function OrderModalMinceur({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState<SlimZone['id']>('belly');

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setZone('belly');
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
  const cmLost = CM_PER_QTY[qty] || 2;
  const activeZone = SLIM_ZONES.find((z) => z.id === zone) || SLIM_ZONES[0];

  // Pourcentage de remplissage du metre ruban (0% = avant, 100% = -10cm max)
  const tapePct = Math.min(100, (cmLost / 10) * 100);

  // Morph silhouette : valeurs de width pour chaque zone selon "avant" et "apres"
  // Plus cmLost est grand, plus la zone s'affine
  const slim = (base: number, pct: number) => base - (base * (cmLost / 30) * pct);
  const bellyW = slim(34, zone === 'belly' ? 1 : 0.4);
  const hipsW  = slim(42, zone === 'hips' ? 1 : 0.4);
  const thighW = slim(22, zone === 'thighs' ? 1 : 0.4);
  const armW   = slim(14, zone === 'arms' ? 1 : 0.4);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-[mcFadeIn_.25s] sm:flex-row">
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-lg backdrop-blur transition hover:scale-110 hover:bg-white sm:right-4 sm:top-4 sm:h-11 sm:w-11"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* HERO : silhouette feminine + metre ruban + zone description */}
      <div className="relative flex flex-shrink-0 flex-col bg-gradient-to-br from-rose-50 via-pink-50 to-emerald-50 sm:flex-1 sm:flex-shrink">
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 25% 15%, rgba(236,72,153,.10) 0%, transparent 55%), radial-gradient(circle at 75% 85%, rgba(16,185,129,.10) 0%, transparent 55%)' }} />

        <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-3 sm:px-8 sm:py-6">
          {/* Header titre + badge */}
          <div className="mb-2 flex items-center gap-2 sm:mb-3">
            <span className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md sm:px-3 sm:py-1 sm:text-[11px]">
              Bruleur de graisse
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200 sm:text-[10px]">
              100% naturel
            </span>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 sm:gap-5">
            {/* Silhouette femme SVG (avant ↔ apres animation) */}
            <div className="relative flex-shrink-0">
              <svg viewBox="0 0 110 280" className="h-[185px] w-auto sm:h-[330px]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="mcSkin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbcfe8" />
                    <stop offset="100%" stopColor="#f9a8d4" />
                  </linearGradient>
                  <linearGradient id="mcShadow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* halo rose derriere la silhouette */}
                <ellipse cx="55" cy="160" rx="55" ry="115" fill="url(#mcShadow)" />

                {/* Tete + cheveux */}
                <path d="M 38 25 Q 38 8 55 8 Q 72 8 72 25 L 72 38 Q 72 50 55 50 Q 38 50 38 38 Z" fill="url(#mcSkin)" stroke="#ec4899" strokeWidth="1.2" />
                <path d="M 35 22 Q 35 5 55 5 Q 78 5 78 25 L 78 42 Q 76 38 72 36 L 72 30 Q 65 32 55 32 Q 45 32 38 30 L 38 36 Q 34 38 32 42 Z" fill="#1f2937" />

                {/* Cou */}
                <rect x="50" y="48" width="10" height="8" fill="url(#mcSkin)" stroke="#ec4899" strokeWidth="1" />

                {/* Epaules + bras (animation slim) */}
                <path
                  d={`M 55 56 Q 30 60 ${28 - armW * 0.15} 90 Q ${26 - armW * 0.15} 130 32 165`}
                  fill="none" stroke="url(#mcSkin)" strokeWidth={armW.toFixed(1)} strokeLinecap="round"
                  className="transition-all duration-700"
                />
                <path
                  d={`M 55 56 Q 80 60 ${82 + armW * 0.15} 90 Q ${84 + armW * 0.15} 130 78 165`}
                  fill="none" stroke="url(#mcSkin)" strokeWidth={armW.toFixed(1)} strokeLinecap="round"
                  className="transition-all duration-700"
                />

                {/* Mains */}
                <circle cx="32" cy="170" r="5" fill="url(#mcSkin)" stroke="#ec4899" strokeWidth="0.8" />
                <circle cx="78" cy="170" r="5" fill="url(#mcSkin)" stroke="#ec4899" strokeWidth="0.8" />

                {/* Buste + Ventre (animation slim) */}
                <path
                  d={`M ${55 - 22} 60 Q ${55 - 22} 56 ${55 - 18} 56 L ${55 + 18} 56 Q ${55 + 22} 56 ${55 + 22} 60 L ${55 + bellyW / 2} 130 Q ${55 + bellyW / 2 - 1} 138 55 138 Q ${55 - bellyW / 2 + 1} 138 ${55 - bellyW / 2} 130 Z`}
                  fill="url(#mcSkin)" stroke="#ec4899" strokeWidth="1.2"
                  className="transition-all duration-700"
                />

                {/* Hanches (animation slim) */}
                <path
                  d={`M ${55 - bellyW / 2} 130 L ${55 - hipsW / 2} 165 Q ${55 - hipsW / 2 + 2} 175 ${55 - hipsW / 2 + 8} 175 L ${55 + hipsW / 2 - 8} 175 Q ${55 + hipsW / 2 - 2} 175 ${55 + hipsW / 2} 165 L ${55 + bellyW / 2} 130 Z`}
                  fill="url(#mcSkin)" stroke="#ec4899" strokeWidth="1.2"
                  className="transition-all duration-700"
                />

                {/* Cuisses (animation slim) */}
                <path
                  d={`M ${55 - hipsW / 2 + 6} 175 Q ${55 - thighW / 2 - 4} 200 ${55 - thighW / 2} 235`}
                  fill="none" stroke="url(#mcSkin)" strokeWidth={thighW.toFixed(1)} strokeLinecap="round"
                  className="transition-all duration-700"
                />
                <path
                  d={`M ${55 + hipsW / 2 - 6} 175 Q ${55 + thighW / 2 + 4} 200 ${55 + thighW / 2} 235`}
                  fill="none" stroke="url(#mcSkin)" strokeWidth={thighW.toFixed(1)} strokeLinecap="round"
                  className="transition-all duration-700"
                />

                {/* Mollets + pieds */}
                <path d="M 42 235 Q 41 255 40 268" fill="none" stroke="url(#mcSkin)" strokeWidth="11" strokeLinecap="round" />
                <path d="M 68 235 Q 69 255 70 268" fill="none" stroke="url(#mcSkin)" strokeWidth="11" strokeLinecap="round" />
                <ellipse cx="38" cy="273" rx="7" ry="3.5" fill="#831843" />
                <ellipse cx="72" cy="273" rx="7" ry="3.5" fill="#831843" />

                {/* Indicateur zone active : pulse rose autour de la zone */}
                {zone === 'belly' && (
                  <>
                    <circle cx="55" cy="105" r="14" fill="#ec4899" opacity="0.25">
                      <animate attributeName="r" values="12;22;12" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <text x="78" y="108" fontSize="9" fontWeight="900" fill="#be185d">cible</text>
                  </>
                )}
                {zone === 'hips' && (
                  <>
                    <circle cx="55" cy="155" r="16" fill="#ec4899" opacity="0.25">
                      <animate attributeName="r" values="14;24;14" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <text x="80" y="158" fontSize="9" fontWeight="900" fill="#be185d">cible</text>
                  </>
                )}
                {zone === 'thighs' && (
                  <>
                    <circle cx="46" cy="205" r="11" fill="#ec4899" opacity="0.25">
                      <animate attributeName="r" values="10;18;10" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="64" cy="205" r="11" fill="#ec4899" opacity="0.25">
                      <animate attributeName="r" values="10;18;10" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                {zone === 'arms' && (
                  <>
                    <circle cx="29" cy="120" r="10" fill="#ec4899" opacity="0.25">
                      <animate attributeName="r" values="9;16;9" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="81" cy="120" r="10" fill="#ec4899" opacity="0.25">
                      <animate attributeName="r" values="9;16;9" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </svg>
            </div>

            {/* Carte zone + metre ruban */}
            <div className="min-w-0 flex-1">
              <div className="rounded-xl bg-white p-3 shadow-xl ring-1 ring-pink-100 sm:p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-pink-600 sm:text-[10px]">Zone ciblee</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 sm:text-[10px]">-{cmLost} cm</span>
                </div>
                <h3 className="text-[16px] font-black text-neutral-900 sm:text-[20px]">{activeZone.label}</h3>
                <p className="mt-1 text-[10px] leading-tight text-neutral-600 sm:text-[12px]">{activeZone.desc}</p>

                {/* Metre ruban graphique */}
                <div className="mt-2.5 sm:mt-3">
                  <div className="mb-0.5 flex items-center justify-between text-[8px] font-bold text-neutral-500 sm:text-[10px]">
                    <span>0 cm</span>
                    <span>10 cm</span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-neutral-100 sm:h-4">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-pink-400 to-rose-500 transition-all duration-700"
                      style={{ width: `${tapePct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-evenly">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-1.5 w-px bg-white/60 sm:h-2" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1 sm:mt-3 sm:gap-1.5">
                  {SLIM_ZONES.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setZone(z.id)}
                      className={`rounded-md px-1 py-1 text-[9px] font-bold transition sm:rounded-lg sm:py-1.5 sm:text-[10px] ${
                        z.id === zone
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-pink-50'
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

        {/* Footer hero : promesse */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-500 px-3 py-1.5 text-center sm:py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white sm:text-[12px]">
            Resultats visibles en 14 jours <span className="text-pink-100">·</span> 100% Naturel
          </p>
        </div>
      </div>

      {/* FORMULAIRE */}
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
                  ? 'border-pink-500 bg-pink-50 shadow-sm scale-[1.02]'
                  : 'border-neutral-200 bg-white hover:border-pink-300'
              }`}
            >
              {o.tag && (
                <span className="absolute -right-0.5 -top-1.5 rounded-full bg-emerald-500 px-1 py-0 text-[7px] font-black uppercase tracking-wider text-white shadow sm:-right-1 sm:-top-2 sm:px-1.5 sm:py-0.5 sm:text-[8px]">
                  {o.tag}
                </span>
              )}
              <span className="text-base font-black text-neutral-900 sm:text-2xl">{o.v}</span>
              <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[9px]">
                {o.label}
              </span>
              <span className="text-[10px] font-black text-pink-600 sm:text-[12px]">{o.sub}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville / Commune *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
        </div>

        <div className="flex h-9 overflow-hidden rounded-lg border border-neutral-200 transition focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/20 sm:h-11 sm:rounded-xl">
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

        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-pink-600 via-rose-600 to-emerald-600 px-3 py-2 text-white sm:rounded-xl sm:py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold sm:text-[12px]">Total</span>
            <span className="text-[9px] text-pink-100 sm:text-[10px]">livraison gratuite</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            {qty > 1 && (
              <span className="text-[9px] text-pink-200/70 line-through sm:text-[11px]">{fmt(oldTotal)}</span>
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
          className="cta-attract group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-500 bg-[length:200%_100%] text-[13px] font-extrabold text-white shadow-lg shadow-pink-500/30 transition-shadow hover:bg-[position:100%_0] hover:shadow-2xl hover:shadow-pink-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-[52px] sm:rounded-2xl sm:text-[15px]"
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
              Affiner ma silhouette
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[9px] font-semibold text-neutral-400 sm:gap-4 sm:text-[11px]">
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-pink-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Paiement a la livraison
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-pink-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Garantie satisfaction
          </span>
        </div>
      </form>

      <style>{`
        @keyframes mcFadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
