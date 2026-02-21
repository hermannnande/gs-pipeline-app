import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');

interface Product {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  prixUnitaire: number;
  prix2Unites: number | null;
  prix3Unites: number | null;
}

const VILLES_CI = [
  'Abidjan',
  'Yamoussoukro',
  'Bouaké',
  'Daloa',
  'San Pedro',
  'Korhogo',
  'Man',
  'Gagnoa',
  'Divo',
  'Soubré',
  'Abengourou',
  'Anyama',
  'Bingerville',
  'Grand-Bassam',
  'Dabou',
  'Adzopé',
  'Agboville',
  'Issia',
  'Sinfra',
  'Duékoué',
  'Bouaflé',
  'Dimbokro',
  'Toumodi',
  'Tiébissou',
  'Bonon',
  'Beoumi',
  'Bocanda',
  'Gabiadji',
  'Gonaté',
  'Guibéroua',
  'Hiré',
  'Méagui',
  'Yabayo',
  'Oumé',
  'Lakota',
  'Sassandra',
  'Tabou',
  'Ferkessédougou',
  'Boundiali',
  'Odienné',
  'Séguéla',
  'Mankono',
  'Katiola',
  'Bondoukou',
  'Bouna',
  'Tanda',
  'Agnibilékrou',
  'Bettié',
  'Danané',
  'Guiglo',
  'Bangolo',
  'Zuénoula',
  'Vavoua',
  'Tiassalé',
  'Jacqueville',
  'Taabo',
];

