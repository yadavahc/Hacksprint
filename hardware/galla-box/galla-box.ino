/*
 * Galla Box firmware — GALLA counter device.
 *
 * Board:  ESP32-WROOM-32 DevKitC (CP2102 USB-UART)
 * Talks to the GALLA web app over USB serial (115200 baud) with newline-delimited JSON,
 * the same protocol as src/lib/hardware/gallaBox.ts.
 *
 *   App → device   {"cmd":"ping"}
 *                  {"cmd":"display","l1":"Udhaar Rs 6,480","l2":"Recovered Rs 9,350"}
 *                  {"cmd":"led","color":"green"|"amber"|"red"|"off"}
 *                  {"cmd":"announce","amount":550,"from":"Lakshmi P"}
 *   Device → app   {"evt":"hello","fw":"galla-box/1.0.0","id":"A4CF12..."}
 *                  {"evt":"ptt","state":"down"|"up"}
 *                  {"evt":"ack","cmd":"announce"}   {"evt":"error","msg":"..."}
 *
 * Libraries: Adafruit SSD1306 + Adafruit GFX, Adafruit NeoPixel, DFRobotDFPlayerMini, ArduinoJson (v7).
 *
 * microSD card for the DFPlayer (FAT32), folder /mp3:
 *   0001.mp3 … 0099.mp3  spoken numbers 1–99 (Hindi numbers are irregular, so each is its own clip)
 *   0100 "sau" (hundred) · 0101 "hazaar" (thousand) · 0102 "rupaye praapt hue" (rupees received)
 *   0103 "Galla mein" · 0104 chime · 0105 "lakh"
 */

#include <Adafruit_GFX.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include <DFRobotDFPlayerMini.h>
#include <Wire.h>

#define FW_VERSION "galla-box/1.0.0"

// ---- Pin map (see README → Hardware) ----
constexpr int PIN_OLED_SDA = 21;
constexpr int PIN_OLED_SCL = 22;
constexpr int PIN_DF_RX = 16;   // ESP32 RX2  ← DFPlayer TX
constexpr int PIN_DF_TX = 17;   // ESP32 TX2  → DFPlayer RX (through 1 kΩ)
constexpr int PIN_DF_BUSY = 4;  // DFPlayer BUSY, LOW while playing
constexpr int PIN_PTT = 27;     // push-to-talk button to GND, internal pull-up
constexpr int PIN_LED = 25;     // WS2812B data (through 330 Ω)

// ---- Clip numbers on the microSD ----
constexpr uint16_t CLIP_HUNDRED = 100, CLIP_THOUSAND = 101, CLIP_RUPEES_RECEIVED = 102, CLIP_PREFIX = 103, CLIP_CHIME = 104, CLIP_LAKH = 105;

Adafruit_SSD1306 oled(128, 64, &Wire, -1);
Adafruit_NeoPixel led(1, PIN_LED, NEO_GRB + NEO_KHZ800);
DFRobotDFPlayerMini player;
HardwareSerial dfSerial(2);

// Clip queue: the DFPlayer plays one file at a time, so announcements are chained.
uint16_t queue[24];
uint8_t qHead = 0, qLen = 0;
bool playing = false;
unsigned long playStartedAt = 0;

String line1 = "GALLA  ready", line2 = "Press button to speak";
String rx;
bool pttDown = false;
unsigned long pttChangedAt = 0;

void emit(const JsonDocument& doc) {
  serializeJson(doc, Serial);
  Serial.print('\n');
}

void hello() {
  JsonDocument d;
  d["evt"] = "hello";
  d["fw"] = FW_VERSION;
  char id[13];
  uint64_t mac = ESP.getEfuseMac();
  snprintf(id, sizeof id, "%04X%08X", (uint16_t)(mac >> 32), (uint32_t)mac);
  d["id"] = id;
  emit(d);
}

void drawScreen() {
  oled.clearDisplay();
  oled.fillRect(0, 0, 128, 14, SSD1306_WHITE);
  oled.setTextColor(SSD1306_BLACK);
  oled.setTextSize(1);
  oled.setCursor(4, 3);
  oled.print("GALLA");
  oled.setTextColor(SSD1306_WHITE);
  oled.setCursor(0, 24);
  oled.print(line1.substring(0, 21));
  oled.setCursor(0, 44);
  oled.print(line2.substring(0, 21));
  oled.display();
}

