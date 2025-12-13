export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const TOKEN_RATE = 10; // 1 token = 10 Naira
export const MIN_WITHDRAWAL = 500; // Minimum tokens for withdrawal

export const MOODS = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'unwell', emoji: '🤒', label: 'Unwell' },
];

export const SYMPTOMS = [
  { id: 'nausea', label: 'Nausea' },
  { id: 'headache', label: 'Headache' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'back_pain', label: 'Back Pain' },
  { id: 'swelling', label: 'Swelling' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'heartburn', label: 'Heartburn' },
  { id: 'dizziness', label: 'Dizziness' },
];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const RELATIONSHIPS = [
  { value: 'spouse', label: 'Spouse/Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

export const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank',
  'Diamond Bank',
  'Ecobank',
  'Fidelity Bank',
  'First Bank',
  'First City Monument Bank',
  'Guaranty Trust Bank',
  'Heritage Bank',
  'Keystone Bank',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'Suntrust Bank',
  'Union Bank',
  'United Bank for Africa',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
];

export const DANGER_SIGNS = [
  'Severe headache that won\'t go away',
  'Vision changes (blurry, seeing spots)',
  'Severe abdominal pain',
  'Vaginal bleeding',
  'Sudden swelling of face or hands',
  'High fever',
  'Baby moving less than usual',
  'Fluid leaking from vagina',
  'Painful urination',
  'Persistent vomiting',
];

export const EMERGENCY_NUMBERS = [
  { name: 'Emergency Services', number: '112', description: 'For immediate emergencies' },
  { name: 'LASAMBUS', number: '767', description: 'Lagos State Ambulance Service' },
  { name: 'NEMA', number: '0800-2255-6362', description: 'National Emergency' },
];
