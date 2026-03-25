
import React, { useState, useCallback, useEffect } from 'react';
// Import the Bluetooth plugin
import { BleClient } from '@capacitor-community/bluetooth-le'; 
import { HydrationCircle } from './components/HydrationCircle';
import { TrendsChart } from './components/TrendsChart';
import { RecentLog } from './components/RecentLog';
import { 
  HydrationLog, 
  UserStats, 
  DeviceStatus, 
  Favorite, 
  SERVICE_UUID, 
  CHARACTERISTIC_UUID 
} from './types';


const App: React.FC = () => {
  // Initialize from localStorage or use defaults
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('flowstate_stats');
    return saved ? JSON.parse(saved) : { dailyGoal: 80, currentIntake: 0, streak: 0 };
  });
  
  const [logs, setLogs] = useState<HydrationLog[]>(() => {
    const saved = localStorage.getItem('flowstate_logs');
    if (saved) {
      const parsedLogs = JSON.parse(saved);
      // Convert timestamp strings back to Date objects
      return parsedLogs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    }
    return [];
  });
  


  const [device, setDevice] = useState<DeviceStatus>({ connected: false, batteryLevel: 84, lastSync: new Date() });
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'profile'>('home');
  const [debugDayOffset, setDebugDayOffset] = useState(0);
    // FIX: Added the missing isScanning state
  const [isScanning, setIsScanning] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('80');
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    const saved = localStorage.getItem('flowstate_favorites');
    return saved ? JSON.parse(saved) : [
      { id: '1', icon: '💧', label: 'Water', oz: 8, type: 'water' },
      { id: '2', icon: '☕', label: 'Coffee', oz: 7, type: 'coffee', caffeine: 80 },
      { id: '4', icon: '🥤', label: 'Soda', oz: 12, type: 'soda' }
    ];
  });
  const [editingFavorite, setEditingFavorite] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingOz, setEditingOz] = useState('');
  const [addingFavorite, setAddingFavorite] = useState(false);
  const [newFavIcon, setNewFavIcon] = useState('🥤');
  const [newFavLabel, setNewFavLabel] = useState('');
  const [newFavOz, setNewFavOz] = useState('');
  const [newFavContentType, setNewFavContentType] = useState<'none' | 'caffeine' | 'alcohol'>('none');
  const [newFavContentValue, setNewFavContentValue] = useState('');

// --- Bluetooth Connection Logic ---
const connectToNano = async () => {
  try {
    setIsScanning(true);
    await BleClient.stopLEScan().catch(() => {}); // clear any stuck scan
    await BleClient.initialize();

const deviceFound = await BleClient.requestDevice({
  services: [SERVICE_UUID],
  // remove name filter entirely
});

    await BleClient.connect(deviceFound.deviceId, (id) => {
      setDevice(prev => ({ ...prev, connected: false }));
      console.log(`Scale ${id} disconnected`);
    });

    setDevice(prev => ({ ...prev, connected: true, lastSync: new Date() }));

await BleClient.startNotifications(
  deviceFound.deviceId,
  SERVICE_UUID,
  CHARACTERISTIC_UUID,
  (value) => {
    const weightKg = value.getFloat32(0, true);
    const amountOz = Math.round(weightKg * 35.274);

    if (amountOz > 0) {
      const newLog: HydrationLog = {
        id: Math.random().toString(36).substr(2, 9),
        amount: amountOz,
        type: 'water',
        emoji: '💧',
        timestamp: new Date(),
        caffeine: 0,
        alcohol: 0
      };

      setLogs(prev => [newLog, ...prev]);
      setStats(prev => ({ ...prev, currentIntake: prev.currentIntake + amountOz }));
      setDevice(prev => ({ ...prev, lastSync: new Date() }));
    }
  }
);
  } catch (error: any) {
    alert("BLE Error: " + (error?.message || error?.code || JSON.stringify(error)));
  } finally {
    setIsScanning(false); // always resets no matter what
  }
};

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flowstate_stats', JSON.stringify(stats));
  }, [stats]);

  // Save logs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flowstate_logs', JSON.stringify(logs));
  }, [logs]);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flowstate_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Check for daily reset (reset currentIntake at midnight)
// Real midnight reset
useEffect(() => {
  const checkDailyReset = () => {
    const lastResetDate = localStorage.getItem('flowstate_lastResetDate');
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      setLogs(prev => prev.filter(log => new Date(log.timestamp) >= todayStart));
      setStats(prev => ({ ...prev, currentIntake: 0 }));
      localStorage.setItem('flowstate_lastResetDate', today);
    }
  };

  checkDailyReset();
  const interval = setInterval(checkDailyReset, 60000);
  return () => clearInterval(interval);
}, []);

