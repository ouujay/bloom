import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

export default function AudioPlayer({ src, autoPlay = false, onEnded, className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.load();
    }
  }, [src]);

  useEffect(() => {
    if (autoPlay && src) {
      // Small delay to ensure audio is loaded
      const timer = setTimeout(() => {
        playAudio();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, src]);

  const playAudio = async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setShowPlayPrompt(false);
      startProgressTracking();
    } catch (error) {
      // Autoplay was blocked - show play prompt instead
      if (error.name === 'NotAllowedError') {
        setShowPlayPrompt(true);
      } else {
        console.error('Error playing audio:', error);
      }
    }
  };

  const pauseAudio = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setIsPlaying(false);
    stopProgressTracking();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const totalDuration = audioRef.current.duration;
        if (totalDuration > 0) {
          setProgress((currentTime / totalDuration) * 100);
        }
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    stopProgressTracking();
    onEnded?.();
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percentage * audioRef.current.duration;
      setProgress(percentage * 100);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, []);

  if (!src) {
    return null;
  }

  // Always render audio element so it's available for playback
  // Show either the play prompt or the full player UI
  return (
    <>
      {/* Audio element - always rendered */}
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
        style={{ display: 'none' }}
      />

      {/* Show compact play prompt if autoplay was blocked */}
      {showPlayPrompt ? (
        <button
          onClick={togglePlayPause}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 24px',
            backgroundColor: '#ec4899',
            color: 'white',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
          }}
          className={className}
        >
          <Volume2 className="w-5 h-5" />
          <span>🔊 Tap to hear Bloom's message</span>
          <Play className="w-5 h-5" />
        </button>
      ) : (
        <div className={`flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm ${className}`}>
          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-400 text-white hover:bg-primary-500 transition-colors flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {/* Progress bar */}
          <div className="flex-1 flex flex-col gap-1">
            <div
              onClick={handleSeek}
              className="h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
            >
              <div
                className="h-full bg-primary-400 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(audioRef.current?.currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
