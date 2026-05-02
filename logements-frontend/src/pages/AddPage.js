import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "../components/Auth.css";
import "./AddPage.css";

export default function AddPage() {
  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("");
  const [universite, setUniversite] = useState("");
  const [prix, setPrix] = useState("");
  const [type, setType] = useState("");
  const [adresse, setAdresse] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setPreviews(file ? [URL.createObjectURL(file)] : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!titre || !prix) {
      setError("Veuillez remplir les champs obligatoires : Titre et Prix");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("titre", titre);
      if (ville) formData.append("ville", ville);
      if (universite) formData.append("universite", universite);
      if (type) formData.append("type", type);
      if (adresse) formData.append("adresse", adresse);
      if (description) formData.append("description", description);
      formData.append("prix", prix);

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`${API_URL}/logements`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Erreur serveur" }));
        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }

      await response.json().catch(() => null);
      alert("Logement publie avec succes !");
      navigate("/");
    } catch (err) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("timeout") || msg.toLowerCase().includes("abort")) {
        setError("Delai d'attente depasse. Le serveur a mis trop de temps a repondre.");
      } else if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("TypeError")
      ) {
        setError(
          "Impossible de contacter le serveur backend. Verifiez qu'il tourne correctement."
        );
      } else {
        setError(msg || "Impossible d'ajouter le logement");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Publier un logement"
      subtitle="Un formulaire clair comme connexion et inscription"
      backTo="/"
    >
      <div className="auth-card add-card">
        {error ? <div className="auth-error">{error}</div> : null}

        {previews.length > 0 ? (
          <div className="add-preview-grid">
            {previews.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Apercu ${idx + 1}`}
                className="add-preview-image"
              />
            ))}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Titre du logement *</label>
            <input
              className="auth-input"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Studio moderne pres de la fac"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ville *</label>
            <input
              className="auth-input"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ex: Bordeaux"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Universite</label>
            <input
              className="auth-input"
              value={universite}
              onChange={(e) => setUniversite(e.target.value)}
              placeholder="Ex: Universite Bordeaux"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prix mensuel (EUR) *</label>
            <input
              className="auth-input"
              type="number"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="Ex: 450"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type de logement</label>
            <input
              className="auth-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Ex: Studio, Appartement, T2"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input
              className="auth-input"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex: 123 Rue de la Paix"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="auth-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Decrivez votre logement : equipements, quartier, commodites..."
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Photos</label>
            <input
              className="auth-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Publication en cours..." : "Publier"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}