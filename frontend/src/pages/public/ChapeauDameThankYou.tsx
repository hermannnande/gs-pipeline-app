/**
 * Page merci — Chapeau Élégant Dame (slug : chapeau-dame, mapping CHEAPEAU_DAME).
 * Affichée après POST réussi sur /api/public/order. Palette mode : rouge/bleu ciel/blanc.
 * Récap commande via query params (?ref,?qty,?color) + sessionStorage.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';

const SLUG = 'chapeau-dame';
const META_PIXEL_ID = '1312638417153297';
const PRODUCT_CODE = 'CHEAPEAU_DAME';
const PRODUCT_NAME = 'Chapeau Élégant Dame';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

type Stored = { ref?: string; color?: string; qty?: number; total?: number; name?: string; phone?: string; city?: string; ts?: number };

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

function initPixelForPage(pixelId: string): void {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export default function ChapeauDameThankYou() {
  const [params] = useSearchParams();
  const [stored, setStored] = useState<Stored | null>(null);
  const purchaseFired = useRef(false);

  useEffect(() => {
    document.title = 'Merci — Commande reçue | Chapeau Élégant Dame';
    try { const raw = sessionStorage.getItem('cd_last_order'); if (raw) setStored(JSON.parse(raw)); } catch { /* noop */ }
  }, []);

  const ctx = useMemo(() => {
    const ref = params.get('ref') || stored?.ref || '';
    const color = params.get('color') || stored?.color || '';
    const qtyRaw = Number(params.get('qty') || stored?.qty || 1);
    const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
    const total = stored?.total ?? PRICES[qty] ?? PRICES[1];
    return { ref, color, qty, total };
  }, [params, stored]);

  const totalFmt = ctx.total.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ') + ' FR';

  // Pixel Meta : PageView au mount + Purchase dédupliqué (eventID = purchase_<ref>)
  useEffect(() => {
    if (purchaseFired.current) return;
    purchaseFired.current = true;
    const ref = ctx.ref;
    const sessionKey = ref ? `cd_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) { initPixelForPage(META_PIXEL_ID); return; }
    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;
    const firePurchase = () => {
      try {
        initPixelForPage(META_PIXEL_ID);
        window.fbq?.('track', 'Purchase', {
          content_name: PRODUCT_NAME, content_ids: [PRODUCT_CODE], content_type: 'product',
          value: ctx.total, currency: 'XOF', num_items: ctx.qty,
        }, { eventID: eventId });
        if (sessionKey) sessionStorage.setItem(sessionKey, '1');
      } catch (e) { console.warn('[ChapeauDameThankYou] Purchase non bloquant:', e); }
    };
    if (window.fbq) firePurchase(); else setTimeout(firePurchase, 700);
  }, [ctx.ref, ctx.total, ctx.qty]);

  return (
    <div className="cdthx-root">
      <style>{`
        .cdthx-root { font-family: Outfit,system-ui,-apple-system,Segoe UI,sans-serif; color: #1e293b; background: #fff; min-height: 100vh; }
        .cdthx-bg { position: absolute; inset: 0; background:
          radial-gradient(70% 50% at 15% 8%, rgba(244,63,94,0.12), transparent 60%),
          radial-gradient(60% 50% at 90% 18%, rgba(56,189,248,0.14), transparent 60%),
          linear-gradient(180deg, #fff5f7 0%, #ffffff 55%, #f0f9ff 100%); }
        .cdthx-wrap { position: relative; z-index: 1; max-width: 520px; margin: 0 auto; padding: 44px 18px 60px; }
        .cdthx-card { position: relative; overflow: hidden; border-radius: 28px; background: #fff; border: 1px solid rgba(244,63,94,0.18); box-shadow: 0 30px 80px -34px rgba(15,23,42,0.4); padding: 34px 22px 28px; text-align: center; animation: cdthx-up .6s ease-out both; }
        .cdthx-check { margin: 0 auto 16px; width: 78px; height: 78px; border-radius: 999px; display: grid; place-items: center; background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 10px 30px -10px rgba(16,185,129,0.55); animation: cdthx-pop .5s cubic-bezier(.34,1.56,.64,1) both; }
        .cdthx-check svg { width: 40px; height: 40px; color: #fff; }
        .cdthx-grad { background: linear-gradient(120deg, #dc2626, #f43f5e, #38bdf8); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .cdthx-title { margin: 8px 0 0; font-size: 27px; font-weight: 900; color: #0f172a; line-height: 1.1; }
        .cdthx-sub { margin: 12px 0 0; font-size: 14.5px; line-height: 1.6; color: #475569; }
        .cdthx-sub strong { color: #dc2626; font-weight: 700; }
        .cdthx-recap { margin: 22px 0 0; padding: 16px; border-radius: 18px; background: linear-gradient(135deg, #fff1f2, #f0f9ff); border: 1px solid rgba(244,63,94,0.18); text-align: left; }
        .cdthx-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; font-size: 13.5px; border-bottom: 1px dashed rgba(15,23,42,0.08); }
        .cdthx-row:last-child { border-bottom: 0; }
        .cdthx-k { color: #64748b; font-weight: 600; }
        .cdthx-v { color: #0f172a; font-weight: 700; text-align: right; }
        .cdthx-amount { color: #dc2626; font-size: 19px; font-weight: 900; }
        .cdthx-steps { list-style: none; margin: 22px 0 0; padding: 0; text-align: left; display: grid; gap: 10px; }
        .cdthx-steps li { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 14px; background: #f8fafc; border: 1px solid #eef2f7; }
        .cdthx-num { flex-shrink: 0; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 999px; background: linear-gradient(135deg, #dc2626, #38bdf8); color: #fff; font-weight: 900; font-size: 14px; }
        .cdthx-steps strong { display: block; color: #0f172a; font-size: 13.5px; font-weight: 800; }
        .cdthx-steps span { display: block; color: #64748b; font-size: 12px; margin-top: 1px; }
        .cdthx-cta { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 999px; background: linear-gradient(120deg, #dc2626, #f43f5e); color: #fff; font-weight: 900; font-size: 14px; text-decoration: none; box-shadow: 0 18px 40px -12px rgba(220,38,38,0.45); transition: transform .25s; }
        .cdthx-cta:hover { transform: translateY(-2px); }
        .cdthx-trust { list-style: none; margin: 24px 0 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 12px; }
        .cdthx-trust li { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: #f8fafc; border: 1px solid #eef2f7; color: #475569; font-size: 12px; font-weight: 700; }
        @keyframes cdthx-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: none } }
        @keyframes cdthx-pop { 0% { opacity: 0; transform: scale(.5) } 100% { opacity: 1; transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) { .cdthx-card,.cdthx-check { animation: none !important } }
      `}</style>
      <div className="relative min-h-screen overflow-hidden">
        <div className="cdthx-bg" aria-hidden />
        <main className="cdthx-wrap">
          <article className="cdthx-card">
            <div className="cdthx-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <h1 className="cdthx-title"><span className="cdthx-grad">Commande envoyée</span> ✓</h1>
            <p className="cdthx-sub">
              Merci{stored?.name ? <> <strong>{stored.name}</strong></> : ''} ! Votre commande est bien reçue.
              <br /><strong>Notre équipe vous appelle dans quelques minutes</strong> pour confirmer la livraison.
            </p>
            <div className="cdthx-recap">
              <div className="cdthx-row"><span className="cdthx-k">Produit</span><span className="cdthx-v">Chapeau Élégant Dame</span></div>
              {ctx.color && <div className="cdthx-row"><span className="cdthx-k">Couleur</span><span className="cdthx-v">{ctx.color}</span></div>}
              <div className="cdthx-row"><span className="cdthx-k">Quantité</span><span className="cdthx-v">{ctx.qty} {ctx.qty > 1 ? 'chapeaux' : 'chapeau'}</span></div>
              {stored?.city && <div className="cdthx-row"><span className="cdthx-k">Livraison</span><span className="cdthx-v">{stored.city}</span></div>}
              {stored?.phone && <div className="cdthx-row"><span className="cdthx-k">Téléphone</span><span className="cdthx-v">{stored.phone}</span></div>}
              <div className="cdthx-row"><span className="cdthx-k">Total</span><span className="cdthx-v cdthx-amount">{totalFmt}</span></div>
              {ctx.ref && <p style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>Réf. : <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{ctx.ref}</code></p>}
            </div>
            <ol className="cdthx-steps">
              <li><span className="cdthx-num">1</span><div><strong>Appel de confirmation</strong><span>Sous quelques minutes</span></div></li>
              <li><span className="cdthx-num">2</span><div><strong>Préparation et livraison</strong><span>Rapide partout en Côte d`Ivoire</span></div></li>
              <li><span className="cdthx-num">3</span><div><strong>Paiement à la livraison</strong><span>En cash, à la réception</span></div></li>
            </ol>
            <div style={{ marginTop: 24 }}><Link to={`/${SLUG}`} className="cdthx-cta">Retour à la boutique
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg></Link></div>
            <p style={{ marginTop: 16, fontSize: 11.5, color: '#94a3b8' }}>Vous n'avez rien reçu après quelques minutes ? Vérifiez votre numéro et recontactez-nous.</p>
          </article>
          <ul className="cdthx-trust">
            <li><span style={{ color: '#dc2626' }}>✦</span> Paiement à la livraison</li>
            <li><span style={{ color: '#0ea5e9' }}>✦</span> Plusieurs couleurs</li>
            <li><span style={{ color: '#dc2626' }}>✦</span> Livraison rapide CI</li>
          </ul>
        </main>
      </div>
    </div>
  );
}
