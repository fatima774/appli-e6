import { useEffect, useState } from "react";
import { NavLink, useNavigate } from 'react-router-dom';
import { API_URL } from "../data/api";
import "./HomePage.css";
import { HomeIcon, PlusIcon, UserIcon, SearchIcon } from './icons';

/**
 * HomePage amélioré avec recherche backend en temps réel
 * La barre de recherche appelle GET /api/logements/search?ville=X ou ?universite=X
 * Les résultats s'affichent immédiatement sans redirection
 */
export default function HomePageWithSearch() {
  const navigate = useNavigate();
  const [logements, setLogements] = useState([]);
  const [filteredLogements, setFilteredLogements] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [likes, setLikes] = useState({});
  const [liked, setLiked] = useState(new Set());

  // Deux images demo (alternées)
  const demoImages = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=60'
  ];

  // Charger tous les logements au démarrage
  useEffect(() => {
    loadAllLogements();
    loadFavorites();
    loadLikes();
    loadLiked();
  }, []);

  const loadAllLogements = async () => {
    try {
      setLoading(true);
      // Appel à l'API Node.js (backend)
      const response = await fetch(`${API_URL}/logements`);
      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      setLogements(data);
      setFilteredLogements(data);
    } catch (err) {
      console.error('Erreur lors du chargement des logements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recherche en temps réel via l'API backend
  const handleSearch = async (searchTerm) => {
    setQuery(searchTerm);

    if (!searchTerm.trim()) {
      // Si vide, afficher tous les logements
      setFilteredLogements(logements);
      return;
    }

    try {
      setSearchLoading(true);
      // Appel à la route /logements/search du backend
      // Cette route cherche dans les colonnes "ville" et "universite"
      const response = await fetch(
        `${API_URL}/logements/search?ville=${encodeURIComponent(searchTerm)}&universite=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) {
        // Si la route /search renvoie une erreur, chercher localement
        const localResults = logements.filter(l =>
          (l.titre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.ville || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.universite || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredLogements(localResults);
      } else {
        const data = await response.json();
        setFilteredLogements(data);
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      // Fallback : recherche locale
      const localResults = logements.filter(l =>
        (l.titre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.ville || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogements(localResults);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  };

  const loadLikes = () => {
    const saved = localStorage.getItem('likes');
    if (saved) setLikes(JSON.parse(saved));
  };

  const loadLiked = () => {
    const saved = localStorage.getItem('liked');
    if (saved) setLiked(new Set(JSON.parse(saved)));
  };

  const toggleFavorite = (id) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(id)) newFavs.delete(id);
    else newFavs.add(id);
    setFavorites(newFavs);
    localStorage.setItem('favorites', JSON.stringify([...newFavs]));
  };

  const toggleLike = (id) => {
    const newLiked = new Set(liked);
    if (newLiked.has(id)) {
      newLiked.delete(id);
      const newLikes = { ...likes };
      newLikes[id] = (newLikes[id] || 0) - 1;
      setLikes(newLikes);
      localStorage.setItem('likes', JSON.stringify(newLikes));
    } else {
      newLiked.add(id);
      const newLikes = { ...likes, [id]: (likes[id] || 0) + 1 };
      setLikes(newLikes);
      localStorage.setItem('likes', JSON.stringify(newLikes));
    }
    setLiked(newLiked);
    localStorage.setItem('liked', JSON.stringify([...newLiked]));
  };

  return (
    <div className="hp-mobile-root">
      <div className="hp-phone">
        {/* Header avec logo et auth */}
        <div className="hp-footer">
          <div className="hp-footer-inner">
            <div className="hp-logo">
              <HomeIcon /> <span className="hp-logo-text">Logements Étudiants</span>
            </div>
            <div className="hp-header-links">
              <NavLink to="/login" className="hp-link">Se connecter</NavLink>
              <NavLink to="/register" className="hp-link hp-link-primary">S'inscrire</NavLink>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <section className="hp-search-section">
          <div className="hp-search-wrapper">
            <SearchIcon />
            <input
              className="hp-search"
              placeholder="Rechercher (ville, université...)"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchLoading && <span className="hp-search-spinner">⟳</span>}
          </div>
        </section>

        {/* Résultats */}
        <section className="hp-section">
          <div className="hp-cards">
            {loading ? (
              // Skeleton placeholders
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="hp-card hp-skeleton">
                  <div className="hp-card-img skeleton" />
                  <div className="hp-card-info">
                    <div className="s-line" />
                    <div className="s-line short" />
                  </div>
                </div>
              ))
            ) : filteredLogements.length > 0 ? (
              filteredLogements.map((l, idx) => (
                <div key={l.id_logement} className="hp-card">
                  <img
                    className="hp-card-img"
                    src={demoImages[idx % demoImages.length]}
                    alt={l.titre}
                    loading="lazy"
                    onClick={() => navigate(`/logement/${l.id_logement}`, { state: { logement: l } })}
                    style={{ cursor: 'pointer' }}
                  />
                  <div className="hp-card-actions">
                    <button
                      className={`hp-action-btn hp-action-fav ${favorites.has(l.id_logement) ? 'active' : ''}`}
                      onClick={() => toggleFavorite(l.id_logement)}
                      aria-label="Favori"
                    >
                      {favorites.has(l.id_logement) ? '★' : '☆'}
                    </button>
                    <button
                      className={`hp-action-btn hp-action-like ${liked.has(l.id_logement) ? 'active' : ''}`}
                      onClick={() => toggleLike(l.id_logement)}
                      aria-label="J'aime"
                    >
                      {liked.has(l.id_logement) ? '❤' : '♡'} 
                      <span className="hp-like-count">{likes[l.id_logement] || 0}</span>
                    </button>
                  </div>
                  <div className="hp-card-info" onClick={() => navigate(`/logement/${l.id_logement}`, { state: { logement: l } })}>
                    <div className="hp-card-name">{l.titre}</div>
                    <div className="hp-card-meta">
                      {l.ville} • <span className="hp-price">{l.prix}€/mois</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                Aucun logement trouvé pour "{query}"
              </div>
            )}
          </div>
        </section>

        {/* Bottom nav */}
        <nav className="hp-bottom-nav">
          <NavLink to="/" aria-label="Accueil" className={({ isActive }) => `hp-nav-btn ${isActive ? 'hp-nav-active' : ''}`}>
            <HomeIcon />
          </NavLink>
          <NavLink to="/add" aria-label="Ajouter" className={({ isActive }) => `hp-nav-btn hp-nav-primary ${isActive ? 'hp-nav-active' : ''}`}>
            <PlusIcon />
          </NavLink>
          <NavLink to="/profile" aria-label="Profil" className={({ isActive }) => `hp-nav-btn ${isActive ? 'hp-nav-active' : ''}`}>
            <UserIcon />
          </NavLink>
        </nav>
      </div>
    </div>
  );
}