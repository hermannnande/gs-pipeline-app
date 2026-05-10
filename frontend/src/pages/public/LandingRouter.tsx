import { Component, useEffect, useState } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import axios from 'axios';
import DynamicLanding from './DynamicLanding';
import DynamicLandingV2 from './DynamicLandingV2';
import CoffretBoxerLanding from './CoffretBoxerLanding';
import CremeAntiVerrueLanding from './CremeAntiVerrueLanding';
import PatchDouleurTkLanding from './PatchDouleurTkLanding';
import PatchDouleurFbLanding from './PatchDouleurFbLanding';
import CremeVerrueTkLanding from './CremeVerrueTkLanding';
import CremeVerrueTk2Landing from './CremeVerrueTk2Landing';
import SprayDouleurTkLanding from './SprayDouleurTkLanding';
import SprayLipomeLanding from './SprayLipomeLanding';
import SprayLipomeTkLanding from './SprayLipomeTkLanding';
import CremeAntiLipomeLanding from './CremeAntiLipomeLanding';
import ChaussetteHommeLanding from './ChaussetteHommeLanding';
import CremeAntiCerneLanding from './CremeAntiCerneLanding';
import SerumCerneLanding from './SerumCerneLanding';
import SerumCerneTkLanding from './SerumCerneTkLanding';
import SerumCernePayeLanding from './SerumCernePayeLanding';
import PoudrePousseCheveuxLanding from './PoudrePousseCheveuxLanding';
import BoutiqueLanding from './BoutiqueLanding';
import { useLandingSlug } from '../../hooks/useLandingSlug';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(err: Error) { return { error: err.message + '\n' + err.stack }; }
  componentDidCatch(err: Error, info: ErrorInfo) { console.error('LandingRouter crash:', err, info); }
  render() {
    if (this.state.error) return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-8">
        <div className="max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-2 text-lg font-bold text-red-600">Erreur de chargement</h2>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs text-neutral-600">{this.state.error}</pre>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-neutral-900 px-6 py-2 text-sm font-bold text-white">Recharger</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

export default function LandingRouter() {
  const slug = useLandingSlug();
  const [version, setVersion] = useState<number | null>(null);

  useEffect(() => {
    // Landings autonomes : zero call API template
    if (!slug || slug === 'coffret-boxer-homme' || slug === 'creme-anti-verrue' || slug === 'patchdouleurtk' || slug === 'patchdouleurfb' || slug === 'creme-verrue-tk' || slug === 'creme-verrue-tk2' || slug === 'spraydouleurtk' || slug === 'spraylipome' || slug === 'spraylipometk' || slug === 'creme-anti-lipome' || slug === 'chaussette-homme' || slug === 'creme-anti-cerne' || slug === 'serum-cerne' || slug === 'serum-cerne-tk' || slug === 'serum-cerne-paye' || slug === 'poudre-pousse-cheveux' || slug === 'boutique') return;
    axios.get(`${API_URL}/templates/public/${slug}`)
      .then(r => {
        try {
          const cfg = JSON.parse(r.data.template.config);
          setVersion(cfg.templateVersion === 2 ? 2 : 1);
        } catch { setVersion(1); }
      })
      .catch(() => setVersion(1));

    // Warmup non bloquant : on prefetch /public/products des l'arrivee sur
    // la landing pour que la connexion + le cache navigateur soient deja
    // chauds au moment ou l'utilisateur clique "Commander". Le proxy VPS
    // est configure pour renvoyer Cache-Control: public, max-age=300.
    const company = new URLSearchParams(window.location.search).get('company') || 'ci';
    setTimeout(() => {
      axios.get(`${API_URL}/public/products`, {
        params: { company },
        timeout: 20000,
      }).catch(() => { /* warmup silent */ });
    }, 800);
  }, [slug]);

  if (slug === 'coffret-boxer-homme') {
    return (
      <ErrorBoundary>
        <CoffretBoxerLanding />
      </ErrorBoundary>
    );
  }

  // Landing ultra-premium dediee, routee avant l'appel /templates/public pour
  // un time-to-first-paint instantane (pas de spinner pendant le fetch API).
  if (slug === 'creme-anti-verrue') {
    return (
      <ErrorBoundary>
        <CremeAntiVerrueLanding />
      </ErrorBoundary>
    );
  }

  // Landing patch anti-douleur TK — palette obsidian/cyan/corail (medical premium)
  if (slug === 'patchdouleurtk') {
    return (
      <ErrorBoundary>
        <PatchDouleurTkLanding />
      </ErrorBoundary>
    );
  }

  // Landing patch anti-douleur FB — meme design, productCode PATCH_DOULEUR_FB pour
  // separer le tracking commandes Facebook ads vs autres canaux.
  if (slug === 'patchdouleurfb') {
    return (
      <ErrorBoundary>
        <PatchDouleurFbLanding />
      </ErrorBoundary>
    );
  }

  // Landing creme verrue TK — palette teal/emerald/cyan (dermatologique naturel)
  if (slug === 'creme-verrue-tk') {
    return (
      <ErrorBoundary>
        <CremeVerrueTkLanding />
      </ErrorBoundary>
    );
  }

  // Landing duplicate creme verrue TK V2 — meme design, mapping CREME_ANTI_VERRUES2
  // pour campagnes pub TIKTOK ADS avec tracking de conversion separe par URL.
  if (slug === 'creme-verrue-tk2') {
    return (
      <ErrorBoundary>
        <CremeVerrueTk2Landing />
      </ErrorBoundary>
    );
  }

  // Landing spray anti-douleur TK — palette lime/noir + jaune urgence (sport moderne)
  if (slug === 'spraydouleurtk') {
    return (
      <ErrorBoundary>
        <SprayDouleurTkLanding />
      </ErrorBoundary>
    );
  }

  // Landing spray anti-lipome — palette pourpre/magenta/or rose (cosmetique luxe)
  if (slug === 'spraylipome') {
    return (
      <ErrorBoundary>
        <SprayLipomeLanding />
      </ErrorBoundary>
    );
  }

  // Landing duplicate spray anti-lipome TK (meme design, mapping LIPOME_SPRAY_TK)
  if (slug === 'spraylipometk') {
    return (
      <ErrorBoundary>
        <SprayLipomeTkLanding />
      </ErrorBoundary>
    );
  }

  // Landing creme anti-lipome — palette VERT EMERAUDE / LIME / FORET (couleur du produit),
  // disposition tunnel "1 fiche = 1 micro-texte + 1 media + 1 CTA fluide", mapping CREME_ANTI_LIPOME.
  if (slug === 'creme-anti-lipome') {
    return (
      <ErrorBoundary>
        <CremeAntiLipomeLanding />
      </ErrorBoundary>
    );
  }

  // Landing chaussettes homme luxe — palette NOIR + OR + IVOIRE (responsable),
  // disposition magazine GQ, mapping CHAUSSETTE_HOMME, pack 5/10/15 paires.
  if (slug === 'chaussette-homme') {
    return (
      <ErrorBoundary>
        <ChaussetteHommeLanding />
      </ErrorBoundary>
    );
  }

  // Landing crème contour des yeux anti-cernes — palette PREMIUM blanc/rouge,
  // disposition tunnel "1 média + texte court + CTA fluide", mapping CREME_ANTI_CERNE.
  if (slug === 'creme-anti-cerne') {
    return (
      <ErrorBoundary>
        <CremeAntiCerneLanding />
      </ErrorBoundary>
    );
  }

  // Landing serum anti-cernes — palette navy/or/corail (editorial beauty premium)
  if (slug === 'serum-cerne') {
    return (
      <ErrorBoundary>
        <SerumCerneLanding />
      </ErrorBoundary>
    );
  }

  // Landing duplicate serum anti-cernes TK (meme design, mapping SERUM_CERNE_TK)
  if (slug === 'serum-cerne-tk') {
    return (
      <ErrorBoundary>
        <SerumCerneTkLanding />
      </ErrorBoundary>
    );
  }

  // Landing duplicate serum anti-cernes PAYE (meme design + paiement Mobile Money
  // via Chariow en option, avec -10% / livraison gratuite / express 2h)
  if (slug === 'serum-cerne-paye') {
    return (
      <ErrorBoundary>
        <SerumCernePayeLanding />
      </ErrorBoundary>
    );
  }

  // Landing poudre ultra pousse cheveux — palette emeraude/or rose/ivoire/bronze (luxe nature)
  if (slug === 'poudre-pousse-cheveux') {
    return (
      <ErrorBoundary>
        <PoudrePousseCheveuxLanding />
      </ErrorBoundary>
    );
  }

  // Page Boutique — catalogue central qui regroupe toutes les landings produits.
  // Au clic sur une carte, redirection full-reload vers /<slug> du produit (pour
  // declencher le tracking PageView et beneficier du first-paint optimise).
  if (slug === 'boutique') {
    return (
      <ErrorBoundary>
        <BoutiqueLanding />
      </ErrorBoundary>
    );
  }

  if (version === null) return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-teal-600"/>
    </div>
  );

  return (
    <ErrorBoundary>
      {version === 2 ? <DynamicLandingV2 /> : <DynamicLanding />}
    </ErrorBoundary>
  );
}
