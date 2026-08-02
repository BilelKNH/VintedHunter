# SPECIFICATION.md

## Projet : Vinted Opportunity Hunter AI

- **Version du document** : 1.0
- **Statut** : Draft technique
- **Objectif** : Développement d'une première version fonctionnelle
- **Technologies principales** : TypeScript / Node.js / Next.js / PostgreSQL / IA

---

## 1. Vision du projet

### 1.1 Description

Vinted Opportunity Hunter AI est une plateforme intelligente permettant d'identifier automatiquement des annonces présentant un fort potentiel de revente.

Le système analyse quotidiennement les nouvelles annonces Vinted afin de détecter :

- les produits sous-évalués
- les erreurs de prix
- les annonces mal optimisées
- les vendeurs souhaitant vendre rapidement
- les produits avec forte demande
- les opportunités avec forte marge potentielle

L'objectif est d'aider un utilisateur à acheter des produits ayant une forte probabilité de générer un bénéfice lors d'une revente.

## 2. Objectif produit

### Problème identifié

Le marché de la seconde main contient énormément d'opportunités mais :

- les meilleures annonces disparaissent rapidement
- les utilisateurs ne connaissent pas toujours la vraie valeur d'un produit
- les recherches manuelles prennent beaucoup de temps
- les erreurs de référencement créent des opportunités

Exemple :

```
Annonce :
Nike Tech Fleece Hoodie
Taille L
Etat excellent
Prix : 25€

Valeur moyenne observée : 80€

Potentiel : +55€ brut
ROI : 220%
```

Le système doit être capable d'identifier automatiquement ce type d'opportunité.

## 3. Objectifs V1

### Recherche automatique

Le bot doit pouvoir :
- surveiller plusieurs recherches
- récupérer les nouvelles annonces
- analyser chaque annonce
- calculer un score
- envoyer une notification

### Analyse automatique

Chaque annonce doit recevoir :
- score d'opportunité
- estimation du prix réel
- marge potentielle
- niveau de confiance

### Interface utilisateur

Créer un dashboard permettant :
- voir les opportunités
- gérer les recherches
- modifier les critères
- consulter l'historique

## 4. Utilisateur cible

Profil principal : utilisateur réalisant de l'achat/revente.

Exemples : sneakers, vêtements premium, streetwear, vintage, marques recherchées.

## 5. Fonctionnalités principales

### Module Recherche

Permettre de créer des recherches personnalisées.

```
Nom : Nike Tech Fleece
Marques : Nike
Catégories : Hoodie, Sweat
Taille : L
Prix maximum : 40€
Score minimum : 80/100
```

### Module Crawler

Responsable de :
- récupération des annonces
- extraction des informations
- stockage
- détection des nouvelles annonces

Données récupérées : id annonce, titre, description, prix, photos, taille, marque, catégorie, état, vendeur, note vendeur, date publication, URL.

### Module Analyse

Chaque annonce passe par un moteur d'analyse qui calcule un **Opportunity Score** (0-100) :

| Critère | Poids |
|---|---|
| Prix intéressant | 30% |
| Demande produit | 20% |
| Marque | 15% |
| Etat | 10% |
| Qualité annonce | 10% |
| Vendeur | 5% |
| Liquidité | 10% |

### Module Estimation prix

Le système doit estimer : prix achat, prix marché, prix revente probable, marge brute, marge nette, ROI.

Exemple :
```
Prix achat : 35€
Prix revente estimé : 95€
Frais : 10€
Bénéfice : 50€
ROI : 142%
```

### Module Notification

Canaux supportés : Discord, Telegram, Email.

```
🔥 Opportunité détectée

Nike Tech Fleece Hoodie
Prix : 29€
Valeur estimée : 85€
Score : 94/100
ROI : 193%

Pourquoi :
- Prix inférieur de 65%
- Marque forte
- Taille recherchée
- Vendeur fiable

Lien : URL annonce
```

## 6. Architecture générale

```
                    USER
                     |
              Next.js Dashboard
                     |
                API Gateway
                     |
        -------------------------
        |           |           |
     Crawler     Analyzer    Notification
        |           |           |
        -------------------------
                     |
                PostgreSQL
                     |
                  Redis
```

