import { useMemo, useState } from "react";
import "./AdminHome.css";

const API_BASE = "http://127.0.0.1:5000";

const STORAGE_KEYS = {
  donations: "foodconnect_donations",
  requests: "foodconnect_restaurant_requests",
  tasks: "foodconnect_volunteer_tasks",
  distributions: "foodconnect_ngo_distributions",
  contributions: "foodconnect_restaurant_contributions",
  users: "foodconnect_users",
};

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function normalizeStatus(value) {
  return String(value || "Pending").trim().toLowerCase();
}

function statusLabel(value) {
  const status = normalizeStatus(value);

  const labels = {
    pending: "Pending",
    submitted: "Submitted",
    available: "Available",
    accepted: "Accepted",
    approved: "Approved",
    declined: "Declined",
    denied: "Denied",
    rejected: "Rejected",
    completed: "Completed",
    distributed: "Distributed",
    delivered: "Delivered",
    received: "Received",
    "in progress": "In progress",
    assigned: "Assigned",
    active: "Active",
    cancelled: "Cancelled",
    expired: "Expired",
  };

  return labels[status] || value || "Pending";
}

function getCreatedAt(item) {
  return (
    item?.createdAt ||
    item?.date ||
    item?.requestedDate ||
    item?.created ||
    item?.timestamp ||
    null
  );
}

function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "Time not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getQuantity(item) {
  const quantity =
    item?.quantity ??
    item?.requiredFood ??
    item?.availableQuantity ??
    item?.quantityAvailable ??
    0;

  const number = Number(quantity);

  return Number.isFinite(number) ? number : 0;
}

function getFoodName(item) {
  return (
    item?.foodName ||
    item?.foodType ||
    item?.foodItem ||
    item?.foodCategory ||
    item?.category ||
    "Food item"
  );
}

function getPersonName(item) {
  return (
    item?.name ||
    item?.donorName ||
    item?.userName ||
    item?.ngoName ||
    item?.restaurantName ||
    "Participant"
  );
}

function getDisplayName(user) {
  return (
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "User"
  );
}

function getLocation(item) {
  return (
    item?.area ||
    item?.location ||
    item?.address ||
    item?.dropPoint ||
    "Location not recorded"
  );
}

function getRequestNgo(item) {
  return item?.ngoName || item?.ngo || item?.organization || "Community NGO";
}

function getRequestRestaurant(item) {
  return (
    item?.restaurantName ||
    item?.restaurant ||
    item?.restaurantName ||
    "Not assigned"
  );
}

function renderStatus(status) {
  const normalized = normalizeStatus(status);

  let className = "status-neutral";

  if (
    [
      "received",
      "available",
      "accepted",
      "approved",
      "completed",
      "distributed",
      "delivered",
      "active",
    ].includes(normalized)
  ) {
    className = "status-positive";
  } else if (["pending", "submitted", "assigned"].includes(normalized)) {
    className = "status-warning";
  } else if (
    ["declined", "denied", "rejected", "cancelled", "expired"].includes(
      normalized
    )
  ) {
    className = "status-danger";
  }

  return (
    <span className={`admin-status ${className}`}>
      {statusLabel(status)}
    </span>
  );
}

