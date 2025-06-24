import 'package:flutter/material.dart';

class AppDrawer extends StatelessWidget {
  final Function(int) onSelect;

  const AppDrawer({Key? key, required this.onSelect}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.indigo.shade400, Colors.indigo.shade700],
              ),
            ),
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Text(
                'SnapNews',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 49,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          _buildDrawerItem(
            icon: Icons.dashboard,
            title: 'Summary Overview',
            index: 0,
          ),
          _buildDrawerItem(
            icon: Icons.article,
            title: 'Recent Articles',
            index: 1,
          ),
          _buildDrawerItem(
            icon: Icons.trending_up,
            title: 'User Trends',
            index: 2,
          ),
          _buildDrawerItem(
            icon: Icons.feedback,
            title: 'Feedback',
            index: 3,
          ),
          _buildDrawerItem(
            icon: Icons.settings,
            title: 'Settings',
            index: 4,
          ),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.only(bottom: 20.0),
            child: Text(
              '© 2025 SnapNews',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required int index,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.indigo),
      title: Text(
        title,
        style: const TextStyle(fontSize: 16),
      ),
      onTap: () => onSelect(index),
    );
  }
}
