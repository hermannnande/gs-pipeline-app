import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import { useLandingSlug } from '../../hooks/useLandingSlug';
import OrderModalDispatcher, { isCustomOrderSlug } from '../../components/order/OrderModalDispatcher';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
const pad = (n: number) => String(n).padStart(2, '0');
const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';

declare global { interface Window { fbq: any; _fbq: any; } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); };
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function getCookie(name: string) {
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? v.pop() : '';
}

const THEMES: Record<string, { topBar: string; marquee: string; marqueeTxt: string; dotBg: string; badgeBg: string; badgeTxt: string; subtitleTxt: string; starColor: string; discountBg: string; discountTxt: string; stockBorder: string; stockBg: string; stockTxt: string; btnGrad: string; btnShadow: string; btnHoverShadow: string; ringColor: string; tagBg: string; offerBorder: string; offerActiveBg: string; sectionAccent: string; stepBadgeBg: string; stepBadgeTxt: string; radioActive: string; formFocus: string; formRing: string; badgePill1: string; badgePill2: string; progressBar: string; stockBar: string; topBarAccent: string; countdownBg: string }> = {
  amber: {
    topBar: 'bg-neutral-900', marquee: 'bg-neutral-800', marqueeTxt: 'text-amber-300/80', dotBg: 'bg-amber-400/40',
    badgeBg: 'bg-red-500', badgeTxt: 'text-white', subtitleTxt: 'text-amber-600', starColor: 'text-amber-400',
    discountBg: 'bg-red-50', discountTxt: 'text-red-600', stockBorder: 'border-amber-100', stockBg: 'bg-amber-50', stockTxt: 'text-amber-700',
    btnGrad: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400', btnShadow: 'shadow-[0_8px_32px_rgba(251,191,36,.45)]', btnHoverShadow: 'hover:shadow-[0_12px_40px_rgba(251,191,36,.6)]',
    ringColor: 'ring-amber-200', tagBg: 'bg-amber-500', offerBorder: 'border-amber-400', offerActiveBg: 'bg-amber-50/50',
    sectionAccent: 'text-amber-600', stepBadgeBg: 'bg-amber-50', stepBadgeTxt: 'text-amber-600',
    radioActive: 'border-amber-500 bg-amber-500', formFocus: 'focus-within:border-amber-400', formRing: 'focus-within:shadow-[0_0_0_3px_rgba(251,191,36,.12)]',
    badgePill1: 'border-amber-400/30 bg-amber-400/10 text-amber-300', badgePill2: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    progressBar: 'bg-gradient-to-r from-amber-400 to-amber-500', stockBar: 'bg-gradient-to-r from-red-400 to-amber-400',
    topBarAccent: 'text-amber-300', countdownBg: 'bg-white/10',
  },
  blue: {
    topBar: 'bg-gradient-to-r from-sky-900 to-indigo-900', marquee: 'bg-sky-800', marqueeTxt: 'text-cyan-200/80', dotBg: 'bg-cyan-300/40',
    badgeBg: 'bg-cyan-500', badgeTxt: 'text-white', subtitleTxt: 'text-sky-600', starColor: 'text-cyan-400',
    discountBg: 'bg-sky-50', discountTxt: 'text-sky-700', stockBorder: 'border-sky-100', stockBg: 'bg-sky-50', stockTxt: 'text-sky-700',
    btnGrad: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500', btnShadow: 'shadow-[0_8px_32px_rgba(6,182,212,.4)]', btnHoverShadow: 'hover:shadow-[0_12px_40px_rgba(6,182,212,.55)]',
    ringColor: 'ring-sky-200', tagBg: 'bg-cyan-500', offerBorder: 'border-sky-400', offerActiveBg: 'bg-sky-50/50',
    sectionAccent: 'text-sky-600', stepBadgeBg: 'bg-sky-50', stepBadgeTxt: 'text-sky-700',
    radioActive: 'border-sky-500 bg-sky-500', formFocus: 'focus-within:border-sky-400', formRing: 'focus-within:shadow-[0_0_0_3px_rgba(14,165,233,.12)]',
    badgePill1: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300', badgePill2: 'border-teal-400/30 bg-teal-400/10 text-teal-300',
    progressBar: 'bg-gradient-to-r from-cyan-400 to-sky-500', stockBar: 'bg-gradient-to-r from-sky-400 to-cyan-400',
    topBarAccent: 'text-cyan-300', countdownBg: 'bg-white/10',
  },
  emerald: {
    topBar: 'bg-gradient-to-r from-emerald-900 to-teal-900', marquee: 'bg-emerald-800', marqueeTxt: 'text-emerald-200/80', dotBg: 'bg-emerald-300/40',
    badgeBg: 'bg-emerald-500', badgeTxt: 'text-white', subtitleTxt: 'text-emerald-600', starColor: 'text-emerald-400',
    discountBg: 'bg-emerald-50', discountTxt: 'text-emerald-700', stockBorder: 'border-emerald-100', stockBg: 'bg-emerald-50', stockTxt: 'text-emerald-700',
    btnGrad: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500', btnShadow: 'shadow-[0_8px_32px_rgba(16,185,129,.4)]', btnHoverShadow: 'hover:shadow-[0_12px_40px_rgba(16,185,129,.55)]',
    ringColor: 'ring-emerald-200', tagBg: 'bg-emerald-500', offerBorder: 'border-emerald-400', offerActiveBg: 'bg-emerald-50/50',
    sectionAccent: 'text-emerald-600', stepBadgeBg: 'bg-emerald-50', stepBadgeTxt: 'text-emerald-700',
    radioActive: 'border-emerald-500 bg-emerald-500', formFocus: 'focus-within:border-emerald-400', formRing: 'focus-within:shadow-[0_0_0_3px_rgba(16,185,129,.12)]',
    badgePill1: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', badgePill2: 'border-lime-400/30 bg-lime-400/10 text-lime-300',
    progressBar: 'bg-gradient-to-r from-emerald-400 to-teal-500', stockBar: 'bg-gradient-to-r from-teal-400 to-emerald-400',
    topBarAccent: 'text-emerald-300', countdownBg: 'bg-white/10',
  },
  rose: {
    topBar: 'bg-gradient-to-r from-rose-900 to-pink-900', marquee: 'bg-rose-800', marqueeTxt: 'text-rose-200/80', dotBg: 'bg-rose-300/40',
    badgeBg: 'bg-rose-500', badgeTxt: 'text-white', subtitleTxt: 'text-rose-600', starColor: 'text-rose-400',
    discountBg: 'bg-rose-50', discountTxt: 'text-rose-700', stockBorder: 'border-rose-100', stockBg: 'bg-rose-50', stockTxt: 'text-rose-700',
    btnGrad: 'bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-500', btnShadow: 'shadow-[0_8px_32px_rgba(244,63,94,.4)]', btnHoverShadow: 'hover:shadow-[0_12px_40px_rgba(244,63,94,.55)]',
    ringColor: 'ring-rose-200', tagBg: 'bg-rose-500', offerBorder: 'border-rose-400', offerActiveBg: 'bg-rose-50/50',
    sectionAccent: 'text-rose-600', stepBadgeBg: 'bg-rose-50', stepBadgeTxt: 'text-rose-700',
    radioActive: 'border-rose-500 bg-rose-500', formFocus: 'focus-within:border-rose-400', formRing: 'focus-within:shadow-[0_0_0_3px_rgba(244,63,94,.12)]',
    badgePill1: 'border-rose-400/30 bg-rose-400/10 text-rose-300', badgePill2: 'border-pink-400/30 bg-pink-400/10 text-pink-300',
    progressBar: 'bg-gradient-to-r from-rose-400 to-pink-500', stockBar: 'bg-gradient-to-r from-pink-400 to-rose-400',
    topBarAccent: 'text-rose-300', countdownBg: 'bg-white/10',
  },
};

