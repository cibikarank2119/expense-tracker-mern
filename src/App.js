```jsx
import React, { useEffect, useState } from 'react';
import { ExpenseProvider, useExpenseContext } from './contexts/ExpenseContext';
import MainLayout from './components/MainLayout';
import AuthPage from './components/AuthPage';

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
        <span>Hi, {user?.name || 'User'}</span>

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
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('expenseTrackerAuth');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading login details:', error);
      return null;
    }
  });

  const handleAuth = (data) => {
    localStorage.setItem('expenseTrackerAuth', JSON.stringify(data));
    setAuth(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('expenseTrackerAuth');
    setAuth(null);
  };

  if (!auth || !auth.token) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <ExpenseProvider token={auth.token} user={auth.user}>
      <AppContent user={auth.user} onLogout={handleLogout} />
    </ExpenseProvider>
  );
}

export default App;
```
