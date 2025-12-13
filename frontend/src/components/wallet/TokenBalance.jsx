import { Coins } from 'lucide-react';
import Card from '../common/Card';

export default function TokenBalance({ balance, pendingWithdrawal = 0 }) {
  return (
    <Card className="bg-primary-500 text-white shadow-lg shadow-primary-500/25">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-primary-100 text-sm mb-1">Available Balance</p>
          <p className="text-3xl font-bold">{balance?.toLocaleString() || 0}</p>
          <p className="text-primary-100 text-sm">tokens</p>
        </div>
        <div className="bg-white/20 p-3 rounded-lg">
          <Coins className="w-6 h-6" />
        </div>
      </div>

      {pendingWithdrawal > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex justify-between text-sm">
            <span className="text-primary-100">Pending withdrawal</span>
            <span className="font-medium">{pendingWithdrawal.toLocaleString()} tokens</span>
          </div>
        </div>
      )}
    </Card>
  );
}
