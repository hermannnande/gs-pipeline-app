# Module WhatsApp Agent Automatise — GS Pipeline

## Architecture Globale

```
Client WhatsApp
     |
     v
  360dialog (Cloud API)
     |
     v
  POST /api/whatsapp/webhook
     |
     v
  parseWebhookPayload()
     |
     v
  handleIncomingMessage()
     |
     ├── Si AUDIO → downloadMedia() → transcribeAudio() (Deepgram)
     |
     ├── Enregistrer WaMessage (INBOUND)
     |
     ├── Si HUMAN_HANDOFF → stop (pas de reponse bot)
     |
     ├── detectIntent() → intent + confidence
     |
     ├── processConversation() → state machine
     |   ├── Extraction entites (produit, qty, nom, tel, ville, adresse)
     |   ├── Choix reponse template
     |   └── Decision action (HANDOFF, CREATE_ORDER, CONFIRM_PROMPT...)
     |
     ├── Si shouldCreateOrder → createOrderFromConversation()
     |   └── Reutilise computeTotalAmount() + notifyNewOrder()
     |
     ├── Enregistrer WaRulesLog
     |
     ├── Mettre a jour WaConversation
     |
     └── sendTextMessage() → 360dialog → WhatsApp
```

## Modeles DB

### WaConversation
- Conversation WhatsApp unique par (waId, companyId)
- Stocke l'etat conversationnel (convState)
- Stocke l'extraction en cours (produit, nom, tel, ville...)
- Score de confiance 0-100
- Lien vers commande creee (orderId)
- Statut : OPEN, BOT_ACTIVE, HUMAN_HANDOFF, RESOLVED, ARCHIVED

### WaMessage
- Message individuel (entrant ou sortant)
- Acteur : CUSTOMER, BOT, HUMAN, SYSTEM
- Types : TEXT, AUDIO, IMAGE, VIDEO, DOCUMENT...
- Transcription audio stockee
- Anti-doublon via externalId unique

### WaRulesLog
- Journal de chaque decision du moteur de regles
- Intent detecte, confiance, donnees extraites
- Action prise, reponse choisie
- Etat avant/apres

## Endpoints API

### Webhook (pas d'auth)
- `GET /api/whatsapp/webhook` — Verification 360dialog
- `POST /api/whatsapp/webhook` — Reception messages

### Admin (JWT + ADMIN/GESTIONNAIRE)
- `GET /api/whatsapp/conversations` — Liste conversations
- `GET /api/whatsapp/conversations/stats` — Statistiques
- `GET /api/whatsapp/conversations/:id` — Detail + messages
- `POST /api/whatsapp/conversations/:id/send` — Envoyer message humain
- `POST /api/whatsapp/conversations/:id/handoff` — Prendre en charge
- `POST /api/whatsapp/conversations/:id/return-to-bot` — Rendre au bot
- `POST /api/whatsapp/conversations/:id/resolve` — Marquer resolu
- `POST /api/whatsapp/conversations/:id/archive` — Archiver

## Moteur de Regles

### Intentions detectees
GREETING, PRODUCT_QUESTION, PRICE_REQUEST, ORDER_START, ORDER_CONTINUE,
ORDER_CONFIRM, ORDER_CANCEL, DELIVERY_QUESTION, PAYMENT_QUESTION,
ORDER_STATUS, HUMAN_REQUEST, COMPLAINT, THANKS, YES, NO, UNKNOWN

### Machine a etats
NEW → GREETING → ASKING_PRODUCT → ASKING_QUANTITY → ASKING_NAME →
ASKING_PHONE → ASKING_LOCATION → ASKING_ADDRESS → CONFIRMING_ORDER → COMPLETED

Branchements possibles vers : HUMAN_HANDOFF, FAQ, COMPLETED

