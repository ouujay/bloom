# Doctor Portal Frontend - Claude Code Implementation

## FILE STRUCTURE

```
frontend/src/
├── pages/
│   └── doctor/
│       ├── DoctorLogin.jsx
│       ├── DoctorSignup.jsx
│       ├── DoctorDashboard.jsx
│       └── ReportDetail.jsx
├── components/
│   └── doctor/
│       ├── DoctorLayout.jsx
│       ├── ReportCard.jsx
│       └── UrgencyBadge.jsx
└── services/
    └── doctorApi.js
```

---

## FILE 1: Doctor API Service

**File: `frontend/src/services/doctorApi.js`**

```javascript
import api from './api';  // Your existing axios instance

export const doctorApi = {
  // Get dashboard stats
  getStats: () => api.get('/health/doctor/stats/'),
  
  // Get reports list
  getReports: (urgency = null, showAddressed = false) => {
    let url = '/health/doctor/reports/';
    const params = new URLSearchParams();
    if (urgency && urgency !== 'all') params.append('urgency', urgency);
    if (showAddressed) params.append('addressed', 'true');
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
  
  // Get single report detail
  getReport: (reportId) => api.get(`/health/doctor/reports/${reportId}/`),
  
  // Mark report as addressed
  addressReport: (reportId, notes = '') => 
    api.post(`/health/doctor/reports/${reportId}/address/`, { notes }),
  
  // Doctor signup
  signup: (data) => api.post('/health/doctor/signup/', data),
  
  // Doctor login uses same auth endpoint
  login: (email, password) => api.post('/users/login/', { email, password }),
};

export default doctorApi;
```

---

## FILE 2: Urgency Badge Component

**File: `frontend/src/components/doctor/UrgencyBadge.jsx`**

```jsx
import React from 'react';

const urgencyConfig = {
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: '🔴',
    label: 'CRITICAL'
  },
  urgent: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: '🟠',
    label: 'URGENT'
  },
  moderate: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: '🟡',
    label: 'MODERATE'
  },
  normal: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: '🟢',
    label: 'NORMAL'
  }
};

export default function UrgencyBadge({ level, showLabel = true, size = 'md' }) {
  const config = urgencyConfig[level] || urgencyConfig.normal;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full font-medium
      ${config.bg} ${config.text} ${config.border} border
      ${sizeClasses[size]}
    `}>
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export { urgencyConfig };
```

---

## FILE 3: Report Card Component

**File: `frontend/src/components/doctor/ReportCard.jsx`**

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import UrgencyBadge from './UrgencyBadge';

export default function ReportCard({ report }) {
  const navigate = useNavigate();
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div
      onClick={() => navigate(`/doctor/report/${report.id}`)}
      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <UrgencyBadge level={report.urgency_level} />
          <span className="font-semibold text-gray-900">
            {report.patient_name}
          </span>
          <span className="text-gray-500 text-sm">
            Week {report.pregnancy_week}
          </span>
        </div>
        <span className="text-gray-400 text-sm">
          {formatDate(report.created_at)}
        </span>
      </div>
      
      {/* AI Summary */}
      <p className="text-gray-700 mb-3">
        {report.ai_summary}
      </p>
      
      {/* Symptoms Tags */}
      {report.symptoms && report.symptoms.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {report.symptoms.map((symptom, idx) => (
            <span
              key={idx}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
            >
              {symptom}
            </span>
          ))}
        </div>
      )}
      
      {/* Patient Contact */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        {report.patient_phone && (
          <span className="flex items-center gap-1">
            📞 {report.patient_phone}
          </span>
        )}
        {report.patient_location && (
          <span className="flex items-center gap-1">
            📍 {report.patient_location}
          </span>
        )}
      </div>
      
      {/* Addressed indicator */}
      {report.is_addressed && (
        <div className="mt-2 text-green-600 text-sm flex items-center gap-1">
          ✓ Addressed
        </div>
      )}
    </div>
  );
}
```

---

## FILE 4: Doctor Layout

**File: `frontend/src/components/doctor/DoctorLayout.jsx`**

