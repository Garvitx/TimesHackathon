// import 'package:flutter/material.dart';
// import 'package:fl_chart/fl_chart.dart';
//
// class SummaryGraphs extends StatelessWidget {
//   const SummaryGraphs({Key? key}) : super(key: key);
//
//   @override
//   Widget build(BuildContext context) {
//     return Row(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: const [
//         Expanded(child: _SentimentPieChart()),
//         SizedBox(width: 24),
//         Expanded(child: _SummaryLineChart()),
//       ],
//     );
//   }
// }
//
// class _SentimentPieChart extends StatelessWidget {
//   const _SentimentPieChart({Key? key}) : super(key: key);
//
//   @override
//   Widget build(BuildContext context) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         const Text("Sentiment Breakdown", style: TextStyle(fontWeight: FontWeight.w600)),
//         const SizedBox(height: 12),
//         SizedBox(
//           height: 200,
//           child: PieChart(
//             PieChartData(
//               sections: [
//                 PieChartSectionData(value: 45, color: Colors.green, title: 'Positive'),
//                 PieChartSectionData(value: 35, color: Colors.orange, title: 'Neutral'),
//                 PieChartSectionData(value: 20, color: Colors.red, title: 'Negative'),
//               ],
//               sectionsSpace: 4,
//               centerSpaceRadius: 40,
//             ),
//           ),
//         ),
//       ],
//     );
//   }
// }
//
// class _SummaryLineChart extends StatelessWidget {
//   const _SummaryLineChart({Key? key}) : super(key: key);
//
//   @override
//   Widget build(BuildContext context) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         const Text("Summaries Over Time", style: TextStyle(fontWeight: FontWeight.w600)),
//         const SizedBox(height: 12),
//         SizedBox(
//           height: 200,
//           child: LineChart(
//             LineChartData(
//               gridData: FlGridData(show: false),
//               titlesData: FlTitlesData(show: false),
//               borderData: FlBorderData(show: false),
//               lineBarsData: [
//                 LineChartBarData(
//                   spots: [
//                     FlSpot(0, 5),
//                     FlSpot(1, 6),
//                     FlSpot(2, 4),
//                     FlSpot(3, 7),
//                     FlSpot(4, 6),
//                     FlSpot(5, 9),
//                   ],
//                   isCurved: true,
//                   color: Colors.deepPurple,
//                   barWidth: 3,
//                   dotData: FlDotData(show: false),
//                 ),
//               ],
//             ),
//           ),
//         ),
//       ],
//     );
//   }
// }


import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class SummaryGraphs extends StatelessWidget {
  const SummaryGraphs({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const _SentimentPieChart(),
        const SizedBox(height: 40),
        const _SummaryLineChart(),
      ],
    );
  }
}

class _SentimentPieChart extends StatelessWidget {
  const _SentimentPieChart({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final sections = [
      PieChartSectionData(
        value: 45,
        color: Colors.green,
        title: '45%',
        titleStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
      ),
      PieChartSectionData(
        value: 35,
        color: Colors.orange,
        title: '35%',
        titleStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
      ),
      PieChartSectionData(
        value: 20,
        color: Colors.red,
        title: '20%',
        titleStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Sentiment Breakdown", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18)),
        const SizedBox(height: 16),
        SizedBox(
          height: 220,
          child: PieChart(
            PieChartData(
              sections: sections,
              sectionsSpace: 3,
              centerSpaceRadius: 40,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: const [
            _LegendItem(color: Colors.green, label: 'Positive'),
            _LegendItem(color: Colors.orange, label: 'Neutral'),
            _LegendItem(color: Colors.red, label: 'Negative'),
          ],
        ),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 12, height: 12, color: color),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 14)),
      ],
    );
  }
}

class _SummaryLineChart extends StatelessWidget {
  const _SummaryLineChart({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final spots = [
      FlSpot(0, 5),
      FlSpot(1, 6),
      FlSpot(2, 4),
      FlSpot(3, 7),
      FlSpot(4, 6),
      FlSpot(5, 9),
      FlSpot(6, 8),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Summaries Over Time", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18)),
        const SizedBox(height: 16),
        SizedBox(
          height: 240,
          child: LineChart(
            LineChartData(
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: 2,
                    reservedSize: 30,
                    getTitlesWidget: (value, meta) => Text('${value.toInt()}'),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: 1,
                    getTitlesWidget: (value, meta) {
                      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      return Text(days[value.toInt()]);
                    },
                  ),
                ),
              ),
              gridData: FlGridData(show: true),
              borderData: FlBorderData(show: true),
              lineTouchData: LineTouchData(enabled: true),
              lineBarsData: [
                LineChartBarData(
                  spots: spots,
                  isCurved: true,
                  color: Colors.deepPurple,
                  barWidth: 3,
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      colors: [Colors.deepPurple.withOpacity(0.3), Colors.transparent],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  dotData: FlDotData(show: true),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
