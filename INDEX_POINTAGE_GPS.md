# 📋 INDEX - Documentation Pointage GPS 2 Magasins

## 🚀 Démarrage Rapide

| Fichier | Description | Pour qui ? |
|---------|-------------|-----------|
| **[README_POINTAGE_2_MAGASINS.md](./README_POINTAGE_2_MAGASINS.md)** | 📖 **COMMENCER ICI** - Guide rapide en 5 minutes | Admin |
| **[INSTALLER_POINTAGE_2_MAGASINS.ps1](./INSTALLER_POINTAGE_2_MAGASINS.ps1)** | 🤖 Script d'installation **interactif** | Admin |

---

## 📚 Documentation Complète

| Fichier | Description | Pour qui ? |
|---------|-------------|-----------|
| [INSTALLATION_POINTAGE_2_MAGASINS.md](./INSTALLATION_POINTAGE_2_MAGASINS.md) | Installation détaillée **pas à pas** | Admin |
| [GUIDE_CONFIGURATION_2_MAGASINS_GPS.md](./GUIDE_CONFIGURATION_2_MAGASINS_GPS.md) | Guide complet du système multi-sites | Admin/Dev |
| [IMPLEMENTATION_POINTAGE_2_MAGASINS_COMPLETE.md](./IMPLEMENTATION_POINTAGE_2_MAGASINS_COMPLETE.md) | Résumé technique de l'implémentation | Dev |
| [GUIDE_POINTAGE_GPS.md](./GUIDE_POINTAGE_GPS.md) | Guide général (référence mono-site) | Admin/Dev |

---

## 🛠️ Scripts Disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| **Installation Interactive** | `.\INSTALLER_POINTAGE_2_MAGASINS.ps1` | Installation guidée avec questions |
| **Configuration Manuelle** | `node scripts/setup-two-stores.js` | Configuration directe (modifier le fichier avant) |
| **Test Configuration** | `node scripts/test-store-config.js` | Vérifier que tout est bien configuré |
| **Installation Simple** | `.\INSTALLER_POINTAGE_GPS.ps1` | Installation mono-site (ancien) |

---

## 📂 Fichiers Techniques

### Backend
- `routes/attendance.routes.js` - API avec détection multi-magasins
- `prisma/schema.prisma` - Schéma DB avec `storeLocationId`
- `scripts/setup-two-stores.js` - Script de configuration

### Frontend
- `frontend/src/components/attendance/AttendanceButton.tsx` - Composant React avec liste des magasins

### Tests
- `scripts/test-store-config.js` - Test de configuration

---

## 🎯 Workflow d'Installation

```
┌─────────────────────────────────────────────────────────────┐
│  1. Lire README_POINTAGE_2_MAGASINS.md                      │
│     📖 Guide rapide de démarrage                             │
│                                                             │
│  2. Obtenir coordonnées GPS (Google Maps)                   │
│     📍 Magasin 1 : Latitude, Longitude                      │
│     📍 Magasin 2 : Latitude, Longitude                      │
│                                                             │
│  3. Lancer l'installation                                   │
│     🤖 Option A : .\INSTALLER_POINTAGE_2_MAGASINS.ps1       │
│     ✏️  Option B : Modifier scripts/setup-two-stores.js     │
│                     + node scripts/setup-two-stores.js      │
│                                                             │
│  4. Tester la configuration                                 │
│     🧪 node scripts/test-store-config.js                    │
│                                                             │
│  5. Redémarrer le serveur                                   │
│     🚀 npm run dev                                          │
│                                                             │
│  6. Tester avec un employé                                  │
│     📱 Dashboard → Pointage GPS → Marquer ma présence       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Recherche Rapide

### Je veux...

| Besoin | Fichier à consulter |
|--------|---------------------|
| Installer rapidement | [README_POINTAGE_2_MAGASINS.md](./README_POINTAGE_2_MAGASINS.md) |
| Installation pas à pas | [INSTALLATION_POINTAGE_2_MAGASINS.md](./INSTALLATION_POINTAGE_2_MAGASINS.md) |
| Comprendre le système | [GUIDE_CONFIGURATION_2_MAGASINS_GPS.md](./GUIDE_CONFIGURATION_2_MAGASINS_GPS.md) |
| Modifier le rayon | [README_POINTAGE_2_MAGASINS.md](./README_POINTAGE_2_MAGASINS.md) - Section "Personnalisation" |
| Changer les horaires | [GUIDE_CONFIGURATION_2_MAGASINS_GPS.md](./GUIDE_CONFIGURATION_2_MAGASINS_GPS.md) - Section "Personnalisation Avancée" |
| Résoudre un problème | [README_POINTAGE_2_MAGASINS.md](./README_POINTAGE_2_MAGASINS.md) - Section "Problèmes Courants" |
| Ajouter un 3ème magasin | [GUIDE_CONFIGURATION_2_MAGASINS_GPS.md](./GUIDE_CONFIGURATION_2_MAGASINS_GPS.md) - Section "Ajouter un 3ème Magasin" |
| Détails techniques | [IMPLEMENTATION_POINTAGE_2_MAGASINS_COMPLETE.md](./IMPLEMENTATION_POINTAGE_2_MAGASINS_COMPLETE.md) |

---

## ❓ FAQ

### Q1 : Quelle est la différence avec le système mono-site ?

**Ancien (mono-site) :**
- 1 seul magasin configuré
- Script : `scripts/setup-store-location.js`
- Documentation : `GUIDE_POINTAGE_GPS.md`

**Nouveau (multi-sites) :**
- 2 magasins (ou plus) configurés
- Détection automatique du magasin le plus proche
- Script : `scripts/setup-two-stores.js`
- Documentation : `GUIDE_CONFIGURATION_2_MAGASINS_GPS.md`

---

### Q2 : Puis-je utiliser le système avec un seul magasin ?

✅ **Oui !** Le nouveau système est compatible. Configurez simplement les 2 magasins avec les mêmes coordonnées, ou gardez l'ancien script.

---

### Q3 : Comment ajouter un 3ème magasin ?

Consultez la section **"Ajouter un 3ème Magasin"** dans :
- [GUIDE_CONFIGURATION_2_MAGASINS_GPS.md](./GUIDE_CONFIGURATION_2_MAGASINS_GPS.md)

---

### Q4 : Les anciens pointages sont-ils compatibles ?

✅ **Oui !** Les anciens pointages (sans `storeLocationId`) sont conservés et affichés comme "Sans magasin (ancien)".

---

### Q5 : Comment tester sans se déplacer ?

Utilisez **Chrome DevTools** :
1. F12 → Console → Sensors
2. "Location" → Custom location
3. Entrer les coordonnées GPS de test
4. Tester le pointage

---

## 📞 Support

### En cas de problème :

1. ✅ **Vérifier la checklist** dans `README_POINTAGE_2_MAGASINS.md`
2. ✅ **Consulter la section "Problèmes Courants"**
3. ✅ **Exécuter le script de test** : `node scripts/test-store-config.js`
4. ✅ **Vérifier les logs serveur** (console)

---

## 🎉 Prêt à Commencer ?

### Étape 1 : Lire le README

```powershell
# Ouvrir le guide rapide
notepad README_POINTAGE_2_MAGASINS.md
```

### Étape 2 : Lancer l'installation

```powershell
# Installation interactive (recommandé)
.\INSTALLER_POINTAGE_2_MAGASINS.ps1
```

---

**🚀 Bon pointage multi-sites !**

© 2026 - Documentation Pointage GPS Multi-Sites pour GS Cursor
