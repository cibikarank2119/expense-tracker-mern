# Expense Tracker (MERN)

[![CI](https://github.com/cibikarank2119/expense-tracker-mern/actions/workflows/ci.yml/badge.svg)](https://github.com/cibikarank2119/expense-tracker-mern/actions/workflows/ci.yml)
[![Deploy](https://github.com/cibikarank2119/expense-tracker-mern/actions/workflows/deploy.yml/badge.svg)](https://github.com/cibikarank2119/expense-tracker-mern/actions/workflows/deploy.yml)

A full stack personal finance application built with MongoDB Atlas, Express, React and Node.js. Users create an account, log in securely, record income and expenses, analyse spending through charts, and convert their balance into other currencies using live exchange rates.

**Live Demo:** https://cibikarank2119.github.io/expense-tracker-mern/

> The backend runs on a free hosting plan and sleeps when idle. The first request after a pause can take 30-60 seconds. Please wait a moment on first load.

## Screenshots

| Login | Transactions |
|---|---|
| ![Login page](screenshot%28ss%29finished/finished%28ss1%29.png) | ![Transaction manager](screenshot%28ss%29finished/finished%28ss3%29.png) |

![Charts dashboard](screenshot%28ss%29finished/finished%28ss2%29.png)

## Table of Contents

- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Password Security Algorithm](#password-security-algorithm)
- [Project Structure](#project-structure)
- [Run It Locally](#run-it-locally)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Deployment](#deployment)
- [Future Work](#future-work)
- [Credits](#credits)
- [Author](#author)

## Features

- **Authentication:** signup and login with JWT tokens and a custom password security algorithm
- **Private data:** each user sees only their own transactions
- **Transactions:** add, edit and delete income and expenses
- **Dashboard:** total income, total expenses, net balance, top categories and recent transactions
- **Charts:** category breakdown, monthly trends, spending trends and month-over-month comparison (Chart.js)
- **Currency converter:** converts the net balance to INR, EUR, GBP, AED, JPY and AUD using live ExchangeRate-API rates
- **Import and export:** back up transactions or load them from a file
- **Categories:** default categories plus custom ones
- **Dark mode:** saved separately for each user
- **Demo mode:** optional sample data to explore the app without entering transactions
- **CI/CD:** GitHub Actions builds the client, checks the server code and deploys to GitHub Pages on every push

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | React (Create React App), Tailwind CSS, Chart.js, Context API + useReducer |
| Backend | Node.js, Express |
| Database | MongoDB Atlas with Mongoose |
| Security | Node crypto, JSON Web Tokens |
| Hosting | GitHub Pages (frontend), Render (backend) |
| CI/CD | GitHub Actions |

## Architecture

```
Browser (React on GitHub Pages)
        |  HTTPS + JWT in Authorization header
        v
Express API (Render)
        |  Mongoose
        v
MongoDB Atlas
```

The React app keeps application state in a context built on `useReducer`. Transactions are loaded from and saved to the API. Only user preferences (categories and dark mode) are stored in the browser, under a key unique to each user.

## Password Security Algorithm

Real passwords are never saved. The server applies four layers:

1. **Strength check:** at least 8 characters with one uppercase letter, one lowercase letter and one number.
2. **Pepper:** a secret value from the server `.env` file is mixed in using HMAC-SHA256.
3. **Salt:** a random 16-byte salt is generated for every user.
4. **Key stretching:** PBKDF2 with SHA-512, 100,000 iterations and a 64-byte output.

Only the `passwordHash` and the `salt` are stored. At login the server repeats the same steps and compares the hashes with `crypto.timingSafeEqual`. A wrong email and a wrong password return the same message, "Invalid email or password", so attackers cannot tell which one was wrong.

This is a learning project. Production applications should use well-tested libraries such as bcrypt or Argon2.

## Project Structure

```
src/                  React app
  components/         Dashboard, TransactionForm, CurrencyConverter, AuthPage, ...
  contexts/           ExpenseContext
  utils/              dummyData, formatUtils
server/               Express backend
  config/  controllers/  models/  routes/  utils/  server.js
.github/workflows/    ci.yml (build and checks), deploy.yml (GitHub Pages)
```

## Run It Locally

You need Node.js 20 or newer and a free MongoDB Atlas database.

**1. Server**

```bash
cd server
npm install
```

Create `server/.env` (see [Environment Variables](#environment-variables)), then start the server:

```bash
node server.js
```

**2. Client**

In the main project folder, create `.env.local`:

```
REACT_APP_EXCHANGE_KEY=your_exchange_rate_api_key
```

Then run:

```bash
npm install
npm start
```

Open http://localhost:3000. The local server runs on http://localhost:5000.

> By default the client calls the hosted API. To use your local server, change the API addresses in `src/contexts/ExpenseContext` and `src/components/AuthPage` to `http://localhost:5000`.

## Environment Variables

**Server (`server/.env`)**

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT` | Server port (default 5000) |
| `JWT_SECRET` | Long random secret used to sign tokens |
| `PEPPER` | Long random secret used in password hashing |

**Client (`.env.local`)**

| Variable | Purpose |
|---|---|
| `REACT_APP_EXCHANGE_KEY` | Free API key from [exchangerate-api.com](https://www.exchangerate-api.com/) |

Never commit `.env` files. Variables starting with `REACT_APP_` are included in the public JavaScript bundle, so only put non-sensitive values there.

## API Routes

| Method | Route | Access | Use |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Create an account |
| POST | `/api/auth/login` | Public | Log in and receive a token |
| GET | `/api/expenses` | Token | List the user's transactions |
| POST | `/api/expenses` | Token | Add a transaction |
| PUT | `/api/expenses/:id` | Token | Update a transaction |
| DELETE | `/api/expenses/:id` | Token | Delete a transaction |

Protected routes expect the header `Authorization: Bearer <token>`.

## Deployment

- **Frontend:** `deploy.yml` builds the React app and publishes it to GitHub Pages on every push to `main`. The exchange-rate key is stored as the repository secret `REACT_APP_EXCHANGE_KEY` and passed to the build step.
- **Backend:** deployed on Render as a web service with the root directory `server`, the build command `npm install` and the start command `node server.js`. Environment variables are set in the Render dashboard.
- **Database:** MongoDB Atlas.

## Future Work

- Server-side input validation for all transaction fields
- Refresh tokens and token expiry handling
- Budget limits and monthly spending alerts
- Recurring transactions
- Automated tests for the API and the main components

## Credits

This project is based on the open-source **Expense Tracker Web Application** (MIT License). The original is a frontend-only React app that stores data in the browser.

**What I added:**

- Express and MongoDB Atlas backend with per-user data
- Signup and login with my own four-layer password security algorithm and JWT
- Live currency converter using ExchangeRate-API
- Import saved to the server, local-date handling and per-user settings
- Software Requirements Specification (SRS) document
- GitHub Actions CI and deployment workflows
- Deployment to GitHub Pages and Render

Icons are from [Heroicons](https://heroicons.com/).

## Author

**Cibi Karan K**, MCA student, St. Joseph's College (Autonomous), Tiruchirappalli

GitHub: [@cibikarank2119](https://github.com/cibikarank2119)
