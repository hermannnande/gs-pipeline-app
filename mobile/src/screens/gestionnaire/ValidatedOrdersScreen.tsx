import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';
import OrderCard from '../../components/OrderCard';
import ActionButton from '../../components/ActionButton';
import EmptyState from '../../components/EmptyState';
import { deliveryApi, usersApi } from '../../lib/api';

export default function ValidatedOrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, usersRes] = await Promise.all([
        deliveryApi.getValidatedOrders(),
        usersApi.getAll({ role: 'LIVREUR', actif: true }),
      ]);
      setOrders(ordersRes.data || []);
      setLivreurs(usersRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const assignToDeliverer = async (delivererId: number) => {
    if (selected.size === 0) {
      Alert.alert('Attention', 'Sélectionnez au moins une commande');
      return;
    }
    try {
      const livreur = livreurs.find((l) => l.id === delivererId);
      await deliveryApi.assign({
        orderIds: Array.from(selected),
        delivererId,
        deliveryDate: new Date().toISOString(),
        listName: `Tournée ${livreur?.prenom || ''} ${new Date().toLocaleDateString('fr-FR')}`,
      });
      Alert.alert('Succès', `${selected.size} commande(s) assignée(s)`);
      setSelected(new Set());
      fetchData();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Échec de l\'assignation');
    }
  };

  return (
    <View style={styles.container}>
      {selected.size > 0 && (
        <View style={styles.assignBar}>
          <Text style={styles.assignText}>{selected.size} sélectionnée(s)</Text>
          <FlatList
            horizontal
            data={livreurs}
            keyExtractor={(l) => String(l.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.livreurChip}
                onPress={() => assignToDeliverer(item.id)}
              >
                <Ionicons name="bicycle" size={14} color={colors.primary} />
                <Text style={styles.livreurName}>{item.prenom}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          loading ? null : <EmptyState title="Aucune commande validée" message="Les commandes validées apparaîtront ici" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => toggleSelect(item.id)}
            activeOpacity={0.8}
          >
            <View style={selected.has(item.id) ? styles.selectedCard : undefined}>
              <OrderCard
                order={item}
                onPress={() => {
                  if (selected.size > 0) {
                    toggleSelect(item.id);
                  } else {
                    navigation.navigate('OrderDetail', { orderId: item.id });
                  }
                }}
              />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  assignBar: {
    backgroundColor: colors.primary + '10', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.primary + '30',
  },
  assignText: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm,
  },
  livreurChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  livreurName: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
  selectedCard: {
    borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primary,
    overflow: 'hidden',
  },
});
