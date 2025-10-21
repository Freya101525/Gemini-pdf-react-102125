
import React from 'react';

interface MetricProps {
  label: string;
  value: string | number;
  delta?: string;
}

const Metric: React.FC<MetricProps> = ({ label, value, delta }) => {
  return (
    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl text-center shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</h3>
      <p className="mt-1 text-3xl font-semibold" style={{ color: 'var(--text-color)' }}>
        {value}
      </p>
      {delta && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{delta}</p>}
    </div>
  );
};

export default Metric;
