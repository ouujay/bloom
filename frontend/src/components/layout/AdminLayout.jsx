import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  LogOut,
  Gift,
  Coins
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/tokens', icon: Coins, label: 'Token Pool' },
  { to: '/admin/donations', icon: Gift, label: 'Donations' },
  { to: '/admin/withdrawals', icon: CreditCard, label: 'Withdrawals' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-dark-900 text-white">
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Bloom" className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold">Bloom</h1>
              <p className="text-xs text-dark-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-bloom-500 text-white'
                    : 'text-dark-500 hover:bg-dark-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-dark-500">Admin</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-dark-500 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