```jsx
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function DoctorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/doctor/login');
  };
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/doctor" className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <span className="font-bold text-xl text-gray-800">
                Iyabot Doctor Portal
              </span>
            </Link>
            
            {/* Right side */}
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Dr. {user.last_name || 'Doctor'}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## FILE 5: Doctor Login Page

**File: `frontend/src/pages/doctor/DoctorLogin.jsx`**

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import doctorApi from '../../services/doctorApi';

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await doctorApi.login(email, password);
      const { token, user } = response.data;
      
      // Check if user is a verified doctor
      if (user.user_type !== 'doctor') {
        setError('This portal is for doctors only.');
        setLoading(false);
        return;
      }
      
      if (!user.is_verified_doctor) {
        setError('Your account is pending verification. Please wait for admin approval.');
        setLoading(false);
        return;
      }
      
      // Save auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect to dashboard
      navigate('/doctor');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl">🏥</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            Doctor Portal
          </h1>
          <p className="text-gray-500 mt-1">
            Sign in to view patient reports
          </p>
        </div>
        
        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="doctor@hospital.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/doctor/signup" className="text-blue-600 hover:underline">
            Register as Doctor
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## FILE 6: Doctor Signup Page

**File: `frontend/src/pages/doctor/DoctorSignup.jsx`**

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import doctorApi from '../../services/doctorApi';

export default function DoctorSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    medical_license: '',
    specialization: '',
    hospital_name: '',
  });
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await doctorApi.signup(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
    
    setLoading(false);
  };
  
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <span className="text-5xl">✅</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            Registration Submitted!
          </h1>
          <p className="text-gray-600 mt-2">
            Your account is pending verification. You will be notified once an admin approves your registration.
          </p>
          <Link
            to="/doctor/login"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl">🏥</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            Doctor Registration
          </h1>
          <p className="text-gray-500 mt-1">
            Create an account to access patient reports
          </p>
        </div>
        
        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+234..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <hr className="my-4" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical License Number
            </label>
            <input
              type="text"
              name="medical_license"
              value={form.medical_license}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="MDCN/..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <select
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select specialization</option>
              <option value="obgyn">Obstetrics & Gynecology</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="general">General Practice</option>
              <option value="midwife">Midwifery</option>
              <option value="nurse">Nursing</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital/Clinic Name
            </label>
            <input
              type="text"
              name="hospital_name"
              value={form.hospital_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Register'}
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/doctor/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## FILE 7: Doctor Dashboard Page

**File: `frontend/src/pages/doctor/DoctorDashboard.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import doctorApi from '../../services/doctorApi';
import ReportCard from '../../components/doctor/ReportCard';
import { urgencyConfig } from '../../components/doctor/UrgencyBadge';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    critical: 0,
    urgent: 0,
    moderate: 0,
    normal: 0
  });
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAddressed, setShowAddressed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    loadData();
  }, [filter, showAddressed]);
  
  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [statsRes, reportsRes] = await Promise.all([
        doctorApi.getStats(),
        doctorApi.getReports(filter, showAddressed)
      ]);
      
      setStats(statsRes.data);
      setReports(reportsRes.data);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    }
    
    setLoading(false);
  };
  
  const totalPending = stats.critical + stats.urgent + stats.moderate + stats.normal;
  
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">
          {totalPending} reports pending review
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(urgencyConfig).map(([level, config]) => (
          <button
            key={level}
            onClick={() => setFilter(filter === level ? 'all' : level)}
            className={`
              p-4 rounded-xl text-left transition-all
              ${filter === level 
                ? `${config.bg} ring-2 ring-offset-2 ring-${level === 'critical' ? 'red' : level === 'urgent' ? 'orange' : level === 'moderate' ? 'yellow' : 'green'}-400`
                : 'bg-white hover:shadow-md'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{config.icon}</span>
              <span className={`text-3xl font-bold ${config.text}`}>
                {stats[level]}
              </span>
            </div>
            <p className={`mt-2 font-medium ${filter === level ? config.text : 'text-gray-600'}`}>
              {config.label}
            </p>
          </button>
        ))}
      </div>
      
      {/* Reports Section */}
      <div className="bg-white rounded-xl shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            {filter === 'all' ? 'All Reports' : `${urgencyConfig[filter]?.label} Reports`}
          </h2>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showAddressed}
                onChange={(e) => setShowAddressed(e.target.checked)}
                className="rounded"
              />
              Show addressed
            </label>
            
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-blue-600 text-sm hover:underline"
              >
                Clear filter
              </button>
            )}
            
            <button
              onClick={loadData}
              className="text-gray-500 hover:text-gray-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {/* Reports List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">✅</span>
              <p className="text-gray-500 mt-2">
                No reports to show
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## FILE 8: Report Detail Page

**File: `frontend/src/pages/doctor/ReportDetail.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import doctorApi from '../../services/doctorApi';
import UrgencyBadge from '../../components/doctor/UrgencyBadge';

export default function ReportDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [notes, setNotes] = useState('');
  const [addressing, setAddressing] = useState(false);
  const [addressed, setAddressed] = useState(false);
  
  useEffect(() => {
    loadReport();
  }, [reportId]);
  
  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await doctorApi.getReport(reportId);
      setData(response.data);
      setAddressed(response.data.report.is_addressed);
    } catch (err) {
      setError('Failed to load report');
      console.error(err);
    }
    setLoading(false);
  };
  
  const handleAddress = async () => {
    setAddressing(true);
    try {
      await doctorApi.addressReport(reportId, notes);
      setAddressed(true);
    } catch (err) {
      alert('Failed to mark as addressed');
    }
    setAddressing(false);
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading report...</p>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Report not found'}</p>
        <button
          onClick={() => navigate('/doctor')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  const { report, patient, pregnancy, conversation_transcript, recent_history, recent_health_logs } = data;
  
  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/doctor')}
        className="text-blue-600 hover:underline mb-4 flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <UrgencyBadge level={report.urgency_level} size="lg" />
            {addressed && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                ✓ Addressed
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {patient.name}
          </h1>
          <p className="text-gray-500">
            Week {pregnancy.current_week} • Due: {pregnancy.due_date || 'Not set'}
          </p>
        </div>
        
        <p className="text-gray-400 text-sm">
          {formatDate(report.created_at)}
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="col-span-2 space-y-6">
          {/* AI Assessment */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4">
              AI Assessment
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">
                {report.ai_summary}
              </p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Analysis
              </h3>
              <p className="text-gray-700">
                {report.ai_assessment}
              </p>
            </div>
            
            {/* Symptoms */}
            {report.symptoms && report.symptoms.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Reported Symptoms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.symptoms.map((symptom, idx) => (
                    <span
                      key={idx}
                      className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* AI Recommendation */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                AI Recommendation to Patient
              </h3>
              <p className="text-blue-700 text-sm">
                {report.ai_recommendation}
              </p>
            </div>
          </div>
          
          {/* Conversation Transcript */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4">
              Full Conversation
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {conversation_transcript}
              </pre>
            </div>
          </div>
          
          {/* Doctor Action */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4">
              Doctor Notes & Action
            </h2>
            
            {addressed ? (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-700 font-medium">
                  ✓ This report has been addressed
                </p>
                {report.doctor_notes && (
                  <p className="text-gray-600 mt-2 text-sm">
                    Notes: {report.doctor_notes}
                  </p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this case (optional)..."
                  className="w-full border rounded-lg p-3 mb-4 h-24 resize-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  onClick={handleAddress}
                  disabled={addressing}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {addressing ? 'Saving...' : '✓ Mark as Addressed'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Sidebar - Right column */}
        <div className="space-y-6">
          {/* Patient Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">
              Patient Info
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <a
                  href={`tel:${patient.phone}`}
                  className="text-blue-600 font-medium hover:underline"
                >
                  📞 {patient.phone || 'Not provided'}
                </a>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-800">
                  📍 {patient.location || 'Not provided'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-800">
                  {patient.email || 'Not provided'}
                </p>
              </div>
              
              {patient.emergency_contact && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500 mb-1">Emergency Contact</p>
                  <p className="font-medium text-gray-800">
                    {patient.emergency_contact.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {patient.emergency_contact.relationship}
                  </p>
                  <a
                    href={`tel:${patient.emergency_contact.phone}`}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    📞 {patient.emergency_contact.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent History */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">
              Recent History
            </h2>
            
            {recent_history && recent_history.length > 0 ? (
              <div className="space-y-3">
                {recent_history.slice(0, 10).map((event, idx) => (
                  <div key={idx} className="text-sm border-l-2 border-gray-200 pl-3">
                    <p className="text-gray-800">{event.title}</p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent history</p>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">
              Quick Actions
            </h2>
            
            <div className="space-y-2">
              <a
                href={`tel:${patient.phone}`}
                className="block w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-center hover:bg-blue-100"
              >
                📞 Call Patient
              </a>
              
              {patient.emergency_contact && (
                <a
                  href={`tel:${patient.emergency_contact.phone}`}
                  className="block w-full bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-center hover:bg-orange-100"
                >
                  📞 Call Emergency Contact
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## FILE 9: Add Routes to App.jsx

**File: `frontend/src/App.jsx`**

Add these imports and routes:

```jsx
// Add imports
import DoctorLayout from './components/doctor/DoctorLayout';
import DoctorLogin from './pages/doctor/DoctorLogin';
import DoctorSignup from './pages/doctor/DoctorSignup';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ReportDetail from './pages/doctor/ReportDetail';

// Add routes inside your Routes component
<Route path="/doctor/login" element={<DoctorLogin />} />
<Route path="/doctor/signup" element={<DoctorSignup />} />
<Route path="/doctor" element={<DoctorLayout />}>
  <Route index element={<DoctorDashboard />} />
  <Route path="report/:reportId" element={<ReportDetail />} />
</Route>
```

---

## SUMMARY: Tell Claude Code This

> "Create the Doctor Portal frontend:
> 1. Create `frontend/src/services/doctorApi.js` - API service for doctor endpoints
> 2. Create `frontend/src/components/doctor/UrgencyBadge.jsx` - urgency level badge component
> 3. Create `frontend/src/components/doctor/ReportCard.jsx` - report card for list view
> 4. Create `frontend/src/components/doctor/DoctorLayout.jsx` - layout with nav bar
> 5. Create `frontend/src/pages/doctor/DoctorLogin.jsx` - doctor login page
> 6. Create `frontend/src/pages/doctor/DoctorSignup.jsx` - doctor registration page
> 7. Create `frontend/src/pages/doctor/DoctorDashboard.jsx` - main dashboard with stats and reports list
> 8. Create `frontend/src/pages/doctor/ReportDetail.jsx` - full report detail view with patient info
> 9. Add the doctor routes to App.jsx"
