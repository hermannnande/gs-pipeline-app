/**
 * Page de remerciement dediee Spray Vitiligo (CREME_VITILIGO).
 *
 * Role principal : declencher l'evenement Meta Pixel "Purchase" (avec value
 * et currency XOF) au chargement, pour permettre l'optimisation FB Ads.
 *
 * Pixel : a remplir une fois la campagne creee (placeholder vide pour l'instant).
 *
 * Securite anti-double-fire :
 *   - eventID base sur orderReference (?ref=) -> dedup CAPI
 *   - sessionStorage marque le ref comme deja track
 *
 * Style : palette bleu medical/cosmetique (coherent avec landing).
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// Pixel Meta dedie a la campagne Spray Vitiligo (meme pixel que la landing pour dedup CAPI)
const META_PIXEL_ID = '1800280300964462';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const PRODUCT_CODE = 'CREME_VITILIGO';
const CONTENT_NAME = 'Spray Vitiligo';
const WHATSAPP_NUMBER = '2250707070707';
const WHATSAPP_MSG = 'Bonjour, je viens de commander le Spray Vitiligo et je voulais confirmer ma commande.';

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

export default function SprayVitiligoThankYou() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const qtyRaw = parseInt(params.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const value = PRICES[qty] || PRICES[1];

  const [now, setNow] = useState(() => new Date());
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`;

  useEffect(() => {
    document.title = 'Merci pour votre commande — Spray Vitiligo';
  }, []);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    initMetaPixel(META_PIXEL_ID);

    const sessionKey = ref ? `sv_purchase_${ref}` : '';
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
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#F3F7FB] via-white to-[#e0f2fe] text-slate-900 antialiased">
      {/* Top strip bleu */}
      <div className="bg-gradient-to-r from-[#063B8E] via-[#0B5ED7] to-[#063B8E] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.32em] text-white sm:text-[11px]">
        <span className="text-sky-200">Commande confirmée</span>
        <span className="mx-2 opacity-50">·</span>
        <span>Spray Vitiligo · Côte d'Ivoire</span>
      </div>

      <main className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
        {/* Halos bleus fond */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-sky-300/40 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-[480px] w-[480px] rounded-full bg-blue-400/25 blur-[120px]" />

        <div className="relative mx-auto w-full max-w-[640px]">
          {/* Card centrale */}
          <div className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(11,94,215,0.35)] ring-1 ring-sky-200 sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#38BDF8] via-[#0B5ED7] to-[#063B8E]" />

            {/* Pastille check bleue */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#38BDF8] via-[#0B5ED7] to-[#063B8E] shadow-[0_15px_40px_-10px_rgba(11,94,215,0.55)]">
              <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Titre */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.32em] text-[#063B8E] ring-1 ring-sky-200">
                Commande confirmée
              </span>
              <h1 className="mt-4 text-[28px] font-black leading-[1.05] tracking-tight text-slate-950 sm:text-[36px]">
                Merci pour votre <span className="bg-gradient-to-r from-[#063B8E] via-[#0B5ED7] to-[#38BDF8] bg-clip-text text-transparent">commande</span> !
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-700 sm:text-[15px]">
                Votre <strong className="font-bold text-slate-950">{CONTENT_NAME}</strong> a bien été reçu. Un conseiller vous contactera <strong className="font-bold text-slate-950">bientôt</strong> pour confirmer la livraison.
              </p>
            </div>

            {/* Recap commande bleu */}
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#063B8E] via-[#0B5ED7] to-[#063B8E] p-4 text-white ring-1 ring-sky-300/40">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-200">Quantité</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums">{qty} flacon{qty > 1 ? 's' : ''}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-sky-200/80">
                    Soin ciblé peau
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-200">Total estimé</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums text-sky-100">
                    {value.toLocaleString('fr-FR').replace(/,/g, ' ')} F
                  </p>
                </div>
              </div>
              {ref && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px]">
                  <span className="font-black uppercase tracking-[0.25em] text-sky-200/80">N° commande</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono font-bold text-white">{ref}</span>
                </div>
              )}
              <p className="mt-2 text-[10px] text-sky-200/70">
                Confirmée le {now.toLocaleDateString('fr-FR')} à {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Etapes suivantes */}
            <div className="mt-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.32em] text-[#0B5ED7]">Et maintenant ?</h2>
              <ol className="mt-3 space-y-3">
                {[
                  { n: '1', t: 'Confirmation par téléphone', d: 'Un conseiller vous rappelle dans les 30 minutes pour valider votre adresse.' },
                  { n: '2', t: 'Livraison rapide', d: "Votre spray arrive sous 24-48 h à Abidjan." },
                  { n: '3', t: 'Paiement à la livraison', d: 'Vous payez uniquement à la réception. Aucun risque.' },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3 rounded-xl bg-[#F3F7FB] p-3 ring-1 ring-sky-100">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#063B8E] to-[#0B5ED7] text-[13px] font-black text-white shadow-[0_5px_15px_-3px_rgba(11,94,215,0.5)] ring-1 ring-sky-300/40">
                      {s.n}
                    </div>
                    <div className="flex-1 leading-tight">
                      <p className="text-[13px] font-black text-slate-950">{s.t}</p>
                      <p className="mt-0.5 text-[12px] text-slate-600">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* CTA WhatsApp + retour boutique */}
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)] ring-2 ring-emerald-300/40 transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_-5px_rgba(16,185,129,0.7)]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                </svg>
                Contacter sur WhatsApp
              </a>
              <Link
                to="/spray-vitiligo"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#063B8E] via-[#0B5ED7] to-[#063B8E] px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_25px_-5px_rgba(11,94,215,0.5)] ring-2 ring-sky-300/40 transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_-5px_rgba(11,94,215,0.7)]"
              >
                Retour boutique
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-[#0B5ED7]/70">
            Spray Vitiligo · Soin ciblé peau · Côte d'Ivoire
          </p>
          <p className="mt-2 text-center text-[10px] italic text-slate-500">
            Les résultats peuvent varier selon les personnes.
          </p>
        </div>
      </main>
    </div>
  );
}
