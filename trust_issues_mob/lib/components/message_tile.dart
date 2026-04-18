import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

enum SmsCategory { warning, utils, safe, none }

enum MlState { idle, loading, done, explaining }

class MessageTile extends StatefulWidget {
  final String message;
  final String apiKey;
  /// Called with "SPAM" or "HAM" once the ML result is received.
  /// The parent screen uses this to update its summary counts.
  final void Function(String prediction)? onPredictionResult;

  const MessageTile({
    super.key,
    required this.message,
    required this.apiKey,
    this.onPredictionResult,
  });

  @override
  State<MessageTile> createState() => _MessageTileState();
}

class _MessageTileState extends State<MessageTile> {
  MlState _mlState   = MlState.idle;
  String? _mlPrediction;   // "SPAM" or "HAM"
  String? _whySpam;
  String? _spamType;
  String? _detectionTips;
  String? _errorMsg;

  static const String _baseUrl  = 'https://trustissueapi.adarshmukherjee.com';
  static const Color  _crimson  = Color(0xFFFF4D4D);
  static const Color  _cyan     = Color(0xFF00E5FF);
  static const Color  _emerald  = Color(0xFF00E676);
  static const Color  _grey     = Color(0xFFB0BEC5);
  static const Color  _violet   = Color(0xFFA78BFA);
  static const Color  _surface  = Color(0xFF161621);

  // ── parsed message parts ─────────────────────────────────
  String get _sender {
    if (!widget.message.contains(': ')) return widget.message;
    return widget.message.split(': ').first;
  }

  String get _body {
    if (!widget.message.contains(': ')) return '';
    final parts = widget.message.split(': ');
    return parts.sublist(1).join(': ');
  }

  // ── derived state ────────────────────────────────────────
  // ML result drives tile colour; unscanned tiles are neutral
  SmsCategory get _category {
    if (_mlPrediction == null) return SmsCategory.none;
    if (_mlPrediction == 'SPAM') return SmsCategory.warning;
    return SmsCategory.safe;
  }

  Color get _accent {
    switch (_category) {
      case SmsCategory.warning: return _crimson;
      case SmsCategory.utils:   return _cyan;
      case SmsCategory.safe:    return _emerald;
      case SmsCategory.none:    return _grey;
    }
  }

  IconData get _icon {
    switch (_category) {
      case SmsCategory.warning: return Icons.gpp_maybe_rounded;
      case SmsCategory.utils:   return Icons.account_balance_wallet_outlined;
      case SmsCategory.safe:    return Icons.verified_rounded;
      case SmsCategory.none:    return Icons.sensors_rounded;
    }
  }

  String get _label {
    switch (_category) {
      case SmsCategory.warning: return 'THREAT DETECTED';
      case SmsCategory.utils:   return 'UTILITY / BANKING';
      case SmsCategory.safe:    return 'VERIFIED SAFE';
      case SmsCategory.none:    return 'UNCLASSIFIED';
    }
  }