interface TemplateConfig {
  productCode: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  prices: Record<number, number>;
  oldPrice: number;
  discount: string;
  qtyOptions: { v: number; label: string; sub: string; tag?: string; save?: string }[];
  images: { hero: string; gallery: string[]; usage?: string; banner?: string; avant?: string; apres?: string };
  videos: string[];
  reviews: { init: string; bg: string; n: string; v: string; q: string; s: number }[];
  toasts: { n: string; v: string; t: string }[];
  sections: {
    problem?: string;
    solution?: string;
    marqueeTexts?: string[];
    catchphrase?: { text: string; sub: string };
    howToUse?: { n: string; t: string; d: string; ico: string }[];
    faq?: { q: string; a: string }[];
    trustBadges?: { ico: string; t: string; d: string }[];
    stats?: { n: string; l: string }[];
  };
  colors?: { theme?: string; primary?: string; accent?: string };
  metaPixelId?: string;
  thankYouUrl?: string;
  persuasionBlocks?: {
    title: string;
    subtitle?: string;
    img: string;
    gradientFrom?: string;
    gradientTo?: string;
    ctaLabel?: string;
  }[];
}

interface Product { id: number; code: string; nom: string; prixUnitaire: number }

function useOnScreen(rootMargin = '200px') {
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

function LazyVideo({ src, spinClass }: { src: string; spinClass?: string }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div ref={ref} className="aspect-[9/16] w-full rounded-2xl border border-neutral-100 bg-neutral-100 overflow-hidden shadow-md">
      {visible ? (
        <video src={src} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover"/>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100">
          <div className={`h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 ${spinClass || 'border-t-amber-400'}`}/>
        </div>
      )}
    </div>
  );
}

function LazyImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { ref, visible } = useOnScreen('300px');
  return (
    <div ref={ref}>
      {visible ? <img src={src} alt={alt} className={className} loading="lazy" decoding="async"/>
       : <div className={`bg-neutral-100 animate-pulse ${className}`} style={{ aspectRatio: 'auto' }}/>}
    </div>
  );
}

function LazySection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useOnScreen('100px');
  return (
    <div ref={ref} className={className}>
      {visible ? <div className="animate-[fadeUp_.4s_ease_both]">{children}</div>
       : <div className="flex min-h-[120px] items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-amber-400"/></div>}
    </div>
  );
}

