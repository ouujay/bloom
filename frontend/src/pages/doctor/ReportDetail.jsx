import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Baby,
  MessageSquare,
  Activity,
  FileText
} from 'lucide-react';
import { doctorAPI } from '../../api/doctor';
import toast from 'react-hot-toast';

const urgencyConfig = {
  critical: {
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: AlertTriangle,
    badge: 'bg-red-500 text-white',
    label: 'Critical'
  },
  urgent: {
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    icon: AlertCircle,
    badge: 'bg-orange-500 text-white',
    label: 'Urgent'
  },
  moderate: {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: Clock,
    badge: 'bg-yellow-500 text-white',
    label: 'Moderate'
  },
  normal: {
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircle,
    badge: 'bg-green-500 text-white',
    label: 'Normal'
  },
};

export default function ReportDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [addressing, setAddressing] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const res = await doctorAPI.getReport(reportId);
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load report');
      navigate('/doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleAddress = async () => {
    try {
      setAddressing(true);
      await doctorAPI.addressReport(reportId, notes);
      toast.success('Report marked as addressed');
      navigate('/doctor');
    } catch (err) {
      toast.error('Failed to address report');
    } finally {
      setAddressing(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  const { report, patient, pregnancy, conversation_transcript, recent_health_logs } = data;
  const config = urgencyConfig[report.urgency_level] || urgencyConfig.normal;
  const Icon = config.icon;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <button
        onClick={() => navigate('/doctor')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Urgency Banner */}
      <div className={`rounded-xl p-4 mb-6 border-2 ${config.color}`}>
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6" />
          <div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.badge}`}>
              {config.label} Priority
            </span>
            <p className="text-sm mt-1 opacity-80">
              Reported on {formatDate(report.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* AI Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-bloom-600" />
              AI Summary
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.ai_summary}</p>

            {report.ai_assessment && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Assessment</h3>
                <p className="text-gray-700">{report.ai_assessment}</p>
              </div>
            )}

            {report.ai_recommendation && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">AI Recommendation</h3>
                <p className="text-gray-700">{report.ai_recommendation}</p>
              </div>
            )}
          </div>

          {/* Symptoms */}
          {report.symptoms && report.symptoms.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-bloom-600" />
                Reported Symptoms
              </h2>
              <div className="flex flex-wrap gap-2">
                {report.symptoms.map((symptom, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Transcript */}
          {conversation_transcript && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-bloom-600" />
                Conversation Transcript
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {conversation_transcript}
                </pre>
              </div>
            </div>
          )}

          {/* Recent Health Logs */}
          {recent_health_logs && recent_health_logs.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3">Recent Health Logs</h2>
              <div className="space-y-3">
                {recent_health_logs.map((log, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{log.date}</span>
                      {log.mood && (
                        <span className="text-sm text-gray-500">Mood: {log.mood}</span>
                      )}
                    </div>
                    {log.symptoms && log.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {log.symptoms.map((s, j) => (
                          <span key={j} className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {log.notes && (
                      <p className="text-sm text-gray-600">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Notes & Action */}
          {!report.is_addressed && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3">Doctor Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes before marking as addressed..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bloom-500 focus:border-bloom-500 resize-none"
                rows={4}
              />
              <button
                onClick={handleAddress}
                disabled={addressing}
                className="mt-4 w-full bg-bloom-600 text-white py-3 rounded-lg font-medium hover:bg-bloom-700 transition-colors disabled:opacity-50"
              >
                {addressing ? 'Processing...' : 'Mark as Addressed'}
              </button>
            </div>
          )}

          {report.is_addressed && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Report Addressed</span>
              </div>
              {report.addressed_by_name && (
                <p className="text-sm text-green-600">By {report.addressed_by_name}</p>
              )}
              {report.doctor_notes && (
                <p className="mt-2 text-sm text-gray-700">{report.doctor_notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Patient Info */}
        <div className="space-y-6">
          {/* Patient Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-bloom-600" />
              Patient Info
            </h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{patient.name}</p>
              </div>
              {patient.phone && (
                <a
                  href={`tel:${patient.phone}`}
                  className="flex items-center gap-2 text-sm text-bloom-600 hover:text-bloom-700"
                >
                  <Phone className="w-4 h-4" />
                  {patient.phone}
                </a>
              )}
              {patient.email && (
                <a
                  href={`mailto:${patient.email}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
                >
                  <Mail className="w-4 h-4" />
                  {patient.email}
                </a>
              )}
              {patient.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {patient.location}
                </div>
              )}
            </div>

            {patient.emergency_contact && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Emergency Contact</p>
                <p className="text-sm font-medium">{patient.emergency_contact.name}</p>
                <p className="text-sm text-gray-600">{patient.emergency_contact.relationship}</p>
                <a
                  href={`tel:${patient.emergency_contact.phone}`}
                  className="text-sm text-bloom-600"
                >
                  {patient.emergency_contact.phone}
                </a>
              </div>
            )}
          </div>

          {/* Pregnancy Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Baby className="w-5 h-5 text-bloom-600" />
              Pregnancy
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Week</span>
                <span className="font-medium text-gray-900">Week {pregnancy.current_week}</span>
              </div>
              {pregnancy.due_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Due Date</span>
                  <span className="font-medium text-gray-900">{pregnancy.due_date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            {patient.phone && (
              <a
                href={`tel:${patient.phone}`}
                className="flex items-center gap-2 w-full bg-bloom-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-bloom-700 transition-colors justify-center"
              >
                <Phone className="w-4 h-4" />
                Call Patient
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
