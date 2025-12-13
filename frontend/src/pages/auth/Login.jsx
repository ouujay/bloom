import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Mother', email: 'demo@bloom.ng', password: 'demo1234' },
  { label: 'Admin', email: 'admin@bloom.ng', password: 'admin1234' },
  { label: 'Doctor', email: 'doctor@bloom.ng', password: 'doctor1234' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/children';

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);

      if (user.is_doctor) {
        navigate('/doctor');
      } else if (!user.onboarding_complete) {
        navigate('/onboarding');
      } else if (user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/children');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    toast.success(`Filled ${account.label} credentials`);
  };

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://i.pinimg.com/736x/f4/49/f0/f449f0c95f40b603012b2cbbbed1de3d.jpg"
          alt="African mother and baby"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-dark-900/30"></div>

        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-16">
          <h1 className="text-5xl font-bold text-white leading-tight drop-shadow-lg">
            Welcome back<br />
            <span className="text-primary-200">to Bloom</span>
          </h1>
          <p className="mt-6 text-lg text-white/90 max-w-md drop-shadow">
            Continue your pregnancy journey with daily lessons, health tracking, and rewards.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link to="/" className="inline-block mb-8">
            <img src="/logo.png" alt="Bloom" className="w-14 h-14 object-contain" />
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-dark-900">Sign in</h2>
            <p className="mt-2 text-dark-600">Enter your details to continue</p>
          </div>

          {/* Demo Accounts */}
          <div className="mb-6 p-4 bg-cream-200/50 rounded-2xl">
            <p className="text-xs text-dark-500 mb-2">Demo accounts</p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => fillDemoCredentials(account)}
                  className="flex-1 py-2 px-3 text-sm font-medium text-dark-600 bg-white hover:bg-cream-100 rounded-lg transition-all border border-cream-300"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-dark-900 placeholder:text-dark-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-400 hover:bg-primary-500 disabled:bg-primary-200 text-white font-medium py-3 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-400/25 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-dark-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-500 font-medium hover:text-primary-600">
              Sign up
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <Link to="/doctor/login" className="text-dark-500 hover:text-dark-700">
              Doctor Portal
            </Link>
            <span className="text-dark-300">|</span>
            <Link to="/donate" className="text-bloom-600 hover:text-bloom-700 font-medium">
              Support Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
