/**
 * Registre slug → page de remerciement dédiée.
 * Les slugs absents tombent sur la page générique dans ThankYouRouter.
 *
 * IMPORTANT (perf) : chargement LAZY (un chunk par page merci). Le rendu
 * doit se faire dans un <Suspense> (cf. ThankYouRouter).
 */
import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

type LazyThankYou = LazyExoticComponent<ComponentType>;

export const THANKYOU_COMPONENTS: Record<string, LazyThankYou> = {
  patchdouleurfb: lazy(() => import('./PatchDouleurFbThankYou')),
  patchdouleurtiktok: lazy(() => import('./PatchDouleurTiktokThankYou')),
  patchdouleurtk: lazy(() => import('./PatchDouleurTkThankYou')),
  'serum-cerne': lazy(() => import('./SerumCerneThankYou')),
  'serum-cerne-tiktok': lazy(() => import('./SerumCerneThankYou')),
  'serum-cerne-tk': lazy(() => import('./SerumCerneThankYou')),
  'anti-age': lazy(() => import('./SerumCerneSmsThankYou')),
  'creme-anti-verrue': lazy(() => import('./CremeAntiVerrueThankYou')),
  'creme-anti-verrue-bleu': lazy(() => import('./CremeAntiVerrueBleuThankYou')),
  'creme-anti-verrue-bleu-tk': lazy(() => import('./CremeAntiVerrueBleuTkThankYou')),
  'promo-verrue': lazy(() => import('./CremeAntiVerrueBleuPromoThankYou')),
  'creme-verrue-tk': lazy(() => import('./CremeVerrueTkThankYou')),
  'creme-verrue-tk2': lazy(() => import('./CremeVerrueTkThankYou')),
  'creme-anti-lipome': lazy(() => import('./CremeAntiLipomeThankYou')),
  'creme-anti-lipome-tk': lazy(() => import('./CremeAntiLipomeTkThankYou')),
  'creme-lipome-tk3': lazy(() => import('./CremeLipomeTk3ThankYou')),
  'creme-eczema': lazy(() => import('./CremeEczemaThankYou')),
  'creme-anti-cerne': lazy(() => import('./CremeAntiCerneThankYou')),
  'chaussette-homme': lazy(() => import('./ChaussetteHommeThankYou')),
  'chaussette-premium-homme': lazy(() => import('./ChaussettePremiumThankYou')),
  'coffret-boxer-homme': lazy(() => import('./CoffretBoxerThankYou')),
  'chapeau-gavroche': lazy(() => import('./ChapeauGavrocheThankYou')),
  'chapeau-dame': lazy(() => import('./ChapeauDameThankYou')),
  'spray-vitiligo': lazy(() => import('./SprayVitiligoThankYou')),
  'poudre-pousse-cheveux': lazy(() => import('./PoudrePousseCheveuxThankYou')),
  'creme-ongle-incarne-v2': lazy(() => import('./CremeOngleIncarneV2ThankYou')),
  'creme-ongle-incarne': lazy(() => import('./CremeOngleIncarneV2ThankYou')),
  'bande-sport-minceur': lazy(() => import('./BandeSportMinceurThankYou')),
  'bande-sport-tk': lazy(() => import('./BandeSportTkThankYou')),
  detoxminceur: lazy(() => import('./DetoxMinceurThankYou')),
  'patch-minceur-glp': lazy(() => import('./PatchMinceurGlpThankYou')),
  'patch-minceur-promo': lazy(() => import('./PatchMinceurPromoThankYou')),
  chaussette: lazy(() => import('./ChaussetteChauffanteThankYou')),
  'chaussette-compression-v2': lazy(() => import('./ChaussetteCompressionV2ThankYou')),
  crememinceurfb: lazy(() => import('./CremeMinceurFbThankYou')),
  'coffret-boxer-luxe-v3': lazy(() => import('./CoffretBoxerLuxeV3ThankYou')),
  'lunette-de-nuit': lazy(() => import('./LunetteDeNuitThankYou')),
  'bouilloire-intelligente': lazy(() => import('./BouilloireIntelligenteThankYou')),
  'guide-pousse-naturelle': lazy(() => import('./GuidePousseNaturelleThankYou')),
  'mini-sac-bandouliere': lazy(() => import('./MiniSacBandouliereThankYou')),
  'mini-sac-bandouliere-tk': lazy(() => import('./MiniSacBandouliereTkThankYou')),
  'serum-rajeunissant': lazy(() => import('./SerumRajeunissantThankYou')),
  'serum-rajeunissant-tk': lazy(() => import('./SerumRajeunissantTkThankYou')),
  'support-telephone-flexible': lazy(() => import('./SupportTelephoneFlexibleThankYou')),
  'repulsif-ultrasons': lazy(() => import('./RepulsifUltrasonsThankYou')),
  'sac-louis-vuitton': lazy(() => import('./SacLouisVuittonThankYou')),
  'sangles-rotuliennes': lazy(() => import('./SanglesRotuliennesThankYou')),
  'sangles-rotuliennes-tk': lazy(() => import('./SanglesRotuliennesTkThankYou')),
};

export const DEDICATED_THANKYOU_SLUGS = new Set(Object.keys(THANKYOU_COMPONENTS));

export function getThankYouComponent(slug: string | undefined): LazyThankYou | undefined {
  return slug ? THANKYOU_COMPONENTS[slug] : undefined;
}
