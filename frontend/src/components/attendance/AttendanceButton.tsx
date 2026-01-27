import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Check, X, Clock, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AttendanceButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Récupérer la présence du jour
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['my-attendance-today'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/my-attendance-today');
      return data;
    },
    refetchInterval: 60000 // Rafraîchir chaque minute
  });

  const attendance = attendanceData?.attendance;

  // Mutation pour marquer l'arrivée
  const markArrivalMutation = useMutation({
    mutationFn: async (position: GeolocationPosition) => {
      const { data } = await api.post('/attendance/mark-arrival', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      
      if (data.validation === 'RETARD') {
        toast.success(data.message, { duration: 5000, icon: '⚠️' });
      } else {
        toast.success(data.message, { duration: 5000, icon: '✅' });
      }
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      
      if (errorData?.error === 'HORS_ZONE') {
        const message = `❌ POINTAGE REFUSÉ\n\nVous êtes à ${errorData.distance}m du magasin (max ${errorData.rayonTolerance}m).\n\n🚶‍♂️ Rapprochez-vous du magasin et réessayez !`;
        
        toast.error(message, { 
          duration: 10000, 
          icon: '🚫',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            fontWeight: 'bold',
            whiteSpace: 'pre-line'
          }
        });
      } else {
        toast.error(errorData?.message || 'Erreur lors du pointage', { duration: 5000 });
      }
    }
  });

  // Mutation pour marquer le départ
  const markDepartureMutation = useMutation({
    mutationFn: async (position: GeolocationPosition) => {
      const { data } = await api.post('/attendance/mark-departure', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      toast.success(data.message, { icon: '👋' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du départ');
    }
  });

  const handleMarkArrival = () => {
    setIsLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
      setIsLoading(false);
      toast.error('Géolocalisation non supportée');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        markArrivalMutation.mutate(position);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '❌ Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '❌ Position indisponible. Vérifiez votre GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = '❌ Délai d\'attente dépassé. Réessayez.';
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleMarkDeparture = () => {
    setIsLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        markDepartureMutation.mutate(position);
        setIsLoading(false);
      },
      (error) => {
        toast.error('Erreur de géolocalisation');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Affichage du statut
  const getStatusBadge = () => {
    if (!attendance) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-bold">
          <X size={14} />
          ABSENT
        </span>
      );
    }

    if (!attendance.validee) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-bold">
          <X size={14} />
          ABSENT (Hors zone)
        </span>
      );
    }

    if (attendance.validation === 'RETARD') {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
          <Clock size={12} />
          Retard
        </span>
      );
    }

    if (attendance.heureDepart) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
          <LogOut size={12} />
          Parti
        </span>
      );
    }

    return (
      <span className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1 animate-pulse">
        <Check size={12} />
        Présent
      </span>
    );
  };

  if (isLoadingAttendance) {
    return (
      <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-primary-600" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-primary-200 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="text-primary-600 animate-pulse" size={20} />
          <span className="hidden sm:inline">Pointage GPS</span>
          <span className="sm:hidden">📍 Pointage</span>
        </h3>
        {getStatusBadge()}
      </div>

      {attendance && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
            <Clock size={16} className="text-green-600" />
            <span className="font-medium">Arrivée :</span>
            <span className="font-bold text-green-700">
              {new Date(attendance.heureArrivee).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          
          {attendance.heureDepart && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <LogOut size={16} className="text-blue-600" />
              <span className="font-medium">Départ :</span>
              <span className="font-bold text-blue-700">
                {new Date(attendance.heureDepart).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}

          {attendance.distanceArrivee !== undefined && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
              <MapPin size={12} />
              <span>Distance : {Math.round(attendance.distanceArrivee)}m du magasin</span>
              {attendance.validee && <span className="text-green-600">✓</span>}
            </div>
          )}
        </div>
      )}

      {locationError && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg animate-pulse">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-700">{locationError}</p>
          </div>
        </div>
      )}

      {/* Message d'information pour les absents */}
      {!attendance && (
        <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-bold mb-1">📍 Vous devez être au magasin</p>
              <p className="mb-2">Pour pointer, vous devez être à <span className="font-bold">moins de 50m</span> du magasin.</p>
              <p className="text-xs bg-white px-2 py-1 rounded border border-blue-300">
                💡 <span className="font-bold">Astuce :</span> Si votre pointage est refusé (hors zone), <span className="font-bold text-green-600">rapprochez-vous et réessayez</span> !
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {!attendance && (
          <button
            onClick={handleMarkArrival}
            disabled={isLoading || markArrivalMutation.isPending}
            className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading || markArrivalMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline">Géolocalisation...</span>
                <span className="sm:hidden">📍...</span>
              </>
            ) : (
              <>
                <MapPin size={18} />
                <span className="hidden sm:inline">Marquer ma présence</span>
                <span className="sm:hidden">Je suis là !</span>
              </>
            )}
          </button>
        )}

        {attendance && !attendance.heureDepart && attendance.validee && (
          <button
            onClick={handleMarkDeparture}
            disabled={isLoading || markDepartureMutation.isPending}
            className="btn bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading || markDepartureMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline">Géolocalisation...</span>
                <span className="sm:hidden">📍...</span>
              </>
            ) : (
              <>
                <LogOut size={18} />
                <span className="hidden sm:inline">Marquer mon départ</span>
                <span className="sm:hidden">Je pars</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
