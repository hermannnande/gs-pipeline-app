import React, { useState } from 'react';
import { ordersApi } from '../../lib/api';

const DiagnosticStock = () => {
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [correction, setCorrection] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executerDiagnostic = async () => {
    setLoading(true);
    setError(null);
    setDiagnostic(null);
    
    console.log('🔍 Début du diagnostic...');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token présent:', !!token);
      
      const response = await fetch('/api/debug/diagnostic-stock-negatif', {
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
      
      const html = await response.text();
      console.log('HTML reçu, longueur:', html.length);
      setDiagnostic(html);
    } catch (err: any) {
      console.error('Erreur diagnostic:', err);
      setError(err.message);
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
            <h3 className="text-lg font-semibold mb-2 text-green-600">✅ Diagnostic terminé !</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
              <div dangerouslySetInnerHTML={{ __html: diagnostic }} />
            </div>
          </div>
        )}

        {!loading && !diagnostic && !error && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              ℹ️ Cliquez sur "Exécuter le diagnostic" pour analyser tous les produits.
            </p>
          </div>
        )}
      </div>

      {diagnostic && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Étape 2 : Correction</h2>
          <p className="text-gray-600 mb-4">
            ⚠️ <strong>ATTENTION :</strong> Cette opération va modifier le stock de manière permanente.
            Assurez-vous d'avoir lu et compris le diagnostic avant de continuer.
          </p>
          
          <button
            onClick={executerCorrection}
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '⏳ Correction en cours...' : '⚠️ CORRIGER LE STOCK'}
          </button>

          {correction && (
            <div className="mt-6">
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                <div dangerouslySetInnerHTML={{ __html: correction }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticStock;

