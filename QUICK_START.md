# 🚀 Guide de démarrage complet

## Démarrage du backend (Node.js + Express + MySQL)

### Terminal 1 : Backend
```powershell
cd C:\Users\fatim\appli\logement-backend
npm install
npm start
```

L'API sera accessible sur **http://localhost:3001**

**Endpoints clés :**
- `GET http://localhost:3001/logements` → Tous les logements
- `GET http://localhost:3001/logements/search?ville=Libourne` → Recherche par ville
- `POST http://localhost:3001/logements` → Ajouter un logement
- `POST http://localhost:3001/register` → Inscription
- `POST http://localhost:3001/login` → Connexion

---

## Démarrage du frontend (React)

### Terminal 2 : Frontend
```powershell
cd C:\Users\fatim\appli\logements-frontend
npm install
npm start
```

L'app sera accessible sur **http://localhost:3000**

---

## Architecture

```
Backend (localhost:3001)
  ├── MySQL (logements_etudiants)
  ├── Express REST API
  └── Gestion des fichiers images

Frontend (localhost:3000)
  ├── React + React Router
  ├── Appels API fetch vers backend
  └── Affichage dynamique des résultats
```

---

## ✨ Fonctionnalités implémentées

### Backend
- ✅ GET /logements → tous les logements
- ✅ GET /logements/:id → logement par ID
- ✅ GET /logements/search?ville=X → recherche MySQL
- ✅ POST /logements → créer logement (avec upload image)
- ✅ PUT /logements/:id → modifier logement
- ✅ DELETE /logements/:id → supprimer logement
- ✅ GET /stats → statistiques (total, moyenne prix)
- ✅ GET /logements/page/:num → pagination
- ✅ POST /register → inscription utilisateur (bcrypt)
- ✅ POST /login → connexion utilisateur

### Frontend
- ✅ HomePage avec barre de recherche
- ✅ Recherche en temps réel (appelle `/logements/search`)
- ✅ Affichage dynamique des résultats
- ✅ Pagination
- ✅ Favoris (localStorage)
- ✅ Likes (localStorage)
- ✅ Détail logement
- ✅ Pages Login/Register
- ✅ Pages protégées (Add, Profile)

---

## 🧪 Tests rapides avec Postman

### 1. Récupérer tous les logements
```
GET http://localhost:3001/logements
```

### 2. Rechercher par ville
```
GET http://localhost:3001/logements/search?ville=Libourne
```

### 3. Ajouter un logement (form-data)
```
POST http://localhost:3001/logements
- titre: "Studio confortable"
- ville: "Libourne"
- universite: "Bordeaux"
- prix: 450
- type: "Studio"
- adresse: "123 rue de la Paix"
- description: "Studio lumineux"
- image: <sélectionner un fichier>
```

### 4. Ajouter un logement (JSON)
```
POST http://localhost:3001/logements
Content-Type: application/json

{
  "titre": "Studio confortable",
  "ville": "Libourne",
  "universite": "Bordeaux",
  "prix": 450,
  "type": "Studio",
  "adresse": "123 rue de la Paix",
  "description": "Studio lumineux"
}
```

### 5. Inscription
```
POST http://localhost:3001/register
Content-Type: application/json

{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@email.com",
  "password": "SecurePass123"
}
```

### 6. Connexion
```
POST http://localhost:3001/login
Content-Type: application/json

{
  "email": "jean@email.com",
  "password": "SecurePass123"
}
```

---

## 📖 Documentation complète

Consultez **API_DOCUMENTATION.md** pour la documentation détaillée de tous les endpoints.

---

## ✅ Checklist avant de démarrer

- [ ] Node.js installé (`node -v`)
- [ ] MySQL en marche (XAMPP/WAMP ou service MySQL local)
- [ ] Base `logements_etudiants` créée
- [ ] Identifiants MySQL configurés dans `logement-backend/server.js`
- [ ] Dossier `logement-backend/uploads/` existe
- [ ] `npm install` fait dans les deux dossiers

---

## 🐛 Dépannage

### Le backend ne démarre pas
→ Vérifiez MySQL et les identifiants dans `server.js`

### Erreur CORS au frontend
→ Normal, le backend a déjà `cors()` activé

### Recherche ne retourne rien
→ Vérifiez que les colonnes `ville` et `universite` existent dans MySQL

### Images non affichées
→ Vérifiez le dossier `uploads/` et que les fichiers y sont bien

---

Bon développement ! 🎉

