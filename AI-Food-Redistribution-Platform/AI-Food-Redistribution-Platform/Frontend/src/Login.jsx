import { useState } from "react";
import "./Login.css";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "FoodConnect@123";

function Login({ onBack, onCreateAccount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Donor");
  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();
    setError("");

    /* =========================================
       ADMIN LOGIN
       ========================================= */

    if (role === "Admin") {
      if (
        email.trim().toLowerCase() !== ADMIN_USERNAME ||
        password !== ADMIN_PASSWORD
      ) {
        setError("Invalid administrator username or password.");
        return;
      }

      localStorage.setItem("foodconnect_role", "Admin");
      localStorage.setItem("foodconnect_email", "admin");

      window.location.reload();
      return;
    }

    /* =========================================
       NORMAL USER LOGIN
       ========================================= */

    if (!email || !password) {
      setError("Please enter both email address and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    localStorage.setItem("foodconnect_role", role);
    localStorage.setItem("foodconnect_email", email);

    window.location.reload();
  };

  return (
    <div className="login-page">

      {/* BACKGROUND */}

      <div className="login-bg-circle circle-one"></div>
      <div className="login-bg-circle circle-two"></div>
      <div className="login-bg-circle circle-three"></div>

      {/* TOP BAR */}

      <div className="login-topbar">

        <div className="login-brand">

          <div className="brand-mark">
            FC
          </div>

          <div>
            <div className="brand-name">
              FoodConnect <span>AI</span>
            </div>

            <div className="brand-subtitle">
              Food Redistribution Platform
            </div>
          </div>

        </div>

        <button
          type="button"
          className="back-home-btn"
          onClick={onBack}
        >
          ← Back to Home
        </button>

      </div>

      {/* LOGIN LAYOUT */}

      <div className="login-layout">

        {/* LEFT SIDE */}

        <section className="login-intro">

          <div className="intro-content">

            <div className="intro-label">
              FOOD • COMMUNITY • IMPACT
            </div>

            <h1>
              Welcome to
              <br />
              <span>FoodConnect AI</span>
            </h1>

            <p className="intro-description">
              Connecting food donors, restaurants, NGOs and
              volunteers to make food redistribution smarter
              and more efficient.
            </p>

            {/* IMPACT CARDS */}

            <div className="impact-cards">

              <div className="impact-card">
                <strong>500+</strong>

                <span>
                  Meals Connected
                </span>

                <div className="impact-symbol">
                  ◇
                </div>
              </div>

              <div className="impact-card">
                <strong>50+</strong>

                <span>
                  Restaurants
                </span>

                <div className="impact-symbol">
                  +
                </div>
              </div>

              <div className="impact-card">
                <strong>30+</strong>

                <span>
                  NGOs
                </span>

                <div className="impact-symbol">
                  ○
                </div>
              </div>

              <div className="impact-card">
                <strong>100+</strong>

                <span>
                  Volunteers
                </span>

                <div className="impact-symbol">
                  ♥
                </div>
              </div>

            </div>

            {/* FOOD VISUAL */}

            <div className="food-visual">

              <div className="food-box">

                <div className="food-leaf leaf-one"></div>
                <div className="food-leaf leaf-two"></div>
                <div className="food-leaf leaf-three"></div>

                <div className="food-item item-green"></div>
                <div className="food-item item-red"></div>
                <div className="food-item item-orange"></div>
                <div className="food-item item-yellow"></div>

                <div className="food-container-label">
                  FoodConnect AI
                </div>

              </div>

              <div className="food-message">

                <span>
                  Good food,
                </span>

                <strong>
                  brighter tomorrows
                </strong>

                <div className="message-line"></div>

              </div>

            </div>

          </div>

        </section>

        {/* RIGHT SIDE */}

        <section className="login-panel">

          <div className="login-card">

            {/* LOGIN LOGO */}

            <div className="login-card-logo">
              FC
            </div>

            {/* HEADING */}

            <div className="login-heading">

              <div className="login-label">
                WELCOME BACK
              </div>

              <h2>
                Sign in to your account
              </h2>

              <p>
                Select your role to continue.
              </p>

            </div>

            {/* FORM */}

            <form
              className="login-form"
              onSubmit={handleLogin}
            >

              {/* EMAIL / ADMIN USERNAME */}

              <div className="input-group">

                <label htmlFor="email">
                  {role === "Admin"
                    ? "Administrator Username"
                    : "Email Address"}
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    @
                  </span>

                  <input
                    id="email"
                    type="text"
                    placeholder={
                      role === "Admin"
                        ? "Enter admin username"
                        : "Enter your email address"
                    }
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="input-group">

                <label htmlFor="password">
                  Password
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    *
                  </span>

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                  />

                </div>

              </div>

              {/* OPTIONS */}

              <div className="login-options">

                <label className="remember">

                  <input type="checkbox" />

                  <span>
                    Remember me
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-btn"
                >
                  Forgot Password?
                </button>

              </div>

              {/* ROLE HEADING */}

              <div className="role-heading">

                <h3>
                  Login As
                </h3>

                <p>
                  Choose the account type you want
                  to access.
                </p>

              </div>

              {/* ROLE SELECTION */}

              <div className="role-selection">

                {/* DONOR */}

                <button
                  type="button"
                  className={`role-card ${
                    role === "Donor"
                      ? "active-role"
                      : ""
                  }`}
                  onClick={() => setRole("Donor")}
                >

                  <span className="role-icon">
                    D
                  </span>

                  <span className="role-text">

                    <strong>
                      Donor
                    </strong>

                    <small>
                      Donate food
                    </small>

                  </span>

                  <span className="role-arrow">
                    →
                  </span>

                </button>

                {/* RESTAURANT */}

                <button
                  type="button"
                  className={`role-card ${
                    role === "Restaurant"
                      ? "active-role"
                      : ""
                  }`}
                  onClick={() => setRole("Restaurant")}
                >

                  <span className="role-icon">
                    R
                  </span>

                  <span className="role-text">

                    <strong>
                      Restaurant
                    </strong>

                    <small>
                      Manage food
                    </small>

                  </span>

                  <span className="role-arrow">
                    →
                  </span>

                </button>

                {/* NGO */}

                <button
                  type="button"
                  className={`role-card ${
                    role === "NGO"
                      ? "active-role"
                      : ""
                  }`}
                  onClick={() => setRole("NGO")}
                >

                  <span className="role-icon">
                    N
                  </span>

                  <span className="role-text">

                    <strong>
                      NGO
                    </strong>

                    <small>
                      Request food
                    </small>

                  </span>

                  <span className="role-arrow">
                    →
                  </span>

                </button>

                {/* VOLUNTEER */}

                <button
                  type="button"
                  className={`role-card ${
                    role === "Volunteer"
                      ? "active-role"
                      : ""
                  }`}
                  onClick={() => setRole("Volunteer")}
                >

                  <span className="role-icon">
                    V
                  </span>

                  <span className="role-text">

                    <strong>
                      Volunteer
                    </strong>

                    <small>
                      Deliver food
                    </small>

                  </span>

                  <span className="role-arrow">
                    →
                  </span>

                </button>

                {/* =================================
                    ADMIN
                    ================================= */}

                <button
                  type="button"
                  className={`role-card ${
                    role === "Admin"
                      ? "active-role"
                      : ""
                  }`}
                  onClick={() => setRole("Admin")}
                >

                  <span className="role-icon">
                    A
                  </span>

                  <span className="role-text">

                    <strong>
                      Admin
                    </strong>

                    <small>
                      Manage platform
                    </small>

                  </span>

                  <span className="role-arrow">
                    →
                  </span>

                </button>

              </div>

              {/* ADMIN INFORMATION */}

              {role === "Admin" && (
                <div
                  style={{
                    marginTop: "14px",
                    marginBottom: "14px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "#fff4ed",
                    border: "1px solid #ffd8c7",
                    color: "#8a3d1e",
                    textAlign: "left",
                    fontSize: "11px",
                    lineHeight: "1.5"
                  }}
                >

                  <strong>
                    Administrator Login
                  </strong>

                  <br />

                  Username:
                  <strong>
                    {" "}admin
                  </strong>

                  <br />

                  Password:
                  <strong>
                    {" "}FoodConnect@123
                  </strong>

                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="login-submit"
              >

                {role === "Admin"
                  ? "Login as Admin"
                  : "Login"}

                <span>
                  →
                </span>

              </button>

              {/* CREATE ACCOUNT */}

              {role !== "Admin" &&
                onCreateAccount && (
                  <button
                    type="button"
                    className="admin-create-link"
                    onClick={onCreateAccount}
                  >
                    Create an account
                  </button>
                )}

            </form>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Login;