import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await API.get(`/movies/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMovie(response.data);
      } catch (err) {
        console.error("Movie details error:", err);

        setError(
          err.response?.data?.message || "Unable to load movie details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="movie-details-page">
        <Navbar />

        <div className="details-loading">
          <div className="loader"></div>
          <p>Loading movie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movie-details-page">
        <Navbar />

        <div className="details-error">
          ❌ {error}
          <button onClick={() => navigate("/movies")}>← Back to Movies</button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return null;
  }

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  return (
    <div className="movie-details-page">
      <Navbar />

      <main className="movie-details-container">
        {/* BACK BUTTON */}

        <button className="details-back" onClick={() => navigate("/movies")}>
          ← Back to Movies
        </button>

        {/* MOVIE DETAILS */}

        <section className="movie-details">
          {/* POSTER */}

          <div className="details-poster">
            {movie.logo ? (
              <img src={movie.logo} alt={movie.title} />
            ) : (
              <div className="details-no-poster">🎬</div>
            )}
          </div>

          {/* INFORMATION */}

          <div className="details-content">
            <p className="details-label">CINEHUB MOVIE</p>

            <h1>{movie.title}</h1>

            <div className="details-meta">
              <span>📅 {releaseYear}</span>

              <span>⭐ {movie.rating}/10</span>

              <span>🌐 {movie.language}</span>

              <span>🎞️ {movie.quality}</span>
            </div>

            {/* GENRES */}

            <div className="details-genres">
              {movie.genres?.split(",").map((genre, index) => (
                <span key={index}>{genre.trim()}</span>
              ))}
            </div>

            {/* DESCRIPTION */}

            <p className="details-description">
              Watch <strong>{movie.title}</strong> on CineHub and enjoy this
              movie in high quality.
            </p>

            {/* INFORMATION */}

            <div className="movie-information">
              <div>
                <span>Director</span>
                <strong>{movie.director}</strong>
              </div>

              <div>
                <span>Starring</span>
                <strong>{movie.starring}</strong>
              </div>

              <div>
                <span>Release Date</span>
                <strong>{movie.release_date}</strong>
              </div>

              <div>
                <span>Language</span>
                <strong>{movie.language}</strong>
              </div>
            </div>

            {/* WATCH */}

            <div className="details-actions">
              <button
                className="watch-movie-button"
                onClick={() => {
                  if (movie.movie_file) {
                    window.open(movie.movie_file, "_blank");
                  }
                }}
              >
                ▶ Watch Movie
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MovieDetails;
