/**
 * PaymentChoicePopup - Popup intermediaire AVANT le formulaire de commande.
 * ============================================================================
 *
 * Specifique a la page `serum-cerne-paye` (paiement Chariow Mobile Money).
 *
 * Apparait au clic sur tout CTA "Commander" et propose 2 options claires :
 *
 *   1) [RECOMMANDE] Mobile Money en ligne
 *      - Badge -10% en haut a droite
 *      - 4 avantages clairs (reduction / livraison gratuite / express 2h / securite)
 *      - Visuellement mis en valeur (gradient teal/emeraude, ring, animation)
 *      - Texte rassurant : "100% securise" + "Wave / Orange / MTN / Moov"
 *
 *   2) Paiement a la livraison
 *      - Style sobre (gris/noir)
 *      - Mention "option standard"
 *      - Texte explicatif honnete : "Vous payez en cash quand le livreur arrive"
 *      - Aucune mauvaise mention sur les clients - juste les FAITS
 *
 * Pas de sentiment de "force" ni de jugement sur les clients qui choisissent
 * le cash - juste une mise en valeur factuelle des avantages du Mobile Money.
 */
import { useEffect } from 'react';

export type PaymentMode = 'cash' | 'chariow';

interface Props {
  open: boolean;
  onClose: () => void;
  onChoose: (mode: PaymentMode) => void;
  /** Quantite preselectionnee (passee au modal de commande ensuite) */
  qty?: number;
  /** Prix unitaire affiche (ex: "9 900 FCFA") - juste informatif */
  priceLabel?: string;
}

