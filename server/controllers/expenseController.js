const Expense = require("../models/Expense");

// POST /api/expenses
const addExpense = async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body;

    if (!title || !amount || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newExpense = new Expense({ title, amount, type, category, date });
    const saved = await newExpense.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Save error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Fetch error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/expenses/:id  ⚠️ NEW
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, type, category, date } = req.body;

    const updated = await Expense.findByIdAndUpdate(
      id,
      { title, amount, type, category, date },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Update error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/expenses/:id  ⚠️ NEW
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Deleted successfully", deleted });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addExpense, getExpenses, updateExpense, deleteExpense };