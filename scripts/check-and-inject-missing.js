// Vérifier quelles commandes du sheet du 31/03 n'existent pas dans le système et les injecter

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api/webhook/make';
const API_KEY = '436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf';

function fixPhone(raw) {
  let p = String(raw).replace(/\s+/g, '').trim();
  if (p.startsWith('+225')) return p;
  if (p.startsWith('+226')) return p;
  if (p.startsWith('+22') && !p.startsWith('+225') && !p.startsWith('+226')) return p;
  if (p.startsWith('2250') && p.length >= 13) return '+' + p;
  if (p.startsWith('225') && p.length >= 12) return '+' + p;
  if (p.startsWith('2260') && p.length >= 12) return '+' + p;
  if (p.startsWith('226') && p.length >= 11) return '+' + p;
  p = p.replace(/^\+/, '');
  if (/^\d{9}$/.test(p)) p = '0' + p;
  return p;
}

const PRODUCT_MAPPING = {
  'chaussette de compression': 'CHAUSSETTE_DE_COMPRESSION',
  'patch minceur glp': 'PATCH_MINCEUR_GLP',
  'creme minceur': 'CREME_MINCEUR',
  'patch anti douleur': 'PATCH_ANTI_DOULEUR',
  'creme anti cerne': 'CREME_ANTI_CERNE',
  'Crème Anti-Verrues': 'CREME_ANTI_VERRUES',
  'Creme anti lipome': 'CREME_ANTI_LIPOME',
  'gaine tourmaline chauffante': 'GAINE_MINCEUR_TOURMALINE_CHAUFFANTE',
  'POUDRE_CHEVEUX': 'POUDRE_CHEVEUX',
  'pourdre pousse cheveux': 'POUDRE_CHEVEUX',
  'SERUM_ONGLE': 'SERUM_ONGLE',
  'spray anti douleur': 'SPRAY_DOULEUR',
  'creme anti tache2': 'CREME_TACHE2',
  'creme probleme de peau': 'CREME_PROBLEME_DE_PEAU',
  'CREME_VITILIGO': 'CREME_VITILIGO',
  'creme anti tache': 'CREME_TACHE',
  'patch minceur': 'PATCH_MINCEUR',
};

