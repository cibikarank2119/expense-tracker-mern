import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dummyData } from '../utils/dummyData';

const API_URL = 'https://expense-tracker-api-6n6t.onrender.com/api/expenses';

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
const RESET_STATE = 'RESET_STATE';

// ---------- helpers ----------

// Local date as YYYY-MM-DD (toISOString() gives the UTC date, which is
// "yesterday" in India between 12:00 AM and 5:30 AM).
const getTodayLocal = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

// Convert a server record (title/_id) to the shape the UI uses.
const normalizeTransaction = (item, fallback = {}) => ({
  id: item._id || item.id || fallback.id,
  description: item.title ?? fallback.description,
  amount: Number(item.amount ?? fallback.amount),
  date: item.date ?? fallback.date,
  category: item.category || fallback.category || 'other',
  type: item.type ?? fallback.type,
});

// Read the server's error message if it sent one.
const getErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();
    return data.message || data.error || fallback;
  } catch {
    return fallback;
  }
};

// ---------- reducer ----------

const expenseReducer = (state, action) => {
  switch (action.type) {
    case ADD_TRANSACTION:
      return {
        ...state,
        // If demo data is showing, replace it instead of mixing it with real data
        transactions: state.isDemoData
          ? [action.payload]
          : [...state.transactions, action.payload],
        isDemoData: false,
      };

    case DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload
        ),
      };

    case EDIT_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.payload.id ? action.payload : transaction
        ),
      };

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

    case IMPORT_DATA: {
      const importedCategories = action.payload.categories || [];
      return {
        ...state,
        transactions: [
          ...(state.isDemoData ? [] : state.transactions),
          ...(action.payload.transactions || []),
        ],
        categories: [
          ...state.categories.filter(
            (category) =>
              !importedCategories.some((imported) => imported.id === category.id)
          ),
          ...importedCategories,
        ],
        isDemoData: false,
      };
    }

    case LOAD_DEMO_DATA:
      return {
        ...state,
        transactions: dummyData.transactions.map((transaction) => ({
          ...transaction,
          id: transaction.id || uuidv4(),
        })),
        isDemoData: true,
      };

    case CLEAR_DEMO_DATA:
      return {
        ...state,
        transactions: [],
        isDemoData: false,
      };

    case RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children, token, user }) => {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const [loadedKey, setLoadedKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = user?.id || user?._id;
  const storageKey = userId ? `expenseTrackerData_${userId}` : null;

  // 1) When the user changes (login / logout / switch account):
  //    wipe the previous user's data, then load this user's local settings.
  useEffect(() => {
    dispatch({ type: RESET_STATE });

    if (!storageKey) {
      setLoadedKey(null);
      return;
    }

    try {
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        const parsedData = JSON.parse(savedData);

        dispatch({
          type: LOAD_DATA,
          payload: {
            categories: parsedData.categories || initialState.categories,
            darkMode: parsedData.darkMode ?? false,
          },
        });
      }
    } catch (err) {
      console.error('Error loading local settings:', err);
    } finally {
      setLoadedKey(storageKey);
    }
  }, [storageKey]);

  // 2) Load the authenticated user's transactions from the server.
  useEffect(() => {
    if (!token || !userId) return;

    const controller = new AbortController();

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              `Could not load transactions (${response.status})`
            )
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Unexpected transactions response from server');
        }

        dispatch({
          type: LOAD_DATA,
          payload: {
            transactions: data.map((item) => normalizeTransaction(item)),
            isDemoData: false,
          },
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching transactions:', err);
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchTransactions();

    return () => controller.abort();
  }, [token, userId]);

  // 3) Save only settings (categories + dark mode) locally.
  //    Transactions live on the server, so they are not copied to localStorage.
  //    Saving waits until this exact user's data has been loaded, so one
  //    user's data can never be written under another user's key.
  useEffect(() => {
    if (!storageKey || loadedKey !== storageKey) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          categories: state.categories,
          darkMode: state.darkMode,
        })
      );
    } catch (err) {
      console.error('Error saving local settings:', err);
    }
  }, [state.categories, state.darkMode, storageKey, loadedKey]);

  // ---------- derived values ----------

  const { totalIncome, totalExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    state.transactions.forEach((transaction) => {
      if (transaction.type === 'income') income += Number(transaction.amount);
      else if (transaction.type === 'expense')
        expenses += Number(transaction.amount);
    });

    return { totalIncome: income, totalExpenses: expenses };
  }, [state.transactions]);

  const netBalance = totalIncome - totalExpenses;

  const categoryData = useMemo(() => {
    const expensesByCategory = state.transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((acc, transaction) => {
        acc[transaction.category] =
          (acc[transaction.category] || 0) + Number(transaction.amount);
        return acc;
      }, {});

    return Object.entries(expensesByCategory).map(([categoryId, amount]) => {
      const category = state.categories.find((item) => item.id === categoryId) || {
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
    });
  }, [state.transactions, state.categories, totalExpenses]);

  const getMonthlyData = () => {
    const months = {};

    state.transactions.forEach((transaction) => {
      // Read year/month straight from "YYYY-MM-DD..." to avoid timezone shifts
      const match = String(transaction.date).match(/^(\d{4})-(\d{2})/);
      if (!match) return;

      const year = Number(match[1]);
      const month = Number(match[2]);
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          key: monthKey, // sortable: "2026-09" < "2026-10"
          income: 0,
          expense: 0,
          label: new Date(year, month - 1, 1).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
        };
      }

      if (transaction.type === 'income') {
        months[monthKey].income += Number(transaction.amount);
      } else {
        months[monthKey].expense += Number(transaction.amount);
      }
    });

    return Object.values(months).sort((a, b) => a.key.localeCompare(b.key));
  };

  // ---------- actions ----------

  // Save one transaction to the server and return it in UI shape (no dispatch).
  const createOnServer = async (transaction) => {
    if (!token) throw new Error('Please log in again.');

    const payload = {
      title: transaction.description,
      amount: Number(transaction.amount),
      category: transaction.category || 'other',
      type: transaction.type || 'expense',
      date: transaction.date || getTodayLocal(),
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Could not save transaction. Please try again.'
        )
      );
    }

    const result = await response.json();
    const saved = result.expense || result;
    const created = normalizeTransaction(saved, {
      description: payload.title,
      amount: payload.amount,
      category: payload.category,
      type: payload.type,
      date: payload.date,
    });

    if (!created.id) {
      throw new Error('Server did not return the saved transaction ID.');
    }

    return created;
  };

  const addTransaction = async (transaction) => {
    const created = await createOnServer(transaction);
    dispatch({ type: ADD_TRANSACTION, payload: created });
    return created;
  };

  const deleteTransaction = async (id) => {
    if (!id) throw new Error('Invalid transaction.');

    // Demo transactions only exist locally – nothing to delete on the server
    if (state.isDemoData) {
      dispatch({ type: DELETE_TRANSACTION, payload: id });
      return;
    }

    if (!token) throw new Error('Please log in again.');

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'Could not delete transaction.')
      );
    }

    dispatch({ type: DELETE_TRANSACTION, payload: id });
  };

  const editTransaction = async (transaction) => {
    if (!transaction?.id) throw new Error('Invalid transaction.');

    // Demo transactions only exist locally
    if (state.isDemoData) {
      dispatch({ type: EDIT_TRANSACTION, payload: transaction });
      return transaction;
    }

    if (!token) throw new Error('Please log in again.');

    const response = await fetch(`${API_URL}/${transaction.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: transaction.description,
        amount: Number(transaction.amount),
        category: transaction.category || 'other',
        type: transaction.type,
        date: transaction.date,
      }),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'Could not update transaction.')
      );
    }

    const result = await response.json();
    const saved = result.expense || result;
    const updated = normalizeTransaction(saved, transaction);

    dispatch({ type: EDIT_TRANSACTION, payload: updated });
    return updated;
  };

  const addCategory = (category) => {
    const id = category.name.trim().toLowerCase().replace(/\s+/g, '_');

    // Don't create duplicates – return the existing one
    const existing = state.categories.find((item) => item.id === id);
    if (existing) return existing;

    const newCategory = { ...category, name: category.name.trim(), id };
    dispatch({ type: ADD_CATEGORY, payload: newCategory });
    return newCategory;
  };

  const deleteCategory = (id) => {
    if (id === 'other') return; // fallback category must always exist
    dispatch({ type: DELETE_CATEGORY, payload: id });
  };

  // Imported transactions are now saved to the server too, so they
  // don't disappear on the next page refresh.
  const importData = async (data) => {
    const incoming = data.transactions || [];

    const results = await Promise.allSettled(
      incoming.map((transaction) => createOnServer(transaction))
    );

    const saved = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);

    dispatch({
      type: IMPORT_DATA,
      payload: { transactions: saved, categories: data.categories || [] },
    });

    return { imported: saved.length, failed: incoming.length - saved.length };
  };

  // Demo data is local only and available only when explicitly requested.
  const loadDemoData = () => dispatch({ type: LOAD_DEMO_DATA });
  const clearDemoData = () => dispatch({ type: CLEAR_DEMO_DATA });
  const toggleDarkMode = () => dispatch({ type: TOGGLE_DARK_MODE });

  return (
    <ExpenseContext.Provider
      value={{
        transactions: state.transactions,
        categories: state.categories,
        darkMode: state.darkMode,
        isDemoData: state.isDemoData,
        loading,
        error,
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
