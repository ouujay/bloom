import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Mic, MicOff, Volume2 } from 'lucide-react';
import VoiceRecorder from '../../components/voice/VoiceRecorder';
import AudioPlayer from '../../components/voice/AudioPlayer';
import aiApi from '../../api/ai';
import toast from 'react-hot-toast';

export default function Chat() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [error, setError] = useState(null);

  // Start conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        setIsLoading(true);
        const response = await aiApi.startConversation('chat', childId);

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
  }, [childId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRecordingComplete = useCallback(
    async (audioBlob) => {
      if (!conversationId || isProcessing) return;

      setIsProcessing(true);
      setError(null);

      try {
        const response = await aiApi.sendMessage(conversationId, null, audioBlob);

        if (response.success) {
          const { user_message, assistant_message } = response.data;
          // Safely extract content from messages
          const userContent = typeof user_message === 'object'
            ? user_message?.content || '[Voice message]'
            : user_message || '[Voice message]';
          const assistantContent = typeof assistant_message === 'object'
            ? assistant_message?.content || ''
            : assistant_message || '';

          setMessages((prev) => [
            ...prev,
            {
              role: 'user',
              content: userContent,
            },
            {
              role: 'assistant',
              content: assistantContent,
              audioUrl: assistant_message?.audio_url,
            },
          ]);

          if (assistant_message?.audio_url) {
            setCurrentAudio(assistant_message.audio_url);
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
    [conversationId, isProcessing]
  );

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || !conversationId || isProcessing) return;

    const userMessage = textInput.trim();
    setTextInput('');
    setIsProcessing(true);
    setError(null);

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
    ]);

    try {
      const response = await aiApi.sendMessage(conversationId, userMessage, null);

      if (response.success) {
        const { assistant_message } = response.data;
        // Safely extract content
        const assistantContent = typeof assistant_message === 'object'
          ? assistant_message?.content || ''
          : assistant_message || '';

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: assistantContent,
            audioUrl: assistant_message?.audio_url,
          },
        ]);

        if (assistant_message?.audio_url) {
          setCurrentAudio(assistant_message.audio_url);
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
  };

  const handleAudioEnded = () => {
    setCurrentAudio(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mic className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-dark-500">Starting conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-cream-200">
        <button
          onClick={() => navigate(`/child/${childId}`)}
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-dark-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-dark-900">Talk to Bloom</h1>
          <p className="text-sm text-dark-500">Ask questions or report symptoms</p>
        </div>
        <button
          onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}
          className={`p-2 rounded-lg transition-colors ${
            inputMode === 'voice' ? 'bg-primary-100 text-primary-600' : 'bg-cream-200 text-dark-600'
          }`}
        >
          {inputMode === 'voice' ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-white text-dark-800 rounded-bl-md shadow-sm border border-cream-200'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              {message.audioUrl && message.role === 'assistant' && (
                <button
                  onClick={() => setCurrentAudio(message.audioUrl)}
                  className="mt-2 flex items-center gap-1 text-xs text-bloom-600 hover:text-bloom-700"
                >
                  <Volume2 className="w-3 h-3" />
                  Play audio
                </button>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-cream-200">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Audio player */}
      {currentAudio && (
        <div className="pb-4">
          <AudioPlayer
            src={currentAudio}
            autoPlay={true}
            onEnded={handleAudioEnded}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="pb-4">
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 text-center">
            {error}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="pt-4 border-t border-cream-200">
        {inputMode === 'voice' ? (
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            isDisabled={isProcessing || !!currentAudio}
          />
        ) : (
          <form onSubmit={handleTextSubmit} className="flex gap-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-cream-300 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="pt-4">
          <p className="text-xs text-dark-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'What should I eat this week?',
              'I have a headache',
              'Is this symptom normal?',
              'When should I call my doctor?',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setTextInput(prompt)}
                className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-dark-600 text-sm rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
