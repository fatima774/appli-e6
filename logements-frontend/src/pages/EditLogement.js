import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "../components/Auth.css";
import "./AddPage.css";

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

export default function EditLogement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authUser = JSON.parse(localStorage.getItem("authUser") || "null");

  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("");
  const [universite, setUniversite] = useState("");
  const [type, setType] = useState("");
  const [adresse, setAdresse] = useState("");
  const [prix, setPrix] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notOwner, setNotOwner] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_URL}/logements/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Logement non trouvé");
        return res.json();
      })
      .then((data) => {
        // Vérifier la propriété
        if (!isOwner(data, authUser)) {
          setNotOwner(true);
          setLoading(false);
          return;
        }

        // Remplir tous les champs
        setTitre(data.titre || "");
        setVille(data.ville || "");
        setUniversite(data.universite || "");
        setType(data.type || "");
        setAdresse(data.adresse || "");
        setPrix(String(data.prix || ""));
        setDescription(data.description || "");
        setCurrentImage(data.image || "");
        setImagePreview(data.image ? `${API_URL}/uploads/${data.image}` : "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement:", err);
        setError("Erreur lors du chargement du logement");
        setLoading(false);
      });
  }, [id, authUser, token, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!titre || !ville || !prix) {
      setError("Titre, ville et prix sont obligatoires");
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("titre", titre);
      formData.append("ville", ville);
      formData.append("universite", universite);
      formData.append("type", type);
      formData.append("adresse", adresse);
      formData.append("prix", prix);
      formData.append("description", description);

      // Ajouter l'image SI l'utilisateur en a sélectionné une nouvelle
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch(`${API_URL}/logements/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur HTTP ${res.status}`);
      }

      alert("Logement modifié avec succès !");
      navigate(`/logement/${id}`);
    } catch (err) {
      console.error("Erreur modification:", err);
      setError(err.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <AppShell title="Modifier le logement" backTo="/">
        <div className="app-shell-empty">Vous devez être connecté</div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Modifier le logement" backTo="/">
        <div className="app-shell-empty">Chargement...</div>
      </AppShell>
    );
  }

  if (notOwner) {
    return (
      <AppShell title="Modifier le logement" backTo="/">
        <div className="app-shell-empty">
          <div className="auth-error">
            Vous ne pouvez modifier que votre propre logement.
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Modifier le logement"
      subtitle="Modifiez les informations de votre logement"
      backTo={`/logement/${id}`}
    >
      <div className="auth-card add-card">
        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Titre du logement *</label>
            <input
              className="auth-input"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Studio moderne pres de la fac"
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ville *</label>
            <input
              className="auth-input"
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ex: Bordeaux"
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Université</label>
            <input
              className="auth-input"
              type="text"
              value={universite}
              onChange={(e) => setUniversite(e.target.value)}
              placeholder="Ex: Université Bordeaux"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type de logement</label>
            <input
              className="auth-input"
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Ex: Studio, Appartement, T2"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input
              className="auth-input"
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex: 123 Rue de la Paix"
              disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="auth-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre logement : équipements, quartier, commodités..."
              rows={4}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Photo du logement</label>
            
            {/* Afficher l'image actuelle ou la nouvelle sélectionnée */}
            {imagePreview && (
              <div className="add-preview-grid">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="add-preview-image"
                />
                {image && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="auth-btn"
                    style={{ marginTop: "10px" }}
                  >
                    Annuler la nouvelle photo
                  </button>
                )}
              </div>
            )}

            {/* Input file - une seule photo */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={saving}
              className="auth-input"
              style={{ marginTop: imagePreview ? "10px" : "0" }}
            />
            <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
              Une seule photo. Elle remplacera l'actuelle.
            </small>
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={saving}
          >
            {saving ? "Modification en cours..." : "Modifier le logement"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}