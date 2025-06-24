import 'package:flutter/material.dart';

class RecentArticlesTable extends StatelessWidget {
  const RecentArticlesTable({Key? key}) : super(key: key);

  final List<Map<String, String>> articles = const [
    {
      'time': '12:04 PM',
      'title': 'Budget 2025: Major Tax Reforms Announced',
      'category': 'Politics',
      'sentiment': 'Neutral',
      'status': 'Done',
    },
    {
      'time': '11:20 AM',
      'title': 'Champions League Final: Shocking Upset',
      'category': 'Sports',
      'sentiment': 'Positive',
      'status': 'Done',
    },
    {
      'time': '10:45 AM',
      'title': 'Global Markets Hit by Recession Fears',
      'category': 'Finance',
      'sentiment': 'Negative',
      'status': 'Done',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "📰 Recent Summarized Articles",
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 20),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columnSpacing: 100,
              headingRowColor: MaterialStateProperty.resolveWith(
                    (states) => Colors.deepPurple.shade50,
              ),
              dataRowColor: MaterialStateProperty.resolveWith(
                    (states) => Colors.grey.shade50,
              ),
              headingTextStyle: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.deepPurple,
              ),
              columns: const [
                DataColumn(label: Text('🕒 Time')),
                DataColumn(label: Text('🗞 Title')),
                DataColumn(label: Text('📂 Category')),
                DataColumn(label: Text('🧠 Sentiment')),
                DataColumn(label: Text('✅ Status')),
                DataColumn(label: Text('👁 View')),
              ],
              rows: articles.map((article) {
                return DataRow(
                  cells: [
                    DataCell(Text(article['time']!)),
                    DataCell(Text(article['title']!)),
                    DataCell(Text(article['category']!)),
                    DataCell(Text(article['sentiment']!)),
                    DataCell(Text(article['status']!)),
                    DataCell(
                      IconButton(
                        icon: const Icon(Icons.visibility),
                        tooltip: "View Summary",
                        onPressed: () => _showArticleDetails(context, article),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  void _showArticleDetails(BuildContext context, Map<String, String> article) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(
          article['title'] ?? 'Article Summary',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("🕒 ${article['time']}"),
            Text("📂 Category: ${article['category']}"),
            Text("🧠 Sentiment: ${article['sentiment']}"),
            const SizedBox(height: 12),
            const Text(
              "🔍 Summary:",
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const Text(
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
              style: TextStyle(height: 1.5),
            ),
            const SizedBox(height: 12),
            const Text(
              "📄 Original:",
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const Text(
              "Here’s the original content preview...",
              style: TextStyle(height: 1.5),
            ),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('Close'),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}
