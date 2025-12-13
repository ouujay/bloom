import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/auth';
import toast from 'react-hot-toast';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  Building,
  Edit3,
  LogOut,
  AlertTriangle,
  UserPlus,
  Stethoscope,
  X,
  Save
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

      {/* Sign Out */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white text-dark-600 py-3.5 rounded-full font-medium shadow-lg shadow-dark-900/5 transition-all"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
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
