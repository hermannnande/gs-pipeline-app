import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';
import StatCard from '../../components/StatCard';
import { productsApi, stockApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function StockOverviewScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [products, setProducts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, alertRes] = await Promise.all([
        productsApi.getAll({ actif: true }),
        productsApi.lowStockAlerts(),
      ]);
      setProducts(prodRes.data || []);
      setAlerts(alertRes.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const totalStock = products.reduce((s: number, p: any) => s + (p.stockActuel || 0), 0);
  const totalExpress = products.reduce((s: number, p: any) => s + (p.stockExpress || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <Text style={styles.hello}>Bonjour, {user?.prenom} 👋</Text>
      <Text style={styles.role}>Gestionnaire de Stock</Text>

      <View style={styles.statsGrid}>
        <StatCard title="Stock total" value={totalStock} icon="cube-outline" color={colors.primary} />
        <StatCard title="Stock Express" value={totalExpress} icon="flash-outline" color={colors.secondary} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard title="Produits" value={products.length} icon="layers-outline" color={colors.info} />
        <StatCard title="Alertes" value={alerts.length} icon="warning-outline" color={colors.danger} />
      </View>

      {alerts.length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.sectionTitle}>⚠️ Alertes stock bas</Text>
          {alerts.slice(0, 5).map((p: any) => (
            <View key={p.id} style={styles.alertCard}>
              <View style={styles.alertLeft}>
                <Text style={styles.alertName} numberOfLines={1}>{p.nom}</Text>
                <Text style={styles.alertCode}>{p.code}</Text>
              </View>
              <View style={styles.alertRight}>
                <Text style={styles.alertStock}>{p.stockActuel}</Text>
                <Text style={styles.alertThreshold}>/ {p.stockAlerte}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Produits', icon: 'cube-outline' as const, screen: 'Products', color: colors.primary },
            { label: 'Tournées', icon: 'car-outline' as const, screen: 'Tournees', color: colors.success },
            { label: 'Mouvements', icon: 'swap-horizontal-outline' as const, screen: 'Movements', color: colors.info },
            { label: 'Livraisons', icon: 'bicycle-outline' as const, screen: 'Deliveries', color: colors.secondary },
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
  alertSection: { marginTop: spacing.md, marginBottom: spacing.xxl },
  alertCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.danger + '08', borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.danger + '20',
  },
  alertLeft: { flex: 1 },
  alertName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  alertCode: { fontSize: fontSize.xs, color: colors.textMuted },
  alertRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  alertStock: { fontSize: fontSize.lg, fontWeight: '800', color: colors.danger },
  alertThreshold: { fontSize: fontSize.xs, color: colors.textMuted },
  quickActions: { marginTop: spacing.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: {
    width: '46%', alignItems: 'center', padding: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  actionLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.text, textAlign: 'center' },
});
