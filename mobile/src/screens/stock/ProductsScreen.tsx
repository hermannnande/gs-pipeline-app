import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';
import EmptyState from '../../components/EmptyState';
import ActionButton from '../../components/ActionButton';
import { productsApi } from '../../lib/api';

export default function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await productsApi.getAll({ actif: true });
      setProducts(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  const onRefresh = async () => { setRefreshing(true); await fetchProducts(); setRefreshing(false); };

  const filtered = search.trim()
    ? products.filter((p: any) =>
        p.nom?.toLowerCase().includes(search.toLowerCase()) ||
        p.code?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const getStockColor = (p: any) => {
    if (p.stockActuel <= 0) return colors.danger;
    if (p.stockActuel <= (p.stockAlerte || 10)) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          loading ? null : <EmptyState title="Aucun produit" message="Aucun produit trouvé" icon="cube-outline" />
        }
        renderItem={({ item }) => {
          const stockColor = getStockColor(item);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <Text style={styles.productName} numberOfLines={1}>{item.nom}</Text>
                  <Text style={styles.productCode}>{item.code}</Text>
                </View>
                <Text style={styles.price}>
                  {item.prixUnitaire?.toLocaleString('fr-FR')} Fr
                </Text>
              </View>

              <View style={styles.stockRow}>
                <View style={styles.stockItem}>
                  <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
                  <Text style={styles.stockLabel}>Stock</Text>
                  <Text style={[styles.stockValue, { color: stockColor }]}>{item.stockActuel}</Text>
                </View>
                <View style={styles.stockItem}>
                  <View style={[styles.stockDot, { backgroundColor: colors.secondary }]} />
                  <Text style={styles.stockLabel}>Express</Text>
                  <Text style={styles.stockValue}>{item.stockExpress}</Text>
                </View>
                <View style={styles.stockItem}>
                  <View style={[styles.stockDot, { backgroundColor: colors.info }]} />
                  <Text style={styles.stockLabel}>Livraison</Text>
                  <Text style={styles.stockValue}>{item.stockLocalReserve}</Text>
                </View>
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
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    margin: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, height: 44, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardLeft: { flex: 1 },
  productName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  productCode: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: fontSize.sm, fontWeight: '700', color: colors.success },
  stockRow: { flexDirection: 'row', gap: spacing.lg },
  stockItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  stockValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
});
