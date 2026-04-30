/**
 * Wrapper du composant generique PatchDouleurLandingPremium pour le slug
 * patchdouleurtk (canal direct, productCode = PATCH_DOULEUR_TK).
 *
 * La logique metier (form, prix, tracking, redirect) vit dans
 * PatchDouleurLandingPremium. Ce fichier ne fait que passer les bonnes
 * constantes pour distinguer le tracking TK vs FB.
 */
import PatchDouleurLandingPremium from './PatchDouleurLandingPremium';

export default function PatchDouleurTkLanding() {
  return (
    <PatchDouleurLandingPremium
      slug="patchdouleurtk"
      productCode="PATCH_DOULEUR_TK"
      thankYouUrl="/patchdouleurtk/merci"
      contentName="Patch Anti-Douleur Chauffant TK"
    />
  );
}
