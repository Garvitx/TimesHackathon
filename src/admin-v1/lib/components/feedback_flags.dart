import 'package:flutter/material.dart';

class FeedbackFlagsSection extends StatelessWidget {
  const FeedbackFlagsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final List<Map<String, dynamic>> feedbacks = [
      {
        'title': 'Budget 2025 Analysis',
        'tags': ['Inaccurate', 'Too short'],
        'time': 'Today 11:02 AM',
        'status': 'Pending',
      },
      {
        'title': 'Elections 2025 Forecast',
        'tags': ['Biased'],
        'time': 'Yesterday 5:33 PM',
        'status': 'Reviewed',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "🚩 Feedback / Flags",
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ListView.separated(
          itemCount: feedbacks.length,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final feedback = feedbacks[index];

            return Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 3,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            feedback['title'],
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: feedback['status'] == 'Pending'
                                ? Colors.orange[100]
                                : Colors.green[100],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            feedback['status'],
                            style: TextStyle(
                              fontSize: 12,
                              color: feedback['status'] == 'Pending'
                                  ? Colors.orange[800]
                                  : Colors.green[800],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 8),

                    // Time
                    Text("🕒 ${feedback['time']}", style: theme.textTheme.bodySmall),

                    const SizedBox(height: 6),

                    // Tags
                    Wrap(
                      spacing: 8,
                      runSpacing: -8,
                      children: feedback['tags'].map<Widget>((tag) {
                        return Chip(
                          label: Text(tag),
                          backgroundColor: Colors.deepOrange.shade100,
                          labelStyle: const TextStyle(fontSize: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 12),

                    // Action Buttons
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.check_circle, color: Colors.green),
                          tooltip: 'Approve',
                          onPressed: () {},
                        ),
                        IconButton(
                          icon: const Icon(Icons.autorenew, color: Colors.blue),
                          tooltip: 'Retrain',
                          onPressed: () {},
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          tooltip: 'Delete',
                          onPressed: () {},
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
