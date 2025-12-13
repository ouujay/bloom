import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import childrenApi from '../api/children';

// Images
const bgImage = 'https://i.pinimg.com/736x/f4/49/f0/f449f0c95f40b603074e2cbbbed1de3d.jpg';
const pregnantImg = 'https://i.pinimg.com/736x/ac/93/ff/ac93ff8e889d79139d1049d1e5894e30.jpg';
const babyImg = 'https://i.pinimg.com/736x/d4/1b/cb/d41bcb1fc114b618b2724e3b9ffdd2b5.jpg';
const emptyStateImg = 'https://i.pinimg.com/1200x/1b/49/fc/1b49fc306f5464006953e424d7644462.jpg';

export default function Children() {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setIsLoading(true);
        const response = await childrenApi.list();
        if (response.success) {
          setChildren(response.data.children || []);
        } else {
          setError('Failed to load children');
        }
      } catch (err) {
        console.error('Error fetching children:', err);
        setError('Failed to load children');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const handleChildClick = (child) => {
    navigate(`/child/${child.id}`);
  };

  const handleAddChild = () => {
    navigate('/children/add');
  };

  const getStageDisplay = (child) => {
    if (child.status === 'pregnant') {
      const weeks = child.pregnancy_week || 0;
      return `Week ${weeks} of pregnancy`;
    } else if (child.status === 'born') {
      const months = child.age_months || 0;
      if (months < 1) {
        return 'Newborn';
      } else if (months === 1) {
        return '1 month old';
      } else {
        return `${months} months old`;
      }
    }
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="Bloom" className="w-32 h-32 object-contain mx-auto mb-6 animate-pulse" />
          <p className="text-dark-600 text-lg font-medium">Loading...</p>
          <p className="text-dark-400 text-sm mt-2">Fetching your little ones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Background Image - Subtle */}
      <div className="fixed inset-0 z-0">
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover opacity-[0.03]"
        />
        <div className="absolute inset-0 bg-cream-100/70" />
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Logo - Pill */}
            <Link to="/" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg shadow-dark-900/5">
              <img src="/logo.png" alt="Bloom" className="w-12 h-12 object-contain" />
              <span className="text-lg font-semibold text-dark-900">Bloom</span>
            </Link>

            {/* Add Button - Pill */}
            <button
              onClick={handleAddChild}
              className="flex items-center gap-2 bg-primary-400 hover:bg-primary-500 text-white px-5 py-2.5 rounded-full shadow-lg shadow-primary-400/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Child</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-dark-900 mb-4">
              My Children
            </h1>
            <p className="text-dark-500 text-lg">
              {children.length === 0
                ? 'Add your first child to begin your journey'
                : `Tracking ${children.length} ${children.length === 1 ? 'little one' : 'little ones'}`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8">
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-6 py-4 text-center">
                {error}
              </div>
            </div>
          )}

          {/* Children List */}
          {children.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl shadow-xl shadow-dark-900/10 overflow-hidden max-w-lg mx-auto">
              <div className="h-48 overflow-hidden">
                <img
                  src={emptyStateImg}
                  alt="Mother and baby"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold text-dark-900 mb-3">No children yet</h3>
                <p className="text-dark-500 mb-8 leading-relaxed">
                  Add a pregnancy or baby to start tracking their journey with personalized insights and daily guidance.
                </p>
                <button
                  onClick={handleAddChild}
                  className="inline-flex items-center gap-2 bg-bloom-500 hover:bg-bloom-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-bloom-500/25 transition-all hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Child
                </button>
              </div>
            </div>
          ) : (
            /* Children Grid */
            <div className="grid md:grid-cols-2 gap-6">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildClick(child)}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-dark-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group"
                >
                  {/* Image Header */}
                  <div className="h-32 overflow-hidden relative">
                    <img
                      src={child.status === 'pregnant' ? pregnantImg : babyImg}
                      alt={child.name || 'Child'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white drop-shadow-lg">
                          {child.name || child.nickname || 'Baby'}
                        </h3>
                        <p className="text-white/80 text-sm drop-shadow">
                          {getStageDisplay(child)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        child.status === 'pregnant'
                          ? 'bg-primary-400/90 text-white'
                          : 'bg-bloom-400/90 text-white'
                      }`}>
                        {child.status === 'pregnant' ? 'Pregnant' : 'Baby'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Streak */}
                    {child.current_streak > 0 && (
                      <div className="flex items-center gap-2 mb-4 text-amber-600">
                        <span className="text-lg">🔥</span>
                        <span className="text-sm font-medium">{child.current_streak} day streak</span>
                      </div>
                    )}

                    {/* Progress bar for pregnancy */}
                    {child.status === 'pregnant' && child.pregnancy_week && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-dark-500">Progress</span>
                          <span className="font-semibold text-primary-600">
                            {Math.round((child.pregnancy_week / 40) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-400 rounded-full transition-all"
                            style={{ width: `${(child.pregnancy_week / 40) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-dark-400 mt-2">
                          {40 - child.pregnancy_week} weeks to go
                        </p>
                      </div>
                    )}

                    {/* Baby info */}
                    {child.status === 'born' && (
                      <p className="text-dark-500 text-sm">
                        {child.age_months ? `${child.age_months} months of milestones` : 'Just arrived!'}
                      </p>
                    )}

                    {/* View button */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-bloom-600 font-medium group-hover:text-bloom-700">
                        View details
                      </span>
                      <ChevronRight className="w-5 h-5 text-bloom-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}

              {/* Add Another Card */}
              <button
                onClick={handleAddChild}
                className="border-2 border-dashed border-cream-300 hover:border-bloom-400 rounded-3xl overflow-hidden flex flex-col items-center justify-center min-h-[280px] transition-all hover:bg-bloom-50/50 group relative"
              >
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img src={pregnantImg} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10 text-center p-6">
                  <div className="w-16 h-16 bg-cream-100 group-hover:bg-bloom-100 rounded-full flex items-center justify-center mb-4 mx-auto transition-colors">
                    <Plus className="w-8 h-8 text-dark-400 group-hover:text-bloom-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-700 group-hover:text-bloom-700 transition-colors">
                    Add Another Child
                  </h3>
                  <p className="text-dark-400 text-sm mt-1">
                    Track a new pregnancy or baby
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
