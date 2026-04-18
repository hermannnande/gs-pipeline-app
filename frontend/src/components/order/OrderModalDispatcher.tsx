/**
 * Dispatcher central qui choisit la modal de commande personnalisee a afficher
 * en fonction du slug du produit. Chaque produit a son propre design unique.
 *
 * Pour ajouter un nouveau produit avec design custom :
 * 1. Creer le composant OrderModalXxx.tsx dans le meme dossier
 * 2. L'ajouter au switch ci-dessous + a la liste CUSTOM_SLUGS
 * 3. Aucune modif a faire dans DynamicLanding(V2)
 */
import OrderModalVerrueTk from './OrderModalVerrueTk';
import OrderModalAntiVerrue from './OrderModalAntiVerrue';
import OrderModalSprayDouleur from './OrderModalSprayDouleur';
import OrderModalOngleIncarne from './OrderModalOngleIncarne';
import OrderModalChaussette from './OrderModalChaussette';
import OrderModalMinceur from './OrderModalMinceur';
import OrderModalPatchDouleur from './OrderModalPatchDouleur';
import type { OrderSubmitConfig, OrderProduct } from '../../hooks/useOrderSubmit';

const CUSTOM_SLUGS = [
  'creme-verrue-tk',
  'creme-anti-verrue',
  'spraydouleurtk',
  'creme-ongle-incarne',
  'chaussette-compression',
  'crememinceurfb',
  'patchdouleurtk',
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

export default function OrderModalDispatcher({ slug, ...rest }: Props) {
  switch (slug) {
    case 'creme-verrue-tk':
      return <OrderModalVerrueTk {...rest} />;
    case 'creme-anti-verrue':
      return <OrderModalAntiVerrue {...rest} />;
    case 'spraydouleurtk':
      return <OrderModalSprayDouleur {...rest} />;
    case 'creme-ongle-incarne':
      return <OrderModalOngleIncarne {...rest} />;
    case 'chaussette-compression':
      return <OrderModalChaussette {...rest} />;
    case 'crememinceurfb':
      return <OrderModalMinceur {...rest} />;
    case 'patchdouleurtk':
      return <OrderModalPatchDouleur {...rest} />;
    default:
      return null;
  }
}
