import 'dart:developer' as developer;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class UserService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

 Future<void> createUserDocument({
    required User user,
    required String name,
    required String username,
    required String age,
  }) async {
    // Creates or merges the document at users/{uid}
    await _firestore.collection('users').doc(user.uid).set({
      'name': name,
      'username': username,
      'age': age, // Storing as string as requested
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true)); // <-- Added merge true here
  }

  // ==========================================
  // 2. GET USER PROFILE
  // ==========================================
  
  Future<Map<String, dynamic>?> getUserProfile(String uid) async {
    try {
      developer.log('Fetching profile for UID: $uid', name: 'UserService');
      
      final userRef = _firestore.collection('users').doc(uid);
      final snap = await userRef.get();
      
      if (snap.exists) {
        return snap.data();
      }
      return null;
      
    } catch (e, stackTrace) {
      developer.log('Error fetching profile', error: e, stackTrace: stackTrace, name: 'UserService');
      return null;
    }
  }

  // ==========================================
  // 3. GET SUBCOLLECTION COUNT (Optimized!)
  // ==========================================
  
  Future<int> getSubcollectionCount(String uid, String subcollection) async {
    try {
      developer.log('Counting docs in $subcollection for $uid', name: 'UserService');
      
      final subRef = _firestore.collection('users').doc(uid).collection(subcollection);
      
      // 🔥 HUGE UPGRADE: Uses server-side aggregation. Costs 1 read instead of N reads.
      final countQuery = await subRef.count().get();
      return countQuery.count ?? 0;
      
    } catch (e, stackTrace) {
      developer.log('Error counting $subcollection', error: e, stackTrace: stackTrace, name: 'UserService');
      return 0;
    }
  }

  // ==========================================
  // 4. GET SUBCOLLECTION DOCS (Ordered with Fallback)
  // ==========================================
  
  Future<List<Map<String, dynamic>>> getSubcollectionDocs(String uid, String subcollection) async {
    final subRef = _firestore.collection('users').doc(uid).collection(subcollection);
    
    try {
      developer.log('Fetching ordered docs from $subcollection', name: 'UserService');
      
      final snap = await subRef.orderBy('timestamp', descending: true).get();
      
      return snap.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id; // Inject the document ID so the UI can use it
        return data;
      }).toList();
      
    } catch (e) {
      // Fallback: If Firebase throws an error because the 'timestamp' index hasn't 
      // been built yet, or documents lack a timestamp, we catch it and do a raw fetch.
      developer.log('Index missing/failed for $subcollection. Falling back to unordered fetch.', name: 'UserService');
      
      try {
        final fallbackSnap = await subRef.get();
        return fallbackSnap.docs.map((doc) {
          final data = doc.data();
          data['id'] = doc.id; 
          return data;
        }).toList();
        
      } catch (fallbackError, stackTrace) {
        developer.log('Fallback fetch failed completely', error: fallbackError, stackTrace: stackTrace, name: 'UserService');
        return [];
      }
    }
  }
}