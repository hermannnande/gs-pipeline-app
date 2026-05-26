/**
 * Page merci dediee — Coffret Boxer Homme.
 *
 * Affichee apres POST reussi sur /coffret-versace/order.php.
 * Recupere le contexte commande depuis :
 *   - les query params (?ref, ?product, ?qty)
 *   - sessionStorage 'cbh_last_order' (rempli par la modal avant redirect)
 *
 * Meta Pixel 26809431761984777 :
 *   - PageView au mount
 *   - Purchase avec eventID = purchase_<ref> (anti double-fire au refresh)
 *
 * Design aligne sur la landing : bleu nuit + or + cuivre + glassmorphism.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const SLUG = 'coffret-boxer-homme';
const META_PIXEL_ID = '26809431761984777';
const PRODUCT_CODE = 'COFFRET_BOXER_HOMME';
const PRODUCT_NAME = 'Coffrets Boxers Homme Premium';

type Stored = {
  ref?: string;
  productKey?: 'tommy' | 'luxe' | 'both';
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
  tommy: { label: 'Coffret de 3 boxers Tommy Hilfiger', sub: '3 boxers Tommy Hilfiger' },
  luxe: { label: 'Coffret de 3 boxers Louis Vuitton', sub: '3 boxers Louis Vuitton' },
  both: { label: 'Les deux coffrets (6 boxers)', sub: '6 boxers (Tommy + Louis Vuitton)' },
};

const FALLBACK_PRICES: Record<string, number> = { tommy: 9900, luxe: 9900, both: 19800 };

export default function CoffretBoxerThankYou() {
  const [params] = useSearchParams();
  const [stored, setStored] = useState<Stored | null>(null);

  useEffect(() => {
    document.title = 'Merci — Commande reçue | Coffret Boxer Homme';
    try {
      const raw = sessionStorage.getItem('cbh_last_order');
      if (raw) setStored(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  const ctx = useMemo(() => {
    const ref = params.get('ref') || stored?.ref || '';
    const productKey = (params.get('product') || stored?.productKey || 'tommy') as 'tommy' | 'luxe' | 'both';
    const qty = Number(params.get('qty') || stored?.qty || 1);
    const fallback = FALLBACK_LABELS[productKey] || FALLBACK_LABELS.tommy;
    const productLabel = stored?.productLabel || fallback.label;
    const productSub = stored?.productSub || fallback.sub;
    const total = stored?.total ?? FALLBACK_PRICES[productKey] * qty;
    return { ref, productKey, productLabel, productSub, qty, total };
  }, [params, stored]);

  const totalFmt = ctx.total.toLocaleString('fr-FR') + ' FCFA';

  useEffect(() => {
    if (purchaseFired.current) return;
    purchaseFired.current = true;

    const ref = ctx.ref;
    const sessionKey = ref ? `cbh_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;
    const value = ctx.total;

    const firePurchase = () => {
      try {
        initPixelForPage(META_PIXEL_ID);
        window.fbq?.('track', 'Purchase', {
          content_name: PRODUCT_NAME,
          content_ids: [PRODUCT_CODE],
          content_type: 'product',
          value,
          currency: 'XOF',
          num_items: ctx.qty,
        }, { eventID: eventId });
        if (sessionKey) sessionStorage.setItem(sessionKey, '1');
      } catch (e) {
        console.warn('[CoffretBoxerThankYou] Purchase non bloquant:', e);
      }
    };

    if (window.fbq) firePurchase();
    else setTimeout(firePurchase, 750);
  }, [ctx.ref, ctx.total, ctx.qty]);

  return (
    <div className="cbh-thx-root">
      <Style />

      <div className="cbh-thx-hero">
        <div className="cbh-thx-bg" aria-hidden />
        <div className="cbh-thx-grain" aria-hidden />

        <main className="cbh-thx-wrap">
          {/* Carte principale glass */}
          <article className="cbh-thx-card">
            {/* Halo doré */}
            <div className="cbh-thx-halo" aria-hidden />

            <div className="cbh-thx-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h1 className="cbh-thx-title">
              <span className="cbh-thx-grad">Commande envoyée</span>
              <span className="cbh-thx-emoji"> ✓</span>
            </h1>

            <p className="cbh-thx-sub">
              Merci{stored?.nom ? <> <strong>{stored.nom}</strong></> : ''} ! Votre commande est bien reçue.
              <br />
              <strong>Notre équipe vous appelle dans quelques minutes</strong> pour confirmer la livraison.
            </p>

            {/* Recap */}
            <div className="cbh-thx-recap">
              <div className="cbh-thx-row">
                <span className="cbh-thx-k">Produit</span>
                <span className="cbh-thx-v">{ctx.productLabel}</span>
              </div>
              <div className="cbh-thx-row">
                <span className="cbh-thx-k">Quantité</span>
                <span className="cbh-thx-v">{ctx.qty} {ctx.qty > 1 ? 'coffrets' : 'coffret'}</span>
              </div>
              {stored?.commune && (
                <div className="cbh-thx-row">
                  <span className="cbh-thx-k">Livraison</span>
                  <span className="cbh-thx-v">{stored.commune}</span>
                </div>
              )}
              {stored?.tel && (
                <div className="cbh-thx-row">
                  <span className="cbh-thx-k">Téléphone</span>
                  <span className="cbh-thx-v cbh-thx-mono">{stored.tel}</span>
                </div>
              )}
              <div className="cbh-thx-row cbh-thx-total">
                <span className="cbh-thx-k">Prix estimé</span>
                <span className="cbh-thx-v cbh-thx-amount">{totalFmt}</span>
              </div>
              {ctx.ref && (
                <div className="cbh-thx-ref">
                  Réf. commande : <code>{ctx.ref}</code>
                </div>
              )}
            </div>

            {/* Étapes */}
            <ol className="cbh-thx-steps">
              <li>
                <span className="cbh-thx-num">1</span>
                <div>
                  <strong>Appel de confirmation</strong>
                  <span>Sous quelques minutes</span>
                </div>
              </li>
              <li>
                <span className="cbh-thx-num">2</span>
                <div>
                  <strong>Préparation et livraison</strong>
                  <span>Express partout en Côte d'Ivoire</span>
                </div>
              </li>
              <li>
                <span className="cbh-thx-num">3</span>
                <div>
                  <strong>Paiement à la livraison</strong>
                  <span>En cash, à la réception du coffret</span>
                </div>
              </li>
            </ol>

            <div className="cbh-thx-cta-row">
              <Link to={`/${SLUG}`} className="cbh-thx-cta">
                <span className="cbh-thx-sheen" aria-hidden />
                <span>Retour à la boutique</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <p className="cbh-thx-note">
              Vous n'avez rien reçu après quelques minutes ? Vérifiez votre numéro de téléphone et contactez-nous.
            </p>
          </article>

          {/* Bandeau réassurance bas */}
          <ul className="cbh-thx-trust">
            <li>
              <span className="cbh-thx-trust-i">✦</span>
              <span>Paiement à la livraison</span>
            </li>
            <li>
              <span className="cbh-thx-trust-i">✦</span>
              <span>Livraison rapide CI</span>
            </li>
            <li>
              <span className="cbh-thx-trust-i">✦</span>
              <span>3 boxers premium</span>
            </li>
          </ul>
        </main>
      </div>
    </div>
  );
}

