import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Check, X, Clock, LogOut, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type Attendance = {
  id: number;
  heureArrivee: string;
  heureDepart?: string | null;
  distanceArrivee?: number | null;
  validee?: boolean;
  validation?: string | null;
};

/* Badge de statut avec point pulse (design 2026). Logique metier inchangee. */
function StatusPill({
  tone,
  icon: Icon,
  label,
  pulsing = false,
}: {
  tone: 'green' | 'red' | 'orange' | 'blue';
  icon: any;
  label: string;
  pulsing?: boolean;
}) {
  const tones = {
    green: 'bg-success-50 text-success-700 ring-1 ring-success-100',
    red: 'bg-danger-50 text-danger-700 ring-1 ring-danger-100',
    orange: 'bg-warning-50 text-warning-700 ring-1 ring-warning-100',
    blue: 'bg-primary-50 text-primary-700 ring-1 ring-primary-100',
  };
  const dotTones = {
    green: 'bg-success-500',
    red: 'bg-danger-500',
    orange: 'bg-warning-500',
    blue: 'bg-primary-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      <span className="relative flex h-2 w-2">
        {pulsing && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${dotTones[tone]} opacity-60 animate-pulse-dot`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotTones[tone]}`} />
      </span>
      <Icon size={12} strokeWidth={3} />
      {label}
    </span>
  );
}

export default function AttendanceButton() {
  const queryClient = useQueryClient();
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['my-attendance-today'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/my-attendance-today');
      return data as { attendance: Attendance | null };
    },
    refetchInterval: 60000,
  });

  const attendance = attendanceData?.attendance;

  const markArrivalMutation = useMutation({
    mutationFn: async (pos: GeolocationPosition) => {
      const { data } = await api.post('/attendance/mark-arrival', {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      toast.success(data?.message || 'Présence enregistrée');
    },
    onError: (err: any) => {
      const payload = err?.response?.data;
      if (payload?.error === 'HORS_ZONE') {
        toast.error(payload?.message || 'Hors zone');
      } else {
        toast.error(payload?.error || payload?.message || 'Erreur lors du pointage');
      }
    },
  });

  const markDepartureMutation = useMutation({
    mutationFn: async (pos: GeolocationPosition) => {
      const { data } = await api.post('/attendance/mark-departure', {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      toast.success(data?.message || 'Départ enregistré');
    },
    onError: (err: any) => {
      const payload = err?.response?.data;
      toast.error(payload?.error || payload?.message || 'Erreur lors du départ');
    },
  });

  const getPosition = (cb: (pos: GeolocationPosition) => void) => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée');
      return;
    }

    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGeoLoading(false);
        cb(pos);
      },
      (error) => {
        setIsGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) toast.error('Permission GPS refusée');
        else if (error.code === error.POSITION_UNAVAILABLE) toast.error('Position indisponible');
        else if (error.code === error.TIMEOUT) toast.error('Délai GPS dépassé');
        else toast.error('Erreur GPS');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const statusBadge = () => {
    if (!attendance) {
      return <StatusPill tone="red" icon={X} label="Hors ligne" />;
    }

    if (attendance.validation === 'RETARD') {
      return <StatusPill tone="orange" icon={Clock} label="Retard" pulsing />;
    }

    if (attendance.heureDepart) {
      return <StatusPill tone="blue" icon={LogOut} label="Parti" />;
    }

    return <StatusPill tone="green" icon={Check} label="En ligne" pulsing />;
  };

  if (isLoading) {
    return (
      <div className="card !p-4 sm:!p-5">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-primary-600" size={22} />
        </div>
      </div>
    );
  }

  const canMarkArrival = !attendance;
  const canMarkDeparture = Boolean(attendance && !attendance.heureDepart);

  return (
    <div className="card !p-4 sm:!p-5 relative overflow-hidden">
      {/* Lisere degrade en fond */}
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: 'linear-gradient(90deg, #6D5DF6, #A855F7, #D946EF)' }}
        aria-hidden="true"
      />
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Titre + statut */}
        <div className="flex items-center gap-3 md:w-56 shrink-0">
          <div className="chip-icon chip-icon-blue">
            <MapPin size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 font-display">Pointage GPS</h3>
            <div className="mt-1">{statusBadge()}</div>
          </div>
        </div>

        {/* Infos pointage */}
        <div className="flex-1 min-w-0">
          {attendance ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} className="text-success-600" />
                Arrivée :
                <strong className="text-gray-900">
                  {new Date(attendance.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </span>
              {attendance.heureDepart && (
                <span className="inline-flex items-center gap-1.5">
                  <LogOut size={15} className="text-primary-600" />
                  Départ :
                  <strong className="text-gray-900">
                    {new Date(attendance.heureDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </span>
              )}
              {typeof attendance.distanceArrivee === 'number' && (
                <span className="text-xs text-gray-400">
                  Distance arrivée : {Math.round(attendance.distanceArrivee)}m
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Aucun pointage aujourd'hui — marquez votre présence à l'arrivée.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 md:w-auto w-full">
          <button
            className="btn btn-primary !py-2.5 text-sm whitespace-nowrap"
            disabled={!canMarkArrival || isGeoLoading || markArrivalMutation.isPending}
            onClick={() => getPosition((pos) => markArrivalMutation.mutate(pos))}
          >
            {isGeoLoading || markArrivalMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {isGeoLoading || markArrivalMutation.isPending ? 'Pointage...' : 'Marquer ma présence'}
          </button>
          <button
            className="btn btn-secondary !py-2.5 text-sm whitespace-nowrap"
            disabled={!canMarkDeparture || isGeoLoading || markDepartureMutation.isPending}
            onClick={() => getPosition((pos) => markDepartureMutation.mutate(pos))}
          >
            {isGeoLoading || markDepartureMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            {isGeoLoading || markDepartureMutation.isPending ? 'Départ...' : 'Marquer mon départ'}
          </button>
        </div>
      </div>
    </div>
  );
}