// Debug day advance reset
useEffect(() => {
  if (debugDayOffset > 0) {
    const offsetDay = new Date();
    offsetDay.setDate(offsetDay.getDate() + debugDayOffset);
    offsetDay.setHours(0, 0, 0, 0);
    setLogs(prev => prev.filter(log => new Date(log.timestamp) >= offsetDay));
    setStats(prev => ({ ...prev, currentIntake: 0 }));
  }
}, [debugDayOffset]);

  const logIntake = (amount: number, type: string, emoji?: string, caffeine = 0, alcohol = 0) => {
    // Create timestamp with debug day offset applied
    const offsetDate = (() => {
      const d = new Date();
      d.setDate(d.getDate() + debugDayOffset);
      return d;
    })();

    const newLog: HydrationLog = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      type,
      emoji,
      timestamp: offsetDate,
      caffeine,
      alcohol
    };
    
    const updatedLogs = [newLog, ...logs];
    const updatedStats = {
      ...stats,
      currentIntake: stats.currentIntake + amount
    };

    setLogs(updatedLogs);
    setStats(updatedStats);
    setDevice(prev => ({ ...prev, lastSync: new Date() }));
  };

  const deleteLog = (id: string) => {
    const logToDelete = logs.find(log => log.id === id);
    if (logToDelete) {
      const updatedLogs = logs.filter(log => log.id !== id);
      const updatedStats = {
        ...stats,
        currentIntake: Math.max(0, stats.currentIntake - logToDelete.amount)
      };
      setLogs(updatedLogs);
      setStats(updatedStats);
      setDevice(prev => ({ ...prev, lastSync: new Date() }));
    }
  };

  const editLog = (id: string, newAmount: number) => {
    const logIndex = logs.findIndex(log => log.id === id);
    if (logIndex !== -1) {
      const oldLog = logs[logIndex];
      const amountDifference = newAmount - oldLog.amount;
      
      const updatedLogs = [...logs];
      updatedLogs[logIndex] = { ...oldLog, amount: newAmount };
      
      const updatedStats = {
        ...stats,
        currentIntake: Math.max(0, stats.currentIntake + amountDifference)
      };
      
      setLogs(updatedLogs);
      setStats(updatedStats);
      setDevice(prev => ({ ...prev, lastSync: new Date() }));
    }
  };

  // Get today's intake (considering debug day offset)
  const getTodayIntake = () => {
    const today = new Date();
    today.setDate(today.getDate() + debugDayOffset);
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    return logs
      .filter(log => log.timestamp >= dayStart && log.timestamp <= dayEnd)
      .reduce((sum, log) => sum + log.amount, 0);
  };

  // Get yesterday's intake (considering debug day offset)
  const getYesterdayIntake = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() + debugDayOffset - 1);
    const dayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);

    return logs
      .filter(log => log.timestamp >= dayStart && log.timestamp <= dayEnd)
      .reduce((sum, log) => sum + log.amount, 0);
  };

  // Calculate day-over-day percentage change
  const getDayOverDayChange = () => {
    const today = getTodayIntake();
    const yesterday = getYesterdayIntake();

    if (yesterday === 0) {
      return { percentage: 0, isIncrease: today > 0 };
    }

    const percentageChange = Math.round(((today - yesterday) / yesterday) * 100);
    return { percentage: Math.abs(percentageChange), isIncrease: percentageChange >= 0 };
  };

  // Get today's logs (considering debug day offset)
  const getTodayLogs = () => {
    const today = new Date();
    today.setDate(today.getDate() + debugDayOffset);
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    return logs.filter(log => log.timestamp >= dayStart && log.timestamp <= dayEnd);
  };

  // Calculate weekly stats (last 7 days from midnight to midnight)
  const getWeeklyStats = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setDate(today.getDate() + debugDayOffset);
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

      const dailyAmount = logs
        .filter(log => log.timestamp >= dayStart && log.timestamp <= dayEnd)
        .reduce((sum, log) => sum + log.amount, 0);

      weeklyData.push({
        day: days[date.getDay()],
        amount: dailyAmount
      });
    }

    return weeklyData;
  };

  // Calculate weekly average intake (only for days with at least 1 oz)
  const getWeeklyAverage = () => {
    const weeklyData = getWeeklyStats();
    const daysWithIntake = weeklyData.filter(day => day.amount > 0);
    if (daysWithIntake.length === 0) return 0;
    const total = daysWithIntake.reduce((sum, day) => sum + day.amount, 0);
    return total / daysWithIntake.length;
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
        </div>
      </header>

      <main className="px-5 pb-28 pt-4 space-y-6">
        {activeTab === 'home' && (
          <>
            {getTodayIntake() > 0 ? (
              <HydrationCircle current={getTodayIntake()} goal={stats.dailyGoal} />
            ) : (
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center h-64">
                <p className="text-slate-400 text-center text-sm font-medium">Log a drink to get started today</p>
              </div>
            )}

            {(() => {
              const totalCaffeine = logs.reduce((sum, log) => sum + (log.caffeine || 0), 0);
              
              // Calculate standard drinks from alcohol content
              // Formula: (amount_oz * ABV%) / 60 = standard drinks
              const standardDrinks = logs
                .filter(log => log.alcohol && log.alcohol > 0)
                .reduce((sum, log) => sum + ((log.amount * log.alcohol) / 60), 0);
              
              if (totalCaffeine > 0 || standardDrinks > 0) {
                return (
                  <div className="grid grid-cols-2 gap-3">
                    {totalCaffeine > 0 && (
                      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Caffeine Today</p>
                        <p className="text-2xl font-black text-orange-500">{totalCaffeine.toFixed(0)}<span className="text-xs font-medium text-slate-400 ml-1">mg</span></p>
                      </div>
                    )}
                    {standardDrinks > 0 && (
                      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Standard Drinks</p>
                        <p className="text-2xl font-black text-red-500">{standardDrinks.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Beverage Selection Grid */}
            <div className="grid grid-cols-4 gap-3">
              {favorites.map((bev) => (
                <button 
                  key={bev.id}
                  onClick={() => logIntake(bev.oz, bev.type, bev.icon, bev.caffeine, bev.alcohol)}
                  className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center hover:border-blue-200 active:bg-blue-50 transition-all group"
                >
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{bev.icon}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{bev.label}</span>
                  <span className="text-[8px] text-slate-300">{bev.oz}oz</span>
                </button>
              ))}
            </div>

            <RecentLog logs={getTodayLogs()} onDelete={deleteLog} onEdit={editLog} />
          </>
        )}

        {activeTab === 'stats' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <h2 className="text-2xl font-bold px-1">Analytics</h2>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Weekly Average</p>
                    <h3 className="text-3xl font-black text-slate-800">{getWeeklyAverage().toFixed(0)} <span className="text-sm font-medium text-slate-400">oz/day</span></h3>
                  </div>
                  <div className={`text-sm font-bold flex items-center ${getDayOverDayChange().isIncrease ? 'text-green-500' : 'text-red-500'}`}>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={getDayOverDayChange().isIncrease ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}/></svg>
                    {getDayOverDayChange().percentage}%
                  </div>
               </div>
               <TrendsChart data={getWeeklyStats()} />
            </div>
            

            <button
              onClick={() => setDebugDayOffset(prev => prev + 1)}
              className="w-full px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors text-sm"
            >
              📅 Advance Day (Offset: {debugDayOffset})
            </button>
            
            <button
              onClick={() => {
                if (confirm('Clear all data? This cannot be undone.')) {
                  localStorage.clear();
                  setLogs([]);
                  setStats({ dailyGoal: 80, currentIntake: 0, streak: 0 });
                  setFavorites([
                    { id: '1', icon: '💧', label: 'Water', oz: 8, type: 'water' },
                    { id: '2', icon: '☕', label: 'Coffee', oz: 7, type: 'coffee', caffeine: 80 },
                    { id: '4', icon: '🥤', label: 'Soda', oz: 12, type: 'soda' }
                  ]);
                  setDebugDayOffset(0);
                }
              }}
              className="w-full px-4 py-2 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors text-sm"
            >
              🗑️ Clear All Data
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
             <h2 className="text-2xl font-bold px-1">Settings</h2>
             <div className="space-y-6">
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Daily Goal</h4>
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="p-4 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Daily Hydration Goal</span>
                      {!editingGoal ? (
                        <button 
                          onClick={() => {
                            setGoalInput(stats.dailyGoal.toString());
                            setEditingGoal(true);
                          }}
                          className="text-blue-600 text-xs font-bold uppercase bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          {stats.dailyGoal} oz
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-bold"
                            placeholder="oz"
                          />
                          <button
                            onClick={() => {
                              const newGoal = parseFloat(goalInput);
                              if (!isNaN(newGoal) && newGoal > 0) {
                                setStats(prev => ({ ...prev, dailyGoal: newGoal }));
                                setEditingGoal(false);
                              }
                            }}
                            className="text-blue-600 text-xs font-bold uppercase bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Favorite Beverages</h4>
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 space-y-2">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="p-4 border-b border-slate-50 last:border-b-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{fav.icon}</span>
                          {editingFavorite === fav.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold"
                              />
                              <input
                                type="number"
                                value={editingOz}
                                onChange={(e) => setEditingOz(e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold w-20"
                                placeholder="oz"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold text-slate-700">{fav.label}</p>
                              <p className="text-xs text-slate-400">{fav.oz}oz</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {editingFavorite === fav.id ? (
                            <>
                              <button
                                onClick={() => {
                                  const newLabel = editingLabel || fav.label;
                                  const newOz = parseFloat(editingOz);
                                  if (!isNaN(newOz) && newOz > 0) {
                                    setFavorites(favorites.map(f => 
                                      f.id === fav.id ? { ...f, label: newLabel, oz: newOz } : f
                                    ));
                                  }
                                  setEditingFavorite(null);
                                }}
                                className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingFavorite(null)}
                                className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingFavorite(fav.id);
                                  setEditingLabel(fav.label);
                                  setEditingOz(fav.oz.toString());
                                }}
                                className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setFavorites(favorites.filter(f => f.id !== fav.id))}
                                className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {addingFavorite && (
                      <div className="p-4 border-t border-slate-50 space-y-3 bg-blue-50 rounded-b-2xl">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Icon</label>
                          <div className="flex gap-2 flex-wrap">
                            {['💧', '☕', '🍵', '🧃', '🥤', '🍷', '🍺', '🧋', '🍹', '🍸', '🥛', '🧊'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => setNewFavIcon(emoji)}
                                className={`text-2xl p-2 rounded border-2 transition-all ${
                                  newFavIcon === emoji
                                    ? 'border-blue-600 bg-white'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Name</label>
                          <input
                            type="text"
                            value={newFavLabel}
                            onChange={(e) => setNewFavLabel(e.target.value)}
                            placeholder="e.g., Sports Drink"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Amount (oz)</label>
                          <input
                            type="number"
                            value={newFavOz}
                            onChange={(e) => setNewFavOz(e.target.value)}
                            placeholder="e.g., 16"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-2">Content Type</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'None', value: 'none' as const },
                              { label: 'Caffeine', value: 'caffeine' as const },
                              { label: 'Alcohol', value: 'alcohol' as const }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setNewFavContentType(option.value);
                                  setNewFavContentValue('');
                                }}
                                className={`px-3 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                                  newFavContentType === option.value
                                    ? 'border-blue-600 bg-white text-blue-600'
                                    : 'border-slate-300 text-slate-600 hover:border-slate-400'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {newFavContentType !== 'none' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">
                              {newFavContentType === 'caffeine' ? 'Caffeine (mg)' : 'Alcohol (% ABV)'}
                            </label>
                            <input
                              type="number"
                              value={newFavContentValue}
                              onChange={(e) => setNewFavContentValue(e.target.value)}
                              placeholder={newFavContentType === 'caffeine' ? 'e.g., 80' : 'e.g., 5'}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.5"
                            />
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setAddingFavorite(false)}
                            className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-400 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              const oz = parseFloat(newFavOz);
                              const contentValue = newFavContentValue ? parseFloat(newFavContentValue) : undefined;
                              if (newFavLabel && !isNaN(oz) && oz > 0) {
                                const newFav: Favorite = {
                                  id: Date.now().toString(),
                                  icon: newFavIcon,
                                  label: newFavLabel,
                                  oz,
                                  type: newFavLabel
                                };
                                if (newFavContentType === 'caffeine' && !isNaN(contentValue!) && contentValue! > 0) {
                                  newFav.caffeine = contentValue;
                                } else if (newFavContentType === 'alcohol' && !isNaN(contentValue!) && contentValue! > 0) {
                                  newFav.alcohol = contentValue;
                                }
                                setFavorites([...favorites, newFav]);
                                setNewFavIcon('🥤');
                                setNewFavLabel('');
                                setNewFavOz('');
                                setNewFavContentType('none');
                                setNewFavContentValue('');
                                setAddingFavorite(false);
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setAddingFavorite(!addingFavorite)}
                    className="w-full mt-3 px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors text-sm"
                  >
                    {addingFavorite ? 'Cancel' : '+ Add New Favorite'}
                  </button>
                </section>
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Smart Base Details</h4>
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${device.connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`}></div>
                        <span className="text-slate-400 text-sm font-bold">{device.connected ? 'Live' : 'Offline'}</span>
                      </div>
                      <span className="text-slate-400 text-sm font-bold">Live</span>
                    </div>
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Battery</span>
                      <span className="text-slate-600 font-bold">{device.batteryLevel}%</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
  <span className="font-semibold text-slate-700">Bluetooth Link</span>
  <button
    onClick={connectToNano}
    disabled={device.connected || isScanning}
    className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg transition-colors ${
      device.connected
        ? 'bg-green-50 text-green-600'
        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    }`}
  >
    {isScanning ? 'Scanning...' : device.connected ? 'Connected' : 'Connect Device'}
  </button>
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