function AdminHome({ onLogout }) {
  const [activeSection, setActiveSection] = useState("Overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const [forecastArea, setForecastArea] = useState("");
  const [forecastFood, setForecastFood] = useState("Cooked meals");
  const [forecastBeneficiaries, setForecastBeneficiaries] = useState("");
  const [forecastPreviousDemand, setForecastPreviousDemand] = useState("");
  const [forecastDonations, setForecastDonations] = useState("");

  const [forecast, setForecast] = useState(null);
  const [forecastInputs, setForecastInputs] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");

  const data = useMemo(() => {
    const donations = readArray(STORAGE_KEYS.donations);
    const requests = readArray(STORAGE_KEYS.requests);
    const tasks = readArray(STORAGE_KEYS.tasks);
    const distributions = readArray(STORAGE_KEYS.distributions);
    const contributions = readArray(STORAGE_KEYS.contributions);

    const userSources = [
      readArray(STORAGE_KEYS.users),
      readArray("foodconnect_donor_users"),
      readArray("foodconnect_restaurant_users"),
      readArray("foodconnect_ngo_users"),
      readArray("foodconnect_volunteer_users"),
    ];

    const allUsers = userSources.flat();

    const users = allUsers.filter((user, index, array) => {
      const key =
        user?.email ||
        user?.id ||
        `${user?.name || ""}-${user?.role || ""}`;

      return (
        index ===
        array.findIndex((other) => {
          const otherKey =
            other?.email ||
            other?.id ||
            `${other?.name || ""}-${other?.role || ""}`;

          return otherKey === key;
        })
      );
    });

    return {
      donations,
      requests,
      tasks,
      distributions,
      contributions,
      users,
    };
  }, [refreshKey]);

  const analytics = useMemo(() => {
    const pendingRequests = data.requests.filter((item) =>
      ["pending", "submitted"].includes(normalizeStatus(item.status))
    );

    const acceptedRequests = data.requests.filter((item) =>
      ["accepted", "approved"].includes(normalizeStatus(item.status))
    );

    const declinedRequests = data.requests.filter((item) =>
      ["declined", "denied", "rejected"].includes(normalizeStatus(item.status))
    );

    const activeTasks = data.tasks.filter((item) =>
      [
        "pending",
        "active",
        "in progress",
        "assigned",
        "accepted",
      ].includes(normalizeStatus(item.status))
    );

    const completedTasks = data.tasks.filter((item) =>
      ["completed", "delivered"].includes(normalizeStatus(item.status))
    );

    const completedDistributions = data.distributions.filter((item) =>
      ["completed", "distributed", "delivered"].includes(
        normalizeStatus(item.status || item.distributionStatus)
      )
    );

    return {
      pendingRequests,
      acceptedRequests,
      declinedRequests,
      activeTasks,
      completedTasks,
      completedDistributions,
    };
  }, [data]);

  const workflow = [
    {
      number: "01",
      title: "Donor",
      value: data.donations.length,
      label: "donation records",
      tone: "orange",
    },
    {
      number: "02",
      title: "Restaurant",
      value: data.contributions.length,
      label: "surplus records",
      tone: "yellow",
    },
    {
      number: "03",
      title: "NGO",
      value: data.requests.length,
      label: "food requests",
      tone: "green",
    },
    {
      number: "04",
      title: "Volunteer",
      value: analytics.activeTasks.length,
      label: "active tasks",
      tone: "blue",
    },
    {
      number: "05",
      title: "Community",
      value: analytics.completedDistributions.length,
      label: "completed distributions",
      tone: "purple",
    },
  ];

  const activity = useMemo(() => {
    const records = [];

    data.donations.forEach((item) => {
      records.push({
        id: `donation-${item.id || getCreatedAt(item) || Math.random()}`,
        type: "donation",
        role: "Donor",
        title: "Food donation recorded",
        detail: `${getFoodName(item)}${
          getQuantity(item) ? ` · ${getQuantity(item)} units` : ""
        }`,
        status: statusLabel(item.status),
        date: getCreatedAt(item),
      });
    });

    data.contributions.forEach((item) => {
      records.push({
        id: `restaurant-${item.id || getCreatedAt(item) || Math.random()}`,
        type: "restaurant",
        role: "Restaurant",
        title: "Restaurant surplus recorded",
        detail: `${getFoodName(item)}${
          getQuantity(item) ? ` · ${getQuantity(item)} units` : ""
        }`,
        status: statusLabel(item.status),
        date: getCreatedAt(item),
      });
    });

    data.requests.forEach((item) => {
      records.push({
        id: `request-${item.id || getCreatedAt(item) || Math.random()}`,
        type: "request",
        role: "NGO",
        title: "Food request submitted",
        detail: `${getRequestNgo(item)}${
          getQuantity(item) ? ` · ${getQuantity(item)} units` : ""
        }`,
        status: statusLabel(item.status),
        date: getCreatedAt(item),
      });
    });

    data.tasks.forEach((item) => {
      records.push({
        id: `task-${item.id || getCreatedAt(item) || Math.random()}`,
        type: "delivery",
        role: "Volunteer",
        title: "Volunteer delivery task recorded",
        detail: `${item?.restaurant || item?.restaurantName || "Restaurant"} → ${
          item?.ngo || item?.ngoName || "NGO"
        }`,
        status: statusLabel(item.status),
        date: getCreatedAt(item),
      });
    });

    data.distributions.forEach((item) => {
      records.push({
        id: `distribution-${
          item.id || getCreatedAt(item) || Math.random()
        }`,
        type: "distribution",
        role: "Community",
        title: "Community distribution recorded",
        detail: `${getFoodName(item)}${
          getQuantity(item) ? ` · ${getQuantity(item)} units` : ""
        }`,
        status: statusLabel(item.status || item.distributionStatus),
        date: getCreatedAt(item),
      });
    });

    return records
      .sort((a, b) => {
        const first = new Date(a.date || 0).getTime();
        const second = new Date(b.date || 0).getTime();

        return second - first;
      })
      .slice(0, 20);
  }, [data]);

  const attentionItems = useMemo(() => {
    const items = [];

    if (analytics.pendingRequests.length > 0) {
      items.push({
        type: "request",
        title: `${analytics.pendingRequests.length} NGO request${
          analytics.pendingRequests.length === 1 ? "" : "s"
        } awaiting review`,
        detail: "A food request is still waiting for the next workflow decision.",
        action: "Operations",
      });
    }

    if (analytics.activeTasks.length > 0) {
      items.push({
        type: "delivery",
        title: `${analytics.activeTasks.length} volunteer task${
          analytics.activeTasks.length === 1 ? "" : "s"
        } still active`,
        detail: "Delivery activity has not yet reached completion.",
        action: "Activity",
      });
    }

    return items;
  }, [analytics]);

  const latestActivity = activity.slice(0, 5);

  const refreshData = () => {
    setRefreshKey((value) => value + 1);
  };

  const goTo = (section) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runForecast = async () => {
    setForecastLoading(true);
    setForecastError("");
    setForecast(null);
    setForecastInputs(null);

    const now = new Date();

    const input = {
      area: forecastArea.trim(),
      food_type: forecastFood,
      day_of_week: now.getDay(),
      is_weekend: [0, 6].includes(now.getDay()) ? 1 : 0,
      month: now.getMonth() + 1,
      beneficiaries: Number(forecastBeneficiaries),
      previous_demand: Number(forecastPreviousDemand),
      donations_received: Number(forecastDonations),
    };

    if (
      !input.area ||
      !Number.isFinite(input.beneficiaries) ||
      input.beneficiaries < 1 ||
      !Number.isFinite(input.previous_demand) ||
      input.previous_demand < 0 ||
      !Number.isFinite(input.donations_received) ||
      input.donations_received < 0
    ) {
      setForecastError(
        "Enter a valid area, beneficiary count, previous demand and donations received."
      );
      setForecastLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/predict-demand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (
        !response.ok ||
        !Number.isFinite(Number(result.predicted_demand))
      ) {
        throw new Error(
          result.message || "The forecasting model did not return a prediction."
        );
      }

      setForecast({
        predicted_demand: Math.max(0, Number(result.predicted_demand)),
      });

      setForecastInputs(input);
    } catch (error) {
      setForecastError(
        error.message?.includes("Failed to fetch")
          ? "Could not connect to the AI service. Start the Flask backend and try again."
          : error.message || "Forecast could not be generated."
      );
    } finally {
      setForecastLoading(false);
    }
  };

  const renderOverview = () => {
    const bottleneck = analytics.pendingRequests[0];

    return (
      <section className="admin-page-section">
        <div className="admin-hero">
          <div className="admin-hero-copy">
            <span className="admin-overline">FOODCONNECT AI · ADMIN</span>

            <h1>
              See the whole
              <span> food journey.</span>
            </h1>

            <p>
              Monitor how surplus food moves from donors and restaurants
              through NGOs and volunteers toward community distribution.
            </p>

            <div className="admin-hero-actions">
              <button
                className="admin-primary-button"
                onClick={() => goTo("Activity")}
              >
                View platform activity
              </button>

              <button
                className="admin-secondary-button"
                onClick={() => goTo("Operations")}
              >
                Inspect records
              </button>
            </div>
          </div>

          <div className="admin-hero-visual" aria-hidden="true">
            <div className="admin-hero-circle circle-one" />
            <div className="admin-hero-circle circle-two" />

            <div className="admin-journey-card card-donor">
              <span className="journey-dot orange" />
              <div>
                <small>01</small>
                <strong>Donor</strong>
              </div>
            </div>

            <div className="admin-journey-card card-restaurant">
              <span className="journey-dot yellow" />
              <div>
                <small>02</small>
                <strong>Restaurant</strong>
              </div>
            </div>

            <div className="admin-journey-card card-ngo">
              <span className="journey-dot green" />
              <div>
                <small>03</small>
                <strong>NGO</strong>
              </div>
            </div>

            <div className="admin-journey-card card-volunteer">
              <span className="journey-dot blue" />
              <div>
                <small>04</small>
                <strong>Volunteer</strong>
              </div>
            </div>

            <div className="admin-journey-card card-community">
              <span className="journey-dot purple" />
              <div>
                <small>05</small>
                <strong>Community</strong>
              </div>
            </div>

            <div className="journey-line" />
          </div>
        </div>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-overline">COMPLETE FOOD JOURNEY</span>
              <h2>Where is food in the process?</h2>
              <p>
                Use this flow to spot where activity is building up or slowing
                down.
              </p>
            </div>

            <button
              className="admin-refresh-button"
              onClick={refreshData}
            >
              Refresh data
            </button>
          </div>

          <div className="workflow-track">
            {workflow.map((step, index) => (
              <div className="workflow-step" key={step.number}>
                <div className={`workflow-number ${step.tone}`}>
                  {step.number}
                </div>

                <strong>{step.title}</strong>

                <b>{step.value}</b>

                <small>{step.label}</small>

                {index < workflow.length - 1 && (
                  <span className="workflow-arrow">→</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="admin-dashboard-grid">
          <article className="admin-panel">
            <div className="panel-heading">
              <div>
                <span className="admin-overline">NEEDS ATTENTION</span>
                <h2>What should you check?</h2>
              </div>

              <span className="panel-count">{attentionItems.length}</span>
            </div>

            {attentionItems.length === 0 ? (
              <div className="admin-empty">
                <strong>No pending attention items</strong>
                <p>
                  There are no stored workflow records currently requiring
                  administrative review.
                </p>
              </div>
            ) : (
              <div className="attention-list">
                {attentionItems.map((item, index) => (
                  <button
                    className="attention-item"
                    key={`${item.type}-${index}`}
                    onClick={() => goTo(item.action)}
                  >
                    <span className={`attention-icon ${item.type}`}>
                      !
                    </span>

                    <span className="attention-copy">
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>

                    <span className="attention-arrow">→</span>
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="admin-panel">
            <div className="panel-heading">
              <div>
                <span className="admin-overline">RECENT MOVEMENT</span>
                <h2>What just happened?</h2>
              </div>

              <button
                className="admin-text-button"
                onClick={() => goTo("Activity")}
              >
                View all →
              </button>
            </div>

            {latestActivity.length === 0 ? (
              <div className="admin-empty">
                <strong>No activity recorded yet</strong>
                <p>
                  Workflow activity will appear here when platform records are
                  created.
                </p>
              </div>
            ) : (
              <div className="mini-activity-list">
                {latestActivity.map((item) => (
                  <div className="mini-activity-item" key={item.id}>
                    <span className={`activity-dot ${item.type}`} />

                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>

                    <span className="mini-activity-status">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        {bottleneck && (
          <section className="admin-bottleneck">
            <div>
              <span className="admin-overline">CURRENT BOTTLENECK</span>
              <h2>Food movement is waiting at the request stage.</h2>
              <p>
                {getRequestNgo(bottleneck)} has a request for{" "}
                <strong>{getQuantity(bottleneck)} units</strong> of{" "}
                <strong>{getFoodName(bottleneck)}</strong>.
              </p>
            </div>

            <div className="bottleneck-status">
              {renderStatus(bottleneck.status)}
              <button onClick={() => goTo("Operations")}>
                Inspect request
              </button>
            </div>
          </section>
        )}
      </section>
    );
  };

  const renderActivity = () => (
    <section className="admin-page-section">
      <div className="page-title-block">
        <span className="admin-overline">PLATFORM ACTIVITY</span>

        <h1>Follow every movement.</h1>

        <p>
          A chronological view of the actual records created across the
          FoodConnect AI workflow.
        </p>
      </div>

      {activity.length === 0 ? (
        <div className="large-empty-state">
          <span>NO ACTIVITY</span>
          <h2>No workflow movement has been recorded.</h2>
          <p>
            Donations, requests, volunteer tasks and distributions will appear
            here when they are created by the platform.
          </p>
        </div>
      ) : (
        <div className="activity-timeline">
          {activity.map((item, index) => (
            <article className="timeline-item" key={item.id}>
              <div className={`timeline-marker ${item.type}`}>
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="timeline-card">
                <div className="timeline-card-header">
                  <div className="timeline-event">
                    <span className={`timeline-role ${item.type}`}>
                      {item.role}
                    </span>

                    <h3>{item.title}</h3>
                  </div>

                  <div className="timeline-status">
                    <span>CURRENT STATUS</span>
                    {renderStatus(item.status)}
                  </div>
                </div>

                <div className="timeline-information">
                  <div className="timeline-info-block">
                    <span>WHAT HAPPENED</span>
                    <strong>{item.title}</strong>
                  </div>

                  <div className="timeline-info-block">
                    <span>DETAILS</span>
                    <strong>{item.detail}</strong>
                  </div>

                  <div className="timeline-info-block">
                    <span>RECORDED</span>
                    <strong>{formatDateTime(item.date)}</strong>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderOperations = () => {
    const renderDonationTable = () => (
      <div className="operation-group">
        <div className="operation-heading">
          <div>
            <span className="admin-overline">01 · DONOR</span>
            <h2>Food donations</h2>
          </div>

          <span className="record-count">
            {data.donations.length} records
          </span>
        </div>

        {data.donations.length === 0 ? (
          <div className="table-empty">
            No donation records are available.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>Donor</th>
                  <th>Restaurant / Drop point</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {data.donations.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>
                      <strong>{getFoodName(item)}</strong>
                    </td>

                    <td>{getQuantity(item) || "—"}</td>

                    <td>{getPersonName(item)}</td>

                    <td>
                      {item?.dropPoint ||
                        item?.restaurantName ||
                        item?.restaurant ||
                        "Not recorded"}
                    </td>

                    <td>{renderStatus(item.status)}</td>

                    <td>{formatDate(getCreatedAt(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );

    const renderRequestTable = () => (
      <div className="operation-group">
        <div className="operation-heading">
          <div>
            <span className="admin-overline">02 · NGO</span>
            <h2>Food requests</h2>
          </div>

          <span className="record-count">
            {data.requests.length} records
          </span>
        </div>

        {data.requests.length === 0 ? (
          <div className="table-empty">
            No NGO food requests are available.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>NGO</th>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>Restaurant</th>
                  <th>Required by</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {data.requests.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>
                      <strong>{getRequestNgo(item)}</strong>
                    </td>

                    <td>{getFoodName(item)}</td>

                    <td>{getQuantity(item) || "—"}</td>

                    <td>{getRequestRestaurant(item)}</td>

                    <td>
                      {formatDate(
                        item?.requiredBy ||
                          item?.requiredDate ||
                          item?.date
                      )}
                    </td>

                    <td>{renderStatus(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );

    const renderRestaurantTable = () => (
      <div className="operation-group">
        <div className="operation-heading">
          <div>
            <span className="admin-overline">03 · RESTAURANT</span>
            <h2>Restaurant surplus</h2>
          </div>

          <span className="record-count">
            {data.contributions.length} records
          </span>
        </div>

        {data.contributions.length === 0 ? (
          <div className="table-empty">
            No restaurant surplus records are available.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>Restaurant</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {data.contributions.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>
                      <strong>{getFoodName(item)}</strong>
                    </td>

                    <td>{getQuantity(item) || "—"}</td>

                    <td>
                      {item?.restaurantName ||
                        item?.restaurant ||
                        getPersonName(item)}
                    </td>

                    <td>{getLocation(item)}</td>

                    <td>{renderStatus(item.status)}</td>

                    <td>{formatDate(getCreatedAt(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );

    const renderVolunteerTable = () => (
      <div className="operation-group">
        <div className="operation-heading">
          <div>
            <span className="admin-overline">04 · VOLUNTEER</span>
            <h2>Delivery tasks</h2>
          </div>

          <span className="record-count">
            {data.tasks.length} records
          </span>
        </div>

        {data.tasks.length === 0 ? (
          <div className="table-empty">
            No volunteer delivery tasks are available.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Restaurant</th>
                  <th>NGO</th>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {data.tasks.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>
                      <strong>
                        {item?.volunteerName ||
                          item?.volunteer ||
                          item?.name ||
                          "Volunteer"}
                      </strong>
                    </td>

                    <td>
                      {item?.restaurant ||
                        item?.restaurantName ||
                        "Not recorded"}
                    </td>

                    <td>
                      {item?.ngo ||
                        item?.ngoName ||
                        "Not recorded"}
                    </td>

                    <td>
                      {item?.taskType ||
                        item?.title ||
                        "Delivery task"}
                    </td>

                    <td>{renderStatus(item.status)}</td>

                    <td>{formatDate(getCreatedAt(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );

    const renderDistributionTable = () => (
      <div className="operation-group">
        <div className="operation-heading">
          <div>
            <span className="admin-overline">05 · COMMUNITY</span>
            <h2>Community distributions</h2>
          </div>

          <span className="record-count">
            {data.distributions.length} records
          </span>
        </div>

        {data.distributions.length === 0 ? (
          <div className="table-empty">
            No community distribution records are available.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>NGO</th>
                  <th>Beneficiaries</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {data.distributions.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>
                      <strong>{getFoodName(item)}</strong>
                    </td>

                    <td>{getQuantity(item) || "—"}</td>

                    <td>
                      {item?.ngoName ||
                        item?.ngo ||
                        "Not recorded"}
                    </td>

                    <td>
                      {item?.beneficiaries ||
                        item?.beneficiaryCount ||
                        "Not recorded"}
                    </td>

                    <td>
                      {renderStatus(
                        item.status || item.distributionStatus
                      )}
                    </td>

                    <td>{formatDate(getCreatedAt(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );

    return (
      <section className="admin-page-section">
        <div className="page-title-block">
          <span className="admin-overline">OPERATIONS</span>

          <h1>Inspect the actual records.</h1>

          <p>
            Review the records behind the platform flow instead of relying
            only on summary numbers.
          </p>
        </div>

        {renderDonationTable()}
        {renderRequestTable()}
        {renderRestaurantTable()}
        {renderVolunteerTable()}
        {renderDistributionTable()}
      </section>
    );
  };

  const renderForecast = () => (
    <section className="admin-page-section">
      <div className="page-title-block">
        <span className="admin-overline">AI DEMAND INTELLIGENCE</span>

        <h1>Understand where food may be needed.</h1>

        <p>
          Run the same trained demand forecasting service used by the NGO
          workflow. The prediction is generated by the Flask model.
        </p>
      </div>

      <div className="forecast-layout">
        <div className="forecast-form">
          <div className="forecast-form-heading">
            <div>
              <span className="admin-overline">FORECAST INPUTS</span>
              <h2>Community requirement</h2>
            </div>

            <span className="forecast-number">01</span>
          </div>

          <div className="forecast-grid">
            <label>
              Area
              <input
                type="text"
                value={forecastArea}
                onChange={(event) => setForecastArea(event.target.value)}
                placeholder="e.g. Andheri"
              />
            </label>

            <label>
              Food category
              <select
                value={forecastFood}
                onChange={(event) => setForecastFood(event.target.value)}
              >
                <option value="Cooked meals">Cooked meals</option>
                <option value="Rice">Rice</option>
                <option value="Chapati">Chapati</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Packaged food">Packaged food</option>
              </select>
            </label>

            <label>
              Beneficiaries supported
              <input
                type="number"
                min="1"
                value={forecastBeneficiaries}
                onChange={(event) =>
                  setForecastBeneficiaries(event.target.value)
                }
                placeholder="Enter count"
              />
            </label>

            <label>
              Previous demand
              <input
                type="number"
                min="0"
                value={forecastPreviousDemand}
                onChange={(event) =>
                  setForecastPreviousDemand(event.target.value)
                }
                placeholder="Enter previous demand"
              />
            </label>

            <label className="forecast-full">
              Donations received in current period
              <input
                type="number"
                min="0"
                value={forecastDonations}
                onChange={(event) =>
                  setForecastDonations(event.target.value)
                }
                placeholder="Enter received quantity"
              />
            </label>
          </div>

          <div className="forecast-note">
            <span>i</span>
            <p>
              Day, month and weekend information are taken automatically from
              the current date when the model is executed.
            </p>
          </div>

          {forecastError && (
            <div className="forecast-error">{forecastError}</div>
          )}

          <button
            className="forecast-submit"
            onClick={runForecast}
            disabled={forecastLoading}
          >
            {forecastLoading ? "Running AI model..." : "Run demand forecast"}
          </button>
        </div>

        <div className="forecast-result">
          <span className="admin-overline">MODEL OUTPUT</span>

          {!forecast ? (
            <div className="forecast-placeholder">
              <span>AI</span>
              <strong>Run the model to see the actual prediction.</strong>
              <p>
                No example result is displayed here. The result will appear
                only after the Flask forecasting service returns a prediction.
              </p>
            </div>
          ) : (
            <>
              <h2>Predicted food demand</h2>

              <div className="forecast-big-number">
                {forecast.predicted_demand}
                <small>predicted units</small>
              </div>

              {forecastInputs && (
                <div className="forecast-result-grid">
                  <div>
                    <span>Area</span>
                    <strong>{forecastInputs.area}</strong>
                  </div>

                  <div>
                    <span>Food category</span>
                    <strong>{forecastInputs.food_type}</strong>
                  </div>

                  <div>
                    <span>Beneficiaries</span>
                    <strong>{forecastInputs.beneficiaries}</strong>
                  </div>

                  <div>
                    <span>Previous demand</span>
                    <strong>{forecastInputs.previous_demand}</strong>
                  </div>

                  <div>
                    <span>Donations received</span>
                    <strong>{forecastInputs.donations_received}</strong>
                  </div>

                  <div>
                    <span>Model period</span>
                    <strong>
                      {forecastInputs.is_weekend ? "Weekend" : "Weekday"}
                    </strong>
                  </div>
                </div>
              )}

              <div className="forecast-shortage">
                <span>Demand minus current donations</span>

                <strong>
                  {Math.max(
                    0,
                    forecast.predicted_demand -
                      Number(forecastInputs?.donations_received || 0)
                  )}{" "}
                  units
                </strong>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );

  const renderUsers = () => {
    const roleCounts = {
      Donor: 0,
      Restaurant: 0,
      NGO: 0,
      Volunteer: 0,
      Other: 0,
    };

    data.users.forEach((user) => {
      const role = String(user?.role || "").trim();

      if (roleCounts[role] !== undefined) {
        roleCounts[role] += 1;
      } else {
        roleCounts.Other += 1;
      }
    });

    return (
      <section className="admin-page-section">
        <div className="page-title-block">
          <span className="admin-overline">USER MANAGEMENT</span>

          <h1>Everyone contributing to the platform.</h1>

          <p>
            Only user records stored by the application are displayed here.
          </p>
        </div>

        <div className="user-summary-grid">
          <article>
            <span>ALL USERS</span>
            <strong>{data.users.length}</strong>
          </article>

          <article>
            <span>DONORS</span>
            <strong>{roleCounts.Donor}</strong>
          </article>

          <article>
            <span>RESTAURANTS</span>
            <strong>{roleCounts.Restaurant}</strong>
          </article>

          <article>
            <span>NGOs</span>
            <strong>{roleCounts.NGO}</strong>
          </article>

          <article>
            <span>VOLUNTEERS</span>
            <strong>{roleCounts.Volunteer}</strong>
          </article>
        </div>

        {data.users.length === 0 ? (
          <div className="large-empty-state">
            <span>NO USER RECORDS</span>
            <h2>No registered users are stored.</h2>
            <p>
              Create accounts through the existing user flow for them to be
              reflected here.
            </p>
          </div>
        ) : (
          <div className="user-grid">
            {data.users.map((user, index) => (
              <article
                className="user-card"
                key={user?.email || user?.id || index}
              >
                <div className="user-avatar">
                  {getDisplayName(user).charAt(0).toUpperCase()}
                </div>

                <div>
                  <span>{user?.role || "User"}</span>

                  <h3>{getDisplayName(user)}</h3>

                  <p>{user?.email || "Email not recorded"}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderContent = () => {
    if (activeSection === "Activity") {
      return renderActivity();
    }

    if (activeSection === "Operations") {
      return renderOperations();
    }

    if (activeSection === "AI Forecast") {
      return renderForecast();
    }

    if (activeSection === "Users") {
      return renderUsers();
    }

    return renderOverview();
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button
          className="admin-brand"
          onClick={() => goTo("Overview")}
          type="button"
        >
          <span className="admin-brand-mark">FC</span>

          <span className="admin-brand-copy">
            <strong>
              FoodConnect <em>AI</em>
            </strong>

            <small>COMMUNITY FOOD REDISTRIBUTION</small>
          </span>
        </button>

        <nav className="admin-nav">
          {[
            "Overview",
            "Activity",
            "Operations",
            "AI Forecast",
            "Users",
          ].map((section) => (
            <button
              key={section}
              type="button"
              className={activeSection === section ? "active" : ""}
              onClick={() => goTo(section)}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="admin-account">
          <div className="admin-account-avatar">A</div>

          <div className="admin-account-copy">
            <strong>Administrator</strong>
            <small>Platform control</small>
          </div>

          <button
            className="admin-logout"
            type="button"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="admin-main">{renderContent()}</main>

      <footer className="admin-footer">
        <div>
          <strong>FoodConnect AI</strong>
          <span> · Administrator Control Center</span>
        </div>

        <button type="button" onClick={() => goTo("Overview")}>
          Back to overview
        </button>
      </footer>
    </div>
  );
}

export default AdminHome;