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

// Pixels Meta campagne patchdouleurfb (soindemoi.net / obrille.com).
export const PATCHDOULEURFB_PIXEL_ID = '1024740423446417';
export const PATCHDOULEURFB_PIXEL_ID_2 = '2838942643120213';

export default function PatchDouleurFbLanding() {
  return (
    <PatchDouleurLandingPremium
      slug="patchdouleurfb"
      productCode="PATCH_DOULEUR_FB"
      thankYouUrl="/patchdouleurfb/merci"
      contentName="Patch Anti-Douleur Chauffant FB"
      metaPixelId={PATCHDOULEURFB_PIXEL_ID}
      secondaryMetaPixelId={PATCHDOULEURFB_PIXEL_ID_2}
    />
  );
}
