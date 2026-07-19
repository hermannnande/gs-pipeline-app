/**
 * Page « merci » — Guide Pousse Naturelle, DEUX formats.
 * ============================================================================
 *
 * Sert les deux parcours de la landing, distingues par ?format= :
 *
 *   - (defaut) EBOOK : retour Chariow, /guide-pousse-naturelle/merci?ref=<sale_id>.
 *     Paiement DEJA encaisse -> messaging "acces par email / portail".
 *   - ?format=physique : livre imprime commande via POST /public/order.
 *     RIEN n'est encaisse a ce stade -> messaging "un conseiller vous appelle,
 *     vous payez a la reception". Ne jamais afficher "paiement reussi" ici.
 *
 * Pixel Meta : declenche `Purchase` avec eventID = `purchase_<sale_id>`, IDENTIQUE
 * a l'event_id envoye par le CAPI server-side (utils/metaCapi.js, orderRef=sale.id
 * cote chariow.routes.js). Meta deduplique donc les 2 evenements.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// ⚠️ Doit correspondre au META_PIXEL_ID de la landing.
const META_PIXEL_ID = '2061376097807745';
const PRODUCT_CODE = 'GUIDE_POUSSE_NATURELLE';
const PRODUCT_CODE_PHYSIQUE = 'GUIDE_POUSSE_NATURELLE_PHYSIQUE';
// ⚠️ A garder aligne avec PRICE_EBOOK / PRICE_PHYSIQUE de la landing.
const PRICE = 8900;
const PRICE_PHYSIQUE = 9900;

// Numero WhatsApp support (a personnaliser).
const WHATSAPP_NUMBER_RAW = '2250778030075';
const WHATSAPP_DISPLAY = '+225 07 78 03 00 75';

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any; } }

const fmt = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';

export default function GuidePousseNaturelleThankYou() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('ref') || searchParams.get('reference') || searchParams.get('sale_id') || '';
  const isPhysique = searchParams.get('format') === 'physique';
  const price = isPhysique ? PRICE_PHYSIQUE : PRICE;
  const pixelFired = useRef(false);

  const whatsappUrl = useMemo(() => {
    const verbe = isPhysique ? 'de commander' : "d'acheter";
    const text = `Bonjour, je viens ${verbe} le guide Faire pousser vos cheveux naturellement${isPhysique ? ' (livre imprime)' : ''}${reference ? ` (ref: ${reference})` : ''}. Je voudrais...`;
    return `https://wa.me/${WHATSAPP_NUMBER_RAW}?text=${encodeURIComponent(text)}`;
  }, [reference, isPhysique]);

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    if (!META_PIXEL_ID) return;

    if (!window.fbq) {
      const f: any = (window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); });
      if (!window._fbq) window._fbq = f;
      f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      const s = document.createElement('script');
      s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(s);
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }

    try {
      // event_id = purchase_<sale_id> -> deduplication avec le CAPI server-side.
      const eventId = reference ? `purchase_${reference}` : undefined;
      window.fbq('track', 'Purchase', {
        value: price,
        currency: 'XOF',
        content_name: 'Faire pousser vos cheveux naturellement',
        content_ids: [isPhysique ? PRODUCT_CODE_PHYSIQUE : PRODUCT_CODE],
        content_type: 'product',
        num_items: 1,
      }, eventId ? { eventID: eventId } : undefined);
    } catch (e) {
      console.warn('[ThankYou] Meta Pixel Purchase non bloquant:', e);
    }
  }, [reference, isPhysique, price]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-[480px] space-y-4">
        <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_50px_-12px_rgba(16,185,129,.25)] ring-1 ring-emerald-100">
          {/* Bandeau succes */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#218C4F] via-[#126B3A] to-[#218C4F] px-6 py-8 text-center text-white">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
              <svg className="h-12 w-12 text-[#126B3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.4em] text-amber-200">
              {isPhysique ? 'Commande enregistree' : 'Paiement reussi'}
            </p>
            <h1 className="mt-2 text-[26px] font-black leading-tight sm:text-[30px]">Merci pour votre commande</h1>
            <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-white/90">
              {isPhysique
                ? 'Votre livre « Faire pousser vos cheveux naturellement » est reserve. Un conseiller vous appelle pour organiser la livraison.'
                : 'Votre guide « Faire pousser vos cheveux naturellement » est en route.'}
            </p>
            <div className="mx-auto mt-5 inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 ring-1 ring-white/20">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200">
                {isPhysique ? 'A payer a la livraison' : 'Montant'}
              </span>
              <span className="text-[15px] font-black">{fmt(price)}</span>
            </div>
            {reference && (
              <p className="mt-3 text-[10px] text-white/70">Reference : <span className="font-mono font-bold text-amber-200">{reference}</span></p>
            )}
          </div>

          {/* Acces au guide */}
          <div className="border-b border-stone-100 bg-[#FFF9ED] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-md ring-1 ring-amber-200">{isPhysique ? '📞' : '📩'}</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#126B3A]">
                  {isPhysique ? 'Prochaine etape' : 'Acces numerique'}
                </p>
                <p className="text-[16px] font-bold text-slate-900">
                  {isPhysique ? 'Gardez votre telephone a portee' : 'Verifiez votre email'}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  {isPhysique
                    ? "Un conseiller vous appelle pour confirmer votre adresse et convenir du jour de livraison. Vous payez au livreur, en main propre."
                    : 'Vous recevez votre lien securise / portail client pour telecharger le guide (pensez a verifier les spams).'}
                </p>
              </div>
            </div>
          </div>

          {/* Etapes */}
          <div className="px-6 py-5">
            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-[#126B3A]">Et maintenant ?</p>
            <ol className="space-y-2.5 text-[13px]">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#218C4F] text-[11px] font-black text-white">1</span>
                <span className="text-slate-700">
                  {isPhysique
                    ? "Repondez a l'appel de notre conseiller pour confirmer l'adresse."
                    : "Ouvrez l'email de confirmation et cliquez sur votre lien securise."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#218C4F] text-[11px] font-black text-white">2</span>
                <span className="text-slate-700">Commencez par le chapitre « diagnostic », puis choisissez UNE seule routine.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#218C4F] text-[11px] font-black text-white">3</span>
                <span className="text-slate-700">Suivez-la regulierement (defi 30 jours) et notez votre progression.</span>
              </li>
            </ol>
          </div>

          {/* WhatsApp support */}
          <div className="border-t border-stone-100 px-6 py-5">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-[#126B3A]">
              {isPhysique ? 'Une question sur votre livraison ?' : 'Un souci pour acceder au guide ?'}
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-[0.9rem] bg-gradient-to-r from-[#25d366] to-[#1da851] px-4 py-4 text-white shadow-[0_10px_24px_-4px_rgba(37,211,102,.5)] transition-transform hover:scale-[1.02]"
            >
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">WhatsApp support</span>
                <span className="text-[15px] font-black">{WHATSAPP_DISPLAY}</span>
              </div>
            </a>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          <p>Ce guide est educatif et ne remplace pas un diagnostic medical.</p>
        </div>
        <div className="text-center">
          <Link to="/guide-pousse-naturelle" className="text-[11px] font-medium text-[#126B3A] underline-offset-2 hover:underline">Retour au site</Link>
        </div>
      </div>
    </div>
  );
}
