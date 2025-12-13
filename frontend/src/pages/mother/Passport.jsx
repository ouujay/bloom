import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { passportAPI } from '../../api/passport';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  Share2,
  BookOpen,
  Heart,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Baby,
  Sparkles,
  MessageCircle,
  Activity,
  Clock,
  Copy,
  Eye,
  X,
  Shield,
  Users,
  Stethoscope,
  ArrowRight,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_ICONS = {
  task_completed: CheckCircle,
  lesson_completed: BookOpen,
  health_checkin: Heart,
  symptom_reported: AlertTriangle,
  ai_conversation: MessageCircle,
  appointment: Calendar,
  milestone: Sparkles,
  birth: Baby,
  measurement: Activity,
};

const EVENT_COLORS = {
  task_completed: { bg: 'bg-bloom-100', text: 'text-bloom-600', border: 'border-bloom-300' },
  lesson_completed: { bg: 'bg-primary-100', text: 'text-primary-600', border: 'border-primary-300' },
  health_checkin: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300' },
  symptom_reported: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-300' },
  ai_conversation: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' },
  appointment: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
  milestone: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-300' },
  birth: { bg: 'bg-bloom-100', text: 'text-bloom-600', border: 'border-bloom-300' },
  measurement: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-300' },
};

const heroImage = 'https://i.pinimg.com/736x/f4/49/f0/f449f0c95f40b603012b2cbbbed1de3d.jpg';

