# Developer B - Frontend Pipeline

**Stack:** Vite + React (Frontend) → Django REST API (Backend)

---

## Project Structure Overview

```
mamalert/
├── backend/                 # Django (Dev A sets this up)
│   ├── mamalert/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── api/
│   │   ├── views.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/                # React (Dev B owns this)
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   ├── api/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── context/
    │   └── utils/
    ├── public/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env
```

---

## Step 1: Setup Frontend Project

```bash
# Create React project with Vite
npm create vite@latest frontend -- --template react
cd frontend

# Install dependencies
npm install

# Core packages
npm install react-router-dom          # Routing
npm install axios                     # API calls
npm install @tanstack/react-query     # Data fetching/caching

# UI packages
npm install tailwindcss postcss autoprefixer
npm install react-hot-toast           # Notifications
npm install lucide-react              # Icons
npm install dayjs                     # Date formatting
npm install clsx                      # Conditional classes

# Initialize Tailwind
npx tailwindcss init -p
```

---

## Step 2: Configure Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to Django during development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## Step 3: Environment Variables

```bash
# frontend/.env.development
VITE_API_URL=http://localhost:8000/api

# frontend/.env.production
VITE_API_URL=https://api.mamalert.com/api
```

---

## Step 4: Tailwind Config

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        bloom: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        }
      }
    }
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
}
```

---

## Step 5: Folder Structure

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Routes setup
├── index.css                   # Global styles
│
├── api/                        # API layer
│   ├── axios.js               # Axios instance
│   ├── auth.js                # Auth endpoints
│   ├── daily.js               # Daily program endpoints
│   ├── health.js              # Health log endpoints
│   ├── tokens.js              # Token endpoints
│   └── withdrawals.js         # Withdrawal endpoints
│
├── context/                    # Global state
│   └── AuthContext.jsx        # Auth state
│
├── hooks/                      # Custom hooks
│   ├── useAuth.js
│   ├── useDailyProgram.js
│   └── useTokens.js
│
├── components/                 # Reusable components
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Loader.jsx
│   │   └── ProgressBar.jsx
│   │
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MobileNav.jsx
│   │   └── DashboardLayout.jsx
│   │
│   ├── daily/
│   │   ├── DailyCard.jsx
│   │   ├── LessonView.jsx
│   │   ├── TaskList.jsx
│   │   ├── HealthCheckin.jsx
│   │   ├── WeekProgress.jsx
│   │   └── StreakBadge.jsx
│   │
│   ├── health/
│   │   ├── MoodSelector.jsx
│   │   ├── SymptomPicker.jsx
│   │   ├── KickCounter.jsx
│   │   └── WeightInput.jsx
│   │
│   └── wallet/
│       ├── TokenBalance.jsx
│       ├── TransactionList.jsx
│       └── WithdrawalForm.jsx
│
├── pages/                      # Page components
│   ├── Landing.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── Onboarding.jsx
│   │
│   ├── mother/
│   │   ├── Dashboard.jsx
│   │   ├── DailyProgram.jsx
│   │   ├── Lesson.jsx
│   │   ├── HealthLog.jsx
│   │   ├── Progress.jsx
│   │   ├── Wallet.jsx
│   │   ├── Withdraw.jsx
│   │   ├── Profile.jsx
│   │   └── Emergency.jsx
│   │
│   └── admin/
│       ├── Dashboard.jsx
│       ├── Withdrawals.jsx
│       └── Users.jsx
│
└── utils/                      # Helper functions
    ├── formatters.js          # Format dates, currency
    ├── validators.js          # Form validation
    └── constants.js           # App constants
```

---

## Step 6: API Layer Setup

### Axios Instance

```javascript
// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Auth API

```javascript
// src/api/auth.js
import api from './axios';

export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login/', { email, password }),
  
  signup: (data) => 
    api.post('/auth/signup/', data),
  
  getMe: () => 
    api.get('/auth/me/'),
  
  updateProfile: (data) => 
    api.patch('/auth/profile/', data),
  
  logout: () => 
    api.post('/auth/logout/'),
};
```

### Daily Program API

```javascript
// src/api/daily.js
import api from './axios';

