import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatDate(date, format = 'MMM D, YYYY') {
  return dayjs(date).format(format);
}

export function formatDateTime(date) {
  return dayjs(date).format('MMM D, YYYY h:mm A');
}

export function formatRelativeTime(date) {
  return dayjs(date).fromNow();
}

export function formatCurrency(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-NG').format(num);
}

export function formatWeekDay(week, day) {
  return `Week ${week}, Day ${day}`;
}

export function formatProgress(completed, total) {
  if (total === 0) return '0%';
  return `${Math.round((completed / total) * 100)}%`;
}

export function tokensToNaira(tokens, rate = 10) {
  return tokens * rate;
}

export function nairaToTokens(naira, rate = 10) {
  return Math.floor(naira / rate);
}
