'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');
const TARGET_CODE = 'VERRUE_TK';
const PRICES: Record<number, number> = { 1: 9900, 2: 14900, 3: 24900 };
const QTY_OPTS = [
  { v: 1, label: '1 boite', sub: '9 900 FCFA' },
  { v: 2, label: '2 boites', sub: '14 900 FCFA', tag: 'Populaire' },
  { v: 3, label: '3 boites', sub: '24 900 FCFA', tag: 'Meilleure offre' },
];

interface Product { id: number; code: string; nom: string; prixUnitaire: number; imageUrl: string | null }

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';

const I = {
  hero: '/verrue-tk/hero.png', g1: '/verrue-tk/gallery-1.png',
  g2: '/verrue-tk/gallery-2.png', g3: '/verrue-tk/gallery-3.png',
  r1: '/verrue-tk/result-1.png', r2: '/verrue-tk/result-2.png',
  usage: '/verrue-tk/usage.png',
};
const VID = ['/verrue-tk/video-1.mp4', '/verrue-tk/video-2.mp4', '/verrue-tk/video-3.mp4'];

const Check = () => (
  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
);
const Star = () => (
  <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
);

export default function VerrueTkLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);
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
  const [gi, setGi] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const gallery = [I.hero, I.g1, I.g2, I.g3];

  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then(r => setProduct((r.data?.products || []).find((p: Product) => p.code?.toUpperCase() === TARGET_CODE) || null))
      .catch(() => setError('Impossible de charger le produit.'))
      .finally(() => setLoading(false));
  }, [company]);

  useEffect(() => { document.body.style.overflow = modal ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [modal]);

  const open = () => { setFormErr(''); setName(''); setCity(''); setPhone(''); setQty(1); setModal(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr('');
    if (!product) return;
    if (!name.trim()) return setFormErr('Entrez votre nom complet.');
    if (!city.trim()) return setFormErr('Entrez votre ville / commune.');
    if (!phone.trim()) return setFormErr('Entrez votre numero de telephone.');
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/public/order`, { company, productId: product.id, customerName: name.trim(), customerPhone: phone.trim(), customerCity: city.trim(), quantity: qty });
      const ref = res.data?.orderReference || '';
      const p = new URLSearchParams(); p.set('company', company); if (ref) p.set('ref', ref);
      navigate(`/anti-verrue/merci?${p.toString()}`);
    } catch (err: any) { setFormErr(err?.response?.data?.error || 'Erreur. Reessayez.'); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-amber-500"/><p className="mt-3 text-xs text-neutral-400">Chargement...</p></div></div>
  );
  if (error || !product) return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4"><div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">{error || 'Produit non disponible.'}</div></div>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .5s ease both}
        .marquee-track{animation:marquee 22s linear infinite}
        details[open] summary .chevron{transform:rotate(180deg)}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* ══ ANNOUNCEMENT BAR ══ */}
      <div className="overflow-hidden bg-neutral-900 py-2">
        <div className="marquee-track flex w-[200%] items-center gap-8 text-[10px] font-bold uppercase tracking-[.18em] text-amber-300 sm:text-[11px]">
          {[0,1].map(k=>(
            <div key={k} className="flex shrink-0 items-center gap-8">
              <span>Livraison 24h Abidjan</span><span className="h-1 w-1 rounded-full bg-amber-400/60"/>
              <span>Paiement a la livraison</span><span className="h-1 w-1 rounded-full bg-amber-400/60"/>
              <span>Resultat visible en quelques jours</span><span className="h-1 w-1 rounded-full bg-amber-400/60"/>
              <span>Support client 7j/7</span><span className="h-1 w-1 rounded-full bg-amber-400/60"/>
            </div>
          ))}
        </div>
      </div>

      {/* ══ HERO — Mobile-first product section ══ */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-5 sm:pb-10 sm:pt-8 md:pt-12">
        <div className="grid items-start gap-6 md:grid-cols-2 md:gap-10">

          {/* Gallery */}
          <div className="fade-up">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 sm:rounded-3xl">
              <img src={gallery[gi]} alt="Creme anti verrue TK" className="h-full w-full object-cover transition-opacity duration-300"/>
              {/* Badges flottants */}
              <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg sm:left-4 sm:top-4 sm:text-xs">BEST-SELLER</span>
            </div>
            <div className="mt-2.5 flex gap-2 sm:mt-3">
              {gallery.map((src, i) => (
                <button key={i} onClick={() => setGi(i)}
                  className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition-all sm:h-[72px] sm:w-[72px] sm:rounded-xl ${i === gi ? 'border-amber-500 ring-2 ring-amber-200' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={src} alt="" className="h-full w-full object-cover"/>
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className="fade-up space-y-4 sm:space-y-5" style={{ animationDelay: '.1s' }}>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-600 sm:text-xs">Soin anti-verrue</p>
              <h1 className="text-[22px] font-extrabold leading-[1.2] sm:text-3xl md:text-[2.2rem]">
                Creme Anti-Verrue VERRUE TK
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">{[...Array(5)].map((_,i)=><Star key={i}/>)}</div>
              <span className="text-xs font-semibold text-neutral-600">4.8</span>
              <span className="text-xs text-neutral-400">(1 247 avis)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-black sm:text-3xl">{fmt(PRICES[1])}</span>
              <span className="text-sm text-neutral-400 line-through">15 000 FCFA</span>
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">-34%</span>
            </div>

            <p className="text-[13px] leading-relaxed text-neutral-500 sm:text-sm">
              Formule ciblee pour les verrues visibles. Application simple et sans douleur. Resultats constates en quelques jours par nos clients.
            </p>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-neutral-600 sm:text-[13px]">
              <span className="flex items-center gap-1.5"><Check/> Paiement a la livraison</span>
              <span className="flex items-center gap-1.5"><Check/> Livraison rapide</span>
              <span className="flex items-center gap-1.5"><Check/> Support 7j/7</span>
            </div>

            {/* Desktop CTA */}
            <div className="hidden sm:block">
              <button onClick={open}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-[15px] font-bold text-white shadow-xl transition hover:bg-neutral-800 active:scale-[.98]">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60"/><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"/></span>
                Commander maintenant — {fmt(PRICES[1])}
              </button>
              <p className="mt-2 text-center text-[11px] text-neutral-400">Aucun compte requis. Formulaire rapide en 30 secondes.</p>
            </div>

            {/* Trust badges row */}
            <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
              <div className="flex -space-x-1.5">
                {['bg-amber-400','bg-emerald-400','bg-sky-400'].map((c,i)=>(
                  <div key={i} className={`h-7 w-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white`}>
                    {['AK','JM','MD'][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-bold text-neutral-700 sm:text-xs">+1 200 clients satisfaits</p>
                <p className="text-[10px] text-neutral-400">Cote d'Ivoire et Afrique de l'Ouest</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF STRIP ══ */}
      <div className="border-y border-neutral-100 bg-neutral-50 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-4 text-center sm:gap-10">
          {[
            { n: '1 200+', l: 'Clients satisfaits' },
            { n: '24h', l: 'Livraison Abidjan' },
            { n: '4.8/5', l: 'Note moyenne' },
            { n: '98%', l: 'Recommandent' },
          ].map((s,i) => (
            <div key={i}><p className="text-lg font-black sm:text-xl">{s.n}</p><p className="text-[10px] text-neutral-400 sm:text-[11px]">{s.l}</p></div>
          ))}
        </div>
      </div>

      {/* ══ VIDEOS — horizontal scroll, auto-play loop ══ */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-600">Preuves en video</p>
          <h2 className="mb-2 text-center text-xl font-extrabold sm:text-2xl">Voyez les resultats vous-meme</h2>
          <p className="mx-auto mb-5 max-w-lg text-center text-[13px] text-neutral-400">Des utilisateurs partagent leur experience.</p>
        </div>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide sm:justify-center sm:gap-4 sm:overflow-visible sm:px-0">
          {VID.map((v,i) => (
            <div key={i} className="w-[200px] shrink-0 snap-center sm:w-[220px] md:w-[260px]">
              <video src={v} autoPlay loop muted playsInline preload="metadata"
                className="aspect-[9/16] w-full rounded-2xl border border-neutral-100 bg-neutral-100 object-cover shadow-md"/>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PROBLEM / SOLUTION — side by side on desktop ══ */}
      <section className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 sm:gap-8">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <img src={I.r1} alt="Verrues sur la peau" className="aspect-[4/3] w-full object-cover" loading="lazy"/>
            <div className="p-4 sm:p-5">
              <span className="mb-1.5 inline-block rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500">Le probleme</span>
              <h3 className="mb-1 text-[15px] font-extrabold">Les verrues genent au quotidien</h3>
              <p className="text-[12px] leading-relaxed text-neutral-400">Elles creent un malaise visible et affectent la confiance.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <img src={I.r2} alt="Resultat creme" className="aspect-[4/3] w-full object-cover" loading="lazy"/>
            <div className="p-4 sm:p-5">
              <span className="mb-1.5 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">La solution</span>
              <h3 className="mb-1 text-[15px] font-extrabold">VERRUE TK agit localement</h3>
              <p className="text-[12px] leading-relaxed text-neutral-400">La zone seche. La peau retrouve son aspect normal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW TO USE ══ */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-600">Mode d'emploi</p>
          <h2 className="mb-2 text-center text-xl font-extrabold sm:text-2xl">Simple a utiliser</h2>
          <p className="mx-auto mb-7 max-w-lg text-center text-[13px] text-neutral-400">4 etapes faciles.</p>
          <img src={I.usage} alt="Utilisation" className="mx-auto mb-8 w-full max-w-xl rounded-2xl border border-neutral-200 object-cover shadow-lg sm:rounded-3xl" loading="lazy"/>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', t: 'Nettoyez', d: 'Lavez la zone concernee a l\'eau propre.', ico: '💧' },
              { n: '02', t: 'Appliquez', d: 'Deposez une petite quantite de creme.', ico: '🧴' },
              { n: '03', t: 'Repetez', d: 'Suivez la routine conseillee regulierement.', ico: '🔁' },
              { n: '04', t: 'Observez', d: 'Constatez l\'amelioration au fil des jours.', ico: '✨' },
            ].map(s => (
              <div key={s.n} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-lg">{s.ico}</span>
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">ETAPE {s.n}</span>
                </div>
                <h3 className="mb-1 text-sm font-bold">{s.t}</h3>
                <p className="text-xs leading-relaxed text-neutral-400">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MID CTA ══ */}
      <section className="py-4 sm:py-6">
        <div className="mx-auto max-w-lg px-4 text-center">
          <button onClick={open}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-4 text-[15px] font-bold text-white shadow-xl transition hover:bg-neutral-800 active:scale-[.98]">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60"/><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"/></span>
            Je commande maintenant
          </button>
          <p className="mt-2 text-[11px] text-neutral-400">Paiement a la livraison — Formulaire en 30 secondes</p>
        </div>
      </section>

      {/* ══ TESTIMONIALS — premium horizontal scroll cards ══ */}
      <section className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex flex-col items-center gap-1 sm:mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600">Avis clients verifies</p>
            <h2 className="text-xl font-extrabold sm:text-2xl">+1 200 clients satisfaits</h2>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex gap-0.5">{[...Array(5)].map((_,i)=><Star key={i}/>)}</div>
              <span className="text-xs font-bold text-neutral-700">4.8/5</span>
              <span className="text-[11px] text-neutral-400">— base sur 1 247 avis</span>
            </div>
          </div>
        </div>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide sm:justify-center sm:gap-4 sm:overflow-visible sm:px-0">
          {[
            { q: 'En 5 jours la verrue a seche completement. Ma peau est redevenue lisse. Je ne pensais pas que ca marcherait aussi vite.', n: 'Awa Kone', v: 'Abidjan, Cocody', d: 'Il y a 2 jours', stars: 5, init: 'AK', bg: 'bg-amber-500' },
            { q: 'La livraison etait tres rapide. Le livreur m\'a appelee 1h avant. Le produit est bien emballe. Resultat visible en 1 semaine.', n: 'Jean-Marc B.', v: 'Bouake', d: 'Il y a 5 jours', stars: 5, init: 'JM', bg: 'bg-sky-500' },
            { q: 'J\'ai commande pour ma mere. Elle avait des verrues depuis 2 ans. Apres 10 jours d\'utilisation, c\'est presque fini.', n: 'Mariam Diallo', v: 'Yopougon', d: 'Il y a 1 semaine', stars: 5, init: 'MD', bg: 'bg-emerald-500' },
            { q: 'Tres satisfait. C\'est la premiere creme qui a fonctionne. Application facile, pas de douleur. Merci a l\'equipe.', n: 'Kouassi F.', v: 'Daloa', d: 'Il y a 3 jours', stars: 5, init: 'KF', bg: 'bg-violet-500' },
            { q: 'Service client au top. Ils m\'ont appelee pour me conseiller. 2 semaines plus tard, plus rien. Je recommande.', n: 'Fatou S.', v: 'San Pedro', d: 'Il y a 4 jours', stars: 4, init: 'FS', bg: 'bg-rose-500' },
          ].map((t, i) => (
            <div key={i} className="w-[280px] shrink-0 snap-center rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:w-[300px] sm:p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.bg} text-xs font-bold text-white shadow-md`}>{t.init}</div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold">{t.n}</p>
                  <p className="text-[10px] text-neutral-400">{t.v}</p>
                </div>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex gap-0.5">{[...Array(t.stars)].map((_,j)=><Star key={j}/>)}</div>
                <span className="text-[10px] text-neutral-300">{t.d}</span>
              </div>
              <p className="mb-3 text-[12px] leading-relaxed text-neutral-600">"{t.q}"</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600"><Check/> Achat verifie</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ GUARANTEE ══ */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl shadow-sm">🛡️</div>
              <div>
                <h3 className="mb-1 text-[15px] font-extrabold text-emerald-900 sm:text-base">Commandez en toute confiance</h3>
                <p className="text-[12px] leading-relaxed text-emerald-700 sm:text-[13px]">
                  Paiement uniquement a la livraison. Vous verifiez le colis avant de payer. Notre equipe vous appelle pour confirmer chaque commande. Support disponible 7j/7.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { ico: '📦', t: 'Livraison securisee' },
                { ico: '💰', t: 'Paiement a la reception' },
                { ico: '📞', t: 'Support 7j/7' },
              ].map((g,i) => (
                <div key={i} className="rounded-xl bg-white/80 p-3 text-center shadow-sm">
                  <span className="text-xl">{g.ico}</span>
                  <p className="mt-1 text-[10px] font-bold text-emerald-800">{g.t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-600">FAQ</p>
          <h2 className="mb-2 text-center text-xl font-extrabold sm:text-2xl">Questions frequentes</h2>
          <p className="mx-auto mb-7 max-w-lg text-center text-[13px] text-neutral-400">Tout savoir avant de commander.</p>
          <div className="space-y-2">
            {[
              { q: 'Est-ce douloureux ?', a: 'Non. L\'application est locale, douce et rapide. Aucune douleur.' },
              { q: 'Dois-je payer avant la livraison ?', a: 'Non. Vous payez uniquement quand vous recevez votre colis.' },
              { q: 'En combien de temps je vois les resultats ?', a: 'La plupart des clients constatent une amelioration en quelques jours.' },
              { q: 'Comment suis-je contacte apres la commande ?', a: 'Notre equipe vous appelle dans les heures qui suivent pour confirmer.' },
              { q: 'La creme convient a tous les types de peau ?', a: 'Oui, la formule est concue pour tous les types de peau.' },
              { q: 'Puis-je commander plusieurs boites ?', a: 'Oui. 2 boites a 14 900 FCFA ou 3 boites a 24 900 FCFA. Les offres groupees sont les plus populaires.' },
            ].map((f, i) => (
              <details key={i} className="group rounded-xl border border-neutral-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-[13px] font-bold sm:text-sm">
                  {f.q}
                  <svg className="chevron h-4 w-4 shrink-0 text-neutral-300 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <p className="px-4 pb-4 text-[13px] leading-relaxed text-neutral-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA SECTION ══ */}
      <section className="bg-neutral-900 py-12 sm:py-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto mb-4 flex justify-center -space-x-2">
            {['bg-amber-400','bg-emerald-400','bg-sky-400','bg-rose-400','bg-violet-400'].map((c,i)=>(
              <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-neutral-900 ${c} text-[10px] font-bold text-white`}>
                {['AK','JM','MD','KF','FS'][i]}
              </div>
            ))}
          </div>
          <div className="mb-3 flex items-center justify-center gap-1">
            <div className="flex gap-0.5">{[...Array(5)].map((_,i)=><svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}</div>
            <span className="text-xs font-bold text-white">4.8/5</span>
          </div>
          <h2 className="mb-2 text-xl font-extrabold text-white sm:text-2xl">Rejoignez +1 200 clients satisfaits</h2>
          <p className="mb-6 text-[13px] text-neutral-400">Commandez maintenant. Paiement a la livraison uniquement.</p>
          <button onClick={open}
            className="group mx-auto flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 py-3.5 text-[15px] font-extrabold text-neutral-900 shadow-[0_12px_35px_rgba(251,191,36,.4)] transition hover:bg-amber-300 active:scale-[.98]">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900 opacity-40"/><span className="relative inline-flex h-2 w-2 rounded-full bg-neutral-900"/></span>
            Commander ici — {fmt(PRICES[1])}
          </button>
          <p className="mt-3 text-[11px] text-neutral-500">Aucun compte requis · Formulaire en 30 secondes</p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-neutral-100 bg-white pb-24 pt-6 sm:pb-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            {[
              { ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },
              { ico: '💰', t: 'Paiement a la livraison', d: 'Aucun risque' },
              { ico: '📞', t: 'Support client', d: '7j/7 par telephone' },
              { ico: '🛡️', t: 'Commande securisee', d: 'Verifiez avant de payer' },
            ].map((f,i)=>(
              <div key={i} className="w-[140px]">
                <span className="text-xl">{f.ico}</span>
                <p className="mt-1 text-[11px] font-bold text-neutral-700">{f.t}</p>
                <p className="text-[10px] text-neutral-400">{f.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[10px] text-neutral-300">
            © 2026 Creme Anti-Verrue TK · Paiement a la livraison · Cote d'Ivoire
          </p>
        </div>
      </footer>

      {/* ══ STICKY BOTTOM BAR ══ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 backdrop-blur-lg safe-bottom">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:py-3">
          <img src={I.hero} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-neutral-100 object-cover sm:h-12 sm:w-12"/>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold sm:text-sm">Creme Anti-Verrue TK</p>
            <p className="text-[11px] text-neutral-400">{fmt(PRICES[1])} · Paiement a la livraison</p>
          </div>
          <button onClick={open}
            className="shrink-0 rounded-xl bg-neutral-900 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg transition hover:bg-neutral-800 active:scale-[.97] sm:px-6 sm:text-sm">
            Commander
          </button>
        </div>
      </div>

      {/* ══ MODAL ══ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
          <div ref={formRef} className="relative w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-[420px] sm:rounded-2xl" style={{ maxHeight: '94vh', overflowY: 'auto' }}>

            <button onClick={() => setModal(false)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            {/* Header */}
            <div className="bg-neutral-900 px-5 pb-4 pt-5 text-white">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">Livraison 24h Abidjan</span>
                <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">Paiement a la livraison</span>
              </div>
              <h3 className="text-lg font-extrabold">Finaliser votre commande</h3>
              <p className="mt-0.5 text-[12px] text-neutral-400">Remplissez le formulaire. Nous vous appelons pour confirmer.</p>
            </div>
            <div className="h-1 bg-neutral-100"><div className="h-full w-4/5 bg-gradient-to-r from-amber-400 to-amber-500"/></div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-3 p-4 pb-5">
              {[
                { icon: '👤', label: 'Nom complet', val: name, set: setName, ph: 'Ex. Kouadio Fernand', type: 'text' },
                { icon: '📍', label: 'Ville / Commune', val: city, set: setCity, ph: 'Ex. Abidjan — Yopougon', type: 'text' },
                { icon: '📱', label: 'Telephone', val: phone, set: setPhone, ph: 'Ex. 07 00 00 00 00', type: 'tel' },
              ].map(f => (
                <label key={f.label} className="block">
                  <span className="mb-1 block text-[12px] font-bold text-neutral-700">{f.label} <span className="text-red-500">*</span></span>
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 transition-colors focus-within:border-amber-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(251,191,36,.12)]">
                    <span className="text-sm">{f.icon}</span>
                    <input type={f.type} inputMode={f.type === 'tel' ? 'tel' : undefined} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      className="h-11 w-full border-none bg-transparent text-[13px] font-medium outline-none placeholder:text-neutral-300"/>
                  </div>
                </label>
              ))}

              {/* Quantity selector */}
              <div>
                <span className="mb-1.5 block text-[12px] font-bold text-neutral-700">Quantite</span>
                <div className="grid gap-2">
                  {QTY_OPTS.map(o => (
                    <button key={o.v} type="button" onClick={() => setQty(o.v)}
                      className={`relative flex items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${qty === o.v ? 'border-amber-400 bg-amber-50/60 shadow-sm' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${qty === o.v ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'}`}>
                          {qty === o.v && <div className="h-2 w-2 rounded-full bg-white"/>}
                        </div>
                        <span className="text-[13px] font-bold">{o.label}</span>
                      </div>
                      <span className="text-[13px] font-extrabold">{o.sub}</span>
                      {o.tag && <span className="absolute -top-2 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">{o.tag}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-3 text-white">
                <span className="text-[13px] font-semibold">Total</span>
                <span className="text-base font-black">{fmt(PRICES[qty] || PRICES[1])}</span>
              </div>

              {formErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">{formErr}</p>}

              <button type="submit" disabled={sending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[14px] font-extrabold text-white shadow-[0_12px_30px_rgba(16,185,129,.3)] transition hover:bg-emerald-500 active:scale-[.98] disabled:cursor-wait disabled:opacity-70">
                {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Envoi en cours...</> : 'Valider ma commande'}
              </button>
              <p className="text-center text-[10px] text-neutral-400">Nous vous appelons pour confirmer avant la livraison.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
