import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const authUser = localStorage.getItem("authUser");
  const location = useLocation();

  // Require both a token and an authUser object to consider the user authenticated here.
  // This avoids allowing access when a stale/invalid token is present without a stored user.
  if (!token || !authUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
