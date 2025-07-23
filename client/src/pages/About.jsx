import "./About.css";
import { FaLinkedin, FaGithub } from "react-icons/fa";

function About() {
  return (
    <div className="about-wrapper">
      <header className="about-hero">
        <h1>About Us</h1>
        <p>Discover our journey and the people behind Be Educated</p>
      </header>

      <section className="about-section">
        <h2>Our Story</h2>
        <p>
          Be Educated Home Tutor began with a simple mission — to make quality tutoring accessible to every student across the country. We saw the struggles of students trying to find reliable tutors and the passion of tutors looking for the right learners. This platform was created to bridge that gap.
        </p>
      </section>

      <section className="about-section highlight">
        <h2>Our Vision</h2>
        <p>
          To empower students by connecting them with skilled and passionate tutors, fostering academic growth and confidence.
        </p>
      </section>

      <section className="about-section highlight">
        <h2>Our Mission</h2>
        <p>
          We aim to simplify home tutoring through smart matchmaking, personalized support, and a trusted digital ecosystem where learning thrives.
        </p>
      </section>

      <section className="about-section founder">
        <h2>Meet the Founders</h2>
        <div className="founders-grid">
          <div className="founder-member">
            <strong>Devansh Pandey</strong> — a passionate developer and educator who envisioned a platform where education is not a privilege, but a right. Devansh combined his love for coding and community impact to launch Be Educated.
            <div className="founder-links">
              <a href="https://www.linkedin.com/in/devanshpandey01/" target="_blank" rel="noopener noreferrer" aria-label="Devansh Pandey LinkedIn">
                <FaLinkedin size={22} />
              </a>
              <a href="https://github.com/devanshpandey01" target="_blank" rel="noopener noreferrer" aria-label="Devansh Pandey GitHub">
                <FaGithub size={22} />
              </a>
            </div>
          </div>
          <div className="founder-member">
            <strong>Rishabh Pandey</strong> —the visionary founder of Be Educated, is a passionate educator dedicated to transforming the way students learn. With a deep connection to his roots in Lalganj Ajhara, Pratapgarh, he started this journey to ensure that every child, regardless of their background, gets access to quality education.
            <div className="founder-links">
              <a href="https://www.linkedin.com/in/rishabh-pandey-h/" target="_blank" rel="noopener noreferrer" aria-label="Rishabh Pandey LinkedIn">
                <FaLinkedin size={22} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section team">
        <h2>Our Team</h2>
        <div className="team-grid">
          <div className="team-member">
            {/* <img src="https://via.placeholder.com/100" alt="Team member" /> */}
            <h4>Pranav Singh</h4>
            <p>Manager</p>
          </div>
          <div className="team-member">
            <img src="https://via.placeholder.com/100" alt="Team member" />
            <h4>Saurabh Pandey</h4>
            <p>Academic Director</p>
          </div>
          <div className="team-member">
            {/* <img src={logo} alt="Team member" /> */}
            <h4>Aman Pandey</h4>
            <p>Content Team Lead</p>
          </div>
        </div>
      </section>

      <footer className="about-footer">
        <p>© {new Date().getFullYear()} Be Educated. Built with ❤️ and purpose.</p>
      </footer>
    </div>
  );
}

export default About;
