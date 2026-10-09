import { useState } from "react";

import "./App.css";

import Login from "./Login";

import CreateAccount from "./CreateAccount";

import DonorHome from "./DonorHome";

import AddDonation from "./AddDonation";

import NGOHome from "./NGOHome";

import RestaurantHome from "./RestaurantHome";

import VolunteerHome from "./VolunteerHome";

import AdminHome from "./AdminHome";

const roles = [
  {
    title: "Donor",
    description: "Share surplus food.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
  },

  {
    title: "Restaurant",
    description: "Manage surplus meals.",
    image:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85",
  },

  {
    title: "NGO",
    description: "Request food for communities.",
    image:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=85",
  },

  {
    title: "Volunteer",
    description: "Help collect and deliver food.",
    image:
      "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=900&q=85",
  },

  {
    title: "Admin",
    description: "Monitor the entire platform.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85",
  },
];

const steps = [
  ["01", "Donate", "Donors list surplus food and its availability."],

  ["02", "Manage", "Restaurants coordinate available food with NGOs."],

  ["03", "Request", "NGOs estimate needs and request suitable food."],

  ["04", "Deliver", "Volunteers help collect and deliver accepted food."],

  [
    "05",
    "Redistribute",
    "Food reaches the community it is intended to support.",
  ],
];

