# Bloom - Maternal Health Platform

## Project Overview
Bloom (formerly MamaAlert) is a maternal health platform that provides daily education, health tracking, and token-based rewards for pregnant women. The platform is designed specifically for Nigerian/African mothers.

## Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS v4 (uses `@theme` blocks in CSS, not tailwind.config.js)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Query (@tanstack/react-query)
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Location**: `/Users/funbi/Documents/projects/birth/frontend`

### Backend
- **Framework**: Django 5.x with Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **AI**: OpenAI GPT-4 for chat, Whisper for voice transcription
- **Database**: SQLite (development)
- **Location**: `/Users/funbi/Documents/projects/birth/backend`

## Design System

### Color Scheme (Tailwind CSS v4)
Defined in `frontend/src/index.css` using `@theme` blocks:

```css
/* Pale Pink - Primary accent */
--color-primary-50 to --color-primary-700

/* Pale Green - Secondary (bloom) */
--color-bloom-50 to --color-bloom-700

/* Cream - Background */
--color-cream-50 to --color-cream-500

/* Dark colors for text */
--color-dark-500 to --color-dark-900
```

### Design Rules
- **NO GRADIENTS** - Use solid colors only (bg-primary-500, not bg-gradient-to-r)
- Exception: Image overlays for text readability (bg-gradient-to-t from-dark-900/60)
- Floating pill-shaped buttons with backdrop blur: `bg-white/90 backdrop-blur-sm rounded-full shadow-lg`
- Cream backgrounds: `bg-cream-100`
- Subtle shadows: `shadow-lg shadow-dark-900/5`
- Rounded corners: `rounded-2xl` for cards, `rounded-full` for buttons/pills

## Routing Structure

### Child-Specific Routes (`/child/:childId/...`)
All mother dashboard features are scoped to a specific child:
- `/child/:childId` - Dashboard (home)
- `/child/:childId/today` - Daily program/lesson
- `/child/:childId/progress` - Progress tracking
- `/child/:childId/chat` - AI chat with Bloom
- `/child/:childId/videos` - Educational videos
- `/child/:childId/video/:videoId` - Single video player
- `/child/:childId/timeline` - Pregnancy journey timeline
- `/child/:childId/checkin` - Health check-in
- `/child/:childId/kicks` - Kick counter (20+ weeks only)
- `/child/:childId/appointments` - Appointments

### User-Level Routes (`/dashboard/...`)
Not child-specific:
- `/dashboard/wallet` - Token wallet
- `/dashboard/withdraw` - Withdraw tokens
- `/dashboard/profile` - User profile & emergency contact
- `/dashboard/emergency` - Emergency help page

### Other Routes
- `/children` - List all children
- `/children/add` - Add new child (voice-based)
- `/onboarding` - Voice-based user onboarding

## Key Pages

### Dashboard (`/child/:childId`)
- Hero section with pregnancy week, baby size comparison, progress bar
- "View Journey" button to timeline
- Daily Tasks: Lesson, Wellness Task, Health Check-in
- Educational Videos section (shows 2, links to all)
- Upcoming appointments
- Weekly progress

### Pregnancy Timeline (`/child/:childId/timeline`)
- Visual timeline of 40-week pregnancy journey
- Current week hero with baby size
- Trimester cards with completion status
- Week-by-week selector (scrollable)
- Key milestones with descriptions
- Color-coded by trimester (primary/bloom/purple)

### Chat (`/child/:childId/chat`)
- AI-powered chat with "Bloom" assistant
- Voice input (tap to speak) or text input
- Audio playback for AI responses
- Quick prompt suggestions

### Profile (`/dashboard/profile`)
- User info editing
- Emergency contact setup (name, phone, relationship)
- Hospital/doctor info
- Sign out button

### Emergency (`/dashboard/emergency`)
- Call 112 button
- Share location feature
- Send SOS to emergency contact
- Nigerian emergency numbers
- Danger signs list
- Find nearby hospitals

## Navigation

### Desktop Navbar
- Logo (links to /children)
- Primary nav items (context-dependent):
  - Child context: Home, Today, Progress, Chat
  - User context: Children
- Emergency button (always visible, red)
- More menu (⋯) with: My Children, Wallet, Profile, Emergency, Sign Out

