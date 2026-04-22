import 'dart:convert';
import 'dart:developer' as developer;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:cloud_firestore/cloud_firestore.dart';

class PredictionService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // ==========================================
  // 1. CONFIGURATION
  // ==========================================
  
  // TODO: Replace with your actual Railway URL and Key 
  // (Alternatively, use the flutter_dotenv package to hide these)
  static final String _apiUrl = dotenv.env['RAILWAY_API_URL'] ?? 'MISSING_URL';
  static final String _apiKey = dotenv.env['RAILWAY_API_KEY'] ?? 'MISSING_KEY';

  // Helper to generate readable timestamp IDs (e.g., "2026-04-21T18_14_11Z")
  String _generateTimestampId() {
    return DateTime.now().toUtc().toIso8601String().replaceAll(RegExp(r'[:.]'), '_');
  }

  // ==========================================
  // 2. CORE FETCH WRAPPER
  // ==========================================
  
  Future<Map<String, dynamic>> _railwayFetch(String endpoint, Map<String, dynamic> body) async {
    try {
      final uri = Uri.parse('$_apiUrl$endpoint');
      
      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Trust-issue-API-Key': _apiKey,
        },
        body: jsonEncode(body),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Railway API Error: ${response.statusCode} ${response.reasonPhrase}');
      }
    } catch (e, stackTrace) {
      developer.log('API Fetch Error -> $endpoint', error: e, stackTrace: stackTrace, name: 'PredictionService');
      rethrow;
    }
  }

  // ==========================================
  // 3. SMS & EMAIL PREDICTION SERVICES
  // ==========================================

  Future<Map<String, dynamic>> checkSms({
    required String uid,
    required String sender,
    required String text,
  }) async {
    developer.log('Analyzing SMS from $sender...', name: 'PredictionService');
    
    // 1. Ask the AI Backend
    final result = await _railwayFetch('/api/v1/predict/sms', {'text': text});
    
    // Extract the nested prediction ("SPAM" or "HAM")
    final String finalPrediction = result['data']?['prediction'] ?? 'UNKNOWN';

    // 2. Format the document ID
    final docId = _generateTimestampId();
    final docRef = _firestore.collection('users').doc(uid).collection('sms_checks').doc(docId);

    // 3. Save to Firebase exactly as defined in the web schema
    await docRef.set({
      'message': text,
      'prediction': finalPrediction,
      'pushed_to_community': false,
      'sender': sender,
      'timestamp': FieldValue.serverTimestamp(),
    });

    developer.log('SMS Logged: $finalPrediction', name: 'PredictionService');
    return {'docId': docId, 'prediction': finalPrediction};
  }

  Future<Map<String, dynamic>> checkEmail({
    required String uid,
    required String sender,
    required String subject,
    required String body,
  }) async {
    developer.log('Analyzing Email from $sender...', name: 'PredictionService');

    // 1. Ask the AI Backend
    final result = await _railwayFetch('/api/v1/predict/email', {
      'subject': subject,
      'body': body,
    });
    
    // Extract the nested prediction
    final String finalPrediction = result['data']?['prediction'] ?? 'UNKNOWN';

    // 2. Format the document ID
    final docId = _generateTimestampId();
    final docRef = _firestore.collection('users').doc(uid).collection('email_checks').doc(docId);

    // 3. Save to Firebase
    await docRef.set({
      'message': body,
      'subject': subject,
      'prediction': finalPrediction,
      'pushed_to_community': false,
      'sender': sender,
      'timestamp': FieldValue.serverTimestamp(),
    });

    developer.log('Email Logged: $finalPrediction', name: 'PredictionService');
    return {'docId': docId, 'prediction': finalPrediction};
  }

  // ==========================================
  // 4. AI EXPLANATION & SYNC SERVICE
  // ==========================================

  Future<Map<String, dynamic>> explainMessage({
    required String uid,
    required String source, // "email" or "sms"
    required String originalDocId,
    String? subject,
    required String body,
    required String mlModelOutput,
  }) async {
    developer.log('Fetching AI Explanation for $source...', name: 'PredictionService');

    // 1. Ask the AI Backend for the breakdown
    final explanation = await _railwayFetch('/api/v1/explain', {
      'source': source,
      'subject': subject, // Can be null for SMS
      'body': body,
      'ml_model_output': mlModelOutput,
    });

    // 2. Format a clean AI explanation string
    final String whySpam = explanation['why_spam'] ?? '';
    final String tips = explanation['detection_tips'] ?? '';
    final String combinedExplanation = '$whySpam $tips'.trim();
    final String spamType = explanation['spam_type'] ?? 'Unknown Type';

    // 3. Save the specific AI Ask into the `ai_asks` subcollection
    final aiDocId = _generateTimestampId();
    final aiDocRef = _firestore.collection('users').doc(uid).collection('ai_asks').doc(aiDocId);

    await aiDocRef.set({
      'ai_explanation': combinedExplanation,
      'original_text': body,
      'spam_type': spamType,
      'timestamp': FieldValue.serverTimestamp(),
    });

    // 4. Update the original SMS or Email document with the new findings
    final collectionName = source == 'email' ? 'email_checks' : 'sms_checks';
    final originalDocRef = _firestore.collection('users').doc(uid).collection(collectionName).doc(originalDocId);

    await originalDocRef.update({
      'ai_explanation_ref': aiDocId,
      'detailed_spam_type': spamType,
    });

    developer.log('Explanation Synced Successfully.', name: 'PredictionService');
    return explanation;
  }
}