## 7. Stack technique

**Backend** : Node.js 22, TypeScript, Fastify, Prisma ORM, PostgreSQL, Redis, BullMQ

**Frontend** : Next.js, React, TailwindCSS, shadcn/ui, Recharts

**Infrastructure** : Docker, Docker Compose, GitHub Actions

## 8. Structure du projet

```
vinted-ai-hunter/
├── apps/
│   ├── api/
│   └── dashboard/
├── packages/
│   ├── crawler/
│   ├── analyzer/
│   ├── pricing-engine/
│   ├── notification/
│   ├── database/
│   └── shared/
├── docker/
└── docs/
```

## 9. Roadmap développement V1

- **Phase 1** — Initialisation projet : Monorepo, Docker, Base PostgreSQL, Prisma
- **Phase 2** — Dashboard : Authentification, Gestion recherches, Affichage annonces
- **Phase 3** — Crawler : Récupération annonces, Stockage, Déduplication
- **Phase 4** — Analyse : Scoring, Prix estimé, Notifications
- **Phase 5** — Optimisation : Cache, Monitoring, Tests

## 10. Principes de développement

Claude Code devra respecter :
- TypeScript strict
- Architecture modulaire
- Code maintenable
- Tests automatisés
- Documentation
- Variables d'environnement
- Aucun secret dans le code

---

## 11. Module Crawler Vinted

### 11.1 Objectif

Le module crawler est responsable de la collecte automatique des annonces. Son rôle est de :
- surveiller les recherches configurées par l'utilisateur
- récupérer les nouvelles annonces
- extraire les informations importantes
- détecter les changements
- transmettre les données au moteur d'analyse

Le crawler doit être conçu comme un composant indépendant afin de permettre l'ajout futur d'autres marketplaces.

### 11.2 Architecture du crawler

```
Crawler Service
        |
Search Manager
        |
Browser Worker
        |
Parser
        |
Data Normalizer
        |
Database Storage
```

### 11.3 Technologies crawler

Playwright, TypeScript, BullMQ, Redis, PostgreSQL, Prisma.

### 11.4 Fonctionnement général

Système de tâches planifiées (ex : job 00:00 → création des jobs par recherche → workers exécutent → analyse des annonces → notification utilisateur).

### 11.5 Gestion des recherches

```ts
SearchConfiguration {
  id
  name
  brand[]
  category[]
  size[]
  minPrice
  maxPrice
  keywords[]
  excludedKeywords[]
  condition[]
  country
  minimumScore
  scanFrequency
  enabled
}
```

Exemple :
```json
{
  "name": "Nike Tech Fleece L",
  "brand": ["Nike"],
  "category": ["Hoodie", "Sweat"],
  "size": ["L"],
  "maxPrice": 50,
  "minimumScore": 85
}
```

### 11.6 Scheduler

Fonctions : création automatique des tâches, gestion des priorités, reprise après erreur, limitation du nombre de tâches simultanées.

