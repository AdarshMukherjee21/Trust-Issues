import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:trust_issues_mob/services/friend_service.dart';
import 'package:trust_issues_mob/services/community_service.dart';
import 'package:trust_issues_mob/components/user_tile.dart';

class FriendsPage extends StatefulWidget {
  const FriendsPage({super.key});

  @override
  State<FriendsPage> createState() => _FriendsPageState();
}

class _FriendsPageState extends State<FriendsPage> {
  final FriendService _friendService = FriendService();
  final CommunityService _communityService = CommunityService();
  final String _currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';

  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  
  bool _isLoadingThreats = false;
  List<dynamic> _friendThreats = [];

  static const Color _bg = Color(0xFF0A0A0F);
  static const Color _cyan = Color(0xFF00E5FF);
  static const Color _emerald = Color(0xFF00E676);
  static const Color _surface = Color(0xFF161621);

  void _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _isSearching = false;
        _searchResults = [];
      });
      return;
    }
    setState(() => _isSearching = true);
    final results = await _friendService.searchUsers(query);
    setState(() {
      _searchResults = results.where((u) => u['uid'] != _currentUid).toList();
    });
  }

  Future<void> _fetchFriendThreats() async {
    setState(() => _isLoadingThreats = true);
    try {
      final res = await _communityService.getFriendThreats(uid: _currentUid);
      setState(() {
        _friendThreats = res['data'] ?? [];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error fetching threats: $e')));
    } finally {
      if (mounted) setState(() => _isLoadingThreats = false);
    }
  }

  void _sendRequest(String targetUid) async {
    try {
      await _friendService.sendFriendRequest(currentUid: _currentUid, targetUid: targetUid);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request Sent!')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _acceptRequest(String targetUid) async {
    try {
      await _friendService.acceptFriendRequest(currentUid: _currentUid, targetUid: targetUid);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request Accepted!')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _removeFriend(String targetUid) async {
    try {
      await _friendService.removeOrCancelFriend(currentUid: _currentUid, targetUid: targetUid);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Friend Removed.')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        title: Text(
          'FRIENDS',
          style: TextStyle(letterSpacing: 1.5, fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white.withOpacity(0.9)),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: Colors.white),
              onChanged: _performSearch,
              decoration: InputDecoration(
                hintText: 'Search by name or username...',
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                prefixIcon: const Icon(Icons.search, color: _cyan),
                filled: true,
                fillColor: _surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
          ),
          
          Expanded(
            child: _isSearching ? _buildSearchResults() : _buildFriendsLists(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_searchResults.isEmpty) {
      return const Center(child: Text("No users found.", style: TextStyle(color: Colors.white54)));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final user = _searchResults[index];
        return UserTile(
          username: user['username'] ?? '',
          name: user['name'] ?? 'Unknown',
          onAdd: () => _sendRequest(user['uid']),
        );
      },
    );
  }

  Widget _buildFriendsLists() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('PENDING REQUESTS'),
          _buildIncomingRequests(),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSectionHeader('ACTIVE FRIENDS'),
              TextButton.icon(
                onPressed: _isLoadingThreats ? null : _fetchFriendThreats,
                icon: _isLoadingThreats 
                  ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: _emerald))
                  : const Icon(Icons.security, color: _emerald, size: 16),
                label: const Text('Check Threats', style: TextStyle(color: _emerald, fontSize: 12)),
              ),
            ],
          ),
          if (_friendThreats.isNotEmpty) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFF4D4D).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFF4D4D).withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('RECENT FRIEND THREATS', style: TextStyle(color: Color(0xFFFF4D4D), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  ..._friendThreats.map((t) => Padding(
                    padding: const EdgeInsets.only(bottom: 4.0),
                    child: Text('• ${t['threat_text'] ?? 'Unknown'} (from ${t['sender_platform'] ?? 'Unknown'})', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  )).toList(),
                ],
              ),
            ),
          ],
          _buildActiveFriends(),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title,
        style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildIncomingRequests() {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: _friendService.incomingRequestsStream(_currentUid),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Text('No pending requests.', style: TextStyle(color: Colors.white38, fontSize: 13));
        }
        return Column(
          children: snapshot.data!.map((req) {
            return UserTile(
              username: 'User ID: ${req['uid'].toString().substring(0,6)}...', // Fetch full user details in a real app
              name: 'Incoming Request',
              onAccept: () => _acceptRequest(req['uid']),
              onRemove: () => _removeFriend(req['uid']),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildActiveFriends() {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: _friendService.activeFriendsStream(_currentUid),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Text('No friends yet. Search above to add some!', style: TextStyle(color: Colors.white38, fontSize: 13));
        }
        return Column(
          children: snapshot.data!.map((friend) {
            return UserTile(
              username: 'Friend ID: ${friend['uid'].toString().substring(0,6)}...',
              name: 'Active Friend',
              onRemove: () => _removeFriend(friend['uid']),
            );
          }).toList(),
        );
      },
    );
  }
}
