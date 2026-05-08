/**
 * Banniere d'avertissement reutilisable affichee en haut des formulaires de
 * commande. Palette ambre (universelle) pour rester lisible quelle que soit
 * la palette du modal hote. Animation discrete (stripe glissante).
 */
import type { ReactNode } from 'react';

interface OrderFormWarningProps {
  /** Titre court en MAJUSCULES, ex: "AVANT DE COMMANDER". */
  title?: string;
  /** Message principal (peut contenir des `<strong>` via children). */
  children: ReactNode;
}

export default function OrderFormWarning({ title = 'Avant de commander', children }: OrderFormWarningProps) {
  return (
    <div className="ofw-wrap relative isolate w-full shrink-0 self-stretch overflow-x-clip rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 px-3 py-3 shadow-sm">
      <span className="ofw-stripe pointer-events-none absolute inset-y-0 left-0 right-0 -z-10 -translate-x-full bg-gradient-to-r from-transparent via-amber-200/55 to-transparent" />
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow ring-2 ring-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1 text-[12px] leading-snug text-amber-900">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">{title}</p>
          <p className="mt-1 font-semibold">{children}</p>
        </div>
      </div>
      <style>{`
        @keyframes ofwStripe { 0% { transform: translateX(-100%) } 65% { transform: translateX(120%) } 100% { transform: translateX(120%) } }
        .ofw-stripe { animation: ofwStripe 4s ease-in-out infinite }
      `}</style>
    </div>
  );
}