function App() {
  const savedRole = localStorage.getItem("foodconnect_role");

  const [page, setPage] = useState(savedRole ? "dashboard" : "home");

  const [userRole, setUserRole] = useState(savedRole || "");

  const [selectedRole, setSelectedRole] = useState("");

  const goTo = (next) => {
    setPage(next);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const chooseRole = (role) => {
    setSelectedRole(role);
    goTo("login");
  };

  const logout = () => {
    localStorage.removeItem("foodconnect_role");

    localStorage.removeItem("foodconnect_email");

    setUserRole("");

    setSelectedRole("");

    goTo("home");
  };

  /* =========================================================
     CREATE ACCOUNT
     ========================================================= */

  if (page === "createAccount") {
    return (
      <CreateAccount
        onBackToLogin={() => goTo("login")}
        role={selectedRole}
      />
    );
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  if (page === "login") {
    return (
      <Login
        onBack={() => goTo("home")}
        onCreateAccount={() => goTo("createAccount")}
        role={selectedRole}
      />
    );
  }

  /* =========================================================
     ADD DONATION
     ========================================================= */

  if (page === "addDonation") {
    return (
      <AddDonation
        onBack={() => goTo("dashboard")}
      />
    );
  }

  /* =========================================================
     DASHBOARD / ROLE ROUTING
     ========================================================= */

  if (page === "dashboard") {
    /* ADMIN */

    if (userRole === "Admin") {
      return (
        <AdminHome
          onLogout={logout}
        />
      );
    }

    /* NGO */

    if (userRole === "NGO") {
      return (
        <NGOHome
          onLogout={logout}
        />
      );
    }

    /* RESTAURANT */

    if (userRole === "Restaurant") {
      return (
        <RestaurantHome
          onLogout={logout}
        />
      );
    }

    /* VOLUNTEER */

    if (userRole === "Volunteer") {
      return (
        <VolunteerHome
          onLogout={logout}
        />
      );
    }

    /* DONOR */

    return (
      <DonorHome
        onLogout={logout}
        onAddDonation={() => goTo("addDonation")}
      />
    );
  }

  /* =========================================================
     MAIN HOME PAGE
     ========================================================= */

  return (
    <div className="app" id="top">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="site-header">

        <button
          className="brand"
          onClick={() => goTo("home")}
          aria-label="FoodConnect AI home"
        >
          <span className="brand-name">
            FoodConnect <span>AI</span>
          </span>

          <span className="brand-tagline">
            SURPLUS FOOD. STRONGER COMMUNITIES.
          </span>
        </button>

        <nav
          className="main-nav"
          aria-label="Main navigation"
        >
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => goTo("home")}
          >
            Home
          </button>

          <button
            className={page === "involved" ? "active" : ""}
            onClick={() => goTo("involved")}
          >
            Get Involved
          </button>

          <button
            className={page === "howItWorks" ? "active" : ""}
            onClick={() => goTo("howItWorks")}
          >
            How It Works
          </button>

          <button
            className={page === "about" ? "active" : ""}
            onClick={() => goTo("about")}
          >
            About
          </button>
        </nav>

      </header>

      {/* =====================================================
          HOME
          ===================================================== */}

      {page === "home" && (
        <main className="home-screen">

          {/* HERO */}

          <section className="home-hero">

            <div className="hero-photo" />

            <div className="hero-shade" />

            <div className="hero-copy">

              <p className="eyebrow">
                COMMUNITY FOOD REDISTRIBUTION
              </p>

              <h1>
                When you have more than you need,{" "}
                <span>
                  build a longer table, not a higher fence.
                </span>
              </h1>

              <p className="hero-description">
                FoodConnect AI connects donors, restaurants,
                NGOs, and volunteers to help surplus food reach
                communities that need it.
              </p>

            </div>

          </section>

          {/* ROLE CARDS */}

          <section
            className="home-role-section"
            aria-label="Choose your role"
          >

            <div className="home-role-grid">

              {roles.map((role) => (
                <article
                  className="home-role-card"
                  key={role.title}
                >

                  <button
                    className="role-image-button"
                    onClick={() => chooseRole(role.title)}
                    aria-label={`Login as ${role.title}`}
                  >

                    <img
                      className="role-image"
                      src={role.image}
                      alt=""
                    />

                  </button>

                  <div className="role-card-content">

                    <h2>
                      {role.title}
                    </h2>

                    <p>
                      {role.description}
                    </p>

                    <button
                      className="role-link"
                      onClick={() =>
                        chooseRole(role.title)
                      }
                    >

                      <span>
                        Login as {role.title}
                      </span>

                      <span aria-hidden="true">
                        →
                      </span>

                    </button>

                  </div>

                </article>
              ))}

            </div>

          </section>

          {/* WORKFLOW */}

          <section className="home-workflow">

            <div className="workflow-heading">

              <p className="eyebrow">
                FROM SURPLUS TO SHARED MEALS
              </p>

              <h2>
                How FoodConnect <span>AI</span> Works
              </h2>

              <p>
                A simple process that helps food move where
                it is needed.
              </p>

            </div>

            <div className="workflow-steps">

              {steps.map(
                ([number, title, description]) => (
                  <article
                    className="workflow-step"
                    key={number}
                  >

                    <div className="workflow-step-number">
                      {number}
                    </div>

                    <div className="workflow-step-copy">

                      <h3>
                        {title}
                      </h3>

                      <p>
                        {description}
                      </p>

                    </div>

                  </article>
                )
              )}

            </div>

          </section>

        </main>
      )}

      {/* =====================================================
          GET INVOLVED
          ===================================================== */}

      {page === "involved" && (
        <main className="information-page">

          <div className="information-heading">

            <p className="eyebrow">
              BE PART OF THE CHANGE
            </p>

            <h1>
              Get involved
            </h1>

            <p>
              Choose the role that matches how you want to
              contribute to community food redistribution.
            </p>

          </div>

          <div className="information-role-grid">

            {roles.map((role) => (
              <article
                className="information-role-card"
                key={role.title}
              >

                <img
                  src={role.image}
                  alt=""
                />

                <div className="information-role-content">

                  <h2>
                    {role.title}
                  </h2>

                  <p>
                    {role.description}
                  </p>

                  <button
                    className="solid-button"
                    onClick={() =>
                      chooseRole(role.title)
                    }
                  >

                    Login as {role.title}

                    <span>
                      →
                    </span>

                  </button>

                </div>

              </article>
            ))}

          </div>

        </main>
      )}

      {/* =====================================================
          HOW IT WORKS
          ===================================================== */}

      {page === "howItWorks" && (
        <main className="information-page how-it-works-page">

          <div className="information-heading">

            <p className="eyebrow">
              FROM SURPLUS TO COMMUNITY SUPPORT
            </p>

            <h1>
              How FoodConnect AI Works
            </h1>

            <p>
              See how surplus food reaches communities through
              AI forecasting and volunteer support.
            </p>

          </div>

          <div className="process-flow">

            {/* STEP 1 */}

            <article className="process-step">

              <div className="process-number">
                01
              </div>

              <div className="process-content">

                <span className="process-participant">
                  DONORS AND RESTAURANTS
                </span>

                <h2>
                  Food Is Made Available
                </h2>

                <p>
                  Donors list surplus food. Restaurants receive
                  donations and list their own surplus meals.
                </p>

              </div>

            </article>

            <div className="process-connector">
              <span>
                Food availability
              </span>
            </div>

            {/* STEP 2 */}

            <article className="process-step process-ai-step">

              <div className="process-number">
                02
              </div>

              <div className="process-content">

                <span className="process-participant">
                  AI FORECASTING AND NGOs
                </span>

                <h2>
                  Food Requirements Are Predicted
                </h2>

                <p>
                  AI predicts NGO food needs. NGOs compare
                  the forecast with available food to identify
                  shortages.
                </p>

              </div>

            </article>

            <div className="process-connector">
              <span>
                Identified food requirements
              </span>
            </div>

            {/* STEP 3 */}

            <article className="process-step">

              <div className="process-number">
                03
              </div>

              <div className="process-content">

                <span className="process-participant">
                  NGOs AND CONNECTED RESTAURANTS
                </span>

                <h2>
                  Food Is Requested and Approved
                </h2>

                <p>
                  NGOs request food from connected restaurants.
                  Restaurants accept or decline each request.
                </p>

              </div>

            </article>

            <div className="process-connector">
              <span>
                Accepted food request
              </span>
            </div>

            {/* STEP 4 */}

            <article className="process-step process-volunteer-step">

              <div className="process-number">
                04
              </div>

              <div className="process-content">

                <span className="process-task-label">
                  VOLUNTEER TASK 1
                </span>

                <span className="process-participant">
                  RESTAURANT → NGO
                </span>

                <h2>
                  Food Is Collected and Delivered to the NGO
                </h2>

                <p>
                  Volunteers collect accepted food from
                  restaurants or designated pickup points
                  and deliver it to the NGO.
                </p>

              </div>

            </article>

            <div className="process-connector">
              <span>
                Food received by the NGO
              </span>
            </div>

            {/* STEP 5 */}

            <article className="process-step process-community-step">

              <div className="process-number">
                05
              </div>

              <div className="process-content">

                <span className="process-task-label">
                  VOLUNTEER TASK 2
                </span>

                <span className="process-participant">
                  NGO → BENEFICIARIES
                </span>

                <h2>
                  Food Reaches the Community
                </h2>

                <p>
                  NGOs organize food distribution. Volunteers
                  deliver food to beneficiaries or designated
                  community locations.
                </p>

              </div>

            </article>

          </div>

          <div className="process-summary">

            <p className="eyebrow">
              THE COMPLETE JOURNEY
            </p>

            <h2>
              From Surplus Food to Shared Meals
            </h2>

            <p>
              Donors provide food. AI helps NGOs plan their
              needs. Restaurants approve requests, and
              volunteers deliver food to NGOs and beneficiaries.
            </p>

          </div>

        </main>
      )}

      {/* =====================================================
          ABOUT
          ===================================================== */}

      {page === "about" && (
        <main className="information-page about-page">

          <div className="information-heading">

            <p className="eyebrow">
              ABOUT THE PROJECT
            </p>

            <h1>
              Turning surplus into shared support
            </h1>

            <p>
              FoodConnect AI is a community food redistribution
              and demand forecasting platform designed to make
              coordination between food contributors and community
              organizations easier.
            </p>

          </div>

          <div className="about-detail-grid">

            <article>

              <h2>
                Our purpose
              </h2>

              <p>
                The platform provides a shared place for food
                donors to list surplus food, restaurants to
                coordinate available meals with NGOs, and
                volunteers to support collection and delivery.
              </p>

            </article>

            <article>

              <h2>
                How AI helps
              </h2>

              <p>
                Demand forecasting estimates the quantity of
                food an NGO may need based on available demand
                data. This can support planning and help
                organizations identify possible shortages.
              </p>

            </article>

            <article>

              <h2>
                Built around collaboration
              </h2>

              <p>
                Each participant has a distinct role in the
                process, helping food information and delivery
                tasks move through a more organized workflow.
              </p>

            </article>

            <article>

              <h2>
                Project focus
              </h2>

              <p>
                The project explores how a digital platform
                and forecasting model can support food
                redistribution. Simulated or sample results
                represent project evaluation data, not verified
                real-world impact.
              </p>

            </article>

          </div>

        </main>
      )}

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="site-footer">

        <button
          className="footer-brand"
          onClick={() => goTo("home")}
        >
          FoodConnect <span>AI</span>
        </button>

        <p>
          Community food donation, redistribution and demand
          forecasting.
        </p>

      </footer>

    </div>
  );
}

export default App;