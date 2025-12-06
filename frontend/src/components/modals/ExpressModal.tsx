import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Zap, X } from 'lucide-react';
import type { Order, ExpressData } from '@/types';

interface ExpressModalProps {
  order: Order;
  onClose: () => void;
}

export default function ExpressModal({ order, onClose }: ExpressModalProps) {
  const dixPourcent = Math.round(order.montant * 0.10);
  
  const [formData, setFormData] = useState<ExpressData>({
    montantPaye: dixPourcent,
    modePaiement: '',
    referencePayment: '',
    agenceRetrait: '',
    note: '',
  });
  
  const [montantRestant, setMontantRestant] = useState(order.montant - dixPourcent);
  
  useEffect(() => {
    setMontantRestant(order.montant - formData.montantPaye);
  }, [formData.montantPaye, order.montant]);
  
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => ordersApi.createExpress(order.id, formData),
    onSuccess: () => {
      toast.success('✅ Commande transférée en EXPRESS');
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création de l\'express');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modePaiement) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }
    if (!formData.agenceRetrait) {
      toast.error('Veuillez sélectionner une agence de retrait');
      return;
    }
    if (formData.montantPaye < dixPourcent * 0.8) {
      toast.error(`Le montant payé doit être au moins ${dixPourcent} FCFA (10% du total)`);
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-amber-600" size={24} />
            EXPRESS - Paiement partiel
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={mutation.isPending}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 mb-1">
            <strong>Client :</strong> {order.clientNom}
          </p>
          <p className="text-sm text-amber-800 mb-1">
            <strong>Ville :</strong> {order.clientVille}
          </p>
          <p className="text-sm text-amber-800 mb-2">
            <strong>Produit :</strong> {order.produitNom} (x{order.quantite})
          </p>
          <div className="border-t border-amber-200 pt-2 mt-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs text-amber-700">Montant total</p>
                <p className="text-sm font-bold text-amber-900">
                  {order.montant.toLocaleString()} FCFA
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Acompte (10%)</p>
                <p className="text-sm font-bold text-amber-900">
                  {dixPourcent.toLocaleString()} FCFA
                </p>
              </div>
            </div>
            <div className="bg-amber-100 rounded p-2">
              <p className="text-xs text-amber-700">À payer au retrait (90%)</p>
              <p className="text-lg font-bold text-amber-900">
                {montantRestant.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant payé (acompte) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.montantPaye}
              onChange={(e) => setFormData({...formData, montantPaye: parseFloat(e.target.value) || 0})}
              className="input"
              min={dixPourcent * 0.8}
              max={order.montant}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum : {dixPourcent.toLocaleString()} FCFA (10%)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de paiement <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.modePaiement}
              onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
              className="input"
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="Orange Money">Orange Money</option>
              <option value="MTN Money">MTN Money</option>
              <option value="Moov Money">Moov Money</option>
              <option value="Wave">Wave</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence de transaction
            </label>
            <input
              type="text"
              value={formData.referencePayment}
              onChange={(e) => setFormData({...formData, referencePayment: e.target.value})}
              className="input"
              placeholder="Ex: TRX123456789"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agence de retrait <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.agenceRetrait}
              onChange={(e) => setFormData({...formData, agenceRetrait: e.target.value})}
              className="input"
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="Agence Cotonou Centre">Agence Cotonou Centre</option>
              <option value="Agence Porto-Novo">Agence Porto-Novo</option>
              <option value="Agence Parakou">Agence Parakou</option>
              <option value="Agence Abomey-Calavi">Agence Abomey-Calavi</option>
              <option value="Agence Bohicon">Agence Bohicon</option>
              <option value="Agence Djougou">Agence Djougou</option>
              <option value="Agence Natitingou">Agence Natitingou</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (optionnel)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="input"
              rows={3}
              placeholder="Informations complémentaires..."
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">📌 Important :</p>
            <p>Le client devra payer <strong>{montantRestant.toLocaleString()} FCFA</strong> lors du retrait du colis à l'agence <strong>{formData.agenceRetrait || '...'}</strong>.</p>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={mutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn bg-amber-600 text-white hover:bg-amber-700 flex-1"
              disabled={!formData.modePaiement || !formData.agenceRetrait || mutation.isPending}
            >
              {mutation.isPending ? 'Traitement...' : 'Confirmer EXPRESS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

