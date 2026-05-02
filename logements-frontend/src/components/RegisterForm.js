import React, { useState } from 'react';
import { registerUser } from '../utils/api';

export default function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      const data = await registerUser(form);
      setSuccess('Compte créé. Vous pouvez vous connecter.');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <input name="prenom" value={form.prenom} onChange={handleChange} placeholder="Prénom" required className="auth-input" />
      <input name="nom" value={form.nom} onChange={handleChange} placeholder="Nom" required className="auth-input" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required className="auth-input" />
      <input name="password" value={form.password} onChange={handleChange} placeholder="Mot de passe" type="password" required className="auth-input" />
      <button type="submit" disabled={loading} className="auth-btn auth-btn--primary">{loading ? 'Envoi...' : "S'inscrire"}</button>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
    </form>
  );
}
