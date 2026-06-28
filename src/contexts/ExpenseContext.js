import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dummyData } from '../utils/dummyData';

// Define initial state
const initialState = {
  transactions: [],
  categories: [
    { id: 'food', name: 'Food', color: '#FF6B6B' },
    { id: 'transportation', name: 'Transportation', color: '#4ECDC4' },
    { id: 'entertainment', name: 'Entertainment', color: '#FFD166' },
    { id: 'utilities', name: 'Utilities', color: '#6B5B95' },
    { id: 'salary', name: 'Salary', color: '#88D498' },
    { id: 'freelance', name: 'Freelance', color: '#F3A712' },
    { id: 'other', name: 'Other', color: '#A5A58D' },
  ],
  darkMode: false,
  isDemoData: false,
};

// Define action types
const ADD_TRANSACTION = 'ADD_TRANSACTION';
const DELETE_TRANSACTION = 'DELETE_TRANSACTION';
const EDIT_TRANSACTION = 'EDIT_TRANSACTION';
const ADD_CATEGORY = 'ADD_CATEGORY';
const DELETE_CATEGORY = 'DELETE_CATEGORY';
const TOGGLE_DARK_MODE = 'TOGGLE_DARK_MODE';
const LOAD_DATA = 'LOAD_DATA';
const IMPORT_DATA = 'IMPORT_DATA';
const LOAD_DEMO_DATA = 'LOAD_DEMO_DATA';
const CLEAR_DEMO_DATA = 'CLEAR_DEMO_DATA';

// Define reducer function
const expenseReducer = (state, action) => {
  switch (action.type) {
    case ADD_TRANSACTION: {
      if (!action.payload.id) {
        console.error('Attempting to add transaction without ID');
        return state;
      }
      console.log('REDUCER - Adding transaction:', action.payload);
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    }
    case DELETE_TRANSACTION: {
      console.log('REDUCER - Deleting transaction with ID:', action.payload);
      const updatedTransactions = state.transactions.filter(
        (transaction) => transaction.id !== action.payload
      );
      console.log('REDUCER - Transactions after deletion:', updatedTransactions);
      return {
        ...state,
        transactions: updatedTransactions,
      };
    }
    case EDIT_TRANSACTION: {
      if (!action.payload.id) {
        console.error('Attempting to edit transaction without ID');
        return state;
      }
      console.log('REDUCER - Editing transaction:', action.payload);
      const updatedTransactions = state.transactions.map((transaction) => {
        if (transaction.id === action.payload.id) {
          return { ...action.payload };
        }
        return transaction;
      });
      console.log('REDUCER - Transactions after edit:', updatedTransactions);
      return {
        ...state,
        transactions: updatedTransactions,
      };
    }
    case ADD_CATEGORY:
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.payload
        ),
      };
    case TOGGLE_DARK_MODE:
      return {
        ...state,
        darkMode: !state.darkMode,
      };
    case LOAD_DATA:
      return {
        ...state,
        ...action.payload,
      };
    case IMPORT_DATA:
      return {
        ...state,
        transactions: [...state.transactions, ...action.payload.transactions],
        categories: [...state.categories.filter(cat =>
          !action.payload.categories.some(importedCat => importedCat.id === cat.id)
        ), ...action.payload.categories],
      };
    case LOAD_DEMO_DATA:
      return {
        ...state,
        transactions: dummyData.transactions,
        isDemoData: true,
      };
    case CLEAR_DEMO_DATA:
      return {
        ...state,
        transactions: [],
        isDemoData: false,
      };
    default:
      return state;
  }
};

// Create context
const ExpenseContext = createContext();

