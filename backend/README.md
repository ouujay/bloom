# Bloom Backend

Backend API for Bloom - an AI-powered maternal health platform designed for Nigerian mothers.

## Tech Stack

- **Framework**: Django 5.x with Django REST Framework
- **AI/LLM**: Meta Llama 3.3 70B Turbo via Together AI
- **Speech-to-Text**: OpenAI Whisper
- **Text-to-Speech**: OpenAI TTS (Nova voice)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: SQLite (development) / PostgreSQL (production)

## Features

### AI-Powered Health Triage
The platform uses Llama 3.3 70B Turbo to analyze maternal health symptoms in real-time, classifying concerns into four urgency levels:
- **Critical**: Immediate medical attention required (e.g., severe headache + vision changes, heavy bleeding)
- **Urgent**: See doctor within 24-48 hours
- **Moderate**: Monitor symptoms
- **Normal**: Expected symptoms for current pregnancy week

### Voice-First Interface
- OpenAI Whisper transcribes voice input from mothers
- Llama 3.3 generates contextual, empathetic responses
- OpenAI TTS converts responses to speech for accessibility

### Healthcare CRM
Organizations (hospitals/clinics) can:
- Register and manage their facility
- Invite mothers to connect
- View patient Life Passports (health summaries)
- Access AI-generated health reports filtered by urgency

## Apps Structure

```
apps/
├── users/          # User authentication & profiles
├── children/       # Child/pregnancy management
├── ai/             # AI services (Llama 3.3, Whisper, TTS)
├── health/         # Health logs, kick counts, reports
├── daily_program/  # 40-week educational content
├── tokens/         # Reward token system
├── withdrawals/    # Token withdrawal management
├── passport/       # Life Passport (health timeline)
├── organizations/  # Healthcare facility management
├── payments/       # ALATPay integration
└── sms_api/        # SMS notifications
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True

# AI Services
TOGETHER_API_KEY=your-together-ai-key
OPENAI_API_KEY=your-openai-key

# Database (production)
DATABASE_URL=postgres://...

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
CORS_ALLOW_ALL=False

# Payments
ALATPAY_PUBLIC_KEY=your-key
ALATPAY_SECRET_KEY=your-key
ALATPAY_BUSINESS_ID=your-id
```

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed educational content
python manage.py seed_content

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - Register new user
- `POST /api/auth/login/` - Login
- `GET /api/auth/me/` - Get current user
- `PATCH /api/auth/me/` - Update profile

### Children
- `GET /api/children/` - List children
- `POST /api/children/` - Add child
- `GET /api/children/{id}/` - Get child details

### Daily Program
- `GET /api/daily/{childId}/today/` - Get today's program
- `POST /api/daily/{childId}/{progressId}/complete-lesson/` - Complete lesson
- `GET /api/daily/{childId}/videos/` - Get educational videos

### Health
- `GET /api/health/{childId}/logs/` - Get health logs
- `POST /api/health/{childId}/logs/` - Create health log
- `GET /api/health/{childId}/kicks/` - Get kick sessions

### AI Conversations
- `POST /api/ai/conversation/start/` - Start conversation
- `POST /api/ai/conversation/{id}/message/` - Send message (text or voice)

### Organizations
- `POST /api/organizations/signup/` - Register organization
- `GET /api/organizations/patients/` - List connected patients
- `POST /api/organizations/patients/invite/` - Invite mother by email
- `GET /api/organizations/patients/{id}/` - Get patient details
- `GET /api/organizations/reports/` - Get health reports

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Mother | demo@bloom.ng | demo1234 |
| Admin | admin@bloom.ng | admin1234 |
| Doctor | doctor@bloom.ng | doctor1234 |
| Hospital | lagoshospital@bloom.ng | password123 |

## Deployment

### Azure App Service
The backend is configured for Azure deployment with:
- `startup.sh` - Azure startup script
- `whitenoise` - Static file serving
- Production settings via environment variables

```bash
# Push to Azure
git push azure main:master
```

## License

MIT License
