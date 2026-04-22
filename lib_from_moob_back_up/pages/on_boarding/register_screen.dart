import 'package:flutter/material.dart';
import 'package:trust_issues_mob/services/login_new_acc_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _ageController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  final _authService = AuthService();
  bool _isLoading = false;
  bool _isGoogleReady = false; // Tracks if the required fields are filled

  @override
  void initState() {
    super.initState();
    // Listen to changes in these fields to unlock the Google button
    _nameController.addListener(_validateGoogleFields);
    _usernameController.addListener(_validateGoogleFields);
    _ageController.addListener(_validateGoogleFields);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _ageController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _validateGoogleFields() {
    setState(() {
      _isGoogleReady = _nameController.text.trim().isNotEmpty &&
                       _usernameController.text.trim().isNotEmpty &&
                       _ageController.text.trim().isNotEmpty;
    });
  }

  void _register() async {
    if (!_isGoogleReady) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Name, Alias, and Age are required.")));
      return;
    }
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Email and Passkey are required for manual setup.")));
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _authService.registerWithEmailPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        name: _nameController.text.trim(),
        username: _usernameController.text.trim(),
        age: _ageController.text.trim(),
      );
      if (mounted) Navigator.pop(context); 
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().split(']').last.trim())),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _googleRegister() async {
    setState(() => _isLoading = true);
    try {
      // Pass the typed values so they are saved to Firestore
      await _authService.signInWithGoogle(
        name: _nameController.text.trim(),
        username: _usernameController.text.trim(),
        age: _ageController.text.trim(),
      );
      if (mounted) Navigator.pop(context); 
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().split(']').last.trim())),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  "INITIALIZE NODE",
                  style: TextStyle(
                    color: Color(0xFF00E5FF),
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(height: 30),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: Column(
                    children: [
                      // Required Profile Fields
                      _buildTextField(_nameController, "Full Name *", false),
                      const SizedBox(height: 12),
                      _buildTextField(_usernameController, "Alias (Username) *", false),
                      const SizedBox(height: 12),
                      _buildTextField(_ageController, "Age *", false, isNumber: true),
                      
                      const SizedBox(height: 24),
                      
                      // Google Sign Up
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.white.withOpacity(_isGoogleReady ? 0.4 : 0.1)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            backgroundColor: Colors.white.withOpacity(_isGoogleReady ? 0.05 : 0.01),
                          ),
                          onPressed: (_isLoading || !_isGoogleReady) ? null : _googleRegister,
                          icon: Icon(Icons.g_mobiledata, color: _isGoogleReady ? Colors.white : Colors.white30, size: 28),
                          label: Text(
                            "Initialize with Google", 
                            style: TextStyle(color: _isGoogleReady ? Colors.white : Colors.white30, fontWeight: FontWeight.bold)
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: Divider(color: Colors.white.withOpacity(0.1), thickness: 1)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text("OR MANUAL SETUP", style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                          Expanded(child: Divider(color: Colors.white.withOpacity(0.1), thickness: 1)),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Optional Manual Fields
                      _buildTextField(_emailController, "Node Address (Email)", false),
                      const SizedBox(height: 12),
                      _buildTextField(_passwordController, "Passkey", true),
                      const SizedBox(height: 24),
                      
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00E5FF),
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: _isLoading ? null : _register,
                          child: _isLoading 
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                            : const Text("ESTABLISH CONNECTION", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, bool isObscure, {bool isNumber = false}) {
    return TextField(
      controller: controller,
      obscureText: isObscure,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
        filled: true,
        fillColor: Colors.black.withOpacity(0.4),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF00E5FF), width: 1),
        ),
      ),
    );
  }
}