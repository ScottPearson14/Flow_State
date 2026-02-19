
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { HydrationCircle } from './components/HydrationCircle';
import { TrendsChart } from './components/TrendsChart';
import { RecentLog } from './components/RecentLog';
import { HydrationLog, UserStats, DeviceStatus } from './types';

const INITIAL_LOGS: HydrationLog[] = [
  { id: '1', amount: 500, type: 'water', timestamp: new Date(Date.now() - 3600000) },
  { id: '2', amount: 250, type: 'coffee', timestamp: new Date(Date.now() - 10800000), caffeine: 80 },
  { id: '3', amount: 400, type: 'water', timestamp: new Date(Date.now() - 21600000) },
];

const App: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({ dailyGoal: 2500, currentIntake: 1150, streak: 5 });
  const [logs, setLogs] = useState<HydrationLog[]>(INITIAL_LOGS);
  const [device, setDevice] = useState<DeviceStatus>({ connected: true, batteryLevel: 84, lastSync: new Date() });
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'profile'>('home');
  const [aiTip, setAiTip] = useState<string>("Analyzing your hydration patterns...");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchAiInsight = async (currentStats: UserStats, currentLogs: HydrationLog[]) => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are a hydration expert. Based on these stats: Goal: ${currentStats.dailyGoal}ml, Current: ${currentStats.currentIntake}ml. Recent logs: ${JSON.stringify(currentLogs.slice(0, 3))}. Give one short, punchy health tip (max 15 words) for the user. Mention specifics like caffeine or remaining goal if relevant. Be friendly.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      setAiTip(response.text || "Keep sipping! Your body will thank you.");
    } catch (error) {
      console.error("AI Insight Error:", error);
      setAiTip("Stay hydrated for peak performance today!");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    fetchAiInsight(stats, logs);
  }, []);

  const logIntake = (amount: number, type: HydrationLog['type'], caffeine = 0) => {
    const newLog: HydrationLog = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      type,
      timestamp: new Date(),
      caffeine
    };
    
    const updatedLogs = [newLog, ...logs];
    const updatedStats = {
      ...stats,
      currentIntake: stats.currentIntake + amount
    };

    setLogs(updatedLogs);
    setStats(updatedStats);
    setDevice(prev => ({ ...prev, lastSync: new Date() }));
    
    // Refresh AI tip after logging significant amount
    fetchAiInsight(updatedStats, updatedLogs);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative overflow-x-hidden selection:bg-blue-100">
      <header className="px-6 py-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Flow State</h1>
          <div className="flex items-center space-x-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tracking</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-bold text-orange-500 flex items-center justify-end">
              🔥 {stats.streak}
            </p>
          </div>
          <button className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200 active:scale-90 transition-transform">
            JS
          </button>
        </div>
      </header>

      <main className="px-5 pb-28 pt-4 space-y-6">
        {activeTab === 'home' && (
          <>
            {/* AI Insight Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-[2rem] p-5 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
              </div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">Smart Insight</span>
                  {isAiLoading && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>}
                </div>
                <p className={`text-lg font-medium leading-tight ${isAiLoading ? 'opacity-50' : 'opacity-100'}`}>
                  "{aiTip}"
                </p>
              </div>
            </div>

            <HydrationCircle current={stats.currentIntake} goal={stats.dailyGoal} />
            
            {/* Beverage Selection Grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: '💧', label: 'Water', ml: 250, type: 'water' as const },
                { icon: '☕', label: 'Coffee', ml: 200, type: 'coffee' as const, caf: 80 },
                { icon: '🍵', label: 'Tea', ml: 250, type: 'other' as const, caf: 30 },
                { icon: '🥤', label: 'Soda', ml: 330, type: 'soda' as const }
              ].map((bev) => (
                <button 
                  key={bev.label}
                  onClick={() => logIntake(bev.ml, bev.type, bev.caf)}
                  className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center hover:border-blue-200 active:bg-blue-50 transition-all group"
                >
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{bev.icon}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{bev.label}</span>
                  <span className="text-[8px] text-slate-300">{bev.ml}ml</span>
                </button>
              ))}
            </div>

            <RecentLog logs={logs} />
          </>
        )}

        {activeTab === 'stats' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <h2 className="text-2xl font-bold px-1">Analytics</h2>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Weekly Average</p>
                    <h3 className="text-3xl font-black text-slate-800">2,140 <span className="text-sm font-medium text-slate-400">ml/day</span></h3>
                  </div>
                  <div className="text-green-500 text-sm font-bold flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                    12%
                  </div>
               </div>
               <TrendsChart />
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border border-slate-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl mr-4">💧</div>
                  <div>
                    <p className="font-bold text-slate-800">Hydration Score</p>
                    <p className="text-xs text-slate-400">Based on consistency</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600 text-xl">A+</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
             <h2 className="text-2xl font-bold px-1">Settings</h2>
             <div className="space-y-6">
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Smart Base Details</h4>
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        <span className="font-semibold text-slate-700">Status</span>
                      </div>
                      <span className="text-slate-400 text-sm font-bold">Live</span>
                    </div>
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Battery</span>
                      <span className="text-slate-600 font-bold">{device.batteryLevel}%</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Calibration</span>
                      <button className="text-blue-600 text-xs font-bold uppercase bg-blue-50 px-3 py-1.5 rounded-lg">Run Now</button>
                    </div>
                  </div>
                </section>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(28rem-3rem)] mx-auto bg-slate-900 text-white flex justify-around items-center py-4 z-30 rounded-[2.5rem] shadow-2xl">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'home' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'stats' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'stats' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'profile' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'profile' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default App;
