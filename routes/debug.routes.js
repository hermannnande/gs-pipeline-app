import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Route temporaire pour diagnostiquer le stock négatif (JSON)
// À SUPPRIMER après utilisation
// Accessible uniquement aux ADMIN
router.get('/diagnostic-stock-json', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    // Trouver tous les produits avec stock en livraison négatif
    const produitsNegatifs = await prisma.product.findMany({
      where: {
        stockLocalReserve: { lt: 0 }
      },
      orderBy: {
        stockLocalReserve: 'asc'
      }
    });

    const resultat = {
      produitsNegatifs: [],
      totalCorrection: 0
    };

    for (const produit of produitsNegatifs) {
      // Analyser les commandes LIVREE pour ce produit
      const commandesLivrees = await prisma.order.findMany({
        where: {
          productId: produit.id,
          status: 'LIVREE',
          deliveryType: 'LOCAL'
        },
        include: {
          deliveryList: {
            include: {
              tourneeStock: true
            }
          }
        }
      });

      let avecRemiseConfirmee = 0;
      let sansRemiseConfirmee = 0;

      commandesLivrees.forEach((cmd) => {
        if (cmd.deliveryList) {
          if (cmd.deliveryList.tourneeStock && cmd.deliveryList.tourneeStock.colisRemisConfirme) {
            avecRemiseConfirmee++;
          } else {
            sansRemiseConfirmee++;
          }
        } else {
          sansRemiseConfirmee++;
        }
      });

      const correctionNecessaire = Math.abs(produit.stockLocalReserve);
      resultat.totalCorrection += correctionNecessaire;

      resultat.produitsNegatifs.push({
        nom: produit.nom,
        code: produit.code,
        stockActuel: produit.stockActuel,
        stockExpress: produit.stockExpress,
        stockLocalReserve: produit.stockLocalReserve,
        stockTotal: produit.stockActuel + produit.stockExpress + produit.stockLocalReserve,
        commandesLivrees: commandesLivrees.length,
        avecRemiseConfirmee,
        sansRemiseConfirmee,
        correctionNecessaire
      });
    }

    res.json(resultat);

  } catch (error) {
    console.error('❌ ERREUR lors du diagnostic :', error);
    res.status(500).json({ error: error.message });
  }
});

