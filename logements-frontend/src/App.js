import { Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AddPage from "./pages/AddPage";
import ProfilePage from "./pages/ProfilePage";
import LogementDetails from "./pages/LogementDetails";
import EditLogement from "./pages/EditLogement";
import VerifyEmail from "./pages/VerifyEmail";
import FavoritesPage from "./pages/FavoritesPage";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import ResetPassword from "./pages/ResetPassword";
import MesLogements from "./pages/MesLogements";

function App() {
  return (
    <div className="app-root">
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AddPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mes-logements"
            element={
              <ProtectedRoute>
                <MesLogements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/logement/:id" element={<LogementDetails />} />
          <Route path="/edit-logement/:id" element={<EditLogement />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
