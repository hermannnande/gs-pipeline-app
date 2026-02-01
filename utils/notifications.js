import { io } from './socket.js';

/**
 * Types de notifications
 */
export const NotificationTypes = {
  NEW_ORDER: 'NEW_ORDER',
  ORDER_VALIDATED: 'ORDER_VALIDATED',
  ORDER_ASSIGNED: 'ORDER_ASSIGNED',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_REFUSED: 'ORDER_REFUSED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  DELIVERY_LIST_CREATED: 'DELIVERY_LIST_CREATED',
  STOCK_LOW: 'STOCK_LOW',
  REMISE_CONFIRMED: 'REMISE_CONFIRMED',
  RETOUR_CONFIRMED: 'RETOUR_CONFIRMED',
  EXPRESS_ARRIVED: 'EXPRESS_ARRIVED',
  RDV_REMINDER: 'RDV_REMINDER',
  SYSTEM: 'SYSTEM'
};

/**
 * Émetteurs de notifications par rôle
 */
const RoleTargets = {
  ADMIN: 'ADMIN',
  GESTIONNAIRE: 'GESTIONNAIRE',
  GESTIONNAIRE_STOCK: 'GESTIONNAIRE_STOCK',
  APPELANT: 'APPELANT',
  LIVREUR: 'LIVREUR',
  ALL: 'ALL'
};

/**
 * Envoyer une notification à un utilisateur spécifique
 * @param {number} userId - ID de l'utilisateur
 * @param {object} notification - Objet notification
 */
export const sendToUser = (userId, notification) => {
  if (!io) return;
  const room = `user-${userId}`;
  io.to(room).emit('notification', {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  });
  console.log(`📤 Notification envoyée à user-${userId}:`, notification.type);
};

/**
 * Envoyer une notification à un rôle spécifique
 * @param {string} role - Rôle cible (ADMIN, GESTIONNAIRE, etc.)
 * @param {object} notification - Objet notification
 */
export const sendToRole = (role, notification) => {
  if (!io) return;
  io.to(role).emit('notification', {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  });
  console.log(`📤 Notification envoyée au rôle ${role}:`, notification.type);
};

/**
 * Envoyer une notification à tous les utilisateurs connectés
 * @param {object} notification - Objet notification
 */
export const sendToAll = (notification) => {
  if (!io) return;
  io.emit('notification', {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  });
  console.log(`📤 Notification envoyée à tous:`, notification.type);
};

/**
 * NOTIFICATIONS PRÉDÉFINIES PAR ÉVÉNEMENT
 */

// Nouvelle commande reçue
export const notifyNewOrder = (order) => {
  sendToRole(RoleTargets.APPELANT, {
    type: NotificationTypes.NEW_ORDER,
    title: '🔔 Nouvelle commande',
    message: `${order.clientNom} - ${order.clientVille}`,
    data: { orderId: order.id, orderReference: order.orderReference },
    priority: 'high',
    action: {
      label: 'Voir',
      url: '/appelant/orders'
    }
  });
  
  // Notifier aussi les admins et gestionnaires
  sendToRole(RoleTargets.ADMIN, {
    type: NotificationTypes.NEW_ORDER,
    title: '📦 Nouvelle commande reçue',
    message: `${order.clientNom} - ${order.produitNom}`,
    data: { orderId: order.id },
    priority: 'normal'
  });
};

// Commande validée
export const notifyOrderValidated = (order, validatedBy) => {
  // Notifier les gestionnaires
  sendToRole(RoleTargets.GESTIONNAIRE, {
    type: NotificationTypes.ORDER_VALIDATED,
    title: '✅ Commande validée',
    message: `${order.clientNom} - ${order.clientVille} (par ${validatedBy.prenom})`,
    data: { orderId: order.id },
    priority: 'normal',
    action: {
      label: 'Assigner',
      url: '/gestionnaire/orders'
    }
  });
  
  sendToRole(RoleTargets.GESTIONNAIRE_STOCK, {
    type: NotificationTypes.ORDER_VALIDATED,
    title: '✅ Commande validée',
    message: `${order.produitNom} pour ${order.clientVille}`,
    data: { orderId: order.id },
    priority: 'normal'
  });
};

// Commande assignée à un livreur
export const notifyOrderAssigned = (order, deliverer) => {
  // Notifier le livreur assigné
  sendToUser(deliverer.id, {
    type: NotificationTypes.ORDER_ASSIGNED,
    title: '🚚 Nouvelle livraison assignée',
    message: `${order.clientNom} - ${order.clientVille}`,
    data: { orderId: order.id, deliveryListId: order.deliveryListId },
    priority: 'high',
    action: {
      label: 'Voir ma tournée',
      url: '/livreur/overview'
    }
  });
  
  // Notifier le gestionnaire de stock
  sendToRole(RoleTargets.GESTIONNAIRE_STOCK, {
    type: NotificationTypes.ORDER_ASSIGNED,
    title: '📋 Commande assignée',
    message: `${order.clientNom} → ${deliverer.prenom} ${deliverer.nom}`,
    data: { orderId: order.id },
    priority: 'normal'
  });
};

// Tournée créée
export const notifyDeliveryListCreated = (deliveryList, deliverer, orderCount) => {
  // Notifier le livreur
  sendToUser(deliverer.id, {
    type: NotificationTypes.DELIVERY_LIST_CREATED,
    title: `📋 Nouvelle tournée (${orderCount} livraisons)`,
    message: `Zone: ${deliveryList.zone} - ${deliveryList.date}`,
    data: { deliveryListId: deliveryList.id },
    priority: 'high',
    action: {
      label: 'Voir',
      url: '/livreur/overview'
    }
  });
  
  // Notifier le gestionnaire de stock
  sendToRole(RoleTargets.GESTIONNAIRE_STOCK, {
    type: NotificationTypes.DELIVERY_LIST_CREATED,
    title: '📋 Nouvelle tournée créée',
    message: `${orderCount} colis pour ${deliverer.prenom} - ${deliveryList.zone}`,
    data: { deliveryListId: deliveryList.id },
    priority: 'normal',
    action: {
      label: 'Préparer',
      url: '/stock/tournees'
    }
  });
};

