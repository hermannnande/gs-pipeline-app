/**
 * Routeur des pages de remerciement.
 *
 * Pour les slugs avec une page de remerciement dediee (tracking pixel
 * specifique, design custom), on retourne directement le composant.
 * Sinon, on tombe sur une page de remerciement generique qui fetch le
 * titre du produit depuis /api/templates/public/<slug>.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLandingSlug } from '../../hooks/useLandingSlug';
import PatchDouleurFbThankYou from './PatchDouleurFbThankYou';
import SerumCernePayeThankYou from './SerumCernePayeThankYou';
import SerumCernePayeThankYouCash from './SerumCernePayeThankYouCash';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Slugs avec une page de remerciement dediee (skip le fetch generique).
const DEDICATED_THANKYOU_SLUGS = new Set<string>([
  'patchdouleurfb',
  'serum-cerne-paye',
]);

/**
 * Detecte si une reference de paiement vient de Chariow.
 * Les sale_id Chariow commencent toujours par "sal_" (ex: sal_xyz789abc).
 * Les orderReference obgestion (cash) sont des UUID v4 (ex: "a1b2-...").
 */
function isChariowReference(ref: string): boolean {
  return /^sal_[a-z0-9]+$/i.test(ref);
}

export default function ThankYouRouter() {
  const slug = useLandingSlug();
  const [searchParams] = useSearchParams();
  const [productName, setProductName] = useState<string>('Votre commande');

  // ATTENTION : les hooks doivent toujours etre appeles dans le meme ordre,
  // donc on les place AVANT toute branche de routage. Le useEffect skip lui-meme
  // si slug correspond a une thankyou page dediee.
  useEffect(() => {
    if (!slug || DEDICATED_THANKYOU_SLUGS.has(slug)) return;
    axios.get(`${API_URL}/templates/public/${slug}`)
      .then((r) => {
        try {
          const cfg = JSON.parse(r.data.template.config);
          if (cfg.title) setProductName(cfg.title);
        } catch { /* noop */ }
      })
      .catch(() => { /* noop */ });
  }, [slug]);

  // Page de remerciement dediee patchdouleurfb avec pixel Meta 952340034030644
  // (Purchase event au mount + deduplication via eventID = orderReference).
  if (slug === 'patchdouleurfb') {
    return <PatchDouleurFbThankYou />;
  }

  // Page de remerciement dediee serum-cerne-paye :
  // - Si la commande vient de Chariow (paiement Mobile Money) -> page WhatsApp + livraison express 2h.
  // - Sinon (paiement cash a la livraison via formulaire site) -> page sobre sans WhatsApp.
  // Detection : le sale_id Chariow commence par "sal_", l'orderReference obgestion est un UUID.
  if (slug === 'serum-cerne-paye') {
    const ref = searchParams.get('sale_id') || searchParams.get('ref') || '';
    if (isChariowReference(ref)) {
      return <SerumCernePayeThankYou />;
    }
    return <SerumCernePayeThankYouCash />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl ring-1 ring-emerald-200">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg">
          <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900">Merci pour votre commande !</h1>
        <p className="mb-6 text-slate-600">
          {productName} a bien été enregistré. Notre équipe vous contacte sous 30 minutes
          pour confirmer la livraison. <strong>Paiement à la livraison.</strong>
        </p>
        <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-left text-sm">
          <div className="flex items-center gap-3"><span className="text-2xl">📞</span><span>Appel de confirmation sous 30 min</span></div>
          <div className="flex items-center gap-3"><span className="text-2xl">🚚</span><span>Livraison rapide partout en Côte d'Ivoire</span></div>
          <div className="flex items-center gap-3"><span className="text-2xl">💵</span><span>Paiement uniquement à la livraison</span></div>
        </div>
        <Link to="/" className="mt-6 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
