# 📡 أمثلة على API Requests لتطبيق Flutter

## 🔗 Base URL
```
https://gps-tracking-three.vercel.app
```

---

## 1️⃣ POST /api/gps (مُوصى به)

### **Endpoint:**
```
POST https://gps-tracking-three.vercel.app/api/gps
```

### **Headers:**
```json
{
  "Content-Type": "application/json"
}
```

### **أمثلة Request Body:**

#### **مثال 1: الحد الأدنى (مطلوب فقط)**
```json
{
  "deviceImei": "123456789012345",
  "latitude": 30.0444,
  "longitude": 31.2357
}
```

#### **مثال 2: مع السرعة والبطارية**
```json
{
  "deviceImei": "123456789012345",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "speed": 60.5,
  "batteryLevel": 85
}
```

#### **مثال 3: كامل مع Timestamp**
```json
{
  "deviceImei": "123456789012345",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "speed": 60.5,
  "batteryLevel": 85,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### **مثال 4: مركبة متوقفة**
```json
{
  "deviceImei": "123456789012345",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "speed": 0,
  "batteryLevel": 90
}
```

### **Response Success (200 OK):**
```json
{
  "success": true,
  "trackingPoint": {
    "id": 12345,
    "vehicleId": 1,
    "latitude": 30.0444,
    "longitude": 31.2357,
    "speed": 60.5,
    "batteryLevel": 85,
    "timestamp": "2025-01-15T10:30:00.000Z"
  },
  "vehicle": {
    "id": 1,
    "name": "مركبة 1",
    "plateNumber": "أ ب ج 1234",
    "status": "moving",
    "lastLatitude": 30.0444,
    "lastLongitude": 31.2357,
    "lastSpeed": 60.5,
    "lastUpdate": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Response Error (400 Bad Request):**
```json
{
  "error": "Missing required fields: deviceImei, latitude, longitude"
}
```

### **Response Error (404 Not Found):**
```json
{
  "error": "Vehicle not found with IMEI: 123456789012345"
}
```

### **Response Error (500 Internal Server Error):**
```json
{
  "error": "Internal server error",
  "details": "Error message here"
}
```

---

## 2️⃣ GET /api/gps (بديل)

### **Endpoint:**
```
GET https://gps-tracking-three.vercel.app/api/gps?deviceImei=XXX&latitude=XXX&longitude=XXX&speed=XXX&batteryLevel=XXX&timestamp=XXX
```

### **أمثلة:**

#### **مثال 1: الحد الأدنى**
```
GET https://gps-tracking-three.vercel.app/api/gps?deviceImei=123456789012345&latitude=30.0444&longitude=31.2357
```

#### **مثال 2: كامل**
```
GET https://gps-tracking-three.vercel.app/api/gps?deviceImei=123456789012345&latitude=30.0444&longitude=31.2357&speed=60.5&batteryLevel=85&timestamp=2025-01-15T10:30:00.000Z
```

### **Response Success (200 OK):**
```json
{
  "success": true,
  "message": "OK"
}
```

---

## 3️⃣ POST /api/gps/update (بديل)

### **Endpoint:**
```
POST https://gps-tracking-three.vercel.app/api/gps/update
```

### **Headers:**
```json
{
  "Content-Type": "application/json"
}
```

### **Request Body:**
```json
{
  "deviceImei": "123456789012345",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "speed": 60.5,
  "batteryLevel": 85,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### **Response Success (200 OK):**
```json
{
  "success": true,
  "trackingPoint": {
    "id": 12345,
    "vehicleId": 1,
    "latitude": 30.0444,
    "longitude": 31.2357,
    "speed": 60.5,
    "batteryLevel": 85,
    "timestamp": "2025-01-15T10:30:00.000Z"
  },
  "vehicle": {
    "id": 1,
    "name": "مركبة 1",
    "plateNumber": "أ ب ج 1234",
    "status": "moving",
    "lastLatitude": 30.0444,
    "lastLongitude": 31.2357,
    "lastSpeed": 60.5,
    "lastUpdate": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## 📋 Parameters Description

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `deviceImei` | string | ✅ Yes | - | رقم IMEI الفريد للمركبة (يجب أن يكون مسجل في قاعدة البيانات) |
| `latitude` | number | ✅ Yes | - | خط العرض (Latitude) |
| `longitude` | number | ✅ Yes | - | خط الطول (Longitude) |
| `speed` | number | ❌ No | 0 | السرعة بالكيلومتر/ساعة |
| `batteryLevel` | number | ❌ No | 100 | مستوى البطارية (0-100) |
| `timestamp` | string (ISO 8601) | ❌ No | Current Time | الوقت بصيغة ISO 8601 (مثال: "2025-01-15T10:30:00.000Z") |

---

## 🔄 Alternative Parameter Names (مدعومة)

الـ API يدعم أسماء بديلة للـ parameters:

| Standard Name | Alternative Names |
|---------------|-------------------|
| `deviceImei` | `imei`, `id` |
| `latitude` | `lat` |
| `longitude` | `lng`, `lon` |
| `speed` | `spd` |
| `batteryLevel` | `battery`, `bat` |
| `timestamp` | `time`, `date` |

**مثال:**
```json
{
  "imei": "123456789012345",
  "lat": 30.0444,
  "lng": 31.2357,
  "spd": 60.5,
  "bat": 85
}
```

---

## 💻 مثال Flutter Code

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> sendGPSData() async {
  final baseUrl = 'https://gps-tracking-three.vercel.app';
  final deviceImei = '123456789012345';
  
  // الحصول على الموقع من GPS
  final latitude = 30.0444;
  final longitude = 31.2357;
  final speed = 60.5;
  final batteryLevel = 85;
  
  final url = Uri.parse('$baseUrl/api/gps');
  
  final body = jsonEncode({
    'deviceImei': deviceImei,
    'latitude': latitude,
    'longitude': longitude,
    'speed': speed,
    'batteryLevel': batteryLevel,
    'timestamp': DateTime.now().toIso8601String(),
  });
  
  try {
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    ).timeout(Duration(seconds: 10));
    
    if (response.statusCode == 200) {
      final result = jsonDecode(response.body);
      print('Success: ${result['success']}');
    } else {
      print('Error: ${response.statusCode}');
      print('Body: ${response.body}');
    }
  } catch (e) {
    print('Exception: $e');
  }
}
```

---

## ⚠️ ملاحظات مهمة

1. **deviceImei:** يجب أن يكون موجود في قاعدة البيانات قبل الإرسال
2. **Timestamp Format:** استخدم ISO 8601 format: `"2025-01-15T10:30:00.000Z"`
3. **Speed:** بالكيلومتر/ساعة (km/h)
4. **Battery Level:** من 0 إلى 100
5. **Latitude Range:** -90 إلى 90
6. **Longitude Range:** -180 إلى 180
7. **Timeout:** يُنصح بتعيين timeout 10 ثواني على الأقل
8. **Retry:** أضف منطق إعادة المحاولة عند فشل الإرسال

---

## 🧪 Testing

يمكنك اختبار الـ API باستخدام:

### **cURL:**
```bash
curl -X POST https://gps-tracking-three.vercel.app/api/gps \
  -H "Content-Type: application/json" \
  -d '{
    "deviceImei": "123456789012345",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "speed": 60.5,
    "batteryLevel": 85
  }'
```

### **Postman:**
1. Method: `POST`
2. URL: `https://gps-tracking-three.vercel.app/api/gps`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON): استخدم أحد الأمثلة أعلاه

---

## 📱 مثال Flutter Complete

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:battery_plus/battery_plus.dart';

class GPSAPIService {
  final String baseUrl;
  final Battery _battery = Battery();
  
  GPSAPIService({required this.baseUrl});
  
  Future<Map<String, dynamic>?> sendLocation(String deviceImei) async {
    try {
      // الحصول على الموقع
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      // الحصول على البطارية
      int batteryLevel = await _battery.batteryLevel ?? 100;
      
      // حساب السرعة (متر/ثانية إلى كم/ساعة)
      double speedKmh = (position.speed * 3.6);
      
      // إعداد البيانات
      final data = {
        'deviceImei': deviceImei,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'speed': speedKmh,
        'batteryLevel': batteryLevel,
        'timestamp': DateTime.now().toIso8601String(),
      };
      
      // إرسال البيانات
      final url = Uri.parse('$baseUrl/api/gps');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      ).timeout(Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Error ${response.statusCode}: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Exception: $e');
      return null;
    }
  }
}
```

