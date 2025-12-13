import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { tokensAPI } from '../api/tokens';
import { paymentsAPI } from '../api/payments';
import {
  Heart,
  PiggyBank,
  TrendingUp,
  Users,
  Gift,
  ArrowRight,
  Check,
  Copy,
  Building2,
  CreditCard,
  Phone,
  Mail,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function Donate() {
  const [poolInfo, setPoolInfo] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState('');
  const [showFAQ, setShowFAQ] = useState(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Payment flow state
  const [paymentStep, setPaymentStep] = useState('form'); // 'form' | 'transfer' | 'polling' | 'timeout'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [pollingProgress, setPollingProgress] = useState(0);
  const [lastDonationAmount, setLastDonationAmount] = useState(0);
  const pollingRef = useRef(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poolRes, donationsRes] = await Promise.all([
        tokensAPI.getPoolInfo(),
        tokensAPI.getRecentDonations(),
      ]);
      setPoolInfo(poolRes.data.data);
      setRecentDonations(donationsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(''), 2000);
  };

  const selectedAmount = amount === 'custom' ? parseInt(customAmount) || 0 : parseInt(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAmount || selectedAmount < 100) {
      toast.error('Minimum donation is ₦100');
      return;
    }

    try {
      setSubmitting(true);
      const response = await paymentsAPI.initiatePayment({
        amount: selectedAmount,
        donor_name: donorName,
        donor_email: donorEmail,
        donor_phone: donorPhone,
        is_anonymous: isAnonymous,
      });

      const data = response.data?.data;
      setPaymentDetails({
        reference: data.reference,
        amount: data.amount,
        bank_name: data.bank_name || 'Wema Bank',
        account_number: data.account_number,
        account_name: data.account_name || 'Bloom Foundation',
        payment_url: data.payment_url,
        expires_at: data.expires_at,
      });
      setPaymentStep('transfer');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to initiate payment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!paymentDetails?.reference) return;

    setPaymentStep('polling');
    setPollingProgress(0);
    pollingRef.current = true;

    const result = await paymentsAPI.pollForConfirmation(paymentDetails.reference, {
      maxDuration: 20000,
      interval: 2000,
      onPoll: ({ elapsed }) => {
        if (pollingRef.current) {
          setPollingProgress(Math.min((elapsed / 20000) * 100, 100));
        }
      },
    });

    pollingRef.current = false;

    if (result.confirmed) {
      // Save the amount before resetting
      setLastDonationAmount(paymentDetails.amount);
      setShowSuccess(true);
      setPaymentStep('form');
      setPaymentDetails(null);
      // Reset form
      setAmount('');
      setCustomAmount('');
      setDonorName('');
      setDonorEmail('');
      setDonorPhone('');
      setIsAnonymous(false);
      // Refresh data
      fetchData();
      toast.success('Payment confirmed! Thank you for your donation!');
    } else {
      setPaymentStep('timeout');
    }
  };

  const handleRetryConfirmation = () => {
    setPaymentStep('transfer');
  };

  const handleStartOver = () => {
    setPaymentStep('form');
    setPaymentDetails(null);
    pollingRef.current = false;
  };

  const poolBalance = poolInfo?.pool_balance_naira || 0;
  const tokensInCirculation = poolInfo?.tokens_in_circulation || 0;
  const tokenValue = poolInfo?.token_value_naira || 0;

  const faqs = [
    {
      q: 'How does my donation help?',
      a: 'Your donation goes directly into the community pool. When mothers complete health activities and earn tokens, they can withdraw real money from this pool. Your generosity directly rewards mothers for taking care of themselves and their babies.',
    },
    {
      q: 'How does the token value work?',
      a: `The token value is calculated as: Pool Balance ÷ Tokens in Circulation. As more donations come in, the value of each token increases, benefiting all mothers who have earned tokens.`,
    },
    {
      q: 'Is my donation tax-deductible?',
      a: 'We are working on obtaining official charity status. Please contact us for more information about tax receipts.',
    },
    {
      q: 'Can I donate anonymously?',
      a: 'Yes! Simply check the "Make my donation anonymous" box when donating. Your name will not be shown publicly.',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-bloom-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-bloom-500" />
          </div>
          <p className="text-dark-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl">
          <div className="w-20 h-20 bg-bloom-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-bloom-600" />
          </div>
          <h1 className="text-3xl font-bold text-dark-900 mb-4">Thank You!</h1>
          <p className="text-dark-600 mb-6">
            Your donation has been recorded. Once we confirm your bank transfer, it will be added to the community pool.
          </p>
          <div className="bg-bloom-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-dark-600 mb-2">Amount:</p>
            <p className="text-2xl font-bold text-bloom-600">₦{lastDonationAmount.toLocaleString()}</p>
          </div>
          <p className="text-sm text-dark-500 mb-6">
            Please make sure to transfer the exact amount to our bank account. We will confirm your donation within 24 hours.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSuccess(false)}
              className="flex-1 bg-bloom-500 hover:bg-bloom-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Make Another Donation
            </button>
            <Link
              to="/"
              className="flex-1 bg-cream-100 hover:bg-cream-200 text-dark-700 font-medium py-3 rounded-xl transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-bloom-500 to-bloom-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-bloom-100 font-medium mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Support Nigerian Mothers
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Your Donation Changes Lives
            </h1>
            <p className="text-xl text-bloom-100 mb-8">
              Every naira you donate goes directly to reward mothers who are taking care of themselves and their babies. Help us build a healthier future for Nigerian families.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#donate-form"
                className="inline-flex items-center gap-2 bg-white text-bloom-600 font-semibold px-8 py-4 rounded-full hover:bg-bloom-50 transition-colors"
              >
                Donate Now
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/30 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-bloom-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <PiggyBank className="w-6 h-6 text-bloom-600" />
              </div>
              <p className="text-3xl font-bold text-dark-900">₦{poolBalance.toLocaleString()}</p>
              <p className="text-dark-500 text-sm">Pool Balance</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-3xl font-bold text-dark-900">{tokensInCirculation.toLocaleString()}</p>
              <p className="text-dark-500 text-sm">Tokens Earned</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-dark-900">₦{tokenValue.toFixed(2)}</p>
              <p className="text-dark-500 text-sm">Token Value</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-dark-900">{recentDonations.length}+</p>
              <p className="text-dark-500 text-sm">Generous Donors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Donation Form */}
          <div id="donate-form">
            <h2 className="text-3xl font-bold text-dark-900 mb-6">Make a Donation</h2>

            {/* Polling State */}
            {paymentStep === 'polling' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-bloom-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-10 h-10 text-bloom-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-dark-900 mb-2">Confirming Payment</h3>
                <p className="text-dark-500 mb-6">
                  Please wait while we verify your transfer...
                </p>
                <div className="w-full bg-cream-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-bloom-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pollingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-dark-400">
                  Checking payment status... {Math.round(pollingProgress / 5)}/20s
                </p>
              </div>
            )}

            {/* Timeout State */}
            {paymentStep === 'timeout' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-dark-900 mb-2">Payment Not Yet Confirmed</h3>
                <p className="text-dark-500 mb-6">
                  We haven't received confirmation of your payment yet. This could take a few minutes.
                </p>
                <div className="bg-cream-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-dark-600">
                    <strong>Reference:</strong> {paymentDetails?.reference}
                  </p>
                  <p className="text-sm text-dark-600">
                    <strong>Amount:</strong> ₦{paymentDetails?.amount?.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleRetryConfirmation}
                    className="w-full bg-bloom-500 hover:bg-bloom-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Check Again
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="w-full bg-cream-100 hover:bg-cream-200 text-dark-700 font-medium py-3 rounded-xl transition-colors"
                  >
                    Start New Donation
                  </button>
                </div>
                <p className="text-xs text-dark-400 mt-4">
                  If you've already made the transfer, your donation will be confirmed automatically once we receive it.
                </p>
              </div>
            )}

            {/* Transfer Details State */}
            {paymentStep === 'transfer' && paymentDetails && (
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="bg-bloom-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-dark-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-bloom-600" />
                      Transfer to this Account
                    </h3>
                    <span className="bg-bloom-100 text-bloom-700 text-sm font-medium px-3 py-1 rounded-full">
                      ₦{paymentDetails.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-xl p-3">
                      <div>
                        <p className="text-xs text-dark-500">Bank Name</p>
                        <p className="font-medium text-dark-900">{paymentDetails.bank_name}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(paymentDetails.bank_name, 'bank')}
                        className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                      >
                        {copied === 'bank' ? (
                          <Check className="w-4 h-4 text-bloom-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-xl p-3">
                      <div>
                        <p className="text-xs text-dark-500">Account Number</p>
                        <p className="font-medium text-dark-900 font-mono text-lg">{paymentDetails.account_number}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(paymentDetails.account_number, 'number')}
                        className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                      >
                        {copied === 'number' ? (
                          <Check className="w-4 h-4 text-bloom-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-xl p-3">
                      <div>
                        <p className="text-xs text-dark-500">Account Name</p>
                        <p className="font-medium text-dark-900">{paymentDetails.account_name}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(paymentDetails.account_name, 'name')}
                        className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                      >
                        {copied === 'name' ? (
                          <Check className="w-4 h-4 text-bloom-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Transfer exactly ₦{paymentDetails.amount?.toLocaleString()}</p>
                      <p className="text-sm text-amber-700 mt-1">
                        After making the transfer, click the button below to confirm your payment.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-dark-400 mb-4 text-center">
                  Reference: {paymentDetails.reference}
                </p>

                <button
                  onClick={handleConfirmTransfer}
                  className="w-full bg-bloom-500 hover:bg-bloom-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  I Have Sent the Money
                </button>

                <button
                  onClick={handleStartOver}
                  className="w-full mt-3 text-dark-500 hover:text-dark-700 font-medium py-2 transition-colors"
                >
                  Cancel and Start Over
                </button>
              </div>
            )}

            {/* Initial Form State */}
            {paymentStep === 'form' && (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm">
              {/* Amount Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 mb-3">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(preset.toString());
                        setCustomAmount('');
                      }}
                      className={`py-3 rounded-xl font-medium transition-all ${
                        amount === preset.toString()
                          ? 'bg-bloom-500 text-white'
                          : 'bg-cream-100 text-dark-700 hover:bg-cream-200'
                      }`}
                    >
                      ₦{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">₦</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setAmount('custom');
                    }}
                    placeholder="Enter custom amount"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-cream-200 focus:border-bloom-500 focus:ring-2 focus:ring-bloom-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Donor Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-bloom-500 focus:ring-2 focus:ring-bloom-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="For donation receipt"
                    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-bloom-500 focus:ring-2 focus:ring-bloom-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number (optional)
                  </label>
                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="For confirmation"
                    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-bloom-500 focus:ring-2 focus:ring-bloom-100 outline-none transition-all"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded border-cream-300 text-bloom-500 focus:ring-bloom-500"
                  />
                  <span className="text-dark-700">Make my donation anonymous</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!selectedAmount || selectedAmount < 100 || submitting}
                className="w-full bg-bloom-500 hover:bg-bloom-600 disabled:bg-dark-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Continue with ₦{selectedAmount.toLocaleString()}
                  </>
                )}
              </button>
            </form>
            )}
          </div>

          {/* Right Column */}
          <div>
            {/* How It Works */}
            <div className="bg-white rounded-3xl p-6 shadow-sm mb-8">
              <h3 className="text-xl font-bold text-dark-900 mb-6">How Your Donation Helps</h3>
              <div className="space-y-4">
                {[
                  {
                    icon: Heart,
                    title: 'You Donate',
                    description: 'Transfer any amount to our bank account',
                    color: 'bloom',
                  },
                  {
                    icon: PiggyBank,
                    title: 'Pool Grows',
                    description: 'Your donation increases the community pool',
                    color: 'primary',
                  },
                  {
                    icon: TrendingUp,
                    title: 'Value Increases',
                    description: 'Token value goes up for all mothers',
                    color: 'amber',
                  },
                  {
                    icon: Gift,
                    title: 'Mothers Benefit',
                    description: 'They can withdraw real cash for their health activities',
                    color: 'purple',
                  },
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      step.color === 'bloom' ? 'bg-bloom-100' :
                      step.color === 'primary' ? 'bg-primary-100' :
                      step.color === 'amber' ? 'bg-amber-100' : 'bg-purple-100'
                    }`}>
                      <step.icon className={`w-5 h-5 ${
                        step.color === 'bloom' ? 'text-bloom-600' :
                        step.color === 'primary' ? 'text-primary-600' :
                        step.color === 'amber' ? 'text-amber-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-900">{step.title}</h4>
                      <p className="text-sm text-dark-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Donations */}
            <div className="bg-white rounded-3xl p-6 shadow-sm mb-8">
              <h3 className="text-xl font-bold text-dark-900 mb-6">Recent Donations</h3>
              {recentDonations.length === 0 ? (
                <p className="text-dark-500 text-center py-4">Be the first to donate!</p>
              ) : (
                <div className="space-y-3">
                  {recentDonations.slice(0, 5).map((donation, index) => (
                    <div key={donation.id || index} className="flex items-center justify-between py-3 border-b border-cream-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-bloom-100 rounded-full flex items-center justify-center">
                          <Heart className="w-5 h-5 text-bloom-600" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-900">{donation.donor_name}</p>
                          <p className="text-xs text-dark-400">
                            {dayjs(donation.confirmed_at).fromNow()}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-bloom-600">
                        ₦{Number(donation.amount_naira).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-dark-900 mb-6">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-cream-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-cream-50 transition-colors"
                    >
                      <span className="font-medium text-dark-900">{faq.q}</span>
                      {showFAQ === index ? (
                        <ChevronUp className="w-5 h-5 text-dark-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-dark-400" />
                      )}
                    </button>
                    {showFAQ === index && (
                      <div className="px-4 pb-4 text-dark-600 text-sm">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-bloom-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Every Donation Makes a Difference
          </h2>
          <p className="text-bloom-100 text-lg mb-8 max-w-2xl mx-auto">
            Join our community of supporters and help Nigerian mothers receive the care they deserve. Your generosity directly impacts lives.
          </p>
          <a
            href="#donate-form"
            className="inline-flex items-center gap-2 bg-white text-bloom-600 font-semibold px-8 py-4 rounded-full hover:bg-bloom-50 transition-colors"
          >
            <Heart className="w-5 h-5" />
            Donate Now
          </a>
        </div>
      </div>
    </div>
  );
}
