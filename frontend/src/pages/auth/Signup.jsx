import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signup, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/children', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
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
      await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      toast.success('Account created successfully!');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1640143662721-9f9a6ef14a14?q=80&w=2071&auto=format&fit=crop"
          alt="Pregnant woman"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-dark-900/30"></div>

        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <h1 className="text-5xl font-bold text-white leading-tight drop-shadow-lg">
            Start your<br />
            <span className="text-primary-200">journey today</span>
          </h1>
          <p className="mt-6 text-lg text-white/90 max-w-md drop-shadow">
            Join thousands of mothers learning, tracking, and earning rewards throughout their pregnancy.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="Bloom" className="w-14 h-14 object-contain" />
            <span className="text-2xl font-bold text-dark-900">Bloom</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-dark-900">Create account</h2>
            <p className="mt-2 text-dark-600">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
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
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
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
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-400 hover:bg-primary-500 disabled:bg-primary-200 text-white font-medium py-3 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-400/25 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Creating account...' : 'Create Account'}
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
              Are you a healthcare provider?{' '}
              <Link to="/doctor/signup" className="text-bloom-600 font-medium hover:text-bloom-700">
                Register as a Doctor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
