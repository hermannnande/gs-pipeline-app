import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, Alert, Linking,
} from 'react-native';
import { colors, spacing, fontSize } from '../../theme';
import OrderCard from '../../components/OrderCard';
import ActionButton from '../../components/ActionButton';
import EmptyState from '../../components/EmptyState';
import { deliveryApi, ordersApi } from '../../lib/api';

export default function MyDeliveriesScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await deliveryApi.getMyOrders();
      setOrders(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  const handleAction = async (orderId: number, status: string) => {
    try {
      await ordersApi.updateStatus(orderId, { status });
      Alert.alert('Succès', `Commande marquée comme ${status === 'LIVREE' ? 'livrée' : status === 'REFUSEE' ? 'refusée' : 'annulée'}`);
      fetchOrders();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Échec');
    }
  };

  const assignees = orders.filter((o) => o.status === 'ASSIGNEE');
  const others = orders.filter((o) => o.status !== 'ASSIGNEE');

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{assignees.length}</Text>
          <Text style={styles.summaryLabel}>À livrer</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{orders.filter(o => o.status === 'LIVREE').length}</Text>
          <Text style={styles.summaryLabel}>Livrées</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{orders.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={[...assignees, ...others]}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          loading ? null : <EmptyState title="Aucune livraison" message="Vous n'avez pas de livraisons assignées" icon="bicycle-outline" />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            actions={
              item.status === 'ASSIGNEE' ? (
                <>
                  <ActionButton label="Appeler" icon="call-outline" size="sm"
                    color={colors.info} onPress={() => Linking.openURL(`tel:${item.clientTelephone}`)} />
                  <ActionButton label="Livré" icon="checkmark-done-outline" size="sm"
                    color={colors.success} onPress={() => handleAction(item.id, 'LIVREE')} />
                  <ActionButton label="Refusé" icon="hand-left-outline" size="sm"
                    color={colors.danger} variant="outline" onPress={() => handleAction(item.id, 'REFUSEE')} />
                  <ActionButton label="Annulé" icon="close-outline" size="sm"
                    color={colors.warning} variant="outline" onPress={() => handleAction(item.id, 'ANNULEE_LIVRAISON')} />
                </>
              ) : undefined
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  summary: {
    flexDirection: 'row', backgroundColor: colors.card, padding: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  divider: { width: 1, backgroundColor: colors.border },
  list: { padding: spacing.lg },
});
