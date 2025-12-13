import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Stethoscope, CheckCircle } from 'lucide-react';
import { doctorAPI } from '../../api/doctor';

export default function DoctorSignup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    medical_license: '',
    specialization: '',
    hospital_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await doctorAPI.signup(formData);
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-bloom-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-bloom-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted
          </h1>
          <p className="text-gray-600 mb-8">
            Your doctor account request has been submitted. Our team will review your credentials and verify your medical license. You'll receive an email once your account is approved.
          </p>
          <Link
            to="/doctor/login"
            className="inline-block bg-bloom-600 text-white font-medium py-3 px-8 rounded-xl hover:bg-bloom-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bloom-700">
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-16">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8">
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Join Bloom as a<br />
            <span className="text-bloom-200">Healthcare Provider</span>
          </h1>
          <p className="mt-6 text-lg text-white/90 max-w-md">
            Help monitor and support pregnant mothers across Nigeria. Review AI-triaged health reports and provide expert guidance.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-bloom-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Doctor Portal</span>
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-gray-600">Submit your details for verification</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@hospital.com"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08012345678"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical License Number
              </label>
              <input
                type="text"
                name="medical_license"
                value={formData.medical_license}
                onChange={handleChange}
                placeholder="MDCN/12345"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent"
              >
                <option value="">Select specialization</option>
                <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                <option value="General Practice">General Practice</option>
                <option value="Family Medicine">Family Medicine</option>
                <option value="Midwifery">Midwifery</option>
                <option value="Maternal-Fetal Medicine">Maternal-Fetal Medicine</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital/Clinic Name
              </label>
              <input
                type="text"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleChange}
                placeholder="General Hospital, Lagos"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bloom-600 hover:bg-bloom-700 disabled:bg-bloom-300 text-white font-medium py-3 px-4 rounded-xl transition-all hover:shadow-lg disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/doctor/login" className="text-bloom-600 font-medium hover:text-bloom-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
