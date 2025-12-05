# Script de préparation au déploiement
# Exécutez : .\deploy-setup.ps1

Write-Host "🚀 PRÉPARATION DU DÉPLOIEMENT" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# 1. Vérifier Git
Write-Host "📦 Vérification de Git..." -ForegroundColor Yellow
if (!(Test-Path ".git")) {
    Write-Host "✅ Initialisation de Git..." -ForegroundColor Green
    git init
    git branch -M main
} else {
    Write-Host "✅ Git déjà initialisé" -ForegroundColor Green
}

Write-Host ""

# 2. Demander le nom d'utilisateur GitHub
Write-Host "👤 Configuration GitHub" -ForegroundColor Yellow
$githubUsername = Read-Host "Entrez votre nom d'utilisateur GitHub"

Write-Host ""

# 3. Demander le nom du repository
Write-Host "📁 Nom du repository" -ForegroundColor Yellow
$repoName = Read-Host "Nom du repository (par défaut: gs-pipeline-app)"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "gs-pipeline-app"
}

Write-Host ""

# 4. Ajouter les fichiers
Write-Host "📂 Ajout des fichiers..." -ForegroundColor Yellow
git add .

Write-Host ""

# 5. Commit
Write-Host "💾 Création du commit..." -ForegroundColor Yellow
git commit -m "Initial commit - GS Pipeline App ready for deployment"

Write-Host ""

# 6. Ajouter le remote
Write-Host "🔗 Configuration du repository distant..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/$githubUsername/$repoName.git"

# Vérifier si remote existe déjà
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "⚠️  Remote 'origin' existe déjà. Suppression..." -ForegroundColor Yellow
    git remote remove origin
}

git remote add origin $remoteUrl
Write-Host "✅ Remote configuré : $remoteUrl" -ForegroundColor Green

Write-Host ""

# 7. Push
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  Assurez-vous d'avoir créé le repository sur GitHub!" -ForegroundColor Red
Write-Host "   → https://github.com/new" -ForegroundColor Cyan
Write-Host ""
$continue = Read-Host "Repository créé sur GitHub? (o/n)"

if ($continue -eq "o" -or $continue -eq "O" -or $continue -eq "yes" -or $continue -eq "y") {
    Write-Host "📤 Push en cours..." -ForegroundColor Green
    git push -u origin main
    
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host "✅ CODE POUSSÉ SUR GITHUB AVEC SUCCÈS!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host ""
    
    # 8. Instructions suivantes
    Write-Host "🎯 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1️⃣  DÉPLOYER LE BACKEND SUR RAILWAY:" -ForegroundColor Yellow
    Write-Host "   → https://railway.app" -ForegroundColor Cyan
    Write-Host "   → New Project → Deploy from GitHub repo" -ForegroundColor Gray
    Write-Host "   → Sélectionnez: $repoName" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "2️⃣  AJOUTER POSTGRESQL:" -ForegroundColor Yellow
    Write-Host "   → Dans Railway: + New → Database → Add PostgreSQL" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "3️⃣  CONFIGURER LES VARIABLES D'ENVIRONNEMENT:" -ForegroundColor Yellow
    Write-Host "   → Dans le service backend → Variables:" -ForegroundColor Gray
    Write-Host "      DATABASE_URL (copier depuis PostgreSQL)" -ForegroundColor Gray
    Write-Host "      JWT_SECRET=votre_secret_production" -ForegroundColor Gray
    Write-Host "      NODE_ENV=production" -ForegroundColor Gray
    Write-Host '      MAKE_WEBHOOK_API_KEY=436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf' -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "4️⃣  DÉPLOYER LE FRONTEND SUR VERCEL:" -ForegroundColor Yellow
    Write-Host "   → https://vercel.com" -ForegroundColor Cyan
    Write-Host "   → Add New → Project → Import $repoName" -ForegroundColor Gray
    Write-Host "   → Root Directory: frontend" -ForegroundColor Gray
    Write-Host "   → Framework: Vite" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📖 Guide complet: DEPLOIEMENT_PRODUCTION.md" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Push annulé" -ForegroundColor Red
    Write-Host ""
    Write-Host "Créez d'abord le repository sur GitHub:" -ForegroundColor Yellow
    Write-Host "https://github.com/new" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Repository name: $repoName" -ForegroundColor Gray
    Write-Host "Public repository: ✅" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Puis relancez ce script." -ForegroundColor Yellow
}

