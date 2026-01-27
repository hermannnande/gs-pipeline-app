# 🚀 Script d'installation : Tarification par Paliers
# Ce script automatise l'installation de la nouvelle fonctionnalité

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Installation : Tarification par Paliers de Quantité      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon dossier
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Host "❌ ERREUR : Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    Write-Host "   (là où se trouve le dossier 'prisma')" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "✅ Dossier du projet détecté" -ForegroundColor Green
Write-Host ""

# Étape 1 : Générer le client Prisma
Write-Host "📦 Étape 1/3 : Génération du client Prisma..." -ForegroundColor Cyan
try {
    npx prisma generate
    Write-Host "   ✅ Client Prisma généré avec succès" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    Write-Host "   Détails : $_" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host ""

# Étape 2 : Appliquer la migration
Write-Host "🔄 Étape 2/3 : Application de la migration..." -ForegroundColor Cyan
Write-Host "   Cette étape ajoute les champs prix2Unites et prix3Unites" -ForegroundColor Gray
Write-Host ""

$applyMigration = Read-Host "   Appliquer la migration maintenant ? (O/N)"

if ($applyMigration -eq "O" -or $applyMigration -eq "o") {
    try {
        npx prisma migrate deploy
        Write-Host "   ✅ Migration appliquée avec succès !" -ForegroundColor Green
        Write-Host ""
        Write-Host "   📊 Nouveaux champs ajoutés :" -ForegroundColor Cyan
        Write-Host "      - prix2Unites : Prix pour 2 unités (DOUBLE PRECISION)" -ForegroundColor Gray
        Write-Host "      - prix3Unites : Prix pour 3+ unités (DOUBLE PRECISION)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Erreur lors de l'application de la migration" -ForegroundColor Red
        Write-Host "   Détails : $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "   💡 Essayez d'exécuter manuellement :" -ForegroundColor Yellow
        Write-Host "      npx prisma migrate dev" -ForegroundColor White
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }
} else {
    Write-Host "   ⚠️  Migration annulée" -ForegroundColor Yellow
    Write-Host "   Vous devrez l'appliquer manuellement avec :" -ForegroundColor Yellow
    Write-Host "      npx prisma migrate deploy" -ForegroundColor White
}
Write-Host ""

# Étape 3 : Vérification
Write-Host "🔍 Étape 3/3 : Vérification..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que les fichiers existent
$filesToCheck = @(
    "prisma/migrations/20260127000000_add_prix_paliers/migration.sql",
    "frontend/src/utils/pricingHelpers.ts",
    "GUIDE_TARIFICATION_PALIERS.md",
    "RESUME_TARIFICATION_PALIERS.md"
)

$allFilesExist = $true
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file (manquant)" -ForegroundColor Red
        $allFilesExist = $false
    }
}
Write-Host ""

if ($allFilesExist) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║          ✨ Installation terminée avec succès ! ✨          ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 La tarification par paliers est maintenant installée !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   1️⃣  Redémarrer votre serveur :" -ForegroundColor White
    Write-Host "       • Arrêtez le serveur (Ctrl+C)" -ForegroundColor Gray
    Write-Host "       • Relancez avec : npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2️⃣  Configurer les prix :" -ForegroundColor White
    Write-Host "       • Connectez-vous en tant qu'Admin" -ForegroundColor Gray
    Write-Host "       • Allez dans 'Gestion des Produits'" -ForegroundColor Gray
    Write-Host "       • Modifiez vos produits pour ajouter les prix x2 et x3" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3️⃣  Tester :" -ForegroundColor White
    Write-Host "       • Créez une commande avec quantité = 2" -ForegroundColor Gray
    Write-Host "       • Vérifiez que le bon prix est appliqué" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📚 Documentation :" -ForegroundColor Cyan
    Write-Host "   • RESUME_TARIFICATION_PALIERS.md   (guide rapide)" -ForegroundColor White
    Write-Host "   • GUIDE_TARIFICATION_PALIERS.md    (documentation complète)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║       ⚠️  Installation partielle - Fichiers manquants      ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Certains fichiers sont manquants. Vérifiez les fichiers ci-dessus." -ForegroundColor Yellow
    Write-Host ""
}

# Option pour ouvrir la documentation
Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Gray
$openDoc = Read-Host "Voulez-vous ouvrir le guide de démarrage rapide ? (O/N)"

if ($openDoc -eq "O" -or $openDoc -eq "o") {
    if (Test-Path "RESUME_TARIFICATION_PALIERS.md") {
        Start-Process "RESUME_TARIFICATION_PALIERS.md"
        Write-Host "   ✅ Guide ouvert dans votre éditeur par défaut" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Fichier RESUME_TARIFICATION_PALIERS.md introuvable" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "👋 Merci d'avoir utilisé ce script d'installation !" -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"
