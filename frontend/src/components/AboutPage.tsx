import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  profileUrl: string;
}

const AboutPage: React.FC = () => {
  // Animation effect similar to the landing page
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-on-mount');
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-in');
      }, index * 150);
    });
  }, []);

  const teamMembers: TeamMember[] = [
    {
      name: "Rayyan Jamil",
      role: "Project Manager, Frontend",
      image: "/images/ray.jpeg",
      profileUrl: "https://www.linkedin.com/in/rayyan-zjamil/"
    },
    {
      name: "Nabeeha Vorajee",
      role: "Frontend Developer",
      image: "/images/nab.jpg",
      profileUrl: "https://www.linkedin.com/in/nabeeha-vorajee-203422184/"
    },
    {
      name: "Maya Couceiro​",
      role: "Backend Developer",
      image: "/images/mayacorrect.jpg",
      profileUrl: "https://www.linkedin.com/in/mayaco/"
    },
    {
      name: "Jessi Morris",
      role: "Backend Developer",
      image: "/images/jessi.png",
      profileUrl: "https://www.linkedin.com/in/jessica--morris/"
    },
    {
      name: "Joseph Beno",
      role: "Backend Developer",
      image: "/images/joseph.jpg",
      profileUrl: "https://www.linkedin.com/in/josephbenno/"
    },
    {
      name: "Myra Syed​",
      role: "Frontend Developer",
      image: "/images/myra.jpg",
      profileUrl: "https://www.linkedin.com/in/myra-syed-759b18250/"
    }
  ];

  return (
    <div className="about-page">
      <nav>
        <img src="/images/navbarlogo.png" alt="Logo" className="nav-logo" />
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/login">Login</Link></li>
        </ul>
      </nav>

      <div className="about-content">
        <div className="about-header animate-on-mount">
          <h1><span className="title-word gold"> About Event Mosaic</span></h1>
          <p className="about-subtitle">
            The smartest way to keep up with campus events.
          </p>
        </div>

        <div className="about-description animate-on-mount ">
          <h4>
            Event Mosaic is a platform designed to help students discover and organize campus events. 
            Our mission is to create a centralized hub for all campus activities, making it easier 
            for students to engage with their community and make the most of their college experience.
          </h4>
        </div>

        <h2 className="team-heading animate-on-mount">Meet Our Team</h2>
        
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-member animate-on-mount">
              <div className="member-image">
                <a href={member.profileUrl} target="_blank" rel="noopener noreferrer">
                  <img src={member.image} alt={member.name} />
                </a>
              </div>
              <div className="member-info">
                <h3 className="member-name">
                  <a href={member.profileUrl} target="_blank" rel="noopener noreferrer">
                    {member.name}
                  </a>
                </h3>
                <h4>{member.role}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 