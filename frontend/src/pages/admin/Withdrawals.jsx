import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import Input from '../../components/common/Input';
import { Check, X, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export default function AdminWithdrawals() {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['admin', 'withdrawals'],
    queryFn: () => api.get('/tokens/admin/withdrawals/pending/').then(res => res.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/tokens/admin/withdrawals/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'withdrawals']);
      toast.success('Withdrawal approved!');
    },
    onError: () => {
      toast.error('Failed to approve withdrawal');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/tokens/admin/withdrawals/${id}/reject/`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'withdrawals']);
      toast.success('Withdrawal rejected');
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: () => {
      toast.error('Failed to reject withdrawal');
    },
  });

  const handleReject = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (selectedWithdrawal) {
      rejectMutation.mutate({ id: selectedWithdrawal.id, reason: rejectReason });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending') || [];
  const processedWithdrawals = withdrawals?.filter(w => w.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Withdrawals</h1>
        <p className="text-dark-600">Manage withdrawal requests</p>
      </div>

      {/* Pending */}
      <div>
        <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          Pending Requests ({pendingWithdrawals.length})
        </h2>

        {pendingWithdrawals.length > 0 ? (
          <div className="space-y-4">
            {pendingWithdrawals.map((w) => (
              <Card key={w.id}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-dark-900">{w.user_name}</p>
                      <p className="text-sm text-dark-500">{w.user_email}</p>
                    </div>
                    <div className="text-sm">
                      <p><span className="text-dark-500">Amount:</span> <span className="font-bold text-purple-600">{w.token_amount || w.amount} tokens</span> (₦{(w.naira_amount || (w.amount * 10)).toLocaleString()})</p>
                      <p><span className="text-dark-500">Bank:</span> {w.bank_name}</p>
                      <p><span className="text-dark-500">Account:</span> {w.account_number}</p>
                      <p><span className="text-dark-500">Name:</span> {w.account_name}</p>
                    </div>
                    <p className="text-xs text-dark-400">
                      Requested {dayjs(w.created_at).format('MMM D, YYYY h:mm A')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => approveMutation.mutate(w.id)}
                      loading={approveMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(w)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-dark-500 py-8">No pending withdrawals</p>
          </Card>
        )}
      </div>

      {/* Processed */}
      <div>
        <h2 className="text-lg font-semibold text-dark-900 mb-4">History</h2>

        {processedWithdrawals.length > 0 ? (
          <Card padding="none">
            <table className="w-full">
              <thead className="bg-cream-100 border-b border-cream-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Bank Details</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {processedWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark-900">{w.user_name}</p>
                      <p className="text-sm text-dark-500">{w.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-dark-900">{w.token_amount || w.amount} tokens</td>
                    <td className="px-4 py-3 text-sm text-dark-500">
                      {w.bank_name}<br />{w.account_number}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        w.status === 'approved' || w.status === 'completed' ? 'bg-bloom-100 text-bloom-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-500">
                      {dayjs(w.processed_at || w.created_at).format('MMM D, YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card>
            <p className="text-center text-dark-500 py-8">No processed withdrawals</p>
          </Card>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Withdrawal"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Rejecting withdrawal of {selectedWithdrawal?.amount} tokens for {selectedWithdrawal?.user_name}.
          </p>
          <Input
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmReject}
              loading={rejectMutation.isPending}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
