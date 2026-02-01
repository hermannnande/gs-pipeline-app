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
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
          <X size={14} />
          ABSENT
        </span>
      );
    }

    if (attendance.validation === 'RETARD') {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
          <Clock size={14} />
          RETARD
        </span>
      );
    }

    if (attendance.heureDepart) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
          <LogOut size={14} />
          PARTI
        </span>
      );
    }

    return (
      <span className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
        <Check size={14} />
        PRÉSENT
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-primary-600" size={22} />
        </div>
      </div>
    );
  }

  const canMarkArrival = !attendance;
  const canMarkDeparture = Boolean(attendance && !attendance.heureDepart);

  return (
    <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-primary-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="text-primary-600" size={20} />
          Pointage GPS
        </h3>
        {statusBadge()}
      </div>

      {attendance && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock size={16} className="text-green-600" />
            <span className="font-medium">Arrivée :</span>
            <span className="font-semibold">
              {new Date(attendance.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {attendance.heureDepart && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
              <LogOut size={16} className="text-blue-600" />
              <span className="font-medium">Départ :</span>
              <span className="font-semibold">
                {new Date(attendance.heureDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {typeof attendance.distanceArrivee === 'number' && (
            <p className="text-xs text-gray-500 mt-2">Distance arrivée : {Math.round(attendance.distanceArrivee)}m</p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          className="btn btn-primary flex-1"
          disabled={!canMarkArrival || isGeoLoading || markArrivalMutation.isPending}
          onClick={() => getPosition((pos) => markArrivalMutation.mutate(pos))}
        >
          {isGeoLoading || markArrivalMutation.isPending ? 'Pointage...' : 'Marquer ma présence'}
        </button>
        <button
          className="btn btn-secondary flex-1"
          disabled={!canMarkDeparture || isGeoLoading || markDepartureMutation.isPending}
          onClick={() => getPosition((pos) => markDepartureMutation.mutate(pos))}
        >
          {isGeoLoading || markDepartureMutation.isPending ? 'Départ...' : 'Marquer mon départ'}
        </button>
      </div>
    </div>
  );
}

