import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "./ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    username: "",
    email: "",
    telephone: "",
    date_naissance: "",
    genre: "",
  });

  const [originalForm, setOriginalForm] = useState({
    prenom: "",
    nom: "",
    username: "",
    email: "",
    telephone: "",
    date_naissance: "",
    genre: "",
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("/default-profile.jpg");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error("Erreur chargement profil");
          return;
        }

        const data = await res.json();

        const formData = {
          prenom: data.prenom || "",
          nom: data.nom || "",
          username: data.username || "",
          email: data.email || "",
          telephone: data.telephone || "",
          date_naissance: data.date_naissance
            ? data.date_naissance.split("T")[0]
            : "",
          genre: data.genre || "",
        };

        setForm(formData);
        setOriginalForm(formData);
        setPhotoPreview(
          !data.photo || data.photo === "default-profile.jpg"
            ? "/default-profile.jpg"
            : `${API_URL}/uploads/${data.photo}`
        );
      } catch (err) {
        console.error("Erreur:", err);
      }
    }

    loadProfile();
  }, [token, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const updatedFields = {};
    Object.keys(form).forEach((key) => {
      if (form[key] !== originalForm[key] && form[key] !== "") {
        updatedFields[key] = form[key];
      }
    });

    const hasChanges = Object.keys(updatedFields).length > 0 || photo;
    if (!hasChanges) {
      setError("Aucun changement detecte");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(updatedFields).forEach(([key, value]) => {
        if (value && value !== "") {
          formData.append(key, value);
        }
      });

      if (photo) {
        formData.append("photo", photo);
      }

      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la mise a jour");
      }

      const updated = await res.json();
      setMessage(updated.message || "Profil mis a jour avec succes !");
      const newOriginalForm = { ...originalForm, ...updatedFields };
      setOriginalForm(newOriginalForm);
      setPhoto(null);

      const authUser = JSON.parse(localStorage.getItem("authUser")) || {};
      const newUser = {
        ...authUser,
        ...updatedFields,
        photo: updated.photoUrl
          ? updated.photoUrl.replace("/uploads/", "")
          : authUser.photo,
      };
      localStorage.setItem("authUser", JSON.stringify(newUser));

      if (updated.photoUrl) {
        setPhotoPreview(`${API_URL}${updated.photoUrl}`);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authUser");
    navigate("/");
    window.location.reload();
  };

  return (
    <AppShell
      title="Mon profil"
      subtitle="Modifiez vos informations personnelles et votre photo de profil"
      backTo="/"
    >
      <div className="profile-card">
        <div className="profile-photo-wrapper">
          <img src={photoPreview} alt="Profil" className="profile-photo" />
          <label className="profile-photo-edit">
            +
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              hidden
            />
          </label>
        </div>

        <h2 className="profile-heading">Modifier mon profil</h2>

        {message ? <div className="profile-success">{message}</div> : null}
        {error ? <div className="profile-error">{error}</div> : null}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="app-shell-field">
            <label className="app-shell-label">Prenom</label>
            <input name="prenom" value={form.prenom} onChange={handleChange} />
          </div>

          <div className="app-shell-field">
            <label className="app-shell-label">Nom</label>
            <input name="nom" value={form.nom} onChange={handleChange} />
          </div>

          <div className="app-shell-field">
            <label className="app-shell-label">Username</label>
            <input name="username" value={form.username} onChange={handleChange} />
          </div>

          <div className="app-shell-field">
            <label className="app-shell-label">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="app-shell-field">
            <label className="app-shell-label">Telephone</label>
            <input
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
            />
          </div>

          <div className="app-shell-field">
            <label className="app-shell-label">Date de naissance</label>
            <input
              type="date"
              name="date_naissance"
              value={form.date_naissance}
              onChange={handleChange}
            />
          </div>

          <div className="app-shell-field">
            <label className="app-shell-label">Genre</label>
            <select name="genre" value={form.genre} onChange={handleChange}>
              <option value=""></option>
              <option value="Femme">Femme</option>
              <option value="Homme">Homme</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </form>

        <div className="profile-actions">
          <button
            onClick={() => navigate("/mes-logements")}
            className="profile-action-btn"
            type="button"
          >
            Mes logements
          </button>
          <button
            onClick={() => navigate("/change-password")}
            className="profile-action-btn"
            type="button"
          >
            Changer mot de passe
          </button>
          <button
            onClick={() => navigate("/favorites")}
            className="profile-action-btn"
            type="button"
          >
            Mes favoris
          </button>
          <button
            onClick={handleLogout}
            className="profile-action-btn"
            type="button"
          >
            Se deconnecter
          </button>
        </div>
      </div>
    </AppShell>
  );
}