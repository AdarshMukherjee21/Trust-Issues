  
import 'package:flutter/material.dart';
import 'package:trust_issues_mob/components/sms_scanner_running_notification.dart';
import 'package:trust_issues_mob/pages/sms_test.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';


void main() async {
  // 1. Capture the WidgetsBinding
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  
  // 2. Tell the native OS to hold the splash screen
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // 3. Your existing initialization code runs while the splash is visible
  await SmsScannerRunningNotification.initialize();

  // 4. Run your app
  runApp(const MaterialApp(
    debugShowCheckedModeBanner: false,
    home: TrustIssuesTest(),
  ));
  
  // 5. Remove the splash screen immediately after runApp
  FlutterNativeSplash.remove(); 
}