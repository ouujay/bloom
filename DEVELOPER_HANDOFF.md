# Bloom - Developer Handoff Document

## Project Overview

**Bloom** (formerly MamaAlert) is a maternal health platform designed for Nigerian mothers. It provides:
- Daily educational content for pregnancy and baby care
- Voice-based AI assistant (Bloom) for health queries
- Token rewards system for engagement
- Health tracking and kick counting
- Doctor portal for reviewing health reports
- Life Passport feature for sharing health records

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build tool |
| Tailwind CSS v4 | Styling (uses `@theme` blocks, NOT tailwind.config.js) |
| React Router DOM | Routing |
| React Query | Server state management |
| Axios | HTTP client |
| Lucide React | Icons |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| Django 5.x | Framework |
| Django REST Framework | API |
| JWT (SimpleJWT) | Authentication |
| SQLite | Database (development) |
| OpenAI API | AI features (GPT-4o-mini, Whisper, TTS) |

---

## Project Structure

```
birth/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── api/             # API clients
│   │   │   ├── axios.js     # Axios instance with auth
│   │   │   ├── ai.js        # AI conversation APIs
│   │   │   ├── auth.js      # Authentication APIs
│   │   │   ├── children.js  # Children management APIs
│   │   │   ├── daily.js     # Daily program APIs
│   │   │   ├── health.js    # Health tracking APIs
│   │   │   ├── tokens.js    # Token APIs
│   │   │   └── doctor.js    # Doctor portal APIs
│   │   │
│   │   ├── components/
│   │   │   ├── common/      # Button, Input, Modal, Card, etc.
│   │   │   ├── daily/       # Daily program components
│   │   │   ├── health/      # Health tracking components
│   │   │   ├── layout/      # DashboardLayout, AdminLayout, DoctorLayout
│   │   │   ├── voice/       # VoiceRecorder, AudioPlayer
│   │   │   └── wallet/      # Token/wallet components
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useDailyProgram.js
│   │   │   ├── useAudioRecorder.js
│   │   │   └── useTokens.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Public landing page
│   │   │   ├── VoiceOnboarding.jsx  # Voice-based onboarding
│   │   │   ├── Children.jsx      # Children list
│   │   │   ├── AddChild.jsx      # Add pregnancy/baby
│   │   │   ├── auth/             # Login, Signup
│   │   │   ├── mother/           # Main user pages
│   │   │   ├── admin/            # Admin dashboard
│   │   │   └── doctor/           # Doctor portal
│   │   │
│   │   ├── App.jsx          # Main router
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Tailwind + theme
│   │
│   └── vite.config.js
│
├── backend/
│   ├── mamalert/            # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py          # Main URL routing
│   │   └── wsgi.py
│   │
│   ├── apps/
│   │   ├── users/           # User management & auth
│   │   ├── children/        # Children (pregnancies/babies)
│   │   ├── ai/              # AI conversations
│   │   ├── daily_program/   # Daily educational content
│   │   ├── health/          # Health tracking
│   │   ├── tokens/          # Rewards system
│   │   ├── withdrawals/     # Token withdrawals
│   │   └── passport/        # Life Passport sharing
│   │
│   ├── media/               # Uploaded files (audio, etc.)
│   └── manage.py
│
└── CLAUDE.md               # AI assistant instructions
```

---

## Database Models

### Users App (`apps/users/`)

**User** (extends AbstractUser)
```python
- id: UUID
- email: EmailField (unique, used for login)
- phone: CharField (unique)
- first_name, last_name
- date_of_birth: DateField
- blood_type: CharField (A+, A-, B+, B-, O+, O-, AB+, AB-)
- genotype: CharField (AA, AS, SS, AC, SC)
- location: CharField (state in Nigeria)
- health_conditions: JSONField (list)
- onboarding_complete: BooleanField
- token_balance: IntegerField
- user_type: CharField (mother, doctor, admin)
- is_admin: BooleanField
- is_verified_doctor: BooleanField (for doctors)
```

**EmergencyContact**
```python
- user: ForeignKey(User)
- name, phone, relationship
- is_primary: BooleanField
```

### Children App (`apps/children/`)

