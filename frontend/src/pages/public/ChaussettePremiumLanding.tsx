/**
 * Tunnel de vente — Chaussettes Premium Homme (page 2, distincte de chaussette-homme).
 * Slug: chaussette-premium-homme
 * Mapping interne de commande : CHAUSSETTE_HOMME_MODLE2 (jamais affiche au client).
 *
 * Direction artistique PREMIUM masculine : bleu marine + gris argente + noir +
 * bleu clair + blanc + touche or. Degrades navy->noir, argent->blanc,
 * bleu clair->navy, or->navy (CTA). Mobile-first, orientee conversion.
 *
 * Aucune reference medicale. Aucune mention "chauffante".
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'chaussette-premium-homme';
const PRODUCT_CODE = 'CHAUSSETTE_HOMME_MODLE2';
const THANK_YOU_URL = '/chaussette-premium-homme/merci';

const PRICES: Record<number, number> = { 1: 11900, 2: 20900, 3: 28900 };
const QTY_OPTS = [
  { v: 1, label: '5 paires', sub: '11 900 FCFA' },
  { v: 2, label: '10 paires', sub: '20 900 FCFA', tag: 'Populaire', save: 'Économisez 2 900 F' },
  { v: 3, label: '15 paires', sub: '28 900 FCFA', tag: 'Stock pro', save: 'Économisez 6 800 F' },
];

const M = (n: string) => `/chaussette-premium-homme/${n}`;
const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

interface Product { id: number; code: string; nom: string; prixUnitaire: number }
declare global { interface Window { fbq?: any; ttq?: any; dataLayer?: any[] } }

// Tracking neutre : pousse dans dataLayer + relaie a fbq/ttq SI deja installes
// (aucun pixel initialise ici car aucun ID fourni pour cette page).
function track(event: string, data: Record<string, unknown> = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
    if (typeof window.fbq === 'function') {
      const fbMap: Record<string, string> = {
        ViewContent: 'ViewContent', OpenForm: 'InitiateCheckout', Lead: 'Lead', SelectPack: 'AddToCart',
      };
      if (fbMap[event]) window.fbq('trackCustom', event, data);
    }
    if (typeof window.ttq?.track === 'function') window.ttq.track(event, data);
  } catch { /* noop */ }
}

function useOnScreen(rootMargin = '320px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function LazyImg({ src, alt, aspect, priority, className = '' }: { src: string; alt: string; aspect?: string; priority?: boolean; className?: string }) {
  const { ref, visible } = useOnScreen();
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
        {/* @ts-expect-error fetchpriority */}
        <img src={src} alt={alt} loading="eager" decoding="async" fetchpriority="high" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible
        ? <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        : <div className="h-full min-h-[240px] w-full animate-pulse bg-slate-200" />}
    </div>
  );
}

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);
const Star = () => (
  <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.04a1 1 0 00-1.18 0l-2.8 2.04c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12l-2.8-2.03c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" /></svg>
);

