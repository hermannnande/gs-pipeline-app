/**
 * Page merci — Pochette Sac Homme Premium (slug sac-louis-vuitton).
 * Tunnel PHP autonome (/sac-lv/order.php) : PAS de track-purchase API Obgestion.
 * Pixel Meta : constante vide (le client la fournira) — tracking Purchase conditionné.
 * Récap depuis l'URL : ?ref=<orderId>&qty=<1..3>&color=<marron|noir>
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (event: Purchase conditionné)
const PRODUCT_CODE = 'SAC_LOUIS_VUITTON';
const UNIT_PRICE = 9900;

const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/ |,/g, ' ');

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

export default function SacLouisVuittonThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const qty = [1, 2, 3].includes(parseInt(q.get('qty') || '1', 10)) ? parseInt(q.get('qty') || '1', 10) : 1;
  const colorRaw = (q.get('color') || '').toLowerCase();
  const color = colorRaw === 'noir' ? 'Noir' : colorRaw === 'marron' ? 'Marron' : '';
  const colorEmoji = colorRaw === 'noir' ? '🖤' : colorRaw === 'marron' ? '🤎' : '👝';
  const total = UNIT_PRICE * qty;
  const fired = useRef(false);

  useEffect(() => { document.title = 'Merci — Pochette Sac Homme Premium'; }, []);

  useEffect(() => {
    if (fired.current) return; fired.current = true;
    const sk = ref ? `slv_purchase_${ref}` : '';
    if (sk && sessionStorage.getItem(sk)) return;
    if (META_PIXEL_ID) {
      const init = () => {
        if (!window.fbq) {
          const f: any = window.fbq = function (...a: any[]) { f.callMethod ? f.callMethod(...a) : f.queue.push(a); };
          f.queue = []; f.loaded = true; f.version = '2.0';
          const s = document.createElement('script'); s.src = 'https://connect.facebook.net/en_US/fbevents.js'; s.async = true; document.head.appendChild(s);
        }
        window.fbq('init', META_PIXEL_ID);
        window.fbq('track', 'Purchase', { content_name: 'Pochette Sac Homme Premium', content_ids: [PRODUCT_CODE], value: total, currency: 'XOF', num_items: qty });
        if (sk) sessionStorage.setItem(sk, '1');
      };
      setTimeout(init, 500);
    }
  }, [ref, qty, total]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F5EFE6] via-[#FAF6EF] to-[#F0E6D6] px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#D4AF37]/40 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-[#1A1A1A] via-[#3E2415] to-[#7B4B2A] px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/25 text-2xl ring-2 ring-[#D4AF37]/50">✓</div>
          <h1 className="text-xl font-extrabold">Commande envoyée 🎉</h1>
          <p className="mt-1.5 text-[13px] text-[#F0D98C]">Votre Pochette Sac Homme Premium est bien enregistrée.</p>
        </div>
        <div className="space-y-4 p-5">
          {ref && (
            <div className="rounded-xl bg-[#F5EFE6] p-3 text-center ring-1 ring-[#D4AF37]/40">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A0683C]">Référence de votre commande</p>
              <p className="font-mono text-sm font-bold text-[#2C1A10]">{ref.slice(0, 12).toUpperCase()}</p>
            </div>
          )}
          <div className="rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 to-[#7B4B2A]/10 p-4 ring-1 ring-[#D4AF37]/30">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A0683C]">Votre commande</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[14px] font-black text-[#2C1A10]">
                {colorEmoji} {qty} pochette{qty > 1 ? 's' : ''}{color ? ` · ${color}` : ''}
              </p>
              <p className="text-[20px] font-black text-[#8B6914]">{fmt(total)} F</p>
            </div>
            <p className="mt-1 text-[11px] text-[#7B4B2A]/70">À payer en espèces à la réception.</p>
          </div>
          <div className="space-y-2.5 rounded-2xl bg-[#FAF6EF] p-4 text-[12.5px] text-[#5b3a22]">
            <div className="flex items-center gap-3"><span className="text-xl">📞</span><span>Un conseiller vous appelle <strong>sous 30 min</strong> pour confirmer votre commande et votre adresse.</span></div>
            <div className="flex items-center gap-3"><span className="text-xl">🚚</span><span>Livraison rapide à Abidjan et dans les principales villes.</span></div>
            <div className="flex items-center gap-3"><span className="text-xl">💵</span><span><strong>Paiement uniquement à la livraison</strong> — rien à payer en ligne.</span></div>
          </div>
          <p className="text-center text-[12px] text-neutral-500">
            Gardez votre téléphone à portée de main : sans confirmation, la pochette ne peut pas être expédiée.
          </p>
          <Link to="/sac-louis-vuitton" className="block rounded-full bg-gradient-to-r from-[#F0D98C] via-[#D4AF37] to-[#8B6914] py-3.5 text-center text-[12px] font-black uppercase tracking-[0.12em] text-[#1A1A1A] shadow-lg transition hover:brightness-105">
            Retour au produit
          </Link>
        </div>
      </div>
    </div>
  );
}
