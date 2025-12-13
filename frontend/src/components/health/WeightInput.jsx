import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

export default function WeightInput({ onSave, lastWeight }) {
  const [weight, setWeight] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (weight) {
      onSave(parseFloat(weight));
      setWeight('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="number"
        step="0.1"
        label="Today's Weight (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder={lastWeight ? `Last: ${lastWeight} kg` : 'Enter weight'}
      />
      <Button type="submit" disabled={!weight} className="w-full">
        Log Weight
      </Button>
    </form>
  );
}