// Commande livrée
export const notifyOrderDelivered = (order, deliverer) => {
  // Notifier les gestionnaires
  sendToRole(RoleTargets.GESTIONNAIRE, {
    type: NotificationTypes.ORDER_DELIVERED,
    title: '✅ Commande livrée',
    message: `${order.clientNom} par ${deliverer.prenom}`,
    data: { orderId: order.id },
    priority: 'normal'
  });
  
  // Notifier les admins
  sendToRole(RoleTargets.ADMIN, {
    type: NotificationTypes.ORDER_DELIVERED,
    title: '✅ Livraison réussie',
    message: `${order.produitNom} - ${order.clientVille}`,
    data: { orderId: order.id },
    priority: 'low'
  });
};

// Commande refusée
export const notifyOrderRefused = (order, deliverer) => {
  // Notifier les gestionnaires
  sendToRole(RoleTargets.GESTIONNAIRE, {
    type: NotificationTypes.ORDER_REFUSED,
    title: '❌ Commande refusée',
    message: `${order.clientNom} - ${order.clientVille}`,
    data: { orderId: order.id },
    priority: 'normal'
  });
  
  // Notifier le gestionnaire de stock
  sendToRole(RoleTargets.GESTIONNAIRE_STOCK, {
    type: NotificationTypes.ORDER_REFUSED,
    title: '📦 Commande refusée',
    message: `${order.produitNom} à récupérer chez ${deliverer.prenom}`,
    data: { orderId: order.id },
    priority: 'normal'
  });
};

// Stock faible
export const notifyLowStock = (product) => {
  sendToRole(RoleTargets.GESTIONNAIRE_STOCK, {
    type: NotificationTypes.STOCK_LOW,
    title: '⚠️ Stock faible',
    message: `${product.nom}: ${product.stockActuel} unités restantes`,
    data: { productId: product.id },
    priority: 'high',
    action: {
      label: 'Approvisionner',
      url: '/stock/products'
    }
  });
  
  sendToRole(RoleTargets.ADMIN, {
    type: NotificationTypes.STOCK_LOW,
    title: '⚠️ Alerte stock',
    message: `${product.nom}: Stock critique`,
    data: { productId: product.id },
    priority: 'high'
  });
};

// Remise confirmée
export const notifyRemiseConfirmed = (deliveryList, deliverer, colisCount) => {
  // Notifier le livreur
  sendToUser(deliverer.id, {
    type: NotificationTypes.REMISE_CONFIRMED,
    title: '📦 Colis remis confirmé',
    message: `${colisCount} colis prêts pour livraison`,
    data: { deliveryListId: deliveryList.id },
    priority: 'high',
    action: {
      label: 'Commencer',
      url: '/livreur/overview'
    }
  });
  
  // Notifier les gestionnaires
  sendToRole(RoleTargets.GESTIONNAIRE, {
    type: NotificationTypes.REMISE_CONFIRMED,
    title: '✅ Remise confirmée',
    message: `${colisCount} colis remis à ${deliverer.prenom}`,
    data: { deliveryListId: deliveryList.id },
    priority: 'normal'
  });
};

// Retour confirmé
export const notifyRetourConfirmed = (deliveryList, deliverer, colisCount) => {
  // Notifier les gestionnaires
  sendToRole(RoleTargets.GESTIONNAIRE, {
    type: NotificationTypes.RETOUR_CONFIRMED,
    title: '🔙 Retour confirmé',
    message: `${colisCount} colis retournés par ${deliverer.prenom}`,
    data: { deliveryListId: deliveryList.id },
    priority: 'normal'
  });
  
  // Notifier les admins
  sendToRole(RoleTargets.ADMIN, {
    type: NotificationTypes.RETOUR_CONFIRMED,
    title: '🔙 Colis retournés',
    message: `${colisCount} colis de ${deliverer.prenom}`,
    data: { deliveryListId: deliveryList.id },
    priority: 'low'
  });
};

// EXPRESS arrivé en agence
export const notifyExpressArrived = (order) => {
  // Notifier les appelants
  sendToRole(RoleTargets.APPELANT, {
    type: NotificationTypes.EXPRESS_ARRIVED,
    title: '⚡ EXPRESS arrivé en agence',
    message: `${order.clientNom} - ${order.agenceRetrait}`,
    data: { orderId: order.id },
    priority: 'high',
    action: {
      label: 'Notifier client',
      url: '/gestionnaire/express-agence'
    }
  });
};

// Rappel RDV
export const notifyRdvReminder = (order, appelant) => {
  sendToUser(appelant.id, {
    type: NotificationTypes.RDV_REMINDER,
    title: '📅 Rappel RDV',
    message: `RDV avec ${order.clientNom} aujourd'hui`,
    data: { orderId: order.id },
    priority: 'high',
    action: {
      label: 'Appeler',
      url: '/appelant/rdv'
    }
  });
};

// Notification système
export const notifySystem = (title, message, targetRole = 'ALL', priority = 'normal') => {
  const notification = {
    type: NotificationTypes.SYSTEM,
    title,
    message,
    priority
  };
  
  if (targetRole === 'ALL') {
    sendToAll(notification);
  } else {
    sendToRole(targetRole, notification);
  }
};

