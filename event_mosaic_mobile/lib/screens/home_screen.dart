import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';
import '../models/event.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _storageService = StorageService();
  final _apiService = ApiService();
  Map<String, dynamic>? _user;
  int _selectedIndex = 0;
  List<Event> _events = [];
  bool _isLoading = true;
  String? _error;
  DateTime _selectedDate = DateTime.now();
  DateTime _focusedDay = DateTime.now();
  List<Event> _selectedDateEvents = [];
  Set<String> _expandedEvents = {};
  bool _showCreateEvent = false;
  bool _showEditEvent = false;
  Event? _editingEvent;
  final _formKey = GlobalKey<FormState>();
  
  // Form controllers for creating/editing events
  final _nameController = TextEditingController();
  final _dateController = TextEditingController();
  final _timeController = TextEditingController();
  final _locationController = TextEditingController();
  final _handleController = TextEditingController();
  final _captionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchEvents();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _dateController.dispose();
    _timeController.dispose();
    _locationController.dispose();
    _handleController.dispose();
    _captionController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    final user = await _storageService.getUser();
    if (mounted) {
      setState(() {
        _user = user;
      });
    }
  }

  Future<void> _fetchEvents() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final events = await _apiService.getEvents();
      if (mounted) {
        setState(() {
          _events = events;
          _isLoading = false;
          _updateSelectedDateEvents();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _updateSelectedDateEvents() {
    final dateStr = DateFormat('MM/dd/yyyy').format(_selectedDate);
    _selectedDateEvents = _events
        .where((event) => event.date == dateStr)
        .toList();
  }

  Future<void> _logout() async {
    await _storageService.clearAll();
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  void _openCreateEventModal() {
    _resetFormControllers();
    setState(() {
      _showCreateEvent = true;
    });
  }

  void _openEditEventModal(Event event) {
    _nameController.text = event.name;
    _dateController.text = event.date;
    _timeController.text = event.time;
    _locationController.text = event.location;
    _handleController.text = event.handle ?? '';
    _captionController.text = event.caption;
    
    setState(() {
      _editingEvent = event;
      _showEditEvent = true;
    });
  }

  void _resetFormControllers() {
    final now = DateTime.now();
    _nameController.clear();
    _dateController.text = DateFormat('MM/dd/yyyy').format(now);
    _timeController.text = DateFormat('HH:mm').format(now);
    _locationController.clear();
    _handleController.clear();
    _captionController.clear();
  }

  Future<void> _handleCreateEvent() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final newEvent = Event(
        name: _nameController.text,
        date: _dateController.text,
        time: _timeController.text,
        location: _locationController.text,
        caption: _captionController.text,
        handle: _handleController.text.isNotEmpty ? _handleController.text : null,
        source: 'user',
        postedBy: _user!['_id'],
      );

      final createdEvent = await _apiService.createEvent(newEvent);
      
      if (mounted) {
        setState(() {
          _events.add(createdEvent);
          _showCreateEvent = false;
          _updateSelectedDateEvents();
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Event created successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error creating event: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _handleEditEvent() async {
    if (!_formKey.currentState!.validate() || _editingEvent == null) return;

    try {
      final updatedEvent = Event(
        id: _editingEvent!.id,
        name: _nameController.text,
        date: _dateController.text,
        time: _timeController.text,
        location: _locationController.text,
        caption: _captionController.text,
        handle: _handleController.text.isNotEmpty ? _handleController.text : null,
        source: 'user',
        postedBy: _user!['_id'],
      );

      final result = await _apiService.updateEvent(updatedEvent);
      
      if (mounted) {
        setState(() {
          final index = _events.indexWhere((e) => e.id == _editingEvent!.id);
          if (index != -1) {
            _events[index] = result;
          }
          _showEditEvent = false;
          _editingEvent = null;
          _updateSelectedDateEvents();
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Event updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating event: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _handleDeleteEvent(String eventId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Event'),
        content: const Text('Are you sure you want to delete this event?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _apiService.deleteEvent(eventId);
      
      if (mounted) {
        setState(() {
          _events.removeWhere((event) => event.id == eventId);
          _updateSelectedDateEvents();
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Event deleted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting event: ${e.toString()}')),
        );
      }
    }
  }

  void _toggleEventExpansion(String eventId) {
    setState(() {
      if (_expandedEvents.contains(eventId)) {
        _expandedEvents.remove(eventId);
      } else {
        _expandedEvents.add(eventId);
      }
    });
  }

  String _formatTimeTo12Hour(String time24) {
    final parts = time24.split(':');
    final hour = int.parse(parts[0]);
    final minutes = parts[1];
    final ampm = hour >= 12 ? 'PM' : 'AM';
    final hour12 = hour % 12 == 0 ? 12 : hour % 12;
    return '$hour12:$minutes $ampm';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset(
              'assets/images/logo.png',
              height: 40,
              width: 40,
            ),
            const SizedBox(width: 8),
            const Text('EventMosaic'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: Stack(
        children: [
          _user == null
              ? const Center(child: CircularProgressIndicator())
              : _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Error: $_error',
                                style: const TextStyle(color: Colors.red),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _fetchEvents,
                                child: const Text('Try Again'),
                              ),
                            ],
                          ),
                        )
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Welcome section
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).colorScheme.primary,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 24,
                                      backgroundColor: Theme.of(context).colorScheme.secondary,
                                      child: Text(
                                        '${_user!['firstName']?.isNotEmpty == true ? _user!['firstName'][0] : ''}${_user!['lastName']?.isNotEmpty == true ? _user!['lastName'][0] : ''}',
                                        style: TextStyle(
                                          color: Theme.of(context).colorScheme.primary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Welcome back,',
                                            style: TextStyle(
                                              color: Theme.of(context).colorScheme.secondary,
                                              fontSize: 16,
                                            ),
                                          ),
                                          Text(
                                            '${_user!['firstName']} ${_user!['lastName']}',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 20,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                              // Create Event button
                              Center(
                                child: ElevatedButton.icon(
                                  onPressed: _openCreateEventModal,
                                  icon: const Icon(Icons.add),
                                  label: const Text('Create New Event'),
                                ),
                              ),
                              const SizedBox(height: 24),
                              // Tabs
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildTabButton(
                                      context,
                                      'All Upcoming',
                                      0,
                                      Icons.event,
                                    ),
                                  ),
                                  Expanded(
                                    child: _buildTabButton(
                                      context,
                                      'Calendar',
                                      1,
                                      Icons.calendar_today,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              // Content based on selected tab
                              if (_selectedIndex == 0)
                                _buildUpcomingEvents()
                              else
                                _buildCalendarView(),
                            ],
                          ),
                        ),
          if (_showCreateEvent)
            Container(
              color: Colors.black54,
              child: Center(
                child: Card(
                  margin: const EdgeInsets.all(16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Create New Event',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              labelText: 'Event Name',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter an event name';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _dateController,
                            decoration: const InputDecoration(
                              labelText: 'Date (MM/DD/YYYY)',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter a date';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _timeController,
                            decoration: const InputDecoration(
                              labelText: 'Time (HH:MM)',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter a time';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _locationController,
                            decoration: const InputDecoration(
                              labelText: 'Location',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter a location';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _handleController,
                            decoration: const InputDecoration(
                              labelText: 'Club Handle (Optional)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _captionController,
                            decoration: const InputDecoration(
                              labelText: 'Caption',
                              border: OutlineInputBorder(),
                            ),
                            maxLines: 3,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter a caption';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _showCreateEvent = false;
                                  });
                                },
                                child: const Text('Cancel'),
                              ),
                              const SizedBox(width: 16),
                              ElevatedButton(
                                onPressed: _handleCreateEvent,
                                child: const Text('Create'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      floatingActionButton: _selectedIndex == 1
          ? FloatingActionButton(
              onPressed: _openCreateEventModal,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildTabButton(
    BuildContext context,
    String label,
    int index,
    IconData icon,
  ) {
    final isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).colorScheme.primary
              : Colors.transparent,
          border: Border(
            bottom: BorderSide(
              color: isSelected
                  ? Theme.of(context).colorScheme.secondary
                  : Theme.of(context).colorScheme.primary.withOpacity(0.3),
              width: 2,
            ),
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected
                  ? Theme.of(context).colorScheme.secondary
                  : Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected
                    ? Theme.of(context).colorScheme.secondary
                    : Theme.of(context).colorScheme.primary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingEvents() {
    if (_events.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'No events found. Create your first event!',
              style: TextStyle(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.7),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _openCreateEventModal,
              icon: const Icon(Icons.add),
              label: const Text('Create New Event'),
            ),
          ],
        ),
      );
    }

    // Sort events by date and time
    final sortedEvents = List<Event>.from(_events);
    sortedEvents.sort((a, b) {
      // First compare dates
      final dateA = DateFormat('MM/dd/yyyy').parse(a.date);
      final dateB = DateFormat('MM/dd/yyyy').parse(b.date);
      final dateComparison = dateA.compareTo(dateB);
      
      // If dates are the same, compare times
      if (dateComparison == 0) {
        final timeA = DateFormat('HH:mm').parse(a.time);
        final timeB = DateFormat('HH:mm').parse(b.time);
        return timeA.compareTo(timeB);
      }
      
      return dateComparison;
    });

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: sortedEvents.length,
      itemBuilder: (context, index) {
        final event = sortedEvents[index];
        final eventDate = DateFormat('MM/dd/yyyy').parse(event.date);
        final isExpanded = _expandedEvents.contains(event.id ?? '');
        
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          Text(
                            DateFormat('MMM').format(eventDate),
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            DateFormat('d').format(eventDate),
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: event.source == 'ai' 
                                      ? Colors.blue.withOpacity(0.2) 
                                      : Colors.orange.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  event.source == 'ai' ? '🤖 AI' : '👤 Custom',
                                  style: TextStyle(
                                    color: event.source == 'ai' ? Colors.blue : Colors.orange,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              if (event.handle != null) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    '@${event.handle}',
                                    style: const TextStyle(
                                      color: Colors.grey,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            event.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(_formatTimeTo12Hour(event.time)),
                    const SizedBox(width: 16),
                    Icon(
                      Icons.location_on,
                      size: 16,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(event.location),
                  ],
                ),
                if (isExpanded) ...[
                  const SizedBox(height: 8),
                  Text(
                    event.caption,
                    style: const TextStyle(
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () => _toggleEventExpansion(event.id ?? ''),
                      child: Text(isExpanded ? 'Show Less' : 'Show More'),
                    ),
                    Row(
                      children: [
                        TextButton.icon(
                          onPressed: () => _openEditEventModal(event),
                          icon: Icon(
                            event.source == 'ai' ? Icons.auto_awesome : Icons.edit,
                            size: 16,
                          ),
                          label: Text(
                            event.source == 'ai' ? 'Customize' : 'Edit',
                          ),
                        ),
                        if (event.source == 'user')
                          TextButton.icon(
                            onPressed: () => _handleDeleteEvent(event.id ?? ''),
                            icon: const Icon(Icons.delete, size: 16),
                            label: const Text('Delete'),
                          ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCalendarView() {
    return Column(
      children: [
        TableCalendar(
          firstDay: DateTime.utc(2020, 1, 1),
          lastDay: DateTime.utc(2030, 12, 31),
          focusedDay: _focusedDay,
          selectedDayPredicate: (day) => isSameDay(_selectedDate, day),
          calendarFormat: CalendarFormat.month,
          startingDayOfWeek: StartingDayOfWeek.monday,
          calendarStyle: CalendarStyle(
            selectedDecoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
              shape: BoxShape.circle,
            ),
            todayDecoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
              shape: BoxShape.circle,
            ),
            markerDecoration: BoxDecoration(
              color: Theme.of(context).colorScheme.secondary,
              shape: BoxShape.circle,
            ),
          ),
          eventLoader: (day) {
            final dateStr = DateFormat('MM/dd/yyyy').format(day);
            return _events
                .where((event) => event.date == dateStr)
                .map((event) => event.id ?? '')
                .toList();
          },
          onDaySelected: (selectedDay, focusedDay) {
            setState(() {
              _selectedDate = selectedDay;
              _focusedDay = focusedDay;
              _updateSelectedDateEvents();
            });
          },
          onPageChanged: (focusedDay) {
            _focusedDay = focusedDay;
          },
        ),
        const SizedBox(height: 24),
        Text(
          'Events for ${DateFormat('MMMM d, yyyy').format(_selectedDate)}',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        if (_selectedDateEvents.isEmpty)
          Center(
            child: Text(
              'No events scheduled for this day.',
              style: TextStyle(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.7),
              ),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _selectedDateEvents.length,
            itemBuilder: (context, index) {
              final event = _selectedDateEvents[index];
              final isExpanded = _expandedEvents.contains(event.id ?? '');
              
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: event.source == 'ai' 
                                  ? Colors.blue.withOpacity(0.2) 
                                  : Colors.orange.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              event.source == 'ai' ? '🤖 AI' : '👤 Custom',
                              style: TextStyle(
                                color: event.source == 'ai' ? Colors.blue : Colors.orange,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          if (event.handle != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.grey.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '@${event.handle}',
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        event.name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 16,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          const SizedBox(width: 4),
                          Text(_formatTimeTo12Hour(event.time)),
                          const SizedBox(width: 16),
                          Icon(
                            Icons.location_on,
                            size: 16,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          const SizedBox(width: 4),
                          Text(event.location),
                        ],
                      ),
                      if (isExpanded) ...[
                        const SizedBox(height: 8),
                        Text(
                          event.caption,
                          style: const TextStyle(
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextButton(
                            onPressed: () => _toggleEventExpansion(event.id ?? ''),
                            child: Text(isExpanded ? 'Show Less' : 'Show More'),
                          ),
                          Row(
                            children: [
                              TextButton.icon(
                                onPressed: () => _openEditEventModal(event),
                                icon: Icon(
                                  event.source == 'ai' ? Icons.auto_awesome : Icons.edit,
                                  size: 16,
                                ),
                                label: Text(
                                  event.source == 'ai' ? 'Customize' : 'Edit',
                                ),
                              ),
                              if (event.source == 'user')
                                TextButton.icon(
                                  onPressed: () => _handleDeleteEvent(event.id ?? ''),
                                  icon: const Icon(Icons.delete, size: 16),
                                  label: const Text('Delete'),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
} 