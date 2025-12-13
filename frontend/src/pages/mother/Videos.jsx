import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Clock, CheckCircle, Filter } from 'lucide-react';
import { dailyAPI } from '../../api/daily';
import toast from 'react-hot-toast';

export default function Videos() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'unwatched'

  useEffect(() => {
    fetchVideos();
  }, [childId]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await dailyAPI.getVideos(childId);
      setVideos(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(item => {
    if (filter === 'completed') return item.is_completed;
    if (filter === 'unwatched') return !item.is_completed;
    return true;
  });

  const completedCount = videos.filter(v => v.is_completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Play className="w-12 h-12 text-primary-400 mx-auto mb-4 animate-pulse" />
          <p className="text-dark-500">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/child/${childId}`)}
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-dark-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-900">Video Lessons</h1>
          <p className="text-dark-500">{completedCount} of {videos.length} completed</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'all', label: `All (${videos.length})` },
          { value: 'unwatched', label: `Unwatched (${videos.length - completedCount})` },
          { value: 'completed', label: `Completed (${completedCount})` },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-primary-500 text-white'
                : 'bg-cream-100 text-dark-600 hover:bg-cream-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-cream-200">
          <Play className="w-12 h-12 text-dark-300 mx-auto mb-3" />
          <p className="text-dark-500">No videos found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredVideos.map((item) => (
            <Link
              key={item.video?.id}
              to={`/child/${childId}/video/${item.video?.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-cream-200"
            >
              <div className="relative aspect-video bg-dark-100">
                {item.video?.thumbnail_url ? (
                  <img
                    src={item.video.thumbnail_url}
                    alt={item.video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cream-100">
                    <Play className="w-16 h-16 text-primary-400" />
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-dark-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded-full p-4 shadow-lg">
                    <Play className="w-8 h-8 text-primary-600" />
                  </div>
                </div>

                {/* Completed badge */}
                {item.is_completed && (
                  <div className="absolute top-3 right-3 bg-bloom-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </div>
                )}

                {/* Duration badge */}
                <div className="absolute bottom-3 right-3 bg-dark-900/80 text-white text-xs px-2 py-1 rounded">
                  {item.video?.duration_formatted || '0:00'}
                </div>

                {/* Progress bar */}
                {item.progress_percentage > 0 && item.progress_percentage < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-900/30">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${item.progress_percentage}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-dark-900 line-clamp-2 mb-2">
                  {item.video?.title}
                </h3>
                {item.video?.description && (
                  <p className="text-sm text-dark-500 line-clamp-2 mb-3">
                    {item.video.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-dark-500">
                    <Clock className="w-4 h-4" />
                    {item.video?.duration_formatted}
                  </div>
                  <div className="text-amber-600 font-medium">
                    +{item.video?.token_reward || 5} tokens
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
