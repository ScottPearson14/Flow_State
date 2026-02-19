
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { day: 'Mon', amount: 2100 },
  { day: 'Tue', amount: 1800 },
  { day: 'Wed', amount: 2400 },
  { day: 'Thu', amount: 2200 },
  { day: 'Fri', amount: 1500 },
  { day: 'Sat', amount: 2600 },
  { day: 'Sun', amount: 2000 },
];

export const TrendsChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Weekly Intake</h3>
        <span className="text-xs font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full">Last 7 Days</span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94a3b8' }} 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="amount" radius={[4, 4, 4, 4]} barSize={20}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.amount >= 2000 ? '#3b82f6' : '#cbd5e1'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
