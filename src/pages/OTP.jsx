import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function OTP() {
  const navigate = useNavigate();

  // Get email from Login page
  const email = localStorage.getItem("loginEmail");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    // Check email
    if (!email) {
      setError("Email not found. Please go back and login again.");
      return;
    }

    // Check OTP
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    // OTP must be 6 digits
    if (otp.length !== 6) {
      setError("OTP must contain 6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send OTP to Django
      const response = await API.post("/auth/verify-otp/", {
        email: email,
        otp: otp,
      });

      console.log("OTP verification response:", response.data);

      // =================================================
      // SAVE JWT TOKENS
      // =================================================

      if (!response.data.access) {
        setError("Access token was not received from server.");
        return;
      }

      localStorage.setItem("accessToken", response.data.access);

      localStorage.setItem("refreshToken", response.data.refresh);

      // =================================================
      // SAVE USER INFORMATION
      // =================================================

      localStorage.setItem("user", JSON.stringify(response.data.user));

      // =================================================
      // OTP EMAIL NO LONGER NEEDED
      // =================================================

      localStorage.removeItem("loginEmail");

      // =================================================
      // GO TO PROFILE SETUP
      // =================================================

      navigate("/profile-setup");
    } catch (err) {
      console.error("OTP verification error:", err);

      console.error("Server response:", err.response?.data);

      if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid or expired OTP.");
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please request a new OTP.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.response?.data?.message || "Unable to verify OTP.");
      }

      // Clear OTP
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHANGE EMAIL
  // =====================================================

  const handleChangeEmail = () => {
    // Remove login email
    localStorage.removeItem("loginEmail");

    // Remove old authentication data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setOtp("");
    setError("");

    navigate("/login");
  };

  // =====================================================
  // OTP INPUT CHANGE
  // =====================================================

  const handleOTPChange = (e) => {
    // Allow only numbers
    const value = e.target.value.replace(/\D/g, "");

    // Maximum 6 digits
    if (value.length <= 6) {
      setOtp(value);
      setError("");
    }
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="otp-page">
      <div className="otp-card">
        {/* ICON */}
        <div className="otp-icon">🔐</div>

        {/* TITLE */}
        <h1>Verify OTP</h1>

        {/* DESCRIPTION */}
        <p className="otp-text">We sent a 6-digit OTP to</p>

        {/* EMAIL */}
        <strong className="user-email">{email || "your Gmail"}</strong>

        {/* FORM */}
        <form onSubmit={handleVerifyOTP}>
          {/* LABEL */}
          <label>Enter OTP</label>

          {/* OTP INPUT */}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={otp}
            autoFocus
            autoComplete="one-time-code"
            onChange={handleOTPChange}
          />

          {/* ERROR */}
          {error && <div className="otp-error">❌ {error}</div>}

          {/* VERIFY BUTTON */}
          <button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {/* CHANGE EMAIL */}
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