export default function Passport() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);

  useEffect(() => {
    fetchPassport();
  }, [childId]);

  const fetchPassport = async () => {
    try {
      setLoading(true);
      const res = await passportAPI.getPassport(childId);
      setPassport(res.data?.data);
    } catch (err) {
      toast.error('Failed to load passport');
    } finally {
      setLoading(false);
    }
  };

  const fetchShares = async () => {
    try {
      setLoadingShares(true);
      const res = await passportAPI.getShares(childId);
      setShares(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching shares:', err);
    } finally {
      setLoadingShares(false);
    }
  };

  const filteredEvents = (passport?.timeline || []).filter(event => {
    if (filter === 'all') return true;
    if (filter === 'concerns') return event.is_concern;
    return event.type === filter;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-dark-500">Loading Life Passport...</p>
        </div>
      </div>
    );
  }

  if (!passport) return null;

  const { mother, child, timeline, summary } = passport;

  return (
    <div className="min-h-screen bg-cream-100 -m-4 md:-m-6">
      {/* Hero Section */}
      <div className="relative h-80 md:h-96 overflow-hidden">
        <img
          src={heroImage}
          alt="Life Passport"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/40 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-6 left-0 right-0 px-4 md:px-8 flex items-center justify-between">
          <button
            onClick={() => navigate(`/child/${childId}`)}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg hover:bg-white transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-dark-600" />
            <span className="text-sm font-medium text-dark-700">Back</span>
          </button>

          <button
            onClick={() => {
              setShowShareModal(true);
              fetchShares();
            }}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-full shadow-lg transition-all"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <p className="text-primary-200 font-medium mb-2">Life Passport</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {child.name || 'Baby'}'s Journey
          </h1>
          <p className="text-white/80">
            {child.status === 'pregnant'
              ? `${child.current_stage?.week || 0} weeks along`
              : child.current_stage?.age_weeks
                ? `${child.current_stage.age_weeks} weeks old`
                : 'Growing every day'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-8 relative z-10 pb-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Lessons', value: summary.lessons_completed, icon: BookOpen, color: 'primary' },
            { label: 'Check-ins', value: summary.health_checkins, icon: Heart, color: 'pink' },
            { label: 'Tasks', value: summary.tasks_completed, icon: CheckCircle, color: 'bloom' },
            { label: 'Appointments', value: summary.appointments, icon: Calendar, color: 'blue' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-lg">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                stat.color === 'primary' ? 'bg-primary-100' :
                stat.color === 'pink' ? 'bg-pink-100' :
                stat.color === 'bloom' ? 'bg-bloom-100' : 'bg-blue-100'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'primary' ? 'text-primary-600' :
                  stat.color === 'pink' ? 'text-pink-600' :
                  stat.color === 'bloom' ? 'text-bloom-600' : 'text-blue-600'
                }`} />
              </div>
              <p className="text-3xl font-bold text-dark-900">{stat.value}</p>
              <p className="text-sm text-dark-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Info Cards */}
          <div className="space-y-6">
            {/* Mother Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Mother's Profile
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-500">Name</span>
                  <span className="font-medium text-dark-900">{mother.name || user?.first_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Blood Type</span>
                  <span className="font-medium text-dark-900">{mother.blood_type || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Genotype</span>
                  <span className="font-medium text-dark-900">{mother.genotype || '-'}</span>
                </div>
                {mother.health_conditions?.length > 0 && (
                  <div>
                    <span className="text-dark-500 block mb-1">Health Conditions</span>
                    <div className="flex flex-wrap gap-1">
                      {mother.health_conditions.map((condition, i) => (
                        <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Baby Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                <Baby className="w-5 h-5 text-bloom-500" />
                {child.status === 'pregnant' ? 'Baby Info' : "Child's Info"}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-500">Name</span>
                  <span className="font-medium text-dark-900">{child.name || 'Baby'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Status</span>
                  <span className={`font-medium px-2 py-0.5 rounded-full text-sm ${
                    child.status === 'pregnant'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-bloom-100 text-bloom-700'
                  }`}>
                    {child.status === 'pregnant' ? 'Expecting' : 'Born'}
                  </span>
                </div>
                {child.due_date && (
                  <div className="flex justify-between">
                    <span className="text-dark-500">Due Date</span>
                    <span className="font-medium text-dark-900">
                      {new Date(child.due_date).toLocaleDateString('en-NG', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {child.birth_date && (
                  <div className="flex justify-between">
                    <span className="text-dark-500">Birth Date</span>
                    <span className="font-medium text-dark-900">
                      {new Date(child.birth_date).toLocaleDateString('en-NG', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-bloom-500 rounded-3xl p-6 text-white">
              <h3 className="font-semibold mb-3">Share with your doctor</h3>
              <p className="text-bloom-100 text-sm mb-4">
                Create a secure link to share your health journey with your healthcare provider.
              </p>
              <button
                onClick={() => {
                  setShowShareModal(true);
                  fetchShares();
                }}
                className="w-full bg-white text-bloom-600 font-medium py-3 rounded-xl hover:bg-cream-100 transition-colors flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-5 h-5" />
                Create Share Link
              </button>
            </div>
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              {/* Filter Tabs */}
              <div className="p-4 border-b border-cream-200">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Journey Timeline</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Events' },
                    { value: 'lesson_completed', label: 'Lessons' },
                    { value: 'health_checkin', label: 'Check-ins' },
                    { value: 'task_completed', label: 'Tasks' },
                    { value: 'concerns', label: 'Concerns' },
                  ].map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => setFilter(tab.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        filter === tab.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-cream-100 text-dark-600 hover:bg-cream-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-500">No events yet</p>
                    <p className="text-sm text-dark-400 mt-1">
                      Complete activities to build your journey timeline
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((event, index) => {
                      const Icon = EVENT_ICONS[event.type] || Activity;
                      const colors = EVENT_COLORS[event.type] || EVENT_COLORS.task_completed;

                      return (
                        <div
                          key={event.id || index}
                          className={`flex gap-4 p-4 rounded-2xl border ${colors.border} ${colors.bg}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white`}>
                            <Icon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-dark-900">{event.title}</h4>
                                {event.description && (
                                  <p className="text-sm text-dark-600 mt-1">{event.description}</p>
                                )}
                              </div>
                              {event.is_concern && (
                                <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full">
                                  Concern
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-sm text-dark-500">
                              <span>
                                {new Date(event.date).toLocaleDateString('en-NG', {
                                  month: 'short', day: 'numeric'
                                })}
                              </span>
                              {event.stage?.week && (
                                <span className="bg-white/80 px-2 py-0.5 rounded">
                                  Week {event.stage.week}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          childId={childId}
          shares={shares}
          loadingShares={loadingShares}
          onClose={() => setShowShareModal(false)}
          onShareCreated={fetchShares}
        />
      )}
    </div>
  );
}

// Share Modal Component
function ShareModal({ childId, shares, loadingShares, onClose, onShareCreated }) {
  const [creating, setCreating] = useState(false);
  const [newShare, setNewShare] = useState(null);
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_type: 'doctor',
    duration_type: '7d',
  });

  const handleCreate = async () => {
    try {
      setCreating(true);
      const res = await passportAPI.createShare(childId, formData);
      setNewShare(res.data?.data);
      onShareCreated();
      toast.success('Share link created!');
    } catch (err) {
      toast.error('Failed to create share link');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (shareId) => {
    try {
      await passportAPI.deactivateShare(childId, shareId);
      onShareCreated();
      toast.success('Share link deactivated');
    } catch (err) {
      toast.error('Failed to deactivate');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-dark-900">Share Passport</h2>
            <button onClick={onClose} className="p-2 hover:bg-cream-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-dark-500" />
            </button>
          </div>
          <p className="text-dark-500 text-sm mt-1">
            Create secure links to share with doctors or family
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* New Share Created */}
          {newShare && (
            <div className="mb-6 bg-bloom-50 rounded-2xl p-5 border border-bloom-200">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-bloom-600" />
                <span className="font-semibold text-bloom-800">Share Link Created!</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-dark-500">Share Code</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-dark-900 font-mono">
                      {newShare.share_code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newShare.share_code)}
                      className="p-2 bg-white rounded-lg hover:bg-cream-100"
                    >
                      <Copy className="w-4 h-4 text-dark-500" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-dark-500">Passcode (share securely)</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-dark-900 font-mono text-lg tracking-widest">
                      {newShare.passcode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newShare.passcode)}
                      className="p-2 bg-white rounded-lg hover:bg-cream-100"
                    >
                      <Copy className="w-4 h-4 text-dark-500" />
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={`/passport/view/${newShare.share_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-bloom-600 hover:text-bloom-700 flex items-center gap-1"
                  >
                    Preview link <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Create New Share */}
          {!newShare && (
            <div className="mb-6">
              <h3 className="font-semibold text-dark-900 mb-4">Create New Share</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-dark-600 mb-1 block">Recipient Name (optional)</label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    placeholder="e.g., Dr. Smith"
                    className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-sm text-dark-600 mb-1 block">Sharing with</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'doctor', label: 'Doctor', icon: Stethoscope },
                      { value: 'family', label: 'Family', icon: Users },
                      { value: 'partner', label: 'Partner', icon: Heart },
                      { value: 'other', label: 'Other', icon: Share2 },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, recipient_type: option.value })}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                          formData.recipient_type === option.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-cream-200 hover:border-cream-300'
                        }`}
                      >
                        <option.icon className={`w-5 h-5 ${
                          formData.recipient_type === option.value ? 'text-primary-600' : 'text-dark-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          formData.recipient_type === option.value ? 'text-primary-700' : 'text-dark-600'
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-dark-600 mb-1 block">Link expires in</label>
                  <div className="flex gap-2">
                    {[
                      { value: '24h', label: '24 Hours' },
                      { value: '7d', label: '7 Days' },
                      { value: '30d', label: '30 Days' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, duration_type: option.value })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.duration_type === option.value
                            ? 'bg-primary-500 text-white'
                            : 'bg-cream-100 text-dark-600 hover:bg-cream-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Share Link'}
                </button>
              </div>
            </div>
          )}

          {/* Existing Shares */}
          <div>
            <h3 className="font-semibold text-dark-900 mb-4">Active Share Links</h3>

            {loadingShares ? (
              <p className="text-dark-500 text-center py-4">Loading...</p>
            ) : shares.filter(s => s.is_valid).length === 0 ? (
              <p className="text-dark-500 text-center py-4">No active share links</p>
            ) : (
              <div className="space-y-3">
                {shares.filter(s => s.is_valid).map(share => (
                  <div key={share.id} className="flex items-center justify-between p-4 bg-cream-50 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-dark-900">{share.share_code}</code>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          share.recipient_type === 'doctor'
                            ? 'bg-blue-100 text-blue-700'
                            : share.recipient_type === 'family'
                              ? 'bg-bloom-100 text-bloom-700'
                              : 'bg-cream-200 text-dark-600'
                        }`}>
                          {share.recipient_type}
                        </span>
                      </div>
                      <p className="text-sm text-dark-500 mt-1">
                        {share.recipient_name || 'No name'} • {share.view_count} views
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(share.share_code)}
                        className="p-2 hover:bg-cream-200 rounded-lg"
                      >
                        <Copy className="w-4 h-4 text-dark-500" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(share.id)}
                        className="p-2 hover:bg-red-100 rounded-lg"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
