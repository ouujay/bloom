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
    queryFn: () => api.get('/admin/users/').then(res => res.data.data),
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage platform users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Users table */}
      <Card padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Week</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Progress</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tokens</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-900">Week {user.current_week || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-bloom-500 rounded-full"
                        style={{ width: `${user.progress_percentage || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">{user.progress_percentage || 0}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-900">{user.token_balance || 0}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {dayjs(user.created_at).format('MMM D, YYYY')}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.onboarding_complete
                      ? 'bg-green-100 text-green-700'
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
          <p className="text-center text-gray-500 py-8">No users found</p>
        )}
      </Card>
    </div>
  );
}
