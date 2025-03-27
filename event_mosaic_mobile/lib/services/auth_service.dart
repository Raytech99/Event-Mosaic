import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  // Replace with your backend URL
  static const String baseUrl = 'http://eventmosaic.net/api';

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print('Attempting login with email: $email'); // Debug log
      final url = Uri.parse('$baseUrl/auth/login');
      print('Login URL: $url'); // Debug log
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode({
          'emailOrUsername': email,
          'password': password,
        }),
      );

      print('Login response status: ${response.statusCode}'); // Debug log
      print('Login response headers: ${response.headers}'); // Debug log
      print('Login response body: ${response.body}'); // Debug log

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to login: ${response.body}');
      }
    } catch (e, stackTrace) {
      print('Login error: $e'); // Debug log
      print('Stack trace: $stackTrace'); // Debug log
      throw Exception('Failed to connect to server: $e');
    }
  }

  Future<Map<String, dynamic>> register(
    String firstName,
    String lastName,
    String username,
    String email,
    String password,
  ) async {
    try {
      print('Attempting registration with email: $email'); // Debug log
      final url = Uri.parse('$baseUrl/auth/register');
      print('Register URL: $url'); // Debug log
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode({
          'firstName': firstName,
          'lastName': lastName,
          'username': username,
          'email': email,
          'password': password,
          'followedAccounts': [], // Empty array for new users
        }),
      );

      print('Register response status: ${response.statusCode}'); // Debug log
      print('Register response headers: ${response.headers}'); // Debug log
      print('Register response body: ${response.body}'); // Debug log

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to register: ${response.body}');
      }
    } catch (e, stackTrace) {
      print('Register error: $e'); // Debug log
      print('Stack trace: $stackTrace'); // Debug log
      throw Exception('Failed to connect to server: $e');
    }
  }
} 