# Documentation API REST - Logements Étudiants

## 🚀 Démarrage du backend (Node.js)

### 1. Installation des dépendances
```powershell
cd C:\Users\fatim\appli\logement-backend
npm install
```

### 2. Configuration MySQL
- Base de données : `logements_etudiants`
- Tables requises : `logement`, `utilisateur`
- Les identifiants MySQL sont définis dans `server.js` :
  - Host: `localhost`
  - User: `fatima`
  - Password: `root`
  - Database: `logements_etudiants`

### 3. Lancer le serveur
```powershell
cd C:\Users\fatim\appli\logement-backend
npm start
# ou
node server.js
```

Le serveur sera accessible sur **http://localhost:3001**

---

## 📚 Endpoints disponibles

### **Logements**

#### 1. GET /logements
**Récupère tous les logements**
```
GET http://localhost:3001/logements
```
**Réponse :**
```json
[
  {
    "id_logement": 1,
    "titre": "Studio cosy",
    "ville": "Libourne",
    "universite": "Bordeaux",
    "prix": 450,
    "type": "Studio",
    "adresse": "123 rue de la Paix",
    "description": "Studio lumineux...",
    "photo": "1234567890-image.jpg",
    "date_ajout": "2025-11-25T10:00:00Z"
  },
  ...
]
```

#### 2. GET /logements/search
**Recherche des logements par ville ou université**
```
GET http://localhost:3001/logements/search?ville=Libourne
GET http://localhost:3001/logements/search?universite=Bordeaux
GET http://localhost:3001/logements/search?ville=Libourne&universite=Bordeaux
```
**Paramètres de requête :**
- `ville` (optionnel) : recherche dans la colonne `ville` avec `LIKE %ville%`
- `universite` (optionnel) : recherche dans la colonne `universite` avec `LIKE %universite%`

**Réponse :**
```json
[
  {
    "id_logement": 1,
    "titre": "Studio cosy",
    "ville": "Libourne",
    "universite": "Bordeaux",
    "prix": 450,
    ...
  }
]
```

#### 3. GET /logements/:id
**Récupère un logement par ID**
```
GET http://localhost:3001/logements/1
```
**Réponse :**
```json
{
  "id_logement": 1,
  "titre": "Studio cosy",
  "ville": "Libourne",
  ...
}
```

#### 4. POST /logements
**Ajoute un nouveau logement**
```
POST http://localhost:3001/logements
Content-Type: multipart/form-data

titre=Studio cosy
ville=Libourne
universite=Bordeaux
prix=450
type=Studio
adresse=123 rue de la Paix
description=Studio lumineux avec parking
image=<fichier image>
```

**Ou en JSON :**
```
POST http://localhost:3001/logements
Content-Type: application/json

{
  "titre": "Studio cosy",
  "ville": "Libourne",
  "universite": "Bordeaux",
  "prix": 450,
  "type": "Studio",
  "adresse": "123 rue de la Paix",
  "description": "Studio lumineux avec parking"
}
```

**Réponse :**
```json
{
  "id_logement": 5,
  "titre": "Studio cosy",
  "ville": "Libourne",
  "prix": 450,
  "photo": "1234567890-image.jpg"
}
```

#### 5. PUT /logements/:id
**Modifie un logement**
```
PUT http://localhost:3001/logements/1
Content-Type: application/json

{
  "titre": "Studio rénové",
  "ville": "Bordeaux",
  "prix": 500,
  "type": "T2",
  "adresse": "456 rue Neuve",
  "description": "Studio rénové récemment",
  "photo": "existing-image.jpg"
}
```

**Réponse :**
```json
{
  "message": "Logement mis à jour avec succès"
}
```

#### 6. DELETE /logements/:id
**Supprime un logement et son image**
```
DELETE http://localhost:3001/logements/1
```

**Réponse :**
```json
{
  "message": "Logement supprimé avec succès"
}
```

#### 7. GET /logements/page/:num
**Pagination (10 logements par page)**
```
GET http://localhost:3001/logements/page/1
GET http://localhost:3001/logements/page/2
```

**Réponse :** tableau de 10 logements

#### 8. GET /stats
**Statistiques**
```
GET http://localhost:3001/stats
```

**Réponse :**
```json
{
  "total": 25,
  "moyenne": 475.50
}
```

