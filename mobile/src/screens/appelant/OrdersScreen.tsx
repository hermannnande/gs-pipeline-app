import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, STATUS_LABELS } from '../../theme';
import { ordersApi, rdvApi } from '../../lib/api';
import OrderCard from '../../components/OrderCard';
import ActionButton from '../../components/ActionButton';
import EmptyState from '../../components/EmptyState';

/** Préchargement du module rdv pour extension future (rappels / RDV). */
void rdvApi;

export interface AppelantOrder {
  id: number;
  orderReference: string;
  clientNom: string;
  clientTelephone: string;
  clientVille: string;
  produitNom: string;
  quantite: number;
  montant: number;
  status: string;
  nombreAppels?: number;
  priorite?: boolean;
  createdAt: string;
  noteAppelant?: string;
  noteLivreur?: string;
}

type FilterTab = 'A_APPELER' | 'INJOIGNABLE' | 'TOUTES';

type PendingStatus = 'VALIDEE' | 'ANNULEE' | 'INJOIGNABLE';

const TAB_CONFIG: { key: FilterTab; label: string }[] = [
  { key: 'A_APPELER', label: 'À appeler' },
  { key: 'INJOIGNABLE', label: 'Injoignable' },
  { key: 'TOUTES', label: 'Toutes' },
];

export default function OrdersScreen() {
  const [tab, setTab] = useState<FilterTab>('A_APPELER');
  const [orders, setOrders] = useState<AppelantOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [marquerId, setMarquerId] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<{
    orderId: number;
    status: PendingStatus;
  } | null>(null);
  const [note, setNote] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchParams = useCallback(
    (pageNum: number) => {
      const base: Record<string, string | number> = { page: pageNum, limit: 20 };
      if (tab === 'A_APPELER') base.status = 'A_APPELER';
      else if (tab === 'INJOIGNABLE') base.status = 'INJOIGNABLE';
      return base;
    },
    [tab]
  );

  const loadOrders = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        const { data } = await ordersApi.getAll(fetchParams(pageNum));
        const list = (data?.orders ?? []) as AppelantOrder[];
        const pagination = data?.pagination;
        setTotalPages(pagination?.totalPages ?? 1);
        if (append) {
          setOrders((prev) => {
            const ids = new Set(prev.map((o) => o.id));
            const merged = [...prev];
            for (const o of list) {
              if (!ids.has(o.id)) merged.push(o);
            }
            return merged;
          });
        } else {
          setOrders(list);
        }
        setPage(pageNum);
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : undefined;
        Alert.alert('Erreur', msg ?? 'Impossible de charger les commandes.');
        if (!append) setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [fetchParams]
  );

  React.useEffect(() => {
    setLoading(true);
    setOrders([]);
    setPage(1);
    loadOrders(1, false);
  }, [tab, loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders(1, false);
  }, [loadOrders]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || refreshing) return;
    if (page >= totalPages) return;
    setLoadingMore(true);
    loadOrders(page + 1, true);
  }, [loadOrders, loading, loadingMore, page, refreshing, totalPages]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.clientNom?.toLowerCase().includes(q) ||
        o.clientTelephone?.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [orders, search]);

  const handleMarquerAppel = async (id: number) => {
    setMarquerId(id);
    try {
      await ordersApi.marquerAppel(id);
      await loadOrders(1, false);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      Alert.alert('Erreur', msg ?? "Impossible d'enregistrer l'appel.");
    } finally {
      setMarquerId(null);
    }
  };

  const openStatusModal = (orderId: number, status: PendingStatus) => {
    setNote('');
    setStatusModal({ orderId, status });
  };

  const confirmStatus = async () => {
    if (!statusModal) return;
    setSubmittingStatus(true);
    try {
      await ordersApi.updateStatus(statusModal.orderId, {
        status: statusModal.status,
        note: note.trim() || undefined,
      });
      setStatusModal(null);
      setNote('');
      await loadOrders(1, false);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      Alert.alert('Erreur', msg ?? 'Mise à jour du statut impossible.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: AppelantOrder }) => (
      <OrderCard
        order={item}
        actions={
          <>
            <ActionButton
              label="Marquer appel"
              icon="call"
              onPress={() => handleMarquerAppel(item.id)}
              color={colors.primary}
              variant="outline"
              size="sm"
              loading={marquerId === item.id}
              disabled={marquerId !== null}
            />
            <ActionButton
              label="Validée"
              icon="checkmark-circle"
              onPress={() => openStatusModal(item.id, 'VALIDEE')}
              color={colors.success}
              variant="filled"
              size="sm"
            />
            <ActionButton
              label="Annulée"
              icon="close-circle"
              onPress={() => openStatusModal(item.id, 'ANNULEE')}
              color={colors.danger}
              variant="filled"
              size="sm"
            />
            <ActionButton
              label="Injoignable"
              icon="alert-circle"
              onPress={() => openStatusModal(item.id, 'INJOIGNABLE')}
              color={colors.warning}
              variant="filled"
              size="sm"
            />
          </>
        }
      />
    ),
    [marquerId]
  );

  const listHeader = (
    <>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher (nom, téléphone)…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={12}>
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.tabs}>
        {TAB_CONFIG.map(({ key, label }) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>À appeler</Text>
        <Text style={styles.screenSubtitle}>Gérez vos appels clients</Text>
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="call-outline"
              title={search.trim() ? 'Aucun résultat' : 'Aucune commande'}
              message={
                search.trim()
                  ? 'Essayez un autre nom ou numéro.'
                  : 'Les commandes à traiter apparaîtront ici.'
              }
            />
          }
        />
      )}

      <Modal visible={statusModal !== null} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => !submittingStatus && setStatusModal(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {statusModal
                ? `Passer en « ${STATUS_LABELS[statusModal.status] ?? statusModal.status} »`
                : ''}
            </Text>
            <Text style={styles.modalHint}>Note optionnelle (visible côté commande)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ajouter une note…"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <ActionButton
                label="Annuler"
                onPress={() => !submittingStatus && setStatusModal(null)}
                color={colors.textSecondary}
                variant="ghost"
                size="md"
                disabled={submittingStatus}
              />
              <ActionButton
                label="Confirmer"
                icon="checkmark"
                onPress={confirmStatus}
                color={colors.primary}
                variant="filled"
                size="md"
                loading={submittingStatus}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary + '14',
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    marginVertical: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  modalHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
