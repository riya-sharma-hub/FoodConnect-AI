import { useState } from "react";
import "./CreateAccount.css";

function CreateAccount({ onBackToLogin, role }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: role || "Donor",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name || !email || !formData.password || !formData.confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    localStorage.setItem("foodconnect_name", name);
    localStorage.setItem("foodconnect_email", email);
    localStorage.setItem("foodconnect_role", formData.role);

    setSuccess(
      "Account details saved successfully. You can now sign in."
    );
  };

  return (
    <div className="create-account-page">

      <div className="create-account-decoration decoration-one" />
      <div className="create-account-decoration decoration-two" />

      {/* HEADER */}

      <header className="create-account-header">

        <div className="create-account-brand">

          <div className="create-brand-mark">
            FC
          </div>

          <div>
            <div className="create-brand-name">
              FoodConnect <span>AI</span>
            </div>

            <div className="create-brand-subtitle">
              Food Redistribution Platform
            </div>
          </div>

        </div>

        <button
          type="button"
          className="create-back-button"
          onClick={onBackToLogin}
        >
          ← Back to Login
        </button>

      </header>

      {/* MAIN */}

      <main className="create-account-main">

        <section className="create-account-card">

          <div className="create-account-icon">
            FC
          </div>

          <div className="create-account-heading">

            <p className="create-eyebrow">
              JOIN FOODCONNECT AI
            </p>

            <h1>
              Create your account
            </h1>

            <p>
              Set up your account to participate in
              community food redistribution.
            </p>

          </div>

          <form
            className="create-account-form"
            onSubmit={handleSubmit}
          >

            {/* NAME */}

            <div className="create-input-group">

              <label htmlFor="create-name">
                Full Name
              </label>

              <input
                id="create-name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />

            </div>

            {/* EMAIL */}

            <div className="create-input-group">

              <label htmlFor="create-email">
                Email Address
              </label>

              <input
                id="create-email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />

            </div>

            {/* ROLE */}

            <div className="create-input-group">

              <label htmlFor="create-role">
                Account Type
              </label>

              <select
                id="create-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="Donor">
                  Donor
                </option>

                <option value="Restaurant">
                  Restaurant
                </option>

                <option value="NGO">
                  NGO
                </option>

                <option value="Volunteer">
                  Volunteer
                </option>
              </select>

            </div>

            {/* PASSWORD GRID */}

            <div className="create-password-grid">

              <div className="create-input-group">

                <label htmlFor="create-password">
                  Password
                </label>

                <input
                  id="create-password"
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

              </div>

              <div className="create-input-group">

                <label htmlFor="create-confirm-password">
                  Confirm Password
                </label>

                <input
                  id="create-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="create-message create-error">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="create-message create-success">
                {success}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="create-submit-button"
            >
              Create Account
              <span>→</span>
            </button>

          </form>

          <div className="create-login-footer">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={onBackToLogin}
            >
              Sign in
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default CreateAccount;