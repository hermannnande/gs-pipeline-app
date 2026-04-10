import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, RefreshControl, Linking, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius, STATUS_LABELS, STATUS_COLORS } from '../../theme';
import ActionButton from '../../components/ActionButton';
import { ordersApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const user = useAuthStore((s) => s.user);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState('');

  const fetchOrder = async () => {
    try {
      const { data } = await ordersApi.getById(orderId);
      setOrder(data);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger la commande');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  };

  const changeStatus = async (newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, { status: newStatus, note: note || undefined });
      Alert.alert('Succès', `Statut → ${STATUS_LABELS[newStatus] || newStatus}`);
      setNote('');
      fetchOrder();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Échec');
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || colors.textMuted;
  const role = user?.role;

  const canCall = ['NOUVELLE', 'A_APPELER', 'INJOIGNABLE'].includes(order.status) &&
    ['APPELANT', 'ADMIN', 'GESTIONNAIRE'].includes(role || '');
  const canDeliver = order.status === 'ASSIGNEE' && ['LIVREUR', 'ADMIN'].includes(role || '');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.ref}>#{order.orderReference}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {STATUS_LABELS[order.status] || order.status}
            </Text>
          </View>
        </View>
        {order.priorite && (
          <View style={styles.priorityRow}>
            <Ionicons name="flame" size={14} color={colors.danger} />
            <Text style={styles.priorityText}>Prioritaire</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <InfoRow icon="person-outline" label="Nom" value={order.clientNom} />
        <InfoRow icon="call-outline" label="Téléphone" value={order.clientTelephone}
          onPress={() => Linking.openURL(`tel:${order.clientTelephone}`)} />
        <InfoRow icon="location-outline" label="Ville" value={order.clientVille} />
        {order.clientCommune && <InfoRow icon="map-outline" label="Commune" value={order.clientCommune} />}
        {order.clientAdresse && <InfoRow icon="home-outline" label="Adresse" value={order.clientAdresse} />}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Produit</Text>
        <InfoRow icon="cube-outline" label="Produit" value={order.produitNom} />
        <InfoRow icon="layers-outline" label="Quantité" value={String(order.quantite)} />
        <InfoRow icon="cash-outline" label="Montant" value={`${order.montant?.toLocaleString('fr-FR')} Fr`} />
        <InfoRow icon="pricetag-outline" label="Type" value={order.deliveryType} />
      </View>

      {(order.noteAppelant || order.noteLivreur || order.noteGestionnaire) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          {order.noteAppelant && <NoteBox label="Appelant" text={order.noteAppelant} color={colors.info} />}
          {order.noteLivreur && <NoteBox label="Livreur" text={order.noteLivreur} color={colors.success} />}
          {order.noteGestionnaire && <NoteBox label="Gestionnaire" text={order.noteGestionnaire} color={colors.warning} />}
        </View>
      )}

      {order.deliverer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livreur assigné</Text>
          <InfoRow icon="bicycle-outline" label="Livreur" value={`${order.deliverer.prenom} ${order.deliverer.nom}`} />
        </View>
      )}

      {order.caller && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appelant</Text>
          <InfoRow icon="headset-outline" label="Appelant" value={`${order.caller.prenom} ${order.caller.nom}`} />
          <InfoRow icon="call-outline" label="Nb appels" value={String(order.nombreAppels || 0)} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Note (optionnel)..."
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
        />

        {canCall && (
          <View style={styles.actionsRow}>
            <ActionButton label="Marquer appel" icon="call-outline" size="md"
              color={colors.info} fullWidth
              onPress={async () => {
                await ordersApi.marquerAppel(orderId);
                fetchOrder();
              }} />
          </View>
        )}
        {canCall && (
          <View style={styles.actionsRow}>
            <ActionButton label="Valider" icon="checkmark-outline" color={colors.success}
              fullWidth onPress={() => changeStatus('VALIDEE')} />
            <ActionButton label="Annuler" icon="close-outline" color={colors.danger}
              variant="outline" fullWidth onPress={() => changeStatus('ANNULEE')} />
          </View>
        )}
        {canCall && (
          <View style={styles.actionsRow}>
            <ActionButton label="Injoignable" icon="call-outline" color={colors.warning}
              variant="outline" fullWidth onPress={() => changeStatus('INJOIGNABLE')} />
            <ActionButton label="Expédition" icon="airplane-outline" color={colors.statusExpedition}
              variant="outline" fullWidth onPress={() => changeStatus('EXPEDITION')} />
          </View>
        )}

        {canDeliver && (
          <View style={styles.actionsRow}>
            <ActionButton label="Livré" icon="checkmark-done-outline" color={colors.success}
              fullWidth onPress={() => changeStatus('LIVREE')} />
            <ActionButton label="Refusé" icon="hand-left-outline" color={colors.danger}
              variant="outline" fullWidth onPress={() => changeStatus('REFUSEE')} />
          </View>
        )}
        {canDeliver && (
          <View style={styles.actionsRow}>
            <ActionButton label="Annulé livraison" icon="close-circle-outline" color={colors.warning}
              variant="outline" fullWidth onPress={() => changeStatus('ANNULEE_LIVRAISON')} />
          </View>
        )}
      </View>

      <View style={{ height: spacing.xxxl * 2 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress?: () => void;
}) {
  const Comp = onPress ? require('react-native').TouchableOpacity : View;
  return (
    <Comp style={infoStyles.row} onPress={onPress}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, onPress && { color: colors.primary }]} numberOfLines={2}>{value}</Text>
    </Comp>
  );
}

function NoteBox({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <View style={[noteStyles.box, { borderLeftColor: color }]}>
      <Text style={[noteStyles.label, { color }]}>{label}</Text>
      <Text style={noteStyles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md },
  headerCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  badge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: radius.full, gap: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: fontSize.sm, fontWeight: '600' },
  priorityRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.sm,
  },
  priorityText: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' },
  section: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  noteInput: {
    backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md,
    fontSize: fontSize.sm, color: colors.text, minHeight: 60,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
    textAlignVertical: 'top',
  },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs + 2 },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, width: 80 },
  value: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, flex: 1 },
});

const noteStyles = StyleSheet.create({
  box: {
    backgroundColor: colors.bg, borderRadius: radius.sm, padding: spacing.md,
    borderLeftWidth: 3, marginBottom: spacing.sm,
  },
  label: { fontSize: fontSize.xs, fontWeight: '700', marginBottom: 2 },
  text: { fontSize: fontSize.sm, color: colors.textSecondary },
});
