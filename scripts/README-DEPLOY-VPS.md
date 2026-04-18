# Deploy frontend React sur le VPS

Script de deploiement automatise du frontend React vers le VPS `obrille.com`.

## Pre-requis (une seule fois)

1. **Cle SSH** : `~/.ssh/obrille_temp` (ou autre, configurable).
2. **Fichier `.env.vps`** a la racine du projet :
   ```bash
   cp .env.vps.example .env.vps
   # editer .env.vps avec tes valeurs
   ```
3. **Acces SSH** au VPS (user `obrilleshell` cree dans ISPConfig).

## Commandes

| Commande | Action |
|---|---|
| `npm run deploy:vps` | Build + deploy le shell React (~5s) |
| `npm run deploy:vps:images` | Build + deploy shell + images (premier deploy) |
| `npm run deploy:vps:dry` | Affiche les actions sans rien executer |
| `npm run deploy:vps -- --skip-build` | Deploy le `dist/` existant sans rebuild |
| `npm run deploy:vps -- --no-check` | Skip les tests d'URLs apres deploy |

## Pipeline

1. **Verifications** : ssh, tar, npm, cle SSH, vars d'env
2. **Build vite** avec `VITE_API_URL`, `VITE_BASE_PATH`, `VITE_SOCKET_URL`
3. **Package** tar.gz du shell React (sans images par defaut)
4. **Upload** via SSH base64 pipe
5. **Deploy distant** : backup auto + extraction + nettoyage
6. **Tests** : check des 5 URLs publiques (200 + React detecte)

## Workflow typique

### Modif simple du code React
```bash
# 1. Modifier le code dans frontend/src/...
# 2. Tester en local : npm run dev (dans frontend/)
# 3. Deployer sur le VPS :
npm run deploy:vps
```

### Ajout d'un nouveau slug landing
1. Ajouter le slug dans `frontend/src/hooks/useLandingSlug.ts` -> `VALID_LANDING_SLUGS`
2. Ajouter les 2 routes dans `frontend/src/App.tsx` (landing + merci)
3. Ajouter le slug dans le `.htaccess` racine du VPS (regex)
4. Ajouter le slug dans `.env.vps` -> `LANDING_SLUGS` (pour les tests auto)
5. `npm run deploy:vps`

### Mise a jour des images
```bash
# Place les nouvelles images dans frontend/public/<dossier>/
npm run deploy:vps:images
```

## Backups & Rollback

A chaque deploy, le dossier `assets/` actuel est backupe sur le VPS dans
`/web/landings-app/assets.bak-<timestamp>`. Les 3 derniers backups sont conserves.

### Rollback rapide
```bash
ssh -i ~/.ssh/obrille_temp obrilleshell@vps112526.serveur-vps.net
ls /web/landings-app/assets.bak-*    # liste les backups
cp -r /web/landings-app/assets.bak-20260418-183600 /web/landings-app/assets
```

### Rollback complet vers WordPress (iframe)
```bash
# 1. Restaurer .htaccess racine
cp /web/.htaccess.before-react-20260418-182354 /web/.htaccess
# 2. Republier les pages WP : Admin > Pages > Brouillons > Publier
```

## Troubleshooting

**"Cle SSH introuvable"** : verifier le chemin dans `.env.vps` (le `~` est expandi).

**"Build echoue"** : lancer `cd frontend && npm install` puis re-essayer.

**"Connection closed" / "Permission denied"** : verifier que la cle SSH est valide
et que le user `obrilleshell` existe dans ISPConfig.

**Page blanche apres deploy** : verifier que `VITE_BASE_PATH` correspond bien
a `VPS_APP_DIR` dans `.env.vps` (par exemple `/landings-app/` pour `/web/landings-app`).
