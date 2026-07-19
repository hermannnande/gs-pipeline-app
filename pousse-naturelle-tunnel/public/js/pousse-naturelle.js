/**
 * Pousse Naturelle Tunnel — JavaScript public (vanilla, sans dépendance).
 *
 * Responsabilités :
 *  - animations discrètes au scroll (IntersectionObserver, respecte
 *    prefers-reduced-motion) ;
 *  - tous les CTA mènent au même checkout Chariow (#pn-checkout) ;
 *  - événements analytiques : view_content, click_cta, initiate_checkout ;
 *    (« purchase » N'EST JAMAIS déclenché ici : seul le webhook serveur fait foi) ;
 *  - bouton d'achat flottant sur mobile ;
 *  - compte à rebours (uniquement si une vraie date est fournie) ;
 *  - petit message « Paiement disponible dans votre pays ».
 *
 * Aucune clé ni secret ne transite par ce fichier.
 */
(function () {
	'use strict';

	var CFG = window.PN_TUNNEL || {};
	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	document.addEventListener('DOMContentLoaded', init);

	function init() {
		var root = document.querySelector('.pn-tunnel');
		if (!root) {
			return;
		}

		track('view_content', { content_name: 'Faire pousser vos cheveux naturellement' });

		setupReveal(root);
		setupCTAs(root);
		setupStickyCTA();
		setupCountdown();
		setupCounter(root);
		setupGeoMessage();
	}

	/* ------------------------------------------------------------------ */
	/*  Compteur animé (nombre réel : ventes + socle honnête)              */
	/* ------------------------------------------------------------------ */

	function setupCounter(root) {
		var els = root.querySelectorAll('.pn-counter');
		if (!els.length) {
			return;
		}
		els.forEach(function (el) {
			var target = parseInt(el.getAttribute('data-count'), 10) || 0;
			if (reduceMotion || target <= 0) {
				el.textContent = format(target);
				return;
			}
			animateCount(el, target);
		});
	}

	function animateCount(el, target) {
		var run = function () {
			var duration = 1400;
			var start = null;
			function step(ts) {
				if (start === null) { start = ts; }
				var progress = Math.min(1, (ts - start) / duration);
				// easeOutCubic
				var eased = 1 - Math.pow(1 - progress, 3);
				el.textContent = format(Math.floor(eased * target));
				if (progress < 1) {
					window.requestAnimationFrame(step);
				} else {
					el.textContent = format(target);
				}
			}
			window.requestAnimationFrame(step);
		};

		if ('IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						run();
						io.disconnect();
					}
				});
			}, { threshold: 0.4 });
			io.observe(el);
		} else {
			run();
		}
	}

	function format(n) {
		// Séparateur de milliers léger (espace insécable fin).
		return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	}

	/* ------------------------------------------------------------------ */
	/*  Analytique (pont vers gtag / fbq / dataLayer si présents)          */
	/* ------------------------------------------------------------------ */

	function track(event, params) {
		params = params || {};
		try {
			// Google Analytics (gtag).
			if (typeof window.gtag === 'function') {
				window.gtag('event', event, params);
			}
			// dataLayer (GTM).
			if (Array.isArray(window.dataLayer)) {
				window.dataLayer.push(Object.assign({ event: 'pn_' + event }, params));
			}
			// Meta Pixel (fbq) : correspondances standard.
			if (typeof window.fbq === 'function') {
				if (event === 'view_content') {
					window.fbq('track', 'ViewContent', params);
				} else if (event === 'initiate_checkout') {
					window.fbq('track', 'InitiateCheckout', params);
				} else {
					window.fbq('trackCustom', 'pn_' + event, params);
				}
			}
		} catch (e) {
			/* silencieux : l'analytique ne doit jamais casser la page */
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Révélation au scroll                                               */
	/* ------------------------------------------------------------------ */

	function setupReveal(root) {
		var items = root.querySelectorAll('.pn-reveal');
		if (!items.length) {
			return;
		}
		if (reduceMotion || !('IntersectionObserver' in window)) {
			items.forEach(function (el) { el.classList.add('is-in'); });
			return;
		}
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-in');
					io.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

		items.forEach(function (el) { io.observe(el); });
	}

	/* ------------------------------------------------------------------ */
	/*  CTA -> checkout                                                    */
	/* ------------------------------------------------------------------ */

	function setupCTAs(root) {
		var anchor = CFG.checkoutAnchor || '#pn-checkout';
		var ctas = root.querySelectorAll('.pn-cta, .pn-sticky-cta');
		var initiated = false;

		ctas.forEach(function (btn) {
			btn.addEventListener('click', function (e) {
				var label = btn.getAttribute('data-cta') || '';

				// Lien de repli externe (checkout Chariow direct) : on laisse suivre.
				var href = btn.getAttribute('href') || '';
				var isExternal = /^https?:/i.test(href);

				track('click_cta', { cta: label });

				if (isExternal) {
					// Lien externe : on marque l'intention puis on laisse le navigateur ouvrir.
					if (!initiated) { initiated = true; track('initiate_checkout', { cta: label }); }
					return;
				}

				// Lien interne vers le checkout : scroll doux + focus + spinner bref.
				e.preventDefault();
				loading(btn, true);
				if (!initiated) { initiated = true; track('initiate_checkout', { cta: label }); }
				scrollToCheckout(anchor, function () { loading(btn, false); });
			});
		});
	}

	function loading(btn, on) {
		if (!btn.classList.contains('pn-cta')) {
			return;
		}
		if (on) {
			btn.classList.add('is-loading');
			btn.setAttribute('aria-busy', 'true');
		} else {
			btn.classList.remove('is-loading');
			btn.removeAttribute('aria-busy');
		}
	}

	function scrollToCheckout(anchor, done) {
		var target = document.querySelector(anchor);
		if (!target) {
			done && done();
			return;
		}
		target.scrollIntoView({
			behavior: reduceMotion ? 'auto' : 'smooth',
			block: 'start'
		});
		// Focus le premier élément interactif du Snap pour l'accessibilité.
		window.setTimeout(function () {
			var focusable = target.querySelector('a, button, input, [tabindex]');
			if (focusable && typeof focusable.focus === 'function') {
				focusable.focus({ preventScroll: true });
			}
			done && done();
		}, reduceMotion ? 0 : 650);
	}

	/* ------------------------------------------------------------------ */
	/*  Bouton flottant mobile                                             */
	/* ------------------------------------------------------------------ */

	function setupStickyCTA() {
		var sticky = document.getElementById('pn-sticky-cta');
		var checkout = document.getElementById('pn-checkout');
		if (!sticky) {
			return;
		}

		function onScroll() {
			var y = window.pageYOffset || document.documentElement.scrollTop;
			var showAfter = 600;

			// On masque le bouton flottant quand le checkout est visible.
			var overCheckout = false;
			if (checkout) {
				var rect = checkout.getBoundingClientRect();
				overCheckout = rect.top < window.innerHeight && rect.bottom > 0;
			}

			if (y > showAfter && !overCheckout) {
				sticky.classList.add('is-visible');
			} else {
				sticky.classList.remove('is-visible');
			}
		}

		window.addEventListener('scroll', throttle(onScroll, 150), { passive: true });
		onScroll();
	}

	/* ------------------------------------------------------------------ */
	/*  Compte à rebours (uniquement si date réelle)                       */
	/* ------------------------------------------------------------------ */

	function setupCountdown() {
		var box = document.getElementById('pn-countdown');
		var out = document.getElementById('pn-countdown-timer');
		var end = CFG.promoEnd ? parseInt(CFG.promoEnd, 10) : 0;
		if (!box || !out || !end) {
			return;
		}
		var i18n = CFG.i18n || {};

		function tick() {
			var diff = end - Date.now();
			if (diff <= 0) {
				out.textContent = i18n.countdownEnd || 'Terminé';
				return;
			}
			var s = Math.floor(diff / 1000);
			var d = Math.floor(s / 86400); s -= d * 86400;
			var h = Math.floor(s / 3600); s -= h * 3600;
			var m = Math.floor(s / 60); s -= m * 60;
			var parts = [];
			if (d > 0) { parts.push(d + (i18n.days || 'j')); }
			parts.push(pad(h) + (i18n.hours || 'h'));
			parts.push(pad(m) + (i18n.mins || 'min'));
			parts.push(pad(s) + (i18n.secs || 's'));
			out.textContent = parts.join(' ');
			window.setTimeout(tick, 1000);
		}
		tick();
	}

	function pad(n) { return (n < 10 ? '0' : '') + n; }

	/* ------------------------------------------------------------------ */
	/*  Message géographique léger                                         */
	/* ------------------------------------------------------------------ */

	function setupGeoMessage() {
		// Personnalisation cosmétique uniquement : la devise, le montant et les
		// moyens de paiement restent déterminés par Chariow.
		var el = document.getElementById('pn-geo-msg');
		if (!el) {
			return;
		}
		var lang = (navigator.language || '').toLowerCase();
		if (lang.indexOf('fr') === 0 || lang.indexOf('en') === 0) {
			el.hidden = false;
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Utilitaires                                                        */
	/* ------------------------------------------------------------------ */

	function throttle(fn, wait) {
		var last = 0, timer = null;
		return function () {
			var now = Date.now();
			var remaining = wait - (now - last);
			var args = arguments, ctx = this;
			if (remaining <= 0) {
				if (timer) { clearTimeout(timer); timer = null; }
				last = now;
				fn.apply(ctx, args);
			} else if (!timer) {
				timer = setTimeout(function () {
					last = Date.now();
					timer = null;
					fn.apply(ctx, args);
				}, remaining);
			}
		};
	}
})();
