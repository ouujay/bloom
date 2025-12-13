import { Link, useNavigate } from 'react-router-dom';
import { Heart, BookOpen, Coins, Shield, ArrowRight, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Real images - Nigerian/African mothers and babies
const heroImage = 'https://images.unsplash.com/photo-1640143662721-9f9a6ef14a14?q=80&w=2071&auto=format&fit=crop';

const galleryImages = [
  'https://i.pinimg.com/736x/f4/49/f0/f449f0c95f40b603012b2cbbbed1de3d.jpg', // African mother and baby
  'https://i.pinimg.com/736x/d4/1b/cb/d41bcb1fc114b618b2724e3b9ffdd2b5.jpg', // Newborn baby
  'https://i.pinimg.com/1200x/ac/93/ff/ac93ff8e889d79139d1049d1e5894e30.jpg', // Pregnant woman
  'https://i.pinimg.com/1200x/1b/49/fc/1b49fc306f5464006953e424d7644462.jpg', // African pregnant woman
  'https://i.pinimg.com/736x/d4/1b/cb/d41bcb1fc114b618b2724e3b9ffdd2b5.jpg', // Newborn baby
];

export default function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Redirect logged-in users to children page
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/children', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / windowHeight, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroScale = 1 - (scrollProgress * 0.7);
  const heroRadius = scrollProgress * 24;
  const heroInset = scrollProgress * 30;

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Floating Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            {/* Logo - in pill */}
            <Link to="/" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg shadow-dark-900/5">
              <img src="/logo.png" alt="Bloom" className="w-12 h-12 object-contain" />
              <span className="text-lg font-semibold text-dark-900">Bloom</span>
            </Link>

            {/* Nav Links - each in pill */}
            <div className="hidden md:flex items-center gap-2">
              <a href="#" className="bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white hover:text-dark-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all">
                Home
              </a>
              <a href="#features" className="bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white hover:text-dark-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all">
                Features
              </a>
              <a href="#how-it-works" className="bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white hover:text-dark-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all">
                How It Works
              </a>
              <a href="#rewards" className="bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white hover:text-dark-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all">
                Rewards
              </a>
              <Link to="/donate" className="bg-bloom-500 hover:bg-bloom-600 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-bloom-500/25 transition-all flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                Donate
              </Link>
            </div>

            {/* Auth Buttons - in pills */}
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white hover:text-dark-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-primary-400 hover:bg-primary-500 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-primary-400/25 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Scroll Animation */}
      <section ref={heroRef} className="relative h-[200vh]">
        {/* Sticky Container */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Animated Hero */}
          <div
            className="absolute inset-0 transition-all duration-100 ease-out"
            style={{
              transform: `scale(${heroScale})`,
              clipPath: `inset(${heroInset}% round ${heroRadius}px)`,
            }}
          >
            {/* Hero Image */}
            <img
              src={heroImage}
              alt="African pregnant woman"
              className="w-full h-full object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-dark-900/20"></div>
          </div>

          {/* Hero Content - Right Aligned */}
          <div
            className="relative h-full flex flex-col justify-end pb-20 md:pb-32 transition-opacity duration-300"
            style={{ opacity: 1 - scrollProgress * 2 }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full flex flex-col items-end text-right">
              {/* Large Headline */}
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-bold text-white leading-[0.9] tracking-tight drop-shadow-lg">
                <span className="block">Nurturing</span>
                <span className="block text-primary-200">mothers.</span>
              </h1>

              {/* Subtitle and CTA */}
              <div className="mt-8 md:mt-12 flex flex-col items-end gap-8">
                <p className="text-lg md:text-xl text-white/90 max-w-md leading-relaxed drop-shadow">
                  Daily education, health tracking, and real rewards throughout your pregnancy journey.
                </p>

                <div className="flex items-center gap-4">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 text-dark-900 font-medium px-8 py-4 rounded-full transition-all hover:shadow-xl"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#gallery"
                    className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center hover:bg-white hover:text-dark-900 text-white transition-all"
                  >
                    <ArrowRight className="w-5 h-5 rotate-90" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section id="gallery" className="relative bg-cream-100 py-24 -mt-[100vh]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Gallery Grid with real images */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {galleryImages.map((src, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-2xl md:rounded-3xl ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                } ${index === 3 ? 'md:col-span-2' : ''}`}
                style={{ aspectRatio: index === 0 ? '1' : index === 3 ? '2/1' : '1' }}
              >
                <img
                  src={src}
                  alt={`Bloom journey ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/30 to-transparent"></div>
              </div>
            ))}
          </div>

          {/* Gallery Text */}
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <p className="text-bloom-600 font-medium mb-4">Your Journey</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-6">
              Every moment matters
            </h2>
            <p className="text-dark-600 text-lg leading-relaxed">
              From the first flutter to the final countdown, we're here to guide you
              through every beautiful moment of your pregnancy.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-primary-500 font-medium mb-4">Why Bloom?</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-6">
              Everything you need for a healthy pregnancy
            </h2>
            <p className="text-dark-600 text-lg">
              We've combined education, tracking, and motivation into one beautiful app
              designed specifically for expecting mothers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Daily Lessons',
                description: 'Expert-crafted content delivered daily, covering nutrition, exercise, and baby development.',
                color: 'primary',
              },
              {
                icon: Heart,
                title: 'Health Tracking',
                description: 'Log your mood, weight, symptoms, and baby movements to share with your healthcare provider.',
                color: 'bloom',
              },
              {
                icon: Coins,
                title: 'Earn Rewards',
                description: 'Complete daily activities to earn tokens you can redeem for real cash rewards.',
                color: 'primary',
              },
              {
                icon: Shield,
                title: 'Emergency Help',
                description: 'Quick access to warning signs and one-tap emergency contacts when you need them most.',
                color: 'bloom',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-cream-50 hover:bg-cream-100 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  feature.color === 'primary'
                    ? 'bg-primary-100 text-primary-500'
                    : 'bg-bloom-100 text-bloom-500'
                }`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-3">{feature.title}</h3>
                <p className="text-dark-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-cream-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-bloom-600 font-medium mb-4">Simple Process</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-6">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Sign up & set your due date',
                description: 'Create your free account and tell us about your pregnancy. We\'ll personalize everything for you.',
              },
              {
                step: '02',
                title: 'Learn & track daily',
                description: 'Complete your daily lesson, log your health check-in, and finish your wellness task.',
              },
              {
                step: '03',
                title: 'Earn & withdraw',
                description: 'Collect tokens for your activities and withdraw real cash rewards when you reach the minimum.',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-8xl font-bold text-cream-300 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-dark-900 mb-3">{item.title}</h3>
                <p className="text-dark-600 leading-relaxed">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 right-0 translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-cream-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section id="rewards" className="py-24 bg-bloom-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-bloom-600 font-medium mb-4">Real Rewards</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-6">
                Get paid for taking care of yourself
              </h2>
              <p className="text-dark-600 text-lg mb-8 leading-relaxed">
                We believe mothers deserve to be rewarded for prioritizing their health during pregnancy.
                Complete daily activities and earn tokens you can convert to real money.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Complete daily lesson', tokens: '+5 tokens' },
                  { label: 'Submit health check-in', tokens: '+5 tokens' },
                  { label: 'Finish wellness task', tokens: '+5 tokens' },
                  { label: '7-day streak bonus', tokens: '+20 tokens' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-bloom-400"></div>
                      <span className="text-dark-700">{item.label}</span>
                    </div>
                    <span className="font-semibold text-bloom-600">{item.tokens}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-8 p-4 bg-bloom-100 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-bloom-600" />
                <div>
                  <p className="font-semibold text-dark-900">10 tokens = ₦1</p>
                  <p className="text-sm text-dark-600">Minimum withdrawal: 100 tokens (₦10)</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-bloom-200 rounded-3xl blur-3xl opacity-40"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-dark-900/10 p-8">
                <div className="text-center mb-8">
                  <p className="text-dark-500 mb-2">Your Balance</p>
                  <p className="text-5xl font-bold text-dark-900">₦2,450</p>
                  <p className="text-bloom-600 mt-1">24,500 tokens</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-500">This week</span>
                    <span className="text-bloom-600 font-medium">+150 tokens</span>
                  </div>
                  <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-bloom-400 rounded-full"></div>
                  </div>
                  <p className="text-xs text-dark-500 text-center">75% to next milestone</p>
                </div>

                <button className="w-full bg-bloom-500 hover:bg-bloom-600 text-white font-medium py-4 rounded-2xl transition-all">
                  Withdraw Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-400">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to start your journey?
          </h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of mothers who are learning, tracking, and earning rewards
            throughout their pregnancy. It's free to start.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 text-primary-600 font-medium px-8 py-4 rounded-full transition-all hover:shadow-xl"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-dark-900 text-cream-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Bloom" className="w-12 h-12 object-contain" />
              <span className="font-semibold text-white">Bloom</span>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <Link to="/donate" className="hover:text-white transition-colors">Donate</Link>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-sm">
              &copy; {new Date().getFullYear()} Bloom. Made with love
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
