import React from 'react';
import { facultyList } from '../facultyData';

const FacultyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Faculty
          </h1>
          <p className="text-gray-600 text-lg">
            Connect with our expert educators and book your slots.
          </p>
        </header>

        {/* Faculty Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {facultyList.map((faculty) => (
            <div
              key={faculty.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-6">
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: faculty.color }}
                >
                  {faculty.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                {/* Info */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{faculty.name}</h2>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: faculty.color }}
                  >
                    {faculty.subject}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <span>🎓</span>
                    <span className="font-medium">Qual:</span> {faculty.qualification}
                  </p>
                  <p className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="font-medium">Location:</span> {faculty.location}
                  </p>
                </div>

                {/* Slots */}
                <div className="mb-4">
                  <span className="text-sm font-semibold text-gray-500">Available Slots:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {faculty.slots.map((slot, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Book Button */}
                <button
                  className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: faculty.color }}
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyPage;
