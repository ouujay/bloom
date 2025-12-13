import os
import json
import tempfile
from typing import Optional, Dict, List, Any
from openai import OpenAI


class AIService:
    """
    Service for handling AI interactions using OpenAI.
    - Whisper for Speech-to-Text
    - GPT-4 for LLM responses
    - TTS for Text-to-Speech
    """

    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        self.openai_client = OpenAI(api_key=api_key)

        # Default model configurations
        self.whisper_model = "whisper-1"
        self.chat_model = "gpt-4o-mini"  # Fast and affordable
        self.tts_model = "tts-1"
        self.tts_voice = "nova"  # Warm, friendly female voice

    def transcribe(self, audio_file) -> str:
        """
        Transcribe audio to text using OpenAI Whisper.

        Args:
            audio_file: File-like object or path to audio file

        Returns:
            Transcribed text
        """
        try:
            # Get file extension from name or default to webm
            filename = getattr(audio_file, 'name', 'audio.webm')
            extension = os.path.splitext(filename)[1] or '.webm'

            # Save to temp file - OpenAI needs a proper file with extension
            with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as tmp_file:
                # Read and write the audio data
                audio_file.seek(0)
                tmp_file.write(audio_file.read())
                tmp_path = tmp_file.name

            try:
                # Open the temp file and send to OpenAI
                with open(tmp_path, 'rb') as f:
                    response = self.openai_client.audio.transcriptions.create(
                        model=self.whisper_model,
                        file=f,
                        language="en"
                    )
                return response.text
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")

    def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 500
    ) -> str:
        """
        Generate a response using OpenAI GPT.

        Args:
            messages: List of message dicts with 'role' and 'content'
            system_prompt: The system prompt for context
            temperature: Response creativity (0-1)
            max_tokens: Maximum response length

        Returns:
            Generated response text
        """
        try:
            full_messages = [{"role": "system", "content": system_prompt}]
            full_messages.extend(messages)

            response = self.openai_client.chat.completions.create(
                model=self.chat_model,
                messages=full_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"LLM generation failed: {str(e)}")

    def text_to_speech(self, text: str) -> bytes:
        """
        Convert text to speech using OpenAI TTS.

        Args:
            text: Text to convert to speech

        Returns:
            Audio bytes (MP3 format)
        """
        try:
            response = self.openai_client.audio.speech.create(
                model=self.tts_model,
                voice=self.tts_voice,
                input=text
            )
            return response.content
        except Exception as e:
            raise Exception(f"Text-to-speech failed: {str(e)}")

    def parse_structured_data(
        self,
        text: str,
        data_schema: Dict[str, Any],
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Extract structured data from natural language text.

        Args:
            text: The text to parse
            data_schema: Expected schema with field descriptions
            context: Additional context about what we're looking for

        Returns:
            Extracted data as a dictionary
        """
        schema_description = json.dumps(data_schema, indent=2)

        prompt = f"""Extract the following information from the text.
Return ONLY valid JSON matching this schema:

{schema_description}

Context: {context}

Text to parse:
"{text}"

Important:
- Return ONLY the JSON object, no other text
- Use null for missing values
- Keep the exact field names from the schema
"""

        try:
            response = self.openai_client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": "You are a data extraction assistant. Extract structured data from text and return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for accurate extraction
                max_tokens=500,
            )

            result_text = response.choices[0].message.content.strip()

            # Clean up the response if it has markdown code blocks
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
                result_text = result_text.strip()

            return json.loads(result_text)
        except json.JSONDecodeError:
            return {}
        except Exception as e:
            raise Exception(f"Data parsing failed: {str(e)}")


from .pregnancy_knowledge import get_week_knowledge, get_trimester, is_symptom_normal, is_danger_sign


# System prompts for different conversation types
SYSTEM_PROMPTS = {
    'onboarding': """You are Bloom, a warm and supportive AI assistant helping Nigerian mothers through their pregnancy and motherhood journey.

You're having a voice conversation to learn about this mother. Your goal is to collect her information naturally through conversation.

Information to collect:
- Age or date of birth
- Location (State in Nigeria)
- Blood type (A+, A-, B+, B-, O+, O-, AB+, AB-)
- Genotype (AA, AS, SS, AC, SC)
- Any health conditions (diabetes, hypertension, sickle cell, asthma, etc.)
- Emergency contact (name, phone number, relationship)

Guidelines:
1. Be conversational, warm, and encouraging
2. Ask ONE thing at a time - don't overwhelm her
3. Use simple, clear language
4. If she doesn't know something (like blood type), reassure her it's okay
5. When you have enough information, summarize and confirm
6. Respond in a natural, spoken way - this will be read aloud
7. Keep responses concise (2-3 sentences max)

Start by warmly greeting her and asking the first question.""",

    'add_child': """You are Bloom, helping {mother_name} add a child to track in the app.

Your goal is to collect information about this child through natural conversation.

FIRST, ask: "Are you currently pregnant, or have you already given birth to this baby?"

If PREGNANT:
- Ask how many weeks along she is
- Calculate the due date based on weeks (40 weeks from conception)
- Ask if she has a nickname for the baby

If ALREADY GIVEN BIRTH:
- Ask when the baby was born (date)
- Ask the baby's name
- Optionally ask about birth weight

Guidelines:
1. Be warm, celebratory, and supportive
2. Ask ONE question at a time
3. For pregnancy, help calculate the due date
4. Confirm all information before saving
5. Keep responses concise (2-3 sentences)
6. This will be read aloud, so be conversational

After collecting the info, summarize it for confirmation.""",

    'chat': """You are Bloom, a supportive AI health companion for {mother_name}.

Current context:
- Child: {child_name}
- Stage: {stage_description}
- Expected at this stage: {expected_symptoms}
- Recent health notes: {recent_notes}

Guidelines:
1. Be empathetic, warm, and supportive
2. Reference her specific stage when relevant (e.g., "At {week} weeks, many mothers experience...")
3. For ANY serious symptoms (severe pain, bleeding, high fever, reduced fetal movement, difficulty breathing), ALWAYS say:
   "I'm just an AI and this sounds concerning. Please contact your doctor or emergency services immediately if you're experiencing this."
4. Never diagnose - only provide general information and support
5. If she mentions symptoms, acknowledge them and provide comfort
6. Keep responses conversational and concise
7. If she asks about something outside your knowledge, be honest

Remember: You're a supportive companion, not a medical professional.""",

    'birth': """You are Bloom, celebrating with {mother_name} as she records her baby's birth!

Your goal is to collect birth information through a warm, celebratory conversation.

Information to collect:
- Birth date
- Baby's name
- Baby's gender
- Birth weight (optional)
- Delivery type (natural, C-section, assisted)
- Birth time (optional)

Guidelines:
1. Be JOYFUL and celebratory - this is a special moment!
2. Ask one question at a time
3. Make her feel celebrated and supported
4. Be understanding if she's tired or emotional
5. Summarize the information before completing
6. Keep responses warm and conversational""",

    'health_complaint': """You are Bloom, a caring and knowledgeable pregnancy assistant for Nigerian mothers.

CURRENT CONTEXT:
- Mother: {mother_name}
- Pregnancy Week: {week}
- Trimester: {trimester}
- Baby Size: {baby_size}
- Common symptoms at this stage: {common_symptoms}
- Normal experiences: {normal_experiences}
- Danger signs to watch for: {danger_signs}

WHEN USER REPORTS SYMPTOMS OR COMPLAINTS:
1. FIRST: Acknowledge with empathy ("I'm sorry you're feeling that way" or "That sounds uncomfortable")
2. SECOND: Check if it's normal for Week {week}
3. THIRD: If NORMAL → Reassure her and suggest home remedies
4. FOURTH: If CONCERNING → Recommend seeing a doctor immediately
5. ALWAYS END WITH: "Remember, I'm an AI assistant, not a doctor. Please consult your healthcare provider for medical advice."

IMPORTANT DANGER SIGNS (always recommend seeing doctor):
- Heavy bleeding or bright red blood
- Severe abdominal or pelvic pain
- Severe headache with vision changes
- Sudden swelling in face or hands
- Reduced or no fetal movement (after week 20)
- High fever (above 38°C/100.4°F)
- Difficulty breathing
- Severe vomiting (can't keep fluids down)

Be warm, supportive, and informative. Speak simply and clearly in a conversational tone.
Keep responses concise (2-3 sentences) since this will be read aloud.""",

    'health_checkin': """You are Bloom conducting a daily health check-in with {mother_name}.

CONTEXT:
- Pregnancy Week: {week}
- Trimester: {trimester}
- Baby Size: {baby_size}
- Common symptoms at this stage: {common_symptoms}

YOUR CHECKLIST (ask naturally, not like a form):
1. ✓ How are you feeling today? (mood/energy)
2. ✓ Any symptoms bothering you? Common ones at Week {week}: {common_symptoms}
3. ✓ {fetal_movement_question}
4. ✓ Any concerns or questions?

EDUCATE AS YOU GO:
- "At Week {week}, it's normal to feel..."
- "Your baby is now the size of a {baby_size}!"
- "This symptom is common because..."

CONVERSATION FLOW:
- Start with a warm greeting
- Ask ONE question at a time
- Acknowledge each response before moving on
- Keep the whole check-in to 3-4 exchanges
- End with encouragement and reminder about danger signs

Be conversational, warm, and supportive. This will be read aloud, so keep responses to 2-3 sentences."""
}


