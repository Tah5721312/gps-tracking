# 📱 Prompt لتطوير تطبيق Flutter لتتبع GPS

## 🎯 الهدف
تطوير تطبيق Flutter للموبايل (Android/iOS) يقوم بإرسال بيانات GPS من الموبايل الحقيقي إلى سيرفر تتبع المركبات.

---

## 🔌 API Endpoints والـ Parameters

### 1️⃣ **API Endpoint الرئيسي (مُوصى به)**

```
POST /api/gps
```

**Base URL:** `https://gps-tracking-three.vercel.app/api/gps`

**Method:** `POST`

**Content-Type:** `application/json`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (JSON):**
```json
{
  "deviceImei": "string (required)",
  "latitude": "number (required)",
  "longitude": "number (required)",
  "speed": "number (optional, default: 0)",
  "batteryLevel": "number (optional, default: 100)",
  "timestamp": "string ISO 8601 (optional, default: current time)"
}
```

**أمثلة على Request:**

```json
// مثال بسيط (الحد الأدنى المطلوب)
{
  "deviceImei": "123456789012345",
  "latitude": 30.0444,
  "longitude": 31.2357
}

// مثال كامل
{
  "deviceImei": "123456789012345",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "speed": 60.5,
  "batteryLevel": 85,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "trackingPoint": {
    "id": 123,
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
    "status": "moving",
    "lastLatitude": 30.0444,
    "lastLongitude": 31.2357,
    "lastSpeed": 60.5
  }
}
```

**Response Error (400):**
```json
{
  "error": "Missing required fields: deviceImei, latitude, longitude"
}
```

**Response Error (404):**
```json
{
  "error": "Vehicle not found with IMEI: 123456789012345"
}
```

---

### 2️⃣ **API Endpoint بديل (GET Method)**

```
GET /api/gps?deviceImei=XXX&latitude=XXX&longitude=XXX&speed=XXX&batteryLevel=XXX&timestamp=XXX
```

**Method:** `GET`

**Query Parameters:**
- `deviceImei` (required)
- `latitude` (required)
- `longitude` (required)
- `speed` (optional)
- `batteryLevel` (optional)
- `timestamp` (optional)

**مثال:**
```
GET /api/gps?deviceImei=123456789012345&latitude=30.0444&longitude=31.2357&speed=60.5&batteryLevel=85
```

**Response:**
```json
{
  "success": true,
  "message": "OK"
}
```

---

### 3️⃣ **API Endpoint بديل (Update)**

```
POST /api/gps/update
```

**Method:** `POST`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "deviceImei": "string (required)",
  "latitude": "number (required)",
  "longitude": "number (required)",
  "speed": "number (optional)",
  "batteryLevel": "number (optional)",
  "timestamp": "string (optional)"
}
```

---

## 📋 المتطلبات التقنية

### **Packages المطلوبة في Flutter:**

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # GPS Location
  geolocator: ^10.1.0
  geocoding: ^2.1.1
  
  # HTTP Requests
  http: ^1.1.0
  
  # Battery Level
  battery_plus: ^5.0.2
  
  # Permissions
  permission_handler: ^11.0.1
  
  # Background Tasks
  workmanager: ^0.5.2
  
  # Local Storage
  shared_preferences: ^2.2.2
  
  # State Management (اختياري)
  provider: ^6.1.1
```

### **Permissions المطلوبة:**

**Android (`android/app/src/main/AndroidManifest.xml`):**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

**iOS (`ios/Runner/Info.plist`):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>نحتاج إلى موقعك لتتبع المركبة</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>نحتاج إلى موقعك لتتبع المركبة حتى عند إغلاق التطبيق</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>نحتاج إلى موقعك لتتبع المركبة حتى عند إغلاق التطبيق</string>
```

---

## 🎨 الميزات المطلوبة

### 1. **واجهة المستخدم (UI):**
- ✅ شاشة تسجيل الدخول/إدخال IMEI
- ✅ شاشة عرض الموقع الحالي على خريطة
- ✅ عرض الإحداثيات (Latitude, Longitude)
- ✅ عرض السرعة الحالية
- ✅ عرض مستوى البطارية
- ✅ زر تشغيل/إيقاف التتبع
- ✅ إعدادات (فترة الإرسال، Base URL)
- ✅ سجل الإرسال (نجح/فشل)

### 2. **الوظائف الأساسية:**
- ✅ قراءة GPS من الموبايل الحقيقي
- ✅ قراءة مستوى البطارية
- ✅ حساب السرعة من GPS
- ✅ إرسال البيانات تلقائياً كل X ثانية
- ✅ إرسال يدوي عند الطلب
- ✅ العمل في الخلفية (Background Service)
- ✅ إعادة المحاولة عند فشل الإرسال
- ✅ حفظ الإعدادات محلياً

### 3. **معالجة الأخطاء:**
- ✅ التحقق من وجود GPS
- ✅ التحقق من الاتصال بالإنترنت
- ✅ معالجة أخطاء API
- ✅ عرض رسائل خطأ واضحة
- ✅ إعادة المحاولة التلقائية

---

## 💻 مثال على الكود (Flutter)

### **1. Model للبيانات:**

```dart
class GPSData {
  final String deviceImei;
  final double latitude;
  final double longitude;
  final double speed;
  final int batteryLevel;
  final DateTime timestamp;

