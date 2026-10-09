import { useEffect, useState } from "react";
import "./VolunteerHome.css";

const TASKS_KEY = "foodconnect_volunteer_tasks";
const REQUESTS_KEY = "foodconnect_restaurant_requests";

function getCurrentVolunteerName() {
  const email = localStorage.getItem("foodconnect_email");

  try {
    const users = JSON.parse(
      localStorage.getItem("foodconnect_users") || "[]"
    );

    if (email && Array.isArray(users)) {
      const match = users.find(
        (user) =>
          String(user?.email || "").toLowerCase() ===
          String(email).toLowerCase()
      );

      if (match?.name) {
        return String(match.name).trim();
      }
    }
  } catch {
    // Keep the demo fallback.
  }

  return "Anita";
}

function readArray(key) {
  try {
    const value = JSON.parse(
      localStorage.getItem(key) || "[]"
    );

    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return [];
  }
}

function getTaskType(task) {
  return task.taskType === "distribution" ||
    task.deliveryType === "beneficiaries"
    ? "distribution"
    : "restaurant";
}

function VolunteerHome({ onLogout }) {
  const [activeSection, setActiveSection] =
    useState("overview");

  const volunteerName = getCurrentVolunteerName();

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();

    const refresh = window.setInterval(
      loadTasks,
      1500
    );

    return () =>
      window.clearInterval(refresh);
  }, []);

  const loadTasks = () => {
    setTasks(readArray(TASKS_KEY));
  };

  const saveTasks = (updatedTasks) => {
    localStorage.setItem(
      TASKS_KEY,
      JSON.stringify(updatedTasks)
    );

    setTasks(updatedTasks);
  };

  const updateTaskStatus = (id, status) => {
    const savedTasks = readArray(TASKS_KEY);

    const updatedTasks = savedTasks.map(
      (task) =>
        String(task.id) === String(id)
          ? {
              ...task,
              status,
              updatedAt:
                new Date().toISOString(),
            }
          : task
    );

    saveTasks(updatedTasks);
  };

  const handleDelivery = (id) => {
    const savedTasks = readArray(TASKS_KEY);

    const deliveredTask =
      savedTasks.find(
        (task) =>
          String(task.id) === String(id)
      );

    if (!deliveredTask) {
      loadTasks();
      return;
    }

    const updatedTasks = savedTasks.map(
      (task) =>
        String(task.id) === String(id)
          ? {
              ...task,
              status: "Delivered",
              updatedAt:
                new Date().toISOString(),
            }
          : task
    );

    localStorage.setItem(
      TASKS_KEY,
      JSON.stringify(updatedTasks)
    );

    if (
      getTaskType(deliveredTask) ===
        "restaurant" &&
      deliveredTask.ngoRequestId
    ) {
      const requests =
        readArray(REQUESTS_KEY);

      const updatedRequests =
        requests.map(
          (request) =>
            String(request.id) ===
            String(
              deliveredTask.ngoRequestId
            )
              ? {
                  ...request,
                  deliveryStatus:
                    "Delivered",
                }
              : request
        );

      localStorage.setItem(
        REQUESTS_KEY,
        JSON.stringify(updatedRequests)
      );
    }

    setTasks(updatedTasks);
  };

  const availableTasks =
    tasks.filter(
      (task) =>
        task.status === "Pending"
    ).length;

  const activeTasks =
    tasks.filter(
      (task) =>
        task.status === "Accepted" ||
        task.status === "Picked Up"
    ).length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "Delivered"
    ).length;

  /*
   * Recognition is based only on completed
   * delivery records already present in the
   * existing volunteer workflow.
   */
  const volunteerPoints =
    completedTasks * 10;

  const nextMilestone =
    Math.ceil(
      (completedTasks + 1) / 5
    ) * 5;

  const pointsToMilestone = Math.max(
    0,
    (nextMilestone - completedTasks) *
      10
  );

  const earnedBadge =
    completedTasks >= 20
      ? "Community Champion"
      : completedTasks >= 10
      ? "Impact Builder"
      : completedTasks >= 5
      ? "Food Hero"
      : completedTasks >= 1
      ? "First Delivery"
      : "Your first badge awaits";

  const taskTypeLabel = (task) =>
    getTaskType(task) === "distribution"
      ? "COMMUNITY DISTRIBUTION"
      : "RESTAURANT PICKUP";

  const pickupName = (task) =>
    getTaskType(task) === "distribution"
      ? task.pickupLocation ||
        task.ngo ||
        "NGO distribution point"
      : task.restaurant ||
        "Restaurant";

  const pickupArea = (task) =>
    getTaskType(task) === "distribution"
      ? task.pickupArea ||
        task.ngoArea ||
        "Location provided by NGO"
      : task.restaurantArea ||
        "Restaurant location";

  const destinationName = (task) =>
    getTaskType(task) === "distribution"
      ? task.beneficiaryLocation ||
        task.deliveryLocation ||
        task.destination ||
        "Community beneficiaries"
      : task.ngo || "NGO";

  const destinationArea = (task) =>
    getTaskType(task) === "distribution"
      ? task.beneficiaryArea ||
        task.deliveryArea ||
        task.destinationArea ||
        "Distribution area"
      : task.ngoArea ||
        "NGO location";

  return (
    <div className="volunteer-page">

      {/* HEADER */}

      <header className="volunteer-header">

        <div className="volunteer-brand">

          <div className="volunteer-mark">
            FC
          </div>

          <div className="volunteer-brand-text">
            <h2>
              FoodConnect <span>AI</span>
            </h2>

            <p>
              Food Redistribution Platform
            </p>
          </div>

        </div>

        <div className="volunteer-header-right">

          <span className="volunteer-role">
            Volunteer
          </span>

          <button
            type="button"
            className="volunteer-logout"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      <main className="volunteer-content">

        {/* =================================================
            HERO
            ================================================= */}

        <section className="volunteer-welcome">

          <div className="volunteer-welcome-text">

            <span className="volunteer-label">
              GOOD FOOD NEEDS PEOPLE LIKE YOU
            </span>

            <h1>
              Hey, {volunteerName}!
              <br />
              <span>
                You make every delivery matter.
              </span>
            </h1>

            <p>
              Because of you, good food gets
              one step closer to someone who
              needs it.
            </p>

          </div>

          {/* IMPACT CARD */}

          <div className="volunteer-impact-card">

            <div className="volunteer-impact-top">

              <span>
                YOUR IMPACT
              </span>

              <div className="volunteer-impact-mark">
                ★
              </div>

            </div>

            <div className="volunteer-impact-number-row">

              <strong>
                {completedTasks}
              </strong>

              <span className="volunteer-impact-unit">
                deliveries
                <br />
                completed
              </span>

            </div>

            <p>
              Every delivery you complete
              helps good food reach someone
              who needs it.
            </p>

            <div className="volunteer-card-line" />

            <div className="volunteer-points-strip">

              <div className="volunteer-points-icon">
                ✦
              </div>

              <div>

                <span className="volunteer-points-label">
                  YOUR RECOGNITION POINTS
                </span>

                <strong>
                  {volunteerPoints} points
                </strong>

              </div>

              <span className="volunteer-points-sparkle">
                Because you showed up.
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            STATS
            ================================================= */}

        <section className="volunteer-stats">

          <div className="volunteer-stat-card">

            <div className="volunteer-stat-top">
              <span>
                AVAILABLE TASKS
              </span>

              <small>
                01
              </small>
            </div>

            <strong>
              {availableTasks}
            </strong>

            <p>
              tasks awaiting volunteers
            </p>

          </div>

          <div className="volunteer-stat-card volunteer-stat-highlight">

            <div className="volunteer-stat-top">
              <span>
                ACTIVE TASKS
              </span>

              <small>
                02
              </small>
            </div>

            <strong>
              {activeTasks}
            </strong>

            <p>
              tasks in progress
            </p>

          </div>

          <div className="volunteer-stat-card">

            <div className="volunteer-stat-top">
              <span>
                COMPLETED
              </span>

              <small>
                03
              </small>
            </div>

            <strong>
              {completedTasks}
            </strong>

            <p>
              tasks marked delivered
            </p>

          </div>

        </section>

        {/* =================================================
            RECOGNITION
            ================================================= */}

        <section className="volunteer-recognition">

          <div
            className="volunteer-recognition-art volunteer-cartoon-scene"
            aria-hidden="true"
          >

            <span className="cartoon-spark cartoon-spark-one">
              ✦
            </span>

            <span className="cartoon-spark cartoon-spark-two">
              ✧
            </span>

            <span className="cartoon-heart cartoon-heart-one">
              ♥
            </span>

            <span className="cartoon-heart cartoon-heart-two">
              ♥
            </span>

            <svg
              className="volunteer-cartoon"
              viewBox="0 0 180 150"
              role="img"
              aria-label="A cheerful cartoon food parcel"
            >
              <ellipse
                cx="91"
                cy="132"
                rx="53"
                ry="8"
                fill="#173E65"
                opacity=".12"
              />

              <path
                d="M42 57 L90 35 L139 57 L90 80 Z"
                fill="#F7C86B"
                stroke="#173E65"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              <path
                d="M42 57 L42 105 L90 129 L90 80 Z"
                fill="#F5A77F"
                stroke="#173E65"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              <path
                d="M139 57 L139 105 L90 129 L90 80 Z"
                fill="#E98972"
                stroke="#173E65"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              <path
                d="M72 43 L119 65 L101 74 L53 51 Z"
                fill="#FFE6A4"
                stroke="#173E65"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              <path
                d="M90 80 L90 128"
                stroke="#173E65"
                strokeWidth="2.5"
              />

              <circle
                cx="75"
                cy="88"
                r="3.7"
                fill="#173E65"
              />

              <circle
                cx="105"
                cy="88"
                r="3.7"
                fill="#173E65"
              />

              <path
                d="M79 99 Q90 110 101 99"
                fill="none"
                stroke="#173E65"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <path
                d="M52 90 Q29 78 32 98 Q35 111 52 107"
                fill="#FFD36D"
                stroke="#173E65"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M128 89 Q151 76 151 96 Q149 109 129 107"
                fill="#FFD36D"
                stroke="#173E65"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M76 29 Q83 16 90 29 Q97 16 104 29"
                fill="none"
                stroke="#2D79B6"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>

            <span className="recognition-box">
              ♡
            </span>

          </div>

          <div className="volunteer-recognition-copy">

            <span className="volunteer-label">
              BECAUSE YOU SHOWED UP
            </span>

            <h2>
              {completedTasks === 0
                ? `${volunteerName}, your first delivery can start something meaningful.`
                : completedTasks < 5
                ? `${volunteerName}, your kindness is already in motion.`
                : completedTasks < 10
                ? `${volunteerName}, you're turning care into action.`
                : completedTasks < 20
                ? `${volunteerName}, every delivery is making a difference.`
                : `${volunteerName}, you're becoming a Community Champion.`}
            </h2>

            <p>
              {completedTasks === 0
                ? "A pickup may seem small, but it can be the step that gets good food where it belongs."
                : `You've completed ${completedTasks} ${
                    completedTasks === 1
                      ? "delivery"
                      : "deliveries"
                  } and earned ${volunteerPoints} recognition points.`}
            </p>

            <div className="volunteer-badge-row">

              <span className="volunteer-earned-badge">
                ✦ {earnedBadge}
              </span>

              <span className="volunteer-next-milestone">
                {completedTasks === 0
                  ? "First milestone: 10 points"
                  : `${pointsToMilestone} points to your next 5-delivery milestone`}
              </span>

            </div>

          </div>

          <div className="volunteer-recognition-score">

            <span>
              POINTS EARNED
            </span>

            <strong>
              {volunteerPoints}
            </strong>

            <small>
              10 points per completed delivery
            </small>

          </div>

        </section>

        {/* =================================================
            TABS
            ================================================= */}

        <section className="volunteer-tabs">

          <button
            type="button"
            className={
              activeSection === "overview"
                ? "volunteer-tab active"
                : "volunteer-tab"
            }
            onClick={() =>
              setActiveSection("overview")
            }
          >
            Overview
          </button>

          <button
            type="button"
            className={
              activeSection === "tasks"
                ? "volunteer-tab active"
                : "volunteer-tab"
            }
            onClick={() =>
              setActiveSection("tasks")
            }
          >
            Delivery Tasks
          </button>

        </section>

        {/* =================================================
            OVERVIEW
            ================================================= */}

        {activeSection === "overview" && (
          <section>

            <div className="volunteer-section-header">

              <span className="volunteer-label">
                OVERVIEW
              </span>

              <h2>
                Volunteer Overview
              </h2>

              <p>
                Choose a task and follow its
                pickup and delivery instructions.
              </p>

            </div>

            <div className="volunteer-overview-grid">

              <div className="volunteer-card volunteer-flow-card">

                <div className="volunteer-card-heading">

                  <span>
                    PROCESS
                  </span>

                  <h3>
                    Two Delivery Routes
                  </h3>

                </div>

                <div className="volunteer-flow">

                  <div className="volunteer-flow-item">
                    <span>01</span>
                    <strong>Restaurant</strong>
                    <p>
                      Food prepared or received
                    </p>
                  </div>

                  <div className="volunteer-flow-line">
                    ↓
                  </div>

                  <div className="volunteer-flow-item">
                    <span>02</span>
                    <strong>Volunteer</strong>
                    <p>
                      Food collected
                    </p>
                  </div>

                  <div className="volunteer-flow-line">
                    ↓
                  </div>

                  <div className="volunteer-flow-item">
                    <span>03</span>
                    <strong>NGO</strong>
                    <p>
                      Food received for
                      planning and distribution
                    </p>
                  </div>

                </div>

                <div className="volunteer-flow">

                  <div className="volunteer-flow-item">
                    <span>01</span>
                    <strong>NGO</strong>
                    <p>
                      Distribution task assigned
                    </p>
                  </div>

                  <div className="volunteer-flow-line">
                    ↓
                  </div>

                  <div className="volunteer-flow-item">
                    <span>02</span>
                    <strong>Volunteer</strong>
                    <p>
                      Food collected for delivery
                    </p>
                  </div>

                  <div className="volunteer-flow-line">
                    ↓
                  </div>

                  <div className="volunteer-flow-item">
                    <span>03</span>
                    <strong>Community</strong>
                    <p>
                      Food delivered to the
                      specified location
                    </p>
                  </div>

                </div>

              </div>

              <div className="volunteer-card">

                <div className="volunteer-card-heading">

                  <span>
                    ROLE
                  </span>

                  <h3>
                    Volunteer Responsibilities
                  </h3>

                </div>

                <ul className="volunteer-responsibility-list">

                  <li>
                    Review available pickup
                    and distribution tasks.
                  </li>

                  <li>
                    Accept a task before
                    starting the delivery.
                  </li>

                  <li>
                    Collect food from the
                    listed pickup location.
                  </li>

                  <li>
                    Deliver food to the stated
                    NGO or community destination.
                  </li>

                  <li>
                    Update the task status only
                    when the relevant step is complete.
                  </li>

                </ul>

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            DELIVERY TASKS
            ================================================= */}

        {activeSection === "tasks" && (
          <section>

            <div className="volunteer-section-header">

              <span className="volunteer-label">
                DELIVERY WORK
              </span>

              <h2>
                Available Delivery Tasks
              </h2>

              <p>
                Tasks appear here when a restaurant
                or NGO has created them in this
                browser's saved workflow.
              </p>

            </div>

            <div className="volunteer-task-grid">

              {tasks.length === 0 ? (

                <div className="volunteer-empty">

                  <div className="volunteer-empty-mark">
                    FC
                  </div>

                  <h3>
                    No delivery tasks yet
                  </h3>

                  <p>
                    Restaurant pickup tasks and
                    NGO distribution tasks will
                    appear here when created.
                  </p>

                </div>

              ) : (

                tasks.map((task) => {

                  const type =
                    getTaskType(task);

                  const statusClass =
                    task.status === "Pending"
                      ? "pending"
                      : task.status === "Accepted"
                      ? "accepted"
                      : task.status === "Picked Up"
                      ? "picked"
                      : "delivered";

                  return (
                    <div
                      className="volunteer-task-card"
                      key={task.id}
                    >

                      <div className="volunteer-task-top">

                        <div>

                          <span className="volunteer-small-label">
                            {taskTypeLabel(task)}
                          </span>

                          <h3>
                            {pickupName(task)}
                          </h3>

                          <p>
                            Pickup:{" "}
                            {pickupArea(task)}
                          </p>

                        </div>

                        <span
                          className={`volunteer-badge ${statusClass}`}
                        >
                          {task.status ||
                            "Pending"}
                        </span>

                      </div>

                      <div className="volunteer-task-details">

                        <div>
                          <span>
                            FOOD
                          </span>

                          <strong>
                            {task.quantity ??
                              task.requiredFood ??
                              "Not specified"}{" "}
                            meals
                          </strong>
                        </div>

                        <div>
                          <span>
                            DELIVERY TO
                          </span>

                          <strong>
                            {destinationName(
                              task
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            AREA
                          </span>

                          <strong>
                            {destinationArea(
                              task
                            )}
                          </strong>
                        </div>

                      </div>

                      {task.foodType && (
                        <p className="volunteer-task-food-type">
                          Food type:{" "}
                          <strong>
                            {task.foodType}
                          </strong>
                        </p>
                      )}

                      {task.instructions && (
                        <p>
                          {task.instructions}
                        </p>
                      )}

                      {task.status ===
                        "Pending" && (
                        <button
                          type="button"
                          className="volunteer-accept-button"
                          onClick={() =>
                            updateTaskStatus(
                              task.id,
                              "Accepted"
                            )
                          }
                        >
                          Accept Task
                        </button>
                      )}

                      {task.status ===
                        "Accepted" && (
                        <div className="volunteer-action-box">

                          <p>
                            Task accepted.
                            Collect the food
                            from the pickup
                            location.
                          </p>

                          <button
                            type="button"
                            className="volunteer-action-button"
                            onClick={() =>
                              updateTaskStatus(
                                task.id,
                                "Picked Up"
                              )
                            }
                          >
                            Mark Picked Up
                          </button>

                        </div>
                      )}

                      {task.status ===
                        "Picked Up" && (
                        <div className="volunteer-action-box">

                          <p>
                            {type ===
                            "distribution"
                              ? "Food collected. Deliver it to the specified community location."
                              : "Food collected. Deliver it to the NGO."}
                          </p>

                          <button
                            type="button"
                            className="volunteer-action-button"
                            onClick={() =>
                              handleDelivery(
                                task.id
                              )
                            }
                          >
                            Mark Delivered
                          </button>

                        </div>
                      )}

                      {task.status ===
                        "Delivered" && (
                        <div className="volunteer-completed-box">
                          {type ===
                          "distribution"
                            ? "Task marked delivered to the community destination."
                            : "Task marked delivered to the NGO."}
                        </div>
                      )}

                    </div>
                  );
                })
              )}

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default VolunteerHome;