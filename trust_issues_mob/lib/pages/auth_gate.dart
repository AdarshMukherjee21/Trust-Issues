import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:trust_issues_mob/pages/on_boarding/login_screen.dart';
import 'package:trust_issues_mob/pages/home_layout.dart';

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
            return const HomeLayout();
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