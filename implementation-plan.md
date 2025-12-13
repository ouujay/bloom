# Implementation Plan: Connecting Your Vision to Backend

## 🎯 Your Features → Backend Mapping

---

## FEATURE 1: Report Complaints (Talk to AI)

**What you described:**
- User reports symptoms ("I'm feeling swelling in my legs")
- AI knows their week (Week 4)
- AI uses knowledge bank to understand what's normal
- Responds sympathetically, suggests remedies
- Disclaims "I'm not a doctor"
- Generates personalized tasks based on complaint

**Backend Status:**
- ✅ `ai` app exists with voice conversations
- ✅ `children` app has pregnancy week tracking
- ✅ `health` app has `DailyHealthLog` model (symptoms, mood, etc.)
- ❌ No RAG/knowledge bank integration
- ❌ No complaint → task generation

**What needs to be added:**

```python
# 1. New conversation type in ai/views.py
CONVERSATION_TYPES = [
    'add_child',
    'onboarding', 
    'chat',
    'birth',
    'health_complaint',  # ← ADD THIS
]

# 2. Week-aware system prompt
def get_health_complaint_prompt(child):
    week = child.current_pregnancy_week
    return f"""
    You are Iyabot, a caring pregnancy assistant.
    
    CONTEXT:
    - User is in Week {week} of pregnancy
    - Expected symptoms at Week {week}: {get_expected_symptoms(week)}
    - Normal experiences: {get_normal_experiences(week)}
    
    WHEN USER REPORTS SYMPTOMS:
    1. Acknowledge their feelings with empathy
    2. Check if symptom is normal for Week {week}
    3. If normal: Reassure them, suggest remedies
    4. If concerning: Recommend seeing a doctor
    5. ALWAYS end with: "I'm not a doctor - please consult 
       your healthcare provider for medical advice"
    
    AFTER CONVERSATION:
    Extract and return JSON:
    {{
        "symptoms_reported": ["swelling", "fatigue"],
        "severity": "mild|moderate|severe",
        "suggested_tasks": ["elevate legs 3x today", "drink 8 glasses water"],
        "needs_doctor": false
    }}
    """

# 3. Save complaint to DailyHealthLog
# 4. Generate personalized tasks from AI response
# 5. Log to PassportEvent for Life Passport
```

---

## FEATURE 2: Dynamic Daily Tasks

**What you described:**
- General tasks (drink water, exercise) - same for everyone
- Personalized tasks based on symptoms
- Education tasks (watch YouTube video)
- Changes every day based on week/day

**Backend Status:**
- ✅ `DailyContent` model exists (lesson, task, tip per day)
- ✅ `UserDayProgress` tracks completion
- ⚠️ Only 2 weeks of content seeded
- ❌ No YouTube video model
- ❌ No personalized/dynamic tasks
- ❌ Tasks not connected to token earning

**What needs to be added:**

```python
# 1. Extend DailyContent or create new model
class DailyTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Targeting
    week = models.IntegerField()  # 1-40
    day = models.IntegerField()   # 1-7
    
    # Task info
    title = models.CharField(max_length=200)
    description = models.TextField()
    task_type = models.CharField(choices=[
        ('general', 'General'),           # drink water, exercise
        ('education', 'Education'),        # watch video
        ('health_check', 'Health Check'),  # AI check-in
        ('personalized', 'Personalized'),  # from symptoms
    ])
    
    # For education tasks
    youtube_url = models.URLField(blank=True)
    youtube_id = models.CharField(max_length=20, blank=True)
    video_duration_seconds = models.IntegerField(null=True)
    
    # Tokens
    token_reward = models.IntegerField(default=5)
    
    # Flags
    is_recurring = models.BooleanField(default=False)  # e.g., "drink water"
    is_dynamic = models.BooleanField(default=False)    # AI-generated

# 2. PersonalizedTask for symptom-based tasks
class PersonalizedTask(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    child = models.ForeignKey(Child, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    source_symptom = models.CharField(max_length=100)  # what triggered it
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # tasks expire after 1-3 days
    completed = models.BooleanField(default=False)
    
    token_reward = models.IntegerField(default=5)
```

---

## FEATURE 3: Health Check-in (AI Asks Questions)

**What you described:**
- AI proactively asks questions based on expected symptoms
- "How are you feeling? Any nausea? It's normal at this stage..."
- Educates user about what to expect
- 3-4 minute daily conversation

**Backend Status:**
- ✅ `ai` app can do voice conversations
- ✅ `health` app has `DailyHealthLog` 
- ⚠️ No structured check-in flow
- ❌ Not triggered as daily task

**What needs to be added:**

