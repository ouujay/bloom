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
  Calendar,
  Filter,
  Search
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

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddressed, setShowAddressed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, [filter, showAddressed]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await doctorAPI.getReports({
        urgency: filter !== 'all' ? filter : undefined,
        addressed: showAddressed
      });
      setReports(res.data.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      report.patient_name?.toLowerCase().includes(term) ||
      report.patient_phone?.includes(term) ||
      report.patient_location?.toLowerCase().includes(term) ||
      report.ai_summary?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Reports</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bloom-500 focus:border-bloom-500"
              />
            </div>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-bloom-500 focus:border-bloom-500"
            >
              <option value="all">All Urgencies</option>
              <option value="critical">Critical</option>
              <option value="urgent">Urgent</option>
              <option value="moderate">Moderate</option>
              <option value="normal">Normal</option>
            </select>
          </div>

          {/* Show Addressed Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAddressed}
              onChange={(e) => setShowAddressed(e.target.checked)}
              className="w-4 h-4 text-bloom-600 border-gray-300 rounded focus:ring-bloom-500"
            />
            <span className="text-sm text-gray-600">Show addressed</span>
          </label>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reports found
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReports.map(report => {
              const config = urgencyConfig[report.urgency_level] || urgencyConfig.normal;
              const Icon = config.icon;

              return (
                <Link
                  key={report.id}
                  to={`/doctor/reports/${report.id}`}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    report.is_addressed ? 'opacity-60' : ''
                  }`}
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
                      {report.is_addressed && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          Addressed
                        </span>
                      )}
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
