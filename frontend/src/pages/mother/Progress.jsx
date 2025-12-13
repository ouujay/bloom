import { useParams } from 'react-router-dom';
import { useDailyProgram } from '../../hooks/useDailyProgram';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import ProgressBar from '../../components/common/ProgressBar';
import StreakBadge from '../../components/daily/StreakBadge';
import { CheckCircle, BookOpen, Target, Award } from 'lucide-react';

export default function Progress() {
  const { childId } = useParams();
  const { progress, isLoadingProgress } = useDailyProgram(childId);

  if (isLoadingProgress) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
          <p className="text-gray-600">Track your pregnancy learning journey</p>
        </div>
        <StreakBadge streak={progress?.streak} />
      </div>

      {/* Overall progress */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Journey</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Program completion</span>
            <span className="font-semibold text-gray-900">{progress?.overall_percentage || 0}%</span>
          </div>
          <ProgressBar value={progress?.overall_percentage || 0} size="lg" />
        </div>
        <p className="text-sm text-gray-500">
          You've completed {progress?.days_completed || 0} out of {progress?.total_days || 0} days
        </p>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary-100 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-sm text-gray-600">Lessons Read</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{progress?.lessons_completed || 0}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-bloom-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-bloom-600" />
            </div>
            <span className="text-sm text-gray-600">Tasks Done</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{progress?.tasks_completed || 0}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Check-ins</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{progress?.checkins_completed || 0}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-600">Tokens Earned</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{progress?.tokens_earned || 0}</p>
        </Card>
      </div>

      {/* Weekly progress */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h2>
        <div className="space-y-4">
          {progress?.weeks?.map((week) => (
            <div key={week.week_number}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Week {week.week_number}</span>
                <span className="font-medium text-gray-900">
                  {week.completed_days}/{week.total_days} days
                </span>
              </div>
              <ProgressBar
                value={(week.completed_days / week.total_days) * 100}
                color={week.is_current ? 'primary' : 'bloom'}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      {progress?.achievements?.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h2>
          <div className="grid grid-cols-3 gap-4">
            {progress.achievements.map((achievement) => (
              <div key={achievement.id} className="text-center">
                <div className="text-4xl mb-2">{achievement.emoji}</div>
                <p className="text-sm font-medium text-gray-900">{achievement.title}</p>
                <p className="text-xs text-gray-500">{achievement.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
