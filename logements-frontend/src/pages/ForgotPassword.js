import React, { useState } from "react";
import { API_URL } from "../data/api";
import AppShell from "../components/AppShell";
import "../components/Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMessage("Veuillez saisir une adresse e-mail valide.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      console.error(err);
      setMessage("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Mot de passe oublie"
      subtitle="Recevoir un lien de reinitialisation"
      backTo="/login"
    >
      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="app-shell-field">
            <label className="app-shell-label">Adresse e-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            Demander le lien
          </button>
        </form>

        {message ? <div className="auth-success" style={{ marginTop: 12 }}>{message}</div> : null}
      </div>
    </AppShell>
  );
}
