import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Circle } from 'lucide-react';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';

export default function DailyCard({ day }) {
  const completedTasks = day?.tasks?.filter(t => t.completed).length || 0;
  const totalTasks = day?.tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
            Week {day?.week} • Day {day?.day_number}
          </span>
          <h3 className="text-lg font-semibold mt-2 text-gray-900">{day?.title}</h3>
        </div>
        {day?.is_complete ? (
          <CheckCircle className="w-6 h-6 text-bloom-500" />
        ) : (
          <Circle className="w-6 h-6 text-gray-300" />
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{day?.lesson_preview}</p>

      <ProgressBar value={progress} className="mb-3" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {completedTasks}/{totalTasks} tasks done
        </span>
        <Link
          to={`/dashboard/lesson/${day?.week}/${day?.day_number}`}
          className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
        >
          <BookOpen className="w-4 h-4" />
          {day?.is_complete ? 'Review' : 'Continue'}
        </Link>
      </div>
    </Card>
  );
}
