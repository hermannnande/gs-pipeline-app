/**
 * Landing — Ebook « Faire pousser vos cheveux naturellement » (produit DIGITAL).
 * ============================================================================
 *
 * Produit 100% numerique paye via CHARIOW (Mobile Money / carte). Aucune
 * livraison physique : apres paiement, Chariow delivre le PDF (portail client)
 * et le webhook /api/chariow/webhook enregistre la vente dans obgestion.
 *
 * Le produit GUIDE_POUSSE_NATURELLE est ISOLE (utils/isolatedProducts.js) : ces
 * ventes n'apparaissent pas dans le pipeline "a appeler"/livraison, seulement
 * dans la page admin dediee (/admin/ventes-digitales).
 *
 * Flux d'achat :
 *   CTA -> modal (nom, email, telephone) -> useChariowCheckout -> redirection
 *   Chariow -> apres paiement, retour sur /guide-pousse-naturelle/merci?ref=<sale_id>.
 *
 * Palette : jaune / vert / rouge / blanc (demande client).
 * Formulations responsables : "aide a", "soutient", jamais "guerit".
 *
 * Video hero (YouTube Short) : autoplay en muet (obligatoire — les navigateurs
 * interdisent l'autoplay avec son), le son s'active au 1er geste utilisateur
 * (scroll / clic / toucher). Bouton son visible en overlay. Voir HeroVideo.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { trackPageView } from '../../utils/pageTracking';
import { useChariowCheckout, type ChariowCheckoutConfig } from '../../hooks/useChariowCheckout';
import { optimImg, optimImgSrcSet } from '../../utils/img';
// Video hero self-hostee (compressee 720x720, ~5.9 Mo) + poster WebP.
// Emises par Vite dans /landings-app/assets/ -> servies en meme origine (rapide).
import videoSrc from '../../assets/guide/video-guide.mp4';
import videoPoster from '../../assets/guide/video-guide-poster.webp';

const SLUG = 'guide-pousse-naturelle';
const PRODUCT_CODE = 'GUIDE_POUSSE_NATURELLE';
const TITLE = 'Faire pousser vos cheveux naturellement';
// Meta Pixel ID de cette page.
const META_PIXEL_ID = '2061376097807745';
const PRICE = 4500;
const OLD_PRICE = 9000;
const PRICES: Record<number, number> = { 1: PRICE };

// Images (hebergees sur obrille.com — meme origine que la landing).
const BASE = 'https://obrille.com/wp-content/uploads/2026/07';
const MEDIA = {
  hero: `${BASE}/ChatGPT-Image-13-juil.-2026-22_06_50.png`,
  problem: `${BASE}/ChatGPT-Image-13-juil.-2026-22_06_44.png`,
  author: `${BASE}/ChatGPT-Image-13-juil.-2026-22_06_21.png`,
  recipes: `${BASE}/ChatGPT-Image-13-juil.-2026-22_05_51.png`,
  men: `${BASE}/ChatGPT-Image-13-juil.-2026-22_05_56.png`,
  women: `${BASE}/ChatGPT-Image-13-juil.-2026-22_06_57.png`,
  beard: `${BASE}/ChatGPT-Image-13-juil.-2026-22_06_37.png`,
};

const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any; } }

function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

// Temoignages EXEMPLES — a remplacer par de vrais avis avant le lancement.
const TESTIMONIALS = [
  { name: 'Awa K.', city: 'Abidjan', stars: 5, text: "J'ai arrete d'acheter dix produits differents. Je fabrique mes soins et mes cheveux cassent beaucoup moins." },
  { name: 'Marc T.', city: 'Dakar', stars: 5, text: "Le programme homme pour les tempes est clair et realiste. Enfin une routine que je tiens." },
  { name: 'Nadia B.', city: 'Cotonou', stars: 5, text: "Le defi 30 jours m'a aidee a etre reguliere. Je vois la difference sur mes photos de suivi." },
];

const FAQ = [
  { q: 'Le guide convient-il aux hommes et aux femmes ?', a: 'Oui : programmes distincts hommes (tempes, couronne), femmes (longueur, casse) et barbe.' },
  { q: 'Le guide garantit-il la guerison de la calvitie ?', a: "Non. C'est un guide educatif qui aide a construire une routine adaptee et a savoir quand consulter. Il ne remplace pas un avis medical." },
  { q: 'Comment vais-je recevoir le guide ?', a: 'Apres paiement, vous recevez un acces securise (email / portail). PDF lisible sur telephone, tablette et ordinateur.' },
  { q: 'Quels moyens de paiement puis-je utiliser ?', a: 'Le paiement affiche automatiquement les solutions de votre pays : Mobile Money (Orange, Wave, MTN, Moov…) et cartes.' },
];

// Indicatifs pays (le client choisit le sien ; Chariow affiche ensuite les
// moyens de paiement adaptés à ce pays). code = ISO alpha-2 envoyé à Chariow.
const COUNTRIES: { code: string; name: string; dial: string; flag: string }[] = [
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'BJ', name: 'Bénin', dial: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'GN', name: 'Guinée', dial: '+224', flag: '🇬🇳' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { code: 'CM', name: 'Cameroun', dial: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'RD Congo', dial: '+243', flag: '🇨🇩' },
  { code: 'TD', name: 'Tchad', dial: '+235', flag: '🇹🇩' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', dial: '+32', flag: '🇧🇪' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'US', name: 'États-Unis', dial: '+1', flag: '🇺🇸' },
];

function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="inline-flex" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? 'text-[#E9A900]' : 'text-gray-300'}>★</span>
      ))}
    </span>
  );
}

// Helpers de presentation (module-level : evite tout remount au scroll).
function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-5xl px-4 py-12 ${className}`}>{children}</section>;
}

function Img({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={optimImg(src, 800)}
      srcSet={optimImgSrcSet(src, [400, 800])}
      sizes="(min-width: 768px) 50vw, 100vw"
      alt={alt}
      loading="lazy"
      decoding="async"
      className="aspect-square w-full rounded-2xl object-cover shadow-lg"
    />
  );
}

function CTA({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E9A900] to-[#D63C32] px-6 py-4 text-[15px] font-black uppercase tracking-wide text-white shadow-[0_10px_28px_-6px_rgba(214,60,50,.5)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#126B3A]"
    >
      {children}
    </button>
  );
}

/**
 * Video hero — lecteur natif, format carre 1:1 (source 1080x1080 self-hostee).
 * SON ACTIF EN PERMANENCE (demande client) :
 * - On tente d'emblee l'autoplay AVEC le son.
 * - Les navigateurs bloquent l'autoplay sonore avant toute interaction : dans ce
 *   cas on bascule en muet juste pour lancer la lecture (video visible), puis on
 *   force le son au tout premier micro-geste (mousemove / scroll / clic / touche).
 * - Les ecouteurs restent actifs : si le navigateur re-coupe le son, le geste
 *   suivant le reactive. Aucun retour volontaire au muet, aucun bouton mute.
 * - Poster WebP affiche instantanement pendant le buffering (perf).
 */
