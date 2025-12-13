import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, Check, Smile, Meh, Frown, AlertTriangle } from 'lucide-react';
import { healthAPI } from '../../api/health';
import { dailyAPI } from '../../api/daily';
import toast from 'react-hot-toast';

const MOODS = [
  { value: 'great', label: 'Great', icon: Smile, color: 'text-green-500 bg-green-100' },
  { value: 'good', label: 'Good', icon: Smile, color: 'text-bloom-500 bg-bloom-100' },
  { value: 'okay', label: 'Okay', icon: Meh, color: 'text-yellow-500 bg-yellow-100' },
  { value: 'tired', label: 'Tired', icon: Meh, color: 'text-orange-500 bg-orange-100' },
  { value: 'unwell', label: 'Unwell', icon: Frown, color: 'text-red-500 bg-red-100' },
];

const SYMPTOMS = [
  'Nausea', 'Headache', 'Back pain', 'Fatigue', 'Swelling',
  'Cramping', 'Dizziness', 'Heartburn', 'Insomnia', 'Anxiety',
  'Breast tenderness', 'Frequent urination', 'Shortness of breath'
];

const BABY_MOVEMENT = [
  { value: 'very_active', label: 'Very Active' },
  { value: 'normal', label: 'Normal' },
  { value: 'less_than_usual', label: 'Less Than Usual' },
  { value: 'not_felt', label: 'Not Felt Today' },
];

export default function HealthCheckin() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingLog, setExistingLog] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const [formData, setFormData] = useState({
    mood: '',
    symptoms: [],
    baby_movement: '',
    weight_kg: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    notes: '',
  });

  useEffect(() => {
    checkExistingLog();
  }, [childId]);

  const checkExistingLog = async () => {
    try {
      const res = await healthAPI.getTodayLog(childId);
      if (res.data?.data) {
        setExistingLog(res.data.data);
        setFormData({
          mood: res.data.data.mood || '',
          symptoms: res.data.data.symptoms || [],
          baby_movement: res.data.data.baby_movement || '',
          weight_kg: res.data.data.weight_kg || '',
          blood_pressure_systolic: res.data.data.blood_pressure_systolic || '',
          blood_pressure_diastolic: res.data.data.blood_pressure_diastolic || '',
          notes: res.data.data.notes || '',
        });
      }
    } catch (err) {
      console.error('Error checking existing log:', err);
    } finally {
      setCheckingExisting(false);
    }
  };

  const toggleSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mood) {
      toast.error('Please select how you\'re feeling');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        child_id: childId,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
      };

      // Save to health logs
      await healthAPI.createLog(data);

      // Also complete the daily program check-in to award tokens
      try {
        const todayRes = await dailyAPI.getToday(childId);
        if (todayRes.data?.data?.id && !todayRes.data?.data?.checkin_completed) {
          const checkinData = {
            mood: formData.mood,
            symptoms: formData.symptoms,
            baby_movement: formData.baby_movement,
            weight: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
            bp_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
            bp_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
            notes: formData.notes,
          };
          await dailyAPI.submitCheckin(childId, todayRes.data.data.id, checkinData);
          toast.success('Health check-in saved! +5 tokens earned!');
        } else {
          toast.success('Health check-in updated!');
        }
      } catch (dailyErr) {
        // Daily program check-in failed but health log was saved
        toast.success('Health check-in saved!');
      }

      navigate(`/child/${childId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save check-in');
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Heart className="w-12 h-12 text-primary-400 mx-auto mb-4 animate-pulse" />
          <p className="text-dark-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/child/${childId}`)}
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-dark-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Daily Health Check-in</h1>
          <p className="text-dark-500">
            {existingLog ? 'Update your check-in' : 'How are you feeling today?'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
          <h2 className="font-semibold text-dark-900 mb-4">How are you feeling?</h2>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map(mood => {
              const Icon = mood.icon;
              const isSelected = formData.mood === mood.value;
              return (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mood: mood.value }))}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    isSelected
                      ? `${mood.color} ring-2 ring-offset-2 ring-primary-400`
                      : 'bg-cream-100 hover:bg-cream-200'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-dark-400'}`} />
                  <span className={`text-xs font-medium ${isSelected ? '' : 'text-dark-600'}`}>
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
          <h2 className="font-semibold text-dark-900 mb-4">Any symptoms today?</h2>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map(symptom => {
              const isSelected = formData.symptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-cream-100 text-dark-600 hover:bg-cream-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                  {symptom}
                </button>
              );
            })}
          </div>
        </div>

        {/* Baby Movement */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
          <h2 className="font-semibold text-dark-900 mb-4">Baby movement today?</h2>
          <div className="grid grid-cols-2 gap-3">
            {BABY_MOVEMENT.map(option => {
              const isSelected = formData.baby_movement === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, baby_movement: option.value }))}
                  className={`p-4 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-bloom-100 border-2 border-bloom-500 text-bloom-700'
                      : 'bg-cream-100 border-2 border-transparent hover:bg-cream-200'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
          {formData.baby_movement === 'not_felt' && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                If you haven't felt baby move, try drinking cold water and lying on your side.
                If still no movement after an hour, please contact your doctor.
              </p>
            </div>
          )}
        </div>

        {/* Vitals (Optional) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
          <h2 className="font-semibold text-dark-900 mb-4">Vitals (Optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                placeholder="e.g. 65.5"
                className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-600 mb-1">Blood Pressure</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={formData.blood_pressure_systolic}
                  onChange={(e) => setFormData(prev => ({ ...prev, blood_pressure_systolic: e.target.value }))}
                  placeholder="120"
                  className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                />
                <span className="text-dark-400">/</span>
                <input
                  type="number"
                  value={formData.blood_pressure_diastolic}
                  onChange={(e) => setFormData(prev => ({ ...prev, blood_pressure_diastolic: e.target.value }))}
                  placeholder="80"
                  className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
          <h2 className="font-semibold text-dark-900 mb-4">Additional Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Anything else you want to note about today..."
            rows={3}
            className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-4 rounded-xl transition-colors"
        >
          {loading ? 'Saving...' : existingLog ? 'Update Check-in' : 'Save Check-in'}
        </button>
      </form>
    </div>
  );
}