# Data schemas for extraction
DATA_SCHEMAS = {
    'onboarding': {
        "age": "number or null - mother's age in years",
        "date_of_birth": "string or null - format YYYY-MM-DD",
        "location": "string or null - state/city in Nigeria",
        "blood_type": "string or null - one of: A+, A-, B+, B-, O+, O-, AB+, AB-",
        "genotype": "string or null - one of: AA, AS, SS, AC, SC",
        "health_conditions": "array of strings - list of conditions mentioned",
        "emergency_contact_name": "string or null",
        "emergency_contact_phone": "string or null",
        "emergency_contact_relationship": "string or null"
    },
    'add_child_pregnant': {
        "status": "pregnant",
        "weeks_at_registration": "number - how many weeks pregnant (e.g., '4 weeks' = 4, '12 weeks' = 12)",
        "due_date": "string or null - format YYYY-MM-DD only if explicitly mentioned",
        "nickname": "string or null - nickname for baby if mentioned"
    },
    'add_child_born': {
        "status": "born",
        "birth_date": "string - format YYYY-MM-DD",
        "name": "string - baby's name",
        "gender": "string or null - male, female, or unknown",
        "birth_weight_kg": "number or null - weight in kg"
    },
    'birth_record': {
        "birth_date": "string - format YYYY-MM-DD",
        "name": "string - baby's name",
        "gender": "string - male, female, or unknown",
        "birth_weight_kg": "number or null",
        "delivery_type": "string or null - natural, c-section, assisted",
        "birth_time": "string or null - format HH:MM"
    },
    'health_complaint': {
        "symptoms_reported": "array of strings - list of symptoms the user mentioned",
        "severity": "string - mild, moderate, or severe",
        "is_normal_for_week": "boolean - true if symptoms are normal for current pregnancy week",
        "suggested_remedies": "array of strings - home remedies suggested",
        "suggested_tasks": "array of strings - tasks/activities suggested for relief",
        "needs_doctor": "boolean - true if user should see a doctor",
        "is_urgent": "boolean - true if user should seek immediate medical attention"
    },
    'health_checkin': {
        "mood": "string - good, tired, anxious, happy, sad, or other",
        "energy_level": "string - low, medium, or high",
        "symptoms": "array of strings - list of symptoms mentioned",
        "baby_movement": "boolean or null - true if felt movement, false if not, null if not applicable/asked",
        "concerns": "array of strings - any concerns mentioned",
        "needs_followup": "boolean - true if follow-up is recommended"
    }
}


