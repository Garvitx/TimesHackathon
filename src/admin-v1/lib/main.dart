// import 'package:flutter/material.dart';
// import 'dashboard.dart';
//
// void main() => runApp(MyApp());
//
// class MyApp extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'Admin Dashboard',
//       debugShowCheckedModeBanner: false,
//       home: Dashboard(),
//     );
//   }
// }

import 'package:flutter/material.dart';
import 'dashboard.dart';

void main() {
  runApp(const TLDRDashboardApp());
}

class TLDRDashboardApp extends StatelessWidget {
  const TLDRDashboardApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TLDR Dashboard',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.deepPurple,
        useMaterial3: true,
        textTheme: const TextTheme(
          headlineSmall: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          bodyMedium: TextStyle(fontSize: 16),
        ),
      ),
      home: Dashboard(),
    );
  }
}