**Child** - Represents pregnancy or born baby
```python
- id: UUID
- user: ForeignKey(User)
- status: CharField (pregnant, born, archived)

# Pregnancy fields
- due_date: DateField
- weeks_at_registration: IntegerField

# Baby fields
- name, nickname
- birth_date: DateField
- birth_weight_kg: DecimalField
- gender: CharField (male, female, unknown)
- delivery_type: CharField

# Progress
- current_day: IntegerField
- current_streak, longest_streak: IntegerField

# Methods
- get_pregnancy_week()
- get_trimester()
- get_current_stage()
- transition_to_born()
```

### AI App (`apps/ai/`)

**Conversation**
```python
- id: UUID
- user: ForeignKey(User)
- child: ForeignKey(Child, optional)
- conversation_type: CharField (onboarding, add_child, chat, birth)
- status: CharField (active, completed, abandoned)
- parsed_data: JSONField
```

**Message**
```python
- conversation: ForeignKey(Conversation)
- role: CharField (system, user, assistant)
- content: TextField
- audio_input_url, audio_output_url: URLField
- parsed_data: JSONField
```

### Daily Program App (`apps/daily_program/`)

**DailyContent** - Educational content for each day
```python
- stage_type: CharField (pregnancy, postpartum, baby)
- stage_week: IntegerField (1-40 for pregnancy)
- day: IntegerField (1-7)
- title, theme
- lesson_title, lesson_content, lesson_summary
- tip_of_day: TextField
- task_title, task_description, task_type
- lesson_tokens, checkin_tokens, task_tokens
- is_quiz_day: BooleanField
```

**UserDayProgress**
```python
- child: ForeignKey(Child)
- daily_content: ForeignKey(DailyContent)
- lesson_completed, checkin_completed, task_completed: BooleanField
- tokens_earned: IntegerField
```

**YouTubeLesson**
```python
- stage, week, day
- youtube_id, title, description, duration_seconds
- thumbnail_url, key_points: JSONField
- token_reward: IntegerField
```

### Health App (`apps/health/`)

**DailyHealthLog**
```python
- child: ForeignKey(Child)
- date: DateField
- mood: CharField (great, good, okay, tired, stressed, unwell)
- weight_kg, blood_pressure_systolic, blood_pressure_diastolic
- symptoms: JSONField (list)
- baby_movement: CharField
- notes: TextField
```

**KickCount**
```python
- child: ForeignKey(Child)
- start_time, end_time: DateTimeField
- kick_count: IntegerField
- duration_minutes: IntegerField
```

**Appointment**
```python
- child: ForeignKey(Child)
- title, appointment_type
- date, time, location, doctor_name
- is_completed: BooleanField
```

**HealthReport** - AI-analyzed reports for doctors
```python
- user, child: ForeignKey
- pregnancy_week: IntegerField
- report_type: CharField (complaint, checkin)
- urgency_level: CharField (critical, urgent, moderate, normal)
- symptoms: JSONField
- ai_summary, ai_assessment, ai_recommendation: TextField
- conversation_transcript: TextField
- is_addressed: BooleanField
- addressed_by: ForeignKey(User) # doctor
```

### Tokens App (`apps/tokens/`)

**TokenTransaction**
```python
- user: ForeignKey(User)
- transaction_type: CharField (earn, spend, withdraw, bonus)
- amount: IntegerField
- source: CharField (daily_lesson, daily_checkin, streak_bonus, etc.)
- balance_after: IntegerField
```

### Passport App (`apps/passport/`)

**PassportShare** - Shareable links to health records
```python
- child: ForeignKey(Child)
- share_code: CharField (unique, 8 chars)
- passcode: CharField (6 digits)
- recipient_name, recipient_type, recipient_email
- expires_at: DateTimeField
- view_count: IntegerField
```

**PassportEvent** - Timeline events
```python
- child: ForeignKey(Child)
- event_type: CharField (task_completed, lesson_completed, health_checkin, etc.)
- title, description
- stage_type, stage_week, stage_day
- is_concern: BooleanField
- event_date: DateField
```

---

## API Endpoints

### Authentication (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup/` | Register new user |
| POST | `/login/` | Login, returns JWT tokens |
| POST | `/token/refresh/` | Refresh access token |
| GET | `/me/` | Get current user |
| POST | `/onboarding/` | Complete form-based onboarding |

