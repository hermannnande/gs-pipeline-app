/**
 * Pousse Naturelle — page « merci » (après retour Chariow).
 *
 * Rôle : déclencher l'événement Purchase (Meta Pixel + GA) UNIQUEMENT après que
 * le serveur a confirmé la vente (endpoint /order-status alimenté par le
 * webhook Chariow re-vérifié par API). Le retour navigateur seul ne suffit pas.
 *
 * L'event_id envoyé au pixel est l'identifiant de vente Chariow : il est
 * identique à celui de l'événement serveur (Conversions API), ce qui permet à
 * Meta de DÉDUPLIQUER les deux Purchase.
 *
 * Aucune clé ni secret n'est présent dans ce fichier.
 */
(function () {
	'use strict';

	var CFG = window.PN_MERCI || {};
	var fired = false;

	document.addEventListener('DOMContentLoaded', init);

	function init() {
		var statusEl = document.getElementById('pn-merci-status');
		var saleId = getSaleId();

		if (!saleId || !CFG.statusUrl) {
			// Pas d'identifiant : on rassure sans déclencher de Purchase.
			setStatus(statusEl, 'pending', messagePending());
			return;
		}

		poll(saleId, statusEl, 0);
	}

	/* ------------------------------------------------------------------ */
	/*  Lecture de l'identifiant de vente dans l'URL                       */
	/* ------------------------------------------------------------------ */

	function getSaleId() {
		var params;
		try {
			params = new URLSearchParams(window.location.search);
		} catch (e) {
			return '';
		}
		var keys = CFG.saleParams || ['sale', 'sale_id', 'order', 'id'];
		for (var i = 0; i < keys.length; i++) {
			var v = params.get(keys[i]);
			if (v && /^[A-Za-z0-9_\-]{4,}$/.test(v)) {
				return v;
			}
		}
		return '';
	}

	/* ------------------------------------------------------------------ */
	/*  Sondage du statut serveur                                          */
	/* ------------------------------------------------------------------ */

	function poll(saleId, statusEl, attempt) {
		var MAX = 12;      // ~30 s au total.
		var DELAY = 2500;  // 2,5 s entre chaque essai.

		var url = CFG.statusUrl + (CFG.statusUrl.indexOf('?') === -1 ? '?' : '&') + 'sale_id=' + encodeURIComponent(saleId);

		fetch(url, { credentials: 'omit', headers: { 'Accept': 'application/json' } })
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (data && data.paid) {
					setStatus(statusEl, 'ok', messageConfirmed());
					firePurchase(data);
					return;
				}
				retryOrGiveUp(saleId, statusEl, attempt, MAX, DELAY);
			})
			.catch(function () {
				retryOrGiveUp(saleId, statusEl, attempt, MAX, DELAY);
			});
	}

	function retryOrGiveUp(saleId, statusEl, attempt, MAX, DELAY) {
		if (attempt + 1 >= MAX) {
			// Non confirmé pour l'instant : message rassurant, AUCUN Purchase.
			setStatus(statusEl, 'pending', messagePending());
			return;
		}
		window.setTimeout(function () {
			poll(saleId, statusEl, attempt + 1);
		}, DELAY);
	}

	/* ------------------------------------------------------------------ */
	/*  Déclenchement Purchase (une seule fois)                            */
	/* ------------------------------------------------------------------ */

	function firePurchase(data) {
		if (fired) {
			return;
		}
		fired = true;

		var value = typeof data.value === 'number' ? data.value : parseFloat(data.value || 0) || 0;
		var currency = data.currency || 'XOF';
		var eventId = data.event_id || '';
		var productId = data.product_id || CFG.productId || '';

		try {
			if (typeof window.fbq === 'function') {
				window.fbq('track', 'Purchase', {
					value: value,
					currency: currency,
					content_type: 'product',
					content_ids: productId ? [productId] : [],
					content_name: CFG.contentName || ''
				}, { eventID: eventId });
			}
		} catch (e) {}

		try {
			if (typeof window.gtag === 'function') {
				window.gtag('event', 'purchase', {
					transaction_id: eventId,
					value: value,
					currency: currency
				});
			}
		} catch (e) {}

		try {
			if (Array.isArray(window.dataLayer)) {
				window.dataLayer.push({
					event: 'pn_purchase',
					transaction_id: eventId,
					value: value,
					currency: currency
				});
			}
		} catch (e) {}
	}

	/* ------------------------------------------------------------------ */
	/*  Affichage du statut                                                */
	/* ------------------------------------------------------------------ */

	function setStatus(el, state, text) {
		if (!el) {
			return;
		}
		el.setAttribute('data-state', state);
		var textEl = el.querySelector('.pn-merci__status-text');
		if (textEl) {
			textEl.textContent = text;
		}
		var spin = el.querySelector('.pn-merci__spin');
		if (spin && state !== 'checking') {
			spin.style.display = 'none';
		}
	}

	function messageConfirmed() {
		return 'Paiement confirmé. Votre accès est en route par email' + '.';
	}

	function messagePending() {
		return 'La confirmation peut prendre quelques minutes. Vous recevrez votre accès par email et WhatsApp dès validation.';
	}
})();
