# ╔══════════════════════════════════════════════════════════════════════╗
# ║                                                                      ║
# ║           📍 ÉTAPE 3 : TESTER L'API - SCRIPT POWERSHELL             ║
# ║                                                                      ║
# ║                    ⏱️ TEMPS : 3 MINUTES                             ║
# ║                                                                      ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ⚠️ AVANT D'EXÉCUTER CE SCRIPT :
# ───────────────────────────────────────────────────────────────────────
# 1. Ouvrez le fichier .env
# 2. Copiez la valeur de MAKE_WEBHOOK_API_KEY
# 3. Remplacez "VOTRE_CLE_API_ICI" ci-dessous par votre clé

$API_KEY = "VOTRE_CLE_API_ICI"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TEST DE L'API WEBHOOK MAKE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier que la clé a été modifiée
if ($API_KEY -eq "VOTRE_CLE_API_ICI") {
    Write-Host "❌ ERREUR : Vous n'avez pas remplacé VOTRE_CLE_API_ICI !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instructions :" -ForegroundColor Yellow
    Write-Host "1. Ouvrez ce fichier avec un éditeur de texte" -ForegroundColor Yellow
    Write-Host "2. Remplacez `"VOTRE_CLE_API_ICI`" par votre vraie clé API" -ForegroundColor Yellow
    Write-Host "3. La clé se trouve dans le fichier .env (MAKE_WEBHOOK_API_KEY)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════
# TEST 1 : Vérifier que le webhook fonctionne
# ═══════════════════════════════════════════════════════════════════════

Write-Host "TEST 1 : Vérifier que le webhook fonctionne" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/webhook/test" `
                                 -Method Get `
                                 -Headers @{"X-API-KEY"=$API_KEY}
    
    if ($response.success -eq $true) {
        Write-Host "✅ SUCCÈS : Le webhook fonctionne !" -ForegroundColor Green
        Write-Host "   Message : $($response.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ ÉCHEC : Réponse inattendue" -ForegroundColor Red
        Write-Host $response
    }
} catch {
    Write-Host "❌ ERREUR : $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   Cause : API Key invalide" -ForegroundColor Red
        Write-Host "   Solution : Vérifiez que la clé est correcte" -ForegroundColor Yellow
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 2 : Lister les produits disponibles
# ═══════════════════════════════════════════════════════════════════════

Write-Host "TEST 2 : Lister les produits disponibles" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/webhook/products" `
                                 -Method Get `
                                 -Headers @{"X-API-KEY"=$API_KEY}
    
    if ($response.success -eq $true) {
        Write-Host "✅ SUCCÈS : $($response.count) produit(s) trouvé(s)" -ForegroundColor Green
        Write-Host ""
        foreach ($product in $response.products) {
            Write-Host "  📦 $($product.name)" -ForegroundColor Cyan
            Write-Host "     Code (product_key) : $($product.product_key)" -ForegroundColor Gray
            Write-Host "     Prix : $($product.price) F CFA" -ForegroundColor Gray
            Write-Host "     Stock : $($product.stock)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "❌ ÉCHEC : Réponse inattendue" -ForegroundColor Red
        Write-Host $response
    }
} catch {
    Write-Host "❌ ERREUR : $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 3 : Créer une commande de test
# ═══════════════════════════════════════════════════════════════════════

Write-Host "TEST 3 : Créer une commande de test" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

# Demander le product_key à utiliser
Write-Host "Entrez le product_key à tester (ex: GAINE_TOURMALINE)" -ForegroundColor Cyan
Write-Host "ou appuyez sur Entrée pour utiliser GAINE_TOURMALINE par défaut" -ForegroundColor Gray
$productKey = Read-Host "product_key"
if ([string]::IsNullOrWhiteSpace($productKey)) {
    $productKey = "GAINE_TOURMALINE"
}

$body = @{
    product_key = $productKey
    customer_name = "Test Client"
    customer_phone = "+2250778123456"
    customer_city = "Abidjan"
    quantity = 2
    source = "TEST_MANUEL_POWERSHELL"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/webhook/make" `
                                 -Method Post `
                                 -Headers @{
                                     "Content-Type"="application/json"
                                     "X-API-KEY"=$API_KEY
                                 } `
                                 -Body $body
    
    if ($response.success -eq $true) {
        Write-Host "✅ SUCCÈS : Commande créée !" -ForegroundColor Green
        Write-Host "   ID Commande : $($response.order_id)" -ForegroundColor Gray
        Write-Host "   Référence : $($response.order_reference)" -ForegroundColor Gray
        Write-Host "   Produit : $($response.product.name)" -ForegroundColor Gray
        Write-Host "   Montant : $($response.amount) F CFA" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🎉 Allez vérifier dans l'app web (À appeler) !" -ForegroundColor Green
    } else {
        Write-Host "❌ ÉCHEC : $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERREUR : $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   Cause : Données invalides ou product_key introuvable" -ForegroundColor Red
        Write-Host "   Solution : Vérifiez que le produit existe dans l'app" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TESTS TERMINÉS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaine étape : Configurer Make (voir _ETAPE_4_CONFIGURER_MAKE.txt)" -ForegroundColor Yellow
Write-Host ""