function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = 1;

    // 1) Tente l'autoplay avec son ; sinon fallback muet pour lancer la lecture.
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => { /* autoplay bloque : le poster reste affiche */ });
    });

    // 2) Au moindre geste, on (re)active le son et on le garde.
    const enableSound = () => {
      const el = videoRef.current;
      if (el && el.muted) { el.muted = false; el.volume = 1; el.play().catch(() => { /* noop */ }); }
    };
    const opts = { passive: true } as const;
    window.addEventListener('pointerdown', enableSound, opts);
    window.addEventListener('touchstart', enableSound, opts);
    window.addEventListener('scroll', enableSound, opts);
    window.addEventListener('mousemove', enableSound, opts);
    window.addEventListener('keydown', enableSound);

    return () => {
      window.removeEventListener('pointerdown', enableSound);
      window.removeEventListener('touchstart', enableSound);
      window.removeEventListener('scroll', enableSound);
      window.removeEventListener('mousemove', enableSound);
      window.removeEventListener('keydown', enableSound);
    };
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px] overflow-hidden rounded-[1.75rem] bg-black shadow-[0_20px_50px_-12px_rgba(0,0,0,.5)] ring-4 ring-[#F7C948]/70">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={videoSrc}
        poster={videoPoster}
        autoPlay
        loop
        playsInline
        preload="metadata"
      />
    </div>
  );
}

