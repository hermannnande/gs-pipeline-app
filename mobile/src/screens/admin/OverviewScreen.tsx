import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';
import StatCard from '../../components/StatCard';
import { statsApi, ordersApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function AdminOverviewScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        statsApi.overview(),
        ordersApi.getAll({ limit: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.orders || ordersRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const s = stats || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <View style={styles.greeting}>
        <View>
          <Text style={styles.hello}>Bonjour, {user?.prenom} 👋</Text>
          <Text style={styles.role}>Administrateur</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
      <View style={styles.statsGrid}>
        <StatCard title="Total commandes" value={s.totalOrders || 0} icon="receipt-outline" color={colors.primary} />
        <StatCard title="À appeler" value={s.aAppeler || s.toCall || 0} icon="call-outline" color={colors.warning} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard title="Validées" value={s.validees || s.validated || 0} icon="checkmark-circle-outline" color={colors.success} />
        <StatCard title="Livrées" value={s.livrees || s.delivered || 0} icon="bicycle-outline" color={colors.info} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard title="Annulées" value={s.annulees || s.cancelled || 0} icon="close-circle-outline" color={colors.danger} />
        <StatCard title="En livraison" value={s.enLivraison || s.inDelivery || 0} icon="car-outline" color={colors.secondary} />
      </View>

      {s.revenue !== undefined && (
        <View style={styles.revenueCard}>
          <View style={styles.revenueIcon}>
            <Ionicons name="wallet-outline" size={24} color={colors.success} />
          </View>
          <View>
            <Text style={styles.revenueLabel}>Chiffre d'affaires</Text>
            <Text style={styles.revenueValue}>
              {Number(s.revenue || 0).toLocaleString('fr-FR')} Fr
            </Text>
          </View>
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Commandes', icon: 'list-outline' as const, screen: 'Orders', color: colors.primary },
            { label: 'À appeler', icon: 'call-outline' as const, screen: 'ToCall', color: colors.warning },
            { label: 'Utilisateurs', icon: 'people-outline' as const, screen: 'Users', color: colors.info },
            { label: 'Produits', icon: 'cube-outline' as const, screen: 'Products', color: colors.success },
            { label: 'Livraisons', icon: 'bicycle-outline' as const, screen: 'Deliveries', color: colors.secondary },
            { label: 'Statistiques', icon: 'bar-chart-outline' as const, screen: 'Stats', color: colors.statusReturned },
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

      {recentOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commandes récentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.viewAll}>Voir tout →</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.slice(0, 5).map((o: any) => (
            <TouchableOpacity
              key={o.id}
              style={styles.miniOrder}
              onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}
            >
              <View style={styles.miniOrderLeft}>
                <Text style={styles.miniOrderRef}>#{o.orderReference}</Text>
                <Text style={styles.miniOrderClient}>{o.clientNom}</Text>
              </View>
              <Text style={styles.miniOrderAmount}>
                {o.montant?.toLocaleString('fr-FR')} Fr
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  greeting: { marginBottom: spacing.xxl },
  hello: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  role: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  revenueCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    backgroundColor: colors.success + '10', borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.xxl,
    borderWidth: 1, borderColor: colors.success + '30',
  },
  revenueIcon: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center',
  },
  revenueLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  revenueValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.success },
  quickActions: { marginBottom: spacing.xxl },
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
  section: { marginBottom: spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  viewAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  miniOrder: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, backgroundColor: colors.card, borderRadius: radius.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  miniOrderLeft: {},
  miniOrderRef: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
  miniOrderClient: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  miniOrderAmount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.success },
});
