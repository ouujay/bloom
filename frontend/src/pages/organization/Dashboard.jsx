import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronRight,
  Phone,
  MapPin,
  Building2
} from 'lucide-react';
import { organizationAPI } from '../../api/organization';
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

export default function OrganizationDashboard() {
  const [stats, setStats] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, orgRes, patientsRes] = await Promise.all([
        organizationAPI.getStats(),
        organizationAPI.getMe(),
        organizationAPI.getPatients()
      ]);
      setStats(statsRes.data.data);
      setOrganization(orgRes.data.data);
      setPatients(patientsRes.data.data.patients || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitePatient = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error('Please enter an email');
      return;
    }

    setInviting(true);
    try {
      await organizationAPI.invitePatient(inviteEmail, inviteMessage);
      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteMessage('');
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to send invitation';
      toast.error(errorMsg);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{organization?.name || 'Dashboard'}</h1>
          <p className="text-gray-500 mt-1">
            {organization?.organization_type_display || 'Healthcare Organization'}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Invite Patient
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-primary-500" />
            <span className="text-2xl font-bold text-gray-900">{stats?.total_patients || 0}</span>
          </div>
          <p className="text-sm text-gray-600">Connected Patients</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">{stats?.pending_invitations || 0}</span>
          </div>
          <p className="text-sm text-gray-600">Pending Invitations</p>
        </div>

        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-red-700">{stats?.reports_by_urgency?.critical || 0}</span>
          </div>
          <p className="text-sm text-red-600">Critical Reports</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold text-orange-700">{stats?.reports_by_urgency?.urgent || 0}</span>
          </div>
          <p className="text-sm text-orange-600">Urgent Reports</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/organization/patients"
          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">View All Patients</h3>
                <p className="text-sm text-gray-500">See connected mothers and their health data</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
          </div>
        </Link>

        <Link
          to="/organization/reports"
          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Health Reports</h3>
                <p className="text-sm text-gray-500">Review patient health check-ins by urgency</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
          </div>
        </Link>
      </div>

      {/* Recent Patients */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Connected Patients</h2>
          <Link to="/organization/patients" className="text-sm text-primary-500 hover:text-primary-600">
            View all
          </Link>
        </div>

        {patients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No patients yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Invite expecting mothers to connect with your facility
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-primary-500 font-medium hover:text-primary-600"
            >
              Send your first invitation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {patients.slice(0, 5).map(patient => {
              const urgency = patient.highest_urgency;
              const config = urgencyConfig[urgency] || urgencyConfig.normal;
              const Icon = config.icon;

              return (
                <Link
                  key={patient.id}
                  to={`/organization/patients/${patient.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-medium">
                      {patient.patient_email?.charAt(0).toUpperCase() || 'P'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {patient.patient_email}
                      </span>
                      {patient.unaddressed_reports_count > 0 && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                          {patient.unaddressed_reports_count} {config.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {patient.patient_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.patient_phone}
                        </span>
                      )}
                      {patient.patient_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {patient.patient_location}
                        </span>
                      )}
                      <span>{patient.children_count} child{patient.children_count !== 1 ? 'ren' : ''}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Patient Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invite Patient</h2>
            <p className="text-gray-600 mb-6">
              Send an invitation to an existing Bloom user. They'll receive it in the app and can accept to share their health data with your facility.
            </p>

            <form onSubmit={handleInvitePatient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:bg-primary-200 disabled:cursor-not-allowed transition-colors"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
