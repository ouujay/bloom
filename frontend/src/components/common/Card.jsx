import clsx from 'clsx';

export default function Card({
  children,
  className = '',
  padding = 'md',
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-100',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
