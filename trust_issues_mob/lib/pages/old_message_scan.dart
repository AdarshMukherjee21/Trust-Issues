// import 'package:flutter/material.dart';
// import 'package:another_telephony/telephony.dart';
// import 'package:trust_issues_mob/components/app_sidebar.dart';
// import 'package:trust_issues_mob/components/message_tile.dart';

// // Filter options — null means "All"
// enum InboxFilter { all, threats, utility, safe, unscanned }

// class OldMessageScan extends StatefulWidget {
//   final String apiKey;
//   const OldMessageScan({super.key, required this.apiKey});

//   @override
//   State<OldMessageScan> createState() => _OldMessageScanState();
// }

// class _OldMessageScanState extends State<OldMessageScan> {
//   final Telephony _telephony = Telephony.instance;

//   List<String> _messages = [];
//   bool _isLoading = false;

//   // We track per-message ML state here so the summary bar can show counts
//   // Key: message string, Value: "SPAM" | "HAM" | null (not yet scanned)
//   final Map<String, String?> _predictions = {};

//   InboxFilter _filter = InboxFilter.all;

//   // ── Palette ──────────────────────────────────────────────
//   static const Color _bg      = Color(0xFF0A0A0F);
//   static const Color _surface = Color(0xFF161621);
//   static const Color _crimson = Color(0xFFFF4D4D);
//   static const Color _emerald = Color(0xFF00E676);
//   static const Color _cyan    = Color(0xFF00E5FF);

//   // ── Fetch inbox ──────────────────────────────────────────
//   Future<void> _scanMessages() async {
//     setState(() { _isLoading = true; _predictions.clear(); });

//     final granted = await _telephony.requestPhoneAndSmsPermissions;
//     if (granted == true) {
//       final inbox = await _telephony.getInboxSms(
//         columns: [SmsColumn.ADDRESS, SmsColumn.BODY],
//         sortOrder: [OrderBy(SmsColumn.DATE, sort: Sort.DESC)],
//       );
//       setState(() {
//         _messages = inbox.map((s) => '${s.address}: ${s.body}').toList();
//         // Pre-populate prediction map with nulls
//         for (final m in _messages) _predictions[m] = null;
//         _isLoading = false;
//       });
//     } else {
//       setState(() => _isLoading = false);
//     }
//   }

//   @override
//   void initState() {
//     super.initState();
//     _scanMessages();
//   }

//   // ── Derived counts ───────────────────────────────────────
//   int get _scannedCount  => _predictions.values.where((v) => v != null).length;
//   int get _threatCount   => _predictions.values.where((v) => v == 'SPAM').length;
//   int get _pendingCount  => _predictions.values.where((v) => v == null).length;

//   // ── Filter logic ─────────────────────────────────────────
//   List<String> get _filteredMessages {
//     switch (_filter) {
//       case InboxFilter.all:
//         return _messages;
//       case InboxFilter.threats:
//         return _messages.where((m) => _predictions[m] == 'SPAM').toList();
//       case InboxFilter.utility:
//         // Utility = HAM for now; extend when you add more categories
//         return _messages.where((m) => _predictions[m] == 'HAM').toList();
//       case InboxFilter.safe:
//         return _messages.where((m) => _predictions[m] == 'HAM').toList();
//       case InboxFilter.unscanned:
//         return _messages.where((m) => _predictions[m] == null).toList();
//     }
//   }

//   // ── UI ───────────────────────────────────────────────────
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: _bg,
//       drawer: const AppSidebar(currentRoute: 'old'),
//       appBar: AppBar(
//         title: Text(
//           'INBOX AUDIT',
//           style: TextStyle(
//             letterSpacing: 1.5,
//             fontWeight: FontWeight.bold,
//             fontSize: 16,
//             color: Colors.white.withOpacity(0.7),
//           ),
//         ),
//         centerTitle: true,
//         backgroundColor: Colors.transparent,
//         elevation: 0,
//         iconTheme: const IconThemeData(color: Colors.white, size: 28),
//         actions: [
//           IconButton(
//             icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
//             onPressed: _scanMessages,
//           ),
//         ],
//       ),
//       body: _isLoading ? _buildLoading() : _buildBody(),
//     );
//   }

//   Widget _buildBody() {
//     return Column(
//       children: [
//         _buildSummary(),
//         _buildFilterBar(),
//         const SizedBox(height: 8),
//         Expanded(
//           child: Container(
//             decoration: const BoxDecoration(
//               color: _surface,
//               borderRadius: BorderRadius.only(
//                 topLeft: Radius.circular(32),
//                 topRight: Radius.circular(32),
//               ),
//             ),
//             child: _messages.isEmpty ? _buildEmpty() : _buildList(),
//           ),
//         ),
//       ],
//     );
//   }

