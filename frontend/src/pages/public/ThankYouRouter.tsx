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
import CremeAntiVerrueThankYou from './CremeAntiVerrueThankYou';
import CremeVerrueTkThankYou from './CremeVerrueTkThankYou';
import CremeAntiLipomeThankYou from './CremeAntiLipomeThankYou';
import CremeAntiLipomeTkThankYou from './CremeAntiLipomeTkThankYou';
import CremeAntiCerneThankYou from './CremeAntiCerneThankYou';
import ChaussetteHommeThankYou from './ChaussetteHommeThankYou';
import ChaussettePremiumThankYou from './ChaussettePremiumThankYou';
import CoffretBoxerThankYou from './CoffretBoxerThankYou';
import ChapeauGavrocheThankYou from './ChapeauGavrocheThankYou';
import SprayVitiligoThankYou from './SprayVitiligoThankYou';
import PoudrePousseCheveuxThankYou from './PoudrePousseCheveuxThankYou';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Slugs avec une page de remerciement dediee (skip le fetch generique).
const DEDICATED_THANKYOU_SLUGS = new Set<string>([
  'patchdouleurfb',
  'serum-cerne-paye',
  'creme-anti-verrue',
  'creme-verrue-tk',
  'creme-anti-lipome',
  'creme-anti-lipome-tk',
  'creme-anti-cerne',
  'chaussette-homme',
  'chaussette-premium-homme',
  'coffret-boxer-homme',
  'chapeau-gavroche',
  'spray-vitiligo',
  'poudre-pousse-cheveux',
]);

/**
 * Detecte si une reference de paiement vient de Paystack.
 * Les references Paystack que nous generons commencent par "pst_"
 * (ex: pst_lzxy3a_4b5c6d7e). Voir routes/paystack.routes.js -> generatePaystackReference.
 */
function isPaystackReference(ref: string): boolean {
  return /^pst_[a-z0-9_]+$/i.test(ref);
}

/**
 * Detecte si une reference de paiement vient de Chariow (legacy).
 * Les sale_id Chariow commencent toujours par "sal_" (ex: sal_xyz789abc).
 * Conserve pour la retrocompatibilite avec les anciennes commandes.
 */
function isChariowReference(ref: string): boolean {
  return /^sal_[a-z0-9]+$/i.test(ref);
}

/**
 * Une reference vient-elle d'un paiement en ligne (Paystack ou Chariow legacy) ?
 */
function isOnlinePaymentReference(ref: string): boolean {
  return isPaystackReference(ref) || isChariowReference(ref);
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

  // Page de remerciement creme-anti-verrue — pixel Meta dedie coachingexpertci.com / campagnes.
  if (slug === 'creme-anti-verrue') {
    return <CremeAntiVerrueThankYou />;
  }

  // Page de remerciement creme-verrue-tk — pixel Meta 1417398840151713 (Purchase + CAPI dedup).
  if (slug === 'creme-verrue-tk') {
    return <CremeVerrueTkThankYou />;
  }

  // Page de remerciement creme-anti-lipome — pixel Meta 1857129471642967 (Purchase).
  if (slug === 'creme-anti-lipome') {
    return <CremeAntiLipomeThankYou />;
  }

  // Page de remerciement creme-anti-lipome-tk — meme pixel, produit CREME_ANTI_LIPOME_TK.
  if (slug === 'creme-anti-lipome-tk') {
    return <CremeAntiLipomeTkThankYou />;
  }

  // Page de remerciement creme-anti-cerne — pixel Meta 950944984510412 (Purchase + CAPI dedup).
  if (slug === 'creme-anti-cerne') {
    return <CremeAntiCerneThankYou />;
  }

  // Page de remerciement chaussette-homme — pixel Meta 1613380123108753 (Purchase).
  if (slug === 'chaussette-homme') {
    return <ChaussetteHommeThankYou />;
  }

  // Page de remerciement chaussettes premium homme (page 2) — palette navy/or.
  if (slug === 'chaussette-premium-homme') {
    return <ChaussettePremiumThankYou />;
  }

  // Page de remerciement coffret-boxer-homme — pixel Meta 26809431761984777 (Purchase).
  if (slug === 'coffret-boxer-homme') {
    return <CoffretBoxerThankYou />;
  }

  // Page de remerciement chapeau-gavroche — pixel Meta 1613380123108753 (Purchase + CAPI dedup).
  if (slug === 'chapeau-gavroche') {
    return <ChapeauGavrocheThankYou />;
  }

  // Page de remerciement spray-vitiligo — palette bleu medical, Purchase + WhatsApp CTA.
  if (slug === 'spray-vitiligo') {
    return <SprayVitiligoThankYou />;
  }

  // Page de remerciement poudre-pousse-cheveux — pixel Meta 1629520061493542 (Purchase + CAPI dedup).
  if (slug === 'poudre-pousse-cheveux') {
    return <PoudrePousseCheveuxThankYou />;
  }

  // Page de remerciement dediee patchdouleurfb avec pixel Meta 952340034030644
  // (Purchase event au mount + deduplication via eventID = orderReference).
  if (slug === 'patchdouleurfb') {
    return <PatchDouleurFbThankYou />;
  }

  // Page de remerciement dediee serum-cerne-paye :
  // - Si la commande vient d'un paiement en ligne (Paystack pst_xxx OU Chariow
  //   legacy sal_xxx) -> page WhatsApp + livraison express 2h + "DEJA PAYE".
  // - Sinon (paiement cash a la livraison via formulaire site) -> page sobre sans WhatsApp.
  // Detection :
  //   - Paystack : reference commence par "pst_" (genere par notre backend)
  //   - Chariow legacy : sale_id commence par "sal_"
  //   - Cash : orderReference obgestion est un UUID v4
  if (slug === 'serum-cerne-paye') {
    const ref = searchParams.get('ref') || searchParams.get('reference') || searchParams.get('sale_id') || '';
    if (isOnlinePaymentReference(ref)) {
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
        <Link to={slug ? `/${slug}` : '/'} className="mt-6 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105">
          Retour au produit
        </Link>
      </div>
    </div>
  );
}
