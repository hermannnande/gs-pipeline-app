# ⚙️ Configuration du projet GS Pipeline

## 📝 Fichiers de configuration nécessaires

### 1. Backend - Fichier `.env` (racine du projet)

Créez un fichier `.env` à la racine avec ce contenu :

```env
# Base de données PostgreSQL
# ⚠️ Remplacez USER, PASSWORD et si nécessaire le nom de la base
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gs_pipeline?schema=public"

# JWT Secret 
# ⚠️ IMPORTANT : Changez cette valeur avec une chaîne aléatoire sécurisée
JWT_SECRET="changez_cette_valeur_par_une_chaine_aleatoire_securisee"

# Port du serveur backend
PORT=5000

# Environnement
NODE_ENV=development

# Clé API pour le webhook (optionnel mais recommandé en production)
WEBHOOK_API_KEY="votre_cle_api_securisee"
```

#### 🔐 Générer un JWT_SECRET sécurisé

Vous pouvez générer une clé aléatoire avec Node.js :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Frontend - Fichier `frontend/.env`

Créez un fichier `.env` dans le dossier `frontend/` :

```env
# URL de l'API backend
VITE_API_URL=http://localhost:5000/api
```

**En production**, changez l'URL pour pointer vers votre API :
```env
VITE_API_URL=https://api.votre-domaine.com/api
```

## 🗄️ Configuration PostgreSQL

### Installation PostgreSQL

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Téléchargez et installez depuis [postgresql.org](https://www.postgresql.org/download/windows/)

### Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE gs_pipeline;

# Créer un utilisateur (optionnel)
CREATE USER gs_user WITH PASSWORD 'mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE gs_pipeline TO gs_user;

# Quitter
\q
```

Ensuite, mettez à jour votre `DATABASE_URL` dans `.env` :

```env
# Avec l'utilisateur postgres
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/gs_pipeline?schema=public"

# Ou avec l'utilisateur créé
DATABASE_URL="postgresql://gs_user:mot_de_passe@localhost:5432/gs_pipeline?schema=public"
```

## 🔧 Variables d'environnement détaillées

### Backend

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@localhost:5432/db` | ✅ Oui |
| `JWT_SECRET` | Clé secrète pour les tokens JWT | Chaîne aléatoire de 64+ caractères | ✅ Oui |
| `PORT` | Port du serveur API | `5000` | ⚠️ Non (défaut: 5000) |
| `NODE_ENV` | Environnement d'exécution | `development` ou `production` | ⚠️ Non |
| `WEBHOOK_API_KEY` | Clé API pour sécuriser le webhook | Chaîne aléatoire | ⚠️ Non (recommandé) |

### Frontend

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:5000/api` | ✅ Oui |

## 🚀 Configuration pour la production

### Backend en production

```env
# .env (production)
DATABASE_URL="postgresql://user:password@db-host:5432/gs_pipeline?schema=public"
JWT_SECRET="cle_tres_securisee_generee_aleatoirement_64_caracteres_minimum"
PORT=5000
NODE_ENV=production
WEBHOOK_API_KEY="cle_api_webhook_securisee"
```

### Frontend en production

```env
# frontend/.env (production)
VITE_API_URL=https://api.votre-domaine.com/api
```

## 🔒 Sécurité - Checklist

Avant de déployer en production :

- [ ] ✅ Changez le `JWT_SECRET` avec une valeur aléatoire forte
- [ ] ✅ Utilisez des mots de passe PostgreSQL sécurisés
- [ ] ✅ Configurez `WEBHOOK_API_KEY` pour protéger le webhook
- [ ] ✅ Activez HTTPS pour l'API et le frontend
- [ ] ✅ Configurez un pare-feu pour PostgreSQL
- [ ] ✅ Ne commitez JAMAIS les fichiers `.env` sur Git
- [ ] ✅ Utilisez des variables d'environnement sur votre plateforme d'hébergement
- [ ] ✅ Changez les mots de passe des comptes de test

## 📊 Configuration avancée

### Connexion PostgreSQL distante

Si votre base de données est hébergée (AWS RDS, DigitalOcean, etc.) :

```env
DATABASE_URL="postgresql://user:password@db-host.region.provider.com:5432/gs_pipeline?schema=public&sslmode=require"
```

### CORS en production

Dans `server.js`, configurez CORS pour votre domaine :

```javascript
app.use(cors({
  origin: 'https://votre-domaine.com',
  credentials: true
}));
```

### Proxy en production (nginx)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        root /var/www/gs-pipeline/frontend/dist;
        try_files $uri /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐳 Docker (optionnel)

Si vous souhaitez utiliser Docker, voici une configuration de base :

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: gs_pipeline
      POSTGRES_USER: gs_user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: "postgresql://gs_user:password@postgres:5432/gs_pipeline"
      JWT_SECRET: "votre_secret_jwt"
      NODE_ENV: production

volumes:
  postgres_data:
```

## 💡 Troubleshooting

### Erreur : "Can't reach database server"
- Vérifiez que PostgreSQL est démarré
- Vérifiez les identifiants dans `DATABASE_URL`
- Testez la connexion : `psql -U postgres -h localhost`

### Erreur : "JWT malformed"
- Vérifiez que `JWT_SECRET` est bien défini dans `.env`
- Supprimez le token dans localStorage et reconnectez-vous

### Erreur CORS
- Vérifiez que `VITE_API_URL` pointe vers le bon backend
- Vérifiez la configuration CORS dans `server.js`

---

✅ Une fois la configuration terminée, suivez le guide `QUICK_START.md` pour démarrer l'application.







