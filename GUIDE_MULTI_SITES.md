# 🏢 Guide Multi-Sites - Système de Pointage GPS

> **Support de plusieurs bureaux/localisations pour le pointage GPS**

---

## ✅ Ce qui a été ajouté

### 🎯 Fonctionnalité Multi-Sites

Le système de pointage GPS supporte maintenant **plusieurs bureaux/localisations** simultanément.

**Vos 2 bureaux configurés :**
1. 🏢 **Hôtel bar 444** - Bingerville (5.3534393, -3.8697718)
2. 🏢 **Garage Orange** - Immeuble jaune, Bingerville (5.3555878, -3.868019)

---

## 🔧 Comment ça fonctionne ?

### Détection Automatique du Bureau le Plus Proche

```
┌──────────────────────────────────────────────────────┐
│  Employé clique "Marquer ma présence"                │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
         📍 GPS récupère position
                    │
                    ▼
      📐 Calcul distance vers CHAQUE bureau
                    │
                    ▼
         🎯 Sélection du plus proche
                    │
                    ▼
         ┌──────────┴──────────┐
         │                     │
    ≤ 50m Bureau A        ≤ 50m Bureau B
         │                     │
         ▼                     ▼
    ✅ PRÉSENT           ✅ PRÉSENT
    (Bureau A)          (Bureau B)
         │
         ▼ (Si > 50m des 2 bureaux)
         ❌ ABSENT
```

### Exemple Concret

**Jean est au Garage Orange (5.3555878, -3.868019)**

1. Il clique sur "Marquer ma présence"
2. Le système calcule :
   - Distance vers Hôtel bar 444 : 250m ❌
   - Distance vers Garage Orange : 30m ✅
3. Bureau le plus proche : **Garage Orange** (30m)
4. 30m ≤ 50m → **✅ PRÉSENT** (Bureau : Garage Orange)

**Marie est entre les deux bureaux (à 80m des deux)**

1. Elle clique sur "Marquer ma présence"
2. Le système calcule :
   - Distance vers Hôtel bar 444 : 80m ❌
   - Distance vers Garage Orange : 80m ❌
3. Bureau le plus proche : **Hôtel bar 444** (80m)
4. 80m > 50m → **❌ ABSENT**
5. Message : "Vous êtes à 80m du bureau le plus proche. Bureaux disponibles : Hôtel bar 444, Garage Orange"

---

## 🚀 Installation/Mise à Jour

### Étape 1 : Appliquer la nouvelle migration

```powershell
npx prisma generate
npx prisma migrate deploy
```

### Étape 2 : Configurer vos deux bureaux

```powershell
node scripts/setup-two-locations.js
```

**Sortie attendue :**

```
🚀 Configuration des DEUX bureaux...

✅ Configuration réussie!

📍 Détails des configurations :
   ═══════════════════════════════════════════════════════════════

   🏢 BUREAU 1 - Hôtel bar 444
   ─────────────────────────────────────
   📌 Nom        : Hôtel bar 444
   📍 Adresse    : Bingerville, Côte d'Ivoire
   🌍 Latitude   : 5.3534393
   🌍 Longitude  : -3.8697718
   📏 Rayon      : 50m
   🕐 Ouverture  : 08:00
   🕐 Fermeture  : 18:00
   ⏱️  Tolérance : 15 min
   ✅ Actif      : Oui

   🏢 BUREAU 2 - Garage Orange
   ─────────────────────────────────────
   📌 Nom        : Garage Orange
   📍 Adresse    : Immeuble jaune, Bingerville
   🌍 Latitude   : 5.3555878
   🌍 Longitude  : -3.868019
   📏 Rayon      : 50m
   🕐 Ouverture  : 08:00
   🕐 Fermeture  : 18:00
   ⏱️  Tolérance : 15 min
   ✅ Actif      : Oui
   ═══════════════════════════════════════════════════════════════

🎉 Le système multi-sites est configuré !

📊 Distance entre les deux bureaux : 245m
```

### Étape 3 : Redémarrer le serveur

```powershell
npm run dev
```

---

## 📱 Utilisation (Employés)

### Rien ne change pour les employés !

Le pointage fonctionne exactement de la même manière :

1. Se connecter à l'application
2. Aller sur le Dashboard
3. Cliquer sur "Marquer ma présence"
4. Autoriser la géolocalisation
5. ✅ Le système détecte automatiquement le bureau le plus proche

