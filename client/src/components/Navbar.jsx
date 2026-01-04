import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-[1000] transition-all duration-300 px-4 md:px-8 shadow-sm">
      <div className="h-20 flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link to="/" className="no-underline text-inherit">
            <div className="flex items-center gap-2">
              <div className="text-2xl">
                <img src={logo} alt="Be Educated Logo" className="h-10 w-10 object-contain" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Be Educated
              </span>
            </div>
          </Link>
        </div>
        <div className="flex gap-4 md:gap-8 items-center">
          {!user ? (
            <>
              <Link
                to="/login"
                className="no-underline text-gray-700 font-medium transition-all duration-300 hover:text-purple-600 hover:-translate-y-0.5 text-sm md:text-base"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 md:px-6 py-2 rounded-full font-semibold transition-all duration-300 shadow-lg shadow-purple-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-600/40 no-underline text-sm md:text-base"
              >
                Signup
              </Link>
            </>
          ) : (
            <>
              <span className="text-gray-700 font-medium text-sm md:text-base hidden sm:inline">
                {user.email}
              </span>
              <button
                className="bg-gradient-to-r from-red-500 to-orange-600 border-none px-4 md:px-6 py-2 text-white rounded-full cursor-pointer font-semibold transition-all duration-300 shadow-lg shadow-red-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/40 text-sm md:text-base"
                onClick={logout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;