  // ── API: predict ─────────────────────────────────────────
  Future<void> _predict() async {
    setState(() { _mlState = MlState.loading; _errorMsg = null; });
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/api/v1/predict/sms'),
        headers: {
          'Content-Type': 'application/json',
          'Trust-issue-API-Key': widget.apiKey,
        },
        body: jsonEncode({'text': _body}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        String p;
        if      (data['label']      != null) p = data['label'].toString().toUpperCase();
        else if (data['prediction'] != null) p = data['prediction'].toString().toUpperCase();
        else if (data['result']     != null) p = data['result'].toString().toUpperCase();
        else if (data['is_spam']    != null) p = (data['is_spam'] == true) ? 'SPAM' : 'HAM';
        else p = res.body.toUpperCase().contains('SPAM') ? 'SPAM' : 'HAM';

        setState(() { _mlPrediction = p; _mlState = MlState.done; });
        widget.onPredictionResult?.call(p);
      } else {
        setState(() { _errorMsg = 'Error ${res.statusCode}'; _mlState = MlState.idle; });
      }
    } catch (_) {
      setState(() { _errorMsg = 'Network error'; _mlState = MlState.idle; });
    }
  }

  // ── API: explain ─────────────────────────────────────────
  Future<void> _explain() async {
    if (_mlPrediction == null) return;
    setState(() { _mlState = MlState.explaining; _errorMsg = null; });
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/api/v1/explain'),
        headers: {
          'Content-Type': 'application/json',
          'Trust-issue-API-Key': widget.apiKey,
        },
        body: jsonEncode({
          'source': 'sms',
          'body': _body,
          'ml_model_output': _mlPrediction,
        }),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        setState(() {
          _whySpam       = data['why_spam']       as String?;
          _spamType      = data['spam_type']      as String?;
          _detectionTips = data['detection_tips'] as String?;
          _mlState       = MlState.done;
        });
        if (mounted) _showSheet();
      } else {
        setState(() { _errorMsg = 'Error ${res.statusCode}'; _mlState = MlState.done; });
      }
    } catch (_) {
      setState(() { _errorMsg = 'Network error'; _mlState = MlState.done; });
    }
  }

  // ── bottom sheet ─────────────────────────────────────────
  void _showSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.55,
        maxChildSize: 0.92,
        minChildSize: 0.3,
        builder: (_, ctl) => Container(
          decoration: const BoxDecoration(
            color: _surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
          child: ListView(
            controller: ctl,
            children: [
              // handle
              Center(
                child: Container(
                  width: 36, height: 4,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // verdict + type badges
              Row(children: [
                _sheetBadge(
                  _mlPrediction ?? '',
                  _mlPrediction == 'SPAM' ? _crimson : _emerald,
                ),
                if (_spamType != null) ...[
                  const SizedBox(width: 8),
                  _sheetBadge(_spamType!, _accent),
                ],
              ]),

              if (_whySpam != null) ...[
                const SizedBox(height: 20),
                _sectionLabel('WHY IT WAS FLAGGED'),
                const SizedBox(height: 8),
                Text(
                  _whySpam!,
                  style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.65),
                ),
              ],

              if (_detectionTips != null) ...[
                const SizedBox(height: 20),
                _sectionLabel('HOW TO PROTECT YOURSELF'),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withOpacity(0.07)),
                  ),
                  child: Text(
                    _detectionTips!,
                    style: const TextStyle(color: Colors.white60, fontSize: 13, height: 1.65),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _sheetBadge(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
    decoration: BoxDecoration(
      color: color.withOpacity(0.12),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: color.withOpacity(0.35), width: 0.5),
    ),
    child: Text(text,
        style: TextStyle(color: color, fontWeight: FontWeight.bold,
            fontSize: 11, letterSpacing: 0.8)),
  );

  Widget _sectionLabel(String text) => Text(text,
      style: const TextStyle(color: Colors.white38, fontSize: 9,
          fontWeight: FontWeight.bold, letterSpacing: 1.2));

  // ── inline badge widgets ─────────────────────────────────

  Widget _mlButton() => GestureDetector(
    onTap: _predict,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.white.withOpacity(0.18), width: 0.5),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: const [
        Icon(Icons.auto_awesome_rounded, size: 9, color: Colors.white38),
        SizedBox(width: 4),
        Text('ML?', style: TextStyle(color: Colors.white38, fontSize: 9,
            fontWeight: FontWeight.bold, letterSpacing: 0.8)),
      ]),
    ),
  );

  Widget _spinner(Color color) => SizedBox(
    width: 13, height: 13,
    child: CircularProgressIndicator(strokeWidth: 1.5, color: color.withOpacity(0.6)),
  );

  Widget _predictionBadge() {
    final isSpam = _mlPrediction == 'SPAM';
    final color  = isSpam ? _crimson : _emerald;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.4), width: 0.5),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 5, height: 5,
          margin: const EdgeInsets.only(right: 5),
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        Text(_mlPrediction!,
            style: TextStyle(color: color, fontSize: 9,
                fontWeight: FontWeight.bold, letterSpacing: 0.8)),
      ]),
    );
  }

  Widget _askAiButton() => GestureDetector(
    onTap: _mlState == MlState.explaining ? null : _explain,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _violet.withOpacity(0.10),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: _violet.withOpacity(0.35), width: 0.5),
      ),
      child: _mlState == MlState.explaining
          ? SizedBox(
              width: 13, height: 13,
              child: CircularProgressIndicator(
                  strokeWidth: 1.5, color: _violet.withOpacity(0.7)),
            )
          : const Text('ASK AI',
              style: TextStyle(color: _violet, fontSize: 9,
                  fontWeight: FontWeight.bold, letterSpacing: 0.8)),
    ),
  );

  // ── build ────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              color: _accent.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // colour accent bar
                  Container(
                    width: 4,
                    decoration: BoxDecoration(
                      color: _accent,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        bottomLeft: Radius.circular(16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(0, 12, 10, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // category row + badge area
                          Row(
                            children: [
                              Icon(_icon, color: _accent, size: 14),
                              const SizedBox(width: 6),
                              Text(_label,
                                  style: TextStyle(
                                      color: _accent, fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1.1)),
                              const Spacer(),
                              if (_mlState == MlState.idle)
                                _mlButton()
                              else if (_mlState == MlState.loading)
                                _spinner(_accent)
                              else ...[
                                _predictionBadge(),
                                const SizedBox(width: 5),
                                _askAiButton(),
                              ],
                            ],
                          ),

                          // inline error
                          if (_errorMsg != null) ...[
                            const SizedBox(height: 3),
                            Text(_errorMsg!,
                                style: const TextStyle(color: _crimson, fontSize: 9)),
                          ],

                          const SizedBox(height: 9),
                          Text(_sender,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14)),
                          const SizedBox(height: 3),
                          Text(_body,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  color: Colors.white.withOpacity(0.65),
                                  fontSize: 12,
                                  height: 1.45)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}