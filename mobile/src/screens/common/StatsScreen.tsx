import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';
import StatCard from '../../components/StatCard';
import { statsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const PERIODS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
];

export default function StatsScreen() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const isPersonal = user?.role === 'APPELANT' || user?.role === 'LIVREUR';

  const fetchData = useCallback(async () => {
    try {
      if (isPersonal) {
        const { data } = await statsApi.myStats(period);
        setStats(data);
      } else {
        const { data } = await statsApi.overview();
        setStats(data);
      }
    } catch (e) { console.error(e); }
  }, [period, isPersonal]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const s = stats || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {isPersonal && (
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, period === p.key && styles.periodActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodActiveText]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {user?.role === 'APPELANT' && (
        <>
          <View style={styles.statsGrid}>
            <StatCard title="Appels" value={s.totalAppels || 0} icon="call-outline" color={colors.info} />
            <StatCard title="Validées" value={s.totalValides || 0} icon="checkmark-circle-outline" color={colors.success} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard title="Annulées" value={s.totalAnnules || 0} icon="close-circle-outline" color={colors.danger} />
            <StatCard title="Injoignables" value={s.totalInjoignables || 0} icon="call-outline" color={colors.warning} />
          </View>
          {s.tauxValidation !== undefined && (
            <View style={styles.rateCard}>
              <Text style={styles.rateLabel}>Taux de validation</Text>
              <Text style={styles.rateValue}>{Math.round(s.tauxValidation || 0)}%</Text>
            </View>
          )}
        </>
      )}

      {user?.role === 'LIVREUR' && (
        <>
          <View style={styles.statsGrid}>
            <StatCard title="Livraisons" value={s.totalLivraisons || 0} icon="bicycle-outline" color={colors.success} />
            <StatCard title="Refusées" value={s.totalRefusees || 0} icon="hand-left-outline" color={colors.danger} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard title="Annulées" value={s.totalAnnulees || 0} icon="close-circle-outline" color={colors.warning} />
            <StatCard title="Montant livré" value={`${(s.montantLivre || 0).toLocaleString('fr-FR')}`} icon="cash-outline" color={colors.info} subtitle="Fr" />
          </View>
        </>
      )}

      {(user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE') && (
        <>
          <View style={styles.statsGrid}>
            <StatCard title="Total" value={s.totalOrders || 0} icon="receipt-outline" color={colors.primary} />
            <StatCard title="Validées" value={s.validees || s.validated || 0} icon="checkmark-circle-outline" color={colors.success} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard title="Livrées" value={s.livrees || s.delivered || 0} icon="bicycle-outline" color={colors.statusDelivered} />
            <StatCard title="Annulées" value={s.annulees || s.cancelled || 0} icon="close-circle-outline" color={colors.danger} />
          </View>
          {s.revenue !== undefined && (
            <View style={styles.rateCard}>
              <Text style={styles.rateLabel}>Chiffre d'affaires</Text>
              <Text style={[styles.rateValue, { color: colors.success }]}>
                {Number(s.revenue || 0).toLocaleString('fr-FR')} Fr
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
  periodChip: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  periodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
  periodActiveText: { color: '#fff' },
  statsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  rateCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: spacing.md,
  },
  rateLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  rateValue: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.primary },
});
