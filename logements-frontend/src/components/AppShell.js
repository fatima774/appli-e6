import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../data/api";
import {
  BuildingIcon,
  HeartIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "./icons";
import "./AppShell.css";

function resolveProfilePhoto(photo) {
  if (!photo) return null;
  if (String(photo).startsWith("http") || String(photo).startsWith("/")) {
    return photo;
  }
  return `${API_URL}/uploads/${photo}`;
}

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = JSON.parse(localStorage.getItem("authUser") || "null");
  const profilePhoto = resolveProfilePhoto(authUser?.photo);

  const items = [
    { label: "Accueil", path: "/", icon: <HomeIcon /> },
    { label: "Favoris", path: "/favorites", icon: <HeartIcon /> },
    { label: "Ajouter", path: "/add", icon: <PlusIcon /> },
    { label: "Mes logements", path: "/mes-logements", icon: <BuildingIcon /> },
    {
      label: "Profil",
      path: "/profile",
      icon: profilePhoto ? (
        <img src={profilePhoto} alt="Profil" className="app-shell-nav-photo" />
      ) : (
        <UserIcon />
      ),
    },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="app-shell-nav" aria-label="Navigation principale">
      {items.map((item) => (
        <button
          key={item.path}
          type="button"
          className={`app-shell-nav-btn ${item.path === "/add" ? "app-shell-nav-btn-primary" : ""} ${
            isActive(item.path) ? "is-active" : ""
          }`}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
}

export default function AppShell({
  title,
  subtitle,
  children,
  hideHeader = false,
  bodyClassName = "",
  backTo,
  onBack,
  headerRight,
}) {
  const navigate = useNavigate();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    if (backTo) {
      navigate(backTo);
      return;
    }
    navigate(-1);
  }

  return (
    <div className="app-shell-root">
      <div className="app-shell-phone">
        <div className="app-shell-notch" />

        {!hideHeader ? (
          <header className="app-shell-header">
            <button
              type="button"
              className="app-shell-back-btn"
              onClick={handleBack}
              aria-label="Retour"
            >
              {"<"}
            </button>

            <div className="app-shell-heading">
              <h1 className="app-shell-title">{title}</h1>
              {subtitle ? <p className="app-shell-subtitle">{subtitle}</p> : null}
            </div>

            <div className="app-shell-header-side">
              {headerRight || <span className="app-shell-header-placeholder" />}
            </div>
          </header>
        ) : null}

        <main className={`app-shell-body ${bodyClassName}`}>{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
