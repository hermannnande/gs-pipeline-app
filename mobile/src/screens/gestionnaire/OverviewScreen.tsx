import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';
import StatCard from '../../components/StatCard';
import { statsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function GestionnaireOverviewScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await statsApi.overview();
      setStats(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const s = stats || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <Text style={styles.hello}>Bonjour, {user?.prenom} 👋</Text>
      <Text style={styles.role}>Gestionnaire</Text>

      <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
      <View style={styles.statsGrid}>
        <StatCard title="À appeler" value={s.aAppeler || s.toCall || 0} icon="call-outline" color={colors.warning} />
        <StatCard title="Validées" value={s.validees || s.validated || 0} icon="checkmark-circle-outline" color={colors.success} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard title="En livraison" value={s.enLivraison || s.inDelivery || 0} icon="car-outline" color={colors.info} />
        <StatCard title="Livrées" value={s.livrees || s.delivered || 0} icon="bicycle-outline" color={colors.statusDelivered} />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'À appeler', icon: 'call-outline' as const, screen: 'ToCall', color: colors.warning },
            { label: 'Commandes', icon: 'list-outline' as const, screen: 'Orders', color: colors.primary },
            { label: 'Validées', icon: 'checkmark-circle-outline' as const, screen: 'Validated', color: colors.success },
            { label: 'Livraisons', icon: 'bicycle-outline' as const, screen: 'Deliveries', color: colors.secondary },
            { label: 'Expéditions', icon: 'airplane-outline' as const, screen: 'Expeditions', color: colors.statusExpedition },
            { label: 'Stats', icon: 'bar-chart-outline' as const, screen: 'Stats', color: colors.statusReturned },
          ].map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.actionCard}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  hello: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  role: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xxl },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  quickActions: { marginTop: spacing.lg },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: {
    width: '30%', alignItems: 'center', padding: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  actionLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.text, textAlign: 'center' },
});
