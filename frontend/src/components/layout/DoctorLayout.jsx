import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Stethoscope
} from 'lucide-react';

const navItems = [
  { to: '/doctor', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/doctor/reports', icon: FileText, label: 'All Reports' },
];

export default function DoctorLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-bloom-700 text-white">
        <div className="p-4 border-b border-bloom-600">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6" />
            <h1 className="text-xl font-bold">Bloom Doctor</h1>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-bloom-600 text-white'
                    : 'text-bloom-100 hover:bg-bloom-600/50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-bloom-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dr. {user?.last_name || user?.first_name}</p>
              <p className="text-xs text-bloom-200">{user?.specialization || 'Doctor'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-bloom-200 hover:text-white hover:bg-bloom-600 rounded-lg"
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
