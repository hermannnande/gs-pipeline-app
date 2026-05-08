/**
 * Barre d'avertissement reutilisable affichee en haut des formulaires de
 * commande. Format ticker / marquee horizontal : une seule ligne, le texte
 * defile en boucle. Palette ambre (universelle) lisible sur tous les modals.
 */
import { Children, type ReactNode } from 'react';

interface OrderFormWarningProps {
  /** Titre court en MAJUSCULES, ex: "AVANT DE COMMANDER". */
  title?: string;
  /** Message principal (peut contenir des `<strong>` via children). */
  children: ReactNode;
}

function Item({ title, children }: OrderFormWarningProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 px-5 text-amber-900">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">{title}</span>
      <span className="text-[12px] font-semibold">{children}</span>
      <span className="text-amber-500" aria-hidden="true">★</span>
    </span>
  );
}

export default function OrderFormWarning({ title = 'Avant de commander', children }: OrderFormWarningProps) {
  // On rend 4 copies du contenu cote a cote pour creer un defilement continu
  // (l'animation translate de 0 a -50% du conteneur double la sequence).
  const COPIES = 4;
  const items = Children.toArray(
    Array.from({ length: COPIES }, (_, i) => <Item key={i} title={title}>{children}</Item>)
  );

  return (
    <div className="relative w-full shrink-0 overflow-hidden border-y border-amber-300 bg-amber-50/85 py-2">
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-amber-50/90 to-transparent" />
      <span className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-amber-50/90 to-transparent" />

      <div className="ofw-track flex w-max items-center whitespace-nowrap will-change-transform">
        {items}
        {items}
      </div>

      <style>{`
        @keyframes ofwScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ofw-track { animation: ofwScroll 60s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ofw-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
