// class ApiStatsModel {
//   final int totalCalls;
//   final double avgResponseTime; // in ms
//   final double cost; // in USD or applicable currency
//   final double errorRate; // as a percentage (0-100)
//
//   ApiStatsModel({
//     required this.totalCalls,
//     required this.avgResponseTime,
//     required this.cost,
//     required this.errorRate,
//   });
//
//   factory ApiStatsModel.fromJson(Map<String, dynamic> json) {
//     return ApiStatsModel(
//       totalCalls: json['totalCalls'] ?? 0,
//       avgResponseTime: (json['avgResponseTime'] ?? 0).toDouble(),
//       cost: (json['cost'] ?? 0).toDouble(),
//       errorRate: (json['errorRate'] ?? 0).toDouble(),
//     );
//   }
//
//   Map<String, dynamic> toJson() {
//     return {
//       'totalCalls': totalCalls,
//       'avgResponseTime': avgResponseTime,
//       'cost': cost,
//       'errorRate': errorRate,
//     };
//   }
// }
