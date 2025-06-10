import "./About.css";

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
        <h2>Meet the Founder</h2>
        <p><strong>Devansh Pandey</strong> — a passionate developer and educator who envisioned a platform where education is not a privilege, but a right. Devansh combined his love for coding and community impact to launch Be Educated.</p>
      </section>

      <section className="about-section team">
        <h2>Our Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <img src="https://via.placeholder.com/100" alt="Team member" />
            <h4>Priya Sharma</h4>
            <p>Marketing Lead</p>
          </div>
          <div className="team-member">
            <img src="https://via.placeholder.com/100" alt="Team member" />
            <h4>Amit Verma</h4>
            <p>Operations Manager</p>
          </div>
          <div className="team-member">
            <img src="https://via.placeholder.com/100" alt="Team member" />
            <h4>Neha Singh</h4>
            <p>Frontend Developer</p>
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
