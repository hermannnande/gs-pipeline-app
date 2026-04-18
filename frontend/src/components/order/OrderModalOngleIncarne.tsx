/**
 * Modal de commande SPECIFIQUE au produit "Creme ongle incarne".
 *
 * Design : timeline interactive 7 jours montrant la progression du traitement
 * (J0 inflammation, J3 soulagement, J5 reparation, J7 guerison). L'utilisateur
 * peut cliquer sur chaque etape pour voir les details et l'illustration. Auto-
 * progression toutes les 3s. Couleurs violet/purple (medical premium, soin).
 *
 * COMPACT MOBILE : tout doit tenir sur iPhone SE SANS scroll dans le formulaire.
 * Layout split desktop : timeline a gauche, formulaire a droite.
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

interface Step {
  day: string;
  title: string;
  description: string;
  color: string;
  bg: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    day: 'J0',
    title: 'Inflammation',
    description: 'L\'ongle penetre la peau, douleur intense, gonflement et rougeur',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    icon: '🔴',
  },
  {
    day: 'J3',
    title: 'Soulagement',
    description: 'Reduction de l\'inflammation grace aux actifs naturels apaisants',
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50',
    icon: '🟡',
  },
  {
    day: 'J5',
    title: 'Reparation',
    description: 'Cicatrisation accelere, l\'ongle reprend sa croissance normale',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    icon: '🟢',
  },
  {
    day: 'J7',
    title: 'Guerison',
    description: 'Disparition complete de la douleur et de l\'incarnation',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    icon: '✨',
  },
];

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function OrderModalOngleIncarne({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setActiveStep(0);
      setAutoplay(true);
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [open, initialQty]);

  useEffect(() => {
    if (!open || !autoplay) return;
    const id = setInterval(() => {
      setActiveStep((p) => (p + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [open, autoplay]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  const heroImg = cfg.images.hero;
  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const oldTotal = total + (qty * 5000);
  const step = STEPS[activeStep];
  const progressPct = ((activeStep + 1) / STEPS.length) * 100;

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

      {/* HERO : Timeline interactive 7 jours */}
      <div className={`relative flex flex-shrink-0 flex-col overflow-hidden bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 transition-colors duration-700 sm:flex-1 sm:flex-shrink ${step.bg}`}>
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />

        <div className="relative flex flex-1 flex-col justify-between px-4 pb-2 pt-6 sm:px-10 sm:pb-4 sm:pt-12">
          <div className="text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 backdrop-blur sm:mb-3 sm:px-4 sm:py-1.5">
              <svg className="h-3 w-3 text-violet-600 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-bold text-violet-700 sm:text-[12px]">Resultat en 7 jours</span>
            </div>
            <h3 className="text-[18px] font-black text-neutral-900 sm:text-[28px]">Votre guerison <span className={`bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>jour apres jour</span></h3>
          </div>

          {/* Carte details etape active */}
          <div className="my-3 sm:my-6" key={activeStep}>
            <div className="mx-auto max-w-md rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-violet-100 animate-[fadeSlide_.4s_ease-out] sm:p-6">
              <div className="mb-2 flex items-center justify-between sm:mb-3">
                <span className={`rounded-lg bg-gradient-to-r ${step.color} px-2.5 py-1 text-[11px] font-black text-white shadow-md sm:px-3 sm:py-1.5 sm:text-[13px]`}>
                  {step.day}
                </span>
                <span className="text-[28px] sm:text-[40px]">{step.icon}</span>
              </div>
              <h4 className="mb-1 text-[16px] font-black text-neutral-900 sm:text-[22px]">{step.title}</h4>
              <p className="text-[11px] leading-relaxed text-neutral-600 sm:text-[13px]">{step.description}</p>
            </div>
          </div>

          {/* Timeline horizontale avec progress bar */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative h-1 rounded-full bg-neutral-200">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${step.color} transition-all duration-500`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {STEPS.map((s, i) => {
                const isActive = i === activeStep;
                const isPast = i < activeStep;
                return (
                  <button
                    key={s.day}
                    type="button"
                    onClick={() => { setAutoplay(false); setActiveStep(i); }}
                    className={`flex flex-col items-center rounded-lg px-1 py-1.5 transition-all sm:rounded-xl sm:py-2.5 ${
                      isActive
                        ? 'bg-white shadow-lg scale-105 ring-2 ring-violet-500'
                        : isPast
                          ? 'bg-white/70 opacity-80'
                          : 'bg-white/40 opacity-60 hover:bg-white/70'
                    }`}
                  >
                    <span className={`mb-0.5 text-[10px] font-black sm:text-[12px] ${isActive ? 'text-violet-700' : 'text-neutral-700'}`}>
                      {s.day}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? 'text-neutral-700' : 'text-neutral-400'} sm:text-[10px]`}>
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-r ${step.color} px-3 py-1.5 text-center transition-colors duration-700 sm:py-2.5`}>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white sm:text-[12px]">
            Sans douleur <span className="text-white/70">·</span> 100% naturel
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
                  ? 'border-violet-500 bg-violet-50 shadow-sm scale-[1.02]'
                  : 'border-neutral-200 bg-white hover:border-violet-300'
              }`}
            >
              {o.tag && (
                <span className="absolute -right-0.5 -top-1.5 rounded-full bg-fuchsia-500 px-1 py-0 text-[7px] font-black uppercase tracking-wider text-white shadow sm:-right-1 sm:-top-2 sm:px-1.5 sm:py-0.5 sm:text-[8px]">
                  {o.tag}
                </span>
              )}
              <span className="text-base font-black text-neutral-900 sm:text-2xl">{o.v}</span>
              <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[9px]">
                {o.label}
              </span>
              <span className="text-[10px] font-black text-violet-600 sm:text-[12px]">{o.sub}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville / Commune *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
        </div>

        <div className="flex h-9 overflow-hidden rounded-lg border border-neutral-200 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 sm:h-11 sm:rounded-xl">
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

        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-violet-900 to-fuchsia-900 px-3 py-2 text-white sm:rounded-xl sm:py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold sm:text-[12px]">Total</span>
            <span className="text-[9px] text-fuchsia-300 sm:text-[10px]">livraison gratuite</span>
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
          className="cta-attract group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-500 bg-[length:200%_100%] text-[13px] font-extrabold text-white shadow-lg shadow-violet-500/30 transition-shadow hover:bg-[position:100%_0] hover:shadow-2xl hover:shadow-violet-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-[52px] sm:rounded-2xl sm:text-[15px]"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Commencer ma guerison
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[9px] font-semibold text-neutral-400 sm:gap-4 sm:text-[11px]">
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-violet-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Paiement a la livraison
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-violet-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Garantie satisfaction
          </span>
        </div>
      </form>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}
