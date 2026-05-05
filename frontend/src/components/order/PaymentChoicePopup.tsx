/**
 * PaymentChoicePopup - Popup de choix paiement ULTRA SIMPLE.
 * ============================================================================
 *
 * Specifique a la page `serum-cerne-paye`.
 *
 * Design v3 (Paystack, focus conversion) :
 *   - Tres peu de texte (decision rapide)
 *   - 2 gros boutons visibles d'un coup sans scroll (sticky en mobile)
 *   - Bouton Mobile Money MASSIF avec animation bounce + glow vert
 *   - Bouton Cash sobre mais clair
 *   - 1 ligne d'explication en bas
 *
 * Au clic :
 *   - Mobile Money -> onChoose('paystack') -> ouvre le modal de commande
 *     avec mode initial Paystack (l'utilisateur saisit ses infos + provider
 *     Wave/Orange/MTN, puis valide sur son telephone, le tout sans quitter
 *     la landing - Charge API native Paystack).
 *   - Cash         -> onChoose('cash')     -> ouvre le modal de commande cash
 *
 * Aucun jugement sur le client qui choisit cash. On met juste les avantages
 * du Mobile Money en evidence (-10% + livraison 2h) pour orienter le choix.
 */
import { useEffect } from 'react';

export type PaymentMode = 'cash' | 'paystack';

interface Props {
  open: boolean;
  onClose: () => void;
  onChoose: (mode: PaymentMode) => void;
  qty?: number;
  /** Prix cash format (ex: "9 900 F") */
  cashPrice?: string;
  /** Prix Paystack Mobile Money -10% format (ex: "8 910 F") */
  paystackPrice?: string;
}

export default function PaymentChoicePopup({ open, onClose, onChoose, qty = 1, cashPrice = '', paystackPrice = '' }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pcp-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md animate-[pcpfade_.2s_ease-out]"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-t-[24px] bg-white shadow-2xl animate-[pcpslide_.28s_cubic-bezier(.22,.8,.4,1)] sm:rounded-[24px]">

        {/* Bouton fermer en absolu */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-200 hover:scale-105"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Titre minimaliste */}
        <div className="px-5 pt-7 pb-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">
            {qty} {qty === 1 ? 'flacon' : 'flacons'} · choix paiement
          </p>
          <h3 id="pcp-title" className="pcp-serif mt-1.5 text-[22px] font-bold leading-tight text-slate-900 sm:text-[24px]">
            Comment souhaitez-vous <span className="pcp-shimmer-gold">payer</span> ?
          </h3>
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 2 boutons empilles, gros, visibles d'un coup    */}
        {/* ─────────────────────────────────────────────── */}
        <div className="space-y-3 px-4 pb-2 pt-3 sm:px-5">

          {/* OPTION 1 : Mobile Money - GROS BOUTON BOUNCE GLOW */}
          <button
            type="button"
            onClick={() => onChoose('paystack')}
            className="pcp-bounce group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[1rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 py-4 text-left text-white shadow-[0_10px_30px_-6px_rgba(16,185,129,.5),_0_4px_12px_-2px_rgba(16,185,129,.3)] ring-2 ring-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <span className="pcp-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"/>

            {/* Badge -10% en haut a droite */}
            <span className="absolute -right-1 -top-1 rounded-bl-xl rounded-tr-[1rem] bg-amber-400 px-2.5 py-1 text-[10px] font-black tracking-widest text-slate-900 shadow-lg pcp-pulse-badge">
              -10% OFF
            </span>

            <div className="relative flex items-center gap-3 min-w-0 pr-2">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm ring-1 ring-white/30">
                📱
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-black uppercase tracking-wide leading-tight">Payer Mobile Money</p>
                {paystackPrice && (
                  <p className="mt-0.5 flex items-baseline gap-1.5 text-[11px] font-bold">
                    <span className="text-[18px] font-black text-amber-300">{paystackPrice}</span>
                    {cashPrice && <span className="text-[12px] text-white/60 line-through">{cashPrice}</span>}
                  </p>
                )}
              </div>
            </div>

            <svg className="relative h-6 w-6 shrink-0 text-white drop-shadow-md transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>

          {/* OPTION 2 : Cash - bouton sobre mais clair */}
          <button
            type="button"
            onClick={() => onChoose('cash')}
            className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[1rem] bg-slate-900 px-4 py-3.5 text-left text-white shadow-md ring-1 ring-slate-800 transition-all hover:scale-[1.01] hover:bg-slate-800 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl ring-1 ring-white/20">
                💵
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-black uppercase tracking-wide leading-tight">Payer a la livraison</p>
                {cashPrice && (
                  <p className="mt-0.5 text-[16px] font-black text-amber-300">{cashPrice}</p>
                )}
              </div>
            </div>

            <svg className="h-5 w-5 shrink-0 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 1 ligne d'explication en bas                    */}
        {/* ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-50 px-5 py-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-700 sm:text-[12px]">
            <span className="text-[14px]">⚡</span>
            <span>
              Mobile Money = <span className="font-black text-emerald-700">livraison express en 2h</span>
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pcpfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pcpslide { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes pcpBounce {
          0%, 100% { transform: translateY(0) }
          50%      { transform: translateY(-4px) }
        }
        @keyframes pcpPulseBadge {
          0%, 100% { transform: scale(1) }
          50%      { transform: scale(1.08) }
        }
        @keyframes pcpSheen {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(100%) }
        }
        @keyframes pcpShimmer {
          0%   { background-position: -200% 50% }
          100% { background-position: 200% 50% }
        }

        .pcp-bounce {
          animation: pcpBounce 1.6s ease-in-out infinite;
        }
        .pcp-bounce:hover {
          animation: none;
        }
        .pcp-pulse-badge {
          animation: pcpPulseBadge 1.4s ease-in-out infinite;
        }
        .pcp-cta-sheen {
          animation: pcpSheen 2.8s ease-in-out infinite;
        }
        .pcp-serif {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-weight: 600;
        }
        .pcp-shimmer-gold {
          background: linear-gradient(90deg, #d4af37 0%, #fde68a 25%, #f59e0b 50%, #fef3c7 75%, #d4af37 100%);
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: pcpShimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
