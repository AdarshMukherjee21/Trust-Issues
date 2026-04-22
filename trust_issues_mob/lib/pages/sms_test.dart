// import 'package:another_telephony/telephony.dart';
// import 'package:flutter/material.dart';
// import 'package:trust_issues_mob/components/app_sidebar.dart';
// import 'package:trust_issues_mob/components/message_tile.dart';
// import 'package:trust_issues_mob/components/sms_scanner_running_notification.dart';

// class TrustIssuesTest extends StatefulWidget {
//   const TrustIssuesTest({super.key});

//   @override
//   State<TrustIssuesTest> createState() => _TrustIssuesTestState();
// }

// class _TrustIssuesTestState extends State<TrustIssuesTest> {
//   final Telephony telephony = Telephony.instance;
//   List<String> messages = [];
//   bool isListening = false;

//   // Design Constants
//   final Color primaryDark = const Color(0xFF0A0A0F);
//   final Color surfaceDark = const Color(0xFF161621);
//   final Color accentCyan = const Color(0xFF00E5FF);

//   final List<String> warningKeywords = ["win", "lottery", "prize", "offer", "free", "urgent", "click", "limited", "reward", "claim", "investment", "crypto", "loan", "congratulations"];
//   final List<String> utilsKeywords = ["otp", "one time password", "verification code", "bank", "transaction", "debited", "credited", "account", "upi", "payment"];
//   final List<String> safeKeywords = ["mom", "dad", "bro", "sis", "friend", "meet", "dinner", "home"];

//   void onMessage(SmsMessage message) {
//     setState(() {
//       messages.insert(0, "${message.address}: ${message.body}");
//     });
//   }

//   bool containsLink(String message) {
//     final urlRegex = RegExp(r'(https?:\/\/|www\.|\.com|\.in|\.net|\.org)', caseSensitive: false);
//     return urlRegex.hasMatch(message);
//   }

//   SmsCategory classifyMessage(String message) {
//     final lowerMessage = message.toLowerCase();
//     if (containsLink(lowerMessage)) return SmsCategory.warning;
//     if (warningKeywords.any((word) => lowerMessage.contains(word))) return SmsCategory.warning;
//     if (utilsKeywords.any((word) => lowerMessage.contains(word))) return SmsCategory.utils;
//     if (safeKeywords.any((word) => lowerMessage.contains(word))) return SmsCategory.safe;
//     return SmsCategory.none;
//   }

//   Future<void> startListening() async {
//     bool? permissionsGranted = await telephony.requestPhoneAndSmsPermissions;
//     if (permissionsGranted == true) {
//       setState(() => isListening = true);
//       telephony.listenIncomingSms(onNewMessage: onMessage, listenInBackground: false);
//       await SmsScannerRunningNotification.show();
//     }
//   }

//   Future<void> stopListening() async {
//     setState(() => isListening = false);
//     await SmsScannerRunningNotification.cancel();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: primaryDark,
//       drawer: const AppSidebar(currentRoute: "live"),

      
//       appBar: AppBar(
//         iconTheme: const IconThemeData(
//     color: Color(0xFF00E5FF), // Using your Neon Cyan from the previous code
//   ),
//         title:  Text("SMS LAB", style: TextStyle(letterSpacing: 1.5, fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white.withOpacity(0.7))),
//         centerTitle: true,
//         backgroundColor: Colors.transparent,
//         elevation: 0,
//         actions: [  
//           Padding(
//             padding: const EdgeInsets.only(right: 16.0),
//             child: CircleAvatar(
//               radius: 4,
//               backgroundColor: isListening ? Colors.greenAccent : Colors.redAccent,
//             ),
//           )
//         ],
//       ),
//       body: Column(
//         children: [
//           _buildHeaderControl(),
//           const SizedBox(height: 10),
//           Padding(
//             padding: const EdgeInsets.symmetric(horizontal: 20),
//             child: Row(
//               children: [
//                 Text("LIVE FEED", style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.bold)),
//                 const Spacer(),
                
//               ],
//             ),
//           ),
//           const SizedBox(height: 10),
//           Expanded(
//             child: Container(
//               margin: const EdgeInsets.only(top: 10),
//               decoration: BoxDecoration(
//                 color: surfaceDark,
//                 borderRadius: const BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30)),
//               ),
//               child: messages.isEmpty ? _buildEmptyState() : _buildMessageList(),
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildHeaderControl() {
//     return Container(
//       padding: const EdgeInsets.all(20),
//       child: Row(
//         children: [
//           Expanded(
//             child: _actionButton(
//               label: "SHIELD ACTIVE",
//               isActive: isListening,
//               icon: Icons.security,
//               activeColor: accentCyan,
//               onTap: isListening ? null : startListening,
//             ),
//           ),
//           const SizedBox(width: 15),
//           Expanded(
//             child: _actionButton(
//               label: "DEACTIVATE",
//               isActive: !isListening,
//               icon: Icons.power_settings_new,
//               activeColor: Colors.redAccent,
//               onTap: !isListening ? null : stopListening,
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _actionButton({required String label, required bool isActive, required IconData icon, required Color activeColor, VoidCallback? onTap}) {
//     return GestureDetector(
//       onTap: onTap,
//       child: AnimatedContainer(
//         duration: const Duration(milliseconds: 300),
//         padding: const EdgeInsets.symmetric(vertical: 16),
//         decoration: BoxDecoration(
//           color: isActive ? activeColor.withOpacity(0.1) : surfaceDark,
//           borderRadius: BorderRadius.circular(16),
//           border: Border.all(color: isActive ? activeColor : Colors.white10, width: 1),
//         ),
//         child: Column(
//           children: [
//             Icon(icon, color: isActive ? activeColor : Colors.white38),
//             const SizedBox(height: 8),
//             Text(label, style: TextStyle(color: isActive ? activeColor : Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildEmptyState() {
//     return Center(
//       child: Column(
//         mainAxisAlignment: MainAxisAlignment.center,
//         children: [
//           Icon(Icons.radar, size: 64, color: Colors.white.withOpacity(0.05)),
//           const SizedBox(height: 16),
//           Text("SCANNING FOR THREATS...", style: TextStyle(color: Colors.white.withOpacity(0.3), letterSpacing: 2)),
//         ],
//       ),
//     );
//   }

//   Widget _buildMessageList() {
//     return ListView.separated(
//       padding: const EdgeInsets.all(20),
//       itemCount: messages.length,
//       separatorBuilder: (context, index) => const SizedBox(height: 12),
//       itemBuilder: (context, index) {
       
//         return MessageTile(message: messages[index], apiKey: "Love_all_trust_a_few",);
//       },
//     );
//   }
// }