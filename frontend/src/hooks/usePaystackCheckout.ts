/**
 * Hook de checkout Paystack pour le paiement Mobile Money + Carte en ligne.
 *
 * Remplace `useChariowCheckout`. 2 flux disponibles :
 *
 *   1) chargeMobileMoney(data) - Mobile Money DIRECT (recommande pour CIV)
 *      Le client ne quitte JAMAIS la landing. Apres POST, le hook expose un
 *      etat "awaiting" avec polling auto vers /api/paystack/charge/:ref pour
 *      detecter quand le client a valide sur son telephone.
 *
 *      Etats : 'idle' | 'creating' | 'awaiting' | 'success' | 'failed' | 'timeout'
 *
 *   2) redirectToCard(data) - Cards / fallback (FLUX REDIRECT)
 *      Genere une authorization_url Paystack et redirige le navigateur. Le
 *      client revient ensuite sur la page merci.
 *
 * Apres paiement reussi (status=success) :
 *   - Mobile Money : navigate vers /<slug>/merci?ref=<ref>
 *   - Carte : Paystack redirige automatiquement (callback_url defini cote backend)
 *
 * Architecture cote backend :
 *   POST /api/paystack/charge          -> Mobile Money direct
 *   POST /api/paystack/init-transaction -> Carte/Redirect
 *   GET  /api/paystack/charge/:ref      -> Polling
 *   POST /api/paystack/submit-otp       -> Si Paystack demande un OTP
 *   POST /api/paystack/webhook          -> Confirme + cree commande obgestion
 *   GET  /api/paystack/verify/:ref      -> Filet de securite cote serveur
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

declare global {
  interface Window { fbq?: (...args: any[]) => void; }
}

export type MobileMoneyProvider = 'wave' | 'orange' | 'mtn';

export type PaystackChargeStatus =
  | 'idle'         // initial
  | 'creating'     // POST /charge en cours
  | 'awaiting'     // pay_offline -> client doit valider sur son telephone
  | 'pending'      // pending -> on continue le polling
  | 'send_otp'     // OTP demande (rare en MM, frequent en cards)
  | 'success'      // paiement valide
  | 'failed'       // refuse / annule
  | 'timeout';     // expire (180s ecoulees sans validation)

export interface PaystackCheckoutData {
  slug: string;
  qty: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  /** Operateur Mobile Money choisi par le client (Mobile Money flux uniquement) */
  provider?: MobileMoneyProvider;
  /** Montant XOF a debiter (deja avec -10% applique au choix) */
  displayedAmount: number;
}

export interface PaystackCheckoutConfig {
  slug: string;
  productCode: string;
  title: string;
  metaPixelId?: string;
  prices: Record<number, number>;
}

export interface UsePaystackCheckoutParams {
  cfg: PaystackCheckoutConfig | null;
  company?: string;
  /**
   * URL ou pousser le client apres succes Mobile Money (defaut : /<slug>/merci).
   * On peut overrider pour des cas particuliers.
   */
  successUrlBuilder?: (reference: string) => string;
  /** Polling : interval en ms (defaut 4000) */
  pollIntervalMs?: number;
  /** Polling : timeout total en ms (defaut 200_000 = 3min20, marge sur les 180s Paystack) */
  pollTimeoutMs?: number;
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
  if (status >= 500) return 'Serveur Paystack indisponible. Reessayez dans un instant.';
  if (status === 429) return 'Trop de tentatives. Patientez quelques secondes.';
  if (status === 422 || status === 400) {
    return err?.response?.data?.error || 'Donnees invalides. Verifiez et reessayez.';
  }
  if (status === 401) return 'Service de paiement non configure. Contactez le support.';
  return fallback;
}

function trackInitiateCheckout(cfg: PaystackCheckoutConfig | null, qty: number, displayedAmount: number) {
  if (!cfg?.metaPixelId || !window.fbq) return;
  try {
    window.fbq('track', 'InitiateCheckout', {
      content_name: cfg.title,
      content_ids: [cfg.productCode],
      content_type: 'product',
      value: displayedAmount || cfg.prices?.[qty] || 0,
      currency: 'XOF',
      num_items: qty,
    });
  } catch (pxErr) {
    console.warn('[paystack] Meta Pixel track non bloquant:', pxErr);
  }
}

