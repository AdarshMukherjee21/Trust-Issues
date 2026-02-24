import 'dart:ui';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class SmsScannerRunningNotification {
  static final FlutterLocalNotificationsPlugin
      _notifications = FlutterLocalNotificationsPlugin();

  static const String _channelId = 'sms_scanner_channel';
  static const String _channelName = 'SMS Scanner';
  static const String _channelDescription =
      'Notification shown while SMS scanner is running';

  /// Initialize (call once in main before runApp if not already initialized)
  static Future<void> initialize() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings settings =
        InitializationSettings(android: androidSettings);

    await _notifications.initialize(settings: settings);

    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: _channelDescription,
      importance: Importance.low,
    );

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  /// Show persistent notification
 static Future<void> show() async {
  const bigPictureStyle = BigPictureStyleInformation(
    DrawableResourceAndroidBitmap(
        'trust_issues_logo_horizontal_no_bg'), // BIG IMAGE
    largeIcon: DrawableResourceAndroidBitmap(
        'trust_issue_logo_white_no_bg'), // small icon enlarged
    contentTitle: '🛡 Trust Issues Scanner Active',
    summaryText: 'Monitoring incoming SMS for suspicious activity',
  );

  const AndroidNotificationDetails androidDetails =
      AndroidNotificationDetails(
    _channelId,
    _channelName,
    channelDescription: _channelDescription,
    importance: Importance.low,
    priority: Priority.low,
    ongoing: true,
    autoCancel: false,

    // 👇 YOUR CUSTOM ICON
    icon: 'trust_issue_logo_white_no_bg',

    // 👇 Large icon (optional but looks better)
    largeIcon:
        DrawableResourceAndroidBitmap('trust_issue_logo_white_no_bg'),

    styleInformation: bigPictureStyle,

    color: Color(0xFF8B0000), // deep red branding
    showWhen: true,
    enableVibration: false,
    visibility: NotificationVisibility.public,
    category: AndroidNotificationCategory.service,
  );

  const NotificationDetails details =
      NotificationDetails(android: androidDetails);

  await _notifications.show(
    id:999,
    title: "Trust Issues Scanner Running",
    body: "Actively monitoring suspicious messages...",
    notificationDetails: details,
  );
}

  /// Cancel notification
  static Future<void> cancel() async {
    await _notifications.cancel(id:999);
  }
}