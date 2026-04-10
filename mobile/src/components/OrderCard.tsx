import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, STATUS_LABELS, STATUS_COLORS } from '../theme';

interface Order {
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

interface Props {
  order: Order;
  onPress?: () => void;
  showActions?: boolean;
  actions?: React.ReactNode;
}

export default function OrderCard({ order, onPress, actions }: Props) {
  const statusColor = STATUS_COLORS[order.status] || colors.textMuted;
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  return (
    <TouchableOpacity
      style={[styles.card, order.priorite && styles.priorityCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.refRow}>
          <Text style={styles.ref}>#{order.orderReference}</Text>
          {order.priorite && (
            <View style={styles.priorityBadge}>
              <Ionicons name="flame" size={12} color={colors.danger} />
            </View>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + '18' }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.bodyText} numberOfLines={1}>{order.clientNom}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.bodyText}>{order.clientTelephone}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.bodyText} numberOfLines={1}>{order.clientVille}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.bodyText} numberOfLines={1}>
            {order.produitNom} × {order.quantite}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="cash-outline" size={14} color={colors.success} />
          <Text style={[styles.bodyText, { color: colors.success, fontWeight: '700' }]}>
            {order.montant?.toLocaleString('fr-FR')} Fr
          </Text>
        </View>
      </View>

      {order.noteAppelant && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText} numberOfLines={2}>{order.noteAppelant}</Text>
        </View>
      )}

      {actions && <View style={styles.actions}>{actions}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityCard: {
    borderColor: colors.danger + '50',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ref: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  body: {
    gap: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bodyText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  noteBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + '10',
    borderRadius: radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.warning,
  },
  noteText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
