// class ArticleModel {
//   final String id;
//   final DateTime timestamp;
//   final String title;
//   final String category;
//   final String sentiment;
//   final String status;
//   final String summary;
//   final String originalContent;
//
//   ArticleModel({
//     required this.id,
//     required this.timestamp,
//     required this.title,
//     required this.category,
//     required this.sentiment,
//     required this.status,
//     required this.summary,
//     required this.originalContent,
//   });
//
//   factory ArticleModel.fromJson(Map<String, dynamic> json) {
//     return ArticleModel(
//       id: json['id'] ?? '',
//       timestamp: DateTime.parse(json['timestamp']),
//       title: json['title'] ?? '',
//       category: json['category'] ?? '',
//       sentiment: json['sentiment'] ?? '',
//       status: json['status'] ?? '',
//       summary: json['summary'] ?? '',
//       originalContent: json['originalContent'] ?? '',
//     );
//   }
//
//   Map<String, dynamic> toJson() {
//     return {
//       'id': id,
//       'timestamp': timestamp.toIso8601String(),
//       'title': title,
//       'category': category,
//       'sentiment': sentiment,
//       'status': status,
//       'summary': summary,
//       'originalContent': originalContent,
//     };
//   }
// }
