# ⚡ Commandes Utiles - GS Pipeline

Aide-mémoire des commandes fréquemment utilisées.

---

## 🚀 Démarrage Rapide

### Backend
```bash
npm install                    # Installer les dépendances
npm run dev                    # Démarrer en mode dev
npm start                      # Démarrer en mode production
```

### Frontend
```bash
cd frontend
npm install                    # Installer les dépendances
npm run dev                    # Démarrer en mode dev (port 3000)
npm run build                  # Build pour production
npm run preview                # Prévisualiser le build
```

---

## 🗄️ Base de Données (Prisma)

### Migrations

```bash
# Générer le client Prisma
npx prisma generate

# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser complètement la base
npx prisma migrate reset

# Formater le schéma
npx prisma format
```

### Données

```bash
# Insérer les données de test
npm run prisma:seed

# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio
# Puis ouvrir http://localhost:5555
```

### Inspections

```bash
# Vérifier l'état des migrations
npx prisma migrate status

# Générer un diagramme ERD (nécessite extension)
npx prisma generate --generator erd
```

---

## 🔍 PostgreSQL Direct

### Connexion

```bash
# Se connecter en local
psql -U postgres

# Se connecter à une base spécifique
psql -U postgres -d gs_pipeline

# Se connecter à distance
psql -U gs_user -h localhost -d gs_pipeline
```

### Commandes SQL Utiles

```sql
-- Lister les bases de données
\l

-- Se connecter à une base
\c gs_pipeline

-- Lister les tables
\dt

-- Décrire une table
\d orders

-- Compter les commandes
SELECT COUNT(*) FROM orders;

-- Voir les dernières commandes
SELECT * FROM orders ORDER BY "createdAt" DESC LIMIT 10;

-- Statistiques rapides
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- Quitter
\q
```

### Backup & Restauration

```bash
# Backup
pg_dump -U postgres gs_pipeline > backup.sql

# Backup avec timestamp
pg_dump -U postgres gs_pipeline > backup_$(date +%Y%m%d_%H%M%S).sql

# Restauration
psql -U postgres gs_pipeline < backup.sql

# Backup d'une seule table
pg_dump -U postgres -t orders gs_pipeline > orders_backup.sql
```

---

## 🛠️ Git

### Workflow de base

```bash
# Cloner le projet
git clone https://github.com/votre-repo/gs-pipeline.git

# Vérifier le statut
git status

# Ajouter les fichiers modifiés
git add .

# Commit
git commit -m "Description des changements"

# Push
git push origin main

# Pull les dernières modifications
git pull origin main
```

### Branches

```bash
# Créer une nouvelle branche
git checkout -b nouvelle-fonctionnalite

# Changer de branche
git checkout main

# Merger une branche
git merge nouvelle-fonctionnalite

# Supprimer une branche
git branch -d nouvelle-fonctionnalite
```

---

## 🐛 Debug & Logs

### Backend

```bash
# Logs en temps réel (mode dev)
npm run dev

# Tester une route API
curl http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gs-pipeline.com","password":"admin123"}'

# Tester le webhook
curl -X POST http://localhost:5000/api/webhook/order \
  -H "Content-Type: application/json" \
  -d '{
    "clientNom": "Test",
    "clientTelephone": "+212600000000",
    "clientVille": "Casablanca",
    "produitNom": "Produit Test",
    "quantite": 1,
    "montant": 299.00
  }'
```

### Frontend

```bash
# Vérifier les erreurs ESLint
npm run lint

# Build et vérifier les erreurs
npm run build

# Analyser la taille du bundle
npm run build -- --mode analyze
```

---

## 🔐 Sécurité

### Générer des secrets

```bash
# JWT Secret (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou avec OpenSSL
openssl rand -hex 64

# Générer un mot de passe
openssl rand -base64 32
```

### Hasher un mot de passe (bcrypt)

```javascript
// Dans Node.js
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('mot_de_passe', 10);
console.log(hash);
```

---

## 📊 Monitoring

### Backend avec PM2 (Production)

```bash
# Démarrer l'app
pm2 start server.js --name gs-pipeline-api

# Lister les processus
pm2 list

# Logs en temps réel
pm2 logs gs-pipeline-api

# Logs des 100 dernières lignes
pm2 logs gs-pipeline-api --lines 100

# Monitoring interactif
pm2 monit

# Redémarrer
pm2 restart gs-pipeline-api

# Arrêter
pm2 stop gs-pipeline-api

# Supprimer
pm2 delete gs-pipeline-api

# Sauvegarder la configuration
pm2 save

# Startup automatique
pm2 startup
```

