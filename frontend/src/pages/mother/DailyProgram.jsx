import { useParams } from 'react-router-dom';
import { useDailyProgram } from '../../hooks/useDailyProgram';
import Loader from '../../components/common/Loader';
import LessonView from '../../components/daily/LessonView';
import TaskList from '../../components/daily/TaskList';
import HealthCheckin from '../../components/daily/HealthCheckin';
import WeekProgress from '../../components/daily/WeekProgress';

export default function DailyProgram() {
  const { childId } = useParams();
  const {
    today,
    isLoadingToday,
    completeLesson,
    completeTask,
    submitCheckin,
    isCompletingLesson,
    isCompletingTask,
    isSubmittingCheckin,
  } = useDailyProgram(childId);

  if (isLoadingToday) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  if (!today) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Program Today</h2>
        <p className="text-gray-600">Check back tomorrow for your next lesson.</p>
      </div>
    );
  }

  const handleCompleteTask = (taskId) => {
    completeTask({ dayId: today.id, taskId });
  };

  const handleSubmitCheckin = (data) => {
    submitCheckin({ dayId: today.id, data });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today's Program</h1>
        <p className="text-gray-600">Week {today.week} • Day {today.day_number}</p>
      </div>

      <WeekProgress week={today.week} days={today.week_days} />

      <LessonView
        lesson={today.lesson}
        onComplete={() => completeLesson(today.id)}
        isCompleting={isCompletingLesson}
        isCompleted={today.lesson_completed}
      />

      <TaskList
        tasks={today.tasks}
        onComplete={handleCompleteTask}
        isCompleting={isCompletingTask}
      />

      <HealthCheckin
        onSubmit={handleSubmitCheckin}
        isSubmitting={isSubmittingCheckin}
        isCompleted={today.checkin_completed}
      />
    </div>
  );
}
