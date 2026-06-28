/**
 * Registre unique slug → composant landing.
 * Ajouter un slug ici + dans LANDING_SLUGS (useLandingSlug.ts) pour qu'il
 * soit routé automatiquement par LandingRouter.
 *
 * IMPORTANT (perf) : chaque landing est chargee en LAZY via React.lazy().
 * Vite genere ainsi un chunk JS separe par produit -> un visiteur ne
 * telecharge QUE le code de la page qu'il ouvre, pas les 35 landings.
 * Le rendu doit donc se faire dans un <Suspense> (cf. LandingRouter).
 */
import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

type LazyLanding = LazyExoticComponent<ComponentType>;

export const LANDING_COMPONENTS: Record<string, LazyLanding> = {
  'coffret-boxer-homme': lazy(() => import('./CoffretBoxerLanding')),
  'creme-anti-verrue': lazy(() => import('./CremeAntiVerrueLanding')),
  patchdouleurtk: lazy(() => import('./PatchDouleurTkLanding')),
  patchdouleurfb: lazy(() => import('./PatchDouleurFbLanding')),
  'creme-verrue-tk': lazy(() => import('./CremeVerrueTkLanding')),
  'creme-verrue-tk2': lazy(() => import('./CremeVerrueTk2Landing')),
  spraydouleurtk: lazy(() => import('./SprayDouleurTkLanding')),
  spraylipome: lazy(() => import('./SprayLipomeLanding')),
  spraylipometk: lazy(() => import('./SprayLipomeTkLanding')),
  'spraylipome-promo': lazy(() => import('./SprayLipomePromoLanding')),
  'creme-anti-lipome': lazy(() => import('./CremeAntiLipomeLanding')),
  'creme-anti-lipome-tk': lazy(() => import('./CremeAntiLipomeTkLanding')),
  'chaussette-homme': lazy(() => import('./ChaussetteHommeLanding')),
  'chaussette-premium-homme': lazy(() => import('./ChaussettePremiumLanding')),
  'chaussette-compression': lazy(() => import('./ChaussetteCompressionLanding')),
  'creme-anti-cerne': lazy(() => import('./CremeAntiCerneLanding')),
  'serum-cerne': lazy(() => import('./SerumCerneLanding')),
  'serum-cerne-tk': lazy(() => import('./SerumCerneTkLanding')),
  'serum-cerne-paye': lazy(() => import('./SerumCernePayeLanding')),
  'anti-age': lazy(() => import('./SerumCerneSmsLanding')),
  'poudre-pousse-cheveux': lazy(() => import('./PoudrePousseCheveuxLanding')),
  'spray-vitiligo': lazy(() => import('./SprayVitiligoLanding')),
  'chapeau-gavroche': lazy(() => import('./ChapeauGavrocheLanding')),
  'chapeau-dame': lazy(() => import('./ChapeauDameLanding')),
  boutique: lazy(() => import('./BoutiqueLanding')),
  'creme-ongle-incarne-v2': lazy(() => import('./CremeOngleIncarneV2Landing')),
  // Alias v1 → même landing premium que v2 (évite DynamicLanding + API template).
  'creme-ongle-incarne': lazy(() => import('./CremeOngleIncarneV2Landing')),
  'bande-sport-minceur': lazy(() => import('./BandeSportMinceurLanding')),
  detoxminceur: lazy(() => import('./DetoxMinceurLanding')),
  'patch-minceur-glp': lazy(() => import('./PatchMinceurGlpLanding')),
  chaussette: lazy(() => import('./ChaussetteChauffanteLanding')),
  'chaussette-compression-v2': lazy(() => import('./ChaussetteCompressionV2Landing')),
  crememinceurfb: lazy(() => import('./CremeMinceurFbLanding')),
  'coffret-boxer-luxe-v3': lazy(() => import('./CoffretBoxerLuxeV3Landing')),
  'lunette-de-nuit': lazy(() => import('./LunetteDeNuitLanding')),
  'bouilloire-intelligente': lazy(() => import('./BouilloireIntelligenteLanding')),
};

export const AUTONOMOUS_LANDING_SLUGS = new Set(Object.keys(LANDING_COMPONENTS));

export function getLandingComponent(slug: string | undefined): LazyLanding | undefined {
  return slug ? LANDING_COMPONENTS[slug] : undefined;
}
