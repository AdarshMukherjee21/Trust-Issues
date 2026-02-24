import 'package:flutter/material.dart';
import 'package:trust_issues_mob/components/sms_scanner_running_notification.dart';
import 'package:trust_issues_mob/pages/sms_test.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:trust_issues_mob/utils/permission_service.dart';

void main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  await SmsScannerRunningNotification.initialize();

  // 🔐 Ask for permissions here
  await PermissionService.requestAll();

  runApp(const MaterialApp(
    debugShowCheckedModeBanner: false,
    home: TrustIssuesTest(),
  ));

  FlutterNativeSplash.remove();
}