### Extraction
- Produit : mapping existant du webhook + synonymes + fuzzy matching
- Quantite : regex + mots (un, deux, trois)
- Nom : patterns "je m'appelle..." + heuristique alphabetique
- Telephone : patterns CI/BF (225, 226, 0X...)
- Ville : dictionnaire 50+ villes CI + BF

## Integration 360dialog

### Configuration
1. Creer un compte sur https://www.360dialog.com
2. Obtenir une API Key dans le dashboard
3. Configurer le webhook URL : `https://votre-domaine.com/api/whatsapp/webhook`
4. Renseigner DIALOG360_API_KEY dans .env

### Envoi de messages
- API REST vers `https://waba.360dialog.io/v1/messages`
- Header `D360-API-KEY`
- Type : text (pour cette version)

## Integration Deepgram

### Configuration
1. Creer un compte sur https://www.deepgram.com
2. Obtenir une API Key
3. Renseigner DEEPGRAM_API_KEY dans .env

### Transcription
- API REST vers `https://api.deepgram.com/v1/listen`
- Modele : nova-2
- Langue : fr (francais)
- Smart format active

## Creation de Commande

La commande est creee via `createOrderFromConversation()` qui :
1. Recupere le produit depuis productId extrait
2. Calcule le montant via `computeTotalAmount()` (meme logique que le webhook existant)
3. Cree la commande avec `prisma.order.create()` et les memes champs
4. Source : `WHATSAPP_BOT`
5. Statut initial : `NOUVELLE`
6. Notifie les appelants via `notifyNewOrder()`
7. Lie la conversation a la commande (orderId)

## Handoff Humain

Declencheurs automatiques :
- Client demande explicitement un humain
- Client se plaint (plainte, mecontent, arnaque...)
- Score de confiance trop bas
- Produit introuvable
- Intention inconnue repetee

Actions :
- Conversation passe en status HUMAN_HANDOFF
- Un conseiller peut prendre en charge dans l'inbox
- Le conseiller repond directement via l'interface
- Il peut rendre la conversation au bot quand termine

## Frontend

Page `/admin/whatsapp` :
- Barre de stats (conversations, bot actif, handoff, commandes)
- Liste conversations avec filtres (statut, recherche)
- Detail conversation type messagerie
- Panel d'extraction commande (droite)
- Actions : prendre en charge, rendre au bot, resoudre, archiver

## Variables d'Environnement

```
WHATSAPP_PROVIDER=360DIALOG
DIALOG360_API_KEY=xxx
DIALOG360_API_URL=https://waba.360dialog.io/v1
DIALOG360_WEBHOOK_SECRET=xxx
TRANSCRIPTION_PROVIDER=DEEPGRAM
DEEPGRAM_API_KEY=xxx
WA_BOT_ENABLED=true
WA_CONFIDENCE_THRESHOLD=40
WA_MAX_BOT_FAILURES=3
WA_DEFAULT_COMPANY_ID=1
WA_BUSINESS_NAME=OB Gestion
```

## Limitations Actuelles

1. Pas de LLM : les reponses sont basees sur des templates predefinies
2. Pas d'envoi d'images/videos par le bot
3. Pas de boutons interactifs WhatsApp (list messages, reply buttons)
4. Pas de gestion multi-langue automatique
5. Pas de relance automatique (cron) pour conversations inactives
6. Pas de gestion de catalogue WhatsApp Business natif

## Prochaines Ameliorations

### Court terme
- Ajouter des boutons interactifs (reply buttons, list messages)
- Relance automatique apres X heures d'inactivite
- Notifications temps reel (Socket.IO) pour nouvelles conversations
- Enrichir les synonymes produit et les patterns

### Moyen terme
- Integration LLM optionnelle (quand disponible) pour reponses plus naturelles
- Gestion multi-langue (fr/anglais/dioula)
- Analytics WhatsApp detaillees (temps reponse, satisfaction)
- Templates WhatsApp pre-approuves pour marketing
- Campagnes WhatsApp sortantes
