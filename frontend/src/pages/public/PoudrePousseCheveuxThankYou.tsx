/**
 * Page de remerciement dediee Poudre Pousse Cheveux (POUDRE_CHEVEUX).
 *
 * Role principal : declencher l'evenement Meta Pixel "Purchase" (avec value
 * et currency XOF) au chargement, pour permettre l'optimisation FB Ads.
 *
 * Pixel : 1629520061493542 (dedie a la campagne poudre-pousse-cheveux).
 *
 * Securite anti-double-fire :
 *   - eventID base sur orderReference (?ref=) -> dedup CAPI
 *   - sessionStorage marque le ref comme deja track
 *
 * Style : palette ivoire / terracotta / or rose (coherent avec la landing magazine).
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const META_PIXEL_ID = '1629520061493542';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const PRODUCT_CODE = 'POUDRE_CHEVEUX';
const CONTENT_NAME = 'Poudre Ultra Pousse Cheveux';

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

export default function PoudrePousseCheveuxThankYou() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const qtyRaw = parseInt(params.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const value = PRICES[qty] || PRICES[1];

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = 'Merci pour votre commande — Poudre Pousse Cheveux';
  }, []);

  useEffect(() => {
    initMetaPixel(META_PIXEL_ID);

    const sessionKey = ref ? `pc_purchase_${ref}` : '';
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
  }, [ref, qty, value]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5efe5] text-stone-900 antialiased" style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}>
      {/* Top strip ivoire+or rose */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.32em] text-[#e9b8a0] sm:text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span className="text-[#f5d6c4]">Commande confirmée</span>
        <span className="mx-2 opacity-50">·</span>
        <span>Poudre Pousse Cheveux · Côte d'Ivoire</span>
      </div>

      <main className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
        {/* Halos cuivre/or rose */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-[#e9b8a0]/40 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-[480px] w-[480px] rounded-full bg-[#d4a574]/30 blur-[120px]" />

        <div className="relative mx-auto w-full max-w-[640px]">
          {/* Card centrale */}
          <div className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(74,42,20,0.35)] ring-1 ring-[#e9b8a0]/60 sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d4a574] via-[#e9b8a0] to-[#d4a574]" />

            {/* Pastille check or rose */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a574] via-[#e9b8a0] to-[#c97b5d] shadow-[0_15px_40px_-10px_rgba(212,165,116,0.6)]">
              <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Titre éditorial */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5e8db] px-3 py-1 text-[9px] font-black uppercase tracking-[0.32em] text-[#8b5a2b] ring-1 ring-[#d4a574]/40" style={{ fontFamily: 'Inter, sans-serif' }}>
                Édition limitée · Commande confirmée
              </span>
              <h1 className="mt-4 text-[34px] font-black leading-[1.02] tracking-tight text-stone-950 sm:text-[44px]">
                Merci pour votre <em className="italic bg-gradient-to-r from-[#8b5a2b] via-[#c97b5d] to-[#d4a574] bg-clip-text text-transparent">commande</em>
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-stone-700 sm:text-[15px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Votre <strong className="font-bold text-stone-950">{CONTENT_NAME}</strong> est en cours de préparation. Un conseiller vous appelle <strong className="font-bold text-stone-950">sous 30 minutes</strong> pour confirmer la livraison.
              </p>
            </div>

            {/* Recap commande ivoire+or rose */}
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 text-white ring-1 ring-[#d4a574]/30" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#e9b8a0]">Quantité</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums">{qty} pot{qty > 1 ? 's' : ''}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-[#f5d6c4]/80">
                    Édition Premium 2026
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#e9b8a0]">Total</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums text-[#f5d6c4]">
                    {value.toLocaleString('fr-FR').replace(/,/g, ' ')} F
                  </p>
                </div>
              </div>
              {ref && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px]">
                  <span className="font-black uppercase tracking-[0.25em] text-[#e9b8a0]/80">N° commande</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono font-bold text-white">{ref}</span>
                </div>
              )}
              <p className="mt-2 text-[10px] text-[#e9b8a0]/70">
                Confirmée le {now.toLocaleDateString('fr-FR')} à {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Etapes suivantes */}
            <div className="mt-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.32em] text-[#8b5a2b]">Et maintenant ?</h2>
              <ol className="mt-3 space-y-3">
                {[
                  { n: '1', t: 'Confirmation par téléphone', d: 'Un conseiller vous rappelle dans les 30 minutes pour valider votre adresse.' },
                  { n: '2', t: 'Livraison rapide', d: "Votre poudre arrive sous 24-48 h partout en Côte d'Ivoire." },
                  { n: '3', t: 'Paiement à la livraison', d: 'Vous payez uniquement à la réception. Aucun risque.' },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3 rounded-xl bg-[#f5efe5] p-3 ring-1 ring-[#d4a574]/30">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-900 to-stone-800 text-[13px] font-black text-[#e9b8a0] shadow-[0_5px_15px_-3px_rgba(0,0,0,0.5)] ring-1 ring-[#d4a574]/40">
                      {s.n}
                    </div>
                    <div className="flex-1 leading-tight">
                      <p className="text-[13px] font-black text-stone-950">{s.t}</p>
                      <p className="mt-0.5 text-[12px] text-stone-600">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-[10px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {[
                { ico: '🔒', t: 'Sécurisée' },
                { ico: '🚚', t: 'Livraison rapide' },
                { ico: '💵', t: 'Cash livraison' },
              ].map((b) => (
                <div key={b.t} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#f5e8db] px-2 py-1.5 font-bold text-[#8b5a2b] ring-1 ring-[#d4a574]/40">
                  <span>{b.ico}</span>
                  <span>{b.t}</span>
                </div>
              ))}
            </div>

            {/* CTA retour */}
            <div className="mt-6 text-center">
              <Link
                to="/poudre-pousse-cheveux"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#e9b8a0] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] ring-2 ring-[#d4a574]/30 transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.7)]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Retour au produit
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-[#8b5a2b]/70" style={{ fontFamily: 'Inter, sans-serif' }}>
            Poudre Ultra Pousse Cheveux · Édition Premium 2026 · Côte d'Ivoire
          </p>
        </div>
      </main>
    </div>
  );
}