---

### **Utilisateurs**

#### 1. POST /register
**Inscription d'un nouvel utilisateur**
```
POST http://localhost:3001/register
Content-Type: application/json

{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@email.com",
  "password": "SecurePassword123"
}
```

**Réponse :**
```json
{
  "message": "Utilisateur créé avec succès",
  "id_user": 42
}
```

#### 2. POST /login
**Connexion d'un utilisateur**
```
POST http://localhost:3001/login
Content-Type: application/json

{
  "email": "jean.dupont@email.com",
  "password": "SecurePassword123"
}
```

**Réponse :**
```json
{
  "message": "Connexion réussie",
  "user": {
    "id_user": 42,
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@email.com"
  }
}
```

---

## 🧪 Tests avec Postman

### Étapes pour tester :
1. **Démarrez le serveur** : `npm start` (port 3001)
2. **Ouvrez Postman**
3. **Testez les endpoints** en copiant les exemples ci-dessus

### Exemple de requête Postman pour la recherche :
1. Créez une requête **GET**
2. URL : `http://localhost:3001/logements/search?ville=Libourne`
3. Cliquez sur **Send**
4. Vous obtenez tous les logements avec "Libourne" dans la colonne `ville`

---

## 🔗 Intégration React (Frontend)

### Code exemple dans `HomePageWithSearch.js` :

```javascript
// Charger tous les logements au démarrage
useEffect(() => {
  loadAllLogements();
}, []);

const loadAllLogements = async () => {
  try {
    const response = await fetch('http://localhost:3001/logements');
    const data = await response.json();
    setLogements(data);
  } catch (err) {
    console.error('Erreur:', err);
  }
};

// Recherche en temps réel via le backend
const handleSearch = async (searchTerm) => {
  if (!searchTerm.trim()) {
    setFilteredLogements(logements);
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3001/logements/search?ville=${encodeURIComponent(searchTerm)}&universite=${encodeURIComponent(searchTerm)}`
    );
    const data = await response.json();
    setFilteredLogements(data);
  } catch (err) {
    console.error('Erreur:', err);
  }
};
```

### Utilisation dans le frontend :
- La barre de recherche appelle `handleSearch()` au fil de la frappe
- L'API backend filtre avec `LIKE` sur les colonnes `ville` et `universite`
- Les résultats s'affichent immédiatement **sans redirection**

---

## ⚙️ Configuration CORS

Le backend accepte les requêtes depuis n'importe quelle origine (CORS activé) :
```javascript
app.use(cors());
```

Si vous voulez restreindre à votre frontend uniquement :
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## 📁 Structure des dossiers backend

```
logement-backend/
├── server.js              # Fichier principal
├── uploads/               # Dossier pour les images téléchargées
├── package.json           # Dépendances
└── node_modules/          # Dépendances installées
```

---

## ✅ Corrections apportées

1. ✅ **Suppression des promesses incompatibles** : utilisation de callbacks simples pour `/register` et `/login`
2. ✅ **Destructuration correcte** : `req.body.champ` au lieu de destructuration
3. ✅ **Route de recherche** : `GET /logements/search?ville=X` avec filtrage MySQL `LIKE`
4. ✅ **Ordre des routes** : `/search` placé **avant** `/:id` pour éviter les conflits
5. ✅ **Gestion d'erreurs** : réponses HTTP standardisées (400, 404, 500)
6. ✅ **Upload d'images** : multer configuré pour gérer les fichiers

---

## 🐛 Troubleshooting

### Erreur : "Cannot read property 'promise' of undefined"
→ **Solution** : Utilisez des callbacks au lieu de `.promise()` (déjà corrigé)

### Erreur : "Unknown column in where clause"
→ **Vérifiez** que vos colonnes MySQL existent : `titre`, `ville`, `universite`, `prix`, etc.

### Erreur CORS
→ **Solution** : Le serveur accepte déjà les requêtes cross-origin. Vérifiez l'URL du frontend.

### Images non affichées
→ **Vérifiez** : 
- Le dossier `uploads/` existe dans `logement-backend/`
- Les images sont bien enregistrées avec `multer`
- L'URL est `/uploads/nomimage.jpg`

---

## 📞 Support

Pour toute question ou erreur, consultez la console Node.js et les logs de la base MySQL.

