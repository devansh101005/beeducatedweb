import Rishabh from "../assets/Rishabh.png";
import Saurabh from "../assets/Saurabh.png";
import { FaLinkedin, FaGithub } from "react-icons/fa";

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero */}
      <header className="py-16 px-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-lg md:text-xl opacity-90">
            Discover our journey and the people behind Be Educated
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        {/* Our Story */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Story</h2>
          <p className="text-gray-600 leading-relaxed">
            Be Educated Home Tutor began with a simple mission — to make quality tutoring accessible to every student across the country. We saw the struggles of students trying to find reliable tutors and the passion of tutors looking for the right learners. This platform was created to bridge that gap.
          </p>
        </section>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="opacity-90 leading-relaxed">
              To empower students by connecting them with skilled and passionate tutors, fostering academic growth and confidence.
            </p>
          </section>

          <section className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="opacity-90 leading-relaxed">
              We aim to simplify home tutoring through smart matchmaking, personalized support, and a trusted digital ecosystem where learning thrives.
            </p>
          </section>
        </div>

        {/* Founders */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Meet the Founders</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Devansh Pandey</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A passionate developer and educator who envisioned a platform where education is not a privilege, but a right. Devansh combined his love for coding and community impact to launch Be Educated.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.linkedin.com/in/devansh-pandey-a71667218/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FaLinkedin size={22} />
                </a>
                <a
                  href="https://github.com/devansh101005"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <FaGithub size={22} />
                </a>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Rishabh Pandey</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                The visionary founder of Be Educated, is a passionate educator dedicated to transforming the way students learn. With a deep connection to his roots in Lalganj Ajhara, Pratapgarh, he started this journey to ensure that every child, regardless of their background, gets access to quality education.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.linkedin.com/in/rishabh-pandey-6209542ba/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FaLinkedin size={22} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Our Team</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-3xl text-gray-400">👤</span>
              </div>
              <h4 className="font-semibold text-gray-800">Manager</h4>
              <p className="text-gray-500 text-sm">Operations</p>
            </div>

            <div className="text-center p-4">
              <img
                src={Saurabh}
                alt="Saurabh Pandey"
                className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
              />
              <h4 className="font-semibold text-gray-800">Saurabh Pandey</h4>
              <p className="text-gray-500 text-sm">Academic Director</p>
            </div>

            <div className="text-center p-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-3xl text-gray-400">👤</span>
              </div>
              <h4 className="font-semibold text-gray-800">Aman Pandey</h4>
              <p className="text-gray-500 text-sm">Content Team Lead</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 text-center bg-gray-900 text-gray-400">
        <p>© {new Date().getFullYear()} Be Educated. Built with ❤️ and purpose.</p>
      </footer>
    </div>
  );
}

export default About;