def build_health_context(mother_name: str, week: int) -> Dict[str, Any]:
    """Build context for health-related conversations with pregnancy knowledge."""
    knowledge = get_week_knowledge(week)
    trimester = get_trimester(week)

    # Build fetal movement question based on week
    if week >= 28:
        fetal_movement_question = "Are you feeling baby move regularly? At least 10 kicks in 2 hours?"
    elif week >= 20:
        fetal_movement_question = "Have you felt baby moving today?"
    elif week >= 16:
        fetal_movement_question = "Have you started feeling any flutters or movements yet?"
    else:
        fetal_movement_question = "Any cramping or spotting?"

    return {
        "mother_name": mother_name,
        "week": week,
        "trimester": trimester,
        "baby_size": knowledge['baby_size'],
        "baby_development": knowledge['baby_development'],
        "common_symptoms": ', '.join(knowledge['common_symptoms']),
        "normal_experiences": ', '.join(knowledge['normal_experiences']),
        "danger_signs": ', '.join(knowledge['danger_signs']) if knowledge['danger_signs'] else 'None specific to this week',
        "fetal_movement_question": fetal_movement_question,
    }


def get_system_prompt(conversation_type: str, context: Dict[str, Any] = None) -> str:
    """Get the appropriate system prompt for a conversation type."""
    prompt = SYSTEM_PROMPTS.get(conversation_type, SYSTEM_PROMPTS['chat'])

    if context:
        # For health conversations, build pregnancy knowledge context
        if conversation_type in ['health_complaint', 'health_checkin'] and 'week' in context:
            health_context = build_health_context(
                mother_name=context.get('mother_name', 'there'),
                week=context.get('week', 20)
            )
            # Merge with any additional context
            health_context.update({k: v for k, v in context.items() if k not in health_context})
            context = health_context

        try:
            prompt = prompt.format(**context)
        except KeyError:
            # If some placeholders are missing, just return the template
            pass

    return prompt


