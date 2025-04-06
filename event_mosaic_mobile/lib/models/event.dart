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
        if (dateStr.contains('/')) return dateStr;
        
        // If the date is in yyyy-MM-dd format, convert it
        final parts = dateStr.split('-');
        if (parts.length == 3) {
          final year = parts[0];
          final month = parts[1];
          final day = parts[2];
          return '$month/$day/$year';
        }
        
        // If neither format matches, return the original string
        return dateStr;
      } catch (e) {
        // If there's any error in parsing, return the original string
        return dateStr;
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
      'name': name,
      'date': date,
      'time': time,
      'location': location,
      'caption': caption,
      'handle': handle,
      'source': source,
      'postedBy': postedBy,
    };
  }
} 