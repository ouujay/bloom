import { CheckCircle, Circle } from 'lucide-react';
import Card from '../common/Card';

export default function TaskList({ tasks, onComplete, isCompleting }) {
  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Today's Tasks</h3>
      <div className="space-y-3">
        {tasks?.map((task) => (
          <button
            key={task.id}
            onClick={() => !task.completed && onComplete(task.id)}
            disabled={task.completed || isCompleting}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
              task.completed
                ? 'bg-bloom-50'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {task.completed ? (
              <CheckCircle className="w-5 h-5 text-bloom-500 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${task.completed ? 'text-bloom-700' : 'text-gray-800'}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
              )}
            </div>
            {task.tokens > 0 && (
              <span className={`text-sm font-medium ${
                task.completed ? 'text-bloom-600' : 'text-primary-600'
              }`}>
                +{task.tokens} tokens
              </span>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
