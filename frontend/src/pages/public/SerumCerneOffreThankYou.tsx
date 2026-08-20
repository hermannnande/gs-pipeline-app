/**
 * Page merci DEDIEE — serum-cerne-offre (violet nuit / or rose / ivoire).
 * Landing retargeting Meta -20% : prix 7 900 / 13 900 / 18 900 F.
 *
 * Pixels Meta (quadruple tracking) :
 *   - 26809431761984777 (principal)
 *   - 1313100454309806 (campagne)
 *   - 2511991909304152 (campagne additionnelle)
 *   - 1973354584052136 (pixel achat additionnel — ne jamais retirer les precedents)
 * Purchase browser (trackSingle sur chaque pixel) + CAPI dedup (eventID purchase_<ref>)
 * via POST /public/track-purchase (pixelIds dans le body).
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { orderTotal } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const LANDING_SLUG = 'serum-cerne-offre';
const META_PIXEL_IDS = ['26809431761984777', '1313100454309806', '2511991909304152', '1973354584052136'];
const PRODUCT_CODE = 'SERUM_CERNE_OFFRE';
const PRODUCT_NAME = 'Serum Anti-Cernes Premium (Offre -20%)';
const PRICES: Record<number, number> = { 1: 7900, 2: 13900, 3: 18900 };

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

const initedMetaPixels = new Set<string>();

function ensureFbqBase(): void {
  if (window.fbq) return;
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  `;
  document.head.appendChild(script);
}

function initMetaPixels(pixelIds: string[]): void {
  const ids = [...new Set(pixelIds.filter(Boolean))];
  if (!ids.length) return;
  ensureFbqBase();
  let added = false;
  for (const id of ids) {
    if (initedMetaPixels.has(id)) continue;
    window.fbq?.('init', id);
    initedMetaPixels.add(id);
    added = true;
  }
  if (added) {
    for (const id of ids) {
      window.fbq?.('trackSingle', id, 'PageView');
    }
  }
}

function firePurchaseOnPixels(pixelIds: string[], payload: Record<string, unknown>, opts: { eventID: string }) {
  for (const pixelId of pixelIds) {
    window.fbq?.('trackSingle', pixelId, 'Purchase', payload, opts);
  }
}

export default function SerumCerneOffreThankYou() {
  const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';
  const qtyRaw = parseInt(q.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const value = orderTotal(PRICES, qty);
  const purchaseFired = useRef(false);

  useEffect(() => { document.title = 'Merci — Serum Anti-Cernes (Offre -20%)'; }, []);

  useEffect(() => {
    if (purchaseFired.current) return;

    const sessionKey = ref ? `sco_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    purchaseFired.current = true;

    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;

    const purchasePayload = {
      content_name: PRODUCT_NAME,
      content_ids: [PRODUCT_CODE],
      content_type: 'product',
      value,
      currency: 'XOF',
      num_items: qty,
      contents: [{ id: PRODUCT_CODE, quantity: qty }],
      order_id: ref || undefined,
    };
    const purchaseOpts = { eventID: eventId };

    const fire = () => {
      try {
        initMetaPixels(META_PIXEL_IDS);
        firePurchaseOnPixels(META_PIXEL_IDS, purchasePayload, purchaseOpts);
        if (sessionKey) sessionStorage.setItem(sessionKey, '1');
      } catch (e) {
        console.warn('[SerumCerneOffreThankYou] Purchase non bloquant:', e);
      }
    };

    if (window.fbq) fire();
    else setTimeout(fire, 800);

    if (ref) {
      const fbc = document.cookie.split('; ').find(c => c.startsWith('_fbc='))?.split('=')[1] || null;
      const fbp = document.cookie.split('; ').find(c => c.startsWith('_fbp='))?.split('=')[1] || null;
      axios.post(`${API_URL}/public/track-purchase`, {
        ref,
        slug: LANDING_SLUG,
        company,
        pixelIds: META_PIXEL_IDS,
        sourceUrl: window.location.href,
        fbc,
        fbp,
      }).catch(() => {});
    }
  }, [ref, company, qty, value]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf8f5] antialiased" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
      <div className="bg-gradient-to-r from-[#180a2e] via-[#241040] to-[#180a2e] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white sm:text-[11px]">
        <span className="text-[#f0c6c9]">Commande confirmée · Offre -20% appliquée</span>
        <span className="mx-2 opacity-50">·</span>
        <span>O&apos;BRILLE · Côte d&apos;Ivoire</span>
      </div>

      <main className="relative overflow-hidden px-4 pb-16 pt-12 sm:pb-24 sm:pt-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[460px] w-[460px] rounded-full bg-[#e8b4b8]/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-[460px] w-[460px] rounded-full bg-[#f0c6c9]/20 blur-[120px]" />

        <div className="relative mx-auto w-full max-w-[640px]">
          <div className="relative overflow-hidden rounded-[32px] border border-[#e8b4b8]/30 bg-white p-6 shadow-[0_30px_80px_-20px_rgba(24,10,46,.25)] sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c9848e] via-[#f0c6c9] to-[#b76e79]" />

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#180a2e] via-[#241040] to-[#37205a] shadow-[0_15px_40px_-10px_rgba(24,10,46,.6)] ring-2 ring-[#e8b4b8]/40">
              <svg className="h-9 w-9 text-[#f0c6c9]" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf6f7] px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-[#a4636e] ring-1 ring-[#f7dbdd]">
                Commande confirmée
              </span>
              <h1 className="mt-4 text-[30px] font-black leading-[1.05] tracking-tight text-[#241040] sm:text-[38px]">
                Merci pour votre <span className="bg-gradient-to-r from-[#b76e79] via-[#e8b4b8] to-[#b76e79] bg-clip-text text-transparent">commande</span> !
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-[#5b4a6e] sm:text-[15px]">
                Votre <strong className="font-bold text-[#241040]">{PRODUCT_NAME}</strong> est enregistré. Notre équipe vous appelle{' '}
                <strong className="font-bold text-[#241040]">sous 30 minutes</strong> pour confirmer la livraison.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#180a2e] via-[#241040] to-[#37205a] p-4 text-white ring-1 ring-[#e8b4b8]/25">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#f0c6c9]">Quantité</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums">{qty} flacon{qty > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#f0c6c9]">Total</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums text-[#f0c6c9]">
                    {fmtTotal(qty)} F
                  </p>
                </div>
              </div>
              {ref && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px]">
                  <span className="font-black uppercase tracking-[0.25em] text-[#f0c6c9]/80">N° commande</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono font-bold text-white">{ref.slice(0, 12).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-[#f7dbdd]/60 bg-[#fdf6f7]/50 p-3 text-center">
              <p className="text-[12px] font-bold text-[#96555f]">📞 Gardez votre téléphone disponible — confirmation rapide par appel.</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-[10px]">
              {[
                { i: '📞', t: 'Confirmation' },
                { i: '🚚', t: 'Livraison 24-48h' },
                { i: '💵', t: 'Paiement livraison' },
              ].map((b) => (
                <div key={b.t} className="flex flex-col items-center gap-1 rounded-lg bg-[#f9f5fa] px-2 py-2 font-bold text-[#4a2c74] ring-1 ring-[#e9ddf0]">
                  <span className="text-base">{b.i}</span>
                  <span className="text-center">{b.t}</span>
                </div>
              ))}
            </div>

            <Link
              to={`/${LANDING_SLUG}?company=${company}`}
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#180a2e] via-[#241040] to-[#180a2e] px-5 py-3.5 text-[13px] font-black uppercase tracking-wider text-[#f0c6c9] shadow-lg ring-1 ring-[#e8b4b8]/30 transition hover:scale-[1.01]"
            >
              Retour à la page produit
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
