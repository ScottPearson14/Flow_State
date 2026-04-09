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
// Interval to send data to the app over BLE. 
// Note: Change this to 2000 if you want it to match your 5V board's 2-second update rate!
const unsigned long SEND_INTERVAL_MS = 2000; 

// Global variable to hold the most recent valid weight from the 5V board
float currentWeight = 0.0;

void setup() {
  Serial.begin(9600);
  Serial1.begin(9600); // Initialize hardware serial to listen to the 5V Nano
  
  // Wait up to 3 seconds for the Serial Monitor to open. 
  // The timeout ensures the code still runs if powered by a battery/wall plug.
  while (!Serial && millis() < 3000); 

  if (!BLE.begin()) {
    Serial.println("BLE failed!");
    while (true);
  }

  BLE.setLocalName("WeightScale");
  BLE.setAdvertisedService(weightService);
  weightService.addCharacteristic(weightCharacteristic);
  BLE.addService(weightService);
  
  // Set an initial value
  weightCharacteristic.writeValue(0.0f);

  BLE.advertise();
  Serial.println("Advertising... waiting for connection.");
}

void loop() {
  // 1. Constantly check for new data from the 5V Nano
  // We do this outside the BLE loop so the Serial1 buffer never overflows
  processSerialData();

  // 2. Handle BLE Connection
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to: ");
    Serial.println(central.address());

    unsigned long lastSent = 0;

    // While the app is connected
    while (central.connected()) {
      
      // Keep reading serial data while connected so we always have the freshest weight
      processSerialData();

      unsigned long now = millis();

      // If it's time to send a BLE update
      if (now - lastSent >= SEND_INTERVAL_MS) {
        lastSent = now;

        // Send the latest received weight over BLE
        weightCharacteristic.writeValue(currentWeight);

        Serial.print("Sent real weight via BLE: ");
        Serial.print(currentWeight, 4);
        Serial.println(" kg");
      }
    }
    Serial.println("Disconnected.");
  }
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

// Checks Serial1 for incoming data and updates the global weight variable
void processSerialData() {
  if (Serial1.available()) {
    String msg = Serial1.readStringUntil('\n');
    msg.trim();

    if (isValidNumber(msg)) {
      // Convert the valid string into a float and save it globally
      currentWeight = msg.toFloat(); 
    } else {
      Serial.println("Ignored invalid data: " + msg);
    }
  }
}

// Validates that the string is a number (allows one decimal point)
bool isValidNumber(String str) {
  if (str.length() == 0) return false;
  
  bool hasDecimal = false;
  
  for (int i = 0; i < str.length(); i++) {
    if (str[i] == '.') {
      if (hasDecimal) return false; // Invalid if more than one decimal
      hasDecimal = true;
    } 
    else if (!isDigit(str[i])) {
      return false; // Invalid if it's a letter or weird character
    }
  }
  return true;
}
