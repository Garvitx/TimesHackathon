import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class UserTrends extends StatelessWidget {
  UserTrends({super.key});

  final List<Map<String, dynamic>> trends = const [
    {'label': 'Politics', 'count': 1340},
    {'label': 'Sports', 'count': 920},
    {'label': 'Tech', 'count': 710},
    {'label': 'Entertainment', 'count': 480},
    {'label': 'Finance', 'count': 310},
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "📊 User Interaction Trends",
            style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),

          Text(
            "🔥 Most Requested Article Types",
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          ...trends.map((item) => Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: const Icon(Icons.article_outlined, color: Colors.indigo),
              title: Text(item['label']),
              trailing: Text(
                '${item['count']} requests',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
          )),

          const SizedBox(height: 32),
          Text(
            "📈 Summary Share & Download Trends",
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          const SizedBox(height: 240, child: ShareDownloadBarChart()),

          const SizedBox(height: 32),
          Text(
            "🌐 Geo-based Summary Stats",
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          const Text("🇮🇳 India: 60%   |   🇺🇸 US: 25%   |   🇬🇧 UK: 10%   |   🌍 Others: 5%"),
        ],
      ),
    );
  }
}

class ShareDownloadBarChart extends StatelessWidget {
  const ShareDownloadBarChart({super.key});

  @override
  Widget build(BuildContext context) {
    final List<BarChartGroupData> barGroups = [
      BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: 20, color: Colors.indigo, borderRadius: BorderRadius.circular(4))]),
      BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 35, color: Colors.indigo, borderRadius: BorderRadius.circular(4))]),
      BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 25, color: Colors.indigo, borderRadius: BorderRadius.circular(4))]),
      BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 30, color: Colors.indigo, borderRadius: BorderRadius.circular(4))]),
      BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 15, color: Colors.indigo, borderRadius: BorderRadius.circular(4))]),
    ];

    return BarChart(
      BarChartData(
        maxY: 40,
        alignment: BarChartAlignment.spaceAround,
        barTouchData: BarTouchData(enabled: false),
        gridData: FlGridData(show: true, drawVerticalLine: false),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              getTitlesWidget: (value, _) => Text('${value.toInt()}', style: const TextStyle(fontSize: 10)),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              getTitlesWidget: (value, _) {
                switch (value.toInt()) {
                  case 0:
                    return const Text("Mon");
                  case 1:
                    return const Text("Tue");
                  case 2:
                    return const Text("Wed");
                  case 3:
                    return const Text("Thu");
                  case 4:
                    return const Text("Fri");
                  default:
                    return const Text("");
                }
              },
            ),
          ),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        barGroups: barGroups,
      ),
    );
  }
}