// Route temporaire pour diagnostiquer le stock négatif
// À SUPPRIMER après utilisation
// Accessible uniquement aux ADMIN
router.get('/diagnostic-stock-negatif', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    let output = '';
    const log = (msg) => { output += msg + '\n'; };

    log('🔍 DIAGNOSTIC APPROFONDI DU STOCK NÉGATIF\n');
    log('═══════════════════════════════════════════════════════════════\n');

    // 1. Trouver tous les produits avec stock en livraison négatif
    const produitsNegatifs = await prisma.product.findMany({
      where: {
        stockLocalReserve: { lt: 0 }
      },
      orderBy: {
        stockLocalReserve: 'asc'
      }
    });

    if (produitsNegatifs.length === 0) {
      log('✅ Aucun produit avec stock en livraison négatif !\n');
      return res.send(`<pre>${output}</pre>`);
    }

    log(`📊 Produits avec stock négatif : ${produitsNegatifs.length}\n`);

    for (const produit of produitsNegatifs) {
      log('\n┌─────────────────────────────────────────────────────────────┐');
      log(`│ 📦 ${produit.nom.padEnd(57)} │`);
      log(`│ Code: ${produit.code.padEnd(53)} │`);
      log('├─────────────────────────────────────────────────────────────┤');
      log(`│ Stock disponible         : ${String(produit.stockActuel).padStart(6)} unités        │`);
      log(`│ Stock EXPRESS (réservé)  : ${String(produit.stockExpress).padStart(6)} unités        │`);
      log(`│ Stock en livraison       : ${String(produit.stockLocalReserve).padStart(6)} unités ❌     │`);
      log(`│ ────────────────────────────────────────────────────────── │`);
      log(`│ Stock total (calculé)    : ${String(produit.stockActuel + produit.stockExpress + produit.stockLocalReserve).padStart(6)} unités        │`);
      log('└─────────────────────────────────────────────────────────────┘\n');

      // 2. Analyser les commandes LIVREE pour ce produit
      log('\n📦 COMMANDES LIVRÉES POUR CE PRODUIT :\n');

      const commandesLivrees = await prisma.order.findMany({
        where: {
          productId: produit.id,
          status: 'LIVREE',
          deliveryType: 'LOCAL'
        },
        orderBy: { deliveredAt: 'asc' },
        include: {
          deliverer: {
            select: { nom: true, prenom: true }
          },
          deliveryList: {
            include: {
              tourneeStock: true
            }
          }
        }
      });

      if (commandesLivrees.length === 0) {
        log('   ℹ️  Aucune commande livrée\n');
      } else {
        log(`   Total : ${commandesLivrees.length} commande(s)\n\n`);

        let avecRemiseConfirmee = 0;
        let sansRemiseConfirmee = 0;
        let sansTournee = 0;

        commandesLivrees.forEach((cmd, idx) => {
          const livreur = cmd.deliverer ? `${cmd.deliverer.prenom} ${cmd.deliverer.nom}` : 'N/A';
          const dateLivraison = cmd.deliveredAt ? cmd.deliveredAt.toLocaleDateString('fr-FR') : 'N/A';
          
          let statutRemise = '❓ Pas de tournée';
          if (cmd.deliveryList) {
            if (cmd.deliveryList.tourneeStock && cmd.deliveryList.tourneeStock.colisRemisConfirme) {
              statutRemise = '✅ Remise confirmée';
              avecRemiseConfirmee++;
            } else if (cmd.deliveryList.tourneeStock) {
              statutRemise = '❌ Remise NON confirmée';
              sansRemiseConfirmee++;
            } else {
              statutRemise = '⚠️ Pas de TourneeStock';
              sansRemiseConfirmee++;
            }
          } else {
            sansTournee++;
          }

          if (idx < 5 || idx >= commandesLivrees.length - 3) {
            log(`   ${idx + 1}. ${cmd.orderReference}`);
            log(`      Client      : ${cmd.clientNom}`);
            log(`      Quantité    : ${cmd.quantite}`);
            log(`      Livreur     : ${livreur}`);
            log(`      Livré le    : ${dateLivraison}`);
            log(`      Statut      : ${statutRemise}\n`);
          } else if (idx === 5) {
            log(`   ... (${commandesLivrees.length - 8} autres commandes) ...\n`);
          }
        });

        log('   ═══════════════════════════════════════════════════════');
        log(`   ✅ Avec remise confirmée    : ${avecRemiseConfirmee}`);
        log(`   ❌ Sans remise confirmée    : ${sansRemiseConfirmee}`);
        log(`   ❓ Sans tournée             : ${sansTournee}`);
        log(`   ────────────────────────────────────────────────────`);
        log(`   📊 TOTAL                    : ${commandesLivrees.length}\n`);
      }

      // 3. Calculer le stock théorique
      log('\n🧮 CALCUL DU STOCK THÉORIQUE :\n');

      const commandesAssignees = await prisma.order.findMany({
        where: {
          productId: produit.id,
          status: { in: ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'] },
          deliveryType: 'LOCAL',
          deliveryList: {
            tourneeStock: {
              colisRemisConfirme: true,
              colisRetourConfirme: false
            }
          }
        }
      });

      const quantiteTheorique = commandesAssignees.reduce((sum, cmd) => sum + cmd.quantite, 0);

      log(`   Commandes confirmées REMISES mais pas encore livrées : ${commandesAssignees.length}`);
      log(`   Quantité théorique en livraison                      : ${quantiteTheorique}`);
      log(`   Quantité réelle en livraison (DB)                    : ${produit.stockLocalReserve}`);
      log(`   ────────────────────────────────────────────────────`);
      log(`   ÉCART                                                 : ${produit.stockLocalReserve - quantiteTheorique}\n`);

      if (produit.stockLocalReserve !== quantiteTheorique) {
        log(`\n   ⚠️  INCOHÉRENCE DÉTECTÉE !`);
        log(`   Le stock en livraison (${produit.stockLocalReserve}) ne correspond pas`);
        log(`   au nombre de commandes réellement en livraison (${quantiteTheorique})`);
        log(`\n   💡 Cela confirme qu'il y a eu des livraisons SANS confirmation de remise.\n`);
      }

      // 4. Recommandation de correction
      log('\n💊 RECOMMANDATION DE CORRECTION :\n');

      const correctionNecessaire = Math.abs(produit.stockLocalReserve - quantiteTheorique);
      
      if (produit.stockLocalReserve < 0) {
        log(`   Pour ramener le stock en livraison à ${quantiteTheorique},`);
        log(`   il faut AJOUTER ${correctionNecessaire} unités.\n`);
        log(`   Cela annulera l'effet des ${commandesLivrees.length} livraisons qui ont`);
        log(`   décrémenté le stock alors qu'il n'avait jamais été incrémenté.\n`);
      }

      log('\n═══════════════════════════════════════════════════════════════\n');
    }

    // Résumé global
    log('\n📊 RÉSUMÉ GLOBAL :\n');
    log(`Nombre de produits avec stock négatif : ${produitsNegatifs.length}\n`);
    
    const totalCorrection = produitsNegatifs.reduce((sum, p) => sum + Math.abs(p.stockLocalReserve), 0);
    log(`Correction totale nécessaire : ${totalCorrection} unités\n`);

    log('💡 PROCHAINE ÉTAPE :');
    log('   Pour corriger automatiquement, visitez :');
    log('   GET /api/debug/corriger-stock-negatif\n');

    // Retourner en HTML avec du style
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Diagnostic Stock Négatif</title>
        <style>
          body { 
            background: #1a1a1a; 
            color: #00ff00; 
            font-family: 'Courier New', monospace; 
            padding: 20px;
            line-height: 1.6;
          }
          pre { 
            white-space: pre-wrap; 
            word-wrap: break-word;
            font-size: 14px;
          }
          h1 {
            color: #00ff00;
            border-bottom: 2px solid #00ff00;
            padding-bottom: 10px;
          }
          .btn {
            display: inline-block;
            margin: 20px 10px;
            padding: 15px 30px;
            background: #00ff00;
            color: #1a1a1a;
            text-decoration: none;
            font-weight: bold;
            border-radius: 5px;
            transition: all 0.3s;
          }
          .btn:hover {
            background: #00cc00;
            transform: scale(1.05);
          }
          .btn-danger {
            background: #ff3333;
            color: white;
          }
          .btn-danger:hover {
            background: #cc0000;
          }
        </style>
      </head>
      <body>
        <h1>🔍 Diagnostic Stock Négatif</h1>
        <pre>${output}</pre>
        <div style="margin-top: 30px; padding: 20px; background: #2a2a2a; border-radius: 10px;">
          <h2>🔧 Actions disponibles :</h2>
          <a href="/api/debug/corriger-stock-negatif" class="btn btn-danger">⚠️ CORRIGER LE STOCK (Attention: Action irréversible)</a>
          <a href="/api/debug/diagnostic-stock-negatif" class="btn">🔄 Rafraîchir le diagnostic</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ ERREUR lors du diagnostic :', error);
    res.status(500).send(`<pre>❌ Erreur: ${error.message}\n\n${error.stack}</pre>`);
  }
});

