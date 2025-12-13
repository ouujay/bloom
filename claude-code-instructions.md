# Claude Code Instructions: Connect Features to Backend

## PRIORITY 1: Fix Token Earning (The Core Loop is Broken!)

### Step 1.1: Connect Task Completion to Tokens

**File: `backend/apps/daily_program/views.py`**

Find the task completion endpoint and ensure it calls TokenService:

```python
from apps.tokens.services import TokenService

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, progress_id):
    """Mark task as complete and award tokens"""
    progress = get_object_or_404(UserDayProgress, id=progress_id, user=request.user)
    
    if progress.task_completed:
        return Response({'error': 'Task already completed'}, status=400)
    
    progress.task_completed = True
    progress.save()
    
    # CRITICAL: Award tokens!
    tokens = progress.daily_content.task_tokens
    TokenService.award_tokens(
        user=request.user,
        amount=tokens,
        source='daily_task',
        reference_id=progress.id,
        reference_type='day_progress',
        description=f"Completed: {progress.daily_content.task_title}"
    )
    
    # Log to Passport
    from apps.passport.models import PassportEvent
    child = request.user.children.first()  # or get from request
    if child:
        PassportEvent.objects.create(
            child=child,
            event_type='task_completed',
            title=f'Completed: {progress.daily_content.task_title}',
            data={'tokens_earned': tokens}
        )
    
    return Response({'success': True, 'tokens_earned': tokens})
```

### Step 1.2: Do the same for lesson and check-in completion

Same pattern - ensure every completion action calls `TokenService.award_tokens()`

---

## PRIORITY 2: Add Health Complaint Conversation Type

### Step 2.1: Create pregnancy knowledge helper

**File: `backend/apps/ai/pregnancy_knowledge.py`** (NEW FILE)

```python
# Week-by-week pregnancy knowledge for AI context

PREGNANCY_WEEKS = {
    1: {
        "baby_size": "Poppy seed",
        "baby_development": "Fertilization occurs, cells begin dividing",
        "common_symptoms": ["No noticeable symptoms yet"],
        "normal_experiences": ["Missed period may be first sign"],
        "danger_signs": [],
    },
    4: {
        "baby_size": "Poppy seed",
        "baby_development": "Embryo implants in uterus",
        "common_symptoms": ["Fatigue", "Breast tenderness", "Mild cramping"],
        "normal_experiences": ["Light spotting", "Mood changes"],
        "danger_signs": ["Heavy bleeding", "Severe cramps"],
    },
    8: {
        "baby_size": "Raspberry",
        "baby_development": "Arms and legs forming, heart beating",
        "common_symptoms": ["Nausea", "Morning sickness", "Fatigue", "Frequent urination"],
        "normal_experiences": ["Food aversions", "Heightened smell"],
        "danger_signs": ["Severe vomiting", "Unable to keep fluids down"],
    },
    12: {
        "baby_size": "Lime",
        "baby_development": "All organs formed, reflexes developing",
        "common_symptoms": ["Nausea decreasing", "More energy", "Slight bump"],
        "normal_experiences": ["Skin changes", "Less frequent urination"],
        "danger_signs": ["Bleeding", "Severe abdominal pain"],
    },
    # ... Add weeks 16, 20, 24, 28, 32, 36, 40
    24: {
        "baby_size": "Corn on the cob",
        "baby_development": "Lungs developing, can hear sounds",
        "common_symptoms": ["Back pain", "Leg cramps", "Swelling in feet/ankles"],
        "normal_experiences": ["Braxton Hicks contractions", "Stretch marks"],
        "danger_signs": ["Sudden swelling in face/hands", "Severe headache", "Vision changes"],
    },
}

def get_week_knowledge(week):
    """Get knowledge for specific week, or closest available"""
    if week in PREGNANCY_WEEKS:
        return PREGNANCY_WEEKS[week]
    
    # Find closest week
    available = sorted(PREGNANCY_WEEKS.keys())
    closest = min(available, key=lambda x: abs(x - week))
    return PREGNANCY_WEEKS[closest]
```

### Step 2.2: Add health complaint conversation type

**File: `backend/apps/ai/views.py`**

Add to your conversation handler:

```python
from .pregnancy_knowledge import get_week_knowledge

def get_system_prompt(conversation_type, child=None):
    if conversation_type == 'health_complaint':
        week = child.current_pregnancy_week if child else 20
        knowledge = get_week_knowledge(week)
        
        return f"""You are Iyabot, a caring and knowledgeable pregnancy assistant.

CURRENT CONTEXT:
- User is in Week {week} of pregnancy
- Baby is currently the size of: {knowledge['baby_size']}
- Common symptoms at this stage: {', '.join(knowledge['common_symptoms'])}
- Normal experiences: {', '.join(knowledge['normal_experiences'])}
- Danger signs to watch for: {', '.join(knowledge['danger_signs'])}

WHEN USER REPORTS SYMPTOMS OR COMPLAINTS:
1. FIRST: Acknowledge with empathy ("I'm sorry you're feeling that way")
2. SECOND: Check if it's normal for Week {week}
3. THIRD: If NORMAL → Reassure and suggest home remedies
4. FOURTH: If CONCERNING → Recommend seeing a doctor immediately
5. ALWAYS END WITH: "Remember, I'm an AI assistant, not a doctor. Please consult your healthcare provider for medical advice."

AFTER THE CONVERSATION, you must also extract this JSON (for the app to save):
```json
{{
    "symptoms_reported": ["list", "of", "symptoms"],
    "severity": "mild|moderate|severe",
    "is_normal_for_week": true|false,
    "suggested_remedies": ["remedy 1", "remedy 2"],
    "suggested_tasks": ["task 1", "task 2"],
    "needs_doctor": false,
    "is_urgent": false
}}
```

Be warm, supportive, and informative. Speak simply and clearly."""

    elif conversation_type == 'health_checkin':
        week = child.current_pregnancy_week if child else 20
        knowledge = get_week_knowledge(week)
        
        return f"""You are Iyabot conducting a daily health check-in.

CONTEXT: User is in Week {week} of pregnancy

YOUR CHECKLIST (ask naturally, not like a form):
1. ✓ How are you feeling today? (mood/energy)
2. ✓ Any of these symptoms? {', '.join(knowledge['common_symptoms'][:3])}
3. ✓ {"Are you feeling baby move?" if week >= 16 else "Any cramping or spotting?"}
4. ✓ Any concerns or questions?

EDUCATE AS YOU GO:
- "At Week {week}, it's normal to feel..."
- "Your baby is now the size of a {knowledge['baby_size']}!"
- "This symptom is common because..."

AFTER CHECK-IN, extract JSON:
```json
{{
    "mood": "good|tired|anxious|happy|other",
    "energy_level": "low|medium|high",
    "symptoms": ["list of symptoms mentioned"],
    "baby_movement": true|false|null,
    "concerns": ["any concerns mentioned"],
    "needs_followup": false
}}
```

Keep it conversational and warm. 3-4 minutes max."""

    # ... other conversation types
    return "You are Iyabot, a helpful assistant."
```