//   // ── Summary card ─────────────────────────────────────────
//   Widget _buildSummary() {
//     return Padding(
//       padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
//       child: Container(
//         padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
//         decoration: BoxDecoration(
//           color: _crimson.withOpacity(0.08),
//           borderRadius: BorderRadius.circular(24),
//           border: Border.all(color: Colors.white.withOpacity(0.05)),
//         ),
//         child: Row(
//           children: [
//             // left — message count + scanned progress
//             Column(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 Text('SCAN COMPLETE',
//                     style: TextStyle(
//                         color: _crimson,
//                         fontWeight: FontWeight.bold,
//                         fontSize: 9,
//                         letterSpacing: 1)),
//                 const SizedBox(height: 4),
//                 Text('${_messages.length} Messages',
//                     style: const TextStyle(
//                         color: Colors.white,
//                         fontSize: 18,
//                         fontWeight: FontWeight.w600)),
//                 const SizedBox(height: 3),
//                 Text(
//                   '$_scannedCount scanned · $_pendingCount pending',
//                   style: TextStyle(
//                       color: Colors.white.withOpacity(0.35),
//                       fontSize: 10),
//                 ),
//               ],
//             ),
//             const Spacer(),
//             // right — threat count
//             _statBadge(_threatCount.toString(), 'THREATS', _crimson),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _statBadge(String value, String label, Color color) => Column(
//     children: [
//       Text(value,
//           style: TextStyle(color: color, fontSize: 26, fontWeight: FontWeight.bold)),
//       Text(label,
//           style: TextStyle(
//               color: color.withOpacity(0.5), fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
//     ],
//   );

//   // ── Filter chips ─────────────────────────────────────────
//   Widget _buildFilterBar() {
//     return SingleChildScrollView(
//       scrollDirection: Axis.horizontal,
//       padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
//       child: Row(
//         children: [
//           _chip('ALL',       InboxFilter.all,      Colors.white),
//           _chip('THREATS',   InboxFilter.threats,   _crimson),
//           _chip('HAM',       InboxFilter.utility,   _cyan),
//           _chip('UNSCANNED', InboxFilter.unscanned, Colors.white38),
//         ],
//       ),
//     );
//   }

//   Widget _chip(String label, InboxFilter filter, Color color) {
//     final selected = _filter == filter;
//     return Padding(
//       padding: const EdgeInsets.only(right: 8),
//       child: GestureDetector(
//         onTap: () => setState(() => _filter = filter),
//         child: AnimatedContainer(
//           duration: const Duration(milliseconds: 180),
//           padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
//           decoration: BoxDecoration(
//             color: selected ? color.withOpacity(0.15) : Colors.white.withOpacity(0.06),
//             borderRadius: BorderRadius.circular(10),
//             border: Border.all(
//               color: selected ? color.withOpacity(0.6) : Colors.transparent,
//               width: 0.8,
//             ),
//           ),
//           child: Text(
//             label,
//             style: TextStyle(
//               color: selected ? color : Colors.white38,
//               fontSize: 9,
//               fontWeight: FontWeight.bold,
//               letterSpacing: 1,
//             ),
//           ),
//         ),
//       ),
//     );
//   }

//   // ── Message list ─────────────────────────────────────────
//   Widget _buildList() {
//     final list = _filteredMessages;
//     if (list.isEmpty) {
//       return const Center(
//         child: Text('No messages in this category.',
//             style: TextStyle(color: Colors.white24, fontSize: 13)),
//       );
//     }

//     return ListView.separated(
//       padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
//       itemCount: list.length,
//       separatorBuilder: (_, __) => const SizedBox(height: 10),
//       itemBuilder: (_, i) {
//         final msg = list[i];
//         return MessageTile(
//           key: ValueKey(msg),  // stable key so state is preserved on filter change
//           message: msg,
//           apiKey: widget.apiKey,
//           // callback so the scan screen can update its summary counts
//           onPredictionResult: (prediction) {
//             setState(() => _predictions[msg] = prediction);
//           },
//         );
//       },
//     );
//   }

//   // ── States ───────────────────────────────────────────────
//   Widget _buildLoading() => Center(
//     child: Column(
//       mainAxisAlignment: MainAxisAlignment.center,
//       children: [
//         const SizedBox(
//           width: 36, height: 36,
//           child: CircularProgressIndicator(color: Colors.redAccent, strokeWidth: 2),
//         ),
//         const SizedBox(height: 18),
//         Text(
//           'DECRYPTING INBOX...',
//           style: TextStyle(
//               color: Colors.white.withOpacity(0.4),
//               letterSpacing: 3,
//               fontSize: 11),
//         ),
//       ],
//     ),
//   );

//   Widget _buildEmpty() => const Center(
//     child: Text('No messages found.',
//         style: TextStyle(color: Colors.white24, fontSize: 13)),
//   );
// }