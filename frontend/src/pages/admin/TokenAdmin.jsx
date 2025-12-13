import { useState, useEffect } from 'react';
import { tokensAPI } from '../../api/tokens';
import {
  PiggyBank,
  TrendingUp,
  Users,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export default function TokenAdmin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, donationsRes, withdrawalsRes] = await Promise.all([
        tokensAPI.getPoolStats(),
        tokensAPI.getPendingDonations(),
        tokensAPI.getPendingWithdrawals(),
      ]);
      setStats(statsRes.data.data);
      setPendingDonations(donationsRes.data.data || []);
      setPendingWithdrawals(withdrawalsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDonation = async (donationId) => {
    try {
      setActionLoading(donationId);
      await tokensAPI.confirmDonation(donationId);
      toast.success('Donation confirmed!');
      fetchData();
    } catch (error) {
      toast.error('Failed to confirm donation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      setActionLoading(withdrawalId);
      const res = await tokensAPI.approveWithdrawal(withdrawalId);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to approve withdrawal';
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!rejectModal) return;
    try {
      setActionLoading(rejectModal);
      await tokensAPI.rejectWithdrawal(rejectModal, rejectReason);
      toast.success('Withdrawal rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!paymentModal) return;
    try {
      setActionLoading(paymentModal);
      await tokensAPI.markWithdrawalPaid(paymentModal, paymentReference);
      toast.success('Marked as paid');
      setPaymentModal(null);
      setPaymentReference('');
      fetchData();
    } catch (error) {
      toast.error('Failed to mark as paid');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <PiggyBank className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-dark-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 -m-4 md:-m-6 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark-900">Token Admin</h1>
            <p className="text-dark-500">Manage donations and withdrawals</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl hover:bg-cream-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-bloom-100 rounded-xl flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-bloom-600" />
              </div>
              <span className="text-sm text-dark-500">Pool Balance</span>
            </div>
            <p className="text-2xl font-bold text-dark-900">
              ₦{(stats?.pool_balance_naira || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm text-dark-500">Tokens Issued</span>
            </div>
            <p className="text-2xl font-bold text-dark-900">
              {(stats?.total_tokens_issued || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-dark-500">Token Value</span>
            </div>
            <p className="text-2xl font-bold text-dark-900">
              ₦{(stats?.token_value_naira || 0).toFixed(4)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-dark-500">In Circulation</span>
            </div>
            <p className="text-2xl font-bold text-dark-900">
              {(stats?.tokens_in_circulation || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-bloom-500 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-bloom-100 mb-1">Total Donated</p>
                <p className="text-3xl font-bold">₦{(stats?.total_donated || 0).toLocaleString()}</p>
                <p className="text-bloom-100 text-sm mt-1">{stats?.total_donations_count || 0} donations</p>
              </div>
              <ArrowDownLeft className="w-12 h-12 text-white/30" />
            </div>
          </div>
          <div className="bg-primary-500 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 mb-1">Total Withdrawn</p>
                <p className="text-3xl font-bold">₦{(stats?.total_withdrawn_naira || 0).toLocaleString()}</p>
                <p className="text-primary-100 text-sm mt-1">{stats?.total_withdrawals_count || 0} withdrawals</p>
              </div>
              <ArrowUpRight className="w-12 h-12 text-white/30" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'donations', label: `Pending Donations (${pendingDonations.length})` },
            { id: 'withdrawals', label: `Pending Withdrawals (${pendingWithdrawals.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-dark-600 hover:bg-cream-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-3xl p-6">
            <h2 className="text-xl font-bold text-dark-900 mb-6">System Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-cream-100">
                <span className="text-dark-600">Pool Balance</span>
                <span className="font-semibold">₦{(stats?.pool_balance_naira || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-cream-100">
                <span className="text-dark-600">Total Tokens Issued</span>
                <span className="font-semibold">{(stats?.total_tokens_issued || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-cream-100">
                <span className="text-dark-600">Total Tokens Withdrawn</span>
                <span className="font-semibold">{(stats?.total_tokens_withdrawn || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-cream-100">
                <span className="text-dark-600">Tokens in Circulation</span>
                <span className="font-semibold">{(stats?.tokens_in_circulation || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-cream-100">
                <span className="text-dark-600">Current Token Value</span>
                <span className="font-semibold">₦{(stats?.token_value_naira || 0).toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-cream-100">
                <span className="text-dark-600">Total Amount Donated</span>
                <span className="font-semibold text-bloom-600">₦{(stats?.total_donated || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-dark-600">Total Amount Withdrawn</span>
                <span className="font-semibold text-primary-600">₦{(stats?.total_withdrawn_naira || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="bg-white rounded-3xl p-6">
            <h2 className="text-xl font-bold text-dark-900 mb-6">Pending Donations</h2>
            {pendingDonations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-dark-400" />
                </div>
                <p className="text-dark-500">No pending donations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDonations.map((donation) => (
                  <div key={donation.id} className="border border-cream-200 rounded-2xl p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-2xl font-bold text-dark-900">
                            ₦{Number(donation.amount_naira).toLocaleString()}
                          </p>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            Pending
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-dark-600">
                          <p><strong>Donor:</strong> {donation.donor_name || 'Anonymous'}</p>
                          {donation.donor_email && <p><strong>Email:</strong> {donation.donor_email}</p>}
                          {donation.donor_phone && <p><strong>Phone:</strong> {donation.donor_phone}</p>}
                          {donation.payment_reference && (
                            <p><strong>Reference:</strong> {donation.payment_reference}</p>
                          )}
                          <p className="text-dark-400 text-xs">
                            {dayjs(donation.created_at).format('MMM D, YYYY • h:mm A')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmDonation(donation.id)}
                          disabled={actionLoading === donation.id}
                          className="flex items-center gap-2 bg-bloom-500 hover:bg-bloom-600 disabled:bg-dark-200 text-white px-4 py-2 rounded-xl transition-colors"
                        >
                          {actionLoading === donation.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-3xl p-6">
            <h2 className="text-xl font-bold text-dark-900 mb-6">Pending Withdrawals</h2>
            {pendingWithdrawals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-dark-400" />
                </div>
                <p className="text-dark-500">No pending withdrawals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="border border-cream-200 rounded-2xl p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <p className="text-2xl font-bold text-dark-900">
                            ₦{Number(withdrawal.naira_amount).toLocaleString()}
                          </p>
                          <span className="text-dark-500">({withdrawal.token_amount} tokens)</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-dark-500 mb-1">User</p>
                            <p className="font-medium text-dark-900">{withdrawal.user_name}</p>
                            <p className="text-dark-600">{withdrawal.user_email}</p>
                            {withdrawal.user_phone && <p className="text-dark-600">{withdrawal.user_phone}</p>}
                          </div>
                          <div>
                            <p className="text-dark-500 mb-1">Bank Details</p>
                            <p className="font-medium text-dark-900">{withdrawal.account_name}</p>
                            <p className="text-dark-600">{withdrawal.bank_name}</p>
                            <p className="font-mono text-dark-600">{withdrawal.account_number}</p>
                          </div>
                        </div>
                        {withdrawal.verification_photo && (
                          <a
                            href={withdrawal.verification_photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary-600 text-sm mt-3 hover:text-primary-700"
                          >
                            <Eye className="w-4 h-4" />
                            View Verification Photo
                          </a>
                        )}
                        <p className="text-dark-400 text-xs mt-2">
                          Requested: {dayjs(withdrawal.created_at).format('MMM D, YYYY • h:mm A')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleApproveWithdrawal(withdrawal.id)}
                          disabled={actionLoading === withdrawal.id}
                          className="flex items-center gap-2 bg-bloom-500 hover:bg-bloom-600 disabled:bg-dark-200 text-white px-4 py-2 rounded-xl transition-colors"
                        >
                          {actionLoading === withdrawal.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal(withdrawal.id)}
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-dark-900 mb-4">Reject Withdrawal</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Reason for rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectReason('');
                  }}
                  className="flex-1 bg-cream-100 hover:bg-cream-200 text-dark-700 font-medium py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectWithdrawal}
                  disabled={!rejectReason || actionLoading === rejectModal}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-dark-200 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {actionLoading === rejectModal ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-dark-900 mb-4">Mark as Paid</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Payment Reference (optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter transfer reference..."
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-bloom-500 focus:ring-2 focus:ring-bloom-100 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPaymentModal(null);
                    setPaymentReference('');
                  }}
                  className="flex-1 bg-cream-100 hover:bg-cream-200 text-dark-700 font-medium py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={actionLoading === paymentModal}
                  className="flex-1 bg-bloom-500 hover:bg-bloom-600 disabled:bg-dark-200 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {actionLoading === paymentModal ? 'Saving...' : 'Mark as Paid'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
