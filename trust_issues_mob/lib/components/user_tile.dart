import 'package:flutter/material.dart';

class UserTile extends StatelessWidget {
  final String username;
  final String name;
  final VoidCallback? onAdd;
  final VoidCallback? onAccept;
  final VoidCallback? onRemove;
  final bool isPending;

  const UserTile({
    super.key,
    required this.username,
    required this.name,
    this.onAdd,
    this.onAccept,
    this.onRemove,
    this.isPending = false,
  });

  static const Color _surface = Color(0xFF161621);
  static const Color _emerald = Color(0xFF00E676);
  static const Color _cyan    = Color(0xFF00E5FF);
  static const Color _crimson = Color(0xFFFF4D4D);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: _cyan.withOpacity(0.2),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: const TextStyle(color: _cyan, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 2),
                Text('@$username', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
              ],
            ),
          ),
          if (onAccept != null)
            IconButton(
              icon: const Icon(Icons.check_circle, color: _emerald),
              onPressed: onAccept,
              tooltip: 'Accept',
            )
          else if (onAdd != null)
            IconButton(
              icon: const Icon(Icons.person_add, color: _cyan),
              onPressed: onAdd,
              tooltip: 'Add Friend',
            )
          else if (isPending)
             const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8.0),
              child: Text('Pending', style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          
          if (onRemove != null)
            IconButton(
              icon: const Icon(Icons.person_remove, color: _crimson),
              onPressed: onRemove,
              tooltip: 'Remove',
            ),
        ],
      ),
    );
  }
}