export default function PaymentChoicePopup({ open, onClose, onChoose, qty = 1, priceLabel }: Props) {
  // Lock body scroll quand ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC pour fermer
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

      {/* Sheet container */}
      <div className="relative z-10 w-full max-w-[440px] max-h-[100dvh] overflow-y-auto rounded-t-[20px] bg-[#faf8f5] shadow-2xl animate-[pcpslide_.28s_cubic-bezier(.22,.8,.4,1)] sm:rounded-[20px]">

        {/* Liseret or */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"/>

        {/* ===== HEADER navy ===== */}
        <div className="relative overflow-hidden bg-slate-950 px-5 pt-5 pb-5 text-white">
          <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-amber-400/25 blur-2xl"/>
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl"/>

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-300/80">Reservation · {qty} {qty === 1 ? 'flacon' : 'flacons'}</p>
              <h3 id="pcp-title" className="pcp-serif mt-1 text-[20px] leading-tight text-white sm:text-[22px]">
                Comment souhaitez-vous <span className="pcp-shimmer-gold">payer</span> ?
              </h3>
              <p className="mt-1 text-[11px] font-medium text-stone-300">
                Choisissez le mode qui vous convient.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-white/15 hover:scale-105"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== BODY : 2 cartes empilees ===== */}
        <div className="space-y-3 px-4 py-4 sm:px-5">

          {/* ─────────────────────────────────────────────── */}
          {/* OPTION 1 : Mobile Money (RECOMMANDE)            */}
          {/* ─────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => onChoose('chariow')}
            className="pcp-card-recommended group relative w-full overflow-hidden rounded-[1rem] bg-white text-left shadow-lg ring-2 ring-emerald-400 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:ring-emerald-500"
          >
            {/* Bandeau RECOMMANDE en haut */}
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 py-1.5 text-white">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="pcp-pulse-dot relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"/>
                </span>
                Recommande
              </span>
              <span className="rounded-sm bg-white/20 px-2 py-0.5 text-[10px] font-black tracking-widest backdrop-blur-sm">
                -10% OFF
              </span>
            </div>

            {/* Contenu */}
            <div className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                {/* Icone Mobile Money */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-2xl ring-1 ring-emerald-200">
                  📱
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-black text-slate-900">Payer par Mobile Money</h4>
                  <p className="text-[11px] font-bold text-emerald-700">Wave · Orange · MTN · Moov</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Paiement instantane, securise, sans frais.</p>
                </div>
              </div>

              {/* Avantages en grille 2x2 */}
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5 ring-1 ring-emerald-100">
                  <span className="text-[14px]">💸</span>
                  <span className="text-[10px] font-bold leading-tight text-emerald-800">-10% reduction immediate</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5 ring-1 ring-emerald-100">
                  <span className="text-[14px]">🚀</span>
                  <span className="text-[10px] font-bold leading-tight text-emerald-800">Livraison express 2h</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5 ring-1 ring-emerald-100">
                  <span className="text-[14px]">✓</span>
                  <span className="text-[10px] font-bold leading-tight text-emerald-800">Livraison 100% gratuite</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5 ring-1 ring-emerald-100">
                  <span className="text-[14px]">🔒</span>
                  <span className="text-[10px] font-bold leading-tight text-emerald-800">Paiement 100% securise</span>
                </div>
              </div>

              {/* CTA inline */}
              <div className="mt-3 flex h-[44px] items-center justify-center gap-2 overflow-hidden rounded-[0.7rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-[12px] font-black uppercase tracking-[0.15em] text-white shadow-lg transition-transform group-hover:scale-[1.02]">
                <span className="pcp-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"/>
                <span className="relative">Continuer en Mobile Money</span>
                <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
            </div>
          </button>

          {/* ─────────────────────────────────────────────── */}
          {/* SEPARATEUR "ou"                                 */}
          {/* ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-stone-200"/>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">ou</span>
            <span className="h-px flex-1 bg-stone-200"/>
          </div>

          {/* ─────────────────────────────────────────────── */}
          {/* OPTION 2 : Paiement a la livraison              */}
          {/* ─────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => onChoose('cash')}
            className="group relative w-full overflow-hidden rounded-[1rem] bg-white text-left shadow-md ring-1 ring-stone-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-stone-300"
          >
            <div className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                {/* Icone */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl ring-1 ring-stone-200">
                  💵
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-black text-slate-800">Payer a la livraison</h4>
                    <span className="rounded-sm bg-stone-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-stone-500 ring-1 ring-stone-200">
                      Standard
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">Vous payez en cash quand le livreur arrive chez vous.</p>
                </div>
              </div>

              {/* Mention conditions standard */}
              <div className="mt-3 flex items-center gap-2 rounded-md bg-stone-50 px-2.5 py-1.5 ring-1 ring-stone-100">
                <svg className="h-3.5 w-3.5 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-[10px] leading-tight text-slate-500">
                  Conditions standards : <span className="font-bold text-slate-700">delai de livraison classique</span>, prix au tarif normal.
                </p>
              </div>

              {/* CTA inline */}
              <div className="mt-3 flex h-[42px] items-center justify-center gap-2 rounded-[0.7rem] bg-slate-900 text-[12px] font-black uppercase tracking-[0.15em] text-white shadow-md transition-transform group-hover:scale-[1.01] group-hover:bg-slate-800">
                <span>Continuer en cash a la livraison</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
            </div>
          </button>

          {/* ─────────────────────────────────────────────── */}
          {/* Footer rassurant                                */}
          {/* ─────────────────────────────────────────────── */}
          <div className="mt-1 flex items-center justify-center gap-2 px-2 py-2">
            <svg className="h-3 w-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
            <p className="text-[10px] font-medium text-stone-500">
              Vos informations sont <span className="font-bold text-stone-700">protegees et confidentielles</span>.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pcpfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pcpslide { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes pcpPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes pcpSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes pcpShimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }

        .pcp-pulse-dot::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: white; animation: pcpPulse 1.4s ease-in-out infinite }
        .pcp-cta-sheen { animation: pcpSheen 3s ease-in-out infinite }
        .pcp-card-recommended { box-shadow: 0 10px 30px -8px rgba(16,185,129,.35), 0 4px 12px -4px rgba(16,185,129,.2) }
        .pcp-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-weight: 600 }
        .pcp-shimmer-gold {
          background: linear-gradient(90deg, #fbbf24 0%, #fde68a 25%, #f59e0b 50%, #fef3c7 75%, #fbbf24 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: pcpShimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
