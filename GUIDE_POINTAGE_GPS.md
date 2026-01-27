# 🗺️ Guide Complet - Système de Pointage GPS

> **Système de géolocalisation pour le pointage des employés - Implémentation Complète**

---

## ✅ Ce qui a été implémenté

### 🔧 Backend
- ✅ Schéma Prisma (tables `attendances` et `store_config`)
- ✅ Migration de base de données
- ✅ Routes API complètes (`/api/attendance/*`)
- ✅ Validation GPS avec formule de Haversine
- ✅ Détection de retard automatique
- ✅ Refus si hors zone avec possibilité de réessayer

### 🎨 Frontend
- ✅ Composant `AttendanceButton` moderne et responsive
- ✅ Intégré dans tous les dashboards (Admin, Gestionnaire, Appelant, Gestionnaire Stock)
- ✅ Messages clairs et badges de statut
- ✅ Géolocalisation HTML5

### 📝 Scripts
- ✅ Script de configuration GPS automatique

---

## 🚀 Installation (Étape par Étape)

### Étape 1 : Générer le client Prisma

```powershell
npx prisma generate
```

### Étape 2 : Appliquer la migration

```powershell
npx prisma migrate deploy
```

### Étape 3 : Configurer vos coordonnées GPS

#### 3.1 - Obtenir vos coordonnées GPS

**Option A : Google Maps**
1. Ouvrir [Google Maps](https://www.google.com/maps)
2. Chercher votre magasin/bureau
3. Cliquer-droit sur le lieu exact
4. Cliquer sur les coordonnées qui apparaissent en haut
5. Copier (format: `5.353021, -3.870182`)

**Option B : GPS du téléphone**
- Utiliser une application GPS
- Activer "Afficher les coordonnées"
- Noter Latitude et Longitude

#### 3.2 - Modifier le script de configuration

Ouvrir `scripts/setup-store-location.js` et remplacer :

```javascript
const latitude = 5.353021;   // ⚠️ VOTRE LATITUDE
const longitude = -3.870182;  // ⚠️ VOTRE LONGITUDE
```

**Exemple pour Abidjan, Côte d'Ivoire :**
```javascript
const latitude = 5.353021;
const longitude = -3.870182;
```

#### 3.3 - Exécuter le script

```powershell
node scripts/setup-store-location.js
```

**Sortie attendue :**
```
🚀 Configuration du magasin pour le système de géolocalisation...

✅ Configuration réussie!

📍 Détails de la configuration :
   ═══════════════════════════════════════
   📌 Nom        : Magasin Principal
   📍 Adresse    : Abidjan, Côte d'Ivoire
   🌍 Latitude   : 5.353021
   🌍 Longitude  : -3.870182
   📏 Rayon      : 50m
   🕐 Ouverture  : 08:00
   🕐 Fermeture  : 18:00
   ⏱️  Tolérance : 15 min
   ═══════════════════════════════════════

🎉 Le système de pointage GPS est maintenant configuré !
```

### Étape 4 : Redémarrer le serveur

```powershell
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

### Étape 5 : Tester le système

1. Se connecter à l'application
2. Aller sur un dashboard (Admin, Gestionnaire, Appelant, ou Stock)
3. Vous verrez la carte "Pointage GPS" en haut de la page
4. Cliquer sur "Marquer ma présence"
5. Autoriser l'accès à la localisation
6. ✅ Vérifier le résultat

---

## 🎯 Fonctionnement du Système

### Logique de Validation

```
┌─────────────────────────────────────────────────────┐
│  📍 POINTAGE ARRIVÉE                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Employé clique "Marquer ma présence"           │
│  2. Navigateur demande permission géolocalisation   │
│  3. GPS récupère les coordonnées                    │
│  4. Backend calcule la distance au magasin          │
│                                                     │
│  SI distance ≤ 50m                                  │
│    ✅ POINTAGE ACCEPTÉ → Statut PRÉSENT            │
│    - Vérifier l'heure (retard ou à l'heure)        │
│    - Enregistrer dans la BDD                        │
│                                                     │
│  SI distance > 50m                                  │
│    ❌ POINTAGE REFUSÉ → Statut ABSENT              │
│    - Message clair avec distance actuelle           │
│    - Possibilité de réessayer en se rapprochant    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Statuts Possibles

