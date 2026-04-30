/**
 * Page merci pour le coffret boxer — flux externe (pas de commande API).
 */
import { Link } from 'react-router-dom';

const SLUG = 'coffret-boxer-homme';
const WP_URL =
  import.meta.env.VITE_COFFRET_BOXER_WP_URL?.trim() || 'https://obrille.com';

export default function CoffretBoxerThankYou() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4 text-center">
      <div className="max-w-md rounded-3xl border border-white/10 bg-slate-800/50 p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-black text-white">Merci !</h1>
        <p className="mt-2 text-sm text-slate-400">
          Si vous avez finalisé sur WhatsApp, notre équipe vous recontacte bientôt. Vous pouvez aussi passer par
          notre boutique en ligne.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href={WP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 py-3 text-sm font-extrabold text-slate-900"
          >
            Retour sur Obrille
          </a>
          <Link
            to={`/${SLUG}`}
            className="text-sm font-semibold text-amber-200 underline-offset-2 hover:underline"
          >
            ← Voir à nouveau la page produit
          </Link>
        </div>
      </div>
    </div>
  );
}
