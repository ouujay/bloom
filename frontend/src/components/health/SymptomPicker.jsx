const symptoms = [
  { id: 'nausea', label: 'Nausea' },
  { id: 'headache', label: 'Headache' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'back_pain', label: 'Back Pain' },
  { id: 'swelling', label: 'Swelling' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'heartburn', label: 'Heartburn' },
  { id: 'dizziness', label: 'Dizziness' },
];

export default function SymptomPicker({ value = [], onChange }) {
  const toggleSymptom = (symptomId) => {
    if (value.includes(symptomId)) {
      onChange(value.filter(id => id !== symptomId));
    } else {
      onChange([...value, symptomId]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Any symptoms? (Select all that apply)
      </label>
      <div className="flex flex-wrap gap-2">
        {symptoms.map((symptom) => (
          <button
            key={symptom.id}
            type="button"
            onClick={() => toggleSymptom(symptom.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              value.includes(symptom.id)
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {symptom.label}
          </button>
        ))}
      </div>
    </div>
  );
}
