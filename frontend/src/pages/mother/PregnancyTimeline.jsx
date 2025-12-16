import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDailyProgram } from '../../hooks/useDailyProgram';
import {
  ChevronLeft,
  Baby,
  Heart,
  Sparkles,
  Calendar,
  Check,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

// Beautiful pregnancy images from Unsplash (free to use)
const journeyImages = [
  'https://images.unsplash.com/photo-1710897869625-feacd81ed629?w=800&q=80', // Black pregnant woman portrait
  'https://images.unsplash.com/photo-1570919887593-3555c02d7a74?w=600&q=80', // Mother holding belly
  'https://images.unsplash.com/photo-1675034824692-62320f8de654?w=600&q=80', // Pregnant woman with flowers
  'https://images.unsplash.com/photo-1639236301225-6080d79a7299?w=600&q=80', // Maternity window scene
];

// Trimester data with matching images
const TRIMESTERS = [
  {
    name: 'First Trimester',
    weeks: '1-12',
    color: 'primary',
    description: 'Your baby is forming all major organs. This is when the foundation is built.',
    // Early pregnancy - beginning of the journey
    image: 'https://images.unsplash.com/photo-1637182622799-76c3f005da25?w=800&q=80',
  },
  {
    name: 'Second Trimester',
    weeks: '13-27',
    color: 'bloom',
    description: 'Baby is growing rapidly and you can feel those magical first movements.',
    // Growing belly with visible movements
    image: 'https://images.unsplash.com/photo-1570919887593-3555c02d7a74?w=800&q=80',
  },
  {
    name: 'Third Trimester',
    weeks: '28-40',
    color: 'purple',
    description: 'Final preparations. Your baby is getting ready to meet you.',
    // Full term, ready to meet baby
    image: 'https://images.unsplash.com/photo-1710897869625-feacd81ed629?w=800&q=80',
  },
];

// Weekly milestones
const MILESTONES = [
  { week: 4, title: 'Heart Begins to Beat', icon: Heart, description: 'Your baby\'s heart starts its first beats' },
  { week: 8, title: 'Tiny Fingers Form', icon: Baby, description: 'Fingers and toes are now visible' },
  { week: 12, title: 'End of First Trimester', icon: Check, description: 'All major organs are formed' },
  { week: 20, title: 'Halfway There!', icon: Sparkles, description: 'You may start feeling movements' },
  { week: 24, title: 'Viability Milestone', icon: Heart, description: 'Baby could survive outside womb' },
  { week: 28, title: 'Third Trimester', icon: Calendar, description: 'Baby is practicing breathing' },
  { week: 36, title: 'Almost Ready', icon: Sparkles, description: 'Baby is considered full term soon' },
  { week: 40, title: 'Due Date', icon: Heart, description: 'Your baby is ready to meet you!' },
];

// Baby sizes by week
const BABY_SIZES = {
  4: { size: 'Poppy seed', length: '0.1 cm' },
  5: { size: 'Sesame seed', length: '0.2 cm' },
  6: { size: 'Lentil', length: '0.5 cm' },
  7: { size: 'Blueberry', length: '1 cm' },
  8: { size: 'Raspberry', length: '1.6 cm' },
  9: { size: 'Cherry', length: '2.3 cm' },
  10: { size: 'Kumquat', length: '3 cm' },
  11: { size: 'Fig', length: '4 cm' },
  12: { size: 'Lime', length: '5.4 cm' },
  13: { size: 'Lemon', length: '7 cm' },
  14: { size: 'Peach', length: '8.5 cm' },
  15: { size: 'Apple', length: '10 cm' },
  16: { size: 'Avocado', length: '12 cm' },
  17: { size: 'Pear', length: '13 cm' },
  18: { size: 'Sweet potato', length: '14 cm' },
  19: { size: 'Mango', length: '15 cm' },
  20: { size: 'Banana', length: '16 cm' },
  21: { size: 'Carrot', length: '27 cm' },
  22: { size: 'Papaya', length: '28 cm' },
  23: { size: 'Grapefruit', length: '29 cm' },
  24: { size: 'Corn on the cob', length: '30 cm' },
  25: { size: 'Cauliflower', length: '35 cm' },
  26: { size: 'Lettuce head', length: '36 cm' },
  27: { size: 'Rutabaga', length: '37 cm' },
  28: { size: 'Eggplant', length: '38 cm' },
  29: { size: 'Butternut squash', length: '39 cm' },
  30: { size: 'Cabbage', length: '40 cm' },
  31: { size: 'Coconut', length: '41 cm' },
  32: { size: 'Squash', length: '42 cm' },
  33: { size: 'Pineapple', length: '44 cm' },
  34: { size: 'Cantaloupe', length: '45 cm' },
  35: { size: 'Honeydew melon', length: '46 cm' },
  36: { size: 'Romaine lettuce', length: '47 cm' },
  37: { size: 'Swiss chard', length: '48 cm' },
  38: { size: 'Leek', length: '49 cm' },
  39: { size: 'Watermelon', length: '50 cm' },
  40: { size: 'Pumpkin', length: '51 cm' },
};

export default function PregnancyTimeline() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { progress, child } = useDailyProgram(childId);
  const heroRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const currentWeek = progress?.current_week || child?.pregnancy_week || 20;
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  // Scroll animation like landing page
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

  const heroScale = 1 - (scrollProgress * 0.5);
  const heroRadius = scrollProgress * 32;
  const heroInset = scrollProgress * 20;

  const getTrimester = (week) => {
    if (week <= 12) return 0;
    if (week <= 27) return 1;
    return 2;
  };

  const currentTrimester = getTrimester(currentWeek);

  const getMilestoneForWeek = (week) => {
    return MILESTONES.find(m => m.week === week);
  };

  const getWeekStyles = (week, isSelected, isCurrent, isPast) => {
    const trimester = getTrimester(week);

    if (isSelected) {
      if (trimester === 0) return 'bg-primary-500 text-white shadow-lg shadow-primary-500/30';
      if (trimester === 1) return 'bg-bloom-500 text-white shadow-lg shadow-bloom-500/30';
      return 'bg-purple-500 text-white shadow-lg shadow-purple-500/30';
    }

    if (isCurrent) {
      if (trimester === 0) return 'bg-primary-100 text-primary-700 ring-2 ring-primary-400';
      if (trimester === 1) return 'bg-bloom-100 text-bloom-700 ring-2 ring-bloom-400';
      return 'bg-purple-100 text-purple-700 ring-2 ring-purple-400';
    }

    if (isPast) {
      return 'bg-bloom-100 text-bloom-600';
    }

    return 'bg-white/90 backdrop-blur-sm text-dark-600 hover:bg-white shadow-sm';
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Floating Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-12">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/child/${childId}`)}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg shadow-dark-900/5 hover:bg-white transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-dark-600" />
              <span className="text-sm font-medium text-dark-700">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <a href="#journey" className="bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all">
                Journey
              </a>
              <a href="#trimesters" className="bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all">
                Trimesters
              </a>
              <a href="#milestones" className="bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all">
                Milestones
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Scroll Animation */}
      <section ref={heroRef} className="relative h-[180vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Animated Hero Image */}
          <div
            className="absolute inset-0 transition-all duration-100 ease-out"
            style={{
              transform: `scale(${heroScale})`,
              clipPath: `inset(${heroInset}% round ${heroRadius}px)`,
            }}
          >
            <img
              src={TRIMESTERS[currentTrimester].image}
              alt="Your pregnancy journey"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-dark-900/30" />
          </div>

          {/* Hero Content */}
          <div
            className="relative h-full flex flex-col justify-end pb-16 md:pb-24 transition-opacity duration-300"
            style={{ opacity: 1 - scrollProgress * 2 }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
              {/* Large Week Display */}
              <div className="mb-8">
                <p className="text-white/80 text-lg font-medium mb-2 drop-shadow">You are in</p>
                <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold text-white leading-none tracking-tight drop-shadow-lg">
                  Week {currentWeek}
                </h1>
                <p className="text-2xl md:text-3xl text-primary-200 font-medium mt-2 drop-shadow">
                  {TRIMESTERS[currentTrimester].name}
                </p>
              </div>

              {/* Baby Size & Progress */}
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                <div>
                  <p className="text-white/80 text-sm mb-1">Your baby is the size of a</p>
                  <p className="text-3xl md:text-4xl font-bold text-white drop-shadow">
                    {BABY_SIZES[currentWeek]?.size || 'Growing'}
                  </p>
                  <p className="text-white/70 mt-1">{BABY_SIZES[currentWeek]?.length || '--'}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white/80 text-sm">Progress</p>
                    <p className="text-2xl font-bold text-white">{Math.round((currentWeek / 40) * 100)}%</p>
                  </div>
                  <a
                    href="#journey"
                    className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center hover:bg-white hover:text-dark-900 text-white transition-all"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section id="journey" className="relative bg-cream-100 py-24 -mt-[80vh]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {journeyImages.map((src, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-2xl md:rounded-3xl ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                }`}
                style={{ aspectRatio: index === 0 ? '1' : '1' }}
              >
                <img
                  src={src}
                  alt={`Journey moment ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/30 to-transparent" />
              </div>
            ))}
          </div>

          {/* Journey Text */}
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <p className="text-bloom-600 font-medium mb-4">Your Beautiful Journey</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-6">
              40 weeks of wonder
            </h2>
            <p className="text-dark-600 text-lg leading-relaxed">
              From the moment of conception to holding your baby in your arms,
              every week brings miraculous changes and new milestones.
            </p>
          </div>
        </div>
      </section>

      {/* Week Selector Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-primary-500 font-medium mb-4">Explore Each Week</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-6">
              Week by week
            </h2>
            <p className="text-dark-600 text-lg">
              Tap any week to learn what's happening with your baby
            </p>
          </div>

          {/* Week Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((week) => {
              const isCurrentWeek = week === currentWeek;
              const isPast = week < currentWeek;
              const isSelected = selectedWeek === week;
              const milestone = getMilestoneForWeek(week);

              return (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    getWeekStyles(week, isSelected, isCurrentWeek, isPast)
                  } ${milestone ? 'ring-2 ring-offset-2 ring-amber-400' : ''}`}
                >
                  {week}
                </button>
              );
            })}
          </div>

          {/* Selected Week Details */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-cream-50 rounded-3xl p-8 md:p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                  {getMilestoneForWeek(selectedWeek) ? (
                    (() => {
                      const Icon = getMilestoneForWeek(selectedWeek).icon;
                      return <Icon className="w-10 h-10 text-primary-500" />;
                    })()
                  ) : (
                    <Baby className="w-10 h-10 text-primary-500" />
                  )}
                </div>

                <h3 className="text-5xl font-bold text-dark-900 mb-2">Week {selectedWeek}</h3>

                <div className="flex items-center justify-center gap-3 mb-6">
                  {selectedWeek === currentWeek && (
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      You are here
                    </span>
                  )}
                  {selectedWeek < currentWeek && (
                    <span className="bg-bloom-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Completed
                    </span>
                  )}
                </div>

                {getMilestoneForWeek(selectedWeek) ? (
                  <>
                    <p className="text-2xl font-semibold text-primary-600 mb-3">
                      {getMilestoneForWeek(selectedWeek).title}
                    </p>
                    <p className="text-dark-600 text-lg">
                      {getMilestoneForWeek(selectedWeek).description}
                    </p>
                  </>
                ) : (
                  <p className="text-dark-600 text-lg">
                    Your baby continues to grow and develop. Every week brings amazing new changes!
                  </p>
                )}

                {BABY_SIZES[selectedWeek] && (
                  <div className="mt-8 pt-8 border-t border-cream-300">
                    <p className="text-dark-500 mb-2">Baby is the size of a</p>
                    <p className="text-3xl font-bold text-dark-900">{BABY_SIZES[selectedWeek].size}</p>
                    <p className="text-dark-500 mt-1">About {BABY_SIZES[selectedWeek].length}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trimesters Section */}
      <section id="trimesters" className="py-24 bg-cream-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-bloom-600 font-medium mb-4">The Three Stages</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-6">
              Your trimesters
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TRIMESTERS.map((trimester, index) => {
              const isActive = currentTrimester === index;
              const isPast = currentTrimester > index;

              return (
                <div key={index} className="relative">
                  <div className="text-8xl font-bold text-cream-300 mb-4">0{index + 1}</div>

                  {/* Image */}
                  <div className="relative rounded-3xl overflow-hidden mb-6 aspect-square">
                    <img
                      src={trimester.image}
                      alt={trimester.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent" />

                    {/* Status Badge */}
                    {isPast && (
                      <div className="absolute top-4 right-4 bg-bloom-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" /> Complete
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Current
                      </div>
                    )}

                    {/* Week Range */}
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white/80 text-sm">Weeks</p>
                      <p className="text-white text-2xl font-bold">{trimester.weeks}</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-dark-900 mb-3">{trimester.name}</h3>
                  <p className="text-dark-600 leading-relaxed">{trimester.description}</p>

                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 right-0 translate-x-1/2">
                      <ArrowRight className="w-6 h-6 text-cream-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section id="milestones" className="py-24 bg-bloom-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-bloom-600 font-medium mb-4">Key Moments</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-6">
                Milestones to celebrate
              </h2>
              <p className="text-dark-600 text-lg mb-8 leading-relaxed">
                Your pregnancy is filled with incredible milestones. From the first heartbeat
                to the final countdown, each moment is worth celebrating.
              </p>

              {/* Progress Stats */}
              <div className="bg-white rounded-3xl p-8">
                <div className="text-center mb-6">
                  <p className="text-dark-500 mb-2">Overall Progress</p>
                  <p className="text-5xl font-bold text-dark-900">{Math.round((currentWeek / 40) * 100)}%</p>
                </div>

                <div className="h-4 bg-cream-200 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-bloom-400 rounded-full transition-all duration-500"
                    style={{ width: `${(currentWeek / 40) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-dark-500">
                  <span>Week 1</span>
                  <span className="font-semibold text-bloom-600">Week {currentWeek}</span>
                  <span>Week 40</span>
                </div>

                <div className="mt-6 pt-6 border-t border-cream-200 text-center">
                  <p className="text-dark-500">Time remaining</p>
                  <p className="text-2xl font-bold text-dark-900">{40 - currentWeek} weeks</p>
                </div>
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-4">
              {MILESTONES.map((milestone, index) => {
                const isPast = milestone.week <= currentWeek;
                const isCurrent = milestone.week === currentWeek;
                const Icon = milestone.icon;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between bg-white rounded-2xl p-6 transition-all ${
                      isCurrent ? 'ring-2 ring-primary-400 shadow-lg' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isPast ? 'bg-bloom-100' : 'bg-cream-100'
                      }`}>
                        {isPast ? (
                          <Check className="w-6 h-6 text-bloom-600" />
                        ) : (
                          <Icon className="w-6 h-6 text-dark-400" />
                        )}
                      </div>
                      <div>
                        <p className={`font-semibold ${isPast ? 'text-bloom-700' : 'text-dark-700'}`}>
                          {milestone.title}
                        </p>
                        <p className="text-sm text-dark-500">{milestone.description}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      isCurrent
                        ? 'bg-primary-500 text-white'
                        : isPast
                          ? 'bg-bloom-100 text-bloom-700'
                          : 'bg-cream-100 text-dark-500'
                    }`}>
                      Week {milestone.week}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-400">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {40 - currentWeek} weeks to go
          </h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
            Every day brings you closer to meeting your little one.
            Keep learning, stay healthy, and enjoy this beautiful journey.
          </p>
          <Link
            to={`/child/${childId}`}
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 text-primary-600 font-medium px-8 py-4 rounded-full transition-all hover:shadow-xl"
          >
            Back to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-dark-900 text-cream-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Bloom" className="w-10 h-10 object-contain" />
              <span className="font-semibold text-white">Bloom</span>
            </div>
            <p className="text-sm">
              Supporting mothers through every moment
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
