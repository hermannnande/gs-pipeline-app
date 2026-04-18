import type { Dispatch, FormEvent, SetStateAction } from 'react';

export interface QtyOption {
  v: number;
  label: string;
  sub: string;
  tag?: string;
  save?: string;
}

export interface OrderFormCfg {
  title: string;
  hero?: string;
  oldPrice?: number;
  primary?: string;
  accent?: string;
}

export interface OrderFormProps {
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;

  name: string;
  setName: Dispatch<SetStateAction<string>>;
  city: string;
  setCity: Dispatch<SetStateAction<string>>;
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  qty: number;
  setQty: Dispatch<SetStateAction<number>>;

  qtyOpts: QtyOption[];
  prices: Record<number, number>;
  fmt: (n: number) => string;

  sending: boolean;
  formErr: string;

  cfg: OrderFormCfg;
}