function formatPrice(price: number): string {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

function getTotal(product: Product | null, qty: number): number {
  if (!product) return 0;
  if (qty === 1) return product.prixUnitaire;
  if (qty === 2 && product.prix2Unites) return product.prix2Unites;
  if (qty >= 3 && product.prix3Unites) return product.prix3Unites;
  return product.prixUnitaire * qty;
}

export default function OrderForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [error, setError] = useState('');

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerCommune, setCustomerCommune] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const filteredCities = useMemo(
    () => citySearch
      ? VILLES_CI.filter(v => v.toLowerCase().includes(citySearch.toLowerCase()))
      : VILLES_CI,
    [citySearch]
  );

  const filteredProducts = useMemo(
    () => productSearch
      ? products.filter(p => p.nom.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase()))
      : products,
    [products, productSearch]
  );

  useEffect(() => {
    axios.get(`${API_URL}/public/products`)
      .then(res => setProducts(res.data.products || []))
      .catch(() => setError('Impossible de charger les produits.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProductId) { setError('Veuillez sélectionner un produit.'); return; }
    if (!customerName.trim()) { setError('Veuillez entrer votre nom.'); return; }
    if (!customerPhone.trim()) { setError('Veuillez entrer votre numéro de téléphone.'); return; }
    if (!customerCity.trim()) { setError('Veuillez sélectionner votre ville.'); return; }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/public/order`, {
        productId: selectedProductId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCity: customerCity.trim(),
        customerCommune: customerCommune.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        quantity,
      });
      setSuccess(true);
      setOrderRef(res.data.orderReference || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setOrderRef('');
    setSelectedProductId(null);
    setQuantity(1);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCity('');
    setCustomerCommune('');
    setCustomerAddress('');
    setCitySearch('');
    setProductSearch('');
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">Commande envoyée !</h2>
          <p className="text-gray-500 mb-6">
            Votre commande a été enregistrée avec succès. Notre équipe vous contactera très bientôt pour confirmer votre commande.
          </p>
          {orderRef && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Référence</p>
              <p className="text-sm font-mono text-gray-700 break-all">{orderRef.slice(0, 8).toUpperCase()}</p>
            </div>
          )}
          <button
            onClick={resetForm}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-sky-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            Passer une nouvelle commande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-4">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Livraison disponible
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display mb-2">
            Passer une commande
          </h1>
          <p className="text-sky-100 text-base sm:text-lg">
            Remplissez le formulaire ci-dessous pour commander
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-12">
        <form onSubmit={handleSubmit} className="space-y-0">
          {/* Section Produit */}
          <div className="bg-white rounded-t-3xl rounded-b-none shadow-xl border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Choisissez votre produit</h2>
                <p className="text-sm text-gray-400">Sélectionnez le produit qui vous intéresse</p>
              </div>
            </div>

            {/* Product selector */}
            <div className="relative mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Produit <span className="text-red-400">*</span></label>
              <div
                className="relative"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setTimeout(() => setShowProductDropdown(false), 150);
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={selectedProduct ? (showProductDropdown ? productSearch : selectedProduct.nom) : productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                    if (selectedProduct) setSelectedProductId(null);
                  }}
                  onFocus={() => {
                    setShowProductDropdown(true);
                    if (selectedProduct) setProductSearch('');
                  }}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all duration-200 bg-gray-50/50 text-base placeholder:text-gray-400"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {showProductDropdown && (
                  <div className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">Aucun produit trouvé</div>
                    ) : (
                      filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setProductSearch('');
                            setShowProductDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors border-b border-gray-50 last:border-0 ${selectedProductId === p.id ? 'bg-sky-50' : ''}`}
                        >
                          <div className="font-medium text-gray-900">{p.nom}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="text-sky-600 font-semibold">{formatPrice(p.prixUnitaire)}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-400">{p.code}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected product card */}
            {selectedProduct && (
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-5 animate-fade-in">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedProduct.nom}</h3>
                    {selectedProduct.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{selectedProduct.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedProductId(null); setProductSearch(''); }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Price tiers */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-sm border border-sky-200">
                    <span className="text-gray-500">1 unité :</span>
                    <span className="font-bold text-sky-700">{formatPrice(selectedProduct.prixUnitaire)}</span>
                  </span>
                  {selectedProduct.prix2Unites && (
                    <span className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-sm border border-emerald-200">
                      <span className="text-gray-500">2 unités :</span>
                      <span className="font-bold text-emerald-700">{formatPrice(selectedProduct.prix2Unites)}</span>
                    </span>
                  )}
                  {selectedProduct.prix3Unites && (
                    <span className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-sm border border-purple-200">
                      <span className="text-gray-500">3+ unités :</span>
                      <span className="font-bold text-purple-700">{formatPrice(selectedProduct.prix3Unites)}</span>
                    </span>
                  )}
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Quantité</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-600 hover:border-sky-400 hover:text-sky-600 transition-all active:scale-90"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-gray-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.min(10, q + 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-600 hover:border-sky-400 hover:text-sky-600 transition-all active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-sky-200 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="text-2xl font-bold text-sky-700">{formatPrice(getTotal(selectedProduct, quantity))}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section Informations client */}
          <div className="bg-white border-x border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-green-200">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Vos informations</h2>
                <p className="text-sm text-gray-400">Pour vous contacter et livrer votre commande</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Kouadio Jean"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 bg-gray-50/50 text-base placeholder:text-gray-400"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">+225</span>
                  <input
                    type="tel"
                    placeholder="07 XX XX XX XX"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full pl-16 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 bg-gray-50/50 text-base placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Ville */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville <span className="text-red-400">*</span></label>
                <div
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setTimeout(() => setShowCityDropdown(false), 150);
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder="Rechercher votre ville..."
                    value={customerCity || citySearch}
                    onChange={e => {
                      setCitySearch(e.target.value);
                      setCustomerCity('');
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => {
                      setShowCityDropdown(true);
                      if (customerCity) { setCitySearch(customerCity); setCustomerCity(''); }
                    }}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 bg-gray-50/50 text-base placeholder:text-gray-400"
                  />
                  {showCityDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                      {filteredCities.length === 0 ? (
                        <div className="p-3 text-center text-gray-400 text-sm">Aucune ville trouvée</div>
                      ) : (
                        filteredCities.map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setCustomerCity(v);
                              setCitySearch('');
                              setShowCityDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors text-sm border-b border-gray-50 last:border-0 ${customerCity === v ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}`}
                          >
                            {v}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Commune */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Commune <span className="text-gray-300">(optionnel)</span></label>
                <input
                  type="text"
                  placeholder="Ex: Cocody, Yopougon..."
                  value={customerCommune}
                  onChange={e => setCustomerCommune(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 bg-gray-50/50 text-base placeholder:text-gray-400"
                />
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse de livraison <span className="text-gray-300">(optionnel)</span></label>
                <textarea
                  placeholder="Indications pour faciliter la livraison..."
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 bg-gray-50/50 text-base placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section Récapitulatif + Submit */}
          <div className="bg-white rounded-b-3xl shadow-xl border border-gray-100 border-t-0 p-6 sm:p-8">
            {/* Recap */}
            {selectedProduct && customerName && customerPhone && customerCity && (
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-5 mb-6 animate-fade-in">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Produit</span>
                    <span className="font-medium text-gray-900">{selectedProduct.nom} x{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="font-medium text-gray-900">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Téléphone</span>
                    <span className="font-medium text-gray-900">{customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ville</span>
                    <span className="font-medium text-gray-900">{customerCity}{customerCommune ? `, ${customerCommune}` : ''}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Total à payer</span>
                    <span className="font-bold text-lg text-sky-700">{formatPrice(getTotal(selectedProduct, quantity))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3 animate-fade-in">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !selectedProductId}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-lg rounded-2xl hover:from-sky-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-300/40 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Passer la commande
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              Paiement à la livraison. Notre équipe vous contactera pour confirmer.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
