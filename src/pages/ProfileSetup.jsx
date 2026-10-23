import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./ProfileSetup.css";

function ProfileSetup() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [name, setName] = useState(user.username || "");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");

      const response = await API.post(
        "/auth/profile-setup/",
        {
          username: name.trim(),
          role: role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/");
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Profile setup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-card">
        <div className="setup-icon">🎬</div>

        <h1>Welcome to CineHub</h1>

        <p>Complete your profile to continue</p>

        <form onSubmit={handleSubmit}>
          <label>Your Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Choose Your Role</label>

          <div className="role-options">
            <button
              type="button"
              className={role === "USER" ? "role-card active" : "role-card"}
              onClick={() => setRole("USER")}
            >
              <span>👤</span>

              <strong>User</strong>

              <small>Watch and enjoy movies</small>
            </button>

            <button
              type="button"
              className={role === "CREATOR" ? "role-card active" : "role-card"}
              onClick={() => setRole("CREATOR")}
            >
              <span>🎥</span>

              <strong>Creator</strong>

              <small>Upload and publish movies</small>
            </button>
          </div>

          {error && <div className="setup-error">❌ {error}</div>}

          <button className="continue-button" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;
