import 'package:flutter/material.dart';

class Header extends StatelessWidget {
  final VoidCallback onMenuPressed;

  const Header({Key? key, required this.onMenuPressed}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.menu, size: 28),
            onPressed: onMenuPressed,
            tooltip: 'Menu',
          ),
          const SizedBox(width: 12),
          Text(
            'SnapNews',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const Spacer(),
          SizedBox(
            width: 250,
            child: TextField(
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                hintText: 'Search articles...',
                suffixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: theme.inputDecorationTheme.fillColor ?? Colors.grey.shade200,
              ),
            ),
          ),
          const SizedBox(width: 24),
          const CircleAvatar(
            radius: 20,
            backgroundColor: Colors.indigo,
            child: Icon(Icons.person, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Text(
            "Raghav Goel",
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
