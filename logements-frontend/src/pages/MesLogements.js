import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "../components/HomePage.css";

export default function MesLogements() {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchMesLogements() {
      try {
        const res = await fetch(`${API_URL}/mes-logements`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erreur chargement");
        const data = await res.json();
        setLogements(data);
      } catch (err) {
        setError("Erreur lors du chargement de vos logements");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchMesLogements();
    }
  }, [token]);

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Etes-vous sur de vouloir supprimer ce logement ?")) return;
    try {
      const res = await fetch(`${API_URL}/logements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur suppression");
        return;
      }
      alert("Logement supprime");
      setLogements(logements.filter((l) => l.id_logement !== id));
    } catch (err) {
      alert("Erreur reseau");
    }
  };

  return (
    <AppShell
      title="Mes logements"
      subtitle="Retrouver et gerer mes annonces"
      backTo="/profile"
    >
      {loading ? (
        <div className="app-shell-empty">Chargement...</div>
      ) : (
        <section className="hp-section" style={{ marginTop: 0 }}>
          {error ? <div className="auth-error">{error}</div> : null}

          <div className="hp-cards">
            {logements.length === 0 ? (
              <div className="hp-empty-state">
                <p>Vous n'avez pas encore publie de logement.</p>
              </div>
            ) : (
              logements.map((l) => (
                <article key={l.id_logement} className="hp-card">
                  <div
                    className="hp-card-img"
                    style={{
                      backgroundImage: l.image
                        ? `url(${API_URL}/uploads/${l.image})`
                        : `url(https://images.unsplash.com/photo-1505691723518-36a4f0a9e9a1?auto=format&fit=crop&w=1200&q=80)`,
                    }}
                    onClick={() =>
                      navigate(`/logement/${l.id_logement}`, { state: { logement: l } })
                    }
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

                    <div className="hp-card-footer">
                      <button
                        className="hp-card-link"
                        type="button"
                        onClick={() => navigate(`/edit-logement/${l.id_logement}`)}
                      >
                        Modifier
                      </button>
                      <button
                        className="hp-mini-btn"
                        type="button"
                        onClick={() => handleDelete(l.id_logement)}
                      >
                        Supprimer
                      </button>
                    </div>
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