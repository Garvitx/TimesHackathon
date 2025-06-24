class FeedbackModel {
  final String id;
  final String articleTitle;
  final String summaryId;
  final String feedbackTag; // e.g., "Inaccurate", "Too short", "Biased"
  final String userComment;
  final DateTime timestamp;
  final String status; // e.g., "Pending", "Approved", "Resolved", "Deleted"

  FeedbackModel({
    required this.id,
    required this.articleTitle,
    required this.summaryId,
    required this.feedbackTag,
    required this.userComment,
    required this.timestamp,
    required this.status,
  });

  factory FeedbackModel.fromJson(Map<String, dynamic> json) {
    return FeedbackModel(
      id: json['id'] ?? '',
      articleTitle: json['articleTitle'] ?? '',
      summaryId: json['summaryId'] ?? '',
      feedbackTag: json['feedbackTag'] ?? '',
      userComment: json['userComment'] ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      status: json['status'] ?? 'Pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'articleTitle': articleTitle,
      'summaryId': summaryId,
      'feedbackTag': feedbackTag,
      'userComment': userComment,
      'timestamp': timestamp.toIso8601String(),
      'status': status,
    };
  }
}