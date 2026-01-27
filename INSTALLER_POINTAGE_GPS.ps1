# 🗺️ Script d'Installation - Système de Pointage GPS
# Ce script installe et configure le système de géolocalisation

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                      ║" -ForegroundColor Cyan
Write-Host "║        🗺️  INSTALLATION SYSTÈME DE POINTAGE GPS                     ║" -ForegroundColor Cyan
Write-Host "║                                                                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Étape 1 : Générer le client Prisma
Write-Host "📦 Étape 1/3 : Génération du client Prisma..." -ForegroundColor Yellow
Write-Host ""
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Client Prisma généré avec succès" -ForegroundColor Green
Write-Host ""

# Étape 2 : Appliquer la migration
Write-Host "🗄️  Étape 2/3 : Application de la migration..." -ForegroundColor Yellow
Write-Host ""
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'application de la migration" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions possibles :" -ForegroundColor Yellow
    Write-Host "   1. Vérifiez votre connexion à la base de données" -ForegroundColor White
    Write-Host "   2. Vérifiez DATABASE_URL dans .env" -ForegroundColor White
    Write-Host "   3. Essayez : npx prisma migrate reset" -ForegroundColor White
    exit 1
}
Write-Host "✅ Migration appliquée avec succès" -ForegroundColor Green
Write-Host ""

# Étape 3 : Configuration GPS
Write-Host "📍 Étape 3/3 : Configuration des coordonnées GPS..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT : Avant de continuer, vous devez :" -ForegroundColor Red
Write-Host "   1. Ouvrir Google Maps" -ForegroundColor White
Write-Host "   2. Chercher votre magasin/bureau" -ForegroundColor White
Write-Host "   3. Cliquer-droit sur le lieu" -ForegroundColor White
Write-Host "   4. Copier les coordonnées (ex: 5.353021, -3.870182)" -ForegroundColor White
Write-Host "   5. Modifier scripts/setup-store-location.js" -ForegroundColor White
Write-Host "   6. Remplacer latitude et longitude" -ForegroundColor White
Write-Host ""
$continuer = Read-Host "Avez-vous modifié scripts/setup-store-location.js ? (o/n)"

if ($continuer -eq "o" -or $continuer -eq "O") {
    node scripts/setup-store-location.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la configuration GPS" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "⏸️  Installation en pause" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Pour continuer :" -ForegroundColor Cyan
    Write-Host "   1. Modifiez scripts/setup-store-location.js" -ForegroundColor White
    Write-Host "   2. Relancez : node scripts/setup-store-location.js" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Succès !
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                      ║" -ForegroundColor Green
Write-Host "║        ✅ INSTALLATION TERMINÉE AVEC SUCCÈS !                       ║" -ForegroundColor Green
Write-Host "║                                                                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Le système de pointage GPS est prêt !" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "   1. Redémarrer le serveur : npm run dev" -ForegroundColor White
Write-Host "   2. Se connecter à l'application" -ForegroundColor White
Write-Host "   3. Tester le pointage sur le Dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation complète : GUIDE_POINTAGE_GPS.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Conseils :" -ForegroundColor Yellow
Write-Host "   - Testez d'abord avec un seul employé" -ForegroundColor White
Write-Host "   - Si trop de refus : augmentez le rayon (50m → 100m)" -ForegroundColor White
Write-Host "   - Activez le GPS haute précision sur les téléphones" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Bon pointage !" -ForegroundColor Green
Write-Host ""
