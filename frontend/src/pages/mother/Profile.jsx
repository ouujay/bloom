import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/auth';
import { motherOrgAPI } from '../../api/organization';
import childrenApi from '../../api/children';
import toast from 'react-hot-toast';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  Building,
  Building2,
  Edit3,
  LogOut,
  AlertTriangle,
  UserPlus,
  Stethoscope,
  X,
  Save,
  Check,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    hospital_name: user?.hospital_name || '',
    doctor_name: user?.doctor_name || '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
    emergency_contact_relationship: user?.emergency_contact_relationship || '',
  });

  // Organization invitations state
  const [invitations, setInvitations] = useState([]);
  const [connectedOrgs, setConnectedOrgs] = useState([]);
  const [children, setChildren] = useState([]);
  const [showAcceptModal, setShowAcceptModal] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [processingInvite, setProcessingInvite] = useState(false);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      const [invRes, orgsRes, childrenRes] = await Promise.all([
        motherOrgAPI.getInvitations(),
        motherOrgAPI.getConnectedOrgs(),
        childrenApi.list()
      ]);
      setInvitations(invRes.data.data.invitations || []);
      setConnectedOrgs(orgsRes.data.data.connections || []);
      setChildren(childrenRes.data?.children || []);
    } catch (err) {
      // Silently fail - not critical for profile page
    }
  };

  const handleAcceptInvitation = async () => {
    if (selectedChildren.length === 0) {
      toast.error('Please select at least one child to share');
      return;
    }

    setProcessingInvite(true);
    try {
      await motherOrgAPI.acceptInvitation(showAcceptModal.id, selectedChildren);
      toast.success('Connected to organization');
      setShowAcceptModal(null);
      setSelectedChildren([]);
      fetchOrgData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setProcessingInvite(false);
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    try {
      await motherOrgAPI.declineInvitation(invitationId);
      toast.success('Invitation declined');
      fetchOrgData();
    } catch (err) {
      toast.error('Failed to decline invitation');
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!confirm('Are you sure you want to disconnect from this organization? They will no longer be able to see your health data.')) {
      return;
    }

    try {
      await motherOrgAPI.disconnectOrg(connectionId);
      toast.success('Disconnected from organization');
      fetchOrgData();
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const toggleChildSelection = (childId) => {
    setSelectedChildren(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile(formData);
      updateUser(formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const hasEmergencyContact = user?.emergency_contact_phone;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 font-medium transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg shadow-dark-900/5 overflow-hidden">
        {/* User Header */}
        <div className="bg-cream-100 p-6 border-b border-cream-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <User className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-900">{user?.name}</h2>
              <p className="text-dark-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-medium text-dark-500 mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Full Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl focus:ring-2 focus:ring-primary-300 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Phone Number</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl focus:ring-2 focus:ring-primary-300 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div>
              <h3 className="text-sm font-medium text-dark-500 mb-4">Medical Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Hospital / Clinic</label>
                  <input
                    name="hospital_name"
                    value={formData.hospital_name}
                    onChange={handleChange}
                    placeholder="Where will you deliver?"
                    className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl focus:ring-2 focus:ring-primary-300 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Doctor's Name</label>
                  <input
                    name="doctor_name"
                    value={formData.doctor_name}
                    onChange={handleChange}
                    placeholder="Your primary doctor"
                    className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl focus:ring-2 focus:ring-primary-300 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-cream-50 rounded-2xl p-5 border border-cream-200">
              <h3 className="text-sm font-medium text-dark-700 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary-500" />
                Emergency Contact
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Contact Name</label>
                  <input
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Who should we call?"
                    className="w-full px-4 py-3 bg-white border border-cream-200 rounded-2xl focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Contact Phone</label>
                  <input
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="Their phone number"
                    className="w-full px-4 py-3 bg-white border border-cream-200 rounded-2xl focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Relationship</label>
                  <select
                    name="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-cream-200 rounded-2xl focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all"
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse / Partner</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-400 hover:bg-primary-500 disabled:bg-primary-200 text-white py-3 rounded-full font-semibold shadow-lg shadow-primary-400/20 transition-all"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-cream-100 text-dark-600 rounded-full font-medium hover:bg-cream-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5">
            {/* Personal Info */}
            <div className="space-y-4">
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow icon={Phone} label="Phone" value={user?.phone} />
              <InfoRow icon={Calendar} label="Due Date" value={user?.due_date} />
              <InfoRow icon={Heart} label="Blood Type" value={user?.blood_type} />
            </div>

            {/* Medical Info */}
            <div className="pt-5 border-t border-cream-200">
              <h3 className="text-sm font-medium text-dark-500 mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Medical
              </h3>
              <div className="space-y-4">
                <InfoRow icon={Building} label="Hospital" value={user?.hospital_name} />
                <InfoRow icon={User} label="Doctor" value={user?.doctor_name} />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className={`pt-5 border-t border-cream-200 ${!hasEmergencyContact ? 'bg-primary-50 rounded-2xl p-5 -mx-1 mt-5' : ''}`}>
              <h3 className={`text-sm font-medium mb-4 flex items-center gap-2 ${!hasEmergencyContact ? 'text-primary-600' : 'text-dark-500'}`}>
                <AlertTriangle className="w-4 h-4" />
                Emergency Contact
                {!hasEmergencyContact && <span className="text-xs font-normal ml-2">(Please add)</span>}
              </h3>
              {hasEmergencyContact ? (
                <div className="space-y-4">
                  <InfoRow icon={UserPlus} label="Name" value={user?.emergency_contact_name} />
                  <InfoRow icon={Phone} label="Phone" value={user?.emergency_contact_phone} />
                  <InfoRow label="Relationship" value={user?.emergency_contact_relationship} />
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-dark-600 text-sm mb-4">Add an emergency contact for your safety</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary-400 hover:bg-primary-500 text-white px-6 py-2.5 rounded-full font-medium shadow-lg shadow-primary-400/20 transition-all"
                  >
                    Add Contact
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Organization Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg shadow-dark-900/5 overflow-hidden">
          <div className="p-4 border-b border-cream-200 bg-primary-50">
            <h3 className="font-semibold text-dark-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              Organization Invitations
              <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                {invitations.length}
              </span>
            </h3>
          </div>
          <div className="divide-y divide-cream-100">
            {invitations.map(inv => (
              <div key={inv.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-dark-900">{inv.organization_name}</p>
                    <p className="text-sm text-dark-500">{inv.organization_type_display}</p>
                    {inv.message && (
                      <p className="text-sm text-dark-600 mt-1 italic">"{inv.message}"</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setShowAcceptModal(inv);
                      setSelectedChildren([]);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-500 text-white py-2 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(inv.id)}
                    className="px-4 py-2 bg-cream-100 text-dark-600 rounded-full text-sm font-medium hover:bg-cream-200 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Organizations */}
      {connectedOrgs.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg shadow-dark-900/5 overflow-hidden">
          <div className="p-4 border-b border-cream-200">
            <h3 className="font-semibold text-dark-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-bloom-500" />
              Connected Organizations
            </h3>
          </div>
          <div className="divide-y divide-cream-100">
            {connectedOrgs.map(conn => (
              <div key={conn.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-bloom-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-bloom-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-900">{conn.organization_name}</p>
                  <p className="text-xs text-dark-500">
                    {conn.shared_children_count} child{conn.shared_children_count !== 1 ? 'ren' : ''} shared
                  </p>
                </div>
                <button
                  onClick={() => handleDisconnect(conn.id)}
                  className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Disconnect"
                >
                  <Unlink className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white text-dark-600 py-3.5 rounded-full font-medium shadow-lg shadow-dark-900/5 transition-all"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>

      {/* Accept Invitation Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-dark-900 mb-2">Connect with {showAcceptModal.organization_name}</h2>
            <p className="text-dark-600 mb-6">
              Select which children you want to share health data with this organization. They will be able to see the selected children's health reports and passport information.
            </p>

            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-dark-700">Select children to share:</p>
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => toggleChildSelection(child.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    selectedChildren.includes(child.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedChildren.includes(child.id)
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-dark-300'
                  }`}>
                    {selectedChildren.includes(child.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-dark-900">{child.name || child.display_name || 'Baby'}</p>
                    <p className="text-xs text-dark-500">
                      {child.status === 'pregnant'
                        ? `Week ${child.current_stage?.week || child.pregnancy_week || '?'}`
                        : child.birth_date}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAcceptModal(null)}
                className="flex-1 px-4 py-3 border border-cream-300 rounded-full text-dark-600 hover:bg-cream-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptInvitation}
                disabled={selectedChildren.length === 0 || processingInvite}
                className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:bg-primary-200 disabled:cursor-not-allowed transition-colors"
              >
                {processingInvite ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-1">
      {Icon && (
        <div className="w-10 h-10 bg-cream-100 rounded-full flex items-center justify-center">
          <Icon className="w-5 h-5 text-dark-500" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs text-dark-500">{label}</p>
        <p className={`font-medium ${value ? 'text-dark-900' : 'text-dark-400'}`}>
          {value || 'Not set'}
        </p>
      </div>
    </div>
  );
}
