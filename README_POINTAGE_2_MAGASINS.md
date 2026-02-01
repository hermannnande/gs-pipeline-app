# 🏢 Pointage GPS - 2 Magasins

## 🚀 Installation Rapide

### Option 1 : Script Interactif (Recommandé ⭐)

```powershell
.\INSTALLER_POINTAGE_2_MAGASINS.ps1
```

Le script vous guide pas à pas pour configurer vos 2 magasins.

---

### Option 2 : Configuration Manuelle

**1. Obtenir vos coordonnées GPS**

- Ouvrir [Google Maps](https://www.google.com/maps)
- Cliquer-droit sur votre magasin
- Copier les coordonnées (ex: `5.353021, -3.870182`)
- Répéter pour le 2ème magasin

**2. Modifier le script**

Ouvrir `scripts/setup-two-stores.js` et remplacer :

```javascript
// MAGASIN 1
latitude: 5.353021,   // ⚠️ VOTRE LATITUDE
longitude: -3.870182, // ⚠️ VOTRE LONGITUDE

// MAGASIN 2
latitude: 5.323456,   // ⚠️ VOTRE LATITUDE
longitude: -4.012345, // ⚠️ VOTRE LONGITUDE
```

**3. Exécuter le script**

```powershell
node scripts/setup-two-stores.js
```

**4. Redémarrer le serveur**

```powershell
npm run dev
```

---

## 🎯 Fonctionnement

- ✅ Le système **détecte automatiquement** le magasin le plus proche
- ✅ L'employé peut pointer dans **n'importe lequel des 2 magasins**
- ✅ Distance validée : **≤ 50m** (ajustable à 100m ou 150m si nécessaire)
- ✅ Chaque pointage enregistre le **magasin utilisé**

---

## 📱 Interface Employé

**Dans le Dashboard, l'employé voit :**

```
🏢 2 Magasins disponibles

1. Magasin 1 - Yopougon
   📍 Yopougon, Abidjan
   📏 50m   🕐 08:00 - 18:00

2. Magasin 2 - Plateau
   📍 Plateau, Abidjan
   📏 50m   🕐 08:00 - 18:00
```

**Clic sur "Marquer ma présence" :**
- ✅ Accepté → Message : "Présence enregistrée (Bureau: Magasin X)"
- ❌ Refusé → Message : "Vous êtes à 120m du bureau le plus proche. Rapprochez-vous !"

---

## 🔧 Personnalisation

### Augmenter le Rayon (si trop de refus)

Dans `scripts/setup-two-stores.js` :

```javascript
rayonTolerance: 100,  // Passer de 50m à 100m
```

Relancer : `node scripts/setup-two-stores.js`

---

### Horaires Différents par Magasin

```javascript
// Magasin 1
heureOuverture: '08:00',
heureFermeture: '18:00',

// Magasin 2 (horaires décalés)
heureOuverture: '07:30',
heureFermeture: '19:00',
```

---

## 🐛 Problèmes Courants

| Problème | Solution |
|----------|----------|
| ❌ "Configuration non trouvée" | Exécuter `node scripts/setup-two-stores.js` |
| ❌ Pointages toujours refusés | Vérifier les coordonnées GPS sur Google Maps |
| ❌ Rayon trop petit | Augmenter à 100m ou 150m dans le script |
| ❌ Géolocalisation refusée | Autoriser l'accès dans les paramètres du navigateur |

---

## 📚 Documentation Complète

- **Installation détaillée** : [INSTALLATION_POINTAGE_2_MAGASINS.md](./INSTALLATION_POINTAGE_2_MAGASINS.md)
- **Guide utilisateur** : [GUIDE_CONFIGURATION_2_MAGASINS_GPS.md](./GUIDE_CONFIGURATION_2_MAGASINS_GPS.md)
- **Guide général** : [GUIDE_POINTAGE_GPS.md](./GUIDE_POINTAGE_GPS.md)

---

## ✅ Checklist

- [ ] Obtenir coordonnées GPS des 2 magasins
- [ ] Modifier `scripts/setup-two-stores.js`
- [ ] Exécuter le script
- [ ] Redémarrer le serveur
- [ ] Tester dans chaque magasin

---

**🚀 Bon pointage !**
