import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { passportAPI } from '../api/passport';
import {
  Shield,
  Lock,
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
  Users,
  ArrowRight,
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
  task_completed: { bg: 'bg-bloom-100', text: 'text-bloom-600' },
  lesson_completed: { bg: 'bg-primary-100', text: 'text-primary-600' },
  health_checkin: { bg: 'bg-pink-100', text: 'text-pink-600' },
  symptom_reported: { bg: 'bg-amber-100', text: 'text-amber-600' },
  ai_conversation: { bg: 'bg-purple-100', text: 'text-purple-600' },
  appointment: { bg: 'bg-blue-100', text: 'text-blue-600' },
  milestone: { bg: 'bg-amber-100', text: 'text-amber-600' },
  birth: { bg: 'bg-bloom-100', text: 'text-bloom-600' },
  measurement: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
};

export default function PassportView() {
  const { shareCode } = useParams();
  const [step, setStep] = useState('verify'); // 'verify' | 'view'
  const [passcode, setPasscode] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [childName, setChildName] = useState('');
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (passcode.length !== 6) {
      setError('Passcode must be 6 digits');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await passportAPI.verifyShare(shareCode, passcode);
      if (res.data?.success) {
        setAccessToken(res.data.data.access_token);
        setChildName(res.data.data.child_name);
        setStep('view');
        fetchPassport(res.data.data.access_token);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid or expired link';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPassport = async (token) => {
    try {
      setLoading(true);
      const res = await passportAPI.viewShared(shareCode, token);
      setPassport(res.data?.data);
    } catch (err) {
      setError('Failed to load passport');
    } finally {
      setLoading(false);
    }
  };

  // Verify Page
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-primary-500" />
            </div>
            <h1 className="text-3xl font-bold text-dark-900">Life Passport</h1>
            <p className="text-dark-500 mt-2">Enter the passcode to view this shared passport</p>
          </div>

          {/* Verify Form */}
          <form onSubmit={handleVerify} className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-700 mb-2">
                6-Digit Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-4 border border-cream-300 rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || passcode.length !== 6}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                'Verifying...'
              ) : (
                <>
                  View Passport
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-dark-400 text-sm mt-8">
            Secured by <span className="font-semibold text-primary-500">Bloom</span>
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !passport) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-dark-500">Loading passport...</p>
        </div>
      </div>
    );
  }

  if (!passport) return null;

  const { mother, child, timeline, summary } = passport;

  // View Page
  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <div className="bg-primary-500 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-primary-100 text-sm mb-2">
            <Shield className="w-4 h-4" />
            <span>Shared Life Passport</span>
          </div>
          <h1 className="text-3xl font-bold">{childName || child.name || 'Baby'}'s Journey</h1>
          <p className="text-primary-100 mt-1">
            {child.status === 'pregnant'
              ? `${child.current_stage?.week || 0} weeks along`
              : child.current_stage?.age_weeks
                ? `${child.current_stage.age_weeks} weeks old`
                : 'Growing every day'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Lessons', value: summary.lessons_completed, icon: BookOpen },
            { label: 'Check-ins', value: summary.health_checkins, icon: Heart },
            { label: 'Tasks', value: summary.tasks_completed, icon: CheckCircle },
            { label: 'Appointments', value: summary.appointments, icon: Calendar },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <stat.icon className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-900">{stat.value}</p>
              <p className="text-sm text-dark-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Mother Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Mother's Profile
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-500">Name</span>
                <span className="font-medium text-dark-900">{mother.name || '-'}</span>
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
                <div className="pt-2">
                  <span className="text-dark-500 block mb-1">Health Conditions</span>
                  <div className="flex flex-wrap gap-1">
                    {mother.health_conditions.map((c, i) => (
                      <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Baby Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
              <Baby className="w-5 h-5 text-bloom-500" />
              {child.status === 'pregnant' ? 'Baby Info' : "Child's Info"}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-500">Name</span>
                <span className="font-medium text-dark-900">{child.name || 'Baby'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">Status</span>
                <span className={`font-medium ${
                  child.status === 'pregnant' ? 'text-primary-600' : 'text-bloom-600'
                }`}>
                  {child.status === 'pregnant' ? 'Expecting' : 'Born'}
                </span>
              </div>
              {child.due_date && (
                <div className="flex justify-between">
                  <span className="text-dark-500">Due Date</span>
                  <span className="font-medium text-dark-900">
                    {new Date(child.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {child.birth_date && (
                <div className="flex justify-between">
                  <span className="text-dark-500">Birth Date</span>
                  <span className="font-medium text-dark-900">
                    {new Date(child.birth_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-cream-200">
            <h3 className="text-lg font-semibold text-dark-900">Journey Timeline</h3>
            <p className="text-dark-500 text-sm">Recent activities and milestones</p>
          </div>

          <div className="p-4 max-h-[500px] overflow-y-auto">
            {timeline.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500">No events recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.slice(0, 30).map((event, index) => {
                  const Icon = EVENT_ICONS[event.type] || Activity;
                  const colors = EVENT_COLORS[event.type] || EVENT_COLORS.task_completed;

                  return (
                    <div
                      key={event.id || index}
                      className={`flex gap-4 p-4 rounded-xl ${colors.bg}`}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white">
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-dark-900">{event.title}</h4>
                          {event.is_concern && (
                            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                              Concern
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-dark-600 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-dark-500">
                          <span>
                            {new Date(event.date).toLocaleDateString('en-NG', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                          {event.stage?.week && (
                            <span className="bg-white px-2 py-0.5 rounded text-xs">
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

        {/* Footer */}
        <div className="text-center mt-8 text-dark-400 text-sm">
          <p>
            Generated on {new Date(passport.generated_at).toLocaleDateString()}
          </p>
          <p className="mt-1">
            Powered by <span className="font-semibold text-primary-500">Bloom</span>
          </p>
        </div>
      </div>
    </div>
  );
}
