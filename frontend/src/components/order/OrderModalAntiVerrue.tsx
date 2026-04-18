/**
 * Modal de commande SPECIFIQUE au produit "Creme anti-verrue".
 *
 * Design : variante MEDICAL BLUE rassurante, avec un carrousel automatique de
 * temoignages clients (photo avatar + nom + verbatim) en hero du modal pour
 * creer la preuve sociale avant que le client remplisse ses infos.
 * Couleurs sky/blue (medical, professionnel, propre).
 *
 * COMPACT MOBILE : tout doit tenir sur iPhone SE SANS scroll dans le formulaire.
 * Layout split desktop : carrousel a gauche, formulaire a droite.
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

interface Testimonial {
  initials: string;
  name: string;
  age: number;
  location: string;
  text: string;
  rating: number;
  gradient: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    initials: 'AK',
    name: 'Aicha K.',
    age: 32,
    location: 'Abidjan',
    text: 'Mes verrues ont disparu en 10 jours. Je n\'y croyais plus, je suis bluffee !',
    rating: 5,
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    initials: 'YM',
    name: 'Yves M.',
    age: 45,
    location: 'Yamoussoukro',
    text: 'Plus de gene au quotidien. Ma main est nette, je recommande a 100%.',
    rating: 5,
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    initials: 'MS',
    name: 'Mariam S.',
    age: 28,
    location: 'Bouake',
    text: 'Application simple, resultat incroyable. Merci pour ce produit !',
    rating: 5,
    gradient: 'from-indigo-500 to-sky-500',
  },
];

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function OrderModalAntiVerrue({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [activeTestim, setActiveTestim] = useState(0);

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setActiveTestim(0);
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [open, initialQty]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setActiveTestim((p) => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(id);
  }, [open]);

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
  const t = TESTIMONIALS[activeTestim];

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

      {/* HERO : Carrousel temoignages medical-blue avec image produit en filigrane */}
      <div className="relative flex flex-shrink-0 flex-col overflow-hidden bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 sm:flex-1 sm:flex-shrink">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent" />

        <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-6 sm:px-10 sm:py-12">
          <div className="mb-3 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur sm:mb-4 sm:px-4 sm:py-1.5">
            <svg className="h-3 w-3 text-yellow-300 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[10px] font-bold text-white sm:text-[12px]">+2400 clients satisfaits</span>
          </div>

          <div className="relative w-full max-w-sm" key={activeTestim}>
            <div className="rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur animate-[fadeSlide_.5s_ease-out] sm:p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-base font-black text-white shadow-lg sm:h-14 sm:w-14 sm:text-lg`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-neutral-900 sm:text-[15px]">{t.name}, {t.age} ans</p>
                  <p className="text-[10px] text-neutral-500 sm:text-[11px]">{t.location}, Cote d'Ivoire</p>
                </div>
              </div>
              <div className="mb-2 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5 text-yellow-400 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-[12px] italic leading-relaxed text-neutral-700 sm:text-[13px]">
                &laquo; {t.text} &raquo;
              </p>
              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 sm:text-[10px]">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Achat verifie
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-1.5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTestim(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeTestim ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                aria-label={`Temoignage ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="relative bg-white/15 px-3 py-1.5 text-center backdrop-blur sm:py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white sm:text-[12px]">
            Note 4.9/5 <span className="text-sky-200">·</span> Recommande par 96% des clients
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
                  ? 'border-sky-500 bg-sky-50 shadow-sm scale-[1.02]'
                  : 'border-neutral-200 bg-white hover:border-sky-300'
              }`}
            >
              {o.tag && (
                <span className="absolute -right-0.5 -top-1.5 rounded-full bg-blue-600 px-1 py-0 text-[7px] font-black uppercase tracking-wider text-white shadow sm:-right-1 sm:-top-2 sm:px-1.5 sm:py-0.5 sm:text-[8px]">
                  {o.tag}
                </span>
              )}
              <span className="text-base font-black text-neutral-900 sm:text-2xl">{o.v}</span>
              <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-500 sm:text-[9px]">
                {o.label}
              </span>
              <span className="text-[10px] font-black text-sky-600 sm:text-[12px]">{o.sub}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville / Commune *"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] font-medium outline-none transition placeholder:text-neutral-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 sm:h-11 sm:rounded-xl sm:px-3 sm:text-[13px]"
          />
        </div>

        <div className="flex h-9 overflow-hidden rounded-lg border border-neutral-200 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 sm:h-11 sm:rounded-xl">
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

        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-900 to-indigo-900 px-3 py-2 text-white sm:rounded-xl sm:py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold sm:text-[12px]">Total</span>
            <span className="text-[9px] text-sky-300 sm:text-[10px]">livraison gratuite</span>
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
          className="cta-attract group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-[length:200%_100%] text-[13px] font-extrabold text-white shadow-lg shadow-blue-500/30 transition-shadow hover:bg-[position:100%_0] hover:shadow-2xl hover:shadow-blue-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-[52px] sm:rounded-2xl sm:text-[15px]"
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
            <svg className="h-2.5 w-2.5 text-sky-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Paiement a la livraison
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5 text-sky-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
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
