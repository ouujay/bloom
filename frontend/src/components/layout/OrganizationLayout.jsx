import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  UserPlus,
  LogOut,
  Building2
} from 'lucide-react';

const navItems = [
  { to: '/organization', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/organization/patients', icon: Users, label: 'Patients' },
  { to: '/organization/reports', icon: FileText, label: 'Reports' },
  { to: '/organization/invitations', icon: UserPlus, label: 'Invitations' },
];

export default function OrganizationLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-primary-700 text-white">
        <div className="p-4 border-b border-primary-600">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            <h1 className="text-xl font-bold">Bloom Health</h1>
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
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-100 hover:bg-primary-600/50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-primary-200">{user?.hospital_name || 'Organization Staff'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-primary-200 hover:text-white hover:bg-primary-600 rounded-lg"
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
