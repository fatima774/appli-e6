import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordStrength from "../components/PasswordStrength";
import AppShell from "../components/AppShell";
import { API_URL } from "../data/api";
import "../components/Auth.css";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return null;
  }

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

  const isNewPasswordValid = validatePassword(form.newPassword);
  const passwordsMatch =
    form.newPassword === form.confirmPassword && form.newPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Tous les champs sont obligatoires");
      setLoading(false);
      return;
    }

    if (!isNewPasswordValid) {
      setError("Le nouveau mot de passe ne respecte pas tous les criteres de securite");
      setLoading(false);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Le nouveau mot de passe et sa confirmation ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du changement de mot de passe");
      } else {
        setSuccess(data.message || "Mot de passe change avec succes");
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Changer mon mot de passe"
      subtitle="Mettez a jour votre acces"
      backTo="/profile"
    >
      <div className="auth-card">
        <p className="auth-subtitle">
          Modifiez votre mot de passe en toute securite.
        </p>

        {error ? <div className="auth-error">{error}</div> : null}
        {success ? <div className="auth-success">{success}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="password"
            name="currentPassword"
            placeholder="Mot de passe actuel"
            value={form.currentPassword}
            onChange={handleChange}
            className="auth-input"
            required
          />

          <input
            type="password"
            name="newPassword"
            placeholder="Nouveau mot de passe"
            value={form.newPassword}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <PasswordStrength password={form.newPassword} />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmer le nouveau mot de passe"
            value={form.confirmPassword}
            onChange={handleChange}
            className="auth-input"
            required
          />

          <button
            type="submit"
            className="auth-btn"
            disabled={loading || !isNewPasswordValid || !passwordsMatch}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}