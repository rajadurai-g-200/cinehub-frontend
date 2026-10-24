import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./RoleSelection.css";

function RoleSelection() {
  const navigate = useNavigate();

  const chooseRole = async (role) => {
    try {
      // Save the chosen role in Django.
      const response = await API.patch("/auth/select-role/", {
        role,
      });

      const user = response.data.user;

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        const existingUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        localStorage.setItem(
          "user",
          JSON.stringify({ ...existingUser, role })
        );
      }

      navigate(
        role === "CREATOR" ? "/creator-dashboard" : "/",
        { replace: true }
      );
    } catch (error) {
      console.error(
        "Role selection error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Unable to save your selection. Please try again."
      );
    }
  };

  return (
    <div className="role-page">
      <header className="role-navbar">
        <div className="role-brand">
          <span className="role-logo">C</span>
          <h2>Cine<span>Hub</span></h2>
        </div>
        <button onClick={() => navigate("/")} className="role-home">
          Home
        </button>
      </header>

      <main className="role-main">
        <div className="role-heading">
          <span className="role-eyebrow">YOUR CINEHUB EXPERIENCE</span>
          <h1>Welcome to Cine<span>Hub</span></h1>
          <p>Choose how you want to continue.</p>
        </div>

        <div className="role-cards">
          <article className="role-card user-card">
            <div className="role-art user-art">
              <span>🎬</span>
            </div>
            <div className="role-card-content">
              <span className="role-tag">WATCH & DISCOVER</span>
              <h2>Movie User</h2>
              <p>
                Explore movies, discover stories, and enjoy your
                favourite entertainment.
              </p>
              <button onClick={() => chooseRole("USER")}>
                Continue as User <span>→</span>
              </button>
            </div>
          </article>

          <article className="role-card creator-card">
            <div className="role-art creator-art">
              <span>🎥</span>
            </div>
            <div className="role-card-content">
              <span className="role-tag">CREATE & SHARE</span>
              <h2>Movie Creator</h2>
              <p>
                Upload your movies, manage submissions, and track
                admin approval.
              </p>
              <button onClick={() => chooseRole("CREATOR")}>
                Continue as Creator <span>→</span>
              </button>
            </div>
          </article>
        </div>

        <p className="role-footer">
          Choose your role to get started with CineHub.
        </p>
      </main>
    </div>
  );
}

export default RoleSelection;

