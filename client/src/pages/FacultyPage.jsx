import React from 'react';
import { facultyList } from '../facultyData';
import './FacultyPage.css'; // Importing the CSS file

const FacultyPage = () => {
  return (
    <div className="faculty-container">
      <header className="faculty-header">
        <h1 className="faculty-title">Faculty</h1>
        <p className="faculty-subtitle">Connect with our expert educators and book your slots.</p>
      </header>

      <div className="faculty-grid">
        {facultyList.map((faculty) => (
          <div key={faculty.id} className="faculty-card">
            
            <div 
              className="faculty-avatar" 
              style={{ backgroundColor: faculty.color }}
            >
              {faculty.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            <div className="faculty-info">
              <h2 className="faculty-name">{faculty.name}</h2>
              <p className="subject-tag">{faculty.subject}</p>
              
              <div className="faculty-details">
                <p><strong>🎓 Qual:</strong> {faculty.qualification}</p>
                <p><strong>📍 Location:</strong> {faculty.location}</p>
              </div>

              <div className="slot-container">
                <span className="slot-title">Available Slots:</span>
                <div className="slot-wrapper">
                  {faculty.slots.map((slot, index) => (
                    <span key={index} className="slot-badge">{slot}</span>
                  ))}
                </div>
              </div>
            </div>

            <button 
              className="book-btn" 
              style={{ backgroundColor: faculty.color }}
            >
              Book Appointment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyPage;