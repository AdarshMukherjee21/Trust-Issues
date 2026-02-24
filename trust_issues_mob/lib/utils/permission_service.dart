import 'dart:io';
import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  static Future<bool> requestAll() async {
    if (!Platform.isAndroid) return true;

    // Notification permission (Android 13+)
    final notificationStatus = await Permission.notification.request();

    // SMS + phone permissions
    final smsStatus = await Permission.sms.request();
    final phoneStatus = await Permission.phone.request();

    return notificationStatus.isGranted &&
        smsStatus.isGranted &&
        phoneStatus.isGranted;
  }
}