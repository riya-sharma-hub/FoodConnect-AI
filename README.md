# FoodConnect AI – AI-Enabled Community Food Donation and Redistribution Platform

## Project Overview

FoodConnect AI is a web-based platform designed to support community food donation and redistribution by connecting food donors, restaurants, NGOs, and volunteers. The project combines food donation and request management with AI-based demand forecasting to support better coordination and food requirement planning.

The platform aims to help organize surplus food information, connect available donations with identified requirements, and use data-driven forecasting to support redistribution planning.

## Objectives

- Identify challenges in existing food donation and redistribution practices.
- Develop a common platform for managing food donations and food requests.
- Provide role-based access for Donors, Restaurants, NGOs, and Volunteers.
- Organize and preprocess food-related data for analysis.
- Integrate a machine learning model to estimate food demand using prepared and simulated data.
- Support better coordination and planning of food redistribution.

## Key Features

- **Role-Based Access:** Separate access for Donors, Restaurants, NGOs, and Volunteers.
- **Food Donation Management:** Allows donors and restaurants to enter and submit surplus food details.
- **Food Request Management:** Enables NGOs to view available donations and request suitable food.
- **Donation Status Management:** Supports tracking of donation and request status within the platform.
- **Stakeholder Coordination:** Brings food donation and requirement information together in one platform.
- **Data Preprocessing:** Organizes and prepares food-related data in structured CSV files.
- **AI-Based Demand Forecasting:** Uses a Python-based machine learning model and prepared or simulated data to estimate food demand.

## Technologies Used

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, HTML5, CSS3 |
| Backend | Python, Flask |
| Data Processing | Pandas, CSV files |
| Machine Learning | Python-based machine learning model |
| Model Storage | Joblib |

## Project Structure

```text
AI-Food-Redistribution-Platform/
│
├── Frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
└── Backend/
    ├── app.py
    ├── food_demand_forecasting_model.joblib
    └── ...
```

*Note: The structure above highlights the main project components. Other files and folders may also be present.*

## Installation and Setup

### Prerequisites

Install the following software before running the project:

- Node.js and npm
- Python
- Git

### 1. Clone the Repository

Open Command Prompt and run:

```bash
git clone https://github.com/riya-sharma-hub/FoodConnect-AI.git
cd FoodConnect-AI
```

### 2. Run the Frontend

Open a terminal in the project directory and execute:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser. It is commonly `http://localhost:5173/`.

### 3. Run the Backend

Open a second terminal from the main project directory and execute:

```bash
cd Backend
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install the backend dependencies listed in the project's `requirements.txt`, if available:

```bash
pip install -r requirements.txt
```

If the project does not contain a `requirements.txt`, install the required packages according to the imports used in `app.py` and the forecasting model.

Start the Flask backend:

```bash
python app.py
```

Use the backend address printed in the terminal. Ensure that the frontend is configured to communicate with the correct backend address.

## System Workflow

1. Users access the FoodConnect AI website.
2. Users log in or register and access functions according to their selected role.
3. Donors and restaurants submit surplus food information.
4. NGOs view available donations and submit food requests.
5. Donation and request information is managed by the platform.
6. Prepared food-related data is used by the demand forecasting component.
7. Forecasting results provide information to support food requirement and redistribution planning.

## Data and Demand Forecasting

The project uses structured food-related data prepared for analysis and development. Prepared and simulated data supports the forecasting component where required. A Python-based machine learning model estimates food demand, and its output can help inform redistribution planning.

Forecasting performance depends on the quality, coverage, and relevance of the data provided to the model.

## Community Engagement

The project requirements were informed by field visits and stakeholder interactions involving the Dabbawalas of Mumbai and Khana Chahiye Foundation, along with a survey of restaurants and potential food donors. These activities helped the team understand food donation practices and coordination challenges.

## Sustainable Development Goals

- **SDG 2 – Zero Hunger:** Supports efforts to connect available food with organizations and communities that require it.
- **SDG 12 – Responsible Consumption and Production:** Encourages better use of surplus food through organized donation and redistribution.

## Future Scope

- Improve demand forecasting using larger and more representative datasets.
- Extend coordination and redistribution capabilities.
- Introduce additional reporting and analytics features.
- Explore location-based matching and delivery tracking.
- Evaluate the platform with more stakeholders and real-world operational data.

## Project Repository

GitHub: https://github.com/riya-sharma-hub/FoodConnect-AI

## Conclusion

FoodConnect AI combines a web-based food donation and request management platform with AI-based demand forecasting. By organizing food-related information and supporting coordination among different stakeholders, the project aims to contribute to more structured food redistribution and responsible use of surplus food.
