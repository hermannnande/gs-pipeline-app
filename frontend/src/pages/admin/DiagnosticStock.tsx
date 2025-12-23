import React, { useState } from 'react';

interface DiagnosticResult {
  produitsNegatifs: Array<{
    nom: string;
    code: string;
    stockActuel: number;
    stockExpress: number;
    stockLocalReserve: number;
    stockTotal: number;
    commandesLivrees: number;
    avecRemiseConfirmee: number;
    sansRemiseConfirmee: number;
    correctionNecessaire: number;
  }>;
  totalCorrection: number;
}

const DiagnosticStock = () => {
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [correction, setCorrection] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executerDiagnostic = async () => {
    setLoading(true);
    setError(null);
    setDiagnostic(null);
    
    console.log('🔍 Début du diagnostic...');
    alert('Diagnostic en cours...'); // Pour vérifier que le clic fonctionne
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token présent:', !!token);
      
      const response = await fetch('/api/debug/diagnostic-stock-json', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Réponse reçue:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur serveur:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Données reçues:', data);
      setDiagnostic(data);
      alert('Diagnostic terminé !');
    } catch (err: any) {
      console.error('Erreur diagnostic:', err);
      setError(err.message);
      alert('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const executerCorrection = async () => {
    if (!window.confirm('⚠️ ATTENTION : Cette action va modifier le stock de manière permanente. Êtes-vous sûr de vouloir continuer ?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/corriger-stock-negatif', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const html = await response.text();
      setCorrection(html);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur correction:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🔍 Diagnostic Stock Négatif
        </h1>
        <p className="text-gray-600">
          Outil temporaire pour diagnostiquer et corriger les stocks en livraison négatifs
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">❌ Erreur : {error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Étape 1 : Diagnostic</h2>
        <p className="text-gray-600 mb-4">
          Analysez tous les produits avec un stock en livraison négatif.
          Cette opération ne modifie rien, elle affiche seulement les informations.
        </p>
        
        <button
          onClick={executerDiagnostic}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? '⏳ Analyse en cours...' : '🔍 Exécuter le diagnostic'}
        </button>

        {diagnostic && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-green-600">✅ Diagnostic terminé !</h3>
            
            {diagnostic.produitsNegatifs.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ Aucun produit avec stock négatif trouvé !</p>
                <p className="text-green-700 mt-2">Tous les stocks sont cohérents.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    📊 {diagnostic.produitsNegatifs.length} produit(s) avec stock négatif détecté(s)
                  </p>
                  <p className="text-yellow-700 mt-1">
                    Correction totale nécessaire : {diagnostic.totalCorrection} unités
                  </p>
                </div>

                {diagnostic.produitsNegatifs.map((produit, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-bold text-lg mb-2">{produit.nom}</h4>
                    <p className="text-sm text-gray-600 mb-3">Code: {produit.code}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Stock disponible</p>
                        <p className="text-lg font-semibold">{produit.stockActuel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Stock EXPRESS</p>
                        <p className="text-lg font-semibold">{produit.stockExpress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Stock en livraison</p>
                        <p className="text-lg font-semibold text-red-600">{produit.stockLocalReserve} ❌</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Stock total</p>
                        <p className="text-lg font-semibold">{produit.stockTotal}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <p className="text-sm font-medium mb-2">📦 Commandes livrées:</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Total: </span>
                          <span className="font-semibold">{produit.commandesLivrees}</span>
                        </div>
                        <div>
                          <span className="text-green-600">✅ Avec remise: </span>
                          <span className="font-semibold">{produit.avecRemiseConfirmee}</span>
                        </div>
                        <div>
                          <span className="text-red-600">❌ Sans remise: </span>
                          <span className="font-semibold">{produit.sansRemiseConfirmee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                      <p className="text-sm font-medium text-blue-800">
                        💊 Correction nécessaire: +{produit.correctionNecessaire} unités
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticStock;

