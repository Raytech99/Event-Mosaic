import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/event.dart';
import '../config/app_config.dart';
import 'storage_service.dart';

class ApiService {
  // Use the baseUrl from the configuration
  String get baseUrl => AppConfig.baseUrl;
  final StorageService _storageService = StorageService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _storageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<List<Event>> getEvents() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/events'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Event.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load events: ${response.body}');
    }
  }

  Future<Event> createEvent(Event event) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/events'),
      headers: headers,
      body: json.encode(event.toJson()),
    );

    if (response.statusCode == 201) {
      return Event.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to create event: ${response.body}');
    }
  }

  Future<Event> updateEvent(Event event) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/events/${event.id}'),
      headers: headers,
      body: json.encode(event.toJson()),
    );

    if (response.statusCode == 200) {
      return Event.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to update event: ${response.body}');
    }
  }

  Future<void> deleteEvent(String eventId) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/events/$eventId'),
      headers: headers,
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete event: ${response.body}');
    }
  }
} 