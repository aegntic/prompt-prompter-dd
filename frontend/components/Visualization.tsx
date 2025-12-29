
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter } from 'recharts';
import { MetricPoint } from '../types';

export const MainChart: React.FC<{ data: MetricPoint[]; compact?: boolean }> = ({ data, compact }) => {
  return (
    <div className={`${compact ? 'h-40' : 'h-64'} w-full bg-slate-50/50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-blue-900/30 p-2 overflow-hidden relative shadow-inner`}>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]"></div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="currentColor"
            className="text-slate-400 dark:text-slate-600"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{
              backgroundColor: 'var(--tw-bg-opacity, #fff)',
              borderColor: '#3b82f6',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            itemStyle={{ color: '#3b82f6', fontSize: '12px' }}
            labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
            wrapperClassName="dark:!bg-slate-900 dark:!border-blue-900"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#60a5fa', stroke: '#fff' }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MetricsMiniChart: React.FC<{ data: MetricPoint[] }> = ({ data }) => {
  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <XAxis type="category" dataKey="name" hide />
          <YAxis type="number" dataKey="score" hide domain={[0, 100]} />
          <Scatter data={data} fill="#3b82f6" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RadialProgressBar: React.FC<{ score: number; loading?: boolean }> = ({ score, loading }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Determine color based on score
  let color = '#3b82f6'; // Default Blue
  let glowColor = 'rgba(59, 130, 246, 0.4)';

  if (!loading) {
    if (score >= 70) {
      color = '#10b981'; // Green
      glowColor = 'rgba(16, 185, 129, 0.4)';
    } else if (score >= 40) {
      color = '#f59e0b'; // Amber
      glowColor = 'rgba(245, 158, 11, 0.4)';
    } else {
      color = '#ef4444'; // Red
      glowColor = 'rgba(239, 68, 68, 0.4)';
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center group">
      <div className={loading ? 'animate-spin-slow' : ''}>
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-slate-200 dark:text-slate-800"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference * 0.7 : offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
        <span
          className={`text-2xl font-tech transition-colors duration-300 ${loading ? 'animate-pulse text-slate-400 dark:text-slate-600' : ''}`}
          style={{ color: loading ? undefined : color, textShadow: loading ? undefined : `0 0 10px ${glowColor}` }}
        >
          {loading ? '--' : `${score}%`}
        </span>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
