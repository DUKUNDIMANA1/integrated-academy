import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, actions, padding = true }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={padding ? 'p-6' : ''}>{children}</div>
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBg = 'bg-primary-100', trend, onClick }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className={`${iconBg} rounded-xl p-3 flex-shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      {trend && (
        <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  </div>
);
