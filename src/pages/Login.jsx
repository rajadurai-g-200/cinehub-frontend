import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your Gmail address.");
      return;
    }

    if (!cleanEmail.endsWith("@gmail.com")) {
      setError("Please enter a valid Gmail address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post("/auth/send-otp/", {
        email: cleanEmail,
      });

      console.log("OTP Response:", response.data);

      // Save email for OTP page
      localStorage.setItem("loginEmail", cleanEmail);

      // Go to OTP page
      navigate("/otp");
    } catch (err) {
      console.error("OTP Error:", err);

      setError(err.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="cinehub-logo">🎬</div>

        <h1>CineHub</h1>

        <p className="tagline">Watch. Create. Enjoy.</p>

        <form onSubmit={handleSendOTP}>
          <label>Gmail Address</label>

          <input
            type="email"
            placeholder="Enter your Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          {error && <div className="login-error">❌ {error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
