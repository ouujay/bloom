const moods = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'unwell', emoji: '🤒', label: 'Unwell' },
];

export default function MoodSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        How are you feeling today?
      </label>
      <div className="flex gap-2">
        {moods.map((mood) => (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value)}
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
              value === mood.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl mb-1">{mood.emoji}</span>
            <span className="text-xs text-gray-600">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
