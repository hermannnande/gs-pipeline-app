export type UserRole = 'ADMIN' | 'GESTIONNAIRE' | 'GESTIONNAIRE_STOCK' | 'APPELANT' | 'LIVREUR';

export type OrderStatus =
  | 'NOUVELLE'
  | 'A_APPELER'
  | 'VALIDEE'
  | 'ANNULEE'
  | 'INJOIGNABLE'
  | 'ASSIGNEE'
  | 'LIVREE'
  | 'REFUSEE'
  | 'ANNULEE_LIVRAISON'
  | 'RETOURNE'
  | 'EXPEDITION'
  | 'EXPRESS'
  | 'EXPRESS_ARRIVE'
  | 'EXPRESS_LIVRE';

export type DeliveryType = 'LOCAL' | 'EXPEDITION' | 'EXPRESS';

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: UserRole;
  actif: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  orderReference: string;
  clientNom: string;
  clientTelephone: string;
  clientVille: string;
  clientCommune?: string;
  clientAdresse?: string;
  produitNom: string;
  produitPage?: string;
  quantite: number;
  montant: number;
  sourceCampagne?: string;
  sourcePage?: string;
  status: OrderStatus;
  callerId?: number;
  caller?: {
    id: number;
    nom: string;
    prenom: string;
  };
  delivererId?: number;
  deliverer?: {
    id: number;
    nom: string;
    prenom: string;
  };
  noteAppelant?: string;
  noteLivreur?: string;
  noteGestionnaire?: string;
  calledAt?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  deliveredAt?: string;
  statusHistory?: StatusHistory[];
  // Gestion des retours
  raisonRetour?: string;
  retourneAt?: string;
  // Nouveaux champs pour EXPÉDITION & EXPRESS
  deliveryType?: DeliveryType;
  montantPaye?: number;
  montantRestant?: number;
  modePaiement?: string;
  referencePayment?: string;
  clientNotifie?: boolean;
  notifieAt?: string;
  notifiePar?: number;
  agenceRetrait?: string;
  expedieAt?: string;
  arriveAt?: string;
  codeExpedition?: string;
  photoRecuExpedition?: string; // Photo du reçu d'expédition (base64)
}

export interface StatusHistory {
  id: number;
  orderId: number;
  oldStatus?: OrderStatus;
  newStatus: OrderStatus;
  changedBy: number;
  comment?: string;
  createdAt: string;
}

export interface DeliveryList {
  id: number;
  nom: string;
  date: string;
  delivererId: number;
  deliverer: {
    id: number;
    nom: string;
    prenom: string;
    telephone?: string;
  };
  zone?: string;
  orders: Order[];
  createdAt: string;
  updatedAt: string;
}

export interface CallStatistic {
  user: {
    id: number;
    nom: string;
    prenom: string;
  };
  totalAppels: number;
  totalValides: number;
  totalAnnules: number;
  totalInjoignables: number;
  tauxValidation: string;
}

export interface DeliveryStatistic {
  user: {
    id: number;
    nom: string;
    prenom: string;
  };
  totalLivraisons: number;
  totalRefusees: number;
  totalAnnulees: number;
  montantLivre: number;
  tauxReussite: string;
}

export interface OverviewStats {
  totalOrders: number;
  newOrders: number;
  validatedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  conversionRate: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ExpeditionData {
  montantPaye: number;
  modePaiement: string;
  referencePayment?: string;
  note?: string;
}

export interface ExpressData {
  montantPaye: number;
  modePaiement: string;
  referencePayment?: string;
  agenceRetrait: string;
  note?: string;
}

export interface Product {
  id: number;
  code: string;
  nom: string;
  description?: string;
  prixUnitaire: number;
  stockActuel: number;
  stockExpress: number;
  stockAlerte: number;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

