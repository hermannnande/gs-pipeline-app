import type { OrderStatus } from '@/types';

export const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    NOUVELLE: 'Nouvelle',
    A_APPELER: 'À appeler',
    VALIDEE: 'Validée',
    ANNULEE: 'Annulée',
    INJOIGNABLE: 'Injoignable',
    ASSIGNEE: 'Assignée',
    LIVREE: 'Livrée',
    REFUSEE: 'Refusée',
    ANNULEE_LIVRAISON: 'Annulée livraison',
    EXPEDITION: 'Expédition',
    EXPRESS: 'Express',
    EXPRESS_ARRIVE: 'Express arrivé',
    EXPRESS_LIVRE: 'Express livré',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    NOUVELLE: 'bg-blue-100 text-blue-800',
    A_APPELER: 'bg-yellow-100 text-yellow-800',
    VALIDEE: 'bg-green-100 text-green-800',
    ANNULEE: 'bg-red-100 text-red-800',
    INJOIGNABLE: 'bg-orange-100 text-orange-800',
    ASSIGNEE: 'bg-purple-100 text-purple-800',
    LIVREE: 'bg-emerald-100 text-emerald-800',
    REFUSEE: 'bg-red-100 text-red-800',
    ANNULEE_LIVRAISON: 'bg-gray-100 text-gray-800',
    EXPEDITION: 'bg-blue-500 text-white',
    EXPRESS: 'bg-amber-500 text-white',
    EXPRESS_ARRIVE: 'bg-cyan-500 text-white',
    EXPRESS_LIVRE: 'bg-teal-100 text-teal-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

