import { useEffect, useState } from "react";
import "./AddDonation.css";

const FOOD_CATEGORIES = {
  Breakfast: [
    "Poha",
    "Upma",
    "Idli",
    "Dosa",
    "Paratha",
    "Other breakfast food",
  ],
  "Rice & Meals": [
    "Steamed Rice",
    "Vegetable Pulao",
    "Biryani",
    "Khichdi",
    "Cooked Meals",
    "Other rice dish",
  ],
  Breads: [
    "Roti / Chapati",
    "Paratha",
    "Bread Loaf",
    "Bread Slices",
    "Pav",
    "Other bread",
  ],
  "Dal & Curries": [
    "Dal",
    "Vegetable Curry",
    "Paneer Curry",
    "Chole",
    "Rajma",
    "Other curry",
  ],
  "Sweets & Desserts": [
    "Kheer",
    "Halwa",
    "Gulab Jamun",
    "Ladoo",
    "Barfi",
    "Other sweet",
  ],
  Snacks: [
    "Samosa",
    "Vada Pav",
    "Sandwich",
    "Biscuits",
    "Other snack",
  ],
  "Fruits & Vegetables": [
    "Fresh Fruits",
    "Fresh Vegetables",
    "Cut Fruits",
    "Other produce",
  ],
  "Packaged Food": [
    "Packaged Meals",
    "Packaged Snacks",
    "Canned Food",
    "Other packaged food",
  ],
  Other: ["Other food item"],
};

const FOOD_UNITS = {
  Poha: ["kg", "servings"],
  Upma: ["kg", "servings"],
  Idli: ["pieces", "servings"],
  Dosa: ["pieces", "servings"],
  Paratha: ["pieces", "servings"],
  "Other breakfast food": ["kg", "servings", "packets"],

  "Steamed Rice": ["kg", "servings"],
  "Vegetable Pulao": ["kg", "servings"],
  Biryani: ["kg", "servings"],
  Khichdi: ["kg", "servings"],
  "Cooked Meals": ["servings", "packets"],
  "Other rice dish": ["kg", "servings", "packets"],

  "Roti / Chapati": ["pieces", "packets"],
  "Bread Loaf": ["loaves"],
  "Bread Slices": ["slices", "packets"],
  Pav: ["pieces", "packets"],
  "Other bread": ["pieces", "packets", "loaves"],

  Dal: ["litres", "kg", "servings"],
  "Vegetable Curry": ["litres", "kg", "servings"],
  "Paneer Curry": ["litres", "kg", "servings"],
  Chole: ["litres", "kg", "servings"],
  Rajma: ["litres", "kg", "servings"],
  "Other curry": ["litres", "kg", "servings"],

  Kheer: ["litres", "kg", "servings"],
  Halwa: ["kg", "servings", "packets"],
  "Gulab Jamun": ["pieces", "packets", "kg"],
  Ladoo: ["pieces", "packets", "kg"],
  Barfi: ["pieces", "packets", "kg"],
  "Other sweet": ["pieces", "packets", "kg"],

  Samosa: ["pieces", "packets"],
  "Vada Pav": ["pieces"],
  Sandwich: ["pieces", "packets"],
  Biscuits: ["packets", "boxes"],
  "Other snack": ["pieces", "packets", "servings"],

  "Fresh Fruits": ["kg", "pieces", "packets"],
  "Fresh Vegetables": ["kg"],
  "Cut Fruits": ["kg", "packets", "servings"],
  "Other produce": ["kg", "pieces", "packets"],

  "Packaged Meals": ["packets", "servings"],
  "Packaged Snacks": ["packets", "boxes"],
  "Canned Food": ["cans", "packets"],
  "Other packaged food": ["packets", "boxes", "pieces"],

  "Other food item": [
    "kg",
    "litres",
    "pieces",
    "servings",
    "packets",
  ],
};

const STORAGE_OPTIONS = [
  "Room temperature",
  "Refrigerated",
  "Frozen",
  "Keep in a cool, dry place",
  "Other",
];

