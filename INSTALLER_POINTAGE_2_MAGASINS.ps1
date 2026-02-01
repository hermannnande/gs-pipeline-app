# 🏢 Installation Automatique - Pointage GPS pour 2 Magasins
# Ce script installe et configure le système de géolocalisation multi-sites

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                      ║" -ForegroundColor Cyan
Write-Host "║        🏢  INSTALLATION POINTAGE GPS - 2 MAGASINS                    ║" -ForegroundColor Cyan
Write-Host "║                                                                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Afficher les instructions
Write-Host "🗺️  Ce script va configurer le pointage GPS pour 2 magasins" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Avant de commencer, vous aurez besoin de :" -ForegroundColor White
Write-Host "   1. Les coordonnées GPS du Magasin 1 (ex: 5.353021, -3.870182)" -ForegroundColor Gray
Write-Host "   2. Les coordonnées GPS du Magasin 2 (ex: 5.323456, -4.012345)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Comment obtenir les coordonnées GPS ?" -ForegroundColor Cyan
Write-Host "   1. Ouvrir Google Maps : https://www.google.com/maps" -ForegroundColor Gray
Write-Host "   2. Chercher votre magasin/bureau" -ForegroundColor Gray
Write-Host "   3. Cliquer-droit sur le lieu exact" -ForegroundColor Gray
Write-Host "   4. Cliquer sur les coordonnées qui apparaissent en haut" -ForegroundColor Gray
Write-Host "   5. Copier (format: 5.353021, -3.870182)" -ForegroundColor Gray
Write-Host ""

# Demander confirmation
$continuer = Read-Host "Avez-vous vos coordonnées GPS ? (o/n)"

