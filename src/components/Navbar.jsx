import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginEmail");

    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* LOGO */}
      <div className="navbar-logo" onClick={() => navigate("/")}>
        🎬 <span>CineHub</span>
      </div>

      {/* MENU */}
      <div className="navbar-menu">
        <button onClick={() => navigate("/")}>Home</button>

        <button onClick={() => navigate("/movies")}>Movies</button>

        <button onClick={() => navigate("/search")}>🔍 Search</button>

        <button onClick={() => navigate("/profile")}>👤 Profile</button>

        {user.role === "CREATOR" && (
          <button onClick={() => navigate("/creator-dashboard")}>
            🎥 Creator
          </button>
        )}

        <button className="navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

<button type="button" onClick={() => navigate("/profile")}>
  My Profile
</button>;

export default Navbar;
