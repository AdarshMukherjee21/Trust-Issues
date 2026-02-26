import 'dart:ui';
import 'package:flutter/material.dart';

enum SmsCategory {
  warning,
  utils,
  safe,
  none,
}

class MessageTile extends StatelessWidget {
  final String message;
  final SmsCategory category;

  const MessageTile({
    super.key,
    required this.message,
    required this.category,
  });

  // Updated modern palette
  Color getCategoryColor() {
    switch (category) {
      case SmsCategory.warning:
        return const Color(0xFFFF4D4D); // Crimson Red
      case SmsCategory.utils:
        return const Color(0xFF00E5FF); // Neon Cyan
      case SmsCategory.safe:
        return const Color(0xFF00E676); // Emerald Green
      case SmsCategory.none:
        return const Color(0xFFB0BEC5); // Blue Grey
    }
  }

  IconData getCategoryIcon() {
    switch (category) {
      case SmsCategory.warning:
        return Icons.gpp_maybe_rounded; // More "security" focused icon
      case SmsCategory.utils:
        return Icons.account_balance_wallet_outlined;
      case SmsCategory.safe:
        return Icons.verified_rounded;
      case SmsCategory.none:
        return Icons.sensors_rounded;
    }
  }

  String getCategoryLabel() {
    switch (category) {
      case SmsCategory.warning:
        return "THREAT DETECTED";
      case SmsCategory.utils:
        return "UTILITY / BANKING";
      case SmsCategory.safe:
        return "VERIFIED SAFE";
      case SmsCategory.none:
        return "UNCLASSIFIED";
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = getCategoryColor();
    // Splitting address and body for better UI if you're passing "Address: Body"
    final List<String> parts = message.contains(': ') ? message.split(': ') : [message, ""];
    final String sender = parts[0];
    final String content = parts.length > 1 ? parts.sublist(1).join(': ') : "";

    return Container(
      margin: const EdgeInsets.only(bottom: 4), // Spacing between tiles
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              color: color.withOpacity(0.05), // Subtle color tint
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withOpacity(0.05),
                width: 1,
              ),
            ),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Side Accent Bar
                  Container(
                    width: 5,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        bottomLeft: Radius.circular(16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(getCategoryIcon(), color: color, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                getCategoryLabel(),
                                style: TextStyle(
                                  color: color,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 10,
                                  letterSpacing: 1.2,
                                ),
                              ),
                             
                              const SizedBox(width: 8),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            sender,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            content,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.7),
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
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