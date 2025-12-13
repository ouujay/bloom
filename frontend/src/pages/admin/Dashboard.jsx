import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { Users, CreditCard, BookOpen, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats/').then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of MamaAlert platform</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-bloom-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-bloom-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_today || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pending_withdrawals || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.lessons_completed || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Signups</h2>
          {stats?.recent_users?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{user.joined_ago}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent signups</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Withdrawals</h2>
          {stats?.recent_withdrawals?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{w.user_name}</p>
                    <p className="text-sm text-gray-500">{w.amount} tokens</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    w.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    w.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent withdrawals</p>
          )}
        </Card>
      </div>
    </div>
  );
}
