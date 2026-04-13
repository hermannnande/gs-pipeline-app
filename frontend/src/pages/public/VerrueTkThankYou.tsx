import { Link, useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerrueTkThankYou() {
  const query = useQuery();
  const ref = query.get('ref') || '';
  const company = query.get('company') || 'ci';

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-300/30 bg-slate-900/80 p-8 text-center shadow-[0_0_45px_rgba(16,185,129,0.35)]">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/20">
          <span className="text-4xl">✓</span>
        </div>

        <h1 className="text-3xl font-extrabold text-emerald-300">Merci pour votre commande.</h1>
        <p className="mt-3 text-sm text-slate-200 sm:text-base">
          Votre demande pour la creme anti verrue est bien enregistree.
        </p>
        <p className="mt-2 text-sm text-slate-200 sm:text-base">
          Notre equipe vous appelle rapidement pour confirmer la livraison.
        </p>

        {ref ? (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Reference</p>
            <p className="mt-1 break-all font-mono text-sm text-slate-100">{ref}</p>
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to={`/anti-verrue?company=${company}`}
            className="rounded-xl border border-slate-500 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-300 hover:text-fuchsia-100"
          >
            Retour a la page produit
          </Link>
          <a
            href={`/commander?company=${company}`}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(217,70,239,0.6)]"
          >
            Voir tous les produits
          </a>
        </div>
      </div>
    </div>
  );
}
