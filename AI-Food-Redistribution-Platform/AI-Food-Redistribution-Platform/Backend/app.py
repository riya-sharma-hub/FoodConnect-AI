from flask import Flask, jsonify, request
import joblib
import pandas as pd
import os
import json
from datetime import datetime

app = Flask(__name__)

# =========================================================
# CORS HANDLING
# =========================================================


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "")

    # Allow the local Vite development server.
    if origin.startswith(("http://localhost:", "http://127.0.0.1:")):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"

    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = (
        "GET, POST, DELETE, OPTIONS"
    )

    return response



# =========================================================
# FILE PATHS
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "food_demand_forecasting_model.joblib",
)

RESTAURANT_DATASET_PATH = os.path.join(
    BASE_DIR,
    "FoodConnect_Mumbai_Restaurants.csv",
)

DONATIONS_FILE_PATH = os.path.join(
    BASE_DIR,
    "donations.json",
)


# =========================================================
# LOAD AI DEMAND FORECASTING MODEL
# =========================================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Demand forecasting model was not found: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)


# =========================================================
# LOAD MUMBAI RESTAURANT DATASET
# =========================================================

if not os.path.exists(RESTAURANT_DATASET_PATH):
    raise FileNotFoundError(
        f"Restaurant dataset was not found: {RESTAURANT_DATASET_PATH}"
    )

restaurants_df = pd.read_csv(RESTAURANT_DATASET_PATH)
restaurants_df.columns = restaurants_df.columns.str.strip()

# Normalize common column-name variations without changing
# the dataset's original column names where not necessary.
restaurant_column_aliases = {
    "Restaurant": ["Restaurant", "Restaurant Name", "Name", "restaurant"],
    "Area": ["Area", "Locality", "Neighbourhood", "Neighborhood", "area"],
    "Address": ["Address", "Full Address", "Location", "address"],
    "Food type": ["Food type", "Food Type", "Cuisine", "food_type"],
    "ID": ["ID", "Id", "Restaurant ID", "Restaurant_ID"],
    "Google_Maps_Link": [
        "Google_Maps_Link",
        "Google Maps Link",
        "Google Maps URL",
        "Maps Link",
    ],
}

for standard_name, candidates in restaurant_column_aliases.items():
    if standard_name not in restaurants_df.columns:
        for candidate in candidates:
            if candidate in restaurants_df.columns:
                restaurants_df[standard_name] = restaurants_df[candidate]
                break

# These fields are used by the frontend restaurant suggestions.
for required_column in ["Restaurant", "Area", "Address"]:
    if required_column not in restaurants_df.columns:
        restaurants_df[required_column] = ""

# Avoid NaN values becoming JSON NaN in API responses.
restaurants_df = restaurants_df.fillna("")


# =========================================================
# DONATION DATABASE HELPERS
# =========================================================

def load_donations():
    """Load saved donations from donations.json."""
    if not os.path.exists(DONATIONS_FILE_PATH):
        return []

    try:
        with open(DONATIONS_FILE_PATH, "r", encoding="utf-8") as file:
            data = json.load(file)

        return data if isinstance(data, list) else []

    except (json.JSONDecodeError, OSError):
        app.logger.exception("Could not read the donations file.")
        return []


def save_donations(donations):
    """Save the complete donations list to donations.json."""
    with open(DONATIONS_FILE_PATH, "w", encoding="utf-8") as file:
        json.dump(
            donations,
            file,
            indent=2,
            ensure_ascii=False,
        )


def json_safe_records(dataframe):
    """Convert dataframe records into JSON-safe dictionaries."""
    safe_df = dataframe.copy().fillna("")
    return safe_df.to_dict(orient="records")


# =========================================================
# HOME / HEALTH CHECK
# =========================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "FoodConnect AI Backend is running!",
    })


# =========================================================
# AI DEMAND FORECASTING
# =========================================================

@app.route("/predict-demand", methods=["POST", "OPTIONS"])
def predict_demand():
    if request.method == "OPTIONS":
        return ("", 204)

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Please send valid JSON prediction data.",
        }), 400

    required_fields = [
        "area",
        "food_type",
        "day_of_week",
        "is_weekend",
        "month",
        "beneficiaries",
        "previous_demand",
        "donations_received",
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data or data[field] in (None, "")
    ]

    if missing_fields:
        return jsonify({
            "success": False,
            "message": "Missing required prediction fields.",
            "missing_fields": missing_fields,
        }), 400

    try:
        input_data = pd.DataFrame([{
            "area": data["area"],
            "food_type": data["food_type"],
            "day_of_week": data["day_of_week"],
            "is_weekend": data["is_weekend"],
            "month": data["month"],
            "beneficiaries": data["beneficiaries"],
            "previous_demand": data["previous_demand"],
            "donations_received": data["donations_received"],
        }])

        prediction = model.predict(input_data)
        predicted_demand = round(float(prediction[0]))

        return jsonify({
            "success": True,
            "predicted_demand": predicted_demand,
        })

    except (KeyError, TypeError, ValueError) as error:
        return jsonify({
            "success": False,
            "message": f"Invalid prediction input: {str(error)}",
        }), 400

    except Exception:
        app.logger.exception("Demand prediction failed.")
        return jsonify({
            "success": False,
            "message": "Demand prediction failed. Check the model input fields.",
        }), 500