void setLed(const char* color) {
  uint32_t c = 0;
  if (!strcmp(color, "green")) c = led.Color(0, 160, 40);
  else if (!strcmp(color, "amber")) c = led.Color(200, 110, 0);
  else if (!strcmp(color, "red")) c = led.Color(200, 0, 0);
  led.setPixelColor(0, c);
  led.show();
}

void enqueue(uint16_t clip) {
  if (qLen < sizeof queue / sizeof queue[0]) queue[(qHead + qLen++) % 24] = clip;
}

/** Indian numbering: lakh, thousand, hundred, then 1–99 as single clips. */
void enqueueAmount(long amount) {
  if (amount >= 100000) { enqueue(amount / 100000); enqueue(CLIP_LAKH); amount %= 100000; }
  if (amount >= 1000) { enqueue(amount / 1000); enqueue(CLIP_THOUSAND); amount %= 1000; }
  if (amount >= 100) { enqueue(amount / 100); enqueue(CLIP_HUNDRED); amount %= 100; }
  if (amount > 0) enqueue(amount);
}

void pumpAudio() {
  // BUSY goes LOW while a clip plays; give the module 150 ms to raise it after a play command.
  if (playing && millis() - playStartedAt > 150 && digitalRead(PIN_DF_BUSY) == HIGH) playing = false;
  if (playing || qLen == 0) return;
  player.playMp3Folder(queue[qHead]);
  qHead = (qHead + 1) % 24;
  qLen--;
  playing = true;
  playStartedAt = millis();
}

void handle(const String& msg) {
  JsonDocument doc;
  if (deserializeJson(doc, msg)) return;
  const char* cmd = doc["cmd"] | "";
  if (!strcmp(cmd, "ping")) {
    hello();
    return;
  }
  if (!strcmp(cmd, "display")) {
    line1 = (const char*)(doc["l1"] | "");
    line2 = (const char*)(doc["l2"] | "");
    drawScreen();
  } else if (!strcmp(cmd, "led")) {
    setLed(doc["color"] | "off");
  } else if (!strcmp(cmd, "announce")) {
    long amount = lround(doc["amount"] | 0.0);
    if (amount <= 0) return;
    enqueue(CLIP_CHIME);
    enqueue(CLIP_PREFIX);
    enqueueAmount(amount);
    enqueue(CLIP_RUPEES_RECEIVED);
    line2 = "+Rs " + String(amount) + " received";
    drawScreen();
  } else {
    JsonDocument e;
    e["evt"] = "error";
    e["msg"] = "unknown cmd";
    emit(e);
    return;
  }
  JsonDocument ack;
  ack["evt"] = "ack";
  ack["cmd"] = cmd;
  emit(ack);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PTT, INPUT_PULLUP);
  pinMode(PIN_DF_BUSY, INPUT);

  Wire.begin(PIN_OLED_SDA, PIN_OLED_SCL);
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  drawScreen();

  led.begin();
  led.setBrightness(80);
  setLed("off");

  dfSerial.begin(9600, SERIAL_8N1, PIN_DF_RX, PIN_DF_TX);
  if (player.begin(dfSerial)) {
    player.volume(24);  // 0–30
    enqueue(CLIP_CHIME);
  } else {
    JsonDocument e;
    e["evt"] = "error";
    e["msg"] = "DFPlayer not found - check wiring and microSD";
    emit(e);
  }
  hello();
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      handle(rx);
      rx = "";
    } else if (rx.length() < 256) {
      rx += c;
    }
  }

  // Debounced push-to-talk.
  bool down = digitalRead(PIN_PTT) == LOW;
  if (down != pttDown && millis() - pttChangedAt > 30) {
    pttDown = down;
    pttChangedAt = millis();
    JsonDocument e;
    e["evt"] = "ptt";
    e["state"] = down ? "down" : "up";
    emit(e);
  }

  pumpAudio();
}
