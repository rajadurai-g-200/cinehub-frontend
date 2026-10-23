import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AdminUploadMovie.css";

export default function AdminUploadMovie() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    release_date: "",
    director: "",
    starring: "",
    genres: "",
    language: "Tamil",
    quality: "1080p",
    rating: "0",
    logo: null,
    movie_file: null,
  });

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((old) => ({
      ...old,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const body = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") body.append(key, value);
      });

      // This endpoint must permit admin uploads in your Django backend.
      await API.post("/movies/admin/upload/", body);

      setMessage("Movie uploaded successfully!");
      setForm({
        title: "",
        release_date: "",
        director: "",
        starring: "",
        genres: "",
        language: "Tamil",
        quality: "1080p",
        rating: "0",
        logo: null,
        movie_file: null,
      });

      event.target.reset();
    } catch (error) {
      console.error("Admin movie upload error:", error.response?.data);
      setMessage(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Upload failed. Check your Django upload endpoint."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-upload-page">
      <header className="admin-upload-header">
        <h1>🎬 CineHub — Admin Upload</h1>
        <button type="button" onClick={() => navigate("/admin-dashboard")}>
          ← Back to Admin
        </button>
      </header>

      <form className="admin-upload-form" onSubmit={handleSubmit}>
        <h2>Upload a Movie</h2>

        <label>
          Movie title *
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Release date *
          <input type="date" name="release_date" value={form.release_date}
            onChange={handleChange} required />
        </label>

        <label>
          Director *
          <input name="director" value={form.director} onChange={handleChange} required />
        </label>

        <label>
          Starring
          <input name="starring" value={form.starring} onChange={handleChange} />
        </label>

        <label>
          Genres *
          <input name="genres" value={form.genres} onChange={handleChange}
            placeholder="Action, Thriller" required />
        </label>

        <label>
          Language
          <select name="language" value={form.language} onChange={handleChange}>
            <option>Tamil</option>
            <option>English</option>
            <option>Telugu</option>
            <option>Hindi</option>
            <option>Malayalam</option>
            <option>Kannada</option>
          </select>
        </label>

        <label>
          Quality
          <select name="quality" value={form.quality} onChange={handleChange}>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
          </select>
        </label>

        <label>
          Rating (0–10)
          <input type="number" name="rating" min="0" max="10" step="0.1"
            value={form.rating} onChange={handleChange} />
        </label>

        <label>
          Movie logo / poster *
          <input type="file" name="logo" accept="image/*"
            onChange={handleChange} required />
        </label>

        <label>
          Movie video *
          <input type="file" name="movie_file" accept="video/*"
            onChange={handleChange} required />
        </label>

        {message && <p role="status">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "⬆ Upload Movie"}
        </button>
      </form>
    </div>
  );
}

