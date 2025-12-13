import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

export default function VoiceRecorder({ onRecordingComplete, isDisabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    if (isDisabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analysis for visual feedback
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start level monitoring
      const monitorLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(monitorLevel);
      };
      monitorLevel();

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        // Only send if there's actual audio content (more than just headers)
        if (audioBlob.size > 1000) {
          onRecordingComplete?.(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please grant permission.');
    }
  }, [onRecordingComplete, isDisabled]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      setRecordingTime(0);

      // Clean up timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Clean up audio
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      analyserRef.current = null;
    }
  }, [isRecording]);

  // Toggle recording on tap
  const handleTap = useCallback(() => {
    if (isDisabled) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, isDisabled, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Recording timer */}
      {isRecording && (
        <div className="flex items-center gap-2 text-red-500">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-lg font-mono font-medium">{formatTime(recordingTime)}</span>
        </div>
      )}

      {/* Recording button */}
      <button
        onClick={handleTap}
        disabled={isDisabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
          isDisabled
            ? 'bg-cream-200 cursor-not-allowed'
            : isRecording
              ? 'bg-red-500 scale-110 shadow-xl shadow-red-500/30'
              : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/25 hover:scale-105 active:scale-95'
        }`}
      >
        {/* Pulsing ring when recording */}
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40"
          />
        )}

        {/* Audio level ring */}
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full border-4 border-white/50 transition-transform duration-75"
            style={{ transform: `scale(${1 + audioLevel * 0.3})` }}
          />
        )}

        {/* Icon */}
        {isRecording ? (
          <Send className="w-8 h-8 text-white relative z-10" />
        ) : (
          <Mic className={`w-8 h-8 relative z-10 ${isDisabled ? 'text-dark-400' : 'text-white'}`} />
        )}
      </button>

      {/* Status text */}
      <p className={`text-sm font-medium ${
        isRecording
          ? 'text-red-500'
          : isDisabled
            ? 'text-dark-400'
            : 'text-dark-500'
      }`}>
        {isRecording
          ? 'Tap to send'
          : isDisabled
            ? 'Listening to response...'
            : 'Tap to speak'}
      </p>

      {/* Audio level indicator */}
      {isRecording && (
        <div className="flex gap-1 h-8 items-end">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-red-400 rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(12, audioLevel * 100 * (0.4 + Math.random() * 0.6))}%`,
                opacity: audioLevel > i * 0.14 ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
