import { useCallback, useEffect, useMemo, useState } from "react";
import "./DonorHome.css";

const DONATIONS_KEY = "foodconnect_donations";

function DonorHome({ onLogout, onAddDonation }) {
  const [donations, setDonations] = useState([]);

  const loadDonations = useCallback(() => {
    try {
      const stored = localStorage.getItem(DONATIONS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setDonations(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Unable to load FoodConnect donations:", error);
      setDonations([]);
    }
  }, []);

  useEffect(() => {
    loadDonations();

    const handleStorage = (event) => {
      if (!event || !event.key || event.key === DONATIONS_KEY) loadDonations();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadDonations();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", loadDonations);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", loadDonations);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadDonations]);

  const getQuantity = (donation) => {
    const quantity = Number(donation?.quantity);
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  };

  const totalQuantity = useMemo(
    () => donations.reduce((sum, donation) => sum + getQuantity(donation), 0),
    [donations]
  );

  const availableCount = useMemo(
    () =>
      donations.filter((donation) =>
        ["available", "submitted", "pending"].includes(
          String(donation?.status || "Available").trim().toLowerCase()
        )
      ).length,
    [donations]
  );

  const completedCount = useMemo(
    () =>
      donations.filter((donation) =>
        ["completed", "distribution completed", "distributed"].includes(
          String(donation?.status || "").trim().toLowerCase()
        )
      ).length,
    [donations]
  );

  const formatDate = (value) => {
    if (!value) return "Date not recorded";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTitle = (donation) =>
    donation?.foodType || donation?.foodName || donation?.name || "Food donation";

  const getUnit = (donation) =>
    donation?.quantityUnit || donation?.unit || donation?.quantityType || "units";

  const getStatus = (donation) => String(donation?.status || "Available").trim();

  const getStatusClass = (status) => {
    const normalized = String(status || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `donation-status status-${normalized || "unknown"}`;
  };

  const getDate = (donation) =>
    donation?.createdAt || donation?.date || donation?.donationDate || donation?.timestamp;

  const getDropPoint = (donation) =>
    donation?.dropPoint || donation?.restaurantName || donation?.dropPointName || "";

  const getDropPointAddress = (donation) =>
    donation?.dropPointAddress ||
    donation?.dropPointArea ||
    donation?.restaurantAddress ||
    "";

  const getExpiry = (donation) => donation?.expiryTime || donation?.expiryDate || "";

  const getJourneyMessage = (status) => {
    const value = String(status || "").toLowerCase();
    if (value.includes("distribution") || value === "distributed" || value === "completed") {
      return "Distribution is recorded as complete.";
    }
    if (value.includes("ngo")) return "The donation has an NGO-related status recorded.";
    if (value.includes("deliver")) return "A delivery status has been recorded.";
    if (value.includes("restaurant") || value.includes("received")) {
      return "A restaurant handoff update has been recorded.";
    }
    if (value.includes("accept")) return "An acceptance update has been recorded.";
    if (value.includes("declin") || value.includes("reject") || value.includes("cancel")) {
      return "This donation needs your attention; review its current status.";
    }
    return "Your donation is listed. Later journey stages will appear when their status is recorded.";
  };

  const sortedDonations = useMemo(
    () =>
      donations
        .map((donation, index) => ({ donation, index }))
        .sort((a, b) => {
          const dateA = new Date(getDate(a.donation) || 0).getTime();
          const dateB = new Date(getDate(b.donation) || 0).getTime();
          return dateB - dateA || b.index - a.index;
        }),
    [donations]
  );

  return (
    <div className="donor-page">
      <header className="donor-header">
        <div className="donor-header-inner">
          <a className="donor-brand" href="#donor-home" aria-label="FoodConnect AI donor dashboard">
            <span className="donor-brand-mark" aria-hidden="true">FC</span>
            <span className="donor-brand-copy">
              <span className="donor-brand-name">FoodConnect AI</span>
              <span className="donor-brand-subtitle">Community food redistribution</span>
            </span>
          </a>
          <div className="donor-header-actions">
            <span className="donor-role-label">Donor workspace</span>
            <button type="button" className="donor-logout-button" onClick={onLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="donor-main donor-container" id="donor-home">
        <section className="donor-welcome" aria-labelledby="donor-welcome-title">
          <div className="donor-welcome-content">
            <p className="donor-eyebrow">YOUR KINDNESS MAKES A DIFFERENCE</p>
            <h1 id="donor-welcome-title">
              {donations.length > 0 ? "Bravo! You’re making surplus matter." : "Small act. Big-hearted impact."}
            </h1>
            <p className="donor-welcome-description">
              {donations.length > 0
                ? `Amazing work! You’ve recorded ${donations.length} ${donations.length === 1 ? "donation" : "donations"}. Every contribution is a meaningful step towards connecting surplus food with community needs.`
                : "Your next food donation can be the start of something wonderful. Share surplus food and help build a more connected community."}
            </p>
            <div className="donor-welcome-actions">
              <button type="button" className="donor-primary-button" onClick={onAddDonation}>
                <span className="donor-button-plus" aria-hidden="true">+</span>
                Donate food again
              </button>
              <a className="donor-secondary-button" href="#donation-history">Explore your contributions <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <aside className="donor-welcome-highlight">
            <span className="donor-highlight-kicker">Your contribution</span>
            <strong className="donor-highlight-number">{totalQuantity.toLocaleString("en-IN")}</strong>
            <span className="donor-highlight-unit">total quantity recorded</span>
            <p>Quantity is taken from your saved donation records. It is not a meal or delivery count.</p>
          </aside>
          <div className="donor-welcome-decoration" aria-hidden="true">
            <span className="donor-decoration-circle donor-decoration-circle-one" />
            <span className="donor-decoration-circle donor-decoration-circle-two" />
          </div>
        </section>

        <section className="donor-section donor-history-section" id="donation-history" aria-labelledby="donor-history-title">
          <div className="donor-section-heading donor-history-heading donor-history-heading-centered">
            <div>
              <p className="donor-section-kicker">YOUR CONTRIBUTIONS</p>
              <h2 id="donor-history-title">Donation history</h2>
              <p>Review food details, handoff information, and the latest recorded status.</p>
            </div>
          </div>

          {sortedDonations.length === 0 ? (
            <div className="donor-empty-state">
              <div className="donor-empty-illustration" aria-hidden="true">
                <svg viewBox="0 0 64 64"><path d="M13 24h38l-4 28H17z" /><path d="M22 24c0-8 4-13 10-13s10 5 10 13" /><path d="M25 37h14M25 43h14" /></svg>
              </div>
              <p className="donor-empty-kicker">A meaningful first step</p>
              <h3>Your first donation starts here.</h3>
              <p>When you have surplus food to share, add its details and select the designated restaurant handoff point. Your saved donation will appear here.</p>
              <button type="button" className="donor-primary-button" onClick={onAddDonation}>
                Add your first donation
              </button>
            </div>
          ) : (
            <div className="donor-history-list">
              {sortedDonations.map(({ donation, index }) => {
                const status = getStatus(donation);
                const dropPoint = getDropPoint(donation);
                const address = getDropPointAddress(donation);
                const mapLink = donation?.dropPointMapsLink || donation?.mapLink ||
                  (dropPoint || address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${dropPoint} ${address}`.trim())}`
                    : "");
                const expiry = getExpiry(donation);
                const date = getDate(donation);

                return (
                  <article className="donor-history-card" key={donation?.id || `${date || "donation"}-${index}`}>
                    <div className="donor-history-main">
                      <div className="donor-history-title-row">
                        <div>
                          <h3>{getTitle(donation)}</h3>
                          <p className="donor-history-quantity">
                            {getQuantity(donation).toLocaleString("en-IN")} {getUnit(donation)}
                          </p>
                        </div>
                        <span className={getStatusClass(status)}>{status}</span>
                      </div>

                      <div className="donor-history-details">
                        {(donation?.category || donation?.foodCategory) && (
                          <div className="donor-detail-item">
                            <span>Category</span>
                            <strong>{donation.category || donation.foodCategory}</strong>
                          </div>
                        )}
                        {donation?.servings != null && donation.servings !== "" && (
                          <div className="donor-detail-item">
                            <span>Servings</span>
                            <strong>{donation.servings}</strong>
                          </div>
                        )}
                        {donation?.location && (
                          <div className="donor-detail-item">
                            <span>Donor location</span>
                            <strong>{donation.location}</strong>
                          </div>
                        )}
                        {expiry && (
                          <div className="donor-detail-item">
                            <span>Safe-consumption deadline / expiry</span>
                            <strong>{formatDateTime(expiry)}</strong>
                          </div>
                        )}
                        <div className="donor-detail-item">
                          <span>Listed on</span>
                          <strong>{formatDate(date)}</strong>
                        </div>
                      </div>

                      <div className="donor-drop-point">
                        <span className="donor-drop-point-label">Restaurant handoff point</span>
                        {dropPoint ? (
                          <>
                            <strong>{dropPoint}</strong>
                            {address && <span>{address}</span>}
                            {mapLink && (
                              <a href={mapLink} target="_blank" rel="noopener noreferrer">
                                View handoff point
                                <span aria-hidden="true"> ↗</span>
                              </a>
                            )}
                          </>
                        ) : (
                          <span>Not specified in this donation record.</span>
                        )}
                      </div>

                      {donation?.description && !["none", "no", "null", "undefined"].includes(String(donation.description).trim().toLowerCase()) && <p className="donor-history-description">{donation.description}</p>}

                      <div className="donor-journey-note">
                        <span className="donor-journey-dot" aria-hidden="true" />
                        <p>{getJourneyMessage(status)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {donations.length > 0 && (
            <p className="donor-history-note">
              Statuses reflect the information saved in the current project. A listed donation does not, by itself,
              confirm restaurant receipt, NGO delivery, or distribution to beneficiaries.
            </p>
          )}
        </section>

        <section className="donor-flow-section" aria-labelledby="donor-flow-title">
          <div className="donor-section-heading">
            <div>
              <p className="donor-section-kicker">HOW YOUR DONATION MOVES</p>
              <h2 id="donor-flow-title">One contribution, a connected community.</h2>
              <p>Your donation enters a coordinated process. Each stage is updated by the role responsible for it.</p>
            </div>
          </div>
          <div className="donor-flow-grid">
            <article className="donor-flow-step">
              <span className="donor-flow-number">01</span>
              <h3>You list surplus food</h3>
              <p>Add accurate food, quantity, preparation, expiry, and storage details.</p>
            </article>
            <article className="donor-flow-step">
              <span className="donor-flow-number">02</span>
              <h3>Restaurant receives it</h3>
              <p>The designated restaurant records receipt and manages suitable food for redistribution.</p>
            </article>
            <article className="donor-flow-step">
              <span className="donor-flow-number">03</span>
              <h3>NGO requests food</h3>
              <p>NGOs review their needs and request suitable available food from restaurant partners.</p>
            </article>
            <article className="donor-flow-step">
              <span className="donor-flow-number">04</span>
              <h3>Volunteer collects and delivers</h3>
              <p>A volunteer completes the restaurant-to-NGO pickup task assigned through the workflow.</p>
            </article>
            <article className="donor-flow-step">
              <span className="donor-flow-number">05</span>
              <h3>Community distribution</h3>
              <p>The NGO coordinates distribution, with volunteers helping deliver food to beneficiaries.</p>
            </article>
          </div>
        </section>

        <footer className="donor-footer">
          <span className="donor-footer-brand">FoodConnect AI</span>
          <span>Connecting surplus food with community needs.</span>
        </footer>
      </main>
    </div>
  );
}

export default DonorHome;
