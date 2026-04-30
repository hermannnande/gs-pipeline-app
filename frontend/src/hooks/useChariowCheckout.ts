/**
 * Hook de checkout Chariow pour le paiement Mobile Money en ligne.
 *
 * Architecture :
 *   1. Le client choisit "Mobile Money" dans le modal de commande.
 *   2. Le frontend POSTe les infos client + slug + qty vers /api/chariow/checkout.
 *   3. Le backend appelle l'API Chariow https://api.chariow.com/v1/checkout
 *      (mapping slug+qty -> chariow_product_id via env vars).
 *   4. Le backend renvoie le checkout_url.
 *   5. Le frontend redirige le navigateur vers cette URL (page paiement Chariow).
 *   6. Apres paiement, Chariow redirige vers /<slug>/merci?ref=<sale_id>.
 *   7. En parallele, Chariow envoie une pulse `successful.sale` au webhook
 *      /api/chariow/webhook qui cree la commande dans obgestion (status NOUVELLE,
 *      modePaiement=CHARIOW_MOBILE_MONEY, montantPaye=total).
 *
 * Avantage : aucun calcul de reduction cote code, le prix Chariow est deja
 * configure -10% directement dans le dashboard Chariow par l'admin.
 */
import { useCallback, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

declare global {
  interface Window { fbq?: (...args: any[]) => void; }
}

export interface ChariowCheckoutData {
  slug: string;
  qty: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  /** Optionnel : valeur affichee au client (pour le tracking InitiateCheckout) */
  displayedAmount?: number;
}

export interface ChariowCheckoutConfig {
  slug: string;
  productCode: string;
  title: string;
  metaPixelId?: string;
  prices: Record<number, number>;
}

export interface UseChariowCheckoutParams {
  cfg: ChariowCheckoutConfig | null;
  company?: string;
}

function getCookie(n: string): string | null {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${n}=`);
  return p.length === 2 ? p.pop()!.split(';').shift() || null : null;
}

function formatNetworkError(err: any, fallback: string): string {
  if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
    return 'Le serveur met trop de temps a repondre. Reessayez.';
  }
  if (err?.message === 'Network Error' || !err?.response) {
    return 'Probleme de connexion. Verifiez votre Internet et reessayez.';
  }
  const status = err?.response?.status;
  if (status >= 500) return 'Serveur Chariow indisponible. Reessayez dans un instant.';
  if (status === 429) return 'Trop de tentatives. Patientez quelques secondes.';
  if (status === 422) return 'Email ou telephone invalide.';
  return fallback;
}

export function useChariowCheckout({ cfg, company: companyParam }: UseChariowCheckoutParams) {
  const [sending, setSending] = useState(false);
  const [formErr, setFormErr] = useState('');

  const company = companyParam || new URLSearchParams(window.location.search).get('company') || 'ci';

  const checkout = useCallback(async (data: ChariowCheckoutData): Promise<boolean> => {
    setFormErr('');
    if (!data.customerName.trim()) { setFormErr('Entrez votre nom complet.'); return false; }
    if (!data.customerEmail.trim()) { setFormErr('Entrez votre email (obligatoire pour le paiement).'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail.trim())) {
      setFormErr('Email invalide. Verifiez et reessayez.');
      return false;
    }
    if (!data.customerCity.trim()) { setFormErr('Entrez votre ville / commune.'); return false; }
    if (!data.customerPhone.trim()) { setFormErr('Entrez votre numero de telephone.'); return false; }
    if (!cfg) { setFormErr('Configuration manquante. Rechargez la page.'); return false; }

    setSending(true);

    // Tracking Meta Pixel : InitiateCheckout (montant affiche au client = -10%)
    if (cfg.metaPixelId && window.fbq) {
      try {
        window.fbq('track', 'InitiateCheckout', {
          content_name: cfg.title,
          content_ids: [cfg.productCode],
          content_type: 'product',
          value: data.displayedAmount || cfg.prices?.[data.qty] || 0,
          currency: 'XOF',
          num_items: data.qty,
        });
      } catch (pxErr) {
        console.warn('[chariow] Meta Pixel track non bloquant:', pxErr);
      }
    }

    const payload = {
      company,
      slug: data.slug,
      qty: data.qty,
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.trim().toLowerCase(),
      customerPhone: data.customerPhone.trim(),
      customerCity: data.customerCity.trim(),
      fbc: getCookie('_fbc') || undefined,
      fbp: getCookie('_fbp') || undefined,
      sourceUrl: window.location.href,
      metaPixelId: cfg.metaPixelId || undefined,
      displayedAmount: data.displayedAmount || cfg.prices?.[data.qty] || 0,
    };

    try {
      const res = await axios.post(`${API_URL}/chariow/checkout`, payload, { timeout: 25000 });
      const checkoutUrl: string | undefined = res.data?.checkout_url;
      if (!checkoutUrl) {
        setFormErr('Erreur Chariow : URL de paiement manquante. Contactez le support.');
        setSending(false);
        return false;
      }
      // Redirection navigateur vers la page de paiement Chariow.
      window.location.href = checkoutUrl;
      return true;
    } catch (err: any) {
      console.error('[chariow] POST /chariow/checkout echec:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
        payload,
      });
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      setFormErr(apiMsg || formatNetworkError(err, 'Echec de la redirection vers Chariow. Reessayez.'));
      setSending(false);
      return false;
    }
  }, [cfg, company]);

  return { checkout, sending, formErr, setFormErr };
}
