# 🌸 BLOOM - Complete Application Guide

**Version**: 1.0
**Last Updated**: December 13, 2025
**Platform**: Maternal Health Incentive System with Blockchain Rewards

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Core Features](#core-features)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [User Flows](#user-flows)
8. [Integrations](#integrations)
9. [File Structure](#file-structure)
10. [Setup & Deployment](#setup--deployment)

---

## 🎯 Overview

### What is Bloom?

**Bloom** is a maternal health platform that incentivizes healthy behaviors during pregnancy, postpartum, and early childcare through **token rewards** backed by a **donation pool** and recorded on the **Ethereum blockchain**.

### The Problem It Solves

- **Low maternal health literacy** in Nigeria
- **Poor prenatal care engagement**
- **Lack of financial incentives** for healthy behaviors
- **No verifiable proof** of health journey completion
- **Limited access** for feature phone users (60% of market)

### The Solution

Bloom combines:
- 📚 **Educational content** (daily lessons, videos, tips)
- 🏥 **Health tracking** (check-ins, symptoms, measurements)
- 🤖 **AI health assistant** (chat + voice support)
- 🪙 **Token rewards** for completing activities
- 💰 **Real money withdrawals** (tokens → Naira)
- ⛓️ **Blockchain transparency** (verifiable donations)
- 📱 **SMS support** for feature phones (60% market expansion)
- 📖 **Life Passport** (shareable health records)

---

## 🛠️ Tech Stack

### Backend (Django)
```
Python 3.13
Django 6.0
Django REST Framework 3.14
PostgreSQL / SQLite (dev)
```

### Blockchain
```
Solidity (ERC20 Token)
Hardhat (development environment)
Web3.py (Python integration)
Ethereum Sepolia Testnet
```

### AI & Communication
```
OpenAI GPT-4o-mini (chat)
OpenAI Whisper (voice transcription)
Twilio (SMS - primary)
Africa's Talking (SMS - backup)
```

### Payments
```
ALATPay (bank transfers via virtual accounts)
Paystack (card payments - backup)
```

### Frontend
```
React 18
Vite
Tailwind CSS
Axios
React Router
```

### Infrastructure
```
Node.js 22 (NVM)
Git + GitHub
Etherscan (blockchain verification)
```

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Mobile/Web     │
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│  Django Backend │
│                 │
│  ┌───────────┐  │
│  │   Apps    │  │
│  ├───────────┤  │
│  │ Users     │  │
│  │ Children  │  │
│  │ Daily     │  │
│  │ Health    │  │
│  │ AI        │  │
│  │ Tokens    │  │
│  │ Payments  │  │
│  │ Passport  │  │
│  │ SMS       │  │
│  └───────────┘  │
└────┬────┬───┬───┘
     │    │   │
     │    │   └──────────┐
     │    │              │
     ▼    ▼              ▼
┌─────┐ ┌──────┐   ┌──────────┐
│ DB  │ │Blockchain│ │External │
│     │ │ Sepolia  │ │Services │
└─────┘ └──────┘   │          │
                    │ OpenAI   │
                    │ Twilio   │
                    │ ALATPay  │
                    └──────────┘
```

### Data Flow Example: User Completes Task

```
1. User clicks "Complete Task" (Frontend)
   ↓
2. POST /api/daily/{child_id}/{progress_id}/complete-task/ (API)
   ↓
3. DailyProgramService.complete_task() (Business Logic)
   ↓
4. TokenService.award_tokens() (Reward System)
   ↓
5. PassportEvent.create() (Health Record)
   ↓
6. User.token_balance += 10 (Database Update)
   ↓
7. Return updated balance (Response)
```

---

## ✨ Core Features

### 1. User Authentication & Onboarding

**Flow**: Signup → Voice Onboarding → Add Child → Start Journey

**Voice Onboarding**:
- AI-powered conversation via voice or text
- Collects: pregnancy status, due date, health info
- Uses OpenAI Whisper for speech-to-text
- Uses GPT-4o-mini for intelligent responses
- Automatic navigation to child creation after completion

**Tech**:
- JWT authentication (djangorestframework-simplejwt)
- Custom User model with UUID primary keys
- Onboarding conversation state tracking

**Files**:
- `apps/users/models.py` - User model
- `apps/ai/services.py` - Voice onboarding logic
- `frontend/src/pages/VoiceOnboarding.jsx`

---

### 2. Daily Program System

**Purpose**: Structured learning journey with rewards

**How It Works**:
1. User adds child with due date
2. System calculates current stage (pregnancy week X, day Y)
3. Fetches today's content (lesson, task, health check-in)
4. User completes activities → earns tokens
5. Progress tracked on Life Passport

**Content Structure**:
```
Stage: pregnancy / postpartum / baby
Week: 1-42 (pregnancy), 1-12 (postpartum), 1-52 (baby)
Day: 1-7 (weekly cycle)

Each Day Contains:
- Educational Lesson (10 tokens)
- Daily Task (10 tokens)
- Health Check-in (5 tokens)
- Tip of the Day
- Optional: Weekly Quiz (20 tokens)
```

**Fallback System**:
- If user is at Week 30 but only Week 1-2 content exists
- System returns closest available content (Week 2)
- Marked with `is_fallback: true`

**Tech**:
- `DailyContent` model stores curriculum
- `UserDayProgress` tracks completion per child
- Smart fallback logic for missing content
- Automatic token rewards on completion

**Files**:
- `apps/daily_program/models.py`
- `apps/daily_program/services.py`
- `apps/daily_program/views.py`

---

### 3. Health Tracking System

**Features**:
- Daily health check-ins (mood, weight, blood pressure)
- Symptom reporting with severity levels
- Baby movement tracking (pregnancy)
- Blood sugar monitoring (if gestational diabetes)
- Automatic passport event creation

**Data Collected**:
```python
{
  'mood': 'good',  # good, okay, bad
  'weight': 68.5,
  'bp_systolic': 120,
  'bp_diastolic': 80,
  'symptoms': ['nausea', 'fatigue'],
  'baby_movement': 'normal',  # active, normal, reduced, none
  'blood_sugar': 95,
  'notes': 'Feeling better today'
}
```

**Rewards**:
- Basic check-in: 5 tokens
- Symptom reporting: +3 tokens
- Consistency streak: Bonus tokens

**Files**:
- `apps/health/models.py`
- `apps/health/views.py`

---

### 4. AI Health Assistant

**Capabilities**:
- Text chat (web/mobile)
- Voice chat (audio recording → transcription → response)
- SMS chat (feature phones via `Q [question]`)
- Pregnancy/postpartum health advice
- Symptom assessment
- Appointment reminders

**Technical Flow**:

**Text Chat**:
```
User: "I have morning sickness, what should I do?"
  ↓
OpenAI GPT-4o-mini (maternal health context)
  ↓
AI: "Morning sickness is common. Try eating small meals..."
```

**Voice Chat**:
```
User: [Audio Recording]
  ↓
OpenAI Whisper (speech-to-text)
  ↓
Text: "I have morning sickness, what should I do?"
  ↓
OpenAI GPT-4o-mini
  ↓
AI: "Morning sickness is common..."
```

**SMS Chat**:
```
User sends: "Q I have morning sickness"
  ↓
Twilio/Africa's Talking webhook
  ↓
Parse command ("Q" = question)
  ↓
OpenAI GPT-4o-mini
  ↓
SMS Response: "Morning sickness is common..."
```

**Context Awareness**:
- Knows user's pregnancy week
- Knows child's birth date
- Knows health history
- Remembers conversation context

**Files**:
- `apps/ai/models.py` - Conversation, Message models
- `apps/ai/services.py` - AIService, VoiceService
- `apps/ai/views.py` - API endpoints
- `apps/sms/views.py` - SMS webhook

---

### 5. Token Rewards System

**How It Works**:

```
Donation Pool (₦100,000)
        ↓
Users earn tokens by completing activities
        ↓
Token Balance = Share of Pool
        ↓
User withdraws → Converts tokens to Naira
```

**Token Economics**:

```python
# Pool starts at ₦100,000
# 10,000 tokens issued total
# Token value = ₦100,000 / 10,000 = ₦10 per token

# User has 500 tokens
# User's Naira value = 500 × ₦10 = ₦5,000

# User withdraws 500 tokens
# Pool balance: ₦100,000 - ₦5,000 = ₦95,000
# Tokens in circulation: 10,000 - 500 = 9,500
# New token value: ₦95,000 / 9,500 = ₦10 (maintained)
```

**Token Earning Activities**:
```
Daily Lesson Completion: 10 tokens
Daily Task Completion: 10 tokens
Health Check-in: 5 tokens
Symptom Report: 3 tokens
YouTube Video Watch: 15 tokens
Weekly Quiz: 20 tokens
AI Conversation: 2 tokens
Streak Bonus: Variable
```

**Withdrawal Process**:
```
1. User has 200+ tokens
2. Submits withdrawal request (bank details + ID photo)
3. Admin reviews and approves
4. Tokens deducted from user balance
5. Pool balance reduced by Naira amount
6. Manual bank transfer to user
7. Status updated to "completed"
```

**Database Models**:
- `DonationPool` - Single record, tracks pool balance and token metrics
- `TokenTransaction` - Every token movement (earn/withdraw)
- `WithdrawalRequest` - Pending withdrawal applications

**Files**:
- `apps/tokens/models.py`
- `apps/tokens/services.py`
- `apps/tokens/views.py`

---

### 6. Blockchain Integration

**Purpose**: Transparent, verifiable proof of donations

**Smart Contract**:
```solidity
// BLOOM Token (ERC20)
Contract Address: 0x4AfD7A134Eb249E081799d3A94079de11932C37f
Network: Ethereum Sepolia Testnet
Symbol: BLOOM
Decimals: 18
```

**What Gets Recorded**:
```
Every donation → Blockchain transaction
- Amount (in Naira, converted to wei)
- Donor email (hashed for privacy)
- Payment reference
- Timestamp
- Transaction hash (proof)
```

**Automatic Recording Flow**:
```
1. User makes bank transfer
   ↓
2. ALATPay detects payment
   ↓
3. Donation confirmed in database
   ↓
4. AUTO: Blockchain recording triggered
   ↓
5. Web3.py signs transaction with admin key
   ↓
6. Transaction sent to Sepolia network
   ↓
7. Transaction hash saved to database
   ↓
8. Viewable on Etherscan forever
```

**Verification**:
```
View all donations:
https://sepolia.etherscan.io/address/0x4AfD7A134Eb249E081799d3A94079de11932C37f

Verify specific donation:
https://sepolia.etherscan.io/tx/0xd9d85ae585f82b7de93f06dbc6db88f76d589980033a0c93bd1cc03ed2eda711
```

**Benefits**:
- ✅ Permanent, tamper-proof records
- ✅ Public transparency (anyone can verify)
- ✅ Trust building (donors see their contribution)
- ✅ No central authority needed

**Files**:
- `blockchain.py` - Core Web3 service
- `apps/blockchain_api/` - Django app for blockchain
- `apps/tokens/services.py:119-168` - Auto-recording logic
- `mamalert-blockchain/contracts/BloomToken.sol` - Smart contract

---

### 7. Payment Integration

**Donation Flow**:

**ALATPay (Primary - Bank Transfer)**:
```
1. User clicks "Donate ₦500"
   ↓
2. Backend creates virtual account (Wema Bank)
   → Account: 8880296260
   → Name: BLOOM-REF123
   → Expires: 24 hours
   ↓
3. User transfers via USSD/mobile banking
   ↓
4. ALATPay webhook notifies backend
   ↓
5. Donation auto-confirmed
   ↓
6. Blockchain auto-recorded
   ↓
7. Pool balance updated
```

**Paystack (Backup - Card Payments)**:
```
1. User clicks "Pay with Card"
   ↓
2. Paystack popup opens
   ↓
3. User enters card details
   ↓
4. Payment processed
   ↓
5. Webhook confirms payment
   ↓
6. Same flow as ALATPay
```

**Environment Variables**:
```bash
# ALATPay
ALATPAY_PUBLIC_KEY=c938a97bd1894567b562756d03c406e1
ALATPAY_SECRET_KEY=b17f536f5c7d4d2abcab3c11eb60b055
ALATPAY_BUSINESS_ID=3e9c81bb-afea-4e8c-70eb-08de17643c55
ALATPAY_BASE_URL=https://apibox.alatpay.ng

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
```

**Files**:
- `apps/payments/services.py` - ALATPay/Paystack integration
- `apps/payments/views.py` - Payment endpoints
- `apps/tokens/views.py` - Donation confirmation

---

### 8. SMS Feature (Feature Phone Support)

**Market Impact**: 60% of Nigerian market uses feature phones

**Commands**:
```
BAL                 → Check token balance
Q [question]        → Ask health question
TIPS                → Get daily health tip
HELP                → List all commands
```

**Example**:
```
User sends: "Q what should I eat during pregnancy"
  ↓
Twilio/Africa's Talking receives SMS
  ↓
Webhook: POST /sms/webhook/
  ↓
Parse command: "Q" = question
  ↓
OpenAI GPT-4o-mini processes
  ↓
SMS Response: "During pregnancy, eat foods rich in..."
```

**Multi-Provider Setup**:
- **Primary**: Twilio (global coverage)
- **Backup**: Africa's Talking (Nigeria-specific)
- **Graceful Degradation**: Works with/without SMS credentials

**Phone Number Formatting**:
```python
# Nigerian numbers
+2348012345678  → Valid
08012345678     → Auto-formatted to +2348012345678
2348012345678   → Auto-formatted to +2348012345678
```

**Files**:
- `apps/sms/services.py` - Multi-provider SMS service
- `apps/sms/views.py` - Webhook endpoints
- `apps/sms/management/commands/send_daily_tips.py` - Automated tips

---

### 9. Life Passport System

**Concept**: Self-writing digital health diary

**What It Records**:
```
✅ Tasks completed
✅ Lessons learned
✅ Health check-ins
✅ Symptoms reported
✅ AI conversations
✅ Appointments
✅ Milestones
✅ Videos watched
```

**Data Structure**:
```python
{
  'mother': {
    'name': 'Jane Doe',
    'blood_type': 'O+',
    'genotype': 'AA'
  },
  'child': {
    'name': 'Baby John',
    'status': 'pregnant',
    'due_date': '2025-03-15',
    'current_stage': {'type': 'pregnancy', 'week': 24}
  },
  'timeline': [
    {
      'date': '2025-12-13',
      'type': 'task_completed',
      'title': 'Completed Daily Walk',
      'stage': {'week': 24, 'day': 3}
    }
  ],
  'summary': {
    'tasks_completed': 45,
    'lessons_completed': 20,
    'health_checkins': 30
  }
}
```

**Sharing System**:
```
Mother creates share link for doctor:
  → Share Code: X7K9P2M1
  → Passcode: 123456
  → Expires: 7 days

Doctor visits: bloom.com/passport/X7K9P2M1
  → Enters passcode
  → Views full health timeline
  → No account needed!
```

**Security**:
- ✅ Passcode protected
- ✅ Time-limited (24h, 7d, 30d)
- ✅ Can be revoked anytime
- ✅ View tracking (analytics)

**Use Cases**:
1. **Doctor visits**: Share 7-day access before appointment
2. **Partner involvement**: Share 30-day access with spouse
3. **Emergency**: Complete health history in one place
4. **Token withdrawal**: Proof of activities completed

**Files**:
- `apps/passport/models.py` - PassportEvent, PassportShare
- `apps/passport/views.py` - Sharing API
- `apps/passport/serializers.py`

---

## 🗄️ Database Models

### User & Children

```python
# User (extends AbstractBaseUser)
class User:
    id = UUIDField()  # Primary key
    email = EmailField(unique=True)
    first_name, last_name = CharField()
    phone_number = CharField()
    blood_type = CharField()  # A+, B+, O+, AB+, etc.
    onboarding_complete = BooleanField()
    token_balance = IntegerField()
    total_tokens_earned = IntegerField()
    wallet_address = CharField()  # Ethereum address
    private_key_encrypted = TextField()  # For blockchain

# Child
class Child:
    id = UUIDField()
    user = ForeignKey(User)
    name = CharField()
    nickname = CharField()
    status = CharField()  # pregnant, postpartum, baby
    due_date = DateField()
    birth_date = DateField()
    current_day = IntegerField()
    current_streak = IntegerField()
    longest_streak = IntegerField()
```

### Daily Program

```python
# DailyContent (curriculum)
class DailyContent:
    stage_type = CharField()  # pregnancy, postpartum, baby
    stage_week = IntegerField()
    day = IntegerField()  # 1-7
    title = CharField()
    lesson_title = CharField()
    lesson_content = TextField()
    task_title = CharField()
    task_description = TextField()
    task_tokens = IntegerField()
    tip_of_day = TextField()
    is_quiz_day = BooleanField()

# UserDayProgress
class UserDayProgress:
    child = ForeignKey(Child)
    daily_content = ForeignKey(DailyContent)
    lesson_completed = BooleanField()
    task_completed = BooleanField()
    checkin_completed = BooleanField()
    is_completed = BooleanField()
    tokens_earned = IntegerField()
    completed_at = DateTimeField()
```

### Health

```python
# DailyHealthLog
class DailyHealthLog:
    user = ForeignKey(User)
    child = ForeignKey(Child)
    log_date = DateField()
    mood = CharField()  # good, okay, bad
    weight = DecimalField()
    bp_systolic, bp_diastolic = IntegerField()
    baby_movement = CharField()
    blood_sugar = IntegerField()
    symptoms = JSONField()
    notes = TextField()
```

### Tokens

```python
# DonationPool (single record)
class DonationPool:
    pool_balance = DecimalField()  # ₦100,000
    total_tokens_issued = DecimalField()
    total_tokens_withdrawn = DecimalField()
    tokens_in_circulation = DecimalField()
    token_value_naira = DecimalField()

# Donation
class Donation:
    amount_naira = DecimalField()
    donor_name, donor_email, donor_phone = CharField()
    payment_reference = CharField()
    payment_method = CharField()  # alatpay, paystack
    status = CharField()  # pending, confirmed, failed
    confirmed_at = DateTimeField()

# TokenTransaction
class TokenTransaction:
    user = ForeignKey(User)
    transaction_type = CharField()  # earn, withdraw
    amount = DecimalField()
    balance_after = DecimalField()
    source = CharField()  # daily_task, daily_lesson, etc.
    reference_id = UUIDField()

# WithdrawalRequest
class WithdrawalRequest:
    user = ForeignKey(User)
    token_amount = DecimalField()
    naira_amount = DecimalField()
    bank_name, account_number, account_name = CharField()
    verification_photo = ImageField()
    status = CharField()  # pending, approved, rejected, completed
    reviewed_by = ForeignKey(User)
```

### AI

```python
# Conversation
class Conversation:
    user = ForeignKey(User)
    child = ForeignKey(Child)
    conversation_type = CharField()  # onboarding, general, health
    is_complete = BooleanField()

# Message
class Message:
    conversation = ForeignKey(Conversation)
    role = CharField()  # user, assistant
    content = TextField()
    audio_file = FileField()  # For voice messages
    metadata = JSONField()
```

### Passport

```python
# PassportEvent
class PassportEvent:
    child = ForeignKey(Child)
    event_type = CharField()  # task_completed, health_checkin, etc.
    title = CharField()
    description = TextField()
    stage_type = CharField()
    stage_week, stage_day = IntegerField()
    is_concern = BooleanField()
    severity = CharField()  # mild, moderate, severe
    event_date = DateField()
    data = JSONField()

# PassportShare
class PassportShare:
    child = ForeignKey(Child)
    share_code = CharField(unique=True)  # X7K9P2M1
    passcode = CharField()  # 123456
    recipient_name, recipient_type, recipient_email = CharField()
    is_active = BooleanField()
    expires_at = DateTimeField()
    view_count = IntegerField()
```

### Blockchain

```python
# Donation (Blockchain Record)
class BlockchainDonation:
    donor_email = CharField()
    amount_naira = DecimalField()
    paystack_reference = CharField()
    blockchain_tx_hash = CharField()
    blockchain_recorded = BooleanField()
    payment_status = CharField()
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register/           # Create account
POST   /api/auth/login/              # Get JWT tokens
POST   /api/auth/token/refresh/      # Refresh access token
GET    /api/auth/me/                 # Get current user
PATCH  /api/auth/me/                 # Update profile
```

### Children
```
GET    /api/children/                # List user's children
POST   /api/children/                # Add new child
GET    /api/children/{id}/           # Get child details
PATCH  /api/children/{id}/           # Update child
DELETE /api/children/{id}/           # Remove child
```

### Daily Program
```
GET    /api/daily/{child_id}/today/                          # Today's program
GET    /api/daily/{child_id}/progress/                       # Overall progress
GET    /api/daily/{child_id}/missed/                         # Missed days
POST   /api/daily/{child_id}/{progress_id}/complete-lesson/  # Complete lesson
POST   /api/daily/{child_id}/{progress_id}/complete-task/    # Complete task
POST   /api/daily/{child_id}/{progress_id}/checkin/          # Health check-in
GET    /api/daily/{child_id}/videos/                         # YouTube videos
POST   /api/daily/videos/{video_id}/complete/                # Complete video
```

### Health
```
GET    /api/health/{child_id}/logs/                # Health log history
POST   /api/health/{child_id}/logs/                # Create health log
GET    /api/health/{child_id}/logs/{id}/           # Get specific log
GET    /api/health/{child_id}/symptoms/            # Symptom trends
POST   /api/health/{child_id}/symptoms/report/     # Report symptom
```

### AI Assistant
```
POST   /api/ai/conversations/                      # Start conversation
GET    /api/ai/conversations/{id}/                 # Get conversation
POST   /api/ai/conversations/{id}/messages/        # Send message
POST   /api/ai/conversations/{id}/voice/           # Send voice message
POST   /api/ai/conversations/{id}/complete/        # Mark complete
```

### Tokens
```
GET    /api/tokens/pool/                           # Get pool info
GET    /api/tokens/balance/                        # Get user balance
GET    /api/tokens/transactions/                   # Transaction history
POST   /api/tokens/withdrawals/request/            # Request withdrawal
GET    /api/tokens/withdrawals/                    # User's withdrawals
```

### Donations
```
POST   /api/donations/                             # Create donation
GET    /api/donations/                             # List donations
POST   /api/donations/{id}/confirm/                # Confirm payment
GET    /api/donations/recent/                      # Recent donations
```

### Payments
```
POST   /api/payments/alatpay/initiate/             # Create virtual account
POST   /api/payments/alatpay/verify/               # Verify payment
POST   /api/payments/alatpay/webhook/              # ALATPay webhook
POST   /api/payments/paystack/initiate/            # Initiate card payment
POST   /api/payments/paystack/verify/              # Verify card payment
POST   /api/payments/paystack/webhook/             # Paystack webhook
```

### Blockchain
```
POST   /api/blockchain/generate-wallet/            # Generate wallet
POST   /api/blockchain/mint/                       # Mint tokens
GET    /api/blockchain/balance/{address}/          # Get balance
GET    /api/blockchain/transactions/{address}/     # Get transactions
POST   /api/blockchain/donations/record/           # Record donation
```

### Passport
```
GET    /api/passport/{child_id}/                   # Get full passport
GET    /api/passport/{child_id}/events/            # Get events
POST   /api/passport/{child_id}/shares/            # Create share link
GET    /api/passport/{child_id}/shares/            # List shares
DELETE /api/passport/{child_id}/shares/{id}/       # Deactivate share
POST   /api/passport/shared/{code}/verify/         # Verify passcode
GET    /api/passport/shared/{code}/                # View shared passport
```

### SMS
```
POST   /sms/webhook/                               # Twilio/AT webhook
POST   /sms/test/                                  # Send test SMS
GET    /sms/status/                                # Check SMS status
```

---

## 👤 User Flows

### 1. New User Onboarding

```
1. User visits website → Clicks "Sign Up"
2. Enters: Email, Password, First Name, Last Name, Phone
3. Account created → Redirected to Voice Onboarding
4. AI asks: "Are you currently pregnant or postpartum?"
5. User responds via voice or text
6. AI collects: Due date, health conditions, blood type, etc.
7. Onboarding marked complete
8. Redirected to "Add Your First Child"
9. Creates child profile with due date
10. Taken to dashboard with Today's Program
```

### 2. Daily Activity Flow

```
Morning:
1. User opens app → Sees "Today's Program"
2. Current stage: Pregnancy Week 24, Day 3
3. Three activities available:
   - Read lesson "Nutrition in Second Trimester" (10 tokens)
   - Complete task "Drink 8 glasses of water" (10 tokens)
   - Daily health check-in (5 tokens)

4. User clicks "Read Lesson"
   → Reads content
   → Clicks "Mark Complete"
   → Earns 10 tokens
   → PassportEvent created

5. User clicks "Complete Task"
   → Checks off task
   → Earns 10 tokens
   → PassportEvent created

6. User clicks "Health Check-in"
   → Fills form: mood, weight, symptoms
   → Earns 5 tokens
   → PassportEvent created

Total Earned: 25 tokens (₦250 value)
```

### 3. AI Health Question

```
1. User has headache → Opens AI chat
2. Types: "I have a bad headache, is this normal?"
3. AI receives context:
   - User is at Week 24 of pregnancy
   - No pre-existing conditions
   - Previous symptom: nausea (2 weeks ago)

4. AI responds:
   "Headaches during pregnancy are common, especially in
   the second trimester. They can be caused by:
   - Hormonal changes
   - Dehydration
   - Stress

   Try:
   - Drinking more water
   - Resting in a dark room
   - Gentle neck massage

   ⚠️ Seek immediate care if:
   - Headache is severe and sudden
   - Accompanied by vision changes
   - Accompanied by swelling"

5. User satisfied → Conversation ends
6. Earns 2 tokens for engagement
```

### 4. Token Withdrawal

```
1. User has 500 tokens (₦5,000 value)
2. Clicks "Withdraw Tokens"
3. Enters:
   - Bank name: GTBank
   - Account number: 0123456789
   - Account name: Jane Doe
   - Upload ID photo

4. Submits withdrawal request
5. Status: "Pending Review"

6. Admin reviews:
   - Checks ID matches user name
   - Verifies account details
   - Approves request

7. 500 tokens deducted from user
8. Pool balance reduced by ₦5,000
9. Admin makes bank transfer
10. Marks withdrawal as "Completed"
11. User receives ₦5,000 in bank account
```

### 5. Donation Flow (Blockchain)

```
1. Donor visits donation page
2. Enters amount: ₦1,000
3. Chooses payment: Bank Transfer
4. Backend creates ALATPay virtual account:
   → Bank: Wema Bank
   → Account: 8880296260
   → Name: BLOOM-DON123
   → Expires: 24 hours

5. Donor makes transfer via USSD
6. ALATPay detects payment
7. Webhook notifies backend
8. Donation confirmed in database

9. AUTO: Blockchain recording:
   → Web3.py signs transaction
   → Records ₦1,000 on Sepolia
   → Transaction hash: 0xabc123...
   → Viewable on Etherscan

10. Pool balance: ₦100,000 → ₦101,000
11. Donor sees success message with blockchain proof
```

### 6. Life Passport Sharing

```
Mother's Side:
1. Opens passport page
2. Clicks "Share with Doctor"
3. Fills form:
   - Recipient: Dr. Smith
   - Type: Doctor
   - Email: doctor@hospital.com
   - Duration: 7 days

4. Share link created:
   → Code: X7K9P2M1
   → Passcode: 123456

5. Sends to doctor: "View my records at bloom.com/passport/X7K9P2M1, passcode: 123456"

Doctor's Side:
1. Visits link
2. Enters passcode: 123456
3. Access granted (no account needed)
4. Views:
   - Mother's blood type, health conditions
   - Child's due date, current stage
   - Complete timeline of activities
   - Health check-ins (30 completed)
   - Symptoms reported (nausea, fatigue)
   - Educational engagement (20 lessons)

5. Doctor prepared for appointment
6. Link auto-expires after 7 days
```

### 7. SMS Feature Phone Flow

```
User with Nokia 3310 (no smartphone):

1. Sends SMS: "BAL" to Bloom number
   ← Response: "Your balance: 150 BLOOM tokens (₦1,500)"

2. Sends SMS: "Q what food is good for baby"
   → Backend receives SMS
   → OpenAI processes question
   ← Response: "During pregnancy, eat foods rich in
      folic acid (spinach, oranges), iron (red meat,
      beans), and calcium (milk, yogurt). Avoid raw
      fish and unpasteurized cheese."

3. Sends SMS: "TIPS"
   ← Response: "Daily Tip: Drink at least 8 glasses
      of water daily to prevent dehydration and
      support your baby's development. Add lemon
      for taste!"

4. User gets health support WITHOUT smartphone
```

---

## 🔗 Integrations

### OpenAI Integration

**Purpose**: AI health assistant, voice transcription

**API Endpoints Used**:
```python
# Chat Completion
response = openai.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are a maternal health assistant..."},
        {"role": "user", "content": "I have morning sickness"}
    ]
)

# Voice Transcription
transcription = openai.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file
)
```

**Configuration**:
```bash
OPENAI_API_KEY=sk-proj-...
```

---

### Blockchain Integration (Web3.py)

**Purpose**: Record donations on Ethereum

**Setup**:
```python
from web3 import Web3

# Connect to Sepolia
w3 = Web3(Web3.HTTPProvider('https://sepolia.infura.io/v3/...'))

# Load contract
contract_address = '0x4AfD7A134Eb249E081799d3A94079de11932C37f'
contract = w3.eth.contract(address=contract_address, abi=ABI)

# Record donation
tx = contract.functions.recordDeposit(
    amount_wei,
    donor_email,
    reference
).build_transaction({
    'from': admin_address,
    'nonce': w3.eth.get_transaction_count(admin_address),
    'gas': 200000,
    'gasPrice': w3.eth.gas_price
})

# Sign and send
signed = w3.eth.account.sign_transaction(tx, private_key)
tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
```

**Configuration**:
```bash
INFURA_PROJECT_ID=...
CONTRACT_ADDRESS=0x4AfD7A134Eb249E081799d3A94079de11932C37f
ADMIN_PRIVATE_KEY=0x...
```

---

### ALATPay Integration

**Purpose**: Bank transfer donations via virtual accounts

**API Calls**:
```python
# Create Virtual Account
POST https://apibox.alatpay.ng/bank-transfer/api/v1/bankTransfer/virtualAccount
Headers:
  Content-Type: application/json
  Ocp-Apim-Subscription-Key: {SECRET_KEY}
Body:
{
  "businessId": "3e9c81bb-afea-4e8c-70eb-08de17643c55",
  "amount": 1000,
  "currency": "NGN",
  "orderId": "DON123",
  "customer": {
    "email": "donor@email.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}

# Verify Transaction
GET https://apibox.alatpay.ng/bank-transfer/api/v1/bankTransfer/transactions/{transactionId}
```

**Webhook**:
```python
@api_view(['POST'])
@csrf_exempt
def alatpay_webhook(request):
    # Verify payment
    # Confirm donation
    # Trigger blockchain recording
```

---

### Twilio Integration

**Purpose**: SMS support for feature phones

**API Calls**:
```python
from twilio.rest import Client

client = Client(account_sid, auth_token)

# Send SMS
message = client.messages.create(
    body="Your balance: 150 BLOOM tokens (₦1,500)",
    from_='+1234567890',
    to='+2348012345678'
)

# Receive SMS (webhook)
@api_view(['POST'])
@csrf_exempt
def twilio_webhook(request):
    from_number = request.POST.get('From')
    message_body = request.POST.get('Body')
    # Process command
    # Send response
```

**Configuration**:
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 📁 File Structure

```
bloom/
├── backend/
│   ├── mamalert/                 # Django project
│   │   ├── settings.py           # Configuration
│   │   ├── urls.py               # URL routing
│   │   └── wsgi.py
│   │
│   ├── apps/
│   │   ├── users/                # Authentication
│   │   │   ├── models.py         # User model
│   │   │   ├── views.py          # Auth endpoints
│   │   │   ├── serializers.py
│   │   │   └── services.py
│   │   │
│   │   ├── children/             # Child management
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   └── serializers.py
│   │   │
│   │   ├── daily_program/        # Learning system
│   │   │   ├── models.py         # DailyContent, Progress
│   │   │   ├── views.py          # Daily endpoints
│   │   │   ├── services.py       # Business logic
│   │   │   └── management/
│   │   │       └── commands/
│   │   │           └── seed_content.py
│   │   │
│   │   ├── health/               # Health tracking
│   │   │   ├── models.py         # HealthLog, Symptoms
│   │   │   ├── views.py
│   │   │   └── services.py
│   │   │
│   │   ├── ai/                   # AI assistant
│   │   │   ├── models.py         # Conversation, Message
│   │   │   ├── views.py          # Chat endpoints
│   │   │   └── services.py       # OpenAI integration
│   │   │
│   │   ├── tokens/               # Reward system
│   │   │   ├── models.py         # Pool, Transaction, Withdrawal
│   │   │   ├── views.py
│   │   │   └── services.py       # Token economics
│   │   │
│   │   ├── payments/             # Payment processing
│   │   │   ├── services.py       # ALATPay, Paystack
│   │   │   └── views.py          # Payment endpoints
│   │   │
│   │   ├── passport/             # Life Passport
│   │   │   ├── models.py         # Event, Share
│   │   │   ├── views.py
│   │   │   └── serializers.py
│   │   │
│   │   ├── sms/                  # SMS feature
│   │   │   ├── services.py       # Twilio, Africa's Talking
│   │   │   ├── views.py          # Webhook
│   │   │   └── management/
│   │   │       └── commands/
│   │   │           └── send_daily_tips.py
│   │   │
│   │   └── blockchain_api/       # Blockchain
│   │       ├── models.py
│   │       └── views.py
│   │
│   ├── blockchain.py             # Web3 service
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3
│   └── .env                      # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── VoiceOnboarding.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DailyProgram.jsx
│   │   │   ├── Donate.jsx
│   │   │   ├── Wallet.jsx
│   │   │   └── Passport.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── VoiceRecorder.jsx
│   │   │   ├── HealthCheckIn.jsx
│   │   │   └── TokenBalance.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── api/
│   │   │   ├── axios.js          # API client
│   │   │   └── endpoints.js
│   │   │
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── mamalert-blockchain/          # Smart contracts
    ├── contracts/
    │   └── BloomToken.sol        # ERC20 token
    ├── scripts/
    │   ├── deploy-local.js
    │   └── deploy-sepolia.js
    ├── test/
    │   └── BloomToken.test.js
    └── hardhat.config.js
```

---

## 🚀 Setup & Deployment

### Local Development Setup

**1. Backend Setup**:
```bash
# Clone repository
git clone https://github.com/ouujay/bloom.git
cd bloom/backend

# Install Python dependencies
pip3 install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Run migrations
python3 manage.py migrate

# Seed daily content
python3 manage.py seed_content

# Create superuser
python3 manage.py createsuperuser

# Start server
python3 manage.py runserver 8001
```

**2. Frontend Setup**:
```bash
cd ../frontend

# Install Node.js dependencies
nvm use 22
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8001/api" > .env.local

# Start dev server
npm run dev
```

**3. Blockchain Setup**:
```bash
cd ../mamalert-blockchain

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy-local.js --network localhost

# Deploy to Sepolia (testnet)
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

---

### Environment Variables

**Backend (.env)**:
```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://user:pass@localhost:5432/bloom

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Blockchain
INFURA_PROJECT_ID=...
CONTRACT_ADDRESS=0x4AfD7A134Eb249E081799d3A94079de11932C37f
ADMIN_PRIVATE_KEY=0x...

# ALATPay
ALATPAY_PUBLIC_KEY=c938a97bd1894567b562756d03c406e1
ALATPAY_SECRET_KEY=b17f536f5c7d4d2abcab3c11eb60b055
ALATPAY_BUSINESS_ID=3e9c81bb-afea-4e8c-70eb-08de17643c55
ALATPAY_BASE_URL=https://apibox.alatpay.ng

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Africa's Talking
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=...
```

**Frontend (.env.local)**:
```bash
VITE_API_URL=http://localhost:8001/api
```

---

### Production Deployment

**Backend (Django)**:
```bash
# Use Gunicorn
pip install gunicorn
gunicorn mamalert.wsgi:application --bind 0.0.0.0:8000

# Use PostgreSQL
DATABASE_URL=postgresql://user:pass@db-host:5432/bloom

# Collect static files
python manage.py collectstatic

# Set DEBUG=False
DEBUG=False
ALLOWED_HOSTS=bloom.com,www.bloom.com
```

**Frontend (React)**:
```bash
# Build for production
npm run build

# Serve with Nginx or deploy to Vercel/Netlify
```

**Blockchain**:
```bash
# Already deployed to Sepolia
# For mainnet, update hardhat.config.js and deploy
npx hardhat run scripts/deploy.js --network mainnet
```

---

### Testing

**Backend Tests**:
```bash
# Run all tests
python3 manage.py test

# Test specific app
python3 manage.py test apps.tokens

# Test with coverage
coverage run --source='.' manage.py test
coverage report
```

**Blockchain Tests**:
```bash
cd mamalert-blockchain
npx hardhat test
```

---

## 📊 Key Metrics & Analytics

### User Engagement
- Daily active users (DAU)
- Weekly active users (WAU)
- Retention rate (D1, D7, D30)
- Average tokens earned per user
- Average completion rate (lessons, tasks)

### Health Outcomes
- Health check-in completion rate
- Symptom reporting frequency
- AI chat engagement
- Passport sharing rate

### Financial Metrics
- Total donations received
- Pool balance
- Tokens in circulation
- Withdrawal request rate
- Average withdrawal amount

### Blockchain Metrics
- Total blockchain transactions
- Gas costs per transaction
- Transaction success rate
- Etherscan verification rate

---

## 🔐 Security Considerations

### Authentication
- JWT tokens (15-minute access, 7-day refresh)
- Password hashing (PBKDF2)
- CSRF protection on state-changing endpoints
- Rate limiting on sensitive endpoints

### Data Privacy
- User data encrypted at rest
- Private keys encrypted with user password
- Donor emails hashed on blockchain
- GDPR compliance (data export, deletion)

### Payment Security
- Webhook signature verification
- Double-entry accounting (donations)
- Admin approval for withdrawals
- Bank account verification

### Blockchain Security
- Admin private key stored in .env (not in code)
- Transaction signing server-side only
- Gas price checks to prevent excessive costs
- Contract verified on Etherscan

---

## 🎯 Roadmap & Future Features

### Phase 1 (Complete) ✅
- User authentication & onboarding
- Daily program system
- Token rewards
- Basic health tracking
- AI chat assistant
- Blockchain integration
- Payment processing
- Life Passport

### Phase 2 (In Progress)
- SMS feature for feature phones
- Voice onboarding improvements
- Multi-language support (Yoruba, Igbo, Hausa)
- Community features (forums, groups)
- Provider dashboard (for clinics)

### Phase 3 (Planned)
- Insurance integration
- Telemedicine consultations
- Medication reminders
- Vaccination tracking
- Baby growth tracking
- Postpartum depression screening
- Partner app (for fathers)

### Phase 4 (Future)
- Mainnet blockchain deployment
- International expansion
- Government partnerships
- Research data platform
- Predictive health analytics
- Wearable device integration

---

## 📞 Support & Documentation

### For Developers
- **API Docs**: See `API_CONTRACT.md`
- **Blockchain Guide**: See `BLOCKCHAIN_SETUP.md`
- **SMS Guide**: See `SMS_FEATURE_GUIDE.md`

### For Users
- **FAQ**: bloom.com/faq
- **Support**: support@bloom.com
- **WhatsApp**: +234...

### For Contributors
- **GitHub**: github.com/ouujay/bloom
- **Issues**: github.com/ouujay/bloom/issues
- **Contributing**: See `CONTRIBUTING.md`

---

## 📜 License & Credits

**License**: MIT

**Created by**: Bloom Health Team
**Blockchain Integration**: Claude Code
**Last Updated**: December 13, 2025

---

**End of Guide** 🌸

This document provides a complete overview of the Bloom platform. For specific implementation details, refer to the codebase and individual documentation files.
