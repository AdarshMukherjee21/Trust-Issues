import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:trust_issues_mob/services/prediction_service.dart';
import 'package:trust_issues_mob/services/login_new_acc_service.dart';
import 'package:trust_issues_mob/services/community_service.dart';
// 🛡️ Define the missing states for the machine learning flow
enum MlState { 
  idle,       // Waiting for user to click "Run Scan"
  loading,    // Fetching the initial SPAM/HAM prediction
  done,       // Prediction received
  explaining  // Fetching the detailed AI breakdown
}

class MessageTile extends StatefulWidget {
  final String message;
  final void Function(String prediction)? onPredictionResult;

  const MessageTile({super.key, required this.message, this.onPredictionResult});

  @override
  State<MessageTile> createState() => _MessageTileState();
}

class _MessageTileState extends State<MessageTile> {
  final PredictionService _predictionService = PredictionService();
  final CommunityService _communityService = CommunityService();
  final AuthService _auth = AuthService();

  bool _isExpanded = false;
  MlState _mlState = MlState.idle;
  String? _mlPrediction, _docId, _whySpam, _spamType;
  bool _reported = false;

  static const Color _crimson = Color(0xFFFF4D4D);
  static const Color _emerald = Color(0xFF00E676);
  static const Color _violet = Color(0xFFA78BFA);
  static const Color _surface = Color(0xFF161621);

  String get _sender => widget.message.split(': ').first;
  String get _body => widget.message.split(': ').sublist(1).join(': ');

  void _showCyberSnackBar(String title, String message, IconData icon, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        content: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.5)),
            boxShadow: [BoxShadow(color: color.withOpacity(0.1), blurRadius: 10)],
          ),
          child: Row(
            children: [
              Icon(icon, color: color),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
                    Text(message, style: const TextStyle(color: Colors.white70, fontSize: 10)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _runCheck() async {
    final uid = _auth.currentUid;
    if (uid == null) return;
    setState(() => _mlState = MlState.loading);
    try {
      final res = await _predictionService.checkSms(uid: uid, sender: _sender, text: _body);
      setState(() {
        _mlPrediction = res['prediction'];
        _docId = res['docId'];
        _mlState = MlState.done;
      });
      widget.onPredictionResult?.call(_mlPrediction!);
      _showCyberSnackBar("ANALYSIS COMPLETE", "Verdict: $_mlPrediction", Icons.radar, _mlPrediction == 'SPAM' ? _crimson : _emerald);
    } catch (e) {
      setState(() => _mlState = MlState.idle);
    }
  }

  void _runAiAsk() async {
    final uid = _auth.currentUid;
    if (uid == null || _docId == null) return;
    setState(() => _mlState = MlState.explaining);
    try {
      final res = await _predictionService.explainMessage(
        uid: uid, source: 'sms', originalDocId: _docId!, body: _body, mlModelOutput: _mlPrediction!,
      );
      setState(() {
        _whySpam = res['why_spam'];
        _spamType = res['spam_type'];
        _mlPrediction = _spamType; // Update local display
        _mlState = MlState.done;
      });
      widget.onPredictionResult?.call(_spamType!);
      _showCyberSnackBar("AI INSIGHTS LOADED", "Classification: $_spamType", Icons.auto_awesome, _violet);
    } catch (e) {
      setState(() => _mlState = MlState.done);
    }
  }

  void _reportThreat() async {
    final uid = _auth.currentUid;
    if (uid == null) return;
    setState(() => _reported = true);
    try {
      await _communityService.reportThreat(
        reporterUid: uid, threatText: _body, threatType: _mlPrediction ?? 'Spam',
        senderContact: _sender, senderPlatform: 'sms',
      );
      _showCyberSnackBar("COMMUNITY ALERT", "Threat logged in Trust-Graph", Icons.share, _crimson);
    } catch (e) {
      setState(() => _reported = false);
      _showCyberSnackBar("GRAPH ERROR", "Neo4j backend unreachable", Icons.cloud_off, Colors.orange);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isSpam = _mlPrediction != null && (_mlPrediction == 'SPAM' || _mlState == MlState.done && _mlPrediction != 'HAM');
    Color accent = isSpam ? _crimson : (_mlPrediction == 'HAM' ? _emerald : Colors.white24);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: _surface.withOpacity(0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accent.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          ListTile(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            leading: Icon(isSpam ? Icons.gpp_maybe : Icons.mail_outline, color: accent),
            title: Text(_sender, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            subtitle: Text(_body, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white38, fontSize: 11)),
            trailing: Icon(_isExpanded ? Icons.expand_less : Icons.expand_more, color: Colors.white24),
          ),
          if (_isExpanded) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(color: Colors.white10),
                  Text(_body, style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4)),
                  const SizedBox(height: 16),
                  if (_whySpam != null) ...[
                    Text("AI LOG: $_whySpam", style: TextStyle(color: _violet.withOpacity(0.8), fontSize: 11, fontStyle: FontStyle.italic)),
                    const SizedBox(height: 16),
                  ],
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      if (_mlState == MlState.idle) _cyberBtn("RUN SCAN", _emerald, _runCheck),
                      if (_mlState == MlState.loading) const CircularProgressIndicator(color: _emerald),
                      if (_mlState == MlState.done && _whySpam == null) _cyberBtn("ASK AI", _violet, _runAiAsk),
                      if (_mlState == MlState.explaining) const CircularProgressIndicator(color: _violet),
                      if (_mlState == MlState.done && isSpam) _cyberBtn(_reported ? "REPORTED" : "REPORT THREAT", _crimson, _reported ? null : _reportThreat),
                    ],
                  ),
                ],
              ),
            )
          ]
        ],
      ),
    );
  }

  Widget _cyberBtn(String label, Color color, VoidCallback? onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.5)),
        ),
        child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1)),
      ),
    );
  }
}