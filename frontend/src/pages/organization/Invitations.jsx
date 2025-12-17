import { useState, useEffect } from 'react';
import {
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Trash2,
  Send
} from 'lucide-react';
import { organizationAPI } from '../../api/organization';
import toast from 'react-hot-toast';

export default function OrganizationInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.getInvitations();
      setInvitations(response.data.data.invitations || []);
    } catch (err) {
      toast.error('Failed to load invitations');
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
      fetchInvitations();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to send invitation';
      toast.error(errorMsg);
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await organizationAPI.cancelInvitation(invitationId);
      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (err) {
      toast.error('Failed to cancel invitation');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Pending' },
    accepted: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Accepted' },
    declined: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Declined' },
  };

  const pendingInvitations = invitations.filter(i => i.status === 'pending');
  const pastInvitations = invitations.filter(i => i.status !== 'pending');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
          <p className="text-gray-500 mt-1">Manage patient invitations</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Invite Patient
        </button>
      </div>

      {/* Pending Invitations */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Pending Invitations ({pendingInvitations.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : pendingInvitations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No pending invitations</h3>
            <p className="text-sm text-gray-500 mb-4">
              Invite mothers to connect with your facility
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-primary-500 font-medium hover:text-primary-600"
            >
              Send an invitation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingInvitations.map(invitation => {
              const config = statusConfig[invitation.status];
              const Icon = config.icon;

              return (
                <div key={invitation.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 ${config.bg} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{invitation.patient_email}</div>
                    {invitation.message && (
                      <div className="text-sm text-gray-500 truncate">{invitation.message}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Sent {formatDate(invitation.created_at)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel invitation"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Invitations */}
      {pastInvitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Past Invitations</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {pastInvitations.map(invitation => {
              const config = statusConfig[invitation.status];
              const Icon = config.icon;

              return (
                <div key={invitation.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 ${config.bg} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{invitation.patient_email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {config.label} on {formatDate(invitation.responded_at || invitation.created_at)}
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:bg-primary-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {inviting ? 'Sending...' : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