### Children (`/api/children/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's children |
| POST | `/` | Create new child |
| GET | `/{id}/` | Get child details |
| PATCH | `/{id}/` | Update child |
| POST | `/{id}/transition-to-born/` | Convert pregnancy to born |

### AI (`/api/ai/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversation/start/` | Start new conversation |
| POST | `/conversation/message/` | Send message (text or audio) |
| POST | `/conversation/{id}/complete/` | Complete conversation, extract data |
| GET | `/conversation/{id}/` | Get conversation with messages |
| POST | `/transcribe/` | Transcribe audio only |

### Daily Program (`/api/daily/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/today/{child_id}/` | Get today's content |
| POST | `/{progress_id}/complete-lesson/` | Mark lesson complete |
| POST | `/{progress_id}/checkin/` | Submit health check-in |
| POST | `/{progress_id}/complete-task/` | Mark task complete |
| GET | `/progress/{child_id}/` | Get overall progress |
| GET | `/videos/{child_id}/` | Get available videos |
| POST | `/videos/{video_id}/complete/` | Mark video complete |

### Health (`/api/health/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kicks/` | Record kick count session |
| GET | `/kicks/{child_id}/` | Get kick history |
| GET | `/appointments/{child_id}/` | Get appointments |
| POST | `/appointments/` | Create appointment |

### Tokens (`/api/tokens/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/balance/` | Get token balance |
| GET | `/transactions/` | Get transaction history |

### Withdrawals (`/api/withdrawals/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rate/` | Get conversion rate |
| POST | `/request/` | Create withdrawal request |
| GET | `/history/` | Get withdrawal history |

### Passport (`/api/passport/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{child_id}/` | Get passport data |
| POST | `/{child_id}/share/` | Create share link |
| POST | `/view/{code}/` | View shared passport |

---

## Frontend Routes

### Public Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Marketing landing page |
| `/login` | Login | User login |
| `/signup` | Signup | User registration |

### Authenticated Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/onboarding` | VoiceOnboarding | Voice-based profile setup |
| `/children` | Children | List of children |
| `/children/add` | AddChild | Add new pregnancy/baby |

### Child-Specific Routes (`/child/:childId/...`)
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Main dashboard |
| `/today` | DailyProgram | Today's tasks |
| `/lesson/:stageType/:stageWeek/:day` | Lesson | Read lesson |
| `/progress` | Progress | Progress overview |
| `/kicks` | KickCounter | Kick counting |
| `/appointments` | Appointments | Manage appointments |
| `/checkin` | HealthCheckin | Daily health check-in |
| `/chat` | Chat | AI chat |
| `/videos` | Videos | Educational videos |
| `/video/:videoId` | VideoDetail | Watch video |
| `/timeline` | PregnancyTimeline | 40-week journey view |

### User Routes (`/dashboard/...`)
| Path | Component | Description |
|------|-----------|-------------|
| `/wallet` | Wallet | Token balance & history |
| `/withdraw` | Withdraw | Withdraw tokens |
| `/profile` | Profile | User profile |
| `/emergency` | Emergency | Emergency contacts |

### Admin Routes (`/admin/...`)
| Path | Component | Description |
|------|-----------|-------------|
| `/` | AdminDashboard | Admin overview |
| `/withdrawals` | AdminWithdrawals | Process withdrawals |
| `/users` | AdminUsers | Manage users |

### Doctor Routes (`/doctor/...`)
| Path | Component | Description |
|------|-----------|-------------|
| `/login` | DoctorLogin | Doctor login |
| `/signup` | DoctorSignup | Doctor registration |
| `/` | DoctorDashboard | Doctor dashboard |
| `/reports` | DoctorReports | Health reports list |
| `/reports/:reportId` | DoctorReportDetail | Report detail |

---

## Key Features & Implementation

### 1. Voice-Based Onboarding
- Uses OpenAI Whisper for speech-to-text
- Uses OpenAI TTS for text-to-speech
- GPT-4o-mini for conversation
- Collects: age, location, blood type, genotype, health conditions, emergency contact
- **File**: `frontend/src/pages/VoiceOnboarding.jsx`
- **Backend**: `backend/apps/ai/views.py`

### 2. Voice Recording
- **Tap to speak** (not hold to speak)
- Shows recording timer (MM:SS format)
- Visual audio level indicator
- Icon changes: Mic → Send when recording
- **File**: `frontend/src/components/voice/VoiceRecorder.jsx`

