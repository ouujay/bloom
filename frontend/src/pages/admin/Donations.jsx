import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { Check, Clock, Gift, CheckCircle } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export default function AdminDonations() {
  const queryClient = useQueryClient();

  const { data: donations, isLoading } = useQuery({
    queryKey: ['admin', 'donations'],
    queryFn: () => api.get('/tokens/admin/donations/pending/').then(res => res.data.data),
  });

  const { data: recentDonations, isLoading: recentLoading } = useQuery({
    queryKey: ['donations', 'recent'],
    queryFn: () => api.get('/tokens/donations/recent/').then(res => res.data.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => api.post(`/tokens/admin/donations/${id}/confirm/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'donations']);
      queryClient.invalidateQueries(['donations', 'recent']);
      queryClient.invalidateQueries(['admin', 'pool-stats']);
      toast.success('Donation confirmed!');
    },
    onError: () => {
      toast.error('Failed to confirm donation');
    },
  });

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  const pendingDonations = donations || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Donations</h1>
        <p className="text-dark-600">Manage donation confirmations</p>
      </div>

      {/* Pending Donations */}
      <div>
        <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          Pending Confirmation ({pendingDonations.length})
        </h2>

        {pendingDonations.length > 0 ? (
          <div className="space-y-4">
            {pendingDonations.map((donation) => (
              <Card key={donation.id}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-dark-900">
                        {donation.donor_name || 'Anonymous'}
                      </p>
                      {donation.donor_email && (
                        <p className="text-sm text-dark-500">{donation.donor_email}</p>
                      )}
                      {donation.donor_phone && (
                        <p className="text-sm text-dark-500">{donation.donor_phone}</p>
                      )}
                    </div>
                    <div className="text-sm">
                      <p>
                        <span className="text-dark-500">Amount:</span>{' '}
                        <span className="font-bold text-bloom-600">
                          {formatNaira(donation.amount_naira)}
                        </span>
                      </p>
                      <p>
                        <span className="text-dark-500">Payment Method:</span>{' '}
                        {donation.payment_method || 'Bank Transfer'}
                      </p>
                      {donation.payment_reference && (
                        <p>
                          <span className="text-dark-500">Reference:</span>{' '}
                          {donation.payment_reference}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-dark-400">
                      Submitted {dayjs(donation.created_at).format('MMM D, YYYY h:mm A')}
                    </p>
                  </div>

                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => confirmMutation.mutate(donation.id)}
                    loading={confirmMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Confirm
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-dark-500 py-8">No pending donations</p>
          </Card>
        )}
      </div>

      {/* Recent Confirmed Donations */}
      <div>
        <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-bloom-500" />
          Recent Confirmed Donations
        </h2>

        {recentLoading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : recentDonations?.length > 0 ? (
          <Card padding="none">
            <table className="w-full">
              <thead className="bg-cream-100 border-b border-cream-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Donor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {recentDonations.map((donation) => (
                  <tr key={donation.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-primary-400" />
                        <span className="font-medium text-dark-900">{donation.donor_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-bloom-600">
                      {formatNaira(donation.amount_naira)}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-500">
                      {dayjs(donation.confirmed_at).format('MMM D, YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card>
            <p className="text-center text-dark-500 py-8">No confirmed donations yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}
