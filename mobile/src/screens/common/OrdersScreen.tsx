import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius, STATUS_LABELS, STATUS_COLORS } from '../../theme';
import OrderCard from '../../components/OrderCard';
import ActionButton from '../../components/ActionButton';
import EmptyState from '../../components/EmptyState';
import { ordersApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const STATUS_FILTERS = [
  'TOUS', 'NOUVELLE', 'A_APPELER', 'VALIDEE', 'ANNULEE', 'INJOIGNABLE',
  'ASSIGNEE', 'LIVREE', 'REFUSEE', 'RETOURNE', 'EXPEDITION', 'EXPRESS',
];

export default function OrdersScreen({ navigation, route }: any) {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TOUS');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const initialStatus = route?.params?.status;

  useEffect(() => {
    if (initialStatus) setStatusFilter(initialStatus);
  }, [initialStatus]);

  const fetchOrders = useCallback(async (p = 1) => {
    try {
      const params: any = { page: p, limit: 30 };
      if (statusFilter !== 'TOUS') params.status = statusFilter;
      const { data } = await ordersApi.getAll(params);
      const list = data.orders || data || [];
      if (p === 1) {
        setOrders(list);
      } else {
        setOrders((prev) => [...prev, ...list]);
      }
      setTotal(data.total || list.length);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders(1);
  }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (orders.length < total) fetchOrders(page + 1);
  };

  const filtered = search.trim()
    ? orders.filter((o) =>
        o.clientNom?.toLowerCase().includes(search.toLowerCase()) ||
        o.clientTelephone?.includes(search) ||
        o.orderReference?.includes(search) ||
        o.clientVille?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const handleStatusChange = async (orderId: number, newStatus: string, note?: string) => {
    try {
      await ordersApi.updateStatus(orderId, { status: newStatus, note });
      Alert.alert('Succès', 'Statut mis à jour');
      fetchOrders(1);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible de mettre à jour');
    }
  };

  const renderActions = (order: any) => {
    const role = user?.role;
    const status = order.status;
    const actions: React.ReactNode[] = [];

    if ((status === 'NOUVELLE' || status === 'A_APPELER' || status === 'INJOIGNABLE') &&
        (role === 'APPELANT' || role === 'ADMIN' || role === 'GESTIONNAIRE')) {
      actions.push(
        <ActionButton key="call" label="Appeler" icon="call-outline" size="sm"
          color={colors.info} onPress={() => ordersApi.marquerAppel(order.id).then(() => fetchOrders(1))} />,
        <ActionButton key="val" label="Valider" icon="checkmark-outline" size="sm"
          color={colors.success} onPress={() => handleStatusChange(order.id, 'VALIDEE')} />,
        <ActionButton key="ann" label="Annuler" icon="close-outline" size="sm"
          color={colors.danger} variant="outline" onPress={() => handleStatusChange(order.id, 'ANNULEE')} />,
        <ActionButton key="inj" label="Injoignable" icon="call-outline" size="sm"
          color={colors.warning} variant="outline" onPress={() => handleStatusChange(order.id, 'INJOIGNABLE')} />,
      );
    }

    if (status === 'ASSIGNEE' && (role === 'LIVREUR' || role === 'ADMIN')) {
      actions.push(
        <ActionButton key="liv" label="Livré" icon="checkmark-done-outline" size="sm"
          color={colors.success} onPress={() => handleStatusChange(order.id, 'LIVREE')} />,
        <ActionButton key="ref" label="Refusé" icon="hand-left-outline" size="sm"
          color={colors.danger} variant="outline" onPress={() => handleStatusChange(order.id, 'REFUSEE')} />,
      );
    }

    return actions.length > 0 ? <>{actions}</> : undefined;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher (nom, tél, ville...)"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(s) => s}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => {
          const active = statusFilter === item;
          const clr = item === 'TOUS' ? colors.primary : (STATUS_COLORS[item] || colors.textMuted);
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && { backgroundColor: clr + '18', borderColor: clr }]}
              onPress={() => setStatusFilter(item)}
            >
              <Text style={[styles.filterText, active && { color: clr, fontWeight: '700' }]}>
                {item === 'TOUS' ? 'Tous' : (STATUS_LABELS[item] || item)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={styles.count}>{filtered.length} commande(s)</Text>

      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? null : <EmptyState title="Aucune commande" message="Aucune commande trouvée pour ce filtre" />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            actions={renderActions(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    margin: spacing.lg, marginBottom: 0,
    backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.lg,
    height: 44, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  filterList: { maxHeight: 44, marginTop: spacing.md },
  filterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterText: { fontSize: fontSize.xs, color: colors.textSecondary },
  count: {
    fontSize: fontSize.xs, color: colors.textMuted, marginHorizontal: spacing.lg,
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
});
