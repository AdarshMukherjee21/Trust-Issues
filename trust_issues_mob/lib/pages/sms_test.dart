
import 'package:another_telephony/telephony.dart';
import 'package:flutter/material.dart';
import 'package:trust_issues_mob/components/sms_scanner_running_notification.dart';

class TrustIssuesTest extends StatefulWidget {
  const TrustIssuesTest({super.key});

  @override
  State<TrustIssuesTest> createState() => _TrustIssuesTestState();
}

class _TrustIssuesTestState extends State<TrustIssuesTest> {
  final Telephony telephony = Telephony.instance;
  List<String> messages = [];
  bool isListening = false;

  // This function handles the incoming SMS
  void onMessage(SmsMessage message) {
    setState(() {
      messages.insert(0, "${message.address}: ${message.body}");
    });
  }

void startListening() async {
  bool? permissionsGranted = await telephony.requestPhoneAndSmsPermissions;

  if (permissionsGranted == true) {
    setState(() => isListening = true);

    telephony.listenIncomingSms(
      onNewMessage: onMessage,
      listenInBackground: false,
    );

    // 🔔 Show persistent notification
    await SmsScannerRunningNotification.show();
  }
}

void stopListening() async {
  setState(() {
    isListening = false;
  });

  // ❌ Remove notification
  await SmsScannerRunningNotification.cancel();
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Trust Issues: SMS Lab 🚩"),
        backgroundColor: Colors.redAccent,
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton.icon(
                onPressed: isListening ? null : startListening,
                icon: const Icon(Icons.play_arrow),
                label: const Text("START"),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              ),
              ElevatedButton.icon(
                onPressed: !isListening ? null : stopListening,
                icon: const Icon(Icons.stop),
                label: const Text("STOP"),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.black),
              ),
            ],
          ),
          const Divider(height: 40),
          Expanded(
            child: messages.isEmpty
                ? const Center(child: Text("No messages yet. Send one from the emulator!"))
                : ListView.builder(
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
                        child: ListTile(
                          leading: const Icon(Icons.sms_failed, color: Colors.red),
                          title: Text(messages[index]),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}