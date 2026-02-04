# 🎯 LIRE EN PREMIER - PROJET GS PIPELINE (SUPABASE)

> **Date : 1er février 2026**
> 
> ⚠️ **ATTENTION :** Le projet n'utilise PLUS Railway ! Tout est maintenant sur **SUPABASE** + **VERCEL**

---

## ✅ ÉTAT ACTUEL DU PROJET

### Architecture en Production

```
Frontend : https://obgestion.com (Vercel)
Backend  : https://gs-pipeline-app-2.vercel.app (Vercel Serverless)
Database : Supabase PostgreSQL (EU Central 1)
```

### Migration Railway → Supabase

**Date de migration :** 1er février 2026  
**Statut :** ✅ TERMINÉE ET OPÉRATIONNELLE

**Données migrées :**
- ✅ 55 utilisateurs
- ✅ 24 produits
- ✅ 6 923+ commandes
- ✅ Configuration GPS

---

## 📚 DOCUMENTATION MISE À JOUR

### ⭐ Fichiers CRITIQUES à lire (dans l'ordre)

1. **ETAT_ACTUEL_PROJET_SUPABASE.md**
   - Architecture actuelle (Supabase + Vercel)
   - Configuration complète
   - Dernières modifications
   - **À LIRE EN PREMIER !**

2. **ARCHITECTURE_ET_REGLES_METIER.md**
   - Règles métier critiques
   - Flux des commandes
   - Gestion du stock (REMIS/RETOUR)
   - Routes API

3. **GUIDE_DEMARRAGE_RAPIDE.md**
   - Commandes rapides
   - Workflow de développement
   - Débogage
   - **Mis à jour pour Supabase**

4. **DEPLOIEMENT_VERCEL_SUPABASE.md**
   - Guide complet de déploiement
   - Configuration Vercel + Supabase
   - Étapes détaillées

5. **INDEX_PROJET.md**
   - Navigation dans toute la documentation
   - Structure complète du projet

---

## ⚠️ FICHIERS OBSOLÈTES (NE PLUS UTILISER)

Ces fichiers mentionnent encore Railway et sont **OBSOLÈTES** :

- ❌ `DEPLOIEMENT_PRODUCTION.md` (ancien - Railway)
- ❌ `EXECUTER_SUR_RAILWAY.md` (obsolète)
- ❌ Tous les fichiers `*RAILWAY*.md` (migration terminée)

**Utilisez à la place :**
- ✅ `DEPLOIEMENT_VERCEL_SUPABASE.md` (nouveau)
- ✅ `ETAT_ACTUEL_PROJET_SUPABASE.md` (nouveau)

---

## 🚀 COMMANDES RAPIDES

### Développement local

```bash
# Backend (racine)
npm run dev

# Frontend (dossier frontend)
cd frontend
npm run dev
```

### Déploiement

```bash
git add .
git commit -m "Description"
git push origin main

# Vercel déploie automatiquement frontend + backend
```

### Vérifier la production

```bash
# Frontend
https://obgestion.com

# Backend API
curl https://obgestion.com/api/webhook/test \
  -H "X-API-KEY: votre_cle"
```

---

## 🔑 RÈGLES MÉTIER (RAPPEL RAPIDE)

### Stock : Les 2 moments clés

```
1️⃣ REMIS (Gestionnaire Stock confirme)
   → Stock disponible DIMINUE
   → Stock en livraison AUGMENTE

2️⃣ RETOUR (Gestionnaire Stock confirme)
   → Stock en livraison DIMINUE
   → Stock disponible AUGMENTE
```

### Ce qui NE change PAS le stock

- ❌ Appelant valide une commande
- ❌ Gestionnaire assigne un livreur
- ❌ Livreur marque REFUSEE/ANNULEE

---

## 🆕 NOUVELLES FONCTIONNALITÉS (1er février 2026)

### Pointage GPS ⭐ NOUVEAU

- Bouton "Pointer Arrivée" / "Pointer Départ"
- Vérification géolocalisation (rayon de tolérance)
- Détection automatique des retards
- Page admin "Présences" pour consultation
- Export CSV des présences

**Fichiers concernés :**
- `routes/attendance.routes.js`
- `frontend/src/components/attendance/AttendanceButton.tsx`
- `frontend/src/pages/admin/Attendances.tsx`

---

## 🔧 VARIABLES D'ENVIRONNEMENT

### Backend (Vercel)

```bash
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="votre_secret"
WEBHOOK_API_KEY="votre_cle"
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="votre_key"
```

### Frontend (Vercel)

```bash
VITE_API_URL="https://gs-pipeline-app-2.vercel.app"
```

---

## 🎯 PROCHAINES ACTIONS RECOMMANDÉES

1. **Lire la documentation mise à jour**
   - Commencez par `ETAT_ACTUEL_PROJET_SUPABASE.md`

2. **Archiver les anciens fichiers Railway**
   - Créer un dossier `docs/archives/railway/`
   - Y déplacer tous les fichiers `*RAILWAY*.md`

3. **Tester le pointage GPS**
   - Se connecter en tant qu'employé
   - Pointer Arrivée/Départ
   - Consulter en admin : `/admin/presences`

4. **Régénérer la clé API webhook** (sécurité)
   - La clé actuelle a été exposée
   - Créer une nouvelle clé aléatoire
   - Mettre à jour Make + Apps Script

---

## 📞 SUPPORT

### En cas de problème

1. **Consulter les logs Vercel**
   - Dashboard → Deployments → View Logs

2. **Vérifier Supabase**
   - Dashboard → Database → Health

3. **Lire la doc de dépannage**
   - `DEPLOIEMENT_VERCEL_SUPABASE.md` (section Troubleshooting)

---

## ✅ RÉSUMÉ EXÉCUTIF

**Projet :** GS Pipeline - Back-office e-commerce  
**État :** ✅ EN PRODUCTION ET OPÉRATIONNEL  
**Plateforme :** Supabase + Vercel  
**Domaine :** https://obgestion.com  
**Migration Railway → Supabase :** ✅ TERMINÉE  
**Dernière fonctionnalité :** Pointage GPS (1er février 2026)

---

## 🎉 LE PROJET EST STABLE !

- ✅ Base de données : Supabase (scalable, fiable)
- ✅ Hébergement : Vercel (auto-scaling, SSL, monitoring)
- ✅ Domaine custom : obgestion.com
- ✅ Pointage GPS : Opérationnel
- ✅ Webhook : Fonctionnel (Make + Apps Script)
- ✅ Documentation : Complète et à jour

**🚀 Prêt pour la production et la croissance !**

---

**Mise à jour suivante :** Quand de nouvelles fonctionnalités seront ajoutées

**Questions ?** Consultez `INDEX_PROJET.md` pour naviguer dans toute la documentation.

