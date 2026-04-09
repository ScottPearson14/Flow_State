/*
   -------------------------------------------------------------------------------------
   HX711_ADC Streamlined for Specific Project
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
  /*
  static boolean newDataReady = 0;
  
  // Set to 2000 to print every 2 seconds
  const int serialPrintInterval = 2000; 

  // check for new data/start next conversion:
  if (LoadCell.update()) newDataReady = true;

  // get smoothed value from the dataset:
  if (newDataReady) {
    if (millis() > t + serialPrintInterval) {
      float weight = LoadCell.getData();
      Serial.println(weight);
      // Optionally send real sensor data to FlowNano
      // Serial1.println(weight);
      newDataReady = 0;
      t = millis();
    }
  }
*/
  
  // receive command from serial terminal
  if (Serial.available() > 0) {
    // Read the entire line at once
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input == "t") {
      LoadCell.tareNoDelay(); //tare
    } else if (input.length() > 0) {
      // Send the weight number to FlowNano
      nanoSerial.println(input);
    }
  }

  // check if last tare operation is complete
  if (LoadCell.getTareStatus() == true) {
    Serial.println("Tare complete");
  }
}
