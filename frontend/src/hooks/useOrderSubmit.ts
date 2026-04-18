/**
 * Hook partage pour la soumission de commande.
 *
 * Centralise la logique commune a tous les modaux de commande :
 *   - validation des champs (nom, ville, telephone)
 *   - resolution du produit (par code) si pas deja fourni
 *   - tracking Meta Pixel (AddToCart au open, InitiateCheckout au submit)
 *   - envoi POST /public/order avec fbc/fbp pour CAPI server-side
 *   - redirection vers la page merci avec query params (company, ref, qty)
 *
 * Permet a chaque produit d'avoir son propre composant modal avec un design
 * totalement custom, sans dupliquer la logique metier.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

declare global {
  interface Window { fbq?: (...args: any[]) => void; }
}

function getCookie(n: string): string | null {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${n}=`);
  return p.length === 2 ? p.pop()!.split(';').shift() || null : null;
}

// Format un message lisible pour l'utilisateur en fonction du type d'erreur axios.
// Differencie : pas de connexion, timeout, erreur serveur, erreur HTTP avec body.
function formatNetworkError(err: any, fallback: string): string {
  if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
    return 'Le serveur met trop de temps a repondre. Reessayez.';
  }
  if (err?.message === 'Network Error' || !err?.response) {
    return 'Probleme de connexion. Verifiez votre Internet et reessayez.';
  }
  const status = err?.response?.status;
  if (status >= 500) return 'Serveur indisponible. Reessayez dans un instant.';
  if (status === 429) return 'Trop de tentatives. Patientez quelques secondes.';
  return fallback;
}

// POST avec retry automatique : si echec network/5xx, on retente une fois
// apres 800ms (suffisant pour un cold start Vercel ou une perte momentanee).
async function postOrderWithRetry(payload: any, retries = 1): Promise<any> {
  try {
    return await axios.post(`${API_URL}/public/order`, payload, { timeout: 15000 });
  } catch (err: any) {
    const isRetriable =
      retries > 0 &&
      (err?.code === 'ECONNABORTED' ||
        err?.message === 'Network Error' ||
        !err?.response ||
        (err?.response?.status >= 500 && err?.response?.status < 600));
    if (!isRetriable) throw err;
    console.warn('[order] POST retry apres erreur:', err?.message);
    await new Promise((r) => setTimeout(r, 800));
    return postOrderWithRetry(payload, retries - 1);
  }
}

export interface OrderProduct {
  id: number;
  code: string;
  nom?: string;
}

export interface OrderSubmitConfig {
  slug: string;
  productCode: string;
  title: string;
  prices: Record<number, number>;
  metaPixelId?: string;
  thankYouUrl?: string;
}

export interface OrderFormData {
  name: string;
  city: string;
  phone: string;
  qty: number;
}

export interface UseOrderSubmitParams {
  cfg: OrderSubmitConfig | null;
  product: OrderProduct | null;
  // Accepte aussi null pour rester compatible avec un useState<Product | null>
  // du composant parent (Dispatch<SetStateAction<Product | null>>).
  setProduct?: (p: OrderProduct | null) => void;
  company?: string;
}

export function useOrderSubmit({ cfg, product, setProduct, company: companyParam }: UseOrderSubmitParams) {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [formErr, setFormErr] = useState('');

  const company = companyParam || new URLSearchParams(window.location.search).get('company') || 'ci';

  // Track AddToCart quand l'utilisateur ouvre le modal
  const trackOpen = useCallback((qty: number) => {
    if (!cfg?.metaPixelId || !window.fbq) return;
    window.fbq('track', 'AddToCart', {
      content_name: cfg.title,
      content_ids: [cfg.productCode],
      content_type: 'product',
      value: cfg.prices?.[qty] || cfg.prices?.[1] || 0,
      currency: 'XOF',
      num_items: qty,
    });
  }, [cfg]);

  // Soumettre la commande
  const submit = useCallback(async (data: OrderFormData): Promise<boolean> => {
    setFormErr('');
    if (!data.name.trim()) { setFormErr('Entrez votre nom complet.'); return false; }
    if (!data.city.trim()) { setFormErr('Entrez votre ville / commune.'); return false; }
    if (!data.phone.trim()) { setFormErr('Entrez votre numero de telephone.'); return false; }
    if (!cfg) { setFormErr('Configuration manquante. Rechargez la page.'); return false; }
    if (!cfg.productCode) { setFormErr('Produit non configure. Contactez le support.'); return false; }

    setSending(true);

    if (cfg.metaPixelId && window.fbq) {
      try {
        window.fbq('track', 'InitiateCheckout', {
          content_name: cfg.title,
          content_ids: [cfg.productCode],
          content_type: 'product',
          value: cfg.prices?.[data.qty] || cfg.prices?.[1] || 0,
          currency: 'XOF',
          num_items: data.qty,
        });
      } catch (pxErr) {
        console.warn('[order] Meta Pixel track non bloquant:', pxErr);
      }
    }

    // 1. Resoudre le produit (par code) si pas deja en cache
    let prod = product;
    if (!prod) {
      try {
        const r = await axios.get(`${API_URL}/public/products`, {
          params: { company },
          timeout: 12000,
        });
        prod = (r.data?.products || []).find((p: OrderProduct) =>
          p.code?.toUpperCase() === cfg.productCode.toUpperCase()
        ) || null;
        if (prod && setProduct) setProduct(prod);
      } catch (lookupErr: any) {
        console.error('[order] GET /products echec:', lookupErr);
        setFormErr(formatNetworkError(lookupErr, 'Connexion au serveur impossible.'));
        setSending(false);
        return false;
      }
    }
    if (!prod) {
      setFormErr(`Produit "${cfg.productCode}" introuvable. Contactez le support.`);
      setSending(false);
      return false;
    }

    // 2. Envoyer la commande (avec un retry automatique en cas de network glitch)
    const payload = {
      company,
      productId: prod.id,
      customerName: data.name.trim(),
      customerPhone: data.phone.trim(),
      customerCity: data.city.trim(),
      quantity: data.qty,
      fbc: getCookie('_fbc') || undefined,
      fbp: getCookie('_fbp') || undefined,
      sourceUrl: window.location.href,
      metaPixelId: cfg.metaPixelId || undefined,
    };

    try {
      const res = await postOrderWithRetry(payload, 1);
      const ref = res.data?.orderReference || '';
      const thankUrl = cfg.thankYouUrl || `/landing/${cfg.slug}/merci`;
      const p = new URLSearchParams();
      p.set('company', company);
      if (ref) p.set('ref', ref);
      p.set('qty', String(data.qty));
      navigate(`${thankUrl}?${p.toString()}`);
      return true;
    } catch (err: any) {
      console.error('[order] POST /public/order echec:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
        code: err?.code,
        payload,
      });
      const apiMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.response?.data?.message;
      setFormErr(apiMsg || formatNetworkError(err, 'Echec de l\'envoi. Reessayez.'));
      return false;
    } finally {
      setSending(false);
    }
  }, [cfg, product, setProduct, company, navigate]);

  return { submit, sending, formErr, setFormErr, trackOpen };
}