  GPSData({
    required this.deviceImei,
    required this.latitude,
    required this.longitude,
    this.speed = 0.0,
    this.batteryLevel = 100,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() {
    return {
      'deviceImei': deviceImei,
      'latitude': latitude,
      'longitude': longitude,
      'speed': speed,
      'batteryLevel': batteryLevel,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
```

### **2. API Service:**

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class GPSService {
  final String baseUrl;
  
  GPSService({required this.baseUrl});

  Future<bool> sendGPSData(GPSData data) async {
    try {
      final url = Uri.parse('$baseUrl/api/gps');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(data.toJson()),
      ).timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        return result['success'] == true;
      } else {
        print('Error: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('Exception: $e');
      return false;
    }
  }
}
```

### **3. Location Service:**

```dart
import 'package:geolocator/geolocator.dart';
import 'package:battery_plus/battery_plus.dart';

class LocationService {
  final Battery _battery = Battery();

  Future<GPSData?> getCurrentLocation(String deviceImei) async {
    try {
      // التحقق من الصلاحيات
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('خدمة GPS غير مفعلة');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('تم رفض الصلاحية');
        }
      }

      // الحصول على الموقع
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      // الحصول على مستوى البطارية
      int batteryLevel = await _battery.batteryLevel ?? 100;

      // حساب السرعة (متر/ثانية إلى كم/ساعة)
      double speedKmh = (position.speed * 3.6);

      return GPSData(
        deviceImei: deviceImei,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: speedKmh,
        batteryLevel: batteryLevel,
      );
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }

  Stream<Position> getLocationStream() {
    return Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // متر
        timeLimit: Duration(seconds: 5),
      ),
    );
  }
}
```

### **4. Background Service:**

```dart
import 'package:workmanager/workmanager.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    final deviceImei = inputData?['deviceImei'] as String?;
    final baseUrl = inputData?['baseUrl'] as String?;
    
    if (deviceImei == null || baseUrl == null) {
      return Future.value(false);
    }

    final locationService = LocationService();
    final gpsData = await locationService.getCurrentLocation(deviceImei);
    
    if (gpsData != null) {
      final gpsService = GPSService(baseUrl: baseUrl);
      final success = await gpsService.sendGPSData(gpsData);
      return Future.value(success);
    }
    
    return Future.value(false);
  });
}
```

---

## 📝 ملاحظات مهمة

1. **deviceImei:** يجب أن يكون رقم IMEI الفريد للموبايل أو رقم معرف مخصص للمركبة (يجب أن يكون مسجل في قاعدة البيانات)

2. **السرعة:** يتم حسابها تلقائياً من GPS، أو يمكن إرسالها كـ 0 إذا لم تكن متاحة

3. **مستوى البطارية:** يتم قراءته من الموبايل تلقائياً

4. **Timestamp:** إذا لم يتم إرساله، السيرفر يستخدم الوقت الحالي

5. **فترة الإرسال:** يُنصح بإرسال البيانات كل 5-30 ثانية حسب الحاجة

6. **الخلفية:** يجب تفعيل Background Location Service للعمل حتى عند إغلاق التطبيق

7. **الأمان:** يُنصح بإضافة Authentication Token في المستقبل

---

## ✅ Checklist للمطور

- [ ] تثبيت جميع الـ packages المطلوبة
- [ ] إضافة الصلاحيات في AndroidManifest.xml و Info.plist
- [ ] إنشاء Model للبيانات
- [ ] إنشاء API Service
- [ ] إنشاء Location Service
- [ ] إنشاء Background Service
- [ ] بناء واجهة المستخدم
- [ ] إضافة معالجة الأخطاء
- [ ] اختبار الإرسال
- [ ] اختبار العمل في الخلفية
- [ ] تحسين استهلاك البطارية

---

## 🔗 روابط مفيدة

- [Geolocator Package](https://pub.dev/packages/geolocator)
- [HTTP Package](https://pub.dev/packages/http)
- [Workmanager Package](https://pub.dev/packages/workmanager)
- [Battery Plus Package](https://pub.dev/packages/battery_plus)

---

**Base URL:** `https://gps-tracking-three.vercel.app`

