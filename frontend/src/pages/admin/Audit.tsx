import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Eye, Filter, Inbox, Monitor, RefreshCw, Shield, Smartphone, Users, Wifi } from 'lucide-react';
import { api, usersApi } from '@/lib/api';
import { PageHeader, LoadingState, EmptyState } from '@/components/UIComponents';

type AuditLog = {
  id: number;
  userId: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
  createdAt: string;
  user: { id: number; nom: string; prenom: string; role: string; email: string };
};

type DeviceUser = { id: number; nom: string; prenom: string; role: string; email?: string };

type SharedEntry = {
  fingerprint?: string;
  ip?: string;
  users: DeviceUser[];
  count: number;
};

type UserSummary = {
  user: DeviceUser;
  ips: string[];
  fingerprints: string[];
  ipCount: number;
  fingerprintCount: number;
  totalActions: number;
  lastActivity: string | null;
};

type DevicesData = {
  userSummaries: UserSummary[];
  sharedFingerprints: SharedEntry[];
  sharedIPs: SharedEntry[];
  alerts: { sharedDeviceCount: number; sharedIPCount: number };
};

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDateTime(v: string) {
  return new Date(v).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function parseDetails(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Connexion',
  LOGIN_FAILED: 'Connexion échouée',
  ORDER_STATUS_CHANGE: 'Changement statut commande',
  EXPRESS_EXPEDIER: 'Expédition EXPRESS',
  EXPEDITION_LIVRER: 'Livraison EXPÉDITION',
  ATTENDANCE_MARK: 'Pointage',
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  LOGIN_FAILED: 'bg-red-100 text-red-800',
  ORDER_STATUS_CHANGE: 'bg-amber-100 text-amber-800',
  EXPRESS_EXPEDIER: 'bg-purple-100 text-purple-800',
  EXPEDITION_LIVRER: 'bg-green-100 text-green-800',
  ATTENDANCE_MARK: 'bg-teal-100 text-teal-800',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  GESTIONNAIRE: 'bg-blue-100 text-blue-700',
  GESTIONNAIRE_STOCK: 'bg-teal-100 text-teal-700',
  APPELANT: 'bg-yellow-100 text-yellow-700',
  LIVREUR: 'bg-indigo-100 text-indigo-700',
};

export default function Audit() {
  const [tab, setTab] = useState<'logs' | 'devices'>('devices');
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const [startDate, setStartDate] = useState(toDateInputValue(weekAgo));
  const [endDate, setEndDate] = useState(toDateInputValue(now));
  const [filterUserId, setFilterUserId] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterIp, setFilterIp] = useState('');
  const [logsPage, setLogsPage] = useState(1);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);

  const { data: usersData } = useQuery({
    queryKey: ['audit-users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: devicesData, isLoading: devicesLoading, refetch: refetchDevices } = useQuery<DevicesData>({
    queryKey: ['audit-devices', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/audit/devices', { params: { startDate, endDate } });
      return data;
    },
    enabled: tab === 'devices',
  });

  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['audit-logs', startDate, endDate, filterUserId, filterAction, filterIp, logsPage],
    queryFn: async () => {
      const params: Record<string, string | number> = { startDate, endDate, page: logsPage, limit: 40 };
      if (filterUserId) params.userId = filterUserId;
      if (filterAction) params.action = filterAction;
      if (filterIp) params.ipAddress = filterIp;
      const { data } = await api.get('/audit/logs', { params });
      return data as { logs: AuditLog[]; total: number; totalPages: number };
    },
    enabled: tab === 'logs',
  });

  const alerts = devicesData?.alerts;
  const hasAlerts = alerts && (alerts.sharedDeviceCount > 0 || alerts.sharedIPCount > 0);

  const allUsers: DeviceUser[] = usersData?.users || usersData || [];

  async function handleBackfill() {
    try {
      setIsBackfilling(true);
      setBackfillMessage(null);
      const { data } = await api.post('/audit/backfill');
      setBackfillMessage(data?.message || 'Import historique terminé.');
      await Promise.all([refetchDevices(), refetchLogs()]);
    } catch (error: any) {
      setBackfillMessage(error?.response?.data?.error || "Erreur lors de l'import historique.");
    } finally {
      setIsBackfilling(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit & Sécurité"
        subtitle="Traçabilité des actions, IP et détection de partage d'appareils"
        icon={Shield}
      />

      {/* Alertes */}
      {hasAlerts && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800">Alertes de sécurité détectées</h3>
            <div className="text-sm text-red-700 mt-1 space-y-1">
              {alerts.sharedDeviceCount > 0 && (
                <p><Smartphone className="inline h-4 w-4 mr-1" />{alerts.sharedDeviceCount} appareil(s) partagé(s) entre plusieurs utilisateurs</p>
              )}
              {alerts.sharedIPCount > 0 && (
                <p><Wifi className="inline h-4 w-4 mr-1" />{alerts.sharedIPCount} adresse(s) IP utilisée(s) par plusieurs comptes</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('devices')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === 'devices' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Monitor className="inline h-4 w-4 mr-1.5" />Appareils & IP
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === 'logs' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Eye className="inline h-4 w-4 mr-1.5" />Journal des actions
        </button>
      </div>

      {/* Filtres dates */}
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm font-medium">
          Du
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="ml-2 border rounded-lg px-3 py-1.5 text-sm" />
        </label>
        <label className="text-sm font-medium">
          Au
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="ml-2 border rounded-lg px-3 py-1.5 text-sm" />
        </label>
        <button onClick={() => { refetchDevices(); refetchLogs(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <RefreshCw className="h-3.5 w-3.5" />Actualiser
        </button>
        <button
          onClick={handleBackfill}
          disabled={isBackfilling}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          {isBackfilling ? 'Import en cours...' : 'Importer l’historique'}
        </button>
      </div>
      {backfillMessage && (
        <div className="text-sm text-gray-700 bg-gray-50 border rounded-lg px-3 py-2">
          {backfillMessage}
        </div>
      )}

      {/* TAB: Appareils & IP */}
      {tab === 'devices' && (
        <div className="space-y-6">
          {devicesLoading ? <LoadingState text="Analyse en cours..." /> : !devicesData ? <EmptyState icon={Inbox} title="Aucune donnée" description="Aucune donnée d'audit disponible pour cette période." /> : (
            <>
              {/* Appareils partagés */}
              {devicesData.sharedFingerprints.length > 0 && (
                <div className="bg-white border border-red-200 rounded-xl shadow-sm">
                  <div className="px-5 py-3 bg-red-50 border-b border-red-200 rounded-t-xl flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-red-600" />
                    <h3 className="font-bold text-red-800">Appareils partagés entre utilisateurs</h3>
                  </div>
                  <div className="divide-y">
                    {devicesData.sharedFingerprints.map((entry, i) => (
                      <div key={i} className="px-5 py-3">
                        <div className="text-xs text-gray-500 font-mono mb-2">Empreinte: {entry.fingerprint}</div>
                        <div className="flex flex-wrap gap-2">
                          {entry.users.map((u) => (
                            <span key={u.id} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                              {u.prenom} {u.nom} ({u.role})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IP partagées */}
              {devicesData.sharedIPs.length > 0 && (
                <div className="bg-white border border-orange-200 rounded-xl shadow-sm">
                  <div className="px-5 py-3 bg-orange-50 border-b border-orange-200 rounded-t-xl flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-orange-600" />
                    <h3 className="font-bold text-orange-800">Adresses IP partagées</h3>
                  </div>
                  <div className="divide-y">
                    {devicesData.sharedIPs.map((entry, i) => (
                      <div key={i} className="px-5 py-3">
                        <div className="text-sm font-mono text-gray-700 mb-2">{entry.ip}</div>
                        <div className="flex flex-wrap gap-2">
                          {entry.users.map((u) => (
                            <span key={u.id} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                              {u.prenom} {u.nom} ({u.role})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résumé par utilisateur */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-5 py-3 border-b flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-800">Résumé par utilisateur</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Utilisateur</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Rôle</th>
                        <th className="text-center px-4 py-2.5 font-medium text-gray-600">IP distinctes</th>
                        <th className="text-center px-4 py-2.5 font-medium text-gray-600">Appareils</th>
                        <th className="text-center px-4 py-2.5 font-medium text-gray-600">Actions</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Dernière activité</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Adresses IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {devicesData.userSummaries
                        .sort((a, b) => b.totalActions - a.totalActions)
                        .map((s) => (
                        <tr key={s.user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium">{s.user.prenom} {s.user.nom}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[s.user.role] || 'bg-gray-100'}`}>{s.user.role}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`font-bold ${s.ipCount > 3 ? 'text-orange-600' : 'text-gray-700'}`}>{s.ipCount}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`font-bold ${s.fingerprintCount > 2 ? 'text-red-600' : 'text-gray-700'}`}>{s.fingerprintCount}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-medium">{s.totalActions}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">{s.lastActivity ? formatDateTime(s.lastActivity) : '—'}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {s.ips.slice(0, 3).map((ip) => (
                                <span key={ip} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">{ip}</span>
                              ))}
                              {s.ips.length > 3 && <span className="text-xs text-gray-400">+{s.ips.length - 3}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: Journal des actions */}
      {tab === 'logs' && (
        <div className="space-y-4">
          {/* Filtres supplémentaires */}
          <div className="flex flex-wrap gap-3 items-end bg-gray-50 rounded-xl p-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <select value={filterUserId} onChange={(e) => { setFilterUserId(e.target.value); setLogsPage(1); }}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">Tous les utilisateurs</option>
              {allUsers.map((u: DeviceUser) => (
                <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.role})</option>
              ))}
            </select>
            <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setLogsPage(1); }}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">Toutes les actions</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input type="text" placeholder="Filtrer par IP..." value={filterIp}
              onChange={(e) => { setFilterIp(e.target.value); setLogsPage(1); }}
              className="border rounded-lg px-3 py-1.5 text-sm w-40" />
          </div>

          {logsLoading ? <LoadingState text="Chargement..." /> : !logsData?.logs?.length ? <EmptyState icon={Inbox} title="Aucune action enregistrée" description="Les actions seront enregistrées automatiquement." /> : (
            <>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Date</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Utilisateur</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Action</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Détails</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">IP</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Empreinte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {logsData.logs.map((log: AuditLog) => {
                        const details = parseDetails(log.details);
                        return (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-gray-800">{log.user.prenom} {log.user.nom}</div>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[log.user.role] || 'bg-gray-100'}`}>{log.user.role}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                                {ACTION_LABELS[log.action] || log.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs truncate">
                              {details ? (
                                <div className="space-y-0.5">
                                  {details.oldStatus && details.newStatus && (
                                    <div>{String(details.oldStatus)} → <span className="font-bold">{String(details.newStatus)}</span></div>
                                  )}
                                  {details.orderRef && <div className="text-gray-400">Réf: {String(details.orderRef)}</div>}
                                  {details.clientNom && <div className="text-gray-400">{String(details.clientNom)}</div>}
                                  {details.email && <div>{String(details.email)}</div>}
                                </div>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{log.ipAddress || '—'}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-[10px] text-gray-400">{log.deviceFingerprint?.slice(0, 8) || '—'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {logsData.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button disabled={logsPage <= 1} onClick={() => setLogsPage(logsPage - 1)}
                    className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Précédent</button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">{logsPage} / {logsData.totalPages}</span>
                  <button disabled={logsPage >= logsData.totalPages} onClick={() => setLogsPage(logsPage + 1)}
                    className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Suivant</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