### Mobile
- Top header: Logo, Emergency button, More menu
- Bottom nav: Primary items + Wallet + Profile
- Slide-out menu panel for More items

## Voice Recording
- **Tap to speak** (not hold to speak)
- Tap mic button to start recording
- Tap send button to stop and send
- Shows recording timer (MM:SS)
- Audio level visualization
- Disabled while AI is responding

## Backend Apps

### Users (`backend/apps/users/`)
- Custom User model with pregnancy-related fields
- JWT authentication
- Onboarding flow
- Emergency contact (separate model, flattened in API)
- Preferred hospital (separate model, flattened in API)

### Children (`backend/apps/children/`)
- Child model (can be pregnant or born)
- Status: 'pregnant' or 'born'
- Due date / birth date
- Age calculations

### Daily Program (`backend/apps/daily_program/`)
- 40 weeks of pregnancy content
- DailyContent model (stage_type, stage_week, day)
- UserDayProgress for tracking
- Video lessons with YouTube integration
- Fallback content if exact week/day not found

### Health (`backend/apps/health/`)
- DailyHealthLog model
- Mood choices: great, good, okay, tired, stressed, unwell
- Symptoms tracking
- Baby movement tracking
- KickCount sessions
- Appointments

### AI (`backend/apps/ai/`)
- Conversation model
- Voice transcription (Whisper)
- Text-to-speech
- Conversation types: chat, add_child, onboarding

### Tokens (`backend/apps/tokens/`)
- Token balance and transactions
- Rewards:
  - Daily lesson: +5 tokens
  - Health check-in: +5 tokens
  - Wellness task: +5 tokens
  - 7-day streak: +20 tokens
  - Video completion: +5 tokens

### Withdrawals (`backend/apps/withdrawals/`)
- Token to Naira conversion (10 tokens = ₦1)
- Minimum withdrawal: 100 tokens (₦10)

## API Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

## Key API Endpoints
Base URL: `http://localhost:8000/api`

### Auth
- `POST /auth/signup/` - Register
- `POST /auth/login/` - Login
- `GET /auth/me/` - Get current user (flattens emergency contact & hospital)
- `PATCH /auth/me/` - Update profile

### Children
- `GET /children/` - List children
- `POST /children/` - Create child
- `GET /children/{id}/` - Get child details

### Daily Program
- `GET /daily/{childId}/today/` - Get today's program
- `POST /daily/{childId}/{progressId}/complete-lesson/` - Complete lesson
- `POST /daily/{childId}/{progressId}/complete-task/` - Complete task
- `POST /daily/{childId}/{progressId}/checkin/` - Submit check-in
- `GET /daily/{childId}/videos/` - Get videos for child
- `GET /daily/videos/{videoId}/` - Get single video
- `POST /daily/videos/{videoId}/complete/` - Mark video complete

### Health
- `GET /health/{childId}/logs/` - Get health logs
- `POST /health/{childId}/logs/` - Create/update health log
- `GET /health/{childId}/kicks/` - Get kick sessions
- `POST /health/{childId}/kicks/start/` - Start kick session

### AI
- `POST /ai/conversation/start/` - Start conversation
- `POST /ai/conversation/{id}/message/` - Send message (text or audio)

## Common Patterns

### Handling API Message Objects
AI API returns messages as objects `{id, content, transcribed}`, not strings:
```javascript
const messageContent = typeof response.data.message === 'object'
  ? response.data.message?.content || ''
  : response.data.message || '';
```

### Child-Specific Hooks
```javascript
const { childId } = useParams();
const { today, progress, child } = useDailyProgram(childId);
```

### Tailwind Dynamic Classes
Don't use string interpolation for Tailwind classes:
```javascript
// BAD - won't work
className={`bg-${color}-500`}

// GOOD - use explicit classes
const getBgColor = (color) => {
  if (color === 'primary') return 'bg-primary-500';
  if (color === 'bloom') return 'bg-bloom-500';
  return 'bg-purple-500';
};
```

## Running the Project

### Frontend
```bash
cd frontend
npm install
npm run dev  # Development server on http://localhost:3000
npm run build  # Production build
```

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # Server on http://localhost:8000
```

### Seed Content
```bash
cd backend
python manage.py seed_content  # Seeds daily program content
```

## E2E Test
```bash
cd backend
python e2e_test.py
```
