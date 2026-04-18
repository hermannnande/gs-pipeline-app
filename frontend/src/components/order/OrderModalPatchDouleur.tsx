/**
 * Modal de commande SPECIFIQUE au produit "Patch Anti-Douleur Chauffant TK".
 *
 * Design : patch carre central qui CHAUFFE visuellement (vagues thermiques en
 * expansion, gradient rouge/orange qui pulse). Un thermometre vertical a gauche
 * monte de 20°C a 45°C selon la zone selectionnee. 4 zones d'application
 * representees par des cartes (dos / cou / genou / epaule) avec icones SVG.
 *
 * Couleurs : rouge profond + orange chaleur + violet therapeutique (apaisant).
 *
 * COMPACT MOBILE : tout doit tenir sur iPhone SE SANS scroll dans le formulaire.
 * Layout split desktop : patch + thermometre + zones a gauche, formulaire a droite.
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

interface BodyZone {
  id: 'back' | 'neck' | 'knee' | 'shoulder';
  label: string;
  desc: string;
  duration: string;
  temp: number;
  iconPath: string;
}

const BODY_ZONES: BodyZone[] = [
  {
    id: 'back',
    label: 'Bas du dos',
    desc: 'Apaise lombalgie, sciatique et tensions musculaires en profondeur',
    duration: '8h de chaleur continue',
    temp: 45,
    iconPath: 'M12 2C9 2 7 4 7 6v4c0 2 1 3 2 4l-1 8h8l-1-8c1-1 2-2 2-4V6c0-2-2-4-5-4z',
  },
  {
    id: 'neck',
    label: 'Cou & nuque',
    desc: 'Soulage torticolis, raideurs cervicales et tensions du cou',
    duration: '8h de chaleur continue',
    temp: 42,
    iconPath: 'M12 2a4 4 0 100 8 4 4 0 000-8zM8 14h8a2 2 0 012 2v6H6v-6a2 2 0 012-2z',
  },
  {
    id: 'knee',
    label: 'Genou',
    desc: 'Calme arthrose, douleurs articulaires et inflammations du genou',
    duration: '8h de chaleur continue',
    temp: 43,
    iconPath: 'M9 2v6l-2 4v8h2v-4h6v4h2v-8l-2-4V2H9zm2 2h2v4h-2V4z',
  },
  {
    id: 'shoulder',
    label: 'Epaule',
    desc: 'Detend tendinites, raideurs et capsulites de l\'epaule',
    duration: '8h de chaleur continue',
    temp: 44,
    iconPath: 'M4 8a4 4 0 014-4h8a4 4 0 014 4v4a4 4 0 01-4 4h-2v6h-4v-6H8a4 4 0 01-4-4V8z',
  },
];

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function OrderModalPatchDouleur({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState<BodyZone['id']>('back');

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setZone('back');
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
  const activeZone = BODY_ZONES.find((z) => z.id === zone) || BODY_ZONES[0];

  // Hauteur de remplissage du thermometre (20°C = 0%, 50°C = 100%)
  const tempPct = Math.min(100, ((activeZone.temp - 20) / 30) * 100);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-[pdFadeIn_.25s] sm:flex-row">
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-lg backdrop-blur transition hover:scale-110 hover:bg-white sm:right-4 sm:top-4 sm:h-11 sm:w-11"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* HERO : patch chauffant + thermometre + zones */}
      <div className="relative flex flex-shrink-0 flex-col overflow-hidden bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50 sm:flex-1 sm:flex-shrink">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(220,38,38,.18) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(249,115,22,.15) 0%, transparent 50%)' }} />

        {/* Vagues thermiques de fond (ambiance chaleur) */}
        <div className="absolute inset-0 pointer-events-none">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange-300/30 sm:h-44 sm:w-44"
              style={{ animation: `pdRipple 3s ease-out ${i * 0.8}s infinite` }}
            />
          ))}
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-3 sm:px-8 sm:py-6">
          {/* Header titre + badge */}
          <div className="mb-2 flex items-center gap-2 sm:mb-3">
            <span className="rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md sm:px-3 sm:py-1 sm:text-[11px]">
              Therapie chaleur
            </span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-700 ring-1 ring-violet-200 sm:text-[10px]">
              Sans medicament
            </span>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 sm:gap-5">
            {/* Thermometre vertical + patch central */}
            <div className="relative flex flex-shrink-0 items-end gap-3 sm:gap-4">
              {/* Thermometre */}
              <div className="relative flex h-[180px] w-7 flex-col items-center sm:h-[270px] sm:w-9">
                {/* Echelle de temperature */}
                <div className="absolute -left-3 top-0 flex h-[150px] flex-col justify-between text-[7px] font-black text-neutral-500 sm:-left-5 sm:h-[225px] sm:text-[9px]">
                  <span>50°</span>
                  <span>40°</span>
                  <span>30°</span>
                  <span>20°</span>
                </div>
                {/* Tube */}
                <div className="relative h-[150px] w-3 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-neutral-200 sm:h-[225px] sm:w-4">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 transition-all duration-700"
                    style={{ height: `${tempPct}%` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />
                  </div>
                </div>
                {/* Bulbe (rouge en bas) */}
                <div className="-mt-1 h-6 w-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg ring-2 ring-white sm:h-7 sm:w-7" />
              </div>

              {/* Patch central (carre arrondi avec halo de chaleur) */}
              <div className="relative">
                {/* Halo pulsant */}
                <div className="absolute inset-0 -m-3 rounded-2xl bg-gradient-to-br from-red-500/40 via-orange-400/30 to-amber-300/20 blur-xl" style={{ animation: 'pdPulse 2.5s ease-in-out infinite' }} />

                <div
                  key={zone}
                  className="relative flex h-[140px] w-[110px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 p-3 shadow-2xl ring-4 ring-orange-200 sm:h-[210px] sm:w-[160px] sm:rounded-3xl sm:p-5"
                  style={{ animation: 'pdGlow 2.5s ease-in-out infinite' }}
                >
                  {/* Texture patch (lignes croisees discretes) */}
                  <div className="absolute inset-2 rounded-xl border border-white/30 sm:inset-3" />
                  <div className="absolute inset-3 rounded-lg border border-white/15 sm:inset-4" />

                  {/* Icone TK au centre */}
                  <div className="relative mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg sm:mb-2.5 sm:h-14 sm:w-14">
                    <span className="text-[14px] font-black text-red-600 sm:text-[20px]">TK</span>
                  </div>

                  <p className="relative text-center text-[9px] font-black uppercase tracking-wide text-white sm:text-[11px]">
                    Patch chauffant
                  </p>
                  <div className="relative mt-1 rounded-full bg-white/95 px-2 py-0.5 sm:mt-1.5 sm:px-2.5 sm:py-1">
                    <p className="text-[10px] font-black text-red-600 sm:text-[13px]">{activeZone.temp}°C</p>
                  </div>

                  {/* Petites flammes animees */}
                  <div className="absolute -top-2 left-2 sm:-top-3 sm:left-4">
                    <svg className="h-4 w-4 text-orange-300 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" style={{ animation: 'pdFlicker 1.2s ease-in-out infinite' }}>
                      <path d="M12 2c1.5 3 3 5 3 8a3 3 0 11-6 0c0-3 1.5-5 3-8z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1.5 right-3 sm:-top-2.5 sm:right-5">
                    <svg className="h-3 w-3 text-yellow-300 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24" style={{ animation: 'pdFlicker 1.5s ease-in-out 0.3s infinite' }}>
                      <path d="M12 2c1.5 3 3 5 3 8a3 3 0 11-6 0c0-3 1.5-5 3-8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte zone active + selecteur */}
            <div className="min-w-0 flex-1">
              <div className="rounded-xl bg-white p-3 shadow-xl ring-1 ring-orange-100 sm:p-4" key={zone}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-orange-600 sm:text-[10px]">Zone</span>
                  <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[8px] font-black text-red-600 ring-1 ring-red-100 sm:text-[10px]">{activeZone.duration}</span>
                </div>
                <h3 className="text-[16px] font-black text-neutral-900 sm:text-[20px]">{activeZone.label}</h3>
                <p className="mt-1 text-[10px] leading-tight text-neutral-600 sm:text-[12px]">{activeZone.desc}</p>

                <div className="mt-2 grid grid-cols-2 gap-1 sm:mt-3 sm:gap-1.5">
                  {BODY_ZONES.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setZone(z.id)}
                      className={`flex items-center justify-center gap-1 rounded-md px-1 py-1 text-[9px] font-bold transition sm:rounded-lg sm:py-1.5 sm:text-[10px] ${
                        z.id === zone
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-orange-50'
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
        <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 px-3 py-1.5 text-center sm:py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white sm:text-[12px]">
            Soulagement en 5 minutes <span className="text-orange-100">·</span> 8h d'action chauffante
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

        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-red-700 via-red-600 to-orange-600 px-3 py-2 text-white sm:rounded-xl sm:py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold sm:text-[12px]">Total</span>
            <span className="text-[9px] text-orange-200 sm:text-[10px]">livraison gratuite</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            {qty > 1 && (
              <span className="text-[9px] text-orange-200/70 line-through sm:text-[11px]">{fmt(oldTotal)}</span>
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
          className="cta-attract group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-[length:200%_100%] text-[13px] font-extrabold text-white shadow-lg shadow-red-500/30 transition-shadow hover:bg-[position:100%_0] hover:shadow-2xl hover:shadow-red-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-[52px] sm:rounded-2xl sm:text-[15px]"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Envoi...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c1.5 3 3 5 3 8a3 3 0 11-6 0c0-3 1.5-5 3-8zm0 10a5 5 0 015 5c0 3-2 5-5 5s-5-2-5-5a5 5 0 015-5z" />
              </svg>
              Apaiser ma douleur
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
        @keyframes pdFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pdRipple {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.6 }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0 }
        }
        @keyframes pdPulse {
          0%, 100% { opacity: 0.7; transform: scale(1) }
          50%      { opacity: 1; transform: scale(1.05) }
        }
        @keyframes pdGlow {
          0%, 100% { box-shadow: 0 25px 50px -12px rgba(220,38,38,.4), 0 0 0 4px rgba(254,215,170,1) }
          50%      { box-shadow: 0 25px 50px -12px rgba(220,38,38,.6), 0 0 30px 8px rgba(249,115,22,.3) }
        }
        @keyframes pdFlicker {
          0%, 100% { opacity: 0.7; transform: translateY(0) scale(1) }
          50%      { opacity: 1; transform: translateY(-2px) scale(1.1) }
        }
      `}</style>
    </div>
  );
}
