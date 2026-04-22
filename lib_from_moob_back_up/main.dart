import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:trust_issues_mob/firebase_options.dart'; // Ensure this exists from flutterfire configure
import 'package:trust_issues_mob/components/sms_scanner_running_notification.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:trust_issues_mob/utils/permission_service.dart';
import 'package:trust_issues_mob/pages/auth_gate.dart'; // Implemented above
import 'package:flutter_dotenv/flutter_dotenv.dart';
void main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);
  
  await dotenv.load(fileName: ".env");
  // 1. Initialize Firebase FIRST
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  await SmsScannerRunningNotification.initialize();

  // 2. Ask for permissions
  await PermissionService.requestAll();

  runApp(const MaterialApp(
    debugShowCheckedModeBanner: false,
    home: AuthGate(),
  ));

  FlutterNativeSplash.remove();
}