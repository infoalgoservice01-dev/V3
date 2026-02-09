
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, trendType, color }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between transition-all">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${
            trendType === 'positive' ? 'text-green-600 dark:text-green-400' : 
            trendType === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
          }`}>
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color} transition-colors`}>
        {icon}
      </div>
    </div>
  );
};
