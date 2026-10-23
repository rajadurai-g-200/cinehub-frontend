import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Movies.css";

const API_BASE = "http://127.0.0.1:8000";

function getFileUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

function Movies() {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMovies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/movies/approved/");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.movies)
          ? data.movies
          : Array.isArray(data?.results)
            ? data.results
            : [];

      setMovies(
        list.filter(
          (movie) =>
            !movie.status ||
            movie.status.toUpperCase() === "APPROVED"
        )
      );
    } catch (err) {
      console.error("Movie loading error:", err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          err.response?.data?.message ||
          (err.response?.status === 401
            ? "Please log in again to view movies."
            : "Unable to load movies. Check that Django is running.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const openMovie = (movie) => {
    if (movie?.id) {
      navigate(`/movies/${movie.id}`);
    }
  };

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (search.trim()) {
      const keyword = search.toLowerCase().trim();

      result = result.filter((movie) => {
        const searchable = [
          movie.title,
          movie.director,
          movie.genres,
          movie.starring,
          movie.language,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(keyword);
      });
    }

    if (filter === "TAMIL") {
      result = result.filter(
        (movie) => movie.language?.toUpperCase() === "TAMIL"
      );
    } else if (filter === "ENGLISH") {
      result = result.filter(
        (movie) => movie.language?.toUpperCase() === "ENGLISH"
      );
    } else if (filter === "TOP") {
      result = result.filter(
        (movie) => Number(movie.rating || 0) >= 8
      );
    }

    return result;
  }, [movies, search, filter]);

  if (loading) {
    return (
      <div className="movies-page">
        <div className="movies-container">
          <div className="movies-loading">
            <div className="movies-spinner" />
            <h3>Loading movies...</h3>
            <p>Please wait while CineHub loads your movies.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movies-page">
        <div className="movies-container">
          <div className="movies-error">
            <div className="movies-error-icon">⚠️</div>
            <h3>Unable to load movies</h3>
            <p>{error}</p>

            <button type="button" onClick={loadMovies}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="movies-page">
      <div className="movies-container">
        <header className="movies-header">
          <div className="movies-heading">
            <span className="movies-eyebrow">
              CINEHUB COLLECTION
            </span>

            <h1 className="movies-title">Explore Movies</h1>

            <p className="movies-description">
              Discover amazing movies and watch approved films.
            </p>
          </div>

          <div className="movies-search-box">
            <span className="movies-search-icon">🔍</span>

            <input
              type="text"
              placeholder="Search movies, actors, genres..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="movies-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </header>

        <div className="movies-filter-bar">
          {[
            ["ALL", "All Movies"],
            ["TAMIL", "Tamil"],
            ["ENGLISH", "English"],
            ["TOP", "⭐ Top Rated"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={`movies-filter-button ${
                filter === value ? "active" : ""
              }`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="movies-results-header">
          <div>
            <h2 className="movies-results-title">
              {filter === "ALL"
                ? "All Movies"
                : filter === "TOP"
                  ? "Top Rated Movies"
                  : `${filter === "TAMIL" ? "Tamil" : "English"} Movies`}
            </h2>

            <span className="movies-results-count">
              {filteredMovies.length}{" "}
              {filteredMovies.length === 1 ? "movie" : "movies"}
            </span>
          </div>
        </div>

        {filteredMovies.length > 0 ? (
          <div className="movies-grid">
            {filteredMovies.map((movie) => (
              <article className="movie-card" key={movie.id}>
                <button
                  type="button"
                  className="movie-poster movie-poster-clickable"
                  onClick={() => openMovie(movie)}
                  aria-label={`View ${movie.title}`}
                >
                  {movie.logo ? (
                    <img
                      src={getFileUrl(movie.logo)}
                      alt={movie.title || "Movie poster"}
                      loading="lazy"
                    />
                  ) : (
                    <div className="movie-poster-placeholder">
                      <span>🎬</span>
                    </div>
                  )}

                  <span className="movie-poster-overlay" />

                  <span className="movie-play-button">▶</span>

                  {Number(movie.rating) > 0 && (
                    <span className="movie-rating">
                      <span className="movie-rating-star">★</span>
                      <span>
                        {Number(movie.rating).toFixed(1)}
                      </span>
                    </span>
                  )}

                  <span className="movie-quality">
                    {movie.quality === "FULL_HD"
                      ? "FULL HD"
                      : movie.quality || "HD"}
                  </span>
                </button>

                <div className="movie-content">
                  <h3
                    className="movie-title movie-title-clickable"
                    onClick={() => openMovie(movie)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        openMovie(movie);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                  >
                    {movie.title || "Untitled Movie"}
                  </h3>

                  <div className="movie-meta">
                    {movie.release_date && (
                      <span>
                        {String(movie.release_date).slice(0, 4)}
                      </span>
                    )}

                    {movie.language && (
                      <>
                        <span className="movie-meta-dot">•</span>
                        <span className="movie-language">
                          {movie.language === "TAMIL"
                            ? "Tamil"
                            : "English"}
                        </span>
                      </>
                    )}
                  </div>

                  {movie.genres && (
                    <p className="movie-genres">
                      {movie.genres}
                    </p>
                  )}

                  <button
                    type="button"
                    className="browse-profile-btn"
                    onClick={() => openMovie(movie)}
                  >
                    ▶ Watch Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="movies-empty">
            <div className="movies-empty-icon">🎬</div>

            <h3>No approved movies found</h3>

            <p>
              {search
                ? "Try another movie name, actor, or genre."
                : "Movies will appear here after the admin approves them."}
            </p>

            {(search || filter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Movies;
