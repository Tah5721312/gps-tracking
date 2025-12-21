# دليل تكامل أجهزة GPS مع النظام

## 📡 كيفية إرسال البيانات من جهاز GPS

### 1. إعداد المركبة في النظام

قبل إرسال البيانات، يجب إضافة المركبة في النظام مع رقم IMEI الخاص بجهاز GPS:

```json
POST /api/vehicles
{
  "name": "شاحنة 1",
  "plateNumber": "أ ب ج 123",
  "deviceImei": "123456789012345",
  "driverName": "أحمد محمد"
}
```

### 2. إرسال بيانات GPS

#### الطريقة الأولى: POST Request (JSON) - موصى بها

**Endpoint:** `POST /api/gps`

**Headers:**

```
Content-Type: application/json
```

**Body Example:**

```json
{
  "deviceImei": "123456789012345",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "speed": 60.5,
  "batteryLevel": 85,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**cURL Example:**

```bash
curl -X POST https://your-domain.com/api/gps \
  -H "Content-Type: application/json" \
  -d '{
    "deviceImei": "123456789012345",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "speed": 60.5,
    "batteryLevel": 85,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

#### الطريقة الثانية: GET Request (Query Parameters)

**Endpoint:** `GET /api/gps`

**URL Example:**

```
https://your-domain.com/api/gps?deviceImei=123456789012345&latitude=30.0444&longitude=31.2357&speed=60.5&batteryLevel=85
```

**cURL Example:**

```bash
curl "https://your-domain.com/api/gps?deviceImei=123456789012345&latitude=30.0444&longitude=31.2357&speed=60.5&batteryLevel=85"
```

### 3. الحقول المدعومة

| الحقل          | مطلوب  | الوصف                  | أمثلة                  |
| -------------- | ------ | ---------------------- | ---------------------- |
| `deviceImei`   | ✅ نعم | رقم IMEI الفريد للجهاز | `123456789012345`      |
| `latitude`     | ✅ نعم | خط العرض               | `30.0444`              |
| `longitude`    | ✅ نعم | خط الطول               | `31.2357`              |
| `speed`        | ❌ لا  | السرعة (كم/س)          | `60.5`                 |
| `batteryLevel` | ❌ لا  | مستوى البطارية (%)     | `85`                   |
| `timestamp`    | ❌ لا  | وقت القراءة (ISO 8601) | `2024-01-15T10:30:00Z` |

**أسماء بديلة مدعومة:**

- `deviceImei` يمكن أن يكون: `imei`, `id`
- `latitude` يمكن أن يكون: `lat`
- `longitude` يمكن أن يكون: `lng`, `lon`
- `speed` يمكن أن يكون: `spd`
- `batteryLevel` يمكن أن يكون: `battery`, `bat`

### 4. إعداد جهاز GPS

#### مثال على كود Arduino/ESP32:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "https://your-domain.com/api/gps";
const char* deviceImei = "123456789012345";

HardwareSerial gpsSerial(1);
TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17); // RX, TX

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void loop() {
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      if (gps.location.isValid()) {
        sendGPSData();
        delay(10000); // إرسال كل 10 ثواني
      }
    }
  }
}

void sendGPSData() {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{";
  jsonData += "\"deviceImei\":\"" + String(deviceImei) + "\",";
  jsonData += "\"latitude\":" + String(gps.location.lat(), 6) + ",";
  jsonData += "\"longitude\":" + String(gps.location.lng(), 6) + ",";
  jsonData += "\"speed\":" + String(gps.speed.kmph()) + ",";
  jsonData += "\"batteryLevel\":100";
  jsonData += "}";

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.println("GPS data sent successfully");
  } else {
    Serial.println("Error sending GPS data");
  }

  http.end();
}
```

#### مثال على كود Python (لأجهزة GPS عبر USB/Serial):

```python
import requests
import serial
from pynmea2 import NMEAStreamReader

# إعدادات
DEVICE_IMEI = "123456789012345"
API_URL = "https://your-domain.com/api/gps"
SERIAL_PORT = "/dev/ttyUSB0"  # أو COM3 على Windows

def send_gps_data(lat, lng, speed=0, battery=100):
    """إرسال بيانات GPS إلى السيرفر"""
    data = {
        "deviceImei": DEVICE_IMEI,
        "latitude": lat,
        "longitude": lng,
        "speed": speed,
        "batteryLevel": battery
    }

    try:
        response = requests.post(API_URL, json=data, timeout=5)
        if response.status_code == 200:
            print(f"✅ GPS data sent: {lat}, {lng}")
        else:
            print(f"❌ Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Error sending data: {e}")

# قراءة بيانات GPS من Serial
ser = serial.Serial(SERIAL_PORT, 9600)
streamreader = NMEAStreamReader()

while True:
    line = ser.readline().decode('utf-8')
    if line.startswith('$GPRMC'):
        msg = streamreader.next(line)
        if msg.latitude and msg.longitude:
            send_gps_data(msg.latitude, msg.longitude, msg.spd_over_grnd or 0)
```

### 5. استجابة API

**نجاح (200 OK):**

```json
{
  "success": true,
  "message": "OK"
}
```

**خطأ - مركبة غير موجودة (404):**

```json
{
  "error": "Vehicle not found with IMEI: 123456789012345"
}
```

**خطأ - بيانات ناقصة (400):**

```json
{
  "error": "Missing required fields: deviceImei, latitude, longitude"
}
```

### 6. نصائح مهمة

1. **التكرار:** أرسل البيانات كل 5-10 ثواني للحصول على تتبع دقيق
2. **الأمان:** استخدم HTTPS دائماً
3. **معالجة الأخطاء:** أعد المحاولة عند فشل الإرسال
4. **التحقق من IMEI:** تأكد من أن رقم IMEI مسجل في النظام قبل الإرسال
5. **التوقيت:** استخدم UTC للتواريخ والأوقات

### 7. اختبار API

يمكنك اختبار API باستخدام:

```bash
# POST Request
curl -X POST http://localhost:3000/api/gps \
  -H "Content-Type: application/json" \
  -d '{
    "deviceImei": "123456789012345",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "speed": 60,
    "batteryLevel": 85
  }'

# GET Request
curl "http://localhost:3000/api/gps?deviceImei=123456789012345&latitude=30.0444&longitude=31.2357&speed=60"
```

### 8. أنواع أجهزة GPS المدعومة

- أجهزة GPS Tracker (GT06, GT02, وغيرها)
- أجهزة Arduino/ESP32 مع GPS Module
- أجهزة Raspberry Pi مع GPS Module
- أي جهاز يمكنه إرسال HTTP Requests

---

**ملاحظة:** تأكد من تشغيل `pnpm prisma migrate dev` بعد أي تغييرات على Schema.
