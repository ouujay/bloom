from django.urls import path
from . import views

urlpatterns = [
    # Conversations
    path('conversation/start/', views.start_conversation, name='ai-start-conversation'),
    path('conversation/message/', views.send_message, name='ai-send-message'),
    path('conversation/<uuid:conversation_id>/', views.get_conversation, name='ai-get-conversation'),
    path('conversation/<uuid:conversation_id>/complete/', views.complete_conversation, name='ai-complete-conversation'),
    path('conversations/', views.list_conversations, name='ai-list-conversations'),

    # Utilities
    path('transcribe/', views.transcribe_audio, name='ai-transcribe'),
]
