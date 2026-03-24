#include <ArduinoBLE.h>

// ---------------------------------------------------------------------------
// BLE Service & Characteristic
// ---------------------------------------------------------------------------
BLEService weightService("181D");
// Standard 4-byte float: weight in kg
BLEFloatCharacteristic weightCharacteristic("2A9D", BLERead | BLENotify);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Changed to 30000ms (30 seconds)
const unsigned long SEND_INTERVAL_MS = 30000; 

// ---------------------------------------------------------------------------
// Simulation Logic
// ---------------------------------------------------------------------------
float readWeight() {
  // Returns 0.2835 kg, which is exactly 10 oz
  return 0.2835f; 
}

void setup() {
  Serial.begin(9600);
  while (!Serial); 

  if (!BLE.begin()) {
    Serial.println("BLE failed!");
    while (true);
  }

  BLE.setLocalName("WeightScale");
  BLE.setAdvertisedService(weightService);
  weightService.addCharacteristic(weightCharacteristic);
  BLE.addService(weightService);
  weightCharacteristic.writeValue(0.0f);

  BLE.advertise();
  Serial.println("Advertising... sending 10oz (0.2835kg) every 30s once connected.");
}

void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to: ");
    Serial.println(central.address());

    unsigned long lastSent = 0;

    while (central.connected()) {
      unsigned long now = millis();

      if (now - lastSent >= SEND_INTERVAL_MS) {
        lastSent = now;

        float weight = readWeight(); 
        weightCharacteristic.writeValue(weight);

        Serial.print("Sent simulated 10oz: ");
        Serial.print(weight, 4);
        Serial.println(" kg");
      }
    }
    Serial.println("Disconnected.");
  }
}