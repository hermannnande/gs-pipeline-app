import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

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

interface TYData {
  title: string;
  heroImg: string;
  slug: string;
  productCode: string;
  price: number;
}

export default function DynamicThankYouV2() {
  const { slug } = useParams<{ slug: string }>();
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';

  const [data, setData] = useState<TYData | null>(null);
  const [loading, setLoading] = useState(true);
  const purchaseFired = useRef(false);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API_URL}/templates/public/${slug}`)
      .then(r => {
        const t = r.data.template;
        const cfg = JSON.parse(t.config);
        setData({
          title: cfg.title || t.nom,
          heroImg: cfg.images?.hero || '',
          slug: t.slug,
          productCode: cfg.productCode || '',
          price: cfg.prices?.[1] || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!data || purchaseFired.current) return;
    purchaseFired.current = true;
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'Purchase', {
        content_name: data.title,
        content_ids: [data.productCode],
        content_type: 'product',
        value: data.price,
        currency: 'XOF',
      });
    }
  }, [data]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-teal-600"/>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-4 py-10" style={{ fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes checkBounce{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
        @keyframes confettiUp{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(-70px) rotate(200deg)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .fade-up{animation:fadeUp .6s ease both}
        .check-bounce{animation:checkBounce .5s cubic-bezier(.22,1,.36,1) .3s both}
        .confetti-a{animation:confettiUp 1.3s ease-out .4s both}
        .confetti-b{animation:confettiUp 1.1s ease-out .55s both}
        .confetti-c{animation:confettiUp 1.5s ease-out .35s both}
        .shimmer-text{background:linear-gradient(90deg,#fff 0%,#d4d4d4 50%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}
      `}</style>

      <div className="fade-up w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-neutral-200/50 bg-white shadow-2xl shadow-neutral-200/40">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 px-6 py-12 text-center text-white">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="confetti-a absolute left-[15%] top-5 text-xl">🎉</span>
              <span className="confetti-b absolute right-[20%] top-8 text-lg">✨</span>
              <span className="confetti-c absolute left-[55%] top-4 text-xl">🎊</span>
              <span className="confetti-a absolute right-[40%] top-6 text-base">⭐</span>
            </div>

            {data?.heroImg && (
              <img src={data.heroImg} alt="" className="mx-auto mb-5 h-20 w-20 rounded-2xl border-2 border-white/20 object-cover shadow-xl"/>
            )}

            <div className="check-bounce mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_0_35px_rgba(255,255,255,.4)]">
              <svg className="h-10 w-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            <h1 className="text-[26px] font-extrabold leading-tight">Commande envoyee !</h1>
            <p className="shimmer-text mx-auto mt-2 max-w-xs text-[14px] font-semibold">
              Merci pour votre confiance
            </p>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5 sm:p-6">
            {ref && (
              <div className="rounded-2xl bg-neutral-50 p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Reference</p>
                <p className="mt-1.5 font-mono text-lg font-black tracking-wide text-neutral-900">{ref.slice(0, 12).toUpperCase()}</p>
              </div>
            )}

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-200/50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-teal-900">Nous vous appelons tres vite</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-teal-700/70">Pour confirmer votre commande et planifier la livraison.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200/50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-amber-900">Paiement a la livraison</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-amber-700/70">Vous payez uniquement a la reception du colis. Zero risque.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-200/50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-violet-900">Livraison rapide 24h</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-violet-700/70">Abidjan et environs. Emballe avec soin.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link to={`/landing/${slug}?company=${company}`} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 text-[14px] font-bold text-neutral-700 transition-all hover:border-neutral-300 hover:shadow-lg active:scale-[.98]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Retour au produit
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-neutral-400">Merci pour votre confiance · Support 7j/7</p>
      </div>
    </div>
  );
}
