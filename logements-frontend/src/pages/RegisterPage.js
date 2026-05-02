import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrength from "../components/PasswordStrength";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "../components/Auth.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    photo: null,
    ecole: "",
    ecole_ville: "",
    telephone: "",
    adresse: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const defaultPhoto = `${process.env.PUBLIC_URL}/profile-photo.png`;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validatePassword = (pwd) => {
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*]/.test(pwd);
    const hasMinLength = pwd.length >= 8;

    return hasUpperCase && hasDigit && hasSpecialChar && hasMinLength;
  };

  const isPasswordValid = validatePassword(form.password);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, photo: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nom || !form.prenom || !form.email || !form.password) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas tous les criteres de securite");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nom", form.nom);
      formData.append("prenom", form.prenom);
      formData.append("email", form.email);
      formData.append("password", form.password);

      if (form.photo) {
        formData.append("photo", form.photo);
      }

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const errData = await res.json();
          throw new Error(errData.error || "Erreur lors de l'inscription");
        } else {
          const text = await res.text();
          throw new Error(text);
        }
      }

      const data = await res.json();
      alert(data.message || "Compte cree avec succes !");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Creer un compte"
      subtitle="Ouvrir votre espace etudiant"
      backTo="/"
    >
      <div className="auth-card">
        <div className="auth-illustration">
          <img
            src={form.photo ? URL.createObjectURL(form.photo) : defaultPhoto}
            alt="Profil"
            className="photo-preview"
          />
        </div>

        <p className="auth-subtitle">
          Rejoignez la communaute etudiante pour trouver un logement.
        </p>

        {error ? <div className="auth-error">{error}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            name="prenom"
            placeholder="Prenom"
            value={form.prenom}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <input
            className="auth-input"
            name="nom"
            placeholder="Nom"
            value={form.nom}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <input
            className="auth-input"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <input
            className="auth-input"
            name="password"
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <PasswordStrength password={form.password} />

          <input
            className="auth-input"
            name="telephone"
            placeholder="Telephone"
            value={form.telephone}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="auth-input"
            name="adresse"
            placeholder="Adresse"
            value={form.adresse}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="auth-input"
            name="ecole"
            placeholder="Ecole"
            value={form.ecole}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="auth-input"
            name="ecole_ville"
            placeholder="Ville de l'ecole"
            value={form.ecole_ville}
            onChange={handleChange}
            disabled={loading}
          />

          <div className="app-shell-field">
            <label className="app-shell-label">Photo de profil (optionnel)</label>
            <input
              className="auth-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={loading}
            />
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={loading || !isPasswordValid}
          >
            {loading ? "Creation..." : "S'inscrire"}
          </button>
        </form>

        <div className="auth-aux">
          Deja un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </AppShell>
  );
}