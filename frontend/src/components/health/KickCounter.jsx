import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

export default function KickCounter({ onSave }) {
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKick = () => {
    setCount(c => c + 1);
  };

  const handleReset = () => {
    setCount(0);
    setSeconds(0);
    setIsRunning(false);
  };

  const handleSave = () => {
    onSave({ count, duration_minutes: Math.ceil(seconds / 60) });
    handleReset();
  };

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Kick Counter</h3>

      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-primary-600 mb-2">{count}</div>
        <div className="text-sm text-gray-500">kicks recorded</div>
        <div className="text-lg font-mono text-gray-700 mt-2">{formatTime(seconds)}</div>
      </div>

      <button
        onClick={handleKick}
        disabled={!isRunning}
        className="w-full h-32 rounded-2xl bg-primary-100 text-primary-600 text-xl font-semibold hover:bg-primary-200 active:bg-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        Tap for each kick
      </button>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setIsRunning(!isRunning)}
          className="flex-1"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 mr-2" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" /> Start
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          onClick={handleSave}
          disabled={count === 0}
          className="flex-1"
        >
          Save
        </Button>
      </div>
    </Card>
  );
}