export const dailyAPI = {
  // Get today's program
  getToday: () => 
    api.get('/daily/today/'),
  
  // Get specific day
  getDay: (week, day) => 
    api.get(`/daily/week/${week}/day/${day}/`),
  
  // Mark lesson as read
  completeLesson: (dayId) => 
    api.post(`/daily/${dayId}/complete-lesson/`),
  
  // Complete a task
  completeTask: (dayId, taskId) => 
    api.post(`/daily/${dayId}/complete-task/`, { task_id: taskId }),
  
  // Submit health check-in
  submitCheckin: (dayId, data) => 
    api.post(`/daily/${dayId}/checkin/`, data),
  
  // Get week progress
  getWeekProgress: (week) => 
    api.get(`/daily/week/${week}/progress/`),
  
  // Get missed days that need catch-up
  getMissedDays: () => 
    api.get('/daily/missed/'),
  
  // Submit weekly quiz
  submitQuiz: (week, answers) => 
    api.post(`/daily/week/${week}/quiz/`, { answers }),
  
  // Get user's overall progress
  getProgress: () => 
    api.get('/daily/progress/'),
};
```

### Health Log API

```javascript
// src/api/health.js
import api from './axios';

export const healthAPI = {
  // Submit daily health log
  logHealth: (data) => 
    api.post('/health/log/', data),
  
  // Get health history
  getHistory: (startDate, endDate) => 
    api.get('/health/history/', { params: { start: startDate, end: endDate } }),
  
  // Get health profile
  getProfile: () => 
    api.get('/health/profile/'),
  
  // Update health profile
  updateProfile: (data) => 
    api.patch('/health/profile/', data),
  
  // Log kick count
  logKicks: (count, duration) => 
    api.post('/health/kicks/', { count, duration_minutes: duration }),
  
  // Get appointments
  getAppointments: () => 
    api.get('/health/appointments/'),
  
  // Add appointment
  addAppointment: (data) => 
    api.post('/health/appointments/', data),
  
  // Log completed checkup
  logCheckup: (appointmentId, data) => 
    api.post(`/health/appointments/${appointmentId}/complete/`, data),
};
```

### Tokens API

```javascript
// src/api/tokens.js
import api from './axios';

