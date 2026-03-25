export const SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb';
export const CHARACTERISTIC_UUID = '00002a9d-0000-1000-8000-00805f9b34fb';

export interface HydrationLog {
  id: string;
  amount: number; // in fl oz
  type: string; // beverage type/name
  emoji?: string; // beverage emoji
  timestamp: Date;
  caffeine?: number; // in mg
  alcohol?: number; // ABV percentage
  sugar?: number; // in g
}

export interface UserStats {
  dailyGoal: number; // in fl oz
  currentIntake: number; // in fl oz
  streak: number;
}

export interface DeviceStatus {
  connected: boolean;
  batteryLevel: number;
  lastSync: Date | null;
}

export interface Favorite {
  id: string;
  icon: string;
  label: string;
  oz: number;
  type: string;
  caffeine?: number;
  alcohol?: number;
}

