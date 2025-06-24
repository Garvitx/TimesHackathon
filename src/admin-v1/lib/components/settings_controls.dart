import 'package:flutter/material.dart';

class SettingsControlsSection extends StatefulWidget {
  const SettingsControlsSection({super.key});

  @override
  State<SettingsControlsSection> createState() => _SettingsControlsSectionState();
}

class _SettingsControlsSectionState extends State<SettingsControlsSection> {
  bool isScrapingEnabled = true;
  bool compareNewsSources = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 3,
      margin: const EdgeInsets.symmetric(vertical: 16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "⚙️ Settings & Controls",
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),

            // Auto-Scraping Toggle
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text("📰 Enable Auto-Scraping"),
              subtitle: const Text("Toggle periodic scraping of news sources"),
              value: isScrapingEnabled,
              activeColor: Colors.deepPurple,
              onChanged: (value) {
                setState(() {
                  isScrapingEnabled = value;
                });
              },
            ),

            // Compare News Toggle
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text("🔍 Compare with Other News Sources"),
              subtitle: const Text("Enable similarity checks across publishers"),
              value: compareNewsSources,
              activeColor: Colors.deepPurple,
              onChanged: (value) {
                setState(() {
                  compareNewsSources = value;
                });
              },
            ),

            const SizedBox(height: 20),

            // Clear Cache Button
            ElevatedButton.icon(
              icon: const Icon(Icons.delete_forever),
              label: const Text("Clear Cache"),
              style: ElevatedButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: Colors.redAccent,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("🗑️ Cache cleared successfully.")),
                );
              },
            ),

            const SizedBox(height: 12),

            // Force Re-summarize Button
            ElevatedButton.icon(
              icon: const Icon(Icons.refresh),
              label: const Text("Force Re-summarize All"),
              style: ElevatedButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: Colors.deepOrange,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("🔁 Re-summarization triggered.")),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
