import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDailyProgram } from '../../hooks/useDailyProgram';
import { useTokens } from '../../hooks/useTokens';
import { healthAPI } from '../../api/health';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import {
  BookOpen, TrendingUp, Calendar, ChevronRight,
  Baby, CheckCircle, Stethoscope, Heart,
  Activity, AlertCircle, Sparkles
} from 'lucide-react';

// Pregnancy week data for baby size comparisons
const BABY_SIZES = {
  4: 'Poppy seed', 5: 'Sesame seed', 6: 'Lentil', 7: 'Blueberry', 8: 'Raspberry',
  9: 'Cherry', 10: 'Kumquat', 11: 'Fig', 12: 'Lime', 13: 'Lemon', 14: 'Peach',
  15: 'Apple', 16: 'Avocado', 17: 'Pear', 18: 'Sweet potato', 19: 'Mango',
  20: 'Banana', 21: 'Carrot', 22: 'Papaya', 23: 'Grapefruit', 24: 'Corn on the cob',
  25: 'Cauliflower', 26: 'Lettuce head', 27: 'Rutabaga', 28: 'Eggplant',
  29: 'Butternut squash', 30: 'Cabbage', 31: 'Coconut', 32: 'Squash',
  33: 'Pineapple', 34: 'Cantaloupe', 35: 'Honeydew melon', 36: 'Romaine lettuce',
  37: 'Swiss chard', 38: 'Leek', 39: 'Watermelon', 40: 'Pumpkin'
};

const pregnantImg = 'https://i.pinimg.com/736x/ac/93/ff/ac93ff8e889d79139d1049d1e5894e30.jpg';
const babyImg = 'https://i.pinimg.com/736x/d4/1b/cb/d41bcb1fc114b618b2724e3b9ffdd2b5.jpg';