function AddDonation({ onBack }) {
  const [foodCategory, setFoodCategory] = useState("Breakfast");
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");
  const [location, setLocation] = useState("");
  const [preparationDateTime, setPreparationDateTime] = useState("");
  const [expiryTime, setExpiryTime] = useState("");
  const [storageCondition, setStorageCondition] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [restaurantArea, setRestaurantArea] = useState("");
  const [restaurantSuggestions, setRestaurantSuggestions] = useState([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantError, setRestaurantError] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchMode, setSearchMode] = useState("");

  const availableFoodItems =
    FOOD_CATEGORIES[foodCategory] || [];

  const availableUnits = FOOD_UNITS[foodType] || [
    "kg",
    "litres",
    "pieces",
    "servings",
    "packets",
  ];

  useEffect(() => {
    try {
      const savedRestaurant = localStorage.getItem(
        "foodconnect_selected_restaurant"
      );

      if (savedRestaurant) {
        setSelectedRestaurant(
          JSON.parse(savedRestaurant)
        );
      }
    } catch {
      localStorage.removeItem(
        "foodconnect_selected_restaurant"
      );
    }
  }, []);

  useEffect(() => {
    const searchValue =
      searchMode === "restaurant"
        ? restaurantSearch.trim()
        : searchMode === "area"
        ? restaurantArea.trim()
        : "";

    if (!searchValue || searchValue.length < 2) {
      setRestaurantSuggestions([]);
      setRestaurantLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setRestaurantLoading(true);
      setRestaurantError("");

      try {
        const params = new URLSearchParams();

        if (searchMode === "restaurant") {
          params.append("search", searchValue);
        } else {
          params.append("area", searchValue);
        }

        const response = await fetch(
          `http://127.0.0.1:5000/restaurants?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load restaurants."
          );
        }

        const data = await response.json();

        setRestaurantSuggestions(
          Array.isArray(data.restaurants)
            ? data.restaurants.slice(0, 8)
            : []
        );
      } catch (searchError) {
        if (searchError.name !== "AbortError") {
          console.error(searchError);

          setRestaurantError(
            "Unable to load restaurant suggestions."
          );

          setRestaurantSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setRestaurantLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    restaurantSearch,
    restaurantArea,
    searchMode,
  ]);

  const handleFoodCategoryChange = (event) => {
    setFoodCategory(event.target.value);
    setFoodType("");
    setQuantityUnit("");
    setError("");
  };

  const handleFoodTypeChange = (event) => {
    const selectedItem = event.target.value;

    const units = FOOD_UNITS[selectedItem] || [
      "kg",
    ];

    setFoodType(selectedItem);
    setQuantityUnit(units[0]);
    setError("");
  };

  const handleRestaurantNameChange = (event) => {
    const value = event.target.value;

    setRestaurantSearch(value);
    setRestaurantError("");

    if (value.trim()) {
      setSearchMode("restaurant");
      setRestaurantArea("");
      setSelectedRestaurant(null);

      localStorage.removeItem(
        "foodconnect_selected_restaurant"
      );
    } else {
      setSearchMode("");
      setRestaurantSuggestions([]);
    }
  };

  const handleRestaurantAreaChange = (event) => {
    const value = event.target.value;

    setRestaurantArea(value);
    setRestaurantError("");

    if (value.trim()) {
      setSearchMode("area");
      setRestaurantSearch("");
      setSelectedRestaurant(null);

      localStorage.removeItem(
        "foodconnect_selected_restaurant"
      );
    } else {
      setSearchMode("");
      setRestaurantSuggestions([]);
    }
  };

  const selectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setRestaurantSuggestions([]);
    setRestaurantError("");

    localStorage.setItem(
      "foodconnect_selected_restaurant",
      JSON.stringify(restaurant)
    );

    if (searchMode === "restaurant") {
      setRestaurantSearch(
        restaurant.Restaurant || ""
      );
    } else {
      setRestaurantArea(restaurant.Area || "");
    }
  };

  const clearSelectedRestaurant = () => {
    setSelectedRestaurant(null);
    setRestaurantSearch("");
    setRestaurantArea("");
    setRestaurantSuggestions([]);
    setSearchMode("");

    localStorage.removeItem(
      "foodconnect_selected_restaurant"
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !foodCategory ||
      !foodType ||
      !quantity ||
      Number(quantity) <= 0 ||
      !quantityUnit ||
      !location.trim() ||
      !preparationDateTime ||
      !expiryTime ||
      !storageCondition
    ) {
      setError(
        "Please complete all required food details and enter a valid quantity."
      );
      return;
    }

    if (
      new Date(expiryTime) <=
      new Date(preparationDateTime)
    ) {
      setError(
        "The best-before time must be later than the preparation time."
      );
      return;
    }

    if (
      new Date(preparationDateTime) >
      new Date()
    ) {
      setError(
        "The preparation date and time cannot be in the future."
      );
      return;
    }

    if (!selectedRestaurant) {
      setError(
        "Please choose one restaurant drop point before adding your donation."
      );
      return;
    }

    const newDonation = {
      id: Date.now(),
      foodCategory,
      foodType,
      quantity,
      quantityUnit,
      location: location.trim(),
      preparationDateTime,
      expiryTime,
      storageCondition,
      description: description.trim(),
      status: "Available",
      createdAt: new Date().toISOString(),

      dropPoint:
        selectedRestaurant.Restaurant || "",

      dropPointId:
        selectedRestaurant.ID || "",

      dropPointArea:
        selectedRestaurant.Area || "",

      dropPointAddress:
        selectedRestaurant.Address || "",

      dropPointMapsLink:
        selectedRestaurant.Google_Maps_Link || "",
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/donations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newDonation),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save the donation."
        );
      }

      const storedDonations = JSON.parse(
        localStorage.getItem(
          "foodconnect_donations"
        ) || "[]"
      );

      const existingDonations =
        Array.isArray(storedDonations)
          ? storedDonations
          : [];

      localStorage.setItem(
        "foodconnect_donations",
        JSON.stringify([
          ...existingDonations,
          newDonation,
        ])
      );

      localStorage.removeItem(
        "foodconnect_selected_restaurant"
      );

      if (typeof onBack === "function") {
        onBack();
      }
    } catch (submissionError) {
      console.error(
        "Donation submission error:",
        submissionError
      );

      setError(
        submissionError.message ||
          "Unable to save the donation. Please make sure the backend is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-donation-page">
      <header className="add-donation-header">
        <div className="add-donation-brand">
          <div className="add-donation-mark">
            FC
          </div>

          <div className="add-donation-brand-text">
            <h2>
              FoodConnect <span>AI</span>
            </h2>

            <p>
              Food Redistribution Platform
            </p>
          </div>
        </div>

        <button
          type="button"
          className="add-donation-back"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="add-donation-content">
        <section className="add-donation-intro">
          <div>
            <span className="add-donation-label">
              FOOD DONATION
            </span>

            <h1>
              Add a food donation.
            </h1>

            <p>
              Enter your surplus food details and
              select one restaurant drop point for
              redistribution.
            </p>
          </div>

          <div className="donation-intro-mark">
            FC
          </div>
        </section>

        <section className="add-donation-card">
          <div className="form-card-heading">
            <div>
              <span>
                DONATION DETAILS
              </span>

              <h2>
                Tell us about the food
              </h2>
            </div>

            <p>
              Fields marked with * are required.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="foodCategory">
                  Food Category <span>*</span>
                </label>

                <select
                  id="foodCategory"
                  value={foodCategory}
                  onChange={
                    handleFoodCategoryChange
                  }
                  required
                >
                  {Object.keys(
                    FOOD_CATEGORIES
                  ).map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="foodType">
                  Food Item <span>*</span>
                </label>

                <select
                  id="foodType"
                  value={foodType}
                  onChange={handleFoodTypeChange}
                  required
                >
                  <option value="">
                    Select a food item
                  </option>

                  {availableFoodItems.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">
                  Quantity <span>*</span>
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="any"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantityUnit">
                  Quantity Unit <span>*</span>
                </label>

                <select
                  id="quantityUnit"
                  value={quantityUnit}
                  onChange={(event) =>
                    setQuantityUnit(
                      event.target.value
                    )
                  }
                  required
                  disabled={!foodType}
                >
                  <option value="">
                    Select unit
                  </option>

                  {availableUnits.map(
                    (unit) => (
                      <option
                        key={unit}
                        value={unit}
                      >
                        {unit}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">
                  Food Location / Area{" "}
                  <span>*</span>
                </label>

                <input
                  id="location"
                  type="text"
                  placeholder="e.g. Andheri, Mumbai"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="storageCondition">
                  Storage Conditions{" "}
                  <span>*</span>
                </label>

                <select
                  id="storageCondition"
                  value={storageCondition}
                  onChange={(event) =>
                    setStorageCondition(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select storage condition
                  </option>

                  {STORAGE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preparationDateTime">
                  Prepared On <span>*</span>
                </label>

                <input
                  id="preparationDateTime"
                  type="datetime-local"
                  value={preparationDateTime}
                  onChange={(event) =>
                    setPreparationDateTime(
                      event.target.value
                    )
                  }
                  max={new Date()
                    .toISOString()
                    .slice(0, 16)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expiryTime">
                  Best Before / Expiry{" "}
                  <span>*</span>
                </label>

                <input
                  id="expiryTime"
                  type="datetime-local"
                  value={expiryTime}
                  onChange={(event) =>
                    setExpiryTime(
                      event.target.value
                    )
                  }
                  min={
                    preparationDateTime ||
                    undefined
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group form-description">
              <label htmlFor="description">
                Additional Details
              </label>

              <textarea
                id="description"
                rows="4"
                placeholder="Add any useful information about the food, packaging, or collection arrangements."
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
              />
            </div>

            <section className="donation-restaurant-section">
              <div className="donation-restaurant-heading">
                <span className="add-donation-label">
                  DONATION DROP POINT
                </span>

                <h2>
                  Choose your restaurant
                </h2>

                <p>
                  Choose <strong>one</strong>{" "}
                  search option: restaurant name
                  or area. Do not fill in both.
                </p>
              </div>

              <div className="donation-search-note">
                Search by restaurant name or
                area. Matching restaurants will
                appear below.
              </div>

              <div className="donation-restaurant-search">
                <div className="donation-search-field">
                  <label htmlFor="restaurantSearch">
                    Restaurant Name
                  </label>

                  <input
                    id="restaurantSearch"
                    type="text"
                    placeholder="Search restaurant name"
                    value={restaurantSearch}
                    disabled={
                      searchMode === "area"
                    }
                    onChange={
                      handleRestaurantNameChange
                    }
                    autoComplete="off"
                  />
                </div>

                <div className="donation-search-or">
                  OR
                </div>

                <div className="donation-search-field">
                  <label htmlFor="restaurantArea">
                    Area
                  </label>

                  <input
                    id="restaurantArea"
                    type="text"
                    placeholder="e.g. Andheri"
                    value={restaurantArea}
                    disabled={
                      searchMode === "restaurant"
                    }
                    onChange={
                      handleRestaurantAreaChange
                    }
                    autoComplete="off"
                  />
                </div>
              </div>

              {(restaurantLoading ||
                restaurantSuggestions.length >
                  0 ||
                restaurantError ||
                ((restaurantSearch.trim()
                  .length >= 2 ||
                  restaurantArea.trim()
                    .length >= 2) &&
                  !restaurantLoading &&
                  !restaurantError)) && (
                <div className="donation-restaurant-suggestions">
                  {restaurantLoading && (
                    <div className="donation-suggestion-loading">
                      Searching restaurants...
                    </div>
                  )}

                  {restaurantError && (
                    <div className="donation-suggestion-error">
                      {restaurantError}
                    </div>
                  )}

                  {!restaurantLoading &&
                    !restaurantError &&
                    restaurantSuggestions.length ===
                      0 && (
                      <div className="donation-suggestion-empty">
                        No matching restaurants
                        found.
                      </div>
                    )}

                  {restaurantSuggestions.map(
                    (restaurant) => (
                      <button
                        type="button"
                        className="donation-restaurant-option"
                        key={`${restaurant.ID}-${restaurant.Restaurant}`}
                        onClick={() =>
                          selectRestaurant(
                            restaurant
                          )
                        }
                      >
                        <div>
                          <strong>
                            {
                              restaurant.Restaurant
                            }
                          </strong>

                          <span>
                            {restaurant.Area}
                            {" · "}
                            {
                              restaurant[
                                "Food type"
                              ]
                            }
                          </span>

                          <small>
                            {restaurant.Address}
                          </small>
                        </div>

                        <span className="donation-option-arrow">
                          →
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}

              {selectedRestaurant && (
                <div className="selected-donation-drop-point">
                  <div>
                    <span>
                      SELECTED DROP POINT
                    </span>

                    <h2>
                      {
                        selectedRestaurant.Restaurant
                      }
                    </h2>

                    <p>
                      {selectedRestaurant.Area}
                      {" · "}
                      {
                        selectedRestaurant.Address
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    className="donation-change-restaurant"
                    onClick={
                      clearSelectedRestaurant
                    }
                  >
                    Change
                  </button>
                </div>
              )}
            </section>

            {error && (
              <div
                className="add-donation-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="cancel-donation-button"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="submit-donation-button"
                disabled={
                  isSubmitting ||
                  !selectedRestaurant
                }
              >
                {isSubmitting
                  ? "Saving Donation..."
                  : "Add Food Donation"}

                {!isSubmitting && (
                  <span>→</span>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="donation-process">
          <div className="process-item">
            <span>01</span>

            <div>
              <strong>Add</strong>
              <p>
                Enter your food details
              </p>
            </div>
          </div>

          <div className="process-line" />

          <div className="process-item">
            <span>02</span>

            <div>
              <strong>Select</strong>
              <p>
                Choose one restaurant drop
                point
              </p>
            </div>
          </div>

          <div className="process-line" />

          <div className="process-item">
            <span>03</span>

            <div>
              <strong>Redistribute</strong>
              <p>
                Help food reach communities
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AddDonation;