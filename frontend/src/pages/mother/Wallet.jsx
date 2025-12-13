import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tokensAPI } from '../../api/tokens';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Heart,
  Sparkles,
  ArrowRight,
  Clock,
  Wallet as WalletIcon,
  Users,
  PiggyBank,
  RefreshCw,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const iconMap = {
  earn: ArrowDownLeft,
  withdraw: ArrowUpRight,
  bonus: Gift,
  daily_task: CheckCircle,
  daily_lesson: BookOpen,
  health_checkin: Heart,
  daily_checkin: Heart,
  onboarding: Sparkles,
  signup: Sparkles,
  referral: Users,
  weekly_quiz: Gift,
  streak_bonus: Sparkles,
  video_watched: BookOpen,
};

const colorMap = {
  earn: { bg: 'bg-bloom-100', text: 'text-bloom-600' },
  withdraw: { bg: 'bg-red-100', text: 'text-red-600' },
  bonus: { bg: 'bg-purple-100', text: 'text-purple-600' },
  daily_task: { bg: 'bg-primary-100', text: 'text-primary-600' },
  daily_lesson: { bg: 'bg-primary-100', text: 'text-primary-600' },
  health_checkin: { bg: 'bg-bloom-100', text: 'text-bloom-600' },
  daily_checkin: { bg: 'bg-bloom-100', text: 'text-bloom-600' },
  onboarding: { bg: 'bg-purple-100', text: 'text-purple-600' },
  signup: { bg: 'bg-purple-100', text: 'text-purple-600' },
  referral: { bg: 'bg-amber-100', text: 'text-amber-600' },
  weekly_quiz: { bg: 'bg-primary-100', text: 'text-primary-600' },
  streak_bonus: { bg: 'bg-purple-100', text: 'text-purple-600' },
  video_watched: { bg: 'bg-primary-100', text: 'text-primary-600' },
};

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [poolInfo, setPoolInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, poolRes, txRes, wdRes] = await Promise.all([
        tokensAPI.getWallet(),
        tokensAPI.getPoolInfo(),
        tokensAPI.getTransactions(),
        tokensAPI.getWithdrawals(),
      ]);

      setWallet(walletRes.data.data);
      setPoolInfo(poolRes.data.data);
      setTransactions(txRes.data.data || []);
      setWithdrawals(wdRes.data.data || []);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tokenBalance = wallet?.token_balance || 0;
  const nairaValue = wallet?.naira_value || 0;
  const tokenValueNaira = wallet?.token_value_naira || poolInfo?.token_value_naira || 0;
  const totalEarned = wallet?.total_earned || 0;
  const pendingWithdrawal = wallet?.pending_withdrawal || 0;
  const minimumWithdrawal = wallet?.minimum_withdrawal || 200;
  const canWithdraw = wallet?.can_withdraw || false;

  // Pool stats
  const poolBalance = poolInfo?.pool_balance_naira || 0;
  const tokensInCirculation = poolInfo?.tokens_in_circulation || 0;

  // Calculate this week's earnings
  const thisWeekEarnings = transactions
    .filter(tx => {
      const txDate = dayjs(tx.created_at);
      const weekAgo = dayjs().subtract(7, 'day');
      return txDate.isAfter(weekAgo) && tx.amount > 0;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Coins className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-dark-500">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 -m-4 md:-m-6 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <p className="text-bloom-600 font-medium mb-2">Your Rewards</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-dark-900 mb-3">
            Token Wallet
          </h1>
          <p className="text-dark-600 text-lg max-w-md mx-auto">
            Earn tokens for completing daily activities. Token value grows as donations come in!
          </p>
        </div>

        {/* Main Balance Card */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary-300 rounded-3xl blur-2xl opacity-30" />
          <div className="relative bg-white rounded-3xl shadow-xl shadow-dark-900/10 overflow-hidden">
            {/* Balance Section */}
            <div className="bg-primary-500 p-8 md:p-12 text-white">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="text-primary-100 text-sm font-medium mb-2">Available Balance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl md:text-7xl font-bold">{tokenBalance.toLocaleString()}</span>
                    <span className="text-2xl text-primary-200">tokens</span>
                  </div>
                  <p className="text-primary-100 mt-2 text-lg">
                    Worth <span className="font-semibold text-white">₦{nairaValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                  <p className="text-primary-200 text-sm mt-1">
                    Current rate: 1 token = ₦{tokenValueNaira.toFixed(4)}
                  </p>
                </div>

                <Link
                  to="/dashboard/withdraw"
                  className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all ${
                    canWithdraw
                      ? 'bg-white text-primary-600 hover:bg-cream-100 hover:shadow-lg'
                      : 'bg-white/20 text-white/60 cursor-not-allowed'
                  }`}
                >
                  <WalletIcon className="w-5 h-5" />
                  Withdraw Funds
                  {canWithdraw && <ArrowRight className="w-5 h-5" />}
                </Link>
              </div>

              {!canWithdraw && (
                <p className="mt-4 text-primary-200 text-sm">
                  Minimum withdrawal: {minimumWithdrawal} tokens. You need {minimumWithdrawal - tokenBalance} more tokens.
                </p>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-cream-200">
              <div className="p-6 text-center">
                <p className="text-dark-500 text-sm mb-1">This Week</p>
                <p className="text-2xl font-bold text-bloom-600">+{thisWeekEarnings}</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-dark-500 text-sm mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-dark-900">{totalEarned.toLocaleString()}</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-dark-500 text-sm mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{pendingWithdrawal}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pool Info Card */}
        <div className="bg-gradient-to-br from-bloom-500 to-bloom-600 rounded-3xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Community Pool</h3>
                <p className="text-bloom-100 text-sm">Funded by generous donors</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-bloom-100 text-sm mb-1">Pool Balance</p>
              <p className="text-2xl font-bold">₦{poolBalance.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-bloom-100 text-sm mb-1">Tokens in Circulation</p>
              <p className="text-2xl font-bold">{tokensInCirculation.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/10 rounded-xl">
            <div className="flex items-center gap-2 text-bloom-100">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Token value increases as more donations come in!</span>
            </div>
          </div>

          <Link
            to="/donate"
            className="mt-4 block text-center bg-white text-bloom-600 font-medium py-3 rounded-xl hover:bg-bloom-50 transition-colors"
          >
            Support the Community
          </Link>
        </div>

        {/* How to Earn Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <p className="text-primary-500 font-medium mb-2">Earn More</p>
            <h2 className="text-3xl font-bold text-dark-900">How to earn tokens</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: BookOpen,
                title: 'Daily Lessons',
                tokens: '+5',
                description: 'Complete your daily lesson',
                color: 'primary',
              },
              {
                icon: Heart,
                title: 'Health Check-in',
                tokens: '+5',
                description: 'Log your daily health',
                color: 'bloom',
              },
              {
                icon: CheckCircle,
                title: 'Wellness Tasks',
                tokens: '+5',
                description: 'Complete daily tasks',
                color: 'primary',
              },
              {
                icon: Sparkles,
                title: '7-Day Streak',
                tokens: '+20',
                description: 'Stay consistent for a week',
                color: 'purple',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-white hover:bg-cream-50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  item.color === 'primary'
                    ? 'bg-primary-100 text-primary-500'
                    : item.color === 'bloom'
                      ? 'bg-bloom-100 text-bloom-500'
                      : 'bg-purple-100 text-purple-500'
                }`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-dark-900">{item.title}</h3>
                  <span className={`font-bold ${
                    item.color === 'bloom' ? 'text-bloom-600' : item.color === 'purple' ? 'text-purple-600' : 'text-primary-600'
                  }`}>
                    {item.tokens}
                  </span>
                </div>
                <p className="text-sm text-dark-500">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Dynamic Exchange Rate Info */}
          <div className="mt-6 flex items-center justify-center gap-4 p-4 bg-bloom-50 rounded-2xl">
            <TrendingUp className="w-6 h-6 text-bloom-600" />
            <div>
              <p className="font-semibold text-dark-900">Current Rate: 1 token = ₦{tokenValueNaira.toFixed(4)}</p>
              <p className="text-sm text-dark-500">Minimum withdrawal: {minimumWithdrawal} tokens</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-bloom-600 font-medium mb-1">Activity</p>
              <h2 className="text-3xl font-bold text-dark-900">Transaction History</h2>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-dark-400" />
              </div>
              <h3 className="text-xl font-semibold text-dark-900 mb-2">No transactions yet</h3>
              <p className="text-dark-500 mb-6">
                Start earning tokens by completing your daily activities
              </p>
              <Link
                to="/children"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-full transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
              <div className="divide-y divide-cream-100">
                {transactions.slice(0, 10).map((tx, index) => {
                  const txSource = tx.source || 'earn';
                  const txType = tx.type || 'earn';
                  const Icon = iconMap[txSource] || iconMap[txType] || ArrowDownLeft;
                  const colors = colorMap[txSource] || colorMap[txType] || colorMap.earn;

                  return (
                    <div
                      key={tx.id || index}
                      className="flex items-center gap-4 p-5 hover:bg-cream-50 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark-900 truncate">
                          {tx.description}
                        </p>
                        <p className="text-sm text-dark-500">
                          {dayjs(tx.created_at).format('MMM D, YYYY • h:mm A')}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          tx.amount > 0 ? 'text-bloom-600' : 'text-red-500'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </div>
                        <div className="text-xs text-dark-400">
                          Balance: {tx.balance_after}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {transactions.length > 10 && (
                <div className="p-4 bg-cream-50 text-center">
                  <button className="text-primary-600 font-medium hover:text-primary-700">
                    Load more transactions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Withdrawal History */}
        {withdrawals && withdrawals.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-dark-900 mb-4">Withdrawal History</h3>
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="divide-y divide-cream-100">
                {withdrawals.slice(0, 5).map((withdrawal, index) => (
                  <div key={withdrawal.id || index} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        withdrawal.status === 'completed'
                          ? 'bg-bloom-100'
                          : withdrawal.status === 'pending' || withdrawal.status === 'approved' || withdrawal.status === 'processing'
                            ? 'bg-amber-100'
                            : 'bg-red-100'
                      }`}>
                        {withdrawal.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-bloom-600" />
                        ) : withdrawal.status === 'pending' || withdrawal.status === 'approved' || withdrawal.status === 'processing' ? (
                          <Clock className="w-5 h-5 text-amber-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-dark-900">
                          ₦{Number(withdrawal.naira_amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-dark-500">
                          {withdrawal.token_amount} tokens • {dayjs(withdrawal.created_at).format('MMM D, YYYY')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        withdrawal.status === 'completed'
                          ? 'bg-bloom-100 text-bloom-700'
                          : withdrawal.status === 'pending' || withdrawal.status === 'approved' || withdrawal.status === 'processing'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </span>
                      {withdrawal.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1">{withdrawal.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-bloom-500 rounded-3xl p-8 md:p-12 text-center text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">Keep earning!</h2>
          <p className="text-bloom-100 mb-8 max-w-md mx-auto">
            Complete your daily activities to earn more tokens. Every lesson brings you closer to your rewards.
          </p>
          <Link
            to="/children"
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 text-bloom-600 font-medium px-8 py-4 rounded-full transition-all hover:shadow-xl"
          >
            Start Earning Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
