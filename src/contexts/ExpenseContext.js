```jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
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

const expenseReducer = (state, action) => {
  switch (action.type) {
    case ADD_TRANSACTION:
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
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
          transaction.id === action.payload.id
            ? action.payload
            : transaction
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

    case IMPORT_DATA:
      return {
        ...state,
        transactions: [
          ...state.transactions,
          ...(action.payload.transactions || []),
        ],
        categories: [
          ...state.categories.filter(
            (category) =>
              !(action.payload.categories || []).some(
                (imported) => imported.id === category.id
              )
          ),
          ...(action.payload.categories || []),
        ],
      };

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

    default:
      return state;
  }
};

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children, token, user }) => {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const [storageLoaded, setStorageLoaded] = useState(false);

  const userId = user?.id || user?._id;
  const storageKey = userId
    ? `expenseTrackerData_${userId}`
    : null;

  // Load this user's local data. Never automatically load demo transactions.
  useEffect(() => {
    setStorageLoaded(false);

    if (!storageKey) {
      setStorageLoaded(true);
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
            isDemoData: false,
          },
        });
      }
    } catch (error) {
      console.error('Error loading this user’s local data:', error);
    } finally {
      setStorageLoaded(true);
    }
  }, [storageKey]);

  // Load only transactions belonging to the authenticated user.
  useEffect(() => {
    if (!token || !userId) return;

    const controller = new AbortController();

    const fetchTransactions = async () => {
      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Could not load transactions (${response.status})`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Unexpected transactions response from server');
        }

        const transactions = data.map((item) => ({
          id: item._id,
          description: item.title,
          amount: Number(item.amount),
          date: item.date,
          category: item.category || 'other',
          type: item.type,
        }));

        dispatch({
          type: LOAD_DATA,
          payload: {
            transactions,
            isDemoData: false,
          },
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching transactions:', error);
        }
      }
    };

    fetchTransactions();

    return () => controller.abort();
  }, [token, userId]);

  // Save state under this user's own localStorage key.
  useEffect(() => {
    if (!storageKey || !storageLoaded) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          transactions: state.transactions,
          categories: state.categories,
          darkMode: state.darkMode,
          isDemoData: state.isDemoData,
        })
      );
    } catch (error) {
      console.error('Error saving local data:', error);
    }
  }, [state, storageKey, storageLoaded]);

  const totalIncome = state.transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpenses = state.transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  // Add transaction to the authenticated user's account.
  const addTransaction = async (transaction) => {
    if (!token) throw new Error('Please log in again.');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: transaction.description,
        amount: Number(transaction.amount),
        category: transaction.category || 'other',
        type: transaction.type || 'expense',
        date: transaction.date || new Date().toISOString().split('T')[0],
      }),
    });

    if (!response.ok) {
      throw new Error('Could not save transaction. Please try again.');
    }

    const result = await response.json();
    const saved = result.expense || result;

    const newTransaction = {
      id: saved._id,
      description: saved.title,
      amount: Number(saved.amount),
      date: saved.date,
      category: saved.category || 'other',
      type: saved.type,
    };

    if (!newTransaction.id) {
      throw new Error('Server did not return the saved transaction ID.');
    }

    dispatch({
      type: ADD_TRANSACTION,
      payload: newTransaction,
    });

    return newTransaction;
  };

  // Delete only a transaction owned by the authenticated user.
  const deleteTransaction = async (id) => {
    if (!token || !id) throw new Error('Please log in again.');

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Could not delete transaction.');
    }

    dispatch({
      type: DELETE_TRANSACTION,
      payload: id,
    });
  };

  // Update only a transaction owned by the authenticated user.
  const editTransaction = async (transaction) => {
    if (!token || !transaction?.id) {
      throw new Error('Invalid transaction or login session.');
    }

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
      throw new Error('Could not update transaction.');
    }

    const result = await response.json();
    const saved = result.expense || result;

    const updatedTransaction = {
      id: saved._id || transaction.id,
      description: saved.title ?? transaction.description,
      amount: Number(saved.amount ?? transaction.amount),
      date: saved.date ?? transaction.date,
      category: saved.category ?? transaction.category,
      type: saved.type ?? transaction.type,
    };

    dispatch({
      type: EDIT_TRANSACTION,
      payload: updatedTransaction,
    });

    return updatedTransaction;
  };

  const addCategory = (category) => {
    const newCategory = {
      ...category,
      id: category.name.toLowerCase().replace(/\s+/g, '_'),
    };

    dispatch({
      type: ADD_CATEGORY,
      payload: newCategory,
    });

    return newCategory;
  };

  const deleteCategory = (id) => {
    dispatch({
      type: DELETE_CATEGORY,
      payload: id,
    });
  };

  const importData = (data) => {
    const transactions = (data.transactions || []).map((transaction) => ({
      ...transaction,
      id: transaction.id || uuidv4(),
    }));

    dispatch({
      type: IMPORT_DATA,
      payload: {
        transactions,
        categories: data.categories || [],
      },
    });
  };

  // Demo data is available only when explicitly requested in the UI.
  const loadDemoData = () => {
    dispatch({ type: LOAD_DEMO_DATA });
  };

  const clearDemoData = () => {
    dispatch({ type: CLEAR_DEMO_DATA });
  };

  const toggleDarkMode = () => {
    dispatch({ type: TOGGLE_DARK_MODE });
  };

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
      const category = state.categories.find(
        (item) => item.id === categoryId
      ) || {
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
      const date = new Date(transaction.date);

      if (Number.isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          income: 0,
          expense: 0,
          label: new Date(date.getFullYear(), date.getMonth(), 1)
            .toLocaleDateString('en-US', {
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

    return Object.values(months).sort(
      (a, b) => new Date(a.label) - new Date(b.label)
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
    throw new Error(
      'useExpenseContext must be used within an ExpenseProvider'
    );
  }

  return context;
};
```
