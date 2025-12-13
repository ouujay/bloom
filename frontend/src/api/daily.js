import api from './axios';

export const dailyAPI = {
  // Get today's program for a child
  getToday: (childId) =>
    api.get(`/daily/${childId}/today/`),

  // Get specific day for a child
  getDay: (childId, stageType, stageWeek, day) =>
    api.get(`/daily/${childId}/${stageType}/${stageWeek}/day/${day}/`),

  // Mark lesson as read
  completeLesson: (childId, progressId) =>
    api.post(`/daily/${childId}/${progressId}/complete-lesson/`),

  // Complete a task
  completeTask: (childId, progressId) =>
    api.post(`/daily/${childId}/${progressId}/complete-task/`),

  // Submit health check-in
  submitCheckin: (childId, progressId, data) =>
    api.post(`/daily/${childId}/${progressId}/checkin/`, data),

  // Get week progress for a child
  getWeekProgress: (childId, stageType, stageWeek) =>
    api.get(`/daily/${childId}/${stageType}/${stageWeek}/progress/`),

  // Get missed days that need catch-up for a child
  getMissedDays: (childId) =>
    api.get(`/daily/${childId}/missed/`),

  // Submit weekly quiz for a child
  submitQuiz: (childId, stageType, stageWeek, answers) =>
    api.post(`/daily/${childId}/${stageType}/${stageWeek}/quiz/`, { answers }),

  // Get child's overall progress
  getProgress: (childId) =>
    api.get(`/daily/${childId}/progress/`),

  // YouTube Video Lessons
  getVideos: (childId) =>
    api.get(`/daily/${childId}/videos/`),

  getVideo: (videoId) =>
    api.get(`/daily/videos/${videoId}/`),

  completeVideo: (videoId) =>
    api.post(`/daily/videos/${videoId}/complete/`),

  updateVideoProgress: (videoId, watchTimeSeconds) =>
    api.post(`/daily/videos/${videoId}/progress/`, { watch_time_seconds: watchTimeSeconds }),
};
