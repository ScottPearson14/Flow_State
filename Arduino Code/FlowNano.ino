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
// Add these variables to your FlowNano.ino
float lastStableWeight = 0.0;
unsigned long stabilityTimer = 0;
const float CHANGE_THRESHOLD = 0.005; // Changed to 5 grams (0.005 kg)

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
    bool baselineInitialized = false; // Track if we've set the baseline for this connection

    // While the app is connected
    while (central.connected()) {
      
      // Keep reading serial data while connected so we always have the freshest weight
      processSerialData();

      unsigned long now = millis();

      // Initialize baseline only once per connection
      if (!baselineInitialized && currentWeight > 0.0) {
        lastStableWeight = currentWeight;
        baselineInitialized = true;
        stabilityTimer = now;
        Serial.print("Initial weight baseline set to: ");
        Serial.print(currentWeight, 4);
        Serial.println(" kg");
      } else if (baselineInitialized) {
        // Only do drink/refill detection after baseline is set
        if ((lastStableWeight - currentWeight) > CHANGE_THRESHOLD) {
          // Weight decreased - this is a drink!
          if (now - stabilityTimer > 30000) { // 30 second settle time
            lastStableWeight = currentWeight;
            weightCharacteristic.writeValue(currentWeight);
            Serial.print("Drink detected! Weight decreased to: ");
            Serial.print(currentWeight, 4);
            Serial.println(" kg");
          }
        } else if ((currentWeight - lastStableWeight) > CHANGE_THRESHOLD) {
          // Weight increased - this is a refill, just update reference without sending to app
          lastStableWeight = currentWeight;
          stabilityTimer = now;
          Serial.print("Refill detected! Weight increased to: ");
          Serial.print(currentWeight, 4);
          Serial.println(" kg");
        } else {
          // Reset timer if weight is currently moving/unstable
          stabilityTimer = now;
        }
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

    Serial.print("Received from Serial1: ");
    Serial.println(msg);

    if (isValidNumber(msg)) {
      // Convert the valid string into a float and save it globally
      currentWeight = msg.toFloat();
      Serial.print("Updated currentWeight to: ");
      Serial.println(currentWeight, 4);
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