### Messages Affichés

#### ✅ Pointage Accepté

```
✅ Présence enregistrée à 08:15 (Bureau: Garage Orange)

📍 Pointage GPS              [🟢 Présent]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Arrivée : 08:15
🏢 Bureau  : Garage Orange
📍 Distance : 30m du bureau ✓
```

#### ❌ Pointage Refusé (trop loin)

```
❌ POINTAGE REFUSÉ

Vous êtes à 80m du bureau le plus proche "Hôtel bar 444".

Bureaux disponibles :
- Hôtel bar 444 (50m max)
- Garage Orange (50m max)

🚶‍♂️ Rapprochez-vous d'un bureau et réessayez !
```

---

## 🔧 Gestion des Bureaux

### Ajouter un 3ème Bureau

Modifier `scripts/setup-two-locations.js` et ajouter :

```javascript
const bureau3 = await prisma.storeConfig.create({
  data: {
    nom: 'Bureau Cocody',
    adresse: 'Cocody, Abidjan',
    latitude: 5.360000,
    longitude: -3.980000,
    rayonTolerance: 50,
    heureOuverture: '08:00',
    heureFermeture: '18:00',
    toleranceRetard: 15,
    actif: true
  }
});
```

### Désactiver Temporairement un Bureau

```javascript
// Désactiver Garage Orange (ex: travaux)
await prisma.storeConfig.update({
  where: { id: 2 },
  data: { actif: false }
});
```

### Modifier le Rayon d'un Bureau

```javascript
// Augmenter le rayon du Garage Orange à 100m
await prisma.storeConfig.update({
  where: { id: 2 },
  data: { rayonTolerance: 100 }
});
```

---

## 📊 API Endpoints (Inchangés)

Les endpoints restent les mêmes, la logique multi-sites est transparente :

```
POST   /api/attendance/mark-arrival    → Détecte automatiquement le bureau
POST   /api/attendance/mark-departure
GET    /api/attendance/my-attendance-today
GET    /api/attendance/history
GET    /api/attendance/store-config    → Retourne TOUS les bureaux actifs
```

---

## 🎯 Avantages du Système Multi-Sites

✅ **Flexibilité** : Employés peuvent pointer depuis n'importe quel bureau  
✅ **Automatique** : Détection du bureau le plus proche sans intervention  
✅ **Traçabilité** : L'historique enregistre le bureau utilisé  
✅ **Évolutif** : Ajoutez autant de bureaux que nécessaire  
✅ **Simple** : Aucun changement pour les employés  

---

## 📈 Statistiques par Bureau

### Via l'API

```javascript
// Récupérer les pointages du Garage Orange
GET /api/attendance/history?storeLocationId=2

// Voir quel bureau est le plus utilisé
SELECT storeLocationId, COUNT(*) 
FROM attendances 
WHERE validee = true 
GROUP BY storeLocationId
```

---

## 🔐 Base de Données

### Nouvelles Colonnes

```sql
-- Table store_config
actif BOOLEAN DEFAULT true  -- Activer/désactiver un bureau

-- Table attendances
storeLocationId INTEGER     -- Bureau utilisé pour le pointage
```

---

## 🐛 Résolution de Problèmes

### Erreur : "Aucune configuration de bureau trouvée"

**Solution :**
```powershell
node scripts/setup-two-locations.js
```

### Les employés voient toujours un seul bureau

**Cause :** Cache du navigateur

**Solution :**
- Rafraîchir la page (Ctrl+F5)
- Redémarrer le serveur

### Un employé ne peut plus pointer

**Vérifier :**
1. Les deux bureaux sont actifs (`actif: true`)
2. Les coordonnées GPS sont correctes
3. Le rayon est suffisant (50m minimum)

---

## 🎉 C'est Prêt !

Votre système de pointage GPS supporte maintenant **plusieurs bureaux** !

Les employés peuvent pointer depuis :
- 🏢 **Hôtel bar 444** (Bingerville)
- 🏢 **Garage Orange** (Bingerville)

Le système détecte automatiquement le bureau le plus proche et valide le pointage si l'employé est à moins de 50m.

---

**📍 Bon pointage multi-sites !**

© 2026 - Système de Géolocalisation Multi-Sites - GS Cursor