// Bouton CTA premium : degrade or -> bleu marine, pulse, ombre, texte sombre lisible.
function CTA({ onClick, children, variant = 'gold', className = '' }: { onClick: () => void; children: ReactNode; variant?: 'gold' | 'navy'; className?: string }) {
  const cls = variant === 'gold'
    ? 'from-amber-300 via-yellow-400 to-amber-500 text-slate-950 ring-amber-200/50'
    : 'from-[#0a1f44] via-[#0b2350] to-[#060b16] text-amber-300 ring-amber-300/30';
  return (
    <button type="button" onClick={onClick}
      className={`cph-cta cph-pulse group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r ${cls} px-6 py-4 text-[14px] font-black uppercase tracking-[0.16em] shadow-[0_18px_44px_-12px_rgba(10,31,68,.6)] ring-2 transition hover:scale-[1.02] sm:text-[15px] ${className}`}>
      <span className="cph-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

function Marquee({ items, tone = 'navy' }: { items: string[]; tone?: 'navy' | 'silver' }) {
  const bg = tone === 'navy'
    ? 'border-amber-300/25 bg-gradient-to-r from-[#0a1f44] via-[#060b16] to-[#1a2740] text-amber-200/90'
    : 'border-slate-300 bg-gradient-to-r from-slate-200 via-white to-slate-200 text-slate-700';
  return (
    <div className={`overflow-hidden border-y py-2.5 ${bg}`}>
      <div className="cph-marquee flex w-[200%] items-center gap-8 text-[10px] font-black uppercase tracking-[0.26em] sm:text-[11px]">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8">
            {items.map((t, i) => (<span key={`${k}-${i}`} className="inline-flex items-center gap-2">{t}<span className="text-amber-400">◆</span></span>))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Bloc alterne image + texte + CTA, fond degrade variable.
function FeatureBlock({ kicker, title, text, cta, img, qty, onOrder, bg, reverse }: {
  kicker: string; title: ReactNode; text: string; cta: string; img: string; qty: number; onOrder: (q: number) => void; bg: string; reverse?: boolean;
}) {
  return (
    <section className={`relative overflow-hidden py-12 sm:py-16 ${bg}`}>
      <div className={`relative mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:items-center sm:gap-10 ${reverse ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
        <div className="relative w-full overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-[0_30px_70px_-25px_rgba(0,0,0,.6)] sm:w-1/2">
          <LazyImg src={img} alt={typeof title === 'string' ? title : 'Chaussettes premium homme'} aspect="4/5" />
        </div>
        <div className="w-full sm:w-1/2">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">{kicker}</p>
          <h3 className="text-balance text-[22px] font-black leading-tight sm:text-[28px]">{title}</h3>
          <p className="mt-3 text-[14px] leading-relaxed opacity-80 sm:text-[15px]">{text}</p>
          <div className="mt-5 max-w-sm"><CTA onClick={() => onOrder(qty)}>{cta} <Arrow /></CTA></div>
        </div>
      </div>
    </section>
  );
}

export default function ChaussettePremiumLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState(2); // pack mis en avant par defaut : 10 paires
  const [stock, setStock] = useState(17);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; q: string; visible: boolean } | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAns, setQuizAns] = useState<{ q1?: number; q2?: number }>({});

  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const NOTIFS = useMemo(() => [
    { n: 'Marc', v: 'Cocody', q: '10 paires' },
    { n: 'Stéphane', v: 'Yopougon', q: '5 paires' },
    { n: 'Alain', v: 'Bingerville', q: '15 paires' },
    { n: 'Serge', v: 'Marcory', q: '10 paires' },
    { n: 'Daniel', v: 'Abidjan', q: '5 paires' },
    { n: 'Arnaud', v: 'Treichville', q: '10 paires' },
  ], []);

  const openModal = useCallback((q?: number) => {
    const pack = q || selectedPack || 1;
    setQty(pack);
    setModal(true);
    track('OpenForm', { product: PRODUCT_CODE, pack, value: PRICES[pack] });
  }, [selectedPack]);

  const choosePack = useCallback((p: number) => {
    setSelectedPack(p);
    track('SelectPack', { product: PRODUCT_CODE, pack: p, value: PRICES[p] });
  }, []);

  // Tracking + preload hero
  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    track('ViewContent', { product: PRODUCT_CODE, content_name: 'Chaussettes Premium Homme', value: PRICES[1], currency: 'XOF' });
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = M('hero.webp');
    document.head.appendChild(l);
  }, [company]);

  // Resolution produit (par code) pour la commande
  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then((r) => {
        const p = (r.data?.products || []).find((x: Product) => x.code?.toUpperCase() === PRODUCT_CODE);
        if (p) setProduct(p);
      })
      .catch(() => {});
  }, [company]);

  // Compte a rebours 24h glissant (minuit) + redemarrage auto
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - now.getTime());
      setCountdown({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setStock((s) => (s > 6 ? s - 1 : s)), 40000);
    return () => clearInterval(id);
  }, []);

  // Notifications d'achat toutes les 12-18 s
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      const t = NOTIFS[toastIdx.current % NOTIFS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast((p) => (p ? { ...p, visible: false } : null)), 4500);
      setTimeout(() => setToast(null), 4900);
      timer = setTimeout(show, 12000 + Math.random() * 6000);
    };
    timer = setTimeout(show, 6000);
    return () => clearTimeout(timer);
  }, [NOTIFS]);

  useEffect(() => { document.body.style.overflow = modal ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [modal]);

  const stockPct = Math.round((stock / 30) * 100);

  const MODELS = [
    { name: 'Gris élégant', desc: 'Sobre, discret et parfait pour une tenue professionnelle.', img: M('m1.webp') },
    { name: 'Bleu clair moderne', desc: 'Un style frais qui se remarque sans être trop voyant.', img: M('m2.webp') },
    { name: 'Noir business', desc: 'Le classique indispensable avec souliers et mocassins.', img: M('m3.webp') },
    { name: 'Blanc propre', desc: 'Un rendu lumineux, propre et moderne.', img: M('m4.webp') },
    { name: 'Bleu marine premium', desc: 'Élégant, masculin et facile à porter avec tout.', img: M('m5.webp') },
  ];

  const BENEFITS = [
    { i: '🧦', t: 'Confort au quotidien' }, { i: '✨', t: 'Style premium' },
    { i: '👞', t: 'Idéal avec mocassins' }, { i: '🥿', t: 'Parfait avec souliers' },
    { i: '🎨', t: 'Couleurs faciles à associer' }, { i: '🦶', t: 'Tient bien au pied' },
    { i: '💼', t: 'Look bureau et sortie' }, { i: '💰', t: 'Pack économique' },
  ];

  const REVIEWS = [
    { txt: 'Très belles chaussettes. Je les porte avec mes mocassins, le rendu est propre.', n: 'Marc', v: 'Cocody' },
    { txt: 'Bonne qualité, les couleurs sont jolies et ça tient bien au pied.', n: 'Stéphane', v: 'Yopougon' },
    { txt: "J'ai pris le pack 10 paires. Très satisfait, surtout le noir et le bleu marine.", n: 'Daniel', v: 'Abidjan' },
    { txt: 'Livraison rapide. Les chaussettes font vraiment plus premium que les modèles simples.', n: 'Arnaud', v: 'Bingerville' },
    { txt: 'Très bon rapport qualité-prix. Je recommande.', n: 'Serge', v: 'Marcory' },
    { txt: 'Parfait pour le bureau et les sorties.', n: 'Alain', v: 'Treichville' },
  ];

  const PACKS = [
    { v: 1, n: 'Pack Découverte', paires: '5 paires', p: 11900, sub: 'Idéal pour découvrir la collection.', save: null as string | null, badge: null as string | null },
    { v: 2, n: 'Pack Élégance', paires: '10 paires', p: 20900, sub: 'Le meilleur choix pour varier votre style toute la semaine.', save: 'Vous économisez vs 2 packs de 5', badge: 'Le plus populaire' },
    { v: 3, n: 'Pack Premium', paires: '15 paires', p: 28900, sub: 'Le pack le plus rentable pour profiter de tous les modèles.', save: 'Meilleure valeur', badge: 'Meilleure économie' },
  ];

  const FAQ = [
    { q: 'Combien de paires je reçois ?', a: 'Vous choisissez votre pack : 5 paires, 10 paires ou 15 paires.' },
    { q: 'Est-ce que les modèles sont différents ?', a: 'Oui, la collection contient 5 modèles : gris, bleu clair, noir, blanc et bleu marine.' },
    { q: 'Est-ce adapté aux souliers et mocassins ?', a: 'Oui, ces chaussettes sont parfaites avec les mocassins, souliers, chaussures de ville et tenues élégantes.' },
    { q: 'Comment choisir le bon pack ?', a: 'Le pack 5 paires est idéal pour découvrir. Le pack 10 paires est le plus populaire. Le pack 15 paires est le plus économique.' },
    { q: 'Comment se passe la commande ?', a: 'Vous remplissez le formulaire, notre équipe vous appelle pour confirmer, puis la livraison est organisée.' },
    { q: 'Comment payer ?', a: 'Vous payez à la livraison.' },
    { q: 'Est-ce que je peux offrir ces chaussettes ?', a: 'Oui, c\'est un cadeau utile, élégant et facile à porter.' },
  ];

  // Resultat quiz -> pack recommande
  const quizRecommend = (): number => {
    const q1 = quizAns.q1 ?? 0; const q2 = quizAns.q2 ?? 0;
    if (q2 >= 2 || q1 >= 2) return 3; // plusieurs personnes / cadeau OU usage quotidien
    if (q1 === 1 || q2 === 1) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-[#0a0e16] text-white" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
      <style>{`
        @keyframes cph-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .cph-marquee { animation: cph-marquee 30s linear infinite }
        @keyframes cph-sheen { 0% { transform: translateX(-100%) } 60% { transform: translateX(100%) } 100% { transform: translateX(100%) } }
        .cph-sheen { animation: cph-sheen 3s ease-in-out infinite }
        @keyframes cph-pulse { 0%,100% { box-shadow: 0 18px 44px -12px rgba(10,31,68,.6); transform: translateY(0) } 50% { box-shadow: 0 26px 60px -10px rgba(212,175,55,.5); transform: translateY(-2px) } }
        .cph-pulse { animation: cph-pulse 2.6s ease-in-out infinite } .cph-cta:hover { animation: none !important }
        @keyframes cph-fade-up { from { opacity:0; transform: translateY(20px) } to { opacity:1; transform: translateY(0) } }
        .cph-fade-up { animation: cph-fade-up .55s cubic-bezier(.22,.8,.4,1) both }
        @keyframes cph-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        .cph-gold { background: linear-gradient(90deg,#d4af37,#fde68a,#f59e0b,#fef3c7,#d4af37); background-size:200% auto; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation: cph-shimmer 3.5s linear infinite }
        @keyframes cph-toast-in { from { opacity:0; transform: translateX(-110%) } to { opacity:1; transform: translateX(0) } }
        @keyframes cph-toast-out { from { opacity:1 } to { opacity:0; transform: translateX(-110%) } }
        .cph-toast-in { animation: cph-toast-in .45s cubic-bezier(.22,1,.36,1) both } .cph-toast-out { animation: cph-toast-out .4s ease both }
      `}</style>

      {/* 1. BARRE SCROLLANTE STICKY HAUT */}
      <div className="sticky top-0 z-50 shadow-lg">
        <Marquee tone="navy" items={['Offre spéciale aujourd\'hui', '5 paires à 11 900 Fr', '10 paires à 20 900 Fr', '15 paires à 28 900 Fr', 'Paiement à la livraison', 'Livraison rapide', 'Collection 5 modèles premium', 'Style • Confort • Élégance']} />
        <div className="h-[3px] w-full bg-[#060b16]"><div className="h-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 transition-all duration-700" style={{ width: `${stockPct}%` }} /></div>
      </div>

      {/* 2. HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1f44] via-[#0b2350] to-[#0a0e16] py-8 sm:py-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-[#5b9bd5]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300 backdrop-blur cph-fade-up">
            <span className="h-1 w-1 rounded-full bg-amber-400" /> Collection signature 2026 <span className="h-1 w-1 rounded-full bg-amber-400" />
          </p>
          <div className="relative mx-auto mt-5 max-w-md overflow-hidden rounded-[2.2rem] ring-2 ring-amber-300/40 shadow-[0_40px_90px_-30px_rgba(0,0,0,.8)] cph-fade-up" style={{ animationDelay: '.05s' }}>
            <LazyImg src={M('hero.webp')} alt="Chaussettes premium homme" aspect="4/5" priority />
            <div className="absolute -left-2 top-8 rotate-[-6deg] rounded-md bg-[#060b16] px-3 py-2 ring-1 ring-amber-300/40">
              <p className="text-[9px] font-black uppercase tracking-[0.26em] text-amber-300">Collection</p>
              <p className="cph-gold text-[15px] font-black leading-tight">5 modèles</p>
            </div>
          </div>
          <h1 className="mt-6 text-[32px] font-black leading-[1.05] tracking-tight cph-fade-up sm:text-[46px]" style={{ animationDelay: '.1s' }}>
            Chaussettes <span className="cph-gold">Premium</span> Homme
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[14px] font-semibold text-slate-200 sm:text-[16px]">
            Le détail élégant qui transforme vos chaussures en vrai style premium.
          </p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-400">
            Confortables, modernes et faciles à porter avec vos mocassins, souliers ou chaussures de ville. Une collection de 5 modèles pensée pour les hommes qui aiment soigner les détails.
          </p>
          <div className="mt-5 flex items-baseline justify-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-wider text-slate-400">Dès</span>
            <span className="cph-gold text-4xl font-black sm:text-5xl">11 900</span>
            <span className="text-lg font-bold text-slate-200">FCFA</span>
          </div>
          <div className="mx-auto mt-5 max-w-sm"><CTA onClick={() => openModal(selectedPack)}>Commander maintenant <Arrow /></CTA></div>
          <div className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-2">
            {['Paiement à la livraison', 'Livraison rapide', '5 modèles disponibles', 'Offre limitée'].map((b) => (
              <span key={b} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-200">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Barre 1 apres hero */}
      <Marquee tone="silver" items={['Style', 'Confort', 'Élégance', '5 modèles premium', 'Livraison rapide']} />

      {/* 3. POURQUOI */}
      <section className="bg-gradient-to-b from-white to-slate-100 py-14 text-slate-900">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-balance text-2xl font-black sm:text-3xl">Un petit détail. <span className="text-[#0b2350]">Un grand changement</span> dans votre style.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-600">
            Une belle chaussure attire le regard. Mais une belle chaussette complète le look. Avec cette collection premium, vos tenues deviennent plus propres, plus élégantes et plus travaillées.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[{ i: '✨', t: 'Look plus élégant' }, { i: '🦶', t: 'Confort toute la journée' }, { i: '👞', t: 'Parfait avec chaussures de ville' }, { i: '🎨', t: '5 modèles faciles à associer' }].map((c) => (
              <div key={c.t} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-3xl">{c.i}</div>
                <p className="mt-2 text-[13px] font-bold text-slate-800">{c.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. GALERIE 5 MODELES */}
      <section className="bg-gradient-to-b from-[#0a0e16] to-[#0a1f44] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">La collection</span>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">5 modèles <span className="cph-gold">premium</span></h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {MODELS.map((m) => (
              <div key={m.name} className="group overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:ring-amber-300/40">
                <div className="overflow-hidden"><LazyImg src={m.img} alt={m.name} aspect="1/1" /></div>
                <div className="p-3">
                  <p className="text-[13px] font-black text-white">{m.name}</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">{m.desc}</p>
                  <button type="button" onClick={() => openModal(selectedPack)} className="mt-3 w-full rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 px-2 py-2 text-[11px] font-black uppercase tracking-wider text-slate-950 transition hover:scale-[1.02]">
                    Choisir ce modèle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PACK SELECTOR */}
      <section className="bg-gradient-to-b from-[#0a1f44] to-[#0a0e16] py-14">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-black sm:text-3xl">Choisissez votre pack</h2>
            <p className="mt-2 text-[13px] text-slate-400">Plus vous prenez de paires, plus vous économisez.</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {PACKS.map((p) => {
              const active = selectedPack === p.v;
              return (
                <button key={p.v} type="button" onClick={() => choosePack(p.v)}
                  className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition ${active ? 'border-amber-400 bg-gradient-to-br from-[#0b2350] to-[#060b16] shadow-[0_0_0_3px_rgba(212,175,55,.25)]' : 'border-white/10 bg-white/5 hover:border-white/25'}`}>
                  {p.badge && <span className="absolute -top-1 right-3 rotate-3 rounded-b-md bg-amber-400 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-slate-950">{p.badge}</span>}
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">{p.paires}</p>
                  <p className="mt-1 text-xl font-black text-white">{p.n}</p>
                  <p className="mt-2 cph-gold text-2xl font-black">{fmt(p.p)} F</p>
                  {p.save && <p className="mt-2 inline-flex rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold text-amber-300">{p.save}</p>}
                  <p className="mt-2 text-[11px] text-slate-400">{p.sub}</p>
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={() => openModal(selectedPack)}>Je choisis ce pack ({QTY_OPTS[selectedPack - 1].label}) <Arrow /></CTA></div>
        </div>
      </section>

      {/* Barre 2 avant offres / blocs */}
      <Marquee tone="navy" items={['5 paires 11 900 Fr', '10 paires 20 900 Fr', '15 paires 28 900 Fr']} />

      {/* 6. BLOCS IMAGE + TEXTE + CTA alternes */}
      <FeatureBlock kicker="Le détail" bg="bg-gradient-to-br from-[#0b2350] to-[#0a0e16] text-white" img={M('m6.webp')} qty={selectedPack} onOrder={openModal}
        title={<>Avec vos souliers, le détail fait la <span className="cph-gold">différence</span>.</>}
        text="Ces chaussettes ajoutent une touche élégante à vos tenues de bureau et de sortie." cta="Je choisis mon pack" />
      <FeatureBlock kicker="La collection" bg="bg-gradient-to-br from-slate-100 to-white text-slate-900" img={M('m7.webp')} qty={selectedPack} onOrder={openModal} reverse
        title={<>5 modèles pour <span className="text-[#0b2350]">varier votre style</span>.</>}
        text="Gris, noir, blanc, bleu clair ou bleu marine : choisissez selon votre tenue du jour." cta="Voir les offres" />
      <FeatureBlock kicker="Confort" bg="bg-gradient-to-br from-[#1a2740] to-[#0a0e16] text-white" img={M('m8.webp')} qty={selectedPack} onOrder={openModal}
        title={<>Confortables pour <span className="cph-gold">toute la journée</span>.</>}
        text="Une paire agréable à porter du matin au soir, avec un style propre et masculin." cta="Commander maintenant" />
      <FeatureBlock kicker="Cadeau" bg="bg-gradient-to-br from-[#5b9bd5]/20 to-[#0a1f44] text-white" img={M('m9.webp')} qty={3} onOrder={openModal} reverse
        title={<>Un <span className="cph-gold">cadeau utile</span> pour homme élégant.</>}
        text="Offrez ou portez une collection pratique, belle et facile à associer." cta="Profiter de l'offre" />

      {/* 8. BENEFICES */}
      <section className="bg-gradient-to-b from-white to-slate-100 py-14 text-slate-900">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Pourquoi vous allez les <span className="text-[#0b2350]">adopter</span></h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.t} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <span className="text-2xl">{b.i}</span><span className="text-[12px] font-bold text-slate-800">{b.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. AVANT / APRES */}
      <section className="bg-gradient-to-b from-[#0a0e16] to-[#0a1f44] py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Avant / Après <span className="cph-gold">style</span></h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Avant</p>
              <ul className="mt-3 space-y-2 text-[13px] text-slate-300">
                {['Chaussettes basiques', 'Look moins travaillé', 'Chaussures moins mises en valeur'].map((x) => (<li key={x} className="flex gap-2"><span className="text-slate-500">✕</span>{x}</li>))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-br from-[#0b2350] to-[#060b16] p-5">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">Après</p>
              <ul className="mt-3 space-y-2 text-[13px] text-white">
                {['Chaussettes premium', 'Look plus élégant', 'Tenue mieux finie', 'Détail qui attire le regard'].map((x) => (<li key={x} className="flex gap-2"><span className="text-amber-400">✓</span>{x}</li>))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-center text-[16px] font-black text-white sm:text-[19px]">Ce sont les petits détails qui font les <span className="cph-gold">hommes bien habillés</span>.</p>
        </div>
      </section>

      {/* 10. COMMENT PORTER */}
      <section className="bg-gradient-to-b from-slate-100 to-white py-14 text-slate-900">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Comment porter les <span className="text-[#0b2350]">5 modèles</span></h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              { t: 'Avec mocassins noirs', d: 'Choisissez le noir, le gris ou le bleu marine.' },
              { t: 'Avec souliers marron', d: 'Essayez le bleu clair, le gris ou le bleu marine.' },
              { t: 'Avec tenue bureau', d: 'Prenez le pack 10 ou 15 paires pour varier toute la semaine.' },
              { t: 'Avec tenue casual chic', d: 'Le blanc et le bleu clair donnent un rendu plus moderne.' },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[14px] font-black text-[#0b2350]">{s.t}</p>
                <p className="mt-1 text-[13px] text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barre 3 avant temoignages */}
      <Marquee tone="navy" items={['Des clients satisfaits', 'Paiement à la livraison', 'Commande confirmée par téléphone']} />

      {/* 14. TEMOIGNAGES */}
      <section className="bg-gradient-to-b from-[#0a1f44] to-[#0a0e16] py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-amber-300"><span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} />)}</span><span className="text-[12px] font-black text-white">4,9/5</span></span>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">Ce qu'<span className="cph-gold">ils disent</span></h2>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <div key={r.n} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} />)}</span>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-200">"{r.txt}"</p>
                <p className="mt-2 text-[11px] font-bold text-amber-300">— {r.n}, {r.v} <span className="text-emerald-400">✓ Vérifié</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 16. MINI QUIZ */}
      <section className="bg-gradient-to-b from-[#0a0e16] to-[#0b2350] py-14">
        <div className="mx-auto max-w-xl px-4">
          <div className="rounded-3xl border border-amber-300/25 bg-white/5 p-6">
            <h2 className="text-center text-xl font-black text-white sm:text-2xl">Quel pack choisir ?</h2>
            {quizStep === 0 && (
              <div className="mt-5">
                <p className="text-[14px] font-bold text-slate-200">Vous portez des chaussures de ville combien de fois par semaine ?</p>
                <div className="mt-3 space-y-2">
                  {['1 à 2 fois', '3 à 5 fois', 'Tous les jours'].map((o, i) => (
                    <button key={o} type="button" onClick={() => { setQuizAns((a) => ({ ...a, q1: i })); setQuizStep(1); }} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-[13px] font-semibold text-white transition hover:border-amber-300/50">{o}</button>
                  ))}
                </div>
              </div>
            )}
            {quizStep === 1 && (
              <div className="mt-5">
                <p className="text-[14px] font-bold text-slate-200">Vous achetez pour vous seul ou pour plusieurs personnes ?</p>
                <div className="mt-3 space-y-2">
                  {['Pour moi seul', 'Pour moi + cadeau', 'Pour plusieurs personnes'].map((o, i) => (
                    <button key={o} type="button" onClick={() => { setQuizAns((a) => ({ ...a, q2: i })); setQuizStep(2); }} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-[13px] font-semibold text-white transition hover:border-amber-300/50">{o}</button>
                  ))}
                </div>
              </div>
            )}
            {quizStep === 2 && (() => {
              const rec = quizRecommend();
              return (
                <div className="mt-5 text-center">
                  <p className="text-[13px] text-slate-300">Notre recommandation :</p>
                  <p className="mt-1 cph-gold text-2xl font-black">{PACKS[rec - 1].n} — {QTY_OPTS[rec - 1].label}</p>
                  <p className="mt-1 text-[14px] font-bold text-white">{fmt(PRICES[rec])} F</p>
                  <div className="mx-auto mt-4 max-w-xs"><CTA onClick={() => { choosePack(rec); openModal(rec); }}>Commander le pack recommandé <Arrow /></CTA></div>
                  <button type="button" onClick={() => { setQuizStep(0); setQuizAns({}); }} className="mt-3 text-[11px] text-slate-400 underline">Refaire le quiz</button>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* 11. CARTES PRIX */}
      <section className="bg-gradient-to-b from-[#0b2350] to-[#0a0e16] py-14">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Nos <span className="cph-gold">offres</span></h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PACKS.map((p) => (
              <div key={p.v} className={`relative flex flex-col rounded-3xl border-2 p-6 ${p.v === 2 ? 'border-amber-400 bg-gradient-to-b from-[#0b2350] to-[#060b16]' : 'border-white/10 bg-white/5'}`}>
                {p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-950 shadow">{p.badge}</span>}
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">{p.n}</p>
                <p className="mt-1 text-lg font-black text-white">{p.paires}</p>
                <p className="mt-3 cph-gold text-4xl font-black">{fmt(p.p)}</p>
                <p className="text-[12px] font-bold text-slate-400">FCFA</p>
                <p className="mt-3 flex-1 text-[12px] text-slate-300">{p.sub}</p>
                <button type="button" onClick={() => { choosePack(p.v); openModal(p.v); }} className="mt-5 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-[13px] font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:scale-[1.02]">
                  Commander {p.paires}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-slate-400">Plus vous prenez de paires, plus vous économisez.</p>
        </div>
      </section>

      {/* 12. URGENCE + COMPTE A REBOURS */}
      <section className="bg-gradient-to-r from-[#0a1f44] via-[#060b16] to-[#0a1f44] py-12">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-xl font-black text-white sm:text-2xl">Offre spéciale disponible pour une <span className="cph-gold">durée limitée</span>.</h2>
          <p className="mt-2 text-[13px] text-slate-300">Les packs sont proposés à prix réduit pendant la campagne de lancement.</p>
          <div className="mt-5 inline-flex items-center gap-1.5">
            {[{ v: countdown.h, l: 'H' }, { v: countdown.m, l: 'M' }, { v: countdown.s, l: 'S' }].map((u, i) => (
              <span key={u.l} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-amber-400">:</span>}
                <span className="flex flex-col items-center"><span className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg bg-amber-400/15 px-2 font-mono text-[20px] font-black tabular-nums text-amber-200 ring-1 ring-amber-400/40">{pad(u.v)}</span><span className="mt-1 text-[9px] font-bold text-slate-400">{u.l}</span></span>
              </span>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">Stock disponible selon les modèles. Commande confirmée par téléphone.</p>
          <div className="mx-auto mt-5 max-w-sm"><CTA onClick={() => openModal(selectedPack)}>J'en profite maintenant <Arrow /></CTA></div>
        </div>
      </section>

      {/* 15. REASSURANCE */}
      <section className="bg-gradient-to-b from-white to-slate-100 py-14 text-slate-900">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Commande simple et <span className="text-[#0b2350]">rassurante</span></h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            {['Vous remplissez le formulaire', 'Notre équipe vous appelle pour confirmer', 'Vous recevez votre commande', 'Vous payez à la livraison'].map((s, i) => (
              <div key={s} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2350] text-[14px] font-black text-amber-300">{i + 1}</div>
                <p className="mt-2 text-[12px] font-semibold text-slate-700">{s}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[13px] font-bold text-[#0b2350]">Aucun paiement en ligne obligatoire. Vous payez à la réception.</p>
        </div>
      </section>

      {/* 24. FAQ */}
      <section className="bg-gradient-to-b from-slate-100 to-white py-14 text-slate-900">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Vos <span className="text-[#0b2350]">questions</span></h2>
          <div className="mt-7 space-y-3">
            {FAQ.map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 open:ring-[#0b2350]/30">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-slate-900">
                  <span>{f.q}</span>
                  <svg className="h-5 w-5 text-[#0b2350] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Barre 4 avant formulaire */}
      <Marquee tone="navy" items={['Offre spéciale disponible aujourd\'hui', 'Choisissez votre pack maintenant']} />

      {/* CLOTURE */}
      <section className="bg-gradient-to-b from-[#0a1f44] to-[#0a0e16] py-16">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-balance text-2xl font-black text-white sm:text-3xl">Prêt à passer au <span className="cph-gold">style premium</span> ?</h2>
          <p className="mt-2 text-[13px] text-slate-300">Choisissez votre pack et payez à la livraison.</p>
          <div className="mx-auto mt-5 max-w-sm"><CTA onClick={() => openModal(selectedPack)}>Commander maintenant — dès 11 900 F <Arrow /></CTA></div>
        </div>
      </section>

      <footer className="bg-[#060b16] py-8 pb-24 text-center text-[10px] font-semibold text-amber-300/70 sm:pb-8">
        © {new Date().getFullYear()} · Chaussettes Premium Homme · Collection 5 modèles · Côte d'Ivoire
      </footer>

      {/* 13. NOTIFICATIONS ACHAT */}
      {toast && !modal && (
        <div className={`fixed bottom-20 left-3 z-30 w-[86vw] max-w-[280px] sm:bottom-5 ${toast.visible ? 'cph-toast-in' : 'cph-toast-out'}`}>
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-300/30 bg-gradient-to-br from-[#0b2350] to-[#060b16] px-3 py-2.5 shadow-[0_12px_30px_-6px_rgba(0,0,0,.6)]">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 font-black text-slate-950"><span className="absolute inset-0 animate-ping rounded-full bg-amber-300/40" /><span className="relative text-[12px]">{toast.n[0]}</span></span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-black text-white"><span className="text-amber-300">{toast.n}</span> à {toast.v}</p>
              <p className="mt-0.5 text-[10px] text-slate-300">vient de commander <span className="font-bold text-amber-200">{toast.q}</span></p>
            </div>
            <span className="text-[10px] font-black text-emerald-400">✓</span>
          </div>
        </div>
      )}

      {/* 19. STICKY CTA BAS */}
      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-amber-300/30 bg-[#060b16]/95 px-3 py-2.5 backdrop-blur-md transition-all duration-300 ${modal ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`} style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Offre · {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</p>
            <p className="text-[11px] font-bold text-white">Dès 11 900 F · paiement à la livraison</p>
          </div>
          <button type="button" onClick={() => openModal(selectedPack)} className="cph-pulse relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-5 py-2.5 text-[13px] font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_10px_24px_-4px_rgba(212,175,55,.6)] ring-2 ring-amber-200/30">
            <span className="cph-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <span className="relative">Commander</span><Arrow />
          </button>
        </div>
      </div>

      {/* 17. FORMULAIRE POPUP (modal de commande premium reutilise, mapping CHAUSSETTE_HOMME_MODLE2) */}
      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: 'Chaussettes Premium Homme',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          slug: SLUG,
          company,
          navigate,
          images: { hero: M('hero.webp') },
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />
    </div>
  );
}
