# BANKORA — Bank Marketing Intelligence Platform

> **Intelligent Banking. Smarter Decisions.**  
> An end-to-end bank marketing analytics and machine-learning dashboard for exploring campaign data, understanding customers, and estimating term-deposit subscription propensity.

---

## Project Overview

**BANKORA** is a full-stack analytics application built around the UCI Bank Marketing dataset. It helps banking and marketing teams explore customer and campaign data, compare machine-learning models, and estimate whether a customer may subscribe to a term deposit.

The project combines an interactive dashboard, user authentication, dataset management, customer-level predictions, prediction history, model evaluation, and downloadable reports in one workspace.

This repository contains the application source code, sample dataset, backend implementation, and supporting machine-learning files. The interface and project structure are maintained as a standalone code project; Google AI Studio is the development environment/reference workflow, not a runtime dependency required by the local application.

## Main Features

### Analytics dashboard
- Overview of key dataset and campaign indicators.
- Customer subscription and non-subscription summaries.
- Charts and visual analytics for campaign performance.
- Customer insights with demographic and financial filters.

### Dataset explorer
- Preview and search customer records.
- Filter and sort the dataset.
- Upload a CSV dataset.
- Clean the active dataset, restore the bundled default dataset, or clear the active dataset.
- View dataset metadata, missing values, unique values, and numerical summaries.

### Customer prediction
- Enter customer and campaign attributes to estimate term-deposit subscription propensity.
- View the predicted class, probability, confidence tier, model information, and recommended next action.
- Save prediction results to persistent history.

### Machine-learning evaluation
- Train and compare five classification approaches:
  - Gradient Boosting
  - Random Forest
  - Logistic Regression
  - Decision Tree
  - K-Nearest Neighbors (KNN)
- Review evaluation measures such as accuracy, precision, recall, F1-score, ROC-AUC, and confusion matrix where available.
- Inspect the distinction between pre-call and post-call prediction modes.

### User account and workspace
- User registration and login.
- Password hashing and token-based session handling.
- Forgot-password and reset-password flows.
- Profile and workspace settings.
- Light/dark theme support.
- Protected dashboard pages.

### Reports and history
- Browse, search, filter, and sort previous predictions.
- Delete individual prediction records or clear prediction history.
- Generate downloadable PDF reports from the reporting interface.

## Application Pages

| Page | Purpose |
|---|---|
| Overview | Main KPIs and marketing intelligence summary |
| Data Explorer | Dataset preview, filtering, upload, cleaning, and reset |
| Customer Insights | Explore customer segments and attributes |
| Campaign Analytics | Analyze campaign outcomes and contact patterns |
| Predict Customer | Submit an individual customer prediction |
| Model Performance | Compare and retrain machine-learning models |
| Prediction History | Review and manage saved predictions |
| Reports | Generate and export analytical reports |
| Profile | View and update account details |
| Settings | Manage workspace preferences and dataset actions |
| About Project | View project information and methodology |

Authentication screens include Login, Register, Forgot Password, and Reset Password.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| UI and animation | Motion (`motion/react`), Lucide React |
| Charts | Recharts |
| PDF reports | jsPDF, jsPDF-AutoTable |
| Main application server | Node.js, Express, TypeScript (`tsx`) |
| Database | SQLite via `better-sqlite3` |
| Authentication | bcryptjs, JSON Web Tokens, cookie-parser |
| Python ML/API support | Python, FastAPI, SQLAlchemy, Pydantic |
| Machine learning | scikit-learn, pandas, NumPy, joblib |
| AI SDK dependency | `@google/genai` |

## Repository Structure

```text
bank-marketing-intelligence/
├── backend/
│   ├── app/
│   │   ├── database/       # Python database setup
│   │   ├── schemas/        # Pydantic schemas
│   │   └── main.py         # FastAPI application
│   ├── ml/
│   │   ├── train.py        # Model training utilities
│   │   ├── predict.py      # Prediction utilities
│   │   └── evaluate.py     # Model evaluation utilities
│   ├── saved_models/       # Saved model/evaluation artifacts
│   ├── requirements.txt    # Python dependencies
│   ├── run.py              # Python API runner
│   └── bankora.db          # SQLite database file (if included)
├── dataset/
│   └── bank-marketing.csv  # Bundled sample dataset
├── public/
│   └── assets/             # Public assets
├── scripts/
│   └── test_audit.ts       # API/audit test script
├── src/
│   ├── components/         # Reusable UI components
│   ├── context/            # Authentication context
│   ├── layouts/            # Dashboard layout
│   ├── pages/              # Dashboard and authentication pages
│   ├── server/             # TypeScript ML engine and dataset helpers
│   ├── services/           # Frontend API client
│   ├── types/              # Shared TypeScript types
│   ├── App.tsx             # Main application and page routing
│   ├── index.css           # Global styles
│   └── main.tsx            # Frontend entry point
├── .env.example            # Environment variable template
├── index.html
├── package.json
├── server.ts               # Main Express + SQLite application server
├── tsconfig.json
└── vite.config.ts
```

> The repository includes both a TypeScript/Express application server (`server.ts`) and a Python/FastAPI backend (`backend/app/main.py`). The default `npm run dev` command starts the TypeScript/Express server. The Python backend is a separate entry point and is not started by that command.

## Requirements

Install the following before running the project:

- Node.js (a current LTS release is recommended)
- npm
- Python 3.10 or later, only if you intend to run the optional Python backend/ML scripts
- Git, if you want to clone or version-control the project

