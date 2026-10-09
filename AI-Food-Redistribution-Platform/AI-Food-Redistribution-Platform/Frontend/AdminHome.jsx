import { useEffect, useMemo, useState } from "react";
import "./AdminHome.css";

const DONATIONS_KEY = "foodconnect_donations";
const REQUESTS_KEY = "foodconnect_restaurant_requests";
const TASKS_KEY = "foodconnect_volunteer_tasks";
const DISTRIBUTIONS_KEY = "foodconnect_ngo_distributions";

function readArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatTime(value) {
  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDonationName(donation) {
  return (
    donation.foodType ||
    donation.foodName ||
    donation.name ||
    donation.category ||
    "Food donation"
  );
}

function getDonationQuantity(donation) {
  const quantity =
    donation.quantity ??
    donation.requiredFood ??
    donation.amount;

  if (
    quantity === undefined ||
    quantity === null ||
    quantity === ""
  ) {
    return "Quantity not specified";
  }

  return `${quantity} ${
    donation.quantityUnit ||
    donation.unit ||
    donation.quantityType ||
    "units"
  }`;
}

function getDonationTime(donation) {
  return (
    donation.createdAt ||
    donation.timestamp ||
    donation.date ||
    donation.donationDate
  );
}

function getRequestTime(request) {
  return (
    request.createdAt ||
    request.timestamp ||
    request.date
  );
}

function getTaskTime(task) {
  return (
    task.createdAt ||
    task.timestamp ||
    task.updatedAt
  );
}

function getStatusClass(status) {
  const value = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (
    value.includes("deliver") ||
    value.includes("complete")
  ) {
    return "admin-status delivered";
  }

  if (
    value.includes("accept") ||
    value.includes("pick")
  ) {
    return "admin-status active";
  }

  if (
    value.includes("pending") ||
    value.includes("available")
  ) {
    return "admin-status pending";
  }

  return "admin-status neutral";
}

function AdminHome({ onLogout }) {
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [distributions, setDistributions] = useState([]);

  const [activeView, setActiveView] =
    useState("overview");

  const loadData = () => {
    setDonations(readArray(DONATIONS_KEY));
    setRequests(readArray(REQUESTS_KEY));
    setTasks(readArray(TASKS_KEY));
    setDistributions(
      readArray(DISTRIBUTIONS_KEY)
    );
  };

  useEffect(() => {
    loadData();

    const refresh = window.setInterval(
      loadData,
      1500
    );

    return () =>
      window.clearInterval(refresh);
  }, []);

  /*
   * All numbers below come from the actual
   * records already stored in localStorage.
   */
  const deliveredTasks = tasks.filter(
    (task) =>
      String(task.status || "")
        .toLowerCase() === "delivered"
  );

  const activeTasks = tasks.filter(
    (task) => {
      const status = String(
        task.status || ""
      ).toLowerCase();

      return (
        status === "accepted" ||
        status === "picked up"
      );
    }
  );

  const pendingRequests = requests.filter(
    (request) => {
      const status = String(
        request.status || ""
      ).toLowerCase();

      return (
        status === "pending" ||
        status === "requested" ||
        status === ""
      );
    }
  );

  /*
   * Create one combined activity feed.
   * Nothing is invented here — every event
   * comes from an existing saved record.
   */
  const activity = useMemo(() => {
    const events = [];

    donations.forEach((donation) => {
      const time = getDonationTime(donation);

      events.push({
        id: `donation-${donation.id || time}`,
        type: "Donation",
        title: "Food donation created",
        description: `${getDonationName(
          donation
        )} · ${getDonationQuantity(donation)}`,
        time,
        icon: "D",
        tone: "orange",
      });
    });

    requests.forEach((request) => {
      const time = getRequestTime(request);

      events.push({
        id: `request-${request.id || time}`,
        type: "NGO Request",
        title: "NGO food request created",
        description:
          request.ngo ||
          request.ngoName ||
          "NGO request",
        time,
        icon: "N",
        tone: "blue",
      });

      const status = String(
        request.status || ""
      ).toLowerCase();

      if (
        status === "accepted" ||
        status === "approved"
      ) {
        events.push({
          id: `request-accepted-${
            request.id || time
          }`,
          type: "Restaurant",
          title: "Food request accepted",
          description:
            request.restaurantName ||
            request.restaurant ||
            "Restaurant",
          time:
            request.updatedAt ||
            request.acceptedAt ||
            time,
          icon: "R",
          tone: "green",
        });
      }
    });

    tasks.forEach((task) => {
      const time = getTaskTime(task);

      events.push({
        id: `task-${task.id || time}`,
        type: "Volunteer",
        title: "Volunteer delivery task created",
        description: `${task.restaurant || "Pickup"} → ${
          task.ngo || "Destination"
        }`,
        time,
        icon: "V",
        tone: "purple",
      });

      const status = String(
        task.status || ""
      ).toLowerCase();

      if (
        status === "picked up" ||
        status === "delivered"
      ) {
        events.push({
          id: `pickup-${task.id || time}`,
          type: "Volunteer",
          title:
            status === "delivered"
              ? "Delivery completed"
              : "Food picked up",
          description: `${task.restaurant || "Pickup"} → ${
            task.ngo || "Destination"
          }`,
          time:
            task.updatedAt ||
            time,
          icon:
            status === "delivered"
              ? "✓"
              : "P",
          tone:
            status === "delivered"
              ? "green"
              : "orange",
        });
      }
    });

    distributions.forEach(
      (distribution) => {
        const time =
          distribution.createdAt ||
          distribution.timestamp ||
          distribution.date;

        events.push({
          id: `distribution-${
            distribution.id || time
          }`,
          type: "Community",
          title: "Community distribution recorded",
          description:
            distribution.location ||
            distribution.beneficiaryLocation ||
            distribution.ngo ||
            "Community distribution",
          time,
          icon: "C",
          tone: "coral",
        });
      }
    );

    return events
      .sort((a, b) => {
        const first = new Date(
          a.time || 0
        ).getTime();

        const second = new Date(
          b.time || 0
        ).getTime();

        return second - first;
      })
      .slice(0, 12);
  }, [
    donations,
    requests,
    tasks,
    distributions,
  ]);

  /*
   * Latest operational records
   */
  const operations = useMemo(() => {
    const rows = [];

    donations.forEach((donation) => {
      rows.push({
        id: `d-${donation.id}`,
        type: "Donation",
        item: getDonationName(donation),
        quantity:
          getDonationQuantity(donation),
        participant:
          donation.donorName ||
          donation.restaurantName ||
          donation.restaurant ||
          "Donor",
        status:
          donation.status ||
          "Available",
        date:
          getDonationTime(donation),
      });
    });

    requests.forEach((request) => {
      rows.push({
        id: `r-${request.id}`,
        type: "NGO Request",
        item:
          request.foodType ||
          request.foodName ||
          request.category ||
          "Food request",
        quantity:
          request.quantity !== undefined
            ? `${request.quantity} units`
            : "Quantity not specified",
        participant:
          request.ngo ||
          request.ngoName ||
          "NGO",
        status:
          request.status ||
          "Pending",
        date:
          getRequestTime(request),
      });
    });

    tasks.forEach((task) => {
      rows.push({
        id: `t-${task.id}`,
        type: "Volunteer Task",
        item:
          task.foodType ||
          "Food delivery",
        quantity:
          task.quantity !== undefined
            ? `${task.quantity} meals`
            : "Quantity not specified",
        participant:
          `${task.restaurant || "Pickup"} → ${
            task.ngo || "Destination"
          }`,
        status:
          task.status ||
          "Pending",
        date:
          getTaskTime(task),
      });
    });

    return rows
      .sort((a, b) => {
        const first = new Date(
          a.date || 0
        ).getTime();

        const second = new Date(
          b.date || 0
        ).getTime();

        return second - first;
      })
      .slice(0, 10);
  }, [
    donations,
    requests,
    tasks,
  ]);

  const latestDonation =
    donations.length > 0
      ? [...donations].sort(
          (a, b) =>
            new Date(
              getDonationTime(b) || 0
            ).getTime() -
            new Date(
              getDonationTime(a) || 0
            ).getTime()
        )[0]
      : null;

  const latestRequest =
    requests.length > 0
      ? [...requests].sort(
          (a, b) =>
            new Date(
              getRequestTime(b) || 0
            ).getTime() -
            new Date(
              getRequestTime(a) || 0
            ).getTime()
        )[0]
      : null;

  const latestTask =
    tasks.length > 0
      ? [...tasks].sort(
          (a, b) =>
            new Date(
              getTaskTime(b) || 0
            ).getTime() -
            new Date(
              getTaskTime(a) || 0
            ).getTime()
        )[0]
      : null;

  const latestDelivered =
    deliveredTasks.length > 0
      ? [...deliveredTasks].sort(
          (a, b) =>
            new Date(
              getTaskTime(b) || 0
            ).getTime() -
            new Date(
              getTaskTime(a) || 0
            ).getTime()
        )[0]
      : null;

  return (
    <div className="admin-page">

      {/* TOP NAVIGATION */}

      <header className="admin-header">

        <div className="admin-brand">

          <div className="admin-brand-mark">
            FC
          </div>

          <div>
            <h1>
              FoodConnect <span>AI</span>
            </h1>

            <p>
              Operations Control Center
            </p>
          </div>

        </div>

        <div className="admin-header-right">

          <div className="admin-live-indicator">
            <span />
            LIVE
          </div>

          <div className="admin-user">
            <div className="admin-user-avatar">
              A
            </div>

            <div>
              <strong>
                Admin
              </strong>

              <span>
                Administrator
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      <main className="admin-content">

        {/* HERO */}

        <section className="admin-hero">

          <div>

            <span className="admin-eyebrow">
              ADMIN CONTROL CENTER
            </span>

            <h2>
              Good evening, Admin.
              <br />
              <span>
                Keep every meal moving.
              </span>
            </h2>

            <p>
              Monitor the complete FoodConnect
              journey — from the first donation
              to the final delivery.
            </p>

          </div>

          <div className="admin-hero-graphic">

            <div className="admin-orbit orbit-one">
              <span>DONOR</span>
            </div>

            <div className="admin-orbit orbit-two">
              <span>NGO</span>
            </div>

            <div className="admin-hero-center">
              <strong>
                FC
              </strong>
              <small>
                FLOW
              </small>
            </div>

            <div className="admin-hero-node node-one">
              D
            </div>

            <div className="admin-hero-node node-two">
              R
            </div>

            <div className="admin-hero-node node-three">
              N
            </div>

            <div className="admin-hero-node node-four">
              V
            </div>

          </div>

        </section>

        {/* SUMMARY CARDS */}

        <section className="admin-summary">

          <article className="admin-summary-card orange">

            <div className="admin-summary-icon">
              D
            </div>

            <div>
              <span>
                DONATIONS
              </span>

              <strong>
                {donations.length}
              </strong>

              <small>
                Food records
              </small>
            </div>

          </article>

          <article className="admin-summary-card blue">

            <div className="admin-summary-icon">
              N
            </div>

            <div>
              <span>
                NGO REQUESTS
              </span>

              <strong>
                {requests.length}
              </strong>

              <small>
                Request records
              </small>
            </div>

          </article>

          <article className="admin-summary-card purple">

            <div className="admin-summary-icon">
              V
            </div>

            <div>
              <span>
                ACTIVE TASKS
              </span>

              <strong>
                {activeTasks.length}
              </strong>

              <small>
                Volunteer work
              </small>
            </div>

          </article>

          <article className="admin-summary-card green">

            <div className="admin-summary-icon">
              ✓
            </div>

            <div>
              <span>
                DELIVERED
              </span>

              <strong>
                {deliveredTasks.length}
              </strong>

              <small>
                Completed tasks
              </small>
            </div>

          </article>

        </section>

        {/* NAVIGATION */}

        <div className="admin-tabs">

          <button
            type="button"
            className={
              activeView === "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView("overview")
            }
          >
            Overview
          </button>

          <button
            type="button"
            className={
              activeView === "activity"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView("activity")
            }
          >
            Activity
          </button>

          <button
            type="button"
            className={
              activeView === "operations"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView("operations")
            }
          >
            Operations
          </button>

        </div>

        {/* =================================================
            OVERVIEW
            ================================================= */}

        {activeView === "overview" && (
          <>

            {/* FOOD JOURNEY */}

            <section className="admin-section">

              <div className="admin-section-heading">

                <div>
                  <span>
                    LIVE PROCESS
                  </span>

                  <h3>
                    Follow the food journey
                  </h3>

                  <p>
                    Track how food moves through
                    each participant in the system.
                  </p>
                </div>

                <div className="admin-section-badge">
                  Real-time records
                </div>

              </div>

              <div className="admin-process">

                <div className="admin-process-line" />

                <div className="admin-process-step">

                  <div className="admin-process-icon orange">
                    D
                  </div>

                  <strong>
                    Donor
                  </strong>

                  <span>
                    Food available
                  </span>

                </div>

                <div className="admin-process-step">

                  <div className="admin-process-icon coral">
                    R
                  </div>

                  <strong>
                    Restaurant
                  </strong>

                  <span>
                    Food coordinated
                  </span>

                </div>

                <div className="admin-process-step">

                  <div className="admin-process-icon blue">
                    N
                  </div>

                  <strong>
                    NGO
                  </strong>

                  <span>
                    Need identified
                  </span>

                </div>

                <div className="admin-process-step">

                  <div className="admin-process-icon purple">
                    V
                  </div>

                  <strong>
                    Volunteer
                  </strong>

                  <span>
                    Food collected
                  </span>

                </div>

                <div className="admin-process-step">

                  <div className="admin-process-icon green">
                    ✓
                  </div>

                  <strong>
                    Community
                  </strong>

                  <span>
                    Food delivered
                  </span>

                </div>

              </div>

            </section>

            {/* TWO COLUMN */}

            <section className="admin-two-column">

              {/* LATEST ACTIVITY */}

              <article className="admin-panel">

                <div className="admin-panel-heading">

                  <div>
                    <span>
                      ACTIVITY
                    </span>

                    <h3>
                      Recent movement
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveView(
                        "activity"
                      )
                    }
                  >
                    View all
                  </button>

                </div>

                {activity.length === 0 ? (

                  <div className="admin-empty">
                    No activity has been
                    recorded yet.
                  </div>

                ) : (

                  <div className="admin-activity-list">

                    {activity
                      .slice(0, 6)
                      .map((event) => (
                        <div
                          className="admin-activity-item"
                          key={event.id}
                        >

                          <div
                            className={`admin-activity-icon ${event.tone}`}
                          >
                            {event.icon}
                          </div>

                          <div className="admin-activity-content">

                            <strong>
                              {event.title}
                            </strong>

                            <span>
                              {event.description}
                            </span>

                          </div>

                          <time>
                            {formatTime(
                              event.time
                            )}
                          </time>

                        </div>
                      ))}

                  </div>
                )}

              </article>

              {/* CURRENT STATUS */}

              <article className="admin-panel">

                <div className="admin-panel-heading">

                  <div>
                    <span>
                      CURRENT STATE
                    </span>

                    <h3>
                      Operations at a glance
                    </h3>
                  </div>

                </div>

                <div className="admin-status-list">

                  <div className="admin-status-row">

                    <div>
                      <span className="admin-status-dot orange" />
                      <strong>
                        Latest donation
                      </strong>
                    </div>

                    <span>
                      {latestDonation
                        ? getDonationName(
                            latestDonation
                          )
                        : "No record"}
                    </span>

                  </div>

                  <div className="admin-status-row">

                    <div>
                      <span className="admin-status-dot blue" />
                      <strong>
                        Latest NGO request
                      </strong>
                    </div>

                    <span>
                      {latestRequest?.ngo ||
                        latestRequest?.ngoName ||
                        "No record"}
                    </span>

                  </div>

                  <div className="admin-status-row">

                    <div>
                      <span className="admin-status-dot purple" />
                      <strong>
                        Latest volunteer task
                      </strong>
                    </div>

                    <span>
                      {latestTask
                        ? latestTask.restaurant ||
                          "Task"
                        : "No record"}
                    </span>

                  </div>

                  <div className="admin-status-row">

                    <div>
                      <span className="admin-status-dot green" />
                      <strong>
                        Latest delivery
                      </strong>
                    </div>

                    <span>
                      {latestDelivered
                        ? latestDelivered.ngo ||
                          "Completed"
                        : "No record"}
                    </span>

                  </div>

                </div>

              </article>

            </section>

          </>
        )}

        {/* =================================================
            ACTIVITY
            ================================================= */}

        {activeView === "activity" && (
          <section className="admin-section">

            <div className="admin-section-heading">

              <div>
                <span>
                  COMPLETE RECORD
                </span>

                <h3>
                  Activity timeline
                </h3>

                <p>
                  Events generated from the
                  existing FoodConnect workflow.
                </p>
              </div>

            </div>

            {activity.length === 0 ? (

              <div className="admin-large-empty">
                <strong>
                  No activity yet
                </strong>

                <p>
                  Activity will appear here
                  when users perform actions
                  in the FoodConnect workflow.
                </p>
              </div>

            ) : (

              <div className="admin-full-activity">

                {activity.map((event) => (
                  <div
                    className="admin-full-activity-item"
                    key={event.id}
                  >

                    <div
                      className={`admin-activity-icon ${event.tone}`}
                    >
                      {event.icon}
                    </div>

                    <div className="admin-full-activity-main">

                      <div>

                        <span>
                          {event.type}
                        </span>

                        <strong>
                          {event.title}
                        </strong>

                      </div>

                      <p>
                        {event.description}
                      </p>

                    </div>

                    <div className="admin-full-activity-time">

                      <strong>
                        {formatTime(
                          event.time
                        )}
                      </strong>

                      <span>
                        {formatDate(
                          event.time
                        )}
                      </span>

                    </div>

                  </div>
                ))}

              </div>

            )}

          </section>
        )}

        {/* =================================================
            OPERATIONS
            ================================================= */}

        {activeView === "operations" && (
          <section className="admin-section">

            <div className="admin-section-heading">

              <div>
                <span>
                  OPERATIONS
                </span>

                <h3>
                  Current workflow records
                </h3>

                <p>
                  Donations, NGO requests and
                  volunteer tasks currently stored
                  by FoodConnect.
                </p>
              </div>

            </div>

            {operations.length === 0 ? (

              <div className="admin-large-empty">

                <strong>
                  No operational records yet
                </strong>

                <p>
                  Records will appear here as
                  users interact with the platform.
                </p>

              </div>

            ) : (

              <div className="admin-operation-table">

                <div className="admin-table-header">

                  <span>
                    TYPE
                  </span>

                  <span>
                    ITEM
                  </span>

                  <span>
                    PARTICIPANT
                  </span>

                  <span>
                    QUANTITY
                  </span>

                  <span>
                    STATUS
                  </span>

                </div>

                {operations.map((row) => (
                  <div
                    className="admin-table-row"
                    key={row.id}
                  >

                    <span>
                      <strong className="admin-type-text">
                        {row.type}
                      </strong>
                    </span>

                    <span>
                      {row.item}
                    </span>

                    <span>
                      {row.participant}
                    </span>

                    <span>
                      {row.quantity}
                    </span>

                    <span>
                      <span
                        className={getStatusClass(
                          row.status
                        )}
                      >
                        {row.status}
                      </span>
                    </span>

                  </div>
                ))}

              </div>

            )}

          </section>
        )}

        {/* FOOTER */}

        <footer className="admin-footer">

          <div>
            <strong>
              FoodConnect AI
            </strong>

            <span>
              Administration & Operations
            </span>
          </div>

          <span>
            Records shown are based on the
            current FoodConnect prototype workflow.
          </span>

        </footer>

      </main>

    </div>
  );
}

export default AdminHome;