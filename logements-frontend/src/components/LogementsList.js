import React, { useEffect, useState } from 'react';
import { getLogements } from '../utils/api';

export default function LogementsList() {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getLogements();
        if (mounted) setLogements(data);
      } catch (err) {
        if (mounted) setError(err.message || 'Erreur réseau');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Chargement des logements…</div>;
  if (error) return <div className="error">Erreur : {error}</div>;
  if (!logements || logements.length === 0) return <div>Aucun logement trouvé.</div>;

  return (
    <div className="logements-list">
      <ul>
        {logements.map(l => (
          <li key={l.id_logement || l.id}>
            <strong>{l.titre}</strong> — {l.ville} — {l.prix}€
          </li>
        ))}
      </ul>
    </div>
  );
}
