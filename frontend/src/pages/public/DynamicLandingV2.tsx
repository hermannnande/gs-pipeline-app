import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
const pad = (n: number) => String(n).padStart(2, '0');

interface V2Config {
  productCode: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  prices: Record<number, number>;
  oldPrice: number;
  discount: string;
  qtyOptions: { v: number; label: string; sub: string; tag?: string; save?: string }[];
  images: {
    hero: string;
    gallery: string[];
    problemBanner?: string;
    solutionBanner?: string;
    lifestyle?: string[];
    comparison?: { before: string; after: string };
    trustStrip?: string[];
  };
  videos?: string[];
  reviews: { img?: string; n: string; v: string; q: string; s: number; verified?: boolean; date?: string }[];
  toasts: { n: string; v: string; t: string }[];
  bundles?: { v: number; label: string; unitPrice: number; totalPrice: number; save?: string; tag?: string; perDay?: string; img?: string }[];
  sections: {
    marqueeTexts?: string[];
    problemTitle?: string;
    problemPoints?: { ico: string; title: string; desc: string }[];
    solutionTitle?: string;
    solutionPoints?: { ico: string; title: string; desc: string; img?: string }[];
    howItWorks?: { n: string; title: string; desc: string; img?: string; ico?: string }[];
    comparisonTable?: { feature: string; us: boolean; them: boolean }[];
    stats?: { n: string; l: string }[];
    faq?: { q: string; a: string }[];
    trustBadges?: { ico: string; t: string; d: string }[];
    stickers?: { text: string; color: string }[];
  };
  colors?: { primary: string; accent: string; bg: string };
  thankYouUrl?: string;
}

interface Product { id: number; code: string; nom: string; prixUnitaire: number }

function useOnScreen(rootMargin = '150px') {
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

function LazySection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useOnScreen('80px');
  return (
    <div ref={ref} className={className}>
      {visible ? <div className="animate-[fadeUp_.5s_ease_both]" style={{ animationDelay: `${delay}ms` }}>{children}</div>
       : <div className="min-h-[100px]"/>}
    </div>
  );
}