### Step 2.3: Save extracted data after conversation

After AI conversation ends, parse the JSON and:

```python
# Save to DailyHealthLog
from apps.health.models import DailyHealthLog

DailyHealthLog.objects.update_or_create(
    user=user,
    date=timezone.now().date(),
    defaults={
        'mood': extracted_data.get('mood'),
        'symptoms': extracted_data.get('symptoms', []),
        'baby_movement': extracted_data.get('baby_movement'),
        'notes': str(extracted_data.get('concerns', [])),
    }
)

# Create personalized tasks from AI suggestions
if extracted_data.get('suggested_tasks'):
    for task_title in extracted_data['suggested_tasks']:
        PersonalizedTask.objects.create(
            user=user,
            child=child,
            title=task_title,
            source_symptom=extracted_data['symptoms'][0] if extracted_data['symptoms'] else 'general',
            expires_at=timezone.now() + timedelta(days=2),
            token_reward=5
        )
```

---

## PRIORITY 3: Add YouTube Video Support

### Step 3.1: Create YouTubeLesson model

**File: `backend/apps/daily_program/models.py`**

```python
class YouTubeLesson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # When to show
    stage = models.CharField(max_length=20, choices=[
        ('pregnancy', 'Pregnancy'),
        ('postpartum', 'Postpartum'),
        ('infant', 'Infant'),
        ('toddler', 'Toddler'),
    ], default='pregnancy')
    week = models.IntegerField()
    day = models.IntegerField(null=True, blank=True)
    
    # Video info
    youtube_id = models.CharField(max_length=20)
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration_seconds = models.IntegerField()
    thumbnail_url = models.URLField(blank=True)
    
    # Content
    key_points = models.JSONField(default=list)
    
    # Rewards
    token_reward = models.IntegerField(default=50)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['week', 'day']


class VideoProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    video = models.ForeignKey(YouTubeLesson, on_delete=models.CASCADE)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    tokens_earned = models.IntegerField(default=0)
```

### Step 3.2: API endpoint to complete video

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_video(request, video_id):
    video = get_object_or_404(YouTubeLesson, id=video_id)
    
    progress, created = VideoProgress.objects.get_or_create(
        user=request.user,
        video=video
    )
    
    if progress.is_completed:
        return Response({'error': 'Already completed'}, status=400)
    
    progress.is_completed = True
    progress.completed_at = timezone.now()
    progress.tokens_earned = video.token_reward
    progress.save()
    
    # Award tokens
    TokenService.award_tokens(
        user=request.user,
        amount=video.token_reward,
        source='daily_lesson',
        reference_id=video.id,
        reference_type='youtube_lesson',
        description=f"Watched: {video.title}"
    )
    
    # Log to passport
    PassportEvent.objects.create(
        child=request.user.children.first(),
        event_type='lesson_completed',
        title=f'Watched: {video.title}',
        data={'video_id': str(video.id), 'tokens': video.token_reward}
    )
    
    return Response({'success': True, 'tokens_earned': video.token_reward})
```

---

## PRIORITY 4: Expose Health Features

The `health` app is built but not exposed. Add these endpoints:

**File: `backend/apps/health/urls.py`**

```python
urlpatterns = [
    path('logs/', views.health_logs, name='health_logs'),
    path('logs/today/', views.today_log, name='today_log'),
    path('kicks/', views.kick_counts, name='kick_counts'),
    path('kicks/start/', views.start_kick_session, name='start_kick'),
    path('kicks/<uuid:session_id>/kick/', views.record_kick, name='record_kick'),
    path('appointments/', views.appointments, name='appointments'),
]
```

---

## FRONTEND: New Pages Needed

```
frontend/src/pages/mother/
├── HealthCheckin.jsx    # Voice check-in with Iyabot
├── ReportSymptom.jsx    # Report complaints to Iyabot  
├── VideoLesson.jsx      # YouTube player with completion
├── KickCounter.jsx      # Kick counting UI
├── Passport.jsx         # View life passport timeline
└── Appointments.jsx     # View/add appointments
```

---

## RUN THESE COMMANDS

```bash
# 1. Make migrations for new models
python manage.py makemigrations

# 2. Apply migrations
python manage.py migrate

# 3. Seed content (if not done)
python manage.py seed_content

# 4. Test token earning
python manage.py shell
>>> from apps.tokens.models import TokenTransaction
>>> TokenTransaction.objects.count()  # Should increase after completing tasks
```
