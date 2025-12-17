import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Droplet,
  Heart,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  Baby,
  Calendar,
  User,
  ChevronRight
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

export default function PatientDetail() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [patientRes, reportsRes] = await Promise.all([
        organizationAPI.getPatientDetail(patientId),
        organizationAPI.getPatientReports(patientId)
      ]);
      setPatient(patientRes.data.data.patient);
      setReports(reportsRes.data.data.reports || []);
    } catch (err) {
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient not found</h2>
        <Link to="/organization/patients" className="text-primary-500 hover:text-primary-600">
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Link
        to="/organization/patients"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Patients
      </Link>

      {/* Patient Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-2xl">
              {patient.patient_email?.charAt(0).toUpperCase() || 'P'}
            </span>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {patient.patient_email}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {patient.patient_phone && (
                <a
                  href={`tel:${patient.patient_phone}`}
                  className="flex items-center gap-1 hover:text-primary-500"
                >
                  <Phone className="w-4 h-4" />
                  {patient.patient_phone}
                </a>
              )}
              {patient.patient_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {patient.patient_location}
                </span>
              )}
              {patient.patient_blood_type && (
                <span className="flex items-center gap-1">
                  <Droplet className="w-4 h-4" />
                  {patient.patient_blood_type}
                </span>
              )}
              {patient.patient_genotype && (
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {patient.patient_genotype}
                </span>
              )}
            </div>

            {patient.patient_health_conditions?.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-gray-500">Health Conditions: </span>
                <span className="text-sm text-gray-700">
                  {patient.patient_health_conditions.join(', ')}
                </span>
              </div>
            )}

            {patient.patient_allergies && (
              <div className="mt-1">
                <span className="text-sm text-gray-500">Allergies: </span>
                <span className="text-sm text-gray-700">{patient.patient_allergies}</span>
              </div>
            )}
          </div>

          <div className="text-right text-sm text-gray-500">
            <div>Connected</div>
            <div className="font-medium text-gray-700">{formatDate(patient.connected_at)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['overview', 'reports'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Children/Pregnancies */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Children & Pregnancies</h2>
            </div>

            {patient.children?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No children shared with your organization
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {patient.children?.map(child => (
                  <div key={child.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        child.status === 'pregnant' ? 'bg-bloom-100' : 'bg-primary-100'
                      }`}>
                        <Baby className={`w-6 h-6 ${
                          child.status === 'pregnant' ? 'text-bloom-600' : 'text-primary-600'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {child.name || 'Unnamed'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            child.status === 'pregnant'
                              ? 'bg-bloom-100 text-bloom-700'
                              : 'bg-primary-100 text-primary-700'
                          }`}>
                            {child.status === 'pregnant' ? 'Pregnant' : 'Born'}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600">
                          {child.status === 'pregnant' ? (
                            <>
                              Week {child.current_stage?.week || '?'} &middot;
                              Trimester {child.current_stage?.trimester || '?'} &middot;
                              Due {child.due_date ? formatDate(child.due_date) : 'Unknown'}
                            </>
                          ) : (
                            <>
                              Born {child.birth_date ? formatDate(child.birth_date) : 'Unknown'}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Contacts */}
          {patient.emergency_contacts?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Emergency Contacts</h2>
              </div>

              <div className="divide-y divide-gray-100">
                {patient.emergency_contacts.map((contact, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.relationship}</div>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1 text-primary-500 hover:text-primary-600"
                    >
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Health Reports</h2>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No health reports yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map(report => {
                const config = urgencyConfig[report.urgency_level] || urgencyConfig.normal;
                const Icon = config.icon;

                return (
                  <div key={report.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                            {config.label}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-bloom-100 text-bloom-700">
                            Week {report.pregnancy_week}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(report.created_at)}
                          </span>
                        </div>

                        <p className="text-gray-900 mb-2">{report.ai_summary}</p>

                        {report.symptoms?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {report.symptoms.map((symptom, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
