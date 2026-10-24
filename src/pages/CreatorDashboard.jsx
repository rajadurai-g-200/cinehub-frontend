import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./CreatorDashboard.css";

const initialForm = {
  title: "",
  release_date: "",
  director: "",
  starring: "",
  genres: "",
  language: "TAMIL",
  quality: "FULL_HD",
  rating: "8.0",
};

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.movies)) return data.movies;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const formatRating = (rating) => {
  const value = Number(rating);
  return Number.isFinite(value) && value >= 0 && value <= 10
    ? value.toFixed(1)
    : "0.0";
};

const getErrorMessage = (err) => {
  const data = err.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);
        return `${field}: ${message}`;
      })
      .join(" | ");
  }

  return err.message || "An unexpected error occurred.";
};

function CreatorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState({ ...initialForm });

  const [logo, setLogo] = useState(null);
  const [movieFile, setMovieFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [watchMovie, setWatchMovie] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState("");

  const loadMovies = useCallback(async () => {
    setLoading(true);

    try {
      const response = await API.get("/movies/my/");
      setMovies(getList(response.data));
      setError("");
    } catch (err) {
      console.error(
        "Loading creator movies failed:",
        err.response?.data || err.message,
      );

      setError(`Could not load your movies. ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser({});
      }
    }

    loadMovies();
  }, [loadMovies]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.title.trim() ||
      !form.release_date ||
      !form.director.trim() ||
      !form.starring.trim() ||
      !form.genres.trim()
    ) {
      setError("Please complete all movie information fields.");
      return;
    }

    const rating = Number(form.rating);

    if (
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 10 ||
      Math.round(rating * 10) !== rating * 10
    ) {
      setError("Movie rating must be between 0.0 and 10.0, in 0.1 increments.");
      return;
    }

    if (!logo || !movieFile) {
      setError("Please select both a movie poster and a video file.");
      return;
    }

    if (!logo.type.startsWith("image/")) {
      setError("Please select a valid image for the movie poster.");
      return;
    }

    if (
      !movieFile.type.startsWith("video/") &&
      !/\.(mp4|webm|mov|mkv)$/i.test(movieFile.name)
    ) {
      setError("Please select a valid video file.");
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    formData.set("rating", rating.toFixed(1));
    formData.append("logo", logo);
    formData.append("movie_file", movieFile);

    setUploading(true);

    try {
      await API.post("/movies/create/", formData);

      setSuccess("Movie submitted successfully for admin review.");

      setForm({ ...initialForm });
      setLogo(null);
      setMovieFile(null);

      event.currentTarget.reset();

      await loadMovies();
      setActiveTab("my-movies");
    } catch (err) {
      console.error("Movie upload failed:", err.response?.data || err.message);

      setError(`Movie upload failed: ${getErrorMessage(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const getStatus = (movie) => {
    const status = String(movie.status || "").toUpperCase();

    if (status === "APPROVED" || movie.is_approved === true) {
      return "Approved";
    }

    if (status === "REJECTED" || status === "DECLINED") {
      return "Rejected";
    }

    return "Pending";
  };

  const approvedCount = movies.filter(
    (movie) => getStatus(movie) === "Approved",
  ).length;

  const pendingCount = movies.filter(
    (movie) => getStatus(movie) === "Pending",
  ).length;

  const filteredMovies = movies.filter((movie) =>
    String(movie.title || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const displayName =
    user.username || user.name || user.email?.split("@")[0] || "Creator";

  const initials = displayName.slice(0, 2).toUpperCase();

  const makeMediaUrl = (file) => {
    if (!file || typeof file !== "string") return "";

    if (/^https?:\/\//i.test(file)) return file;

    const baseURL = API.defaults?.baseURL || "http://127.0.0.1:8000";
    const base = baseURL.replace(/\/api\/?$/, "").replace(/\/$/, "");

    return `${base}/${file.replace(/^\/+/, "")}`;
  };

  const getAvailableVideos = (movie) => {
    const videos = [];

    const addVideo = (quality, file) => {
      if (typeof file !== "string" || !file.trim()) return;

      const url = makeMediaUrl(file);

      if (!videos.some((video) => video.file === url)) {
        videos.push({
          quality: quality || "Original",
          file: url,
        });
      }
    };

    addVideo(movie.quality || "Original", movie.movie_file);

    if (Array.isArray(movie.quality_files)) {
      movie.quality_files.forEach((item) => {
        addVideo(item.quality, item.file);
      });
    }

    return videos;
  };

  const openMovie = (movie) => {
    const videos = getAvailableVideos(movie);

    if (videos.length === 0) {
      setError(
        `No video URL was returned for "${movie.title}". Check the /movies/my/ API response.`,
      );
      return;
    }

    setError("");
    setWatchMovie(movie);
    setSelectedQuality(videos[0].quality);
  };

  const selectedVideos = watchMovie ? getAvailableVideos(watchMovie) : [];

  const selectedVideo =
    selectedVideos.find((video) => video.quality === selectedQuality) ||
    selectedVideos[0] ||
    null;

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginEmail");

    navigate("/login");
  };

  const WatchButton = ({ movie }) => (
    <button
      className="creator-primary-button"
      onClick={() => openMovie(movie)}
      type="button"
    >
      ▶ Watch Movie
    </button>
  );

  return (
    <div className="creator-dashboard">
      <aside className="creator-sidebar">
        <button
          className="creator-brand"
          onClick={() => navigate("/")}
          type="button"
        >
          <span className="creator-brand-icon">C</span>
          <span>
            Cine<span className="brand-red">Hub</span>
          </span>
        </button>

        <div className="sidebar-label">WORKSPACE</div>

        {[
          ["overview", "▦", "Overview"],
          ["upload", "＋", "Upload Movie"],
          ["my-movies", "▤", "My Movies"],
        ].map(([tab, icon, label]) => (
          <button
            key={tab}
            className={`creator-nav ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            <span>{icon}</span>
            {label}

            {tab === "my-movies" && (
              <span className="nav-count">{movies.length}</span>
            )}
          </button>
        ))}

        <div className="sidebar-label sidebar-bottom-label">ACCOUNT</div>

        <button
          className="creator-nav"
          onClick={() => navigate("/profile")}
          type="button"
        >
          <span>◎</span> My Profile
        </button>

        <button
          className="creator-nav"
          onClick={() => navigate("/")}
          type="button"
        >
          <span>⌂</span> View CineHub
        </button>

        <div className="creator-sidebar-footer">
          <div className="creator-avatar">{initials}</div>

          <div className="creator-user-details">
            <strong>{displayName}</strong>
            <span>Movie Creator</span>
          </div>

          <button
            className="creator-logout"
            onClick={logout}
            title="Logout"
            type="button"
          >
            ↗
          </button>
        </div>
      </aside>

      <main className="creator-main">
        <header className="creator-topbar">
          <div>
            <div className="creator-breadcrumb">CineHub / Creator Studio</div>

            <h1>
              {activeTab === "upload"
                ? "Upload a Movie"
                : activeTab === "my-movies"
                  ? "My Movies"
                  : "Creator Studio"}
            </h1>
          </div>

          <div className="creator-top-actions">
            <span className="creator-live-dot" />
            <span className="creator-online-text">Creator Workspace</span>

            <button
              className="creator-profile-button"
              onClick={() => navigate("/profile")}
              type="button"
            >
              {initials}
            </button>
          </div>
        </header>

        {error && (
          <div className="creator-alert creator-alert-error" role="alert">
            <span>!</span>
            <p>{error}</p>

            <button
              onClick={() => setError("")}
              type="button"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="creator-alert creator-alert-success" role="status">
            <span>✓</span>
            <p>{success}</p>

            <button
              onClick={() => setSuccess("")}
              type="button"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {activeTab === "overview" && (
          <>
            <section className="creator-welcome">
              <div className="welcome-decoration">C</div>

              <div className="welcome-content">
                <span className="welcome-eyebrow">YOUR CREATIVE SPACE</span>

                <h2>
                  Lights. Camera. <span>Creator!</span>
                </h2>

                <p>
                  Upload your films, track reviews, and manage your CineHub
                  submissions.
                </p>

                <button
                  className="creator-primary-button"
                  onClick={() => setActiveTab("upload")}
                  type="button"
                >
                  ＋ Upload New Movie
                </button>
              </div>

              <div className="welcome-film-icon">🎬</div>
            </section>

            <section className="creator-stats">
              <div className="creator-stat-card">
                <div className="stat-top">
                  <span>Total Movies</span>
                  <span className="stat-icon purple">▤</span>
                </div>
                <strong>{movies.length}</strong>
                <small>Your submitted titles</small>
              </div>

              <div className="creator-stat-card">
                <div className="stat-top">
                  <span>Approved</span>
                  <span className="stat-icon green">✓</span>
                </div>
                <strong>{approvedCount}</strong>
                <small>Approved for publishing</small>
              </div>

              <div className="creator-stat-card">
                <div className="stat-top">
                  <span>Under Review</span>
                  <span className="stat-icon orange">◷</span>
                </div>
                <strong>{pendingCount}</strong>
                <small>Awaiting admin review</small>
              </div>
            </section>

            <section className="creator-content-card">
              <div className="creator-section-heading">
                <div>
                  <h2>Recent Movies</h2>
                  <p>Track your latest submissions and preview your videos.</p>
                </div>

                <button
                  className="creator-text-button"
                  onClick={() => setActiveTab("my-movies")}
                  type="button"
                >
                  View all →
                </button>
              </div>

              {loading ? (
                <div className="creator-empty">Loading your movies...</div>
              ) : movies.length === 0 ? (
                <div className="creator-empty">
                  <div className="empty-film">🎞</div>
                  <h3>Your first movie starts here</h3>
                  <p>Upload a movie to begin your CineHub journey.</p>

                  <button
                    className="creator-primary-button"
                    onClick={() => setActiveTab("upload")}
                    type="button"
                  >
                    Upload Your First Movie
                  </button>
                </div>
              ) : (
                <div className="creator-table-wrap">
                  <table className="creator-table">
                    <thead>
                      <tr>
                        <th>MOVIE</th>
                        <th>LANGUAGE</th>
                        <th>QUALITY</th>
                        <th>RATING</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>

                    <tbody>
                      {movies.slice(0, 5).map((movie) => (
                        <tr key={movie.id}>
                          <td>
                            <div className="movie-title-cell">
                              <img
                                src={makeMediaUrl(
                                  movie.logo || movie.thumbnail,
                                )}
                                alt=""
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                              <strong>{movie.title || "Untitled Movie"}</strong>
                            </div>
                          </td>

                          <td>{movie.language || "—"}</td>
                          <td>{movie.quality || "—"}</td>

                          <td className="creator-rating-cell">
                            ⭐ {formatRating(movie.rating)} / 10
                          </td>

                          <td>
                            <span
                              className={`creator-status ${getStatus(
                                movie,
                              ).toLowerCase()}`}
                            >
                              {getStatus(movie)}
                            </span>
                          </td>

                          <td>
                            <WatchButton movie={movie} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "upload" && (
          <section className="creator-content-card upload-content-card">
            <div className="creator-section-heading">
              <div>
                <h2>Submit Your Movie</h2>
                <p>Add your movie details and submit it for admin review.</p>
              </div>

              <span className="submission-badge">ADMIN REVIEW REQUIRED</span>
            </div>

            <form className="creator-upload-form" onSubmit={handleUpload}>
              <div className="upload-section-label">
                <span>01</span> Movie Information
              </div>

              <div className="creator-form-grid">
                <div className="creator-field full-width">
                  <label htmlFor="title">Movie Title *</label>
                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="creator-field">
                  <label htmlFor="director">Director *</label>
                  <input
                    id="director"
                    name="director"
                    value={form.director}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="creator-field">
                  <label htmlFor="starring">Starring *</label>
                  <input
                    id="starring"
                    name="starring"
                    value={form.starring}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="creator-field">
                  <label htmlFor="release_date">Release Date *</label>
                  <input
                    id="release_date"
                    name="release_date"
                    type="date"
                    value={form.release_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="creator-field">
                  <label htmlFor="genres">Genres *</label>
                  <input
                    id="genres"
                    name="genres"
                    value={form.genres}
                    onChange={handleChange}
                    placeholder="Action, Thriller"
                    required
                  />
                </div>

                <div className="creator-field">
                  <label htmlFor="language">Language</label>
                  <select
                    id="language"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                  >
                    <option value="TAMIL">Tamil</option>
                    <option value="ENGLISH">English</option>
                  </select>
                </div>

                <div className="creator-field">
                  <label htmlFor="quality">Default Quality</label>
                  <select
                    id="quality"
                    name="quality"
                    value={form.quality}
                    onChange={handleChange}
                  >
                    <option value="FULL_HD">Full HD</option>
                    <option value="HD">HD</option>
                  </select>
                </div>

                <div className="creator-field">
                  <label htmlFor="rating">Movie Rating (out of 10) *</label>

                  <select
                    id="rating"
                    name="rating"
                    value={form.rating}
                    onChange={handleChange}
                    required
                  >
                    {Array.from({ length: 101 }, (_, index) => {
                      const value = (index / 10).toFixed(1);

                      return (
                        <option key={value} value={value}>
                          ⭐ {value} / 10
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="upload-section-label">
                <span>02</span> Movie Assets
              </div>

              <div className="creator-form-grid">
                <div className="creator-field">
                  <label htmlFor="logo">Movie Poster / Logo *</label>

                  <label className="creator-file-drop" htmlFor="logo">
                    <span className="file-drop-icon">▧</span>

                    <strong>{logo ? logo.name : "Choose poster image"}</strong>

                    <small>PNG, JPG, WEBP</small>

                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setLogo(event.target.files?.[0] || null)
                      }
                      required
                    />
                  </label>
                </div>

                <div className="creator-field">
                  <label htmlFor="movie-file">Movie Video *</label>

                  <label className="creator-file-drop" htmlFor="movie-file">
                    <span className="file-drop-icon">▷</span>

                    <strong>
                      {movieFile ? movieFile.name : "Choose movie video"}
                    </strong>

                    <small>MP4 with H.264 video is recommended</small>

                    <input
                      id="movie-file"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                      onChange={(event) =>
                        setMovieFile(event.target.files?.[0] || null)
                      }
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="creator-upload-note">
                <span>ⓘ</span>
                <p>
                  Your movie needs admin approval before public publishing. You
                  can preview your own submission in Creator Studio.
                </p>
              </div>

              <div className="creator-form-actions">
                <button
                  type="button"
                  className="creator-secondary-button"
                  onClick={() => setActiveTab("overview")}
                  disabled={uploading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="creator-primary-button"
                  disabled={uploading}
                >
                  {uploading ? "Submitting..." : "Submit for Approval →"}
                </button>
              </div>
            </form>
          </section>
        )}

        {activeTab === "my-movies" && (
          <section className="creator-content-card">
            <div className="creator-section-heading creator-movies-heading">
              <div>
                <h2>My Movie Library</h2>
                <p>Preview and monitor all your submissions.</p>
              </div>

              <button
                className="creator-primary-button"
                onClick={() => setActiveTab("upload")}
                type="button"
              >
                ＋ Add Movie
              </button>
            </div>

            <div className="creator-search-row">
              <input
                type="search"
                placeholder="Search your movies..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <button
                className="creator-secondary-button"
                onClick={loadMovies}
                type="button"
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div className="creator-empty">Loading your movies...</div>
            ) : filteredMovies.length === 0 ? (
              <div className="creator-empty">
                <div className="empty-film">🎬</div>
                <h3>No matching movies</h3>
                <p>Upload a movie or try another search.</p>
              </div>
            ) : (
              <div className="creator-movie-grid">
                {filteredMovies.map((movie) => (
                  <article className="creator-movie-card" key={movie.id}>
                    <div className="creator-movie-poster">
                      {movie.logo || movie.thumbnail ? (
                        <img
                          src={makeMediaUrl(movie.logo || movie.thumbnail)}
                          alt={movie.title || "Movie poster"}
                        />
                      ) : (
                        <span>🎬</span>
                      )}

                      <span
                        className={`creator-status ${getStatus(
                          movie,
                        ).toLowerCase()}`}
                      >
                        {getStatus(movie)}
                      </span>
                    </div>

                    <div className="creator-movie-info">
                      <h3>{movie.title || "Untitled Movie"}</h3>

                      <p>
                        {movie.language || "Language not set"} ·{" "}
                        {movie.quality || "Quality not set"}
                      </p>

                      <small>
                        {movie.release_date || "Release date not provided"}
                      </small>

                      <p className="creator-movie-rating">
                        ⭐ {formatRating(movie.rating)} / 10
                      </p>

                      {movie.admin_message && (
                        <p className="creator-admin-message">
                          Admin message: {movie.admin_message}
                        </p>
                      )}

                      <WatchButton movie={movie} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {watchMovie && (
        <div
          className="creator-player-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setWatchMovie(null);
            }
          }}
        >
          <section
            className="creator-player-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Watch ${watchMovie.title || "movie"}`}
          >
            <div className="creator-player-header">
              <div>
                <h2>{watchMovie.title || "Watch Movie"}</h2>
                <p>Creator preview · {getStatus(watchMovie)}</p>
                <p>⭐ {formatRating(watchMovie.rating)} / 10</p>
              </div>

              <button
                type="button"
                onClick={() => setWatchMovie(null)}
                aria-label="Close player"
              >
                ✕
              </button>
            </div>

            {selectedVideos.length > 1 && (
              <div className="creator-quality-picker">
                <label htmlFor="watch-quality">Video quality</label>

                <select
                  id="watch-quality"
                  value={selectedVideo?.quality || selectedQuality}
                  onChange={(event) => setSelectedQuality(event.target.value)}
                >
                  {selectedVideos.map((video) => (
                    <option key={video.file} value={video.quality}>
                      {video.quality}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedVideo ? (
              <>
                <video
                  key={selectedVideo.file}
                  className="creator-video-player"
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  onError={() => {
                    setError(
                      "Video playback failed. Check that the uploaded file exists and uses a browser-supported video codec.",
                    );
                  }}
                >
                  <source src={selectedVideo.file} />
                  Your browser does not support HTML video.
                </video>

                <p className="creator-player-help">
                  If the video does not play, check that the uploaded file
                  exists and uses a browser-supported video codec.
                </p>
              </>
            ) : (
              <p>No video file was found for this movie.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default CreatorDashboard;
