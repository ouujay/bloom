import os
import re
import tempfile
import base64
import logging
from datetime import datetime, timedelta, date
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    ConversationCreateSerializer,
)
from .services import (
    AIService,
    get_system_prompt,
    get_data_schema,
    SYSTEM_PROMPTS,
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_conversation(request):
    """
    Start a new AI conversation.

    POST /api/ai/conversation/start/
    Body: { "conversation_type": "onboarding|add_child|chat|birth", "child_id": "uuid" (optional) }
    """
    serializer = ConversationCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    conversation_type = serializer.validated_data['conversation_type']
    child_id = serializer.validated_data.get('child_id')

    # Get child if provided
    child = None
    if child_id:
        from apps.children.models import Child
        child = get_object_or_404(Child, id=child_id, user=request.user)

    # Create conversation
    conversation = Conversation.objects.create(
        user=request.user,
        child=child,
        conversation_type=conversation_type,
    )

    # Generate initial greeting
    try:
        ai_service = AIService()

        # Build context for prompt
        context = {
            'mother_name': request.user.first_name or 'there',
        }

        if child:
            stage = child.get_current_stage()
            context.update({
                'child_name': child.name or child.nickname or 'Baby',
                'stage_description': f"Week {stage.get('week', 1)}" if stage['type'] == 'pregnancy' else f"{stage.get('age_months', 0)} months old",
                'expected_symptoms': ', '.join(child.get_expected_symptoms() if hasattr(child, 'get_expected_symptoms') else []),
                'recent_notes': '',
                'week': stage.get('week', 1) if stage['type'] == 'pregnancy' else stage.get('age_months', 0),
            })

        system_prompt = get_system_prompt(conversation_type, context)

        # Generate greeting
        greeting = ai_service.generate_response(
            messages=[],
            system_prompt=system_prompt,
            temperature=0.8,
            max_tokens=200
        )

        # Generate audio for greeting
        audio_bytes = ai_service.text_to_speech(greeting)

        # Save audio to file
        audio_filename = f"audio/conversations/{conversation.id}/greeting.mp3"
        audio_path = default_storage.save(audio_filename, ContentFile(audio_bytes))
        audio_url = default_storage.url(audio_path) if hasattr(default_storage, 'url') else f"/media/{audio_path}"

        # Save assistant message
        Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=greeting,
            audio_output_url=audio_url,
            parsed_data={},
        )

        return Response({
            'success': True,
            'data': {
                'conversation_id': str(conversation.id),
                'message': greeting,
                'audio_url': audio_url,
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"AI service error in start_conversation: {type(e).__name__}: {e}", exc_info=True)
        print(f"AI ERROR: {type(e).__name__}: {e}")  # Also print for immediate visibility

        # If AI fails, still return conversation but without audio
        return Response({
            'success': True,
            'data': {
                'conversation_id': str(conversation.id),
                'message': f"Hi {request.user.first_name}! I'm Bloom, your pregnancy companion. How are you feeling today?",
                'audio_url': None,
                'error': str(e)
            }
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def send_message(request):
    """
    Send a message in a conversation.
    Supports both text and audio input.

    POST /api/ai/conversation/message/
    Body (form-data): { "conversation_id": "uuid", "audio": file } OR
    Body (json): { "conversation_id": "uuid", "message": "text" }
    """
    conversation_id = request.data.get('conversation_id')
    # Support both 'text' and 'message' parameter names
    text_message = request.data.get('text') or request.data.get('message', '')
    audio_file = request.FILES.get('audio')

    logger.info(f"send_message: conversation_id={conversation_id}, text={text_message[:50] if text_message else None}, audio={audio_file.name if audio_file else None}")

    if not conversation_id:
        return Response({
            'success': False,
            'message': 'conversation_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get conversation
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
        user=request.user
    )

    if conversation.status == 'completed':
        return Response({
            'success': False,
            'message': 'This conversation has already been completed'
        }, status=status.HTTP_400_BAD_REQUEST)

    audio_input_url = None
    transcription_error = None

    try:
        ai_service = AIService()
    except Exception as e:
        # AI service not available - will use fallback responses
        ai_service = None

    # If audio provided, try to transcribe it
    if audio_file:
        try:
            # Save audio file first
            audio_filename = f"audio/conversations/{conversation.id}/{Message.objects.filter(conversation=conversation).count()}_user.webm"
            audio_path = default_storage.save(audio_filename, audio_file)
            audio_input_url = default_storage.url(audio_path) if hasattr(default_storage, 'url') else f"/media/{audio_path}"

            # Reset file pointer for transcription
            audio_file.seek(0)

            if ai_service:
                text_message = ai_service.transcribe(audio_file)
            else:
                transcription_error = "Voice service temporarily unavailable. Please type your message."
        except Exception as e:
            transcription_error = f"Could not process audio: {str(e)}"

    if not text_message and not transcription_error:
        return Response({
            'success': False,
            'message': 'No message content provided'
        }, status=status.HTTP_400_BAD_REQUEST)

    # If transcription failed, return error but allow retry with text
    if transcription_error and not text_message:
        return Response({
            'success': False,
            'message': transcription_error,
            'use_text_mode': True
        }, status=status.HTTP_400_BAD_REQUEST)

    # Save user message
    user_message = Message.objects.create(
        conversation=conversation,
        role='user',
        content=text_message,
        audio_input_url=audio_input_url,
        parsed_data={},
    )

    # Build context
    context = {
        'mother_name': request.user.first_name or 'there',
    }

    if conversation.child:
        child = conversation.child
        stage = child.get_current_stage()
        context.update({
            'child_name': child.name or child.nickname or 'Baby',
            'stage_description': f"Week {stage.get('week', 1)}" if stage['type'] == 'pregnancy' else f"{stage.get('age_months', 0)} months old",
            'expected_symptoms': '',
            'recent_notes': '',
            'week': stage.get('week', 1) if stage['type'] == 'pregnancy' else stage.get('age_months', 0),
        })

    # Get conversation history
    history = conversation.get_messages_for_context(limit=10)

    # Generate response - use AI if available, otherwise fallback
    response_text = None
    audio_output_url = None
    is_complete = False
    parsed_data = {}

    if ai_service:
        try:
            system_prompt = get_system_prompt(conversation.conversation_type, context)

            response_text = ai_service.generate_response(
                messages=history,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=300
            )

            # Try to generate audio
            try:
                audio_bytes = ai_service.text_to_speech(response_text)
                audio_filename = f"audio/conversations/{conversation.id}/{Message.objects.filter(conversation=conversation).count()}_assistant.mp3"
                audio_path = default_storage.save(audio_filename, ContentFile(audio_bytes))
                audio_output_url = default_storage.url(audio_path) if hasattr(default_storage, 'url') else f"/media/{audio_path}"
            except Exception:
                # Audio generation failed, continue without audio
                pass

            # Try to extract structured data
            if conversation.conversation_type in ['onboarding', 'add_child', 'birth']:
                completion_signals = [
                    'confirmed', 'all set', 'saved', 'complete', 'got everything', 'information',
                    'thank you for sharing', 'sharing all that', 'profile is set', 'set up',
                    'here for you', 'amazing job', 'doing great', 'you\'re all set',
                    'if you need', 'that\'s all', 'recorded', 'noted'
                ]

                if any(signal in response_text.lower() for signal in completion_signals):
                    full_conversation = ' '.join([m['content'] for m in history])
                    schema = get_data_schema(conversation.conversation_type)

                    if schema:
                        try:
                            parsed_data = ai_service.parse_structured_data(
                                full_conversation,
                                schema,
                                f"Extract data from this {conversation.conversation_type} conversation"
                            )
                            if parsed_data and len([v for v in parsed_data.values() if v]) >= 2:
                                is_complete = True
                        except Exception:
                            pass
        except Exception as e:
            # AI generation failed, use fallback
            response_text = None

    # Fallback response if AI not available or failed
    if not response_text:
        response_text = _get_fallback_response(conversation.conversation_type, text_message, context)
        # Try to parse from user message for add_child
        parsed_data = _parse_simple_data(conversation.conversation_type, text_message)
        if parsed_data:
            is_complete = True

    # Save assistant message
    assistant_message = Message.objects.create(
        conversation=conversation,
        role='assistant',
        content=response_text,
        audio_output_url=audio_output_url,
        parsed_data=parsed_data or {},
    )

    # Don't mark conversation as complete here - let user confirm first
    # Just store the parsed data in the message for retrieval later
    # conversation.mark_complete(parsed_data) is called via completeConversation endpoint

    return Response({
        'success': True,
        'data': {
            'user_message': {
                'id': str(user_message.id),
                'content': text_message,
                'transcribed': bool(audio_file),
            },
            'assistant_message': {
                'id': str(assistant_message.id),
                'content': response_text,
                'audio_url': audio_output_url,
            },
            'is_complete': is_complete,
            'parsed_data': parsed_data if is_complete else None,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_conversation(request, conversation_id):
    """
    Manually complete a conversation and extract data.

    POST /api/ai/conversation/{id}/complete/
    """
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
        user=request.user
    )

    if conversation.status == 'completed':
        return Response({
            'success': True,
            'message': 'Conversation already completed',
            'data': ConversationSerializer(conversation).data
        })

    try:
        ai_service = AIService()

        # Get full conversation
        history = conversation.get_messages_for_context(limit=50)
        full_conversation = ' '.join([m['content'] for m in history])

        # Parse data
        schema = get_data_schema(conversation.conversation_type)
        parsed_data = {}

        if schema:
            parsed_data = ai_service.parse_structured_data(
                full_conversation,
                schema,
                f"Extract data from this {conversation.conversation_type} conversation"
            )

        conversation.mark_complete(parsed_data)

        # Update user profile for onboarding conversations
        if conversation.conversation_type == 'onboarding':
            user = request.user

            # Update user fields from parsed data
            if parsed_data.get('blood_type'):
                user.blood_type = parsed_data['blood_type']
            if parsed_data.get('genotype'):
                user.genotype = parsed_data['genotype']
            if parsed_data.get('location'):
                user.location = parsed_data['location']
            if parsed_data.get('health_conditions'):
                user.health_conditions = parsed_data['health_conditions']
            if parsed_data.get('date_of_birth'):
                try:
                    user.date_of_birth = parsed_data['date_of_birth']
                except Exception:
                    pass  # Date format issue

            # Mark onboarding complete
            user.onboarding_complete = True
            user.save()

            # Create emergency contact if provided
            if parsed_data.get('emergency_contact_name') and parsed_data.get('emergency_contact_phone'):
                from apps.users.models import EmergencyContact
                EmergencyContact.objects.get_or_create(
                    user=user,
                    name=parsed_data['emergency_contact_name'],
                    defaults={
                        'phone': parsed_data['emergency_contact_phone'],
                        'relationship': parsed_data.get('emergency_contact_relationship', ''),
                        'is_primary': True
                    }
                )

            # Award onboarding tokens
            try:
                from apps.tokens.services import TokenService
                TokenService.award_tokens(
                    user=user,
                    amount=50,
                    source='onboarding',
                    description='Completed health profile via voice'
                )
            except Exception:
                pass  # Don't fail if token service is unavailable

        return Response({
            'success': True,
            'message': 'Conversation completed',
            'data': {
                'conversation': ConversationSerializer(conversation).data,
                'parsed_data': parsed_data,
            }
        })

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Failed to complete conversation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation(request, conversation_id):
    """
    Get a conversation with all messages.

    GET /api/ai/conversation/{id}/
    """
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
        user=request.user
    )

    return Response({
        'success': True,
        'data': ConversationSerializer(conversation).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    """
    List user's conversations.

    GET /api/ai/conversations/
    Query params: type, status, child_id
    """
    queryset = Conversation.objects.filter(user=request.user)

    # Filters
    conv_type = request.query_params.get('type')
    conv_status = request.query_params.get('status')
    child_id = request.query_params.get('child_id')

    if conv_type:
        queryset = queryset.filter(conversation_type=conv_type)
    if conv_status:
        queryset = queryset.filter(status=conv_status)
    if child_id:
        queryset = queryset.filter(child_id=child_id)

    # Limit to recent
    queryset = queryset[:20]

    serializer = ConversationSerializer(queryset, many=True)

    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def transcribe_audio(request):
    """
    Transcribe audio to text (standalone endpoint).

    POST /api/ai/transcribe/
    Body (form-data): { "audio": file }
    """
    audio_file = request.FILES.get('audio')

    if not audio_file:
        return Response({
            'success': False,
            'message': 'No audio file provided'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        ai_service = AIService()
        text = ai_service.transcribe(audio_file)

        return Response({
            'success': True,
            'data': {
                'text': text
            }
        })

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Transcription failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Helper functions for fallback responses when AI is not available

def _get_fallback_response(conversation_type, user_message, context):
    """Generate a simple fallback response when AI is not available."""
    mother_name = context.get('mother_name', 'there')
    message_lower = user_message.lower()

    if conversation_type == 'add_child':
        # Check what info user provided
        if 'pregnant' in message_lower:
            return f"Great! How many weeks along are you?"
        elif 'born' in message_lower or 'baby' in message_lower:
            return "Congratulations! When was your baby born, and what's their name?"
        elif re.search(r'\d+\s*weeks?', message_lower):
            weeks_match = re.search(r'(\d+)\s*weeks?', message_lower)
            weeks = int(weeks_match.group(1))
            return f"You're {weeks} weeks along. That's wonderful! Would you like to add this pregnancy now?"
        elif re.search(r'yes|confirm|correct|save|add', message_lower):
            return "I've saved the information. You can view your dashboard now."
        else:
            return "I didn't quite catch that. Are you currently pregnant, or have you already given birth?"

    elif conversation_type == 'onboarding':
        if 'blood' in message_lower or any(bt in message_lower for bt in ['a+', 'a-', 'b+', 'b-', 'o+', 'o-', 'ab+']):
            return "Thanks! Do you have any health conditions I should know about? Like diabetes, hypertension, or anything else?"
        elif any(cond in message_lower for cond in ['diabetes', 'hypertension', 'asthma', 'none', 'no', 'healthy']):
            return "Got it. Finally, who should I contact in case of emergency? Please share their name and phone number."
        else:
            return f"Hi {mother_name}! I'm here to help you. What's your blood type?"

    elif conversation_type == 'chat':
        return f"I hear you, {mother_name}. I'm here to support you through your journey. Is there anything specific you'd like to know about?"

    return "I'm here to help. Could you tell me more?"


def _parse_simple_data(conversation_type, user_message):
    """Try to extract simple structured data from user message."""
    message_lower = user_message.lower()

    if conversation_type == 'add_child':
        # Check for pregnancy weeks
        weeks_match = re.search(r'(\d+)\s*weeks?', message_lower)
        if weeks_match and ('pregnant' in message_lower or 'along' in message_lower or weeks_match):
            weeks = int(weeks_match.group(1))
            # Calculate due date
            today = date.today()
            days_pregnant = weeks * 7
            conception_date = today - timedelta(days=days_pregnant)
            due_date = conception_date + timedelta(days=280)  # 40 weeks

            return {
                'status': 'pregnant',
                'weeks_at_registration': weeks,
                'due_date': due_date.isoformat(),
            }

        # Check for birth info
        if 'born' in message_lower:
            # Try to find a date
            date_patterns = [
                r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',  # DD/MM/YYYY or MM/DD/YYYY
                r'(\w+)\s+(\d{1,2}),?\s+(\d{4})',  # Month Day, Year
            ]
            for pattern in date_patterns:
                date_match = re.search(pattern, user_message)
                if date_match:
                    # Return basic structure, frontend can handle specifics
                    return {
                        'status': 'born',
                        'name': 'Baby',  # Will be updated
                    }

    return None
