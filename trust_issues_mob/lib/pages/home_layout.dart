import 'package:flutter/material.dart';
import 'package:google_nav_bar/google_nav_bar.dart';
import 'package:trust_issues_mob/pages/my_checks_page.dart';
import 'package:trust_issues_mob/pages/friends_page.dart';
import 'package:trust_issues_mob/pages/community_page.dart';
import 'package:trust_issues_mob/pages/profile_page.dart';

class HomeLayout extends StatefulWidget {
  const HomeLayout({super.key});

  @override
  State<HomeLayout> createState() => _HomeLayoutState();
}

class _HomeLayoutState extends State<HomeLayout> {
  int _selectedIndex = 0;

  // We will build these pages in subsequent steps
  final List<Widget> _pages = [
    const MyChecksPage(),
    const FriendsPage(),
    const CommunityPage(),
    const ProfilePage(),
  ];

  static const Color _bg = Color(0xFF0A0A0F);
  static const Color _surface = Color(0xFF161621);
  static const Color _emerald = Color(0xFF00E676);
  static const Color _cyan = Color(0xFF00E5FF);
  static const Color _violet = Color(0xFFA78BFA);
  static const Color _crimson = Color(0xFFFF4D4D);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: _surface,
          boxShadow: [
            BoxShadow(
              blurRadius: 20,
              color: Colors.black.withOpacity(.1),
            )
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15.0, vertical: 12),
            child: GNav(
              rippleColor: Colors.grey[800]!,
              hoverColor: Colors.grey[700]!,
              gap: 8,
              activeColor: Colors.white,
              iconSize: 24,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              duration: const Duration(milliseconds: 400),
              tabBackgroundColor: Colors.white.withOpacity(0.05),
              color: Colors.white54,
              tabs: const [
                GButton(
                  icon: Icons.shield_outlined,
                  text: 'Checks',
                  iconActiveColor: _emerald,
                  textColor: _emerald,
                  backgroundColor: Color(0x1A00E676),
                ),
                GButton(
                  icon: Icons.people_outline,
                  text: 'Friends',
                  iconActiveColor: _cyan,
                  textColor: _cyan,
                  backgroundColor: Color(0x1A00E5FF),
                ),
                GButton(
                  icon: Icons.hub_outlined,
                  text: 'Community',
                  iconActiveColor: _violet,
                  textColor: _violet,
                  backgroundColor: Color(0x1AA78BFA),
                ),
                GButton(
                  icon: Icons.person_outline,
                  text: 'Profile',
                  iconActiveColor: Colors.white,
                  textColor: Colors.white,
                  backgroundColor: Color(0x1AFFFFFF),
                ),
              ],
              selectedIndex: _selectedIndex,
              onTabChange: (index) {
                setState(() {
                  _selectedIndex = index;
                });
              },
            ),
          ),
        ),
      ),
    );
  }
}
