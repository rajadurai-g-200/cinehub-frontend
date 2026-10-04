import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api";

function Movies() {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await API.get("/movies/approved/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMovies(response.data);
      } catch (err) {
        console.error("Movie loading error:", err);

        setError(err.response?.data?.message || "Unable to load movies.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="movies-page">
      <Navbar />

      <div className="movies-container">
        <div className="movies-header">
          <div>
            <p className="movies-small-title">CINEHUB COLLECTION</p>

            <h1>Movies 🎬</h1>

            <p>Discover approved movies available on CineHub.</p>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="movies-message">
            <div className="loader"></div>

            <p>Loading movies...</p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && <div className="movies-error">❌ {error}</div>}

        {/* EMPTY */}

        {!loading && !error && movies.length === 0 && (
          <div className="movies-empty">
            <div>🎬</div>

            <h2>No Movies Available</h2>

            <p>Approved movies will appear here.</p>
          </div>
        )}

        {/* MOVIE GRID */}

        {!loading && !error && movies.length > 0 && (
          <div className="movie-grid">
            {movies.map((movie) => (
              <div
                className="movie-card"
                key={movie.id}
                onClick={() => navigate(`/movies/${movie.id}`)}
              >
                {/* POSTER */}

                <div className="movie-poster">
                  {movie.logo ? (
                    <img src={movie.logo} alt={movie.title} />
                  ) : (
                    <div className="no-poster">🎬</div>
                  )}

                  <div className="movie-quality">{movie.quality}</div>
                </div>

                {/* DETAILS */}

                <div className="movie-info">
                  <h2>{movie.title}</h2>

                  <div className="movie-meta">
                    <span>📅 {new Date(movie.release_date).getFullYear()}</span>

                    <span>⭐ {movie.rating}</span>

                    <span>🌐 {movie.language}</span>
                  </div>

                  <p>{movie.genres}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Movies;
