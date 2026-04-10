import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius, STATUS_LABELS, STATUS_COLORS } from '../../theme';
import EmptyState from '../../components/EmptyState';
import { deliveryApi } from '../../lib/api';

export default function DeliveriesScreen({ navigation }: any) {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await deliveryApi.getLists();
      setLists(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          loading ? null : <EmptyState title="Aucune liste" message="Aucune liste de livraison trouvée" icon="bicycle-outline" />
        }
        renderItem={({ item }) => {
          const ordersCount = item.orders?.length || item._count?.orders || 0;
          const livreur = item.deliverer;
          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.nom}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.date).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="bicycle-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>
                    {livreur ? `${livreur.prenom} ${livreur.nom}` : 'Non assigné'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{ordersCount} commande(s)</Text>
                </View>
                {item.zone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.infoText}>{item.zone}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, flex: 1 },
  cardDate: { fontSize: fontSize.xs, color: colors.textMuted },
  cardBody: { gap: spacing.xs + 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { fontSize: fontSize.sm, color: colors.textSecondary },
});
