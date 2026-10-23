import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [statistics, setStatistics] = useState({
    total_users: 0,
    total_creators: 0,
    online_users: 0,
    online_creators: 0,
    total_movies: 0,
    pending_movies: 0,
    approved_movies: 0,
    rejected_movies: 0,
  });

  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewLoading, setReviewLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // LOAD STATISTICS
  const loadStatistics = useCallback(async () => {
    const response = await API.get("/auth/admin/statistics/");
    const data = response.data || {};

    setStatistics((previous) => ({
      ...previous,
      ...data,
    }));
  }, []);

  // LOAD USERS
  const loadUsers = useCallback(async () => {
    const response = await API.get("/auth/admin/users/");
    const data = response.data;

    const list = Array.isArray(data)
      ? data
      : data?.users || data?.results || [];

    setUsers(Array.isArray(list) ? list : []);
  }, []);

  // LOAD MOVIES
  const loadMovies = useCallback(async () => {
    const response = await API.get("/movies/admin/all/");
    const data = response.data;

    const list = Array.isArray(data)
      ? data
      : data?.movies || data?.results || [];

    setMovies(Array.isArray(list) ? list : []);
  }, []);

  // LOAD DASHBOARD
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Please log in before opening the admin dashboard.");
      setLoading(false);
      return;
    }

    try {
      await Promise.all([
        loadStatistics(),
        loadUsers(),
        loadMovies(),
      ]);
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err.response?.data || err.message
      );

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Your account does not have admin permission.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load dashboard. Check your Django API endpoints."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [loadStatistics, loadUsers, loadMovies]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // REFRESH
  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  // UPLOAD MOVIE PAGE
  const goToUploadMovie = () => {
    navigate("/admin-upload");
  };

  // MEDIA URL
  const makeMediaUrl = (file) => {
    if (!file) return "";

    if (file.startsWith("http://") || file.startsWith("https://")) {
      return file;
    }

    return `http://127.0.0.1:8000${
      file.startsWith("/") ? file : `/${file}`
    }`;
  };

  // DELETE MOVIE
  const deleteMovie = async (movieId) => {
    if (!movieId) {
      window.alert("Invalid movie ID.");
      return;
    }

    if (
      !window.confirm(
        "Permanently delete this movie? This cannot be undone."
      )
    ) {
      return;
    }

    setDeleteLoading(movieId);
    setError("");

    try {
      await API.delete(`/movies/admin/${movieId}/delete/`);

      setMovies((previous) =>
        previous.filter(
          (movie) => String(movie.id) !== String(movieId)
        )
      );

      await Promise.all([loadStatistics(), loadMovies()]);
      window.alert("Movie deleted successfully.");
    } catch (err) {
      console.error(
        "Delete movie error:",
        err.response?.data || err.message
      );

      window.alert(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to delete movie. Check the Django endpoint."
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  // APPROVE OR REJECT MOVIE
  const reviewMovie = async (movieId, status) => {
    let adminMessage = "";

    if (status === "REJECTED") {
      adminMessage =
        window.prompt("Enter the reason for rejecting this movie:") || "";

      if (!adminMessage.trim()) return;
    }

    setReviewLoading(movieId);

    try {
      await API.post(`/movies/admin/${movieId}/review/`, {
        status,
        admin_message: adminMessage,
      });

      await Promise.all([loadStatistics(), loadMovies()]);

      window.alert(
        status === "APPROVED"
          ? "Movie approved successfully."
          : "Movie rejected successfully."
      );
    } catch (err) {
      console.error(
        "Movie review error:",
        err.response?.data || err.message
      );

      window.alert(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to update movie status."
      );
    } finally {
      setReviewLoading(null);
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await API.post("/auth/logout/");
    } catch (err) {
      console.log("Logout API error:", err.message);
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginEmail");

    navigate("/login");
  };

  // SAFE DATA
  const safeUsers = Array.isArray(users) ? users : [];
  const safeMovies = Array.isArray(movies) ? movies : [];

  const pendingMovies = safeMovies.filter(
    (movie) => String(movie.status || "").toUpperCase() === "PENDING"
  );

  const getRole = (user) => {
    if (user?.is_superuser || user?.is_staff) return "ADMIN";
    return user?.role || user?.display_role || "USER";
  };

  const getOnlineStatus = (user) =>
    user?.is_online === true || user?.online === true;

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "—"
      : parsed.toLocaleString("en-IN");
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <h2>Loading CineHub Admin...</h2>
        <p>Preparing your dashboard</p>
      </div>
    );
  }

  // ERROR SCREEN
  if (error) {
    return (
      <div className="admin-error-page">
        <div className="admin-error-card">
          <div className="admin-error-icon">⚠️</div>
          <h2>Dashboard Error</h2>
          <p>{error}</p>

          <div className="admin-error-actions">
            <button
              type="button"
              className="admin-primary-button"
              onClick={loadDashboard}
            >
              Try Again
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <span className="admin-logo-icon">▶</span>
            <span>Cine<span>Hub</span></span>
          </div>
          <div className="admin-title">
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <div className="admin-header-right">
          <div className="admin-profile">
            <div className="admin-avatar">A</div>
            <div className="admin-profile-info">
              <strong>Administrator</strong>
              <small>
                {(() => {
                  try {
                    return (
                      JSON.parse(localStorage.getItem("user") || "{}").email ||
                      "Admin account"
                    );
                  } catch {
                    return "Admin account";
                  }
                })()}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-nav">
        {[
          ["overview", "📊 Overview"],
          ["users", "👥 Users"],
          ["movies", "🎬 Movies"],
          ["pending", `⏳ Pending (${pendingMovies.length})`],
        ].map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="admin-main">
        {activeTab === "overview" && (
          <>
            <section className="admin-welcome">
              <div>
                <p className="admin-eyebrow">CINEHUB CONTROL CENTER</p>
                <h1>Welcome, Admin 👋</h1>
                <p>Manage users, creators, movie uploads, and approvals.</p>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={goToUploadMovie}
                  style={{ marginTop: 16 }}
                >
                  + Upload Movie
                </button>
              </div>

              <div className="admin-live-indicator">
                <span />
                LIVE
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section-title">
                <div>
                  <h2>User Statistics</h2>
                  <p>Current CineHub users</p>
                </div>
              </div>

              <div className="admin-stats-grid">
                <StatCard icon="👥" label="Total Users" value={statistics.total_users} />
                <StatCard icon="🎥" label="Total Creators" value={statistics.total_creators} />
                <StatCard icon="🟢" label="Online Users" value={statistics.online_users} />
                <StatCard icon="🟢" label="Online Creators" value={statistics.online_creators} />
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section-title">
                <div>
                  <h2>Movie Statistics</h2>
                  <p>Content moderation overview</p>
                </div>
              </div>

              <div className="admin-stats-grid">
                <StatCard icon="🎬" label="Total Movies" value={statistics.total_movies} />
                <StatCard icon="⏳" label="Pending" value={statistics.pending_movies} />
                <StatCard icon="✓" label="Approved" value={statistics.approved_movies} />
                <StatCard icon="✕" label="Rejected" value={statistics.rejected_movies} />
              </div>
            </section>
          </>
        )}

        {activeTab === "users" && (
          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <h2>Users & Creators</h2>
                <p>Registered CineHub members</p>
              </div>
              <span className="admin-count">{safeUsers.length} members</span>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Seen</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {safeUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="admin-empty">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    safeUsers.map((user) => {
                      const role = getRole(user);
                      const online = getOnlineStatus(user);

                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-user-avatar">
                                {(user.username || "U").charAt(0).toUpperCase()}
                              </div>
                              <strong>{user.username || "Unknown"}</strong>
                            </div>
                          </td>
                          <td>{user.email || "—"}</td>
                          <td>
                            <span className={`admin-role ${role.toLowerCase()}`}>
                              {role}
                            </span>
                          </td>
                          <td>
                            <span className={online ? "admin-online" : "admin-offline"}>
                              <span />
                              {online ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td>{formatDate(user.last_seen)}</td>
                          <td>{formatDate(user.date_joined)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {(activeTab === "movies" || activeTab === "pending") && (
          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <h2>{activeTab === "pending" ? "Pending Approvals" : "All Movies"}</h2>
                <p>
                  {activeTab === "pending"
                    ? "Review movie submissions"
                    : "View and manage uploaded movies"}
                </p>
              </div>

              <div className="admin-movie-header-actions">
                <span className="admin-count">
                  {activeTab === "pending"
                    ? pendingMovies.length
                    : safeMovies.length}{" "}
                  movies
                </span>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={goToUploadMovie}
                >
                  + Upload Movie
                </button>
              </div>
            </div>

            <div className="admin-movies-grid">
              {(activeTab === "pending" ? pendingMovies : safeMovies).length === 0 ? (
                <div className="admin-empty-card">
                  <div>🎬</div>
                  <h3>{activeTab === "pending" ? "All Caught Up" : "No Movies"}</h3>
                  <p>
                    {activeTab === "pending"
                      ? "There are no movies waiting for approval."
                      : "No movies have been uploaded yet."}
                  </p>
                  {activeTab === "movies" && (
                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={goToUploadMovie}
                    >
                      Upload Your First Movie
                    </button>
                  )}
                </div>
              ) : (
                (activeTab === "pending" ? pendingMovies : safeMovies).map((movie) => (
                  <MovieAdminCard
                    key={movie.id}
                    movie={movie}
                    makeMediaUrl={makeMediaUrl}
                    reviewMovie={reviewMovie}
                    reviewLoading={reviewLoading}
                    deleteMovie={deleteMovie}
                    deleteLoading={deleteLoading}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value ?? 0}</strong>
      </div>
    </div>
  );
}

function MovieAdminCard({
  movie,
  makeMediaUrl,
  reviewMovie,
  reviewLoading,
  deleteMovie,
  deleteLoading,
}) {
  const [showVideo, setShowVideo] = useState(false);

  const status = String(movie.status || "PENDING").toUpperCase();
  const isPending = status === "PENDING";
  const reviewIsLoading = reviewLoading === movie.id;
  const deleteIsLoading = deleteLoading === movie.id;
  const creator = movie.creator || movie.uploaded_by || {};

  return (
    <article className="admin-movie-card">
      <div className="admin-movie-poster">
        {movie.logo ? (
          <img
            src={makeMediaUrl(movie.logo)}
            alt={`${movie.title || "Movie"} poster`}
          />
        ) : (
          <div className="admin-movie-placeholder">🎬</div>
        )}

        <span className={`admin-movie-status ${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      <div className="admin-movie-content">
        <h3>{movie.title || "Untitled Movie"}</h3>

        <div className="admin-movie-creator">
          <strong>Creator</strong>
          <span>
            {creator.username ||
              movie.creator_username ||
              movie.creator_name ||
              "Unknown"}
          </span>
          <small>{creator.email || movie.creator_email || ""}</small>
        </div>

        <div className="admin-movie-details">
          <div><span>Director</span><strong>{movie.director || "Unknown"}</strong></div>
          <div><span>Language</span><strong>{movie.language || "—"}</strong></div>
          <div><span>Rating</span><strong>⭐ {movie.rating ?? "0"}</strong></div>
          <div><span>Release</span><strong>{movie.release_date || "—"}</strong></div>
        </div>

        {movie.genres && <p className="admin-movie-genres"><strong>Genres:</strong> {movie.genres}</p>}
        {movie.starring && <p className="admin-movie-starring"><strong>Starring:</strong> {movie.starring}</p>}

        {movie.admin_message && (
          <div className="admin-message">
            <strong>Admin Message</strong>
            <p>{movie.admin_message}</p>
          </div>
        )}

        {movie.movie_file && (
          <button
            type="button"
            className="admin-watch-button"
            onClick={() => setShowVideo((previous) => !previous)}
          >
            {showVideo ? "Hide Preview" : "▶ Watch Preview"}
          </button>
        )}

        {showVideo && movie.movie_file && (
          <div className="admin-video-preview">
            <video
              src={makeMediaUrl(movie.movie_file)}
              controls
              playsInline
              preload="metadata"
            />
          </div>
        )}

        {isPending && (
          <div className="admin-review-actions">
            <button
              type="button"
              className="admin-approve-button"
              disabled={reviewIsLoading || deleteIsLoading}
              onClick={() => reviewMovie(movie.id, "APPROVED")}
            >
              {reviewIsLoading ? "Processing..." : "✓ Approve"}
            </button>

            <button
              type="button"
              className="admin-reject-button"
              disabled={reviewIsLoading || deleteIsLoading}
              onClick={() => reviewMovie(movie.id, "REJECTED")}
            >
              {reviewIsLoading ? "Processing..." : "✕ Reject"}
            </button>
          </div>
        )}

        <button
          type="button"
          className="admin-delete-button"
          disabled={deleteIsLoading || reviewIsLoading}
          onClick={() => deleteMovie(movie.id)}
        >
          {deleteIsLoading ? "Deleting..." : "🗑 Delete Movie"}
        </button>
      </div>
    </article>
  );
}

export default AdminDashboard;
