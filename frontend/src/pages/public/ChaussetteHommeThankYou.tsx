/**
 * Page de remerciement dediee Chaussettes Homme Luxe (CHAUSSETTE_HOMME).
 *
 * Role principal : declencher l'evenement Meta Pixel "Purchase" (avec value
 * et currency XOF) au chargement, pour permettre l'optimisation de la
 * campagne FB Ads.
 *
 * Pixel : 1613380123108753 (dedie a la campagne chaussettes homme).
 *
 * Securite anti-double-fire :
 *   - eventID base sur orderReference (?ref=) -> permet a Meta de dedupliquer
 *     entre le pixel browser et l'event server-side CAPI.
 *   - sessionStorage marque le ref comme deja track pour eviter un re-fire
 *     en cas de rechargement.
 *
 * Style : palette noir + or champagne + ivoire (cohérence avec la landing).
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const META_PIXEL_ID = '1613380123108753';
const PRICES: Record<number, number> = { 1: 11900, 2: 20900, 3: 28900 };
const PRODUCT_CODE = 'CHAUSSETTE_HOMME';
const CONTENT_NAME = 'Chaussettes Homme Luxe';

declare global {
  interface Window { fbq?: (...args: any[]) => void }
}

function initMetaPixel(pixelId: string): void {
  if (!pixelId || window.fbq) return;
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
  `;
  document.head.appendChild(script);
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);
}

export default function ChaussetteHommeThankYou() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const qtyRaw = parseInt(params.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const value = PRICES[qty] || PRICES[1];
  const totalPaires = qty * 5;

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = "Merci pour votre commande — Chaussettes Homme";
  }, []);

  useEffect(() => {
    initMetaPixel(META_PIXEL_ID);

    const sessionKey = ref ? `chh_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    window.fbq?.('track', 'PageView');

    const fire = () => {
      try {
        window.fbq?.('track', 'Purchase', {
          content_name: CONTENT_NAME,
          content_ids: [PRODUCT_CODE],
          content_type: 'product',
          value,
          currency: 'XOF',
          num_items: qty,
          contents: [{ id: PRODUCT_CODE, quantity: qty }],
          order_id: ref || undefined,
        }, ref ? { eventID: ref } : undefined);
        if (sessionKey) sessionStorage.setItem(sessionKey, '1');
      } catch (err) {
        console.warn('[thankyou] Meta Pixel Purchase non bloquant:', err);
      }
    };

    if (window.fbq) fire();
    else setTimeout(fire, 800);

    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [ref, qty, value]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafaf6] text-neutral-900 antialiased">
      {/* Top strip noir + or */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.32em] text-white sm:text-[11px]">
        <span className="text-amber-300">Commande confirmée</span>
        <span className="mx-2 opacity-50">·</span>
        <span>GS · Côte d'Ivoire</span>
      </div>

      <main className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
        {/* Halos lumineux fond */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-amber-300/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-[480px] w-[480px] rounded-full bg-yellow-300/25 blur-[120px]" />

        <div className="relative mx-auto w-full max-w-[640px]">
          {/* Card centrale */}
          <div className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,.35)] ring-1 ring-amber-300/50 sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400" />

            {/* Pastille check noir+or */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 shadow-[0_15px_40px_-10px_rgba(212,175,55,.6)]">
              <svg className="h-9 w-9 text-neutral-950" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Titre */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.32em] text-amber-700 ring-1 ring-amber-200">
                Commande confirmée
              </span>
              <h1 className="mt-4 text-[30px] font-black leading-[1.05] tracking-tight text-neutral-950 sm:text-[38px]">
                Merci pour votre <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">commande</span> !
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-700 sm:text-[15px]">
                Votre <strong className="font-bold text-neutral-950">{CONTENT_NAME}</strong> est en cours de préparation. Un conseiller vous appelle <strong className="font-bold text-neutral-950">sous 30 minutes</strong> pour confirmer la livraison.
              </p>
            </div>

            {/* Recap commande noir + or */}
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4 text-white ring-1 ring-amber-300/30">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-300">Quantité</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums">{qty} pack{qty > 1 ? 's' : ''}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-amber-200/80">
                    {totalPaires} paires assorties
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-300">Total</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums text-amber-300">
                    {value.toLocaleString('fr-FR').replace(/,/g, ' ')} F
                  </p>
                </div>
              </div>
              {ref && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px]">
                  <span className="font-black uppercase tracking-[0.25em] text-amber-300/80">N° commande</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono font-bold text-white">{ref}</span>
                </div>
              )}
              <p className="mt-2 text-[10px] text-amber-200/70">
                Confirmée le {now.toLocaleDateString('fr-FR')} à {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Etapes suivantes */}
            <div className="mt-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-700">Et maintenant ?</h2>
              <ol className="mt-3 space-y-3">
                {[
                  { n: '1', t: 'Confirmation par téléphone', d: 'Un conseiller vous rappelle dans les 30 minutes pour valider votre adresse.' },
                  { n: '2', t: 'Livraison rapide', d: 'Votre colis arrive sous 24-48 h partout en Côte d\'Ivoire.' },
                  { n: '3', t: 'Paiement à la livraison', d: 'Vous payez uniquement à la réception. Aucun risque.' },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3 rounded-xl bg-stone-50 p-3 ring-1 ring-amber-100">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-950 to-neutral-800 text-[13px] font-black text-amber-300 shadow-[0_5px_15px_-3px_rgba(0,0,0,.5)] ring-1 ring-amber-300/40">
                      {s.n}
                    </div>
                    <div className="flex-1 leading-tight">
                      <p className="text-[13px] font-black text-neutral-950">{s.t}</p>
                      <p className="mt-0.5 text-[12px] text-neutral-600">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-[10px]">
              {[
                { ico: '🔒', t: 'Sécurisée' },
                { ico: '🚚', t: 'Livraison rapide' },
                { ico: '💵', t: 'Cash livraison' },
              ].map((b) => (
                <div key={b.t} className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 font-bold text-amber-800 ring-1 ring-amber-200">
                  <span>{b.ico}</span>
                  <span>{b.t}</span>
                </div>
              ))}
            </div>

            {/* CTA retour */}
            <div className="mt-6 text-center">
              <Link
                to="/chaussette-homme"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-950 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-amber-300 shadow-[0_10px_25px_-5px_rgba(0,0,0,.5)] ring-2 ring-amber-300/30 transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,.7)]"
              >
                Retour au produit
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-amber-700/70">
            GS · Solutions premium pour le bien-être · Côte d'Ivoire
          </p>
        </div>
      </main>
    </div>
  );
}
