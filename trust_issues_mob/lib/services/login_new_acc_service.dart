import 'dart:developer' as developer; // 🛡️ Imported the official dev tools
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:trust_issues_mob/services/user_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final UserService _userService = UserService();
  
  // 1. V7 FIX: Use the singleton instance
  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  String? get currentUid => _auth.currentUser?.uid;
  User? get currentUser => _auth.currentUser;

  // 🛡️ Modern v7+ Google Sign-In
  Future<UserCredential?> signInWithGoogle({String? name, String? username, String? age}) async {
    try {
      developer.log('Attempting Google Sign-In...', name: 'AuthService');
      
      await _googleSignIn.initialize();
      final GoogleSignInAccount? googleUser = await _googleSignIn.authenticate();
      if (googleUser == null) {
        developer.log('Google Sign-In aborted by user.', name: 'AuthService');
        return null;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final clientAuth = await googleUser.authorizationClient.authorizeScopes(['email', 'profile']);

      final AuthCredential credential = GoogleAuthProvider.credential(
        idToken: googleAuth.idToken,
        accessToken: clientAuth.accessToken,
      );

      UserCredential userCredential = await _auth.signInWithCredential(credential);

      // If brand new, build the Firestore profile using the provided info OR Google defaults
      if (userCredential.additionalUserInfo?.isNewUser == true && userCredential.user != null) {
        developer.log('New user detected via Google. Creating Firestore document...', name: 'AuthService');
        await _userService.createUserDocument(
          user: userCredential.user!,
          name: name ?? userCredential.user!.displayName ?? "Unknown Alias",
          username: username ?? userCredential.user!.email?.split('@')[0] ?? "unknown_user",
          age: age ?? "Not Provided", 
        );
      }

      developer.log('Google Sign-In Successful. UID: ${userCredential.user?.uid}', name: 'AuthService');
      return userCredential;
      
    } catch (e, stackTrace) {
      // 🚨 Log the exact error and where it happened
      developer.log('Google Sign-In Failed', error: e, stackTrace: stackTrace, name: 'AuthService');
      throw Exception("Google Sign-In Error: $e");
    }
  }

  // 📧 1. Sign In (Email/Password)
  Future<UserCredential> signInWithEmailPassword(String email, String password) async {
    try {
      developer.log('Attempting Email/Password Sign-In for: $email', name: 'AuthService');
      
      final credential = await _auth.signInWithEmailAndPassword(email: email, password: password);
      
      developer.log('Email Sign-In Successful. UID: ${credential.user?.uid}', name: 'AuthService');
      return credential;
      
    } catch (e, stackTrace) {
      developer.log('Email/Password Sign-In Failed', error: e, stackTrace: stackTrace, name: 'AuthService');
      throw Exception(e.toString());
    }
  }

  // 📝 2. Register & Create Firestore Doc (Email/Password)
  Future<UserCredential> registerWithEmailPassword({
    required String email,
    required String password,
    required String name,
    required String username,
    required String age,
  }) async {
    try {
      developer.log('Attempting Registration for: $email', name: 'AuthService');
      
      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (userCredential.user != null) {
        developer.log('Auth user created. Initializing Firestore document...', name: 'AuthService');
        await _userService.createUserDocument(
          user: userCredential.user!,
          name: name,
          username: username,
          age: age,
        );
      }

      developer.log('Registration Successful. UID: ${userCredential.user?.uid}', name: 'AuthService');
      return userCredential;
      
    } catch (e, stackTrace) {
      developer.log('Registration Failed', error: e, stackTrace: stackTrace, name: 'AuthService');
      throw Exception(e.toString());
    }
  }

  // 🚪 3. Sign Out
  Future<void> signOut() async {
    try {
      developer.log('Attempting Sign Out...', name: 'AuthService');
      
      // Ensure the user is signed out of Google locally as well
      await _googleSignIn.signOut();
      await _auth.signOut();
      
      developer.log('Sign Out Successful.', name: 'AuthService');
    } catch (e, stackTrace) {
      developer.log('Sign Out Failed', error: e, stackTrace: stackTrace, name: 'AuthService');
      throw Exception(e.toString());
    }
  }
}