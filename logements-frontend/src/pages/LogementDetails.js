import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "./LogementDetails.css";
import sampleLogements from "../data/sampleData";

const demoImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=60",
];

function normalizePhotos(details) {
  if (Array.isArray(details.photos) && details.photos.length > 0) {
    return details.photos.map((photo) => {
      if (typeof photo === "string") return photo;
      return photo?.url || photo?.image || photo?.path || photo?.photo || "";
    });
  }

  if (details.image) {
    return Array.isArray(details.image) ? details.image : [details.image];
  }

  const fallbackIndex = Number(details.id_logement || details.id || 0) % demoImages.length;
  return [demoImages[fallbackIndex]];
}

function photoSrc(photo) {
  if (!photo) return "";
  if (String(photo).startsWith("http")) return photo;
  return `${API_URL}/uploads/${photo}`;
}

function isOwner(logement, authUser) {
  const uid = authUser?.id_user || authUser?.id;
  if (!uid || !logement) return false;

  return (
    String(logement.id_user) === String(uid) ||
    String(logement.user_id) === String(uid) ||
    String(logement.id_user_posteur) === String(uid) ||
    String(logement.owner_id) === String(uid)
  );
}

function AvisSection({ idLogement }) {
  const [avis, setAvis] = useState([]);
  const [contenu, setContenu] = useState("");
  const [note, setNote] = useState(5);
  const [showAll, setShowAll] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/avis/${idLogement}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement avis");
        return res.json();
      })
      .then((data) => setAvis(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Erreur chargement avis:", err);
        setAvis([]);
      });
  }, [idLogement]);

  const publierAvis = async () => {
    if (!token) {
      alert("Connecte-toi d'abord !");
      return;
    }
    if (!contenu.trim()) {
      alert("Ecris un avis avant de publier.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/avis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_logement: idLogement, contenu, note }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Erreur lors de la publication");
        return;
      }

      const newAvis = await res.json();
      setAvis((prev) => [newAvis, ...prev]);
      setContenu("");
      setNote(5);
    } catch (err) {
      console.error("Erreur reseau:", err);
      alert("Erreur reseau lors de la publication");
    }
  };

  const displayedAvis = showAll ? avis : avis.slice(0, 3);

  return (
    <div className="avis-section">
      <h4>Commentaires</h4>

      <ul className="avis-list">
        {displayedAvis.length === 0 ? (
          <li className="avis-item">Aucun avis</li>
        ) : (
          displayedAvis.map((a) => (
            <li key={a.id_avis} className="avis-item">
              <span className="avis-meta">
                {a.prenom} {a.nom} | {a.note}/5 |{" "}
                {new Date(a.date).toLocaleDateString()}
              </span>
              <span>{a.contenu}</span>
            </li>
          ))
        )}
      </ul>

      {avis.length > 3 ? (
        <div className="avis-actions">
          <button
            type="button"
            className="avis-button"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Reduire les avis" : `Voir tous les avis (${avis.length})`}
          </button>
        </div>
      ) : null}

      <textarea
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        placeholder="Ecris ton avis..."
        className="avis-textarea"
      />

      <div className="avis-form-row">
        <select
          value={note}
          onChange={(e) => setNote(Number(e.target.value))}
          className="avis-select"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button type="button" className="avis-button" onClick={publierAvis}>
          Publier
        </button>
      </div>
    </div>
  );
}

export default function LogementDetails() {
  const { id } = useParams();
  const [details, setDetails] = useState(null);
  const [loadingFullDetails, setLoadingFullDetails] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const preloaded = location.state?.logement;
  const authUser = JSON.parse(localStorage.getItem("authUser") || "null");

  useEffect(() => {
    if (preloaded) {
      setDetails(preloaded);
    }

    let mounted = true;
    setLoadingFullDetails(true);
    fetch(`${API_URL}/logements/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement du logement");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setDetails(data);
      })
      .catch((err) => {
        console.error("Fetch logement failed:", err);
        if (!mounted) return;
        const found = sampleLogements.find(
          (s) =>
            String(s.id_logement) === String(id) || String(s.id) === String(id)
        );
        if (found) setDetails(found);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingFullDetails(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, preloaded]);

  if (!details) {
    return (
      <AppShell title="Details du logement" backTo="/">
        <div className="app-shell-empty">Chargement...</div>
      </AppShell>
    );
  }

  const logementPhotos = normalizePhotos(details).filter(Boolean);
  const mainPhoto = photoSrc(logementPhotos[0]);
  const otherPhotos = logementPhotos.slice(1).map(photoSrc);
  const canManageLogement = isOwner(details, authUser);

  return (
    <AppShell
      title="Details du logement"
      backTo="/"
      headerRight={canManageLogement ? (
        <button
          type="button"
          className="app-shell-button"
          onClick={() =>
            navigate(`/edit-logement/${details.id_logement || details.id}`)
          }
        >
          Modifier
        </button>
      ) : null}
    >
      <div className="details-card">
        <h2 className="details-title">{details.titre || "Titre non specifie"}</h2>

        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt="Logement"
            className="app-shell-photo app-shell-photo--hero"
          />
        ) : null}

        <div className="details-meta">
          <div className="details-meta-text">
            {details.ville || "Ville non specifiee"}
          </div>
          <span className="details-price">
            {details.prix !== undefined && details.prix !== null
              ? `${details.prix} EUR`
              : "Prix non specifie"}
          </span>
        </div>

        <div className="details-info-grid">
          <div className="details-info-row">
            <strong>Universite :</strong>
            <span>{details.universite || "Non specifiee"}</span>
          </div>

          <div className="details-info-row">
            <strong>Type :</strong>
            <span>{details.type || "Non specifie"}</span>
          </div>

          <div className="details-info-row">
            <strong>Adresse :</strong>
            <span>{details.adresse || "Non specifiee"}</span>
          </div>

          <div className="details-info-row details-description">
            <strong>Description :</strong>
            <span>{details.description || "Non specifiee"}</span>
          </div>
        </div>

        {loadingFullDetails ? (
          <p className="details-loading-note">Mise a jour des informations du logement...</p>
        ) : null}

        {otherPhotos.length > 0 ? (
          <>
            <h3 className="details-section-title">Photos</h3>
            <div className="details-photo-grid">
              {otherPhotos.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Vue ${idx + 1}`}
                  className="details-photo"
                  onClick={() => window.open(src, "_blank")}
                />
              ))}
            </div>
          </>
        ) : null}

        <AvisSection idLogement={details.id_logement ?? details.id ?? id} />
      </div>
    </AppShell>
  );
}