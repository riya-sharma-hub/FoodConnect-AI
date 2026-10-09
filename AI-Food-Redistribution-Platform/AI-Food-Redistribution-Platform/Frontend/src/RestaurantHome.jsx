import { useMemo, useState } from "react";
import "./RestaurantHome.css";

const readStoredArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeStoredArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getUserName = () => {
  const savedName = localStorage.getItem("foodconnect_name");

  if (savedName && savedName.trim()) {
    return savedName.trim();
  }

  const email = localStorage.getItem("foodconnect_email");

  if (email && email.includes("@")) {
    return email.split("@")[0];
  }

  return "Restaurant Partner";
};

function RestaurantHome({ onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [refresh, setRefresh] = useState(0);
  const [showContributionForm, setShowContributionForm] =
    useState(false);

  const [foodType, setFoodType] = useState("Cooked meals");
  const [quantity, setQuantity] = useState("");
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");

  const [restaurantName, setRestaurantName] = useState(
    localStorage.getItem("foodconnect_restaurant_name") || ""
  );

  const userName = getUserName();

  const incomingDonations = useMemo(
    () => readStoredArray("foodconnect_donations"),
    [refresh]
  );

  const ngoRequests = useMemo(
    () => readStoredArray("foodconnect_restaurant_requests"),
    [refresh]
  );

  const contributions = useMemo(
    () =>
      readStoredArray(
        "foodconnect_restaurant_contributions"
      ),
    [refresh]
  );

  const volunteerTasks = useMemo(
    () =>
      readStoredArray("foodconnect_volunteer_tasks"),
    [refresh]
  );

  const pendingRequests = ngoRequests.filter(
    (request) =>
      String(request.status || "Pending").toLowerCase() ===
      "pending"
  ).length;

  const acceptedRequests = ngoRequests.filter(
    (request) =>
      String(request.status || "").toLowerCase() ===
      "accepted"
  ).length;

  const totalContributionUnits = contributions.reduce(
    (total, item) =>
      total + (Number(item.quantity) || 0),
    0
  );

  const refreshData = () => {
    setRefresh((value) => value + 1);
  };

  const getRequestName = (request) =>
    request.ngoName ||
    request.ngo ||
    "Community NGO";

  const getRequestArea = (request) =>
    request.area ||
    request.ngoArea ||
    request.restaurantArea ||
    "Not specified";

  const getRequestFood = (request) =>
    request.foodType ||
    request.foodName ||
    request.requestedFood ||
    "Cooked meals";

  const getRequestQuantity = (request) =>
    request.quantity ??
    request.requiredFood ??
    request.amount ??
    "Not specified";

  const getRequestDate = (request) =>
    request.neededBy ||
    request.requiredBy ||
    request.dateNeeded ||
    "Not specified";

  const formatDate = (value) => {
    if (!value) return "Not provided";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString();
  };

  const saveRestaurantName = (value) => {
    setRestaurantName(value);
    localStorage.setItem(
      "foodconnect_restaurant_name",
      value
    );
  };

  const submitContribution = (event) => {
    event.preventDefault();

    const numericQuantity = Number(quantity);

    if (!numericQuantity || numericQuantity <= 0) {
      window.alert(
        "Please enter a valid quantity."
      );
      return;
    }

    const existing = readStoredArray(
      "foodconnect_restaurant_contributions"
    );

    existing.unshift({
      id: Date.now(),
      restaurantName:
        restaurantName || "Restaurant",
      foodType,
      quantity: numericQuantity,
      expiry,
      notes: notes.trim(),
      status: "Available",
      createdAt: new Date().toISOString(),
    });

    writeStoredArray(
      "foodconnect_restaurant_contributions",
      existing
    );

    setQuantity("");
    setExpiry("");
    setNotes("");
    setShowContributionForm(false);

    refreshData();
  };

  const updateDonationStatus = (
    donationId,
    status
  ) => {
    const donations = readStoredArray(
      "foodconnect_donations"
    );

    const updated = donations.map((donation) =>
      String(donation.id) ===
      String(donationId)
        ? {
            ...donation,
            status,
          }
        : donation
    );

    writeStoredArray(
      "foodconnect_donations",
      updated
    );

    refreshData();
  };

  const updateRequestStatus = (
    requestId,
    status
  ) => {
    const requests = readStoredArray(
      "foodconnect_restaurant_requests"
    );

    const updated = requests.map((request) =>
      String(request.id) ===
      String(requestId)
        ? {
            ...request,
            status,
          }
        : request
    );

    writeStoredArray(
      "foodconnect_restaurant_requests",
      updated
    );

    refreshData();
  };

  const createVolunteerTask = (request) => {
    const tasks = readStoredArray(
      "foodconnect_volunteer_tasks"
    );

    const alreadyExists = tasks.some(
      (task) =>
        String(task.ngoRequestId) ===
        String(request.id)
    );

    if (alreadyExists) {
      window.alert(
        "A volunteer pickup task already exists for this request."
      );
      return;
    }

    tasks.push({
      id: Date.now(),
      ngoRequestId: request.id,
      restaurant:
        restaurantName ||
        request.restaurantName ||
        "Restaurant",
      restaurantArea:
        request.restaurantArea ||
        request.area ||
        "",
      ngo: getRequestName(request),
      ngoArea: getRequestArea(request),
      quantity: getRequestQuantity(request),
      foodType: getRequestFood(request),
      status: "Pending",
      createdAt: new Date().toISOString(),
    });

    writeStoredArray(
      "foodconnect_volunteer_tasks",
      tasks
    );

    refreshData();

    window.alert(
      "Volunteer pickup task created."
    );
  };

  const tabs = [
    ["overview", "Overview"],
    ["donations", "Incoming donations"],
    ["contributions", "My surplus food"],
    ["requests", "NGO requests"],
    ["ngos", "NGO connections"],
    ["tasks", "Pickup tasks"],
  ];

  return (
    <div className="restaurant-page">

      {/* HEADER */}

      <header className="restaurant-header">

        <div className="restaurant-brand">

          <div className="restaurant-logo">
            FC
          </div>

          <div className="restaurant-brand-copy">
            <strong>
              FoodConnect <span>AI</span>
            </strong>

            <small>
              Restaurant workspace
            </small>
          </div>

        </div>

        <div className="restaurant-header-right">

          <span className="restaurant-user-name">
            {userName}
          </span>

          <button
            type="button"
            className="restaurant-logout"
            onClick={onLogout}
          >
            Log out
          </button>

        </div>

      </header>

      <main className="restaurant-main">

        {/* HERO */}

        <section className="restaurant-hero">

          <div className="restaurant-hero-copy">

            <span className="restaurant-eyebrow">
              RESTAURANT WORKSPACE
            </span>

            <h1>
              {getGreeting()}, {userName}.
              <br />
              <span>
                Let&apos;s keep good food moving.
              </span>
            </h1>

            <p>
              Manage surplus food, review community
              requests, and coordinate pickups from
              one organized workspace.
            </p>

            <div className="hero-buttons">

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setActiveSection(
                    "contributions"
                  );
                  setShowContributionForm(true);
                }}
              >
                List surplus food
                <span>↗</span>
              </button>

              <button
                type="button"
                className="hero-text-button"
                onClick={() =>
                  setActiveSection("requests")
                }
              >
                Review NGO requests
              </button>

            </div>

          </div>

          <div
            className="restaurant-hero-visual"
            aria-hidden="true"
          >

            <div className="visual-ring ring-one" />
            <div className="visual-ring ring-two" />

            <div className="visual-circle">
              <div className="visual-plate">
                <div className="visual-food food-one" />
                <div className="visual-food food-two" />
                <div className="visual-food food-three" />
                <div className="visual-food food-four" />
              </div>
            </div>

            <div className="visual-leaf leaf-a" />
            <div className="visual-leaf leaf-b" />

            <div className="visual-label">
              SURPLUS
              <br />
              → COMMUNITY
            </div>

          </div>

        </section>

        {/* ACTUAL DATA STATS */}

        <section className="restaurant-stats">

          <article className="stat-card">
            <span className="stat-symbol">
              IN
            </span>

            <div>
              <small>
                INCOMING DONATIONS
              </small>

              <strong>
                {incomingDonations.length}
              </strong>

              <p>
                records available
              </p>
            </div>
          </article>

          <article className="stat-card featured-stat">
            <span className="stat-symbol">
              SF
            </span>

            <div>
              <small>
                SURPLUS FOOD
              </small>

              <strong>
                {contributions.length}
              </strong>

              <p>
                {totalContributionUnits}{" "}
                recorded meal units
              </p>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-symbol">
              NG
            </span>

            <div>
              <small>
                NGO REQUESTS
              </small>

              <strong>
                {ngoRequests.length}
              </strong>

              <p>
                {pendingRequests} pending
              </p>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-symbol">
              PK
            </span>

            <div>
              <small>
                PICKUP TASKS
              </small>

              <strong>
                {volunteerTasks.length}
              </strong>

              <p>
                recorded tasks
              </p>
            </div>
          </article>

        </section>

        {/* HORIZONTAL TABS */}

        <nav className="restaurant-tabs">

          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={
                activeSection === key
                  ? "restaurant-tab active"
                  : "restaurant-tab"
              }
              onClick={() =>
                setActiveSection(key)
              }
            >
              {label}

              {key === "requests" &&
                pendingRequests > 0 && (
                  <span className="tab-number">
                    {pendingRequests}
                  </span>
                )}
            </button>
          ))}

        </nav>

        {/* =====================================================
            OVERVIEW
            NO "AT A GLANCE"
            NO VERTICAL BOXES
            ===================================================== */}

        {activeSection === "overview" && (
          <section className="overview-section">

            <div className="overview-title">

              <span className="restaurant-eyebrow">
                YOUR RESTAURANT WORKSPACE
              </span>

              <h2>
                Everything you need,
                <span> in one place.</span>
              </h2>

              <p>
                Keep food moving through a simple,
                coordinated workflow.
              </p>

            </div>

            {/* HORIZONTAL FOOD FLOW */}

            <article className="wide-panel">

              <div className="wide-panel-heading">

                <div>
                  <span className="panel-label">
                    HOW FOOD MOVES
                  </span>

                  <h3>
                    From surplus to shared meals
                  </h3>
                </div>

                <p>
                  Three simple stages keep
                  redistribution organized.
                </p>

              </div>

              <div className="horizontal-flow">

                <div className="horizontal-flow-card">

                  <div className="flow-number">
                    01
                  </div>

                  <div className="flow-copy">
                    <strong>
                      List surplus food
                    </strong>

                    <span>
                      Record available food
                      and collection details.
                    </span>
                  </div>

                </div>

                <div className="flow-connector">
                  →
                </div>

                <div className="horizontal-flow-card">

                  <div className="flow-number">
                    02
                  </div>

                  <div className="flow-copy">
                    <strong>
                      Review NGO requests
                    </strong>

                    <span>
                      Check requested food,
                      quantity, and timing.
                    </span>
                  </div>

                </div>

                <div className="flow-connector">
                  →
                </div>

                <div className="horizontal-flow-card">

                  <div className="flow-number">
                    03
                  </div>

                  <div className="flow-copy">
                    <strong>
                      Coordinate pickup
                    </strong>

                    <span>
                      Create a volunteer task
                      after acceptance.
                    </span>
                  </div>

                </div>

              </div>

            </article>

            {/* HORIZONTAL QUICK ACTIONS */}

            <article className="wide-panel">

              <div className="wide-panel-heading">

                <div>
                  <span className="panel-label">
                    QUICK ACTIONS
                  </span>

                  <h3>
                    What would you like to do?
                  </h3>
                </div>

              </div>

              <div className="horizontal-actions">

                <button
                  type="button"
                  className="horizontal-action"
                  onClick={() => {
                    setActiveSection(
                      "contributions"
                    );
                    setShowContributionForm(true);
                  }}
                >

                  <span className="action-icon">
                    +
                  </span>

                  <span className="action-content">
                    <strong>
                      Add surplus food
                    </strong>

                    <small>
                      List food available
                      for redistribution.
                    </small>
                  </span>

                  <span className="action-arrow">
                    ↗
                  </span>

                </button>

                <button
                  type="button"
                  className="horizontal-action"
                  onClick={() =>
                    setActiveSection("requests")
                  }
                >

                  <span className="action-icon">
                    ↗
                  </span>

                  <span className="action-content">
                    <strong>
                      Review NGO requests
                    </strong>

                    <small>
                      Accept or decline
                      based on availability.
                    </small>
                  </span>

                  <span className="action-arrow">
                    ↗
                  </span>

                </button>

                <button
                  type="button"
                  className="horizontal-action"
                  onClick={() =>
                    setActiveSection("tasks")
                  }
                >

                  <span className="action-icon">
                    ✓
                  </span>

                  <span className="action-content">
                    <strong>
                      View pickup tasks
                    </strong>

                    <small>
                      Check tasks created
                      for volunteers.
                    </small>
                  </span>

                  <span className="action-arrow">
                    ↗
                  </span>

                </button>

              </div>

            </article>

            {/* ONE HORIZONTAL INFO STRIP */}

            <div className="overview-info-strip">

              <div className="info-symbol">
                i
              </div>

              <div className="info-copy">

                <strong>
                  You make the final decision.
                </strong>

                <p>
                  Review requests against your
                  available food, safety requirements,
                  and collection timing before accepting.
                </p>

              </div>

            </div>

          </section>
        )}

        {/* =====================================================
            INCOMING DONATIONS
            ===================================================== */}

        {activeSection === "donations" && (
          <section className="content-section">

            <div className="section-title centered-title">

              <span className="restaurant-eyebrow">
                DONOR HANDOFFS
              </span>

              <h2>
                Incoming donations
              </h2>

              <p>
                Review donations recorded in the
                shared FoodConnect browser workflow.
              </p>

              <span className="record-count">
                {incomingDonations.length} records
              </span>

            </div>

            {incomingDonations.length === 0 ? (
              <EmptyState
                title="No incoming donations"
                text="Donor records will appear here when they are available in the shared workflow."
              />
            ) : (
              <div className="donation-grid">

                {incomingDonations.map(
                  (donation, index) => (
                    <article
                      className="donation-card"
                      key={
                        donation.id ||
                        index
                      }
                    >

                      <div className="donation-top">

                        <span className="record-number">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <StatusBadge
                          status={
                            donation.status ||
                            "Available"
                          }
                        />

                      </div>

                      <div className="donation-heading">

                        <h3>
                          {donation.foodType ||
                            donation.foodName ||
                            donation.name ||
                            "Food donation"}
                        </h3>

                        <p>
                          From{" "}
                          {donation.donorName ||
                            donation.donor ||
                            "Donor not specified"}
                        </p>

                      </div>

                      <div className="donation-details">

                        <div>
                          <span>
                            Quantity
                          </span>

                          <strong>
                            {donation.quantity ??
                              "Not provided"}{" "}
                            {donation.quantity
                              ? donation.unit ||
                                "meals"
                              : ""}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Pickup / location
                          </span>

                          <strong>
                            {donation.location ||
                              donation.area ||
                              donation.dropPointArea ||
                              "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Expiry / best before
                          </span>

                          <strong>
                            {formatDate(
                              donation.expiry ||
                                donation.expiryDate ||
                                donation.bestBefore
                            )}
                          </strong>
                        </div>

                      </div>

                      {![
                        "Received",
                        "Rejected",
                      ].includes(
                        donation.status
                      ) && (
                        <div className="donation-actions">

                          <button
                            type="button"
                            className="confirm-button"
                            onClick={() =>
                              updateDonationStatus(
                                donation.id,
                                "Received"
                              )
                            }
                          >
                            Confirm received
                          </button>

                          <button
                            type="button"
                            className="reject-button"
                            onClick={() => {
                              updateDonationStatus(
                                donation.id,
                                "Rejected"
                              );
                            }}
                          >
                            Reject
                          </button>

                        </div>
                      )}

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================================
            SURPLUS
            ===================================================== */}

        {activeSection === "contributions" && (
          <section className="content-section">

            <div className="section-header-row">

              <div>
                <span className="restaurant-eyebrow">
                  YOUR SURPLUS
                </span>

                <h2>
                  My surplus food
                </h2>

                <p>
                  Record food your restaurant
                  can safely contribute.
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowContributionForm(
                    (value) => !value
                  )
                }
              >
                {showContributionForm
                  ? "Close form"
                  : "+ List surplus food"}
              </button>

            </div>

            {showContributionForm && (
              <form
                className="contribution-form"
                onSubmit={submitContribution}
              >

                <div className="form-title">
                  <span className="restaurant-eyebrow">
                    NEW FOOD LISTING
                  </span>

                  <h3>
                    Add surplus food
                  </h3>
                </div>

                <div className="form-row">

                  <label>
                    Restaurant name
                    <input
                      value={restaurantName}
                      onChange={(event) =>
                        saveRestaurantName(
                          event.target.value
                        )
                      }
                      placeholder="Restaurant name"
                    />
                  </label>

                  <label>
                    Food type
                    <select
                      value={foodType}
                      onChange={(event) =>
                        setFoodType(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        Cooked meals
                      </option>
                      <option>
                        Meal packets
                      </option>
                      <option>
                        Bakery items
                      </option>
                      <option>
                        Fresh produce
                      </option>
                      <option>
                        Packaged food
                      </option>
                      <option>
                        Other
                      </option>
                    </select>
                  </label>

                  <label>
                    Quantity *
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          event.target.value
                        )
                      }
                      placeholder="Quantity"
                    />
                  </label>

                  <label>
                    Available until
                    <input
                      type="datetime-local"
                      value={expiry}
                      onChange={(event) =>
                        setExpiry(
                          event.target.value
                        )
                      }
                    />
                  </label>

                </div>

                <label className="full-form-field">
                  Notes
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    placeholder="Packing, handling, or collection information"
                  />
                </label>

                <div className="form-submit-row">

                  <p>
                    Only list food that is safe
                    to redistribute.
                  </p>

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Save food listing
                  </button>

                </div>

              </form>
            )}

            {contributions.length === 0 ? (
              <EmptyState
                title="No surplus food listed"
                text="Your saved surplus food listings will appear here."
              />
            ) : (
              <div className="contribution-grid">

                {contributions.map(
                  (item, index) => (
                    <article
                      className="surplus-card"
                      key={
                        item.id ||
                        index
                      }
                    >

                      <div className="surplus-card-top">

                        <span>
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <StatusBadge
                          status={
                            item.status ||
                            "Available"
                          }
                        />

                      </div>

                      <h3>
                        {item.foodType ||
                          "Food contribution"}
                      </h3>

                      <div className="surplus-horizontal">

                        <div>
                          <span>
                            Quantity
                          </span>

                          <strong>
                            {item.quantity}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Available until
                          </span>

                          <strong>
                            {formatDate(
                              item.expiry
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Added
                          </span>

                          <strong>
                            {formatDate(
                              item.createdAt
                            )}
                          </strong>
                        </div>

                      </div>

                      {item.notes && (
                        <p className="card-note">
                          {item.notes}
                        </p>
                      )}

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================================
            NGO REQUESTS
            ===================================================== */}

        {activeSection === "requests" && (
          <section className="content-section">

            <div className="section-title centered-title">

              <span className="restaurant-eyebrow">
                COMMUNITY NEEDS
              </span>

              <h2>
                NGO food requests
              </h2>

              <p>
                Make the final decision based on
                stock, safety, and collection timing.
              </p>

              <span className="record-count">
                {ngoRequests.length} requests
              </span>

            </div>

            {ngoRequests.length === 0 ? (
              <EmptyState
                title="No NGO requests"
                text="Requests from the NGO workflow will appear here."
              />
            ) : (
              <div className="request-grid">

                {ngoRequests.map(
                  (request, index) => (
                    <article
                      className="request-card"
                      key={
                        request.id ||
                        index
                      }
                    >

                      <div className="request-top">

                        <span>
                          REQ{" "}
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <StatusBadge
                          status={
                            request.status ||
                            "Pending"
                          }
                        />

                      </div>

                      <div className="request-main">

                        <div>
                          <h3>
                            {getRequestName(
                              request
                            )}
                          </h3>

                          <p>
                            {getRequestArea(
                              request
                            )}
                          </p>
                        </div>

                        <div className="request-data">

                          <div>
                            <span>
                              Requested food
                            </span>

                            <strong>
                              {getRequestFood(
                                request
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Quantity
                            </span>

                            <strong>
                              {getRequestQuantity(
                                request
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Needed by
                            </span>

                            <strong>
                              {getRequestDate(
                                request
                              )}
                            </strong>
                          </div>

                        </div>

                      </div>

                      {String(
                        request.status ||
                          "Pending"
                      ).toLowerCase() ===
                        "pending" && (
                        <div className="request-actions">

                          <button
                            type="button"
                            className="accept-button"
                            onClick={() => {
                              updateRequestStatus(
                                request.id,
                                "Accepted"
                              );
                            }}
                          >
                            Accept request
                          </button>

                          <button
                            type="button"
                            className="decline-button"
                            onClick={() => {
                              updateRequestStatus(
                                request.id,
                                "Denied"
                              );
                            }}
                          >
                            Decline
                          </button>

                        </div>
                      )}

                      {String(
                        request.status ||
                          ""
                      ).toLowerCase() ===
                        "accepted" && (
                        <button
                          type="button"
                          className="task-button"
                          onClick={() =>
                            createVolunteerTask(
                              request
                            )
                          }
                        >
                          Create volunteer pickup task
                        </button>
                      )}

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================================
            NGO CONNECTIONS
            ===================================================== */}

        {activeSection === "ngos" && (
          <section className="content-section">

            <div className="section-title centered-title">

              <span className="restaurant-eyebrow">
                COMMUNITY NETWORK
              </span>

              <h2>
                NGO connections
              </h2>

              <p>
                Organizations appearing in your
                existing request records.
              </p>

            </div>

            {ngoRequests.length === 0 ? (
              <EmptyState
                title="No NGO connections yet"
                text="Organizations will appear here when they are part of your existing request records."
              />
            ) : (
              <div className="ngo-horizontal-list">

                {[
                  ...new Map(
                    ngoRequests.map(
                      (request) => [
                        getRequestName(
                          request
                        ),
                        request,
                      ]
                    )
                  ).values(),
                ].map(
                  (ngo, index) => (
                    <article
                      className="ngo-horizontal-card"
                      key={getRequestName(ngo)}
                    >

                      <div className="ngo-initials">
                        {getRequestName(
                          ngo
                        )
                          .split(" ")
                          .slice(0, 2)
                          .map(
                            (word) =>
                              word[0]
                          )
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div className="ngo-info">

                        <span>
                          ORGANIZATION{" "}
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <h3>
                          {getRequestName(
                            ngo
                          )}
                        </h3>

                        <p>
                          {getRequestArea(
                            ngo
                          )}
                        </p>

                      </div>

                      <div className="ngo-request-count">
                        {
                          ngoRequests.filter(
                            (request) =>
                              getRequestName(
                                request
                              ) ===
                              getRequestName(
                                ngo
                              )
                          ).length
                        }{" "}
                        request(s)
                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================================
            PICKUP TASKS
            ===================================================== */}

        {activeSection === "tasks" && (
          <section className="content-section">

            <div className="section-title centered-title">

              <span className="restaurant-eyebrow">
                DELIVERY COORDINATION
              </span>

              <h2>
                Pickup tasks
              </h2>

              <p>
                Tasks created for volunteer
                collection and delivery.
              </p>

              <span className="record-count">
                {volunteerTasks.length} tasks
              </span>

            </div>

            {volunteerTasks.length === 0 ? (
              <EmptyState
                title="No pickup tasks"
                text="Accepted NGO requests can be converted into volunteer pickup tasks."
              />
            ) : (
              <div className="task-list">

                {volunteerTasks.map(
                  (task, index) => (
                    <article
                      className="task-horizontal-card"
                      key={
                        task.id ||
                        index
                      }
                    >

                      <span className="task-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <div>
                        <span>
                          NGO
                        </span>

                        <strong>
                          {task.ngo ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Quantity
                        </span>

                        <strong>
                          {task.quantity ??
                            "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Restaurant
                        </span>

                        <strong>
                          {task.restaurant ||
                            restaurantName ||
                            "Restaurant"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Created
                        </span>

                        <strong>
                          {formatDate(
                            task.createdAt
                          )}
                        </strong>
                      </div>

                      <StatusBadge
                        status={
                          task.status ||
                          "Pending"
                        }
                      />

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

        <footer className="restaurant-footer">

          <strong>
            FoodConnect <span>AI</span>
          </strong>

          <p>
            Better use of food starts with
            better coordination.
          </p>

        </footer>

      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(
    status || "Pending"
  ).toLowerCase();

  return (
    <span
      className={`status-badge status-${normalized}`}
    >
      {status || "Pending"}
    </span>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-mark">
        FC
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>
    </div>
  );
}

export default RestaurantHome;