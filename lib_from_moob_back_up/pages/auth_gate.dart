import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:trust_issues_mob/pages/on_boarding/login_screen.dart';
import 'package:trust_issues_mob/pages/sms_test.dart'; // Adjust path if needed

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          // User is logged in
          if (snapshot.hasData) {
            return const TrustIssuesTest(); // Your main scanner page
          }
          // User is NOT logged in
          else {
            return const LoginScreen();
          }
        },
      ),
    );
  }
}