Priorités : High (Nike Tech, Stone Island, Arc'Teryx), Medium (Carhartt, Patagonia), Low (autres recherches).

### 11.7 Gestion des performances

Le crawler doit utiliser plusieurs workers, limiter les requêtes, mettre en cache les données, éviter les appels inutiles.

```
MAX_WORKERS=5
REQUEST_DELAY_MIN=3000
REQUEST_DELAY_MAX=8000
CACHE_DURATION=24H
```

### 11.8 Extraction des données

```ts
Listing {
  id
  source
  externalId
  title
  description
  brand
  category
  size
  condition
  price
  currency
  images[]
  seller
  url
  publishedAt
  collectedAt
}
```

### 11.9 Gestion des doublons

Méthodes : ID externe Vinted, hash URL, hash contenu, comparaison images.

## 12. Analyse intelligente des annonces

### 12.1 Objectif

Transformer une annonce brute en opportunité analysée.

```
Annonce brute → Analyse texte → Analyse image → Analyse vendeur → Analyse marché → Calcul score → Décision
```

### 12.2 Analyse du titre

Analyser : marque, modèle, collection, taille, mots-clés.

Exemple : `"Nike tech sweat"` → Marque: Nike ✓, Collection: Tech Fleece probable, Confiance: 82%

### 12.3 Détection des mauvaises descriptions

Identifier les annonces sous-optimisées (ex: "pull nike", "bon état", "taille L") — moins de visibilité, potentiel de sous-évaluation.

### 12.4 Analyse des mots-clés vendeur

Mots indiquant une vente rapide : urgent, déménagement, vide dressing, doit partir, liquidation, prix négociable, départ.

Impact : + probabilité de négociation, + probabilité de marge.

### 12.5 Détection des erreurs

Identifier : mauvaise catégorie, mauvaise marque, faute d'orthographe, mauvais titre, absence de mots importants.

Exemple : `"Nik hoodie noir L"` → correction probable "Nike Tech Fleece Hoodie", potentiel élevé.

## 13. Analyse des images par IA Vision

### 13.1 Objectif

Analyser automatiquement les photos : type produit, marque, état réel, défauts, authenticité.

### 13.2 Analyse état produit

Vêtements : tâches, trous, usure tissu, décoloration, boulochage, coutures.
Chaussures : usure semelle, plis, rayures, état général.

```json
{
  "conditionScore": 87,
  "issues": ["léger boulochage manche"]
}
```

### 13.3 Détection marque

Reconnaître logos, motifs, étiquettes, détails spécifiques.

### 13.4 OCR

Extraire étiquette taille, référence produit, numéro modèle, composition.

```
Image → OCR → Extraction texte → Recherche référence → Validation produit
```

Exemple : photo étiquette `CU4489-010` → Nike Tech Fleece Hoodie, Année 2021, Valeur marché 90€.

## 14. Détection de contrefaçon

### 14.1 Objectif

Identifier les annonces suspectes via un **Authenticity Score** (0-100).

### 14.2 Critères analysés

- **Photos** : qualité, incohérences, logos, coutures
- **Prix** : anomalie (ex : Stone Island Shadow Project normal 350€, annonce à 40€ → risque élevé)
- **Description** : texte générique, copier/coller, absence d'informations
- **Vendeur** : ancienneté, évaluations, historique

### 14.3 Résultat

```json
{
  "authenticityScore": 82,
  "risk": "LOW",
  "reason": ["Etiquette cohérente", "Photos originales", "Vendeur fiable"]
}
```

## 15. Moteur de scoring avancé

### 15.1 Objectif

Déterminer si une annonce vaut la peine d'être achetée. Score final : 0-100.

### 15.2 Calcul

| Critère | Poids |
|---|---|
| Prix sous marché | 30% |
| Demande produit | 20% |
| Marque | 15% |
| Etat | 10% |
| Photos | 5% |
| Vendeur | 5% |
| Liquidité | 10% |
| Authenticité | 5% |

### 15.3 Exemple résultat

```
Nike Tech Fleece — Score : 94/100
Prix: +28/30, Demande: +20/20, Etat: +9/10, Vendeur: +5/5, Authenticité: +5/5
Conclusion : Très forte opportunité
```

## 16. Niveau d'action automatique

| Score | Action |
|---|---|
| < 50 | Ignorer |
| 50-75 | Surveillance |
| 75-90 | Bonne opportunité |
| 90-100 | Achat recommandé |

## 17. Sortie du module Analyzer

```ts
OpportunityAnalysis {
  listingId
  score
  estimatedPrice
  estimatedProfit
  roi
  liquidityScore
  authenticityScore
  recommendation
  explanation[]
}
```

---

## 18. Architecture Backend

### 18.1 Objectif

Le backend gère : utilisateurs, recherches, annonces, analyses, scoring, notifications, statistiques, IA, historique.

```
                    API CLIENT
                       |
                    Fastify
                       |
        --------------------------------
        |              |               |
   User Service   Listing Service   AI Service
        |
   Database Layer
        |
    PostgreSQL
```

## 19. Organisation Backend

```
apps/api/src/
├── modules/
│   ├── auth/ (controller, service, repository)
│   ├── users/
│   ├── searches/
│   ├── listings/
│   ├── analysis/
│   ├── pricing/
│   ├── notifications/
│   ├── analytics/
│   └── ai/
├── database/
├── middleware/
├── config/
└── utils/
```

## 20. Base de données PostgreSQL (Prisma)

### 20.1 User

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstname String?
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  searches      Search[]
  notifications Notification[]
}
```

### 20.2 Search

```prisma
model Search {
  id               String   @id @default(uuid())
  userId           String
  name             String
  brands           String[]
  categories       String[]
  sizes            String[]
  keywords         String[]
  excludedKeywords String[]
  minPrice         Float?
  maxPrice         Float?
  minimumScore     Int      @default(70)
  frequency        Int
  enabled          Boolean  @default(true)
  createdAt        DateTime @default(now())
}
```

### 20.3 Listing

```prisma
model Listing {
  id          String    @id @default(uuid())
  externalId  String    @unique
  source      Marketplace
  title       String
  description String?
  brand       String?
  category    String?
  size        String?
  condition   String?
  price       Float
  currency    String
  url         String
  images      String[]
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  analysis    Analysis?
}
```

### 20.4 Seller

```prisma
model Seller {
  id             String   @id @default(uuid())
  externalId     String
  username       String
  rating         Float?
  reviews        Int?
  accountAge     Int?
  totalListings  Int?
  riskScore      Int?
  listings       Listing[]
}
```

### 20.5 Analysis

```prisma
model Analysis {
  id                 String   @id @default(uuid())
  listingId          String   @unique
  score              Int
  priceScore         Int
  brandScore         Int
  conditionScore     Int
  liquidityScore     Int
  authenticityScore  Int
  estimatedValue     Float
  estimatedProfit    Float
  roi                Float
  explanation        Json
  createdAt          DateTime @default(now())
}
```

### 20.6 PriceHistory

```prisma
model PriceHistory {
  id        String   @id @default(uuid())
  listingId String
  price     Float
  createdAt DateTime @default(now())
}
```

### 20.7 Purchase

```prisma
model Purchase {
  id            String         @id @default(uuid())
  userId        String
  listingId     String
  purchasePrice Float
  sellingPrice  Float?
  profit        Float?
  status        PurchaseStatus
  createdAt     DateTime       @default(now())
}
```

### 20.8 Notification

```prisma
model Notification {
  id        String               @id @default(uuid())
  userId    String
  listingId String
  channel   NotificationChannel
  sent      Boolean
  createdAt DateTime             @default(now())
}
```

## 21. API REST (Fastify)

### 21.1 Authentification
```
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### 21.2 Recherche
```
POST   /searches
GET    /searches
PATCH  /searches/:id
DELETE /searches/:id
```

