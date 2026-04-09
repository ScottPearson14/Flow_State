#include <HX711_ADC.h>

// Pins for Nano 33 BLE
const int HX711_dout = 4; 
const int HX711_sck = 5; 

HX711_ADC LoadCell(HX711_dout, HX711_sck);

void setup() {
  Serial.begin(57600);
  while (!Serial); // Wait for Serial Monitor

  Serial.println("--- Flow State Calibration ---");
  LoadCell.begin();
  
  unsigned long stabilizingtime = 2000; 
  LoadCell.start(stabilizingtime, true); // true = perform tare

  if (LoadCell.getTareTimeoutFlag()) {
    Serial.println("Timeout: Check wiring to pins 4 and 5");
    while (1);
  }

  Serial.println("1. Remove all weight from the scale.");
  Serial.println("2. Place a known mass on the scale (e.g., a 500ml water bottle).");
  Serial.println("3. Type the weight of that mass in grams (e.g., 500.0) and press Enter.");
}

void loop() {
  static boolean newDataReady = 0;
  if (LoadCell.update()) newDataReady = true;

  if (Serial.available() > 0) {
    float known_mass = Serial.parseFloat();
    if (known_mass != 0) {
      Serial.print("Calculating for mass: ");
      Serial.println(known_mass);
      
      LoadCell.refreshDataSet(); 
      float newCalibrationValue = LoadCell.getNewCalibration(known_mass);
      
      Serial.println("--------------------------------------------");
      Serial.print("YOUR CALIBRATION FACTOR: ");
      Serial.println(newCalibrationValue);
      Serial.println("--------------------------------------------");
      Serial.println("Copy this number and put it in your main code!");
    }
  }
}
