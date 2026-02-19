
export interface HydrationLog {
  id: string;
  amount: number; // in ml
  type: 'water' | 'coffee' | 'soda' | 'other';
  timestamp: Date;
  caffeine?: number; // in mg
  sugar?: number; // in g
}

export interface UserStats {
  dailyGoal: number; // in ml
  currentIntake: number; // in ml
  streak: number;
}

export interface DeviceStatus {
  connected: boolean;
  batteryLevel: number;
  lastSync: Date | null;
}
