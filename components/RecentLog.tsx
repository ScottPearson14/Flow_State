
import React from 'react';
import { HydrationLog } from '../types';

interface Props {
  logs: HydrationLog[];
}

export const RecentLog: React.FC<Props> = ({ logs }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'coffee': return '☕';
      case 'soda': return '🥤';
      case 'tea': return '🍵';
      default: return '💧';
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'coffee': return 'bg-orange-50';
      case 'soda': return 'bg-purple-50';
      case 'water': return 'bg-blue-50';
      default: return 'bg-emerald-50';
    }
  };

  return (
    <div className="px-1">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold text-slate-800">Recent Logs</h3>
        <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
          History
        </button>
      </div>
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
            No logs yet today. Start drinking!
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-4 rounded-3xl flex items-center shadow-sm border border-slate-50 group hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${getBg(log.type)} rounded-2xl flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform`}>
                {getIcon(log.type)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 capitalize leading-none mb-1">{log.type}</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-blue-600">+{log.amount}<span className="text-[10px] font-bold ml-0.5">ml</span></p>
                {log.caffeine && (
                  <p className="text-[9px] font-bold text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                     {log.caffeine}mg CAF
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
