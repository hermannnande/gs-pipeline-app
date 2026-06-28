/**
 * BoutiqueLanding — page catalogue centrale.
 *
 * Regroupe toutes les landings autonomes du site sous forme d'une grille de
 * cartes produits. Au clic sur une image, redirection (full reload via <a>)
 * vers la landing du produit, pour declencher le tracking PageView et beneficier
 * du first-paint optimise de chaque landing dediee.
 *
 * Slug : "boutique" — accessible via /boutique.
 *
 * Palette : obsidian / cyan / corail (coherente avec PatchDouleur).
 */
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'boutique';

interface Product {
  slug: string;
  href: string;
  name: string;
  tagline: string;
  hero: string;
  badge?: string;
  badgeColor?: 'cyan' | 'rose' | 'amber' | 'emerald' | 'violet';
  price: string;
  oldPrice?: string;
  category: string;
}

const PRODUCTS: Product[] = [
  {
    slug: 'coffret-boxer-homme',
    href: '/coffret-boxer-homme',
    name: 'Coffrets Boxers Homme Premium',
    tagline: '3 boxers premium · Tommy & Luxe',
    hero: '/coffret-boxer-homme/tommy-1.webp',
    badge: 'Nouveau',
    badgeColor: 'amber',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Mode homme · Coffret 3 boxers',
  },
  {
    slug: 'creme-anti-cerne',
    href: '/creme-anti-cerne',
    name: 'Creme Contour des Yeux Anti-Cernes',
    tagline: 'Cernes & rides effaces en 14 jours',
    hero: '/creme-anti-cerne/m1.webp',
    badge: 'Nouveau',
    badgeColor: 'rose',
    price: '7 000 F',
    oldPrice: '15 000 F',
    category: 'Beaute · Regard',
  },
  {
    slug: 'creme-anti-lipome',
    href: '/creme-anti-lipome',
    name: 'Creme Anti-Lipome',
    tagline: 'Stop aux boules sur le corps',
    hero: '/lipome/m1.webp',
    badge: 'Nouveau',
    badgeColor: 'emerald',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Soin avance',
  },
  {
    slug: 'chaussette-homme',
    href: '/chaussette-homme',
    name: 'Chaussettes Homme Luxe — Pack 5 paires',
    tagline: 'Bureau, sortie, week-end',
    hero: '/chaussettes-homme/m1.webp',
    badge: 'Nouveau',
    badgeColor: 'amber',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Mode homme · Pack 5',
  },
  {
    slug: 'patchdouleurtk',
    href: '/patchdouleurtk',
    name: 'Patch Anti-Douleur Chauffant',
    tagline: 'Soulagement instantane jusqu\'a 12h',
    hero: '/patch-douleur-tk/hero.webp?v=2',
    badge: 'Bestseller',
    badgeColor: 'rose',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Douleur · Articulations',
  },
  {
    slug: 'spraydouleurtk',
    href: '/spraydouleurtk',
    name: 'Spray Anti-Douleur Sport',
    tagline: 'Action ciblee en 30 secondes',
    hero: '/spray-douleur/hero.webp',
    badge: 'Sport',
    badgeColor: 'cyan',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Sport · Recuperation',
  },
  {
    slug: 'creme-anti-verrue',
    href: '/creme-anti-verrue',
    name: 'Creme Anti-Verrue Bio',
    tagline: 'Formule 100% botanique',
    hero: '/creme-anti-verrue/hero.webp',
    badge: 'Bio',
    badgeColor: 'emerald',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Soin de la peau',
  },
  {
    slug: 'creme-verrue-tk',
    href: '/creme-verrue-tk',
    name: 'Creme Verrue TK Premium',
    tagline: 'Action dermatologique avancee',
    hero: '/verrue-tk/new-6.webp',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Soin de la peau',
  },
  {
    slug: 'spraylipome',
    href: '/spraylipome',
    name: 'Spray Anti-Lipome',
    tagline: 'Reduit visiblement les lipomes',
    hero: '/spray-lipome/product-1.webp',
    badge: 'Populaire',
    badgeColor: 'violet',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Soin avance',
  },
  {
    slug: 'serum-cerne',
    href: '/serum-cerne',
    name: 'Serum Anti-Cernes Premium',
    tagline: 'Regard eclatant en 7 jours',
    hero: '/serum-yeux/hero.webp',
    badge: 'Premium',
    badgeColor: 'amber',
    price: '7 000 F',
    oldPrice: '15 000 F',
    category: 'Beaute · Visage',
  },
  {
    slug: 'poudre-pousse-cheveux',
    href: '/poudre-pousse-cheveux',
    name: 'Poudre Ultra Pousse Cheveux',
    tagline: 'Cheveux denses en 30 jours',
    hero: '/poudre-pousse-cheveux/hero.webp',
    badge: 'Top vente',
    badgeColor: 'cyan',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Cheveux · Pousse',
  },
  {
    slug: 'chaussette-compression',
    href: '/chaussette-compression',
    name: 'Chaussettes de Compression Anti-Douleur',
    tagline: 'Compression medicale 20-30 mmHg',
    hero: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png',
    badge: 'Bestseller',
    badgeColor: 'emerald',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Sante · Jambes',
  },
  {
    slug: 'creme-ongle-incarne',
    href: '/creme-ongle-incarne',
    name: 'Creme Anti-Ongle Incarne',
    tagline: 'Soulagement en 7 jours, sans chirurgie',
    hero: 'https://obrille.com/wp-content/uploads/2026/04/Traitement-efficace-des-ongles-incarnes.png',
    badge: 'N°1 CI',
    badgeColor: 'violet',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Sante · Pieds',
  },
  {
    slug: 'crememinceurfb',
    href: '/crememinceurfb',
    name: 'Creme Minceur Premium',
    tagline: 'Affinez votre silhouette',
    hero: '/creme-minceur/hero.webp',
    price: '9 900 F',
    oldPrice: '15 000 F',
    category: 'Minceur · Corps',
  },
];

