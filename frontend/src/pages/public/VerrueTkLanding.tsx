import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');
const TARGET_CODE = 'VERRUE_TK';

interface Product {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  prixUnitaire: number;
  imageUrl: string | null;
}

function getCompanySlug(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('company') || 'ci';
}

function formatPrice(price: number): string {
  return `${Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

export default function VerrueTkLanding() {
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [stockLeft, setStockLeft] = useState(27);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  const company = useMemo(() => getCompanySlug(), []);

  useEffect(() => {
    axios
      .get(`${API_URL}/public/products`, { params: { company } })
      .then((res) => {
        const list = Array.isArray(res.data?.products) ? res.data.products : [];
        const match = list.find((p: Product) => String(p.code || '').toUpperCase() === TARGET_CODE);
        setProduct(match || null);
      })
      .catch(() => setError('Impossible de charger le produit VERRUE_TK.'))
      .finally(() => setLoading(false));
  }, [company]);

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ h, m, s });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const decay = setInterval(() => {
      setStockLeft((current) => (current > 9 ? current - 1 : current));
    }, 45000);
    return () => clearInterval(decay);
  }, []);

  const heroImage =
    product?.imageUrl ||
    'https://images.pexels.com/photos/7793143/pexels-photo-7793143.jpeg?auto=compress&cs=tinysrgb&w=1200';

  const imageBlocks = [
    heroImage,
    'https://images.pexels.com/photos/4047148/pexels-photo-4047148.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/7792876/pexels-photo-7792876.jpeg?auto=compress&cs=tinysrgb&w=1200',
    heroImage,
    'https://images.pexels.com/photos/6186445/pexels-photo-6186445.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/7792885/pexels-photo-7792885.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

  const openModal = () => {
    setFormError('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setShowModal(true);
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!product) return;
    if (!customerName.trim()) return setFormError('Entrez votre nom.');
    if (!customerPhone.trim()) return setFormError('Entrez votre numero de telephone.');
    if (!customerAddress.trim()) return setFormError('Entrez votre adresse de livraison.');

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/public/order`, {
        company,
        productId: product.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerCity: 'Non precisee',
        quantity: 1,
      });

      const ref = String(res.data?.orderReference || '');
      const params = new URLSearchParams();
      params.set('company', company);
      if (ref) params.set('ref', ref);
      navigate(`/anti-verrue/merci?${params.toString()}`);
    } catch (err: any) {
      setFormError(err?.response?.data?.error || 'Erreur. Reessayez dans quelques secondes.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-fuchsia-300/30 border-t-fuchsia-300" />
          <p className="mt-4 text-sm text-slate-200">Chargement de la page anti verrue...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-lg rounded-2xl border border-rose-300/40 bg-rose-500/10 p-6 text-center text-rose-100">
          <p>{error || 'Produit VERRUE_TK non disponible pour le moment.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="sticky top-0 z-50 overflow-hidden border-b border-fuchsia-300/30 bg-fuchsia-500/20 backdrop-blur">
        <div className="flex w-[200%] animate-[ticker_20s_linear_infinite] gap-8 py-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-100">
          <span>Paiement a la livraison</span>
          <span>Resultat visible en quelques jours</span>
          <span>Commande simple et rapide</span>
          <span>Support client 7j/7</span>
          <span>Paiement a la livraison</span>
          <span>Resultat visible en quelques jours</span>
          <span>Commande simple et rapide</span>
          <span>Support client 7j/7</span>
        </div>
      </div>

      <header className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:pt-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <p className="inline-flex rounded-full border border-fuchsia-300/50 bg-fuchsia-400/15 px-3 py-1 text-xs font-bold tracking-wide text-fuchsia-100">
              Creme anti verrue VERRUE_TK
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
              Stoppez vos verrues sans stress.
            </h1>
            <p className="max-w-xl text-sm text-slate-200 sm:text-base">
              Une formule ciblee pour assainir la peau. Application simple. Confort rapide.
            </p>
            <p className="text-2xl font-black text-emerald-300">{formatPrice(product.prixUnitaire)}</p>
            <div className="flex flex-wrap gap-2 text-xs font-bold sm:text-sm">
              <span className="rounded-full border border-rose-300/40 bg-rose-400/15 px-3 py-1 text-rose-100">
                Stock du jour: {stockLeft} unites
              </span>
              <span className="rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-amber-100">
                Offre se termine dans {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openModal}
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(217,70,239,0.65)] transition hover:scale-[1.02]"
              >
                Commander maintenant
              </button>
              <a
                href="#details"
                className="rounded-xl border border-slate-500 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-300 hover:text-fuchsia-100"
              >
                Voir les details
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-fuchsia-500/40 to-cyan-400/40 blur-2xl" />
            <img
              src={heroImage}
              alt="Creme VERRUE_TK"
              className="relative h-[320px] w-full rounded-3xl object-cover sm:h-[420px]"
              loading="eager"
            />
          </div>
        </div>
      </header>

      <main id="details" className="mx-auto max-w-5xl space-y-8 px-4 pb-32">
        <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6">
          <h2 className="mb-2 text-2xl font-bold text-emerald-300">Offre limitee aujourd hui</h2>
          <p className="mb-4 text-sm text-emerald-100 sm:text-base">
            Livraison prioritaire sur les commandes rapides. Stock limite pour garder la qualite.
          </p>
          <img
            src={imageBlocks[4]}
            alt="Offre limitee anti verrue"
            className="h-56 w-full rounded-2xl object-cover sm:h-72"
            loading="lazy"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-300/35 bg-slate-900/50 p-3 text-center">
              <p className="text-lg font-black text-emerald-300">{stockLeft}</p>
              <p className="text-xs text-slate-200">unites restantes</p>
            </div>
            <div className="rounded-xl border border-fuchsia-300/35 bg-slate-900/50 p-3 text-center">
              <p className="text-lg font-black text-fuchsia-300">
                {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
              </p>
              <p className="text-xs text-slate-200">avant fin promo</p>
            </div>
            <div className="rounded-xl border border-cyan-300/35 bg-slate-900/50 p-3 text-center">
              <p className="text-lg font-black text-cyan-300">+1200</p>
              <p className="text-xs text-slate-200">clients satisfaits</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="mb-2 text-2xl font-bold">Le probleme</h2>
          <p className="mb-4 text-sm text-slate-200 sm:text-base">
            Les verrues genent visuellement. Elles peuvent aussi irriter la peau chaque jour.
          </p>
          <img
            src={imageBlocks[0]}
            alt="Peau exposee aux verrues"
            className="h-56 w-full rounded-2xl object-cover sm:h-72"
            loading="lazy"
          />
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="mb-2 text-2xl font-bold">La solution VERRUE_TK</h2>
          <p className="mb-4 text-sm text-slate-200 sm:text-base">
            VERRUE_TK agit localement. La zone seche. La peau retrouve vite un aspect propre.
          </p>
          <img
            src={imageBlocks[1]}
            alt="Application creme anti verrue"
            className="h-56 w-full rounded-2xl object-cover sm:h-72"
            loading="lazy"
          />
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="mb-2 text-2xl font-bold">Temoignages clients</h2>
          <p className="mb-4 text-sm text-slate-200 sm:text-base">
            Les retours confirment une peau plus nette. Le protocole est facile a suivre.
          </p>
          <img
            src={imageBlocks[5]}
            alt="Temoignages clients VERRUE_TK"
            className="h-56 w-full rounded-2xl object-cover sm:h-72"
            loading="lazy"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-600 bg-slate-800/60 p-4">
              <p className="text-sm text-slate-100">"En quelques jours, la zone est devenue propre."</p>
              <p className="mt-2 text-xs text-fuchsia-200">Awa, Abidjan</p>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-800/60 p-4">
              <p className="text-sm text-slate-100">"Commande rapide. Livraison simple. Resultat visible."</p>
              <p className="mt-2 text-xs text-fuchsia-200">Jean, Bouake</p>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-800/60 p-4">
              <p className="text-sm text-slate-100">"Je recommande. Le suivi client est tres serieux."</p>
              <p className="mt-2 text-xs text-fuchsia-200">Mariam, Yopougon</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="mb-2 text-2xl font-bold">FAQ anti-objection</h2>
          <p className="mb-4 text-sm text-slate-200 sm:text-base">
            Questions courantes avant achat. Reponses claires pour commander en confiance.
          </p>
          <img
            src={imageBlocks[6]}
            alt="FAQ creme anti verrue"
            className="h-56 w-full rounded-2xl object-cover sm:h-72"
            loading="lazy"
          />
          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-slate-600 bg-slate-800/60 p-3">
              <p className="text-sm font-semibold text-emerald-300">Est-ce douloureux ?</p>
              <p className="text-sm text-slate-200">Non. Application locale douce et rapide.</p>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-800/60 p-3">
              <p className="text-sm font-semibold text-emerald-300">Dois-je payer avant ?</p>
              <p className="text-sm text-slate-200">Non. Vous payez a la livraison.</p>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-800/60 p-3">
              <p className="text-sm font-semibold text-emerald-300">Quand suis-je contacte ?</p>
              <p className="text-sm text-slate-200">Notre equipe vous appelle tres vite apres la commande.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="mb-2 text-2xl font-bold">Pourquoi ca rassure</h2>
          <p className="mb-4 text-sm text-slate-200 sm:text-base">
            Commande sans compte. Paiement a la livraison. Equipe dispo pour vous guider.
          </p>
          <img
            src={imageBlocks[2]}
            alt="Livraison rapide et sure"
            className="h-56 w-full rounded-2xl object-cover sm:h-72"
            loading="lazy"
          />
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="mb-2 text-2xl font-bold">Passez a l action</h2>
          <p className="mb-4 text-sm text-slate-200 sm:text-base">
            Cliquez sur commander. Remplissez trois champs. Votre commande part tout de suite.
          </p>
          <img
            src={imageBlocks[3]}
            alt="Commande simple VERRUE_TK"
            className="h-56 w-full rounded-2xl object-cover sm:h-72"
            loading="lazy"
          />
          <button
            onClick={openModal}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-extrabold text-slate-900 shadow-[0_0_32px_rgba(16,185,129,0.65)] transition hover:scale-[1.01] sm:w-auto"
          >
            Oui, je commande ma creme maintenant
          </button>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-fuchsia-300/30 bg-slate-900/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <p className="text-xs text-slate-200 sm:text-sm">
            VERRUE_TK - {formatPrice(product.prixUnitaire)} - Paiement a la livraison
          </p>
          <button
            onClick={openModal}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-xs font-bold text-white shadow-[0_0_24px_rgba(217,70,239,0.65)] transition hover:scale-[1.02] sm:text-sm"
          >
            Commander en 30 secondes
          </button>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="w-full rounded-t-3xl border border-slate-700 bg-slate-900 p-5 sm:max-w-lg sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Commander VERRUE_TK</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={submitOrder} className="space-y-3">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nom complet"
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm outline-none focus:border-fuchsia-400"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Numero de telephone"
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm outline-none focus:border-fuchsia-400"
              />
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Adresse de livraison"
                rows={3}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm outline-none focus:border-fuchsia-400"
              />

              {formError ? <p className="text-xs text-rose-300">{formError}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-3 text-sm font-extrabold text-white shadow-[0_0_24px_rgba(217,70,239,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Envoi en cours...' : 'Valider ma commande'}
              </button>
              <p className="text-center text-[11px] text-slate-300">Aucun compte requis. Paiement a la livraison.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