### 21.3 Listings
```
GET  /listings
GET  /listings/:id
POST /listings/:id/favorite
```

### 21.4 Analyse
```
POST /analysis/:listingId
GET  /analysis/:listingId
```

### 21.5 Analytics
```
GET /analytics/dashboard
```
```json
{
  "totalOpportunities": 340,
  "averageROI": 82,
  "bestBrand": "Nike",
  "potentialProfit": 5200
}
```

## 22. API GraphQL (option future)

Objectif : permettre au dashboard de récupérer uniquement les données nécessaires.

Types : User, Listing, Analysis, Search, Statistics, Purchase.

## 23. Queue System (BullMQ + Redis)

Jobs :
- `crawl-search` — lancer crawler, récupérer annonces
- `analyze-listing` — analyse texte, analyse image, scoring
- `send-notification`

```
Redis → BullMQ → Workers → Services
```

## 24. Service Pricing Engine

Sources : historique interne, annonces similaires, tendances, saisonnalité.

```
MarketPrice = Average Similar Listings + Brand Factor + Condition Factor + Demand Factor
```

## 25. Similarity Engine

Méthodes : similarité titre, marque, catégorie, image, embeddings IA.

Exemple : "Nike Tech Hoodie" ≈ "Nike Tech Fleece Sweat" — Similarity 93%.

## 26. Analytics Engine

- **Produit** : meilleures marques, meilleures catégories, tailles rentables
- **Utilisateur** : achats, bénéfices, erreurs
- **Marché** : tendances, évolution prix

