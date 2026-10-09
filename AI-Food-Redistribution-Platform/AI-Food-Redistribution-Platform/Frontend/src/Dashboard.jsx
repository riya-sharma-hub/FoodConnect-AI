import { useState } from "react";
import "./Dashboard.css";
import DonationForm from "./DonationForm";

function Dashboard({ role, onLogout }) {

  const [showDonationForm, setShowDonationForm] = useState(false);

  if (showDonationForm) {
    return (
      <DonationForm
        onBack={() => setShowDonationForm(false)}
      />
    );
  }

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">

        <div className="dashboard-brand">

          <div className="dashboard-mark">
            FC
          </div>

          <div>
            <h2>FoodConnect AI</h2>
            <span>Food Redistribution Platform</span>
          </div>

        </div>

        <div className="dashboard-user">

          <div className="user-info">
            <strong>{role || "Donor"}</strong>
            <span>Authenticated User</span>
          </div>

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>


      <main className="dashboard-content">

        <div className="dashboard-welcome">

          <div>

            <span className="dashboard-label">
              DASHBOARD
            </span>

            <h1>
              Welcome to FoodConnect AI
            </h1>

            <p>
              Manage food redistribution activities and
              access tools designed for your role.
            </p>

          </div>

          <div className="role-badge">
            {role || "Donor"}
          </div>

        </div>


        <section className="dashboard-grid">


          {/* FOOD DONATIONS */}

          <div
            className="dashboard-card donation-card"
            onClick={() => {
              console.log("Opening Donation Form");
              setShowDonationForm(true);
            }}
          >

            <div className="card-number">
              01
            </div>

            <h3>
              Food Donations
            </h3>

            <p>
              View and manage available surplus food donations.
            </p>

            <span className="card-action">
              Add Donation
            </span>

          </div>


          {/* FOOD REQUESTS */}

          <div className="dashboard-card">

            <div className="card-number">
              02
            </div>

            <h3>
              Food Requests
            </h3>

            <p>
              View food requirements submitted by organizations.
            </p>

          </div>


          {/* SMART MATCHING */}

          <div className="dashboard-card">

            <div className="card-number">
              03
            </div>

            <h3>
              Smart Matching
            </h3>

            <p>
              Identify suitable matches between donations and demand.
            </p>

          </div>


          {/* AI DEMAND FORECAST */}

          <div className="dashboard-card">

            <div className="card-number">
              04
            </div>

            <h3>
              AI Demand Forecast
            </h3>

            <p>
              Analyze predicted food requirements using the AI model.
            </p>

          </div>


        </section>

      </main>

    </div>
  );
}

export default Dashboard;