# 🚀 Guide de Déploiement - GS Pipeline

Guide complet pour déployer votre application en production.

---

## 📋 Checklist Pré-Déploiement

Avant de déployer, assurez-vous d'avoir :

- [ ] ✅ Testé l'application en local
- [ ] ✅ Un compte sur une plateforme d'hébergement
- [ ] ✅ Une base de données PostgreSQL hébergée
- [ ] ✅ Un nom de domaine (recommandé)
- [ ] ✅ Sauvegardé vos données de test si nécessaire

---

## 🎯 Options de Déploiement

### Option 1 : Hébergement Simple (Recommandé pour débuter)

**Backend : Render.com (Gratuit/Payant)**
**Frontend : Vercel (Gratuit)**
**Base de données : Render PostgreSQL (Gratuit)**

#### Avantages
- ✅ Gratuit pour commencer
- ✅ Déploiement en quelques clics
- ✅ HTTPS automatique
- ✅ Pas de gestion serveur

### Option 2 : VPS Complet (Production)

**Serveur : DigitalOcean, AWS, OVH**

#### Avantages
- ✅ Contrôle total
- ✅ Performances optimales
- ✅ Évolutif

---

## 🌐 Option 1 : Déploiement Rapide (Render + Vercel)

### Étape 1 : Déployer la Base de Données

**Sur Render.com :**

1. Créez un compte sur https://render.com
2. Cliquez sur "New +" → "PostgreSQL"
3. Configurez :
   - **Name** : gs-pipeline-db
   - **Database** : gs_pipeline
   - **User** : gs_user
   - **Region** : Choisissez proche de vos utilisateurs
   - **Plan** : Free (ou Starter pour production)
4. Cliquez "Create Database"
5. **Copiez l'Internal Database URL** (elle ressemble à `postgresql://...`)

### Étape 2 : Déployer le Backend

**Sur Render.com :**

1. Cliquez "New +" → "Web Service"
2. Connectez votre repository Git (GitHub/GitLab)
3. Configurez :
   - **Name** : gs-pipeline-api
   - **Environment** : Node
   - **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command** : `node server.js`
   - **Plan** : Free (ou Starter pour production)

4. Ajoutez les variables d'environnement :
   ```
   DATABASE_URL = [Collez l'Internal Database URL]
   JWT_SECRET = [Générez une clé aléatoire]
   NODE_ENV = production
   PORT = 10000
   WEBHOOK_API_KEY = [Votre clé API]
   ```

5. Cliquez "Create Web Service"
6. Attendez le déploiement (5-10 min)
7. **Notez l'URL** : `https://gs-pipeline-api.onrender.com`

#### Initialiser la base de données

Une fois déployé :

1. Allez dans l'onglet "Shell" de votre service
2. Exécutez :
   ```bash
   npm run prisma:seed
   ```

### Étape 3 : Déployer le Frontend

**Sur Vercel :**

1. Créez un compte sur https://vercel.com
2. Cliquez "Add New" → "Project"
3. Importez votre repository Git
4. Configurez :
   - **Framework Preset** : Vite
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

5. Ajoutez la variable d'environnement :
   ```
   VITE_API_URL = https://gs-pipeline-api.onrender.com/api
   ```

6. Cliquez "Deploy"
7. Attendez le déploiement (2-3 min)
8. **Votre app est en ligne** : `https://votre-app.vercel.app`

### Étape 4 : Configuration Make

Mettez à jour votre webhook Make avec :

```
URL: https://gs-pipeline-api.onrender.com/api/webhook/order
Header X-API-Key: [Votre WEBHOOK_API_KEY]
```

---

## 🖥️ Option 2 : Déploiement sur VPS

### Prérequis

- VPS Ubuntu 20.04+ (DigitalOcean, AWS, OVH)
- Accès SSH root
- Nom de domaine configuré (A record vers votre VPS)

### Étape 1 : Préparer le Serveur

```bash
# Connexion SSH
ssh root@votre-ip

# Mise à jour
apt update && apt upgrade -y

# Installation Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Installation PostgreSQL
apt install -y postgresql postgresql-contrib

# Installation nginx
apt install -y nginx

# Installation PM2 (gestionnaire de processus)
npm install -g pm2

# Installation Certbot (SSL gratuit)
apt install -y certbot python3-certbot-nginx
```

### Étape 2 : Configurer PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base et l'utilisateur
CREATE DATABASE gs_pipeline;
CREATE USER gs_user WITH PASSWORD 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE gs_pipeline TO gs_user;
\q
```

### Étape 3 : Déployer le Backend

```bash
# Créer un utilisateur non-root
adduser gspipeline
usermod -aG sudo gspipeline
su - gspipeline

