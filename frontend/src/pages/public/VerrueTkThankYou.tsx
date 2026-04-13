import { Link, useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerrueTkThankYou() {
  const query = useQuery();
  const ref = query.get('ref') || '';
  const company = query.get('company') || 'ci';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffdf5] px-4 py-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-6 pb-6 pt-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-[0_0_30px_rgba(34,197,94,.5)]">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black">Commande envoyee avec succes</h1>
          <p className="mt-2 text-sm text-neutral-300">
            Merci pour votre confiance. Votre commande de la creme anti verrue est enregistree.
          </p>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-6">
          {ref && (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Reference de commande</p>
              <p className="mt-1 break-all font-mono text-sm font-bold text-neutral-800">{ref.slice(0, 12).toUpperCase()}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
              <span className="mt-0.5 text-green-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </span>
              <div>
                <p className="text-sm font-bold text-green-800">Notre equipe vous appelle tres vite</p>
                <p className="text-xs text-green-600">Pour confirmer et organiser votre livraison.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-yellow-100 bg-yellow-50 p-3">
              <span className="mt-0.5 text-yellow-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </span>
              <div>
                <p className="text-sm font-bold text-yellow-800">Paiement a la livraison</p>
                <p className="text-xs text-yellow-600">Vous ne payez qu'a la reception de votre colis.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to={`/anti-verrue?company=${company}`}
              className="flex flex-1 items-center justify-center rounded-full border-2 border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-700 transition hover:border-neutral-400"
            >
              Retour au produit
            </Link>
            <a
              href={`/commander?company=${company}`}
              className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 px-4 py-3 text-sm font-extrabold text-neutral-900 shadow-md transition hover:shadow-lg"
            >
              Voir tous les produits
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
