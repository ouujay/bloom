import api from './axios';

export const aiApi = {
  /**
   * Start a new AI conversation
   * @param {string} conversationType - 'onboarding', 'add_child', 'chat', or 'birth'
   * @param {string} childId - Optional child ID for chat/birth conversations
   */
  startConversation: async (conversationType, childId = null) => {
    const data = { conversation_type: conversationType };
    if (childId) {
      data.child_id = childId;
    }
    const response = await api.post('/ai/conversation/start/', data);
    return response.data;
  },

  /**
   * Send a message in a conversation (text or audio)
   * @param {string} conversationId - The conversation UUID
   * @param {string} text - Optional text message
   * @param {Blob} audioBlob - Optional audio blob
   */
  sendMessage: async (conversationId, text = null, audioBlob = null) => {
    const formData = new FormData();
    formData.append('conversation_id', conversationId);

    if (text) {
      formData.append('text', text);
    }

    if (audioBlob) {
      // Determine file extension based on mime type
      const extension = audioBlob.type.includes('webm') ? 'webm' : 'm4a';
      formData.append('audio', audioBlob, `recording.${extension}`);
    }

    const response = await api.post('/ai/conversation/message/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Complete a conversation and finalize parsed data
   * @param {string} conversationId - The conversation UUID
   */
  completeConversation: async (conversationId) => {
    const response = await api.post(`/ai/conversation/${conversationId}/complete/`);
    return response.data;
  },

  /**
   * Transcribe audio to text only (without conversation)
   * @param {Blob} audioBlob - Audio blob to transcribe
   */
  transcribeAudio: async (audioBlob) => {
    const formData = new FormData();
    const extension = audioBlob.type.includes('webm') ? 'webm' : 'm4a';
    formData.append('audio', audioBlob, `recording.${extension}`);

    const response = await api.post('/ai/transcribe/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default aiApi;