## 27. Dataset Machine Learning

Toutes les analyses sont stockées pour améliorer les prédictions.

```json
{
  "brand": "Nike",
  "category": "hoodie",
  "price": 35,
  "estimatedValue": 100,
  "bought": true,
  "profit": 55
}
```

## 28. Variables environnement

```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DISCORD_WEBHOOK=
TELEGRAM_TOKEN=
```

---

## 29. Dashboard Web Application

### 29.1 Objectif

Interface moderne pour piloter le système : visualiser les opportunités, gérer les recherches, analyser les performances, suivre les achats, configurer les notifications, consulter les statistiques.

## 30. Stack Frontend

Next.js 15, React, TypeScript, TailwindCSS, shadcn/ui, React Query, Zustand, Recharts, Framer Motion.

## 31. Architecture Frontend

```
apps/dashboard/src/
├── app/ (dashboard, listings, searches, analytics, settings)
├── components/ (ui, charts, cards)
├── hooks/
├── services/
├── stores/
└── utils/
```

## 32. Design System

Moderne, rapide, responsive, orienté data. Inspirations : Linear, Vercel Dashboard, Stripe Dashboard, Notion.

## 33. Authentification utilisateur

JWT + Refresh Token. Fonctionnalités : inscription, connexion, déconnexion, récupération mot de passe, gestion profil.

## 34. Page Dashboard principale

KPIs : Opportunités détectées aujourd'hui (124), Score moyen (87/100), ROI moyen (156%), Profit potentiel (2450€).

## 35. Graphiques

- Evolution opportunités (nombre / jour, 30 jours)
- Evolution ROI (semaine / mois / année)
- Marques performantes (ex : 1. Nike 92%, 2. Stone Island 88%, 3. Carhartt 81%)

## 36. Page Opportunités

Vue tableau : Produit | Prix | Valeur | ROI | Score

| Produit | Prix | Valeur | ROI | Score |
|---|---|---|---|---|
| Nike Tech Hoodie | 35€ | 95€ | 171% | 94 |
| Stone Island Sweat | 80€ | 180€ | 125% | 91 |

## 37. Carte annonce intelligente

Chaque annonce affiche : image, titre, prix, valeur estimée, profit, ROI, score, explications ("pourquoi"), niveau de risque, et actions (Voir annonce / Acheter / Ignorer).

## 38. Système de filtres

- **Prix** : 0-50€, 50-100€, 100-200€
- **Score** : 50+, 75+, 90+
- **ROI** : 50%, 100%, 200%
- **Marques** : Nike, Stone Island, Arc'Teryx, Carhartt, Patagonia
- **Catégories** : Hoodies, Sneakers, Vestes, Pantalons, Accessoires

## 39. Page détail annonce

Informations générales (titre, photos, description, prix, date, URL) + Analyse IA (titre, photo, authenticité, score final).

## 40. Visualisation IA

Détection objet (ex : "Nike Tech Fleece Hoodie", probabilité 96%) et défauts détectés.

## 41. Page Recherche

Formulaire : nom recherche, marques, catégories, tailles, prix maximum, score minimum, fréquence scan, notifications activées, analyse IA activée.

## 42. Templates de recherches

