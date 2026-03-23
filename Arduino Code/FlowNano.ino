/*
 * Flow State - Smart Hydration
 * Arduino Nano 33 BLE + HX711 Load Cell
 */

#include <HX711_ADC.h>
#include <ArduinoBLE.h>

// --- Hardware Pins ---
const int HX711_dout = 4; 
const int HX711_sck = 5; 

// --- BLE UUIDs (Standard Weight Scale) ---
BLEService weightService("181D");
BLEFloatCharacteristic weightCharacteristic("2A9D", BLERead | BLENotify);

// --- Global Objects ---
HX711_ADC LoadCell(HX711_dout, HX711_sck);
unsigned long lastBleUpdate = 0;
const long bleInterval = 500; // Send weight every 500ms

void setup() {
  Serial.begin(57600);
  // Nano 33 BLE needs a moment for Serial
  while (!Serial); 

  Serial.println("Initializing Flow State Hydration Tracker...");

  // 1. Initialize HX711
  LoadCell.begin();
  unsigned long stabilizingtime = 2000; 
  boolean _tare = true; 
  LoadCell.start(stabilizingtime, _tare);

  if (LoadCell.getTareTimeoutFlag() || LoadCell.getSignalTimeoutFlag()) {
    Serial.println("Error: Check HX711 wiring!");
    while (1);
  }

  // NOTE: On Nano 33 BLE, we can't use EEPROM. 
  // Once you find your cal factor using the 'r' command, 
  // hardcode it here: LoadCell.setCalFactor(YOUR_VALUE_HERE);
  LoadCell.setCalFactor(1.0); 

  // 2. Initialize BLE
  if (!BLE.begin()) {
    Serial.println("Failed to start BLE!");
    while (1);
  }

  BLE.setLocalName("WeightScale");
  BLE.setAdvertisedService(weightService);
  weightService.addCharacteristic(weightCharacteristic);
  BLE.addService(weightService);
  weightCharacteristic.writeValue(0.0);
  BLE.advertise();

  Serial.println("Setup Complete. Advertising as 'WeightScale'...");
}

void loop() {
  // Update weight data continuously
  static boolean newDataReady = 0;
  if (LoadCell.update()) newDataReady = true;

  // Handle BLE Connection
  BLEDevice central = BLE.central();
  if (central) {
    while (central.connected()) {
      // 1. Keep the weight sensor updating
      if (LoadCell.update()) newDataReady = true;

      // 2. Send data to iOS every 500ms
      if (newDataReady && (millis() - lastBleUpdate > bleInterval)) {
        float weight = LoadCell.getData(); // Weight in kg
        weightCharacteristic.writeValue(weight);
        
        Serial.print("Weight sent: ");
        Serial.print(weight);
        Serial.println(" kg");

        newDataReady = false;
        lastBleUpdate = millis();
      }

      // 3. Handle Serial Commands (Tare/Calibrate)
      handleSerialCommands();
    }
  }
}

void handleSerialCommands() {
  if (Serial.available() > 0) {
    char inByte = Serial.read();
    if (inByte == 't') {
      LoadCell.tareNoDelay();
      Serial.println("Taring...");
    }
  }
  if (LoadCell.getTareStatus()) {
    Serial.println("Tare complete");
  }
}