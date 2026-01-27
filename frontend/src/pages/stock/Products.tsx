import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, AlertTriangle, TrendingUp, Search, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';
import type { Product } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustType, setAdjustType] = useState('APPROVISIONNEMENT');
  const [adjustMotif, setAdjustMotif] = useState('');
  const [newProduct, setNewProduct] = useState({
    code: '',
    nom: '',
    description: '',
    prix: '',
    prix2: '',
    prix3: '',
    stockActuel: '',
    stockAlerte: '10'
  });
  const [editProduct, setEditProduct] = useState({
    code: '',
    nom: '',
    description: '',
    prix: '',
    prix2: '',
    prix3: '',
    stockAlerte: ''
  });
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Seul l'ADMIN peut gérer les produits (ajouter, modifier, supprimer)
  const canManageProducts = user?.role === 'ADMIN';

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
        prix2Unites: productData.prix2 ? parseFloat(productData.prix2) : null,
        prix3Unites: productData.prix3 ? parseFloat(productData.prix3) : null,
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
        prix2: '',
        prix3: '',
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

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: any) => {
      const { data } = await api.put(`/products/${id}`, {
        code: productData.code,
        nom: productData.nom,
        description: productData.description || '',
        prixUnitaire: parseFloat(productData.prix),
        prix2Unites: productData.prix2 ? parseFloat(productData.prix2) : null,
        prix3Unites: productData.prix3 ? parseFloat(productData.prix3) : null,
        stockAlerte: parseInt(productData.stockAlerte)
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowEditProductModal(false);
      setSelectedProduct(null);
      toast.success('Produit modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const { data } = await api.delete(`/products/${productId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      toast.success('Produit supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
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

  const openEditModal = (product: any) => {
    setSelectedProduct(product);
    setEditProduct({
      code: product.code,
      nom: product.nom,
      description: product.description || '',
      prix: product.prixUnitaire.toString(),
      prix2: product.prix2Unites ? product.prix2Unites.toString() : '',
      prix3: product.prix3Unites ? product.prix3Unites.toString() : '',
      stockAlerte: product.stockAlerte.toString()
    });
    setShowEditProductModal(true);
  };

  const openDeleteConfirm = (product: any) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const handleUpdateProduct = () => {
    if (!editProduct.code || !editProduct.nom || !editProduct.prix || !editProduct.stockAlerte) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation des prix (prix2 et prix3 doivent être <= au prix correspondant)
    if (editProduct.prix2 && parseFloat(editProduct.prix2) > parseFloat(editProduct.prix) * 2) {
      toast.error('Le prix pour 2 unités semble trop élevé');
      return;
    }
    if (editProduct.prix3 && parseFloat(editProduct.prix3) > parseFloat(editProduct.prix) * 3) {
      toast.error('Le prix pour 3 unités semble trop élevé');
      return;
    }

    updateProductMutation.mutate({
      id: selectedProduct.id,
      productData: editProduct
    });
  };

  const handleDeleteProduct = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };

  const filteredProducts = productsData?.products || [];
  const produitsAlerte = filteredProducts.filter((p: any) => p.stockActuel <= p.stockAlerte);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Inventaire et mouvements de stock</p>
        </div>
        {canManageProducts && (
          <button
            onClick={() => setShowAddProductModal(true)}
            className="btn btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Ajouter un produit</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total produits</p>
          <p className="text-2xl font-bold text-primary-600">{filteredProducts.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Stock disponible</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredProducts.reduce((sum: number, p: any) => sum + p.stockActuel, 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">🚚 En livraison</p>
          <p className="text-2xl font-bold text-blue-600">
            {filteredProducts.reduce((sum: number, p: any) => sum + (p.stockLocalReserve || 0), 0)}
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
          {filteredProducts.map((product: Product) => {
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
                      <span className="text-sm text-gray-600">Stock magasin (disponible)</span>
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
                    
                    {/* Stock EXPRESS - Toujours afficher */}
                    <div className={`mt-2 p-2 rounded-md ${
                      (product.stockExpress || 0) > 0 
                        ? 'bg-amber-50 border border-amber-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs flex items-center gap-1 ${
                          (product.stockExpress || 0) > 0 ? 'text-amber-700' : 'text-gray-600'
                        }`}>
                          ⚡ Stock EXPRESS (en transit / agence)
                        </span>
                        <span className={`text-sm font-bold ${
                          (product.stockExpress || 0) > 0 ? 'text-amber-900' : 'text-gray-500'
                        }`}>
                          {product.stockExpress || 0}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${
                        (product.stockExpress || 0) > 0 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {(product.stockExpress || 0) > 0 
                          ? 'Colis EXPRESS payés (10%) et envoyés / en cours vers agence'
                          : 'Aucune réservation EXPRESS'
                        }
                      </p>
                    </div>
                    
                    {/* Stock LOCAL réservé - En livraison avec livreurs */}
                    <div className={`mt-2 p-2 rounded-md ${
                      (product.stockLocalReserve || 0) > 0 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs flex items-center gap-1 ${
                          (product.stockLocalReserve || 0) > 0 ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          🚚 Stock en livraison
                        </span>
                        <span className={`text-sm font-bold ${
                          (product.stockLocalReserve || 0) > 0 ? 'text-blue-900' : 'text-gray-500'
                        }`}>
                          {product.stockLocalReserve || 0}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${
                        (product.stockLocalReserve || 0) > 0 ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {(product.stockLocalReserve || 0) > 0 
                          ? 'Stock sorti avec les livreurs'
                          : 'Aucune commande en livraison'
                        }
                      </p>
                    </div>
                    
                    {/* Stock total */}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">📊 Stock total (magasin + transit/agence + livreurs)</span>
                        <span className="text-sm font-bold text-primary-600">
                          {product.stockActuel + (product.stockExpress || 0) + (product.stockLocalReserve || 0)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Formule: magasin ({product.stockActuel}) + express ({product.stockExpress || 0}) + livraison ({product.stockLocalReserve || 0})
                      </p>
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

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">💰 Prix x1</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(product.prixUnitaire)}
                      </span>
                    </div>
                    {(product as any).prix2Unites && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600">💰 Prix x2</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency((product as any).prix2Unites)}
                        </span>
                      </div>
                    )}
                    {(product as any).prix3Unites && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-600">💰 Prix x3</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency((product as any).prix3Unites)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => openAdjustModal(product)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <TrendingUp size={18} />
                    Ajuster le stock
                  </button>
                  
                  {canManageProducts && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        Modifier
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(product)}
                        className="btn bg-red-600 text-white hover:bg-red-700 flex-1 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
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

      {/* Modal d'édition de produit */}
      {showEditProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Modifier le produit</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code (product_key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editProduct.code}
                  onChange={(e) => setEditProduct({ ...editProduct, code: e.target.value.toUpperCase() })}
                  className="input"
                  placeholder="Ex: GAINE_TOURMALINE"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Doit correspondre au product_key de Google Apps Script. Pas d'espaces ni d'accents.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editProduct.nom}
                  onChange={(e) => setEditProduct({ ...editProduct, nom: e.target.value })}
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
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Description du produit..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-blue-900 mb-3">💰 Tarification par paliers</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix pour 1 unité (XOF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editProduct.prix}
                      onChange={(e) => setEditProduct({ ...editProduct, prix: e.target.value })}
                      className="input"
                      placeholder="Ex: 9900"
                      required
                      min="0"
                      step="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix pour 2 unités (XOF) - Optionnel
                    </label>
                    <input
                      type="number"
                      value={editProduct.prix2}
                      onChange={(e) => setEditProduct({ ...editProduct, prix2: e.target.value })}
                      className="input"
                      placeholder="Ex: 18000 (réduction)"
                      min="0"
                      step="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prix total si le client commande 2 unités. Laissez vide pour utiliser prix x 2
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix pour 3 unités (XOF) - Optionnel
                    </label>
                    <input
                      type="number"
                      value={editProduct.prix3}
                      onChange={(e) => setEditProduct({ ...editProduct, prix3: e.target.value })}
                      className="input"
                      placeholder="Ex: 25000 (réduction)"
                      min="0"
                      step="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prix total si le client commande 3 unités ou plus. Laissez vide pour utiliser prix x 3
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil d'alerte <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editProduct.stockAlerte}
                  onChange={(e) => setEditProduct({ ...editProduct, stockAlerte: e.target.value })}
                  className="input"
                  placeholder="Ex: 10"
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alerte si le stock descend sous ce seuil
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ℹ️ Le stock actuel ne peut être modifié ici. Utilisez "Ajuster le stock" pour cela.
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  Stock actuel : <span className="text-primary-600">{selectedProduct.stockActuel}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateProduct}
                disabled={!editProduct.code || !editProduct.nom || !editProduct.prix || !editProduct.stockAlerte || updateProductMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {updateProductMutation.isPending ? 'Modification...' : 'Enregistrer les modifications'}
              </button>
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setSelectedProduct(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {showDeleteConfirm && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Supprimer le produit</h2>
                <p className="text-sm text-gray-600">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900">{selectedProduct.nom}</p>
              <p className="text-sm text-gray-600">Code: {selectedProduct.code}</p>
              <p className="text-sm text-gray-600 mt-2">
                Stock actuel: <strong>{selectedProduct.stockActuel}</strong>
              </p>
            </div>

            <p className="text-sm text-gray-700 mb-6">
              ⚠️ Êtes-vous sûr de vouloir supprimer ce produit ? Toutes les données associées seront perdues.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleDeleteProduct}
                disabled={deleteProductMutation.isPending}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
              >
                {deleteProductMutation.isPending ? 'Suppression...' : 'Oui, supprimer'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedProduct(null);
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
                  ⚠️ Doit correspondre au product_key de Google Apps Script. Pas d'espaces ni d'accents.
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-blue-900 mb-3">💰 Tarification par paliers</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix pour 1 unité (XOF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newProduct.prix}
                      onChange={(e) => setNewProduct({ ...newProduct, prix: e.target.value })}
                      className="input"
                      placeholder="Ex: 9900"
                      required
                      min="0"
                      step="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix pour 2 unités (XOF) - Optionnel
                    </label>
                    <input
                      type="number"
                      value={newProduct.prix2}
                      onChange={(e) => setNewProduct({ ...newProduct, prix2: e.target.value })}
                      className="input"
                      placeholder="Ex: 18000 (réduction)"
                      min="0"
                      step="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prix total si le client commande 2 unités. Laissez vide pour utiliser prix x 2
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix pour 3 unités (XOF) - Optionnel
                    </label>
                    <input
                      type="number"
                      value={newProduct.prix3}
                      onChange={(e) => setNewProduct({ ...newProduct, prix3: e.target.value })}
                      className="input"
                      placeholder="Ex: 25000 (réduction)"
                      min="0"
                      step="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prix total si le client commande 3 unités ou plus. Laissez vide pour utiliser prix x 3
                    </p>
                  </div>
                </div>
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
                    prix2: '',
                    prix3: '',
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

