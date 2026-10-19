const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const expenseRoutes = require("./routes/expenseRoutes"); // ✅ matches your actual filename
const authRoutes = require("./routes/authRoutes"); 

const app = express();

// ⚠️ FIX #1 — THE MOST COMMON CULPRIT
// Without this, req.body is undefined on every POST request
app.use(express.json());
app.use(cors());

// ⚠️ FIX #2 — route must be mounted BEFORE app.listen, with matching path
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));