```python
# 1. Health check-in conversation type
# Uses existing ai app, new system prompt

def get_health_checkin_prompt(child):
    week = child.current_pregnancy_week
    return f"""
    You are conducting a daily health check-in.
    
    CONTEXT: User is in Week {week} of pregnancy
    
    YOUR JOB:
    1. Greet warmly
    2. Ask about their mood/energy today
    3. Ask about specific symptoms expected at Week {week}:
       - Week {week} common symptoms: {get_expected_symptoms(week)}
    4. Ask if baby is moving (if Week 16+)
    5. Educate them: "This is normal because..."
    6. End with encouragement
    
    EXTRACT DATA:
    {{
        "mood": "happy|tired|anxious|...",
        "symptoms": ["nausea", "back_pain"],
        "baby_movement": true|false|null,
        "concerns": ["..."],
        "is_urgent": false
    }}
    """

# 2. On completion: Save to DailyHealthLog, award tokens
# 3. Mark UserDayProgress.checkin_completed = True
```

---

## FEATURE 4: Education (YouTube Videos)

**What you described:**
- Curated YouTube videos per week
- Part of daily tasks
- Mark complete when watched
- Track progress

**Backend Status:**
- ❌ No video content model
- ❌ No video tracking

**What needs to be added:**

```python
# 1. YouTubeLesson model
class YouTubeLesson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Targeting
    stage = models.CharField(choices=[
        ('pregnancy', 'Pregnancy'),
        ('postpartum', 'Postpartum'),
        ('infant', 'Infant'),
        ('toddler', 'Toddler'),
    ])
    week = models.IntegerField()  # Week 1-40 for pregnancy
    day = models.IntegerField(null=True)  # Optional specific day
    
    # Video info
    youtube_id = models.CharField(max_length=20)
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration_seconds = models.IntegerField()
    thumbnail_url = models.URLField()
    
    # Learning
    key_points = models.JSONField(default=list)  # ["point 1", "point 2"]
    
    # Tokens
    token_reward = models.IntegerField(default=50)

# 2. Track video completion
class VideoProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    video = models.ForeignKey(YouTubeLesson, on_delete=models.CASCADE)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True)
    watch_time_seconds = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    tokens_earned = models.IntegerField(default=0)
```

---

## FEATURE 5: Life Passport

**What you described:**
- Logs all complaints
- Activities completed
- Tasks done
- Full journey record

**Backend Status:**
- ✅ `passport` app is FULLY BUILT
- ✅ `PassportEvent` model exists
- ✅ `PassportService` generates passport data
- ❌ Events not being logged
- ❌ No frontend to view/share

**What needs to be connected:**

```python
# The model already exists! Just need to LOG events:

# In every action, add:
from apps.passport.models import PassportEvent

# When user reports symptoms:
PassportEvent.objects.create(
    child=child,
    event_type='health_log',
    title='Reported symptoms',
    description='Swelling in legs, fatigue',
    data={'symptoms': ['swelling', 'fatigue'], 'week': 24}
)

# When user completes task:
PassportEvent.objects.create(
    child=child,
    event_type='task_completed',
    title='Completed: Drink 8 glasses of water',
    data={'task_id': task.id, 'tokens_earned': 5}
)

# When user watches video:
PassportEvent.objects.create(
    child=child,
    event_type='lesson_completed',
    title='Watched: Week 24 Baby Development',
    data={'video_id': video.id, 'duration': 480}
)
```

---

## 🚀 IMPLEMENTATION ORDER

### Phase 1: Fix Core Loop (Do This First)
1. Connect task completion → token earning (fix broken flow)
2. Seed more content (at least Week 1-12)
3. Add YouTube video tracking

### Phase 2: AI Features
4. Add `health_complaint` conversation type
5. Add `health_checkin` conversation type  
6. Build week-aware prompts with pregnancy knowledge

### Phase 3: Personalization
7. Generate personalized tasks from AI responses
8. Dynamic task expiration

### Phase 4: Life Passport
9. Log all events to PassportEvent
10. Build frontend to view/share passport

---

## 📁 Files to Modify

```
backend/apps/
├── ai/
│   ├── views.py          # Add health_complaint, health_checkin types
│   ├── prompts.py        # NEW: Week-aware system prompts
│   └── services.py       # Add pregnancy knowledge lookup
│
├── daily_program/
│   ├── models.py         # Add DailyTask, PersonalizedTask
│   ├── views.py          # Fix task completion → tokens
│   └── services.py       # Connect to TokenService
│
├── health/
│   └── views.py          # Expose existing models via API
│
├── tokens/
│   └── services.py       # Already built, just needs to be called
│
└── passport/
    └── views.py          # Already built, needs frontend + event logging

frontend/src/pages/mother/
├── Dashboard.jsx         # Connect to working endpoints
├── HealthCheckin.jsx     # NEW: Voice health check-in
├── ReportComplaint.jsx   # NEW: Report symptoms
├── VideoLesson.jsx       # NEW: YouTube video player
└── Passport.jsx          # NEW: View life passport
```
