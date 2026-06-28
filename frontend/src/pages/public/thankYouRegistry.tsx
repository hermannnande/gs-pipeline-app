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
  patchdouleurtk: lazy(() => import('./PatchDouleurTkThankYou')),
  'serum-cerne': lazy(() => import('./SerumCerneThankYou')),
  'serum-cerne-tk': lazy(() => import('./SerumCerneThankYou')),
  'anti-age': lazy(() => import('./SerumCerneSmsThankYou')),
  'creme-anti-verrue': lazy(() => import('./CremeAntiVerrueThankYou')),
  'creme-verrue-tk': lazy(() => import('./CremeVerrueTkThankYou')),
  'creme-verrue-tk2': lazy(() => import('./CremeVerrueTkThankYou')),
  'creme-anti-lipome': lazy(() => import('./CremeAntiLipomeThankYou')),
  'creme-anti-lipome-tk': lazy(() => import('./CremeAntiLipomeTkThankYou')),
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
  detoxminceur: lazy(() => import('./DetoxMinceurThankYou')),
  'patch-minceur-glp': lazy(() => import('./PatchMinceurGlpThankYou')),
  chaussette: lazy(() => import('./ChaussetteChauffanteThankYou')),
  'chaussette-compression-v2': lazy(() => import('./ChaussetteCompressionV2ThankYou')),
  crememinceurfb: lazy(() => import('./CremeMinceurFbThankYou')),
  'coffret-boxer-luxe-v3': lazy(() => import('./CoffretBoxerLuxeV3ThankYou')),
  'lunette-de-nuit': lazy(() => import('./LunetteDeNuitThankYou')),
  'bouilloire-intelligente': lazy(() => import('./BouilloireIntelligenteThankYou')),
};

export const DEDICATED_THANKYOU_SLUGS = new Set(Object.keys(THANKYOU_COMPONENTS));

export function getThankYouComponent(slug: string | undefined): LazyThankYou | undefined {
  return slug ? THANKYOU_COMPONENTS[slug] : undefined;
}
