/**
 * Page de remerciement DEDIEE au paiement Mobile Money via Chariow.
 * ============================================================================
 *
 * Affichee SI le client a paye via Chariow (et a donc ete redirige depuis
 * payment.chariow.com vers /serum-cerne-paye/merci?sale_id=xxx).
 *
 * Difference vs la page de remerciement standard cash :
 *   - Met l'accent sur "Paiement bien recu" (rassurant)
 *   - Affiche un numero WhatsApp ULTRA visible avec bouton click-to-chat
 *   - Explique clairement qu'on peut nous contacter pour modifier l'adresse
 *     ou toute autre demande
 *   - Insiste sur la livraison express 2h
 *   - Affiche la reference de transaction Chariow (sale_id) pour le suivi
 *
 * Pixel Meta : declenche `Purchase` event (deduplique avec CAPI server-side
 * via event_id = sale_id).
 */
import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const META_PIXEL_ID = '26809431761984777';
const PRODUCT_CODE = 'SERUM_CERNE_PAYE';

// Numero WhatsApp service client. Format E.164 international.
// 225 = Cote d'Ivoire (10 chiffres apres l'indicatif).
const WHATSAPP_PHONE = '+2250778030075';
const WHATSAPP_DISPLAY = '+225 07 78 03 00 75';
// Pour un click-to-chat WhatsApp, il faut le numero sans + ni espaces.
const WHATSAPP_NUMBER_RAW = '2250778030075';

declare global { interface Window { fbq?: any; } }

