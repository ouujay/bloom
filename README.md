# Bloom - AI-Powered Maternal Health Platform

An AI-powered maternal health CRM platform designed for Nigerian mothers, connecting them with healthcare providers through intelligent health triage and voice-first interactions.

**Live Demo:** [bloom-sigma-lake.vercel.app](https://bloom-sigma-lake.vercel.app)

**Backend API:** [bloombbbb.azurewebsites.net](https://bloombbbb.azurewebsites.net)

---

## The Problem

Nigeria has one of the highest maternal mortality rates globally - **512 deaths per 100,000 live births**. Many complications are preventable with early detection, but mothers in underserved communities lack continuous access to healthcare guidance between clinic visits.

### Key Challenges
- Limited access to healthcare professionals between appointments
- Low health literacy among expectant mothers
- Delayed recognition of warning signs
- Poor communication between mothers and healthcare facilities
- Lack of continuous monitoring during pregnancy

---

## Our Solution

Bloom bridges the gap between expecting mothers and healthcare facilities through an AI-powered platform that provides:

| Feature | Description |
|---------|-------------|
| **AI Health Triage** | Llama 3.3 70B Turbo analyzes symptoms in real-time, classifying urgency levels (critical/urgent/moderate/normal) |
| **Voice-First Interface** | OpenAI Whisper + TTS enables accessibility for mothers with limited literacy |
| **Healthcare CRM** | Hospitals connect with patients, view Life Passports, and receive AI-filtered health reports |
| **Gamified Engagement** | Token rewards for completing health check-ins and educational content |
| **40-Week Education** | Daily lessons tailored to each week of pregnancy |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Styling (with `@theme` blocks) |
| React Router DOM | Client-side routing |
| React Query | Server state management |
| Axios | HTTP client |
| Lucide React | Icons |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| Django 5.x | Web framework |
| Django REST Framework | API layer |
| SQLite | Database |
| JWT (SimpleJWT) | Authentication |
| Meta Llama 3.3 70B | AI conversations & triage |
| OpenAI Whisper | Speech-to-text |
| OpenAI TTS | Text-to-speech |
| Together AI | LLM API provider |

### Deployment
| Service | Component |
|---------|-----------|
| Vercel | Frontend hosting |
| Azure App Service | Backend hosting |
| Azure | SQLite database |

---

## Features

### For Mothers

#### Voice-Based Onboarding
- Speak naturally to set up your profile
- AI extracts and saves your health information
- No typing required - fully accessible

#### Daily Pregnancy Program
- 40 weeks of curated educational content
- Lessons tailored to your current gestational week
- Wellness tasks and health tips
- Video content from trusted sources

#### AI Health Companion "Bloom"
- 24/7 conversational health support
- Symptom analysis with urgency classification
- Context-aware responses based on pregnancy week
- Voice input and audio responses

#### Health Tracking
- Daily mood and symptom logging
- Kick counter (for 20+ weeks)
- Weight and vitals tracking
- Appointment management

#### Life Passport
- Comprehensive health timeline
- Shareable with healthcare providers
- Complete pregnancy history

#### Token Rewards
- Earn tokens for daily lessons (+5)
- Earn tokens for health check-ins (+5)
- Earn tokens for wellness tasks (+5)
- 7-day streak bonus (+20)
- Convert tokens to Naira (10 tokens = ₦1)

### For Healthcare Organizations

#### Patient Management
- Invite mothers to connect via email
- View connected patients' health data
- Access Life Passports with permission

#### AI-Powered Reports
- Health reports filtered by urgency level
- Critical alerts for immediate attention
- Automated symptom analysis

#### Dashboard
- Overview of all connected patients
- Pregnancy progress tracking
- Upcoming appointments

---

## User Flows

### Mother Signup Flow
```
1. Sign Up (email, password, phone)
        ↓
2. Voice Onboarding
   - AI asks about age, blood type, due date
   - Collects emergency contact info
   - Saves health conditions
        ↓
3. Add First Child/Pregnancy
   - Enter due date or birth date
   - Set nickname
        ↓
4. Dashboard
   - Access daily lessons
   - Track health
   - Chat with Bloom
```

### Healthcare Organization Flow
```
1. Organization Sign Up
   - Register hospital/clinic details
   - Verify credentials
        ↓
2. Invite Patients
   - Search by email
   - Send connection request
        ↓
3. Patient Accepts
   - Mother receives invitation
   - Chooses to share data
        ↓
4. Access Patient Data
   - View Life Passport
   - See health reports
   - Monitor pregnancy progress
```

---

## Project Structure

```
bloom/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── api/                # API client functions
│   │   │   ├── auth.js         # Authentication API
│   │   │   ├── ai.js           # AI conversation API
│   │   │   ├── children.js     # Children/pregnancy API
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── common/         # Reusable UI components
│   │   │   ├── layout/         # Layout components (Navbar, etc.)
│   │   │   └── voice/          # Voice recording components
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Signup, Onboarding
│   │   │   ├── mother/         # Mother dashboard pages
│   │   │   ├── doctor/         # Doctor portal pages
│   │   │   ├── organization/   # Hospital/clinic pages
│   │   │   └── admin/          # Admin panel pages
│   │   └── index.css           # Tailwind theme config
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Django backend application
│   ├── apps/
│   │   ├── users/              # User auth & profiles
│   │   ├── children/           # Pregnancy/child management
│   │   ├── ai/                 # AI services (Llama, Whisper, TTS)
│   │   ├── health/             # Health logs, kicks, reports
│   │   ├── daily_program/      # 40-week content & progress
│   │   ├── tokens/             # Token rewards system
│   │   ├── withdrawals/        # Token withdrawal
│   │   ├── organizations/      # Healthcare CRM
│   │   ├── passport/           # Life Passport
│   │   ├── payments/           # ALATPay integration
│   │   └── sms_api/            # SMS notifications
│   ├── mamalert/               # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── startup.sh              # Azure startup script
│
├── CLAUDE.md                   # AI assistant instructions
└── README.md
```

---

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup/` | POST | Register new user |
| `/api/auth/login/` | POST | Login and get JWT token |
| `/api/auth/me/` | GET | Get current user profile |
| `/api/auth/me/` | PATCH | Update user profile |

### Children/Pregnancy

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/children/` | GET | List all children |
| `/api/children/` | POST | Add new child/pregnancy |
| `/api/children/{id}/` | GET | Get child details |
| `/api/children/{id}/` | PATCH | Update child |

### Daily Program

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/daily/{childId}/today/` | GET | Get today's program |
| `/api/daily/{childId}/{progressId}/complete-lesson/` | POST | Complete lesson |
| `/api/daily/{childId}/{progressId}/complete-task/` | POST | Complete task |
| `/api/daily/{childId}/{progressId}/checkin/` | POST | Submit health check-in |
| `/api/daily/{childId}/videos/` | GET | Get educational videos |

### AI Conversations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/conversation/start/` | POST | Start new conversation |
| `/api/ai/conversation/message/` | POST | Send text or voice message |
| `/api/ai/conversation/{id}/complete/` | POST | Complete conversation |
| `/api/ai/transcribe/` | POST | Transcribe audio only |

### Health Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/{childId}/logs/` | GET | Get health logs |
| `/api/health/{childId}/logs/` | POST | Create health log |
| `/api/health/{childId}/kicks/` | GET | Get kick sessions |
| `/api/health/{childId}/kicks/start/` | POST | Start kick session |
| `/api/health/{childId}/kicks/{id}/record/` | POST | Record a kick |

### Organizations (Healthcare CRM)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/organizations/signup/` | POST | Register organization |
| `/api/organizations/patients/` | GET | List connected patients |
| `/api/organizations/patients/invite/` | POST | Invite patient by email |
| `/api/organizations/patients/{id}/` | GET | Get patient details |
| `/api/organizations/reports/` | GET | Get health reports |

### Tokens & Withdrawals

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tokens/balance/` | GET | Get token balance |
| `/api/tokens/transactions/` | GET | Get transaction history |
| `/api/withdrawals/` | POST | Request withdrawal |
| `/api/withdrawals/` | GET | Get withdrawal history |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend
cd backend

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

# Seed demo data (optional)
python manage.py seed_all

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

#### Backend `.env`
```env
# Django
SECRET_KEY=your-django-secret-key
DEBUG=True

# AI Services
TOGETHER_API_KEY=your-together-ai-key
OPENAI_API_KEY=your-openai-key

# CORS (for local development)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
CORS_ALLOW_ALL=True

# Database (production)
DATABASE_URL=postgres://...  # Optional, uses SQLite by default

# Payments (optional)
ALATPAY_PUBLIC_KEY=your-key
ALATPAY_SECRET_KEY=your-key
ALATPAY_BUSINESS_ID=your-id

# SMS (optional)
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_API_KEY=your-key
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000/api
```

---

## Demo Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Mother | demo@bloom.ng | demo1234 | Mother dashboard, daily lessons, chat |
| Admin | admin@bloom.ng | admin1234 | Admin panel, user management |
| Doctor | doctor@bloom.ng | doctor1234 | Doctor portal, patient reports |
| Hospital | lagoshospital@bloom.ng | password123 | Organization dashboard, CRM |

---

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `VITE_API_URL=https://your-backend-url.azurewebsites.net/api`
3. Deploy

### Backend (Azure App Service)

1. Create Azure App Service (Python 3.11)
2. Configure deployment from GitHub
3. Set environment variables in Azure Configuration
4. Push to trigger deployment:
```bash
cd backend
git push azure main
```

---

## AI Architecture

### Conversation Types

| Type | Purpose | Data Extracted |
|------|---------|----------------|
| `onboarding` | Initial profile setup | Age, blood type, emergency contact, health conditions |
| `add_child` | Add pregnancy/child | Due date, nickname, pregnancy details |
| `chat` | General health chat | Symptoms, concerns, questions |
| `birth` | Birth registration | Birth date, weight, delivery type |

### Urgency Classification

The AI classifies health concerns into four levels:

| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Life-threatening symptoms | Immediate medical attention |
| **Urgent** | Concerning symptoms | See doctor within 24-48 hours |
| **Moderate** | Minor concerns | Monitor and follow up |
| **Normal** | Expected pregnancy symptoms | Reassurance and education |

### Voice Flow

```
User speaks → Frontend records audio (WebM/M4A)
     ↓
Audio sent to backend (multipart/form-data)
     ↓
OpenAI Whisper transcribes to text
     ↓
Llama 3.3 70B generates response
     ↓
OpenAI TTS converts to speech
     ↓
Audio URL returned to frontend
     ↓
Audio plays automatically
```

---

## Design System

### Colors (Tailwind CSS v4)

```css
/* Primary - Pale Pink */
--color-primary-500: #E8A0A0;

/* Secondary - Bloom Green */
--color-bloom-500: #8BC49E;

/* Background - Cream */
--color-cream-100: #FDF8F3;

/* Dark - Text */
--color-dark-900: #1A1A2E;
```

### Design Rules
- No gradients (solid colors only)
- Exception: Image overlays for text readability
- Rounded corners: `rounded-2xl` for cards
- Floating pill buttons with backdrop blur
- Subtle shadows: `shadow-lg shadow-dark-900/5`

---

## Testing

### Run Backend Tests
```bash
cd backend
python manage.py test
```

### Run E2E Test
```bash
cd backend
python e2e_test.py
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Built With Meta AI

This project uses **Meta Llama 3.3 70B Turbo** via Together AI for:
- Conversational health companion
- Symptom analysis and triage
- Structured data extraction from voice input
- Context-aware pregnancy guidance
- Health report generation

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Meta AI for Llama 3.3 70B Turbo
- OpenAI for Whisper and TTS
- Together AI for LLM hosting
- The Nigerian healthcare workers inspiring this solution
