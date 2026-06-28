/**
 * Tunnel ultra-premium — Chaussettes de Compression (CHAUSSETTE_COMPRESSION_LONG)
 * Slug: chaussette-compression
 *
 * Disposition UNIQUE : 1 bloc = texte court AU-DESSUS + 1 media + CTA fluide EN-DESSOUS.
 * Palette INDIGO + EMERAUDE + VIOLET (distinct du teal V2, noir/or homme, navy serum).
 * 15 images + 1 video — aucune repetition.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackPageView } from '../../utils/pageTracking';
import OrderModalDispatcher from '../../components/order/OrderModalDispatcher';
import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SLUG = 'chaussette-compression';
const PRODUCT_CODE = 'CHAUSSETTE_COMPRESSION_LONG';
const META_PIXEL_ID = '952340034030644';
const THANK_YOU_URL = '/landing/chaussette-compression/merci';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
const OLD_PRICE = 15000;
const QTY_OPTS = [
  { v: 1, label: '1 paire', sub: packLabel(PRICES, 1, 'FCFA') },
  { v: 2, label: '2 paires', sub: packLabel(PRICES, 2, 'FCFA'), tag: 'Populaire', save: 'Economisez 4 900 F' },
  { v: 3, label: '3 paires', sub: packLabel(PRICES, 3, 'FCFA'), tag: 'Meilleure offre', save: 'Economisez 9 800 F' },
];

const M = (n: string) => `/chaussette-compression/${n}`;

declare global { interface Window { fbq: any; _fbq: any } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

interface Product { id: number; code: string; nom: string; prixUnitaire: number }

const co = () => new URLSearchParams(window.location.search).get('company') || 'ci';
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';

function useOnScreen(rootMargin = '280px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function LazyImg({ src, alt, aspect, priority, className = '' }: {
  src: string; alt: string; aspect?: string; priority?: boolean; className?: string;
}) {
  const { ref, visible } = useOnScreen('260px');
  const img = (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className="h-full w-full object-cover"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );
  if (priority) {
    return (
      <div className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
        {img}
      </div>
    );
  }
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      {visible ? img : <div className="h-full min-h-[240px] w-full animate-pulse bg-indigo-100" />}
    </div>
  );
}

function LazyVideo({ src, aspect = '9/16' }: { src: string; aspect?: string }) {
  const { ref, visible } = useOnScreen('280px');
  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-[1.75rem] bg-indigo-950 shadow-[0_24px_60px_-16px_rgba(49,46,129,.55)] ring-2 ring-violet-400/30"
      style={{ aspectRatio: aspect }}
    >
      {visible ? (
        <video src={src} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-indigo-950">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-400/30 border-t-emerald-400" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-indigo-950/80 to-transparent" />
    </div>
  );
}

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const Star = () => (
  <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

function Grad({ children, variant = 'emerald' }: { children: ReactNode; variant?: 'emerald' | 'violet' | 'rose' | 'gold' }) {
  const cls = {
    emerald: 'from-emerald-400 via-teal-300 to-emerald-500',
    violet: 'from-violet-400 via-purple-300 to-indigo-400',
    rose: 'from-rose-400 via-pink-300 to-fuchsia-400',
    gold: 'from-amber-300 via-yellow-200 to-amber-400',
  }[variant];
  return (
    <span className={`bg-gradient-to-r ${cls} bg-clip-text font-black text-transparent`}>{children}</span>
  );
}

function FluidCTA({ onClick, children, variant = 'emerald', size = 'md' }: {
  onClick: () => void; children: ReactNode; variant?: 'emerald' | 'violet' | 'dark'; size?: 'md' | 'sm';
}) {
  const grad = {
    emerald: 'ccc-cta-grad-emerald',
    violet: 'ccc-cta-grad-violet',
    dark: 'ccc-cta-grad-dark',
  }[variant];
  const glow = {
    emerald: 'ccc-cta-glow-emerald',
    violet: 'ccc-cta-glow-violet',
    dark: 'ccc-cta-glow-dark',
  }[variant];
  const textCls = variant === 'dark' ? 'text-emerald-200' : 'text-white';
  const py = size === 'sm' ? 'py-3 px-5 text-[12px]' : 'py-4 px-6 text-[13px] sm:text-[14px]';

  return (
    <div className="relative">
      <span className={`ccc-cta-aura pointer-events-none absolute -inset-1 rounded-[1.35rem] opacity-80 blur-md ${glow}`} aria-hidden />
      <button
        type="button"
        onClick={onClick}
        className={`ccc-bounce group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl ${grad} ${py} font-black uppercase tracking-[0.16em] ring-2 ring-white/25 transition hover:scale-[1.03] active:scale-[0.98]`}
      >
        <span className="ccc-sheen pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        <span className="ccc-sheen-slow pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-200/0 via-violet-200/30 to-emerald-200/0" />
        <span className={`relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,.25)] ${textCls}`}>{children}</span>
      </button>
    </div>
  );
}

type MarqueeVariant = 'emerald' | 'violet' | 'rainbow' | 'dark';

function GradientMarquee({ items, variant = 'emerald', reverse = false, speed = 28 }: {
  items: string[]; variant?: MarqueeVariant; reverse?: boolean; speed?: number;
}) {
  const bg = {
    emerald: 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600',
    violet: 'bg-gradient-to-r from-violet-700 via-indigo-600 to-violet-700',
    rainbow: 'bg-gradient-to-r from-emerald-500 via-violet-500 via-rose-400 to-emerald-500 bg-[length:200%_100%] ccc-marquee-bg',
    dark: 'bg-gradient-to-r from-indigo-950 via-violet-950 to-indigo-950',
  }[variant];
  const textCls = variant === 'dark'
    ? 'ccc-marquee-text-dark'
    : 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.2)]';

  return (
    <div className={`relative overflow-hidden border-y border-white/10 py-3 ${bg}`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.12)_50%,transparent)] opacity-60" />
      <div
        className={`ccc-marquee flex w-[200%] items-center gap-10 text-[10px] font-black uppercase tracking-[0.28em] sm:text-[11px] ${reverse ? 'ccc-marquee-rev' : ''} ${textCls}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-10">
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-3 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,.8)]" />
                {t}
                <span className="text-[14px] opacity-70">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const WA_REVIEWS = [
  { n: 'Aminata K.', v: 'Cocody', m: 'Mes pieds ne gonflent plus le soir 😍 Livraison en 24h !', t: '14:22', stars: 5, verified: true },
  { n: 'Mariam D.', v: 'Yopougon', m: 'Ma varicose me faisait mal depuis 2 ans. Là c\'est un autre monde ✨', t: '09:41', stars: 5, verified: true },
  { n: 'Fatou S.', v: 'Marcory', m: 'Infirmière 12h debout — mes jambes tiennent enfin 💪 Je recommande à mes collègues.', t: 'hier', stars: 5, verified: true },
  { n: 'Kouassi B.', v: 'Bouaké', m: 'Mon père diabétique marche mieux. Merci beaucoup 🙏', t: 'hier', stars: 5, verified: true },
  { n: 'Sarah T.', v: 'Plateau', m: 'Compression ferme mais confortable. Plus de crampes la nuit ⭐⭐⭐⭐⭐', t: 'lundi', stars: 5, verified: true },
  { n: 'Clara M.', v: 'Treichville', m: 'J\'étais sceptique. Dès le 1er jour j\'ai senti la différence 🔥', t: 'dimanche', stars: 5, verified: true },
];

const SMS_REVIEWS = [
  { from: '+225 07 •• •• 83', msg: 'Colis reçu ✅ Confort immédiat. Je commande 2 paires de plus.', time: '10:15', carrier: 'MTN CI' },
  { from: 'Orange CI', msg: 'Votre commande chaussettes compression est en route. Livraison demain avant 18h.', time: '08:02', carrier: 'Info livraison' },
  { from: '+225 05 •• •• 19', msg: 'Plus de gonflement aux chevilles le soir. Merci GS 🙏', time: 'hier', carrier: 'Moov Africa' },
  { from: '+225 01 •• •• 56', msg: 'Qualité pharmacie à moitié prix. Ma mère en veut aussi.', time: 'hier', carrier: 'MTN CI' },
];

const AVATAR_COLORS = [
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-indigo-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-600',
  'from-fuchsia-400 to-purple-600',
];

function StarRow({ n = 5, size = 'sm' }: { n?: number; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className={`${sz} text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,.6)]`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function WhatsAppTestimonials({ onOrder }: { onOrder: (q?: number) => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/90 via-white to-violet-50/40 py-14 sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
      <div className="mx-auto max-w-lg px-4">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-white shadow-lg shadow-emerald-500/30">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.606.606l4.458-1.495A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.378l-.358-.213-2.642.886.886-2.578-.233-.375A9.818 9.818 0 0112 2.182 9.818 9.818 0 0121.818 12 9.818 9.818 0 0112 21.818z"/></svg>
            WhatsApp vérifiés
          </span>
          <h2 className="mt-4 text-2xl font-black text-indigo-950 sm:text-3xl">
            <Grad variant="emerald">4,9/5</Grad> · <Grad variant="violet">2 847 avis</Grad>
          </h2>
          <p className="mt-2 text-[13px] font-semibold text-indigo-600/80">Messages authentiques de clientes en Côte d&apos;Ivoire</p>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-[#0b141a] p-1 shadow-[0_30px_80px_-20px_rgba(16,185,129,.35)] ring-2 ring-emerald-400/20">
          <div className="rounded-[1.85rem] bg-[#0b141a]">
            <div className="flex items-center gap-3 border-b border-white/5 bg-[#1f2c34] px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-lg">🩺</div>
              <div>
                <p className="text-[13px] font-black text-white">GS Compression CI</p>
                <p className="text-[10px] font-semibold text-emerald-400">● En ligne · répond en 5 min</p>
              </div>
            </div>
            <div className="space-y-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMGRiMjM0Ii8+PHBhdGggZD0iTTAgNDBoNDBWNHoiIGZpbGw9IiMwYjE0MWEiLz48L3N2Zz4=')] p-4 max-h-[420px] overflow-y-auto">
              {WA_REVIEWS.map((w, i) => (
                <div key={i} className={`flex gap-2.5 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-[11px] font-black text-white shadow-lg ring-2 ring-white/10`}>
                    {w.n.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </div>
                  <div className={`max-w-[82%] ${i % 2 === 1 ? 'items-end' : ''}`}>
                    <div className={`rounded-2xl px-3.5 py-2.5 shadow-md ${i % 2 === 1 ? 'rounded-tr-sm bg-[#005c4b]' : 'rounded-tl-sm bg-[#202c33]'}`}>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black text-emerald-300">{w.n}</span>
                        <span className="text-[9px] font-semibold text-white/40">· {w.v}</span>
                        {w.verified && (
                          <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-300">✓ Vérifié</span>
                        )}
                      </div>
                      <StarRow n={w.stars} />
                      <p className="mt-1.5 text-[13px] leading-snug text-[#e9edef]">{w.m}</p>
                      <p className={`mt-1.5 text-[9px] text-white/35 ${i % 2 === 1 ? 'text-left' : 'text-right'}`}>{w.t} ✓✓</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-violet-950 to-indigo-950 px-4 py-3 ring-1 ring-violet-400/30">
          <StarRow n={5} size="md" />
          <p className="text-[12px] font-black text-white">98 % recommandent · <span className="text-emerald-300">Achat vérifié</span></p>
        </div>
        <div className="mt-6">
          <FluidCTA onClick={() => onOrder(2)} variant="violet">Rejoindre les 5★ — Pack 2 paires <Arrow /></FluidCTA>
        </div>
      </div>
    </section>
  );
}

function SmsTestimonials() {
  return (
    <section className="relative overflow-hidden bg-indigo-950 py-14 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,.15),transparent_60%)]" />
      <div className="relative mx-auto max-w-lg px-4">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">
            📱 SMS clients
          </span>
          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            <span className="ccc-shimmer">98 %</span> de retours positifs
          </h2>
        </div>
        <div className="mt-8 space-y-3">
          {SMS_REVIEWS.map((s, i) => (
            <div
              key={i}
              className="ccc-fade-up relative overflow-hidden rounded-2xl p-[1.5px] shadow-xl"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-violet-400 to-rose-400 opacity-90" />
              <div className="relative rounded-[calc(1rem-1.5px)] bg-indigo-900/95 p-4 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-violet-500 text-sm">📩</span>
                    <div>
                      <p className="text-[12px] font-black text-emerald-300">{s.from}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-indigo-400">{s.carrier}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-indigo-300">{s.time}</span>
                </div>
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-indigo-50">{s.msg}</p>
                <div className="mt-3 flex items-center gap-2">
                  <StarRow n={5} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-300">Client vérifié</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type BlockVariant = 'light' | 'mist' | 'dark' | 'violet';

function MediaBlock({
  kicker, hook, cta, qty, onOrder, media, variant = 'light', ctaVariant = 'emerald',
}: {
  kicker?: string;
  hook: ReactNode;
  cta: string;
  qty?: number;
  onOrder: (q?: number) => void;
  media: ReactNode;
  variant?: BlockVariant;
  ctaVariant?: 'emerald' | 'violet' | 'dark';
}) {
  const bg = {
    light: 'bg-gradient-to-b from-white via-indigo-50/30 to-white text-indigo-950',
    mist: 'bg-gradient-to-b from-violet-50/80 via-white to-emerald-50/50 text-indigo-950',
    dark: 'bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-950 text-white',
    violet: 'bg-gradient-to-b from-indigo-900 via-violet-950 to-indigo-950 text-white',
  }[variant];
  const kickerCls = variant === 'dark' || variant === 'violet' ? 'text-emerald-300' : 'text-violet-600';
  const subCls = variant === 'dark' || variant === 'violet' ? 'text-indigo-200/80' : 'text-indigo-600/70';

  return (
    <section className={`relative overflow-hidden py-12 sm:py-16 ${bg}`}>
      <div className="pointer-events-none absolute -left-16 top-8 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl ccc-float-slow" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl ccc-float-slow" style={{ animationDelay: '2s' }} />

      <div className="relative mx-auto max-w-xl px-4">
        {kicker && (
          <p className={`mb-3 text-center text-[10px] font-black uppercase tracking-[0.32em] ${kickerCls}`}>{kicker}</p>
        )}
        <div className="mb-6 text-balance text-center text-[20px] font-black leading-snug sm:text-[24px]">
          {hook}
        </div>
        <div className="relative mx-auto max-w-[440px]">{media}</div>
        <div className="mx-auto mt-7 max-w-sm">
          <FluidCTA onClick={() => onOrder(qty)} variant={ctaVariant}>{cta} <Arrow /></FluidCTA>
          <p className={`mt-2.5 text-center text-[11px] font-semibold ${subCls}`}>
            🔒 Paiement à la livraison · Express CI
          </p>
        </div>
      </div>
    </section>
  );
}

export default function ChaussetteCompressionLanding() {
  const navigate = useNavigate();
  const company = useMemo(co, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState(22);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ n: string; v: string; t: string; visible: boolean } | null>(null);

  const pixelFired = useRef(false);
  const toastIdx = useRef(0);

  const TOASTS = useMemo(() => [
    { n: 'Aminata K.', v: 'Cocody', t: '3 min' },
    { n: 'Mariam D.', v: 'Yopougon', t: '6 min' },
    { n: 'Fatou S.', v: 'Marcory', t: '11 min' },
    { n: 'Kouassi B.', v: 'Bouaké', t: '15 min' },
    { n: 'Sarah T.', v: 'Plateau', t: '19 min' },
    { n: 'Clara M.', v: 'Treichville', t: '24 min' },
  ], []);

  const openModal = useCallback((q?: number) => {
    setQty(q || 1);
    setModal(true);
  }, []);

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = M('hero.webp');
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch { /* noop */ } };
  }, []);

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: 'Chaussettes Compression Premium',
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: orderTotal(PRICES, 1),
        currency: 'XOF',
      });
    }
  }, [company]);

  useEffect(() => {
    axios.get(`${API_URL}/public/products`, { params: { company } })
      .then((r) => {
        const p = (r.data?.products || []).find((x: Product) => x.code?.toUpperCase() === PRODUCT_CODE);
        if (p) setProduct(p);
      })
      .catch(() => {});
  }, [company]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - now.getTime());
      setCountdown({
        h: Math.floor(d / 3600000),
        m: Math.floor((d % 3600000) / 60000),
        s: Math.floor((d % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setStock((s) => (s > 6 ? s - 1 : s)), 42000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const show = () => {
      const t = TOASTS[toastIdx.current % TOASTS.length];
      toastIdx.current++;
      setToast({ ...t, visible: true });
      setTimeout(() => setToast((prev) => (prev ? { ...prev, visible: false } : null)), 3500);
      setTimeout(() => setToast(null), 3900);
    };
    const first = setTimeout(show, 5500);
    const id = setInterval(show, 16000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [TOASTS]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const stockPct = Math.round((stock / 30) * 100);
  const press = ['Santé Magazine CI', 'Femme Actuelle', 'Doctissimo Afrique', 'Bien-être Plus', 'Health24'];

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-indigo-950">
      <style>{`
        @keyframes ccc-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes ccc-marquee-rev { 0% { transform: translateX(-50%) } 100% { transform: translateX(0) } }
        @keyframes ccc-marquee-bg { 0% { background-position: 0% 50% } 100% { background-position: 200% 50% } }
        @keyframes ccc-fade-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ccc-float-slow { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes ccc-sheen { 0% { transform: translateX(-120%) skewX(-12deg) } 100% { transform: translateX(220%) skewX(-12deg) } }
        @keyframes ccc-sheen-slow { 0% { transform: translateX(-150%) } 100% { transform: translateX(150%) } }
        @keyframes ccc-shimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }
        @keyframes ccc-slide-in { from { opacity: 0; transform: translateX(-100%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes ccc-slide-out { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-100%) } }
        @keyframes ccc-bounce {
          0%, 100% { transform: translateY(0) scale(1) }
          25% { transform: translateY(-4px) scale(1.01) }
          50% { transform: translateY(-2px) scale(1.005) }
          75% { transform: translateY(-5px) scale(1.015) }
        }
        @keyframes ccc-aura-pulse {
          0%, 100% { opacity: .55; transform: scale(.98) }
          50% { opacity: 1; transform: scale(1.04) }
        }
        @keyframes ccc-grad-shift {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }

        .ccc-marquee { animation: ccc-marquee 28s linear infinite }
        .ccc-marquee-rev { animation: ccc-marquee-rev 32s linear infinite }
        .ccc-marquee-bg { animation: ccc-marquee-bg 6s linear infinite }
        .ccc-bounce { animation: ccc-bounce 2.2s ease-in-out infinite }
        .ccc-bounce:hover { animation: none }
        .ccc-sheen { animation: ccc-sheen 2.4s ease-in-out infinite }
        .ccc-sheen-slow { animation: ccc-sheen-slow 4s ease-in-out infinite }
        .ccc-cta-aura { animation: ccc-aura-pulse 2s ease-in-out infinite }
        .ccc-cta-grad-emerald {
          background: linear-gradient(135deg, #059669 0%, #34d399 25%, #10b981 50%, #6ee7b7 75%, #059669 100%);
          background-size: 300% 300%;
          animation: ccc-grad-shift 4s ease infinite;
          box-shadow: 0 12px 32px -6px rgba(16,185,129,.55), inset 0 1px 0 rgba(255,255,255,.25);
        }
        .ccc-cta-grad-violet {
          background: linear-gradient(135deg, #6d28d9 0%, #a78bfa 25%, #7c3aed 50%, #c4b5fd 75%, #6d28d9 100%);
          background-size: 300% 300%;
          animation: ccc-grad-shift 4s ease infinite;
          box-shadow: 0 12px 32px -6px rgba(139,92,246,.55), inset 0 1px 0 rgba(255,255,255,.25);
        }
        .ccc-cta-grad-dark {
          background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 35%, #312e81 65%, #059669 100%);
          background-size: 300% 300%;
          animation: ccc-grad-shift 5s ease infinite;
          box-shadow: 0 12px 32px -6px rgba(49,46,129,.6), inset 0 1px 0 rgba(255,255,255,.1);
        }
        .ccc-cta-glow-emerald { background: linear-gradient(90deg, #34d399, #6ee7b7, #34d399) }
        .ccc-cta-glow-violet { background: linear-gradient(90deg, #a78bfa, #c4b5fd, #a78bfa) }
        .ccc-cta-glow-dark { background: linear-gradient(90deg, #6366f1, #34d399, #6366f1) }
        .ccc-marquee-text-dark {
          background: linear-gradient(90deg, #6ee7b7, #c4b5fd, #fcd34d, #6ee7b7);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: ccc-shimmer 5s linear infinite;
        }
        .ccc-float-slow { animation: ccc-float-slow 7s ease-in-out infinite }
        .ccc-fade-up { animation: ccc-fade-up .55s cubic-bezier(.22,.8,.4,1) both }
        .ccc-shimmer {
          background: linear-gradient(90deg, #34d399 0%, #a78bfa 25%, #6ee7b7 50%, #c4b5fd 75%, #34d399 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: ccc-shimmer 4s linear infinite;
        }
        .ccc-toast-in { animation: ccc-slide-in .4s cubic-bezier(.22,1,.36,1) both }
        .ccc-toast-out { animation: ccc-slide-out .35s cubic-bezier(.55,.08,.68,.53) both }
      `}</style>

      {/* BARRE URGENCE + COMPTE A REBOURS */}
      <div className="sticky top-0 z-50 border-b border-violet-500/20 bg-indigo-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-2 text-center">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Offre du jour
          </span>
          <span className="text-[10px] font-bold text-violet-200">−34 % · fin à minuit</span>
          <div className="flex items-center gap-1 font-mono text-[12px] font-black tabular-nums text-white">
            {[countdown.h, countdown.m, countdown.s].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-violet-400">:</span>}
                <span className="inline-flex h-7 min-w-[30px] items-center justify-center rounded-md bg-violet-600/40 px-1 ring-1 ring-violet-400/30">{pad(v)}</span>
              </span>
            ))}
          </div>
          <span className="rounded-full bg-rose-500/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
            Stock {stock}
          </span>
        </div>
        <div className="h-[3px] w-full bg-indigo-900">
          <div className="h-full bg-gradient-to-r from-emerald-400 via-violet-400 to-emerald-400 transition-all duration-700" style={{ width: `${stockPct}%` }} />
        </div>
      </div>

      {/* HERO — hero.webp */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-violet-50/40 py-12 sm:py-16">
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl ccc-float-slow" />
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-violet-300/25 blur-3xl ccc-float-slow" style={{ animationDelay: '2.5s' }} />

        <div className="relative mx-auto max-w-xl px-4 text-center">
          <p className="ccc-fade-up mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-violet-700 backdrop-blur">
            🩺 Compression médicale 20-30 mmHg
          </p>

          <h1 className="ccc-fade-up mt-3 text-balance text-[32px] font-black leading-[1.05] tracking-tight sm:text-[42px]" style={{ animationDelay: '.05s' }}>
            Vos jambes <Grad variant="emerald">légères</Grad> dès le <Grad variant="violet">1er jour</Grad>.
          </h1>
          <p className="ccc-fade-up mx-auto mt-3 max-w-md text-[14px] font-semibold text-indigo-800/85 sm:text-[15px]" style={{ animationDelay: '.1s' }}>
            Fini les <Grad variant="rose">pieds gonflés</Grad> et les <Grad variant="rose">jambes lourdes</Grad>.
          </p>

          <div className="ccc-fade-up relative mx-auto mt-8 max-w-[400px]" style={{ animationDelay: '.15s' }}>
            <div className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-300/40 via-violet-300/30 to-emerald-300/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] ring-2 ring-violet-300/50 shadow-[0_28px_70px_-20px_rgba(79,70,229,.45)]">
              <LazyImg src={M('hero.webp')} alt="Chaussettes de compression anti-douleur" aspect="4/5" priority />
            </div>
            <div className="absolute -left-2 top-8 rotate-[-6deg] rounded-xl bg-indigo-950 px-3 py-2 text-center shadow-xl ring-1 ring-violet-400/40">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Soulagement</p>
              <p className="ccc-shimmer text-[15px] font-black">Immédiat</p>
            </div>
            <div className="absolute -right-2 bottom-16 rotate-[5deg] rounded-xl bg-white px-3 py-2 shadow-xl ring-1 ring-emerald-200">
              <p className="flex items-center gap-0.5 text-amber-400">{[1, 2, 3, 4, 5].map((i) => <Star key={i} />)}</p>
              <p className="text-[11px] font-black text-indigo-950">4,9/5 · 94 350+ clients</p>
            </div>
          </div>

          <div className="ccc-fade-up mt-8" style={{ animationDelay: '.2s' }}>
            <div className="flex items-baseline justify-center gap-2">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-violet-600 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">{fmtTotal(1)}</span>
              <span className="text-lg font-bold text-indigo-800">FCFA</span>
              <span className="text-sm text-indigo-400 line-through">{fmt(OLD_PRICE).replace(' FCFA', '')}</span>
              <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">−34 %</span>
            </div>
            <p className="mt-1 text-[12px] font-bold text-emerald-700">🚚 Paiement à la réception</p>
            <div className="mx-auto mt-5 max-w-sm">
              <FluidCTA onClick={() => openModal(1)}>Commander maintenant <Arrow /></FluidCTA>
            </div>
          </div>
        </div>
      </section>

      <GradientMarquee variant="rainbow" speed={24} items={['⚡ Soulagement immédiat', 'Compression 20-30 mmHg', '🚚 Livraison 24h', '💰 Paiement livraison', '⭐ 4,9/5 · 94 350 clients', '🩺 Qualité médicale']} />

      <GradientMarquee variant="violet" reverse speed={32} items={['Anti-gonflement', 'Varices · Diabète · Fatigue', 'Tailles S à XXL', 'Express Abidjan', '−34 % aujourd\'hui', 'Stock limité']} />

      {/* STATS */}
      <section className="border-y border-indigo-100 bg-white py-6">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 px-4 sm:grid-cols-4">
          {[
            { n: '94 350+', l: 'Clients' },
            { n: '4,9/5', l: 'Note' },
            { n: '24h', l: 'Livraison' },
            { n: '98 %', l: 'Recommandent' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-[22px] font-black text-transparent sm:text-[28px]">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600/70">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BLOCS MEDIA — chaque image/video une seule fois */}
      <MediaBlock
        kicker="Le problème"
        hook={<>Le soir, vos pieds <Grad variant="rose">brûlent</Grad> et vos chevilles <Grad variant="rose">gonflent</Grad>.</>}
        cta="Je veux du soulagement"
        qty={1}
        onOrder={openModal}
        variant="mist"
        media={<LazyImg src={M('m5.webp')} alt="Douleur jambes lourdes" aspect="4/5" className="rounded-[1.75rem] ring-2 ring-rose-200/60 shadow-xl" />}
      />

      <MediaBlock
        kicker="Vous reconnaissez ça ?"
        hook={<>Des <Grad variant="violet">fourmillements</Grad> et une <Grad variant="violet">fatigue</Grad> qui ne part plus.</>}
        cta="Oui, j'en ai besoin"
        qty={1}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={M('m6.webp')} alt="Pieds endoloris" aspect="4/5" className="rounded-[1.75rem] ring-2 ring-violet-200/60 shadow-xl" />}
      />

      <MediaBlock
        kicker="Démonstration"
        hook={<>Regardez la <Grad variant="emerald">compression graduée</Grad> en action.</>}
        cta="Je commande comme elle"
        qty={2}
        onOrder={openModal}
        variant="dark"
        ctaVariant="violet"
        media={<LazyVideo src={M('v1.mp4')} />}
      />

      <MediaBlock
        kicker="Affichage clinique"
        hook={<>La <Grad variant="gold">douleur aux pieds</Grad> ? Ces chaussettes <Grad variant="emerald">changent tout</Grad>.</>}
        cta="Profiter de l'offre"
        qty={1}
        onOrder={openModal}
        variant="violet"
        ctaVariant="emerald"
        media={<LazyImg src={M('m9.webp')} alt="Soulagement mal aux pieds" aspect="4/5" className="rounded-[1.75rem] ring-2 ring-emerald-400/30 shadow-xl" />}
      />

      <MediaBlock
        kicker="Technologie"
        hook={<>Tissu <Grad variant="violet">ultra-stretch</Grad> · compression <Grad variant="emerald">20-30 mmHg</Grad>.</>}
        cta="Je veux cette qualité"
        qty={1}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={M('m2.webp')} alt="Détail chaussette compression" aspect="1/1" className="rounded-[1.75rem] ring-2 ring-indigo-200 shadow-xl" />}
      />

      <GradientMarquee variant="emerald" speed={26} items={['✓ Recommandé par les médecins', 'Circulation relancée', 'Confort 12h/jour', 'Facile à enfiler', 'Lavable en machine']} />

      <MediaBlock
        kicker="Sur la jambe"
        hook={<>Maintien <Grad variant="emerald">ferme</Grad> mais <Grad variant="violet">confortable</Grad> toute la journée.</>}
        cta="Essayer aujourd'hui"
        qty={1}
        onOrder={openModal}
        variant="mist"
        media={<LazyImg src={M('m3.webp')} alt="Bas de compression noir" aspect="4/5" className="rounded-[1.75rem] ring-2 ring-emerald-200/60 shadow-xl" />}
      />

      <MediaBlock
        kicker="Résultat"
        hook={<>Des jambes <Grad variant="emerald">légères</Grad> et une <Grad variant="gold">circulation</Grad> relancée.</>}
        cta="Obtenir ce confort"
        qty={2}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={M('m4.webp')} alt="Jambes légères" aspect="4/5" className="rounded-[1.75rem] ring-2 ring-violet-200/60 shadow-xl" />}
      />

      {/* VU DANS + PRESSE */}
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-600">Vu dans</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {press.map((p) => (
              <span key={p} className="rounded-lg border border-transparent bg-gradient-to-r from-indigo-100 via-violet-50 to-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-800 shadow-sm ring-1 ring-violet-200/60">{p}</span>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-950 via-violet-900 to-indigo-950 px-5 py-2.5 text-white shadow-xl ring-2 ring-violet-400/40">
            <StarRow n={5} size="md" />
            <span className="text-[13px] font-black">4,9/5 · 2 847 avis vérifiés</span>
          </div>
        </div>
      </section>

      <MediaBlock
        kicker="Anti-fatigue"
        hook={<>Parfaites si vous êtes <Grad variant="violet">debout 8h+</Grad> par jour.</>}
        cta="Pack 2 paires — populaire"
        qty={2}
        onOrder={openModal}
        variant="mist"
        media={<LazyImg src={M('m8.webp')} alt="Anti fatigue" aspect="1/1" className="rounded-[1.75rem] ring-2 ring-emerald-200 shadow-xl" />}
      />

      <MediaBlock
        kicker="Confort premium"
        hook={<>Respirantes, <Grad variant="emerald">anti-odeur</Grad>, <Grad variant="violet">anti-bactériennes</Grad>.</>}
        cta="Je sécurise ma paire"
        qty={1}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={M('m10.webp')} alt="Confort premium" aspect="1/1" className="rounded-[1.75rem] ring-2 ring-violet-200 shadow-xl" />}
      />

      <WhatsAppTestimonials onOrder={openModal} />

      <GradientMarquee variant="rainbow" reverse speed={30} items={['⭐ Avis vérifiés', 'WhatsApp · SMS · Presse', 'Client satisfait ou échangé', 'Support 7j/7', 'Commandez en 30 sec']} />

      <MediaBlock
        kicker="Design médical"
        hook={<>La <Grad variant="gold">même qualité</Grad> qu'en pharmacie. <Grad variant="emerald">Prix direct</Grad>.</>}
        cta="Commander au meilleur prix"
        qty={1}
        onOrder={openModal}
        variant="dark"
        ctaVariant="emerald"
        media={<LazyImg src={M('m11.webp')} alt="Design médical" aspect="1/1" className="rounded-[1.75rem] ring-2 ring-emerald-400/30 shadow-xl" />}
      />

      <MediaBlock
        kicker="Best-seller"
        hook={<>La paire que nos clientes <Grad variant="violet">commandent en double</Grad>.</>}
        cta={`Pack 2 paires — ${fmtTotal(2)} F`}
        qty={2}
        onOrder={openModal}
        variant="mist"
        media={<LazyImg src={M('m7.webp')} alt="Photo vente compression" aspect="4/5" className="rounded-[1.75rem] ring-2 ring-violet-200 shadow-xl" />}
      />

      <SmsTestimonials />

      <MediaBlock
        kicker="Détail tissu"
        hook={<>Nylon premium + spandex. <Grad variant="emerald">50+ lavages</Grad> sans usure.</>}
        cta="Investir dans ma santé"
        qty={1}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={M('m12.webp')} alt="Détail tissu" aspect="1/1" className="rounded-[1.75rem] ring-2 ring-emerald-200 shadow-xl" />}
      />

      <MediaBlock
        kicker="Lifestyle"
        hook={<>Au bureau, en marchant, à la maison. <Grad variant="violet">Toujours légères</Grad>.</>}
        cta="Je profite de l'offre"
        qty={1}
        onOrder={openModal}
        variant="mist"
        media={<LazyImg src={M('m13.webp')} alt="Usage quotidien" aspect="1/1" className="rounded-[1.75rem] ring-2 ring-violet-200 shadow-xl" />}
      />

      <MediaBlock
        kicker="Cheville & pied"
        hook={<>Compression ciblée là où la <Grad variant="rose">douleur</Grad> commence.</>}
        cta="Soulager mes pieds"
        qty={1}
        onOrder={openModal}
        variant="light"
        media={<LazyImg src={M('m14.webp')} alt="Support cheville" aspect="4/5" className="rounded-[1.75rem] ring-2 ring-rose-200/60 shadow-xl" />}
      />

      {/* BUNDLES */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-violet-800">Ultra premium</span>
            <h2 className="mt-3 text-2xl font-black text-indigo-950 sm:text-3xl">
              Plus vous prenez, <Grad variant="emerald">plus vous économisez</Grad>.
            </h2>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { v: 1, n: '1 paire', p: orderTotal(PRICES, 1), old: 15000, sub: packLabel(PRICES, 1, 'F'), save: null },
              { v: 2, n: '2 paires', p: orderTotal(PRICES, 2), old: 30000, sub: packLabel(PRICES, 2, 'F'), save: '−4 900 F', hot: true },
              { v: 3, n: '3 paires', p: orderTotal(PRICES, 3), old: 45000, sub: packLabel(PRICES, 3, 'F'), save: '−9 800 F' },
            ].map((b) => (
              <button
                key={b.v}
                type="button"
                onClick={() => openModal(b.v)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition hover:scale-[1.02] hover:shadow-xl ${
                  b.hot
                    ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-violet-50 shadow-lg ring-2 ring-emerald-300/40'
                    : 'border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50'
                }`}
              >
                {b.hot && (
                  <span className="absolute -top-1 right-3 rotate-3 rounded-b-md bg-emerald-500 px-2 py-1 text-[9px] font-black uppercase text-white shadow">HOT</span>
                )}
                <p className="text-[10px] font-black uppercase tracking-wider text-violet-700">{b.sub}</p>
                <p className="mt-1 text-xl font-black text-indigo-950">{b.n}</p>
                <p className="mt-2 bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-2xl font-black text-transparent">
                  {b.p.toLocaleString('fr-FR').replace(/,/g, ' ')} F
                </p>
                <p className="mt-1 text-[11px] text-indigo-400 line-through">{b.old.toLocaleString('fr-FR').replace(/,/g, ' ')} F</p>
                {b.save && (
                  <p className="mt-2 inline-flex rounded-full bg-indigo-950 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-300">{b.save}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <MediaBlock
        kicker="Client réel"
        hook={<>Elle les porte <Grad variant="emerald">chaque matin</Grad>. Zéro regret.</>}
        cta="Moi aussi — je commande"
        qty={1}
        onOrder={openModal}
        variant="violet"
        ctaVariant="emerald"
        media={<LazyImg src={M('m15.webp')} alt="Cliente satisfaite" aspect="4/5" className="rounded-[1.75rem] ring-2 ring-emerald-400/30 shadow-xl" />}
      />

      {/* FAQ */}
      <section className="bg-indigo-50/50 py-14">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-black text-indigo-950">Questions <Grad variant="violet">rapides</Grad>.</h2>
          <div className="mt-7 space-y-3">
            {[
              { q: 'Quelle taille ?', a: 'S à XXL. Pointures 35-49. Sélection dans le formulaire.' },
              { q: 'Payer avant ?', a: 'Non. Cash à la livraison uniquement.' },
              { q: 'Diabète / varices ?', a: 'Oui. Compression graduée recommandée par les médecins.' },
              { q: 'Livraison ?', a: '24h Abidjan · 48h régions · Gratuite.' },
            ].map((f, i) => (
              <details key={i} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-indigo-100 open:ring-violet-300">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-black text-indigo-950">
                  <span>{f.q}</span>
                  <svg className="h-5 w-5 text-violet-600 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-indigo-700">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOTURE */}
      <section className="relative overflow-hidden bg-indigo-950 py-20 text-white">
        <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl ccc-float-slow" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl ccc-float-slow" style={{ animationDelay: '2s' }} />
        <div className="relative mx-auto max-w-xl px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.36em] text-emerald-300">Dernières heures</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            Vos jambes méritent le <span className="ccc-shimmer">confort</span>.
          </h2>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-violet-400/40">
            <span className="font-mono text-[15px] font-black tabular-nums">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>
            <span className="text-[10px] font-bold text-rose-300">· Stock {stock}</span>
          </div>
          <div className="mx-auto mt-7 max-w-sm">
            <FluidCTA onClick={() => openModal(2)} variant="emerald">COMMANDER — {fmtTotal(2)} F <Arrow /></FluidCTA>
          </div>
        </div>
      </section>

      <GradientMarquee variant="dark" speed={34} items={['🔥 Offre −34 %', 'Fin promo minuit', 'Paiement livraison', 'Compression 20-30 mmHg', 'Livraison express CI', 'Support WhatsApp']} />

      <footer className="bg-indigo-950 py-7 pb-24 text-center text-[10px] font-semibold text-violet-300/70 sm:pb-7">
        © {new Date().getFullYear()} · Chaussettes compression premium · Côte d&apos;Ivoire
      </footer>

      {toast && !modal && (
        <div className={`fixed bottom-20 left-3 z-30 w-[88vw] max-w-[280px] sm:bottom-5 ${toast.visible ? 'ccc-toast-in' : 'ccc-toast-out'}`}>
          <div className="flex items-center gap-2.5 rounded-xl border border-violet-400/30 bg-indigo-950 px-3 py-2.5 shadow-xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-violet-500 text-[11px] font-black text-white">
              {toast.n.split(' ').map((p) => p[0]).join('').slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-white"><span className="text-emerald-300">{toast.n}</span> · {toast.v}</p>
              <p className="mt-0.5 text-[10px] text-indigo-200">a commandé il y a {toast.t}</p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-violet-500/30 bg-indigo-950/95 px-3 py-2.5 backdrop-blur-md sm:hidden ${modal ? 'translate-y-full opacity-0' : 'ccc-fade-up'} transition-all`}
        style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
              {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)} · Stock {stock}
            </p>
            <p className="text-[11px] font-bold text-white">{fmtTotal(1)} F</p>
          </div>
          <div className="w-[148px] shrink-0">
            <FluidCTA onClick={() => openModal(1)} variant="emerald" size="sm">
              Commander <Arrow />
            </FluidCTA>
          </div>
        </div>
      </div>

      <OrderModalDispatcher
        slug={SLUG}
        open={modal}
        onClose={() => setModal(false)}
        cfg={{
          productCode: PRODUCT_CODE,
          title: 'Chaussettes de Compression',
          prices: PRICES,
          thankYouUrl: THANK_YOU_URL,
          metaPixelId: META_PIXEL_ID,
          slug: SLUG,
          company,
          navigate,
          images: { hero: M('hero.webp') },
          countdownEnd: (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); })(),
        }}
        product={product}
        setProduct={setProduct}
        qtyOptions={QTY_OPTS}
        initialQty={qty}
      />
    </div>
  );
}
