import 'dart:developer' as developer;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:trust_issues_mob/services/community_service.dart';

class FriendService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final CommunityService _community = CommunityService();

  // ==========================================
  // 1. SEARCH & DISCOVERY
  // ==========================================

  Future<List<Map<String, dynamic>>> searchUsers(String searchTerm) async {
    final term = searchTerm.toLowerCase().trim();
    if (term.isEmpty) return [];

    try {
      // Note: Client-side filtering is okay for MVPs. For scale, consider Algolia or Typesense.
      final snap = await _firestore.collection('users').get();
      final List<Map<String, dynamic>> results = [];

      for (var doc in snap.docs) {
        final data = doc.data();
        final username = (data['username']?.toString() ?? '').toLowerCase();
        final name = (data['name']?.toString() ?? '').toLowerCase();
        final uid = doc.id.toLowerCase();

        if (username.contains(term) || name.contains(term) || uid.contains(term)) {
          // Inject the document ID into the map for easy access in UI
          data['uid'] = doc.id;
          results.add(data);
        }
      }
      return results;
    } catch (e, stackTrace) {
      developer.log('Error searching users', error: e, stackTrace: stackTrace, name: 'FriendService');
      return [];
    }
  }

  // ==========================================
  // 2. SENDING & ACCEPTING REQUESTS
  // ==========================================

  Future<void> sendFriendRequest({required String currentUid, required String targetUid}) async {
    if (currentUid == targetUid) throw Exception("Cannot establish connection with yourself.");

    try {
      developer.log('Initiating handshake: $currentUid -> $targetUid', name: 'FriendService');

      final mySideRef = _firestore.collection('users').doc(currentUid).collection('friends').doc(targetUid);
      await mySideRef.set({
        'sent_by_me': true,
        'accepted_by_me': true,
        'accepted_by_them': false,
        'timestamp': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      final theirSideRef = _firestore.collection('users').doc(targetUid).collection('friends').doc(currentUid);
      await theirSideRef.set({
        'sent_by_me': false,
        'accepted_by_me': false,
        'accepted_by_them': true,
        'timestamp': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

    } catch (e, stackTrace) {
      developer.log('Handshake failed', error: e, stackTrace: stackTrace, name: 'FriendService');
      rethrow;
    }
  }

  Future<void> acceptFriendRequest({required String currentUid, required String targetUid}) async {
    try {
      developer.log('Accepting connection: $currentUid <-> $targetUid', name: 'FriendService');

      final mySideRef = _firestore.collection('users').doc(currentUid).collection('friends').doc(targetUid);
      await mySideRef.set({'accepted_by_me': true}, SetOptions(merge: true));

      final theirSideRef = _firestore.collection('users').doc(targetUid).collection('friends').doc(currentUid);
      await theirSideRef.set({'accepted_by_them': true}, SetOptions(merge: true));

      // Alert the Trust Issues Graph API Backend
      await _community.addFriend(uid1: currentUid, uid2: targetUid);
      developer.log('Graph database updated successfully.', name: 'FriendService');

    } catch (e, stackTrace) {
      developer.log('Acceptance failed', error: e, stackTrace: stackTrace, name: 'FriendService');
      rethrow;
    }
  }

  // ==========================================
  // 3. REMOVING, CANCELING & REJECTING
  // ==========================================

  Future<void> removeOrCancelFriend({required String currentUid, required String targetUid}) async {
    try {
      developer.log('Severing tie: $currentUid -x- $targetUid', name: 'FriendService');

      // 1. Delete from Current User's side
      final mySideRef = _firestore.collection('users').doc(currentUid).collection('friends').doc(targetUid);
      await mySideRef.delete();

      // 2. Delete from Target User's side
      final theirSideRef = _firestore.collection('users').doc(targetUid).collection('friends').doc(currentUid);
      await theirSideRef.delete();

      // 3. Sever the tie in Neo4j (Fails silently if they weren't fully friends yet)
      try {
        await _community.removeFriend(uid1: currentUid, uid2: targetUid);
      } catch (graphError) {
        developer.log('Neo4j edge removal skipped/failed (likely wasnt active yet).', name: 'FriendService');
      }

    } catch (e, stackTrace) {
      developer.log('Failed to sever tie', error: e, stackTrace: stackTrace, name: 'FriendService');
      rethrow;
    }
  }

  // ==========================================
  // 4. ONE-TIME DATA FETCHERS
  // ==========================================

  Future<List<Map<String, dynamic>>> getReceivedRequests(String currentUid) async {
    final friendsRef = _firestore.collection('users').doc(currentUid).collection('friends');
    final q = friendsRef.where('sent_by_me', isEqualTo: false).where('accepted_by_me', isEqualTo: false);

    final snap = await q.get();
    return snap.docs.map((doc) {
      final data = doc.data();
      data['uid'] = doc.id;
      return data;
    }).toList();
  }

  Future<List<Map<String, dynamic>>> getSentRequests(String currentUid) async {
    final friendsRef = _firestore.collection('users').doc(currentUid).collection('friends');
    final q = friendsRef.where('sent_by_me', isEqualTo: true).where('accepted_by_them', isEqualTo: false);

    final snap = await q.get();
    return snap.docs.map((doc) {
      final data = doc.data();
      data['uid'] = doc.id;
      return data;
    }).toList();
  }

  // ==========================================
  // 5. REAL-TIME STREAMS (For UI StreamBuilders)
  // ==========================================

  Stream<List<Map<String, dynamic>>> incomingRequestsStream(String currentUid) {
    return _firestore.collection('users').doc(currentUid).collection('friends')
        .where('sent_by_me', isEqualTo: false)
        .where('accepted_by_me', isEqualTo: false)
        .snapshots()
        .map((snap) => snap.docs.map((doc) {
              final data = doc.data();
              data['uid'] = doc.id;
              return data;
            }).toList());
  }

  Stream<List<Map<String, dynamic>>> sentRequestsStream(String currentUid) {
    return _firestore.collection('users').doc(currentUid).collection('friends')
        .where('sent_by_me', isEqualTo: true)
        .where('accepted_by_them', isEqualTo: false)
        .snapshots()
        .map((snap) => snap.docs.map((doc) {
              final data = doc.data();
              data['uid'] = doc.id;
              return data;
            }).toList());
  }

  Stream<List<Map<String, dynamic>>> activeFriendsStream(String currentUid) {
    return _firestore.collection('users').doc(currentUid).collection('friends')
        .where('accepted_by_me', isEqualTo: true)
        .where('accepted_by_them', isEqualTo: true)
        .snapshots()
        .map((snap) => snap.docs.map((doc) {
              final data = doc.data();
              data['uid'] = doc.id;
              return data;
            }).toList());
  }
}