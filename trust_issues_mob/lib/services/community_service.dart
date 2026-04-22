import 'dart:convert';
import 'dart:developer' as developer;
import 'package:http/http.dart' as http;
import 'package:cloud_firestore/cloud_firestore.dart';

class CommunityService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // ==========================================
  // 1. DYNAMIC BACKEND RESOLVER
  // ==========================================
  
  Future<Map<String, dynamic>?> _getBackendStatus() async {
    try {
      final docSnap = await _firestore.collection('public').doc('backend_status').get();
      if (docSnap.exists) {
        return docSnap.data();
      }
    } catch (error, stackTrace) {
      developer.log('Error fetching backend status', error: error, stackTrace: stackTrace, name: 'CommunityService');
    }
    return null;
  }

  // ==========================================
  // 2. CORE FETCH WRAPPER
  // ==========================================
  
  Future<dynamic> _apiFetch(String endpoint, {String method = 'GET', Map<String, dynamic>? body}) async {
    developer.log('Triggered for endpoint: $endpoint | Method: $method', name: 'CommunityService');
    
    // 1. Resolve Backend URL
    final status = await _getBackendStatus();
    developer.log('Firebase Backend Status: $status', name: 'CommunityService');
    
    if (status == null || status['is_active'] != true || status['link_to_backend'] == null) {
      developer.log('Aborting request, backend considered offline from Firestore.', name: 'CommunityService');
      throw Exception('Backend is currently offline or unreachable.');
    }
    
    // 2. Construct URL securely
    String baseUrl = status['link_to_backend'].toString();
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }
    
    final Uri url = Uri.parse('$baseUrl$endpoint');
    developer.log('Constructed Full URL: $url', name: 'CommunityService');
    
    // 3. Configure Headers (including Ngrok bypass)
    final Map<String, String> headers = {
      'ngrok-skip-browser-warning': 'true',
    };
    if (body != null) {
      headers['Content-Type'] = 'application/json';
    }

    // 4. Fire Request
    try {
      developer.log('Firing network request...', name: 'CommunityService');
      http.Response response;

      if (method.toUpperCase() == 'POST') {
        if (body != null) developer.log('Transmitting Body: $body', name: 'CommunityService');
        response = await http.post(
          url,
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
      } else {
        response = await http.get(url, headers: headers);
      }

      developer.log('Network Response Status: ${response.statusCode} ${response.reasonPhrase}', name: 'CommunityService');
      
      if (response.statusCode < 200 || response.statusCode >= 300) {
        developer.log('Bad response: HTTP ${response.statusCode}', name: 'CommunityService');
        throw Exception('API Error: ${response.statusCode} - ${response.reasonPhrase}');
      }

      final data = jsonDecode(response.body);
      developer.log('Successfully parsed JSON structure.', name: 'CommunityService');
      return data;
      
    } catch (error, stackTrace) {
      developer.log('EXCEPTION Failed to fetch or network error for URL: $url', error: error, stackTrace: stackTrace, name: 'CommunityService');
      rethrow;
    }
  }

  // ==========================================
  // 3. API ROUTES WRAPPERS
  // ==========================================

  Future<dynamic> updateUser({required String uid, required String username}) {
    return _apiFetch('/api/v1/users/update', method: 'POST', body: {
      'uid': uid, 
      'username': username
    });
  }

  Future<dynamic> addFriend({required String uid1, required String uid2}) {
    return _apiFetch('/api/v1/friends/add', method: 'POST', body: {
      'uid1': uid1, 
      'uid2': uid2
    });
  }

  Future<dynamic> removeFriend({required String uid1, required String uid2}) {
    return _apiFetch('/api/v1/friends/remove', method: 'POST', body: {
      'uid1': uid1, 
      'uid2': uid2
    });
  }

  Future<dynamic> reportThreat({
    required String reporterUid,
    required String threatText,
    required String threatType,
    required String senderContact,
    required String senderPlatform,
  }) {
    return _apiFetch('/api/v1/threats/report', method: 'POST', body: {
      'reporter_uid': reporterUid,
      'threat_text': threatText,
      'threat_type': threatType,
      'sender_contact': senderContact,
      'sender_platform': senderPlatform,
    });
  }

  Future<dynamic> getFriendThreats({required String uid}) {
    return _apiFetch('/api/v1/threats/friends/$uid', method: 'GET');
  }

  Future<dynamic> fetchGraphData({required String uid}) {
    return _apiFetch('/api/v1/graph-viz/$uid', method: 'GET');
  }
}