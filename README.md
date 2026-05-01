# Flow State: Smart Universal Hydration Tracker 💧

Flow State is a passive, universally compatible smart hydration tracker designed to monitor daily fluid intake without forcing users into an expensive, restrictive "smart bottle" ecosystem. By utilizing a highly accurate, weight-sensing coaster base that communicates via Bluetooth Low Energy (BLE), Flow State automatically calculates your consumption and syncs it directly to a custom mobile application.

---

## 🚀 Key Features

* **Universal Compatibility:** Works with any existing water bottle up to 1.5 kg.
* **Passive Tracking:** No manual logging required for your primary water bottle.
* **Smart Event Detection:** Firmware differentiates between drinking events, refills, and bottle removal using debounce and stability thresholds.
* **Comprehensive Analytics:** Tracks daily goals, weekly trends, streaks, and day-over-day changes.
* **Custom Beverages:** Support for manual logging of other drinks (Coffee, Soda, Energy Drinks) with underlying tracking for Caffeine (mg) and standard Alcohol drinks.
* **Smart Reminders:** Local notifications schedule hydration reminders based on user-defined intervals.
* **Offline Resiliency:** Hydration data is stored safely if the phone is disconnected and syncs upon reconnection.

---

## 🛠️ Technology Stack

**Mobile Application:**
* **Framework:** React 19 + TypeScript + Vite
* **Mobile Bridge:** Capacitor 8 (`@capacitor/core`, `@capacitor/ios`)
* **Bluetooth:** Capacitor Community Bluetooth LE (`@capacitor-community/bluetooth-le`)
* **Visualizations:** Recharts
* **Background Tasks:** Capacitor Local Notifications

**Hardware / Firmware:**
* **Microcontroller:** Arduino Nano 33 BLE
* **Sensors:** Load Cell + HX711 Amplifier
* **Language:** C++ (Arduino)

---

## 🧠 How It Works (Architecture)

The Flow State system uses a two-part architecture to capture and process hydration events.

### 1. Hardware & Firmware (`FlowNano.ino`)
The base contains a load cell connected to an HX711 amplifier, reading raw mass data. The Arduino Nano 33 BLE reads this serial data and processes it into readable weight (kg/oz).
* **State Machine:** The scale continuously monitors its state (`EMPTY` vs `LOADED`). It establishes a `EMPTY_THRESHOLD_KG` (50g) to know when the bottle is removed.
* **Event Debouncing:** To prevent false positives from table bumps or liquid sloshing, the firmware requires the weight to remain stable for a set `STABILITY_THRESHOLD` before locking in a baseline.
* **BLE Transmission:** The Nano hosts a custom BLE Service (`181D`) and Characteristic (`2A9D`) broadcasting the current stable weight as a `Float32` value to connected clients.

### 2. Software Data Processing (`App.tsx`)
The mobile app acts as the BLE Central device. 
* **Connection & Subscription:** Using Capacitor BLE, the app scans for the specific `SERVICE_UUID` and subscribes to weight notifications.
* **Delta Calculation:** When a new stable weight is received, the app compares it to the `previousWeightKgRef`. If the difference is positive (meaning the bottle is lighter), it converts the kg difference into fluid ounces using the multiplier `35.274`.
* **Logging:** If the calculated amount is greater than 0, a new `HydrationLog` is generated, the daily `currentIntake` is updated, and the UI immediately reflects the new progress.

---

## 💻 Setup & Installation

### App Setup
1. Clone the repository and navigate to the project folder.
2. Install dependencies:
   ```bash
   npm install

### Run the development server:
  ```npm run dev```

### Run the development server:
To build for iOS (Requires Xcode):
```
npm run build
npx cap sync ios
npx cap open ios
```

## Hardware Setup
1. Flash FlowNano.ino to your Arduino Nano 33 BLE using the Arduino IDE.
2. Ensure the HX711 data (DT) and clock (SCK) pins match your wiring schematic.
3. Power the base using the integrated 9V battery system.

## 📖 User Guide
### Welcome to Flow State!
The Flow State tracker is designed to be completely unobtrusive. Here is how to get the most out of your smart base and companion app.

### 1. Getting Started
Hardware Setup: Simply place your existing water bottle on top of the compact 6"x6"x1.5" sensing base. The device is capable of supporting bottle weights up to 1.5 kg.

* Connectivity: Ensure that Bluetooth is enabled on your mobile device to allow for data synchronization. Open the app, navigate to Settings, and tap Connect Device.

* Calibration: The system is designed to be fully passive. It will automatically zero out and set baselines when you place your bottle down.

### 2. Using the Mobile Application
* Hydration Dashboard: Your daily progress is displayed via the central hydration circle on the Home tab. This indicates the percentage of your goal completed and the current oz consumed.

* Manual Logging: Drink something away from your smart base? Use the Quick-Add Favorite buttons below the circle. You can customize these (Water, Coffee, Soda, etc.) in the Settings tab, and even track Caffeine and Alcohol.

* Recent Logs: Scroll down on the Home tab to view a detailed, timestamped list of your individual drinking events. You can edit or delete accidental logs here.

* Analytics: Check the Stats tab (middle icon) to view your historical consumption data, day-over-day percentage changes, and a weekly bar chart to identify your long-term hydration habits.

* Goals & Notifications: Head to the Profile/Settings tab to adjust your Daily Goal (default 80 oz) and toggle smart push notifications (e.g., "Time to hydrate!") at intervals of your choosing.

### 3. Maintenance & Care
* Charging: To maintain continuous system functionality, periodically recharge/replace the device’s internal battery. On a full charge, the base will operate continuously for a minimum of 24 hours.

* Durability: The hardware is specifically built to resist incidental moisture and condensation accumulation from cold bottles. Do not submerge the base.

* Offline Data Storage: If your phone's wireless connectivity is temporarily unavailable or you walk out of range, the app will continue to store your existing data locally. Keep your phone nearby to ensure the base can transmit new live drinking events.
