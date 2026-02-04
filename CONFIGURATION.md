# ⚙️ Configuration du projet GS Pipeline

## 📝 Fichiers de configuration nécessaires

### 1. Backend - Fichier `.env` (racine du projet)

Créez un fichier `.env` à la racine avec ce contenu :

```env
# Base de données PostgreSQL (Supabase)
# ⚠️ En développement local, utilisez l'URL de connexion Supabase
# Dashboard Supabase → Project Settings → Database → Connection String
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

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
VITE_API_URL=https://gs-pipeline-app-2.vercel.app
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

### Utiliser Supabase (Recommandé en production)

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Allez dans **Project Settings** → **Database**
4. Copiez les "Connection strings" :
   - **Transaction pooler** (pour DATABASE_URL avec Prisma)
   - **Direct connection** (pour DIRECT_URL)

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

### Base de données locale (Optionnel - développement)

```bash
# Installer PostgreSQL localement
# macOS
brew install postgresql@14

# Créer la base de données
createdb gs_pipeline

# URL locale
DATABASE_URL="postgresql://postgres:password@localhost:5432/gs_pipeline"
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

### Backend en production (Vercel)

```env
# Variables d'environnement Vercel
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="cle_tres_securisee_generee_aleatoirement_64_caracteres_minimum"
NODE_ENV=production
WEBHOOK_API_KEY="cle_api_webhook_securisee"
MAKE_WEBHOOK_API_KEY="cle_api_webhook_securisee"
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="votre_service_role_key"
```

### Frontend en production (Vercel)

```env
# Variables d'environnement Vercel
VITE_API_URL=https://gs-pipeline-app-2.vercel.app
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

### Connexion Supabase

Pour connecter Prisma à Supabase :

```env
# Transaction pooler (pour les fonctions serverless)
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (pour les migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

**Note :** Supabase utilise PgBouncer en mode transaction pooler, donc utilisez DIRECT_URL pour les migrations Prisma.

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