export default function GuidePousseNaturelleLanding() {
  const company = useMemo(() => new URLSearchParams(window.location.search).get('company') || 'ci', []);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: 'CI' });
  const pixelFired = useRef(false);

  const cfg: ChariowCheckoutConfig = useMemo(
    () => ({ slug: SLUG, productCode: PRODUCT_CODE, title: TITLE, metaPixelId: META_PIXEL_ID || undefined, prices: PRICES }),
    [],
  );
  const { checkout, sending, formErr, setFormErr } = useChariowCheckout({ cfg, company });

  useEffect(() => {
    if (pixelFired.current) return;
    pixelFired.current = true;
    trackPageView(SLUG, company);
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      window.fbq?.('track', 'ViewContent', {
        content_name: TITLE,
        content_ids: [PRODUCT_CODE],
        content_type: 'product',
        value: PRICE,
        currency: 'XOF',
      });
    }
  }, [company]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const openModal = useCallback(() => { setFormErr(''); setModal(true); }, [setFormErr]);

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await checkout({
        slug: SLUG,
        qty: 1,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        customerCity: 'En ligne', // produit digital : pas d'adresse de livraison
        displayedAmount: PRICE,
        // Pays choisi par le client -> Chariow affiche les moyens de paiement
        // adaptés (Mobile Money du pays, cartes, etc.).
        countryCode: form.country,
        // Garde tout le parcours (paiement -> merci) sur obrille.com (VPS),
        // comme les autres pages de vente, au lieu de rediriger vers obgestion.
        redirectBase: window.location.origin,
      });
    },
    [checkout, form],
  );

  return (
    <div className="min-h-screen bg-white pb-24 text-[#252525]" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      {/* Bandeau defilant */}
      <div className="overflow-hidden bg-gradient-to-r from-[#126B3A] via-[#218C4F] to-[#E9A900] py-2 text-white">
        <div className="whitespace-nowrap text-center text-[11px] font-black uppercase tracking-[0.2em]">
          🌿 Hommes & femmes • Barbe • Tempes • Anti-casse • Defi 30 jours
        </div>
      </div>

      {/* VIDEO HERO (en premier) */}
      <Section className="!pb-6 !pt-8">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-block rounded-full bg-[#F7C948] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#A92520]">Ebook numerique</span>
          <h1 className="mt-4 text-3xl font-black leading-[1.1] text-[#126B3A] sm:text-4xl">
            VOUS AVEZ TOUT ESSAYE CONTRE LA CHUTE ?<br />
            <span className="text-[#D63C32]">FABRIQUEZ VOTRE PROPRE TRAITEMENT.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-gray-600">
            Des dizaines de produits achetes contre la calvitie et la chute… sans resultat durable ? Ce guide vous apprend a creer vous-meme vos soins, chez vous.
          </p>
        </div>

        <div className="mt-6"><HeroVideo /></div>

        {/* Prix + CTA sous la video */}
        <div className="mx-auto mt-6 max-w-sm text-center">
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-4xl font-black text-[#126B3A]">{fmt(PRICE)}</span>
            <span className="text-lg text-gray-400 line-through">{fmt(OLD_PRICE)}</span>
            <span className="rounded bg-[#D63C32] px-2 py-0.5 text-[11px] font-black text-white">-50%</span>
          </div>
          <div className="mt-4"><CTA onClick={openModal}>Je cree mes propres soins</CTA></div>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm">
            <Stars n={5} /> <span className="font-bold text-[#126B3A]">4.9/5</span>
            <span className="text-gray-400">· acces immediat apres paiement</span>
          </div>
        </div>
      </Section>

      {/* PROBLEME (condense) */}
      <div className="bg-[#FFF9ED]">
        <Section className="!py-10">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <Img src={MEDIA.problem} alt="Accumulation de produits capillaires couteux et inadaptes" />
            <div>
              <h2 className="text-2xl font-black leading-tight text-[#126B3A] sm:text-3xl">Arretez de depenser dans des produits qui ne marchent pas</h2>
              <p className="mt-3 text-gray-600">Chaque mois un nouveau produit « miracle », et toujours le meme resultat : rien. Tant que la vraie cause n'est pas identifiee, on gaspille son argent.</p>
              <div className="mt-5 max-w-xs"><CTA onClick={openModal}>Trouver ma routine</CTA></div>
            </div>
          </div>
        </Section>
      </div>

      {/* PROMESSE / CE QUE VOUS SAUREZ FAIRE */}
      <Section className="!py-10">
        <div className="text-center">
          <h2 className="text-2xl font-black text-[#126B3A] sm:text-3xl">Devenez votre propre laboratoire capillaire</h2>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">Vous ne rachetez plus rien : vous fabriquez et vous suivez une methode.</p>
        </div>
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['🔍', 'Diagnostic', 'Comprendre votre vraie cause'],
            ['🧪', 'Fabrication', 'Vos huiles, serums & masques'],
            ['📅', 'Defi 30 jours', 'Un rituel quotidien simple'],
            ['📈', 'Suivi', 'Mesurer vos progres reels'],
          ].map(([icon, t, d]) => (
            <div key={t} className="rounded-xl border border-[#F0E6CF] bg-white p-4 text-center shadow-sm">
              <div className="text-3xl">{icon}</div>
              <h3 className="mt-1 font-bold text-[#126B3A]">{t}</h3>
              <p className="text-[13px] text-gray-500">{d}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-sm"><CTA onClick={openModal}>Commencer maintenant</CTA></div>
      </Section>

      {/* OFFRE : CE QUE CONTIENT LE GUIDE */}
      <div className="bg-[#FFF9ED]">
        <Section className="!py-10">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#126B3A] sm:text-3xl">Tout ce que contient le guide</h2>
            <p className="mx-auto mt-2 max-w-2xl text-gray-600">Une methode complete, pas quelques recettes en vrac.</p>
          </div>
          <div className="mx-auto mt-6 grid max-w-3xl gap-2 sm:grid-cols-2">
            {[
              'Methode de diagnostic pour identifier votre vrai probleme',
              'Plus de 15 recettes : huiles, serums, macerats, masques, lotions, shampoings',
              'Fiches completes : ingredients, preparation, usage, conservation',
              'Programmes distincts : homme, femme et barbe',
              'Bonnes doses, substitutions et melanges a eviter',
              'Regles de conservation pour eviter la contamination',
              'BONUS : defi 30 jours + journal de suivi',
              'BONUS : grille photos & mesures + FAQ',
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#218C4F] text-xs text-white">✓</span>
                <span className="text-[14px] text-gray-700">{t}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm italic text-gray-500">Le tout dans un seul guide numerique, a {fmt(PRICE)} au lieu de {fmt(OLD_PRICE)}.</p>
          <div className="mx-auto mt-6 max-w-sm"><CTA onClick={openModal}>Je veux le guide complet</CTA></div>
        </Section>
      </div>

      {/* PROGRAMMES */}
      <Section className="!py-10">
        <h2 className="text-center text-2xl font-black text-[#126B3A] sm:text-3xl">Un programme pour chaque profil</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            { img: MEDIA.men, t: 'Hommes : tempes & couronne', d: 'Une routine reguliere pour les zones clairsemees.' },
            { img: MEDIA.women, t: 'Femmes : longueur & casse', d: 'Demelage doux, coiffures protectrices, tempes preservees.' },
            { img: MEDIA.beard, t: 'Barbe : souplesse & entretien', d: 'Une barbe plus douce et mieux disciplinee.' },
          ].map((p) => (
            <div key={p.t} className="overflow-hidden rounded-2xl border border-[#F0E6CF] bg-white shadow-sm">
              <img src={optimImg(p.img, 600)} srcSet={optimImgSrcSet(p.img, [400, 600])} sizes="(min-width: 768px) 33vw, 100vw" alt={p.t} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              <div className="p-5">
                <h3 className="font-black text-[#126B3A]">{p.t}</h3>
                <p className="mt-1 text-[13px] text-gray-600">{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* TEMOIGNAGES */}
      <div className="bg-[#FFF9ED]">
        <Section className="!py-10">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#126B3A] sm:text-3xl">Ils suivent enfin une routine</h2>
            <p className="mt-2"><Stars n={5} /> <span className="font-bold text-[#126B3A]">4.9/5</span></p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-xl border-t-4 border-[#218C4F] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#218C4F] to-[#E9A900] font-black text-white">{t.name[0]}</span>
                  <div>
                    <strong className="block text-sm">{t.name}</strong>
                    <span className="text-xs text-gray-400">{t.city}</span>
                  </div>
                  <span className="ml-auto text-[#218C4F]">✔</span>
                </div>
                <div className="mt-2 text-sm"><Stars n={t.stars} /></div>
                <blockquote className="mt-1 text-[14px] italic text-gray-600">{t.text}</blockquote>
              </figure>
            ))}
          </div>
        </Section>
      </div>

      {/* FAQ */}
      <Section className="!py-10">
        <h2 className="text-center text-2xl font-black text-[#126B3A] sm:text-3xl">Questions frequentes</h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-xl border border-[#EEE2C7] bg-white p-4 shadow-sm">
              <summary className="cursor-pointer font-bold text-[#126B3A]">{f.q}</summary>
              <p className="mt-2 text-[14px] text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA FINAL */}
      <div className="bg-gradient-to-br from-[#D63C32] to-[#A92520] text-white">
        <Section className="text-center !py-12">
          <h2 className="text-2xl font-black sm:text-3xl">Arretez d'acheter. Fabriquez enfin ce qui marche.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-white/90">Acces immediat, a vie, sur telephone, tablette et ordinateur.</p>
          <div className="mx-auto mt-6 max-w-sm">
            <button
              type="button"
              onClick={openModal}
              className="w-full rounded-full bg-gradient-to-r from-[#F7C948] to-[#E9A900] px-6 py-4 text-[15px] font-black uppercase tracking-wide text-[#A92520] shadow-lg transition hover:brightness-105"
            >
              Obtenir le guide · {fmt(PRICE)}
            </button>
          </div>
        </Section>
      </div>

      {/* DISCLAIMER */}
      <footer className="mx-auto max-w-3xl px-4 py-8 text-center text-[12px] text-gray-500">
        <p>Ce guide est educatif et ne remplace pas un diagnostic medical. Les resultats varient selon la cause de la chute, la regularite, la genetique et l'etat du follicule. Consultez un dermatologue en cas de chute brutale, de plaques rondes, de douleurs, de pus, de croutes ou de zones lisses et brillantes.</p>
        <p className="mt-2">© 2026 · Guide Pousse Naturelle</p>
      </footer>

      {/* Bouton collant — visible des l'arrivee (mobile + desktop) */}
      {!modal && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#F0E6CF] bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="hidden shrink-0 leading-none sm:block">
              <div className="text-lg font-black text-[#126B3A]">{fmt(PRICE)}</div>
              <div className="text-[11px] text-gray-400 line-through">{fmt(OLD_PRICE)}</div>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="w-full rounded-full bg-gradient-to-r from-[#E9A900] to-[#D63C32] py-3.5 text-[15px] font-black uppercase text-white shadow-lg transition hover:brightness-105"
            >
              Obtenir le guide · {fmt(PRICE)}
            </button>
          </div>
        </div>
      )}

      {/* MODAL de commande (produit digital : nom, email, telephone) */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => !sending && setModal(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#126B3A]">Finaliser mon achat</h3>
              <button type="button" onClick={() => !sending && setModal(false)} className="text-2xl leading-none text-gray-400 hover:text-gray-600" aria-label="Fermer">×</button>
            </div>
            <div className="mb-4 flex items-center justify-between rounded-lg bg-[#FFF9ED] px-4 py-3">
              <span className="text-sm font-bold text-gray-700">Guide Pousse Naturelle (PDF)</span>
              <span className="text-lg font-black text-[#126B3A]">{fmt(PRICE)}</span>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                type="text" required placeholder="Votre nom complet" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#218C4F] focus:ring-2 focus:ring-[#218C4F]/20"
              />
              <input
                type="email" required placeholder="Votre email (recevra l'acces)" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#218C4F] focus:ring-2 focus:ring-[#218C4F]/20"
              />
              <div className="flex gap-2">
                <select
                  aria-label="Indicatif pays"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-[44%] rounded-xl border border-gray-200 bg-white px-2 py-3 text-sm outline-none focus:border-[#218C4F] focus:ring-2 focus:ring-[#218C4F]/20"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.dial} · {c.name}</option>
                  ))}
                </select>
                <input
                  type="tel" required placeholder="Numéro (sans l'indicatif)" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#218C4F] focus:ring-2 focus:ring-[#218C4F]/20"
                />
              </div>
              <p className="text-[11px] text-gray-400">Choisissez votre pays : le paiement affichera les moyens disponibles chez vous (Mobile Money, carte…).</p>

              {formErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{formErr}</p>}

              <button
                type="submit" disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E9A900] to-[#D63C32] py-4 text-[15px] font-black uppercase text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
              >
                {sending ? 'Redirection…' : `Payer ${fmt(PRICE)}`}
              </button>
              <p className="text-center text-[11px] text-gray-400">🔒 Paiement securise par Chariow · Mobile Money & carte. Aucune donnee de carte sur ce site.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
