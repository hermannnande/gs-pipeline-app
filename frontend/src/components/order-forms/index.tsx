import type { OrderFormProps } from './types';
import OrderFormVerrue from './OrderFormVerrue';
import OrderFormVerrueTK from './OrderFormVerrueTK';
import OrderFormSpray from './OrderFormSpray';
import OrderFormOngle from './OrderFormOngle';
import OrderFormChaussette from './OrderFormChaussette';
import OrderFormDefault from './OrderFormDefault';

export type { OrderFormProps } from './types';

const REGISTRY: Record<string, (props: OrderFormProps) => JSX.Element> = {
  'creme-anti-verrue': OrderFormVerrue,
  'creme-verrue-tk': OrderFormVerrueTK,
  'spraydouleurtk': OrderFormSpray,
  'creme-ongle-incarne': OrderFormOngle,
  'chaussette-compression': OrderFormChaussette,
};

export function ProductOrderForm(props: OrderFormProps & { slug?: string }) {
  const { slug, ...rest } = props;
  const Component = (slug && REGISTRY[slug]) || OrderFormDefault;
  return <Component {...rest} />;
}
