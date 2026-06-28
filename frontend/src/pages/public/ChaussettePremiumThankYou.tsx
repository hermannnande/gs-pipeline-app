/**
 * Page de remerciement — Chaussettes Premium Homme (slug chaussette-premium-homme).
 * Palette premium bleu marine / noir / or. Mapping CHAUSSETTE_HOMME_MODLE2.
 *
 * Pas de pixel dedie initialise (aucun ID fourni) : on relaie un evenement
 * Purchase / ThankYouPage a fbq / ttq / dataLayer SI deja installes.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const PRODUCT_CODE = 'CHAUSSETTE_HOMME_MODLE2';
const CONTENT_NAME = 'Chaussettes Premium Homme';

declare global { interface Window { fbq?: any; ttq?: any; dataLayer?: any[] } }

export default function ChaussettePremiumThankYou() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const qtyRaw = parseInt(params.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const value = PRICES[qty] || PRICES[1];
  const totalPaires = qty * 5;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = 'Merci pour votre commande — Chaussettes Premium Homme';
  }, []);

  useEffect(() => {
    const sessionKey = ref ? `cph_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'ThankYouPage', product: PRODUCT_CODE, value, currency: 'XOF', num_items: qty, order_id: ref || undefined });
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', { content_name: CONTENT_NAME, content_ids: [PRODUCT_CODE], content_type: 'product', value, currency: 'XOF', num_items: qty }, ref ? { eventID: ref } : undefined);
      }
      if (typeof window.ttq?.track === 'function') {
        window.ttq.track('CompletePayment', { content_id: PRODUCT_CODE, value, currency: 'XOF', quantity: qty });
      }
      if (sessionKey) sessionStorage.setItem(sessionKey, '1');
    } catch { /* noop */ }
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [ref, qty, value]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0e16] text-white antialiased" style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
      <div className="bg-gradient-to-r from-[#0a1f44] via-[#060b16] to-[#0a1f44] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white sm:text-[11px]">
        <span className="text-amber-300">Commande confirmée</span><span className="mx-2 opacity-50">·</span><span>Côte d'Ivoire</span>
      </div>

      <main className="relative overflow-hidden px-4 pb-16 pt-12 sm:pb-24 sm:pt-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[460px] w-[460px] rounded-full bg-[#5b9bd5]/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-[460px] w-[460px] rounded-full bg-amber-400/15 blur-[120px]" />

        <div className="relative mx-auto w-full max-w-[640px]">
          <div className="relative overflow-hidden rounded-[32px] border border-amber-300/30 bg-gradient-to-b from-[#0b2350]/60 to-[#060b16] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500" />

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-[0_15px_40px_-10px_rgba(212,175,55,.6)]">
              <svg className="h-9 w-9 text-slate-950" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>

            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-amber-300 ring-1 ring-amber-300/30">Commande confirmée</span>
              <h1 className="mt-4 text-[30px] font-black leading-[1.05] tracking-tight sm:text-[38px]">Merci pour votre <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">commande</span> !</h1>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-300 sm:text-[15px]">
                Votre demande a bien été reçue. Notre équipe vous contactera <strong className="font-bold text-white">rapidement</strong> pour confirmer votre commande et organiser la livraison.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">Récapitulatif</p>
              <div className="mt-3 space-y-2 text-[13px]">
                <div className="flex items-center justify-between"><span className="text-slate-400">Produit</span><span className="font-bold text-white">{CONTENT_NAME}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Pack</span><span className="font-bold text-white">{qty} pack{qty > 1 ? 's' : ''} · {totalPaires} paires</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Prix</span><span className="font-black text-amber-300">{value.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ')} F</span></div>
                {ref && <div className="flex items-center justify-between border-t border-white/10 pt-2"><span className="text-slate-400">N° commande</span><span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white">{ref}</span></div>}
                <p className="pt-1 text-[10px] text-slate-500">Confirmée le {now.toLocaleDateString('fr-FR')} à {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3 text-center">
              <p className="text-[12px] font-bold text-amber-200">📞 Gardez votre téléphone disponible, notre équipe peut vous appeler rapidement.</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-[10px]">
              {[{ i: '📞', t: 'Confirmation par appel' }, { i: '🚚', t: 'Livraison rapide' }, { i: '💵', t: 'Paiement à la livraison' }].map((b) => (
                <div key={b.t} className="flex flex-col items-center gap-1 rounded-lg bg-white/5 px-2 py-2 font-bold text-slate-200"><span className="text-base">{b.i}</span><span className="text-center">{b.t}</span></div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link to="/chaussette-premium-homme" className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-center text-[12px] font-black uppercase tracking-wider text-white transition hover:bg-white/10">Retour au produit</Link>
              <Link to="/boutique" className="flex-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-5 py-3 text-center text-[12px] font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:scale-[1.02]">Retour à la boutique</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
