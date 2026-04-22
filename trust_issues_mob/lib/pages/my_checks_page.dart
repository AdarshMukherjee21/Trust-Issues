import 'dart:developer' as developer;

import 'package:flutter/material.dart';
import 'package:another_telephony/telephony.dart';
import 'package:trust_issues_mob/components/message_tile.dart';
// import 'package:trust_issues_mob/services/login_new_acc_service.dart';

enum InboxFilter { all, threats, utility, safe, unscanned }

class MyChecksPage extends StatefulWidget {
  const MyChecksPage({super.key});

  @override
  State<MyChecksPage> createState() => _MyChecksPageState();
}

class _MyChecksPageState extends State<MyChecksPage> {
  final Telephony _telephony = Telephony.instance;
  // final AuthService _auth = AuthService();

  List<String> _messages = [];
  bool _isLoading = false;

  final Map<String, String?> _predictions = {};
  InboxFilter _filter = InboxFilter.all;

  static const Color _bg = Color(0xFF0A0A0F);
  static const Color _surface = Color(0xFF161621);
  static const Color _crimson = Color(0xFFFF4D4D);
  static const Color _emerald = Color(0xFF00E676);
  static const Color _cyan = Color(0xFF00E5FF);
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
  Future<void> _scanMessages() async {
  setState(() { _isLoading = true; _predictions.clear(); });

  final granted = await _telephony.requestPhoneAndSmsPermissions;
  
  if (granted == true) {
    // 🛡️ FIX: Fetch ALL columns first to avoid filtering issues
    final List<SmsMessage> inbox = await _telephony.getInboxSms(
      sortOrder: [OrderBy(SmsColumn.DATE, sort: Sort.DESC)],
    );

    setState(() {
      // 🛡️ Check if inbox is actually returning data
      developer.log('Found ${inbox.length} messages in system inbox', name: 'MyChecks');
      
      _messages = inbox.map((s) {
        // Log individual messages to see if your saved contacts are being hit
        developer.log('Message from: ${s.address}', name: 'MyChecks');
        return '${s.address}: ${s.body}';
      }).toList();

      for (final m in _messages) _predictions[m] = null;
      _isLoading = false;
    });
  } else {
    setState(() => _isLoading = false);
    _showCyberSnackBar("PERMISSION DENIED", "Cannot access system SMS database.", Icons.lock, Colors.red);
  }
}

  @override
  void initState() {
    super.initState();
    _scanMessages();
  }

  int get _scannedCount => _predictions.values.where((v) => v != null).length;
  int get _threatCount => _predictions.values.where((v) => v == 'SPAM').length;
  int get _pendingCount => _predictions.values.where((v) => v == null).length;

  List<String> get _filteredMessages {
    switch (_filter) {
      case InboxFilter.all: return _messages;
      case InboxFilter.threats: return _messages.where((m) => _predictions[m] == 'SPAM').toList();
      case InboxFilter.utility: return _messages.where((m) => _predictions[m] == 'HAM').toList();
      case InboxFilter.safe: return _messages.where((m) => _predictions[m] == 'HAM').toList();
      case InboxFilter.unscanned: return _messages.where((m) => _predictions[m] == null).toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        title: Text('MY CHECKS', style: TextStyle(letterSpacing: 1.5, fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white.withOpacity(0.9))),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading ? _buildLoading() : _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _scanMessages,
        backgroundColor: _emerald.withOpacity(0.15),
        icon: const Icon(Icons.sync, color: _emerald),
        label: const Text('REFRESH INBOX', style: TextStyle(color: _emerald, fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 12)),
      ),
    );
  }

  Widget _buildBody() {
    return Column(
      children: [
        _buildSummary(),
        _buildFilterBar(),
        const SizedBox(height: 8),
        Expanded(
          child: Container(
            decoration: const BoxDecoration(
              color: _surface,
              borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
            ),
            child: _messages.isEmpty ? _buildEmpty() : _buildList(),
          ),
        ),
      ],
    );
  }

  Widget _buildSummary() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: _crimson.withOpacity(0.08),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('THREAT MONITOR', style: TextStyle(color: _crimson, fontWeight: FontWeight.bold, fontSize: 9, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text('${_messages.length} SMS Nodes', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 3),
                Text('$_scannedCount scanned · $_pendingCount pending', style: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 10)),
              ],
            ),
            const Spacer(),
            _statBadge(_threatCount.toString(), 'SPAM', _crimson),
          ],
        ),
      ),
    );
  }

  Widget _statBadge(String value, String label, Color color) => Column(
    children: [
      Text(value, style: TextStyle(color: color, fontSize: 26, fontWeight: FontWeight.bold)),
      Text(label, style: TextStyle(color: color.withOpacity(0.5), fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
    ],
  );

  Widget _buildFilterBar() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _chip('ALL', InboxFilter.all, Colors.white),
          _chip('THREATS', InboxFilter.threats, _crimson),
          _chip('HAM', InboxFilter.utility, _cyan),
          _chip('PENDING', InboxFilter.unscanned, Colors.white38),
        ],
      ),
    );
  }

  Widget _chip(String label, InboxFilter filter, Color color) {
    final selected = _filter == filter;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _filter = filter),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? color.withOpacity(0.15) : Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: selected ? color.withOpacity(0.6) : Colors.transparent, width: 0.8),
          ),
          child: Text(label, style: TextStyle(color: selected ? color : Colors.white38, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ),
      ),
    );
  }

  Widget _buildList() {
    final list = _filteredMessages;
    if (list.isEmpty) {
      return const Center(child: Text('No messages found in this filter.', style: TextStyle(color: Colors.white24, fontSize: 13)));
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 90),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final msg = list[i];
        return MessageTile(
          key: ValueKey(msg),
          message: msg,
          onPredictionResult: (prediction) {
            setState(() => _predictions[msg] = prediction);
          },
        );
      },
    );
  }

  Widget _buildLoading() => const Center(child: CircularProgressIndicator(color: Colors.redAccent));
  Widget _buildEmpty() => const Center(child: Text('Inbox is empty.', style: TextStyle(color: Colors.white24, fontSize: 13)));
}