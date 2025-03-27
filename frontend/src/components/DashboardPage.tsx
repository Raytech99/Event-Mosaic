import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../App.css';
import { buildPath, API_ROUTES } from '../utils/api';
import { checkAndClearToken } from '../utils/tokenUtils';

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
  handle?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  followedAccounts?: Array<{ $oid: string }>;
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
    source: 'user',
    handle: ''
  });
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  useEffect(() => {
    // Check token expiration first
    if (!checkAndClearToken()) {
      window.location.href = '/login';
      return;
    }

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
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildPath(API_ROUTES.EVENTS), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const eventsData = await response.json();
      if (!Array.isArray(eventsData)) {
        throw new Error('Invalid events data format');
      }
      
      const formattedEvents = eventsData.map((event: any) => ({
        ...event,
        _id: { $oid: event._id?.$oid || event._id },
        postedBy: event.postedBy ? { $oid: event.postedBy.$oid || event.postedBy } : null,
        source: event.source || 'user',
        baseEventId: event.baseEventId?.$oid || event.baseEventId || null,
        createdAt: event.createdAt ? { $date: event.createdAt.$date || event.createdAt } : null,
        updatedAt: event.updatedAt ? { $date: event.updatedAt.$date || event.updatedAt } : null
      }));
      
      setEvents(formattedEvents);
    } catch (error: unknown) {
      console.error('Error fetching events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load events';
      setError(errorMessage);
      if (errorMessage === 'No authentication token found') {
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        throw new Error('No authentication token found');
      }

      const currentUser = JSON.parse(userData);
      const eventData = {
        ...newEvent,
        postedBy: currentUser._id,
        source: 'user'
      };

      const response = await fetch(buildPath(API_ROUTES.EVENTS), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const { event: createdEvent } = await response.json();
      const formattedEvent: Event = {
        ...createdEvent,
        _id: { $oid: createdEvent._id },
        postedBy: { $oid: currentUser._id },
        source: 'user'
      };
      
      setEvents(prevEvents => [...prevEvents, formattedEvent]);
      setShowCreateEvent(false);
      setNewEvent({
        name: '',
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        location: '',
        caption: '',
        postedBy: { $oid: currentUser._id },
        source: 'user',
        handle: ''
      });
    } catch (error: unknown) {
      console.error('Error creating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      setError(errorMessage);
      if (errorMessage === 'No authentication token found') {
        window.location.href = '/login';
      }
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?._id?.['$oid']) {
      setError('Invalid event ID');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const eventData = {
        name: editingEvent.name,
        date: editingEvent.date,
        time: editingEvent.time,
        location: editingEvent.location,
        caption: editingEvent.caption,
        postedBy: editingEvent.postedBy?.['$oid'],
        source: 'user',
        baseEventId: editingEvent.source === 'ai' ? editingEvent._id.$oid : editingEvent.baseEventId,
        handle: editingEvent.handle
      };

      const method = editingEvent.source === 'ai' ? 'POST' : 'PUT';
      const url = editingEvent.source === 'ai' 
        ? buildPath(API_ROUTES.EVENTS)
        : buildPath(API_ROUTES.EVENT(editingEvent._id.$oid));

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }

      const responseData = await response.json();
      const updatedEventData = responseData.event || responseData;
      
      const formattedEvent: Event = {
        ...updatedEventData,
        _id: { $oid: updatedEventData._id },
        postedBy: updatedEventData.postedBy ? { $oid: updatedEventData.postedBy } : null,
        source: 'user',
        baseEventId: updatedEventData.baseEventId || null,
        createdAt: updatedEventData.createdAt ? { $date: updatedEventData.createdAt } : null,
        updatedAt: updatedEventData.updatedAt ? { $date: updatedEventData.updatedAt } : null
      };

      setEvents(prevEvents => {
        if (editingEvent.source === 'ai') {
          return [...prevEvents, formattedEvent];
        } else {
          return prevEvents.map(event => 
            event._id?.$oid === editingEvent._id?.$oid ? formattedEvent : event
          );
        }
      });

      // Update selected events if the edited event was in the current selection
      if (selectedEvents.some(e => e._id?.$oid === editingEvent._id?.$oid)) {
        const newDate = new Date(formattedEvent.date);
        const dateStr = newDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
        
        setSelectedEvents(prevSelected => {
          const updatedSelected = prevSelected.map(event => 
            event._id?.$oid === editingEvent._id?.$oid ? formattedEvent : event
          );
          return updatedSelected.filter(event => event.date === dateStr);
        });
        
        setSelectedDate(newDate);
        setSelectedDateStr(newDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        }));
      }
      
      setShowEditEvent(false);
      setEditingEvent(null);
    } catch (error: unknown) {
      console.error('Error updating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      setError(errorMessage);
      if (errorMessage === 'No authentication token found') {
        window.location.href = '/login';
      }
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleDateClick = (arg: any) => {
    const clickedDate = new Date(arg.date);
    const dateStr = clickedDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    // Find events for the clicked date
    const eventsOnDate = events.filter(event => {
      const eventDateStr = event.date;
      return eventDateStr === dateStr;
    });

    setSelectedDate(clickedDate);
    setSelectedDateStr(clickedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    setSelectedEvents(eventsOnDate);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e._id?.$oid === clickInfo.event.id);
    if (event) {
      const eventDate = new Date(event.date);
      const dateStr = eventDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      
      // Find all events for this date
      const eventsOnDate = events.filter(e => e.date === dateStr);
      
      setSelectedDate(eventDate);
      setSelectedDateStr(eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
      setSelectedEvents(eventsOnDate);
    }
  };

  const formatDateForInput = (dateString: string) => {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value; // YYYY-MM-DD format
    // Create date object in local timezone
    const date = new Date(inputDate + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    if (editingEvent) {
      setEditingEvent({ ...editingEvent, date: formattedDate });
    } else {
      setNewEvent({ ...newEvent, date: formattedDate });
    }
  };

  // Convert events to FullCalendar format
  const calendarEvents = events.map(event => {
    // Parse the date parts
    const [month, day, year] = event.date.split('/');
    const [hours, minutes] = event.time.split(':');
    
    // Create date object in local timezone
    const eventDate = new Date(
      parseInt(year),
      parseInt(month) - 1, // Months are 0-based
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );

    return {
      id: event._id?.$oid,
      title: event.name,
      start: eventDate,
      extendedProps: event,
      backgroundColor: event.source === 'ai' ? '#4a90e2' : '#2ecc71',
      borderColor: event.source === 'ai' ? '#357abd' : '#27ae60'
    };
  });

  // Add sorting function near the top of the component
  const sortEvents = (events: Event[]) => {
    return [...events].sort((a, b) => {
      // Convert date strings to Date objects for comparison
      const [monthA, dayA, yearA] = a.date.split('/');
      const [hoursA, minutesA] = a.time.split(':');
      const dateA = new Date(
        parseInt(yearA),
        parseInt(monthA) - 1,
        parseInt(dayA),
        parseInt(hoursA),
        parseInt(minutesA)
      );

      const [monthB, dayB, yearB] = b.date.split('/');
      const [hoursB, minutesB] = b.time.split(':');
      const dateB = new Date(
        parseInt(yearB),
        parseInt(monthB) - 1,
        parseInt(dayB),
        parseInt(hoursB),
        parseInt(minutesB)
      );

      return dateA.getTime() - dateB.getTime();
    });
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
                {user?.firstName && user?.lastName 
                  ? `${user.firstName[0]}${user.lastName[0]}`
                  : 'U'}
              </div>
              <span className="username">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : 'User'}
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
              sortEvents(events).map((event) => (
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
                        <div className="event-meta">
                          <span className={`source-badge ${event.source}`}>
                            {event.source === 'ai' ? '🤖 AI' : '👤 Custom'}
                          </span>
                          {event.handle && (
                            <span className="handle-badge">
                              {event.handle}
                            </span>
                          )}
                        </div>
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
                selectable={false}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                events={calendarEvents}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek'
                }}
                height="auto"
              />
            </div>
            <div className="selected-date-events">
              <h3>
                Events for {selectedDateStr || selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event) => (
                  <div key={event._id?.$oid} className="event-card" data-source={event.source}>
                    <div className="event-details">
                      <div className="event-header">
                        <h4>{event.name}</h4>
                        <div className="event-meta">
                          <span className="source-badge" data-source={event.source}>
                            {event.source === 'ai' ? '🤖 AI' : '👤 Custom'}
                          </span>
                          {event.handle && (
                            <span className="handle-badge">
                              {event.handle}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="event-info">
                        <p>⏰ {event.time}</p>
                        <p>📍 {event.location}</p>
                        {event.caption && <p>{event.caption}</p>}
                      </div>
                      <div className="event-actions">
                        <button
                          className="edit-btn"
                          onClick={() => {
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
              <input
                type="text"
                placeholder="Club Handle (optional)"
                value={newEvent.handle || ''}
                onChange={(e) => setNewEvent({ ...newEvent, handle: e.target.value })}
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
                onChange={handleDateChange}
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
              <input
                type="text"
                placeholder="Club Handle (optional)"
                value={editingEvent.handle || ''}
                onChange={(e) => setEditingEvent({ ...editingEvent, handle: e.target.value })}
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