function fmt(v: number): string {
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function SerumCernePayeThankYou() {
  const [searchParams] = useSearchParams();
  const saleId = searchParams.get('sale_id') || searchParams.get('ref') || '';
  const qty = parseInt(searchParams.get('qty') || '1', 10) || 1;
  const pixelFiredRef = useRef(false);

  // Calcul du montant approximatif paye (avec -10% applique cote Chariow)
  const PRICES_BASE: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
  const amountPaid = useMemo(() => {
    const basePrice = PRICES_BASE[qty] || PRICES_BASE[1];
    return Math.round(basePrice * 0.9 / 10) * 10;
  }, [qty]);

  // Pre-message WhatsApp pour faciliter le contact
  const whatsappMessage = useMemo(() => {
    const text = `Bonjour, je viens de payer ma commande de Serum Anti-Cernes${saleId ? ` (ref: ${saleId})` : ''}. Je voudrais...`;
    return encodeURIComponent(text);
  }, [saleId]);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER_RAW}?text=${whatsappMessage}`;

  // Tracking Meta Pixel : Purchase event (deduplique avec CAPI server via event_id)
  useEffect(() => {
    if (pixelFiredRef.current) return;
    pixelFiredRef.current = true;

    if (!META_PIXEL_ID) return;

    // Init pixel si pas deja fait
    if (!window.fbq) {
      const f: any = window.fbq = function (...args: any[]) {
        f.callMethod ? f.callMethod(...args) : f.queue.push(args);
      };
      // @ts-ignore
      if (!window._fbq) window._fbq = f;
      f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      const s = document.createElement('script');
      s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(s);
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }

    try {
      window.fbq('track', 'Purchase', {
        value: amountPaid,
        currency: 'XOF',
        content_name: 'Serum Anti-Cernes Premium',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        num_items: qty,
      }, saleId ? { eventID: saleId } : undefined);
    } catch (e) {
      console.warn('[ThankYou] Meta Pixel Purchase non bloquant:', e);
    }
  }, [amountPaid, qty, saleId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-8 sm:py-12">
      <style>{`
        @keyframes scptyFadeUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes scptyPulseRing {
          0%   { transform: scale(.95); opacity: 1 }
          100% { transform: scale(1.6);  opacity: 0 }
        }
        @keyframes scptyShimmerGold {
          0%   { background-position: -200% 50% }
          100% { background-position: 200% 50% }
        }
        @keyframes scptyBounce {
          0%, 100% { transform: translateY(0) }
          50%      { transform: translateY(-3px) }
        }
        .scpty-fade { animation: scptyFadeUp .55s cubic-bezier(.22,.8,.4,1) both }
        .scpty-pulse-ring::after {
          content: ''; position: absolute; inset: 0;
          border-radius: 9999px; background: currentColor;
          animation: scptyPulseRing 1.6s cubic-bezier(0,0,.2,1) infinite;
        }
        .scpty-bounce { animation: scptyBounce 2s ease-in-out infinite }
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

        {/* ===== CARTE PRINCIPALE : SUCCES PAIEMENT ===== */}
        <div className="scpty-fade overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_50px_-12px_rgba(16,185,129,.25)] ring-1 ring-emerald-100">
          {/* Bandeau check vert */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 px-6 py-8 text-center text-white">
            <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-2xl"/>
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl"/>

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-white/30 scpty-pulse-ring text-white"/>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/40">
                <svg className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.4em] text-amber-200">Paiement reussi</p>
            <h1 className="scpty-serif mt-2 text-[28px] leading-tight sm:text-[32px]">
              Merci pour votre <span className="scpty-shimmer-gold">commande</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-white/90 sm:text-[14px]">
              Votre paiement Mobile Money a bien ete recu.
              Notre equipe prepare votre colis.
            </p>

            {/* Recap */}
            <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-3 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm ring-1 ring-white/20">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200">Montant</span>
                <span className="text-[15px] font-black text-white">{fmt(amountPaid)}</span>
              </div>
              <span className="h-7 w-px bg-white/30"/>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200">Quantite</span>
                <span className="text-[15px] font-black text-white">{qty} flacon{qty > 1 ? 's' : ''}</span>
              </div>
            </div>

            {saleId && (
              <p className="mt-3 text-[10px] text-white/70">
                Reference : <span className="font-mono font-bold text-amber-200">{saleId}</span>
              </p>
            )}
          </div>

          {/* ===== LIVRAISON EXPRESS 2H ===== */}
          <div className="border-b border-stone-100 bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-md ring-1 ring-amber-200 scpty-bounce">
                🚀
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Livraison express</p>
                <p className="scpty-serif text-[18px] font-bold text-slate-900">
                  Votre colis arrive en <span className="scpty-shimmer-gold">moins de 2h</span>
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Notre livreur va vous appeler tres bientot pour confirmer l'adresse.
                </p>
              </div>
            </div>
          </div>

          {/* ===== WHATSAPP - CONTACT ===== */}
          <div className="px-6 py-5">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
              Besoin de modifier votre commande ?
            </p>
            <p className="scpty-serif mt-2 text-center text-[18px] leading-tight text-slate-900">
              Contactez-nous sur WhatsApp
            </p>
            <p className="mx-auto mt-1 max-w-xs text-center text-[12px] leading-relaxed text-slate-600">
              Pour <strong>changer l'adresse de livraison</strong>, ajuster votre commande
              ou toute autre demande, ecrivez-nous directement.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="scpty-bounce mt-4 flex w-full items-center justify-center gap-3 overflow-hidden rounded-[0.9rem] bg-gradient-to-r from-[#25d366] to-[#1da851] px-4 py-4 text-white shadow-[0_10px_24px_-4px_rgba(37,211,102,.5)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              {/* Logo WhatsApp officiel */}
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">WhatsApp</span>
                <span className="text-[15px] font-black tracking-wide">{WHATSAPP_DISPLAY}</span>
              </div>
            </a>

            <p className="mt-3 text-center text-[10px] text-slate-400">
              Cliquez pour ouvrir une discussion · 7j/7
            </p>
          </div>

          {/* ===== ETAPES SUIVANTES ===== */}
          <div className="border-t border-stone-100 bg-stone-50/50 px-6 py-5">
            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
              Et maintenant ?
            </p>
            <ol className="space-y-2.5 text-[13px]">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white shadow">1</span>
                <span className="text-slate-700"><strong>Notre livreur vous appelle</strong> pour confirmer l'adresse exacte.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white shadow">2</span>
                <span className="text-slate-700"><strong>Livraison express en moins de 2h</strong> chez vous.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white shadow">3</span>
                <span className="text-slate-700">Vous recevez votre serum, deja paye - <strong>aucun cash a sortir</strong>.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* ===== Footer minimal ===== */}
        <div className="text-center text-[11px] text-slate-500">
          <p>© 2026 · GS Pipeline · Cote d'Ivoire</p>
          <p className="mt-1">Service client 7j/7 · Livraison express Abidjan</p>
        </div>

        <div className="text-center">
          <Link
            to="/serum-cerne-paye"
            className="inline-block text-[11px] font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline"
          >
            Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}