function GlowBtn({ onClick, children, theme }: { onClick: () => void; children: React.ReactNode; theme?: string }) {
  const t = THEMES[theme || 'amber'] || THEMES.amber;
  return (
    <button onClick={onClick} className={`cta-bounce glow-btn group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl ${t.btnGrad} px-6 py-4 text-[15px] font-extrabold text-white ${t.btnShadow} transition-shadow ${t.btnHoverShadow} sm:text-base`}>
      <span className="glow-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"/>
      {children}
    </button>
  );
}

const Star = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

const Check = () => (
  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);

export default function DynamicLanding() {
  const slug = useLandingSlug();
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [cfg, setCfg] = useState<TemplateConfig | null>(null);
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
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);
  const toastIdx = useRef(0);
  const [stock, setStock] = useState(23);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [exitPopup, setExitPopup] = useState(false);
  const exitShown = useRef(false);
  const pixelFired = useRef(false);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API_URL}/templates/public/${slug}`)
      .then(r => {
        const t = r.data.template;
        const parsed = JSON.parse(t.config) as TemplateConfig;
        setCfg(parsed);
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
    if (!cfg || pixelFired.current) return;
    pixelFired.current = true;
    if (slug) trackPageView(slug, company);
    if (cfg.metaPixelId) {
      initMetaPixel(cfg.metaPixelId);
      window.fbq?.('track', 'ViewContent', {
        content_name: cfg.title,
        content_ids: [cfg.productCode],
        content_type: 'product',
        value: cfg.prices?.[1] || 0,
        currency: 'XOF',
      });
    }
  }, [cfg, slug, company]);

  useEffect(() => {
    if (!cfg?.toasts?.length) return;
    const show = () => {
      const t = cfg.toasts[toastIdx.current % cfg.toasts.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 3000);
      setTimeout(() => setToast(null), 3400);
    };
    const first = setTimeout(show, 5000);
    const id = setInterval(show, 18000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [cfg]);

  useEffect(() => {
    const id = setInterval(() => setStock(s => s > 7 ? s - 1 : s), 50000);
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
    // Pour les slugs avec modal custom, c'est la modal qui declenche AddToCart via
    // useOrderSubmit.trackOpen — sinon on aurait un doublon de tracking.
    if (cfg?.metaPixelId && window.fbq && !isCustomOrderSlug(slug)) {
      const selectedQty = q || 1;
      window.fbq('track', 'AddToCart', {
        content_name: cfg.title, content_ids: [cfg.productCode], content_type: 'product',
        value: cfg.prices?.[selectedQty] || cfg.prices?.[1] || 0, currency: 'XOF', num_items: selectedQty,
      });
    }
  }, [cfg, slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr('');
    if (!name.trim()) return setFormErr('Entrez votre nom complet.');
    if (!city.trim()) return setFormErr('Entrez votre ville / commune.');
    if (!phone.trim()) return setFormErr('Entrez votre numero de telephone.');
    setSending(true);

    if (cfg?.metaPixelId && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: cfg.title, content_ids: [cfg.productCode], content_type: 'product',
        value: cfg.prices?.[qty] || cfg.prices?.[1] || 0, currency: 'XOF', num_items: qty,
      });
    }

    try {
      let prod = product;
      if (!prod && cfg) {
        const r = await axios.get(`${API_URL}/public/products`, { params: { company } });
        prod = (r.data?.products || []).find((p: Product) => p.code?.toUpperCase() === cfg.productCode.toUpperCase()) || null;
        if (prod) setProduct(prod);
      }
      if (!prod) { setFormErr('Produit introuvable. Reessayez.'); setSending(false); return; }

      const fbc = getCookie('_fbc');
      const fbp = getCookie('_fbp');
      const res = await axios.post(`${API_URL}/public/order`, {
        company, productId: prod.id, customerName: name.trim(), customerPhone: phone.trim(),
        customerCity: city.trim(), quantity: qty,
        fbc: fbc || undefined, fbp: fbp || undefined, sourceUrl: window.location.href,
        metaPixelId: cfg?.metaPixelId || undefined,
      });
      const ref = res.data?.orderReference || '';
      const thankUrl = cfg?.thankYouUrl || `/landing/${slug}/merci`;
      const p = new URLSearchParams(); p.set('company', company); if (ref) p.set('ref', ref); p.set('qty', String(qty));
      navigate(`${thankUrl}?${p.toString()}`);
    } catch (err: any) { setFormErr(err?.response?.data?.error || 'Erreur. Reessayez.'); }
    finally { setSending(false); }
  };

  const gallery = useMemo(() => cfg ? [cfg.images.hero, ...cfg.images.gallery].filter(Boolean) : [], [cfg]);

  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (gallery.length <= 1) return;
    autoSlideRef.current = setInterval(() => {
      setGi(prev => (prev + 1) % gallery.length);
    }, 4000);
  }, [gallery.length]);

  useEffect(() => {
    if (gallery.length <= 1) return;
    startAutoSlide();
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [gallery.length, startAutoSlide]);

  const goToSlide = useCallback((i: number) => {
    setGi(i);
    startAutoSlide();
  }, [startAutoSlide]);

  const nextSlide = useCallback(() => goToSlide((gi + 1) % (gallery.length || 1)), [gi, gallery.length, goToSlide]);
  const prevSlide = useCallback(() => goToSlide((gi - 1 + (gallery.length || 1)) % (gallery.length || 1)), [gi, gallery.length, goToSlide]);

  const onTouchStart = useCallback((e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
  }, [nextSlide, prevSlide]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-amber-500"/>
    </div>
  );
  if (error || !cfg) return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">{error || 'Page non disponible.'}</div>
    </div>
  );

  const prices = cfg.prices || { 1: 9900 };
  const qtyOpts = cfg.qtyOptions || [{ v: 1, label: '1 boite', sub: fmt(prices[1] || 0) }];
  const stockPct = Math.round((stock / 30) * 100);
  const themeKey = cfg.colors?.theme || 'amber';
  const T = THEMES[themeKey] || THEMES.amber;
  const marqueeTexts = cfg.sections?.marqueeTexts || ['Livraison 24h Abidjan', 'Paiement a la livraison', 'Resultat visible', 'Support 7j/7'];

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideOutLeft{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-100%)}}
        .fade-up{animation:fadeUp .5s ease both}
        .marquee-track{animation:marquee 22s linear infinite}
        .toast-in{animation:slideInLeft .4s cubic-bezier(.22,1,.36,1) both}
        .toast-out{animation:slideOutLeft .35s cubic-bezier(.55,.08,.68,.53) both}
        details[open] summary .chevron{transform:rotate(180deg)}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes bounce-soft{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes sheen{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        .glow-btn{animation:bounce-soft 2.5s ease-in-out infinite}
        .glow-btn:hover{animation:none}
        .glow-sheen{animation:sheen 3s ease-in-out infinite}
      `}</style>

      {/* STICKY TOP BAR */}
      <div className={`sticky top-0 z-50 flex items-center justify-center gap-2 ${T.topBar} px-3 py-2 sm:gap-3`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${T.topBarAccent} sm:text-[11px]`}>Offre du jour</span>
        <div className="flex items-center gap-1">
          {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className={`text-[10px] font-bold ${T.topBarAccent} opacity-60`}>:</span>}
              <span className={`inline-flex h-6 min-w-[26px] items-center justify-center rounded ${T.countdownBg} px-1 font-mono text-[12px] font-black tabular-nums text-white sm:h-7 sm:min-w-[30px] sm:text-[13px]`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MARQUEE */}
      <div className={`overflow-hidden ${T.marquee} py-1.5`}>
        <div className={`marquee-track flex w-[200%] items-center gap-8 text-[9px] font-bold uppercase tracking-[.18em] ${T.marqueeTxt} sm:text-[10px]`}>
          {[0,1].map(k=><div key={k} className="flex shrink-0 items-center gap-8">
            {marqueeTexts.map((txt, mi) => <span key={mi}>{txt}<span className={`ml-8 inline-block h-1 w-1 rounded-full ${T.dotBg}`}/></span>)}
          </div>)}
        </div>
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-5 sm:pb-10 sm:pt-8 md:pt-12">
        <div className="grid items-start gap-6 md:grid-cols-2 md:gap-10">
          <div className="fade-up">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 sm:rounded-3xl" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <div className="relative h-full w-full">
                {gallery.map((src, i) => (
                  <img key={i} src={src} alt={i === 0 ? cfg.title : ''} className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-in-out ${i === gi ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} fetchPriority={i === 0 ? 'high' : 'low'} width={800} height={800} decoding="async" loading={i === 0 ? 'eager' : 'lazy'}/>
                ))}
              </div>
              <span className={`absolute left-3 top-3 z-10 rounded-full ${T.badgeBg} px-2.5 py-1 text-[10px] font-bold ${T.badgeTxt} shadow-lg sm:left-4 sm:top-4 sm:text-xs`}>{cfg.badge || 'BEST-SELLER'}</span>
              {gallery.length > 1 && (
                <>
                  <button onClick={prevSlide} className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-110 active:scale-95 sm:h-9 sm:w-9" aria-label="Precedent">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button onClick={nextSlide} className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-110 active:scale-95 sm:h-9 sm:w-9" aria-label="Suivant">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => goToSlide(i)} className={`h-2 rounded-full transition-all duration-300 ${i === gi ? `w-6 bg-white shadow-md` : 'w-2 bg-white/50 hover:bg-white/70'}`} aria-label={`Image ${i + 1}`}/>
                    ))}
                  </div>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-2.5 flex gap-2 sm:mt-3">
                {gallery.map((src, i) => (
                  <button key={i} onClick={() => goToSlide(i)} className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition-all sm:h-[72px] sm:w-[72px] sm:rounded-xl ${i === gi ? `border-current ring-2 ${T.ringColor}` : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={src} alt="" className="h-full w-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="fade-up space-y-4 sm:space-y-5" style={{ animationDelay: '.1s' }}>
            <div>
              <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-widest ${T.subtitleTxt} sm:text-xs`}>{cfg.subtitle}</p>
              <h1 className="text-[22px] font-extrabold leading-[1.2] sm:text-3xl md:text-[2.2rem]">{cfg.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex gap-0.5 ${T.starColor}`}>{[...Array(5)].map((_,i)=><Star key={i}/>)}</div>
              <span className="text-xs font-semibold text-neutral-600">4.8</span>
              <span className="text-xs text-neutral-400">(1 247 avis)</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-black sm:text-3xl">{fmt(prices[1] || 0)}</span>
              {cfg.oldPrice && <span className="text-sm text-neutral-400 line-through">{fmt(cfg.oldPrice)}</span>}
              {cfg.discount && <span className={`rounded-md ${T.discountBg} px-2 py-0.5 text-[11px] font-bold ${T.discountTxt}`}>{cfg.discount}</span>}
            </div>
            <div className={`flex items-center gap-1.5 self-start rounded-lg border ${T.stockBorder} ${T.stockBg} px-2.5 py-1.5`}>
              <span className="text-xs">📦</span>
              <span className={`text-[12px] font-bold ${T.stockTxt}`}>Plus que {stock} en stock</span>
            </div>
            <p className="text-[13px] leading-relaxed text-neutral-500 sm:text-sm">{cfg.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-neutral-600 sm:text-[13px]">
              <span className="flex items-center gap-1.5"><Check/> Paiement a la livraison</span>
              <span className="flex items-center gap-1.5"><Check/> Livraison rapide</span>
              <span className="flex items-center gap-1.5"><Check/> Support 7j/7</span>
            </div>
            <div className="hidden sm:block">
              <GlowBtn onClick={() => open()} theme={themeKey}>
                <span className="relative z-10 flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-40"/><span className="relative inline-flex h-2 w-2 rounded-full bg-white"/></span>
                  Commander maintenant — {fmt(prices[1] || 0)}
                </span>
              </GlowBtn>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      {cfg.sections?.stats && (
        <div className="border-y border-neutral-100 bg-white py-5">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-4 text-center sm:gap-10">
            {cfg.sections.stats.map((s, i) => (
              <div key={i}><p className="text-lg font-black sm:text-xl">{s.n}</p><p className="text-[10px] text-neutral-400 sm:text-[11px]">{s.l}</p></div>
            ))}
          </div>
        </div>
      )}

      {/* PERSUASION BLOCKS — texte degradee + image avec arriere-plan premium */}
      {cfg.persuasionBlocks && cfg.persuasionBlocks.length > 0 && (
        <section className="relative overflow-hidden py-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50"/>
          <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-red-200/30 blur-3xl"/>
          <div className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"/>

          <div className="relative mx-auto max-w-5xl px-4">
            <div className="mb-8 text-center sm:mb-12">
              <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-red-100 to-orange-100 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-red-800 ring-1 ring-red-200/50">
                Soulagement garanti
              </span>
              <h2 className="mt-3 text-xl font-extrabold sm:text-2xl md:text-3xl">
                <span className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Reprenez votre vie en main
                </span>
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-[13px] text-neutral-500 sm:text-[14px]">
                Des milliers de personnes ont retrouve leur liberte de mouvement. Pourquoi pas vous ?
              </p>
            </div>

            <div className="space-y-10 sm:space-y-14">
              {cfg.persuasionBlocks.map((b, i) => {
                const gradients = [
                  { from: 'from-red-600',    to: 'to-orange-600' },
                  { from: 'from-orange-600', to: 'to-amber-600'  },
                  { from: 'from-rose-600',   to: 'to-red-600'    },
                ];
                const g = gradients[i % gradients.length];
                const fromCls = b.gradientFrom || g.from;
                const toCls = b.gradientTo || g.to;

                return (
                  <div key={i} className="group">
                    {/* Texte au-dessus de l'image */}
                    <div className="mb-4 text-center sm:mb-6">
                      <h3 className={`text-2xl font-black leading-tight sm:text-3xl md:text-4xl bg-gradient-to-r ${fromCls} ${toCls} bg-clip-text text-transparent`}>
                        {b.title}
                      </h3>
                      {b.subtitle && (
                        <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-relaxed text-neutral-600 sm:text-[15px]">
                          {b.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Image avec arriere-plan premium */}
                    <div className="relative">
                      <div className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${fromCls} ${toCls} opacity-20 blur-xl transition-opacity duration-500 group-hover:opacity-30`}/>
                      <div className="relative overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-neutral-200/50 sm:rounded-3xl sm:p-2">
                        <div className="overflow-hidden rounded-xl sm:rounded-2xl">
                          <img
                            src={b.img}
                            alt={b.title}
                            loading="lazy"
                            className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CTA inline (optionnel) */}
                    {b.ctaLabel && (
                      <div className="mt-5 text-center sm:mt-7">
                        <button
                          type="button"
                          onClick={() => open()}
                          className={`cta-attract relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r ${fromCls} ${toCls} px-7 py-3 text-[13px] font-extrabold text-white shadow-lg transition-shadow hover:shadow-2xl sm:px-9 sm:py-3.5 sm:text-[15px]`}
                        >
                          <span>{b.ctaLabel}</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* BANNER */}
      {cfg.images.banner && (
        <div className="relative overflow-hidden py-6 sm:py-8">
          <div className="relative mx-auto max-w-3xl px-4">
            <img src={cfg.images.banner} alt="" className="w-full rounded-t-2xl border border-b-0 border-neutral-100 object-cover shadow-xl" loading="lazy"/>
            <div className="rounded-b-2xl border border-t-0 border-neutral-100 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-5 py-6 text-center shadow-xl sm:px-8 sm:py-8">
              {cfg.sections?.catchphrase && (
                <div className="mb-5">
                  <p className="text-base font-extrabold text-white sm:text-lg">{cfg.sections.catchphrase.text}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">{cfg.sections.catchphrase.sub}</p>
                </div>
              )}
              <GlowBtn onClick={() => open()} theme={themeKey}>
                <span className="relative z-10 flex items-center gap-2">Commander maintenant — {fmt(prices[1] || 0)}</span>
              </GlowBtn>
            </div>
          </div>
        </div>
      )}

      {/* PACK OFFERS */}
      {qtyOpts.length > 1 && (
        <LazySection className="relative overflow-hidden py-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/60"/>
          <div className="relative mx-auto max-w-3xl px-4">
            <p className={`mb-1 text-center text-[11px] font-semibold uppercase tracking-widest ${T.sectionAccent}`}>Offres speciales</p>
            <h2 className="mb-6 text-center text-xl font-extrabold sm:text-2xl">Choisissez votre offre</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {qtyOpts.map(o => (
                <button key={o.v} onClick={() => open(o.v)}
                  className={`relative rounded-2xl border-2 px-4 py-4 text-center transition-all hover:shadow-lg sm:p-5 ${o.v === 2 ? `${T.offerBorder} ${T.offerActiveBg} shadow-md ring-2 ${T.ringColor}` : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                  {o.tag && <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full ${T.tagBg} px-3 py-0.5 text-[10px] font-bold text-white shadow`}>{o.tag}</span>}
                  <p className="text-[15px] font-black sm:text-lg">{o.label}</p>
                  <p className="text-[17px] font-black text-neutral-900 sm:text-xl">{o.sub}</p>
                  {o.save && <p className="text-[10px] font-bold text-emerald-600">{o.save}</p>}
                </button>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* VIDEOS */}
      {cfg.videos?.length > 0 && (
        <LazySection className="relative overflow-hidden border-y border-neutral-100 py-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900"/>
          <div className="relative mx-auto max-w-6xl px-4">
            <p className={`mb-1 text-center text-[11px] font-semibold uppercase tracking-widest ${T.topBarAccent}`}>Preuves en video</p>
            <h2 className="mb-5 text-center text-xl font-extrabold text-white sm:text-2xl">Voyez les resultats</h2>
          </div>
          <div className="relative mx-auto grid max-w-4xl grid-cols-3 gap-2 px-4 sm:gap-4">
            {cfg.videos.map((v, i) => <div key={i}><LazyVideo src={v}/></div>)}
          </div>
        </LazySection>
      )}

      {/* AVANT/APRES */}
      {cfg.images.avant && cfg.images.apres && (
        <LazySection className="py-10 sm:py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-7 text-center text-xl font-extrabold sm:text-2xl">Avant et apres utilisation</h2>
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-5">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md">
                <div className="relative">
                  <LazyImg src={cfg.images.avant} alt="Avant" className="aspect-[3/4] w-full object-cover"/>
                  <span className="absolute bottom-3 left-3 rounded-full bg-red-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-lg">AVANT</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md">
                <div className="relative">
                  <LazyImg src={cfg.images.apres} alt="Apres" className="aspect-[3/4] w-full object-cover"/>
                  <span className="absolute bottom-3 left-3 rounded-full bg-emerald-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-lg">APRES</span>
                </div>
              </div>
            </div>
          </div>
        </LazySection>
      )}

      {/* HOW TO USE */}
      {cfg.sections?.howToUse && (
        <LazySection className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-7 text-center text-xl font-extrabold sm:text-2xl">Simple a utiliser</h2>
            {cfg.images.usage && <LazyImg src={cfg.images.usage} alt="Utilisation" className="mx-auto mb-8 w-full max-w-xl rounded-2xl border border-neutral-200 object-cover shadow-lg"/>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cfg.sections.howToUse.map(s => (
                <div key={s.n} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-2.5 flex items-center gap-2"><span className="text-lg">{s.ico}</span><span className={`rounded-md ${T.stepBadgeBg} px-2 py-0.5 text-[10px] font-black ${T.stepBadgeTxt}`}>ETAPE {s.n}</span></div>
                  <h3 className="mb-1 text-sm font-bold">{s.t}</h3>
                  <p className="text-xs leading-relaxed text-neutral-400">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* MID CTA */}
      <LazySection className="relative overflow-hidden py-8 sm:py-10">
        <div className="relative mx-auto max-w-lg px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-2.5 flex-1 rounded-full bg-neutral-100"><div className={`h-full rounded-full ${T.stockBar} transition-all`} style={{ width: `${stockPct}%` }}/></div>
            <span className="shrink-0 text-[11px] font-bold text-red-500">Plus que {stock} unites</span>
          </div>
          <GlowBtn onClick={() => open()} theme={themeKey}>
            <span className="relative z-10">Je commande maintenant</span>
          </GlowBtn>
        </div>
      </LazySection>

      {/* REVIEWS */}
      {cfg.reviews?.length > 0 && (
        <LazySection className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-6 text-center text-xl font-extrabold sm:text-2xl">Avis clients</h2>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide sm:justify-center sm:gap-4 sm:overflow-visible">
            {cfg.reviews.map((t, i) => (
              <div key={i} className="w-[75vw] max-w-[300px] shrink-0 snap-center rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:w-[300px] sm:max-w-none sm:p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.bg} text-[11px] font-bold text-white shadow-md`}>{t.init}</div>
                  <div><p className="text-[13px] font-bold">{t.n}</p><p className="text-[10px] text-neutral-400">{t.v}</p></div>
                </div>
                <div className={`mb-2 flex gap-0.5 ${T.starColor}`}>{[...Array(t.s)].map((_,j)=><Star key={j}/>)}</div>
                <p className="text-[12px] leading-relaxed text-neutral-600">"{t.q}"</p>
              </div>
            ))}
          </div>
        </LazySection>
      )}

      {/* FAQ */}
      {cfg.sections?.faq && (
        <LazySection className="border-y border-neutral-100 bg-neutral-50 py-10 sm:py-14">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="mb-7 text-center text-xl font-extrabold sm:text-2xl">Questions frequentes</h2>
            <div className="space-y-2">
              {cfg.sections.faq.map((f, i) => (
                <details key={i} className="group rounded-xl border border-neutral-200 bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-[13px] font-bold sm:text-sm">{f.q}
                    <svg className="chevron h-4 w-4 shrink-0 text-neutral-300 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </summary>
                  <p className="px-4 pb-4 text-[13px] leading-relaxed text-neutral-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* FINAL CTA */}
      <LazySection className="relative overflow-hidden py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"/>
        <div className="relative mx-auto max-w-lg px-4 text-center">
          <h2 className="mb-6 text-xl font-extrabold text-white sm:text-2xl">Commandez maintenant</h2>
          <GlowBtn onClick={() => open()} theme={themeKey}>
            <span className="relative z-10">Commander ici — {fmt(prices[1] || 0)}</span>
          </GlowBtn>
          <p className="mt-3 text-[11px] text-neutral-500">Aucun compte requis · Paiement a la livraison</p>
        </div>
      </LazySection>

      {/* FOOTER */}
      <footer className="border-t border-neutral-100 bg-white pb-24 pt-6 sm:pb-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            {(cfg.sections?.trustBadges || [
              { ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },
              { ico: '💰', t: 'Paiement livraison', d: 'Aucun risque' },
              { ico: '📞', t: 'Support client', d: '7j/7' },
            ]).map((f, i) => (
              <div key={i} className="w-[140px]"><span className="text-xl">{f.ico}</span><p className="mt-1 text-[11px] font-bold text-neutral-700">{f.t}</p><p className="text-[10px] text-neutral-400">{f.d}</p></div>
            ))}
          </div>
          <p className="mt-6 text-center text-[10px] text-neutral-300">© 2026 · Cote d'Ivoire</p>
        </div>
      </footer>

      {/* STICKY BAR */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:py-3">
          <img src={cfg.images.hero} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-neutral-100 object-cover sm:h-12 sm:w-12"/>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold sm:text-sm">{cfg.title}</p>
            <p className="text-[11px] text-neutral-400">{fmt(prices[1] || 0)} · Paiement a la livraison</p>
          </div>
          <button onClick={() => open()} className={`shrink-0 rounded-xl ${T.btnGrad} px-4 py-2.5 text-[13px] font-extrabold text-white ${T.btnShadow} transition ${T.btnHoverShadow} active:scale-[.97] sm:px-6 sm:text-sm`}>Commander</button>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className={`${toast.visible ? 'toast-in' : 'toast-out'} fixed bottom-20 left-3 z-50 flex max-w-[300px] items-center gap-2.5 rounded-xl border border-neutral-100 bg-white/95 px-3.5 py-3 shadow-2xl backdrop-blur`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm text-white">✓</div>
          <div>
            <p className="text-[12px] font-bold text-neutral-800">{toast.n} vient de commander</p>
            <p className="text-[10px] text-neutral-400">il y a {toast.t}</p>
          </div>
        </div>
      )}

      {/* EXIT INTENT */}
      {exitPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setExitPopup(false); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <button onClick={() => setExitPopup(false)} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 hover:bg-neutral-200">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <span className="mb-3 inline-block text-4xl">⚡</span>
            <h3 className="mb-1 text-lg font-extrabold">Attendez !</h3>
            <p className="mb-4 text-[13px] text-neutral-500">Ne partez pas sans commander. Payez a la livraison.</p>
            <button onClick={() => open()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 active:scale-[.98]">Commander maintenant</button>
          </div>
        </div>
      )}

      {/* MODAL CUSTOM par produit (design unique via dispatcher) */}
      {modal && cfg && slug && isCustomOrderSlug(slug) && (
        <OrderModalDispatcher
          slug={slug}
          open={modal}
          onClose={() => setModal(false)}
          cfg={{
            slug,
            productCode: cfg.productCode,
            title: cfg.title,
            prices,
            metaPixelId: cfg.metaPixelId,
            thankYouUrl: cfg.thankYouUrl,
            images: cfg.images,
          }}
          product={product}
          setProduct={(p) => setProduct(p as Product | null)}
          qtyOptions={qtyOpts}
          initialQty={qty}
        />
      )}

      {/* MODAL FORM (design generique - fallback pour tout autre slug eventuel) */}
      {modal && !isCustomOrderSlug(slug) && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
          <div className="relative flex max-h-[100dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-[400px] sm:rounded-2xl">
            <button onClick={() => setModal(false)} className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="bg-neutral-900 px-4 pb-2 pt-3 text-white sm:px-5 sm:pb-4 sm:pt-5">
              <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:mb-2">
                <span className={`inline-flex rounded-full border ${T.badgePill1} px-2 py-0.5 text-[8px] font-bold sm:text-[9px]`}>Livraison 24h</span>
                <span className={`inline-flex rounded-full border ${T.badgePill2} px-2 py-0.5 text-[8px] font-bold sm:text-[9px]`}>Paiement a la livraison</span>
              </div>
              <h3 className="text-sm font-extrabold sm:text-lg">Finaliser votre commande</h3>
            </div>
            <div className="h-0.5 bg-neutral-100 sm:h-1"><div className={`h-full w-4/5 ${T.progressBar}`}/></div>
            <form onSubmit={submit} className="flex-1 space-y-1.5 overflow-y-auto p-3 pb-3 sm:space-y-3 sm:p-4 sm:pb-5">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-1 sm:gap-3">
                {[
                  { icon: '👤', label: 'Nom complet', val: name, set: setName, ph: 'Kouadio Fernand', type: 'text' as const },
                  { icon: '📍', label: 'Ville / Commune', val: city, set: setCity, ph: 'Abidjan — Yopougon', type: 'text' as const },
                ].map(f => (
                  <label key={f.label} className="block">
                    <span className="mb-0.5 block text-[10px] font-bold text-neutral-700 sm:text-[11px]">{f.label} <span className="text-red-500">*</span></span>
                    <div className={`flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 transition-colors sm:gap-2 sm:rounded-xl sm:px-3 ${T.formFocus} focus-within:bg-white ${T.formRing}`}>
                      <span className="text-xs sm:text-sm">{f.icon}</span>
                      <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="h-9 w-full border-none bg-transparent text-[12px] font-medium outline-none placeholder:text-neutral-300 sm:h-11 sm:text-[13px]"/>
                    </div>
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="mb-0.5 block text-[10px] font-bold text-neutral-700 sm:text-[11px]">Telephone <span className="text-red-500">*</span></span>
                <div className={`flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 transition-colors sm:gap-2 sm:rounded-xl sm:px-3 ${T.formFocus} focus-within:bg-white ${T.formRing}`}>
                  <span className="text-xs sm:text-sm">📱</span>
                  <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07 00 00 00 00" className="h-9 w-full border-none bg-transparent text-[12px] font-medium outline-none placeholder:text-neutral-300 sm:h-11 sm:text-[13px]"/>
                </div>
              </label>
              <div>
                <span className="mb-1 block text-[10px] font-bold text-neutral-700 sm:text-[11px]">Quantite</span>
                <div className="grid gap-1 sm:gap-1.5">
                  {qtyOpts.map(o => (
                    <button key={o.v} type="button" onClick={() => setQty(o.v)} className={`relative flex items-center justify-between rounded-lg border-2 px-2.5 py-1.5 text-left transition-all sm:rounded-xl sm:px-3 sm:py-2 ${qty === o.v ? `${T.offerBorder} ${T.offerActiveBg} shadow-sm` : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 sm:h-4 sm:w-4 ${qty === o.v ? T.radioActive : 'border-neutral-300'}`}>{qty === o.v && <div className="h-1 w-1 rounded-full bg-white sm:h-1.5 sm:w-1.5"/>}</div>
                        <span className="text-[11px] font-bold sm:text-[12px]">{o.label}</span>
                      </div>
                      <span className="text-[11px] font-extrabold sm:text-[12px]">{o.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-neutral-900 px-3 py-2 text-white sm:rounded-xl sm:py-2.5">
                <span className="text-[11px] font-semibold sm:text-[12px]">Total <span className="text-emerald-400">(livraison gratuite)</span></span>
                <span className="text-[14px] font-black sm:text-[15px]">{fmt(prices[qty] || prices[1] || 0)}</span>
              </div>
              {formErr && <p className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-semibold text-red-600 sm:py-2 sm:text-[11px]">{formErr}</p>}
              <button type="submit" disabled={sending} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-[13px] font-extrabold text-white shadow-[0_12px_30px_rgba(16,185,129,.3)] hover:bg-emerald-500 active:scale-[.98] disabled:cursor-wait disabled:opacity-70 sm:h-11 sm:rounded-xl">
                {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Envoi...</> : 'Valider ma commande'}
              </button>
              <p className="text-center text-[8px] text-neutral-400 sm:text-[9px]">Nous vous appelons pour confirmer.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