if ($continuer -ne "o" -and $continuer -ne "O") {
    Write-Host ""
    Write-Host "⏸️  Installation annulée" -ForegroundColor Yellow
    Write-Host "   Revenez une fois que vous aurez vos coordonnées GPS" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Collecte des informations pour Magasin 1
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "📍 MAGASIN 1 - Configuration" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

$mag1_nom = Read-Host "Nom du Magasin 1 (ex: Magasin 1 - Yopougon)"
if ([string]::IsNullOrWhiteSpace($mag1_nom)) {
    $mag1_nom = "Magasin 1 - Yopougon"
}

$mag1_adresse = Read-Host "Adresse du Magasin 1 (ex: Yopougon, Abidjan)"
if ([string]::IsNullOrWhiteSpace($mag1_adresse)) {
    $mag1_adresse = "Yopougon, Abidjan, Côte d'Ivoire"
}

$mag1_lat = Read-Host "Latitude du Magasin 1 (ex: 5.353021)"
if ([string]::IsNullOrWhiteSpace($mag1_lat)) {
    Write-Host "❌ Latitude obligatoire !" -ForegroundColor Red
    exit 1
}

$mag1_lon = Read-Host "Longitude du Magasin 1 (ex: -3.870182)"
if ([string]::IsNullOrWhiteSpace($mag1_lon)) {
    Write-Host "❌ Longitude obligatoire !" -ForegroundColor Red
    exit 1
}

$mag1_rayon = Read-Host "Rayon de tolérance en mètres (par défaut: 50)"
if ([string]::IsNullOrWhiteSpace($mag1_rayon)) {
    $mag1_rayon = "50"
}

# Collecte des informations pour Magasin 2
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "📍 MAGASIN 2 - Configuration" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

$mag2_nom = Read-Host "Nom du Magasin 2 (ex: Magasin 2 - Plateau)"
if ([string]::IsNullOrWhiteSpace($mag2_nom)) {
    $mag2_nom = "Magasin 2 - Plateau"
}

$mag2_adresse = Read-Host "Adresse du Magasin 2 (ex: Plateau, Abidjan)"
if ([string]::IsNullOrWhiteSpace($mag2_adresse)) {
    $mag2_adresse = "Plateau, Abidjan, Côte d'Ivoire"
}

$mag2_lat = Read-Host "Latitude du Magasin 2 (ex: 5.323456)"
if ([string]::IsNullOrWhiteSpace($mag2_lat)) {
    Write-Host "❌ Latitude obligatoire !" -ForegroundColor Red
    exit 1
}

$mag2_lon = Read-Host "Longitude du Magasin 2 (ex: -4.012345)"
if ([string]::IsNullOrWhiteSpace($mag2_lon)) {
    Write-Host "❌ Longitude obligatoire !" -ForegroundColor Red
    exit 1
}

$mag2_rayon = Read-Host "Rayon de tolérance en mètres (par défaut: 50)"
if ([string]::IsNullOrWhiteSpace($mag2_rayon)) {
    $mag2_rayon = "50"
}

# Résumé de la configuration
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 RÉSUMÉ DE LA CONFIGURATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🏢 Magasin 1:" -ForegroundColor Yellow
Write-Host "   Nom      : $mag1_nom" -ForegroundColor White
Write-Host "   Adresse  : $mag1_adresse" -ForegroundColor White
Write-Host "   Latitude : $mag1_lat" -ForegroundColor White
Write-Host "   Longitude: $mag1_lon" -ForegroundColor White
Write-Host "   Rayon    : $mag1_rayon m" -ForegroundColor White
Write-Host ""
Write-Host "🏢 Magasin 2:" -ForegroundColor Yellow
Write-Host "   Nom      : $mag2_nom" -ForegroundColor White
Write-Host "   Adresse  : $mag2_adresse" -ForegroundColor White
Write-Host "   Latitude : $mag2_lat" -ForegroundColor White
Write-Host "   Longitude: $mag2_lon" -ForegroundColor White
Write-Host "   Rayon    : $mag2_rayon m" -ForegroundColor White
Write-Host ""

$confirmer = Read-Host "Les informations sont-elles correctes ? (o/n)"

if ($confirmer -ne "o" -and $confirmer -ne "O") {
    Write-Host ""
    Write-Host "❌ Configuration annulée" -ForegroundColor Red
    Write-Host "   Relancez le script pour recommencer" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Étape 1 : Générer le client Prisma
Write-Host ""
Write-Host "📦 Étape 1/3 : Génération du client Prisma..." -ForegroundColor Yellow
Write-Host ""
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Client Prisma généré avec succès" -ForegroundColor Green
Write-Host ""

# Étape 2 : Appliquer la migration (si nécessaire)
Write-Host "🗄️  Étape 2/3 : Vérification de la base de données..." -ForegroundColor Yellow
Write-Host ""
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration non appliquée (peut-être déjà à jour)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Base de données à jour" -ForegroundColor Green
}
Write-Host ""

# Étape 3 : Modifier le script de configuration avec les valeurs saisies
Write-Host "📍 Étape 3/3 : Configuration des 2 magasins..." -ForegroundColor Yellow
Write-Host ""

# Lire le template
$scriptContent = Get-Content "scripts\setup-two-stores.js" -Raw

# Remplacer les valeurs du Magasin 1
$scriptContent = $scriptContent -replace "nom: 'Magasin 1 - Yopougon'", "nom: '$mag1_nom'"
$scriptContent = $scriptContent -replace "adresse: 'Yopougon, Abidjan, Côte d''Ivoire'", "adresse: '$mag1_adresse'"
$scriptContent = $scriptContent -replace "latitude: 5\.353021,\s+// ⚠️ À REMPLACER", "latitude: $mag1_lat,"
$scriptContent = $scriptContent -replace "longitude: -3\.870182,\s+// ⚠️ À REMPLACER", "longitude: $mag1_lon,"
$scriptContent = $scriptContent -replace "rayonTolerance: 50,\s+// 50 mètres \(ajustez si nécessaire\)", "rayonTolerance: $mag1_rayon,"

# Remplacer les valeurs du Magasin 2
$scriptContent = $scriptContent -replace "nom: 'Magasin 2 - Plateau'", "nom: '$mag2_nom'"
$scriptContent = $scriptContent -replace "adresse: 'Plateau, Abidjan, Côte d''Ivoire'", "adresse: '$mag2_adresse'"
$scriptContent = $scriptContent -replace "latitude: 5\.323456,\s+// ⚠️ À REMPLACER", "latitude: $mag2_lat,"
$scriptContent = $scriptContent -replace "longitude: -4\.012345,\s+// ⚠️ À REMPLACER", "longitude: $mag2_lon,"

# Sauvegarder le fichier temporaire
$tempScript = "scripts\setup-two-stores-temp.js"
$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

# Exécuter le script modifié
node $tempScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la configuration GPS" -ForegroundColor Red
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    exit 1
}

# Nettoyer le fichier temporaire
Remove-Item $tempScript -ErrorAction SilentlyContinue

# Succès !
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                      ║" -ForegroundColor Green
Write-Host "║        ✅ INSTALLATION TERMINÉE AVEC SUCCÈS !                       ║" -ForegroundColor Green
Write-Host "║                                                                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Le système de pointage GPS multi-sites est prêt !" -ForegroundColor Cyan
Write-Host ""
Write-Host "🗺️  Vérifier vos coordonnées sur Google Maps :" -ForegroundColor Yellow
Write-Host "   Magasin 1: https://www.google.com/maps?q=$mag1_lat,$mag1_lon" -ForegroundColor Cyan
Write-Host "   Magasin 2: https://www.google.com/maps?q=$mag2_lat,$mag2_lon" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "   1. Redémarrer le serveur : npm run dev" -ForegroundColor White
Write-Host "   2. Se connecter à l'application" -ForegroundColor White
Write-Host "   3. Tester le pointage dans les 2 magasins" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation complète : GUIDE_CONFIGURATION_2_MAGASINS_GPS.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Conseils :" -ForegroundColor Yellow
Write-Host "   - Le système détecte automatiquement le magasin le plus proche" -ForegroundColor White
Write-Host "   - Testez d'abord avec un employé dans chaque magasin" -ForegroundColor White
Write-Host "   - Si trop de refus : augmentez le rayon (50m → 100m)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Bon pointage multi-sites !" -ForegroundColor Green
Write-Host ""
