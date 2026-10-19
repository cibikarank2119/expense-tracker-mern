# Expense Tracker (MERN)

![CI](https://github.com/cibikarank2119/expense-tracker-mern/actions/workflows/ci.yml/badge.svg)

A full stack expense tracker built with MongoDB Atlas, Express, React and Node.js. Users can sign up, log in, add income and expenses, see charts, and convert their balance to other currencies.

**Live Demo:** coming soon

## Features

- Add, edit and delete income and expense transactions
- Dashboard with total income, total expenses and net balance
- Charts with Chart.js and category-wise data
- Export and import of transaction data
- Dark mode
- Currency converter card using the free ExchangeRate-API (live rates for INR, EUR, GBP, AED, JPY, AUD)
- Signup and login page with a custom password security algorithm and JWT tokens
- GitHub Actions workflow that builds the client and checks the server code on every push

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | React (Create React App), Tailwind CSS, Chart.js, Context API + useReducer |
| Backend | Node.js, Express |
| Database | MongoDB Atlas with Mongoose |
| Security | Node crypto, JSON Web Tokens |
| CI/CD | GitHub Actions |

## Password Security Algorithm

Real passwords are never saved. The server uses 4 layers:

1. **Strength check:** at least 8 characters, one uppercase letter, one lowercase letter and one number.
2. **Pepper:** a secret value from the server `.env` file is mixed in using HMAC-SHA256.
3. **Salt:** a random 16-byte salt is made for every user.
4. **Key stretching:** PBKDF2 with SHA-512, 100,000 iterations, 64-byte output.

Only the `passwordHash` and the `salt` are saved in the database. At login the server repeats the same steps and compares the hashes with `crypto.timingSafeEqual`. A wrong email and a wrong password give the same message, "Invalid email or password".

This is a learning project. Production apps should use well-tested libraries like bcrypt or Argon2.

## Project Structure

```
src/                  React app
  components/         Dashboard, TransactionForm, CurrencyConverter, AuthPage, ...
  contexts/           ExpenseContext.js
  utils/              dummyData.js, formatUtils.js
server/               Express backend
  config/  controllers/  models/  routes/  utils/  server.js
.github/workflows/    GitHub Actions (ci.yml)
```

## Run It Locally

You need Node.js and a free MongoDB Atlas database.

**1. Server**

```
cd server
npm install
```

Create a file `server/.env` with these names and your own values:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_long_random_secret
PEPPER=your_long_random_secret
```

Then start it:

```
node server.js
```

**2. Client**

In the main project folder, create `.env.local` with your free key from exchangerate-api.com:

```
REACT_APP_EXCHANGE_KEY=your_exchange_rate_api_key
```

Then run:

```
npm install
npm start
```

Open http://localhost:3000. The server runs on http://localhost:5000.

## API Routes

| Method | Route | Use |
|---|---|---|
| POST | /api/auth/signup | Create an account |
| POST | /api/auth/login | Log in and get a token |
| GET, POST, PUT, DELETE | /api/expenses | Manage transactions |

## Future Work

- Link each transaction to the logged-in user
- Protect the expense routes with the JWT token
- Deploy the app online

## Credits

This project is based on the open-source **Expense Tracker Web Application** (MIT License). The original app is a frontend-only React app that saves data in the browser.

**What I added for my college assignment:**

- Express and MongoDB Atlas backend connection
- Currency converter card using the free ExchangeRate-API
- Signup and login page with my own 4-layer password security algorithm and JWT
- Software Requirements Specification (SRS) document
- GitHub Actions CI workflow

Icons are from [Heroicons](https://heroicons.com/).

## Author

Karan (MCA student)
