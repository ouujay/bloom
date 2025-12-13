import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

export default function LessonView({ lesson, onComplete, isCompleting, isCompleted }) {
  const [hasRead, setHasRead] = useState(isCompleted);

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{lesson?.title}</h2>

      <div className="prose prose-pink max-w-none mb-6">
        <div dangerouslySetInnerHTML={{ __html: lesson?.content }} />
      </div>

      {lesson?.video_url && (
        <div className="mb-6 aspect-video rounded-lg overflow-hidden bg-gray-100">
          <iframe
            src={lesson.video_url}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}

      {lesson?.tips && lesson.tips.length > 0 && (
        <div className="bg-bloom-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-bloom-700 mb-2">Tips for Today</h4>
          <ul className="space-y-2">
            {lesson.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-bloom-800">
                <span className="text-bloom-500">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isCompleted && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasRead}
              onChange={(e) => setHasRead(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">I have read this lesson</span>
          </label>

          <Button
            onClick={onComplete}
            disabled={!hasRead}
            loading={isCompleting}
          >
            Mark as Complete
          </Button>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-2 text-bloom-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Lesson completed!</span>
        </div>
      )}
    </Card>
  );
}