### Nginx

```bash
# Tester la configuration
sudo nginx -t

# Recharger la configuration
sudo systemctl reload nginx

# Redémarrer nginx
sudo systemctl restart nginx

# Voir les logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Statut
sudo systemctl status nginx
```

---

## 🔄 Maintenance

### Nettoyage

```bash
# Nettoyer node_modules
rm -rf node_modules
npm install

# Nettoyer le cache npm
npm cache clean --force

# Nettoyer les builds
rm -rf dist build .next

# Nettoyer Prisma
rm -rf prisma/migrations
npx prisma migrate reset
```

### Mises à jour

```bash
# Vérifier les dépendances obsolètes
npm outdated

# Mettre à jour toutes les dépendances
npm update

# Mettre à jour une dépendance spécifique
npm update express

# Mettre à jour npm
npm install -g npm@latest
```

---

## 📦 Export de Données

### CSV via API

```bash
# Export des commandes (avec token)
curl http://localhost:5000/api/stats/export?type=orders \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -o commandes.json
```

### SQL

```sql
-- Export CSV depuis PostgreSQL
COPY orders TO '/tmp/orders.csv' DELIMITER ',' CSV HEADER;

-- Export avec conditions
COPY (SELECT * FROM orders WHERE status = 'LIVREE') 
TO '/tmp/orders_livrees.csv' DELIMITER ',' CSV HEADER;
```

---

## 🧪 Tests

### Tester l'API avec curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gs-pipeline.com","password":"admin123"}'

# Récupérer les commandes (avec token)
TOKEN="votre_token_jwt"
curl http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN"

# Créer une commande
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientNom": "Test",
    "clientTelephone": "+212600000000",
    "clientVille": "Casablanca",
    "produitNom": "Produit",
    "quantite": 1,
    "montant": 299.00
  }'
```

---

## 🔧 Dépannage Rapide

### Port déjà utilisé

```bash
# Trouver le processus qui utilise le port 5000
lsof -i :5000

# Tuer le processus
kill -9 PID

# Ou sur Windows
netstat -ano | findstr :5000
taskkill /PID PID /F
```

### Problème de permissions

```bash
# Donner les permissions à un dossier
sudo chown -R $USER:$USER /var/www/gs-pipeline

# Permissions PostgreSQL
sudo chmod 755 /var/lib/postgresql
```

### Reset complet du projet

```bash
# Backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npx prisma migrate reset

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Commandes Utiles Système

### Ubuntu/Linux

```bash
# Espace disque
df -h

# Mémoire RAM
free -h

# Processus en cours
htop  # ou top

# Ports ouverts
sudo netstat -tulpn

# Redémarrer le serveur
sudo reboot
```

### macOS

```bash
# Espace disque
df -h

# Processus
Activity Monitor (interface graphique)

# Ports ouverts
lsof -i -P | grep LISTEN
```

---

## 🎯 Raccourcis Développement

### Terminal

```bash
# Ouvrir 2 terminaux et exécuter en parallèle

# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Ou utiliser tmux/screen pour multiplexer
```

### VS Code

- `Ctrl+` ` : Ouvrir le terminal intégré
- `Ctrl+Shift+5` : Diviser le terminal
- `Ctrl+P` : Recherche rapide de fichiers
- `Ctrl+Shift+F` : Recherche dans tous les fichiers

---

## 📚 Ressources

### Documentation
- Prisma : https://www.prisma.io/docs
- Express : https://expressjs.com
- React : https://react.dev
- Vite : https://vitejs.dev
- TailwindCSS : https://tailwindcss.com

### Aide en ligne
```bash
# Aide Prisma
npx prisma --help

# Aide npm
npm help

# Version Node.js
node --version

# Version PostgreSQL
psql --version
```

---

## ⚡ Scripts Personnalisés

Vous pouvez ajouter ces scripts dans `package.json` :

```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev\" \"cd frontend && npm run dev\"",
    "setup": "npm install && npx prisma generate && npx prisma migrate dev && npm run prisma:seed",
    "reset": "npx prisma migrate reset --force && npm run prisma:seed",
    "backup": "pg_dump gs_pipeline > backup_$(date +%Y%m%d).sql"
  }
}
```

---

*Gardez ce fichier à portée de main pour référence rapide ! 📖*







