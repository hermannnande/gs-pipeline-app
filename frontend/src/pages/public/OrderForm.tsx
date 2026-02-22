import { useState, useEffect, useMemo, useRef } from 'react';
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
  imageUrl: string | null;
}

const VILLES_CI = [
  'Abidjan','Yamoussoukro','Bouaké','Daloa','San Pedro','Korhogo','Man',
  'Gagnoa','Divo','Soubré','Abengourou','Anyama','Bingerville','Grand-Bassam',
  'Dabou','Adzopé','Agboville','Issia','Sinfra','Duékoué','Bouaflé','Dimbokro',
  'Toumodi','Tiébissou','Bonon','Beoumi','Bocanda','Gabiadji','Gonaté',
  'Guibéroua','Hiré','Méagui','Yabayo','Oumé','Lakota','Sassandra','Tabou',
  'Ferkessédougou','Boundiali','Odienné','Séguéla','Mankono','Katiola',
  'Bondoukou','Bouna','Tanda','Agnibilékrou','Bettié','Danané','Guiglo',
  'Bangolo','Zuénoula','Vavoua','Tiassalé','Jacqueville','Taabo',
];

function formatPrice(price: number): string {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

function getTotal(product: Product, qty: number): number {
  if (qty === 1) return product.prixUnitaire;
  if (qty === 2 && product.prix2Unites) return product.prix2Unites;
  if (qty >= 3 && product.prix3Unites) return product.prix3Unites;
  return product.prixUnitaire * qty;
}

export default function OrderForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [formError, setFormError] = useState('');

  // Form fields
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerCommune, setCustomerCommune] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const filteredCities = useMemo(
    () => citySearch
      ? VILLES_CI.filter(v => v.toLowerCase().includes(citySearch.toLowerCase()))
      : VILLES_CI,
    [citySearch]
  );

  useEffect(() => {
    axios.get(`${API_URL}/public/products`)
      .then(res => setProducts(res.data.products || []))
      .catch(() => setError('Impossible de charger les produits.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCity('');
    setCustomerCommune('');
    setCustomerAddress('');
    setCitySearch('');
    setFormError('');
    setSuccess(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedProduct) return;
    if (!customerName.trim()) { setFormError('Veuillez entrer votre nom.'); return; }
    if (!customerPhone.trim()) { setFormError('Veuillez entrer votre numéro de téléphone.'); return; }
    if (!customerCity.trim()) { setFormError('Veuillez sélectionner votre ville.'); return; }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/public/order`, {
        productId: selectedProduct.id,
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
      setFormError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-sky-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 text-lg">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Notre Boutique
            </h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1">
              Choisissez votre produit et passez commande en quelques clics
            </p>
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.nom}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
                    <svg className="w-16 h-16 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 mb-2">
                  {product.nom}
                </h3>
                <p className="text-sky-600 font-bold text-lg sm:text-xl mt-auto mb-3">
                  {formatPrice(product.prixUnitaire)}
                </p>
                <button
                  onClick={() => openModal(product)}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm sm:text-base rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-300 shadow-md shadow-blue-200/50 active:scale-[0.97]"
                >
                  Commander ici
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Aucun produit disponible pour le moment.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">Paiement à la livraison &middot; Livraison partout en Côte d'Ivoire</p>
        </div>
      </footer>

      {/* Order Modal */}
      {showModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div
            ref={modalRef}
            className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up sm:animate-scale-in"
          >
            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {success ? (
              /* Success state */
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Commande envoyée !</h2>
                <p className="text-gray-500 mb-6">
                  Votre commande de <strong>{selectedProduct.nom}</strong> a été enregistrée. Notre équipe vous contactera très bientôt.
                </p>
                {orderRef && (
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6 inline-block">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Référence</p>
                    <p className="text-sm font-mono text-gray-700">{orderRef.slice(0, 8).toUpperCase()}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setQuantity(1);
                      setCustomerName('');
                      setCustomerPhone('');
                      setCustomerCity('');
                      setCustomerCommune('');
                      setCustomerAddress('');
                      setCitySearch('');
                      setFormError('');
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-md"
                  >
                    Nouvelle commande
                  </button>
                </div>
              </div>
            ) : (
              /* Order form */
              <form onSubmit={handleSubmit}>
                {/* Product header */}
                <div className="flex items-center gap-4 p-5 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {selectedProduct.imageUrl ? (
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
                        <svg className="w-8 h-8 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">{selectedProduct.nom}</h2>
                    <p className="text-sky-600 font-bold text-lg">{formatPrice(selectedProduct.prixUnitaire)}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantité</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-600 hover:bg-gray-200 transition-all active:scale-90"
                      >-</button>
                      <span className="w-10 text-center text-lg font-bold text-gray-900">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(q => Math.min(10, q + 1))}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-600 hover:bg-gray-200 transition-all active:scale-90"
                      >+</button>
                      <span className="ml-auto text-lg font-bold text-sky-600">
                        {formatPrice(getTotal(selectedProduct, quantity))}
                      </span>
                    </div>
                    {/* Price tiers hint */}
                    {(selectedProduct.prix2Unites || selectedProduct.prix3Unites) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedProduct.prix2Unites && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                            2 unités : {formatPrice(selectedProduct.prix2Unites)}
                          </span>
                        )}
                        {selectedProduct.prix3Unites && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                            3+ unités : {formatPrice(selectedProduct.prix3Unites)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nom complet <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Kouadio Jean"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50/50 text-base placeholder:text-gray-400"
                    />
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Téléphone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">+225</span>
                      <input
                        type="tel"
                        placeholder="07 XX XX XX XX"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50/50 text-base placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Ville */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Ville <span className="text-red-400">*</span>
                    </label>
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50/50 text-base placeholder:text-gray-400"
                      />
                      {showCityDropdown && (
                        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
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
                                className={`w-full text-left px-4 py-2.5 hover:bg-sky-50 transition-colors text-sm border-b border-gray-50 last:border-0 ${customerCity === v ? 'bg-sky-50 text-sky-700 font-medium' : 'text-gray-700'}`}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Commune <span className="text-gray-300">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cocody, Yopougon..."
                      value={customerCommune}
                      onChange={e => setCustomerCommune(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50/50 text-base placeholder:text-gray-400"
                    />
                  </div>

                  {/* Adresse */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Adresse de livraison <span className="text-gray-300">(optionnel)</span>
                    </label>
                    <textarea
                      placeholder="Indications pour faciliter la livraison..."
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50/50 text-base placeholder:text-gray-400 resize-none"
                    />
                  </div>

                  {/* Error */}
                  {formError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-600 text-sm">{formError}</p>
                    </div>
                  )}
                </div>

                {/* Submit bar */}
                <div className="sticky bottom-0 p-5 pt-3 bg-white border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-base rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-300/40 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Confirmer la commande &middot; {formatPrice(getTotal(selectedProduct, quantity))}
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Paiement à la livraison
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
