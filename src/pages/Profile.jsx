import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [movieCount, setMovieCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await API.get("/auth/me/");

      const userData = response.data.user || response.data;

      setUser(userData);

      localStorage.setItem("user", JSON.stringify(userData));

      /*
        Creator movie count
      */
      if (userData.role === "CREATOR") {
        try {
          const movieResponse = await API.get("/movies/my/");

          const data = movieResponse.data;

          if (Array.isArray(data)) {
            setMovieCount(data.length);
          } else if (Array.isArray(data.movies)) {
            setMovieCount(data.movies.length);
          } else if (Array.isArray(data.results)) {
            setMovieCount(data.results.length);
          }
        } catch (error) {
          console.log("Creator movies loading error:", error);
        }
      }
    } catch (error) {
      console.error("Profile loading error:", error);

      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout/");
    } catch (error) {
      console.log("Logout error");
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginEmail");

    navigate("/login");
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin =
    user.is_staff === true ||
    user.is_superuser === true ||
    user.role === "ADMIN";

  const isCreator = user.role === "CREATOR" && !isAdmin;

  const displayRole = isAdmin ? "ADMIN" : isCreator ? "CREATOR" : "USER";

  const displayName =
    user.username || user.email?.split("@")[0] || "CineHub User";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      {/* NAVBAR */}

      <header className="profile-navbar">
        <div className="profile-brand" onClick={() => navigate("/")}>
          <div className="profile-brand-icon">C</div>

          <span>
            Cine<span>Hub</span>
          </span>
        </div>

        <button className="profile-home-btn" onClick={() => navigate("/")}>
          ← Home
        </button>
      </header>

      {/* MAIN */}

      <main className="profile-container">
        <section className="profile-card">
          {/* PROFILE HEADER */}

          <div className="profile-cover">
            <div className="profile-cover-glow"></div>

            <div className="profile-avatar">{initial}</div>

            <div className="profile-header-info">
              <span className={`profile-role ${displayRole.toLowerCase()}`}>
                {displayRole}
              </span>

              <h1>{displayName}</h1>

              <p>{user.email}</p>
            </div>
          </div>

          {/* ACCOUNT */}

          <div className="profile-body">
            <div className="profile-section-title">
              <span></span>
              Account Information
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-card">
                <div className="info-icon">👤</div>

                <div>
                  <small>Username</small>

                  <strong>{displayName}</strong>
                </div>
              </div>

              <div className="profile-info-card">
                <div className="info-icon">✉</div>

                <div>
                  <small>Email</small>

                  <strong>{user.email}</strong>
                </div>
              </div>

              <div className="profile-info-card">
                <div className="info-icon">🛡</div>

                <div>
                  <small>Account Role</small>

                  <strong>{displayRole}</strong>
                </div>
              </div>

              <div className="profile-info-card">
                <div className="info-icon">✓</div>

                <div>
                  <small>Account Status</small>

                  <strong className="active-status">Active</strong>
                </div>
              </div>
            </div>

            {/* CREATOR */}

            {isCreator && (
              <>
                <div className="profile-section-title creator-title">
                  <span></span>
                  Creator Account
                </div>

                <div className="creator-profile-box">
                  <div className="creator-profile-icon">🎬</div>

                  <div>
                    <h3>Creator Studio</h3>

                    <p>
                      Upload your movies and submit them for admin approval.
                    </p>
                  </div>

                  <button onClick={() => navigate("/creator-dashboard")}>
                    Open Studio →
                  </button>
                </div>

                <div className="profile-stats">
                  <div className="profile-stat">
                    <strong>{movieCount}</strong>

                    <span>Movies Uploaded</span>
                  </div>

                  <div className="profile-stat">
                    <strong>✓</strong>

                    <span>Creator Access</span>
                  </div>
                </div>
              </>
            )}

            {/* USER */}

            {!isCreator && !isAdmin && (
              <div className="user-profile-box">
                <div className="user-profile-icon">🍿</div>

                <div>
                  <h3>Welcome to CineHub</h3>

                  <p>Watch approved movies in high-quality streaming.</p>
                </div>

                <button onClick={() => navigate("/movies")}>
                  Browse Movies →
                </button>
              </div>
            )}

            {/* ADMIN */}

            {isAdmin && (
              <div className="admin-profile-box">
                <div className="admin-profile-icon">⚙</div>

                <div>
                  <h3>Administrator</h3>

                  <p>Manage users, creators, movies and approvals.</p>
                </div>

                <button onClick={() => navigate("/admin-dashboard")}>
                  Admin Dashboard →
                </button>
              </div>
            )}

            {/* ACTIONS */}

            <div className="profile-actions">
              <button
                className="browse-profile-btn"
                onClick={() => navigate("/movies")}
              >
                🎬 Browse Movies
              </button>

              <button className="logout-profile-btn" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;
