import api from './axios';

export const tokensAPI = {
  // ===== PUBLIC =====

  // Get pool info and token value
  getPoolInfo: () =>
    api.get('/tokens/pool/'),

  // Get recent confirmed donations
  getRecentDonations: () =>
    api.get('/tokens/donations/recent/'),

  // Create a new donation
  createDonation: (data) =>
    api.post('/tokens/donations/create/', data),

  // ===== USER =====

  // Get user's wallet info
  getWallet: () =>
    api.get('/tokens/wallet/'),

  // Get transaction history
  getTransactions: () =>
    api.get('/tokens/transactions/'),

  // Request withdrawal
  requestWithdrawal: (data) =>
    api.post('/tokens/withdraw/', data),

  // Get user's withdrawal history
  getWithdrawals: () =>
    api.get('/tokens/withdrawals/'),

  // ===== ADMIN =====

  // Get pending donations
  getPendingDonations: () =>
    api.get('/tokens/admin/donations/pending/'),

  // Confirm a donation
  confirmDonation: (donationId) =>
    api.post(`/tokens/admin/donations/${donationId}/confirm/`),

  // Get pending withdrawals
  getPendingWithdrawals: () =>
    api.get('/tokens/admin/withdrawals/pending/'),

  // Approve a withdrawal
  approveWithdrawal: (withdrawalId) =>
    api.post(`/tokens/admin/withdrawals/${withdrawalId}/approve/`),

  // Reject a withdrawal
  rejectWithdrawal: (withdrawalId, reason) =>
    api.post(`/tokens/admin/withdrawals/${withdrawalId}/reject/`, { reason }),

  // Mark withdrawal as paid
  markWithdrawalPaid: (withdrawalId, paymentReference) =>
    api.post(`/tokens/admin/withdrawals/${withdrawalId}/paid/`, { payment_reference: paymentReference }),

  // Get pool statistics
  getPoolStats: () =>
    api.get('/tokens/admin/stats/'),

  // ===== LEGACY (backward compatibility) =====
  getBalance: () =>
    api.get('/tokens/balance/'),
};
