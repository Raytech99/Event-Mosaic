class Event {
  final String? id;
  final String name;
  final String date;
  final String time;
  final String location;
  final String caption;
  final String? handle;
  final String source;
  final String? postedBy;

  Event({
    this.id,
    required this.name,
    required this.date,
    required this.time,
    required this.location,
    required this.caption,
    this.handle,
    required this.source,
    this.postedBy,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    String formatDate(String dateStr) {
      try {
        // If the date is already in MM/dd/yyyy format, return it as is
        if (dateStr.contains('/')) {
          // Validate the format
          final parts = dateStr.split('/');
          if (parts.length == 3) {
            // Simple validation of month/day/year
            final month = int.tryParse(parts[0]) ?? 1;
            final day = int.tryParse(parts[1]) ?? 1;
            final year = int.tryParse(parts[2]) ?? DateTime.now().year;
            
            // Format with leading zeros
            return '${month.toString().padLeft(2, '0')}/${day.toString().padLeft(2, '0')}/$year';
          }
        }
        
        // If the date is in yyyy-MM-dd format, convert it
        if (dateStr.contains('-')) {
          final parts = dateStr.split('-');
          if (parts.length == 3) {
            final year = parts[0];
            final month = parts[1];
            final day = parts[2];
            return '$month/$day/$year';
          }
        }
        
        // If neither format matches or validation fails, return today's date
        final now = DateTime.now();
        return '${now.month.toString().padLeft(2, '0')}/${now.day.toString().padLeft(2, '0')}/${now.year}';
      } catch (e) {
        // If there's any error in parsing, return today's date
        final now = DateTime.now();
        return '${now.month.toString().padLeft(2, '0')}/${now.day.toString().padLeft(2, '0')}/${now.year}';
      }
    }

    return Event(
      id: json['_id']?['\$oid'] ?? json['_id'],
      name: json['name'] ?? '',
      date: formatDate(json['date'] ?? ''),
      time: json['time'] ?? '',
      location: json['location'] ?? '',
      caption: json['caption'] ?? '',
      handle: json['handle'],
      source: json['source'] ?? 'user',
      postedBy: json['postedBy']?['\$oid'] ?? json['postedBy'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      'name': name,
      'date': date,
      'time': time,
      'location': location,
      'caption': caption,
      'handle': handle,
      'source': source,
      if (postedBy != null) 'postedBy': postedBy,
    };
  }
} 