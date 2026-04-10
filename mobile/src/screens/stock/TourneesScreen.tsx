import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';
import EmptyState from '../../components/EmptyState';
import ActionButton from '../../components/ActionButton';
import { stockApi } from '../../lib/api';

export default function TourneesScreen() {
  const [tournees, setTournees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await stockApi.getTournees();
      setTournees(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const confirmRemise = async (id: number) => {
    try {
      await stockApi.confirmRemise(id, {});
      Alert.alert('Succès', 'Remise confirmée');
      fetchData();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Échec');
    }
  };

  const confirmRetour = async (id: number) => {
    try {
      await stockApi.confirmRetour(id, {});
      Alert.alert('Succès', 'Retour confirmé');
      fetchData();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Échec');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tournees}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          loading ? null : <EmptyState title="Aucune tournée" message="Pas de tournée stock trouvée" icon="car-outline" />
        }
        renderItem={({ item }) => {
          const dl = item.deliveryList || {};
          const livreur = dl.deliverer;
          const ts = item;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{dl.nom || `Tournée #${item.id}`}</Text>
                <Text style={styles.cardDate}>{dl.date ? new Date(dl.date).toLocaleDateString('fr-FR') : ''}</Text>
              </View>

              {livreur && (
                <View style={styles.infoRow}>
                  <Ionicons name="bicycle-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{livreur.prenom} {livreur.nom}</Text>
                </View>
              )}

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{ts.colisRemis || 0}</Text>
                  <Text style={styles.metricLabel}>Remis</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={[styles.metricValue, { color: colors.success }]}>{ts.colisLivres || 0}</Text>
                  <Text style={styles.metricLabel}>Livrés</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={[styles.metricValue, { color: colors.warning }]}>{ts.colisRetour || 0}</Text>
                  <Text style={styles.metricLabel}>Retour</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={[styles.metricValue, { color: ts.ecart ? colors.danger : colors.success }]}>
                    {ts.ecart || 0}
                  </Text>
                  <Text style={styles.metricLabel}>Écart</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: ts.colisRemisConfirme ? colors.success + '15' : colors.warning + '15' }]}>
                  <Ionicons name={ts.colisRemisConfirme ? 'checkmark-circle' : 'time'} size={14}
                    color={ts.colisRemisConfirme ? colors.success : colors.warning} />
                  <Text style={[styles.statusText, { color: ts.colisRemisConfirme ? colors.success : colors.warning }]}>
                    Remise {ts.colisRemisConfirme ? '✓' : 'en attente'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: ts.colisRetourConfirme ? colors.success + '15' : colors.textMuted + '15' }]}>
                  <Ionicons name={ts.colisRetourConfirme ? 'checkmark-circle' : 'time'} size={14}
                    color={ts.colisRetourConfirme ? colors.success : colors.textMuted} />
                  <Text style={[styles.statusText, { color: ts.colisRetourConfirme ? colors.success : colors.textMuted }]}>
                    Retour {ts.colisRetourConfirme ? '✓' : 'en attente'}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                {!ts.colisRemisConfirme && (
                  <ActionButton label="Confirmer remise" icon="checkmark-outline" size="sm"
                    color={colors.success} onPress={() => confirmRemise(item.id)} />
                )}
                {ts.colisRemisConfirme && !ts.colisRetourConfirme && (
                  <ActionButton label="Confirmer retour" icon="return-down-back-outline" size="sm"
                    color={colors.info} onPress={() => confirmRetour(item.id)} />
                )}
              </View>
            </View>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, flex: 1 },
  cardDate: { fontSize: fontSize.xs, color: colors.textMuted },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  infoText: { fontSize: fontSize.sm, color: colors.textSecondary },
  metricsRow: { flexDirection: 'row', marginBottom: spacing.md },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  metricLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
