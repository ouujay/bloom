import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyAPI } from '../api/daily';
import childrenApi from '../api/children';
import toast from 'react-hot-toast';

export function useDailyProgram(childId) {
  const queryClient = useQueryClient();

  // Fetch child data
  const childQuery = useQuery({
    queryKey: ['children', childId],
    queryFn: () => childrenApi.get(childId).then(res => res.data),
    enabled: !!childId,
  });

  // Fetch today's program - handle 404 gracefully (no content available)
  const todayQuery = useQuery({
    queryKey: ['daily', 'today', childId],
    queryFn: async () => {
      try {
        const res = await dailyAPI.getToday(childId);
        return res.data.data;
      } catch (error) {
        // Return null if no content available (404)
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!childId,
    retry: (failureCount, error) => {
      // Don't retry on 404 (no content)
      if (error.response?.status === 404) return false;
      return failureCount < 1;
    },
  });

  // Fetch progress - handle errors gracefully
  const progressQuery = useQuery({
    queryKey: ['daily', 'progress', childId],
    queryFn: async () => {
      try {
        const res = await dailyAPI.getProgress(childId);
        return res.data.data;
      } catch (error) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!childId,
    retry: (failureCount, error) => {
      if (error.response?.status === 404) return false;
      return failureCount < 1;
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: (progressId) => dailyAPI.completeLesson(childId, progressId),
    onSuccess: () => {
      queryClient.invalidateQueries(['daily', 'today', childId]);
      queryClient.invalidateQueries(['daily', 'progress', childId]);
      queryClient.invalidateQueries(['tokens']);
      toast.success('Lesson completed! 🎉');
    },
    onError: () => {
      toast.error('Failed to mark lesson complete');
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: (progressId) => dailyAPI.completeTask(childId, progressId),
    onSuccess: () => {
      queryClient.invalidateQueries(['daily', 'today', childId]);
      queryClient.invalidateQueries(['daily', 'progress', childId]);
      queryClient.invalidateQueries(['tokens']);
      toast.success('Task completed!');
    },
    onError: () => {
      toast.error('Failed to complete task');
    }
  });

  const submitCheckinMutation = useMutation({
    mutationFn: ({ progressId, data }) => dailyAPI.submitCheckin(childId, progressId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['daily', 'today', childId]);
      queryClient.invalidateQueries(['daily', 'progress', childId]);
      queryClient.invalidateQueries(['tokens']);
      toast.success('Health check-in recorded!');
    },
    onError: () => {
      toast.error('Failed to submit check-in');
    }
  });

  return {
    child: childQuery.data,
    isLoadingChild: childQuery.isLoading,
    today: todayQuery.data,
    isLoadingToday: todayQuery.isLoading,
    progress: progressQuery.data,
    isLoadingProgress: progressQuery.isLoading,
    completeLesson: completeLessonMutation.mutate,
    completeTask: completeTaskMutation.mutate,
    submitCheckin: submitCheckinMutation.mutate,
    isCompletingLesson: completeLessonMutation.isPending,
    isCompletingTask: completeTaskMutation.isPending,
    isSubmittingCheckin: submitCheckinMutation.isPending,
  };
}
