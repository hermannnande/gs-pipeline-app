/**
 * Page merci — Crème anti-verrues bleue TikTok (slug creme-anti-verrue-bleu-tk).
 * Produit CREME_ANTI_VERRUE_BLEU_TK · pas de pixel Meta (campagnes TikTok).
 */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { orderTotal } from '../../utils/pricingHelpers';

const SLUG = 'creme-anti-verrue-bleu-tk';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };

export default function CremeAntiVerrueBleuTkThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';
  const qty = [1, 2, 3].includes(parseInt(q.get('qty') || '1', 10)) ? parseInt(q.get('qty') || '1', 10) : 1;

  useEffect(() => { document.title = 'Merci — Crème anti-verrues'; }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-white to-blue-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl">✓</div>
          <h1 className="text-xl font-extrabold">Commande envoyée</h1>
          <p className="mt-1.5 text-[13px] text-sky-200">Votre crème anti-verrues est bien enregistrée.</p>
        </div>
        <div className="space-y-4 p-5">
          {ref && (
            <div className="rounded-xl bg-sky-50 p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-sky-500">Référence</p>
              <p className="font-mono text-sm font-bold">{ref.slice(0, 12).toUpperCase()}</p>
            </div>
          )}
          <p className="text-center text-[12px] text-neutral-600">
            Montant : <span className="font-bold">{orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ')} F</span>
          </p>
          <p className="text-center text-[12px] text-neutral-600">Un conseiller vous appelle pour confirmer avant livraison.</p>
          <Link
            to={`/${SLUG}?company=${encodeURIComponent(company)}`}
            className="block rounded-xl bg-gradient-to-r from-blue-900 to-sky-700 py-3 text-center text-[12px] font-black uppercase text-white"
          >
            Retour au produit
          </Link>
        </div>
      </div>
    </div>
  );
}
