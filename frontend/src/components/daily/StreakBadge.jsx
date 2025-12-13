import { Flame } from 'lucide-react';

export default function StreakBadge({ streak }) {
  if (!streak || streak < 1) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full">
      <Flame className="w-4 h-4" />
      <span className="text-sm font-semibold">{streak} day streak!</span>
    </div>
  );
}
