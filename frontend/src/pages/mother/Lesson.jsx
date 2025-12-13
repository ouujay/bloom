import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyAPI } from '../../api/daily';
import Loader from '../../components/common/Loader';
import LessonView from '../../components/daily/LessonView';
import TaskList from '../../components/daily/TaskList';
import Button from '../../components/common/Button';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Lesson() {
  const { week, day } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dayData, isLoading } = useQuery({
    queryKey: ['daily', 'day', week, day],
    queryFn: () => dailyAPI.getDay(week, day).then(res => res.data.data),
  });

  const completeLessonMutation = useMutation({
    mutationFn: (dayId) => dailyAPI.completeLesson(dayId),
    onSuccess: () => {
      queryClient.invalidateQueries(['daily']);
      toast.success('Lesson completed!');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ dayId, taskId }) => dailyAPI.completeTask(dayId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries(['daily']);
      toast.success('Task completed!');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  if (!dayData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson Not Found</h2>
        <p className="text-gray-600">This lesson doesn't exist or isn't available yet.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dayData.title}</h1>
          <p className="text-gray-600">Week {week} • Day {day}</p>
        </div>
      </div>

      <LessonView
        lesson={dayData.lesson}
        onComplete={() => completeLessonMutation.mutate(dayData.id)}
        isCompleting={completeLessonMutation.isPending}
        isCompleted={dayData.lesson_completed}
      />

      {dayData.tasks?.length > 0 && (
        <TaskList
          tasks={dayData.tasks}
          onComplete={(taskId) => completeTaskMutation.mutate({ dayId: dayData.id, taskId })}
          isCompleting={completeTaskMutation.isPending}
        />
      )}
    </div>
  );
}
