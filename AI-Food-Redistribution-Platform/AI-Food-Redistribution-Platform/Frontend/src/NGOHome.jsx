import { useEffect, useMemo, useState } from "react";
import "./NGOHome.css";

const API_BASE = "http://127.0.0.1:5000";

const safeRead = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const saveArray = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const todayISO = () => new Date().toISOString().slice(0, 10);

const foodCategories = [
  "Cooked meals",
  "Meal packets",
  "Bakery items",
  "Fresh produce",
  "Packaged food",
  "Rice and grains",
  "Other",
];

const getStatus = (value) => String(value || "Pending").toLowerCase().replace(/\s+/g, "-");

function NGOHome({ onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [ngoName, setNgoName] = useState(
    localStorage.getItem("foodconnect_ngo_name") || "Community NGO"
  );
  const [ngoArea, setNgoArea] = useState(
    localStorage.getItem("foodconnect_ngo_area") || "Andheri"
  );
  const [beneficiaries, setBeneficiaries] = useState(
    localStorage.getItem("foodconnect_ngo_beneficiaries") || "200"
  );
  const [forecastFood, setForecastFood] = useState("Cooked meals");
  const [previousDemand, setPreviousDemand] = useState("180");
  const [donationsReceived, setDonationsReceived] = useState("35");
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const [forecastInputs, setForecastInputs] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [restaurantError, setRestaurantError] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFood, setRequestFood] = useState("Cooked meals");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestDate, setRequestDate] = useState(todayISO());
  const [requestRestaurant, setRequestRestaurant] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [distributionFood, setDistributionFood] = useState("Cooked meals");
  const [distributionQuantity, setDistributionQuantity] = useState("");
  const [distributionDate, setDistributionDate] = useState(todayISO());
  const [distributionLocation, setDistributionLocation] = useState("");
  const [distributionNotes, setDistributionNotes] = useState("");
  const [distributionMessage, setDistributionMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRestaurantsLoading(true);
    fetch(`${API_BASE}/restaurants`)
      .then((response) => {
        if (!response.ok) throw new Error("The restaurant directory could not be loaded.");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data.restaurants) ? data.restaurants : [];
        setRestaurants(rows);
        setRestaurantError("");
      })
      .catch(() => {
        if (!cancelled) {
          setRestaurants([]);
          setRestaurantError("Restaurant directory is unavailable. Make sure the Flask backend is running on port 5000.");
        }
      })
      .finally(() => {
        if (!cancelled) setRestaurantsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const requests = useMemo(() => {
    const saved = safeRead("foodconnect_restaurant_requests");
    return saved
      .filter((item) => {
        const owner = item.ngoName || item.ngo || "";
        return !owner || owner.toLowerCase() === ngoName.toLowerCase();
      })
      .map((item) => ({
        ...item,
        ngoName: item.ngoName || item.ngo || ngoName,
        foodType: item.foodType || item.foodCategory || "Cooked meals",
        requiredFood: Number(item.requiredFood ?? item.quantity ?? 0),
        restaurantName: item.restaurantName || item.restaurant || "",
        restaurantArea: item.restaurantArea || item.area || "",
        status: item.status || "Pending",
        requestedDate: item.requestedDate || item.requiredBy || item.neededBy || "",
      }));
  }, [refreshKey, ngoName]);

  const inventory = useMemo(() => {
    const stored = safeRead("foodconnect_ngo_inventory");
    const received = safeRead("foodconnect_ngo_received_food");
    const merged = [...stored, ...received];
    return merged.filter((item) => {
      const owner = item.ngoName || item.ngo || "";
      return !owner || owner.toLowerCase() === ngoName.toLowerCase();
    }).map((item) => ({
      ...item,
      foodType: item.foodType || item.foodName || item.foodCategory || "Food item",
      quantity: Number(item.availableQuantity ?? item.quantityAvailable ?? item.quantity ?? 0),
      expiry: item.expiry || item.expiryTime || item.expiryDate || "",
      status: item.distributionStatus || item.status || "Available",
    }));
  }, [refreshKey, ngoName]);

  const distributionHistory = useMemo(() => {
    return safeRead("foodconnect_ngo_distributions")
      .filter((item) => {
        const owner = item.ngoName || item.ngo || "";
        return !owner || owner.toLowerCase() === ngoName.toLowerCase();
      });
  }, [refreshKey, ngoName]);

  const pendingRequests = requests.filter((item) => ["pending", "submitted"].includes(getStatus(item.status))).length;
  const availableStock = inventory.reduce((sum, item) => {
    if (["expired", "distributed", "completed"].includes(getStatus(item.status))) return sum;
    return sum + (Number(item.quantity) || 0);
  }, 0);
  const predictedDemand = forecast?.predicted_demand;
  const shortage = Number.isFinite(Number(predictedDemand))
    ? Math.max(0, Number(predictedDemand) - availableStock)
    : null;
  const stockCoverage = Number.isFinite(Number(predictedDemand)) && Number(predictedDemand) > 0
    ? Math.min(100, Math.round((availableStock / Number(predictedDemand)) * 100))
    : null;

  const refresh = () => setRefreshKey((value) => value + 1);
  const updateNGOProfile = (field, value) => {
    if (field === "name") {
      setNgoName(value);
      localStorage.setItem("foodconnect_ngo_name", value);
    } else if (field === "area") {
      setNgoArea(value);
      localStorage.setItem("foodconnect_ngo_area", value);
    } else {
      setBeneficiaries(value);
      localStorage.setItem("foodconnect_ngo_beneficiaries", value);
    }
  };

  const runForecast = async () => {
    setForecastLoading(true);
    setForecastError("");
    setForecast(null);
    setForecastInputs(null);
    const now = new Date();
    const input = {
      area: ngoArea.trim(),
      food_type: forecastFood,
      day_of_week: now.getDay(),
      is_weekend: [0, 6].includes(now.getDay()) ? 1 : 0,
      month: now.getMonth() + 1,
      beneficiaries: Number(beneficiaries),
      previous_demand: Number(previousDemand),
      donations_received: Number(donationsReceived),
    };

    if (!input.area || !Number.isFinite(input.beneficiaries) || input.beneficiaries < 1 ||
        !Number.isFinite(input.previous_demand) || input.previous_demand < 0 ||
        !Number.isFinite(input.donations_received) || input.donations_received < 0) {
      setForecastError("Enter a valid area, beneficiary count, previous demand and received-donation quantity.");
      setForecastLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/predict-demand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok || !Number.isFinite(Number(data.predicted_demand))) {
        throw new Error(data.message || "The forecasting model did not return a valid prediction.");
      }
      setForecast({ predicted_demand: Math.max(0, Number(data.predicted_demand)) });
      setForecastInputs(input);
      setActiveTab("forecast");
    } catch (error) {
      setForecastError(
        error.message?.includes("Failed to fetch")
          ? "Could not connect to the AI service. Start your Flask backend and try again."
          : error.message || "Forecast could not be generated."
      );
    } finally {
      setForecastLoading(false);
    }
  };

  const submitRequest = (event) => {
    event.preventDefault();
    setRequestMessage("");
    const quantity = Number(requestQuantity);
    if (!quantity || quantity <= 0) {
      setRequestMessage("Enter a quantity greater than zero.");
      return;
    }
    if (!requestRestaurant) {
      setRequestMessage("Choose a restaurant from the loaded restaurant directory.");
      return;
    }
    const selected = restaurants.find((restaurant) =>
      String(restaurant.Restaurant || restaurant.restaurant || restaurant.name || "") === requestRestaurant
    );
    const existing = safeRead("foodconnect_restaurant_requests");
    const newRequest = {
      id: Date.now(),
      ngoName,
      ngoArea,
      restaurantName: requestRestaurant,
      restaurantArea: selected?.Area || selected?.area || ngoArea,
      foodType: requestFood,
      requiredFood: quantity,
      requestedDate: requestDate,
      notes: requestNotes.trim(),
      status: "Pending",
      createdAt: new Date().toISOString(),
      source: "ngo-dashboard",
    };
    existing.unshift(newRequest);
    saveArray("foodconnect_restaurant_requests", existing);
    setRequestQuantity("");
    setRequestNotes("");
    setShowRequestForm(false);
    setRequestMessage("Request saved. The selected restaurant must review and accept or decline it.");
    refresh();
  };

  const recordDistribution = (event) => {
    event.preventDefault();
    setDistributionMessage("");
    const quantity = Number(distributionQuantity);
    if (!quantity || quantity <= 0) {
      setDistributionMessage("Enter a quantity greater than zero.");
      return;
    }
    if (inventory.length > 0 && quantity > availableStock) {
      setDistributionMessage(`The recorded available inventory is ${availableStock} units. Reduce the quantity or update inventory first.`);
      return;
    }
    const rows = safeRead("foodconnect_ngo_distributions");
    rows.unshift({
      id: Date.now(),
      ngoName,
      ngoArea,
      foodType: distributionFood,
      quantity,
      distributionDate: distributionDate,
      location: distributionLocation.trim(),
      notes: distributionNotes.trim(),
      status: "Completed",
      createdAt: new Date().toISOString(),
      source: "ngo-dashboard",
    });
    saveArray("foodconnect_ngo_distributions", rows);
    setDistributionQuantity("");
    setDistributionLocation("");
    setDistributionNotes("");
    setDistributionMessage("Distribution record saved to this browser.");
    refresh();
  };

  const createDeliveryTask = (distribution) => {
    const tasks = safeRead("foodconnect_volunteer_tasks");
    const duplicate = tasks.some((task) =>
      String(task.distributionId || "") === String(distribution.id)
    );
    if (duplicate) {
      setDistributionMessage("A delivery task already exists for this distribution.");
      return;
    }
    tasks.unshift({
      id: Date.now(),
      taskType: "NGO_TO_BENEFICIARIES",
      distributionId: distribution.id,
      ngoName,
      ngo: ngoName,
      ngoArea,
      foodType: distribution.foodType,
      quantity: distribution.quantity,
      destination: distribution.location || ngoArea,
      notes: distribution.notes || "",
      status: "Pending",
      createdAt: new Date().toISOString(),
    });
    saveArray("foodconnect_volunteer_tasks", tasks);
    setDistributionMessage("Delivery task created for volunteer coordination.");
    refresh();
  };

  const tabs = [
    ["overview", "Overview"],
    ["forecast", "AI Forecast"],
    ["shortage", "Shortage analysis"],
    ["inventory", "Food inventory"],
    ["restaurants", "Restaurants"],
    ["requests", "Food requests"],
    ["distribution", "Distribution"],
    ["history", "History"],
  ];

  const formatDate = (value) => {
    if (!value) return "Not provided";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  return (
    <div className="ngo-page">
      <header className="ngo-topbar">
        <a className="ngo-brand" href="#ngo-top" aria-label="FoodConnect AI NGO dashboard">
          <span className="ngo-brand-mark">FC</span>
          <span className="ngo-brand-copy"><strong>FoodConnect <i>AI</i></strong><small>COMMUNITY FOOD INTELLIGENCE</small></span>
        </a>
        <div className="ngo-topbar-actions">
          <span className="ngo-role-pill">NGO WORKSPACE</span>
          <button className="ngo-logout" type="button" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <main className="ngo-content" id="ngo-top">
        <section className="ngo-hero">
          <div className="ngo-hero-copy">
            <span className="ngo-kicker"><span className="ngo-kicker-dot" /> FOOD NEEDS, PREDICTED WITH PURPOSE</span>
            <h1>Feed the need.<br /><em>Before it grows.</em></h1>
            <p>Turn community demand into a clearer food plan. Forecast requirements, uncover shortages, and request what your community needs.</p>
            <div className="ngo-hero-buttons">
              <button className="ngo-button ngo-button-coral" type="button" onClick={() => { setActiveTab("forecast"); document.getElementById("ngo-main")?.scrollIntoView({ behavior: "smooth" }); }}>View AI forecast <span>↗</span></button>
              <button className="ngo-button ngo-button-glass" type="button" onClick={() => { setActiveTab("requests"); setShowRequestForm(true); document.getElementById("ngo-main")?.scrollIntoView({ behavior: "smooth" }); }}>Request food <span>+</span></button>
            </div>
            <div className="ngo-hero-footnote"><span className="ngo-footnote-star">✳</span> Forecasts support planning. Your team decides what to request.</div>
          </div>
          <div className="ngo-hero-illustration" aria-label="Illustration of a cheerful bowl of food surrounded by vegetables">
            <div className="ngo-art-sun" />
            <div className="ngo-art-spark spark-a">✦</div><div className="ngo-art-spark spark-b">✳</div><div className="ngo-art-spark spark-c">✦</div>
            <div className="ngo-art-orbit" />
            <div className="ngo-art-carrot"><span /><b /><i /></div>
            <div className="ngo-art-leaf leaf-a" /><div className="ngo-art-leaf leaf-b" /><div className="ngo-art-leaf leaf-c" />
            <div className="ngo-art-bowl"><div className="ngo-art-bowl-rim"><span className="bowl-food food-a" /><span className="bowl-food food-b" /><span className="bowl-food food-c" /><span className="bowl-food food-d" /><span className="bowl-food food-e" /><span className="bowl-face"><i /><b /></span></div><div className="ngo-art-bowl-base" /></div>
            <div className="ngo-art-sticker">GOOD FOOD<br /><b>GOES FAR.</b></div>
            <div className="ngo-art-note">forecast<br /><strong>with heart</strong></div>
          </div>
        </section>

        <section className="ngo-profile-strip">
          <div className="ngo-profile-avatar">{ngoName.split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase()}</div>
          <div className="ngo-profile-name"><small>YOUR ORGANIZATION</small><strong>{ngoName}</strong><span>{ngoArea} · Mumbai, Maharashtra</span></div>
          <button type="button" className="ngo-profile-edit" onClick={() => { const name = window.prompt("Organization name", ngoName); if (name?.trim()) updateNGOProfile("name", name.trim()); const area = window.prompt("Organization area", ngoArea); if (area?.trim()) updateNGOProfile("area", area.trim()); const count = window.prompt("People your organization supports", beneficiaries); if (count && Number(count) > 0) updateNGOProfile("beneficiaries", String(Number(count))); }}>Edit profile ↗</button>
          <div className="ngo-profile-people"><span className="people-dot">+</span><span><b>{Number(beneficiaries).toLocaleString()}</b><small>people supported / forecast input</small></span></div>
        </section>

        <section className="ngo-metrics" aria-label="NGO overview metrics">
          <article className="ngo-metric metric-lilac"><div className="metric-top"><span>AVAILABLE STOCK</span><span className="metric-doodle">▦</span></div><strong>{availableStock.toLocaleString()}<small> units</small></strong><p>Recorded inventory only</p><div className="metric-decoration metric-decoration-lilac" /></article>
          <article className="ngo-metric metric-yellow"><div className="metric-top"><span>AI PREDICTED NEED</span><span className="metric-doodle">✳</span></div><strong>{predictedDemand == null ? "—" : Number(predictedDemand).toLocaleString()}<small>{predictedDemand == null ? " run forecast" : " model units"}</small></strong><p>{forecast ? "Latest successful model output" : "No forecast generated yet"}</p><div className="metric-decoration metric-decoration-yellow" /></article>
          <article className="ngo-metric metric-pink"><div className="metric-top"><span>ESTIMATED SHORTAGE</span><span className="metric-doodle">↗</span></div><strong>{shortage == null ? "—" : shortage.toLocaleString()}<small>{shortage == null ? " needs forecast" : " units"}</small></strong><p>{shortage == null ? "Run AI forecast to compare" : shortage > 0 ? "Potential need to request" : "Recorded stock covers forecast"}</p><div className="metric-decoration metric-decoration-pink" /></article>
          <article className="ngo-metric metric-blue"><div className="metric-top"><span>PENDING REQUESTS</span><span className="metric-doodle">↗</span></div><strong>{pendingRequests.toLocaleString()}</strong><p>Awaiting restaurant decisions</p><div className="metric-decoration metric-decoration-blue" /></article>
        </section>

        <nav className="ngo-tabs" aria-label="NGO dashboard sections">
          {tabs.map(([key, label]) => <button key={key} type="button" className={activeTab === key ? "ngo-tab active" : "ngo-tab"} onClick={() => setActiveTab(key)}>{label}{key === "requests" && pendingRequests > 0 && <span>{pendingRequests}</span>}</button>)}
        </nav>

        <div id="ngo-main">
          {activeTab === "overview" && (
            <section className="ngo-section ngo-section-enter">
              <div className="ngo-section-heading"><div><span className="ngo-section-kicker">THE BIG PICTURE</span><h2>Your community, <em>in focus.</em></h2><p>Use the latest recorded stock and AI forecast to decide what your organization should request next.</p></div><span className="ngo-live-chip"><i /> Live local records</span></div>
              <div className="ngo-overview-grid">
                <article className="ngo-panel ngo-forecast-preview">
                  <div className="ngo-panel-heading"><div><span className="ngo-mini-label">AI DEMAND FORECAST</span><h3>What will your community need?</h3></div><span className="ngo-orbit-icon">✳</span></div>
                  {forecast ? <div className="ngo-forecast-result"><div className="forecast-number">{Number(forecast.predicted_demand).toLocaleString()}<small> model units</small></div><p>Predicted need for <b>{forecastInputs?.area}</b> · {forecastInputs?.food_type}</p><button className="ngo-button ngo-button-dark" type="button" onClick={() => setActiveTab("forecast")}>See why this was predicted ↗</button></div> : <div className="ngo-forecast-empty"><div className="forecast-empty-art"><span>?</span><i /><b /></div><div><strong>Your next food plan starts here.</strong><p>Run the forecasting model using your area, food category, beneficiary count and recent demand inputs.</p><button className="ngo-text-link" type="button" onClick={() => setActiveTab("forecast")}>Set up a forecast <span>→</span></button></div></div>}
                  {forecastError && <p className="ngo-inline-error">{forecastError}</p>}
                </article>
                <article className="ngo-panel ngo-shortage-preview">
                  <span className="ngo-mini-label">STOCK VS. NEED</span><h3>How much is covered?</h3>
                  {forecast && stockCoverage != null ? <><div className="coverage-ring" style={{ "--coverage": `${stockCoverage}%` }}><div><strong>{stockCoverage}%</strong><small>covered</small></div></div><div className="coverage-legend"><span><i className="legend-stock" /> Recorded stock <b>{availableStock}</b></span><span><i className="legend-gap" /> Estimated gap <b>{shortage}</b></span></div><button className="ngo-text-link" type="button" onClick={() => setActiveTab("shortage")}>Explore shortage <span>→</span></button></> : <div className="coverage-placeholder"><div className="coverage-placeholder-bars"><i /><i /><i /><i /><i /></div><p>Generate a forecast to compare predicted demand with recorded inventory.</p><button className="ngo-text-link" type="button" onClick={() => setActiveTab("shortage")}>Open shortage analysis <span>→</span></button></div>}
                </article>
              </div>
              <div className="ngo-quick-actions">
                <button type="button" className="ngo-action-card action-coral" onClick={() => { setActiveTab("requests"); setShowRequestForm(true); }}><span className="action-art action-art-bag">+</span><span><small>NEED FOOD?</small><b>Request from a restaurant</b><i>Choose food, quantity and date ↗</i></span></button>
                <button type="button" className="ngo-action-card action-lilac" onClick={() => setActiveTab("inventory")}><span className="action-art action-art-box">▤</span><span><small>CHECK WHAT YOU HAVE</small><b>Review food inventory</b><i>See recorded stock and expiry ↗</i></span></button>
                <button type="button" className="ngo-action-card action-yellow" onClick={() => setActiveTab("distribution")}><span className="action-art action-art-heart">♥</span><span><small>COMMUNITY IMPACT</small><b>Record a distribution</b><i>Keep your history traceable ↗</i></span></button>
              </div>
              <div className="ngo-bottom-note"><span className="ngo-note-doodle">✳</span><p><b>Forecast with transparency.</b> The AI predicts demand from the inputs shown. Shortage is calculated separately as <strong>max(0, predicted demand − recorded available stock)</strong>. A restaurant still decides whether to accept each food request.</p></div>
            </section>
          )}

          {activeTab === "forecast" && (
            <section className="ngo-section ngo-section-enter">
              <div className="ngo-section-heading"><div><span className="ngo-section-kicker">THE MAIN AI FEATURE</span><h2>Forecast the <em>food gap.</em></h2><p>Run the trained demand model and inspect the inputs behind its prediction.</p></div><span className="ngo-ai-chip"><span>✳</span> Model-powered</span></div>
              <div className="ngo-forecast-layout">
                <form className="ngo-panel ngo-forecast-form" onSubmit={(event) => { event.preventDefault(); runForecast(); }}>
                  <div className="ngo-panel-heading"><div><span className="ngo-mini-label">FORECAST INPUTS</span><h3>Tell us about your community</h3></div><span className="ngo-form-number">01</span></div>
                  <div className="ngo-form-grid">
                    <label>Organization area<input value={ngoArea} onChange={(e) => updateNGOProfile("area", e.target.value)} placeholder="e.g. Andheri" required /></label>
                    <label>Food category<select value={forecastFood} onChange={(e) => setForecastFood(e.target.value)}>{foodCategories.map((food) => <option key={food}>{food}</option>)}</select></label>
                    <label>Beneficiaries supported<input type="number" min="1" value={beneficiaries} onChange={(e) => updateNGOProfile("beneficiaries", e.target.value)} required /></label>
                    <label>Previous demand (model units)<input type="number" min="0" value={previousDemand} onChange={(e) => setPreviousDemand(e.target.value)} required /><small>Use your most recent comparable demand total.</small></label>
                    <label className="ngo-form-full">Donations received in the current period (model units)<input type="number" min="0" value={donationsReceived} onChange={(e) => setDonationsReceived(e.target.value)} required /><small>Enter the total for the same period as your previous-demand figure.</small></label>
                  </div>
                  <div className="ngo-model-note"><span>i</span><p><b>What the model uses</b> Area, food type, day of week, weekend flag, month, beneficiaries, previous demand and donations received are sent to the Flask model. Day and month are filled from today's date.</p></div>
                  {forecastError && <p className="ngo-inline-error">{forecastError}</p>}
                  <button className="ngo-button ngo-button-dark ngo-run-button" type="submit" disabled={forecastLoading}>{forecastLoading ? <><span className="ngo-spinner" /> Forecasting demand…</> : <>Run AI forecast <span>✳</span></>}</button>
                </form>
                <aside className="ngo-panel ngo-forecast-output">
                  <div className="ngo-output-illustration"><div className="output-sun" /><div className="output-plant plant-left" /><div className="output-plant plant-right" /><div className="output-chart"><span /><span /><span /><span /><span /></div><div className="output-star">✳</div></div>
                  <span className="ngo-mini-label">MODEL OUTPUT</span>
                  <h3>{forecast ? "Your forecast is ready." : "Your prediction will appear here."}</h3>
                  {forecast ? <><div className="output-demand">{Number(forecast.predicted_demand).toLocaleString()}<small>model units</small></div><p className="output-period">Forecast run on {new Date().toLocaleDateString()} for {forecastInputs?.area}.</p><div className="output-reason-list"><div><span>Food category</span><b>{forecastInputs?.food_type}</b></div><div><span>Beneficiaries</span><b>{forecastInputs?.beneficiaries}</b></div><div><span>Previous demand</span><b>{forecastInputs?.previous_demand}</b></div><div><span>Donations received</span><b>{forecastInputs?.donations_received}</b></div><div><span>Day / month</span><b>{forecastInputs?.day_of_week} / {forecastInputs?.month}</b></div></div><button type="button" className="ngo-button ngo-button-coral output-request-button" onClick={() => { setRequestFood(forecastInputs?.food_type || "Cooked meals"); setRequestQuantity(shortage > 0 ? String(shortage) : ""); setActiveTab("requests"); setShowRequestForm(true); }}>Prepare a food request ↗</button></> : <p className="ngo-output-copy">No example numbers are shown as live results. Run the model to display its actual prediction and the input values used.</p>}
                </aside>
              </div>
              <div className="ngo-criteria-grid">
                <article><span className="criteria-number">A</span><h4>Area & food type</h4><p>The model receives the NGO's selected locality and food category.</p></article>
                <article><span className="criteria-number">B</span><h4>Calendar context</h4><p>Day of week, weekend indicator and month are passed to the model.</p></article>
                <article><span className="criteria-number">C</span><h4>Community size</h4><p>The beneficiary count is used as an input to estimate demand.</p></article>
                <article><span className="criteria-number">D</span><h4>Recent supply & demand</h4><p>Previous demand and donations received help contextualize the forecast.</p></article>
              </div>
            </section>
          )}

          {activeTab === "shortage" && (
            <section className="ngo-section ngo-section-enter">
              <div className="ngo-section-heading"><div><span className="ngo-section-kicker">NEED MINUS STOCK</span><h2>Find the <em>missing pieces.</em></h2><p>Shortage is derived from your latest model prediction and the inventory recorded for this NGO.</p></div><button className="ngo-button ngo-button-dark" type="button" onClick={() => setActiveTab("forecast")}>Run / update forecast ↗</button></div>
              {forecast ? <div className="ngo-shortage-layout"><article className="ngo-panel shortage-equation"><span className="ngo-mini-label">SHORTAGE CALCULATION</span><div className="shortage-equation-row"><span><small>Predicted demand</small><strong>{Number(predictedDemand).toLocaleString()}</strong></span><b>−</b><span><small>Recorded available stock</small><strong>{availableStock.toLocaleString()}</strong></span><b>=</b><span className="shortage-result"><small>Estimated shortage</small><strong>{shortage.toLocaleString()}</strong></span></div><div className="shortage-progress"><div><span>Stock coverage</span><b>{stockCoverage}%</b></div><div className="shortage-track"><span style={{ width: `${stockCoverage}%` }} /></div></div><p className="ngo-calculation-note">Calculated as max(0, predicted demand − recorded available stock). This calculation does not automatically create a request or allocate food.</p><button className="ngo-button ngo-button-coral" type="button" onClick={() => { setRequestFood(forecastInputs?.food_type || "Cooked meals"); setRequestQuantity(shortage > 0 ? String(shortage) : ""); setActiveTab("requests"); setShowRequestForm(true); }}>Request the estimated gap ↗</button></article><article className="ngo-panel shortage-explainer"><div className="shortage-cartoon"><div className="shortage-cloud">!</div><div className="shortage-box"><i /><i /><i /></div><div className="shortage-sprout" /></div><span className="ngo-mini-label">HOW TO READ THIS</span><h3>{shortage > 0 ? "There may be a supply gap." : "Recorded stock covers the forecast."}</h3><p>{shortage > 0 ? "Use the estimated gap as a planning signal. Check expiry dates and food suitability before deciding how much to request." : "The model output is not higher than the current recorded inventory. Review food category, expiry and distribution commitments before making a decision."}</p></article></div> : <div className="ngo-panel ngo-empty-panel"><div className="ngo-empty-doodle">?</div><h3>Run a forecast to calculate the gap.</h3><p>Shortage analysis uses a real model response and your recorded available stock. It will not fill in illustrative figures.</p><button className="ngo-button ngo-button-dark" type="button" onClick={() => setActiveTab("forecast")}>Go to AI forecast ↗</button></div>}
            </section>
          )}

          {activeTab === "inventory" && (
            <section className="ngo-section ngo-section-enter">
              <div className="ngo-section-heading"><div><span className="ngo-section-kicker">FOOD ON HAND</span><h2>Inventory with <em>purpose.</em></h2><p>Food records saved to this browser for your organization. Incoming donations appear when linked to the NGO inventory workflow.</p></div><span className="ngo-count-chip">{inventory.length} recorded items</span></div>
              {inventory.length ? <div className="ngo-inventory-grid">{inventory.map((item, index) => <article className="ngo-panel ngo-inventory-card" key={item.id || index}><div className="inventory-card-top"><span className={`inventory-food-art food-art-${index % 4}`}>{["◒", "✳", "▥", "◉"][index % 4]}</span><span className={`ngo-status status-${getStatus(item.status)}`}>{item.status}</span></div><h3>{item.foodType}</h3><p>{item.source || item.donorName || item.restaurantName || "Source not recorded"}</p><div className="inventory-quantity"><strong>{item.quantity}</strong><span>available units</span></div><div className="inventory-bottom"><span>Expiry</span><b>{formatDate(item.expiry)}</b></div>{item.notes && <p className="inventory-notes">{item.notes}</p>}</article>)}</div> : <div className="ngo-panel ngo-empty-panel"><div className="ngo-empty-doodle">+</div><h3>Your inventory will grow here.</h3><p>No NGO inventory records were found under this organization's name. This page does not count requests as received food.</p><button className="ngo-button ngo-button-dark" type="button" onClick={() => setActiveTab("requests")}>Review food requests ↗</button></div>}
            </section>
          )}

          {activeTab === "restaurants" && (
            <section className="ngo-section ngo-section-enter">
              <div className="ngo-section-heading"><div><span className="ngo-section-kicker">PARTNER DIRECTORY</span><h2>Meet your food <em>partners.</em></h2><p>Restaurants loaded from the project's Flask restaurant dataset. Select one when creating a request.</p></div><span className="ngo-count-chip">{restaurants.length} directory records</span></div>
              {restaurantError && <p className="ngo-inline-error">{restaurantError}</p>}
              {restaurantsLoading ? <div className="ngo-panel ngo-empty-panel"><div className="ngo-spinner dark-spinner" /><h3>Loading restaurant partners…</h3></div> : restaurants.length ? <div className="ngo-restaurant-grid">{restaurants.map((restaurant, index) => { const name = restaurant.Restaurant || restaurant.restaurant || restaurant.name || "Restaurant"; const area = restaurant.Area || restaurant.area || "Area not listed"; const food = restaurant["Food type"] || restaurant.food_type || "Food type not listed"; return <article className={`ngo-restaurant-card restaurant-tone-${index % 4}`} key={`${name}-${index}`}><div className="restaurant-illustration"><span className="rest-plate"><i /><b /><em /></span><span className="rest-spark">✳</span></div><div className="restaurant-card-copy"><span className="ngo-mini-label">RESTAURANT PARTNER</span><h3>{name}</h3><p>{area}</p><span className="restaurant-food-tag">{food}</span><button className="ngo-text-link" type="button" onClick={() => { setRequestRestaurant(name); setActiveTab("requests"); setShowRequestForm(true); }}>Request food here <span>→</span></button></div></article>; })}</div> : <div className="ngo-panel ngo-empty-panel"><h3>No restaurant records loaded.</h3><p>Check that the Flask backend is running and the restaurant dataset is available.</p></div>}
            </section>
          )}

          {activeTab === "requests" && (
            <section className="ngo-section ngo-section-enter">
              <div className="ngo-section-heading"><div><span className="ngo-section-kicker">YOU CHOOSE WHAT TO ASK FOR</span><h2>Food requests, <em>made clear.</em></h2><p>Requests go to the selected restaurant. Its team decides whether to accept or decline.</p></div><button className="ngo-button ngo-button-coral" type="button" onClick={() => setShowRequestForm((value) => !value)}>{showRequestForm ? "Close form" : "+ Request food"}</button></div>
              {requestMessage && <p className="ngo-success-message">{requestMessage}</p>}
              {showRequestForm && <form className="ngo-panel ngo-request-form" onSubmit={submitRequest}><div className="ngo-panel-heading"><div><span className="ngo-mini-label">NEW FOOD REQUEST</span><h3>Tell the restaurant what your community needs.</h3></div><span className="ngo-form-number">02</span></div><div className="ngo-form-grid"><label>Requesting organization<input value={ngoName} onChange={(e) => updateNGOProfile("name", e.target.value)} required /></label><label>Food category<select value={requestFood} onChange={(e) => setRequestFood(e.target.value)}>{foodCategories.map((food) => <option key={food}>{food}</option>)}</select></label><label>Quantity needed (model units) *<input type="number" min="1" required value={requestQuantity} onChange={(e) => setRequestQuantity(e.target.value)} placeholder="Enter quantity" /></label><label>Requested date *<input type="date" min={todayISO()} required value={requestDate} onChange={(e) => setRequestDate(e.target.value)} /></label><label className="ngo-form-full">Choose restaurant *<select required value={requestRestaurant} onChange={(e) => setRequestRestaurant(e.target.value)}><option value="">Select from restaurant directory</option>{restaurants.map((restaurant, index) => { const name = restaurant.Restaurant || restaurant.restaurant || restaurant.name || ""; return <option key={`${name}-${index}`} value={name}>{name} — {restaurant.Area || restaurant.area || "Area not listed"}</option>; })}</select>{restaurantError && <small>{restaurantError}</small>}</label><label className="ngo-form-full">Notes / dietary requirements<textarea rows="3" value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} placeholder="Delivery timing, dietary needs, packing details..." /></label></div><div className="ngo-form-footer"><p>Submitting a request does not guarantee allocation. The restaurant reviews it first.</p><button className="ngo-button ngo-button-dark" type="submit">Submit food request ↗</button></div></form>}
              {requests.length ? <div className="ngo-request-list">{requests.map((request, index) => <article className="ngo-panel ngo-request-card" key={request.id || index}><div className="request-card-art">{["✳", "◒", "▦", "✦"][index % 4]}</div><div className="request-card-main"><div className="request-card-top"><span className="ngo-mini-label">REQUEST #{String(index + 1).padStart(3, "0")}</span><span className={`ngo-status status-${getStatus(request.status)}`}>{request.status}</span></div><h3>{request.foodType}</h3><p>For <b>{request.ngoName}</b> · Restaurant: {request.restaurantName || "Not selected"}</p><div className="request-meta"><span><small>Quantity</small><b>{request.requiredFood} units</b></span><span><small>Requested date</small><b>{formatDate(request.requestedDate)}</b></span><span><small>Submitted</small><b>{formatDate(request.createdAt)}</b></span></div>{request.notes && <p className="request-note">{request.notes}</p>}{request.rejectionReason && <p className="request-note">Restaurant response: {request.rejectionReason}</p>}</div></article>)}</div> : <div className="ngo-panel ngo-empty-panel"><div className="ngo-empty-doodle">↗</div><h3>No requests recorded yet.</h3><p>Use the request form to send a food request to a restaurant from the project directory.</p></div>}
            </section>
          )}

          {activeTab === "distribution" && (
            <section className="ngo-section ngo-section-enter">
              <div className="ngo-section-heading"><div><span className="ngo-section-kicker">FROM NGO TO COMMUNITY</span><h2>Make every meal <em>count.</em></h2><p>Record distributions that your organization completes, then create a separate volunteer task if delivery help is needed.</p></div><span className="ngo-count-chip">{distributionHistory.length} records</span></div>
              <form className="ngo-panel ngo-distribution-form" onSubmit={recordDistribution}><div className="ngo-panel-heading"><div><span className="ngo-mini-label">RECORD DISTRIBUTION</span><h3>Log food shared with beneficiaries</h3></div><span className="ngo-form-number">03</span></div><div className="ngo-form-grid"><label>Food category<select value={distributionFood} onChange={(e) => setDistributionFood(e.target.value)}>{foodCategories.map((food) => <option key={food}>{food}</option>)}</select></label><label>Quantity distributed *<input type="number" min="1" required value={distributionQuantity} onChange={(e) => setDistributionQuantity(e.target.value)} placeholder="Quantity distributed" /></label><label>Distribution date *<input type="date" required value={distributionDate} onChange={(e) => setDistributionDate(e.target.value)} /></label><label>Community location<input value={distributionLocation} onChange={(e) => setDistributionLocation(e.target.value)} placeholder="Area / community centre" /></label><label className="ngo-form-full">Notes<textarea rows="2" value={distributionNotes} onChange={(e) => setDistributionNotes(e.target.value)} placeholder="Beneficiary group, distribution notes..." /></label></div><div className="ngo-form-footer"><p>{inventory.length ? `Recorded available inventory: ${availableStock} units. Distribution quantities above this amount will be blocked.` : "No inventory records are linked yet; ensure the quantity is verified by your team before saving."}</p><button className="ngo-button ngo-button-dark" type="submit">Save distribution ↗</button></div>{distributionMessage && <p className="ngo-success-message">{distributionMessage}</p>}</form>
              {distributionHistory.length > 0 && <><div className="ngo-subheading"><h3>Completed distributions</h3><span>{distributionHistory.length} saved</span></div><div className="ngo-distribution-list">{distributionHistory.map((item, index) => <article className="ngo-panel ngo-distribution-card" key={item.id || index}><div className="distribution-check">✓</div><div className="distribution-main"><h3>{item.foodType}</h3><p>{item.location || ngoArea} · {formatDate(item.distributionDate || item.createdAt)}</p><span>{item.quantity} units distributed</span></div><button className="ngo-button ngo-button-outline" type="button" onClick={() => createDeliveryTask(item)}>Create delivery task ↗</button></article>)}</div></>}
            </section>
          )}

          {activeTab === "history" && (
            <section className="ngo-section ngo-section-enter">
              <div className="ngo-section-heading"><div><span className="ngo-section-kicker">YOUR ORGANIZATION'S RECORD</span><h2>A history of <em>help delivered.</em></h2><p>Requests and distribution records saved in the platform's current browser workflow.</p></div></div>
              <div className="ngo-history-summary"><div className="ngo-panel"><span>FOOD REQUESTS</span><strong>{requests.length}</strong><small>All recorded statuses</small></div><div className="ngo-panel"><span>DISTRIBUTIONS</span><strong>{distributionHistory.length}</strong><small>Saved completed records</small></div><div className="ngo-panel"><span>UNITS DISTRIBUTED</span><strong>{distributionHistory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0).toLocaleString()}</strong><small>Sum of recorded quantities</small></div></div>
              <div className="ngo-history-timeline">{[...requests.map((item) => ({ ...item, historyType: "Request", historyDate: item.createdAt || item.requestedDate, historyTitle: `${item.foodType} requested`, historyDetail: `${item.requiredFood} units · ${item.restaurantName || "Restaurant not selected"}` })), ...distributionHistory.map((item) => ({ ...item, historyType: "Distribution", historyDate: item.createdAt || item.distributionDate, historyTitle: `${item.foodType} distributed`, historyDetail: `${item.quantity} units · ${item.location || ngoArea}` }))].sort((a, b) => new Date(b.historyDate || 0) - new Date(a.historyDate || 0)).map((item, index) => <article className="history-row" key={`${item.historyType}-${item.id || index}`}><span className={`history-dot history-dot-${item.historyType.toLowerCase()}`} /><div><small>{item.historyType.toUpperCase()} · {formatDate(item.historyDate)}</small><h3>{item.historyTitle}</h3><p>{item.historyDetail}</p></div><span className={`ngo-status status-${getStatus(item.status || (item.historyType === "Distribution" ? "Completed" : "Pending"))}`}>{item.status || (item.historyType === "Distribution" ? "Completed" : "Pending")}</span></article>)}</div>
            </section>
          )}
        </div>

        <footer className="ngo-footer"><span>FoodConnect <b>AI</b></span><span>Forecast thoughtfully. Redistribute fairly. Strengthen communities.</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top ↑</button></footer>
      </main>
    </div>
  );
}

export default NGOHome;
