import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

function Home() {
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
    <div className="home-page">
      {/* NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-small">🎬 WELCOME TO CINEHUB</p>

          <h1>
            Watch Your
            <span> Favourite Movies</span>
          </h1>

          <p className="hero-description">
            Discover movies, explore new stories, and enjoy your favourite
            entertainment in high quality.
          </p>

          <div className="hero-buttons">
            <button
              className="watch-button"
              onClick={() => navigate("/movies")}
            >
              ▶ Watch Movies
            </button>

            <button
              className="browse-button"
              onClick={() => navigate("/movies")}
            >
              Explore Movies
            </button>
          </div>
        </div>
      </section>

      {/* USER WELCOME */}
      <section className="welcome-section">
        <h2>Welcome, {user.username || "Movie Lover"} 👋</h2>

        <p>Your movie journey starts here.</p>
      </section>

      {/* MOVIE CATEGORIES */}
      <section className="category-section">
        <h2>Explore Categories</h2>

        <div className="category-grid">
          <div className="category-card">
            🎬
            <h3>Action</h3>
            <p>Exciting action movies</p>
          </div>

          <div className="category-card">
            ❤️
            <h3>Romance</h3>
            <p>Beautiful love stories</p>
          </div>

          <div className="category-card">
            😂
            <h3>Comedy</h3>
            <p>Movies to make you laugh</p>
          </div>

          <div className="category-card">
            👻
            <h3>Horror</h3>
            <p>Thrilling horror movies</p>
          </div>
        </div>
      </section>

      {/* CREATOR SECTION */}
      {user.role === "CREATOR" && (
        <section className="creator-section">
          <div>
            <h2>Become a CineHub Creator 🎥</h2>

            <p>Upload your movies and share your stories with CineHub users.</p>
          </div>

          <button onClick={() => navigate("/creator-dashboard")}>
            Creator Dashboard
          </button>
        </section>
      )}

      {/* LOGOUT */}
      <section className="logout-section">
        <button onClick={handleLogout}>Logout</button>
      </section>
    </div>
  );
}

export default Home;
