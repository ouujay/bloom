# Bloom - AI-Powered Maternal Health Platform

An AI-powered maternal health CRM platform designed for Nigerian mothers, connecting them with healthcare providers through intelligent health triage and voice-first interactions.

## The Problem

Nigeria has one of the highest maternal mortality rates globally - 512 deaths per 100,000 live births. Many complications are preventable with early detection, but mothers in underserved communities lack continuous access to healthcare guidance between clinic visits.

## Our Solution

Bloom bridges the gap between expecting mothers and healthcare facilities through:

- **AI Health Triage**: Llama 3.3 70B Turbo analyzes symptoms in real-time, classifying urgency levels (critical/urgent/moderate/normal)
- **Voice-First Interface**: OpenAI Whisper + TTS enables accessibility for mothers with limited literacy
- **Healthcare CRM**: Hospitals connect with patients, view Life Passports, and receive AI-filtered health reports
- **Gamified Engagement**: Token rewards for completing health check-ins and educational content

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS v4
- React Router DOM
- React Query

### Backend
- Django 5.x + Django REST Framework
- Meta Llama 3.3 70B Turbo (via Together AI)
- OpenAI Whisper (speech-to-text)
- OpenAI TTS (text-to-speech)
- JWT Authentication

## Features

### For Mothers
- Daily pregnancy lessons tailored to gestational week
- Voice-based health check-ins with AI companion "Bloom"
- Kick counter and symptom tracking
- Life Passport - comprehensive health timeline
- Token rewards convertible to Naira

### For Healthcare Organizations
- Patient invitation and management
- Real-time access to connected patients' health data
- AI-generated health reports filtered by urgency
- Dashboard with critical alerts

### AI Capabilities
- Conversational health triage with urgency classification
- Voice transcription for accessibility
- Structured data extraction from natural language
- Context-aware responses based on pregnancy week

## Demo

Live demo: [bloom-ng.vercel.app](https://bloom-ng.vercel.app)

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Mother | demo@bloom.ng | demo1234 |
| Admin | admin@bloom.ng | admin1234 |
| Doctor | doctor@bloom.ng | doctor1234 |
| Hospital | lagoshospital@bloom.ng | password123 |

## Project Structure

```
bloom/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── pages/     # Route pages
│   │   ├── components/# Reusable components
│   │   ├── api/       # API client functions
│   │   └── context/   # React context providers
│   └── package.json
│
├── backend/           # Django backend
│   ├── apps/
│   │   ├── users/     # Authentication & profiles
│   │   ├── children/  # Pregnancy/child management
│   │   ├── ai/        # Llama 3.3, Whisper, TTS
│   │   ├── health/    # Health logs & reports
│   │   ├── organizations/ # Healthcare CRM
│   │   └── ...
│   └── requirements.txt
│
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_content
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Backend `.env`:
```env
TOGETHER_API_KEY=your-together-ai-key
OPENAI_API_KEY=your-openai-key
SECRET_KEY=your-django-secret
```

Frontend `.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

## API Highlights

- `POST /api/ai/conversation/start/` - Start AI conversation
- `POST /api/ai/conversation/{id}/message/` - Send voice/text message
- `GET /api/organizations/patients/` - List connected patients
- `GET /api/organizations/reports/` - Get health reports by urgency

## Built With Meta AI

This project uses **Meta Llama 3.3 70B Turbo** via Together AI for:
- Conversational health companion
- Symptom analysis and triage
- Structured data extraction from voice input
- Context-aware pregnancy guidance

## License

MIT License
