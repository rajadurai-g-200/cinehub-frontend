import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Home.css";


function Home() {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const response = await API.get("/movies/approved/");

      const data = response.data;

      if (Array.isArray(data)) {
        setMovies(data);
      } else if (Array.isArray(data.movies)) {
        setMovies(data.movies);
      } else if (Array.isArray(data.results)) {
        setMovies(data.results);
      } else {
        setMovies([]);
      }
    } catch (error) {
      console.error("Movie loading error:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const getImage = (movie) => {
    if (!movie.logo) {
      return "https://via.placeholder.com/600x900/111111/ffffff?text=CineHub";
    }

    if (movie.logo.startsWith("http")) {
      return movie.logo;
    }

    return `http://127.0.0.1:8000${movie.logo}`;
  };

  const filteredMovies = movies.filter((movie) =>
    movie.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const featuredMovie =
    filteredMovies.length > 0 ? filteredMovies[0] : movies[0];

  const trendingMovies = filteredMovies.slice(0, 6);
  const latestMovies = filteredMovies.slice(6, 12);

  const openMovie = (id) => {
    navigate(`/movies/${id}`);
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout/");
    } catch (error) {
      console.log("Logout API error");
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginEmail");

    navigate("/login");
  };

  return (
    <div className="cine-home">
      {/* ================= NAVBAR ================= */}

      <header className="cine-navbar">
        <div className="cine-logo" onClick={() => navigate("/")}>
          <div className="cine-logo-icon">C</div>

          <span>
            Cine<span>Hub</span>
          </span>
        </div>

        <nav className="cine-nav">
          <button className="nav-active" onClick={() => navigate("/")}>
            Home
          </button>

          <button onClick={() => navigate("/movies")}>Movies</button>

          {user.role === "CREATOR" && (
            <button onClick={() => navigate("/creator-dashboard")}>
              Creator
            </button>
          )}
        </nav>

        <div className="cine-nav-right">
          <div className="cine-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="profile-circle"
            onClick={() => navigate("/profile")}
          >
            {user.username?.charAt(0)?.toUpperCase() || "U"}
          </button>
        </div>
      </header>

      {/* ================= HERO ================= */}

      {!loading && featuredMovie && (
        <section className="cine-hero">
          <img
            className="hero-background"
            src={getImage(featuredMovie)}
            alt={featuredMovie.title}
          />

          <div className="hero-overlay"></div>

          <div className="hero-content">
            <div className="hero-tag">🔥 TRENDING NOW</div>

            <h1>{featuredMovie.title}</h1>

            <div className="hero-meta">
              <span className="hero-rating">
                ★ {featuredMovie.rating || "8.5"}
              </span>

              <span>
                {featuredMovie.release_date
                  ? featuredMovie.release_date.slice(0, 4)
                  : "2026"}
              </span>

              <span>{featuredMovie.language || "Tamil"}</span>

              <span className="quality-badge">HD</span>
            </div>

            <p>
              Watch the latest movies and entertainment on CineHub. Enjoy
              high-quality streaming with a premium cinematic experience.
            </p>

            <div className="hero-buttons">
              <button
                className="watch-now"
                onClick={() => openMovie(featuredMovie.id)}
              >
                ▶ Watch Now
              </button>

              <button
                className="more-info"
                onClick={() => openMovie(featuredMovie.id)}
              >
                ⓘ More Info
              </button>
            </div>
          </div>

          <div className="hero-bottom-fade"></div>
        </section>
      )}

      {/* ================= MAIN ================= */}

      <main className="cine-main">
        {/* Welcome */}

        <section className="welcome-section">
          <div>
            <p className="small-heading">WELCOME BACK</p>

            <h2>
              Hello, <span>{user.username || "Movie Lover"}</span>
              👋
            </h2>

            <p>Find something amazing to watch today.</p>
          </div>

          <button className="browse-button" onClick={() => navigate("/movies")}>
            Explore Movies →
          </button>
        </section>

        {/* ================= GENRES ================= */}

        <section className="genre-section">
          <div className="section-heading">
            <div>
              <span className="red-line"></span>

              <h2>Browse by Genre</h2>
            </div>
          </div>

          <div className="genre-grid">
            <button
              className="genre-card action"
              onClick={() => navigate("/movies")}
            >
              <span>⚡</span>
              <strong>Action</strong>
              <small>Exciting adventures</small>
            </button>

            <button
              className="genre-card thriller"
              onClick={() => navigate("/movies")}
            >
              <span>🔥</span>
              <strong>Thriller</strong>
              <small>Edge of your seat</small>
            </button>

            <button
              className="genre-card comedy"
              onClick={() => navigate("/movies")}
            >
              <span>😂</span>
              <strong>Comedy</strong>
              <small>Laugh out loud</small>
            </button>

            <button
              className="genre-card romance"
              onClick={() => navigate("/movies")}
            >
              <span>❤️</span>
              <strong>Romance</strong>
              <small>Love stories</small>
            </button>

            <button
              className="genre-card drama"
              onClick={() => navigate("/movies")}
            >
              <span>🎭</span>
              <strong>Drama</strong>
              <small>Stories that matter</small>
            </button>
          </div>
        </section>

        {/* ================= TRENDING ================= */}

        <section className="movie-section">
          <div className="section-heading">
            <div className="section-title-wrap">
              <span className="red-line"></span>

              <div>
                <h2>Trending Now</h2>

                <p>Most watched movies on CineHub</p>
              </div>
            </div>

            <button onClick={() => navigate("/movies")} className="see-all">
              See All →
            </button>
          </div>

          {loading ? (
            <div className="loading-box">
              <div className="loader"></div>
              <p>Loading movies...</p>
            </div>
          ) : trendingMovies.length === 0 ? (
            <div className="empty-box">
              <div>🎬</div>
              <h3>No movies available</h3>
              <p>Approved movies will appear here.</p>
            </div>
          ) : (
            <div className="movie-row">
              {trendingMovies.map((movie, index) => (
                <article
                  className="movie-card"
                  key={movie.id}
                  onClick={() => openMovie(movie.id)}
                >
                  <div className="movie-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="poster-wrapper">
                    <img src={getImage(movie)} alt={movie.title} />

                    <div className="poster-gradient"></div>

                    <button
                      className="poster-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMovie(movie.id);
                      }}
                    >
                      ▶
                    </button>

                    <span className="poster-quality">HD</span>
                  </div>

                  <div className="movie-details">
                    <h3>{movie.title}</h3>

                    <div className="movie-info">
                      <span>★ {movie.rating || "N/A"}</span>

                      <span>{movie.language || "Tamil"}</span>
                    </div>

                    <p>{movie.genres || "Entertainment"}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ================= PREMIUM BANNER ================= */}

        <section className="premium-banner">
          <div className="premium-glow"></div>

          <div className="premium-content">
            <span>CINEHUB ORIGINAL</span>

            <h2>
              Your Entertainment.
              <br />
              Your Way.
            </h2>

            <p>
              Discover amazing stories, blockbuster movies and unforgettable
              entertainment.
            </p>

            <button onClick={() => navigate("/movies")}>
              Start Watching →
            </button>
          </div>

          <div className="premium-symbol">▶</div>
        </section>

        {/* ================= LATEST ================= */}

        {latestMovies.length > 0 && (
          <section className="movie-section">
            <div className="section-heading">
              <div className="section-title-wrap">
                <span className="red-line"></span>

                <div>
                  <h2>More to Explore</h2>

                  <p>Fresh movies waiting for you</p>
                </div>
              </div>

              <button onClick={() => navigate("/movies")} className="see-all">
                View All →
              </button>
            </div>

            <div className="movie-row">
              {latestMovies.map((movie) => (
                <article
                  className="movie-card"
                  key={movie.id}
                  onClick={() => openMovie(movie.id)}
                >
                  <div className="poster-wrapper">
                    <img src={getImage(movie)} alt={movie.title} />

                    <div className="poster-gradient"></div>

                    <button
                      className="poster-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMovie(movie.id);
                      }}
                    >
                      ▶
                    </button>
                  </div>

                  <div className="movie-details">
                    <h3>{movie.title}</h3>

                    <div className="movie-info">
                      <span>★ {movie.rating || "N/A"}</span>

                      <span>{movie.language || "Tamil"}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ================= FOOTER ================= */}

      <footer className="cine-footer">
        <div className="footer-logo">
          Cine<span>Hub</span>
        </div>

        <p>Your world of movies, all in one place.</p>

        <div className="footer-links">
          <button onClick={() => navigate("/")}>Home</button>

          <button onClick={() => navigate("/movies")}>Movies</button>

          <button onClick={() => navigate("/profile")}>Profile</button>

          <button onClick={logout}>Logout</button>
        </div>

        <div className="copyright">© 2026 CineHub. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default Home;
