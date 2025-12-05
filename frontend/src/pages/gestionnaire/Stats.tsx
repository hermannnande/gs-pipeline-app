import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

export default function Stats() {
  const { data: callersData } = useQuery({
    queryKey: ['gestionnaire-callers-stats'],
    queryFn: () => statsApi.getCallers(),
  });

  const { data: deliverersData } = useQuery({
    queryKey: ['gestionnaire-deliverers-stats'],
    queryFn: () => statsApi.getDeliverers(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-600 mt-1">Performance des équipes</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Appelants</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Appels</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Validées</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Taux</th>
              </tr>
            </thead>
            <tbody>
              {callersData?.stats?.map((stat: any) => (
                <tr key={stat.user.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm font-medium">
                    {stat.user.prenom} {stat.user.nom}
                  </td>
                  <td className="py-3 px-4 text-sm">{stat.totalAppels}</td>
                  <td className="py-3 px-4 text-sm text-green-600 font-medium">{stat.totalValides}</td>
                  <td className="py-3 px-4">
                    <span className="badge bg-blue-100 text-blue-800">{stat.tauxValidation}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Livreurs</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Livrées</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Taux</th>
              </tr>
            </thead>
            <tbody>
              {deliverersData?.stats?.map((stat: any) => (
                <tr key={stat.user.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm font-medium">
                    {stat.user.prenom} {stat.user.nom}
                  </td>
                  <td className="py-3 px-4 text-sm text-green-600 font-medium">{stat.totalLivraisons}</td>
                  <td className="py-3 px-4 text-sm font-medium">{formatCurrency(stat.montantLivre)}</td>
                  <td className="py-3 px-4">
                    <span className="badge bg-green-100 text-green-800">{stat.tauxReussite}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

