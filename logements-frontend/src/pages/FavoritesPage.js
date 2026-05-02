import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "../components/HomePage.css";
import "./FavoritesPage.css";

const demoImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=60",
];

export default function FavoritesPage() {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/logements`);
        const data = await res.json();
        setLogements(data || []);
      } catch (e) {
        console.error("Erreur chargement logements pour favoris", e);
        setLogements([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
  const favSet = new Set(saved);
  const favorites = logements.filter((l) => favSet.has(l.id_logement));

  return (
    <AppShell
      title="Mes favoris"
      subtitle="Tous vos logements favoris "
      backTo="/"
    >
      {loading ? (
        <div className="app-shell-empty">Chargement...</div>
      ) : (
        <section className="hp-section" style={{ marginTop: 0 }}>
          <div className="hp-cards">
            {favorites.length === 0 ? (
              <div className="hp-empty-state">
                <p>Vous n'avez pas encore de favoris.</p>
              </div>
            ) : (
              favorites.map((l) => (
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
                        : `url(${demoImages[l.id_logement % demoImages.length]})`,
                    }}
                  />

                  <div className="hp-card-info">
                    <div className="hp-card-topline">
                      <div className="hp-card-name">{l.titre}</div>
                      <span className="hp-price">{l.prix} EUR</span>
                    </div>

                    <div className="hp-card-meta">
                      <span>{l.ville || "Ville non precisee"}</span>
                      <span>{l.universite || "Universite proche"}</span>
                    </div>

                    <p className="favorites-note">
                      {l.description || "Logement enregistre pour y revenir plus tard."}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </AppShell>
  );
}