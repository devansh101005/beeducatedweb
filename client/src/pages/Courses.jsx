import { useState } from 'react';

const Courses = () => {
  const [activeTab, setActiveTab] = useState('school');

  const schoolCourses = [
    { id: 1, name: 'Class Nursery', subjects: ['English', 'Math', 'EVS', 'Hindi'], color: 'bg-red-400' },
    { id: 2, name: 'Class UKG', subjects: ['English', 'Math', 'EVS'], color: 'bg-red-400' },
    { id: 3, name: 'Class LKG', subjects: ['English', 'Math', 'EVS'], color: 'bg-red-400' },
    { id: 4, name: 'Class 1', subjects: ['English', 'Math', 'EVS'], color: 'bg-red-400' },
    { id: 5, name: 'Class 2', subjects: ['English', 'Math', 'EVS'], color: 'bg-teal-400' },
    { id: 6, name: 'Class 3', subjects: ['English', 'Math', 'EVS'], color: 'bg-cyan-400' },
    { id: 7, name: 'Class 4', subjects: ['English', 'Math', 'EVS'], color: 'bg-green-300' },
    { id: 8, name: 'Class 5', subjects: ['English', 'Math', 'EVS'], color: 'bg-yellow-300' },
    { id: 9, name: 'Class 6', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: 'bg-purple-300' },
    { id: 10, name: 'Class 7', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: 'bg-teal-300' },
    { id: 11, name: 'Class 8', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: 'bg-yellow-400' },
    { id: 12, name: 'Class 9', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: 'bg-purple-400' },
    { id: 13, name: 'Class 10', subjects: ['English', 'Math', 'Science', 'Social Studies'], color: 'bg-blue-300' },
    { id: 14, name: 'Class 11', subjects: ['Physics', 'Chemistry', 'Math', 'Biology'], color: 'bg-orange-300' },
    { id: 15, name: 'Class 12', subjects: ['Physics', 'Chemistry', 'Math', 'Biology'], color: 'bg-green-400' },
  ];

  const competitionCourses = [
    {
      id: 'jee',
      name: 'JEE (Main & Advanced)',
      description: 'Joint Entrance Examination for IITs',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      color: 'bg-red-500',
      icon: '⚡'
    },
    {
      id: 'neet',
      name: 'NEET',
      description: 'National Eligibility cum Entrance Test',
      subjects: ['Physics', 'Chemistry', 'Biology'],
      color: 'bg-blue-500',
      icon: '🏥'
    },
    {
      id: 'nda',
      name: 'NDA',
      description: 'National Defence Academy',
      subjects: ['Mathematics', 'General Ability Test'],
      color: 'bg-green-500',
      icon: '🎖️'
    },
    {
      id: 'cat',
      name: 'CAT',
      description: 'Common Admission Test',
      subjects: ['Quantitative Aptitude', 'Verbal Ability', 'Data Interpretation'],
      color: 'bg-orange-500',
      icon: '📊'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Our Courses
          </h1>
          <p className="text-gray-600 text-lg">
            Choose from our comprehensive range of educational programs
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <button
            className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
              activeTab === 'school'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
            onClick={() => setActiveTab('school')}
          >
            School Courses (Class 1-12)
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
              activeTab === 'competition'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
            onClick={() => setActiveTab('competition')}
          >
            Competition Courses
          </button>
        </div>

        {/* School Courses */}
        {activeTab === 'school' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {schoolCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`h-2 ${course.color}`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{course.name}</h3>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Subjects:</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-md transition-all">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Competition Courses */}
        {activeTab === 'competition' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {competitionCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`h-2 ${course.color}`}></div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{course.icon}</span>
                    <h3 className="text-xl font-bold text-gray-800">{course.name}</h3>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Subjects:</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-md transition-all">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
