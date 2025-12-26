# Script PowerShell pour corriger le stock en livraison sur Railway
# Execution: .\executer-correction-stock-production.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORRECTION STOCK EN LIVRAISON" -ForegroundColor Cyan
Write-Host "  Serveur: Railway Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiUrl = "https://gs-pipeline-app-production.up.railway.app"
$checkEndpoint = "$apiUrl/api/maintenance/check-stock-coherence"
$fixEndpoint = "$apiUrl/api/maintenance/fix-stock-local-reserve"

# Demander les credentials
Write-Host "Entrez vos identifiants ADMIN:" -ForegroundColor Yellow
$email = Read-Host "Email"
$password = Read-Host "Mot de passe" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

Write-Host ""
Write-Host "Connexion en cours..." -ForegroundColor Yellow

# Connexion pour obtenir le token
try {
    $loginBody = @{
        email = $email
        password = $passwordPlain
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod `
        -Uri "$apiUrl/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"

    $token = $loginResponse.token
    $user = $loginResponse.user

    Write-Host "OK - Connecte en tant que: $($user.nom) $($user.prenom) [$($user.role)]" -ForegroundColor Green

    if ($user.role -ne "ADMIN") {
        Write-Host "ERREUR: Seul le role ADMIN peut executer cette correction." -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "ERREUR de connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ETAPE 1: VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Analyse de la coherence du stock en livraison..." -ForegroundColor Yellow

# Verifier la coherence
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $checkResult = Invoke-RestMethod `
        -Uri $checkEndpoint `
        -Method GET `
        -Headers $headers

    Write-Host ""
    Write-Host "Resultats de l'analyse:" -ForegroundColor Cyan
    Write-Host "   Total de produits: $($checkResult.totalProduits)" -ForegroundColor White
    Write-Host "   Produits incoherents: $($checkResult.produitsIncoherents)" -ForegroundColor $(if ($checkResult.produitsIncoherents -gt 0) { "Red" } else { "Green" })

    if ($checkResult.coherent) {
        Write-Host ""
        Write-Host "OK - Tout est coherent ! Aucune correction necessaire." -ForegroundColor Green
        exit 0
    }

    Write-Host ""
    Write-Host "Incoherences detectees:" -ForegroundColor Yellow
    Write-Host ""

    foreach ($item in $checkResult.incoherences) {
        Write-Host "   [$($item.code)] $($item.nom)" -ForegroundColor White
        Write-Host "      Stock BDD: $($item.stockBDD) $(if ($item.stockBDD -lt 0) { 'NEGATIF' } else { '' })" -ForegroundColor $(if ($item.stockBDD -lt 0) { "Red" } else { "White" })
        Write-Host "      Stock REEL: $($item.stockReel) OK" -ForegroundColor Green
        Write-Host "      Difference: $(if ($item.difference -gt 0) { '+' })$($item.difference)" -ForegroundColor Yellow
        
        if ($item.nbCommandes -gt 0) {
            Write-Host "      $($item.nbCommandes) commande(s) en livraison:" -ForegroundColor Cyan
            foreach ($cmd in $item.commandes) {
                Write-Host "         - $($cmd.reference) - $($cmd.quantite) unite(s) - $($cmd.livreur)" -ForegroundColor Gray
            }
        } else {
            Write-Host "      Aucune commande en livraison (stock devrait etre a 0)" -ForegroundColor Gray
        }
        Write-Host ""
    }

} catch {
    Write-Host "ERREUR lors de la verification: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Demander confirmation
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ETAPE 2: CORRECTION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "La correction va recalculer le stock en livraison" -ForegroundColor Yellow
Write-Host "base sur les commandes ASSIGNEE reelles." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Voulez-vous proceder a la correction ? (oui/non)"

if ($confirmation -ne "oui") {
    Write-Host ""
    Write-Host "Correction annulee." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Correction en cours..." -ForegroundColor Yellow

# Executer la correction
try {
    $fixResult = Invoke-RestMethod `
        -Uri $fixEndpoint `
        -Method POST `
        -Headers $headers

    Write-Host ""
    Write-Host "OK - $($fixResult.message)" -ForegroundColor Green
    Write-Host ""

    if ($fixResult.productsFixed.Count -gt 0) {
        Write-Host "Details des corrections:" -ForegroundColor Cyan
        Write-Host ""

        foreach ($item in $fixResult.productsFixed) {
            Write-Host "   OK - [$($item.code)] $($item.nom)" -ForegroundColor Green
            Write-Host "      $($item.avant) -> $($item.apres) ($(if ($item.difference -gt 0) { '+' })$($item.difference))" -ForegroundColor White
            
            if ($item.commandes.Count -gt 0) {
                Write-Host "      Commandes:" -ForegroundColor Cyan
                foreach ($cmd in $item.commandes) {
                    Write-Host "         - $($cmd.reference) - $($cmd.quantite) unite(s) - $($cmd.livreur)" -ForegroundColor Gray
                }
            }
            Write-Host ""
        }
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  OK - CORRECTION TERMINEE AVEC SUCCES" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "ERREUR lors de la correction: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Details: $($errorDetails.error)" -ForegroundColor Red
        } catch {
            Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    exit 1
}

Write-Host ""
Write-Host "Vous pouvez verifier les resultats dans l'interface Admin." -ForegroundColor Cyan
Write-Host ""
