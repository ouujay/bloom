import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronRight,
  Phone,
  MapPin,
  UserPlus,
  Users,
  Baby
} from 'lucide-react';
import { organizationAPI } from '../../api/organization';
import toast from 'react-hot-toast';

const urgencyConfig = {
  critical: {
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-500 text-white',
    label: 'Critical'
  },
  urgent: {
    color: 'bg-orange-100 text-orange-700',
    badge: 'bg-orange-500 text-white',
    label: 'Urgent'
  },
  moderate: {
    color: 'bg-yellow-100 text-yellow-700',
    badge: 'bg-yellow-500 text-white',
    label: 'Moderate'
  },
  normal: {
    color: 'bg-green-100 text-green-700',
    badge: 'bg-green-500 text-white',
    label: 'Normal'
  },
};

export default function OrganizationPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.getPatients();
      setPatients(response.data.data.patients || []);
    } catch (err) {
      toast.error('Failed to load patients');
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
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to send invitation';
      toast.error(errorMsg);
    } finally {
      setInviting(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const query = searchQuery.toLowerCase();
    return (
      patient.patient_email?.toLowerCase().includes(query) ||
      patient.patient_phone?.includes(query) ||
      patient.patient_location?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">{patients.length} connected patient{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Invite Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email, phone, or location..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
        />
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Invite expecting mothers to connect with your facility'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="text-primary-500 font-medium hover:text-primary-600"
              >
                Send your first invitation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPatients.map(patient => {
              const urgency = patient.highest_urgency;
              const config = urgencyConfig[urgency] || urgencyConfig.normal;

              return (
                <Link
                  key={patient.id}
                  to={`/organization/patients/${patient.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-lg">
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

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      {patient.patient_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {patient.patient_phone}
                        </span>
                      )}
                      {patient.patient_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {patient.patient_location}
                        </span>
                      )}
                    </div>

                    {/* Children Preview */}
                    <div className="flex items-center gap-2">
                      {patient.children?.slice(0, 3).map(child => (
                        <span
                          key={child.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-bloom-50 text-bloom-700 rounded text-xs"
                        >
                          <Baby className="w-3 h-3" />
                          {child.status === 'pregnant'
                            ? `Week ${child.current_stage?.week || '?'}`
                            : child.name}
                        </span>
                      ))}
                      {patient.children_count > 3 && (
                        <span className="text-xs text-gray-500">
                          +{patient.children_count - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">Connected</div>
                    <div className="text-sm font-medium text-gray-700">
                      {formatDate(patient.connected_at)}
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
