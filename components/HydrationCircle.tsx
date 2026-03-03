
import React from 'react';

interface Props {
  current: number;
  goal: number;
}

export const HydrationCircle: React.FC<Props> = ({ current, goal }) => {
  const percentage = Math.min(Math.round((current / goal) * 100), 100);
  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-50">
      <div className="relative w-60 h-60">
        <svg className="w-full h-full transform -rotate-90">
          <defs>
            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            className="stroke-slate-50 fill-none"
            strokeWidth="12"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="url(#blueGrad)"
            fill="none"
            className="transition-all duration-1000 ease-out"
            strokeWidth="14"
            strokeLinecap="round"
            style={{
              strokeDasharray,
              strokeDashoffset,
              filter: percentage > 0 ? 'url(#glow)' : 'none'
            }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-black text-slate-800 tracking-tighter">{percentage}%</span>
          <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Hydrated</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 w-full">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Current</p>
          <p className="text-xl font-bold text-blue-600">{current.toFixed(1)}<span className="text-xs ml-0.5">oz</span></p>
        </div>
        <div className="flex items-center justify-center">
           <div className="w-[1px] h-8 bg-slate-100"></div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Daily Goal</p>
          <p className="text-xl font-bold text-slate-700">{goal.toFixed(1)}<span className="text-xs ml-0.5">oz</span></p>
        </div>
      </div>
    </div>
  );
};
