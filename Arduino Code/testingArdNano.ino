/*
   -------------------------------------------------------------------------------------
   HX711_ADC Streamlined for Specific Project
   Code for ardunio nano atmega 328p to read from weight sensor and send to nano 33ble
   -------------------------------------------------------------------------------------
*/

#include <HX711_ADC.h>
#include <SoftwareSerial.h>

// SoftwareSerial for communicating with FlowNano
// RX pin 2 (not used), TX pin 3 → Connect pin 3 to Nano 33 IoT RX1
SoftwareSerial nanoSerial(2, 3); // RX, TX

//pins:
const int HX711_dout = 4; //mcu > HX711 dout pin
const int HX711_sck = 5; //mcu > HX711 sck pin

//HX711 constructor:
HX711_ADC LoadCell(HX711_dout, HX711_sck);

unsigned long t = 0;
String inputBuffer = "";

void setup() {
  Serial.begin(9600); delay(10);
  nanoSerial.begin(9600); // Initialize SoftwareSerial to send to FlowNano
  Serial.println();
  Serial.println("Starting...");

  LoadCell.begin();
  
  // precision right after power-up can be improved by adding a few seconds of stabilizing time
  unsigned long stabilizingtime = 2000; 
  boolean _tare = true; //set this to false if you don't want tare to be performed in the next step
  LoadCell.start(stabilizingtime, _tare);
  
  if (LoadCell.getTareTimeoutFlag() || LoadCell.getSignalTimeoutFlag()) {
    Serial.println("Timeout, check MCU>HX711 wiring and pin designations");
    while (1);
  }
  else {
    // Hard-coded calibration factor
    LoadCell.setCalFactor(395.0); 
    Serial.println("Startup is complete");
  }
}

void loop() {
  static boolean newDataReady = 0;
  
  // Set to 2000 to send every 2 seconds
  const int sendInterval = 2000; 

  // check for new data/start next conversion (non-blocking):
  if (LoadCell.update()) newDataReady = true;

  // get smoothed value from the dataset and send to FlowNano:
  if (newDataReady) {
    if (millis() > t + sendInterval) {
      float weightKg = LoadCell.getData();
      float weightOz = weightKg * 35.274; // Convert kg to oz for consistency
      
      Serial.print("Load Cell: ");
      Serial.print(weightOz, 1);
      Serial.print(" oz (");
      Serial.print(weightKg, 4);
      Serial.println(" kg)");
      
      // Send to FlowNano with W: prefix so it can filter debug messages
      nanoSerial.print("W:");
      nanoSerial.println(weightOz, 1);
      
      newDataReady = 0;
      t = millis();
    }
  }
  
  // Optional: receive calibration commands from serial terminal (for debugging)
  while (Serial.available() > 0) {
    char c = Serial.read();
    
    // When newline received, process the buffered input
    if (c == '\n' || c == '\r') {
      if (inputBuffer.length() > 0) {
        inputBuffer.trim();
        if (inputBuffer == "t") {
          LoadCell.tareNoDelay();
          Serial.println("Tare initiated...");
        } else {
          Serial.println("Commands: 't' to tare the scale");
        }
        inputBuffer = "";
      }
    } else {
      inputBuffer += c;
    }
  }

  // check if last tare operation is complete
  if (LoadCell.getTareStatus() == true) {
    Serial.println("Tare complete");
  }
}
