import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AdminMovieUpload.css";

function AdminMovieUpload() {
  const navigate = useNavigate();

  // 01. Movie information, including the new rating field
  const [form, setForm] = useState({
    title: "",
    director: "",
    starring: "",
    genres: "",
    language: "TAMIL",
    release_date: "",
    quality: "HD",
    rating: "8.0",
  });

  // 02. Movie files and page status
  const [logo, setLogo] = useState(null);
  const [movieFile, setMovieFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 03. Handle changes to text fields and dropdowns
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // 04. Upload the movie to Django
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check that both files have been selected
    if (!logo || !movieFile) {
      setError("Please select both a movie poster and a video file.");
      return;
    }

    // Create multipart form data for text fields and files
    const data = new FormData();

    data.append("title", form.title.trim());
    data.append("director", form.director.trim());
    data.append("starring", form.starring.trim());
    data.append("genres", form.genres.trim());
    data.append("language", form.language);
    data.append("release_date", form.release_date);
    data.append("quality", form.quality);

    // NEW: Send the selected rating to the backend
    data.append("rating", Number(form.rating).toFixed(1));

    data.append("logo", logo);
    data.append("movie_file", movieFile);

    try {
      setLoading(true);

      const response = await API.post("/movies/admin/upload/", data);

      setSuccess("Movie uploaded successfully!");
      console.log("Upload response:", response.data);

      // Reset all form fields after a successful upload
      setForm({
        title: "",
        director: "",
        starring: "",
        genres: "",
        language: "TAMIL",
        release_date: "",
        quality: "HD",
        rating: "8.0",
      });

      setLogo(null);
      setMovieFile(null);

      e.target.reset();
    } catch (err) {
      console.error("Movie upload error:", err);
      console.error("HTTP status:", err.response?.status);
      console.error("Server response:", err.response?.data);

      const serverData = err.response?.data;

      if (err.response?.status === 415) {
        setError(
          "Unsupported upload format. Check the Django upload view's parser_classes and request Content-Type.",
        );
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Admin access is required to upload movies.");
      } else if (typeof serverData === "string") {
        setError(serverData);
      } else if (serverData) {
        setError(
          serverData.detail ||
            serverData.message ||
            Object.entries(serverData)
              .map(([key, value]) => {
                const message = Array.isArray(value)
                  ? value.join(", ")
                  : String(value);

                return `${key}: ${message}`;
              })
              .join(" | ") ||
            "Movie upload failed.",
        );
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 05. Display the upload page
  return (
    <div className="admin-upload-page">
      <header className="upload-navbar">
        <div className="upload-brand" onClick={() => navigate("/")}>
          <span className="upload-brand-icon">C</span>
          Cine<span>Hub</span>
          <small>ADMIN STUDIO</small>
        </div>

        <button
          type="button"
          className="upload-back-btn"
          onClick={() => navigate("/admin-dashboard")}
        >
          ← Admin Dashboard
        </button>
      </header>

      <main className="upload-container">
        <div className="upload-heading">
          <span className="upload-eyebrow">CONTENT MANAGEMENT</span>

          <h1>Upload a Movie</h1>
          <p>Add movie information and files to CineHub.</p>
        </div>

        <form className="upload-form" onSubmit={handleSubmit}>
          {error && (
            <div className="upload-message error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="upload-message success" role="status">
              {success}
            </div>
          )}

          {/* 06. Movie information */}
          <section className="upload-section">
            <h2>01. Movie Information</h2>

            <label>
              Movie Title *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter movie title"
                required
              />
            </label>

            <div className="upload-grid">
              <label>
                Director *
                <input
                  name="director"
                  value={form.director}
                  onChange={handleChange}
                  placeholder="Director name"
                  required
                />
              </label>

              <label>
                Release Date *
                <input
                  type="date"
                  name="release_date"
                  value={form.release_date}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label>
              Starring *
              <input
                name="starring"
                value={form.starring}
                onChange={handleChange}
                placeholder="Actor 1, Actor 2, Actor 3"
                required
              />
            </label>

            <label>
              Genres *
              <input
                name="genres"
                value={form.genres}
                onChange={handleChange}
                placeholder="Action, Thriller, Drama"
                required
              />
            </label>

            <div className="upload-grid">
              <label>
                Language *
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
                >
                  <option value="TAMIL">Tamil</option>
                  <option value="ENGLISH">English</option>
                </select>
              </label>

              <label>
                Default Quality *
                <select
                  name="quality"
                  value={form.quality}
                  onChange={handleChange}
                  required
                >
                  <option value="HD">HD</option>
                  <option value="FULL_HD">Full HD</option>
                </select>
              </label>
            </div>

            {/* NEW: Movie rating dropdown */}
            <label>
              Movie Rating (out of 10) *
              <select
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
            </label>
          </section>

          {/* 07. Movie poster and video */}
          <section className="upload-section">
            <h2>02. Movie Files</h2>

            <label className="upload-file-box">
              <span className="upload-file-icon">▧</span>
              <strong>Movie Poster *</strong>
              <span>Choose an image file</span>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                required
              />

              {logo && <small>Selected: {logo.name}</small>}
            </label>

            <label className="upload-file-box">
              <span className="upload-file-icon">▶</span>
              <strong>Movie Video *</strong>
              <span>Choose your movie video file</span>

              <input
                type="file"
                accept="video/*"
                onChange={(e) => setMovieFile(e.target.files?.[0] || null)}
                required
              />

              {movieFile && <small>Selected: {movieFile.name}</small>}
            </label>
          </section>

          {/* 08. Cancel and upload buttons */}
          <div className="upload-actions">
            <button
              type="button"
              className="upload-cancel-btn"
              onClick={() => navigate("/admin-dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="upload-submit-btn"
              disabled={loading}
            >
              {loading ? "Uploading..." : "↑ Upload Movie"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminMovieUpload;
