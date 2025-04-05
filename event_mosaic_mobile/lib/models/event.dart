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
    return Event(
      id: json['_id']?['\$oid'] ?? json['_id'],
      name: json['name'] ?? '',
      date: json['date'] ?? '',
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