export function usePaystackCheckout({
  cfg,
  company: companyParam,
  successUrlBuilder,
  pollIntervalMs = 4000,
  pollTimeoutMs = 200_000,
}: UsePaystackCheckoutParams) {
  const [status, setStatus] = useState<PaystackChargeStatus>('idle');
  const [reference, setReference] = useState<string>('');
  const [displayText, setDisplayText] = useState<string>('');
  const [formErr, setFormErr] = useState<string>('');

  const pollTimerRef = useRef<number | null>(null);
  const pollDeadlineRef = useRef<number>(0);
  const company = companyParam || new URLSearchParams(window.location.search).get('company') || 'ci';

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const onSuccess = useCallback((ref: string) => {
    stopPolling();
    setStatus('success');
    if (cfg) {
      // Tracking Meta Pixel : Purchase est gere par la page merci (avec eventID
      // dedup). Ici on redirige juste.
      const targetUrl = successUrlBuilder
        ? successUrlBuilder(ref)
        : `/${cfg.slug}/merci?company=${encodeURIComponent(company)}&ref=${encodeURIComponent(ref)}`;
      window.location.href = targetUrl;
    }
  }, [cfg, company, stopPolling, successUrlBuilder]);

  const pollChargeStatus = useCallback(async (ref: string) => {
    if (Date.now() > pollDeadlineRef.current) {
      stopPolling();
      setStatus('timeout');
      setFormErr('Le delai de 3 minutes est ecoule. Le paiement n\'a pas ete valide. Reessayez.');
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/paystack/charge/${encodeURIComponent(ref)}`, { timeout: 12000 });
      const s = res.data?.status as string | undefined;
      const display = res.data?.display_text || res.data?.message;
      if (display) setDisplayText(String(display));

      if (s === 'success') {
        onSuccess(ref);
        return;
      }
      if (s === 'failed' || s === 'timeout' || s === 'reversed') {
        stopPolling();
        setStatus('failed');
        setFormErr(res.data?.message || 'Le paiement a echoue. Reessayez.');
        return;
      }
      if (s === 'send_otp') {
        // Le frontend doit afficher un input OTP. On expose le state, le composant
        // appellera submitOtp() apres saisie.
        stopPolling();
        setStatus('send_otp');
        return;
      }
      // pay_offline / pending / processing -> on continue le polling
      pollTimerRef.current = window.setTimeout(() => pollChargeStatus(ref), pollIntervalMs);
    } catch (pollErr) {
      // Erreur reseau ponctuelle : on reessaie une fois apres delai
      console.warn('[paystack] poll erreur, retry...', pollErr);
      pollTimerRef.current = window.setTimeout(() => pollChargeStatus(ref), pollIntervalMs);
    }
  }, [onSuccess, pollIntervalMs, stopPolling]);

  const startPolling = useCallback((ref: string) => {
    stopPolling();
    pollDeadlineRef.current = Date.now() + pollTimeoutMs;
    pollTimerRef.current = window.setTimeout(() => pollChargeStatus(ref), pollIntervalMs);
  }, [pollChargeStatus, pollIntervalMs, pollTimeoutMs, stopPolling]);

  // ============================================================================
  // FLUX 1 : MOBILE MONEY DIRECT
  // ============================================================================
  const chargeMobileMoney = useCallback(async (data: PaystackCheckoutData): Promise<boolean> => {
    setFormErr('');
    if (!cfg) { setFormErr('Configuration manquante. Rechargez la page.'); return false; }
    if (!data.customerName.trim()) { setFormErr('Entrez votre nom complet.'); return false; }
    if (!data.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail.trim())) {
      setFormErr('Email invalide. Verifiez et reessayez.');
      return false;
    }
    if (!data.customerCity.trim()) { setFormErr('Entrez votre ville / commune.'); return false; }
    if (!data.customerPhone.trim()) { setFormErr('Entrez votre numero de telephone.'); return false; }
    if (!data.provider) { setFormErr('Choisissez votre operateur (Wave, Orange ou MTN).'); return false; }

    setStatus('creating');
    trackInitiateCheckout(cfg, data.qty, data.displayedAmount);

    const payload = {
      company,
      slug: data.slug,
      qty: data.qty,
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.trim().toLowerCase(),
      customerPhone: data.customerPhone.trim(),
      customerCity: data.customerCity.trim(),
      provider: data.provider,
      productName: cfg.title,
      fbc: getCookie('_fbc') || undefined,
      fbp: getCookie('_fbp') || undefined,
      sourceUrl: window.location.href,
      metaPixelId: cfg.metaPixelId || undefined,
      displayedAmount: data.displayedAmount,
    };

    try {
      const res = await axios.post(`${API_URL}/paystack/charge`, payload, { timeout: 25000 });
      const ref: string = res.data?.reference;
      const initialStatus: string = res.data?.status;
      const display: string = res.data?.display_text || '';

      if (!ref) {
        setStatus('failed');
        setFormErr('Reponse Paystack invalide. Contactez le support.');
        return false;
      }

      setReference(ref);
      setDisplayText(display);

      if (initialStatus === 'success') {
        // Cas tres rare mais possible (carte tokenisee, pre-auth, etc.)
        onSuccess(ref);
        return true;
      }
      if (initialStatus === 'failed' || initialStatus === 'timeout') {
        setStatus('failed');
        setFormErr(display || 'Le paiement a echoue. Reessayez.');
        return false;
      }
      if (initialStatus === 'send_otp') {
        setStatus('send_otp');
        return true;
      }

      // pay_offline / pending -> on attend la validation telephone + on poll
      setStatus('awaiting');
      startPolling(ref);
      return true;
    } catch (err: any) {
      console.error('[paystack] /charge erreur:', err?.response?.data || err?.message);
      setStatus('failed');
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      setFormErr(apiMsg || formatNetworkError(err, 'Echec du paiement. Reessayez.'));
      return false;
    }
  }, [cfg, company, onSuccess, startPolling]);

  // ============================================================================
  // FLUX 2 : REDIRECT (cards / fallback toutes methodes)
  // ============================================================================
  const redirectToCard = useCallback(async (data: PaystackCheckoutData): Promise<boolean> => {
    setFormErr('');
    if (!cfg) { setFormErr('Configuration manquante. Rechargez la page.'); return false; }
    if (!data.customerName.trim()) { setFormErr('Entrez votre nom complet.'); return false; }
    if (!data.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail.trim())) {
      setFormErr('Email invalide. Verifiez et reessayez.');
      return false;
    }

    setStatus('creating');
    trackInitiateCheckout(cfg, data.qty, data.displayedAmount);

    const payload = {
      company,
      slug: data.slug,
      qty: data.qty,
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.trim().toLowerCase(),
      customerPhone: data.customerPhone.trim(),
      customerCity: data.customerCity.trim(),
      productName: cfg.title,
      fbc: getCookie('_fbc') || undefined,
      fbp: getCookie('_fbp') || undefined,
      sourceUrl: window.location.href,
      metaPixelId: cfg.metaPixelId || undefined,
      displayedAmount: data.displayedAmount,
      channels: ['card'], // force la carte
    };

    try {
      const res = await axios.post(`${API_URL}/paystack/init-transaction`, payload, { timeout: 25000 });
      const url: string | undefined = res.data?.authorization_url;
      if (!url) {
        setStatus('failed');
        setFormErr('Erreur Paystack : URL de paiement manquante.');
        return false;
      }
      window.location.href = url; // bye bye, on quitte la landing
      return true;
    } catch (err: any) {
      console.error('[paystack] /init-transaction erreur:', err?.response?.data || err?.message);
      setStatus('failed');
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      setFormErr(apiMsg || formatNetworkError(err, 'Echec de la redirection vers Paystack. Reessayez.'));
      return false;
    }
  }, [cfg, company]);

  // ============================================================================
  // FLUX 3 : SOUMISSION D'UN OTP (si Paystack en demande un)
  // ============================================================================
  const submitOtp = useCallback(async (otp: string): Promise<boolean> => {
    if (!reference) {
      setFormErr('Aucune transaction en cours.');
      return false;
    }
    setFormErr('');
    setStatus('creating');
    try {
      const res = await axios.post(`${API_URL}/paystack/submit-otp`, {
        reference,
        otp: otp.trim(),
      }, { timeout: 25000 });
      const s: string = res.data?.status;
      if (s === 'success') {
        onSuccess(reference);
        return true;
      }
      if (s === 'pay_offline' || s === 'pending') {
        setStatus('awaiting');
        startPolling(reference);
        return true;
      }
      setStatus('failed');
      setFormErr(res.data?.message || 'OTP invalide ou paiement refuse.');
      return false;
    } catch (err: any) {
      setStatus('failed');
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      setFormErr(apiMsg || formatNetworkError(err, 'Echec de la verification OTP.'));
      return false;
    }
  }, [reference, onSuccess, startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setReference('');
    setDisplayText('');
    setFormErr('');
  }, [stopPolling]);

  return {
    chargeMobileMoney,
    redirectToCard,
    submitOtp,
    reset,
    status,
    reference,
    displayText,
    formErr,
    setFormErr,
    sending: status === 'creating' || status === 'awaiting' || status === 'pending',
  };
}
