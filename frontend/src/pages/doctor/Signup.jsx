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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.medical_license) newErrors.medical_license = 'License number is required';
    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    if (!formData.hospital_name) newErrors.hospital_name = 'Hospital name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

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
      <div className="min-h-screen flex items-center justify-center bg-cream-100 px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-bloom-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-bloom-600" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900 mb-4">
            Application Submitted
          </h1>
          <p className="text-dark-600 mb-8">
            Your doctor account request has been submitted. Our team will review your credentials and verify your medical license. You'll receive an email once your account is approved.
          </p>
          <Link
            to="/login"
            className="inline-block bg-bloom-500 text-white font-medium py-3 px-8 rounded-xl hover:bg-bloom-600 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2080&auto=format&fit=crop"
          alt="Healthcare professional"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-bloom-900/40"></div>

        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight drop-shadow-lg">
            Join Bloom as a<br />
            <span className="text-bloom-200">Healthcare Provider</span>
          </h1>
          <p className="mt-6 text-lg text-white/90 max-w-md drop-shadow">
            Help monitor and support pregnant mothers across Nigeria. Review AI-triaged health reports and provide expert guidance.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="Bloom" className="w-14 h-14 object-contain" />
            <span className="text-2xl font-bold text-dark-900">Bloom</span>
          </Link>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-dark-900">Doctor Registration</h2>
            <p className="mt-2 text-dark-600">Submit your details for verification</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
                />
                {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
                />
                {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@hospital.com"
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08012345678"
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Medical License Number
              </label>
              <input
                type="text"
                name="medical_license"
                value={formData.medical_license}
                onChange={handleChange}
                placeholder="MDCN/12345"
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
              />
              {errors.medical_license && <p className="mt-1 text-sm text-red-500">{errors.medical_license}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900"
              >
                <option value="">Select specialization</option>
                <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                <option value="General Practice">General Practice</option>
                <option value="Family Medicine">Family Medicine</option>
                <option value="Midwifery">Midwifery</option>
                <option value="Maternal-Fetal Medicine">Maternal-Fetal Medicine</option>
                <option value="Other">Other</option>
              </select>
              {errors.specialization && <p className="mt-1 text-sm text-red-500">{errors.specialization}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Hospital/Clinic Name
              </label>
              <input
                type="text"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleChange}
                placeholder="General Hospital, Lagos"
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
              />
              {errors.hospital_name && <p className="mt-1 text-sm text-red-500">{errors.hospital_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bloom-500 hover:bg-bloom-600 disabled:bg-bloom-200 text-white font-medium py-3 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-bloom-500/25 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <p className="mt-8 text-center text-dark-600">
            Already have an account?{' '}
            <Link to="/login" className="text-bloom-500 font-medium hover:text-bloom-600">
              Sign in
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-cream-200">
            <p className="text-center text-dark-500 text-sm">
              Not a healthcare provider?{' '}
              <Link to="/signup" className="text-primary-500 font-medium hover:text-primary-600">
                Sign up as a Mother
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
