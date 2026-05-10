/**
 * Page de remerciement dediee a la campagne Facebook ads patchdouleurfb.
 *
 * Role principal : declencher l'evenement Meta Pixel "Purchase" (avec value
 * et currency XOF) au chargement, pour permettre l'optimisation de la
 * campagne FB Ads.
 *
 * Pixel : 952340034030644 (dedie a la campagne FB).
 *
 * Securite anti-double-fire :
 *   - eventID base sur orderReference (?ref=) -> permet a Meta de dedupliquer
 *     entre le pixel browser et l'event server-side CAPI.
 *   - sessionStorage marque le ref comme deja track pour eviter un re-fire
 *     en cas de rechargement.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// Pixel Meta de la campagne FB Ads (memes IDs que landing patchdouleurfb).
const META_PIXEL_ID = '952340034030644';

// Memes prix que la landing -> garantit la coherence value cote browser et CAPI.
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };

const PRODUCT_CODE = 'PATCH_DOULEUR_FB';
const CONTENT_NAME = 'Patch Anti-Douleur Chauffant FB';

declare global {
  interface Window { fbq?: (...args: any[]) => void; }
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

export default function PatchDouleurFbThankYou() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const qtyRaw = parseInt(params.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const value = PRICES[qty] || PRICES[1];

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = 'Merci pour votre commande — Ob\'rille';
  }, []);

  // ============= TRACKING META PIXEL =============
  useEffect(() => {
    initMetaPixel(META_PIXEL_ID);

    // Anti-double-fire : si on a deja track ce ref dans cette session, skip.
    const sessionKey = ref ? `pd_fb_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    // PageView de la page de remerciement (separe du PageView de la landing)
    window.fbq?.('track', 'PageView');

    // Purchase event — eventID = ref pour permettre la deduplication CAPI
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

    // Si fbq pas encore charge, on retente une fois (~600ms apres le script init)
    if (window.fbq) fire();
    else setTimeout(fire, 800);

    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [ref, qty, value]);

  return (
    <div className="pdfb-tx-root min-h-screen overflow-x-hidden bg-[#fafaf9] text-[#0a1628] antialiased">

      {/* Top strip */}
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0c1e2e] to-[#0a1628] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white sm:text-[11px]">
        <span className="text-cyan-300">Commande confirmee</span>
        <span className="mx-2 opacity-50">·</span>
        <span>Ob'rille · Cote d'Ivoire</span>
      </div>

      <main className="relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
        {/* Halos lumineux fond */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-300/30 blur-[120px]"/>
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-200/30 blur-[120px]"/>

        <div className="relative mx-auto w-full max-w-[640px]">

          {/* Card centrale */}
          <div className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-200/60 sm:p-10">

            {/* Glow accent en haut */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400"/>

            {/* Pastille check */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.6)]">
              <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Titre + sous-titre */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.32em] text-emerald-700 ring-1 ring-emerald-200">
                Commande confirmee
              </span>
              <h1 className="pdfb-display mt-4 text-[30px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[38px]">
                Merci pour votre <span className="pdfb-grad-cyan">commande</span> !
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-700 sm:text-[15px]">
                Votre <strong className="font-bold text-[#0a1628]">{CONTENT_NAME}</strong> est en cours de preparation. Un conseiller vous appelle <strong className="font-bold text-[#0a1628]">sous 30 minutes</strong> pour confirmer la livraison.
              </p>
            </div>

            {/* Recap commande */}
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#0a1628] p-4 text-white ring-1 ring-cyan-400/20">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-300">Quantite</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums">{qty} boite{qty > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-300">Total</p>
                  <p className="pdfb-display mt-1 text-[18px] font-black tabular-nums text-cyan-300">{value.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                </div>
              </div>
              {ref && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px]">
                  <span className="font-black uppercase tracking-[0.25em] text-cyan-300/80">N° commande</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono font-bold text-white">{ref}</span>
                </div>
              )}
              <p className="mt-2 text-[10px] text-cyan-200/70">
                Confirme le {now.toLocaleDateString('fr-FR')} a {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Etapes suivantes */}
            <div className="mt-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Et maintenant ?</h2>
              <ol className="mt-3 space-y-3">
                {[
                  { n: '1', t: 'Confirmation par telephone', d: 'Un conseiller vous rappelle dans les 30 minutes pour valider votre adresse.' },
                  { n: '2', t: 'Livraison rapide', d: 'Votre colis arrive chez vous en quelques jours partout en Cote d\'Ivoire.' },
                  { n: '3', t: 'Paiement a la livraison', d: 'Vous payez uniquement quand vous recevez votre colis. Aucun risque.' },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-[13px] font-black text-white shadow-[0_5px_15px_-3px_rgba(6,182,212,0.5)]">
                      {s.n}
                    </div>
                    <div className="flex-1 leading-tight">
                      <p className="text-[13px] font-black text-[#0a1628]">{s.t}</p>
                      <p className="mt-0.5 text-[12px] text-neutral-600">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-[10px]">
              {[
                { ico: '🔒', t: 'Securisee' },
                { ico: '🚚', t: 'Livraison rapide' },
                { ico: '💵', t: 'Paiement livraison' },
              ].map((b) => (
                <div key={b.t} className="flex items-center justify-center gap-1.5 rounded-lg bg-cyan-50 px-2 py-1.5 font-bold text-cyan-700 ring-1 ring-cyan-200">
                  <span>{b.ico}</span>
                  <span>{b.t}</span>
                </div>
              ))}
            </div>

            {/* CTA retour */}
            <div className="mt-6 text-center">
              <Link
                to="/patchdouleurfb"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_25px_-5px_rgba(6,182,212,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_-5px_rgba(6,182,212,0.75)]"
              >
                Retour au produit
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </Link>
            </div>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-[11px] text-neutral-500">
            Ob'rille · Solutions premium pour le bien-etre · Cote d'Ivoire
          </p>
        </div>
      </main>

      <style>{`
        .pdfb-display    { font-family: 'Bricolage Grotesque', 'Outfit', system-ui, -apple-system, sans-serif; font-feature-settings: 'ss01' on, 'ss02' on; }
        .pdfb-grad-cyan  { background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #0ea5e9 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>
    </div>
  );
}
