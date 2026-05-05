/**
 * Page de remerciement pour le mode CASH a la livraison.
 * ============================================================================
 *
 * Affichee SI le client a choisi "Payer a la livraison" (donc commande
 * arrivee dans obgestion via /api/public/order, status=NOUVELLE).
 *
 * Difference vs SerumCernePayeThankYou (Paystack Mobile Money / Chariow legacy) :
 *   - Pas de WhatsApp / pas de numero de contact
 *   - Pas de mention "livraison express 2h"
 *   - Palette amber/or (vs emerald pour les paiements en ligne)
 *   - Message standard : "Notre equipe vous contacte pour confirmer"
 *   - Insiste sur "vous payez a la reception" pour rassurer
 *
 * Le client est dirige ici via le useOrderSubmit hook (cfg.thankYouUrl).
 */
import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const META_PIXEL_ID = '26809431761984777';
const PRODUCT_CODE = 'SERUM_CERNE_PAYE';

declare global { interface Window { fbq?: any; _fbq?: any; } }

function fmt(v: number): string {
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function SerumCernePayeThankYouCash() {
  const [searchParams] = useSearchParams();
  const orderRef = searchParams.get('ref') || '';
  const qty = parseInt(searchParams.get('qty') || '1', 10) || 1;
  const pixelFiredRef = useRef(false);

  const PRICES_BASE: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
  const totalAmount = useMemo(() => PRICES_BASE[qty] || PRICES_BASE[1], [qty]);

  // Tracking Meta Pixel : Purchase event (deduplique avec CAPI server-side
  // via event_id = orderRef). Le CAPI est deja envoye par /api/public/order
  // au moment de la creation de la commande, donc Meta dedoublonnera.
  useEffect(() => {
    if (pixelFiredRef.current) return;
    pixelFiredRef.current = true;

    if (!META_PIXEL_ID) return;

    if (!window.fbq) {
      const f: any = window.fbq = function (...args: any[]) {
        f.callMethod ? f.callMethod(...args) : f.queue.push(args);
      };
      if (!window._fbq) window._fbq = f;
      f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      const s = document.createElement('script');
      s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(s);
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }

    try {
      // event_id IMPORTANT : doit correspondre exactement a celui envoye par
      // le CAPI server-side (`purchase_<orderRef>` dans utils/metaCapi.js).
      // Le CAPI cash est envoye depuis routes/public.routes.js juste apres la
      // creation de l'Order (avec orderRef = order.orderReference UUID).
      const eventId = orderRef ? `purchase_${orderRef}` : undefined;
      window.fbq('track', 'Purchase', {
        value: totalAmount,
        currency: 'XOF',
        content_name: 'Serum Anti-Cernes Premium',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        num_items: qty,
      }, eventId ? { eventID: eventId } : undefined);
    } catch (e) {
      console.warn('[ThankYouCash] Meta Pixel Purchase non bloquant:', e);
    }
  }, [orderRef, qty, totalAmount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 px-4 py-8 sm:py-12">
      <style>{`
        @keyframes scptyFadeUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes scptyShimmerGold {
          0%   { background-position: -200% 50% }
          100% { background-position: 200% 50% }
        }
        .scpty-fade { animation: scptyFadeUp .55s cubic-bezier(.22,.8,.4,1) both }
        .scpty-shimmer-gold {
          background: linear-gradient(90deg, #d4af37 0%, #fde68a 25%, #fbbf24 50%, #fef3c7 75%, #d4af37 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: scptyShimmerGold 3s linear infinite;
        }
        .scpty-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-weight: 600 }
      `}</style>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"/>

      <div className="mx-auto w-full max-w-[480px] space-y-4">

        {/* ===== CARTE PRINCIPALE ===== */}
        <div className="scpty-fade overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_50px_-12px_rgba(212,175,55,.25)] ring-1 ring-amber-100">

          {/* Bandeau navy + or */}
          <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-center text-white">
            <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-300/30 blur-2xl"/>
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl"/>

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 shadow-lg ring-4 ring-amber-200/40">
                <svg className="h-12 w-12 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.4em] text-amber-300">Commande enregistree</p>
            <h1 className="scpty-serif mt-2 text-[28px] leading-tight sm:text-[32px]">
              Merci pour votre <span className="scpty-shimmer-gold">commande</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-stone-300 sm:text-[14px]">
              Votre commande a bien ete enregistree.
              Notre equipe vous contacte tres bientot.
            </p>

            {/* Recap */}
            <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-3 rounded-full bg-amber-400/10 px-4 py-2 backdrop-blur-sm ring-1 ring-amber-400/30">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">Montant</span>
                <span className="text-[15px] font-black text-white">{fmt(totalAmount)}</span>
              </div>
              <span className="h-7 w-px bg-amber-400/30"/>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">Quantite</span>
                <span className="text-[15px] font-black text-white">{qty} flacon{qty > 1 ? 's' : ''}</span>
              </div>
            </div>

            {orderRef && (
              <p className="mt-3 text-[10px] text-stone-400">
                Reference : <span className="font-mono font-bold text-amber-300">{orderRef.slice(0, 13)}...</span>
              </p>
            )}
          </div>

          {/* ===== APPEL DE CONFIRMATION ===== */}
          <div className="border-b border-stone-100 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-md ring-1 ring-amber-200">
                📞
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Prochaine etape</p>
                <p className="scpty-serif text-[18px] font-bold text-slate-900">
                  Notre equipe vous appelle <span className="scpty-shimmer-gold">tres bientot</span>
                </p>
                <p className="mt-1 text-[12px] text-slate-600">
                  Pour confirmer votre adresse de livraison et programmer le passage du livreur.
                </p>
              </div>
            </div>
          </div>

          {/* ===== ETAPES ===== */}
          <div className="px-6 py-5">
            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">
              Comment ca se passe ?
            </p>
            <ol className="space-y-2.5 text-[13px]">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-black text-amber-300 shadow">1</span>
                <span className="text-slate-700"><strong>Appel de confirmation</strong> par notre equipe sous 30 minutes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-black text-amber-300 shadow">2</span>
                <span className="text-slate-700"><strong>Livraison rapide</strong> partout en Cote d'Ivoire (24h Abidjan, 48h regions).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-black text-amber-300 shadow">3</span>
                <span className="text-slate-700">Vous payez <strong>uniquement a la reception</strong> du produit. Zero risque.</span>
              </li>
            </ol>
          </div>

          {/* ===== TRUST BAR ===== */}
          <div className="border-t border-stone-100 bg-stone-50/50 px-6 py-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[18px]">🔒</span>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-700">Sans risque</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[18px]">📦</span>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-700">Verification colis</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[18px]">💵</span>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-700">Paiement livraison</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Footer minimal ===== */}
        <div className="text-center text-[11px] text-slate-500">
          <p>© 2026 · GS Pipeline · Cote d'Ivoire</p>
          <p className="mt-1">Service client 7j/7 · Livraison Cote d'Ivoire</p>
        </div>

        <div className="text-center">
          <Link
            to="/serum-cerne-paye"
            className="inline-block text-[11px] font-medium text-amber-700 underline-offset-2 hover:text-amber-800 hover:underline"
          >
            Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}
