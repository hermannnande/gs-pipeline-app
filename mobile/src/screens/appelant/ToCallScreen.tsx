import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { colors, spacing, fontSize } from '../../theme';
import OrderCard from '../../components/OrderCard';
import ActionButton from '../../components/ActionButton';
import EmptyState from '../../components/EmptyState';
import { ordersApi } from '../../lib/api';

export default function ToCallScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await ordersApi.getAll({ status: 'A_APPELER', limit: 100 });
      const list = data.orders || data || [];
      const nouvelles = (await ordersApi.getAll({ status: 'NOUVELLE', limit: 100 })).data;
      const nouvellesList = nouvelles.orders || nouvelles || [];
      const injoignables = (await ordersApi.getAll({ status: 'INJOIGNABLE', limit: 100 })).data;
      const injoignablesList = injoignables.orders || injoignables || [];

      const all = [...list, ...nouvellesList, ...injoignablesList]
        .sort((a, b) => {
          if (a.priorite && !b.priorite) return -1;
          if (!a.priorite && b.priorite) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      setOrders(all);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleAction = async (orderId: number, action: string) => {
    try {
      if (action === 'call') {
        await ordersApi.marquerAppel(orderId);
      } else {
        await ordersApi.updateStatus(orderId, { status: action });
      }
      Alert.alert('Succès', 'Action effectuée');
      fetchOrders();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Échec');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.count}>{orders.length} commande(s) à appeler</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          loading ? null : <EmptyState title="Aucune commande" message="Pas de commande à appeler pour le moment" icon="call-outline" />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            actions={
              <>
                <ActionButton label="Appeler" icon="call-outline" size="sm"
                  color={colors.info} onPress={() => handleAction(item.id, 'call')} />
                <ActionButton label="Valider" icon="checkmark-outline" size="sm"
                  color={colors.success} onPress={() => handleAction(item.id, 'VALIDEE')} />
                <ActionButton label="Annuler" icon="close-outline" size="sm"
                  color={colors.danger} variant="outline" onPress={() => handleAction(item.id, 'ANNULEE')} />
                <ActionButton label="Injoignable" icon="call-outline" size="sm"
                  color={colors.warning} variant="outline" onPress={() => handleAction(item.id, 'INJOIGNABLE')} />
              </>
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  count: {
    fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600',
    padding: spacing.lg, paddingBottom: 0,
  },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
});