Exemples : "Nike Tech Hunter" (Nike, Tech/Tech Fleece, M/L/XL, max 60€), "Luxe seconde main" (Stone Island, Moncler, Arc'Teryx, Canada Goose, score min 85).

## 43. Page Historique

Annonces vues, achetées, ignorées, bénéfices.

## 44. Gestion des achats ("Mon portefeuille")

Produit acheté, prix achat, date achat, prix revente, bénéfice, ROI, temps avant vente.

## 45. Système de feedback utilisateur

Actions : Bonne opportunité, Mauvaise analyse, Acheté, Revendu, Faux positif — chaque action nourrit le modèle IA.

## 46. Notifications

Canaux : Discord, Telegram, Email, Push navigateur, Webhook.

## 47. Configuration notifications

Notifier uniquement si : Score > 90, ROI > 100%, Profit > 50€.

## 48. Discord Bot

```
🔥 NOUVELLE OPPORTUNITÉ
Nike Tech Fleece
Prix : 29€
Valeur : 100€
Profit estimé : +60€
Score : 96/100
Analyse :
- Prix très inférieur au marché
- Taille recherchée
- Vendeur fiable
Lien : xxxxx
```

## 49. Telegram Bot

Commandes : `/start`, `/status`, `/opportunities`, `/search Nike`, `/stats`

## 50. Page Analytics avancée

Nombre annonces analysées, nombre opportunités, taux réussite, ROI moyen, bénéfice total.

## 51. Analytics marques

Ex : Nike — Nombre opportunités: 542, ROI moyen: 134%, Temps moyen vente: 6 jours.

## 52. Analytics vendeurs

Détection : vendeurs intéressants, vendeurs professionnels, vendeurs suspects.

## 53. Mode mobile

Responsive, priorité : consultation rapide, notifications, achat rapide.

## 54. Performance frontend

First Load < 2s, Dashboard < 500ms, images optimisées, lazy loading, cache API.

## 55. Accessibilité

Respect WCAG : navigation clavier, contrastes, lecteurs écran.

---

## 56. Intelligence Artificielle avancée

### 56.1 Objectif

Transformer le système d'analyse classique en moteur intelligent capable d'apprendre, prédire et améliorer ses décisions avec le temps : "Quelle annonce a la meilleure probabilité de générer un bénéfice réel ?"

## 57. Architecture IA

```
                 Listing
                    |
              Feature Extraction
                    |
        ----------------------------
        |                          |
   Vision AI                 NLP AI
        |                          |
        ----------------------------
                    |
             Scoring Engine
                    |
             ML Prediction
                    |
              Final Score
```

## 58. Analyse NLP (texte)

Analyser : titre, description, mots-clés, fautes, intention vendeur, qualité rédactionnelle.

### 58.1 Classification automatique

Reconnaître : type produit, marque, collection, style, public cible, niveau de rareté.

```json
{
  "brand": "Nike",
  "collection": "Tech Fleece",
  "type": "Hoodie",
  "confidence": 0.94
}
```

## 59. Embeddings IA

Représentation vectorielle des annonces pour trouver des produits similaires.

Technologies possibles : OpenAI Embeddings, Cohere Embeddings, BGE Models, Vector Database.

## 60. Base vectorielle

Solutions : PostgreSQL + pgvector, Qdrant, Pinecone.

Stockage : Listing + Image embedding + Text embedding + Price embedding.

## 61. IA Vision avancée

Reconnaître : vêtements, chaussures, accessoires, logos, matériaux, état.

### 61.1 Analyse qualité photo

Photo Score (0-100). Critères : luminosité, netteté, nombre de photos, angle, présentation.

### 61.2 Détection de défauts

```json
{
  "condition": 82,
  "issues": ["usure légère manche"]
}
```

## 62. Système anti-contrefaçon IA

Analyse : Produit (logo, étiquette, référence, coutures), Vendeur (historique, volume, cohérence), Prix (anomalie). Authenticity Score (0-100).

## 63. Machine Learning

### 63.1 Données utilisées

Chaque décision devient une donnée d'entraînement.

```json
{
  "brand": "Stone Island",
  "price": 90,
  "estimatedValue": 200,
  "score": 92,
  "bought": true,
  "profit": 80
}
```

## 64. Apprentissage utilisateur

Le système apprend : marques rentables, tailles préférées, catégories performantes, prix d'achat idéal — et augmente automatiquement la priorité des combinaisons rentables.

## 65. Modèle de prédiction

Prédit : probabilité de vente (7 jours), prix de revente probable, profit attendu.

## 66. Reinforcement Learning

Récompenses : Achat rentable +10, Vente rapide +5, Erreur -10. Objectif : maximiser le profit moyen.

## 67. Détection des tendances

Analyser : volume d'annonces, recherches utilisateur, évolution prix, réseaux sociaux, historique ventes.

## 68. Analyse saisonnière

Hiver : vestes, doudounes, pulls. Été : shorts, sneakers, t-shirts. Ex : Décembre → Canada Goose demande +80%, score augmenté.

## 69. Moteur de recommandation

Propose les meilleures catégories/marques à surveiller selon l'historique de résultats de l'utilisateur.

## 70. Assistant IA intégré

Chatbot basé sur OpenAI API / Claude API / modèles locaux, capable de répondre à des questions en langage naturel sur les opportunités et leur justification.

## 71. Multi-marketplaces

```
packages/marketplaces/
├── vinted/
├── ebay/
├── depop/
├── grailed/
└── vestiaire/
```

## 72. Interface Marketplace

```ts
interface Marketplace {
  search()
  getListing()
  getSeller()
  getHistory()
}
```

## 73. Marketplace V2 prévues

Priorité : 1. Vinted, 2. Leboncoin, 3. eBay, 4. Depop, 5. Grailed, 6. Vestiaire Collective.

## 74. Architecture SaaS

Objectif long terme : transformer le projet en produit commercial.

## 75. Gestion utilisateurs

Comptes, équipes, permissions. Rôles : ADMIN, USER, PRO, ENTERPRISE.

## 76. Abonnements (Stripe Billing)

- **Free** : 10 recherches, 100 analyses/mois
- **Pro** : recherches illimitées, IA avancée, notifications temps réel
- **Business** : multi-utilisateurs, API, statistiques avancées

## 77. Limitations SaaS

Gestion des quotas, crédits IA, fréquence crawler, stockage.

## 78. API publique

```
GET /api/opportunities
GET /api/products/:id
GET /api/statistics
```

## 79. Marketplace interne

Evolution possible : partager des recherches, vendre des analyses, créer des stratégies.

## 80. Objectif final produit

Le projet devient une "AI-powered resale intelligence platform" capable de détecter, analyser, prédire, apprendre et optimiser les opportunités de revente.

---

## 81. Infrastructure et déploiement

### 81.1 Objectif

Infrastructure fiable, scalable et maintenable : déploiement automatisé, haute disponibilité, monitoring complet, sécurité renforcée, facilité d'évolution.

## 82. Environnement de développement

Le projet doit fonctionner avec Docker.

```
Developer Machine
      |
 Docker Compose
      |
 -----------------------------
 |       |        |          |
API   Dashboard PostgreSQL Redis
 |
Workers
```

## 83. Docker

`docker-compose.yml` (services : api, dashboard, postgres, redis, worker).

```yaml
services:
  api:
    build:
      context: ./apps/api
    ports:
      - "3001:3001"
  dashboard:
    build:
      context: ./apps/dashboard
    ports:
      - "3000:3000"
  postgres:
    image: postgres:16
  redis:
    image: redis:7
  worker:
    build:
      context: ./apps/worker
```

## 84. Variables environnement (`.env.example`)

```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DISCORD_WEBHOOK=
TELEGRAM_TOKEN=
STRIPE_SECRET=
NODE_ENV=
```

## 85. Gestion des secrets

Interdit : clés API dans le code, mots de passe dans Git, fichiers `.env` versionnés.

Utiliser : GitHub Secrets, AWS Secrets Manager, Vault.

## 86. CI/CD GitHub Actions

Automatiser : validation code, tests, build, déploiement.

## 87. Pipeline Pull Request

```
Pull Request → Install dependencies → Lint → Tests → Build → Security Scan → Validation
```

## 88. Pipeline Production

```
Merge Main → Build Docker Images → Push Registry → Deploy Cloud → Health Check → Rollback si erreur
```

## 89. Qualité code

ESLint, Prettier, Husky, Commitlint, TypeScript strict.

## 90. Convention Git

Branches : `main`, `develop`, `feature/*`, `fix/*`, `hotfix/*`

Commits : `feat:`, `fix:`, `refactor:`, `test:`, `docs:` (ex : `feat: add listing analysis service`)

## 91. Tests

Objectif : garantir un niveau production.

## 92. Tests Backend (Vitest)

Tester : services, repositories, calcul scoring, pricing engine, authentification.

```ts
describe("Opportunity Score", () => {
  it("should calculate profitable listing", () => {
    expect(score).toBeGreaterThan(90)
  })
})
```

## 93. Tests Frontend

Playwright, Testing Library. Tester : connexion, dashboard, filtres, recherches, navigation.

## 94. Tests End-to-End

```
Utilisateur crée compte → Crée recherche Nike → Crawler trouve annonce → IA analyse → Score calculé → Notification envoyée
```

## 95. Monitoring

Objectif : surveiller la santé du système.

## 96. Logs (Pino Logger)

Logs : erreurs, performances, crawler, IA, notifications.

## 97. Metrics (Prometheus + Grafana)

- **API** : temps réponse, erreurs, requêtes
- **Crawler** : annonces analysées, erreurs scraping, temps moyen
- **IA** : coût API, temps analyse, nombre analyses

## 98. Alerting

Ex : API indisponible → Notification Discord Admin.

Alertes : serveur down, crawler bloqué, erreurs importantes, dépassement coût IA.

## 99. Sécurité Backend

Obligatoire : validation inputs, protection injection SQL, rate limiting, CORS configuré, headers sécurité.

## 100. Authentification

Hash bcrypt, JWT court terme, refresh token, expiration session.

## 101. Protection API

Limiter à 100 requêtes/minute/utilisateur.

## 102. Sauvegarde données

Backup automatique : PostgreSQL quotidien, stockage externe, restauration testée.

## 103. Architecture Cloud

**Option simple (V1)** : Frontend → Vercel, Backend → Railway/Render, Database → Supabase PostgreSQL, Redis → Upstash

**Option production** : AWS → ECS/Kubernetes → RDS PostgreSQL → ElastiCache Redis → S3 → CloudFront

## 104. Structure finale repository

```
vinted-ai-hunter/
├── apps/
│   ├── api/
│   ├── dashboard/
│   └── worker/
├── packages/
│   ├── database/
│   ├── crawler/
│   ├── analyzer/
│   ├── pricing-engine/
│   ├── ai-engine/
│   ├── notifications/
│   └── shared/
├── docker/
├── docs/
├── scripts/
├── tests/
├── README.md
├── SPECIFICATION.md
├── docker-compose.yml
└── package.json
```

## 105. Ordre de développement Claude Code

- **Phase 1 — Fondation** : monorepo, TypeScript, Docker, PostgreSQL, Prisma, Redis. *Livrable : projet démarrable.*
- **Phase 2 — Backend Core** : authentification, utilisateurs, recherches, annonces, API. *Livrable : API fonctionnelle.*
- **Phase 3 — Dashboard** : connexion, dashboard, recherches, affichage annonces. *Livrable : interface utilisateur.*
- **Phase 4 — Crawler** : scheduler, workers, récupération annonces, stockage. *Livrable : collecte automatique.*
- **Phase 5 — Intelligence** : analyse texte, scoring, estimation prix, notifications. *Livrable : détection opportunités.*
- **Phase 6 — IA avancée** : vision IA, OCR, embeddings, similarité, apprentissage. *Livrable : analyse intelligente.*
- **Phase 7 — Optimisation** : monitoring, tests, CI/CD, sécurité. *Livrable : version production.*

## 106. Prompt final Claude Code

> Tu es un architecte logiciel senior. Tu dois développer le projet décrit dans SPECIFICATION.md.
>
> Respecte strictement : architecture modulaire, TypeScript strict, Clean Architecture, séparation frontend/backend, tests automatisés, documentation.
>
> Ne développe pas tout en une seule fois. Travaille par phases.
>
> Avant chaque phase :
> 1. Analyse les besoins.
> 2. Propose un plan technique.
> 3. Liste les fichiers qui seront créés.
> 4. Implémente proprement.
> 5. Ajoute les tests associés.
> 6. Mets à jour la documentation.
>
> Priorité : créer une V1 fonctionnelle avant les fonctionnalités avancées.
>
> La V1 doit permettre : créer un compte, créer une recherche, crawler les annonces, analyser les annonces, calculer un score, afficher les opportunités, envoyer des notifications.
>
> Ensuite seulement : IA Vision, OCR, Machine Learning, SaaS, Multi-marketplaces.
>
> Le code doit être prêt pour évoluer vers une application commerciale.
