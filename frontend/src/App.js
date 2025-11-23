import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Toast Notification Component
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Login Page
function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log('Attempting to fetch auth URL from:', `${BACKEND_URL}/api/auth/google`);
      const response = await axios.get(`${BACKEND_URL}/api/auth/google`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Auth URL received:', response.data.auth_url);
      
      if (response.data && response.data.auth_url) {
        console.log('Redirecting to:', response.data.auth_url);
        window.location.href = response.data.auth_url;
      } else {
        throw new Error('No auth URL received from server');
      }
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      alert(`Failed to initiate login: ${error.message || 'Unknown error'}. Please check console for details.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Finance Tracker</h1>
          <p className="text-gray-600">Photography Studio Management</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
            data-testid="google-login-button"
          >
            {loading ? (
              <div className="loader"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Page
function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/dashboard/stats`, {
        withCredentials: true
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Last Month Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500" data-testid="revenue-card">
            <p className="text-green-600 text-sm font-medium mb-2">Revenue</p>
            <p className="text-3xl font-bold text-green-700">{formatCurrency(stats?.revenue || 0)}</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500" data-testid="expenses-card">
            <p className="text-red-600 text-sm font-medium mb-2">Expenses</p>
            <p className="text-3xl font-bold text-red-700">{formatCurrency(stats?.expenses || 0)}</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500" data-testid="profit-card">
            <p className="text-blue-600 text-sm font-medium mb-2">Profit</p>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(stats?.profit || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/record-transaction')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition-all duration-200 text-left"
          data-testid="record-transaction-button"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Record Transaction</h3>
              <p className="text-blue-100 text-sm">Add sale, expense, or investment</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/history')}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:shadow-lg transition-all duration-200 text-left"
          data-testid="transaction-history-button"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <p className="text-purple-100 text-sm">View all transactions</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-6 hover:shadow-lg transition-all duration-200 text-left"
          data-testid="reports-button"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Reports</h3>
              <p className="text-indigo-100 text-sm">Monthly breakdowns</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// Record Transaction Page
function RecordTransaction({ user }) {
  const [activeTab, setActiveTab] = useState('sale');
  const [partnerPaymentSubTab, setPartnerPaymentSubTab] = useState('payback');
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showNewPartnerModal, setShowNewPartnerModal] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchPartners();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users`, { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/partners`, { withCredentials: true });
      setPartners(response.data);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handleSaleSubmit = async (e, addNext = false) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const data = {
      date: formData.get('date'),
      shoot_type: formData.get('shoot_type'),
      total_time_hrs: parseFloat(formData.get('total_time_hrs')),
      total_amount_inr: parseFloat(formData.get('total_amount_inr')),
      received_by: formData.get('received_by'),
      payment_mode: formData.get('payment_mode'),
      cameraman: formData.get('cameraman'),
      cameraman_mobile: formData.get('cameraman_mobile'),
      customer_name: formData.get('customer_name'),
      city: formData.get('city')
    };

    try {
      await axios.post(`${BACKEND_URL}/api/sales`, data, { withCredentials: true });
      setToast({ message: 'Sale Added Successfully!', type: 'success' });
      e.target.reset();
      if (!addNext) {
        // Wait a bit before clearing form if not adding next
      }
    } catch (error) {
      console.error('Error recording sale:', error);
      setToast({ message: 'Failed to record sale', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e, addNext = false) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const data = {
      date: formData.get('date'),
      expense_type: formData.get('expense_type'),
      amount_inr: parseFloat(formData.get('amount_inr')),
      description: formData.get('description'),
      paid_by: formData.get('paid_by'),
      payment_mode: formData.get('payment_mode')
    };

    try {
      await axios.post(`${BACKEND_URL}/api/expenses`, data, { withCredentials: true });
      setToast({ message: 'Expense Added Successfully!', type: 'success' });
      e.target.reset();
    } catch (error) {
      console.error('Error recording expense:', error);
      setToast({ message: 'Failed to record expense', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerPaymentSubmit = async (e, addNext = false) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const partnerId = formData.get('partner_id');
    const partner = partners.find(p => p.id === partnerId);
    
    const data = {
      date: formData.get('date'),
      partner_id: partnerId,
      partner_name: partner?.name || '',
      amount_inr: parseFloat(formData.get('amount_inr')),
      month_year: formData.get('month_year'),
      payment_mode: formData.get('payment_mode'),
      description: formData.get('description')
    };

    try {
      await axios.post(`${BACKEND_URL}/api/partner-payments`, data, { withCredentials: true });
      setToast({ message: 'Partner Payment Added Successfully!', type: 'success' });
      e.target.reset();
    } catch (error) {
      console.error('Error recording partner payment:', error);
      setToast({ message: 'Failed to record partner payment', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInvestmentSubmit = async (e, addNext = false) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const partnerIdOrNew = formData.get('partner_id');
    
    let partnerId, partnerName;
    
    if (partnerIdOrNew === 'new_partner') {
      // Create new partner first
      const newPartnerNameValue = formData.get('new_partner_name');
      if (!newPartnerNameValue) {
        setToast({ message: 'Please enter partner name', type: 'error' });
        setLoading(false);
        return;
      }
      
      partnerId = `partner_${Date.now()}`;
      partnerName = newPartnerNameValue;
    } else {
      partnerId = partnerIdOrNew;
      const partner = partners.find(p => p.id === partnerId);
      partnerName = partner?.name || '';
    }
    
    const data = {
      date: formData.get('date'),
      partner_id: partnerId,
      partner_name: partnerName,
      amount_inr: parseFloat(formData.get('amount_inr')),
      description: formData.get('description')
    };

    try {
      await axios.post(`${BACKEND_URL}/api/investments`, data, { withCredentials: true });
      setToast({ message: 'Investment Added Successfully! Update partner shares in Partners section.', type: 'success' });
      e.target.reset();
      fetchPartners(); // Refresh partners list
    } catch (error) {
      console.error('Error recording investment:', error);
      setToast({ message: 'Failed to record investment', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const shootTypes = ['Pre-Wedding', 'Baby', 'Half-Saree', 'Maternity', 'Post-Wedding', 'Model', 'Family'];
  const expenseTypes = [
    'ADVANCE/SALARY', 'CIVIL ITEMS', 'CIVIL WORK', 'CLOTHES', 'DRY CLEANING', 'DRINKS',
    'ELECTRIC ITEMS', 'ELECTRIC WORK', 'FOOD', 'FUEL', 'FURNITURE', 'GROCERIES',
    'LABOUR', 'LAND RENT', 'MILK TEA', 'OTHER', 'PAINT', 'PET FOOD', 'POWER BILL',
    'PROMOTIONS', 'PROPS', 'REPAIR & MAINTENANCE', 'SANITARY', 'TRANSPORT', 'TRAVEL',
    'WI-FI', 'WOOD'
  ];

  return (
    <div className="space-y-6" data-testid="record-transaction-page">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Record Transaction</h2>
        
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('sale')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'sale'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="sale-tab"
          >
            Record Sale
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'expense'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="expense-tab"
          >
            Record Expense
          </button>
          <button
            onClick={() => setActiveTab('partner-payment')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'partner-payment'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="partner-payment-tab"
          >
            Record Partner Payments
          </button>
        </div>

        {activeTab === 'sale' && (
          <form onSubmit={handleSaleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="sale-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shoot Type *</label>
                <select
                  name="shoot_type"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="sale-shoot-type"
                >
                  <option value="">Select type</option>
                  {shootTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Time (hrs) *</label>
                <input
                  type="number"
                  name="total_time_hrs"
                  step="0.5"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="sale-time"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (INR) *</label>
                <input
                  type="number"
                  name="total_amount_inr"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="sale-amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received By *</label>
                <select
                  name="received_by"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="sale-received-by"
                >
                  <option value="">Select user</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  name="payment_mode"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="sale-payment-mode"
                >
                  <option value="">Select mode</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cameraman</label>
                <input
                  type="text"
                  name="cameraman"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cameraman Mobile</label>
                <input
                  type="tel"
                  name="cameraman_mobile"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  name="customer_name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
              data-testid="sale-submit-button"
            >
              {loading ? 'Recording...' : 'Record Sale'}
            </button>
          </form>
        )}

        {activeTab === 'expense' && (
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="expense-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type *</label>
                <select
                  name="expense_type"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="expense-type"
                >
                  <option value="">Select type</option>
                  {expenseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  name="amount_inr"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="expense-amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid By *</label>
                <select
                  name="paid_by"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="expense-paid-by"
                >
                  <option value="">Select user</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  name="payment_mode"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="expense-payment-mode"
                >
                  <option value="">Select mode</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
              data-testid="expense-submit-button"
            >
              {loading ? 'Recording...' : 'Record Expense'}
            </button>
          </form>
        )}

        {activeTab === 'partner-payment' && (
          <div className="space-y-4">
            {/* Sub-tabs for Pay-Backs and Investments */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setPartnerPaymentSubTab('payback')}
                className={`px-4 py-2 font-medium transition-colors ${
                  partnerPaymentSubTab === 'payback'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Record Pay-Backs
              </button>
              <button
                onClick={() => setPartnerPaymentSubTab('investment')}
                className={`px-4 py-2 font-medium transition-colors ${
                  partnerPaymentSubTab === 'investment'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Record Investments
              </button>
            </div>

            {/* Pay-Back Form */}
            {partnerPaymentSubTab === 'payback' && (
              <form onSubmit={handlePartnerPaymentSubmit} className="space-y-4" id="payback-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      name="date"
                      required
                      onChange={(e) => {
                        // Auto-populate month-year from date
                        const date = e.target.value;
                        if (date) {
                          const monthYear = date.substring(0, 7); // Extract YYYY-MM
                          const monthYearInput = document.querySelector('input[name="month_year"]');
                          if (monthYearInput) {
                            monthYearInput.value = monthYear;
                          }
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="payback-date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner *</label>
                    <select
                      name="partner_id"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="payback-partner"
                    >
                      <option value="">Select partner</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (INR) *</label>
                    <input
                      type="number"
                      name="amount_inr"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="payback-amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month-Year *</label>
                    <input
                      type="month"
                      name="month_year"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      data-testid="payback-month"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                    <select
                      name="payment_mode"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="payback-payment-mode"
                    >
                      <option value="">Select mode</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                  data-testid="payback-submit-button"
                >
                  {loading ? 'Recording...' : 'Record Pay-Back'}
                </button>
              </form>
            )}

            {/* Investment Form */}
            {partnerPaymentSubTab === 'investment' && (
              <form onSubmit={handleInvestmentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="investment-date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner *</label>
                    <select
                      name="partner_id"
                      required
                      onChange={(e) => {
                        if (e.target.value === 'new_partner') {
                          document.getElementById('new-partner-name-field').style.display = 'block';
                        } else {
                          document.getElementById('new-partner-name-field').style.display = 'none';
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="investment-partner"
                    >
                      <option value="">Select partner</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                      <option value="new_partner">➕ New Partner</option>
                    </select>
                  </div>
                  <div id="new-partner-name-field" style={{display: 'none'}}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Partner Name *</label>
                    <input
                      type="text"
                      name="new_partner_name"
                      placeholder="Enter partner name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="new-partner-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (INR) *</label>
                    <input
                      type="number"
                      name="amount_inr"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="investment-amount"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-sm text-yellow-700">
                    ⚠️ After recording investment, please update partner shares in the Partners section.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                  data-testid="investment-submit-button"
                >
                  {loading ? 'Recording...' : 'Record Investment'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Transaction History Page
function TransactionHistory() {
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const fetchAllTransactions = async () => {
    try {
      const [salesRes, expensesRes, investmentsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/sales`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/expenses`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/investments`, { withCredentials: true })
      ]);
      setSales(salesRes.data);
      setExpenses(expensesRes.data);
      setInvestments(investmentsRes.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {


  const handleEdit = (item, type) => {
    setEditingItem(item);
    setEditType(type);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (editType === 'sale') {
        endpoint = `${BACKEND_URL}/api/sales/${editingItem.id}`;
      } else if (editType === 'expense') {
        endpoint = `${BACKEND_URL}/api/expenses/${editingItem.id}`;
      } else if (editType === 'investment') {
        endpoint = `${BACKEND_URL}/api/investments/${editingItem.id}`;
      }

      await axios.put(endpoint, editingItem, { withCredentials: true });
      setToast({ message: 'Updated Successfully!', type: 'success' });
      setEditingItem(null);
      setEditType(null);
      fetchAllTransactions();
    } catch (error) {
      console.error('Error updating:', error);
      setToast({ message: 'Failed to update', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditType(null);
  };

  const handleEditChange = (field, value) => {
    setEditingItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="transaction-history-page">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h2>
        
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'sales'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="sales-history-tab"
          >
            Sales ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'expenses'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="expenses-history-tab"
          >
            Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'investments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="investments-history-tab"
          >
            Investments ({investments.length})
          </button>
        </div>

        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shoot ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{sale.shoot_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.shoot_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.customer_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(sale.total_amount_inr)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.received_by}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(sale, 'sale')}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && (
              <div className="text-center py-12 text-gray-500">No sales recorded yet</div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.expense_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{expense.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{formatCurrency(expense.amount_inr)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.paid_by}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(expense, 'expense')}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && (
              <div className="text-center py-12 text-gray-500">No expenses recorded yet</div>
            )}
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investments.map((investment) => (
                  <tr key={investment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{investment.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{investment.partner_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{formatCurrency(investment.amount_inr)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{investment.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(investment, 'investment')}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {investments.length === 0 && (
              <div className="text-center py-12 text-gray-500">No investments recorded yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Reports Page
function Reports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const monthNum = selectedMonth ? parseInt(selectedMonth) : null;
      const url = monthNum 
        ? `${BACKEND_URL}/api/reports/yearly?year=${selectedYear}&month=${monthNum}`
        : `${BACKEND_URL}/api/reports/yearly?year=${selectedYear}`;
      
      const response = await axios.get(url, { withCredentials: true });
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMonthName = (monthStr) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNum = parseInt(monthStr.split('-')[1]);
    return months[monthNum - 1];
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);
  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Financial Reports</h2>
          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="year-selector"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="month-selector"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Monthly Financial Data Table */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {selectedMonth ? `${months[parseInt(selectedMonth)].label} ${selectedYear}` : `Year ${selectedYear}`} - Financial Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.monthly_data.map((data, idx) => {
                      const expensePercent = data.revenue > 0 ? ((data.expenses / data.revenue) * 100).toFixed(2) : 0;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getMonthName(data.month)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{formatCurrency(data.revenue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{formatCurrency(data.expenses)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">{expensePercent}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">{formatCurrency(data.profit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Partner Payback Table */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Partner Payback Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Share</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.partner_summary.map((partner, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.partner_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">{formatCurrency(partner.total_share)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{formatCurrency(partner.total_paid)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${partner.total_due >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                          {formatCurrency(partner.total_due)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">No data available</div>
        )}
      </div>
    </div>
  );
}

// Partners Management Page
function PartnersManagement() {
  const [partners, setPartners] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [shares, setShares] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/partners`, { withCredentials: true });
      setPartners(response.data);
      
      // Initialize shares state
      const sharesObj = {};
      response.data.forEach(p => {
        sharesObj[p.id] = p.share_percentage;
      });
      setShares(sharesObj);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handleUpdateShares = async () => {
    setLoading(true);
    
    const sharesArray = Object.keys(shares).map(partnerId => ({
      partner_id: partnerId,
      share_percentage: parseFloat(shares[partnerId])
    }));

    try {
      await axios.put(`${BACKEND_URL}/api/partners/shares`, 
        { shares: sharesArray },
        { withCredentials: true }
      );
      alert('Partner shares updated successfully!');
      setEditMode(false);
      fetchPartners();
    } catch (error) {
      console.error('Error updating shares:', error);
      alert(error.response?.data?.detail || 'Failed to update shares');
    } finally {
      setLoading(false);
    }
  };

  const handleShareChange = (partnerId, value) => {
    setShares(prev => ({
      ...prev,
      [partnerId]: value
    }));
  };

  const totalShares = Object.values(shares).reduce((sum, val) => sum + parseFloat(val || 0), 0);

  return (
    <div className="space-y-6" data-testid="partners-page">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Partners Management</h2>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              data-testid="edit-shares-button"
            >
              Edit Shares
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditMode(false);
                  fetchPartners();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateShares}
                disabled={loading || Math.abs(totalShares - 100) > 0.01}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                data-testid="save-shares-button"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital Invested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(partner.capital_invested || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={shares[partner.id] || 0}
                        onChange={(e) => handleShareChange(partner.id, e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        data-testid={`share-input-${partner.name}`}
                      />
                    ) : (
                      <span className="font-semibold">{partner.share_percentage.toFixed(2)}</span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-gray-100 font-bold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(partners.reduce((sum, p) => sum + (p.capital_invested || 0), 0))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {partners.reduce((sum, p) => sum + p.share_percentage, 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {editMode && (
          <div className="mt-6 p-4 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className={`text-lg font-bold ${Math.abs(totalShares - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {totalShares.toFixed(2)}%
              </span>
            </div>
            {Math.abs(totalShares - 100) > 0.01 && (
              <p className="text-sm text-red-600 mt-2">⚠️ Total must equal 100%</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Layout wrapper
function AppLayout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Record Transaction', path: '/record-transaction', icon: '➕' },
    { name: 'History', path: '/history', icon: '📝' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Partners', path: '/partners', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Finance Tracker</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Hi, {user?.name}</span>
              <button
                onClick={onLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
                data-testid="logout-button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <aside className="w-64 bg-white rounded-lg shadow-md p-4 h-fit sticky top-8">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingSession, setProcessingSession] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check for session_id in URL fragment
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      setProcessingSession(true);
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      
      try {
        await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          }
        );
        
        // Clear hash
        window.history.replaceState(null, '', window.location.pathname);
        
        // Fetch user
        const userRes = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(userRes.data);
      } catch (error) {
        console.error('Session creation error:', error);
      } finally {
        setProcessingSession(false);
        setLoading(false);
      }
    } else {
      // Check existing session
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading || processingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loader mx-auto mb-4"></div>
          <p className="text-gray-600">
            {processingSession ? 'Completing sign in...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          <>
            <Route path="*" element={<LoginPage />} />
          </>
        ) : (
          <>
            <Route path="/dashboard" element={
              <AppLayout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </AppLayout>
            } />
            <Route path="/record-transaction" element={
              <AppLayout user={user} onLogout={handleLogout}>
                <RecordTransaction user={user} />
              </AppLayout>
            } />
            <Route path="/history" element={
              <AppLayout user={user} onLogout={handleLogout}>
                <TransactionHistory />
              </AppLayout>
            } />
            <Route path="/reports" element={
              <AppLayout user={user} onLogout={handleLogout}>
                <Reports />
              </AppLayout>
            } />
            <Route path="/partners" element={
              <AppLayout user={user} onLogout={handleLogout}>
                <PartnersManagement />
              </AppLayout>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
