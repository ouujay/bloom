import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, Award } from 'lucide-react';
import { dailyAPI } from '../../api/daily';
import toast from 'react-hot-toast';

export default function VideoDetail() {
  const { childId, videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    fetchVideo();
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const res = await dailyAPI.getVideo(videoId);
      const data = res.data?.data;
      // API returns { video: {...}, progress: {...} }
      setVideo(data?.video);
      setIsCompleted(data?.progress?.is_completed || false);
      setWatchTime(data?.progress?.watch_time_seconds || 0);
    } catch (err) {
      toast.error('Failed to load video');
      navigate(`/child/${childId}/videos`);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoProgress = () => {
    // Update progress every 10 seconds
    progressIntervalRef.current = setInterval(async () => {
      if (playerRef.current) {
        const currentTime = Math.floor(playerRef.current.getCurrentTime());
        if (currentTime > watchTime) {
          setWatchTime(currentTime);
          try {
            await dailyAPI.updateVideoProgress(videoId, currentTime);
          } catch (err) {
            console.error('Failed to update progress:', err);
          }
        }
      }
    }, 10000);
  };

  const handleVideoEnd = async () => {
    if (isCompleted) return;

    try {
      const res = await dailyAPI.completeVideo(videoId);
      if (res.data?.success) {
        setIsCompleted(true);
        toast.success(`Video completed! +${video?.token_reward || 5} tokens earned!`);
      }
    } catch (err) {
      console.error('Failed to mark video complete:', err);
    }
  };

  const handleMarkComplete = async () => {
    if (isCompleted) return;

    try {
      const res = await dailyAPI.completeVideo(videoId);
      if (res.data?.success) {
        setIsCompleted(true);
        toast.success(`Video completed! +${video?.token_reward || 5} tokens earned!`);
      }
    } catch (err) {
      toast.error('Failed to mark video as complete');
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!video?.youtube_id) return;

    // Load YouTube API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: video.youtube_id,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              handleVideoProgress();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
            } else if (event.data === window.YT.PlayerState.ENDED) {
              handleVideoEnd();
            }
          },
        },
      });
    };

    // If API already loaded
    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [video?.youtube_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-500">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/child/${childId}/videos`)}
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-dark-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-dark-900 line-clamp-1">{video.title}</h1>
          <div className="flex items-center gap-3 text-sm text-dark-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {video.duration_formatted}
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 text-bloom-600">
                <CheckCircle className="w-4 h-4" />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="bg-black rounded-2xl overflow-hidden mb-6">
        <div className="relative aspect-video">
          <div id="youtube-player" className="w-full h-full" />
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-900">{video.title}</h2>
            {video.week && (
              <p className="text-sm text-dark-500">Week {video.week} lesson</p>
            )}
          </div>
          <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
            <Award className="w-4 h-4" />
            <span className="font-medium">{video.token_reward || 5} tokens</span>
          </div>
        </div>

        {video.description && (
          <p className="text-dark-600 mb-4">{video.description}</p>
        )}

        {/* Completion Status */}
        {isCompleted ? (
          <div className="bg-bloom-50 rounded-xl p-4 flex items-center gap-3">
            <div className="bg-bloom-100 p-2 rounded-full">
              <CheckCircle className="w-5 h-5 text-bloom-600" />
            </div>
            <div>
              <p className="font-medium text-bloom-800">Video Completed!</p>
              <p className="text-sm text-bloom-600">You've earned {video.token_reward || 5} tokens</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleMarkComplete}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Mark as Complete (+{video.token_reward || 5} tokens)
          </button>
        )}
      </div>

      {/* Related content or next video can go here */}
    </div>
  );
}
