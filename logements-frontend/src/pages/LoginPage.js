import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "../components/Auth.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const loc = useLocation();

  const defaultPhoto = `${process.env.PUBLIC_URL}/profile-photo.png`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur connexion");

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          id_user: data.user.id_user,
          nom: data.user.nom,
          prenom: data.user.prenom,
          username: data.user.username || "",
          email: data.user.email,
          telephone: data.user.telephone || "",
          adresse: data.user.adresse || "",
          ecole: data.user.ecole || "",
          ecole_ville: data.user.ecole_ville || "",
          date_naissance: data.user.date_naissance || "",
          genre: data.user.genre || "",
          photo: data.user.photo || defaultPhoto,
        })
      );

      const from = loc.state?.from || "/profile";
      navigate(from);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell
      title="Se connecter"
      subtitle="Accedez a votre espace"
      backTo="/"
    >
      <div className="auth-card">
        <div className="auth-illustration" aria-hidden>
          <img
            src={defaultPhoto}
            alt="Profil"
            className="photo-preview"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <p className="auth-subtitle">
          Trouvez un logement etudiant proche de votre universite.
        </p>

        {error ? <div className="auth-error">{error}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Adresse e-mail"
            required
          />
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
          />
          <button className="auth-btn" type="submit">
            Se connecter
          </button>
        </form>

        <div className="auth-aux">
          <Link to="/forgot">Mot de passe oublie ?</Link>
        </div>

        <div className="auth-aux">
          Vous n'avez pas de compte ? <Link to="/register">Creer un compte</Link>
        </div>
      </div>
    </AppShell>
  );
}