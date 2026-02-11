import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaYoutube } from 'react-icons/fa';
import { HiOutlineLocationMarker, HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';
import logo from '../assets/logo.png';

function Footer() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <footer
      className="relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      {/* Light overlay to keep it white-shade */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]"></div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-5 pt-16 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Column 1: Brand */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <img src={logo} alt="Be Educated Logo" className="w-14 h-11 object-contain rounded-lg" />
                <div className="flex flex-col">
                  <span className="font-heading text-xl font-bold text-[#0a1e3d]">Be Educated</span>
                  <span className="font-body text-[11px] text-gray-400 -mt-0.5">Achieve Beyond Limits</span>
                </div>
              </div>
              <p className="font-body text-[13px] text-gray-500 leading-relaxed mb-6">
                Building bright minds through quality education, concept-based teaching, and personalized attention
              </p>
              {/* Social Icons */}
              <div className="flex gap-3">
                <a href="https://www.instagram.com/officialbe.educated/?igsh=MXJpOXV0eXliOHV6Mw%3D%3D#" className="w-9 h-9 rounded-lg flex items-center justify-center text-sm no-underline text-white bg-[#0a1e3d] hover:bg-[#1a56db] transition-all duration-300" aria-label="Instagram">
                  <FaInstagram/>
                </a>
                <a href="https://www.facebook.com/share/14FMyCY2J8D/" className="w-9 h-9 rounded-lg flex items-center justify-center text-sm no-underline text-white bg-[#0a1e3d] hover:bg-[#1a56db] transition-all duration-300" aria-label="Facebook">
                  <FaFacebook/>
                </a>
                <a href="https://www.linkedin.com/company/be-educated-official/" className="w-9 h-9 rounded-lg flex items-center justify-center text-sm no-underline text-white bg-[#0a1e3d] hover:bg-[#1a56db] transition-all duration-300" aria-label="Linkedin">
                  <FaLinkedin/>
                </a>
                <a href="https://youtube.com/@be-beeducated?si=1yE_tdN05ir1dmHq" className="w-9 h-9 rounded-lg flex items-center justify-center text-sm no-underline text-white bg-[#0a1e3d] hover:bg-[#1a56db] transition-all duration-300" aria-label="Youtube">
                  <FaYoutube/>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-heading text-[15px] font-bold text-[#0a1e3d] mb-5 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-3 list-none p-0">
                <li>
                  <Link to="/about" className="font-body text-[14px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/courses" className="font-body text-[14px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors duration-200">
                    Courses
                  </Link>
                </li>
                <li>
                  <Link to="/fee-structure" className="font-body text-[14px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors duration-200">
                    Fee Structure
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="font-body text-[14px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors duration-200">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="font-heading text-[15px] font-bold text-[#0a1e3d] mb-5 uppercase tracking-wider">Support</h4>
              <ul className="space-y-3 list-none p-0">
                <li>
                  <Link
                    to={isLoaded && isSignedIn ? "/dashboard" : "/sign-in"}
                    className="font-body text-[14px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors duration-200"
                  >
                    {isLoaded && isSignedIn ? 'Dashboard' : 'Sign In'}
                  </Link>
                </li>
                <li>
                  <Link to="/sign-up" className="font-body text-[14px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors duration-200">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link to="/faculty" className="font-body text-[14px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors duration-200">
                    Faculty
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="font-body text-[14px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors duration-200">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div>
              <h4 className="font-heading text-[15px] font-bold text-[#0a1e3d] mb-5 uppercase tracking-wider">Contact Us</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <HiOutlineLocationMarker className="text-[#052a7b] text-lg mt-0.5 flex-shrink-0" />
                  <p className="font-body text-[13px] text-gray-500 leading-relaxed">
                    Lalganj Ajhara,<br />
                    Pratapgarh, UP – 230132
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <HiOutlinePhone className="text-[#052a7b] text-lg flex-shrink-0" />
                  <a href="tel:+918382970800" className="font-body text-[13px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors">
                    +91 8382970800
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <HiOutlineMail className="text-[#052a7b] text-lg flex-shrink-0" />
                  <a href="mailto:Officialbe.educated@gmail.com" className="font-body text-[13px] text-gray-500 no-underline hover:text-[#1a56db] transition-colors break-all">
                    Officialbe.educated@gmail.com
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-5 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="font-body text-[12px] text-gray-400">
              &copy; 2025–{new Date().getFullYear()} Be Educated. All rights reserved.
            </p>
            <p className="font-body text-[12px] text-gray-400">
              IIT-JEE & NEET Foundation Institute
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
