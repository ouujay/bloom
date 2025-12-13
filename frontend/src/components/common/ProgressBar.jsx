import clsx from 'clsx';

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  className = '',
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    bloom: 'bg-bloom-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  return (
    <div className={className}>
      <div className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-300', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-sm text-gray-600 text-right">{Math.round(percentage)}%</p>
      )}
    </div>
  );
}
