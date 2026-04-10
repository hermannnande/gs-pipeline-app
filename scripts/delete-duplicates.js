// Supprimer les 153 commandes injectées par erreur (IDs 15909 à 16064)

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const API_KEY = '436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf';

async function main() {
  // On va utiliser une requête SQL directe via le webhook
  // Mais on n'a pas d'endpoint SQL direct, donc on va passer par Prisma
  // Utilisons plutôt l'endpoint admin ou un script SQL

  const startId = 15909;
  const endId = 16064;
  const count = endId - startId + 1;

  console.log(`🗑️  Suppression des ${count} commandes dupliquées (IDs ${startId} à ${endId})...`);
  console.log(`\n⚠️  Exécute cette requête SQL dans Supabase :\n`);
  console.log(`DELETE FROM orders WHERE id BETWEEN ${startId} AND ${endId} AND "companyId" = 1;`);
  console.log(`\n-- Vérification après suppression :`);
  console.log(`SELECT COUNT(*) FROM orders WHERE id BETWEEN ${startId} AND ${endId};`);
  console.log(`\n-- Réinitialiser la séquence :`);
  console.log(`SELECT setval(pg_get_serial_sequence('orders', 'id'), (SELECT MAX(id) FROM orders));`);
}

main();