export default function Dashboard() {
  const { childId } = useParams();
  const { user } = useAuth();
  const {
    today,
    isLoadingToday,
    progress,
    isLoadingProgress,
    child,
    isLoadingChild,
    completeLesson,
    completeTask,
    isCompletingLesson,
    isCompletingTask
  } = useDailyProgram(childId);
  const { balance, isLoadingBalance } = useTokens();

  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!childId) return;
      try {
        const res = await healthAPI.getAppointments(childId, true);
        setAppointments(res.data?.data || []);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    };
    fetchAppointments();
  }, [childId]);

  const isLoading = isLoadingToday || isLoadingProgress || isLoadingBalance || isLoadingChild;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <img src="/logo.png" alt="Bloom" className="w-20 h-20 object-contain mx-auto mb-4 animate-pulse" />
          <p className="text-dark-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const childName = child?.name || child?.nickname || 'Baby';
  const stageWeek = progress?.current_week || child?.pregnancy_week || 1;
  const isPregnant = child?.status === 'pregnant';
  const babySize = BABY_SIZES[stageWeek] || 'growing';
  const showKickCounter = isPregnant && stageWeek >= 20;

  // Calculate daily tasks completion
  const lessonDone = today?.lesson_completed || false;
  const taskDone = today?.tasks?.[0]?.completed || false;
  const checkinDone = today?.checkin_completed || false;
  const tasksCompleted = [lessonDone, taskDone, checkinDone].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section with Baby Info */}
      <div className="relative rounded-3xl overflow-hidden bg-cream-100 border border-cream-200">
        <div className="absolute inset-0 opacity-20">
          <img
            src={isPregnant ? pregnantImg : babyImg}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-dark-500 text-sm mb-1">Welcome back,</p>
              <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-2">
                {user?.name?.split(' ')[0]}!
              </h1>
              {isPregnant ? (
                <div className="flex items-center gap-3 mt-3">
                  <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-primary-600 font-semibold">Week {stageWeek}</span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <Baby className="w-4 h-4 text-bloom-600" />
                    <span className="text-bloom-600 font-medium">Size of a {babySize}</span>
                  </div>
                </div>
              ) : (
                <p className="text-dark-600">
                  {childName} is {child?.age_months || 0} months old
                </p>
              )}
            </div>

            {/* Streak Badge */}
            {(progress?.streak || child?.current_streak) > 0 && (
              <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="font-semibold">{progress?.streak || child?.current_streak}</span>
              </div>
            )}
          </div>

          {/* Progress for pregnancy */}
          {isPregnant && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-dark-600">Pregnancy Progress</span>
                <span className="font-semibold text-primary-600">{Math.round((stageWeek / 40) * 100)}%</span>
              </div>
              <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-400 rounded-full transition-all"
                  style={{ width: `${(stageWeek / 40) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-dark-500 text-sm">{40 - stageWeek} weeks to go</p>
                <Link
                  to={`/child/${childId}/timeline`}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white text-dark-700 px-4 py-2 rounded-full text-sm font-medium shadow-lg shadow-dark-900/5 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  View Journey
                </Link>
                <Link
                  to={`/child/${childId}/passport`}
                  className="flex items-center gap-2 bg-bloom-500 hover:bg-bloom-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg shadow-bloom-500/25 transition-all"
                >
                  Life Passport
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg shadow-dark-900/5">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2.5 rounded-xl">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">{isPregnant ? 'Week' : 'Month'}</p>
              <p className="text-2xl font-bold text-dark-900">
                {isPregnant ? stageWeek : (child?.age_months || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg shadow-dark-900/5">
          <div className="flex items-center gap-3">
            <div className="bg-bloom-100 p-2.5 rounded-xl">
              <BookOpen className="w-5 h-5 text-bloom-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Lessons</p>
              <p className="text-2xl font-bold text-dark-900">{progress?.lessons_completed || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg shadow-dark-900/5">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2.5 rounded-xl">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Tasks</p>
              <p className="text-2xl font-bold text-dark-900">{progress?.tasks_completed || 0}</p>
            </div>
          </div>
        </Card>

        <Link to="/dashboard/wallet">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg shadow-dark-900/5 h-full hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2.5 rounded-xl">
                <span className="text-xl">🪙</span>
              </div>
              <div>
                <p className="text-sm text-dark-500">Tokens</p>
                <p className="text-2xl font-bold text-dark-900">{balance?.balance || 0}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Daily Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Daily Tasks</h2>
            <p className="text-sm text-dark-500">{tasksCompleted}/3 completed today</p>
          </div>
          <Link
            to={`/child/${childId}/today`}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center font-medium"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {today ? (
          <div className="grid gap-3">
            {/* Daily Lesson Task */}
            <Link
              to={`/child/${childId}/today`}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all flex items-center gap-4 ${
                lessonDone ? 'border-bloom-200 bg-bloom-50/30' : 'border-cream-200 hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                lessonDone ? 'bg-bloom-100' : 'bg-primary-100'
              }`}>
                {lessonDone ? (
                  <CheckCircle className="w-6 h-6 text-bloom-600" />
                ) : (
                  <BookOpen className="w-6 h-6 text-primary-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-900">Daily Lesson</h3>
                <p className="text-sm text-dark-500">
                  {lessonDone ? 'Completed' : today.lesson?.title || `Week ${stageWeek} Day ${today.day_number}`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-amber-600">+5 tokens</span>
              </div>
            </Link>

            {/* Wellness Task */}
            <div
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all flex items-center gap-4 ${
                taskDone ? 'border-bloom-200 bg-bloom-50/30' : 'border-cream-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                taskDone ? 'bg-bloom-100' : 'bg-purple-100'
              }`}>
                {taskDone ? (
                  <CheckCircle className="w-6 h-6 text-bloom-600" />
                ) : (
                  <Activity className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-900">Wellness Task</h3>
                <p className="text-sm text-dark-500">
                  {taskDone ? 'Completed' : today.tasks?.[0]?.title || 'Complete your daily task'}
                </p>
              </div>
              {!taskDone && (
                <button
                  onClick={() => completeTask(today.id)}
                  disabled={isCompletingTask}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isCompletingTask ? '...' : 'Done'}
                </button>
              )}
              {taskDone && (
                <span className="text-xs font-medium text-bloom-600">+5 tokens</span>
              )}
            </div>

            {/* Health Check-in */}
            <Link
              to={`/child/${childId}/checkin`}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all flex items-center gap-4 ${
                checkinDone ? 'border-bloom-200 bg-bloom-50/30' : 'border-cream-200 hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                checkinDone ? 'bg-bloom-100' : 'bg-rose-100'
              }`}>
                {checkinDone ? (
                  <CheckCircle className="w-6 h-6 text-bloom-600" />
                ) : (
                  <Heart className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-900">Health Check-in</h3>
                <p className="text-sm text-dark-500">
                  {checkinDone ? 'Completed' : 'Log how you\'re feeling today'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-amber-600">+5 tokens</span>
              </div>
            </Link>

            {/* Kick Counter - Only for 20+ weeks pregnancy */}
            {showKickCounter && (
              <Link
                to={`/child/${childId}/kicks`}
                className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200 hover:shadow-md transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-100">
                  <Baby className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-dark-900">Kick Counter</h3>
                  <p className="text-sm text-dark-500">Track baby movements</p>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-400" />
              </Link>
            )}
          </div>
        ) : (
          <Card className="text-center py-8">
            <BookOpen className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-500">No tasks available for today</p>
            <p className="text-sm text-dark-400 mt-1">Check back tomorrow!</p>
          </Card>
        )}
      </div>

      {/* Educational Videos - Hidden due to geo-restrictions in some regions */}
      {/* Videos are still accessible via /child/:childId/videos for users who want them */}

      {/* Upcoming Appointments */}
      {appointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-900">Upcoming Appointments</h2>
            <Link
              to={`/child/${childId}/appointments`}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center font-medium"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {appointments.slice(0, 2).map((appt) => (
              <Card key={appt.id} className="flex items-center gap-4">
                <div className="bg-teal-100 p-3 rounded-xl">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-dark-900">{appt.title}</h3>
                  <p className="text-sm text-dark-500">
                    {new Date(appt.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })} at {appt.time}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-400" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Progress */}
      <Card>
        <h3 className="font-semibold text-dark-900 mb-4">This Week's Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-600">Overall completion</span>
              <span className="font-semibold text-primary-600">{progress?.overall_percentage || 0}%</span>
            </div>
            <ProgressBar value={progress?.overall_percentage || 0} color="primary" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-600">Week {stageWeek}</span>
              <span className="font-semibold text-bloom-600">{progress?.week_percentage || 0}%</span>
            </div>
            <ProgressBar value={progress?.week_percentage || 0} color="bloom" />
          </div>
        </div>
        <Link
          to={`/child/${childId}/progress`}
          className="mt-4 block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View detailed progress
        </Link>
      </Card>

      {/* Danger Signs Alert (for pregnant users) */}
      {isPregnant && (
        <Card className="bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Know the Danger Signs</h3>
              <p className="text-sm text-red-700 mt-1">
                Seek immediate care if you experience: heavy bleeding, severe headaches with vision changes,
                severe abdominal pain, or reduced baby movement.
              </p>
              <Link
                to="/dashboard/emergency"
                className="inline-block mt-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                View emergency contacts →
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
