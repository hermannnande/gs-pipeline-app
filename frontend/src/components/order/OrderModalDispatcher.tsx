/**
 * Dispatcher central qui choisit la modal de commande personnalisee a afficher
 * en fonction du slug du produit. Chaque produit a son propre design unique.
 *
 * Pour ajouter un nouveau produit avec design custom :
 * 1. Creer le composant OrderModalXxx.tsx dans le meme dossier
 * 2. L'ajouter au switch ci-dessous + a la liste CUSTOM_SLUGS
 * 3. Aucune modif a faire dans DynamicLanding(V2)
 */
import { Suspense, lazy } from 'react';
// Lazy : chaque modale a son propre chunk -> une landing ne charge la modale
// que lorsque l'utilisateur ouvre le formulaire de commande, et seulement la
// sienne (au lieu des 25 modales d'un bloc partage par toutes les pages).
const OrderModalVerrueTk = lazy(() => import('./OrderModalVerrueTk'));
const OrderModalAntiVerrue = lazy(() => import('./OrderModalAntiVerrue'));
const OrderModalSprayDouleur = lazy(() => import('./OrderModalSprayDouleur'));
const OrderModalOngleIncarne = lazy(() => import('./OrderModalOngleIncarne'));
const OrderModalChaussette = lazy(() => import('./OrderModalChaussette'));
const OrderModalMinceur = lazy(() => import('./OrderModalMinceur'));
const OrderModalPatchDouleur = lazy(() => import('./OrderModalPatchDouleur'));
const OrderModalSprayLipome = lazy(() => import('./OrderModalSprayLipome'));
const OrderModalCremeAntiLipome = lazy(() => import('./OrderModalCremeAntiLipome'));
const OrderModalCremeAntiLipomeTk = lazy(() => import('./OrderModalCremeAntiLipomeTk'));
const OrderModalChaussetteHomme = lazy(() => import('./OrderModalChaussetteHomme'));
const OrderModalCremeAntiCerne = lazy(() => import('./OrderModalCremeAntiCerne'));
const OrderModalSerumCerne = lazy(() => import('./OrderModalSerumCerne'));
const OrderModalSerumCerneTk = lazy(() => import('./OrderModalSerumCerneTk'));
const OrderModalSerumCernePaye = lazy(() => import('./OrderModalSerumCernePaye'));
const OrderModalPoudreCheveux = lazy(() => import('./OrderModalPoudreCheveux'));
const OrderModalSprayVitiligo = lazy(() => import('./OrderModalSprayVitiligo'));
const OrderModalChapeauGavroche = lazy(() => import('./OrderModalChapeauGavroche'));
const OrderModalOngleIncarneV2 = lazy(() => import('./OrderModalOngleIncarneV2'));
const OrderModalDetoxMinceur = lazy(() => import('./OrderModalDetoxMinceur'));
const OrderModalChaussetteChauffante = lazy(() => import('./OrderModalChaussetteChauffante'));
const OrderModalBandeSport = lazy(() => import('./OrderModalBandeSport'));
const OrderModalPatchMinceurGlp = lazy(() => import('./OrderModalPatchMinceurGlp'));
const OrderModalLunetteDeNuit = lazy(() => import('./OrderModalLunetteDeNuit'));
const OrderModalBouilloireIntelligente = lazy(() => import('./OrderModalBouilloireIntelligente'));
import type { OrderSubmitConfig, OrderProduct } from '../../hooks/useOrderSubmit';

const CUSTOM_SLUGS = [
  'creme-verrue-tk',
  'creme-verrue-tk2',
  'creme-anti-verrue',
  'spraydouleurtk',
  'creme-ongle-incarne',
  'creme-ongle-incarne-v2',
  'chaussette-compression',
  'chaussette-compression-v2',
  'chaussette',
  'crememinceurfb',
  'patchdouleurtk',
  'patchdouleurfb',
  'patch-minceur-glp',
  'spraylipome',
  'spraylipometk',
  'spraylipome-promo',
  'creme-anti-lipome',
  'creme-anti-lipome-tk',
  'chaussette-homme',
  'chaussette-premium-homme',
  'creme-anti-cerne',
  'serum-cerne',
  'serum-cerne-tk',
  'serum-cerne-paye',
  'anti-age',
  'poudre-pousse-cheveux',
  'spray-vitiligo',
  'chapeau-gavroche',
  'detoxminceur',
  'bande-sport-minceur',
  'lunette-de-nuit',
  'bouilloire-intelligente',
] as const;

