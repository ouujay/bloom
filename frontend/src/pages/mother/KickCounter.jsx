import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Check, Baby, History } from 'lucide-react';
import { healthAPI } from '../../api/health';
import toast from 'react-hot-toast';

export default function KickCounter() {
  const { childId } = useParams();
  const navigate = useNavigate();

  const [activeSession, setActiveSession] = useState(null);
  const [kickCount, setKickCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState([]);
  const [isRecordingKick, setIsRecordingKick] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [childId]);

  useEffect(() => {
    if (activeSession && !activeSession.end_time) {
      timerRef.current = setInterval(() => {
        const start = new Date(activeSession.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await healthAPI.getKickSessions(childId);
      const sessions = res.data?.data || [];
      setRecentSessions(sessions);

      // Check for active session
      const active = sessions.find(s => !s.end_time);
      if (active) {
        setActiveSession(active);
        setKickCount(active.kick_count || 0);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const res = await healthAPI.startKickSession(childId);
      if (res.data?.success) {
        setActiveSession(res.data.data);
        setKickCount(0);
        setElapsedTime(0);
        toast.success('Session started! Tap when you feel a kick');
      }
    } catch (err) {
      toast.error('Failed to start session');
    }
  };

  const recordKick = async () => {
    if (!activeSession || isRecordingKick) return;

    setIsRecordingKick(true);
    setKickCount(prev => prev + 1);

    try {
      await healthAPI.recordKick(activeSession.id);
    } catch (err) {
      setKickCount(prev => prev - 1);
      toast.error('Failed to record kick');
    } finally {
      setIsRecordingKick(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    try {
      const res = await healthAPI.endKickSession(activeSession.id, {
        end_time: new Date().toISOString(),
      });
      if (res.data?.success) {
        toast.success(`Session complete! ${kickCount} kicks recorded`);
        setActiveSession(null);
        setKickCount(0);
        setElapsedTime(0);
        fetchSessions();
      }
    } catch (err) {
      toast.error('Failed to end session');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '--';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <img src="/logo.png" alt="Bloom" className="w-16 h-16 object-contain mx-auto mb-4 animate-pulse" />
          <p className="text-dark-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(`/child/${childId}`)}
            className="p-2 hover:bg-cream-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark-600" />
          </button>
          <h1 className="text-xl font-bold text-dark-900">Kick Counter</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Info Card */}
        <div className="bg-bloom-50 rounded-2xl p-4 border border-bloom-200">
          <div className="flex items-start gap-3">
            <div className="bg-bloom-100 p-2 rounded-lg">
              <Baby className="w-5 h-5 text-bloom-600" />
            </div>
            <div>
              <h3 className="font-semibold text-bloom-800">Count your baby's kicks</h3>
              <p className="text-sm text-bloom-700 mt-1">
                Count 10 kicks within 2 hours. If you don't feel 10 kicks in 2 hours,
                contact your healthcare provider.
              </p>
            </div>
          </div>
        </div>

        {/* Main Counter */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {activeSession ? (
            <>
              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-dark-500 mb-4">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-mono">{formatTime(elapsedTime)}</span>
              </div>

              {/* Kick Count */}
              <div className="mb-8">
                <div className="text-8xl font-bold text-primary-600 mb-2">{kickCount}</div>
                <p className="text-dark-500">kicks recorded</p>
              </div>

              {/* Goal indicator */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-500">Goal: 10 kicks</span>
                  <span className="font-semibold text-primary-600">{Math.min(kickCount, 10)}/10</span>
                </div>
                <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      kickCount >= 10 ? 'bg-bloom-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${Math.min((kickCount / 10) * 100, 100)}%` }}
                  />
                </div>
                {kickCount >= 10 && (
                  <p className="text-bloom-600 font-medium mt-2 flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Goal reached! Great job!
                  </p>
                )}
              </div>

              {/* Kick Button */}
              <button
                onClick={recordKick}
                disabled={isRecordingKick}
                className="w-40 h-40 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-2xl shadow-primary-400/50 flex flex-col items-center justify-center mx-auto mb-8 hover:scale-105 active:scale-95 transition-all disabled:opacity-70"
              >
                <Plus className="w-16 h-16 mb-1" />
                <span className="text-lg font-semibold">Tap for kick</span>
              </button>

              {/* End Session */}
              <button
                onClick={endSession}
                className="text-dark-500 hover:text-dark-700 font-medium"
              >
                End Session
              </button>
            </>
          ) : (
            <>
              <div className="py-8">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Baby className="w-12 h-12 text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold text-dark-900 mb-2">Ready to count kicks?</h2>
                <p className="text-dark-500 mb-8">
                  Find a comfortable position and start tracking your baby's movements.
                </p>
                <button
                  onClick={startSession}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-primary-500/25 transition-all hover:scale-105"
                >
                  Start Counting
                </button>
              </div>
            </>
          )}
        </div>

        {/* Recent Sessions */}
        {recentSessions.filter(s => s.end_time).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-dark-500" />
              <h2 className="text-lg font-semibold text-dark-900">Recent Sessions</h2>
            </div>
            <div className="space-y-3">
              {recentSessions.filter(s => s.end_time).slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-dark-900">
                      {session.kick_count} kicks
                    </p>
                    <p className="text-sm text-dark-500">
                      {new Date(session.start_time).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-dark-500">Duration</p>
                    <p className="font-medium text-dark-700">{formatDuration(session.duration_minutes)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
