import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./OTP.css";

function OTP() {
  const navigate = useNavigate();

  // Get email saved by Login.jsx
  const email = localStorage.getItem("loginEmail") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // VERIFY OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email not found. Please go back and login again.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/verify-otp/", {
        email,
        otp,
      });

      console.log("OTP verification response:", response.data);

      const data = response.data;

      // Support either access/refresh or accessToken/refreshToken
      const accessToken = data.access || data.accessToken;
      const refreshToken = data.refresh || data.refreshToken;

      if (!accessToken) {
        setError("Access token was not received from the server.");
        return;
      }

      // Save JWT tokens
      localStorage.setItem("accessToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }

      // Save user information if returned
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Remove temporary login email only after successful verification
      localStorage.removeItem("loginEmail");

      // Redirect based on server-provided role
      const user = data.user || {};

      if (
        user.is_staff === true ||
        user.is_superuser === true ||
        user.role === "ADMIN"
      ) {
        navigate("/admin-dashboard");
      } else {
        navigate("/profile-setup");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      console.error("Server response:", err.response?.data);

      if (err.response?.status === 400) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Invalid or expired OTP."
        );
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please request a new OTP.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to verify OTP. Please try again."
        );
      }

      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  // CHANGE EMAIL
  const handleChangeEmail = () => {
    localStorage.removeItem("loginEmail");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setOtp("");
    setError("");

    navigate("/login");
  };

  // OTP INPUT
  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 6) {
      setOtp(value);
      setError("");
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card">
        <div className="otp-icon">🔐</div>

        <h1>Verify OTP</h1>

        <p className="otp-text">
          We sent a 6-digit OTP to
        </p>

        <strong className="user-email">
          {email || "your Gmail"}
        </strong>

        <form onSubmit={handleVerifyOTP}>
          <label htmlFor="otp">Enter OTP</label>

          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={otp}
            autoFocus
            autoComplete="one-time-code"
            onChange={handleOTPChange}
            disabled={loading || !email}
            required
          />

          {error && (
            <div className="otp-error">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || otp.length !== 6}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button
          type="button"
          className="change-email"
          onClick={handleChangeEmail}
        >
          ← Change Email
        </button>
      </div>
    </div>
  );
}

export default OTP;

