import api from './axios';

export const paymentsAPI = {
  // Initiate a payment (creates donation and gets bank transfer details)
  initiatePayment: (data) =>
    api.post('/payments/initiate/', data),

  // Check payment status by reference
  checkStatus: (reference) =>
    api.get(`/payments/status/${reference}/`),

  // Manual confirm - triggers status check
  manualConfirm: (reference) =>
    api.post('/payments/confirm/', { reference }),

  // Poll for payment confirmation (with timeout)
  pollForConfirmation: async (reference, options = {}) => {
    const {
      maxDuration = 20000, // 20 seconds default
      interval = 2000,     // Check every 2 seconds
      onPoll = () => {},   // Callback for each poll attempt
    } = options;

    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < maxDuration) {
      attempts++;
      onPoll({ attempts, elapsed: Date.now() - startTime });

      try {
        const response = await api.post('/payments/confirm/', { reference });
        const data = response.data?.data;

        if (data?.is_paid) {
          return {
            success: true,
            confirmed: true,
            data,
          };
        }
      } catch (error) {
        console.error('Poll error:', error);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // Timeout reached
    return {
      success: true,
      confirmed: false,
      timeout: true,
    };
  },
};
