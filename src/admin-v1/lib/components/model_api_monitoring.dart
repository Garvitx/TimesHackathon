import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class ModelApiMonitoring extends StatelessWidget {
  const ModelApiMonitoring({Key? key}) : super(key: key);

  final List<Map<String, dynamic>> apiStats = const [
    {
      'title': 'Total Summarized',
      'value': '1,562',
      'icon': Icons.notes,
      'color': Colors.orange,
      'chartData': [150.0, 220.0, 270.0, 320.0, 400.0, 500.0, 562.0],
    },
    {
      'title': "Today's Summaries",
      'value': '37',
      'icon': Icons.today,
      'color': Colors.teal,
      'chartData': [2.0, 4.0, 9.0, 15.0, 20.0, 28.0, 37.0],
    },
    {
      'title': 'Total API Calls',
      'value': '3,420',
      'icon': Icons.call_made,
      'color': Colors.blue,
      'chartData': [2.0, 3.0, 3.5, 3.2, 4.0]
    },
    {
      'title': 'Avg. Response Time',
      'value': '1.2s',
      'icon': Icons.timer,
      'color': Colors.green,
      'chartData': [1.5, 1.4, 1.3, 1.2, 1.2]
    },
    {
      'title': 'Estimated API Cost',
      'value': '\$18.35',
      'icon': Icons.attach_money,
      'color': Colors.deepPurple,
      'chartData': [15.0, 16.2, 17.8, 18.1, 18.35]
    },
  ];

  LineChartData _buildChart(List<double> data, Color color) {
    return LineChartData(
      lineBarsData: [
        LineChartBarData(
          isCurved: true,
          spots: data.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value)).toList(),
          color: color,
          barWidth: 2,
          dotData: FlDotData(show: false),
        ),
      ],
      titlesData: FlTitlesData(show: false),
      gridData: FlGridData(show: false),
      borderData: FlBorderData(show: false),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Model & API Monitoring",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: apiStats.map((item) {
              return Container(
                width: 230,
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: item['color'].withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(item['icon'], size: 24, color: item['color']),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(item['title'], style: const TextStyle(fontSize: 14)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item['value'],
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: item['color'],
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 60,
                      child: LineChart(_buildChart(item['chartData'], item['color'])),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}