import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import logo from '../assets/logo.png';

function Footer() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <footer className="bg-gray-800 text-white py-12 pb-4">
      <div className="max-w-7xl mx-auto px-5 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Be Educated Logo" className="w-16 h-12 object-contain rounded-lg" />
              <div className="flex flex-col items-start">
                <span className="font-['Poppins'] text-lg font-bold text-white">Be Educated</span>
                <span className="font-['Open_Sans'] text-xs text-gray-400">Achieve Beyond Limits</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed font-['Open_Sans']">
              Building bright minds through quality education and personalized attention.
            </p>
          </div>

          <div>
            <h4 className="font-['Poppins'] text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 list-none p-0">
              <li>
                <Link to="/about" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/faculty" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Faculty
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* <div>
            <h4 className="font-['Poppins'] text-lg font-semibold mb-4">Programs</h4>
            <ul className="space-y-2 list-none p-0">
              <li>
                <a href="#" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Class 9-10 Board Prep
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Class 11-12 Board Prep
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Home Tutoring
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Competitive Exam Prep
                </a>
              </li>
            </ul>
          </div> */}

          <div>
            <h4 className="font-['Poppins'] text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 list-none p-0">
              <li>
                <Link
                  to={isLoaded && isSignedIn ? "/dashboard" : "/sign-in"}
                  className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']"
                >
                  {isLoaded && isSignedIn ? 'Dashboard' : 'Sign In'}
                </Link>
              </li>
              <li>
                <Link to="/sign-up" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/fee-structure" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Fee Structure
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 no-underline hover:text-blue-400 transition-colors font-['Open_Sans']">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 text-center">
          <p className="text-gray-400 text-sm font-['Open_Sans']">
            &copy; 2024-{new Date().getFullYear()} Be Educated. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
