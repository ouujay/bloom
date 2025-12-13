import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronRight,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { doctorAPI } from '../../api/doctor';
import toast from 'react-hot-toast';

const urgencyConfig = {
  critical: {
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    badge: 'bg-red-500 text-white',
    label: 'Critical'
  },
  urgent: {
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: AlertCircle,
    badge: 'bg-orange-500 text-white',
    label: 'Urgent'
  },
  moderate: {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
    badge: 'bg-yellow-500 text-white',
    label: 'Moderate'
  },
  normal: {
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
    badge: 'bg-green-500 text-white',
    label: 'Normal'
  },
};

export default function DoctorDashboard() {
  const [stats, setStats] = useState({ critical: 0, urgent: 0, moderate: 0, normal: 0, total: 0 });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes] = await Promise.all([
        doctorAPI.getStats(),
        doctorAPI.getReports({ urgency: filter !== 'all' ? filter : undefined })
      ]);
      setStats(statsRes.data.data);
      setReports(reportsRes.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Doctor Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(urgencyConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                filter === key ? 'ring-2 ring-bloom-500 ring-offset-2' : ''
              } ${config.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" />
                <span className="text-2xl font-bold">{stats[key]}</span>
              </div>
              <p className="text-sm font-medium capitalize">{key}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-bloom-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({stats.total})
        </button>
        {Object.entries(urgencyConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? config.badge
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {config.label} ({stats[key]})
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            {filter === 'all' ? 'All Pending Reports' : `${urgencyConfig[filter]?.label || ''} Reports`}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pending reports
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map(report => {
              const config = urgencyConfig[report.urgency_level] || urgencyConfig.normal;
              const Icon = config.icon;

              return (
                <Link
                  key={report.id}
                  to={`/doctor/reports/${report.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {report.patient_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                        {config.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-bloom-100 text-bloom-700">
                        Week {report.pregnancy_week}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 truncate mb-1">
                      {report.ai_summary}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {report.patient_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {report.patient_phone}
                        </span>
                      )}
                      {report.patient_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.patient_location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
