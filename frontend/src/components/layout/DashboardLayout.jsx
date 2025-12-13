import { useState } from 'react';
import { Outlet, NavLink, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  BookOpen,
  TrendingUp,
  Wallet,
  User,
  AlertCircle,
  MessageCircle,
  Users,
  LogOut,
  MoreHorizontal,
  X,
  FileText
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { childId } = useParams();
  const [showMore, setShowMore] = useState(false);

  // Primary nav items - always visible, changes based on context
  const primaryNavItems = childId ? [
    { to: `/child/${childId}`, icon: Home, label: 'Home', end: true },
    { to: `/child/${childId}/today`, icon: BookOpen, label: 'Today' },
    { to: `/child/${childId}/progress`, icon: TrendingUp, label: 'Progress' },
    { to: `/child/${childId}/chat`, icon: MessageCircle, label: 'Chat' },
  ] : [
    { to: '/children', icon: Users, label: 'Children', end: true },
  ];

  // Secondary nav items - always accessible via "More" menu
  const moreNavItems = [
    { to: '/children', icon: Users, label: 'My Children' },
    ...(childId ? [{ to: `/child/${childId}/passport`, icon: FileText, label: 'Life Passport' }] : []),
    { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/dashboard/profile', icon: User, label: 'Profile' },
    { to: '/dashboard/emergency', icon: AlertCircle, label: 'Emergency', danger: true },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Floating Navigation - Desktop */}
      <nav className="fixed top-6 left-0 right-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            {/* Logo - in pill */}
            <Link to="/children" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg shadow-dark-900/5">
              <img src="/logo.png" alt="Bloom" className="w-10 h-10 object-contain" />
              <span className="text-lg font-semibold text-dark-900">Bloom</span>
            </Link>

            {/* Nav Links - each in pill */}
            <div className="flex items-center gap-2">
              {primaryNavItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all ${
                      isActive
                        ? 'bg-primary-400 text-white shadow-primary-400/25'
                        : 'bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white hover:text-dark-900'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Right side - More menu & Emergency */}
            <div className="flex items-center gap-2">
              {/* Emergency button - always visible */}
              <NavLink
                to="/dashboard/emergency"
                className={({ isActive }) =>
                  `flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg transition-all ${
                    isActive
                      ? 'bg-red-500 text-white shadow-red-500/25'
                      : 'bg-red-100 hover:bg-red-200 text-red-600 shadow-red-900/5'
                  }`
                }
              >
                <AlertCircle className="w-4 h-4" />
                Emergency
              </NavLink>

              {/* More Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all ${
                    showMore
                      ? 'bg-dark-800 text-white'
                      : 'bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white hover:text-dark-900'
                  }`}
                >
                  {showMore ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
                </button>

                {/* Dropdown */}
                {showMore && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMore(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-dark-900/10 border border-cream-200 overflow-hidden z-50">
                      <div className="p-2">
                        {/* User Info */}
                        <div className="px-3 py-2 mb-2 border-b border-cream-200">
                          <p className="text-sm font-medium text-dark-800">{user?.name}</p>
                          <p className="text-xs text-dark-500">{user?.email}</p>
                        </div>

                        {/* Nav Items */}
                        {moreNavItems.map(item => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setShowMore(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                item.danger
                                  ? isActive
                                    ? 'bg-red-100 text-red-600'
                                    : 'text-red-600 hover:bg-red-50'
                                  : isActive
                                    ? 'bg-primary-100 text-primary-600'
                                    : 'text-dark-700 hover:bg-cream-100'
                              }`
                            }
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </NavLink>
                        ))}

                        {/* Logout */}
                        <button
                          onClick={() => {
                            setShowMore(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-dark-500 hover:bg-cream-100 transition-all mt-2 border-t border-cream-200 pt-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 pt-24 md:pt-28 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-dark-900/10 px-2 py-2">
          <div className="flex justify-around">
            {primaryNavItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-dark-500 hover:text-dark-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </NavLink>
            ))}
            {/* Wallet - always visible on mobile */}
            <NavLink
              to="/dashboard/wallet"
              className={({ isActive }) =>
                `flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-dark-500 hover:text-dark-700'
                }`
              }
            >
              <Wallet className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Wallet</span>
            </NavLink>
            {/* Profile - always visible on mobile */}
            <NavLink
              to="/dashboard/profile"
              className={({ isActive }) =>
                `flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-dark-500 hover:text-dark-700'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Profile</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Mobile header - simple top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-cream-100/95 backdrop-blur-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/children" className="flex items-center gap-2">
            <img src="/logo.png" alt="Bloom" className="w-8 h-8 object-contain" />
            <span className="text-lg font-semibold text-dark-900">Bloom</span>
          </Link>
          <div className="flex items-center gap-2">
            <NavLink
              to="/dashboard/emergency"
              className={({ isActive }) =>
                `p-2 rounded-full transition-all ${
                  isActive ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                }`
              }
            >
              <AlertCircle className="w-5 h-5" />
            </NavLink>
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 bg-white/80 text-dark-500 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile More Menu Overlay */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark-900/50"
            onClick={() => setShowMore(false)}
          />

          {/* Menu Panel */}
          <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-2xl">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-dark-900">Menu</h2>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-2 hover:bg-cream-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-dark-500" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-cream-100 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">{user?.name}</p>
                    <p className="text-sm text-dark-500">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Nav Items */}
              <div className="space-y-1">
                {moreNavItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        item.danger
                          ? isActive
                            ? 'bg-red-100 text-red-600'
                            : 'text-red-600 hover:bg-red-50'
                          : isActive
                            ? 'bg-primary-100 text-primary-600'
                            : 'text-dark-700 hover:bg-cream-100'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
              </div>

              {/* Logout */}
              <button
                onClick={() => {
                  setShowMore(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-dark-500 hover:bg-cream-100 transition-all mt-6 border-t border-cream-200 pt-6"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
