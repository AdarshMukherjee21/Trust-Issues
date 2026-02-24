import 'package:another_telephony/telephony.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:trust_issues_mob/components/sms_scanner_running_notification.dart';

class TrustIssuesTest extends StatefulWidget {
  const TrustIssuesTest({super.key});

  @override
  State<TrustIssuesTest> createState() => _TrustIssuesTestState();
}

class _TrustIssuesTestState extends State<TrustIssuesTest> {
  final Telephony telephony = Telephony.instance;

  static const MethodChannel _smsRoleChannel =
      MethodChannel('sms_role_channel');

  List<String> messages = [];
  bool isListening = false;

  //  Request SMS Role (Default SMS App)
  Future<void> requestSmsRole() async {
    try {
      await _smsRoleChannel.invokeMethod('requestSmsRole');
    } catch (e) {
      debugPrint("SMS Role error: $e");
    }
  }

  // 📩 Handle Incoming SMS
  void onMessage(SmsMessage message) {
    setState(() {
      messages.insert(0, "${message.address}: ${message.body}");
    });
  }

  // ▶ START Listening
  Future<void> startListening() async {
    // Step 1: Ask to become default SMS app
    await requestSmsRole();

    // Step 2: Request runtime SMS permissions
    bool? permissionsGranted =
        await telephony.requestPhoneAndSmsPermissions;

    if (permissionsGranted == true) {
      setState(() => isListening = true);

      telephony.listenIncomingSms(
        onNewMessage: onMessage,
        listenInBackground: false,
      );

      await SmsScannerRunningNotification.show();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("SMS Scanner Started"),
            backgroundColor: Colors.green,
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("SMS permission denied."),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // ⛔ STOP Listening
  Future<void> stopListening() async {
    setState(() {
      isListening = false;
    });

    await SmsScannerRunningNotification.cancel();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("SMS Scanner Stopped"),
          backgroundColor: Colors.black,
        ),
      );
    }
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

          // 🔘 Start / Stop Buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton.icon(
                onPressed: isListening ? null : startListening,
                icon: const Icon(Icons.play_arrow),
                label: const Text("START"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                ),
              ),
              ElevatedButton.icon(
                onPressed: !isListening ? null : stopListening,
                icon: const Icon(Icons.stop),
                label: const Text("STOP"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                ),
              ),
            ],
          ),

          const Divider(height: 40),

          // 📜 Message List
          Expanded(
            child: messages.isEmpty
                ? const Center(
                    child: Text(
                      "No messages yet.\nSend one to this device!",
                      textAlign: TextAlign.center,
                    ),
                  )
                : ListView.builder(
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      return Card(
                        margin: const EdgeInsets.symmetric(
                            horizontal: 15, vertical: 5),
                        child: ListTile(
                          leading: const Icon(
                            Icons.sms_failed,
                            color: Colors.red,
                          ),
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