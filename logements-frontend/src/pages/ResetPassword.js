import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../data/api";
import AppShell from "../components/AppShell";
import "../components/Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (pwd.length < 6) {
      setMessage("Mot de passe trop court (>=6).");
      return;
    }
    if (pwd !== pwd2) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pwd }),
      });
      if (res.ok) {
        setMessage("Mot de passe reinitialise. Vous pouvez vous connecter.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const d = await res.json().catch(() => null);
        setMessage(d?.error || "Erreur");
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur reseau");
    }
  };

  if (!token) {
    return (
      <AppShell title="Reinitialiser le mot de passe" backTo="/login">
        <div className="auth-card">
          <div className="auth-error">Lien invalide ou manquant.</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Reinitialiser le mot de passe"
      subtitle="Choisissez un nouveau mot de passe"
      backTo="/login"
    >
      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="app-shell-field">
            <label className="app-shell-label">Nouveau mot de passe</label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
          </div>

          <div className="app-shell-field">
            <label className="app-shell-label">Confirmer</label>
            <input
              type="password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
            />
          </div>

          <button className="auth-btn" type="submit">
            Reinitialiser
          </button>
        </form>

        {message ? <div className="auth-success" style={{ marginTop: 12 }}>{message}</div> : null}
      </div>
    </AppShell>
  );
}
