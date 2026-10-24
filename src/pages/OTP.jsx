import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./OTP.css";

function getDestination(user, isNewUser = false) {
  const role = String(user?.role || "USER").toUpperCase();

  if (
    user?.is_staff === true ||
    user?.is_superuser === true ||
    role === "ADMIN"
  ) {
    return "/admin-dashboard";
  }

  if (isNewUser) {
    return "/profile-setup";
  }

  if (role === "CREATOR") {
    return "/creator-dashboard";
  }

  return "/";
}

function OTP() {
  const navigate = useNavigate();
  const email = localStorage.getItem("loginEmail") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Email not found. Please go back and log in again.");
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

      const data = response.data;
      const accessToken = data.access || data.accessToken;
      const refreshToken = data.refresh || data.refreshToken;
      const user = data.user;

      if (!accessToken || !user) {
        setError("The server did not return complete login details.");
        return;
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }

      localStorage.removeItem("loginEmail");

      navigate(getDestination(user, data.is_new_user === true), {
        replace: true,
      });
    } catch (err) {
      console.error(
        "OTP verification error:",
        err.response?.data || err.message
      );

      const statusCode = err.response?.status;
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error;

      if (statusCode === 400) {
        setError(serverMessage || "Invalid or expired OTP.");
      } else if (statusCode === 401) {
        setError("Authentication failed. Please request a new OTP.");
      } else if (statusCode >= 500) {
        setError(serverMessage || "Server error. Please try again later.");
      } else {
        setError(serverMessage || "Unable to verify OTP. Please try again.");
      }

      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    localStorage.removeItem("loginEmail");
    setOtp("");
    setError("");
    navigate("/login");
  };

  const handleOTPChange = (event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setError("");
  };

  return (
    <div className="otp-page">
      <div className="otp-card">
        <div className="otp-icon">🔐</div>

        <h1>Verify OTP</h1>

        <p className="otp-text">We sent a 6-digit OTP to</p>

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
            autoComplete="one-time-code"
            autoFocus
            onChange={handleOTPChange}
            disabled={loading || !email}
            required
          />

          {error && (
            <div className="otp-error" role="alert">
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
