import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ExpenseProvider, useExpenseContext } from './contexts/ExpenseContext';
import MainLayout from './components/MainLayout';
import AuthPage from './components/AuthPage';

// Function to ensure all transactions in localStorage have valid IDs
const fixLocalStorageData = () => {
  try {
    const savedData = localStorage.getItem('expenseTrackerData');
    if (savedData) {
      const data = JSON.parse(savedData);

      let needsUpdate = false;

      // Ensure all transactions have IDs
      if (data.transactions && Array.isArray(data.transactions)) {
        data.transactions = data.transactions.map(transaction => {
          if (!transaction.id) {
            transaction.id = uuidv4();
            needsUpdate = true;
            console.log("Fixed transaction without ID:", transaction);
          }
          return transaction;
        });
      }

      // Save back to localStorage if changes were made
      if (needsUpdate) {
        console.log("Updating localStorage with fixed data");
        localStorage.setItem('expenseTrackerData', JSON.stringify(data));
      }
    }
  } catch (error) {
    console.error("Error fixing localStorage data:", error);
  }
};

const AppContent = ({ user, onLogout }) => {
  const { darkMode } = useExpenseContext();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <>
      <div className="flex justify-end items-center gap-3 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
        <span>Hi, {user.name}</span>
        <button
          onClick={onLogout}
          className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
        >
          Logout
        </button>
      </div>
      <MainLayout />
    </>
  );
};

function App() {
  // Load saved login (if any)
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('expenseTrackerAuth');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  });

  // Fix localStorage data before rendering the app
  useEffect(() => {
    fixLocalStorageData();
  }, []);

  const handleAuth = (data) => {
    localStorage.setItem('expenseTrackerAuth', JSON.stringify(data));
    setAuth(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('expenseTrackerAuth');
    setAuth(null);
  };

  // Not logged in: show the login / signup page
  if (!auth || !auth.token) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <ExpenseProvider>
      <AppContent user={auth.user} onLogout={handleLogout} />
    </ExpenseProvider>
  );
}

export default App;
