# Migration Railway → Supabase (100% en ligne, sans casser le site)

Objectif : **copier la base Railway vers Supabase**, puis **basculer le backend Railway** pour pointer sur Supabase (rollback possible).

## 0) Important (pourquoi ça plantait)

Dans ton écran “Connect to your project”, tu as : **“Not IPv4 compatible”** en “Direct connection”.  
Ça veut dire : depuis beaucoup de réseaux (et parfois depuis ton PC), la connexion directe `db.<project>.supabase.co:5432` peut échouer.

➡️ La solution “en ligne” consiste à exécuter l’import depuis un runner (GitHub Actions) qui, lui, a accès réseau, et/ou à utiliser le **Pooler** Supabase (Transaction/Session).

## 1) Préparer les 2 URLs (Railway + Supabase)

### A) Railway `DATABASE_URL`
- Railway → ton service PostgreSQL → **Connect** → copier l’URL PostgreSQL.

### B) Supabase `DATABASE_URL` (Pooler recommandé)
- Supabase Dashboard → ton projet → **Connect** (la fenêtre que tu as)  
- Mets :
  - **Type**: `URI`
  - **Source**: `Primary Database`
  - **Method**: **Transaction pooler** (ou “Session pooler” si dispo)
- Copie l’URL, remplace `[YOUR-PASSWORD]` par ton vrai mot de passe.

## 2) Méthode 100% en ligne : GitHub Actions (zéro install sur ton PC)

J’ai ajouté un workflow : `.github/workflows/migrate-railway-to-supabase.yml`

### A) Mettre le projet sur GitHub
- Si ce repo n’est pas encore sur GitHub : pousse-le (push) sur GitHub.

### B) Ajouter les secrets GitHub
Dans GitHub : **Settings → Secrets and variables → Actions → New repository secret**

Crée :
- **`RAILWAY_DATABASE_URL`** = l’URL Railway (Postgres)
- **`SUPABASE_DATABASE_URL`** = l’URL Supabase (pooler recommandé)

### C) Lancer la migration
Dans GitHub : **Actions → “Migrate Railway -> Supabase (online)” → Run workflow**
- Mode `migrate`

Le workflow va :
1. Nettoyer Supabase (`supabase-cleanup.sql`)
2. Créer le schéma (`supabase-schema-utf8.sql`)
3. Préparer l’import (`backups/prepare-import-supabase.sql`)
4. Copier les données (`pg_dump Railway | psql Supabase`)
5. Afficher quelques compteurs (users/products/orders)

## 3) Vérifier sur Supabase

Supabase Dashboard → **Table Editor**
- Vérifie `users`, `orders`, `products`, etc.

## 4) Basculer SANS casser le site (rollback instant)

### Stratégie recommandée (zéro downtime “perçu”, petite fenêtre de gel des écritures)
1. **(Optionnel mais conseillé)** : pendant 2–5 minutes, évite de créer/modifier des commandes (gel des écritures).
2. Lance la migration GitHub Actions.
3. Quand c’est OK, sur Railway (backend) :
   - Variables → remplace `DATABASE_URL` par l’URL Supabase (pooler).
4. Redeploy Railway backend.
5. Teste le site.

### Rollback (si souci)
Railway backend → remettre l’ancienne `DATABASE_URL` Railway → redeploy.

## 5) Note sécurité (important)

Dans ton repo, il y a un script `IMPORTER_DONNEES_RAILWAY_SUPABASE.ps1` qui contient des URLs avec mot de passe en clair.  
➡️ Je te conseille de **reset le mot de passe Supabase** et de ne jamais committer des URLs avec mots de passe.

