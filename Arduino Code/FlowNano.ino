#include <ArduinoBLE.h>

BLEService weightService("181D");
BLEFloatCharacteristic weightCharacteristic("2A9D", BLERead | BLENotify);

enum ScaleState { EMPTY, LOADED };

const float EMPTY_THRESHOLD_KG = 0.050;
const float DRINK_THRESHOLD_OZ = 1.0;
const float REFILL_THRESHOLD_OZ = 1.0;
const int STABILITY_THRESHOLD = 3;
const unsigned long DEBOUNCE_TIME_MS = 1000;

float currentWeight = 0.0;
float baselineWeight = 0.0;
float previousStableWeight = 0.0;
ScaleState scaleState = EMPTY;
bool newWeightAvailable = false;
int stabilityCounter = 0;
unsigned long lastEventTime = 0;

void setup() {
  Serial.begin(9600);
  Serial1.begin(9600);
  while (!Serial && millis() < 3000);

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
  Serial.println("Advertising...");
}

void loop() {
  processSerialData();

  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected: ");
    Serial.println(central.address());

    bool baselineInitialized = false;
    unsigned long lastLogTime = 0;

    while (central.connected()) {
      processSerialData();

      ScaleState previousState = scaleState;
      scaleState = (currentWeight < EMPTY_THRESHOLD_KG) ? EMPTY : LOADED;

      if (newWeightAvailable) {
        newWeightAvailable = false;

        if (previousState == EMPTY && scaleState == LOADED) {
          baselineWeight = currentWeight;
          previousStableWeight = currentWeight;
          stabilityCounter = 0;
          baselineInitialized = true;
          Serial.print("[LOADED] ");
          Serial.print(currentWeight * 35.274, 1);
          Serial.println(" oz");
          weightCharacteristic.writeValue(currentWeight);

        } else if (scaleState == LOADED) {
          weightCharacteristic.writeValue(currentWeight);

          float deltaOz = (baselineWeight - currentWeight) * 35.274;
          float deltaSinceLastStable = (previousStableWeight - currentWeight) * 35.274;

          if (abs(deltaSinceLastStable) > 0.2) {
            stabilityCounter++;
          } else {
            stabilityCounter = 0;
          }

          unsigned long now = millis();
          if (stabilityCounter >= STABILITY_THRESHOLD && (now - lastEventTime) > DEBOUNCE_TIME_MS) {
            if (deltaOz > DRINK_THRESHOLD_OZ) {
              Serial.print("[DRINK] -");
              Serial.print(deltaOz, 1);
              Serial.println(" oz");
              previousStableWeight = currentWeight;
              baselineWeight = currentWeight;
              stabilityCounter = 0;
              lastEventTime = now;
            } else if (deltaOz < -REFILL_THRESHOLD_OZ) {
              Serial.print("[REFILL] +");
              Serial.print(-deltaOz, 1);
              Serial.println(" oz");
              previousStableWeight = currentWeight;
              baselineWeight = currentWeight;
              stabilityCounter = 0;
              lastEventTime = now;
            }
          }

        } else if (previousState == LOADED && scaleState == EMPTY) {
          Serial.println("[EMPTY] Scale cleared");
          baselineInitialized = false;
          stabilityCounter = 0;
        }
      }

      if (millis() > lastLogTime + 5000) {
        Serial.print("[STATE] ");
        Serial.print(scaleState == EMPTY ? "EMPTY" : "LOADED");
        Serial.print(" | ");
        Serial.print(currentWeight * 35.274, 1);
        Serial.println(" oz");
        lastLogTime = millis();
      }
    }
    Serial.println("Disconnected.");
  }
}

void processSerialData() {
  static String msgBuffer = "";

  while (Serial1.available()) {
    char c = (char)Serial1.read();

    if (c == '\n') {
      msgBuffer.trim();
      if (msgBuffer.startsWith("W:")) {
        String valueStr = msgBuffer.substring(2);
        if (isValidNumber(valueStr)) {
          float ozValue = valueStr.toFloat();
          currentWeight = ozValue / 35.274;
          newWeightAvailable = true;
          Serial.print("[RX] ");
          Serial.print(ozValue, 1);
          Serial.println(" oz");
        }
      }
      msgBuffer = "";
    } else if (c != '\r') {
      msgBuffer += c;
    }
  }
}

bool isValidNumber(String str) {
  if (str.length() == 0) return false;
  bool hasDecimal = false;
  int start = (str[0] == '-') ? 1 : 0;
  for (int i = start; i < str.length(); i++) {
    if (str[i] == '.') {
      if (hasDecimal) return false;
      hasDecimal = true;
    } else if (!isDigit(str[i])) {
      return false;
    }
  }
  return true;
}
