import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../App.css';

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  category: string;
  attendees: number;
  description?: string;
  caption?: string;
  time?: string;
  postedBy: {
    $oid: string;
  };
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const DashboardPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'upcoming' | 'calendar'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    category: 'Work',
    attendees: 1,
    description: '',
    time: '',
    postedBy: { $oid: '' }
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
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
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const eventsData = await response.json();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const createdEvent = await response.json();
      setEvents([...events, createdEvent]);
      setShowCreateEvent(false);
      setNewEvent({
        name: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        category: 'Work',
        attendees: 1,
        description: '',
        time: '',
        postedBy: { $oid: '' }
      });
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event');
    }
  };

  // Function to get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Work":
        return "bg-blue-500 text-white";
      case "Personal":
        return "bg-green-500 text-white";
      case "Health":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
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
    const event = events.find(e => e.id === parseInt(clickInfo.event.id));
    if (event) {
      setSelectedDate(new Date(event.date));
    }
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
            <button className="notification-btn">
              <span className="notification-icon">🔔</span>
              <span className="notification-badge"></span>
            </button>
            <div className="user-profile">
              <div className="avatar">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </div>
              <span className="username">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
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
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  required
                />
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  required
                >
                  <option key="work" value="Work">Work</option>
                  <option key="personal" value="Personal">Personal</option>
                  <option key="health" value="Health">Health</option>
                </select>
                <input
                  type="number"
                  placeholder="Number of Attendees"
                  value={newEvent.attendees}
                  onChange={(e) => setNewEvent({ ...newEvent, attendees: parseInt(e.target.value) })}
                  required
                />
                <input
                  type="text"
                  placeholder="Instagram Account ID"
                  value={newEvent.postedBy?.$oid || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, postedBy: { $oid: e.target.value } })}
                  required
                />
                <textarea
                  placeholder="Event Description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
                <div className="modal-buttons">
                  <button type="submit" className="create-event-btn">Create Event</button>
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

        <div className="dashboard-content">
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

          {activeTab === 'upcoming' ? (
            <div className="events-list">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-date">
                    <span className="month">
                      {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="day">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div className="event-details">
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <span className={`category-badge ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    </div>
                    <div className="event-info">
                      <span key="name"><strong>{event.name}</strong></span>
                      <span key="location">📍 {event.location}</span>
                      <span key="postedBy">👤 Posted by: {event.postedBy?.$oid}</span>
                    </div>
                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="calendar-view">
              <div className="calendar">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek'
                  }}
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  events={events.map(event => ({
                    id: `event-${event.id}`,
                    title: event.name,
                    start: event.date,
                    backgroundColor: getCategoryColor(event.category).split(' ')[0],
                    borderColor: getCategoryColor(event.category).split(' ')[0],
                    extendedProps: {
                      category: event.category,
                      location: event.location,
                      attendees: event.attendees,
                      description: event.description
                    }
                  }))}
                  select={handleDateSelect}
                  eventClick={handleEventClick}
                />
              </div>
              <div className="selected-date-events">
                <h3>Events for {selectedDate.toLocaleDateString()}</h3>
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event) => (
                    <div key={event.id} className="event-card">
                      <div className="event-details">
                        <div className="event-header">
                          <h3>{event.name}</h3>
                          <span className={`category-badge ${getCategoryColor(event.category)}`}>
                            {event.category}
                          </span>
                        </div>
                        <div className="event-info">
                          <span key="name"><strong>{event.name}</strong></span>
                          <span key="location">📍 {event.location}</span>
                          <span key="postedBy">👤 Posted by: {event.postedBy?.$oid}</span>
                        </div>
                        {event.description && (
                          <p className="event-description">{event.description}</p>
                        )}
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
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 