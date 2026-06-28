/**

 * Page de remerciement — Chaussette de compression V2.

 * Slug : chaussette-compression-v2 · Mapping CHAUSSETTE_DE_COMPRESSION.

 *

 * Pixel Meta 1491294965321454 : Purchase browser + dedup CAPI via eventID purchase_<ref>.

 */

import { useEffect, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';



const META_PIXEL_ID = '1491294965321454';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

const PRODUCT_CODE = 'CHAUSSETTE_DE_COMPRESSION';

const CONTENT_NAME = 'Chaussette de compression';



declare global {

  interface Window { fbq?: (...args: any[]) => void; ttq?: any; dataLayer?: any[] }

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



export default function ChaussetteCompressionV2ThankYou() {

  const [params] = useSearchParams();

  const ref = params.get('ref') || '';

  const qtyRaw = parseInt(params.get('qty') || '1', 10);

  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;

  const value = orderTotal(PRICES, qty);

  const [now, setNow] = useState(() => new Date());



  useEffect(() => {

    document.title = 'Merci pour votre commande — Chaussette de compression';

  }, []);



  useEffect(() => {

    initMetaPixel(META_PIXEL_ID);



    const sessionKey = ref ? `cc2_purchase_${ref}` : '';

    if (sessionKey && sessionStorage.getItem(sessionKey)) return;



    window.fbq?.('track', 'PageView');



    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;



    const fire = () => {

      try {

        window.dataLayer = window.dataLayer || [];

        window.dataLayer.push({

          event: 'ThankYouPage',

          product: PRODUCT_CODE,

          value,

          currency: 'XOF',

          num_items: qty,

          order_id: ref || undefined,

        });

        window.fbq?.('track', 'Purchase', {

          content_name: CONTENT_NAME,

          content_ids: [PRODUCT_CODE],

          content_type: 'product',

          value,

          currency: 'XOF',

          num_items: qty,

          contents: [{ id: PRODUCT_CODE, quantity: qty }],

          order_id: ref || undefined,

        }, { eventID: eventId });

        if (typeof window.ttq?.track === 'function') {

          window.ttq.track('CompletePayment', { content_id: PRODUCT_CODE, value, currency: 'XOF', quantity: qty });

        }

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

    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#06122a] via-[#0a1f44] to-[#06122a] text-white antialiased" style={{ fontFamily: 'Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>

      <div className="bg-gradient-to-r from-[#06122a] via-[#0a1f44] to-[#06122a] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200 sm:text-[11px]">

        <span>Commande confirmée</span><span className="mx-2 opacity-50">·</span><span>Côte d'Ivoire</span>

      </div>



      <main className="relative overflow-hidden px-4 pb-16 pt-12 sm:pb-24 sm:pt-16">

        <div className="pointer-events-none absolute -right-24 -top-24 h-[460px] w-[460px] rounded-full bg-cyan-400/20 blur-[120px]" />

        <div className="pointer-events-none absolute -bottom-24 -left-24 h-[460px] w-[460px] rounded-full bg-sky-400/20 blur-[120px]" />



        <div className="relative mx-auto w-full max-w-[640px]">

          <div className="relative overflow-hidden rounded-[32px] border border-cyan-300/30 bg-gradient-to-b from-[#0a1f44]/70 to-[#06122a] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] sm:p-10">

            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-600" />



            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700 shadow-[0_15px_40px_-10px_rgba(8,145,178,.6)]">

              <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>

            </div>



            <div className="text-center">

              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-cyan-200 ring-1 ring-cyan-300/30">Commande confirmée</span>

              <h1 className="mt-4 text-[30px] font-black leading-[1.05] tracking-tight sm:text-[38px]">

                Merci pour votre <span className="bg-gradient-to-r from-cyan-200 to-sky-200 bg-clip-text text-transparent">commande</span> !

              </h1>

              <p className="mt-3 text-[14px] leading-relaxed text-cyan-100/85 sm:text-[15px]">

                Votre demande a bien été reçue. Notre équipe vous contactera <strong className="font-bold text-white">rapidement</strong> pour confirmer la livraison.

              </p>

            </div>



            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">

              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">Récapitulatif</p>

              <div className="mt-3 space-y-2 text-[13px]">

                <div className="flex items-center justify-between"><span className="text-cyan-100/60">Produit</span><span className="font-bold text-white">{CONTENT_NAME}</span></div>

                <div className="flex items-center justify-between"><span className="text-cyan-100/60">Quantité</span><span className="font-bold text-white">{qty} paire{qty > 1 ? 's' : ''}</span></div>

                <div className="flex items-center justify-between"><span className="text-cyan-100/60">Prix</span><span className="font-black text-cyan-200">{value.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ')} F</span></div>

                {ref && <div className="flex items-center justify-between border-t border-white/10 pt-2"><span className="text-cyan-100/60">N° commande</span><span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white">{ref}</span></div>}

                <p className="pt-1 text-[10px] text-cyan-100/40">Confirmée le {now.toLocaleDateString('fr-FR')} à {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>

              </div>

            </div>



            <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-3 text-center">

              <p className="text-[12px] font-bold text-cyan-100">📞 Gardez votre téléphone disponible, notre équipe peut vous appeler rapidement.</p>

            </div>



            <div className="mt-6 grid grid-cols-3 gap-2 text-[10px]">

              {[{ i: '📞', t: 'Appel sous 30 min' }, { i: '🚚', t: 'Livraison rapide' }, { i: '💵', t: 'Paiement à la livraison' }].map((b) => (

                <div key={b.t} className="flex flex-col items-center gap-1 rounded-lg bg-white/5 px-2 py-2 font-bold text-cyan-100/80"><span className="text-base">{b.i}</span><span className="text-center">{b.t}</span></div>

              ))}

            </div>



            <div className="mt-6 flex flex-col gap-2 sm:flex-row">

              <Link to="/chaussette-compression-v2" className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-center text-[12px] font-black uppercase tracking-wider text-white transition hover:bg-white/10">Retour au produit</Link>

              <Link to="/boutique" className="flex-1 rounded-full bg-gradient-to-r from-cyan-300 via-sky-500 to-blue-700 px-5 py-3 text-center text-[12px] font-black uppercase tracking-wider text-white shadow-lg transition hover:scale-[1.02]">Retour à la boutique</Link>

            </div>

          </div>

        </div>

      </main>

    </div>

  );

}


