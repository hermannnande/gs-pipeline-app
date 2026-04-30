/**
 * Wrapper du composant generique PatchDouleurLandingPremium pour le slug
 * patchdouleurfb (canal Facebook ads, productCode = PATCH_DOULEUR_FB).
 *
 * Identique visuellement a patchdouleurtk — seul change le tracking
 * (productCode/contentName/thankYouUrl/metaPixelId) afin de separer
 * les commandes Facebook ads vs autres canaux dans obgestion ET d'utiliser
 * le pixel Facebook dedie a la campagne FB.
 */
import PatchDouleurLandingPremium from './PatchDouleurLandingPremium';

// Pixel Meta dedie a la campagne Facebook ads patchdouleurfb.
// Pour synchroniser : creer ou mettre a jour le pixel dans le Business Manager
// Meta avec cet ID, puis verifier les events PageView / ViewContent / AddToCart
// / InitiateCheckout / Purchase via le Test Events / Events Manager.
export const PATCHDOULEURFB_PIXEL_ID = '952340034030644';

export default function PatchDouleurFbLanding() {
  return (
    <PatchDouleurLandingPremium
      slug="patchdouleurfb"
      productCode="PATCH_DOULEUR_FB"
      thankYouUrl="/patchdouleurfb/merci"
      contentName="Patch Anti-Douleur Chauffant FB"
      metaPixelId={PATCHDOULEURFB_PIXEL_ID}
    />
  );
}
