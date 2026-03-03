/*
 * WeightBLESender.ino
 * Arduino Nano 33 BLE
 *
 * Reads weight from a load cell (placeholder) and sends the value
 * to a connected iOS device over Bluetooth Low Energy (BLE).
 *
 * Required Library: ArduinoBLE
 *   Install via: Arduino IDE > Tools > Manage Libraries > search "ArduinoBLE"
 *
 * BLE Structure:
 *   Service UUID:        "181D"        (Weight Scale — standard BLE GATT service)
 *   Characteristic UUID: "2A9D"       (Weight Measurement — standard BLE GATT characteristic)
 *   Properties:          READ + NOTIFY
 *
 * The iOS app should:
 *   1. Scan for a peripheral named "WeightScale"
 *   2. Connect and discover services
 *   3. Subscribe to notifications on characteristic "2A9D"
 *   4. Parse the incoming float (4 bytes, little-endian) as the weight in kg
 */

#include <ArduinoBLE.h>

// ---------------------------------------------------------------------------
// BLE Service & Characteristic
// ---------------------------------------------------------------------------

// Standard GATT UUIDs for a Weight Scale service and Weight Measurement characteristic
BLEService weightService("181D");

// 4-byte float value: weight in kg
// BLERead   — iOS can poll the value at any time
// BLENotify — Arduino pushes updates automatically when the value changes
BLEFloatCharacteristic weightCharacteristic("2A9D", BLERead | BLENotify);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// How often (ms) to take a new weight reading and notify the iOS app
const unsigned long SEND_INTERVAL_MS = 500;

// ---------------------------------------------------------------------------
// Placeholder load cell state (replace with real HX711 / amplifier code)
// ---------------------------------------------------------------------------

float simulatedWeight = 0.0f;   // kg — stands in for a real sensor reading

// ---------------------------------------------------------------------------
// PLACEHOLDER: Initialise the load cell hardware.
// Replace the body of this function with your HX711 (or other amplifier)
// setup code, e.g. scale.begin(DATA_PIN, CLOCK_PIN); scale.tare();
// ---------------------------------------------------------------------------
void initLoadCell() {
  Serial.println("[LoadCell] init — placeholder (no hardware yet)");
  simulatedWeight = 0.0f;
}

// ---------------------------------------------------------------------------
// PLACEHOLDER: Read a weight value from the load cell.
// Replace the body of this function with your real reading logic, e.g.:
//   return scale.get_units(5);   // average of 5 samples, in kg
//
// Returns weight in kilograms (kg).
// ---------------------------------------------------------------------------
float readWeight() {
  // Simulate a slowly rising weight for testing BLE without hardware
  simulatedWeight += 0.1f;
  if (simulatedWeight > 100.0f) simulatedWeight = 0.0f;
  return simulatedWeight;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(9600);
  while (!Serial);   // Wait for Serial Monitor (remove for standalone use)

  // --- Load cell ---------------------------------------------------------
  initLoadCell();

  // --- BLE ---------------------------------------------------------------
  if (!BLE.begin()) {
    Serial.println("[BLE] Failed to start! Check board & library.");
    while (true);   // Halt — nothing else to do
  }

  // Device name that iOS will see when scanning
  BLE.setLocalName("WeightScale");
  BLE.setAdvertisedService(weightService);

  // Attach characteristic to service, then service to BLE stack
  weightService.addCharacteristic(weightCharacteristic);
  BLE.addService(weightService);

  // Write an initial value before advertising
  weightCharacteristic.writeValue(0.0f);

  BLE.advertise();
  Serial.println("[BLE] Advertising as \"WeightScale\" — waiting for iOS connection...");
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
void loop() {
  // Accept / maintain a connection from the central (iOS device)
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("[BLE] Connected to central: ");
    Serial.println(central.address());

    unsigned long lastSent = 0;

    // Keep sending while the iOS device is connected
    while (central.connected()) {
      unsigned long now = millis();

      if (now - lastSent >= SEND_INTERVAL_MS) {
        lastSent = now;

        float weight = readWeight();          // kg — use your real function here
        weightCharacteristic.writeValue(weight);  // triggers BLE notification

        Serial.print("[Weight] Sent: ");
        Serial.print(weight, 2);
        Serial.println(" kg");
      }
    }

    Serial.println("[BLE] Central disconnected — resuming advertising.");
  }
}
