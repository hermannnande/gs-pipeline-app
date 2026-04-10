import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../theme';
import { useAuthStore } from '../store/authStore';

import LoginScreen from '../screens/auth/LoginScreen';

import AdminOverviewScreen from '../screens/admin/OverviewScreen';
import AppelantOverviewScreen from '../screens/appelant/OverviewScreen';
import GestionnaireOverviewScreen from '../screens/gestionnaire/OverviewScreen';
import StockOverviewScreen from '../screens/stock/OverviewScreen';
import LivreurOverviewScreen from '../screens/livreur/OverviewScreen';

import OrdersScreen from '../screens/common/OrdersScreen';
import OrderDetailScreen from '../screens/common/OrderDetailScreen';
import StatsScreen from '../screens/common/StatsScreen';

import ToCallScreen from '../screens/appelant/ToCallScreen';
import ValidatedOrdersScreen from '../screens/gestionnaire/ValidatedOrdersScreen';
import DeliveriesScreen from '../screens/gestionnaire/DeliveriesScreen';
import MyDeliveriesScreen from '../screens/livreur/MyDeliveriesScreen';
import ProductsScreen from '../screens/stock/ProductsScreen';
import TourneesScreen from '../screens/stock/TourneesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: fontSize.md },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline', Orders: 'list-outline', ToCall: 'call-outline',
            Stats: 'bar-chart-outline', More: 'ellipsis-horizontal-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipsis-horizontal'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.card, height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        ...screenOptions,
      })}
    >
      <Tab.Screen name="Home" component={AdminOverviewScreen} options={{ title: 'Accueil', headerTitle: 'GS Pipeline' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Commandes' }} />
      <Tab.Screen name="ToCall" component={ToCallScreen} options={{ title: 'À appeler' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistiques' }} />
      <Tab.Screen name="More" component={AdminMoreStack} options={{ title: 'Plus', headerShown: false }} />
    </Tab.Navigator>
  );
}

function AdminMoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'Plus' }} />
      <Stack.Screen name="Validated" component={ValidatedOrdersScreen} options={{ title: 'Validées' }} />
      <Stack.Screen name="Deliveries" component={DeliveriesScreen} options={{ title: 'Livraisons' }} />
      <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Produits' }} />
      <Stack.Screen name="Tournees" component={TourneesScreen} options={{ title: 'Tournées' }} />
      <Stack.Screen name="Users" component={UsersPlaceholder} options={{ title: 'Utilisateurs' }} />
      <Stack.Screen name="Expeditions" component={ExpeditionsPlaceholder} options={{ title: 'Expéditions' }} />
    </Stack.Navigator>
  );
}

function AppelantTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline', ToCall: 'call-outline', Orders: 'list-outline',
            Stats: 'bar-chart-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipsis-horizontal'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.card, height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        ...screenOptions,
      })}
    >
      <Tab.Screen name="Home" component={AppelantOverviewScreen} options={{ title: 'Accueil', headerTitle: 'GS Pipeline' }} />
      <Tab.Screen name="ToCall" component={ToCallScreen} options={{ title: 'À appeler' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Commandes' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
    </Tab.Navigator>
  );
}

function GestionnaireTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline', ToCall: 'call-outline', Orders: 'list-outline',
            Validated: 'checkmark-circle-outline', More: 'ellipsis-horizontal-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipsis-horizontal'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.card, height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        ...screenOptions,
      })}
    >
      <Tab.Screen name="Home" component={GestionnaireOverviewScreen} options={{ title: 'Accueil', headerTitle: 'GS Pipeline' }} />
      <Tab.Screen name="ToCall" component={ToCallScreen} options={{ title: 'À appeler' }} />
      <Tab.Screen name="Validated" component={ValidatedOrdersScreen} options={{ title: 'Validées' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Commandes' }} />
      <Tab.Screen name="More" component={GestionnaireMoreStack} options={{ title: 'Plus', headerShown: false }} />
    </Tab.Navigator>
  );
}

function GestionnaireMoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'Plus' }} />
      <Stack.Screen name="Deliveries" component={DeliveriesScreen} options={{ title: 'Livraisons' }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistiques' }} />
      <Stack.Screen name="Expeditions" component={ExpeditionsPlaceholder} options={{ title: 'Expéditions' }} />
    </Stack.Navigator>
  );
}

function StockTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline', Products: 'cube-outline', Tournees: 'car-outline',
            Deliveries: 'bicycle-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipsis-horizontal'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.card, height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        ...screenOptions,
      })}
    >
      <Tab.Screen name="Home" component={StockOverviewScreen} options={{ title: 'Accueil', headerTitle: 'GS Pipeline' }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: 'Produits' }} />
      <Tab.Screen name="Tournees" component={TourneesScreen} options={{ title: 'Tournées' }} />
      <Tab.Screen name="Deliveries" component={DeliveriesScreen} options={{ title: 'Livraisons' }} />
    </Tab.Navigator>
  );
}

function LivreurTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline', MyDeliveries: 'bicycle-outline', Stats: 'bar-chart-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipsis-horizontal'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.card, height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        ...screenOptions,
      })}
    >
      <Tab.Screen name="Home" component={LivreurOverviewScreen} options={{ title: 'Accueil', headerTitle: 'GS Pipeline' }} />
      <Tab.Screen name="MyDeliveries" component={MyDeliveriesScreen} options={{ title: 'Livraisons' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
    </Tab.Navigator>
  );
}

function getRoleTabs(role: string) {
  switch (role) {
    case 'ADMIN': return AdminTabs;
    case 'GESTIONNAIRE': return GestionnaireTabs;
    case 'GESTIONNAIRE_STOCK': return StockTabs;
    case 'APPELANT': return AppelantTabs;
    case 'LIVREUR': return LivreurTabs;
    default: return AppelantTabs;
  }
}

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

function MoreMenuScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = user?.role || '';

  const menuItems = [
    ...(role === 'ADMIN' || role === 'GESTIONNAIRE' ? [
      { label: 'Commandes validées', icon: 'checkmark-circle-outline' as const, screen: 'Validated', color: colors.success },
      { label: 'Listes de livraison', icon: 'bicycle-outline' as const, screen: 'Deliveries', color: colors.secondary },
      { label: 'Expéditions & Express', icon: 'airplane-outline' as const, screen: 'Expeditions', color: colors.statusExpedition },
    ] : []),
    ...(role === 'ADMIN' ? [
      { label: 'Produits & Stock', icon: 'cube-outline' as const, screen: 'Products', color: colors.primary },
      { label: 'Tournées stock', icon: 'car-outline' as const, screen: 'Tournees', color: colors.info },
      { label: 'Utilisateurs', icon: 'people-outline' as const, screen: 'Users', color: colors.statusReturned },
    ] : []),
    ...(role === 'GESTIONNAIRE' ? [
      { label: 'Statistiques', icon: 'bar-chart-outline' as const, screen: 'Stats', color: colors.statusReturned },
    ] : []),
  ];

  return (
    <ScrollView style={moreStyles.container} contentContainerStyle={moreStyles.content}>
      <View style={moreStyles.profileCard}>
        <View style={moreStyles.avatar}>
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
        <View>
          <Text style={moreStyles.name}>{user?.prenom} {user?.nom}</Text>
          <Text style={moreStyles.email}>{user?.email}</Text>
          <Text style={moreStyles.roleText}>{role.replace('_', ' ')}</Text>
        </View>
      </View>

      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={moreStyles.menuItem}
          onPress={() => navigation.navigate(item.screen)}
          activeOpacity={0.7}
        >
          <View style={[moreStyles.menuIcon, { backgroundColor: item.color + '15' }]}>
            <Ionicons name={item.icon} size={20} color={item.color} />
          </View>
          <Text style={moreStyles.menuLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={moreStyles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={moreStyles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function UsersPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <Ionicons name="people-outline" size={48} color={colors.textMuted} />
      <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: fontSize.md }}>
        Gestion des utilisateurs
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 }}>
        Disponible sur la version web
      </Text>
    </View>
  );
}

function ExpeditionsPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <Ionicons name="airplane-outline" size={48} color={colors.textMuted} />
      <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: fontSize.md }}>
        Expéditions & Express
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 }}>
        Gérez les expéditions via la liste des commandes (filtre Expédition/Express)
      </Text>
    </View>
  );
}

const moreStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.card, borderRadius: 16, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  roleText: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 12, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, padding: 16, borderRadius: 12,
    backgroundColor: colors.danger + '08', borderWidth: 1, borderColor: colors.danger + '30',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.danger },
});

export default function AppNavigator() {
  const { user, loading, loadUser } = useAuthStore();

  React.useEffect(() => { loadUser(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ color: colors.textMuted }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={getRoleTabs(user.role)} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen}
            options={{ headerShown: true, ...screenOptions, title: 'Détail commande' }} />
          <Stack.Screen name="Validated" component={ValidatedOrdersScreen}
            options={{ headerShown: true, ...screenOptions, title: 'Commandes validées' }} />
          <Stack.Screen name="Deliveries" component={DeliveriesScreen}
            options={{ headerShown: true, ...screenOptions, title: 'Livraisons' }} />
          <Stack.Screen name="Products" component={ProductsScreen}
            options={{ headerShown: true, ...screenOptions, title: 'Produits' }} />
          <Stack.Screen name="Tournees" component={TourneesScreen}
            options={{ headerShown: true, ...screenOptions, title: 'Tournées' }} />
          <Stack.Screen name="RDV" component={ExpeditionsPlaceholder}
            options={{ headerShown: true, ...screenOptions, title: 'RDV' }} />
          <Stack.Screen name="Processed" component={OrdersScreen}
            options={{ headerShown: true, ...screenOptions, title: 'Mes commandes traitées' }} />
          <Stack.Screen name="Expeditions" component={ExpeditionsPlaceholder}
            options={{ headerShown: true, ...screenOptions, title: 'Expéditions' }} />
          <Stack.Screen name="Users" component={UsersPlaceholder}
            options={{ headerShown: true, ...screenOptions, title: 'Utilisateurs' }} />
          <Stack.Screen name="Chat" component={UsersPlaceholder}
            options={{ headerShown: true, ...screenOptions, title: 'Chat' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
