import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'neutral' | 'primary' | 'secondary' | 'accent';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'neutral',
  icon,
  ...props
}) => {
  const getBgColor = () => {
    switch (variant) {
      case 'primary':
        return 'bg-brand-blue text-white';
      case 'secondary':
        return 'bg-brand-green-dark text-white';
      case 'accent':
        return 'bg-brand-magenta text-white';
      case 'neutral':
        return 'bg-white hover:bg-gray-50 text-gray-700';
      default:
        return 'bg-white text-gray-700';
    }
  };

  return (
    <button
      className={`border-sketch px-4 py-1.5 text-sm font-title font-bold flex items-center gap-2 ${className || getBgColor()}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default Button;