// Route temporaire pour corriger le stock négatif
// À SUPPRIMER après utilisation
// Accessible uniquement aux ADMIN
router.get('/corriger-stock-negatif', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    let output = '';
    const log = (msg) => { output += msg + '\n'; };

    log('🔧 CORRECTION AUTOMATIQUE DU STOCK NÉGATIF\n');
    log('═══════════════════════════════════════════════════════════════\n');

    // Trouver les commandes problématiques
    const commandesProblematiques = await prisma.order.findMany({
      where: {
        status: 'LIVREE',
        deliveryType: 'LOCAL',
        productId: { not: null },
        OR: [
          { deliveryListId: null },
          {
            deliveryList: {
              tourneeStock: {
                colisRemisConfirme: false
              }
            }
          },
          {
            deliveryList: {
              tourneeStock: null
            }
          }
        ]
      },
      include: {
        product: true
      }
    });

    log(`📊 Commandes trouvées : ${commandesProblematiques.length}\n`);

    if (commandesProblematiques.length === 0) {
      log('✅ Aucune correction nécessaire !\n');
      return res.send(`<pre>${output}</pre>`);
    }

    // Grouper par produit
    const produitsImpactes = {};
    commandesProblematiques.forEach(cmd => {
      if (!produitsImpactes[cmd.productId]) {
        produitsImpactes[cmd.productId] = {
          nom: cmd.product.nom,
          code: cmd.product.code,
          quantite: 0,
          commandes: []
        };
      }
      produitsImpactes[cmd.productId].quantite += cmd.quantite;
      produitsImpactes[cmd.productId].commandes.push(cmd.orderReference);
    });

    log('📦 PRODUITS À CORRIGER :\n');
    for (const [productId, data] of Object.entries(produitsImpactes)) {
      log(`   ${data.nom} (${data.code}): +${data.quantite} unités`);
    }
    log('');

    // Appliquer les corrections
    const corrections = await prisma.$transaction(async (tx) => {
      const mouvements = [];

      for (const [productId, data] of Object.entries(produitsImpactes)) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(productId) }
        });

        const stockLocalReserveAvant = product.stockLocalReserve;
        const stockLocalReserveApres = stockLocalReserveAvant + data.quantite;

        await tx.product.update({
          where: { id: parseInt(productId) },
          data: {
            stockLocalReserve: stockLocalReserveApres
          }
        });

        await tx.stockMovement.create({
          data: {
            productId: parseInt(productId),
            type: 'CORRECTION',
            quantite: data.quantite,
            stockAvant: stockLocalReserveAvant,
            stockApres: stockLocalReserveApres,
            effectuePar: 1,
            motif: `CORRECTION AUTOMATIQUE - ${data.commandes.length} anciennes livraisons effectuées avant l'implémentation de la confirmation de remise. Stock en livraison rétabli de ${stockLocalReserveAvant} à ${stockLocalReserveApres}.`
          }
        });

        mouvements.push({
          produit: data.nom,
          quantite: data.quantite,
          stockAvant: stockLocalReserveAvant,
          stockApres: stockLocalReserveApres
        });

        log(`✅ ${data.nom} : ${stockLocalReserveAvant} → ${stockLocalReserveApres}`);
      }

      return mouvements;
    });

    log('\n✅ CORRECTION TERMINÉE AVEC SUCCÈS !\n');
    log('═══════════════════════════════════════════════════════════════\n');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Correction Terminée</title>
        <style>
          body { 
            background: #1a1a1a; 
            color: #00ff00; 
            font-family: 'Courier New', monospace; 
            padding: 20px;
          }
          pre { white-space: pre-wrap; }
          .success {
            background: #00ff00;
            color: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            font-weight: bold;
          }
          .btn {
            display: inline-block;
            margin: 20px 10px;
            padding: 15px 30px;
            background: #00ff00;
            color: #1a1a1a;
            text-decoration: none;
            font-weight: bold;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="success">
          ✅ CORRECTION APPLIQUÉE AVEC SUCCÈS !
        </div>
        <pre>${output}</pre>
        <a href="/api/debug/diagnostic-stock-negatif" class="btn">🔍 Vérifier le résultat</a>
        <a href="/admin/products" class="btn">📦 Voir les produits</a>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ ERREUR lors de la correction :', error);
    res.status(500).send(`<pre>❌ Erreur: ${error.message}\n\n${error.stack}</pre>`);
  }
});

export default router;

