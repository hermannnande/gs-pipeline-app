import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustType, setAdjustType] = useState('APPROVISIONNEMENT');
  const [adjustMotif, setAdjustMotif] = useState('');
  const [newProduct, setNewProduct] = useState({
    code: '',
    nom: '',
    description: '',
    prix: '',
    stockActuel: '',
    stockAlerte: '10'
  });
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: { actif: true, search: searchTerm || undefined }
      });
      return data;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const { data } = await api.post('/products', {
        code: productData.code,
        nom: productData.nom,
        description: productData.description || '',
        prixUnitaire: parseFloat(productData.prix),
        stockActuel: parseInt(productData.stockActuel),
        stockAlerte: parseInt(productData.stockAlerte)
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowAddProductModal(false);
      setNewProduct({
        code: '',
        nom: '',
        description: '',
        prix: '',
        stockActuel: '',
        stockAlerte: '10'
      });
      toast.success('Produit créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du produit');
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({ productId, quantite, type, motif }: any) => {
      const { data } = await api.post(`/products/${productId}/stock/adjust`, {
        quantite: parseInt(quantite),
        type,
        motif
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
      setShowAddStockModal(false);
      setSelectedProduct(null);
      setAdjustQuantity('');
      setAdjustMotif('');
      toast.success('Stock ajusté avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajustement');
    },
  });

  const handleCreateProduct = () => {
    if (!newProduct.code || !newProduct.nom || !newProduct.prix || !newProduct.stockActuel) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    createProductMutation.mutate(newProduct);
  };

  const handleAdjustStock = () => {
    if (!selectedProduct || !adjustQuantity || !adjustMotif) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    adjustStockMutation.mutate({
      productId: selectedProduct.id,
      quantite: adjustQuantity,
      type: adjustType,
      motif: adjustMotif
    });
  };

  const openAdjustModal = (product: any) => {
    setSelectedProduct(product);
    setShowAddStockModal(true);
  };

  const filteredProducts = productsData?.products || [];
  const produitsAlerte = filteredProducts.filter((p: any) => p.stockActuel <= p.stockAlerte);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-600 mt-1">Inventaire et mouvements de stock</p>
        </div>
        <button
          onClick={() => setShowAddProductModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Ajouter un produit
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total produits</p>
          <p className="text-2xl font-bold text-primary-600">{filteredProducts.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Stock total</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredProducts.reduce((sum: number, p: any) => sum + p.stockActuel, 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Alertes stock</p>
          <p className="text-2xl font-bold text-red-600">{produitsAlerte.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Valeur stock</p>
          <p className="text-xl font-bold text-purple-600">
            {formatCurrency(filteredProducts.reduce((sum: number, p: any) => sum + (p.stockActuel * p.prixUnitaire), 0))}
          </p>
        </div>
      </div>

      {/* Recherche */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Liste des produits */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product: any) => {
            const isLowStock = product.stockActuel <= product.stockAlerte;
            const stockPercentage = (product.stockActuel / (product.stockAlerte * 3)) * 100;
            
            return (
              <div
                key={product.id}
                className={`card ${isLowStock ? 'border-2 border-red-300' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{product.nom}</h3>
                    <p className="text-sm text-gray-600">{product.code}</p>
                  </div>
                  {isLowStock && (
                    <AlertTriangle size={24} className="text-red-500" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Stock actuel</span>
                      <span className={`text-2xl font-bold ${
                        isLowStock ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {product.stockActuel}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isLowStock ? 'bg-red-500' : 
                          stockPercentage < 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Seuil d'alerte: {product.stockAlerte}
                    </p>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 border-t pt-3">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-gray-600">Prix unitaire</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(product.prixUnitaire)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openAdjustModal(product)}
                  className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  <TrendingUp size={18} />
                  Ajuster le stock
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajustement de stock */}
      {showAddStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Ajuster le stock</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{selectedProduct.nom}</p>
              <p className="text-sm text-gray-600">Code: {selectedProduct.code}</p>
              <p className="text-lg font-bold text-primary-600 mt-2">
                Stock actuel: {selectedProduct.stockActuel}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'ajustement
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="input"
                >
                  <option value="APPROVISIONNEMENT">Approvisionnement (+)</option>
                  <option value="CORRECTION">Correction (+/-)</option>
                  <option value="PERTE">Perte/Casse (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité {adjustType === 'PERTE' ? '(valeur négative)' : ''}
                </label>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="input"
                  placeholder={adjustType === 'PERTE' ? 'Ex: -5' : 'Ex: 50'}
                  required
                />
                {adjustQuantity && (
                  <p className="text-sm text-gray-600 mt-1">
                    Nouveau stock: {' '}
                    <strong className={
                      selectedProduct.stockActuel + parseInt(adjustQuantity || 0) < 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }>
                      {selectedProduct.stockActuel + parseInt(adjustQuantity || 0)}
                    </strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif (obligatoire)
                </label>
                <textarea
                  value={adjustMotif}
                  onChange={(e) => setAdjustMotif(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Ex: Réception fournisseur, Inventaire physique, Casse..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAdjustStock}
                disabled={!adjustQuantity || !adjustMotif || adjustStockMutation.isPending}
                className="btn btn-primary flex-1"
              >
                Valider l'ajustement
              </button>
              <button
                onClick={() => {
                  setShowAddStockModal(false);
                  setSelectedProduct(null);
                  setAdjustQuantity('');
                  setAdjustMotif('');
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout de produit */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Ajouter un produit</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code (product_key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.code}
                  onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value.toUpperCase() })}
                  className="input"
                  placeholder="Ex: GAINE_TOURMALINE"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Doit correspondre au product_key de Make. Pas d'espaces ni d'accents.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.nom}
                  onChange={(e) => setNewProduct({ ...newProduct, nom: e.target.value })}
                  className="input"
                  placeholder="Ex: Gaine Tourmaline Amincissante"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Description du produit..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix unitaire (XOF) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newProduct.prix}
                  onChange={(e) => setNewProduct({ ...newProduct, prix: e.target.value })}
                  className="input"
                  placeholder="Ex: 45000"
                  required
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock actuel <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newProduct.stockActuel}
                  onChange={(e) => setNewProduct({ ...newProduct, stockActuel: e.target.value })}
                  className="input"
                  placeholder="Ex: 100"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil d'alerte <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newProduct.stockAlerte}
                  onChange={(e) => setNewProduct({ ...newProduct, stockAlerte: e.target.value })}
                  className="input"
                  placeholder="Ex: 10"
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alerte si le stock descend sous ce seuil
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateProduct}
                disabled={!newProduct.code || !newProduct.nom || !newProduct.prix || !newProduct.stockActuel || createProductMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {createProductMutation.isPending ? 'Création...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setNewProduct({
                    code: '',
                    nom: '',
                    description: '',
                    prix: '',
                    stockActuel: '',
                    stockAlerte: '10'
                  });
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

