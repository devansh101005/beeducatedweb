import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-content">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <div className="logo-container">
              <div className="logo-placeholder">
              <img src={logo} alt="Be Educated Logo" className="logo-image" />
              </div>
              <span className="logo-text">Be Educated</span>
            </div>
          </Link>
        </div>
        <div className="navbar-right">
          {!user ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="nav-link signup-btn">Signup</Link>
            </>
          ) : (
            <>
              <span className="user-email">{user.email}</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;