import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tokensAPI } from '../../api/tokens';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  AlertCircle,
  TrendingUp,
  Building2,
  CreditCard,
  User,
  ArrowRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', label: 'Approved' },
  processing: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'bg-bloom-100 text-bloom-700', label: 'Completed' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
};

export default function Withdraw() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [poolInfo, setPoolInfo] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, poolRes, wdRes] = await Promise.all([
        tokensAPI.getWallet(),
        tokensAPI.getPoolInfo(),
        tokensAPI.getWithdrawals(),
      ]);
      setWallet(walletRes.data.data);
      setPoolInfo(poolRes.data.data);
      setWithdrawals(wdRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const tokenBalance = wallet?.token_balance || 0;
  const tokenValueNaira = wallet?.token_value_naira || poolInfo?.token_value_naira || 0;
  const minimumWithdrawal = wallet?.minimum_withdrawal || 200;
  const canWithdraw = wallet?.can_withdraw || false;

  const amountNum = parseInt(amount) || 0;
  const nairaAmount = amountNum * tokenValueNaira;
  const isValidAmount = amountNum >= minimumWithdrawal && amountNum <= tokenBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidAmount || !bankName || !accountNumber || !accountName) return;

    try {
      setSubmitting(true);
      await tokensAPI.requestWithdrawal({
        token_amount: amountNum,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      });
      toast.success('Withdrawal request submitted!');
      navigate('/dashboard/wallet');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit withdrawal';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wallet className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-dark-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 -m-4 md:-m-6 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white hover:bg-cream-50 rounded-xl text-dark-600 hover:text-dark-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-dark-900">Withdraw Tokens</h1>
            <p className="text-dark-500">Convert your tokens to cash</p>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm mb-1">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{tokenBalance.toLocaleString()}</span>
                <span className="text-primary-200">tokens</span>
              </div>
              <p className="text-primary-100 mt-1">
                Worth ₦{(tokenBalance * tokenValueNaira).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-primary-100 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Current rate: 1 token = ₦{tokenValueNaira.toFixed(4)}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Withdrawal Form */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-dark-900 mb-6">Request Withdrawal</h2>

            {/* Info Box */}
            <div className="bg-bloom-50 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-bloom-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-dark-900">Withdrawal Info</p>
                  <p className="text-dark-600 mt-1">Minimum: {minimumWithdrawal} tokens</p>
                  <p className="text-dark-600">Rate: 1 token = ₦{tokenValueNaira.toFixed(4)}</p>
                </div>
              </div>
            </div>

            {!canWithdraw ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-dark-900 mb-2">Not Enough Tokens</h3>
                <p className="text-dark-500 mb-4">
                  You need at least {minimumWithdrawal} tokens to withdraw.
                  <br />
                  You have {tokenBalance} tokens.
                </p>
                <Link
                  to="/children"
                  className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
                >
                  Earn more tokens
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Amount (tokens)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Min: ${minimumWithdrawal}, Max: ${tokenBalance}`}
                    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                  {amount && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-dark-500">
                        = ₦{nairaAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {amountNum > tokenBalance && (
                        <span className="text-sm text-red-500">Insufficient balance</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. GTBank, Access Bank"
                    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="10-digit account number"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Name on account"
                    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isValidAmount || !bankName || !accountNumber || !accountName || submitting}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-dark-200 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Withdrawal Request
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Withdrawal History */}
          <div>
            <h2 className="text-xl font-bold text-dark-900 mb-6">Withdrawal History</h2>

            {withdrawals.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center">
                <div className="w-12 h-12 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-dark-400" />
                </div>
                <p className="text-dark-500">No withdrawal history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => {
                  const config = statusConfig[w.status] || statusConfig.pending;
                  const Icon = config.icon;

                  return (
                    <div key={w.id} className="bg-white rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-dark-900">
                            {Number(w.token_amount).toLocaleString()} tokens
                          </p>
                          <p className="text-dark-600">
                            ₦{Number(w.naira_amount).toLocaleString()}
                          </p>
                          <p className="text-sm text-dark-500 mt-1">
                            {w.bank_name} • {w.account_number}
                          </p>
                          <p className="text-xs text-dark-400 mt-1">
                            {dayjs(w.created_at).format('MMM D, YYYY • h:mm A')}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </div>
                      </div>
                      {w.status === 'rejected' && w.rejection_reason && (
                        <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                          {w.rejection_reason}
                        </div>
                      )}
                      {w.status === 'completed' && w.paid_at && (
                        <div className="mt-3 text-sm text-bloom-600 bg-bloom-50 p-3 rounded-xl">
                          Paid on {dayjs(w.paid_at).format('MMM D, YYYY')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
