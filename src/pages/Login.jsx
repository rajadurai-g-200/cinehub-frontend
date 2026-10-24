import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import API from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  // Gmail OTP login
  const handleSendOTP = async (event) => {
    event.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@gmail\.com$/i.test(cleanEmail)) {
      showMessage("Please enter a valid Gmail address.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/send-otp/", {
        email: cleanEmail,
      });

      localStorage.setItem("loginEmail", cleanEmail);

      showMessage(
        response.data?.message || "OTP sent successfully.",
        "success",
      );

      navigate("/otp");
    } catch (error) {
      console.error("Send OTP error:", error.response?.data || error.message);

      showMessage(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Unable to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;

    if (!credential) {
      showMessage("Google did not return a login credential.");
      return;
    }

    setGoogleLoading(true);
    setMessage("");

    try {
      const response = await API.post("/auth/google/", {
        credential,
      });

      const data = response.data;

      const accessToken = data.access || data.accessToken || data.access_token;

      const refreshToken =
        data.refresh || data.refreshToken || data.refresh_token;

      const user = data.user;

      if (!accessToken || !user) {
        console.error("Unexpected Google login response:", data);
        showMessage("The server did not return the login details.");
        return;
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }

      

      const role = String(user.role || "USER").toUpperCase();

      let destination = "/";

      if (
        user.is_staff === true ||
        user.is_superuser === true ||
        role === "ADMIN"
      ) {
        destination = "/admin-dashboard";
      } else if (data.is_new_user === true) {
        destination = "/profile-setup";
      } else if (role === "CREATOR") {
        destination = "/creator-dashboard";
      }

      navigate(destination, { replace: true });
    } catch (error) {
      console.error(
        "Google login error:",
        error.response?.data || error.message,
      );

      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.response?.data?.error;

      if (typeof serverMessage === "string" && serverMessage.trim()) {
        showMessage(serverMessage);
      } else if (error.response?.status === 401) {
        showMessage(
          "Google token verification failed. Check that React and Django use the same Google Client ID.",
        );
      } else if (!error.response) {
        showMessage(
          "Cannot connect to Django. Check that the backend is running.",
        );
      } else {
        showMessage("Google login failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    showMessage(
      "Google sign-in failed. Check your OAuth configuration and try again.",
    );
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="cinehub-logo">C</div>

          <h1>
            Cine<span>Hub</span>
          </h1>
        </div>

        <p className="login-subtitle">Watch movies. Discover stories.</p>

        <form onSubmit={handleSendOTP} className="login-form">
          <label htmlFor="login-email">Gmail Address</label>

          <input
            id="login-email"
            type="email"
            name="email"
            value={email}
            placeholder="example@gmail.com"
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            disabled={loading || googleLoading}
          />

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="otp-button"
          >
            {loading ? "Sending OTP..." : "Continue with Gmail"}
          </button>
        </form>

        <div className="login-divider">
          <span />
          <p>OR</p>
          <span />
        </div>

        <div className="google-login-container">
          {googleLoading ? (
            <p>Signing in with Google...</p>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="350"
            />
          )}
        </div>

        {message && (
          <div
            className={`login-message ${
              messageType === "success" ? "success" : "error"
            }`}
            role="alert"
          >
            {message}
          </div>
        )}

        <p className="login-footer">
          By continuing, you agree to CineHub's terms and privacy policy.
        </p>
      </div>
    </div>
  );
}

export default Login;
