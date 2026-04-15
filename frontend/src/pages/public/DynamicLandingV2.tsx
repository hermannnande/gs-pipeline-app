import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
const pad = (n: number) => String(n).padStart(2, '0');

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

const IMG_PROXY = 'https://wsrv.nl/?';
function optimImg(src: string, w = 800, q = 75): string {
  if (!src || src.startsWith('data:') || src.startsWith('/')) return src;
  if (/\.(gif|mp4|webm)$/i.test(src)) return src;
  return `${IMG_PROXY}url=${encodeURIComponent(src)}&w=${w}&q=${q}&output=webp&il`;
}
function optimImgSrcSet(src: string, sizes: number[] = [400, 800, 1200], q = 75): string {
  if (!src || src.startsWith('data:') || src.startsWith('/')) return '';
  if (/\.(gif|mp4|webm)$/i.test(src)) return '';
  return sizes.map(w => `${optimImg(src, w, q)} ${w}w`).join(', ');
}
function isVideo(src: string) { return /\.(mp4|webm)$/i.test(src); }
function isGif(src: string) { return /\.gif$/i.test(src); }

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
    finalCtaTitle?: string;
    finalCtaSub?: string;
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

function LazySection({ children, className, delay = 0, style }: { children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useOnScreen('80px');
  return (
    <div ref={ref} className={className} style={style}>
      {visible ? <div className="animate-[fadeUp_.5s_ease_both]" style={{ animationDelay: `${delay}ms` }}>{children}</div>
       : <div className="min-h-[100px]"/>}
    </div>
  );
}

const OptimImg = memo(function OptimImg({ src, alt = '', className = '', w = 800, q = 75, eager = false, sizes = '100vw' }: {
  src: string; alt?: string; className?: string; w?: number; q?: number; eager?: boolean; sizes?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const optimSrc = optimImg(src, w, q);
  const srcSet = optimImgSrcSet(src, [400, 800, 1200], q);

  return (
    <img
      ref={imgRef}
      src={optimSrc}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      className={`max-w-full ${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onLoad={() => setLoaded(true)}
    />
  );
});

const Star = memo(({ fill = true }: { fill?: boolean }) => (
  <svg className={`h-4 w-4 ${fill ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
));

const CheckIcon = memo(() => (
  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
));

const XIcon = memo(() => (
  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
));

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
  const pixelFired = useRef(false);

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
    if (!cfg || pixelFired.current) return;
    pixelFired.current = true;
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: cfg.title,
        content_ids: [cfg.productCode],
        content_type: 'product',
        value: cfg.prices?.[1] || 0,
        currency: 'XOF',
      });
    }
  }, [cfg]);

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
    if (META_PIXEL_ID && window.fbq && cfg) {
      const selectedQty = q || 1;
      window.fbq('track', 'AddToCart', {
        content_name: cfg.title,
        content_ids: [cfg.productCode],
        content_type: 'product',
        value: cfg.prices?.[selectedQty] || cfg.prices?.[1] || 0,
        currency: 'XOF',
        num_items: selectedQty,
      });
    }
  }, [cfg]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr('');
    if (!name.trim()) return setFormErr('Entrez votre nom complet.');
    if (!city.trim()) return setFormErr('Entrez votre ville / commune.');
    if (!phone.trim()) return setFormErr('Entrez votre numero de telephone.');
    setSending(true);

    if (META_PIXEL_ID && window.fbq && cfg) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: cfg.title,
        content_ids: [cfg.productCode],
        content_type: 'product',
        value: cfg.prices?.[qty] || cfg.prices?.[1] || 0,
        currency: 'XOF',
        num_items: qty,
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
      });
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

  const c = useMemo(() => {
    const p = cfg?.colors?.primary || '#0d9488';
    const a = cfg?.colors?.accent || '#10b981';
    const hexToRgb = (h: string) => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return `${r},${g},${b}`; };
    return { p, a, bg: cfg?.colors?.bg || '#fafaf9', pRgb: hexToRgb(p), aRgb: hexToRgb(a) };
  }, [cfg?.colors?.primary, cfg?.colors?.accent, cfg?.colors?.bg]);

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
    <div className="min-h-screen overflow-x-hidden text-neutral-900" style={{ fontFamily: "'Inter',system-ui,sans-serif", backgroundColor: c.bg }}>
      <style>{`
        :root{--cp:${c.p};--ca:${c.a};--cp-rgb:${c.pRgb};--ca-rgb:${c.aRgb}}
        *,*::before,*::after{box-sizing:border-box}
        img,video{max-width:100%;height:auto}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-100%)}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(var(--cp-rgb),.3)}50%{box-shadow:0 0 40px rgba(var(--cp-rgb),.6)}}
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
      <div className="sticky top-0 z-50" style={{ background: `linear-gradient(to right, ${c.p}, ${c.a})` }}>
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
              {marqueeTexts.map((t, i) => <span key={i} className="flex items-center gap-10">{t}<span className="ml-10 inline-block h-1 w-1 rounded-full" style={{ backgroundColor: `${c.p}80` }}/></span>)}
            </div>)}
          </div>
        </div>
      )}

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="mx-auto max-w-7xl overflow-hidden px-4 pb-8 pt-6 sm:pb-12 sm:pt-10">
        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="fade-up">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-xl shadow-neutral-200/50" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              {gallery.map((src, i) => (
                isVideo(src) ? (
                  <video key={i} src={src} autoPlay loop muted playsInline className={`absolute inset-0 h-full w-full max-w-full object-cover transition-all duration-700 ease-out ${i === gi ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'}`}/>
                ) : isGif(src) ? (
                  <img key={i} src={src} alt="" className={`absolute inset-0 h-full w-full max-w-full object-cover transition-all duration-700 ease-out ${i === gi ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'}`} loading={i === 0 ? 'eager' : 'lazy'}/>
                ) : (
                  <OptimImg key={i} src={src} alt={i === 0 ? cfg.title : ''} w={1200} q={80} eager={i === 0} sizes="(max-width:768px) 100vw, 50vw" className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${i === gi ? '!opacity-100 scale-100' : '!opacity-0 scale-[1.03]'}`}/>
                )
              ))}
              {cfg.badge && <span className="absolute left-4 top-4 z-10 rounded-full bg-red-500 px-3.5 py-1.5 text-[11px] font-black text-white shadow-lg shadow-red-200/50">{cfg.badge}</span>}
              {cfg.discount && <span className="absolute right-4 top-4 z-10 rounded-full px-3 py-1.5 text-[11px] font-black text-white shadow-lg" style={{ backgroundColor: c.p }}>{cfg.discount}</span>}
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
                      <button key={i} onClick={() => goSlide(i)} className={`h-2.5 rounded-full transition-all duration-300 ${i === gi ? 'w-8 shadow-md' : 'w-2.5 bg-black/20 hover:bg-black/40'}`} style={i === gi ? { backgroundColor: c.p } : undefined}/>
                    ))}
                  </div>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {gallery.map((src, i) => (
                  <button key={i} onClick={() => goSlide(i)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${i === gi ? 'shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`} style={i === gi ? { borderColor: c.p, boxShadow: `0 0 0 2px ${c.p}33` } : undefined}>
                    {isVideo(src) ? <video src={src} muted className="h-full w-full max-w-full object-cover"/> : isGif(src) ? <img src={src} alt="" className="h-full w-full max-w-full object-cover"/> : <OptimImg src={src} w={160} q={60} className="h-full w-full object-cover"/>}
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
                  <span key={i} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider sm:px-3 sm:py-1 sm:text-[10px] ${s.color}`}>{s.text}</span>
                ))}
              </div>
            )}
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[.2em]" style={{ color: c.p }}>{cfg.subtitle}</p>
            <h1 className="text-[20px] font-extrabold leading-tight min-[360px]:text-[24px] sm:text-[32px] lg:text-[36px]">{cfg.title}</h1>

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
                  <OptimImg key={i} src={src} w={112} q={60} className="h-12 w-12 shrink-0 rounded-xl border border-neutral-100 bg-white object-cover shadow-sm sm:h-14 sm:w-14"/>
                ))}
                <span className="shrink-0 text-[11px] font-semibold text-neutral-400">+94 350 clients</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span className="text-2xl font-black text-neutral-900 sm:text-3xl lg:text-4xl">{fmt(prices[1])}</span>
              {cfg.oldPrice && <span className="text-sm text-neutral-400 line-through sm:text-lg">{fmt(cfg.oldPrice)}</span>}
              {cfg.discount && <span className="rounded-lg bg-red-50 px-2 py-0.5 text-[11px] font-black text-red-600 ring-1 ring-red-100 sm:px-2.5 sm:py-1 sm:text-[12px]">{cfg.discount}</span>}
            </div>

            {/* Stock urgency */}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400 transition-all" style={{ width: `${Math.round((stock / 60) * 100)}%` }}/>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-red-600">⚡ Plus que {stock} en stock</span>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-neutral-500 sm:text-[14px]" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{cfg.description}</p>

            {/* Quick benefits */}
            <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              {['Paiement a la livraison', 'Livraison 24h', 'Resultat immediat', 'Support 7j/7'].map(b => (
                <div key={b} className="flex items-center gap-2 rounded-xl border border-neutral-100 bg-white px-2.5 py-2 text-[11px] font-semibold text-neutral-600 shadow-sm sm:px-3 sm:py-2.5 sm:text-[12px]">
                  <CheckIcon/>{b}
                </div>
              ))}
            </div>

            {/* CTA Desktop */}
            <div className="mt-6 hidden lg:block">
              <button onClick={() => open(1)} className="cta-bounce cta-glow group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-8 py-5 text-[16px] font-black text-white shadow-xl transition-all hover:shadow-2xl active:scale-[.98]" style={{ background: `linear-gradient(to right, ${c.p}, ${c.a})` }}>
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
        <div className="border-y border-neutral-100 bg-white py-4 sm:py-6">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 text-center sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-12">
            {cfg.sections.stats.map((s, i) => (
              <div key={i}><p className="text-lg font-black text-neutral-900 sm:text-2xl">{s.n}</p><p className="text-[10px] font-medium text-neutral-400 sm:text-[11px]">{s.l}</p></div>
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
              <h2 className="mt-3 text-xl font-extrabold sm:text-2xl md:text-3xl">{cfg.sections.problemTitle || 'Vous souffrez au quotidien ?'}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cfg.sections.problemPoints.map((p, i) => (
                <div key={i} className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                  {cfg.images.lifestyle?.[i] && (
                    <div className="h-40 overflow-hidden sm:h-48">
                      <OptimImg src={cfg.images.lifestyle[i]} w={600} q={70} sizes="(max-width:640px) 100vw, 33vw" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
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
        <LazySection className="border-y border-neutral-100 py-12 sm:py-16" style={{ background: `linear-gradient(to bottom, ${c.p}08, white)` }}>
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-2 inline-block rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider" style={{ backgroundColor: `${c.p}10`, color: c.p, boxShadow: `0 0 0 1px ${c.p}25` }}>La solution</span>
              <h2 className="mt-3 text-xl font-extrabold sm:text-2xl md:text-3xl">{cfg.sections.solutionTitle || 'La solution approuvee'}</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {cfg.sections.solutionPoints.map((s, i) => (
                <div key={i} className="group flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-lg min-[400px]:flex-row min-[400px]:gap-4 sm:p-5" style={{ borderColor: `${c.p}15` }}>
                  {s.img ? (
                    <OptimImg src={s.img} w={192} q={70} className="h-32 w-full shrink-0 rounded-2xl border border-neutral-100 object-cover shadow-sm min-[400px]:h-20 min-[400px]:w-20 sm:h-24 sm:w-24"/>
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${c.p}10` }}>{s.ico}</span>
                  )}
                  <div className="min-w-0">
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
            <h2 className="mb-6 text-center text-xl font-extrabold sm:mb-8 sm:text-2xl md:text-3xl">Pourquoi nous choisir ?</h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-lg">
              <div className="grid grid-cols-[1fr_70px_70px] border-b border-neutral-100 bg-neutral-50 px-3 py-3 text-center sm:grid-cols-3 sm:px-4">
                <span className="text-left text-[11px] font-bold text-neutral-500 sm:text-center sm:text-[12px]">Caracteristique</span>
                <span className="text-[11px] font-black sm:text-[12px]" style={{ color: c.p }}>Nous</span>
                <span className="text-[11px] font-bold text-neutral-400 sm:text-[12px]">Autres</span>
              </div>
              {cfg.sections.comparisonTable.map((row, i) => (
                <div key={i} className={`grid grid-cols-[1fr_70px_70px] items-center px-3 py-3 text-center sm:grid-cols-3 sm:px-4 sm:py-3.5 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                  <span className="text-left text-[12px] font-semibold text-neutral-700 sm:text-[13px]">{row.feature}</span>
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
            <h2 className="mb-6 text-center text-xl font-extrabold text-white sm:mb-8 sm:text-2xl md:text-3xl">Comment ca marche ?</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cfg.sections.howItWorks.map((s, i) => (
                <div key={i} className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all hover:bg-white/10">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black" style={{ backgroundColor: `${c.p}25`, color: c.p }}>{s.n}</span>
                    {s.ico && <span className="text-2xl">{s.ico}</span>}
                  </div>
                  {s.img && <OptimImg src={s.img} w={400} q={70} className="mb-3 h-32 w-full rounded-xl object-cover"/>}
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
              <h2 className="mt-3 text-xl font-extrabold sm:text-2xl md:text-3xl">Choisissez votre pack</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              {bundles.map((b, i) => (
                <button key={i} onClick={() => open(b.v)} className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-1 hover:shadow-xl sm:p-5 ${b.tag ? 'shadow-lg' : 'border-neutral-200 bg-white shadow-sm hover:border-neutral-300'}`} style={b.tag ? { borderColor: c.p, backgroundColor: `${c.p}08`, boxShadow: `0 0 0 2px ${c.p}20, 0 10px 15px -3px rgba(0,0,0,.1)` } : undefined}>
                  {b.tag && <span className="absolute -right-1 -top-1 rounded-bl-xl rounded-tr-xl px-2.5 py-0.5 text-[9px] font-black text-white shadow-md sm:px-3 sm:py-1 sm:text-[10px]" style={{ backgroundColor: c.p }}>{b.tag}</span>}
                  {b.img && <OptimImg src={b.img} w={400} q={70} className="mb-3 hidden h-28 w-full rounded-xl object-cover sm:block"/>}
                  <p className="text-[15px] font-black sm:text-[17px]">{b.label}</p>
                  <p className="mt-1 text-xl font-black sm:text-2xl" style={{ color: c.p }}>{fmt(b.totalPrice)}</p>
                  {b.save && <p className="mt-1 text-[12px] font-bold text-emerald-600">{b.save}</p>}
                  {b.perDay && <p className="mt-0.5 text-[11px] text-neutral-400">{b.perDay}</p>}
                  <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-[13px] font-bold text-white transition" style={{ '--hover-bg': c.p } as React.CSSProperties} onMouseEnter={e => (e.currentTarget.style.backgroundColor = c.p)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
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
          <button onClick={() => open(1)} className="cta-bounce cta-glow group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-8 py-5 text-[15px] font-black text-white shadow-xl transition-all hover:shadow-2xl active:scale-[.98]" style={{ background: `linear-gradient(to right, ${c.p}, ${c.a})` }}>
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
            <h2 className="mb-6 text-center text-xl font-extrabold sm:mb-8 sm:text-2xl md:text-3xl">Ce que disent nos clients</h2>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide sm:flex-wrap sm:justify-center sm:gap-4 sm:overflow-visible">
            {reviews.map((r, i) => (
              <div key={i} className="w-[78vw] max-w-[320px] shrink-0 snap-center overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:shadow-lg sm:w-[320px] sm:shrink">
                {r.img && (
                  <div className="h-40 overflow-hidden sm:h-48">
                    <OptimImg src={r.img} alt={r.n} w={680} q={70} sizes="(max-width:640px) 85vw, 340px" className="h-full w-full object-cover"/>
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
            <h2 className="mb-6 text-center text-xl font-extrabold sm:mb-8 sm:text-2xl md:text-3xl">Questions frequentes</h2>
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
        <div className="border-t border-neutral-100 bg-white py-8 sm:py-10">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-4 text-center sm:grid-cols-3 md:grid-cols-5 md:gap-8">
            {cfg.sections.trustBadges.map((b, i) => (
              <div key={i}>
                <span className="mb-1.5 inline-block text-2xl sm:text-3xl">{b.ico}</span>
                <p className="text-[11px] font-bold text-neutral-800 sm:text-[12px]">{b.t}</p>
                <p className="text-[10px] text-neutral-400 sm:text-[11px]">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ FINAL CTA ═══════════ */}
      <LazySection className="relative overflow-hidden py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(135deg, #171717, ${c.p}40, #171717)` }}/>
        <div className="relative mx-auto max-w-lg px-4 text-center">
          <h2 className="mb-2 text-xl font-extrabold text-white sm:text-2xl md:text-3xl">{cfg.sections?.finalCtaTitle || 'Commandez maintenant'}</h2>
          <p className="mb-6 text-[14px] text-neutral-400">{cfg.sections?.finalCtaSub || 'Rejoignez nos clients satisfaits'}</p>
          <button onClick={() => open(1)} className="cta-glow group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-8 py-5 text-[16px] font-black text-white shadow-2xl transition-all active:scale-[.98]" style={{ background: `linear-gradient(to right, ${c.p}, ${c.a})`, boxShadow: `0 0 30px ${c.p}40` }}>
            <span className="cta-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"/>
            <span className="relative z-10">Commander — {fmt(prices[1])}</span>
          </button>
          <p className="mt-3 text-[11px] text-neutral-500">Aucun paiement a l'avance · Livraison rapide</p>
        </div>
      </LazySection>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-neutral-100 bg-white pb-20 pt-8 sm:pb-8">
        <p className="text-center text-[10px] text-neutral-300">© 2026 · Tous droits reserves · Cote d'Ivoire</p>
      </footer>

      {/* ═══════════ STICKY BAR ═══════════ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <OptimImg src={cfg.images.hero} w={96} q={60} className="hidden h-10 w-10 shrink-0 rounded-lg border border-neutral-100 object-cover shadow-sm min-[360px]:block sm:h-12 sm:w-12 sm:rounded-xl"/>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold sm:text-[13px]">{cfg.title}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black sm:text-[12px]" style={{ color: c.p }}>{fmt(prices[1])}</span>
              {cfg.oldPrice && <span className="text-[10px] text-neutral-400 line-through sm:text-[11px]">{fmt(cfg.oldPrice)}</span>}
            </div>
          </div>
          <button onClick={() => open(1)} className="shrink-0 rounded-xl px-4 py-2.5 text-[12px] font-black text-white shadow-lg transition hover:shadow-xl active:scale-[.97] sm:px-5 sm:py-3 sm:text-[13px]" style={{ background: `linear-gradient(to right, ${c.p}, ${c.a})`, boxShadow: `0 4px 14px ${c.p}30` }}>Commander</button>
        </div>
      </div>

      {/* ═══════════ TOAST ═══════════ */}
      {toast && (
        <div className={`${toast.visible ? 'toast-in' : 'toast-out'} fixed bottom-[72px] left-3 right-3 z-50 flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur sm:bottom-24 sm:left-3 sm:right-auto sm:max-w-[320px]`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md" style={{ backgroundColor: c.p }}>✓</div>
          <div>
            <p className="text-[12px] font-bold text-neutral-800">{toast.n} vient de commander</p>
            <p className="text-[10px] text-neutral-400">{toast.v} · il y a {toast.t}</p>
          </div>
        </div>
      )}

      {/* ═══════════ EXIT INTENT ═══════════ */}
      {exitPopup && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) setExitPopup(false); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
          <div className="scale-in relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
            <button onClick={() => setExitPopup(false)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition hover:bg-neutral-200">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="px-6 py-8 text-center text-white" style={{ background: `linear-gradient(135deg, ${c.p}, ${c.a})` }}>
              <span className="mb-3 inline-block text-5xl">⚡</span>
              <h3 className="text-xl font-extrabold">Attendez !</h3>
              <p className="mt-2 text-[14px] opacity-80">Profitez de la livraison GRATUITE</p>
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
          <div className="scale-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-[480px] sm:rounded-3xl">
            <button onClick={() => setModal(false)} className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            {/* Header avec produit */}
            <div className="flex items-center gap-4 border-b border-neutral-100 px-5 pb-4 pt-5">
              <OptimImg src={cfg.images.hero} w={120} q={70} className="h-16 w-16 rounded-2xl border border-neutral-100 object-cover shadow-sm"/>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-extrabold text-neutral-900">{cfg.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-black" style={{ color: c.p }}>{fmt(prices[qty] || prices[1])}</span>
                  {cfg.oldPrice && <span className="text-[12px] text-neutral-400 line-through">{fmt(cfg.oldPrice * qty)}</span>}
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Livraison 24h
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-100">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Paiement a la livraison
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="px-5 pb-5 pt-4">
              {/* Etape 1 — Quantite */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ backgroundColor: c.p }}>1</span>
                  <span className="text-[12px] font-bold text-neutral-800">Choisissez votre pack</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {qtyOpts.map(o => (
                    <button key={o.v} type="button" onClick={() => setQty(o.v)} className={`relative flex flex-col items-center rounded-2xl border-2 px-2 py-3 transition-all ${qty === o.v ? 'shadow-md' : 'border-neutral-200 bg-white hover:border-neutral-300'}`} style={qty === o.v ? { borderColor: c.p, backgroundColor: `${c.p}08`, boxShadow: `0 0 0 1px ${c.p}20, 0 4px 6px -1px rgba(0,0,0,.1)` } : undefined}>
                      {o.tag && <span className="absolute -right-1 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white shadow">{o.tag}</span>}
                      <span className="text-xl font-black text-neutral-800">{o.v}</span>
                      <span className="mt-0.5 text-[10px] font-bold text-neutral-500">{o.label}</span>
                      <span className="mt-1 text-[12px] font-black" style={{ color: c.p }}>{o.sub}</span>
                      {o.save && <span className="mt-0.5 text-[9px] font-bold text-emerald-600">{o.save}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Etape 2 — Coordonnees */}
              <div className="mb-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ backgroundColor: c.p }}>2</span>
                  <span className="text-[12px] font-bold text-neutral-800">Vos coordonnees</span>
                </div>
                <div className="space-y-2.5">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold text-neutral-500">Nom complet <span className="text-red-400">*</span></span>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Kouadio Fernand" className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 text-[13px] font-medium outline-none transition placeholder:text-neutral-300 focus:bg-white" onFocus={e => { e.currentTarget.style.borderColor = c.p; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.p}12`; }} onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}/>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold text-neutral-500">Ville / Commune <span className="text-red-400">*</span></span>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Abidjan — Yopougon" className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 text-[13px] font-medium outline-none transition placeholder:text-neutral-300 focus:bg-white" onFocus={e => { e.currentTarget.style.borderColor = c.p; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.p}12`; }} onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}/>
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-neutral-500">Telephone <span className="text-red-400">*</span></span>
                    <div className="flex overflow-hidden rounded-xl border border-neutral-200 transition">
                      <span className="flex items-center gap-1 border-r border-neutral-200 bg-neutral-50 px-3 text-[12px] font-bold text-neutral-500">
                        <span className="text-sm">🇨🇮</span> +225
                      </span>
                      <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07 00 00 00 00" className="h-11 w-full border-none bg-neutral-50/50 px-3 text-[13px] font-medium outline-none placeholder:text-neutral-300 focus:bg-white"/>
                    </div>
                  </label>
                </div>
              </div>

              {/* Recapitulatif */}
              <div className="mb-4 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50/80">
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
                  <span className="text-[12px] text-neutral-500">{qty} x {cfg.title?.split(' ').slice(0, 3).join(' ')}...</span>
                  <span className="text-[12px] font-bold text-neutral-700">{fmt(prices[qty] || prices[1])}</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
                  <span className="text-[12px] text-neutral-500">Livraison</span>
                  <span className="text-[12px] font-bold text-emerald-600">GRATUITE</span>
                </div>
                <div className="flex items-center justify-between bg-neutral-900 px-4 py-3 text-white">
                  <span className="text-[13px] font-bold">Total a payer</span>
                  <span className="text-[18px] font-black">{fmt(prices[qty] || prices[1])}</span>
                </div>
              </div>

              {formErr && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2.5 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>}

              <button type="submit" disabled={sending} className="group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[15px] font-extrabold text-white shadow-xl transition hover:shadow-2xl active:scale-[.98] disabled:cursor-wait disabled:opacity-60" style={{ background: `linear-gradient(to right, ${c.p}, ${c.a})`, boxShadow: `0 10px 25px ${c.p}30` }}>
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"/>
                {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Envoi en cours...</> : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Confirmer ma commande
                  </>
                )}
              </button>
              <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Securise</span>
                <span className="flex items-center gap-1"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>Appel de confirmation</span>
                <span className="flex items-center gap-1"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>Satisfait ou rembourse</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
