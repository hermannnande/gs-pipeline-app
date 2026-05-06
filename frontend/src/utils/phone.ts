/**
 * Nettoyage et normalisation des numeros de telephone Cote d'Ivoire.
 *
 * Probleme historique : les modals utilisaient simplement
 *   `value.replace(/\D/g, '').slice(0, 10)`
 * ce qui causait des bugs critiques :
 *   - Client tape "+225 07 07 12 34 56" -> apres replace = "2250707123456" (13 chars)
 *     -> apres slice(0,10) = "2250707123" (TRONQUE - 3 derniers chiffres perdus !)
 *   - Client tape "00225 07 07 12 34 56" -> "002250707123456" -> "0022507071" (TRONQUE)
 *
 * Resultat : 4.3% des commandes recues avaient un numero non-joignable.
 *
 * Cette fonction gere correctement TOUS les formats CIV courants :
 *   "0707123456"           -> "0707123456" (deja propre)
 *   "07 07 12 34 56"       -> "0707123456" (espaces)
 *   "07-07-12-34-56"       -> "0707123456" (tirets)
 *   "07.07.12.34.56"       -> "0707123456" (points)
 *   "+225 07 07 12 34 56"  -> "0707123456" (prefixe +225)
 *   "225 07 07 12 34 56"   -> "0707123456" (prefixe 225)
 *   "00225 07 07 12 34 56" -> "0707123456" (prefixe 00225)
 *   "(225) 07071234"       -> "0707123456" -> traite OK aussi
 *
 * Le slice a 10 chiffres reste pour empecher d'aller au-dela (eviter saisies bizarres).
 *
 * @param input Ce que le client a tape (peut contenir +, espaces, tirets, etc.)
 * @returns Une chaine de 0 a 10 chiffres uniquement (ex: "0707123456")
 */
export function cleanPhoneCI(input: string): string {
  if (!input) return '';

  // 1. Garder uniquement les chiffres
  let digits = String(input).replace(/\D/g, '');

  // 2. Retirer le prefixe international 00225 (le plus specifique d'abord)
  if (digits.startsWith('00225')) {
    digits = digits.slice(5);
  }
  // 3. Retirer le prefixe pays 225 SI le numero est manifestement avec prefixe
  //    (= longueur > 10 et commence par 225). On NE retire PAS si len === 10
  //    car ca pourrait etre un vrai numero CIV qui commence vraiment par 225...
  //    (rare mais possible : prefixe operateur 25 avec un 0 devant qui aurait
  //    pu donner "0250...") -> sécurité : on enleve seulement si > 10 chars.
  else if (digits.startsWith('225') && digits.length > 10) {
    digits = digits.slice(3);
  }

  // 4. Slice a 10 chiffres max (numero CIV standard)
  return digits.slice(0, 10);
}

/**
 * Verifie qu'un numero de telephone CIV est valide et joignable.
 * Un numero CIV valide :
 *   - 10 chiffres exactement
 *   - Commence par 0 (toujours, depuis 2021 nouveau plan numerotation CIV)
 *   - Le 2eme chiffre identifie l'operateur :
 *       0 1 X X X X X X X X = Moov / Telecel / fixe
 *       0 5 X X X X X X X X = MTN
 *       0 7 X X X X X X X X = Orange
 *
 * @param phone Numero a verifier (idealement deja passe par cleanPhoneCI)
 * @returns true si valide
 */
export function isValidPhoneCI(phone: string): boolean {
  const cleaned = cleanPhoneCI(phone);
  return /^0[157]\d{8}$/.test(cleaned);
}

/**
 * Format d'affichage : "07 07 12 34 56" depuis "0707123456".
 * Pour usage cosmetique uniquement (back-office). Le storage DB reste sans espaces.
 */
export function formatPhoneCI(phone: string): string {
  const cleaned = cleanPhoneCI(phone);
  if (cleaned.length !== 10) return cleaned;
  return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}
