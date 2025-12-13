import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VoiceRecorder from '../components/voice/VoiceRecorder';
import AudioPlayer from '../components/voice/AudioPlayer';
import aiApi from '../api/ai';

export default function VoiceOnboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);

  // Start conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        setIsLoading(true);
        const response = await aiApi.startConversation('onboarding');

        if (response.success) {
          setConversationId(response.data.conversation_id);
          // Handle message being either a string or an object with content
          const messageContent = typeof response.data.message === 'object'
            ? response.data.message?.content || ''
            : response.data.message || '';
          setMessages([
            {
              role: 'assistant',
              content: messageContent,
              audioUrl: response.data.audio_url,
            },
          ]);
          if (response.data.audio_url) {
            setCurrentAudio(response.data.audio_url);
          }
        } else {
          setError('Failed to start conversation');
        }
      } catch (err) {
        console.error('Error starting conversation:', err);
        setError('Failed to connect to AI service');
      } finally {
        setIsLoading(false);
      }
    };

    initConversation();
  }, []);

  const handleRecordingComplete = useCallback(
    async (audioBlob) => {
      if (!conversationId || isProcessing) return;

      setIsProcessing(true);
      setError(null);

      try {
        const response = await aiApi.sendMessage(conversationId, null, audioBlob);

        if (response.success) {
          // Safely extract content from messages (API returns objects with {id, content, transcribed})
          const userContent = typeof response.data.user_message === 'object'
            ? response.data.user_message?.content || '[Voice message]'
            : response.data.user_message || '[Voice message]';
          const assistantContent = typeof response.data.assistant_message === 'object'
            ? response.data.assistant_message?.content || ''
            : typeof response.data.message === 'object'
              ? response.data.message?.content || ''
              : response.data.message || '';
          const audioUrl = response.data.assistant_message?.audio_url || response.data.audio_url;

          // Add user message (transcribed)
          setMessages((prev) => [
            ...prev,
            {
              role: 'user',
              content: userContent,
            },
            {
              role: 'assistant',
              content: assistantContent,
              audioUrl: audioUrl,
            },
          ]);

          if (audioUrl) {
            setCurrentAudio(audioUrl);
          }

          // Check if onboarding is complete
          if (response.data.is_complete) {
            setIsComplete(true);
            // Complete the conversation
            await aiApi.completeConversation(conversationId);
            // Refresh user data to get onboarding_complete status
            await refreshUser();
          }
        } else {
          setError(response.message || 'Failed to process message');
        }
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
      } finally {
        setIsProcessing(false);
      }
    },
    [conversationId, isProcessing, refreshUser]
  );

  const handleContinue = () => {
    // Navigate to children page to add first child
    navigate('/children/add');
  };

  const handleAudioEnded = () => {
    setCurrentAudio(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className="text-gray-500">Starting Bloom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="text-gray-500 mt-1">
          Let's get to know you better
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 px-6 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4 pb-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audio player */}
      {currentAudio && (
        <div className="px-6 pb-4">
          <div className="max-w-md mx-auto">
            <AudioPlayer
              src={currentAudio}
              autoPlay={true}
              onEnded={handleAudioEnded}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-6 pb-4">
          <div className="max-w-md mx-auto bg-red-50 text-red-600 text-sm rounded-lg p-3 text-center">
            {error}
          </div>
        </div>
      )}

      {/* Voice recorder / Continue button */}
      <div className="px-6 pb-12 pt-4 bg-cream-100">
        <div className="max-w-md mx-auto">
          {isComplete ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-bloom/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-bloom" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-600">Great! Your profile is set up.</p>
              </div>
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Add Your First Child
              </button>
            </div>
          ) : (
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              isDisabled={isProcessing || !!currentAudio}
            />
          )}
        </div>
      </div>
    </div>
  );
}
