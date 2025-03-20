import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../App.css';
import { buildPath, API_ROUTES } from '../utils/api';

interface Event {
  _id?: {
    $oid: string;
  };
  name: string;
  date: string;
  time: string;
  location: string;
  caption: string;
  postedBy?: {
    $oid: string;
  } | null;
  source: 'ai' | 'user';
  baseEventId?: string | null;
  createdAt?: {
    $date: string;
  } | null;
  updatedAt?: {
    $date: string;
  } | null;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  followedAccounts?: Array<{ $oid: string }>;
  userEvents?: Array<{ $oid: string }>;
}

const DashboardPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'upcoming' | 'calendar'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<Event>({
    name: '',
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').join('/'),
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    location: '',
    caption: '',
    postedBy: { $oid: '' },
    source: 'user'
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setNewEvent(prev => ({
          ...prev,
          postedBy: { $oid: parsedUser._id },
          source: parsedUser.followedAccounts?.length > 0 ? 'ai' : 'user'
        }));
      } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = '/login';
        return;
      }
    } else {
      window.location.href = '/login';
      return;
    }
    
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      
      if (!token) {
        console.error('No token found');
        window.location.href = '/login';
        return;
      }

      const url = buildPath(API_ROUTES.EVENTS);
      console.log('Fetching events from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const eventsData = await response.json();
      console.log('Raw events data:', eventsData);
      
      if (!Array.isArray(eventsData)) {
        console.error('Events data is not an array:', eventsData);
        throw new Error('Invalid events data format');
      }
      
      // Format the events to match our Event interface
      const formattedEvents = eventsData.map((event: any) => ({
        ...event,
        _id: event._id?.$oid ? { $oid: event._id.$oid } : { $oid: event._id },
        postedBy: event.postedBy ? (event.postedBy.$oid ? { $oid: event.postedBy.$oid } : { $oid: event.postedBy }) : null,
        source: event.source || 'user',
        baseEventId: event.baseEventId?.$oid || event.baseEventId || undefined,
        createdAt: event.createdAt?.$date ? { $date: event.createdAt.$date } : event.createdAt ? { $date: event.createdAt } : undefined,
        updatedAt: event.updatedAt?.$date ? { $date: event.updatedAt.$date } : event.updatedAt ? { $date: event.updatedAt } : undefined
      }));
      
      console.log('Formatted events:', formattedEvents);
      setEvents(formattedEvents);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error instanceof Error ? error.message : 'Failed to load events');
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        window.location.href = '/login';
        return;
      }

      const currentUser = JSON.parse(userData);
      
      // Create a copy of the event data with properly formatted postedBy
      const eventData = {
        ...newEvent,
        postedBy: currentUser._id, // Always set the current user's ID for custom events
        source: 'user'
      };

      console.log('Creating event with data:', eventData);

      const response = await fetch(buildPath(API_ROUTES.EVENTS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const createdEvent = await response.json();
      console.log('Created event response:', createdEvent);
      
      // Convert the returned event to match our Event interface
      const formattedEvent: Event = {
        ...createdEvent.event,
        _id: { $oid: createdEvent.event._id },
        postedBy: { $oid: currentUser._id },
        source: 'user'
      };
      
      setEvents([...events, formattedEvent]);
      setShowCreateEvent(false);
      setNewEvent({
        name: '',
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).split('/').join('/'),
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        location: '',
        caption: '',
        postedBy: { $oid: currentUser._id },
        source: 'user'
      });
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error instanceof Error ? error.message : 'Failed to create event');
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Editing event:', editingEvent);
    console.log('Event ID:', editingEvent?._id);
    console.log('Event ID $oid:', editingEvent?._id?.$oid);
    
    if (!editingEvent?._id?.$oid) {
      setError('Invalid event ID');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Create a copy of the event data with properly formatted fields
      const eventData = {
        name: editingEvent.name,
        date: editingEvent.date,
        time: editingEvent.time,
        location: editingEvent.location,
        caption: editingEvent.caption,
        postedBy: editingEvent.postedBy?.['$oid'],
        source: editingEvent.source === 'ai' ? 'user' : 'user', // If editing an AI event, create a user override
        baseEventId: editingEvent.source === 'ai' ? editingEvent._id.$oid : editingEvent.baseEventId // Set baseEventId if it's an AI event
      };

      console.log('Sending event data:', eventData);

      // If this is an AI event, create a new user event instead of updating
      const method = editingEvent.source === 'ai' ? 'POST' : 'PUT';
      const url = editingEvent.source === 'ai' 
        ? buildPath(API_ROUTES.EVENTS)
        : buildPath(API_ROUTES.EVENT(editingEvent._id.$oid));

      console.log('Request URL:', url);
      console.log('Request method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update event');
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      // Handle both the POST (AI event) and PUT (custom event) responses
      const updatedEventData = responseData.event || responseData;
      
      // Convert the returned event to match our Event interface
      const formattedEvent: Event = {
        ...updatedEventData,
        _id: { $oid: updatedEventData._id },
        postedBy: updatedEventData.postedBy ? { $oid: updatedEventData.postedBy } : null,
        source: updatedEventData.source || 'user',
        baseEventId: updatedEventData.baseEventId || null,
        createdAt: updatedEventData.createdAt ? { $date: updatedEventData.createdAt } : null,
        updatedAt: updatedEventData.updatedAt ? { $date: updatedEventData.updatedAt } : null
      };

      console.log('Formatted event:', formattedEvent);

      if (editingEvent.source === 'ai') {
        // If we created a new user event from an AI event, add it to the list
        setEvents([...events, formattedEvent]);
      } else {
        // If we updated an existing user event, update it in the list
        const eventIdToUpdate = editingEvent._id?.$oid;
        if (!eventIdToUpdate) {
          console.error('Missing event ID for update');
          return;
        }
        setEvents(events.map(event => 
          event._id?.$oid === eventIdToUpdate ? formattedEvent : event
        ));
      }
      
      setShowEditEvent(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      setError(error instanceof Error ? error.message : 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch(buildPath(API_ROUTES.EVENT(eventId)), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      // Remove the event from the state
      setEvents(events.filter(event => event._id?.$oid !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete event');
    }
  };

  // Get events for the selected date
  const selectedDateEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    setShowCreateEvent(true);
    setNewEvent({
      ...newEvent,
      date: selectInfo.start.toISOString().split('T')[0]
    });
  };

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e._id?.$oid === clickInfo.event.id);
    if (event) {
      setSelectedDate(new Date(event.date));
    }
  };

  const formatDateForInput = (dateString: string) => {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value; // This will be in YYYY-MM-DD format
    const formattedDate = new Date(inputDate).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    setNewEvent({ ...newEvent, date: formattedDate });
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/images/logo.png" alt="Logo" className="logo" />
            <span className="app-title">EventMosaic</span>
          </div>
          <div className="user-section">
            <div className="user-profile">
              <div className="avatar">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </div>
              <span className="username">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header-section">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.firstName || 'User'}</p>
          </div>
          <button 
            className="create-event-btn"
            onClick={() => setShowCreateEvent(true)}
          >
            Create New Event
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            All Upcoming
          </button>
          <button
            className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Error: {error}</p>
            <button onClick={fetchEvents} className="retry-btn">Try Again</button>
          </div>
        ) : activeTab === 'upcoming' ? (
          <div className="events-list">
            {events.length === 0 ? (
              <div className="no-events">
                <p>No events found. Create your first event!</p>
                <button 
                  className="create-event-btn"
                  onClick={() => setShowCreateEvent(true)}
                >
                  Create New Event
                </button>
              </div>
            ) : (
              events.map((event) => (
                <div key={event._id?.$oid} className="event-card">
                  <div className="event-date">
                    <span className="month">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="day">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div className="event-details">
                    <div className="event-header">
                      <div className="event-title">
                        <h3>{event.name}</h3>
                        <span className={`source-badge ${event.source}`}>
                          {event.source === 'ai' ? '🤖 AI' : '👤 Custom'}
                        </span>
                      </div>
                      <div className="event-actions">
                        <button
                          className="edit-btn"
                          onClick={() => {
                            console.log('Selected event for editing:', event);
                            setEditingEvent(event);
                            setShowEditEvent(true);
                          }}
                        >
                          {event.source === 'ai' ? '✨ Customize' : '✏️ Edit'}
                        </button>
                        {event.source === 'user' && (
                          <button
                            className="delete-btn"
                            onClick={() => event._id?.$oid && handleDeleteEvent(event._id.$oid)}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="event-info">
                      <span>⏰ {event.time}</span>
                      <span>📍 {event.location}</span>
                      <span>{event.caption}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="calendar-view">
            <div className="calendar">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                selectable={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                events={events.map(event => ({
                  id: event._id?.$oid,
                  title: event.name,
                  start: event.date,
                  backgroundColor: '#4a90e2',
                  borderColor: '#4a90e2',
                  extendedProps: {
                    caption: event.caption,
                    location: event.location,
                    time: event.time,
                    postedBy: event.postedBy
                  }
                }))}
              />
            </div>
            <div className="selected-date-events">
              <h3>
                Events for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <div key={event._id?.$oid} className="event-card">
                    <div className="event-details">
                      <div className="event-header">
                        <h3>{event.name}</h3>
                      </div>
                      <div className="event-info">
                        <span>⏰ {event.time}</span>
                        <span>📍 {event.location}</span>
                        <span>{event.caption}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <p>No events scheduled for this day.</p>
                  <button 
                    className="create-event-btn"
                    onClick={() => setShowCreateEvent(true)}
                  >
                    Create new event
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showCreateEvent && (
        <div className="create-event-modal">
          <div className="modal-content">
            <h2>Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <input
                type="text"
                placeholder="Event Name"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                required
              />
              <input
                type="date"
                value={formatDateForInput(newEvent.date)}
                onChange={handleDateChange}
                required
              />
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                required
              />
              <textarea
                placeholder="Event Caption"
                value={newEvent.caption}
                onChange={(e) => setNewEvent({ ...newEvent, caption: e.target.value })}
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="create-event-btn">
                  Create Event
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateEvent(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditEvent && editingEvent && (
        <div className="create-event-modal">
          <div className="modal-content">
            <h2>Edit Event</h2>
            <form onSubmit={handleEditEvent}>
              <input
                type="text"
                placeholder="Event Name"
                value={editingEvent.name}
                onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                required
              />
              <input
                type="date"
                value={formatDateForInput(editingEvent.date)}
                onChange={(e) => {
                  const inputDate = e.target.value;
                  const formattedDate = new Date(inputDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                  });
                  setEditingEvent({ ...editingEvent, date: formattedDate });
                }}
                required
              />
              <input
                type="time"
                value={editingEvent.time}
                onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={editingEvent.location}
                onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                required
              />
              <textarea
                placeholder="Event Caption"
                value={editingEvent.caption}
                onChange={(e) => setEditingEvent({ ...editingEvent, caption: e.target.value })}
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="create-event-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditEvent(false);
                    setEditingEvent(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;