import { Routes, Route, Navigate } from "react-router-dom";

import RoleSelection from "./pages/RoleSelection";
import AdminMovieUpload from "./pages/AdminMovieUpload";
import AdminUploadMovie from "./pages/AdminUploadMovie";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import CreatorDashboard from "./pages/CreatorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/otp" element={<OTP />} />

      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* Movie collection */}
      <Route path="/movies" element={<Movies />} />

      {/* Movie details: /movies/1, /movies/2, etc. */}
      <Route path="/movies/:id" element={<MovieDetails />} />

      {/* Keep the old URL working too */}
      <Route path="/movie/:id" element={<MovieDetails />} />

      {/* Profile */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />

      {/* Creator */}
      <Route path="/creator-dashboard" element={<CreatorDashboard />} />

      {/* Admin */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />

      <Route path="/admin-upload-movie" element={<AdminUploadMovie />} />

      <Route path="/admin/movie-upload" element={<AdminMovieUpload />} />

      <Route path="/admin-upload" element={<AdminMovieUpload />} />

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />

      <Route path="/select-role" element={<RoleSelection />} />
      
    </Routes>
  );
}

export default App;