export type CustomSlug = typeof CUSTOM_SLUGS[number];

export function isCustomOrderSlug(slug: string | undefined | null): slug is CustomSlug {
  return !!slug && (CUSTOM_SLUGS as readonly string[]).includes(slug);
}

interface QtyOption {
  v: number;
  label: string;
  sub: string;
  tag?: string;
  save?: string;
}

interface Props {
  slug: string;
  open: boolean;
  onClose: () => void;
  cfg: OrderSubmitConfig & {
    images: {
      hero: string;
      avant?: string;
      apres?: string;
      comparison?: { before: string; after: string };
    };
  };
  product: OrderProduct | null;
  setProduct?: (p: OrderProduct | null) => void;
  qtyOptions: QtyOption[];
  initialQty?: number;
}

function renderModal(slug: string, rest: Omit<Props, 'slug'>) {
  switch (slug) {
    case 'creme-verrue-tk':
    case 'creme-verrue-tk2':
      return <OrderModalVerrueTk {...rest} />;
    case 'creme-anti-verrue':
      return <OrderModalAntiVerrue {...rest} />;
    case 'spraydouleurtk':
      return <OrderModalSprayDouleur {...rest} />;
    case 'creme-ongle-incarne':
      return <OrderModalOngleIncarne {...rest} />;
    case 'creme-ongle-incarne-v2':
      return <OrderModalOngleIncarneV2 {...rest} />;
    case 'chaussette-compression':
    case 'chaussette-compression-v2':
      return <OrderModalChaussette {...rest} />;
    case 'chaussette':
      return <OrderModalChaussetteChauffante {...rest} />;
    case 'crememinceurfb':
      return <OrderModalMinceur {...rest} />;
    case 'patchdouleurtk':
    case 'patchdouleurfb':
      return <OrderModalPatchDouleur {...rest} />;
    case 'patch-minceur-glp':
      return <OrderModalPatchMinceurGlp {...rest} />;
    case 'spraylipome':
    case 'spraylipometk':
    case 'spraylipome-promo':
      return <OrderModalSprayLipome {...rest} />;
    case 'creme-anti-lipome':
      return <OrderModalCremeAntiLipome {...rest} />;
    case 'creme-anti-lipome-tk':
      return <OrderModalCremeAntiLipomeTk {...rest} />;
    case 'chaussette-homme':
    case 'chaussette-premium-homme':
      return <OrderModalChaussetteHomme {...rest} />;
    case 'creme-anti-cerne':
      return <OrderModalCremeAntiCerne {...rest} />;
    case 'serum-cerne':
      return <OrderModalSerumCerne {...rest} />;
    case 'serum-cerne-tk':
      return <OrderModalSerumCerneTk {...rest} />;
    case 'anti-age':
      return <OrderModalSerumCerne {...rest} />;
    case 'serum-cerne-paye':
      return <OrderModalSerumCernePaye {...rest} />;
    case 'poudre-pousse-cheveux':
      return <OrderModalPoudreCheveux {...rest} />;
    case 'spray-vitiligo':
      return <OrderModalSprayVitiligo {...rest} />;
    case 'chapeau-gavroche':
      return <OrderModalChapeauGavroche {...rest} />;
    case 'detoxminceur':
      return <OrderModalDetoxMinceur {...rest} />;
    case 'bande-sport-minceur':
      return <OrderModalBandeSport {...rest} />;
    case 'lunette-de-nuit':
      return <OrderModalLunetteDeNuit {...rest} />;
    case 'bouilloire-intelligente':
      return <OrderModalBouilloireIntelligente {...rest} />;
    default:
      return null;
  }
}

export default function OrderModalDispatcher({ slug, ...rest }: Props) {
  // Tant que la modale n'est pas ouverte, on ne monte rien : le chunk de la
  // modale n'est donc telecharge qu'au premier clic sur "Commander".
  if (!rest.open) return null;

  const modal = renderModal(slug, rest);
  if (!modal) return null;

  return <Suspense fallback={null}>{modal}</Suspense>;
}
