import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokensAPI } from '../api/tokens';
import toast from 'react-hot-toast';

export function useTokens() {
  const queryClient = useQueryClient();

  // Use the new wallet endpoint instead of legacy balance
  const walletQuery = useQuery({
    queryKey: ['tokens', 'wallet'],
    queryFn: () => tokensAPI.getWallet().then(res => res.data.data),
  });

  const transactionsQuery = useQuery({
    queryKey: ['tokens', 'transactions'],
    queryFn: () => tokensAPI.getTransactions().then(res => res.data.data || res.data),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => tokensAPI.getWithdrawals().then(res => res.data.data || res.data),
  });

  const requestWithdrawalMutation = useMutation({
    mutationFn: (data) => tokensAPI.requestWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tokens']);
      queryClient.invalidateQueries(['withdrawals']);
      toast.success('Withdrawal request submitted!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal');
    }
  });

  // Transform wallet data to match old balance format for backward compatibility
  const balance = walletQuery.data ? {
    balance: walletQuery.data.token_balance,
    total_earned: walletQuery.data.total_earned,
    naira_value: walletQuery.data.naira_value,
    token_value_naira: walletQuery.data.token_value_naira,
    pending_withdrawal: walletQuery.data.pending_withdrawal,
    can_withdraw: walletQuery.data.can_withdraw,
    minimum_withdrawal: walletQuery.data.minimum_withdrawal,
  } : null;

  return {
    balance,
    wallet: walletQuery.data,
    isLoadingBalance: walletQuery.isLoading,
    isLoadingWallet: walletQuery.isLoading,
    transactions: transactionsQuery.data,
    isLoadingTransactions: transactionsQuery.isLoading,
    withdrawals: withdrawalsQuery.data,
    isLoadingWithdrawals: withdrawalsQuery.isLoading,
    requestWithdrawal: requestWithdrawalMutation.mutate,
    isRequestingWithdrawal: requestWithdrawalMutation.isPending,
    refetch: () => {
      walletQuery.refetch();
      transactionsQuery.refetch();
      withdrawalsQuery.refetch();
    }
  };
}