const Star = ({ fill = true }: { fill?: boolean }) => (
  <svg className={`h-4 w-4 ${fill ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);

export default function DynamicLandingV2() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const company = useMemo(() => new URLSearchParams(window.location.search).get('company') || 'ci', []);

  const [cfg, setCfg] = useState<V2Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<Product | null>(null);

  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [gi, setGi] = useState(0);
  const touchStart = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const toastIdx = useRef(0);
  const [stock, setStock] = useState(47);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [exitPopup, setExitPopup] = useState(false);
  const exitShown = useRef(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API_URL}/templates/public/${slug}`)
      .then(r => {
        const t = r.data.template;
        setCfg(JSON.parse(t.config) as V2Config);
        if (t.product) setProduct(t.product);
      })
      .catch(() => setError('Page introuvable.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!cfg || !cfg.productCode || product) return;
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then(r => {
        const p = (r.data?.products || []).find((p: Product) => p.code?.toUpperCase() === cfg.productCode.toUpperCase());
        if (p) setProduct(p);
      }).catch(() => {});
  }, [cfg, company, product]);

  useEffect(() => {
    if (!cfg?.toasts?.length) return;
    const show = () => {
      const t = cfg.toasts[toastIdx.current % cfg.toasts.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 3500);
      setTimeout(() => setToast(null), 3900);
    };
    const first = setTimeout(show, 6000);
    const id = setInterval(show, 20000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [cfg]);

  useEffect(() => {
    const id = setInterval(() => setStock(s => s > 8 ? s - 1 : s), 55000);
    return () => clearInterval(id);
  }, []);

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
    const handler = (e: MouseEvent) => {
      if (e.clientY < 10 && !exitShown.current && !modal) { exitShown.current = true; setExitPopup(true); }
    };
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  }, [modal]);

  useEffect(() => { document.body.style.overflow = (modal || exitPopup) ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [modal, exitPopup]);

  const open = useCallback((q?: number) => {
    setFormErr(''); setName(''); setCity(''); setPhone('');
    if (q) setQty(q); else setQty(1);
    setModal(true); setExitPopup(false);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr('');
    if (!name.trim()) return setFormErr('Entrez votre nom complet.');
    if (!city.trim()) return setFormErr('Entrez votre ville / commune.');
    if (!phone.trim()) return setFormErr('Entrez votre numero de telephone.');
    setSending(true);
    try {
      let prod = product;
      if (!prod && cfg) {
        const r = await axios.get(`${API_URL}/public/products`, { params: { company } });
        prod = (r.data?.products || []).find((p: Product) => p.code?.toUpperCase() === cfg.productCode.toUpperCase()) || null;
        if (prod) setProduct(prod);
      }
      if (!prod) { setFormErr('Produit introuvable. Reessayez.'); setSending(false); return; }
      const res = await axios.post(`${API_URL}/public/order`, { company, productId: prod.id, customerName: name.trim(), customerPhone: phone.trim(), customerCity: city.trim(), quantity: qty });
      const ref = res.data?.orderReference || '';
      const thankUrl = cfg?.thankYouUrl || `/landing/${slug}/merci`;
      const p = new URLSearchParams(); p.set('company', company); if (ref) p.set('ref', ref);
      navigate(`${thankUrl}?${p.toString()}`);
    } catch (err: any) { setFormErr(err?.response?.data?.error || 'Erreur. Reessayez.'); }
    finally { setSending(false); }
  };

  const gallery = useMemo(() => cfg ? [cfg.images.hero, ...cfg.images.gallery].filter(Boolean) : [], [cfg]);

  const startAutoSlide = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    if (gallery.length <= 1) return;
    autoRef.current = setInterval(() => setGi(prev => (prev + 1) % gallery.length), 4500);
  }, [gallery.length]);

  useEffect(() => { if (gallery.length > 1) { startAutoSlide(); } return () => { if (autoRef.current) clearInterval(autoRef.current); }; }, [gallery.length, startAutoSlide]);

  const goSlide = useCallback((i: number) => { setGi(i); startAutoSlide(); }, [startAutoSlide]);
  const nextSlide = useCallback(() => goSlide((gi + 1) % (gallery.length || 1)), [gi, gallery.length, goSlide]);
  const prevSlide = useCallback(() => goSlide((gi - 1 + (gallery.length || 1)) % (gallery.length || 1)), [gi, gallery.length, goSlide]);
  const onTouchStart = useCallback((e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => { const d = touchStart.current - e.changedTouches[0].clientX; if (Math.abs(d) > 50) d > 0 ? nextSlide() : prevSlide(); }, [nextSlide, prevSlide]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-teal-600"/>
    </div>
  );
  if (error || !cfg) return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-4">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">{error || 'Page non disponible.'}</div>
    </div>
  );

  const prices = cfg.prices;
  const qtyOpts = cfg.qtyOptions;
  const bundles = cfg.bundles || [];
  const marqueeTexts = cfg.sections?.marqueeTexts || [];
  const reviews = cfg.reviews || [];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-neutral-900" style={{ fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-100%)}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(13,148,136,.3)}50%{box-shadow:0 0 40px rgba(13,148,136,.6)}}
        @keyframes bounce-soft{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes sheen{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        .marquee-track{animation:marquee 25s linear infinite}
        .fade-up{animation:fadeUp .6s ease both}
        .toast-in{animation:slideIn .4s cubic-bezier(.22,1,.36,1) both}
        .toast-out{animation:slideOut .35s cubic-bezier(.55,.08,.68,.53) both}
        .cta-glow{animation:pulse-glow 2s ease-in-out infinite}
        .cta-bounce{animation:bounce-soft 2.5s ease-in-out infinite}
        .cta-bounce:hover{animation:none}
        .cta-sheen{animation:sheen 3s ease-in-out infinite}
        .float-anim{animation:float 3s ease-in-out infinite}
        .scale-in{animation:scaleIn .4s ease both}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        details[open] .faq-chevron{transform:rotate(180deg)}
      `}</style>

      {/* ═══════════ ANNOUNCEMENT BAR ═══════════ */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600">
        <div className="flex items-center justify-center gap-3 px-4 py-2">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">Offre limitee</span>
          <div className="flex items-center gap-1">
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] font-bold text-white/40">:</span>}
                <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md bg-black/20 px-1 font-mono text-[12px] font-black tabular-nums text-white backdrop-blur">{v}</span>
              </div>
            ))}
          </div>
          <span className="hidden text-[11px] font-semibold text-white/80 sm:inline">Livraison GRATUITE aujourd'hui</span>
        </div>
      </div>

      {/* ═══════════ MARQUEE ═══════════ */}
      {marqueeTexts.length > 0 && (
        <div className="overflow-hidden border-b border-neutral-100 bg-neutral-900 py-1.5">
          <div className="marquee-track flex w-[200%] items-center gap-10 text-[10px] font-bold uppercase tracking-[.2em] text-neutral-400">
            {[0,1].map(k => <div key={k} className="flex shrink-0 items-center gap-10">
              {marqueeTexts.map((t, i) => <span key={i} className="flex items-center gap-10">{t}<span className="ml-10 inline-block h-1 w-1 rounded-full bg-teal-500/50"/></span>)}
            </div>)}
          </div>
        </div>
      )}

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:pb-12 sm:pt-10">
        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="fade-up">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-xl shadow-neutral-200/50" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              {gallery.map((src, i) => (
                <img key={i} src={src} alt={i === 0 ? cfg.title : ''} className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${i === gi ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'}`} loading={i === 0 ? 'eager' : 'lazy'} decoding="async"/>
              ))}
              {cfg.badge && <span className="absolute left-4 top-4 z-10 rounded-full bg-red-500 px-3.5 py-1.5 text-[11px] font-black text-white shadow-lg shadow-red-200/50">{cfg.badge}</span>}
              {cfg.discount && <span className="absolute right-4 top-4 z-10 rounded-full bg-teal-600 px-3 py-1.5 text-[11px] font-black text-white shadow-lg">{cfg.discount}</span>}
              {gallery.length > 1 && (
                <>
                  <button onClick={prevSlide} className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-lg backdrop-blur transition hover:bg-white hover:scale-110" aria-label="Precedent">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button onClick={nextSlide} className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-lg backdrop-blur transition hover:bg-white hover:scale-110" aria-label="Suivant">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => goSlide(i)} className={`h-2.5 rounded-full transition-all duration-300 ${i === gi ? 'w-8 bg-teal-600 shadow-md' : 'w-2.5 bg-black/20 hover:bg-black/40'}`}/>
                    ))}
                  </div>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2.5">
                {gallery.map((src, i) => (
                  <button key={i} onClick={() => goSlide(i)} className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${i === gi ? 'border-teal-600 ring-2 ring-teal-200 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                    <img src={src} alt="" className="h-full w-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="fade-up lg:sticky lg:top-20" style={{ animationDelay: '.1s' }}>
            {/* Stickers */}
            {cfg.sections?.stickers && (
              <div className="mb-3 flex flex-wrap gap-2">
                {cfg.sections.stickers.map((s, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${s.color}`}>{s.text}</span>
                ))}
              </div>
            )}
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[.2em] text-teal-600">{cfg.subtitle}</p>
            <h1 className="text-[24px] font-extrabold leading-tight sm:text-[32px] lg:text-[36px]">{cfg.title}</h1>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i}/>)}</div>
              <span className="text-sm font-bold text-neutral-800">4.9</span>
              <span className="text-sm text-neutral-400">({reviews.length > 0 ? `${reviews.length * 1247}` : '8 741'} avis verifies)</span>
            </div>

            {/* Trust strip */}
            {cfg.images.trustStrip && cfg.images.trustStrip.length > 0 && (
              <div className="mt-4 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                {cfg.images.trustStrip.map((src, i) => (
                  <img key={i} src={src} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-neutral-100 bg-white object-cover shadow-sm sm:h-14 sm:w-14"/>
                ))}
                <span className="shrink-0 text-[11px] font-semibold text-neutral-400">+94 350 clients</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-black text-neutral-900 sm:text-4xl">{fmt(prices[1])}</span>
              {cfg.oldPrice && <span className="text-lg text-neutral-400 line-through">{fmt(cfg.oldPrice)}</span>}
              {cfg.discount && <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[12px] font-black text-red-600 ring-1 ring-red-100">{cfg.discount}</span>}
            </div>

            {/* Stock urgency */}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400 transition-all" style={{ width: `${Math.round((stock / 60) * 100)}%` }}/>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-red-600">⚡ Plus que {stock} en stock</span>
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-neutral-500">{cfg.description}</p>

            {/* Quick benefits */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {['Paiement a la livraison', 'Livraison 24h', 'Resultat immediat', 'Support 7j/7'].map(b => (
                <div key={b} className="flex items-center gap-2 rounded-xl border border-neutral-100 bg-white px-3 py-2.5 text-[12px] font-semibold text-neutral-600 shadow-sm">
                  <CheckIcon/>{b}
                </div>
              ))}
            </div>

            {/* CTA Desktop */}
            <div className="mt-6 hidden lg:block">
              <button onClick={() => open(1)} className="cta-bounce cta-glow group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-8 py-5 text-[16px] font-black text-white shadow-xl transition-all hover:shadow-2xl active:scale-[.98]">
                <span className="cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"/>
                <span className="relative z-10 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-50"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"/></span>
                  COMMANDER — {fmt(prices[1])}
                </span>
              </button>
              <p className="mt-2 text-center text-[11px] text-neutral-400">🔒 Commande securisee · Aucun paiement a l'avance</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      {cfg.sections?.stats && (
        <div className="border-y border-neutral-100 bg-white py-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4 text-center sm:gap-12">
            {cfg.sections.stats.map((s, i) => (
              <div key={i}><p className="text-xl font-black text-neutral-900 sm:text-2xl">{s.n}</p><p className="text-[11px] font-medium text-neutral-400">{s.l}</p></div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ PROBLEM SECTION (image heavy) ═══════════ */}
      {cfg.sections?.problemPoints && (
        <LazySection className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-2 inline-block rounded-full bg-red-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-red-600 ring-1 ring-red-100">Le probleme</span>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">{cfg.sections.problemTitle || 'Vous souffrez au quotidien ?'}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cfg.sections.problemPoints.map((p, i) => (
                <div key={i} className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                  {cfg.images.lifestyle?.[i] && (
                    <div className="h-48 overflow-hidden">
                      <img src={cfg.images.lifestyle[i]} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
                    </div>
                  )}
                  <div className="p-5">
                    <span className="mb-2 inline-block text-2xl">{p.ico}</span>
                    <h3 className="text-[15px] font-bold text-neutral-900">{p.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ═══════════ SOLUTION SECTION ═══════════ */}
      {cfg.sections?.solutionPoints && (
        <LazySection className="border-y border-neutral-100 bg-gradient-to-b from-teal-50/50 to-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-2 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-teal-700 ring-1 ring-teal-100">La solution</span>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">{cfg.sections.solutionTitle || 'La solution approuvee'}</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {cfg.sections.solutionPoints.map((s, i) => (
                <div key={i} className="group flex gap-4 rounded-2xl border border-teal-100/60 bg-white p-5 shadow-sm transition-all hover:shadow-lg">
                  {s.img ? (
                    <img src={s.img} alt="" className="h-20 w-20 shrink-0 rounded-2xl border border-neutral-100 object-cover shadow-sm sm:h-24 sm:w-24"/>
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl">{s.ico}</span>
                  )}
                  <div>
                    <h3 className="text-[15px] font-bold text-neutral-900">{s.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      {cfg.sections?.comparisonTable && (
        <LazySection className="py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">Pourquoi nous choisir ?</h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-lg">
              <div className="grid grid-cols-3 border-b border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                <span className="text-[12px] font-bold text-neutral-500">Caracteristique</span>
                <span className="text-[12px] font-black text-teal-700">Nos chaussettes</span>
                <span className="text-[12px] font-bold text-neutral-400">Autres</span>
              </div>
              {cfg.sections.comparisonTable.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 items-center px-4 py-3.5 text-center ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                  <span className="text-left text-[13px] font-semibold text-neutral-700">{row.feature}</span>
                  <div className="flex justify-center">{row.us ? <CheckIcon/> : <XIcon/>}</div>
                  <div className="flex justify-center">{row.them ? <CheckIcon/> : <XIcon/>}</div>
                </div>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      {cfg.sections?.howItWorks && (
        <LazySection className="border-y border-neutral-100 bg-neutral-900 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-extrabold text-white sm:text-3xl">Comment ca marche ?</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cfg.sections.howItWorks.map((s, i) => (
                <div key={i} className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all hover:bg-white/10">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-lg font-black text-teal-400">{s.n}</span>
                    {s.ico && <span className="text-2xl">{s.ico}</span>}
                  </div>
                  {s.img && <img src={s.img} alt="" className="mb-3 h-32 w-full rounded-xl object-cover" loading="lazy"/>}
                  <h3 className="text-[15px] font-bold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ═══════════ BUNDLES ═══════════ */}
      {bundles.length > 0 && (
        <LazySection className="relative overflow-hidden py-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20"/>
          <div className="relative mx-auto max-w-5xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-2 inline-block rounded-full bg-amber-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-100">Offres speciales</span>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Choisissez votre pack</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {bundles.map((b, i) => (
                <button key={i} onClick={() => open(b.v)} className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all hover:-translate-y-1 hover:shadow-xl ${b.tag ? 'border-teal-500 bg-teal-50/30 shadow-lg ring-2 ring-teal-200/50' : 'border-neutral-200 bg-white shadow-sm hover:border-neutral-300'}`}>
                  {b.tag && <span className="absolute -right-1 -top-1 rounded-bl-xl rounded-tr-xl bg-teal-600 px-3 py-1 text-[10px] font-black text-white shadow-md">{b.tag}</span>}
                  {b.img && <img src={b.img} alt="" className="mb-3 h-28 w-full rounded-xl object-cover"/>}
                  <p className="text-[17px] font-black">{b.label}</p>
                  <p className="mt-1 text-2xl font-black text-teal-700">{fmt(b.totalPrice)}</p>
                  {b.save && <p className="mt-1 text-[12px] font-bold text-emerald-600">{b.save}</p>}
                  {b.perDay && <p className="mt-0.5 text-[11px] text-neutral-400">{b.perDay}</p>}
                  <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-[13px] font-bold text-white transition group-hover:bg-teal-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                    Ajouter au panier
                  </div>
                </button>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ═══════════ MID CTA ═══════════ */}
      <LazySection className="py-6 sm:py-8">
        <div className="mx-auto max-w-lg px-4 text-center">
          <button onClick={() => open(1)} className="cta-bounce cta-glow group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-8 py-5 text-[15px] font-black text-white shadow-xl transition-all hover:shadow-2xl active:scale-[.98]">
            <span className="cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"/>
            <span className="relative z-10">🛒 Je commande maintenant</span>
          </button>
        </div>
      </LazySection>

      {/* ═══════════ REVIEWS (with images) ═══════════ */}
      {reviews.length > 0 && (
        <LazySection className="border-y border-neutral-100 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-2 text-center">
              <div className="mb-3 flex items-center justify-center gap-1">{[...Array(5)].map((_, i) => <Star key={i}/>)}</div>
              <p className="text-sm font-bold text-neutral-800">4.9 — {reviews.length * 1247} avis verifies</p>
            </div>
            <h2 className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">Ce que disent nos clients</h2>
          </div>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide sm:justify-center sm:overflow-visible">
            {reviews.map((r, i) => (
              <div key={i} className="w-[85vw] max-w-[340px] shrink-0 snap-center overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:shadow-lg sm:w-[340px]">
                {r.img && (
                  <div className="h-48 overflow-hidden">
                    <img src={r.img} alt={r.n} className="h-full w-full object-cover" loading="lazy"/>
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-2 flex gap-0.5">{[...Array(r.s)].map((_, j) => <Star key={j}/>)}{[...Array(5 - r.s)].map((_, j) => <Star key={j} fill={false}/>)}</div>
                  <p className="mb-3 text-[13px] leading-relaxed text-neutral-600">"{r.q}"</p>
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                    <div>
                      <p className="text-[13px] font-bold text-neutral-800">{r.n}</p>
                      <p className="text-[11px] text-neutral-400">{r.v}</p>
                    </div>
                    {r.verified !== false && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-100">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        Verifie
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LazySection>
      )}

      {/* ═══════════ FAQ ═══════════ */}
      {cfg.sections?.faq && (
        <LazySection className="bg-[#fafaf9] py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">Questions frequentes</h2>
            <div className="space-y-2.5">
              {cfg.sections.faq.map((f, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:shadow-md">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-[14px] font-bold text-neutral-800 sm:text-[15px]">
                    {f.q}
                    <svg className={`faq-chevron h-5 w-5 shrink-0 text-neutral-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="px-5 pb-5 text-[13px] leading-relaxed text-neutral-500">{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ═══════════ TRUST BADGES ═══════════ */}
      {cfg.sections?.trustBadges && (
        <div className="border-t border-neutral-100 bg-white py-10">
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-8 px-4 text-center">
            {cfg.sections.trustBadges.map((b, i) => (
              <div key={i} className="w-36">
                <span className="mb-2 inline-block text-3xl">{b.ico}</span>
                <p className="text-[12px] font-bold text-neutral-800">{b.t}</p>
                <p className="text-[11px] text-neutral-400">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ FINAL CTA ═══════════ */}
      <LazySection className="relative overflow-hidden py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neutral-900 via-teal-900 to-neutral-900"/>
        <div className="relative mx-auto max-w-lg px-4 text-center">
          <h2 className="mb-2 text-2xl font-extrabold text-white sm:text-3xl">Soulagez vos jambes maintenant</h2>
          <p className="mb-6 text-[14px] text-neutral-400">Rejoignez +94 000 clients satisfaits</p>
          <button onClick={() => open(1)} className="cta-glow group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 px-8 py-5 text-[16px] font-black text-white shadow-2xl transition-all hover:shadow-[0_0_50px_rgba(13,148,136,.5)] active:scale-[.98]">
            <span className="cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"/>
            <span className="relative z-10">Commander — {fmt(prices[1])}</span>
          </button>
          <p className="mt-3 text-[11px] text-neutral-500">Aucun paiement a l'avance · Livraison rapide</p>
        </div>
      </LazySection>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-neutral-100 bg-white pb-28 pt-8 sm:pb-8">
        <p className="text-center text-[10px] text-neutral-300">© 2026 · Tous droits reserves · Cote d'Ivoire</p>
      </footer>

      {/* ═══════════ STICKY BAR ═══════════ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <img src={cfg.images.hero} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-neutral-100 object-cover shadow-sm"/>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold">{cfg.title}</p>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black text-teal-700">{fmt(prices[1])}</span>
              {cfg.oldPrice && <span className="text-[11px] text-neutral-400 line-through">{fmt(cfg.oldPrice)}</span>}
            </div>
          </div>
          <button onClick={() => open(1)} className="shrink-0 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-3 text-[13px] font-black text-white shadow-lg shadow-teal-200/40 transition hover:shadow-xl active:scale-[.97]">Commander</button>
        </div>
      </div>

      {/* ═══════════ TOAST ═══════════ */}
      {toast && (
        <div className={`${toast.visible ? 'toast-in' : 'toast-out'} fixed bottom-24 left-3 z-50 flex max-w-[320px] items-center gap-3 rounded-2xl border border-neutral-100 bg-white/95 px-4 py-3.5 shadow-2xl backdrop-blur`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white shadow-md">✓</div>
          <div>
            <p className="text-[12px] font-bold text-neutral-800">{toast.n} vient de commander</p>
            <p className="text-[10px] text-neutral-400">{toast.v} · il y a {toast.t}</p>
          </div>
        </div>
      )}

      {/* ═══════════ EXIT INTENT ═══════════ */}
      {exitPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setExitPopup(false); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
          <div className="scale-in relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button onClick={() => setExitPopup(false)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition hover:bg-neutral-200">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 px-6 py-8 text-center text-white">
              <span className="mb-3 inline-block text-5xl">⚡</span>
              <h3 className="text-xl font-extrabold">Attendez !</h3>
              <p className="mt-2 text-[14px] text-teal-100">Profitez de la livraison GRATUITE</p>
            </div>
            <div className="p-6 text-center">
              <p className="mb-4 text-[14px] text-neutral-500">Ne partez pas les mains vides. Payez uniquement a la livraison.</p>
              <button onClick={() => open(1)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-[14px] font-bold text-white shadow-lg transition hover:bg-neutral-800 active:scale-[.98]">
                Commander maintenant — {fmt(prices[1])}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ORDER MODAL ═══════════ */}
      {modal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
          <div className="scale-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-[420px] sm:rounded-3xl">
            <button onClick={() => setModal(false)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 px-5 pb-4 pt-5 text-white">
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9px] font-bold backdrop-blur">Livraison 24h</span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-0.5 text-[9px] font-bold backdrop-blur">Paiement a la livraison</span>
              </div>
              <h3 className="text-lg font-extrabold">Finalisez votre commande</h3>
            </div>
            <div className="h-1.5 bg-neutral-100"><div className="h-full w-[85%] rounded-r-full bg-gradient-to-r from-teal-500 to-emerald-400"/></div>

            <form onSubmit={submit} className="space-y-3 p-4 pb-5 sm:p-5">
              {[
                { icon: '👤', label: 'Nom complet', val: name, set: setName, ph: 'Ex. Kouadio Fernand', type: 'text' as const },
                { icon: '📍', label: 'Ville / Commune', val: city, set: setCity, ph: 'Ex. Abidjan — Yopougon', type: 'text' as const },
                { icon: '📱', label: 'Telephone', val: phone, set: setPhone, ph: 'Ex. 07 00 00 00 00', type: 'tel' as const },
              ].map(f => (
                <label key={f.label} className="block">
                  <span className="mb-1 block text-[11px] font-bold text-neutral-700">{f.label} <span className="text-red-500">*</span></span>
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 transition-all focus-within:border-teal-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(13,148,136,.08)]">
                    <span className="text-sm">{f.icon}</span>
                    <input type={f.type} inputMode={f.type === 'tel' ? 'tel' : undefined} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="h-11 w-full border-none bg-transparent text-[13px] font-medium outline-none placeholder:text-neutral-300"/>
                  </div>
                </label>
              ))}

              <div>
                <span className="mb-1.5 block text-[11px] font-bold text-neutral-700">Quantite</span>
                <div className="grid gap-1.5">
                  {qtyOpts.map(o => (
                    <button key={o.v} type="button" onClick={() => setQty(o.v)} className={`relative flex items-center justify-between rounded-xl border-2 px-3.5 py-3 text-left transition-all ${qty === o.v ? 'border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-200/50' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${qty === o.v ? 'border-teal-500 bg-teal-500' : 'border-neutral-300'}`}>
                          {qty === o.v && <div className="h-2 w-2 rounded-full bg-white"/>}
                        </div>
                        <span className="text-[13px] font-bold">{o.label}</span>
                        {o.tag && <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[9px] font-bold text-white">{o.tag}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-[13px] font-black">{o.sub}</span>
                        {o.save && <p className="text-[10px] font-bold text-emerald-600">{o.save}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-3 text-white">
                <span className="text-[13px] font-semibold">Total a payer</span>
                <span className="text-[17px] font-black">{fmt(prices[qty] || prices[1])}</span>
              </div>

              {formErr && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>}

              <button type="submit" disabled={sending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-[14px] font-extrabold text-white shadow-xl shadow-teal-200/30 transition hover:shadow-2xl active:scale-[.98] disabled:cursor-wait disabled:opacity-60">
                {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Envoi...</> : '✅ Valider ma commande'}
              </button>
              <p className="text-center text-[10px] text-neutral-400">🔒 Commande securisee · Nous vous appelons pour confirmer</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