| Statut | Badge | Description |
|--------|-------|-------------|
| **ABSENT** | 🔴 Rouge | Aucun pointage ou pointage hors zone |
| **PRÉSENT** | 🟢 Vert | Pointage validé à l'heure |
| **RETARD** | 🟠 Orange | Pointage validé mais en retard (> 15 min) |
| **PARTI** | 🔵 Bleu | Départ enregistré |

### Paramètres par Défaut

```javascript
{
  rayonTolerance: 50,        // 50 mètres
  heureOuverture: '08:00',   // 8h du matin
  heureFermeture: '18:00',   // 6h du soir
  toleranceRetard: 15        // 15 minutes
}
```

---

## 📱 Utilisation pour les Employés

### Pointer son Arrivée

1. **Ouvrir l'application** sur le téléphone ou PC
2. **Se connecter** avec vos identifiants
3. **Aller sur le Dashboard** (page d'accueil)
4. **Localiser la carte "Pointage GPS"** en haut de la page
5. **Cliquer sur "Marquer ma présence"**
6. **Autoriser l'accès à la localisation** (si demandé)
7. **Attendre** la validation GPS

### Résultats Possibles

#### ✅ Pointage Accepté (dans la zone)
```
✅ Présence enregistrée à 08:15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Pointage GPS         [🟢 Présent]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Arrivée : 08:15
📍 Distance : 35m du magasin ✓
```

#### ⚠️ Pointage avec Retard
```
⚠️ Présence enregistrée avec retard à 08:30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Pointage GPS         [🟠 Retard]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Arrivée : 08:30
📍 Distance : 42m du magasin ✓
```

#### ❌ Pointage Refusé (hors zone)
```
❌ POINTAGE REFUSÉ

Vous êtes à 120m du magasin (max 50m).

🚶‍♂️ Rapprochez-vous du magasin et réessayez !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Pointage GPS         [🔴 ABSENT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Vous devez être à moins de 50m
```

**→ L'employé peut réessayer immédiatement en se rapprochant !**

### Pointer son Départ

1. **En fin de journée**, retourner sur le Dashboard
2. **Cliquer sur "Marquer mon départ"**
3. ✅ Départ enregistré

---

## 🔧 Personnalisation

### Modifier le Rayon de Tolérance

Si trop de pointages sont refusés, vous pouvez augmenter le rayon :

```javascript
// Dans scripts/setup-store-location.js
rayonTolerance: 100,  // Passer de 50m à 100m
```

Puis relancer :
```powershell
node scripts/setup-store-location.js
```

### Modifier les Horaires

```javascript
heureOuverture: '07:30',   // Ouverture à 7h30
heureFermeture: '19:00',   // Fermeture à 19h
toleranceRetard: 20,       // Tolérance de 20 minutes
```

### Modifier les Rôles Autorisés

Par défaut, tous les rôles peuvent pointer (sauf LIVREUR).

Pour modifier, éditer `routes/attendance.routes.js` :

```javascript
// Ligne 27 et ligne 153
authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT')  // Retirer des rôles
```

---

## 📊 Consultation de l'Historique (Admin/Gestionnaire)

### Via l'API

```javascript
GET /api/attendance/history
GET /api/attendance/history?userId=5
GET /api/attendance/history?date=2026-01-27
GET /api/attendance/history?startDate=2026-01-01&endDate=2026-01-31
```

### Exemple de Réponse

```json
{
  "attendances": [
    {
      "id": 1,
      "user": {
        "nom": "Dupont",
        "prenom": "Jean",
        "role": "APPELANT"
      },
      "date": "2026-01-27",
      "heureArrivee": "2026-01-27T08:15:00Z",
      "heureDepart": "2026-01-27T18:05:00Z",
      "latitudeArrivee": 5.353100,
      "longitudeArrivee": -3.870200,
      "distanceArrivee": 35,
      "validee": true,
      "validation": "VALIDE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 45,
    "totalPages": 2
  }
}
```

---

## 🐛 Résolution de Problèmes

### Erreur : "Configuration du magasin non trouvée"

**Cause :** Script de configuration pas exécuté

**Solution :**
```powershell
node scripts/setup-store-location.js
```

### Erreur : "Géolocalisation refusée"

**Cause :** Permission non accordée par le navigateur

**Solutions :**
1. **Chrome/Edge :**
   - Aller dans `Paramètres` → `Confidentialité et sécurité` → `Paramètres des sites` → `Localisation`
   - Autoriser votre site

2. **Firefox :**
   - Clic sur l'icône 🔒 à gauche de l'URL
   - `Autoriser` la localisation

3. **Safari :**
   - `Réglages` → `Confidentialité` → `Service de localisation`
   - Autoriser Safari et votre site

### Pointages Toujours Refusés

**Cause 1 :** Mauvaises coordonnées GPS configurées

**Solution :**
- Vérifier les coordonnées dans Google Maps
- Réexécuter le script avec les bonnes coordonnées

**Cause 2 :** Rayon trop petit (50m)

**Solution :**
- Augmenter le rayon à 100m ou 150m
- Relancer le script de configuration

**Cause 3 :** GPS du téléphone imprécis

**Solution :**
- Activer le "Mode Haute Précision" dans les paramètres GPS
- Redémarrer l'application

### Erreur : "Prisma Client not found"

**Solution :**
```powershell
npx prisma generate
npm run dev
```

---

## 📈 Statistiques et Rapports

### Récupérer les Statistiques du Jour

```javascript
GET /api/attendance/history?date=2026-01-27

// Réponse
{
  "attendances": [
    { "user": "Jean Dupont", "status": "PRESENT" },
    { "user": "Marie Martin", "status": "RETARD" },
    { "user": "Pierre Durand", "status": "ABSENT" }
  ]
}
```

### Créer un Rapport Mensuel

1. Récupérer les données via l'API
2. Exporter en CSV ou Excel
3. Analyser les présences/absences/retards

---

## 🔐 Sécurité

### Protections Implémentées

✅ **Authentification requise** : Seuls les utilisateurs connectés peuvent pointer  
✅ **Un pointage par jour** : Impossible de pointer deux fois  
✅ **Validation GPS stricte** : Distance réelle calculée (formule de Haversine)  
✅ **Logs serveur** : Tous les pointages sont tracés  
✅ **IP et Device tracking** : Enregistrement de l'IP et du navigateur  

### Données Enregistrées

- Coordonnées GPS (latitude/longitude)
- Distance par rapport au magasin
- Heure d'arrivée et de départ
- Adresse IP et User-Agent
- Statut de validation

---

## 📚 API Endpoints

### POST `/api/attendance/mark-arrival`
Marquer l'arrivée

**Body :**
```json
{
  "latitude": 5.353021,
  "longitude": -3.870182
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "message": "✅ Présence enregistrée à 08:15",
  "attendance": { ... },
  "distance": 35,
  "rayonTolerance": 50,
  "validee": true,
  "validation": "VALIDE",
  "status": "PRESENT"
}
```

**Réponse (refus) :**
```json
{
  "success": false,
  "error": "HORS_ZONE",
  "message": "❌ Vous êtes ABSENT - Vous êtes à 120m du magasin...",
  "distance": 120,
  "rayonTolerance": 50,
  "validee": false,
  "status": "ABSENT"
}
```

### POST `/api/attendance/mark-departure`
Marquer le départ

### GET `/api/attendance/my-attendance-today`
Récupérer ma présence du jour

### GET `/api/attendance/history`
Historique des présences (Admin/Gestionnaire)

### GET `/api/attendance/store-config`
Configuration du magasin

### PUT `/api/attendance/store-config`
Modifier la configuration (Admin uniquement)

---

## 🎉 Félicitations !

Votre système de pointage GPS est maintenant **opérationnel** !

### Prochaines Étapes

1. ✅ Tester avec un employé
2. ✅ Ajuster le rayon si nécessaire
3. ✅ Former les employés à l'utilisation
4. ✅ Analyser les statistiques

### Support

Pour toute question :
- Consulter le guide complet : `PACK_GEOLOCALISATION/GUIDE_SYSTEME_GEOLOCALISATION.md`
- Vérifier les logs serveur
- Tester avec Chrome DevTools (simulation GPS)

---

**🚀 Bon pointage !**

© 2026 - Système de Géolocalisation pour GS Cursor
