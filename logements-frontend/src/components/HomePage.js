import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./HomePage.css";
import AppShell from "./AppShell";
import { API_URL } from "../data/api";
import {
  BookmarkIcon,
  BuildingIcon,
  EditIcon,
  HomeIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UserIcon,
} from "./icons";

export default function HomePage() {
  const [logements, setLogements] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function verify() {
      const token = localStorage.getItem("token");
      const storedRaw = localStorage.getItem("authUser");
      const storedUser = storedRaw ? JSON.parse(storedRaw) : null;

      if (!token || !storedUser) {
        if (!mounted) return;
        setIsAuthenticated(false);
        setAuthUser(null);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;

        if (res.ok) {
          const data = await res.json().catch(() => storedUser);
          setIsAuthenticated(true);
          setAuthUser(data || storedUser);
          localStorage.setItem("authUser", JSON.stringify(data || storedUser));
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("authUser");
          setIsAuthenticated(false);
          setAuthUser(null);
        }
      } catch (err) {
        console.warn("Auth verification failed:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("authUser");
        if (!mounted) return;
        setIsAuthenticated(false);
        setAuthUser(null);
      }
    }

    verify();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    async function chargerLogements() {
      try {
        const res = await fetch(`${API_URL}/logements`);
        const data = await res.json();
        setLogements(data);
      } catch (err) {
        console.error("Erreur chargement logements :", err);
      } finally {
        setLoading(false);
      }
    }

    chargerLogements();
  }, []);

  useEffect(() => {
    setFavorites(new Set(JSON.parse(localStorage.getItem("favorites") || "[]")));
  }, []);

  const demoImages = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=60",
  ];

  const profilePhoto = authUser?.photo
    ? `${API_URL}/uploads/${authUser.photo}`
    : null;

  function toggleFavorite(id) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const next = new Set(favorites);
    next.has(id) ? next.delete(id) : next.add(id);
    setFavorites(next);
    localStorage.setItem("favorites", JSON.stringify([...next]));
  }

  function isOwner(logement) {
    const uid = authUser?.id_user || authUser?.id;
    return (
      uid &&
      (String(logement.id_user) === String(uid) ||
        String(logement.user_id) === String(uid) ||
        String(logement.id_user_posteur) === String(uid) ||
        String(logement.owner_id) === String(uid))
    );
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Supprimer cet annonce ?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/logements/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erreur suppression");
      setLogements((prev) => prev.filter((l) => l.id_logement !== id));
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer l'annonce");
    }
  }

  const filtered = logements.filter((l) => {
    const q = query.toLowerCase();
    return (
      !q ||
      l.titre?.toLowerCase().includes(q) ||
      l.ville?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.universite?.toLowerCase().includes(q)
    );
  });

  const quickActions = isAuthenticated
    ? [
        {
          label: "Publier",
          helper: "Ajouter une annonce",
          icon: <PlusIcon />,
          action: () => navigate("/add"),
        },
        {
          label: "Mes logements",
          helper: "Retrouver mes publications",
          icon: <BuildingIcon />,
          action: () => navigate("/mes-logements"),
        },
        {
          label: "Favoris",
          helper: "Voir mes choix",
          icon: <BookmarkIcon />,
          action: () => navigate("/favorites"),
        },
        {
          label: "Profil",
          helper: "Ouvrir mon espace",
          icon: <UserIcon />,
          action: () => navigate("/profile"),
        },
      ]
    : [
        {
          label: "Connexion",
          helper: "Acceder au compte",
          icon: <UserIcon />,
          action: () => navigate("/login"),
        },
        {
          label: "Inscription",
          helper: "Creer un compte",
          icon: <PlusIcon />,
          action: () => navigate("/register"),
        },
      ];

  return (
    <AppShell hideHeader bodyClassName="hp-home-body">
      <header className="hp-header">
        <div className="hp-header-top">
          <div className="hp-logo-block">
            <span className="hp-logo-badge">
              <HomeIcon />
            </span>
            <div>
              <p className="hp-logo-eyebrow">Accueil</p>
              <div className="hp-logo-text">Logements Etudiants</div>
            </div>
          </div>

          <div className="hp-header-links">
            {!isAuthenticated ? (
              <>
                <NavLink to="/login" className="hp-link">
                  Se connecter
                </NavLink>
                <NavLink to="/register" className="hp-link hp-link-primary">
                  S'inscrire
                </NavLink>
              </>
            ) : (
              <button
                className="hp-profile-btn"
                onClick={() => navigate("/profile")}
                aria-label="Ouvrir mon profil"
                type="button"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profil" className="hp-profile-icon" />
                ) : (
                  <UserIcon />
                )}
              </button>
            )}
          </div>
        </div>

        <section className="hp-hero">
          <p className="hp-hero-kicker">{isAuthenticated ? "Bonjour" : "Bienvenue"}</p>
          <h2 className="hp-hero-title">
            Trouvez un logement et accedez vite a toutes les fonctions.
          </h2>
          
        </section>
      </header>

      <section className="hp-search-panel">
        <label className="hp-search-label" htmlFor="homepage-search">
          Rechercher un logement
        </label>
        <div className="hp-search-field">
          <span className="hp-search-icon">
            <SearchIcon />
          </span>
          <input
            id="homepage-search"
            className="hp-search"
            placeholder="Ville, universite, titre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              className="hp-clear-btn"
              onClick={() => setQuery("")}
              type="button"
            >
              Effacer
            </button>
          ) : null}
        </div>
      </section>

      {!query.trim() ? (
        <section className="hp-quick-section">
          <div className="hp-section-head">
            <div>
              <p className="hp-section-kicker">Acces rapide</p>
              <h3 className="hp-section-title">Toutes les fonctions utiles</h3>
            </div>
          </div>

          <div className="hp-quick-grid">
            {quickActions.map((item) => (
              <button
                key={item.label}
                type="button"
                className="hp-quick-card"
                onClick={item.action}
              >
                <span className="hp-quick-icon">{item.icon}</span>
                <span className="hp-quick-label">{item.label}</span>
                <span className="hp-quick-helper">{item.helper}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="hp-section">
        <div className="hp-section-head">
          <div>
            <p className="hp-section-kicker">Annonces</p>
            <h3 className="hp-section-title">Logements recents</h3>
          </div>
          <span className="hp-count-badge">{filtered.length}</span>
        </div>

        <div className="hp-cards">
          {loading ? (
            <div className="hp-empty-state">
              <p>Chargement des logements...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="hp-empty-state">
              <p>Aucun logement ne correspond a votre recherche.</p>
            </div>
          ) : (
            filtered.map((l, i) => (
              <article
                key={l.id_logement}
                className="hp-card"
                onClick={() =>
                  navigate(`/logement/${l.id_logement}`, { state: { logement: l } })
                }
              >
                <div
                  className="hp-card-img"
                  style={{
                    backgroundImage: l.image
                      ? `url(${API_URL}/uploads/${l.image})`
                      : `url(${demoImages[i % demoImages.length]})`,
                  }}
                />

                <div className="hp-card-actions">
                  <button
                    type="button"
                    className={`hp-action-btn ${favorites.has(l.id_logement) ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(l.id_logement);
                    }}
                    aria-label="Ajouter aux favoris"
                  >
                    <BookmarkIcon />
                    <span>Favori</span>
                  </button>
                </div>

                <div className="hp-card-info">
                  <div className="hp-card-topline">
                    <div className="hp-card-name">{l.titre}</div>
                    <span className="hp-price">{l.prix} EUR</span>
                  </div>

                  <div className="hp-card-meta">
                    <span>{l.ville || "Ville non precisee"}</span>
                    <span>{l.universite || "Universite proche"}</span>
                  </div>

                  <p className="hp-card-description">
                    {l.description ||
                      "Logement propre, pratique et adapte a la vie etudiante."}
                  </p>

                  <div className="hp-card-footer">
                    <button
                      type="button"
                      className="hp-card-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/logement/${l.id_logement}`, {
                          state: { logement: l },
                        });
                      }}
                    >
                      Voir details
                    </button>

                    {isOwner(l) ? (
                      <div className="hp-owner-actions">
                        <button
                          type="button"
                          className="hp-mini-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit-logement/${l.id_logement}`);
                          }}
                        >
                          <EditIcon />
                          <span>Modifier</span>
                        </button>

                        <button
                          type="button"
                          className="hp-mini-btn"
                          onClick={(e) => handleDelete(e, l.id_logement)}
                        >
                          <TrashIcon />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}