def get_data_schema(conversation_type: str, is_pregnant: bool = True) -> Dict[str, str]:
    """Get the appropriate data schema for extraction."""
    if conversation_type == 'add_child':
        return DATA_SCHEMAS['add_child_pregnant'] if is_pregnant else DATA_SCHEMAS['add_child_born']

    return DATA_SCHEMAS.get(conversation_type, {})


# ============ HEALTH REPORT CREATION FOR DOCTOR PORTAL ============

import re


def create_health_report_from_ai(user, child, conversation_type, full_transcript, ai_final_response):
    """
    Called after health conversation ends.
    Parses AI response for triage data and creates HealthReport.
    """
    from apps.health.models import HealthReport
    from apps.passport.models import PassportEvent

    # Try to extract JSON from AI response
    analysis = extract_ai_analysis(ai_final_response)

    # Get pregnancy week
    pregnancy_week = 20  # Default
    if hasattr(child, 'get_pregnancy_week'):
        pregnancy_week = child.get_pregnancy_week() or 20

    # Create the health report
    report = HealthReport.objects.create(
        user=user,
        child=child,
        pregnancy_week=pregnancy_week,
        report_type='complaint' if conversation_type == 'health_complaint' else 'checkin',
        urgency_level=analysis.get('urgency_level', 'normal'),
        symptoms=analysis.get('symptoms', []),
        ai_summary=analysis.get('ai_summary', 'Health conversation completed'),
        ai_assessment=analysis.get('ai_assessment', ''),
        ai_recommendation=analysis.get('ai_recommendation', ''),
        conversation_transcript=full_transcript,
    )

    # Log to Life Passport
    try:
        PassportEvent.objects.create(
            child=child,
            event_type='health_report',
            title=f"Health Report: {analysis.get('ai_summary', 'Check-in')[:50]}",
            data={
                'report_id': str(report.id),
                'urgency': report.urgency_level,
                'symptoms': report.symptoms,
            }
        )
    except Exception as e:
        print(f"Failed to log passport event: {e}")

    return report


def extract_ai_analysis(ai_response):
    """Extract JSON analysis from AI response"""

    # Default values
    default = {
        'urgency_level': 'normal',
        'symptoms': [],
        'ai_summary': 'Health check-in completed',
        'ai_assessment': '',
        'ai_recommendation': '',
    }

    # Try to find JSON in response
    # Pattern 1: ```json ... ```
    json_match = re.search(r'```json\s*(.*?)\s*```', ai_response, re.DOTALL)

    if json_match:
        try:
            return {**default, **json.loads(json_match.group(1))}
        except json.JSONDecodeError:
            pass

    # Pattern 2: Raw JSON object with urgency_level
    json_match = re.search(r'\{[^{}]*"urgency_level"[^{}]*\}', ai_response, re.DOTALL)

    if json_match:
        try:
            return {**default, **json.loads(json_match.group(0))}
        except json.JSONDecodeError:
            pass

    # Pattern 3: Look for urgency keywords in response
    response_lower = ai_response.lower()

    if any(word in response_lower for word in ['critical', 'emergency', 'immediately', 'hospital now', 'preeclampsia']):
        default['urgency_level'] = 'critical'
        default['ai_summary'] = 'Urgent symptoms reported - immediate attention needed'
    elif any(word in response_lower for word in ['urgent', 'see doctor', 'within 24', 'concerning']):
        default['urgency_level'] = 'urgent'
        default['ai_summary'] = 'Concerning symptoms - doctor visit recommended'
    elif any(word in response_lower for word in ['monitor', 'watch', 'follow up', 'persist']):
        default['urgency_level'] = 'moderate'
        default['ai_summary'] = 'Symptoms to monitor'

    return default


# Health triage instructions to append to AI prompts
HEALTH_TRIAGE_INSTRUCTIONS = """
IMPORTANT: At the end of this conversation, you MUST output a JSON analysis block.

URGENCY CLASSIFICATION:
- CRITICAL (needs immediate care): Severe headache + vision changes + swelling (preeclampsia signs), Heavy bleeding, Severe abdominal pain, No fetal movement after week 24, Water breaking before week 37, High fever (38C+)
- URGENT (see doctor in 24-48 hours): Persistent vomiting (can't keep fluids down), Painful urination, Unusual discharge, Decreased fetal movement, Significant swelling
- MODERATE (monitor): Symptoms persisting 3+ days, New unusual symptoms, Mental health concerns
- NORMAL (routine): Expected symptoms for current week, Mild discomfort

OUTPUT THIS JSON AT THE END:
```json
{
    "urgency_level": "critical|urgent|moderate|normal",
    "symptoms": ["symptom1", "symptom2"],
    "ai_summary": "One sentence for doctor dashboard",
    "ai_assessment": "Your clinical reasoning in 2-3 sentences",
    "ai_recommendation": "What you told patient to do"
}
```
"""