## Run the Application Locally

### 1. Open the project folder

Open the `bank-marketing-intelligence` folder in VS Code. In the VS Code terminal, make sure the current directory is the folder containing the root `package.json`.

### 2. Install Node dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file in the project root if your setup requires environment variables. Use `.env.example` as a reference.

**Important security note:** The supplied `.env.example` in this project archive contains values that look like authentication secrets. Do not publish or reuse those values. Replace them with newly generated, private secrets and keep `.env` out of Git. Never paste API keys, JWT secrets, passwords, or production credentials into this README or commit them to GitHub.

Example local configuration (replace every placeholder with a newly generated value):

```env
PORT=3000
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
GOOGLE_API_KEY=your_google_api_key_if_needed
APP_URL=http://localhost:3000
```

The application may use defaults for some variables during local development, but production deployments must use strong, unique secrets supplied through the hosting platform's secret manager.

### 4. Start the development server

```bash
npm run dev
```

The root `package.json` defines this command as `tsx server.ts`. The Express server defaults to port **3000**.

Open the local address:

```text
http://localhost:3000
```

If you set a different `PORT`, open that port instead.

### 5. Create an account and explore

1. Open the local application in your browser.
2. Register a new user account.
3. Sign in.
4. Explore the dashboard pages from the navigation.
5. Try the bundled dataset before uploading your own CSV.
6. Run a customer prediction and review the saved prediction history.

### Useful commands

| Command | Description |
|---|---|
| `npm install` | Install JavaScript/TypeScript dependencies |
| `npm run dev` | Start the Express + TypeScript development server |
| `npm start` | Start the same server entry point |
| `npm run build` | Build the frontend assets with Vite |
| `npm run preview` | Preview the Vite production build |
| `npm run lint` | Run the TypeScript compiler check (`tsc --noEmit`) |

## Optional Python Backend

The project also contains a Python FastAPI implementation and machine-learning scripts.

### Install Python dependencies

From the project root:

```bash
python -m venv .venv
```

Activate the environment:

**Windows PowerShell**
```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**
```bash
source .venv/bin/activate
```

Install the packages:

```bash
pip install -r backend/requirements.txt
```

Run the Python API using the included runner:

```bash
python backend/run.py
```

Check `backend/run.py` for the configured host and port. The Python API is separate from the default `npm run dev` workflow.

## Dataset and Machine-Learning Notes

The project is based on the **UCI Bank Marketing** dataset. Its target field is `y`, which indicates whether a customer subscribed to a term deposit (`yes` or `no`).

The dataset contains customer attributes and campaign-contact information such as age, job, marital status, education, account balance, housing/ personal loans, contact type, campaign timing, and previous campaign outcome.

### Pre-call and post-call prediction

A key modelling consideration is **target leakage**:

- **Pre-call prediction** should not use `duration`, because call duration is only known after the call has finished. Excluding it makes the prediction more appropriate for deciding whom to contact.
- **Post-call analysis** may include `duration` when the purpose is to analyze a completed interaction or prioritize follow-up.

Model metrics depend on the dataset version, preprocessing, train/test split, and model configuration. Treat model outputs as decision-support estimates, not guarantees.

## API Overview

The main TypeScript server exposes JSON endpoints under `/api`. The frontend API client in `src/services/api.ts` uses routes for:

- Health checks
- Authentication and account management
- Overview and campaign analytics
- Dataset summary, preview, upload, clean, reset, and clear operations
- Customer insights
- Customer predictions
- Model performance and model training
- Prediction history
- Workspace settings

For the exact request/response formats and complete route list, refer to `server.ts`, `src/services/api.ts`, and the shared types in `src/types/bankora.ts`.

Health check:

```text
GET /api/health
```

## Testing and Quality Checks

Run the TypeScript check:

```bash
npm run lint
```

Build the frontend:

```bash
npm run build
```

The repository also contains `scripts/test_audit.ts` for API/audit testing. Review the script before running it and make sure the application server and test environment are configured as expected.

## Security and Responsible Use

- Use HTTPS in production.
- Generate fresh, high-entropy JWT and cookie secrets for every deployment.
- Store secrets in environment variables or your hosting provider's secret manager.
- Never commit `.env`, database files containing real user data, private keys, or credentials.
- Use a secure password-reset delivery mechanism in production.
- Apply access control and rate limiting to sensitive endpoints.
- Do not upload customer data unless you have the right to process it.
- Remove or anonymize personally identifiable information when it is not required.
- A model prediction is probabilistic and should not be the sole basis for decisions affecting customers.

## Limitations and Deployment Notes

- The default local server is configured to run on port `3000`.
- The bundled SQLite database is suitable for local development and demonstrations; evaluate a managed database and backup strategy for production.
- The project contains a Python API in addition to the primary TypeScript server. Choose and document one deployment architecture before deploying; do not assume both servers start together.
- Configure production secrets, HTTPS, logging, backups, monitoring, and data-retention policies before handling real customer information.
- Confirm the deployment platform's build and start commands. The root scripts are `npm run build` and `npm start`.

## Project Purpose

BANKORA demonstrates how data analytics and supervised machine learning can support bank marketing campaign planning. It brings data exploration, customer segmentation, propensity prediction, model evaluation, and reporting into a single application.

**BANKORA — Intelligent Banking. Smarter Decisions.**

---

## Author

Add your name, course, institution, and project links here if this repository is being submitted as an academic or portfolio project.

## License

No license file was included in the supplied project archive. Add a `LICENSE` file before presenting this repository as open source.
