import 'package:flutter/material.dart';

class TopKeywords extends StatelessWidget {
  const TopKeywords({Key? key}) : super(key: key);

  final List<String> wordCloud = const [
    'Inflation', 'Elections', 'Climate', 'AI', 'Stock Market',
    'Ukraine', 'Technology', 'India', 'Education', 'Startups',
    'Healthcare', 'Tax Reform', 'Cybersecurity', 'Sports', 'Gaza'
  ];

  final List<Map<String, dynamic>> trendingTerms = const [
    {'term': 'Election Results', 'score': 94},
    {'term': 'AI in Healthcare', 'score': 88},
    {'term': 'Climate Accord', 'score': 82},
    {'term': 'Market Crash', 'score': 75},
    {'term': 'Olympics', 'score': 71},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Top Keywords & Topics",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),

        // Word Cloud Style Chips
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: wordCloud.map((word) {
            return Chip(
              label: Text(word),
              backgroundColor: Colors.blueGrey.shade100,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            );
          }).toList(),
        ),

        const SizedBox(height: 24),
        const Text(
          "🔥 Trending Terms This Week",
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),

        // Trending List
        Column(
          children: trendingTerms.map((term) {
            return ListTile(
              leading: const Icon(Icons.trending_up, color: Colors.orange),
              title: Text(term['term']),
              trailing: Text(
                "${term['score']}%",
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
