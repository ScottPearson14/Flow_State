#include <HX711_ADC.h>
#include <SoftwareSerial.h>

SoftwareSerial nanoSerial(2, 3); // RX, TX — pin 3 → Nano 33 BLE RX1

const int HX711_dout = 4;
const int HX711_sck = 5;
HX711_ADC LoadCell(HX711_dout, HX711_sck);

unsigned long t = 0;
String inputBuffer = "";

void setup() {
  Serial.begin(9600); delay(10);
  nanoSerial.begin(9600);
  Serial.println("Starting...");
  LoadCell.begin();

  unsigned long stabilizingtime = 2000;
  boolean _tare = true;
  LoadCell.start(stabilizingtime, _tare);

  if (LoadCell.getTareTimeoutFlag() || LoadCell.getSignalTimeoutFlag()) {
    Serial.println("Timeout, check MCU>HX711 wiring and pin designations");
    while (1);
  } else {
    LoadCell.setCalFactor(395.0);
    Serial.println("Startup is complete");
  }
}

void loop() {
  static boolean newDataReady = 0;
  const int sendInterval = 2000;

  if (LoadCell.update()) newDataReady = true;

  if (newDataReady) {
    if (millis() > t + sendInterval) {
      float weightKg = LoadCell.getData();
      float weightOz = weightKg * 35.274;

      Serial.print("Load Cell: ");
      Serial.print(weightOz, 1);
      Serial.println(" oz");

      // Send real sensor data to BLE Nano
      nanoSerial.print("W:");
      nanoSerial.println(weightOz, 1);

      newDataReady = 0;
      t = millis();
    }
  }

  // Manual override: type a number (oz) in serial monitor to test, or 't' to tare
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (inputBuffer.length() > 0) {
        inputBuffer.trim();
        if (inputBuffer == "t") {
          LoadCell.tareNoDelay();
          Serial.println("Tare initiated...");
        } else {
          float val = inputBuffer.toFloat();
          if (val > 0) {
            Serial.print("Manual send: ");
            Serial.print(val, 1);
            Serial.println(" oz");
            nanoSerial.print("W:");      // ← must go to nanoSerial, not Serial
            nanoSerial.println(val, 1);
          } else {
            Serial.println("Invalid. Enter oz value or 't' to tare.");
          }
        }
        inputBuffer = "";
      }
    } else {
      inputBuffer += c;
    }
  }

  if (LoadCell.getTareStatus() == true) {
    Serial.println("Tare complete");
  }
}
