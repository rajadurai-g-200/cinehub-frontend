import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    user = {};
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ADMIN only
  if (
    user.role !== "ADMIN" &&
    user.is_staff !== true &&
    user.is_superuser !== true
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
