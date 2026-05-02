import { useEffect, useState } from "react";
import { API_URL } from "../data/api";
import { Link } from "react-router-dom";
import '../components/HomePage.css';
import './LogementList.css';

export default function LogementList() {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/logements`)
      .then((res) => res.json())
      .then((data) => {
        setLogements(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur API :", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (!logements.length) return <p>Aucun logement trouvé.</p>;

  return (
    <div className="logement-list">
      <h2>Liste des logements</h2>

      <div className="grid">
        {logements.map((log) => {
          const imageUrl = log.image
            ? `${API_URL}/uploads/${log.image}`
            : "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=60";

          return (
            <div key={log.id_logement} className="logement-card">
              <Link to={`/logement/${log.id_logement}`}>
                <img src={imageUrl} alt={log.titre} className="image" />
              </Link>

              <h3>{log.titre}</h3>
              <p>{log.ville}</p>
              <p>{log.prix} DH/mois</p>

              <Link to={`/logement/${log.id_logement}`} className="details-link">
                Voir détails
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
