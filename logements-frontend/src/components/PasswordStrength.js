import React from 'react';

export default function PasswordStrength({ password }) {
  // Validation criteria
  const hasUpperCase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  const hasMinLength = password.length >= 8;

  const conditions = [
    { label: '1 lettre majuscule', met: hasUpperCase },
    { label: '1 chiffre', met: hasDigit },
    { label: '1 caractère spécial (!@#$%^&*)', met: hasSpecialChar },
    { label: '8 caractères minimum', met: hasMinLength }
  ];

  return (
    <div className="password-strength-container">
      {conditions.map((condition, index) => (
        <div
          key={index}
          className={`password-strength-item ${condition.met ? 'met' : 'unmet'}`}
        >
          <span className="password-strength-indicator"></span>
          <span className="password-strength-text">{condition.label}</span>
        </div>
      ))}
    </div>
  );
}
