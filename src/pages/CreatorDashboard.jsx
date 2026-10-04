import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function CreatorDashboard() {
  const navigate = useNavigate();

  // =====================================================
  // FORM DATA
  // =====================================================

  const [form, setForm] = useState({
    title: "",
    release_date: "",
    director: "",
    starring: "",
    genres: "",
    language: "TAMIL",
    quality: "HD",
    rating: "",
  });

  // =====================================================
  // FILE STATES
  // =====================================================

  const [logo, setLogo] = useState(null);
  const [movieFile, setMovieFile] = useState(null);

  // =====================================================
  // UI STATES
  // =====================================================

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // HANDLE TEXT INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  // =====================================================
  // HANDLE LOGO
  // =====================================================

  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setLogo(null);
      return;
    }

    console.log("Selected logo:", file);

    // Check image type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      e.target.value = "";
      setLogo(null);
      return;
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError("Movie logo must be less than 5 MB.");
      e.target.value = "";
      setLogo(null);
      return;
    }

    setLogo(file);
    setError("");
    setMessage("");
  };

  // =====================================================
  // HANDLE MOVIE FILE
  // =====================================================

  const handleMovieFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setMovieFile(null);
      return;
    }

    console.log("Selected movie:", file);

    // Check video type
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      e.target.value = "";
      setMovieFile(null);
      return;
    }

    setMovieFile(file);
    setError("");
    setMessage("");
  };

  // =====================================================
  // SUBMIT MOVIE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!form.title.trim()) {
      setError("Please enter the movie name.");
      setLoading(false);
      return;
    }

    if (!form.release_date) {
      setError("Please select the release date.");
      setLoading(false);
      return;
    }

    if (!form.director.trim()) {
      setError("Please enter the director name.");
      setLoading(false);
      return;
    }

    if (!form.starring.trim()) {
      setError("Please enter the starring actors.");
      setLoading(false);
      return;
    }

    if (!form.genres.trim()) {
      setError("Please enter the movie genres.");
      setLoading(false);
      return;
    }

    if (!logo) {
      setError("Please select a movie logo.");
      setLoading(false);
      return;
    }

    if (!movieFile) {
      setError("Please select a movie file.");
      setLoading(false);
      return;
    }

    // ===================================================
    // CREATE FORMDATA
    // ===================================================

    const formData = new FormData();

    formData.append("title", form.title.trim());

    formData.append("release_date", form.release_date);

    formData.append("director", form.director.trim());

    formData.append("starring", form.starring.trim());

    formData.append("genres", form.genres.trim());

    formData.append("language", form.language);

    formData.append("quality", form.quality);

    formData.append("rating", form.rating || "0");

    // IMPORTANT:
    // These must match Django request.FILES.get()
    formData.append("logo", logo);
    formData.append("movie_file", movieFile);

    // ===================================================
    // DEBUG
    // ===================================================

    console.log("========== MOVIE UPLOAD ==========");

    for (const [key, value] of formData.entries()) {
      console.log(
        key,
        value instanceof File ? `${value.name} (${value.type})` : value,
      );
    }

    console.log("==================================");

    // ===================================================
    // API REQUEST
    // ===================================================

    try {
      const response = await API.post("/movies/create/", formData);

      console.log("Upload response:", response.data);

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        response.data.message ||
          "Movie submitted successfully for admin approval.",
      );

      // Reset form
      setForm({
        title: "",
        release_date: "",
        director: "",
        starring: "",
        genres: "",
        language: "TAMIL",
        quality: "HD",
        rating: "",
      });

      setLogo(null);
      setMovieFile(null);

      // Clear file inputs
      const logoInput = document.getElementById("logo");

      const movieInput = document.getElementById("movie_file");

      if (logoInput) {
        logoInput.value = "";
      }

      if (movieInput) {
        movieInput.value = "";
      }
    } catch (err) {
      console.error("Movie upload error:", err.response?.data || err);

      // =================================================
      // ERROR HANDLING
      // =================================================

      if (err.response?.status === 401) {
        setError("Your login session has expired. Please login again.");

        // Optional: clear expired authentication
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      } else if (err.response?.status === 403) {
        setError(
          err.response?.data?.message || "Only creators can upload movies.",
        );
      } else if (err.response?.status === 400) {
        setError(
          err.response?.data?.message ||
            "Please check the movie details and files.",
        );
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.response?.data?.message || "Movie upload failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // BACK HOME
  // =====================================================

  const handleBackHome = () => {
    navigate("/");
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginEmail");

    navigate("/login");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="creator-page">
      <div className="creator-card">
        {/* HEADER */}
        <div className="creator-header">
          <div>
            <h1>🎬 Creator Dashboard</h1>

            <p className="subtitle">Upload your movie for admin approval</p>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* SUCCESS MESSAGE */}

        {message && <div className="success-message">✅ {message}</div>}

        {/* ERROR MESSAGE */}

        {error && <div className="error-message">❌ {error}</div>}

        {/* FORM */}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* =========================================
              MOVIE LOGO
          ========================================= */}

          <div className="form-group">
            <label htmlFor="logo">Movie Logo</label>

            <input
              id="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
            />

            {logo && <p className="file-selected">✅ {logo.name}</p>}
          </div>

          {/* =========================================
              MOVIE FILE
          ========================================= */}

          <div className="form-group">
            <label htmlFor="movie_file">Movie File</label>

            <input
              id="movie_file"
              type="file"
              accept="video/*"
              onChange={handleMovieFileChange}
            />

            {movieFile && <p className="file-selected">✅ {movieFile.name}</p>}
          </div>

          {/* =========================================
              MOVIE NAME
          ========================================= */}

          <div className="form-group">
            <label htmlFor="title">Movie Name</label>

            <input
              id="title"
              type="text"
              name="title"
              placeholder="Enter movie name"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          {/* =========================================
              RELEASE DATE
          ========================================= */}

          <div className="form-group">
            <label htmlFor="release_date">Release Date</label>

            <input
              id="release_date"
              type="date"
              name="release_date"
              value={form.release_date}
              onChange={handleChange}
            />
          </div>

          {/* =========================================
              DIRECTOR
          ========================================= */}

          <div className="form-group">
            <label htmlFor="director">Director</label>

            <input
              id="director"
              type="text"
              name="director"
              placeholder="Enter director name"
              value={form.director}
              onChange={handleChange}
            />
          </div>

          {/* =========================================
              STARRING
          ========================================= */}

          <div className="form-group">
            <label htmlFor="starring">Starring</label>

            <input
              id="starring"
              type="text"
              name="starring"
              placeholder="Actor, Sub Actor"
              value={form.starring}
              onChange={handleChange}
            />
          </div>

          {/* =========================================
              GENRES
          ========================================= */}

          <div className="form-group">
            <label htmlFor="genres">Genres</label>

            <input
              id="genres"
              type="text"
              name="genres"
              placeholder="Action, Thriller"
              value={form.genres}
              onChange={handleChange}
            />
          </div>

          {/* =========================================
              LANGUAGE
          ========================================= */}

          <div className="form-group">
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

          {/* =========================================
              QUALITY
          ========================================= */}

          <div className="form-group">
            <label htmlFor="quality">Quality</label>

            <select
              id="quality"
              name="quality"
              value={form.quality}
              onChange={handleChange}
            >
              <option value="HD">HD</option>

              <option value="FULL_HD">Full HD</option>
            </select>
          </div>

          {/* =========================================
              RATING
          ========================================= */}

          <div className="form-group">
            <label htmlFor="rating">Movie Rating</label>

            <input
              id="rating"
              type="number"
              name="rating"
              min="0"
              max="10"
              step="0.1"
              placeholder="8.5"
              value={form.rating}
              onChange={handleChange}
            />
          </div>

          {/* =========================================
              SUBMIT
          ========================================= */}

          <button type="submit" className="upload-button" disabled={loading}>
            {loading ? "⏳ Uploading..." : "🚀 Submit Movie for Approval"}
          </button>
        </form>

        {/* BACK BUTTON */}

        <button type="button" className="back-button" onClick={handleBackHome}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default CreatorDashboard;
