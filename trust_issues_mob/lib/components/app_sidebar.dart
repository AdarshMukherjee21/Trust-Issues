import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:trust_issues_mob/pages/old_message_scan.dart';
import 'package:trust_issues_mob/pages/sms_test.dart';

class AppSidebar extends StatelessWidget {
  final String currentRoute;

  const AppSidebar({
    super.key,
    required this.currentRoute,
  });

  void navigate(BuildContext context, Widget page, String routeName) {
    if (currentRoute == routeName) {
      Navigator.pop(context);
      return;
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => page),
    );
  }

  @override
  Widget build(BuildContext context) {
    final Color primaryDark = const Color(0xFF0A0A0F);
    final Color accentCyan = const Color(0xFF00E5FF);
    final Color accentCrimson = const Color(0xFFFF4D4D);

    return Drawer(
      backgroundColor: primaryDark,
      child: Container(
        decoration: BoxDecoration(
          border: Border(right: BorderSide(color: Colors.white.withOpacity(0.05), width: 1)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 80),

            // 🔥 Tech Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.03),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: accentCrimson.withOpacity(0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: accentCrimson.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.shield_rounded, color: accentCrimson, size: 28),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          "TRUST ISSUES",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            letterSpacing: 2,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Text(
                          "SECURITY PROTOCOL v1.0",
                          style: TextStyle(
                            color: accentCrimson.withOpacity(0.6),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 40),

            // 🔘 Navigation Links
            _buildNavTile(
              context,
              icon: Icons.radar_rounded,
              label: "LIVE SCANNER",
              routeName: "live",
              destination: const TrustIssuesTest(),
              activeColor: accentCyan,
            ),
            
            const SizedBox(height: 8),

            _buildNavTile(
              context,
              icon: Icons.manage_search_rounded,
              label: "INBOX AUDIT",
              routeName: "old",
              destination: const OldMessageScan(),
              activeColor: accentCrimson,
            ),

            const Spacer(),

            // 🛠 System Footer
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 4,
                    backgroundColor: Colors.greenAccent,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "CORE SYSTEM SECURE",
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.2),
                      fontSize: 10,
                      letterSpacing: 1,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildNavTile(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String routeName,
    required Widget destination,
    required Color activeColor,
  }) {
    bool isActive = currentRoute == routeName;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isActive ? activeColor.withOpacity(0.08) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: ListTile(
          onTap: () => navigate(context, destination, routeName),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          leading: Icon(
            icon,
            color: isActive ? activeColor : Colors.white38,
            size: 22,
          ),
          title: Text(
            label,
            style: TextStyle(
              color: isActive ? Colors.white : Colors.white38,
              fontSize: 13,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              letterSpacing: 1.5,
            ),
          ),
          trailing: isActive 
              ? Icon(Icons.arrow_forward_ios_rounded, color: activeColor, size: 12) 
              : null,
        ),
      ),
    );
  }
}