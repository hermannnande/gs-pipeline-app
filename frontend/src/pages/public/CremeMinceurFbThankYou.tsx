/**
 * Page merci — crememinceurfb (rose/noir/jaune).
 * Pixels Meta (double tracking) :
 *   - 1491294965321454 (principal)
 *   - 1313100454309806 (campagne — Purchase explicite via trackSingle)
 * Purchase browser + CAPI dedup (eventID purchase_<ref>).
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const META_PIXEL_ID = '1491294965321454';
const META_PIXEL_ID_2 = '1313100454309806';
/** Campagne en premier pour garantir l'optimisation Purchase sur 1313100454309806. */
const META_PIXEL_IDS = [META_PIXEL_ID_2, META_PIXEL_ID];
const TEMPLATE_SLUG = 'crememinceurfb';
const PRODUCT_CODE = 'CREME_MINCEUR';
const PRODUCT_NAME = 'Crème Minceur Brûle Graisse';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

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

export default function CremeMinceurFbThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';
  const qtyRaw = parseInt(q.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const purchaseFired = useRef(false);

  useEffect(() => { document.title = 'Merci — Crème Minceur'; }, []);

  useEffect(() => {
    if (purchaseFired.current) return;

    const sessionKey = ref ? `cmf_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    purchaseFired.current = true;

    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;
    const value = orderTotal(PRICES, qty);

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
        console.warn('[CremeMinceurFbThankYou] Purchase non bloquant:', e);
      }
    };

    if (window.fbq) fire();
    else setTimeout(fire, 800);

    if (ref) {
      const fbc = document.cookie.split('; ').find(c => c.startsWith('_fbc='))?.split('=')[1] || null;
      const fbp = document.cookie.split('; ').find(c => c.startsWith('_fbp='))?.split('=')[1] || null;
      axios.post(`${API_URL}/public/track-purchase`, {
        ref,
        slug: TEMPLATE_SLUG,
        company,
        pixelIds: META_PIXEL_IDS,
        sourceUrl: window.location.href,
        fbc,
        fbp,
      }).catch(() => {});
    }
  }, [ref, company, qty]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 px-4 py-12 text-center" style={{ fontFamily: 'system-ui,sans-serif' }}>
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-rose-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-3xl text-white shadow-lg">✓</div>
        <h1 className="mt-5 text-2xl font-black text-neutral-900">Commande confirmée !</h1>
        <p className="mt-2 text-[15px] font-semibold text-rose-600">Merci pour votre confiance 💕</p>
        <p className="mt-4 text-[14px] leading-relaxed text-neutral-600">
          Notre équipe vous appelle sous <strong>24-48 h</strong> pour confirmer la livraison.
          Paiement à la réception.
        </p>
        {ref && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-mono text-rose-700">Réf. {ref.slice(0, 18)}…</p>}
        <Link to={`/crememinceurfb?company=${company}`}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 py-3.5 text-[14px] font-black uppercase tracking-wide text-white shadow-lg">
          Retour à la page
        </Link>
      </div>
    </div>
  );
}
