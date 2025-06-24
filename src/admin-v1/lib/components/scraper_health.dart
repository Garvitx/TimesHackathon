import 'package:flutter/material.dart';

class ScraperSystemHealth extends StatelessWidget {
  const ScraperSystemHealth({super.key});

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> services = [
      {
        'name': 'TOI Scraper',
        'status': '✅ Success',
        'lastRun': 'Today at 10:45 AM',
        'failures': 1,
        'warning': false,
      },
      {
        'name': 'NDTV API',
        'status': '⚠️ Rate Limit Reached',
        'lastRun': 'Today at 10:40 AM',
        'failures': 2,
        'warning': true,
      },
      {
        'name': 'The Hindu API',
        'status': '✅ Success',
        'lastRun': 'Today at 10:43 AM',
        'failures': 0,
        'warning': false,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("🛠 Scraper & System Health",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),

        ListView.builder(
          shrinkWrap: true,
          itemCount: services.length,
          itemBuilder: (context, index) {
            final service = services[index];
            return Card(
              color: service['warning'] ? Colors.red[50] : Colors.green[50],
              child: ListTile(
                leading: Icon(
                  service['warning'] ? Icons.warning : Icons.check_circle,
                  color: service['warning'] ? Colors.red : Colors.green,
                ),
                title: Text(service['name'],
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(
                    "Last Run: ${service['lastRun']} | Failures: ${service['failures']}"),
                trailing: Text(service['status'],
                    style: TextStyle(
                        color: service['warning'] ? Colors.red : Colors.green,
                        fontWeight: FontWeight.bold)),
              ),
            );
          },
        ),

        const SizedBox(height: 24),
        const Text("📊 System Stats",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 10),

        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            StatCard(title: 'Retry Queue', value: '5 items'),
            StatCard(title: 'Cache Hit Rate', value: '83%'),
            StatCard(title: 'API Keys OK', value: '2/3 Active'),
          ],
        ),

        const SizedBox(height: 12),
        const Text(
          "⚠️ Warnings",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 8),
        const Text("- NDTV API rate limit exceeded.\n- TOI Scraper failed once this week."),
      ],
    );
  }
}

class StatCard extends StatelessWidget {
  final String title;
  final String value;

  const StatCard({super.key, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 6),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            children: [
              Text(title,
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(value, style: const TextStyle(fontSize: 16)),
            ],
          ),
        ),
      ),
    );
  }
}
