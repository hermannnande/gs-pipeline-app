# Script de synchronisation du stock en livraison
# Ce script analyse toutes les commandes avec les livreurs et synchronise le stockLocalReserve

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SYNCHRONISATION STOCK EN LIVRAISON" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# URL de votre API (Railway)
$API_URL = "https://gs-cursor-production.up.railway.app/api"

# Demander le token d'authentification
Write-Host "Veuillez vous connecter avec vos identifiants ADMIN ou GESTIONNAIRE_STOCK:" -ForegroundColor Yellow
Write-Host ""
$email = Read-Host "Email"
$password = Read-Host "Mot de passe" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$password_plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Connexion en cours..." -ForegroundColor Yellow

# Se connecter pour obtenir le token
try {
    $loginBody = @{
        email = $email
        password = $password_plain
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    
    Write-Host "Connexion reussie!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERREUR de connexion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Etape 1: Analyser le stock actuel
Write-Host "ETAPE 1: Analyse du stock en livraison..." -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $analysis = Invoke-RestMethod -Uri "$API_URL/stock-analysis/local-reserve" -Method Get -Headers $headers
    
    Write-Host "Resultats de l'analyse:" -ForegroundColor White
    Write-Host "  - Total commandes en livraison: $($analysis.summary.totalCommandes)" -ForegroundColor White
    Write-Host "  - Total quantite avec livreurs: $($analysis.summary.totalQuantite)" -ForegroundColor White
    Write-Host "  - Produits concernes: $($analysis.summary.totalProduitsConcernes)" -ForegroundColor White
    Write-Host "  - Livreurs actifs: $($analysis.summary.totalLivreurs)" -ForegroundColor White
    Write-Host "  - Ecarts detectes: $($analysis.summary.totalEcarts)" -ForegroundColor $(if ($analysis.summary.totalEcarts -gt 0) { "Yellow" } else { "Green" })
    Write-Host ""

    if ($analysis.summary.totalEcarts -gt 0) {
        Write-Host "ECARTS DETECTES:" -ForegroundColor Yellow
        Write-Host ""
        foreach ($ecart in $analysis.ecarts) {
            $symbole = if ($ecart.ecart -gt 0) { "+" } else { "" }
            Write-Host "  Produit: $($ecart.productNom) ($($ecart.productCode))" -ForegroundColor White
            Write-Host "     Stock enregistre: $($ecart.quantiteEnregistree)" -ForegroundColor Gray
            Write-Host "     Stock reel: $($ecart.quantiteReelle)" -ForegroundColor Gray
            Write-Host "     Ecart: $symbole$($ecart.ecart)" -ForegroundColor $(if ($ecart.ecart -gt 0) { "Yellow" } else { "Cyan" })
            Write-Host ""
        }
    } else {
        Write-Host "Aucun ecart detecte. Le stock est deja synchronise!" -ForegroundColor Green
        Write-Host ""
        Read-Host "Appuyez sur Entree pour quitter"
        exit 0
    }

} catch {
    Write-Host "ERREUR lors de l'analyse: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Etape 2: Demander confirmation pour la synchronisation
Write-Host "ETAPE 2: Synchronisation" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cette operation va corriger le stock en livraison (stockLocalReserve) pour tous les produits." -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Voulez-vous continuer? (O/N)"

if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host ""
    Write-Host "Synchronisation annulee." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
    exit 0
}

Write-Host ""
Write-Host "Synchronisation en cours..." -ForegroundColor Yellow

try {
    $recalculate = Invoke-RestMethod -Uri "$API_URL/stock-analysis/recalculate-local-reserve" -Method Post -Headers $headers
    
    Write-Host ""
    Write-Host "SYNCHRONISATION TERMINEE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resultats:" -ForegroundColor White
    Write-Host "  - Corrections appliquees: $($recalculate.totalCorrections)" -ForegroundColor White
    Write-Host ""

    if ($recalculate.totalCorrections -gt 0) {
        Write-Host "Detail des corrections:" -ForegroundColor White
        Write-Host ""
        foreach ($correction in $recalculate.corrections) {
            $symbole = if ($correction.ecart -gt 0) { "+" } else { "" }
            Write-Host "  >> $($correction.productNom)" -ForegroundColor Green
            Write-Host "     Ancien: $($correction.ancien) | Nouveau: $($correction.nouveau) | Ecart: $symbole$($correction.ecart)" -ForegroundColor Gray
        }
    }

} catch {
    Write-Host ""
    Write-Host "ERREUR lors de la synchronisation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuyez sur Entree pour quitter"
