import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { statsApi } from '@/lib/api';

export default function Stats() {
  const [period, setPeriod] = useState('today');

  const { data } = useQuery({
    queryKey: ['appelant-stats', period],
    queryFn: () => statsApi.getMyStats({ period }),
  });

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes statistiques</h1>
          <p className="text-gray-600 mt-1">Suivez votre performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input w-auto"
        >
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      {/* Taux de validation */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6 text-center">Taux de validation</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#e5e7eb"
                strokeWidth="16"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#3b82f6"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${(parseFloat(stats?.tauxValidation || '0') / 100) * 502.4} 502.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary-600">
                  {stats?.tauxValidation || 0}%
                </p>
                <p className="text-sm text-gray-600">de validation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Détails statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Total appels</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalAppels || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Validées</p>
          <p className="text-3xl font-bold text-green-600">{stats?.totalValides || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Annulées</p>
          <p className="text-3xl font-bold text-red-600">{stats?.totalAnnules || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Injoignables</p>
          <p className="text-3xl font-bold text-orange-600">{stats?.totalInjoignables || 0}</p>
        </div>
      </div>

      {/* Historique */}
      {data?.details && data.details.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Historique détaillé</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Appels</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Validées</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Annulées</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Injoignables</th>
                </tr>
              </thead>
              <tbody>
                {data.details.map((detail: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm">
                      {new Date(detail.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-sm">{detail.totalAppels}</td>
                    <td className="py-3 px-4 text-sm text-green-600">{detail.totalValides}</td>
                    <td className="py-3 px-4 text-sm text-red-600">{detail.totalAnnules}</td>
                    <td className="py-3 px-4 text-sm text-orange-600">{detail.totalInjoignables}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

