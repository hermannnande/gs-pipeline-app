import { Phone, MapPin, Package, Calendar, DollarSign, Clock, Edit2, CheckSquare, Square, MoreVertical } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';
import type { Order } from '@/types';
import { useState } from 'react';

interface OrderCardProps {
  order: Order;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onSelect?: (id: number) => void;
  onCall?: (order: Order) => void;
  onNotify?: (orderId: number) => void;
  onValidate?: (order: Order) => void;
  onReject?: (order: Order) => void;
  onScheduleRdv?: (order: Order) => void;
  onExpedition?: (order: Order) => void;
  onExpress?: (order: Order) => void;
  onEditQuantity?: (order: Order) => void;
  canEditQuantity?: boolean;
  showActions?: 'toCall' | 'manage';
}

export function OrderCard({
  order,
  isSelected,
  showCheckbox,
  onSelect,
  onCall,
  onNotify,
  onValidate,
  onReject,
  onScheduleRdv,
  onExpedition,
  onExpress,
  onEditQuantity,
  canEditQuantity,
  showActions = 'toCall',
}: OrderCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      NOUVELLE: { label: 'Nouvelle', className: 'badge badge-primary' },
      A_APPELER: { label: 'À appeler', className: 'badge bg-orange-100 text-orange-700 ring-1 ring-orange-200' },
      VALIDEE: { label: 'Validée', className: 'badge badge-success' },
      ANNULEE: { label: 'Annulée', className: 'badge bg-red-100 text-red-700 ring-1 ring-red-200' },
      INJOIGNABLE: { label: 'Injoignable', className: 'badge bg-gray-100 text-gray-700 ring-1 ring-gray-200' },
    };
    const badge = badges[status] || badges['NOUVELLE'];
    return <span className={badge.className}>{badge.label}</span>;
  };

  const timeSinceCreation = () => {
    const now = new Date().getTime();
    const created = new Date(order.createdAt).getTime();
    const diffMinutes = Math.floor((now - created) / 1000 / 60);
    
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffMinutes / 1440)} j`;
  };

  return (
    <div className={`card-compact relative group hover:shadow-card-hover transition-all duration-300 ${isSelected ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''}`}>
      {/* Header avec sélection */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {showCheckbox && onSelect && (
            <button
              onClick={() => onSelect(order.id)}
              className="mt-1 hover:scale-110 transition-transform"
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-primary-600" />
              ) : (
                <Square size={20} className="text-gray-400 hover:text-primary-600" />
              )}
            </button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-900">{order.clientNom}</h3>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>{timeSinceCreation()}</span>
            </div>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical size={18} className="text-gray-400" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10 animate-slide-down">
              {canEditQuantity && onEditQuantity && (
                <button
                  onClick={() => {
                    onEditQuantity(order);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Edit2 size={16} />
                  Modifier la quantité
                </button>
              )}
              {onScheduleRdv && (
                <button
                  onClick={() => {
                    onScheduleRdv(order);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Calendar size={16} />
                  Programmer un RDV
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Informations principales */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Phone size={16} className="text-primary-600" />
          <a href={`tel:${order.clientTelephone}`} className="font-medium hover:text-primary-600 transition-colors">
            {order.clientTelephone}
          </a>
        </div>
        
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin size={16} className="text-green-600" />
          <span>{order.clientVille}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-700">
          <Package size={16} className="text-orange-600" />
          <span className="flex-1">{order.produitNom}</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            x{order.quantite}
          </span>
        </div>
      </div>

      {/* Montant */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-blue-600" />
          <span className="text-sm text-gray-600">Montant</span>
        </div>
        <span className="text-xl font-bold text-gray-900 font-display">
          {formatCurrency(order.montant)}
        </span>
      </div>

      {/* Notes si présentes */}
      {order.note && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
          "{order.note}"
        </div>
      )}

      {/* Actions rapides */}
      {showActions === 'toCall' && (
        <div className="grid grid-cols-3 gap-2">
          {onNotify && (
            <button
              onClick={() => onNotify(order.id)}
              className="btn bg-blue-600 text-white hover:bg-blue-700 text-sm py-2"
              title="Notifier le client"
            >
              🔔
            </button>
          )}
          {onCall && (
            <button
              onClick={() => onCall(order)}
              className="btn btn-primary text-sm py-2"
            >
              <Phone size={16} />
              Traiter
            </button>
          )}
          {onScheduleRdv && (
            <button
              onClick={() => onScheduleRdv(order)}
              className="btn bg-purple-600 text-white hover:bg-purple-700 text-sm py-2"
            >
              <Calendar size={16} />
              RDV
            </button>
          )}
        </div>
      )}
      
      {showActions === 'manage' && (
        <div className="grid grid-cols-2 gap-2">
          {onValidate && (
            <button
              onClick={() => onValidate(order)}
              className="btn btn-success text-sm py-2"
            >
              Valider
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(order)}
              className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm py-2"
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  );
}

