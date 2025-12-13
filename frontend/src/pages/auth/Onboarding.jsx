import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/auth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, title: 'Pregnancy Info' },
  { id: 2, title: 'Health Profile' },
  { id: 3, title: 'Emergency Contact' },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    due_date: '',
    weeks_pregnant: '',
    first_pregnancy: true,
    blood_type: '',
    existing_conditions: [],
    hospital_name: '',
    doctor_name: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await authAPI.updateProfile({
        ...formData,
        onboarding_complete: true,
      });
      updateUser({ onboarding_complete: true });
      toast.success('Profile setup complete!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">Help us personalize your experience</p>
        </div>

        {/* Progress */}
        <div className="flex justify-between mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex-1 ${step.id !== steps.length ? 'border-b-2' : ''} ${
                step.id <= currentStep ? 'border-primary-500' : 'border-gray-200'
              } pb-4`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id <= currentStep
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                <span className={`text-sm ${step.id <= currentStep ? 'text-primary-600' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Card padding="lg">
          {currentStep === 1 && (
            <div className="space-y-4">
              <Input
                type="date"
                label="Expected Due Date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
              />

              <Input
                type="number"
                label="Current Weeks Pregnant"
                name="weeks_pregnant"
                value={formData.weeks_pregnant}
                onChange={handleChange}
                placeholder="e.g., 12"
              />

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="first_pregnancy"
                    checked={formData.first_pregnancy}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">This is my first pregnancy</span>
                </label>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                <select
                  name="blood_type"
                  value={formData.blood_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <Input
                label="Hospital / Clinic Name"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleChange}
                placeholder="Where you'll deliver"
              />

              <Input
                label="Doctor's Name"
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleChange}
                placeholder="Your OB/GYN"
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <Input
                label="Emergency Contact Name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                placeholder="Who to call in emergency"
              />

              <Input
                type="tel"
                label="Emergency Contact Phone"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                placeholder="Their phone number"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <select
                  name="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse/Partner</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-6 border-t">
            {currentStep > 1 && (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep < steps.length ? (
              <Button onClick={handleNext} className="ml-auto">
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading} className="ml-auto">
                Complete Setup
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
