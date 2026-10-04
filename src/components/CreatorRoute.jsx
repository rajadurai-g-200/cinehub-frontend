import { Navigate } from "react-router-dom";

function CreatorRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  const user = JSON.parse(localStorage.getItem("user"));

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not a creator
  if (user?.role !== "CREATOR") {
    return <Navigate to="/" replace />;
  }

  // Creator is allowed
  return children;
}

export default CreatorRoute;
