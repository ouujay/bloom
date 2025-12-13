import { ArrowUpRight, ArrowDownLeft, Gift, CheckCircle } from 'lucide-react';
import dayjs from 'dayjs';
import Card from '../common/Card';

const iconMap = {
  earned: ArrowDownLeft,
  withdrawn: ArrowUpRight,
  bonus: Gift,
  task: CheckCircle,
};

const colorMap = {
  earned: 'text-bloom-600 bg-bloom-100',
  withdrawn: 'text-red-600 bg-red-100',
  bonus: 'text-purple-600 bg-purple-100',
  task: 'text-primary-600 bg-primary-100',
};

export default function TransactionList({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-8">No transactions yet</p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="divide-y divide-gray-100">
        {transactions.map((tx) => {
          const Icon = iconMap[tx.type] || ArrowDownLeft;
          const colorClass = colorMap[tx.type] || colorMap.earned;

          return (
            <div key={tx.id} className="flex items-center gap-4 p-4">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <p className="font-medium text-gray-900">{tx.description}</p>
                <p className="text-sm text-gray-500">
                  {dayjs(tx.created_at).format('MMM D, YYYY • h:mm A')}
                </p>
              </div>

              <div className={`font-semibold ${tx.amount > 0 ? 'text-bloom-600' : 'text-red-600'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
