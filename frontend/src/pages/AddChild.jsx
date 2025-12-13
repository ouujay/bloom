import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Mic, MicOff, Sparkles } from 'lucide-react';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useAudioRecorder from '../hooks/useAudioRecorder';
import aiApi from '../api/ai';
import childrenApi from '../api/children';

// Background image
const bgImage = 'https://i.pinimg.com/1200x/ac/93/ff/ac93ff8e889d79139d1049d1e5894e30.jpg';

export default function AddChild() {
  const navigate = useNavigate();

  // Refs to prevent race conditions
  const conversationIdRef = useRef(null);
  const initStartedRef = useRef(false);
  const messagesEndRef = useRef(null);

  // State
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [childData, setChildData] = useState(null);
  const [error, setError] = useState(null);
  const [textInput, setTextInput] = useState('');

  // Hooks
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start conversation on mount - only once
  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const initConversation = async () => {
      try {
        setIsLoading(true);
        const response = await aiApi.startConversation('add_child');

        if (response.success) {
          conversationIdRef.current = response.data.conversation_id;
          setMessages([{
            role: 'assistant',
            content: response.data.message,
          }]);

          if (response.data.audio_url) {
            speak(response.data.audio_url, {
              fallbackText: response.data.message,
            });
          }
        } else {
          setMessages([{
            role: 'assistant',
            content: "Hi! Are you adding a pregnancy or a baby that's already been born? Just let me know and I'll help you set everything up.",
          }]);
        }
      } catch (err) {
        console.error('Error starting conversation:', err);
        setMessages([{
          role: 'assistant',
          content: "Hi! Let's add your child. Are you currently pregnant, or has your baby already been born?",
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    initConversation();
  }, [speak]);

  // Handle voice recording - tap to start/stop
  const handleMicTap = async (e) => {
    e?.preventDefault?.();

    if (isRecording) {
      const audioBlob = await stopRecording();

      if (!audioBlob || !conversationIdRef.current) {
        setError('Recording too short. Please try again.');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const response = await aiApi.sendMessage(conversationIdRef.current, null, audioBlob);

        if (response.success) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'user',
              content: response.data.user_message?.content || '[Voice message]',
            },
            {
              role: 'assistant',
              content: response.data.assistant_message?.content || response.data.message,
            },
          ]);

          const audioUrl = response.data.assistant_message?.audio_url || response.data.audio_url;
          if (audioUrl) {
            speak(audioUrl, {
              fallbackText: response.data.assistant_message?.content || response.data.message,
            });
          }

          if (response.data.is_complete && response.data.parsed_data) {
            setIsComplete(true);
            setChildData(response.data.parsed_data);
          }
        } else {
          setError(response.message || 'Failed to process message');
        }
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (isSpeaking || isProcessing || !conversationIdRef.current) {
        return;
      }
      await startRecording();
    }
  };

  // Handle text submit
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing || isSpeaking) return;

    const userMessage = textInput.trim();
    setTextInput('');
    setIsProcessing(true);
    setError(null);

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      if (conversationIdRef.current) {
        const response = await aiApi.sendMessage(conversationIdRef.current, userMessage, null);

        if (response.success) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: response.data.assistant_message?.content || response.data.message,
            },
          ]);

          const audioUrl = response.data.assistant_message?.audio_url || response.data.audio_url;
          if (audioUrl) {
            speak(audioUrl, {
              fallbackText: response.data.assistant_message?.content || response.data.message,
            });
          }

          if (response.data.is_complete && response.data.parsed_data) {
            setIsComplete(true);
            setChildData(response.data.parsed_data);
          }
        }
      } else {
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('pregnant')) {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: "Great! How many weeks pregnant are you?",
          }]);
        } else if (lowerMessage.includes('born') || lowerMessage.includes('baby')) {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: "Wonderful! When was your baby born? And what's their name?",
          }]);
        } else if (lowerMessage.match(/\d+\s*weeks?/)) {
          const weeks = parseInt(lowerMessage.match(/(\d+)\s*weeks?/)[1]);
          setChildData({ status: 'pregnant', weeks_at_registration: weeks });
          setIsComplete(true);
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: `Perfect! I've recorded that you're ${weeks} weeks pregnant. Ready to continue?`,
          }]);
        }
      }
    } catch (err) {
      console.error('Error sending text:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send message. Please try again.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!childData) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (conversationIdRef.current) {
        await aiApi.completeConversation(conversationIdRef.current);
      }

      const response = await childrenApi.create(childData);

      if (response.success) {
        navigate(`/child/${response.data.id}`);
      } else {
        setError(response.message || 'Failed to create child');
      }
    } catch (err) {
      console.error('Error creating child:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    stopSpeaking();
    navigate('/children');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="Bloom" className="w-32 h-32 object-contain mx-auto mb-6 animate-pulse" />
          <p className="text-dark-600 text-lg font-medium">Starting Bloom...</p>
          <p className="text-dark-400 text-sm mt-2">Your AI companion is getting ready</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Background Image - Subtle */}
      <div className="fixed inset-0 z-0">
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover opacity-[0.03]"
        />
        <div className="absolute inset-0 bg-cream-100/70" />
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Back Button - Pill */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-dark-700 hover:bg-white hover:text-dark-900 px-5 py-2.5 rounded-full shadow-lg shadow-dark-900/5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Logo - Pill */}
            <Link to="/" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg shadow-dark-900/5">
              <img src="/logo.png" alt="Bloom" className="w-12 h-12 object-contain" />
              <span className="text-lg font-semibold text-dark-900">Bloom</span>
            </Link>

            {/* Spacer for balance */}
            <div className="w-24" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col pt-24 pb-8">
        {/* Header */}
        <div className="px-6 pb-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-bloom-100 text-bloom-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Setup
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-dark-900 mb-2">
              Add Your Child
            </h1>
            <p className="text-dark-500">
              Tell Bloom about your pregnancy or baby
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 px-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* Messages */}
            <div className="space-y-4 pb-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <img src="/logo.png" alt="Bloom" className="w-12 h-12 object-contain mr-3 flex-shrink-0" />
                  )}
                  <div
                    className={`max-w-[75%] rounded-3xl px-6 py-4 ${
                      message.role === 'user'
                        ? 'bg-primary-400 text-white shadow-lg shadow-primary-400/25'
                        : 'bg-white text-dark-800 shadow-lg shadow-dark-900/5'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isProcessing && !isComplete && (
                <div className="flex justify-start">
                  <img src="/logo.png" alt="Bloom" className="w-12 h-12 object-contain mr-3 flex-shrink-0" />
                  <div className="bg-white rounded-3xl px-6 py-4 shadow-lg shadow-dark-900/5">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 bg-bloom-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2.5 h-2.5 bg-bloom-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2.5 h-2.5 bg-bloom-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="px-6 pb-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-bloom-50 border border-bloom-200 text-bloom-700 text-sm rounded-full px-6 py-3 text-center flex items-center justify-center gap-3">
                <span className="flex gap-1">
                  <span className="w-1.5 h-4 bg-bloom-500 rounded-full animate-pulse" />
                  <span className="w-1.5 h-4 bg-bloom-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-4 bg-bloom-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
                Bloom is speaking...
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-6 py-4 text-center">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-6 pt-4">
          <div className="max-w-3xl mx-auto">
            {isComplete && childData ? (
              /* Completion Card */
              <div className="bg-white rounded-3xl shadow-xl shadow-dark-900/10 p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-bloom-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-bloom-500" />
                  </div>
                  <h3 className="text-xl font-bold text-dark-900">Confirm Details</h3>
                  <p className="text-dark-500 text-sm mt-1">Review the information below</p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between py-3 px-4 bg-cream-50 rounded-2xl">
                    <span className="text-dark-500">Type</span>
                    <span className="font-semibold text-dark-900">
                      {childData.status === 'pregnant' ? 'Pregnancy' : 'Baby'}
                    </span>
                  </div>
                  {childData.name && (
                    <div className="flex items-center justify-between py-3 px-4 bg-cream-50 rounded-2xl">
                      <span className="text-dark-500">Name</span>
                      <span className="font-semibold text-dark-900">{childData.name}</span>
                    </div>
                  )}
                  {childData.due_date && (
                    <div className="flex items-center justify-between py-3 px-4 bg-cream-50 rounded-2xl">
                      <span className="text-dark-500">Due Date</span>
                      <span className="font-semibold text-dark-900">
                        {new Date(childData.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {childData.birth_date && (
                    <div className="flex items-center justify-between py-3 px-4 bg-cream-50 rounded-2xl">
                      <span className="text-dark-500">Birth Date</span>
                      <span className="font-semibold text-dark-900">
                        {new Date(childData.birth_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {childData.weeks_at_registration && (
                    <div className="flex items-center justify-between py-3 px-4 bg-cream-50 rounded-2xl">
                      <span className="text-dark-500">Weeks Pregnant</span>
                      <span className="font-semibold text-dark-900">
                        {childData.weeks_at_registration} weeks
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="w-full py-4 bg-bloom-500 hover:bg-bloom-600 text-white rounded-full font-semibold shadow-lg shadow-bloom-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Saving...' : 'Confirm & Continue'}
                </button>
              </div>
            ) : (
              /* Input Card */
              <div className="bg-white rounded-3xl shadow-xl shadow-dark-900/10 p-6">
                {/* Text Input */}
                <form onSubmit={handleTextSubmit} className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 bg-cream-50 border-0 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-bloom-400 text-dark-800 placeholder-dark-400"
                    disabled={isProcessing || isSpeaking}
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isProcessing || isSpeaking}
                    className="w-14 h-14 bg-primary-400 hover:bg-primary-500 text-white rounded-full shadow-lg shadow-primary-400/25 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-cream-200" />
                  <span className="text-dark-400 text-sm">or use voice</span>
                  <div className="flex-1 h-px bg-cream-200" />
                </div>

                {/* Voice Button */}
                <div className="text-center">
                  <button
                    onClick={handleMicTap}
                    disabled={isProcessing || isSpeaking}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 mx-auto ${
                      isProcessing || isSpeaking
                        ? 'bg-cream-200 cursor-not-allowed'
                        : isRecording
                        ? 'bg-red-500 scale-110 shadow-xl shadow-red-500/30'
                        : 'bg-bloom-500 hover:bg-bloom-600 shadow-xl shadow-bloom-500/30 hover:scale-105'
                    }`}
                  >
                    {isRecording && (
                      <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />
                    )}
                    {isRecording ? (
                      <MicOff className="w-10 h-10 text-white relative z-10" />
                    ) : (
                      <Mic className={`w-10 h-10 relative z-10 ${isProcessing || isSpeaking ? 'text-dark-400' : 'text-white'}`} />
                    )}
                  </button>
                  <p className={`text-sm mt-4 font-medium ${isRecording ? 'text-red-500' : 'text-dark-500'}`}>
                    {isRecording
                      ? 'Tap to send'
                      : isSpeaking
                      ? 'Listening to Bloom...'
                      : isProcessing
                      ? 'Processing...'
                      : 'Tap to speak'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
