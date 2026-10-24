
const express = require("express");
const router = express.Router();

const {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const authMiddleware = require("../middleware/authMiddleware");

// All expense routes require a valid login token
router.use(authMiddleware);

router.post("/", addExpense);
router.get("/", getExpenses);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
