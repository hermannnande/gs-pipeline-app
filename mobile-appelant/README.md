# GS Pipeline — App Appelant (Android)

Application mobile **Flutter** dédiée aux **appelants** de GS Pipeline.
Reproduit fidèlement la console web (`obgestion.com → /appelant/*`) :
mêmes couleurs (Tailwind primary `#0EA5E9` + Inter/Poppins), mêmes
fonctionnalités, même backend Vercel — sans rien à redéployer côté serveur.

> **Cible** : agents d'appel uniquement (rôle `APPELANT`).
> Les autres rôles (admin, gestionnaire, stock, livreur) restent sur la
> web app desktop `obgestion.com` ou l'app livreur séparée.

---

## Fonctionnalités

| Écran | Détail |
|---|---|
| **Login** | Email + mot de passe → JWT stocké dans `flutter_secure_storage`. Refus si rôle ≠ `APPELANT`. |
| **Dashboard** | Pointage GPS arrivée/départ + 4 KPIs du jour + barre taux validation + 5 dernières commandes à appeler. |
| **À appeler** | Liste filtrée `NOUVELLE`+`A_APPELER` (sans RDV), recherche, bouton **Appeler** (ouvre le composeur), modale **Traiter** (Validée / Injoignable / Annulée / RDV). |
| **RDV programmés** | KPIs (Total, Aujourd'hui, En retard, Rappelés), filtre Tous/À rappeler/Rappelés, boutons Rappeler + Modifier. |
| **Mes commandes traitées** | Historique perso filtrable (Toutes/Validées/Annulées/Injoignables). |
| **Mes statistiques** | Sélecteur jour/semaine/mois/année, anneau de validation, 6 KPIs, détail journalier. |

---

## Stack technique

- **Flutter 3.41** (channel stable) — Dart 3.11
- **Material 3** — palette reprise de `frontend/tailwind.config.js`
- **Polices** : Inter + Poppins (via `google_fonts`)
- **State** : `flutter_riverpod` 3 (`Notifier` pattern)
- **HTTP** : `dio` avec intercepteur Bearer JWT
- **Storage** : `flutter_secure_storage` (Keystore Android)
- **GPS** : `geolocator` (haute précision)
- **Téléphone** : `url_launcher` (`tel:`)

---

## Backend

L'app pointe par défaut vers la **prod** :

```
https://gs-pipeline-app-2.vercel.app/api
```

C'est exactement le même backend Express + Prisma que la web app — aucune
modification serveur n'a été faite. Endpoints utilisés :

- `POST /auth/login`, `GET /auth/me`
- `GET /orders`, `PUT /orders/:id/status`
- `GET /rdv`, `POST /rdv/:id/programmer`, `POST /rdv/:id/rappeler`, `PUT /rdv/:id`
- `GET /attendance/my-attendance-today`, `POST /attendance/mark-arrival`, `POST /attendance/mark-departure`
- `GET /stats/my-stats`

Pour pointer vers un autre backend (staging local, etc.), modifier
`ApiService.defaultBaseUrl` dans `lib/services/api_service.dart`.

---

## Permissions Android

Déclarées dans `android/app/src/main/AndroidManifest.xml` :

- `INTERNET`, `ACCESS_NETWORK_STATE` — appels API
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` — pointage géoloc
- `<queries>` `android.intent.action.DIAL` `tel:` — composer un numéro

`minSdkVersion = 23` (Android 6.0+), requis par `flutter_secure_storage`.

---

## Build APK

### Prérequis
- Flutter 3.x (`flutter --version`)
- Android SDK + Java 17
- Premier lancement : `flutter pub get`

### APK release (à distribuer aux appelants)

```bash
cd mobile-appelant
flutter build apk --release
```

L'APK signé (debug-keys par défaut) est généré ici :

```
mobile-appelant/build/app/outputs/flutter-apk/app-release.apk
```

Pour une vraie clé de signature production, ajouter un
`keystore` puis configurer `signingConfigs` dans
`android/app/build.gradle.kts` (voir doc Flutter).

### Build debug pour tester sur émulateur ou téléphone branché

```bash
flutter run
```

---

## Distribution aux appelants

1. Build APK release : `flutter build apk --release`
2. Récupérer `app-release.apk` (~25 Mo)
3. Diffuser via WhatsApp, Drive, ou hébergement direct sur le VPS
   (ex: `https://obrille.com/downloads/gs-appelant.apk`)
4. L'utilisateur active **"Sources inconnues"** dans Android, installe l'APK,
   ouvre l'app et se connecte avec ses identifiants habituels.

---

## Architecture du code

```
lib/
├── main.dart                 — Init theme, splash, route login/shell
├── theme/app_theme.dart      — Palette + Material 3 (couleurs Tailwind)
├── models/                   — User, Order, Stats, RDV, Attendance
├── services/api_service.dart — Dio + JWT + secure storage
├── providers/providers.dart  — apiServiceProvider, authProvider (Notifier)
├── widgets/
│   ├── attendance_button.dart — Carte pointage GPS arrivée/départ
│   ├── kpi_card.dart          — Carte KPI (icône + nombre + label)
│   ├── order_card.dart        — Carte commande (Appeler + Traiter)
│   └── status_badge.dart      — Badge statut coloré
├── screens/
│   ├── login_screen.dart
│   ├── app_shell.dart         — Drawer + body switching
│   ├── dashboard_screen.dart  — /appelant
│   ├── orders_screen.dart     — /appelant/orders
│   ├── rdv_screen.dart        — /appelant/rdv
│   ├── processed_orders_screen.dart — /appelant/processed
│   ├── stats_screen.dart      — /appelant/stats
│   ├── process_order_modal.dart — modale "Traiter l'appel"
│   └── rdv_modal.dart         — modales programmer/rappeler RDV
└── utils/formatters.dart     — XOF, dates, heures (fr_FR)
```

---

## Évolutions possibles (v2)

- Notifications push (nouvelles commandes, RDV à venir)
- Mode hors-ligne avec synchronisation différée
- Écrans "Toutes les commandes" / "Expéditions Express" / "Listes livraison"
  (nécessitent élargir les permissions backend pour rôle `APPELANT`)
- Sélecteur d'environnement (prod / staging) au login
- Signing Android avec keystore production
- Build iOS (ajouter `flutter create --platforms=ios .` puis configs Xcode)

---

## Licence interne — usage GS Pipeline uniquement.
