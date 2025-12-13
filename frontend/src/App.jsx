import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import DoctorLayout from './components/layout/DoctorLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Voice-based onboarding
import VoiceOnboarding from './pages/VoiceOnboarding';

// Children management
import Children from './pages/Children';
import AddChild from './pages/AddChild';

// Mother pages (now child-specific)
import Dashboard from './pages/mother/Dashboard';
import DailyProgram from './pages/mother/DailyProgram';
import Lesson from './pages/mother/Lesson';
import Progress from './pages/mother/Progress';
import Wallet from './pages/mother/Wallet';
import Withdraw from './pages/mother/Withdraw';
import Profile from './pages/mother/Profile';
import Emergency from './pages/mother/Emergency';
import KickCounter from './pages/mother/KickCounter';
import Appointments from './pages/mother/Appointments';
import HealthCheckin from './pages/mother/HealthCheckin';
import Chat from './pages/mother/Chat';
import Videos from './pages/mother/Videos';
import VideoDetail from './pages/mother/VideoDetail';
import PregnancyTimeline from './pages/mother/PregnancyTimeline';
import Passport from './pages/mother/Passport';

// Public pages
import PassportView from './pages/PassportView';
import Donate from './pages/Donate';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminWithdrawals from './pages/admin/Withdrawals';
import AdminUsers from './pages/admin/Users';
import TokenAdmin from './pages/admin/TokenAdmin';

// Doctor pages
import DoctorLogin from './pages/doctor/Login';
import DoctorSignup from './pages/doctor/Signup';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorReports from './pages/doctor/Reports';
import DoctorReportDetail from './pages/doctor/ReportDetail';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

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

            {/* Public passport view (shared link) */}
            <Route path="/passport/view/:shareCode" element={<PassportView />} />

            {/* Public donation page */}
            <Route path="/donate" element={<Donate />} />

            {/* Voice-based onboarding (authenticated but not complete) */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <VoiceOnboarding />
              </ProtectedRoute>
            } />

            {/* Children management */}
            <Route path="/children" element={
              <ProtectedRoute requireOnboarding>
                <Children />
              </ProtectedRoute>
            } />
            <Route path="/children/add" element={
              <ProtectedRoute requireOnboarding>
                <AddChild />
              </ProtectedRoute>
            } />

            {/* Child-specific dashboard routes */}
            <Route path="/child/:childId" element={
              <ProtectedRoute requireOnboarding>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="today" element={<DailyProgram />} />
              <Route path="lesson/:stageType/:stageWeek/:day" element={<Lesson />} />
              <Route path="progress" element={<Progress />} />
              <Route path="kicks" element={<KickCounter />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="checkin" element={<HealthCheckin />} />
              <Route path="chat" element={<Chat />} />
              <Route path="videos" element={<Videos />} />
              <Route path="video/:videoId" element={<VideoDetail />} />
              <Route path="timeline" element={<PregnancyTimeline />} />
              <Route path="passport" element={<Passport />} />
            </Route>

            {/* User-level routes (not child-specific) */}
            <Route path="/dashboard" element={
              <ProtectedRoute requireOnboarding>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/children" />} />
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
              <Route path="users" element={<AdminUsers />} />
              <Route path="tokens" element={<TokenAdmin />} />
            </Route>

            {/* Doctor routes - public */}
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/signup" element={<DoctorSignup />} />

            {/* Doctor routes - protected */}
            <Route path="/doctor" element={
              <ProtectedRoute requireDoctor>
                <DoctorLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DoctorDashboard />} />
              <Route path="reports" element={<DoctorReports />} />
              <Route path="reports/:reportId" element={<DoctorReportDetail />} />
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
