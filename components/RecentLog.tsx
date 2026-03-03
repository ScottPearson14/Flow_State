
import React, { useState } from 'react';
import { HydrationLog } from '../types';

interface Props {
  logs: HydrationLog[];
  onDelete: (id: string) => void;
  onEdit: (id: string, newAmount: number) => void;
}

export const RecentLog: React.FC<Props> = ({ logs, onDelete, onEdit }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

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
      default: return 'bg-slate-50';
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
                {log.emoji || getIcon(log.type)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 capitalize leading-none mb-1">{log.type}</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {editingId === log.id ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold"
                    step="0.5"
                  />
                  <button
                    onClick={() => {
                      const newAmount = parseFloat(editAmount);
                      if (!isNaN(newAmount) && newAmount > 0) {
                        onEdit(log.id, newAmount);
                        setEditingId(null);
                      }
                    }}
                    className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-right">
                  <p className="font-black text-blue-600">+{log.amount.toFixed(1)}<span className="text-[10px] font-bold ml-0.5">oz</span></p>
                  <div className="flex gap-2 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(log.id);
                        setEditAmount(log.amount.toString());
                      }}
                      className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(log.id)}
                      className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  {log.caffeine && (
                    <p className="text-[9px] font-bold text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                       {log.caffeine}mg CAF
                    </p>
                  )}
                  {log.alcohol && (
                    <p className="text-[9px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded mt-1 inline-block ml-1">
                       {log.alcohol}% ABV
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
