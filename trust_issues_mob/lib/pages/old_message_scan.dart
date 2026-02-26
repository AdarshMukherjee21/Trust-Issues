import 'package:flutter/material.dart';
import 'package:another_telephony/telephony.dart';
import 'package:trust_issues_mob/components/app_sidebar.dart';
import 'package:trust_issues_mob/components/message_tile.dart';

class OldMessageScan extends StatefulWidget {
  const OldMessageScan({super.key});

  @override
  State<OldMessageScan> createState() => _OldMessageScanState();
}

class _OldMessageScanState extends State<OldMessageScan> {
  final Telephony telephony = Telephony.instance;
  List<String> messages = [];
  bool isLoading = false;
  
  // 🎯 Filter State
  // We use 'null' to represent "All"
  SmsCategory? selectedFilter;

  final Color primaryDark = const Color(0xFF0A0A0F);
  final Color surfaceDark = const Color(0xFF161621);
  final Color accentCrimson = const Color(0xFFFF4D4D);
  final Color accentEmerald = const Color(0xFF00E676);
  final Color accentCyan = const Color(0xFF00E5FF);

  final List<String> warningKeywords = ["win", "lottery", "prize", "offer", "free", "urgent", "click", "limited", "reward", "claim", "investment", "crypto", "loan", "congratulations"];
  final List<String> utilsKeywords = ["otp", "one time password", "verification code", "bank", "transaction", "debited", "credited", "account", "upi", "payment"];
  final List<String> safeKeywords = ["mom", "dad", "bro", "sis", "friend", "meet", "dinner", "home"];

  bool containsLink(String message) {
    final urlRegex = RegExp(r'(https?:\/\/|www\.|\.com|\.in|\.net|\.org)', caseSensitive: false);
    return urlRegex.hasMatch(message);
  }

  SmsCategory classifyMessage(String message) {
    final lowerMessage = message.toLowerCase();
    if (containsLink(lowerMessage)) return SmsCategory.warning;
    if (warningKeywords.any((word) => lowerMessage.contains(word))) return SmsCategory.warning;
    if (utilsKeywords.any((word) => lowerMessage.contains(word))) return SmsCategory.utils;
    if (safeKeywords.any((word) => lowerMessage.contains(word))) return SmsCategory.safe;
    return SmsCategory.none;
  }

  Future<void> scanOldMessages() async {
    setState(() => isLoading = true);
    bool? permissionsGranted = await telephony.requestPhoneAndSmsPermissions;

    if (permissionsGranted == true) {
      List<SmsMessage> inboxMessages = await telephony.getInboxSms(
        columns: [SmsColumn.ADDRESS, SmsColumn.BODY],
        sortOrder: [OrderBy(SmsColumn.DATE, sort: Sort.DESC)],
      );

      setState(() {
        messages = inboxMessages.map((sms) => "${sms.address}: ${sms.body}").toList();
        isLoading = false;
      });
    } else {
      setState(() => isLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    scanOldMessages();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: primaryDark,
      drawer: const AppSidebar(currentRoute: "old"),
      appBar: AppBar(
        title: Text("INBOX AUDIT", style: TextStyle(letterSpacing: 1.5, fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white.withOpacity(0.7))),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white, size: 28),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
            onPressed: scanOldMessages,
          )
        ],
      ),
      body: isLoading ? _buildLoadingState() : _buildBody(),
    );
  }

  Widget _buildBody() {
    return Column(
      children: [
        _buildScanSummary(),
        _buildFilterBar(), // 🔍 New Filter Bar
        const SizedBox(height: 10),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: surfaceDark,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
            ),
            child: messages.isEmpty ? _buildEmptyState() : _buildMessageList(),
          ),
        ),
      ],
    );
  }

  // 🍟 Filter Chip Logic
  Widget _buildFilterBar() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        children: [
          _filterChip("ALL", null, Colors.white),
          _filterChip("THREATS", SmsCategory.warning, accentCrimson),
          _filterChip("UTILITY", SmsCategory.utils, accentCyan),
          _filterChip("SAFE", SmsCategory.safe, accentEmerald),
        ],
      ),
    );
  }

  Widget _filterChip(String label, SmsCategory? category, Color color) {
    bool isSelected = selectedFilter == category;
    
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label,style: TextStyle(color: Colors.black),),
        selected: isSelected,
        onSelected: (val) => setState(() => selectedFilter = category),
        backgroundColor: Colors.grey.withAlpha(200),
        selectedColor: color.withOpacity(0.5),
        labelStyle: TextStyle(
          color: isSelected ? color : Colors.white38,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: isSelected ? color : Colors.transparent),
        ),
        showCheckmark: false,
      ),
    );
  }

  Widget _buildScanSummary() {
    int threats = messages.where((m) => classifyMessage(m) == SmsCategory.warning).length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [accentCrimson.withOpacity(0.15), Colors.transparent],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("SCAN COMPLETE", style: TextStyle(color: accentCrimson, fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text("${messages.length} Messages", style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
              ],
            ),
            const Spacer(),
            _statBadge(threats.toString(), "THREATS", accentCrimson),
          ],
        ),
      ),
    );
  }

  Widget _statBadge(String value, String label, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
        Text(label, style: TextStyle(color: color.withOpacity(0.5), fontSize: 9, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildMessageList() {
    // 🧠 Apply Filter to the list before rendering
    final filteredList = selectedFilter == null 
        ? messages 
        : messages.where((m) => classifyMessage(m) == selectedFilter).toList();

    if (filteredList.isEmpty) {
      return const Center(child: Text("No messages in this category.", style: TextStyle(color: Colors.white24)));
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 25),
      itemCount: filteredList.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final category = classifyMessage(filteredList[index]);
        return MessageTile(message: filteredList[index], category: category);
      },
    );
  }

  // ... (Keep _buildLoadingState and _buildEmptyState as they are)

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            height: 40, width: 40,
            child: CircularProgressIndicator(color: Colors.redAccent, strokeWidth: 2),
          ),
          const SizedBox(height: 20),
          Text("DECRYPTING INBOX...", style: TextStyle(color: Colors.white.withOpacity(0.5), letterSpacing: 3, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Text("No messages found in database.", style: TextStyle(color: Colors.white24)),
    );
  }


}