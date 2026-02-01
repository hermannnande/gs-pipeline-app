# 🏢 Guide Configuration - Pointage GPS pour 2 Magasins

> **Configuration complète du système de pointage GPS multi-sites**

---

## 📋 Vue d'ensemble

Ce système permet aux employés de pointer leur présence dans **2 magasins différents** :
- Le système détecte automatiquement le magasin le plus proche
- Chaque magasin a ses propres coordonnées GPS et rayon de tolérance
- Les employés peuvent pointer dans n'importe quel magasin

---

## 🚀 Installation Rapide

### Étape 1 : Obtenir les coordonnées GPS des 2 magasins

#### Magasin 1
1. Ouvrir [Google Maps](https://www.google.com/maps)
2. Chercher votre **Magasin 1** (exemple : Yopougon)
3. Cliquer-droit sur le lieu exact
4. Cliquer sur les coordonnées qui apparaissent
5. Noter les coordonnées (format: `5.353021, -3.870182`)

#### Magasin 2
1. Répéter la même procédure pour le **Magasin 2** (exemple : Plateau)
2. Noter les coordonnées

---

### Étape 2 : Configurer le script

Ouvrir le fichier `scripts/setup-two-stores.js` et **modifier les coordonnées** :

```javascript
// ═══════════════════════════════════════════════════════════
// 📍 MAGASIN 1 - À CONFIGURER
// ═══════════════════════════════════════════════════════════
const magasin1 = {
  nom: 'Magasin 1 - Yopougon',        // ⚠️ À PERSONNALISER
  adresse: 'Yopougon, Abidjan, Côte d\'Ivoire', // ⚠️ À PERSONNALISER
  latitude: 5.353021,                 // ⚠️ À REMPLACER PAR VOS COORDONNÉES
  longitude: -3.870182,               // ⚠️ À REMPLACER PAR VOS COORDONNÉES
  rayonTolerance: 50,                 // 50 mètres (ajustez si nécessaire)
  heureOuverture: '08:00',            // Heure d'ouverture
  heureFermeture: '18:00',            // Heure de fermeture
  toleranceRetard: 15,                // 15 minutes de tolérance
  actif: true
};

// ═══════════════════════════════════════════════════════════
// 📍 MAGASIN 2 - À CONFIGURER
// ═══════════════════════════════════════════════════════════
const magasin2 = {
  nom: 'Magasin 2 - Plateau',         // ⚠️ À PERSONNALISER
  adresse: 'Plateau, Abidjan, Côte d\'Ivoire', // ⚠️ À PERSONNALISER
  latitude: 5.323456,                 // ⚠️ À REMPLACER PAR VOS COORDONNÉES
  longitude: -4.012345,               // ⚠️ À REMPLACER PAR VOS COORDONNÉES
  rayonTolerance: 50,                 // 50 mètres
  heureOuverture: '08:00',
  heureFermeture: '18:00',
  toleranceRetard: 15,
  actif: true
};
```

#### Exemple avec vraies coordonnées (Abidjan) :

```javascript
// Magasin 1 - Yopougon
latitude: 5.353021,
longitude: -3.870182,

// Magasin 2 - Plateau
latitude: 5.323456,
longitude: -4.012345,
```

---

### Étape 3 : Exécuter le script de configuration

```powershell
node scripts/setup-two-stores.js
```

**Sortie attendue :**

```
🏢 Configuration de 2 magasins pour le système de pointage GPS...

✅ Magasin 1 configuré avec succès !
   ═══════════════════════════════════════
   📌 Nom        : Magasin 1 - Yopougon
   📍 Adresse    : Yopougon, Abidjan, Côte d'Ivoire
   🌍 Latitude   : 5.353021
   🌍 Longitude  : -3.870182
   📏 Rayon      : 50m
   🕐 Ouverture  : 08:00
   🕐 Fermeture  : 18:00
   ⏱️  Tolérance : 15 min
   ═══════════════════════════════════════

✅ Magasin 2 configuré avec succès !
   ═══════════════════════════════════════
   📌 Nom        : Magasin 2 - Plateau
   📍 Adresse    : Plateau, Abidjan, Côte d'Ivoire
   🌍 Latitude   : 5.323456
   🌍 Longitude  : -4.012345
   📏 Rayon      : 50m
   🕐 Ouverture  : 08:00
   🕐 Fermeture  : 18:00
   ⏱️  Tolérance : 15 min
   ═══════════════════════════════════════

🎉 Les 2 magasins sont maintenant configurés !
📱 Les employés peuvent pointer leur présence depuis l'application.

🗺️  Vérifier vos coordonnées sur Google Maps :
   Magasin 1: https://www.google.com/maps?q=5.353021,-3.870182
   Magasin 2: https://www.google.com/maps?q=5.323456,-4.012345
```

---

### Étape 4 : Redémarrer le serveur

```powershell
# Arrêter le serveur (Ctrl+C si déjà lancé)
npm run dev
```

---

## 🎯 Fonctionnement du Système Multi-Sites

### Logique de Détection Automatique

```
┌─────────────────────────────────────────────────────────┐
│  📍 POINTAGE ARRIVÉE (Multi-Sites)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Employé clique "Marquer ma présence"               │
│  2. GPS récupère les coordonnées de l'employé           │
│  3. Backend calcule la distance aux 2 magasins          │
│  4. Système sélectionne le MAGASIN LE PLUS PROCHE      │
│                                                         │
│  SI distance ≤ 50m (du magasin le plus proche)         │
│    ✅ POINTAGE ACCEPTÉ                                  │
│    - Enregistre le magasin utilisé                      │
│    - Vérifie l'heure (retard ou à l'heure)             │
│    - Message : "Présence enregistrée à Magasin X"      │
│                                                         │
│  SI distance > 50m (de tous les magasins)              │
│    ❌ POINTAGE REFUSÉ                                   │
│    - Affiche la distance au magasin le plus proche     │
│    - Liste tous les magasins disponibles                │
│    - Possibilité de réessayer                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Utilisation par les Employés

### Exemple de Pointage Réussi (Magasin 1)

```
✅ Présence enregistrée à 08:15 (Bureau: Magasin 1 - Yopougon)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Pointage GPS         [🟢 Présent]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Arrivée : 08:15
🏢 Magasin : Magasin 1 - Yopougon
📍 Distance : 35m ✓
```

### Exemple de Pointage Réussi (Magasin 2)

```
✅ Présence enregistrée à 08:20 (Bureau: Magasin 2 - Plateau)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Pointage GPS         [🟢 Présent]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Arrivée : 08:20
🏢 Magasin : Magasin 2 - Plateau
📍 Distance : 42m ✓
```

### Exemple de Pointage Refusé (Hors zone)

```
❌ POINTAGE REFUSÉ

Vous êtes ABSENT - Vous êtes à 120m du bureau le plus proche "Magasin 1 - Yopougon".
Vous devez être à moins de 50m de l'un des bureaux : 
  - Magasin 1 - Yopougon (50m)
  - Magasin 2 - Plateau (50m)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Pointage GPS         [🔴 ABSENT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚶‍♂️ Rapprochez-vous d'un des magasins et réessayez !
```

---

## 🔧 Personnalisation Avancée

### Modifier le Rayon de Tolérance

Si trop de pointages sont refusés, vous pouvez **augmenter le rayon** pour chaque magasin :

```javascript
// Dans scripts/setup-two-stores.js

// Magasin 1 : Rayon de 100m
rayonTolerance: 100,  // Au lieu de 50m

// Magasin 2 : Rayon de 150m (si GPS moins précis)
rayonTolerance: 150,
```

Puis relancer :
```powershell
node scripts/setup-two-stores.js
```

---

### Modifier les Horaires (Différents par Magasin)

```javascript
// Magasin 1 : Horaires standards
heureOuverture: '08:00',
heureFermeture: '18:00',
toleranceRetard: 15,

// Magasin 2 : Horaires décalés
heureOuverture: '07:30',
heureFermeture: '19:00',
toleranceRetard: 20,
```

---

### Désactiver Temporairement un Magasin

Si vous souhaitez désactiver un magasin (ex: fermeture temporaire) :

```javascript
// Dans scripts/setup-two-stores.js
const magasin2 = {
  // ... autres paramètres ...
  actif: false  // ⚠️ Désactive ce magasin
};
```

Relancer :
```powershell
node scripts/setup-two-stores.js
```

---

## 📊 Consultation de l'Historique (Admin)

### API - Récupérer les pointages du jour

```javascript
GET /api/attendance/history

// Réponse
{
  "attendances": [
    {
      "id": 1,
      "user": { "nom": "Kouadio", "prenom": "Jean" },
      "date": "2026-02-01",
      "heureArrivee": "2026-02-01T08:15:00Z",
      "storeLocationId": 1,        // ⬅️ ID du magasin
      "distanceArrivee": 35,
      "validee": true,
      "validation": "VALIDE"
    },
    {
      "id": 2,
      "user": { "nom": "Traore", "prenom": "Marie" },
      "date": "2026-02-01",
      "heureArrivee": "2026-02-01T08:20:00Z",
      "storeLocationId": 2,        // ⬅️ Magasin différent
      "distanceArrivee": 42,
      "validee": true,
      "validation": "VALIDE"
    }
  ]
}
```

Le champ `storeLocationId` indique dans quel magasin l'employé a pointé.

---

## 🔐 Sécurité Multi-Sites

### Protections Implémentées

✅ **Détection automatique** : Le système choisit le magasin le plus proche  
✅ **Validation GPS stricte** : Distance calculée pour chaque magasin (formule de Haversine)  
✅ **Un pointage par jour** : Impossible de pointer dans les 2 magasins le même jour  
✅ **Traçabilité** : Tous les pointages enregistrent le magasin utilisé  
✅ **Logs serveur** : Chaque pointage est tracé avec le nom du magasin  

---

## 🐛 Résolution de Problèmes

### Erreur : "Aucune configuration de bureau trouvée"

**Cause :** Script de configuration pas exécuté

**Solution :**
```powershell
node scripts/setup-two-stores.js
```

---

### Pointages Toujours Refusés pour un Magasin

**Cause 1 :** Mauvaises coordonnées GPS

**Solution :**
1. Vérifier les coordonnées sur Google Maps (cliquer sur les liens fournis par le script)
2. Corriger dans `scripts/setup-two-stores.js`
3. Relancer le script

**Cause 2 :** Rayon trop petit (50m)

**Solution :**
- Augmenter le rayon à 100m ou 150m pour le magasin concerné
- Relancer le script

---

### Vérifier les Coordonnées GPS

Après configuration, le script affiche des liens Google Maps :

```
🗺️  Vérifier vos coordonnées sur Google Maps :
   Magasin 1: https://www.google.com/maps?q=5.353021,-3.870182
   Magasin 2: https://www.google.com/maps?q=5.323456,-4.012345
```

**Cliquer sur ces liens** pour vérifier que les coordonnées correspondent bien à vos magasins.

---

## 📈 Ajouter un 3ème Magasin (Futur)

Si vous voulez ajouter un 3ème magasin à l'avenir :

1. **Modifier le script** `scripts/setup-two-stores.js` :

```javascript
// Ajouter après magasin2
const magasin3 = {
  nom: 'Magasin 3 - Cocody',
  adresse: 'Cocody, Abidjan, Côte d\'Ivoire',
  latitude: 5.345678,
  longitude: -3.987654,
  rayonTolerance: 50,
  heureOuverture: '08:00',
  heureFermeture: '18:00',
  toleranceRetard: 15,
  actif: true
};

// Ajouter dans le try/catch
const store3 = await prisma.storeConfig.upsert({
  where: { id: 3 },
  update: magasin3,
  create: { ...magasin3 },
});
```

2. **Relancer le script** :
```powershell
node scripts/setup-two-stores.js
```

3. ✅ Le système détectera automatiquement les 3 magasins !

---

## 🎉 Félicitations !

Votre système de pointage GPS multi-sites est maintenant **opérationnel** !

### Prochaines Étapes

1. ✅ Tester avec un employé dans chaque magasin
2. ✅ Vérifier que le système détecte bien le magasin le plus proche
3. ✅ Ajuster les rayons si nécessaire
4. ✅ Former les employés à l'utilisation
5. ✅ Analyser les statistiques par magasin

---

## 📚 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/attendance/mark-arrival` | POST | Pointer l'arrivée (détection auto du magasin) |
| `/api/attendance/mark-departure` | POST | Pointer le départ |
| `/api/attendance/my-attendance-today` | GET | Voir ma présence du jour |
| `/api/attendance/history` | GET | Historique (Admin) |
| `/api/attendance/store-config` | GET | Liste des magasins (avec `stores` array) |

---

**🚀 Bon pointage multi-sites !**

© 2026 - Système de Géolocalisation Multi-Sites pour GS Cursor
