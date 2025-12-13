import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Phone,
  AlertTriangle,
  MapPin,
  Heart,
  Share2,
  MessageCircle,
  Navigation,
  Plus,
  ChevronDown,
  ChevronUp,
  Ambulance,
  Hospital,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const dangerSigns = [
  { sign: 'Heavy vaginal bleeding', severity: 'critical' },
  { sign: 'Severe headache with vision changes', severity: 'critical' },
  { sign: 'Severe abdominal pain', severity: 'critical' },
  { sign: 'Baby not moving for 12+ hours', severity: 'critical' },
  { sign: 'Fluid leaking from vagina', severity: 'urgent' },
  { sign: 'High fever (above 38°C)', severity: 'urgent' },
  { sign: 'Sudden swelling of face/hands', severity: 'urgent' },
  { sign: 'Persistent vomiting', severity: 'moderate' },
  { sign: 'Painful urination', severity: 'moderate' },
  { sign: 'Dizziness or fainting', severity: 'moderate' },
];

const emergencyNumbers = [
  { name: 'Emergency Services', number: '112', icon: Phone, color: 'bg-red-500' },
  { name: 'Ambulance (LASAMBUS)', number: '767', icon: Ambulance, color: 'bg-orange-500' },
  { name: 'NEMA Hotline', number: '0800-2255-6362', icon: Phone, color: 'bg-blue-500' },
];

export default function Emergency() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllSigns, setShowAllSigns] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);

  const callNumber = (number) => {
    window.location.href = `tel:${number}`;
  };

  const shareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Location not supported on this device');
      return;
    }

    setSendingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;

      if (navigator.share) {
        await navigator.share({
          title: 'My Location - Emergency',
          text: `I need help! My current location:`,
          url: mapsUrl,
        });
        toast.success('Location shared');
      } else {
        await navigator.clipboard.writeText(mapsUrl);
        toast.success('Location copied to clipboard');
      }
    } catch (err) {
      if (err.code === 1) {
        toast.error('Please enable location permissions');
      } else {
        toast.error('Could not get location');
      }
    } finally {
      setSendingLocation(false);
    }
  };

  const sendSOSMessage = async () => {
    if (!user?.emergency_contact_phone) {
      toast.error('No emergency contact set up');
      navigate('/dashboard/profile');
      return;
    }

    const message = `EMERGENCY: ${user?.name || 'Your contact'} needs help! This is an automated SOS from the Bloom app.`;
    window.location.href = `sms:${user.emergency_contact_phone}?body=${encodeURIComponent(message)}`;
  };

  const hasEmergencyContact = user?.emergency_contact_phone;
  const hasHospital = user?.hospital_name;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* SOS Header */}
      <div className="bg-red-500 text-white rounded-3xl p-6 shadow-xl">
        <div className="text-center mb-6">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Emergency Help</h1>
          <p className="text-red-100 text-sm mt-1">Get immediate assistance</p>
        </div>

        {/* Main Emergency Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => callNumber('112')}
            className="bg-white text-red-600 rounded-2xl p-4 font-bold text-lg shadow-lg hover:bg-red-50 transition-all active:scale-95"
          >
            <Phone className="w-8 h-8 mx-auto mb-2" />
            Call 112
          </button>

          <button
            onClick={shareLocation}
            disabled={sendingLocation}
            className="bg-white/20 text-white rounded-2xl p-4 font-semibold hover:bg-white/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Navigation className="w-8 h-8 mx-auto mb-2" />
            {sendingLocation ? 'Getting...' : 'Share Location'}
          </button>
        </div>
      </div>

      {/* Personal Emergency Contacts */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">
        <div className="p-4 border-b border-cream-200">
          <h2 className="font-semibold text-dark-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Your Emergency Contacts
          </h2>
        </div>

        {hasEmergencyContact ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-dark-900">{user.emergency_contact_name}</p>
                <p className="text-sm text-dark-500">{user.emergency_contact_relationship}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => callNumber(user.emergency_contact_phone)}
                  className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={sendSOSMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {hasHospital && (
              <div className="bg-cream-50 rounded-xl p-3 flex items-center gap-3">
                <Hospital className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="font-medium text-dark-900 text-sm">{user.hospital_name}</p>
                  {user.doctor_name && (
                    <p className="text-xs text-dark-500">Dr. {user.doctor_name}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <UserPlus className="w-10 h-10 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 mb-4">No emergency contact set up yet</p>
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Emergency Contact
            </button>
          </div>
        )}
      </div>

      {/* Emergency Numbers */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-4">
        <h2 className="font-semibold text-dark-900 mb-4">Emergency Services</h2>
        <div className="space-y-3">
          {emergencyNumbers.map((item) => (
            <button
              key={item.number}
              onClick={() => callNumber(item.number)}
              className="w-full flex items-center gap-4 p-3 bg-cream-50 hover:bg-cream-100 rounded-xl transition-colors text-left"
            >
              <div className={`${item.color} p-2.5 rounded-xl text-white`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-dark-900">{item.name}</p>
                <p className="text-lg font-bold text-dark-700">{item.number}</p>
              </div>
              <Phone className="w-5 h-5 text-dark-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Danger Signs */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">
        <button
          onClick={() => setShowAllSigns(!showAllSigns)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <h2 className="font-semibold text-dark-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            When to Seek Help
          </h2>
          {showAllSigns ? (
            <ChevronUp className="w-5 h-5 text-dark-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-dark-400" />
          )}
        </button>

        <div className={`px-4 pb-4 space-y-2 ${showAllSigns ? '' : 'max-h-48 overflow-hidden'}`}>
          {dangerSigns.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                item.severity === 'critical'
                  ? 'bg-red-50 text-red-700'
                  : item.severity === 'urgent'
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                item.severity === 'critical'
                  ? 'bg-red-500'
                  : item.severity === 'urgent'
                  ? 'bg-orange-500'
                  : 'bg-amber-500'
              }`} />
              <span className="text-sm font-medium">{item.sign}</span>
            </div>
          ))}
        </div>

        {!showAllSigns && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowAllSigns(true)}
              className="text-primary-600 text-sm font-medium"
            >
              Show all warning signs...
            </button>
          </div>
        )}
      </div>

      {/* Find Nearby Hospitals */}
      <a
        href="https://maps.google.com/maps?q=hospitals+near+me"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-bloom-50 hover:bg-bloom-100 border border-bloom-200 rounded-2xl p-4 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="bg-bloom-500 p-3 rounded-xl text-white">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-bloom-800">Find Nearby Hospitals</p>
            <p className="text-sm text-bloom-600">Open Google Maps to find hospitals near you</p>
          </div>
          <Share2 className="w-5 h-5 text-bloom-500" />
        </div>
      </a>
    </div>
  );
}
