import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building2, CheckCircle } from 'lucide-react';
import { organizationAPI } from '../../api/organization';

export default function OrganizationSignup() {
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: '',
    license_number: '',
    phone: '',
    address: '',
    admin_first_name: '',
    admin_last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    if (!formData.organization_name) newErrors.organization_name = 'Organization name is required';
    if (!formData.organization_type) newErrors.organization_type = 'Organization type is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.admin_first_name) newErrors.admin_first_name = 'First name is required';
    if (!formData.admin_last_name) newErrors.admin_last_name = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
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
      await organizationAPI.signup({
        organization_name: formData.organization_name,
        organization_type: formData.organization_type,
        license_number: formData.license_number,
        organization_phone: formData.phone,
        organization_address: formData.address,
        first_name: formData.admin_first_name,
        last_name: formData.admin_last_name,
        email: formData.email,
        phone: formData.phone, // Admin phone same as org phone for simplicity
        password: formData.password,
      });
      setSuccess(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to create organization';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900 mb-4">
            Application Submitted
          </h1>
          <p className="text-dark-600 mb-8">
            Your organization account request has been submitted. Our team will review and verify your details. You'll receive an email once your organization is approved.
          </p>
          <Link
            to="/login"
            className="inline-block bg-primary-500 text-white font-medium py-3 px-8 rounded-xl hover:bg-primary-600 transition-colors"
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
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"
          alt="Healthcare facility"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-900/40"></div>

        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight drop-shadow-lg">
            Register Your<br />
            <span className="text-primary-200">Healthcare Facility</span>
          </h1>
          <p className="mt-6 text-lg text-white/90 max-w-md drop-shadow">
            Connect with expecting mothers, access their health records, and provide continuous care for better pregnancy outcomes.
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
            <h2 className="text-3xl font-bold text-dark-900">Organization Registration</h2>
            <p className="mt-2 text-dark-600">Register your facility to connect with patients</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Details */}
            <div className="pb-4 border-b border-cream-200">
              <h3 className="text-sm font-semibold text-dark-700 uppercase tracking-wider mb-4">Organization Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    placeholder="Lagos General Hospital"
                    className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
                  />
                  {errors.organization_name && <p className="mt-1 text-sm text-red-500">{errors.organization_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Organization Type
                  </label>
                  <select
                    name="organization_type"
                    value={formData.organization_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900"
                  >
                    <option value="">Select type</option>
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                    <option value="health_center">Health Center</option>
                    <option value="maternity_home">Maternity Home</option>
                  </select>
                  {errors.organization_type && <p className="mt-1 text-sm text-red-500">{errors.organization_type}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    License Number <span className="text-dark-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    placeholder="HF/12345/2024"
                    className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
                  />
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
                    className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Address <span className="text-dark-400">(optional)</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Hospital Road, Lagos"
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Admin Account */}
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-dark-700 uppercase tracking-wider mb-4">Admin Account</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="admin_first_name"
                      value={formData.admin_first_name}
                      onChange={handleChange}
                      placeholder="John"
                      className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
                    />
                    {errors.admin_first_name && <p className="mt-1 text-sm text-red-500">{errors.admin_first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="admin_last_name"
                      value={formData.admin_last_name}
                      onChange={handleChange}
                      placeholder="Doe"
                      className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
                    />
                    {errors.admin_last_name && <p className="mt-1 text-sm text-red-500">{errors.admin_last_name}</p>}
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
                    placeholder="admin@hospital.com"
                    className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
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
                      className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500 pr-12"
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
                      className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500 pr-12"
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
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200 text-white font-medium py-3 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Submitting...' : 'Register Organization'}
            </button>
          </form>

          <p className="mt-8 text-center text-dark-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 font-medium hover:text-primary-600">
              Sign in
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-cream-200">
            <p className="text-center text-dark-500 text-sm">
              Looking to sign up as a mother or doctor?{' '}
              <Link to="/signup" className="text-bloom-500 font-medium hover:text-bloom-600">
                Mother Signup
              </Link>
              {' | '}
              <Link to="/doctor/signup" className="text-bloom-500 font-medium hover:text-bloom-600">
                Doctor Signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