export const tokensAPI = {
  // Get balance
  getBalance: () => 
    api.get('/tokens/balance/'),
  
  // Get transaction history
  getTransactions: (page = 1) => 
    api.get('/tokens/transactions/', { params: { page } }),
  
  // Request withdrawal
  requestWithdrawal: (data) => 
    api.post('/withdrawals/request/', data),
  
  // Get withdrawal history
  getWithdrawals: () => 
    api.get('/withdrawals/my/'),
};
```

---

## Step 7: Auth Context

```javascript
// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await authAPI.getMe();
        setUser(res.data.data);
      } catch (err) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token, user } = res.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const signup = async (data) => {
    const res = await authAPI.signup(data);
    const { token, user } = res.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout,
      updateUser,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## Step 8: App Routes

```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Onboarding from './pages/auth/Onboarding';

// Mother pages
import Dashboard from './pages/mother/Dashboard';
import DailyProgram from './pages/mother/DailyProgram';
import Lesson from './pages/mother/Lesson';
import Progress from './pages/mother/Progress';
import Wallet from './pages/mother/Wallet';
import Withdraw from './pages/mother/Withdraw';
import Profile from './pages/mother/Profile';
import Emergency from './pages/mother/Emergency';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminWithdrawals from './pages/admin/Withdrawals';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Onboarding (authenticated but not complete) */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            {/* Mother routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requireOnboarding>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="today" element={<DailyProgram />} />
              <Route path="lesson/:week/:day" element={<Lesson />} />
              <Route path="progress" element={<Progress />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="withdraw" element={<Withdraw />} />
              <Route path="profile" element={<Profile />} />
              <Route path="emergency" element={<Emergency />} />
            </Route>
            
            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

---

## Step 9: Protected Route Component

```javascript
// src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ 
  children, 
  requireOnboarding = false,
  requireAdmin = false 
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireOnboarding && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
```

---

## Step 10: Dashboard Layout

```javascript
// src/components/layout/DashboardLayout.jsx
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  Wallet, 
  User,
  AlertCircle 
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/today', icon: BookOpen, label: 'Today' },
  { to: '/dashboard/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar - desktop */}
      <header className="hidden md:block bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-primary-600">MamaAlert</h1>
            <nav className="flex gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Emergency button */}
            <NavLink
              to="/dashboard/emergency"
              className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200"
            >
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Emergency
            </NavLink>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">Week {user?.current_week}</p>
            </div>
            
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="flex justify-around py-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
```

---

## Running the Project

### Development

```bash
# Terminal 1: Run Django backend (Dev A)
cd backend
python manage.py runserver

# Terminal 2: Run React frontend (Dev B)
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Vite proxies `/api/*` to Django automatically

### Production Build

```bash
cd frontend
npm run build
# Creates dist/ folder with static files

# Option 1: Serve from Django
# Copy dist/ to Django static files

# Option 2: Deploy separately
# Deploy dist/ to Vercel, Netlify, etc.
```

---

## API Endpoints Dev B Needs

Dev A should provide these endpoints:

### Auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/signup/` | Register new user |
| POST | `/api/auth/login/` | Login |
| GET | `/api/auth/me/` | Get current user |
| PATCH | `/api/auth/profile/` | Update profile |

### Daily Program
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/daily/today/` | Get today's program |
| GET | `/api/daily/week/{week}/day/{day}/` | Get specific day |
| POST | `/api/daily/{id}/complete-lesson/` | Mark lesson done |
| POST | `/api/daily/{id}/complete-task/` | Complete task |
| POST | `/api/daily/{id}/checkin/` | Submit health check-in |
| GET | `/api/daily/missed/` | Get days needing catch-up |
| GET | `/api/daily/progress/` | Get overall progress |
| POST | `/api/daily/week/{week}/quiz/` | Submit weekly quiz |

### Health
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/health/log/` | Submit daily health log |
| GET | `/api/health/history/` | Get health history |
| GET | `/api/health/profile/` | Get health profile |
| POST | `/api/health/kicks/` | Log kick count |

### Tokens
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tokens/balance/` | Get token balance |
| GET | `/api/tokens/transactions/` | Get transactions |
| POST | `/api/withdrawals/request/` | Request withdrawal |
| GET | `/api/withdrawals/my/` | Get my withdrawals |

### Admin
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/withdrawals/` | List withdrawals |
| POST | `/api/admin/withdrawals/{id}/approve/` | Approve |
| POST | `/api/admin/withdrawals/{id}/reject/` | Reject |

---

## Dev B Checklist

### Setup
- [ ] Create Vite project
- [ ] Install dependencies
- [ ] Configure Tailwind
- [ ] Setup folder structure
- [ ] Create axios instance
- [ ] Setup AuthContext

### Core Pages
- [ ] Landing page
- [ ] Login page
- [ ] Signup page
- [ ] Onboarding flow (multi-step)

### Daily Program
- [ ] Dashboard with today's card
- [ ] Daily program page (lesson + tasks)
- [ ] Lesson view component
- [ ] Health check-in form
- [ ] Task completion UI
- [ ] Catch-up flow for missed days
- [ ] Weekly quiz

### Progress
- [ ] Week progress view
- [ ] Streak display
- [ ] Overall journey progress

### Wallet
- [ ] Token balance display
- [ ] Transaction history
- [ ] Withdrawal request form
- [ ] Withdrawal status

### Admin
- [ ] Pending withdrawals list
- [ ] Approve/reject modals

### Components
- [ ] Button, Input, Card, Modal
- [ ] Loader, ProgressBar
- [ ] MoodSelector, SymptomPicker
- [ ] Navbar, MobileNav
