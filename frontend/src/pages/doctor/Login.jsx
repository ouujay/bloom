import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Stethoscope, Heart } from 'lucide-react';

const DEMO_DOCTOR = {
  email: 'doctor@bloom.ng',
  password: 'doctor1234',
};

export default function DoctorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.is_doctor) {
        navigate('/doctor', { replace: true });
      } else {
        navigate('/children', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);

      if (!user.is_doctor) {
        toast.error('This account is not a verified doctor account');
        return;
      }

      toast.success(`Welcome, Dr. ${user.last_name || user.first_name}!`);
      navigate('/doctor');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail(DEMO_DOCTOR.email);
    setPassword(DEMO_DOCTOR.password);
    toast.success('Filled demo doctor credentials');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bloom-700">
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-16">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8">
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight">
            Bloom<br />
            <span className="text-bloom-200">Doctor Portal</span>
          </h1>
          <p className="mt-6 text-lg text-white/90 max-w-md">
            Review health reports, monitor patient alerts, and provide care guidance to pregnant mothers.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-bloom-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Doctor Portal</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-2 text-gray-600">Access your doctor dashboard</p>
          </div>

          {/* Demo Account */}
          <div className="mb-6 p-4 bg-bloom-50 border border-bloom-200 rounded-2xl">
            <p className="text-sm font-medium text-bloom-800 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Demo Doctor Account
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full flex items-center justify-center gap-2 p-3 bg-bloom-100 hover:bg-bloom-200 text-bloom-700 rounded-xl transition-all"
            >
              <Stethoscope className="w-5 h-5" />
              <span className="font-medium">Click to fill demo credentials</span>
            </button>
            <p className="text-xs text-bloom-600 mt-2 text-center">
              doctor@bloom.ng / doctor1234
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloom-500 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bloom-600 hover:bg-bloom-700 disabled:bg-bloom-300 text-white font-medium py-3 px-4 rounded-xl transition-all hover:shadow-lg disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Need a doctor account?{' '}
            <Link to="/doctor/signup" className="text-bloom-600 font-medium hover:text-bloom-700">
              Request access
            </Link>
          </p>

          <p className="mt-4 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
              Mother login instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
