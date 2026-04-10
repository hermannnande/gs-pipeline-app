import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';
import StatCard from '../../components/StatCard';
import { statsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function LivreurOverviewScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await statsApi.myStats('today');
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
      <Text style={styles.role}>Livreur</Text>

      <Text style={styles.sectionTitle}>Mes stats aujourd'hui</Text>
      <View style={styles.statsGrid}>
        <StatCard title="Livraisons" value={s.totalLivraisons || 0} icon="bicycle-outline" color={colors.success} />
        <StatCard title="Refusées" value={s.totalRefusees || 0} icon="hand-left-outline" color={colors.danger} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard title="Annulées" value={s.totalAnnulees || 0} icon="close-circle-outline" color={colors.warning} />
        <StatCard title="Montant" value={`${(s.montantLivre || 0).toLocaleString('fr-FR')}`} icon="cash-outline" color={colors.info} subtitle="Fr livré" />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.mainAction} onPress={() => navigation.navigate('MyDeliveries')} activeOpacity={0.7}>
            <View style={[styles.mainIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="bicycle" size={32} color={colors.primary} />
            </View>
            <Text style={styles.mainLabel}>Mes livraisons</Text>
            <Text style={styles.mainDesc}>Voir les commandes à livrer</Text>
          </TouchableOpacity>
          <View style={styles.sideActions}>
            <TouchableOpacity style={styles.sideAction} onPress={() => navigation.navigate('Stats')} activeOpacity={0.7}>
              <Ionicons name="bar-chart-outline" size={20} color={colors.statusReturned} />
              <Text style={styles.sideLabel}>Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideAction} onPress={() => navigation.navigate('Chat')} activeOpacity={0.7}>
              <Ionicons name="chatbubbles-outline" size={20} color={colors.info} />
              <Text style={styles.sideLabel}>Chat</Text>
            </TouchableOpacity>
          </View>
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
  actionsGrid: { flexDirection: 'row', gap: spacing.md },
  mainAction: {
    flex: 2, backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center',
  },
  mainIcon: {
    width: 56, height: 56, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  mainLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  mainDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  sideActions: { flex: 1, gap: spacing.md },
  sideAction: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  sideLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.text },
});
