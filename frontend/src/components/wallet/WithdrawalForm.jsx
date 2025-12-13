import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

const MINIMUM_WITHDRAWAL = 500;
const TOKENS_TO_NAIRA = 10; // 1 token = 10 Naira

export default function WithdrawalForm({ balance, onSubmit, isSubmitting }) {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const nairaAmount = amount ? parseInt(amount) * TOKENS_TO_NAIRA : 0;
  const canWithdraw = parseInt(amount) >= MINIMUM_WITHDRAWAL && parseInt(amount) <= balance;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canWithdraw) {
      onSubmit({
        amount: parseInt(amount),
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      });
    }
  };

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Request Withdrawal</h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p>Minimum withdrawal: {MINIMUM_WITHDRAWAL} tokens</p>
            <p>Exchange rate: 1 token = ₦{TOKENS_TO_NAIRA}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="number"
            label="Amount (tokens)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min: ${MINIMUM_WITHDRAWAL}, Max: ${balance}`}
            error={amount && parseInt(amount) > balance ? 'Insufficient balance' : ''}
          />
          {amount && (
            <p className="text-sm text-gray-500 mt-1">
              = ₦{nairaAmount.toLocaleString()}
            </p>
          )}
        </div>

        <Input
          label="Bank Name"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="e.g. GTBank, Access Bank"
        />

        <Input
          label="Account Number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="10-digit account number"
          maxLength={10}
        />

        <Input
          label="Account Name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Name on account"
        />

        <Button
          type="submit"
          disabled={!canWithdraw || !bankName || !accountNumber || !accountName}
          loading={isSubmitting}
          className="w-full"
        >
          Submit Withdrawal Request
        </Button>
      </form>
    </Card>
  );
}
