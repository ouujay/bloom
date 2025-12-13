import { useState } from 'react';
import { Heart } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import MoodSelector from '../health/MoodSelector';
import SymptomPicker from '../health/SymptomPicker';

export default function HealthCheckin({ onSubmit, isSubmitting, isCompleted }) {
  const [mood, setMood] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({ mood, symptoms, notes });
  };

  if (isCompleted) {
    return (
      <Card className="bg-bloom-50 border-bloom-200">
        <div className="flex items-center gap-3 text-bloom-700">
          <Heart className="w-5 h-5 fill-bloom-500" />
          <span className="font-medium">Health check-in completed for today!</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary-500" />
        Daily Health Check-in
      </h3>

      <div className="space-y-4">
        <MoodSelector value={mood} onChange={setMood} />
        <SymptomPicker value={symptoms} onChange={setSymptoms} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any other symptoms or concerns..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!mood}
          className="w-full"
        >
          Submit Check-in
        </Button>
      </div>
    </Card>
  );
}
