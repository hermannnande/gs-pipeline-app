/**
 * Page merci — Bande sport minceur TikTok (slug bande-sport-tk).
 * Produit BANDE_SPORT_MINCEUR_TK · pas de pixel Meta (campagnes TikTok).
 */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { orderTotal } from '../../utils/pricingHelpers';

const SLUG = 'bande-sport-tk';
const PRICES: Record<number, number> = { 1: 7000, 2: 12000, 3: 15000 };

export default function BandeSportTkThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';
  const qty = [1, 2, 3].includes(parseInt(q.get('qty') || '1', 10)) ? parseInt(q.get('qty') || '1', 10) : 1;

  useEffect(() => { document.title = 'Merci — Bande sport minceur'; }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-emerald-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-cyan-700 via-sky-600 to-emerald-600 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl">✓</div>
          <h1 className="text-xl font-extrabold">Commande envoyée</h1>
          <p className="mt-1.5 text-[13px] text-cyan-100">Votre bande sport minceur est bien enregistrée.</p>
        </div>
        <div className="space-y-4 p-5">
          {ref && (
            <div className="rounded-xl bg-sky-50 p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-cyan-600">Référence</p>
              <p className="font-mono text-sm font-bold">{ref.slice(0, 12).toUpperCase()}</p>
            </div>
          )}
          <p className="text-center text-[12px] text-neutral-600">
            Montant : <span className="font-bold">{orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ')} F</span>
          </p>
          <p className="text-center text-[12px] text-neutral-600">Un conseiller vous appelle pour confirmer avant livraison.</p>
          <Link to={`/bande-sport-tk?company=${encodeURIComponent(company)}`} className="block rounded-full bg-cyan-600 py-3 text-center text-[12px] font-black uppercase text-white">
            Retour au produit
          </Link>
        </div>
      </div>
    </div>
  );
}
