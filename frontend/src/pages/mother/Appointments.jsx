import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Clock, MapPin, User, Trash2, Check } from 'lucide-react';
import { healthAPI } from '../../api/health';
import toast from 'react-hot-toast';

export default function Appointments() {
  const { childId } = useParams();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    appointment_type: 'checkup',
    date: '',
    time: '',
    location: '',
    doctor_name: '',
    notes: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, [childId]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const res = await healthAPI.getAppointments(childId);
      setAppointments(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await healthAPI.createAppointment({
        ...formData,
        child_id: childId,
      });
      if (res.data?.success) {
        toast.success('Appointment scheduled!');
        setShowForm(false);
        setFormData({
          title: '',
          appointment_type: 'checkup',
          date: '',
          time: '',
          location: '',
          doctor_name: '',
          notes: '',
        });
        fetchAppointments();
      }
    } catch (err) {
      toast.error('Failed to create appointment');
    }
  };

  const markComplete = async (apptId) => {
    try {
      await healthAPI.updateAppointment(apptId, { is_completed: true });
      toast.success('Appointment marked as complete');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update appointment');
    }
  };

  const deleteAppointment = async (apptId) => {
    if (!confirm('Delete this appointment?')) return;
    try {
      await healthAPI.deleteAppointment(apptId);
      toast.success('Appointment deleted');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to delete appointment');
    }
  };

  const upcomingAppointments = appointments.filter(a => !a.is_completed && new Date(a.date) >= new Date().setHours(0,0,0,0));
  const pastAppointments = appointments.filter(a => a.is_completed || new Date(a.date) < new Date().setHours(0,0,0,0));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <img src="/logo.png" alt="Bloom" className="w-16 h-16 object-contain mx-auto mb-4 animate-pulse" />
          <p className="text-dark-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/child/${childId}`)}
              className="p-2 hover:bg-cream-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-dark-600" />
            </button>
            <h1 className="text-xl font-bold text-dark-900">Appointments</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-dark-900 mb-4">Schedule Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Prenatal checkup"
                  className="w-full px-4 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Type</label>
                  <select
                    value={formData.appointment_type}
                    onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                    className="w-full px-4 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="checkup">Checkup</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="lab_test">Lab Test</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={formData.doctor_name}
                    onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                    placeholder="Dr. Smith"
                    className="w-full px-4 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Hospital/Clinic address"
                  className="w-full px-4 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-4 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-cream-300 rounded-xl text-dark-600 font-medium hover:bg-cream-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upcoming Appointments */}
        <div>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">
            Upcoming ({upcomingAppointments.length})
          </h2>
          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <Calendar className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500">No upcoming appointments</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary-600 font-medium hover:text-primary-700"
              >
                Schedule one now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-900">{appt.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-dark-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(appt.date).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appt.time}
                        </span>
                      </div>
                      {appt.location && (
                        <p className="flex items-center gap-1 text-sm text-dark-500 mt-1">
                          <MapPin className="w-4 h-4" />
                          {appt.location}
                        </p>
                      )}
                      {appt.doctor_name && (
                        <p className="flex items-center gap-1 text-sm text-dark-500 mt-1">
                          <User className="w-4 h-4" />
                          {appt.doctor_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => markComplete(appt.id)}
                        className="p-2 hover:bg-bloom-100 rounded-lg text-bloom-600"
                        title="Mark as complete"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteAppointment(appt.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-dark-900 mb-4">
              Past ({pastAppointments.length})
            </h2>
            <div className="space-y-3">
              {pastAppointments.map((appt) => (
                <div key={appt.id} className="bg-white/60 rounded-2xl p-4 opacity-70">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-dark-700">{appt.title}</h3>
                      <p className="text-sm text-dark-500 mt-1">
                        {new Date(appt.date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })} at {appt.time}
                      </p>
                    </div>
                    {appt.is_completed && (
                      <span className="bg-bloom-100 text-bloom-700 text-xs px-2 py-1 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
