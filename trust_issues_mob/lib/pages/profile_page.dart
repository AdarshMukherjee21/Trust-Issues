import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
// 🛡️ 1. Import your central AuthService
import 'package:trust_issues_mob/services/login_new_acc_service.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  // 🛡️ 2. Instantiate it
  final AuthService _authService = AuthService();

  int _smsCount = 0;
  int _emailCount = 0;
  int _aiCount = 0;
  bool _isLoadingStats = true;

  static const Color _bg = Color(0xFF0A0A0F);
  static const Color _surface = Color(0xFF161621);
  static const Color _crimson = Color(0xFFFF4D4D);
  static const Color _emerald = Color(0xFF00E676);
  static const Color _cyan    = Color(0xFF00E5FF);

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;
    
    if (mounted) setState(() => _isLoadingStats = true);

    try {
      final smsSnap = await _firestore.collection('users').doc(uid).collection('sms_checks').count().get();
      final emailSnap = await _firestore.collection('users').doc(uid).collection('email_checks').count().get();
      final aiSnap = await _firestore.collection('users').doc(uid).collection('ai_asks').count().get();

      if (mounted) {
        setState(() {
          _smsCount = smsSnap.count ?? 0;
          _emailCount = emailSnap.count ?? 0;
          _aiCount = aiSnap.count ?? 0;
          _isLoadingStats = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingStats = false);
    }
  }

  // 🛡️ 3. Simplify the Sign Out logic!
  void _signOut() async {
    try {
      // Let the service handle Google and Firebase securely
      await _authService.signOut();
      
      // No Navigator code needed here! 
      // The AuthGate sitting at the root of your app will instantly detect 
      // the session ended and rebuild the UI to show the LoginScreen.
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error signing out: $e")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        title: Text(
          'PROFILE',
          style: TextStyle(letterSpacing: 1.5, fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white.withOpacity(0.9)),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _fetchStats,
            tooltip: 'Refresh Stats',
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _emerald,
        backgroundColor: _surface,
        onRefresh: _fetchStats,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Logo

            const SizedBox(height: 24),
            
            // User Info
            CircleAvatar(
              radius: 40,
              backgroundColor: _surface,
              backgroundImage: user?.photoURL != null ? NetworkImage(user!.photoURL!) : null,
              child: user?.photoURL == null 
                ? const Icon(Icons.person, size: 40, color: Colors.white) 
                : null,
            ),
            const SizedBox(height: 16),
            Text(
              user?.displayName ?? 'Anonymous User',
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              user?.email ?? 'No email',
              style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 14),
            ),
            
            const SizedBox(height: 48),

            // Stats Grid
            _isLoadingStats
                ? const CircularProgressIndicator(color: _emerald)
                : Row(
                    children: [
                      Expanded(child: _buildStatCard('SMS', _smsCount.toString(), _emerald, Icons.message)),
                      const SizedBox(width: 16),
                      Expanded(child: _buildStatCard('EMAIL', _emailCount.toString(), _cyan, Icons.email)),
                      const SizedBox(width: 16),
                      Expanded(child: _buildStatCard('AI ASKS', _aiCount.toString(), _crimson, Icons.auto_awesome)),
                    ],
                  ),

            const SizedBox(height: 48),

            // Sign Out Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: _signOut,
                icon: const Icon(Icons.logout, color: Colors.white),
                label: const Text('SIGN OUT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _crimson.withOpacity(0.8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),

            const SizedBox(height: 32),
            Image.asset('assets/Trust_issues_logo_horizontal_no_bg.png', height: 40, opacity: const AlwaysStoppedAnimation(0.3)),
          ],
        ),
      ),
    ));
  }

  Widget _buildStatCard(String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.05), blurRadius: 20, spreadRadius: -5)
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: color.withOpacity(0.7), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ],
      ),
    );
  }
}