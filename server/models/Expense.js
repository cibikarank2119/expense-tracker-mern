const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String, // "income" or "expense"
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ⚠️ FIX: export the MODEL, not the schema
module.exports = mongoose.model("Expense", expenseSchema);