// Toutes les commandes du sheet du 31/03/2026
const SHEET_ORDERS = [
  { produit: 'creme anti cerne', ville: 'Soubré', tel: '758653402', nom: 'Kouassi Kognon Celestin', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Yopougon rond point de gesco', tel: '709534383', nom: 'Bienvenue', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Deux plateaux', tel: '709110833', nom: 'Sabine Natacha Bahouan', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'San pedro', tel: '+2250171162399', nom: 'Gbato Onene Marie Pierre', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan-Cocody-Angré', tel: '707990091', nom: 'Mobio Kacou Hermann Stéphane', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'ISSIA', tel: '709001399', nom: 'OUREGA CHRIST MAHEVA-MARCELLE ÉPOUSE ZEBIYOU', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Yamoussoukro (Ebenezer)', tel: '707010319', nom: 'Bohoussou', qte: 1, prix: 9900 },
  { produit: 'POUDRE_CHEVEUX', ville: 'abobo mosquée petro ivoire', tel: '+2250546003918', nom: 'sidibe Fanta madi', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Bouaké', tel: '707218275', nom: 'Soro Lydie', qte: 1, prix: 9900 },
  { produit: 'POUDRE_CHEVEUX', ville: 'Abidjan -port-bouet', tel: '101885909', nom: 'Abou Ouattara Kouma', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Bayota', tel: '788957030', nom: 'DOUYERE TRAZIE', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan/ Yopougon, feux tricolores Sapeurs pompiers', tel: '707207216', nom: 'Edouard LEVRY', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Duekoue', tel: '565123800', nom: 'Yaya Traore', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Guiglo', tel: '749235096', nom: 'Valentin Compaoré', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Abidjan -Macory', tel: '788163111', nom: 'BODJÉ Marie -Estelle', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Anani ancienne route de Bassam face phcie Léana', tel: '707508975', nom: 'Ogoubiyi Ganiyou', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Abidjan Yopougon niangon nord lubafrique', tel: '141525141', nom: 'Familles Youan', qte: 1, prix: 9900 },
  { produit: 'patch anti douleur', ville: 'Abidjan yopougon', tel: '707356646', nom: 'Toure', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Sassandra', tel: '505044585', nom: 'Justice Yapi', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Citè sir nouveau goudron', tel: '789843550', nom: "Céline N'gouan", qte: 1, prix: 9900 },
  { produit: 'chaussette de compression', ville: 'Oume', tel: '778540319', nom: 'Yolande kouakou', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: "Abidjan - Plateau en face de l'hôtel ibis", tel: '757024410', nom: 'Jean-Philippe', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Korhogo', tel: '+2250710778533', nom: 'Kalifa soro', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Abidjan', tel: '506967986', nom: 'Oliver', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Korhogo (Ali Kader)', tel: '+2250709451042', nom: 'Philippe ABBE', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Abidjan Yopougon', tel: '706468536', nom: "Claude N'guessan", qte: 2, prix: 16900 },
  { produit: 'Crème Anti-Verrues', ville: 'Bonoua', tel: '+2250768335146', nom: 'Joel Vangah', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Agnibilekro', tel: '584553394', nom: 'Tokpa diomande joel', qte: 2, prix: 16900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Yopougon carrefour basiboli', tel: '747968029', nom: 'Ouattara marie', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Cocody Djorogobité cité Sir', tel: '707534497', nom: 'Kouassi', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Abobo adjame', tel: '707435581', nom: 'Traoré Moussa', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Zoukougbeu', tel: '748787252', nom: 'Mr PAO sylvestre', qte: 1, prix: 9900 },
  { produit: 'patch anti douleur', ville: 'Yopougon Ananerais', tel: '708265672', nom: 'Kouakou Marc', qte: 1, prix: 9900 },
  { produit: 'POUDRE_CHEVEUX', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan -port-bouet', tel: '101885909', nom: 'Abou Ouattara Kouma', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'abobo mosquée petro ivoire', tel: '+2250546003918', nom: 'sidibe Fanta madi', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan Adjame', tel: '778926805', nom: 'Melo Melo', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'sanpedro', tel: '702189438', nom: 'sanpédro', qte: 1, prix: 9900 },
  { produit: 'spray anti douleur', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'creme anti cerne', ville: 'Abidjan ,yopougon', tel: '707184956', nom: 'Gbayoro', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan Koumassi', tel: '708385936', nom: 'Ballo Aboubacar', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Bingerville lauriers 20', tel: '+2250709190183', nom: 'Pauline', qte: 3, prix: 24900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan yopougon', tel: '704325339', nom: 'ozoua rita sorokobi', qte: 1, prix: 9900 },
  { produit: 'chaussette de compression', ville: 'Soubré', tel: '707253336', nom: 'Gnapi boaly Mathieu', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Bondoukou', tel: '594363309', nom: "N'cho Sidoine Descate ASSI", qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan Yopougon', tel: '759196240', nom: 'Kouzssi linfa', qte: 2, prix: 16900 },
  { produit: 'SERUM_ONGLE', ville: 'Man', tel: '798596979', nom: 'Gonkanou Charles', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan -Bingerville', tel: '707539222', nom: 'Fidèle ETCHE', qte: 2, prix: 16900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Nouveau goudron Cocody', tel: '777411563', nom: 'Mme sylla', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan - Plateau', tel: '708806549', nom: 'NIMBA PAUL', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Galèbre', tel: '709111779', nom: 'Theo Bouda', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Yamissokro', tel: '151710776', nom: 'Honoré kouakou', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan Yopougon', tel: '+2250707948111', nom: 'Konan Paul Aboh', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Agboville aboussouan transport ou sbta transport', tel: '+2250101531564', nom: 'Komenan yaha Nadège', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Yopougon', tel: '140402352', nom: 'Attihoua Kouame Nicodème', qte: 1, prix: 9900 },
  { produit: 'creme anti cerne', ville: 'Yopouguon', tel: '+2250749358996', nom: 'Oulaï osée Omer', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Cocody', tel: '151788178', nom: 'Tiantai', qte: 1, prix: 9900 },
  { produit: 'creme anti cerne', ville: 'Abidjan Cocody Angre Château', tel: '758333364', nom: 'Don Gabriel', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Fresco', tel: '594862176', nom: 'Avit', qte: 1, prix: 9900 },
  { produit: 'creme anti cerne', ville: 'Abidjan koumassi', tel: '709557726', nom: 'Erik Kambire', qte: 1, prix: 9900 },
  { produit: 'spray anti douleur', ville: 'issia', tel: '170561015', nom: 'Zazou eugène', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Boundiali', tel: '103348491', nom: 'Kone', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Divo', tel: '566580568', nom: 'Kouakou ahoutou David', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Ndotré', tel: '556626945', nom: 'Mory', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'DALOA', tel: '709344381', nom: 'Kouassi kouame prince', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Danané', tel: '708218971', nom: 'Armel Bolou', qte: 1, prix: 9900 },
  { produit: 'patch anti douleur', ville: 'Abidjan Riviera Ciad', tel: '709770941', nom: 'Sountoura Amadou', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'A man', tel: '788402371', nom: 'Adamo diarra', qte: 1, prix: 9900 },
  { produit: 'spray anti douleur', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Abidjan yopougon', tel: '506890392', nom: 'Mobio Blandine', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Port bouet', tel: '2250708951335', nom: 'Philomene Kacou', qte: 1, prix: 9900 },
  { produit: 'spray anti douleur', ville: 'Niangon Nord', tel: '757034423', nom: 'Akou comoénEpseNango', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Man', tel: '170291063', nom: 'Salomon Nikiéma', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Dimbokro', tel: '153667316', nom: "N'goran aka", qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Lokodjro 0505603544', tel: '505603544', nom: 'Kalou bi', qte: 1, prix: 9900 },
  { produit: 'patch minceur glp', ville: 'Korhogo', tel: '777681749', nom: 'Coulibaly kali Ella fatoumata', qte: 1, prix: 9900 },
  { produit: 'patch minceur glp', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Abidjan - cocody', tel: '707076344', nom: 'Aby Joséphine', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'abidjan plateau', tel: '+2250707464684', nom: 'fofana fatoumata', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Port bouet', tel: '508538686', nom: 'Adepo patrick', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Modeste, Cité Gaïa 5', tel: '+2250708010220', nom: 'Vincent KRAMO', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan treichville avenue 24,954', tel: '574373072', nom: 'Aisse Aly', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan yopougon', tel: '749233359', nom: 'Assouman', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Ouangolo', tel: '544318197', nom: 'Bamba', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Bonoua samo', tel: '708060929', nom: 'adjavoin dieudonne', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Cocody à locodrom', tel: '505041951', nom: 'Kone fenon', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'A angré', tel: '141264845', nom: 'Yao remi', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan Abobo', tel: '707542860', nom: 'Kouakou Elise', qte: 1, prix: 9900 },
  { produit: 'patch minceur glp', ville: 'Bouaké air france3', tel: '708290830', nom: 'Tia Alexandrine', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan cocody', tel: '707541860', nom: 'kouakou Adou samuel', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan/ Yopougon', tel: '142661410', nom: 'Mobio Terrien', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Abidjan/GMA Treichville au port', tel: '709467858', nom: 'Assoua', qte: 1, prix: 9900 },
  { produit: 'spray anti douleur', ville: 'Abidjan cocody', tel: '707304073', nom: 'Ta bi boli', qte: 1, prix: 9900 },
  { produit: 'creme anti cerne', ville: 'Faya nouveau camp', tel: '749203738', nom: 'Sangare djeneba', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Kouto marcoussi', tel: '142271562', nom: 'Soro Yardjouma Daouda', qte: 1, prix: 9900 },
  { produit: 'patch anti douleur', ville: 'Abidjan marcory', tel: '+2250758356698', nom: 'Djeneba b', qte: 1, prix: 9900 },
  { produit: 'spray anti douleur', ville: 'Agnibilekro', tel: '555010434', nom: 'Sandé Marcellin', qte: 2, prix: 16900 },
  { produit: 'creme anti cerne', ville: 'San pedro', tel: '749179716', nom: 'Paul glarou', qte: 1, prix: 9900 },
  { produit: 'patch anti douleur', ville: 'Abidjan palmeraie', tel: '778981860', nom: 'Kanga ange', qte: 1, prix: 9900 },
  { produit: 'creme anti cerne', ville: "Cocody attoban abri 2000 après l'église St Bernard", tel: '707359868', nom: 'Kone mamadou', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan yopougon', tel: '+2250749504929', nom: 'Momi singa', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Abidjan Yopougon', tel: '757136348', nom: 'Yao Herman', qte: 1, prix: 9900 },
  { produit: 'chaussette de compression', ville: 'Marcory VGE immeuble kalimba a cote de phenic', tel: '707982926', nom: 'Agbandji yedess maxime', qte: 1, prix: 9900 },
  { produit: 'creme anti tache2', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Korhogo', tel: '749290544', nom: 'Kouame', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Bingerville', tel: '+2250719142732', nom: 'Kouassi kouame wilfried', qte: 1, prix: 9900 },
  { produit: 'patch anti douleur', ville: 'Marcory', tel: '707408682', nom: 'Gervais', qte: 1, prix: 9900 },
  { produit: 'creme anti cerne', ville: 'Man Grand Gbapleu', tel: '707361074', nom: 'DOHOUN Gabriel', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: "Angré star 8 à côté de l'école les Florianes", tel: '505231033', nom: 'Mme Camara', qte: 1, prix: 9900 },
  { produit: 'patch minceur glp', ville: 'Faya', tel: '5780702', nom: 'Mah', qte: 1, prix: 9900 },
  { produit: 'patch minceur glp', ville: 'AGBOVILLE', tel: '747212141', nom: 'N TAKPE N TAKPE NICOLAS', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Yopougon', tel: '+2250100323252', nom: 'Beda Naomie', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'San pedro', tel: '544528660', nom: 'Kila bonsa', qte: 1, prix: 9900 },
  { produit: 'spray anti douleur', ville: 'Abidjan yopougon', tel: '757954542', nom: 'Bakayoko épouse NGATTA', qte: 2, prix: 16900 },
  { produit: 'Creme anti lipome', ville: 'Abidjan yopougon', tel: '+2250707628670', nom: 'Siaka coulibaly', qte: 2, prix: 16900 },
  { produit: 'creme minceur', ville: 'Songon', tel: '104030694', nom: "KOUASSI N'GUESSAN EUDÈS", qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan Cocody 2 Plateaux', tel: '707761552', nom: 'Mme KONTE', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Bouak', tel: '101595151', nom: 'Mamadou sow', qte: 1, prix: 9900 },
  { produit: 'patch minceur glp', ville: 'Abidjan Abata', tel: '+2250709503680', nom: 'Virginie boni', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Duekoue', tel: '+2250574060114', nom: 'elie sawadogo', qte: 1, prix: 9900 },
  { produit: 'creme probleme de peau', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 5000 },
  { produit: 'CREME_VITILIGO', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Abidjan- Marcory', tel: '505091319', nom: 'Ouattara Moussa', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Grand bassam', tel: '708875308', nom: 'Josiane Williams', qte: 1, prix: 9900 },
  { produit: 'creme probleme de peau', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'YOPOUGON', tel: '707184956', nom: 'GBAYORO', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'abobo anonkoua koute hôpital des sœurs', tel: '709673912', nom: 'ECHANGE', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan marcory', tel: '703798133', nom: 'Desy', qte: 1, prix: 9900 },
  { produit: 'creme anti cerne', ville: 'Abidjan yop (lokoa extension nouveau qrtier)', tel: '173909609', nom: 'Zago koko justin', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Tanda', tel: '505018623', nom: 'Gboko modeste', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Abobo can onuci', tel: '576839344', nom: 'Yed junior', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Soubre', tel: '709301639', nom: 'Yacou', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan Palmeraie Rosiers P4', tel: '709274824', nom: "SYLVIE N'GORAN", qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan bingerville', tel: '2250779520586', nom: 'Salou Hermann', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Bonon', tel: '798164147', nom: 'AYA Roselyne', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'Abidjan port Bouet', tel: '546801733', nom: 'Narcisse oulai', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Bondoukou', tel: '+22595876789', nom: 'Missigbe Abel Dossa', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Toumodi', tel: '545510017', nom: "N'guessan kanbo Valentin", qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Sassandra', tel: '709836673', nom: 'Manou Kouakou', qte: 2, prix: 16900 },
  { produit: 'Creme anti lipome', ville: 'San pedro', tel: '701309147', nom: 'Orol Tere', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Abobo pk 18', tel: '+2250504530105', nom: 'Djipi manadja', qte: 1, prix: 9900 },
  { produit: 'Creme anti lipome', ville: 'A Abidjan koumassi GELTI', tel: '505805201', nom: 'Mamadou Ouedraogo', qte: 1, prix: 9900 },
  { produit: 'pourdre pousse cheveux', ville: 'Ouagadougou saaba', tel: '+22676479054', nom: 'Nitiema abdoul Raffir', qte: 1, prix: 9900 },
  { produit: 'patch anti douleur', ville: 'Grand Alépé carrefour cimetière', tel: '718975962', nom: 'Ali Diallo', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Daloa', tel: '505005555', nom: 'Soro Herve', qte: 1, prix: 9900 },
  { produit: 'creme anti tache2', ville: 'Abidjan yopougon Bimbresso', tel: '787530343', nom: 'Mme kramo', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Zone 04', tel: '564444844', nom: 'Doudou cisse Tanoh', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Gagnoa', tel: '505011418', nom: 'Kanga kouakou', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Adiaké', tel: '712663138', nom: 'Soro dossongui', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan abobo ndotré', tel: '596633560', nom: 'Achi Seka Rodolphe', qte: 1, prix: 9900 },
  { produit: 'gaine tourmaline chauffante', ville: 'Abobo', tel: '+2250747161000', nom: 'Fleur', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Yamoussoukro', tel: '+2250757081327', nom: 'Kadjo anoh ernest', qte: 1, prix: 9900 },
  { produit: 'Crème Anti-Verrues', ville: 'Daloa', tel: '+2250713127121', nom: 'Sawadogo', qte: 1, prix: 9900 },
  { produit: 'creme minceur', ville: 'Gagnoa', tel: '707683606', nom: 'Zagbayou Alain', qte: 2, prix: 16900 },
  { produit: 'spray anti douleur', ville: 'Abidjan Yopougon', tel: '7415898', nom: 'Euzebio florentia', qte: 1, prix: 9900 },
  { produit: 'patch anti douleur', ville: 'Abidjan yopougon', tel: '101604547', nom: 'Dosso', qte: 1, prix: 9900 },
  { produit: 'SERUM_ONGLE', ville: 'Abidjan Yopougon nouveau quartier carrefour lama', tel: '576259709', nom: 'Mangbly chancelle', qte: 1, prix: 9900 },
];

async function sendOrder(o) {
  const phone = fixPhone(o.tel);
  const code = PRODUCT_MAPPING[o.produit] || PRODUCT_MAPPING[o.produit.toLowerCase()] || o.produit;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': API_KEY },
    body: JSON.stringify({
      product_key: code,
      customer_name: o.nom,
      customer_phone: phone,
      customer_city: o.ville,
      quantity: o.qte,
      source: 'RECUPERATION_31_MARS',
      make_scenario_name: code,
    }),
  });
  return { status: res.status, data: await res.json(), phone, code };
}

async function main() {
  // Dédupliquer par tel+produit (garder la première occurrence)
  const seen = new Set();
  const unique = [];
  for (const o of SHEET_ORDERS) {
    const key = fixPhone(o.tel) + '|' + (PRODUCT_MAPPING[o.produit] || o.produit);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(o);
    }
  }

  console.log(`\n📋 ${SHEET_ORDERS.length} lignes dans le sheet, ${unique.length} uniques après déduplication`);
  console.log(`📡 Envoi des ${unique.length} commandes...\n`);

  let ok = 0, err = 0;
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < unique.length; i++) {
    const o = unique[i];
    try {
      const r = await sendOrder(o);
      if (r.status === 200 || r.status === 201) {
        console.log(`  ✅ [${i+1}/${unique.length}] ${o.nom} | ${r.phone} | ${r.code} (${r.data.match_method}) | #${r.data.order_id}`);
        ok++;
      } else {
        console.log(`  ❌ [${i+1}/${unique.length}] ${o.nom} | ${r.phone} | ${r.code} | ERR ${r.status}: ${JSON.stringify(r.data).slice(0,150)}`);
        err++;
      }
    } catch (e) {
      console.log(`  ❌ [${i+1}/${unique.length}] ${o.nom} | ERREUR: ${e.message}`);
      err++;
    }
    await delay(150);
  }

  console.log(`\n========================================`);
  console.log(`  ✅ Créées : ${ok}`);
  console.log(`  ❌ Erreurs : ${err}`);
  console.log(`  Total : ${unique.length}`);
  console.log(`========================================\n`);
}

main().catch(e => { console.error('Erreur:', e); process.exit(1); });
