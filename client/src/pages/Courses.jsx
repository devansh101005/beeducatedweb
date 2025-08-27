import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Courses.css';

const Courses = () => {
  const [activeTab, setActiveTab] = useState('school');

  const schoolCourses = [
    { id: 1, name: 'Class 1', subjects: ['English', 'Math', 'EVS'], color: '#FF6B6B' },
    { id: 2, name: 'Class 2', subjects: ['English', 'Math', 'EVS'], color: '#4ECDC4' },
    { id: 3, name: 'Class 3', subjects: ['English', 'Math', 'EVS'], color: '#45B7D1' },
    { id: 4, name: 'Class 4', subjects: ['English', 'Math', 'EVS'], color: '#96CEB4' },
    { id: 5, name: 'Class 5', subjects: ['English', 'Math', 'EVS'], color: '#FFEAA7' },
    { id: 6, name: 'Class 6', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: '#DDA0DD' },
    { id: 7, name: 'Class 7', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: '#98D8C8' },
    { id: 8, name: 'Class 8', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: '#F7DC6F' },
    { id: 9, name: 'Class 9', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: '#BB8FCE' },
    { id: 10, name: 'Class 10', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: '#85C1E9' },
    { id: 11, name: 'Class 11', subjects: ['Physics', 'Chemistry', 'Math', 'Biology'], color: '#F8C471' },
    { id: 12, name: 'Class 12', subjects: ['Physics', 'Chemistry', 'Math', 'Biology'], color: '#82E0AA' },
  ];

  const competitionCourses = [
    { 
      id: 'jee', 
      name: 'JEE (Main & Advanced)', 
      description: 'Joint Entrance Examination for IITs',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      color: '#E74C3C',
      icon: '⚡'
    },
    { 
      id: 'neet', 
      name: 'NEET', 
      description: 'National Eligibility cum Entrance Test',
      subjects: ['Physics', 'Chemistry', 'Biology'],
      color: '#3498DB',
      icon: '🏥'
    },
    { 
      id: 'nda', 
      name: 'NDA', 
      description: 'National Defence Academy',
      subjects: ['Mathematics', 'General Ability Test'],
      color: '#2ECC71',
      icon: '🎖️'
    },
    { 
      id: 'cat', 
      name: 'CAT', 
      description: 'Common Admission Test',
      subjects: ['Quantitative Aptitude', 'Verbal Ability', 'Data Interpretation'],
      color: '#F39C12',
      icon: '📊'
    },
  ];

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h1>📚 Our Courses</h1>
        <p>Choose from our comprehensive range of educational programs</p>
      </div>

      <div className="courses-tabs">
        <button 
          className={`tab-button ${activeTab === 'school' ? 'active' : ''}`}
          onClick={() => setActiveTab('school')}
        >
          🏫 School Courses (Class 1-12)
        </button>
        <button 
          className={`tab-button ${activeTab === 'competition' ? 'active' : ''}`}
          onClick={() => setActiveTab('competition')}
        >
          🏆 Competition Courses
        </button>
      </div>

      <div className="courses-content">
        {activeTab === 'school' && (
          <div className="school-courses">
            <div className="courses-grid">
              {schoolCourses.map((course) => (
                <div key={course.id} className="course-card school-card" style={{ borderTopColor: course.color }}>
                  <div className="course-header">
                    <h3>{course.name}</h3>
                    <div className="course-number">{course.id}</div>
                  </div>
                  <div className="course-subjects">
                    <h4>Subjects:</h4>
                    <ul>
                      {course.subjects.map((subject, index) => (
                        <li key={index}>{subject}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="course-actions">
                    <button className="view-btn">View Details</button>
                    <button className="enroll-btn">Enroll Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'competition' && (
          <div className="competition-courses">
            <div className="courses-grid">
              {competitionCourses.map((course) => (
                <div key={course.id} className="course-card competition-card" style={{ borderTopColor: course.color }}>
                  <div className="course-header">
                    <div className="course-icon">{course.icon}</div>
                    <h3>{course.name}</h3>
                  </div>
                  <p className="course-description">{course.description}</p>
                  <div className="course-subjects">
                    <h4>Subjects:</h4>
                    <ul>
                      {course.subjects.map((subject, index) => (
                        <li key={index}>{subject}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="course-actions">
                    <button className="view-btn">View Details</button>
                    <button className="enroll-btn">Enroll Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;