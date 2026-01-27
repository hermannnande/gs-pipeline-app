-- Ajouter les prix par paliers de quantité
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "prix2Unites" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "prix3Unites" DOUBLE PRECISION;

-- Commentaire
-- prix2Unites: Prix si le client commande 2 unités
-- prix3Unites: Prix si le client commande 3 unités ou plus
-- Si NULL, on utilise prixUnitaire * quantité