// Create provider component
export const ExpenseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  // Check if we have any data; if not, load demo data
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('expenseTrackerData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.transactions) {
          parsedData.transactions = parsedData.transactions.map(transaction => {
            if (!transaction.id) {
              transaction.id = uuidv4();
            }
            return transaction;
          });
        }
        dispatch({ type: LOAD_DATA, payload: parsedData });
      } else {
        loadDemoData();
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      loadDemoData();
    }
  }, []);

  // ⚠️ NEW — fetch real data from MongoDB on app load
  useEffect(() => {
    fetch("http://localhost:3000/api/expenses")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched from backend:", data);
        const mapped = data.map((item) => ({
          id: item._id,
          description: item.title,
          amount: item.amount,
          date: item.date,
          category: item.category,
          type: item.type,
        }));
        dispatch({ type: LOAD_DATA, payload: { transactions: mapped } });
      })
      .catch((err) => console.error("Error fetching from backend:", err));
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('expenseTrackerData', JSON.stringify({
        transactions: state.transactions,
        categories: state.categories,
        darkMode: state.darkMode,
        isDemoData: state.isDemoData,
      }));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  }, [state]);

  // Calculate totals
  const totalIncome = state.transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

  const totalExpenses = state.transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  // Action creators
  const addTransaction = (transaction) => {
    try {
      const newId = uuidv4();
      console.log('ACTION - Adding transaction with new ID:', newId);
      console.log('ACTION - Transaction data:', transaction);

      const newTransaction = {
        id: newId,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        date: transaction.date || new Date().toISOString().split('T')[0],
        category: transaction.category || 'other',
        type: transaction.type || 'expense',
      };

      console.log('ACTION - Formatted transaction:', newTransaction);

      fetch("http://localhost:3000/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTransaction.description,
          amount: newTransaction.amount,
          category: newTransaction.category,
          type: newTransaction.type,
          date: newTransaction.date,
        }),
      })
        .then((res) => res.json())
        .then((saved) => console.log("Saved to backend:", saved))
        .catch((err) => console.error("Error saving to backend:", err));

      dispatch({
        type: ADD_TRANSACTION,
        payload: newTransaction,
      });

      return newTransaction;
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

 const deleteTransaction = (id) => {
    try {
      if (!id) {
        console.error("Attempt to delete transaction without ID");
        return;
      }

      const transactionToDelete = state.transactions.find(t => t.id === id);
      if (!transactionToDelete) {
        console.error(`Transaction with ID ${id} not found`);
        return;
      }

      fetch(`http://localhost:3000/api/expenses/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => console.log("Deleted from backend:", data))
        .catch((err) => console.error("Error deleting from backend:", err));

      dispatch({
        type: DELETE_TRANSACTION,
        payload: id,
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const editTransaction = (transaction) => {
    try {
      if (!transaction || !transaction.id) {
        console.error("Invalid transaction or missing ID for edit");
        return;
      }

      const existingTransaction = state.transactions.find(t => t.id === transaction.id);
      if (!existingTransaction) {
        console.error(`Transaction with ID ${transaction.id} not found for editing`);
        return;
      }

      const updatedTransaction = {
        ...transaction,
        amount: parseFloat(transaction.amount),
      };

      fetch(`http://localhost:3000/api/expenses/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updatedTransaction.description,
          amount: updatedTransaction.amount,
          category: updatedTransaction.category,
          type: updatedTransaction.type,
          date: updatedTransaction.date,
        }),
      })
        .then((res) => res.json())
        .then((data) => console.log("Updated in backend:", data))
        .catch((err) => console.error("Error updating in backend:", err));

      dispatch({
        type: EDIT_TRANSACTION,
        payload: updatedTransaction,
      });

      return updatedTransaction;
    } catch (error) {
      console.error("Error editing transaction:", error);
    }
  };

  const addCategory = (category) => {
    try {
      const newCategory = {
        id: category.name.toLowerCase().replace(/\s+/g, '_'),
        ...category,
      };
      dispatch({
        type: ADD_CATEGORY,
        payload: newCategory,
      });
      return newCategory;
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const deleteCategory = (id) => {
    try {
      if (!id) {
        console.error("Attempt to delete category without ID");
        return;
      }
      dispatch({
        type: DELETE_CATEGORY,
        payload: id,
      });
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const importData = (data) => {
    try {
      if (data.transactions) {
        data.transactions = data.transactions.map(transaction => {
          if (!transaction.id) {
            transaction.id = uuidv4();
          }
          return transaction;
        });
      }
      dispatch({
        type: IMPORT_DATA,
        payload: data,
      });
    } catch (error) {
      console.error("Error importing data:", error);
    }
  };

  const loadDemoData = () => {
    try {
      console.log("Loading demo data");
      dispatch({ type: LOAD_DEMO_DATA });
    } catch (error) {
      console.error("Error loading demo data:", error);
    }
  };

  const clearDemoData = () => {
    try {
      console.log("Clearing demo data");
      dispatch({ type: CLEAR_DEMO_DATA });
    } catch (error) {
      console.error("Error clearing demo data:", error);
    }
  };

  const toggleDarkMode = () => {
    dispatch({ type: TOGGLE_DARK_MODE });
  };

  // Group expenses by category
  const expensesByCategory = state.transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((categories, transaction) => {
      const category = transaction.category;
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += Number(transaction.amount);
      return categories;
    }, {});

  const categoryData = Object.entries(expensesByCategory).map(
    ([categoryId, amount]) => {
      const category = state.categories.find((cat) => cat.id === categoryId) || {
        name: categoryId,
        color: '#888',
      };
      return {
        id: categoryId,
        name: category.name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: category.color,
      };
    }
  );

  const getMonthlyData = () => {
    const months = {};

    state.transactions.forEach((transaction) => {
      try {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!months[monthKey]) {
          months[monthKey] = {
            income: 0,
            expense: 0,
            label: new Date(date.getFullYear(), date.getMonth(), 1)
              .toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          };
        }

        if (transaction.type === 'income') {
          months[monthKey].income += Number(transaction.amount);
        } else {
          months[monthKey].expense += Number(transaction.amount);
        }
      } catch (error) {
        console.error("Error processing transaction for monthly data:", transaction, error);
      }
    });

    return Object.values(months).sort((a, b) =>
      new Date(a.label) - new Date(b.label)
    );
  };

  return (
    <ExpenseContext.Provider
      value={{
        transactions: state.transactions,
        categories: state.categories,
        darkMode: state.darkMode,
        isDemoData: state.isDemoData,
        totalIncome,
        totalExpenses,
        netBalance,
        categoryData,
        getMonthlyData,
        addTransaction,
        deleteTransaction,
        editTransaction,
        addCategory,
        deleteCategory,
        importData,
        loadDemoData,
        clearDemoData,
        toggleDarkMode,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenseContext = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenseContext must be used within an ExpenseProvider');
  }
  return context;
};