import React, { useState, useEffect } from 'react';

const BASE = 'USD';
const CURRENCIES = ['INR', 'EUR', 'GBP', 'AED', 'JPY', 'AUD'];

const cardClass =
  'bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border-l-4 border-purple-500';

const CurrencyConverter = ({ balance }) => {
  const [rates, setRates] = useState(null);
  const [currency, setCurrency] = useState('INR');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = process.env.REACT_APP_EXCHANGE_KEY;
    fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/${BASE}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.result === 'success') {
          setRates(data.conversion_rates);
        } else {
          setError(`Could not load exchange rates (${data['error-type'] || 'unknown'})`);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={cardClass}>
        <p className="text-gray-500 dark:text-gray-400">Loading rates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cardClass}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const converted = ((Number(balance) || 0) * rates[currency]).toLocaleString(
    undefined,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Balance in other currency
          </h3>
          <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-white">
            {converted}{' '}
            <span className="text-lg font-semibold text-purple-500">{currency}</span>
          </p>
        </div>

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        1 {BASE} = {rates[currency]} {currency} · live rates
      </p>
    </div>
  );
};

export default CurrencyConverter;
