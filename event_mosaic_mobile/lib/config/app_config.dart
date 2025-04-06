import 'package:flutter/foundation.dart';

class AppConfig {
  // Environment
  static const bool isProduction = true; // Set to true for production

  // API URLs
  static String get baseUrl {
    if (isProduction) {
      return 'http://eventmosaic.net:3000/api';
    } else {
      // Use localhost for iOS simulator
      return 'http://localhost:3000/api';
    }
  }

  // Other configuration settings can be added here
  static const Duration apiTimeout = Duration(seconds: 30);
  static const bool enableLogging = true;
} 