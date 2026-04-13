'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');
const TARGET_CODE = 'VERRUE_TK';

const PRICES: Record<number, number> = { 1: 9900, 2: 14900, 3: 24900 };
const PRICE_LABELS: Record<number, string> = {
  1: '1 boite — 9 900 FCFA',
  2: '2 boites — 14 900 FCFA',
  3: '3 boites — 24 900 FCFA',
};

interface Product {
  id: number;
  code: string;
  nom: string;
  prixUnitaire: number;
  imageUrl: string | null;
}

function slug(): string {
  return new URLSearchParams(window.location.search).get('company') || 'ci';
}

function fmt(v: number): string {
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

const IMG = {
  hero: '/verrue-tk/hero.png',
  g1: '/verrue-tk/gallery-1.png',
  g2: '/verrue-tk/gallery-2.png',
  g3: '/verrue-tk/gallery-3.png',
  r1: '/verrue-tk/result-1.png',
  r2: '/verrue-tk/result-2.png',
  usage: '/verrue-tk/usage.png',
};

const VIDEOS = ['/verrue-tk/video-1.mp4', '/verrue-tk/video-2.mp4', '/verrue-tk/video-3.mp4'];

export default function VerrueTkLanding() {
  const navigate = useNavigate();
  const company = useMemo(() => slug(), []);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [formErr, setFormErr] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const [galleryIdx, setGalleryIdx] = useState(0);
  const galleryImages = [IMG.hero, IMG.g1, IMG.g2, IMG.g3];

  useEffect(() => {
    axios
      .get(`${API_URL}/public/products`, { params: { company } })
      .then((r) => {
        const list: Product[] = r.data?.products || [];
        setProduct(list.find((p) => p.code?.toUpperCase() === TARGET_CODE) || null);
      })
      .catch(() => setError('Impossible de charger le produit.'))
      .finally(() => setLoading(false));
  }, [company]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const open = () => {
    setFormErr('');
    setName('');
    setCity('');
    setPhone('');
    setQty(1);
    setModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    if (!product) return;
    if (!name.trim()) return setFormErr('Entrez votre nom complet.');
    if (!city.trim()) return setFormErr('Entrez votre ville / commune.');
    if (!phone.trim()) return setFormErr('Entrez votre numero de telephone.');

    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/public/order`, {
        company,
        productId: product.id,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerCity: city.trim(),
        quantity: qty,
      });
      const ref = res.data?.orderReference || '';
      const p = new URLSearchParams();
      p.set('company', company);
      if (ref) p.set('ref', ref);
      navigate(`/anti-verrue/merci?${p.toString()}`);
    } catch (err: any) {
      setFormErr(err?.response?.data?.error || 'Erreur. Reessayez.');
    } finally {
      setSending(false);
    }
  };

  /* ───── Loading / Error ───── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf5]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-yellow-200 border-t-yellow-500" />
          <p className="mt-4 text-sm text-neutral-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf5] px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          {error || 'Produit VERRUE_TK non disponible.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf5] text-neutral-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══════ TICKER BAR ═══════ */}
      <div className="sticky top-0 z-50 overflow-hidden bg-neutral-900">
        <div className="flex w-[200%] animate-[ticker_18s_linear_infinite] items-center gap-10 py-2.5 text-[11px] font-bold uppercase tracking-widest text-yellow-300">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-10">
              <span>Paiement a la livraison</span>
              <span className="h-1 w-1 rounded-full bg-yellow-400" />
              <span>Livraison 24h Abidjan</span>
              <span className="h-1 w-1 rounded-full bg-yellow-400" />
              <span>Resultat visible en quelques jours</span>
              <span className="h-1 w-1 rounded-full bg-yellow-400" />
              <span>Support client 7j/7</span>
              <span className="h-1 w-1 rounded-full bg-yellow-400" />
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ HERO ═══════ */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-10 md:grid-cols-2 md:pt-16">
        {/* Galerie */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl">
            <img src={galleryImages[galleryIdx]} alt="Creme anti verrue" className="aspect-square w-full object-cover" />
          </div>
          <div className="flex gap-2">
            {galleryImages.map((src, i) => (
              <button
                key={i}
                onClick={() => setGalleryIdx(i)}
                className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20 ${i === galleryIdx ? 'border-yellow-500 shadow-lg shadow-yellow-200' : 'border-neutral-200 opacity-70 hover:opacity-100'}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Texte hero */}
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
            Creme anti verrue VERRUE TK
          </span>
          <h1 className="text-3xl font-black leading-tight sm:text-[2.8rem]">
            Finis la gene causee par les verrues visibles
          </h1>
          <p className="text-[15px] leading-relaxed text-neutral-600">
            De nombreuses personnes choisissent cette creme pour retrouver une peau nette et se sentir plus a l'aise au quotidien.
          </p>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-neutral-900">{fmt(PRICES[1])}</span>
          </div>

          <button
            onClick={open}
            className="group relative flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 px-8 py-4 text-base font-extrabold text-neutral-900 shadow-[0_14px_38px_rgba(250,204,21,.35)] transition hover:shadow-[0_22px_55px_rgba(250,204,21,.45)] active:scale-[.98] sm:w-auto"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900 opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neutral-900" />
            </span>
            Commander ici
          </button>

          <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Paiement a la livraison</span>
            <span className="flex items-center gap-1"><svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Livraison rapide</span>
            <span className="flex items-center gap-1"><svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Support 7j/7</span>
          </div>
        </div>
      </section>

      {/* ═══════ VIDEOS ═══════ */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center text-2xl font-black sm:text-3xl">Voyez les resultats en video</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-neutral-500">
            Des utilisateurs partagent leur experience apres quelques jours d'utilisation.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {VIDEOS.map((v, i) => (
              <video
                key={i}
                src={v}
                controls
                playsInline
                preload="metadata"
                className="aspect-[9/16] w-full rounded-2xl border border-neutral-200 bg-neutral-100 object-cover shadow-md"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PROBLEME ═══════ */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-center text-2xl font-black sm:text-3xl">Les verrues vous genent au quotidien ?</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-neutral-500">
            Elles peuvent affecter la confiance en soi et creer un malaise visible.
          </p>
          <img src={IMG.r1} alt="Verrues sur la peau" className="mx-auto h-72 w-full max-w-2xl rounded-3xl border border-neutral-200 object-cover shadow-lg sm:h-96" loading="lazy" />
        </div>
      </section>

      {/* ═══════ SOLUTION ═══════ */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-center text-2xl font-black sm:text-3xl">La creme VERRUE TK agit localement</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-neutral-500">
            La zone seche progressivement. La peau retrouve son aspect normal.
          </p>
          <img src={IMG.r2} alt="Resultat creme anti verrue" className="mx-auto h-72 w-full max-w-2xl rounded-3xl border border-neutral-200 object-cover shadow-lg sm:h-96" loading="lazy" />
        </div>
      </section>

      {/* ═══════ COMMENT UTILISER ═══════ */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-center text-2xl font-black sm:text-3xl">Comment l'utiliser ?</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-neutral-500">
            Un protocole simple en 4 etapes. Application rapide et sans douleur.
          </p>
          <img src={IMG.usage} alt="Utilisation creme" className="mx-auto mb-8 h-72 w-full max-w-2xl rounded-3xl border border-neutral-200 object-cover shadow-lg sm:h-96" loading="lazy" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '1', t: 'Nettoyez', d: 'Lavez la zone concernee avec de l\'eau propre.' },
              { n: '2', t: 'Appliquez', d: 'Mettez une petite quantite de creme sur la verrue.' },
              { n: '3', t: 'Repetez', d: 'Appliquez regulierement selon la routine conseillee.' },
              { n: '4', t: 'Observez', d: 'Constatez l\'evolution positive au fil des jours.' },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-neutral-900">{s.n}</div>
                <h3 className="mb-1 text-sm font-bold">{s.t}</h3>
                <p className="text-xs leading-relaxed text-neutral-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TEMOIGNAGES ═══════ */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-center text-2xl font-black sm:text-3xl">Ce que nos clients disent</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-neutral-500">
            Des retours reels de personnes qui ont utilise la creme VERRUE TK.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { q: '"En quelques jours la zone est devenue propre. Je recommande."', n: 'Awa K.', v: 'Abidjan' },
              { q: '"Commande rapide, livraison simple, et resultat visible."', n: 'Jean M.', v: 'Bouake' },
              { q: '"Le suivi client est tres serieux. Produit de qualite."', n: 'Mariam D.', v: 'Yopougon' },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-[#fffdf5] p-5 shadow-sm">
                <div className="mb-3 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
                <p className="mb-3 text-sm leading-relaxed text-neutral-700">{t.q}</p>
                <p className="text-xs font-bold text-neutral-900">{t.n} <span className="font-normal text-neutral-400">— {t.v}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-2 text-center text-2xl font-black sm:text-3xl">Questions frequentes</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-neutral-500">
            Tout ce que vous devez savoir avant de commander.
          </p>
          <div className="space-y-3">
            {[
              { q: 'Est-ce douloureux ?', a: 'Non. L\'application est locale, douce et rapide.' },
              { q: 'Dois-je payer avant la livraison ?', a: 'Non. Vous payez uniquement a la reception du produit.' },
              { q: 'En combien de temps je vois les resultats ?', a: 'Beaucoup de clients constatent une amelioration en quelques jours.' },
              { q: 'Comment serai-je contacte ?', a: 'Notre equipe vous appelle pour confirmer votre commande et organiser la livraison.' },
              { q: 'La creme convient a tous les types de peau ?', a: 'Oui, la formule est adaptee pour tous les types de peau.' },
            ].map((f, i) => (
              <details key={i} className="group rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-bold">
                  {f.q}
                  <svg className="h-4 w-4 shrink-0 text-neutral-400 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="bg-neutral-900 py-14">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-3 text-2xl font-black text-white sm:text-3xl">Pret a retrouver une peau nette ?</h2>
          <p className="mb-6 text-sm text-neutral-300">Commandez maintenant. Paiement a la livraison.</p>
          <button
            onClick={open}
            className="group relative mx-auto flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 px-10 py-4 text-base font-extrabold text-neutral-900 shadow-[0_14px_38px_rgba(250,204,21,.35)] transition hover:shadow-[0_22px_55px_rgba(250,204,21,.45)] active:scale-[.98]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900 opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neutral-900" />
            </span>
            Commander ici
          </button>
        </div>
      </section>

      {/* ═══════ STICKY BOTTOM BAR ═══════ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-2.5 backdrop-blur-md sm:p-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold sm:text-sm">Creme Anti Verrue TK</p>
            <p className="text-xs text-neutral-500">{fmt(PRICES[1])} — Paiement a la livraison</p>
          </div>
          <button
            onClick={open}
            className="shrink-0 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 px-5 py-2.5 text-xs font-extrabold text-neutral-900 shadow-[0_8px_24px_rgba(250,204,21,.3)] transition hover:shadow-[0_16px_36px_rgba(250,204,21,.45)] active:scale-[.97] sm:text-sm"
          >
            Commander ici
          </button>
        </div>
      </div>

      {/* ═══════ MODAL FORMULAIRE ═══════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

          <div ref={formRef} className="relative w-full overflow-hidden rounded-t-[22px] border border-neutral-200/60 bg-gradient-to-b from-[#fffdf5] to-[#fff9e6] shadow-2xl sm:max-w-[430px] sm:rounded-[22px]" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Glow */}
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-44 w-44 rounded-full bg-yellow-300/30 blur-3xl" />

            {/* Close */}
            <button onClick={() => setModal(false)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-lg shadow-md transition hover:bg-white">×</button>

            {/* Header */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-5 pb-4 pt-5 text-white">
              <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-400/35 bg-yellow-400/15 px-3 py-1 text-[11px] font-bold text-yellow-200">
                Livraison 24h Abidjan — Paiement a la livraison
              </span>
              <h3 className="text-xl font-black">Finaliser votre commande</h3>
              <p className="mt-1 text-[13px] text-neutral-300">Remplissez ce formulaire. Nous vous contactons rapidement.</p>
            </div>

            {/* Progress */}
            <div className="h-1.5 bg-neutral-100">
              <div className="h-full w-[78%] bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,.5)]" />
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-3 p-4">
              <label className="block">
                <span className="mb-1 block text-[13px] font-bold">Nom complet <span className="text-red-600">*</span></span>
                <div className="flex items-center gap-2.5 rounded-[14px] border border-neutral-200 bg-white px-3 shadow-sm focus-within:border-yellow-400 focus-within:shadow-[0_0_0_3px_rgba(250,204,21,.18)]">
                  <span className="text-sm opacity-80">👤</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Kouadio Fernand" className="h-[46px] w-full border-none bg-transparent text-sm font-semibold outline-none placeholder:text-neutral-400" />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold">Ville / Commune <span className="text-red-600">*</span></span>
                <div className="flex items-center gap-2.5 rounded-[14px] border border-neutral-200 bg-white px-3 shadow-sm focus-within:border-yellow-400 focus-within:shadow-[0_0_0_3px_rgba(250,204,21,.18)]">
                  <span className="text-sm opacity-80">📍</span>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex. Abidjan — Yopougon" className="h-[46px] w-full border-none bg-transparent text-sm font-semibold outline-none placeholder:text-neutral-400" />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold">Numero de telephone <span className="text-red-600">*</span></span>
                <div className="flex items-center gap-2.5 rounded-[14px] border border-neutral-200 bg-white px-3 shadow-sm focus-within:border-yellow-400 focus-within:shadow-[0_0_0_3px_rgba(250,204,21,.18)]">
                  <span className="text-sm opacity-80">📱</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex. 07 00 00 00 00" inputMode="tel" className="h-[46px] w-full border-none bg-transparent text-sm font-semibold outline-none placeholder:text-neutral-400" />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold">Quantite</span>
                <div className="flex items-center gap-2.5 rounded-[14px] border border-neutral-200 bg-white px-3 shadow-sm focus-within:border-yellow-400 focus-within:shadow-[0_0_0_3px_rgba(250,204,21,.18)]">
                  <span className="text-sm opacity-80">🧴</span>
                  <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-[46px] w-full border-none bg-transparent text-sm font-semibold outline-none">
                    {[1, 2, 3].map((q) => (
                      <option key={q} value={q}>{PRICE_LABELS[q]}</option>
                    ))}
                  </select>
                </div>
              </label>

              {/* Total */}
              <div className="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-gradient-to-r from-[#fff7cc] via-[#fde68a] to-[#facc15] p-3 shadow-sm">
                <span className="text-sm font-bold">Total estime</span>
                <span className="text-base font-black">{fmt(PRICES[qty] || PRICES[1])}</span>
              </div>

              {formErr && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{formErr}</p>}

              <button
                type="submit"
                disabled={sending}
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-sm font-black text-white shadow-[0_18px_40px_rgba(34,197,94,.35)] transition hover:shadow-[0_22px_48px_rgba(34,197,94,.45)] active:scale-[.98] disabled:cursor-wait disabled:opacity-80"
              >
                {sending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                {sending ? 'Envoi en cours...' : 'Valider ma commande'}
              </button>

              <p className="text-center text-[11px] text-neutral-500">
                Nous vous appelons pour confirmer avant la livraison.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ KEYFRAMES ═══════ */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
