import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: 'low' | 'normal' | 'high';
  data?: any;
  action?: {
    label: string;
    url: string;
  };
}

export default function NotificationCenter() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // NOTE: Les notifications temps réel via Socket.io sont désactivées en mode Vercel serverless.
  // Le composant reste affiché pour permettre une évolution future (Supabase Realtime / polling).
  useEffect(() => {
    if (!user) return;
  }, [user]);

  // Jouer un son de notification
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore les erreurs si le son ne peut pas être joué
      });
    } catch (error) {
      // Ignore
    }
  };

  // Marquer une notification comme lue
  const markAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marquer toutes comme lues
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // Supprimer une notification
  const deleteNotification = (notificationId: number) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === notificationId);
      if (notif && !notif.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  // Effacer toutes les notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Gérer les actions de notification
  const handleAction = (notification: Notification) => {
    if (notification.action?.url) {
      window.location.href = notification.action.url;
      markAsRead(notification.id);
      setShowPanel(false);
    }
  };

  // Couleurs selon la priorité
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'normal':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-4 border-gray-400 bg-gray-50';
      default:
        return 'border-l-4 border-gray-400 bg-gray-50';
    }
  };

  // Formater le temps écoulé
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  };

  return (
    <div className="relative">
      {/* Bouton Bell avec badge */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel des notifications */}
      {showPanel && (
        <>
          {/* Overlay pour fermer */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-white text-primary-600 text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      className="p-1 hover:bg-primary-800 rounded transition-colors"
                      title="Marquer tout comme lu"
                    >
                      <CheckCheck size={18} />
                    </button>
                    <button
                      onClick={clearAll}
                      className="p-1 hover:bg-primary-800 rounded transition-colors"
                      title="Effacer tout"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Aucune notification</p>
                  <p className="text-sm mt-1">Vous êtes à jour ! 🎉</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      } ${getPriorityColor(notification.priority)}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold text-sm ${!notification.read ? 'text-primary-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="h-2 w-2 bg-primary-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-primary-600 hover:bg-primary-100 rounded transition-colors"
                              title="Marquer comme lu"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Action button */}
                      {notification.action && (
                        <button
                          onClick={() => handleAction(notification)}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {notification.action.label} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