# =========================================================
# RESTAURANT SEARCH / AUTOCOMPLETE API
# =========================================================

@app.route("/restaurants", methods=["GET", "OPTIONS"])
def get_restaurants():
    if request.method == "OPTIONS":
        return ("", 204)

    df = restaurants_df.copy()

    area = request.args.get("area", "").strip()
    search = request.args.get("search", "").strip()
    food_type = request.args.get("food_type", "").strip()

    if area:
        df = df[
            df["Area"].astype(str).str.contains(
                area,
                case=False,
                na=False,
                regex=False,
            )
        ]

    if search:
        df = df[
            df["Restaurant"].astype(str).str.contains(
                search,
                case=False,
                na=False,
                regex=False,
            )
        ]

    if food_type and "Food type" in df.columns:
        df = df[
            df["Food type"].astype(str).str.contains(
                food_type,
                case=False,
                na=False,
                regex=False,
            )
        ]

    # Keep autocomplete responses quick and predictable.
    try:
        limit = int(request.args.get("limit", "50"))
    except ValueError:
        limit = 50

    limit = max(1, min(limit, 200))
    df = df.head(limit)

    restaurants = json_safe_records(df)

    return jsonify({
        "success": True,
        "count": len(restaurants),
        "restaurants": restaurants,
    })


# =========================================================
# GET DONATIONS
# =========================================================

@app.route("/donations", methods=["GET", "OPTIONS"])
def get_donations():
    if request.method == "OPTIONS":
        return ("", 204)

    donations = load_donations()
    restaurant = request.args.get("restaurant", "").strip()

    if restaurant:
        target = restaurant.casefold()
        donations = [
            donation
            for donation in donations
            if str(donation.get("dropPoint", "")).strip().casefold() == target
        ]

    return jsonify({
        "success": True,
        "count": len(donations),
        "donations": donations,
    })


# =========================================================
# ADD DONATION
# =========================================================

@app.route("/donations", methods=["POST", "OPTIONS"])
@app.route("/api/donations", methods=["POST", "OPTIONS"])
def add_donation():
    if request.method == "OPTIONS":
        return ("", 204)

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "No valid donation data received.",
        }), 400

    # Required fields used by the existing Add Donation form.
    required_fields = [
        "foodType",
        "quantity",
        "location",
        "expiryTime",
        "description",
        "dropPoint",
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data or data[field] is None
    ]

    if missing_fields:
        return jsonify({
            "success": False,
            "message": "Missing required fields.",
            "missing_fields": missing_fields,
        }), 400

    try:
        quantity = float(data.get("quantity"))
        if quantity <= 0:
            return jsonify({
                "success": False,
                "message": "Quantity must be greater than zero.",
            }), 400
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Quantity must be a valid number.",
        }), 400

    donations = load_donations()

    # Keep the existing frontend fields and preserve additional form
    # fields (for example category, quantity unit, preparation date/time,
    # storage condition) so they are not discarded by the backend.
    new_donation = dict(data)

    new_donation.update({
        "id": data.get("id") or int(datetime.now().timestamp() * 1000),
        "foodType": str(data.get("foodType", "")).strip(),
        "quantity": data.get("quantity"),
        "location": str(data.get("location", "")).strip(),
        "expiryTime": data.get("expiryTime", ""),
        "description": str(data.get("description", "")).strip(),
        "status": data.get("status", "Available"),
        "createdAt": datetime.now().isoformat(),
        "dropPoint": str(data.get("dropPoint", "")).strip(),
        "dropPointId": data.get("dropPointId", ""),
        "dropPointArea": data.get("dropPointArea", ""),
        "dropPointAddress": data.get("dropPointAddress", ""),
        "dropPointMapsLink": data.get("dropPointMapsLink", ""),
    })

    try:
        donations.append(new_donation)
        save_donations(donations)
    except OSError:
        app.logger.exception("Could not save the donation.")
        return jsonify({
            "success": False,
            "message": "The donation could not be saved to the backend.",
        }), 500

    return jsonify({
        "success": True,
        "message": "Donation added successfully.",
        "donation": new_donation,
    }), 201


# =========================================================
# DELETE DONATION
# =========================================================

@app.route("/donations/<int:donation_id>", methods=["DELETE", "OPTIONS"])
def delete_donation(donation_id):
    if request.method == "OPTIONS":
        return ("", 204)

    donations = load_donations()

    updated_donations = [
        donation for donation in donations
        if str(donation.get("id", "")) != str(donation_id)
    ]

    if len(updated_donations) == len(donations):
        return jsonify({
            "success": False,
            "message": "Donation not found.",
        }), 404

    try:
        save_donations(updated_donations)
    except OSError:
        app.logger.exception("Could not update the donations file.")
        return jsonify({
            "success": False,
            "message": "The donation could not be deleted.",
        }), 500

    return jsonify({
        "success": True,
        "message": "Donation deleted successfully.",
    })


# =========================================================
# RUN FLASK SERVER
# =========================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
