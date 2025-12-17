import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Input from '../../components/common/Input';
import { useState } from 'react';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';

export default function AdminUsers() {
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/auth/admin/users/').then(res => res.data.data),
  });

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Users</h1>
          <p className="text-dark-600">Manage platform users ({users?.length || 0} total)</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-3 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 bg-white"
        />
      </div>

      {/* Users table */}
      <Card padding="none">
        <table className="w-full">
          <thead className="bg-cream-100 border-b border-cream-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Week</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Progress</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Tokens</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Joined</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-cream-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-dark-900">{user.name}</p>
                  <p className="text-sm text-dark-500">{user.email}</p>
                  {user.phone && <p className="text-xs text-dark-400">{user.phone}</p>}
                </td>
                <td className="px-4 py-3 text-dark-900">Week {user.current_week || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-bloom-500 rounded-full"
                        style={{ width: `${user.progress_percentage || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-dark-500">{user.progress_percentage || 0}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-dark-900">{user.token_balance || 0}</span>
                  <span className="text-dark-400 text-sm"> tokens</span>
                </td>
                <td className="px-4 py-3 text-sm text-dark-500">
                  {dayjs(user.created_at).format('MMM D, YYYY')}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.onboarding_complete
                      ? 'bg-bloom-100 text-bloom-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.onboarding_complete ? 'Active' : 'Onboarding'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <p className="text-center text-dark-500 py-8">No users found</p>
        )}
      </Card>
    </div>
  );
}
