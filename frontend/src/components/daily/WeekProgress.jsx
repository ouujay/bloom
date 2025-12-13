import { CheckCircle, Circle } from 'lucide-react';
import Card from '../common/Card';

export default function WeekProgress({ week, days }) {
  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Week {week} Progress</h3>

      <div className="flex justify-between">
        {Array.from({ length: 7 }, (_, i) => {
          const day = days?.find(d => d.day_number === i + 1);
          const isComplete = day?.is_complete;
          const isCurrent = day?.is_current;

          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isComplete
                    ? 'bg-bloom-100'
                    : isCurrent
                    ? 'bg-primary-100 ring-2 ring-primary-500'
                    : 'bg-gray-100'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-bloom-600" />
                ) : (
                  <span className={`text-sm font-medium ${
                    isCurrent ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
