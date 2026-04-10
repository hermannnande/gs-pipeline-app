export const colors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#a5b4fc',
  secondary: '#0ea5e9',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  bg: '#f8fafc',
  card: '#ffffff',
  cardAlt: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  textWhite: '#ffffff',

  statusNew: '#6366f1',
  statusToCall: '#f59e0b',
  statusValidated: '#22c55e',
  statusCancelled: '#ef4444',
  statusUnreachable: '#f97316',
  statusAssigned: '#3b82f6',
  statusDelivered: '#10b981',
  statusRefused: '#dc2626',
  statusReturned: '#8b5cf6',
  statusExpedition: '#0ea5e9',
  statusExpress: '#14b8a6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const STATUS_LABELS: Record<string, string> = {
  NOUVELLE: 'Nouvelle',
  A_APPELER: 'À appeler',
  VALIDEE: 'Validée',
  ANNULEE: 'Annulée',
  INJOIGNABLE: 'Injoignable',
  ASSIGNEE: 'Assignée',
  LIVREE: 'Livrée',
  REFUSEE: 'Refusée',
  ANNULEE_LIVRAISON: 'Annulée livraison',
  RETOURNE: 'Retourné',
  EXPEDITION: 'Expédition',
  EXPRESS: 'Express',
  EXPRESS_ENVOYE: 'Express envoyé',
  EXPRESS_ARRIVE: 'Express arrivé',
  EXPRESS_LIVRE: 'Express livré',
};

export const STATUS_COLORS: Record<string, string> = {
  NOUVELLE: colors.statusNew,
  A_APPELER: colors.statusToCall,
  VALIDEE: colors.statusValidated,
  ANNULEE: colors.statusCancelled,
  INJOIGNABLE: colors.statusUnreachable,
  ASSIGNEE: colors.statusAssigned,
  LIVREE: colors.statusDelivered,
  REFUSEE: colors.statusRefused,
  ANNULEE_LIVRAISON: colors.danger,
  RETOURNE: colors.statusReturned,
  EXPEDITION: colors.statusExpedition,
  EXPRESS: colors.statusExpress,
  EXPRESS_ENVOYE: colors.info,
  EXPRESS_ARRIVE: colors.warning,
  EXPRESS_LIVRE: colors.success,
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  GESTIONNAIRE: 'Gestionnaire',
  GESTIONNAIRE_STOCK: 'Gestionnaire Stock',
  APPELANT: 'Appelant',
  LIVREUR: 'Livreur',
};
