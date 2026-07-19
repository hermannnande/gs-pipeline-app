/**
 * Wrapper du composant generique PatchDouleurLandingPremium pour le slug
 * patchdouleurtiktok (canal TikTok ads, productCode = PATCH_DOULEUR_TIKTOK).
 *
 * Identique visuellement a patchdouleurfb — seul change le tracking
 * (productCode/contentName/thankYouUrl) afin de separer les commandes TikTok
 * des autres canaux dans obgestion.
 *
 * Pixel : AUCUN pour l'instant (metaPixelId=''). Pour activer un pixel TikTok
 * (ttq) plus tard, ajouter son support dans PatchDouleurLandingPremium puis
 * passer l'ID ici.
 */
import PatchDouleurLandingPremium from './PatchDouleurLandingPremium';

const TIKTOK_PRICES: Record<number, number> = { 1: 7500, 2: 12100, 3: 17700 };

export default function PatchDouleurTiktokLanding() {
  return (
    <PatchDouleurLandingPremium
      slug="patchdouleurtiktok"
      productCode="PATCH_DOULEUR_TIKTOK"
      thankYouUrl="/patchdouleurtiktok/merci"
      contentName="Patch Anti-Douleur Chauffant TikTok"
      metaPixelId=""
      prices={TIKTOK_PRICES}
    />
  );
}