### 3. Multi-Child Support
- Users can track multiple pregnancies/babies
- Each child has separate progress, health logs, etc.
- Routes are child-specific: `/child/:childId/...`
- **Model**: `backend/apps/children/models.py`

### 4. Token Rewards System
- Earn tokens for completing activities:
  - Daily lesson: +5 tokens
  - Health check-in: +5 tokens
  - Daily task: +5 tokens
  - Weekly quiz: +25 tokens
  - 7-day streak: +20 tokens
  - Onboarding: +50 tokens
- Conversion: 10 tokens = ₦1
- Minimum withdrawal: 100 tokens (₦10)

### 5. AI Chat
- Context-aware responses based on pregnancy week
- Knows expected symptoms for each stage
- Warns about danger signs
- Creates HealthReports for doctor review
- **File**: `frontend/src/pages/mother/Chat.jsx`

### 6. Doctor Portal
- Doctors see AI-triaged health reports
- Urgency levels: critical, urgent, moderate, normal
- Can mark reports as addressed
- **Files**: `frontend/src/pages/doctor/`

### 7. Life Passport
- Shareable health record
- Protected by passcode
- Time-limited access (24h, 7d, 30d)
- Timeline of all health events

---

## Design System

### Color Palette (Tailwind v4)
Defined in `frontend/src/index.css`:

```css
/* Primary - Pale Pink */
--color-primary-50 to --color-primary-700

/* Secondary - Pale Green (bloom) */
--color-bloom-50 to --color-bloom-700

/* Background - Cream */
--color-cream-50 to --color-cream-500

/* Text - Dark */
--color-dark-500 to --color-dark-900
```

### Design Rules
- **NO GRADIENTS** - Use solid colors only
- Floating pill-shaped buttons with `backdrop-blur`
- Cream backgrounds: `bg-cream-100`
- White cards with subtle shadows
- Round corners: `rounded-2xl`, `rounded-xl`
- Tailwind classes must be explicit (no string interpolation)

---

## Running the Project

### Frontend
```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build    # Production build
```

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver   # http://localhost:8000
```

### Environment Variables
Backend needs `.env` file:
```
OPENAI_API_KEY=sk-...
SECRET_KEY=django-secret-key
DEBUG=True
```

---

## Common Patterns

### API Response Format
```javascript
// Success
{ success: true, data: {...} }

// Error
{ success: false, message: "Error message", errors: {...} }
```

### AI Message Objects
API returns messages as objects, not strings:
```javascript
// Response format
{ id: "uuid", content: "Hello!", transcribed: true }

// Always extract content safely:
const messageContent = typeof response.data.message === 'object'
  ? response.data.message?.content || ''
  : response.data.message || '';
```

### Protected Routes
```jsx
<ProtectedRoute requireOnboarding>
  <Component />
</ProtectedRoute>

// Props:
// - requireOnboarding: requires onboarding_complete
// - requireAdmin: requires is_admin
// - requireDoctor: requires user_type === 'doctor'
```

---

## Known Issues / TODOs

1. **Push Notifications** - Not implemented yet
2. **Real Payment Integration** - Withdrawal uses mock data
3. **SMS Integration** - For reminders and OTP
4. **Database** - Currently SQLite, should migrate to PostgreSQL for production
5. **File Storage** - Local media storage, should use S3 for production
6. **Rate Limiting** - No rate limiting on API endpoints

---

## Testing

### E2E Test
```bash
cd backend
python e2e_test.py
```

### Manual Testing Flow
1. Sign up new user
2. Complete voice onboarding
3. Add a child (pregnancy)
4. View daily content
5. Complete lesson, check-in, task
6. Use AI chat
7. Check token balance
8. Try withdrawal

---

## Deployment Notes

### Frontend
- Build with `npm run build`
- Static files in `dist/`
- Configure API URL in environment

### Backend
- Set `DEBUG=False`
- Use PostgreSQL
- Configure S3 for media
- Set up CORS for frontend domain
- Run migrations: `python manage.py migrate`
- Collect static: `python manage.py collectstatic`

---

## Contact / Support

Project maintained by the development team. For questions:
- Check CLAUDE.md for AI assistant context
- Review this document for architecture
- Check individual model files for field details