function Style() {
  return (
    <style>{`
      .cbh-thx-root {
        font-family: 'Inter','Poppins',system-ui,-apple-system,'Segoe UI',sans-serif;
        color: #e2e8f0;
        background: #070a1a;
        min-height: 100vh;
        antialiased: true;
      }
      .cbh-thx-hero {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
      }
      .cbh-thx-bg {
        position: absolute; inset: 0;
        background:
          radial-gradient(80% 60% at 15% 10%, rgba(251,191,36,0.18), transparent 60%),
          radial-gradient(70% 60% at 90% 20%, rgba(220,38,38,0.22), transparent 60%),
          radial-gradient(80% 90% at 50% 110%, rgba(180,83,9,0.22), transparent 70%),
          linear-gradient(180deg, #0a0e27 0%, #0a0a18 60%, #050714 100%);
        z-index: 0;
      }
      .cbh-thx-grain {
        position: absolute; inset: 0;
        background-image: repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px);
        mix-blend-mode: overlay;
        opacity: 0.07;
        z-index: 0;
      }
      .cbh-thx-wrap {
        position: relative; z-index: 1;
        max-width: 540px;
        margin: 0 auto;
        padding: 36px 18px 60px;
      }

      /* Carte principale */
      .cbh-thx-card {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1px solid rgba(251, 191, 36, 0.28);
        box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.85);
        padding: 32px 22px 28px;
        text-align: center;
        animation: cbh-thx-up 0.6s ease-out both;
      }
      .cbh-thx-halo {
        position: absolute; top: -50%; left: 50%;
        width: 120%; height: 120%;
        transform: translateX(-50%);
        background: radial-gradient(circle, rgba(251,191,36,0.18), transparent 60%);
        pointer-events: none;
        z-index: 0;
      }

      .cbh-thx-check {
        position: relative;
        margin: 0 auto 16px;
        width: 76px; height: 76px;
        border-radius: 999px;
        display: grid; place-items: center;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.6), 0 0 0 6px rgba(16, 185, 129, 0.12);
        animation: cbh-thx-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      .cbh-thx-check svg {
        width: 38px; height: 38px;
        color: #fff;
      }

      .cbh-thx-title {
        position: relative;
        margin: 8px 0 0;
        font-size: 28px;
        font-weight: 900;
        letter-spacing: -0.01em;
        line-height: 1.1;
        color: #fff;
      }
      @media (min-width: 480px) { .cbh-thx-title { font-size: 32px; } }
      .cbh-thx-grad {
        background: linear-gradient(120deg, #fef08a 0%, #fbbf24 50%, #b45309 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .cbh-thx-emoji {
        color: #fbbf24;
      }

      .cbh-thx-sub {
        position: relative;
        margin: 12px 0 0;
        font-size: 14.5px;
        line-height: 1.6;
        color: #cbd5e1;
      }
      .cbh-thx-sub strong { color: #fbbf24; font-weight: 700; }

      /* Recap */
      .cbh-thx-recap {
        position: relative;
        margin: 22px 0 0;
        padding: 16px 16px 14px;
        border-radius: 18px;
        background: rgba(251, 191, 36, 0.08);
        border: 1px solid rgba(251, 191, 36, 0.22);
        text-align: left;
      }
      .cbh-thx-row {
        display: flex; justify-content: space-between; align-items: center;
        gap: 12px;
        padding: 8px 0;
        font-size: 13.5px;
        border-bottom: 1px dashed rgba(255,255,255,0.08);
      }
      .cbh-thx-row:last-child { border-bottom: 0; }
      .cbh-thx-k { color: #94a3b8; font-weight: 600; }
      .cbh-thx-v { color: #f1f5f9; font-weight: 700; text-align: right; }
      .cbh-thx-mono { font-family: 'SF Mono', Consolas, monospace; font-size: 13px; }
      .cbh-thx-total { padding-top: 12px; }
      .cbh-thx-amount { color: #fbbf24; font-size: 19px; font-weight: 900; }
      .cbh-thx-ref {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed rgba(255,255,255,0.08);
        font-size: 11px;
        color: #64748b;
        text-align: center;
      }
      .cbh-thx-ref code {
        font-family: 'SF Mono', Consolas, monospace;
        background: rgba(0,0,0,0.3);
        padding: 2px 8px;
        border-radius: 6px;
        color: #cbd5e1;
      }

      /* Steps */
      .cbh-thx-steps {
        position: relative;
        list-style: none;
        margin: 22px 0 0;
        padding: 0;
        text-align: left;
        display: grid;
        gap: 10px;
      }
      .cbh-thx-steps li {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
      }
      .cbh-thx-num {
        flex-shrink: 0;
        width: 30px; height: 30px;
        display: grid; place-items: center;
        border-radius: 999px;
        background: linear-gradient(135deg, #fbbf24, #b45309);
        color: #0a0e27;
        font-weight: 900;
        font-size: 14px;
      }
      .cbh-thx-steps strong {
        display: block;
        color: #f1f5f9;
        font-size: 13.5px;
        font-weight: 800;
      }
      .cbh-thx-steps span {
        display: block;
        color: #94a3b8;
        font-size: 12px;
        margin-top: 1px;
      }

      /* CTA */
      .cbh-thx-cta-row {
        position: relative;
        margin: 24px 0 0;
        display: flex;
        justify-content: center;
      }
      .cbh-thx-cta {
        position: relative;
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 28px;
        border-radius: 999px;
        background: linear-gradient(120deg, #fde68a 0%, #fbbf24 50%, #b45309 100%);
        color: #0a0e27;
        font-weight: 900;
        font-size: 14px;
        letter-spacing: 0.02em;
        text-decoration: none;
        box-shadow: 0 18px 40px -12px rgba(251,191,36,0.55);
        transition: transform 0.25s;
      }
      .cbh-thx-cta:hover { transform: translateY(-2px); }
      .cbh-thx-cta svg { width: 16px; height: 16px; }
      .cbh-thx-sheen {
        position: absolute; inset: 0;
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
        width: 50%;
        animation: cbh-thx-sheen 2.8s ease-in-out infinite;
        pointer-events: none;
      }

      .cbh-thx-note {
        position: relative;
        margin: 18px 0 0;
        font-size: 11.5px;
        color: #64748b;
        line-height: 1.5;
      }

      /* Bandeau trust */
      .cbh-thx-trust {
        list-style: none;
        margin: 24px 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px 14px;
      }
      .cbh-thx-trust li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        color: #cbd5e1;
        font-size: 12px;
        font-weight: 700;
      }
      .cbh-thx-trust-i { color: #fbbf24; }

      /* Animations */
      @keyframes cbh-thx-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: none; }
      }
      @keyframes cbh-thx-pop {
        0% { opacity: 0; transform: scale(0.5); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes cbh-thx-sheen {
        0% { transform: translateX(-120%) skewX(-15deg); }
        100% { transform: translateX(220%) skewX(-15deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .cbh-thx-card, .cbh-thx-check, .cbh-thx-sheen { animation: none !important; }
      }
    `}</style>
  );
}