# Cloner le projet (ou upload via SFTP)
git clone https://github.com/votre-repo/gs-pipeline.git
cd gs-pipeline

# Installer les dépendances
npm install

# Créer le fichier .env
nano .env
```

Contenu du `.env` :
```env
DATABASE_URL="postgresql://gs_user:mot_de_passe_securise@localhost:5432/gs_pipeline"
JWT_SECRET="cle_jwt_securisee_aleatoire"
NODE_ENV=production
PORT=5000
WEBHOOK_API_KEY="votre_cle_api"
```

```bash
# Initialiser la base de données
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed

# Démarrer avec PM2
pm2 start server.js --name gs-pipeline-api
pm2 save
pm2 startup
```

### Étape 4 : Déployer le Frontend

```bash
# Aller dans le dossier frontend
cd frontend

# Configurer l'API
nano .env
```

Contenu du `.env` :
```env
VITE_API_URL=https://api.votre-domaine.com/api
```

```bash
# Build
npm install
npm run build

# Copier vers nginx
sudo mkdir -p /var/www/gs-pipeline
sudo cp -r dist/* /var/www/gs-pipeline/
```

### Étape 5 : Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/gs-pipeline
```

Contenu :
```nginx
# Frontend
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    root /var/www/gs-pipeline;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_types text/css application/javascript application/json;
}

# API Backend
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/gs-pipeline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 6 : Installer SSL (HTTPS)

```bash
# Certificat gratuit Let's Encrypt
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com -d api.votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

---

## 🔄 Mises à Jour

### Sur Render/Vercel
- Les mises à jour se font automatiquement à chaque push Git

### Sur VPS

```bash
# Backend
cd ~/gs-pipeline
git pull
npm install
npx prisma migrate deploy
pm2 restart gs-pipeline-api

# Frontend
cd ~/gs-pipeline/frontend
git pull
npm install
npm run build
sudo cp -r dist/* /var/www/gs-pipeline/
```

---

## 🔐 Sécurité en Production

### Backend

- [ ] ✅ Changez tous les mots de passe par défaut
- [ ] ✅ Utilisez des secrets JWT forts (64+ caractères)
- [ ] ✅ Configurez un pare-feu (ufw sur Ubuntu)
- [ ] ✅ Limitez les connexions PostgreSQL
- [ ] ✅ Activez HTTPS partout
- [ ] ✅ Configurez des backups automatiques

### Commandes de sécurité VPS

```bash
# Pare-feu
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# PostgreSQL sécurisé
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Changez "trust" par "md5" pour les connexions locales

sudo systemctl restart postgresql
```

---

## 📊 Monitoring

### Logs Backend (VPS)

```bash
# Logs en temps réel
pm2 logs gs-pipeline-api

# Monitoring
pm2 monit

# Statut
pm2 status
```

### Logs Backend (Render)
- Consultez l'onglet "Logs" de votre service

---

## 💾 Backups

### Base de données

```bash
# Backup manuel
pg_dump -U gs_user gs_pipeline > backup_$(date +%Y%m%d).sql

# Restauration
psql -U gs_user gs_pipeline < backup_20240101.sql
```

### Backup automatique (cron)

```bash
# Éditer crontab
crontab -e

# Ajouter (backup quotidien à 2h du matin)
0 2 * * * pg_dump -U gs_user gs_pipeline > /home/gspipeline/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 🎯 Performance

### Optimisations recommandées

1. **Cache** : Ajoutez Redis pour le cache
2. **CDN** : Utilisez Cloudflare pour le frontend
3. **Monitoring** : Installez des outils comme Sentry
4. **Scaling** : Passez à des plans supérieurs si nécessaire

---

## 🐛 Troubleshooting Production

### Backend ne répond pas
```bash
pm2 status
pm2 logs gs-pipeline-api
# Vérifier les variables d'environnement
```

### Base de données inaccessible
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

### Frontend ne charge pas
```bash
sudo nginx -t
sudo systemctl status nginx
# Vérifier les logs : /var/log/nginx/error.log
```

---

## ✅ Checklist Post-Déploiement

- [ ] L'application est accessible via HTTPS
- [ ] Le webhook Make fonctionne
- [ ] Les comptes de test fonctionnent
- [ ] Les emails sont configurés (si applicable)
- [ ] Les backups sont en place
- [ ] Le monitoring est actif
- [ ] La documentation est à jour
- [ ] L'équipe est formée

---

## 🎉 Félicitations !

Votre application GS Pipeline est maintenant en production ! 🚀

**Support continu :**
- Consultez les logs régulièrement
- Testez les backups mensuellement
- Mettez à jour les dépendances régulièrement
- Surveillez les performances

---

*Bon succès avec votre déploiement !*










