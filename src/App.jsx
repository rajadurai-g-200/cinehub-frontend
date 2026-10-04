import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import CreatorDashboard from "./pages/CreatorDashboard";
import ProfileSetup from "./pages/ProfileSetup";

import ProtectedRoute from "./components/ProtectedRoute";
import CreatorRoute from "./components/CreatorRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            LOGIN
        ========================= */}

        <Route path="/login" element={<Login />} />

        {/* =========================
            OTP
        ========================= */}

        <Route path="/otp" element={<OTP />} />

        {/* =========================
            USER HOME
        ========================= */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* =========================
            MOVIES
        ========================= */}

        <Route
          path="/movies"
          element={
            <ProtectedRoute>
              <Movies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/movies/:id"
          element={
            <ProtectedRoute>
              <MovieDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />

        {/* =========================
            CREATOR DASHBOARD
        ========================= */}

        <Route
          path="/creator-dashboard"
          element={
            <CreatorRoute>
              <CreatorDashboard />
            </CreatorRoute>
          }
        />

        {/* =========================
            UNKNOWN URL
        ========================= */}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
