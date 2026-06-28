/**
 * Page merci — Boxers Homme de Luxe (slug : coffret-boxer-luxe-v3)
 *
 * Affichee apres POST reussi sur /coffret-versace/order.php.
 * Recupere le contexte commande via query params (?ref,?product,?qty) + sessionStorage.
 * Pixel Meta 1674022793901764 : Purchase avec eventID = purchase_<ref> (anti double-fire).
 * Palette assortie a la landing : noir + orange + bleu ciel + bleu roi.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';

const SLUG = 'coffret-boxer-luxe-v3';
const META_PIXEL_ID = '1674022793901764';
const PRODUCT_CODE = 'COFFRET_BOXER_LUXE_V3';
const PRODUCT_NAME = 'Boxers Homme de Luxe';

type Stored = {
  ref?: string;
  productKey?: 'noir' | 'pro' | 'both';
  productLabel?: string;
  productSub?: string;
  qty?: number;
  total?: number;
  nom?: string;
  tel?: string;
  commune?: string;
  ts?: number;
};

const FALLBACK_LABELS: Record<string, { label: string; sub: string }> = {
  noir: { label: 'Coffret Élégance Noir — 3 boxers', sub: '3 boxers premium' },
  pro: { label: 'Coffret Pack Pro Luxe — 3 boxers', sub: '3 boxers Pack Pro' },
  both: { label: 'Les 2 coffrets (6 boxers)', sub: '6 boxers premium' },
};
const FALLBACK_PRICES: Record<string, number> = { noir: 9900, pro: 9900, both: 16900 };

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

function initPixelForPage(pixelId: string): void {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export default function CoffretBoxerLuxeV3ThankYou() {
  const [params] = useSearchParams();
  const [stored, setStored] = useState<Stored | null>(null);
  const purchaseFired = useRef(false);

  useEffect(() => {
    document.title = 'Merci — Commande reçue | Boxers Homme de Luxe';
    try {
      const raw = sessionStorage.getItem('bxl_last_order');
      if (raw) setStored(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  const ctx = useMemo(() => {
    const ref = params.get('ref') || stored?.ref || '';
    const productKey = (params.get('product') || stored?.productKey || 'noir') as 'noir' | 'pro' | 'both';
    const qty = Number(params.get('qty') || stored?.qty || 1);
    const fallback = FALLBACK_LABELS[productKey] || FALLBACK_LABELS.noir;
    const productLabel = stored?.productLabel || fallback.label;
    const total = stored?.total ?? FALLBACK_PRICES[productKey] * qty;
    return { ref, productKey, productLabel, qty, total };
  }, [params, stored]);

  const totalFmt = ctx.total.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ') + ' FCFA';

  useEffect(() => {
    if (purchaseFired.current) return;
    purchaseFired.current = true;
    const ref = ctx.ref;
    const sessionKey = ref ? `bxl_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;
    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;
    const firePurchase = () => {
      try {
        initPixelForPage(META_PIXEL_ID);
        window.fbq?.('track', 'Purchase', {
          content_name: PRODUCT_NAME, content_ids: [PRODUCT_CODE], content_type: 'product',
          value: ctx.total, currency: 'XOF', num_items: ctx.qty,
        }, { eventID: eventId });
        if (sessionKey) sessionStorage.setItem(sessionKey, '1');
      } catch (e) { console.warn('[CoffretBoxerLuxeV3ThankYou] Purchase non bloquant:', e); }
    };
    if (window.fbq) firePurchase();
    else setTimeout(firePurchase, 750);
  }, [ctx.ref, ctx.total, ctx.qty]);

  return (
    <div className="bxl-thx-root">
      <style>{`
        .bxl-thx-root { font-family: system-ui,-apple-system,Segoe UI,sans-serif; color: #e2e8f0; background: #050508; min-height: 100vh; }
        .bxl-thx-bg { position: absolute; inset: 0; background:
          radial-gradient(80% 60% at 15% 10%, rgba(249,115,22,0.2), transparent 60%),
          radial-gradient(70% 60% at 90% 20%, rgba(56,189,248,0.18), transparent 60%),
          radial-gradient(80% 90% at 50% 110%, rgba(37,99,235,0.22), transparent 70%),
          linear-gradient(180deg, #0a0a12 0%, #050508 100%); }
        .bxl-thx-wrap { position: relative; z-index: 1; max-width: 540px; margin: 0 auto; padding: 40px 18px 60px; }
        .bxl-thx-card { position: relative; overflow: hidden; border-radius: 28px; background: rgba(15,23,42,0.75); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(249,115,22,0.28); box-shadow: 0 30px 80px -30px rgba(0,0,0,0.85); padding: 34px 22px 28px; text-align: center; animation: bxl-thx-up .6s ease-out both; }
        .bxl-thx-check { margin: 0 auto 16px; width: 78px; height: 78px; border-radius: 999px; display: grid; place-items: center; background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 10px 30px -10px rgba(16,185,129,0.6), 0 0 0 6px rgba(16,185,129,0.12); animation: bxl-thx-pop .5s cubic-bezier(.34,1.56,.64,1) both; }
        .bxl-thx-check svg { width: 40px; height: 40px; color: #fff; }
        .bxl-thx-grad { background: linear-gradient(120deg, #fb923c, #38bdf8, #2563eb); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .bxl-thx-title { margin: 8px 0 0; font-size: 28px; font-weight: 900; color: #fff; line-height: 1.1; }
        .bxl-thx-sub { margin: 12px 0 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1; }
        .bxl-thx-sub strong { color: #fb923c; font-weight: 700; }
        .bxl-thx-recap { margin: 22px 0 0; padding: 16px; border-radius: 18px; background: rgba(249,115,22,0.08); border: 1px solid rgba(56,189,248,0.22); text-align: left; }
        .bxl-thx-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; font-size: 13.5px; border-bottom: 1px dashed rgba(255,255,255,0.08); }
        .bxl-thx-row:last-child { border-bottom: 0; }
        .bxl-thx-k { color: #94a3b8; font-weight: 600; }
        .bxl-thx-v { color: #f1f5f9; font-weight: 700; text-align: right; }
        .bxl-thx-amount { color: #fb923c; font-size: 19px; font-weight: 900; }
        .bxl-thx-steps { list-style: none; margin: 22px 0 0; padding: 0; text-align: left; display: grid; gap: 10px; }
        .bxl-thx-steps li { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); }
        .bxl-thx-num { flex-shrink: 0; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 999px; background: linear-gradient(135deg, #fb923c, #2563eb); color: #fff; font-weight: 900; font-size: 14px; }
        .bxl-thx-steps strong { display: block; color: #f1f5f9; font-size: 13.5px; font-weight: 800; }
        .bxl-thx-steps span { display: block; color: #94a3b8; font-size: 12px; margin-top: 1px; }
        .bxl-thx-cta { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 999px; background: linear-gradient(120deg, #fb923c, #2563eb); color: #fff; font-weight: 900; font-size: 14px; text-decoration: none; box-shadow: 0 18px 40px -12px rgba(249,115,22,0.45); transition: transform .25s; }
        .bxl-thx-cta:hover { transform: translateY(-2px); }
        .bxl-thx-trust { list-style: none; margin: 24px 0 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 12px; }
        .bxl-thx-trust li { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; font-size: 12px; font-weight: 700; }
        @keyframes bxl-thx-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: none } }
        @keyframes bxl-thx-pop { 0% { opacity: 0; transform: scale(.5) } 100% { opacity: 1; transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) { .bxl-thx-card,.bxl-thx-check { animation: none !important } }
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        <div className="bxl-thx-bg" aria-hidden />
        <main className="bxl-thx-wrap">
          <article className="bxl-thx-card">
            <div className="bxl-thx-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h1 className="bxl-thx-title"><span className="bxl-thx-grad">Commande envoyée</span> ✓</h1>
            <p className="bxl-thx-sub">
              Merci{stored?.nom ? <> <strong>{stored.nom}</strong></> : ''} ! Votre commande est bien reçue.
              <br /><strong>Notre équipe vous appelle dans quelques minutes</strong> pour confirmer la livraison.
            </p>

            <div className="bxl-thx-recap">
              <div className="bxl-thx-row"><span className="bxl-thx-k">Produit</span><span className="bxl-thx-v">{ctx.productLabel}</span></div>
              <div className="bxl-thx-row"><span className="bxl-thx-k">Quantité</span><span className="bxl-thx-v">{ctx.qty} {ctx.qty > 1 ? 'coffrets' : 'coffret'}</span></div>
              {stored?.commune && <div className="bxl-thx-row"><span className="bxl-thx-k">Livraison</span><span className="bxl-thx-v">{stored.commune}</span></div>}
              {stored?.tel && <div className="bxl-thx-row"><span className="bxl-thx-k">Téléphone</span><span className="bxl-thx-v">{stored.tel}</span></div>}
              <div className="bxl-thx-row"><span className="bxl-thx-k">Prix estimé</span><span className="bxl-thx-v bxl-thx-amount">{totalFmt}</span></div>
              {ctx.ref && <p className="mt-2 text-center text-[11px] text-slate-500">Réf. : <code className="rounded bg-black/30 px-2 py-0.5">{ctx.ref}</code></p>}
            </div>

            <ol className="bxl-thx-steps">
              <li><span className="bxl-thx-num">1</span><div><strong>Appel de confirmation</strong><span>Sous quelques minutes</span></div></li>
              <li><span className="bxl-thx-num">2</span><div><strong>Préparation et livraison</strong><span>Express partout en Côte d`Ivoire</span></div></li>
              <li><span className="bxl-thx-num">3</span><div><strong>Paiement à la livraison</strong><span>En cash, à la réception du coffret</span></div></li>
            </ol>

            <div className="mt-6">
              <Link to={`/${SLUG}`} className="bxl-thx-cta">Retour à la boutique
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <p className="mt-4 text-[11px] text-slate-500">Vous n'avez rien reçu après quelques minutes ? Vérifiez votre numéro et recontactez-nous.</p>
          </article>

          <ul className="bxl-thx-trust">
            <li><span className="text-orange-400">✦</span> Paiement à la livraison</li>
            <li><span className="text-emerald-400">✦</span> Livraison gratuite CI</li>
            <li><span className="text-orange-400">✦</span> 3 boxers premium</li>
          </ul>
        </main>
      </div>
    </div>
  );
}