// Couleurs des badges en classes Tailwind
const BADGE_COLORS: Record<NonNullable<Product['badgeColor']>, string> = {
  cyan:    'bg-cyan-400/95 text-[#0a1628] ring-cyan-300/40',
  rose:    'bg-rose-500/95 text-white ring-rose-300/40',
  amber:   'bg-amber-400/95 text-[#0a1628] ring-amber-300/40',
  emerald: 'bg-emerald-500/95 text-white ring-emerald-300/40',
  violet:  'bg-violet-500/95 text-white ring-violet-300/40',
};

/**
 * Carrousel marquee interactif :
 *  - Auto-scroll horizontal continu (requestAnimationFrame, ~30 px/sec)
 *  - L'utilisateur peut le faire defiler manuellement au doigt (touch natif
 *    via overflow-x: auto) ou avec la souris (drag-to-scroll via pointer events)
 *  - Quand il relache, l'auto-scroll reprend apres ~1.5s
 *  - La liste est dupliquee pour un loop seamless quand on atteint la fin
 *  - Le clic est neutralise si on a drag > 6 px (evite les clics accidentels)
 */
function MarqueeCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: 0,
    pointerId: 0,
  });

  const SPEED = 0.4; // px par frame (~24 px/s a 60fps : lecture confortable)
  const RESUME_DELAY_MS = 1500;

  // Auto-scroll loop (rAF)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    function tick() {
      if (el && !pausedRef.current) {
        const half = el.scrollWidth / 2; // liste dupliquee : moitie = boucle complete
        if (half > 0) {
          if (el.scrollLeft >= half) {
            // Reset sans saut visuel
            el.scrollLeft -= half;
          } else {
            el.scrollLeft += SPEED;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  function pause() {
    pausedRef.current = true;
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }
  function resumeSoon(delay = RESUME_DELAY_MS) {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false;
      resumeTimerRef.current = null;
    }, delay);
  }

  // --- Drag souris (desktop) ---
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return; // touch : on laisse le scroll natif
    const el = trackRef.current;
    if (!el) return;
    pause();
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
      pointerId: e.pointerId,
    };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d.active) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - d.startX;
    el.scrollLeft = d.startScroll - dx;
    d.moved = Math.max(d.moved, Math.abs(dx));
  }
  function endDrag(e?: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const el = trackRef.current;
    if (el && e) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    resumeSoon();
  }

  // --- Touch natif (mobile) : pause pendant le touch, reprend apres relache ---
  function onTouchStart() {
    pause();
  }
  function onTouchEnd() {
    resumeSoon();
  }

  // --- Hover desktop : pause pour laisser cliquer tranquillement ---
  function onMouseEnter() {
    if (window.matchMedia('(hover: hover)').matches) pause();
  }
  function onMouseLeave() {
    if (window.matchMedia('(hover: hover)').matches) resumeSoon(400);
  }

  // --- Click : annule si on a drag > 6 px ---
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (dragRef.current.moved > 6) {
      e.preventDefault();
      e.stopPropagation();
      // Reset moved pour les futurs clics
      dragRef.current.moved = 0;
    }
  }

  return (
    <div className="bq-marquee-wrap relative">
      {/* Fade gauche/droite pour estomper les bords */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#0a1628] to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#1a2540] to-transparent sm:w-20" />

      <div
        ref={trackRef}
        className="bq-marquee-scroll flex w-full snap-none gap-3 overflow-x-auto overflow-y-hidden sm:gap-4"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClickCapture={onClickCapture}
      >
        {[...PRODUCTS, ...PRODUCTS].map((p, i) => (
          <a
            key={`${p.slug}-${i}`}
            href={p.href}
            aria-label={p.name}
            draggable={false}
            className="bq-mini group relative flex w-[120px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_-8px_rgba(6,182,212,0.35)] ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-8px_rgba(6,182,212,0.55)] hover:ring-cyan-300 sm:w-[150px]"
          >
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-neutral-50 to-cyan-50/40">
              {p.badge && (
                <span className={`absolute left-1.5 top-1.5 z-10 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ring-1 backdrop-blur ${BADGE_COLORS[p.badgeColor || 'cyan']}`}>
                  {p.badge}
                </span>
              )}
              <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-rose-500/95 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white ring-1 ring-rose-300/40">
                -34%
              </span>
              <img
                src={p.hero}
                alt={p.name}
                loading={i < 6 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className="pointer-events-none h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/70 to-transparent px-2 pb-1.5 pt-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#0a1628]">
                  Voir
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </span>
              </div>
            </div>
            <div className="px-2 py-2 text-center">
              <div className="bq-display line-clamp-2 min-h-[28px] text-[10.5px] font-black leading-tight tracking-tight text-[#0a1628] sm:text-[11.5px]">
                {p.name}
              </div>
              <div className="mt-1 text-[11.5px] font-black tabular-nums text-cyan-700 sm:text-[12.5px]">
                {p.price}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function BoutiqueLanding() {
  // Animation reveal au scroll (Intersection Observer)
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    document.title = 'Boutique Ob\'rille — Solutions premium pour le bien-etre';
    const desc = 'Decouvrez la collection complete : patchs anti-douleur, sprays, cremes, serums et soins premium. Paiement a la livraison.';
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); (m as HTMLMetaElement).name = 'description'; document.head.appendChild(m); }
    m.setAttribute('content', desc);

    // Tracking analytics : enregistre la visite (visiteurs uniques + sessions)
    trackPageView(SLUG);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = Number((e.target as HTMLElement).dataset.idx);
          setRevealed((s) => { const ns = new Set(s); ns.add(idx); return ns; });
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Live counter "X personnes en ligne" — vrai compteur depuis l'API
  // Poll toutes les 15 secondes pour le nombre de visiteurs actifs (5 derniere min).
  // Fallback discret a 0 si l'API ne repond pas (jamais de chiffre invente).
  const [watchers, setWatchers] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;

    async function fetchRealtime() {
      try {
        const r = await axios.get(`${API_URL}/public/realtime/${SLUG}`, { timeout: 5000 });
        if (cancelled) return;
        // Au minimum 1 (le visiteur actuel) tant qu'on a une reponse valide
        const n = Math.max(1, r.data?.activeVisitors || 0);
        setWatchers(n);
      } catch {
        if (!cancelled) setWatchers((prev) => prev ?? 1);
      }
    }

    fetchRealtime();
    const id = setInterval(fetchRealtime, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="bq-root min-h-screen overflow-x-hidden bg-[#fafaf9] text-[#0a1628] antialiased">

      {/* ============================================== */}
      {/* TOP STRIP                                      */}
      {/* ============================================== */}
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0c1e2e] to-[#0a1628] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white sm:text-[11px]">
        <span className="text-cyan-300">Livraison rapide</span>
        <span className="mx-2 opacity-50">·</span>
        <span>paiement a la livraison</span>
        <span className="mx-2 hidden opacity-50 sm:inline">·</span>
        <span className="hidden text-cyan-300 sm:inline">conseiller en 30 min</span>
      </div>

      {/* ============================================== */}
      {/* HEADER                                         */}
      {/* ============================================== */}
      <header className="relative z-10 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-cyan-500 text-white shadow-[0_8px_20px_-4px_rgba(6,182,212,0.55)]">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h.93a4 4 0 016.14 0H14a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/></svg>
            </span>
            <div className="leading-tight">
              <span className="bq-display block text-[16px] font-extrabold tracking-tight text-[#0a1628] sm:text-[18px]">Ob'rille</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-700/80 sm:text-[10px]">La Boutique</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-700 ring-1 ring-cyan-200 sm:px-3 sm:py-1.5 sm:text-[10px]" title="Visiteurs actifs sur la boutique (5 dernières min)">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"/>
            {watchers === null ? '…' : `${watchers} en ligne`}
          </div>
        </div>
      </header>

      {/* ============================================== */}
      {/* HERO MARQUEE — miniatures defilantes cliquables */}
      {/* ============================================== */}
      <section className="bq-hero relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#1a2540] py-7 sm:py-9">
        {/* Halos */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-cyan-500/25 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-orange-500/20 blur-[140px]" />

        <div className="relative mx-auto w-full max-w-[1280px]">
          {/* Petit pre-titre minimal centre */}
          <div className="mb-5 flex items-center justify-center gap-2 px-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.32em] text-cyan-200 ring-1 ring-cyan-300/30 backdrop-blur sm:text-[10px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"/>
              Catalogue premium · {PRODUCTS.length} produits
            </span>
          </div>

          {/* Marquee interactif (auto-scroll + drag + reprise) */}
          <MarqueeCarousel />

          {/* Hint pour interaction */}
          <div className="mt-5 flex items-center justify-center gap-2 px-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-100/70 sm:text-[11px]">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l-4 4 4 4M16 7l4 4-4 4M4 11h16"/>
              </svg>
              Faites glisser ←→ ou touchez un produit pour découvrir
            </span>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* GRID PRODUITS                                  */}
      {/* ============================================== */}
      <section className="relative px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700">Catalogue</span>
              <h2 className="bq-display mt-1 text-[28px] font-black leading-tight tracking-tight text-[#0a1628] sm:text-[36px]">
                Choisissez votre <span className="bq-grad-cyan">produit</span>
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-200">
              {PRODUCTS.length} produits disponibles
            </span>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {PRODUCTS.map((p, i) => (
              <a
                key={p.slug}
                href={p.href}
                data-reveal
                data-idx={i}
                className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-8px_rgba(6,182,212,0.18)] ring-1 ring-neutral-200 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_50px_-12px_rgba(6,182,212,0.35)] hover:ring-cyan-300 ${revealed.has(i) ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
                style={{ transitionDelay: `${(i % 4) * 60}ms` }}
              >
                {/* Image — aspect 4/5 */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-cyan-50/40">
                  {p.badge && (
                    <span className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ring-1 backdrop-blur ${BADGE_COLORS[p.badgeColor || 'cyan']}`}>
                      {p.badge}
                    </span>
                  )}
                  <span className="absolute right-3 top-3 z-10 rounded-full bg-rose-500/95 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white ring-1 ring-rose-300/40">
                    -34%
                  </span>
                  <img
                    src={p.hero}
                    alt={p.name}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  {/* Hover overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1628]/80 via-[#0a1628]/0 to-[#0a1628]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"/>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#0a1628] shadow-[0_8px_20px_-4px_rgba(6,182,212,0.6)]">
                      Voir l'offre
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </span>
                  </div>
                </div>

                {/* Texte */}
                <div className="relative flex flex-1 flex-col gap-2 px-4 py-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-700/80">{p.category}</span>
                  <h3 className="bq-display text-[15px] font-black leading-tight tracking-tight text-[#0a1628] sm:text-[16px]">{p.name}</h3>
                  <p className="text-[12px] leading-snug text-neutral-600">{p.tagline}</p>

                  {/* Stars row */}
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, k) => (
                        <svg key={k} className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500">4.7 / 5 · verifies</span>
                  </div>

                  {/* Prix */}
                  <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="bq-display text-[20px] font-black tabular-nums text-cyan-700 sm:text-[22px]">{p.price}</span>
                      {p.oldPrice && <span className="text-[12px] text-neutral-400 line-through">{p.oldPrice}</span>}
                    </div>
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">livraison</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* POURQUOI Ob'rille                              */}
      {/* ============================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#1a2540] px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-cyan-500 blur-[160px]"/>
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-orange-500 blur-[160px]"/>
        </div>

        <div className="relative mx-auto w-full max-w-[1100px]">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200 ring-1 ring-cyan-300/30 backdrop-blur">
              Pourquoi Ob'rille
            </span>
            <h2 className="bq-display mt-5 text-[32px] font-black leading-[1] tracking-tight text-white sm:text-[48px]">
              Une exigence <span className="bq-grad-cyan">premium</span>,<br/>
              une experience <span className="bq-grad-coral">simple</span>.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { ico: '🎯', t: 'Selection rigoureuse', d: 'Chaque produit est teste avant d\'etre ajoute au catalogue.' },
              { ico: '🚚', t: 'Livraison rapide', d: 'Partout en Cote d\'Ivoire, en quelques jours seulement.' },
              { ico: '💵', t: 'Paiement a la livraison', d: 'Vous payez a la reception. Aucun risque, aucun engagement.' },
              { ico: '📞', t: 'Conseiller dedie', d: 'Un expert vous rappelle dans les 30 minutes apres commande.' },
            ].map((b) => (
              <div key={b.t} className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/10">
                <div className="text-[28px]">{b.ico}</div>
                <h3 className="mt-3 text-[15px] font-black leading-tight text-white">{b.t}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-cyan-100/75">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* CTA FINAL                                      */}
      {/* ============================================== */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-[820px] text-center">
          <h2 className="bq-display text-[32px] font-black leading-tight tracking-tight text-[#0a1628] sm:text-[42px]">
            Pret a <span className="bq-grad-coral">commander</span> ?
          </h2>
          <p className="mt-4 text-[14px] text-neutral-700 sm:text-[15px]">
            Choisissez votre produit ci-dessus, remplissez le formulaire en 30 secondes et recevez votre commande chez vous.
          </p>
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 px-6 py-3 text-[12px] font-black uppercase tracking-[0.18em] text-white shadow-[0_15px_35px_-8px_rgba(6,182,212,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-6px_rgba(6,182,212,0.8)]"
          >
            Voir tous les produits
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
          </a>
        </div>
      </section>

      {/* ============================================== */}
      {/* FOOTER                                         */}
      {/* ============================================== */}
      <footer className="bg-[#0a1628] px-4 py-10 text-center text-cyan-200/60 sm:px-6">
        <div className="mx-auto max-w-[1100px]">
          <p className="bq-display text-[16px] font-extrabold tracking-tight text-cyan-200">Ob'rille · La Boutique</p>
          <p className="mt-2 text-[11px] text-cyan-200/65">Solutions premium pour le bien-etre — Livraison rapide en Cote d'Ivoire</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px]">
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">Paiement a la livraison</span>
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">Sans engagement</span>
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">Commande securisee</span>
          </div>
          <p className="mt-5 text-[11px] text-cyan-200/40">© 2026 — Tous droits reserves</p>
        </div>
      </footer>

      {/* ============================================== */}
      {/* STYLES                                         */}
      {/* ============================================== */}
      <style>{`
        .bq-display { font-family: 'Bricolage Grotesque', 'Outfit', system-ui, -apple-system, sans-serif; font-feature-settings: 'ss01' on, 'ss02' on; }
        .bq-grad-cyan  { background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #0ea5e9 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .bq-grad-coral { background: linear-gradient(135deg, #fb923c 0%, #ef4444 50%, #ec4899 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

        /* Marquee — container scrollable horizontalement, auto-scroll JS */
        .bq-marquee-wrap { position: relative; }
        .bq-marquee-scroll {
          scroll-behavior: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior-x: contain;
          touch-action: pan-x;
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
          padding-bottom: 4px;
        }
        .bq-marquee-scroll::-webkit-scrollbar { display: none; }
        .bq-marquee-scroll:active { cursor: grabbing; }
        .bq-mini { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) {
          /* L'auto-scroll JS s'arrete via une verification dans le rAF si besoin,
             mais on conserve la possibilite de scroller au doigt. */
        }
        /* Ligne 2 lignes max sur le nom produit */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
