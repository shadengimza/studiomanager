# StudioManager — première version du backend (authentification et utilisateurs)

Cette version reprend le backend Express / PostgreSQL / Prisma déjà préparé pour StudioManager. Elle ajoute :
- la connexion par e-mail et mot de passe ;
- le hachage des mots de passe avec bcrypt ;
- la création d'un JWT ;
- la vérification du JWT sur les routes protégées ;
- la gestion des rôles (`ADMIN`, `PHOTOGRAPHE`, `DECORATEUR`, `CHAUFFEUR`) ;
- la consultation du profil connecté ;
- la création, la consultation et la modification des comptes par un administrateur ;
- une limitation des tentatives de connexion.

## 1. Installation

Prérequis : Node.js 20+, PostgreSQL et npm.

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
```

Renseigner les valeurs de `.env`, en particulier `DATABASE_URL`, `JWT_SECRET` (au moins 32 caractères) et `FRONTEND_ORIGIN`.

## 2. Créer le premier administrateur

Sous PowerShell :

```powershell
$env:ADMIN_EMAIL="admin@studiomanager.local"
$env:ADMIN_PASSWORD="UnMotDePasseTresSolide!"
$env:ADMIN_FIRST="Admin"
$env:ADMIN_LAST="StudioManager"
node src/create-admin.js
```

Ne pas committer le mot de passe ni le fichier `.env`.

## 3. Démarrer l'API

```bash
npm run dev
```

L'API écoute par défaut sur `http://localhost:3000`.

## 4. Routes disponibles

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| GET | `/api/health` | Public | — |
| POST | `/api/auth/login` | Public, limité | — |
| GET | `/api/auth/me` | JWT | Utilisateur connecté |
| POST | `/api/auth/logout` | JWT | Utilisateur connecté |
| GET | `/api/users` | JWT | ADMIN |
| POST | `/api/users` | JWT | ADMIN |
| PATCH | `/api/users/:id` | JWT | ADMIN |

### Connexion

`POST /api/auth/login`

```json
{
  "email": "admin@studiomanager.local",
  "password": "UnMotDePasseTresSolide!"
}
```

La réponse contient `accessToken`, `tokenType`, `expiresIn` et les informations publiques de l'utilisateur. Ne jamais renvoyer ni exposer `passwordHash`.

Pour les routes protégées, transmettre :

```http
Authorization: Bearer <accessToken>
```

### Créer un compte intervenant (administrateur)

`POST /api/users`

```json
{
  "email": "photographe@studiomanager.local",
  "password": "MotDePasseSolide123!",
  "firstName": "Alex",
  "lastName": "Martin",
  "role": "PHOTOGRAPHE"
}
```

Le compte est créé actif. L'inscription publique n'est volontairement pas ouverte : les comptes sont créés par l'administrateur.

### Modifier un compte

`PATCH /api/users/<id>`

```json
{
  "active": false
}
```

Ou pour changer le rôle :

```json
{
  "role": "DECORATEUR"
}
```

## 5. Vérifications

```bash
npm test
```

Ces tests vérifient le contrat des rôles. Les tests d'intégration réels (connexion PostgreSQL, jeton expiré, compte désactivé et refus d'accès selon les rôles) restent à ajouter et à exécuter sur l'environnement du projet.

## 6. Limites connues à traiter ensuite

- Le JWT est stateless : la route de déconnexion indique au client de supprimer son jeton. Une révocation immédiate nécessite une gestion de sessions côté serveur.
- Le renouvellement des jetons n'est pas encore implémenté.
- Le flux de réinitialisation du mot de passe nécessite un service e-mail et une règle métier à définir.
- Les règles d'accès précises aux séances, décors et articles seront ajoutées avec les routes métier correspondantes.
- Avant production : HTTPS, secrets gérés hors du dépôt, journalisation et tests d'intégration.
