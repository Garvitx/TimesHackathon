import 'package:flutter/material.dart';
import 'package:snapnews/components/feedback_flags.dart';
import 'package:snapnews/components/model_api_monitoring.dart';

import 'components/header.dart';
import 'components/summary_overview.dart';
import 'components/recent_articles_table.dart';
import 'components/user_trends.dart';
import 'components/settings_controls.dart';
import 'components/top_keywords.dart';
import 'app_drawer.dart';

class Dashboard extends StatefulWidget {
  @override
  State<Dashboard> createState() => _DashboardState();
}

class _DashboardState extends State<Dashboard> {
  int selectedIndex = 0;

  Widget getScreen(int index) {
    switch (index) {
      case 0:
        return ModelApiMonitoring();
      case 1:
        return RecentArticlesTable();
      case 2:
        return UserTrends();
      case 3:
        return FeedbackFlagsSection();
      case 4:
        return SettingsControlsSection();
      default:
        return ModelApiMonitoring();
    }
  }

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: AppDrawer(onSelect: (index) {
        setState(() {
          selectedIndex = index;
        });
        Navigator.pop(context);
      }),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Header(onMenuPressed: () {
                _scaffoldKey.currentState?.openDrawer();
              }),
              const SizedBox(height: 20),
              getScreen(selectedIndex),
              const SizedBox(height: 20),
              if (selectedIndex == 0) const SummaryGraphs(),
              const SizedBox(height: 20),
              if (selectedIndex == 0) const TopKeywords(),
            ],
          ),
        ),
      ),
    );
  }
}
